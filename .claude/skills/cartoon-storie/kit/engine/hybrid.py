"""Hybrid render: 2D-engine drawings (characters, props, backdrops) inside a real 3D world with real camera moves.

Usage (from the kit folder):
    python -m engine.hybrid stories/<name>.json [--preview] [--out OUTDIR]

Steps: timing from the recorded voice -> timeline.json -> 2D sprites (skia) -> 3D frames (engine3d, three.js via
Playwright) -> music + SFX + voice mix -> karaoke captions composited -> MP4.
--preview renders 3 frames per beat and a contact sheet (fast look check, no audio)."""
import argparse, hashlib, json, math, re, subprocess, sys, time, zipfile
from pathlib import Path

import numpy as np
import skia

from . import audio as A
from . import characters as C
from . import draw as D
from . import places as PL
from . import props as PR
from . import render as R

KIT = Path(__file__).resolve().parent.parent
SKILL = KIT.parent
ENGINE3D = SKILL / "engine3d"
FPS, W, H = 30, 1080, 1920
SPR_W, SPR_H, FEET, PPM, CHAR_SCALE, STEP = 768, 1152, 1140, 480, 2.25, 2
PROP_K = CHAR_SCALE / 2.1  # 2D props are sized for characters at scale 2.1

CAMS = {
    "wide":        {"az": [-10, 10], "el": [10, 12], "dist": [7.0, 6.5], "fov": [46, 46]},
    "establish":   {"az": [-10, 6], "el": [22, 9], "dist": [7.5, 6.2], "fov": [46, 46]},
    "crane_down":  {"az": [0, 6], "el": [36, 12], "dist": [8.0, 6.4], "fov": [46, 46]},
    "crane_up":    {"az": [-6, 4], "el": [4, 30], "dist": [5.0, 6.2], "fov": [46, 46]},
    "orbit":       {"az": [-40, 40], "el": [12, 15], "dist": [4.8, 4.4], "fov": [46, 46]},
    "orbit_left":  {"az": [40, -40], "el": [12, 15], "dist": [4.8, 4.4], "fov": [46, 46]},
    "dolly_in":    {"az": [6, 4], "el": [9, 6], "dist": [6.8, 3.6], "fov": [46, 44]},
    "dolly_out":   {"az": [4, 6], "el": [6, 12], "dist": [3.4, 6.8], "fov": [44, 46]},
    "push_face":   {"az": [12, 5], "el": [5, 3], "dist": [3.6, 2.5], "fov": [42, 40], "need_on": True},
    "closeup":     {"az": [18, 10], "el": [4, 4], "dist": [2.7, 2.4], "fov": [40, 40], "need_on": True},
    "punch":       {"az": [6, 6], "el": [4, 4], "dist": [4.2, 2.5], "fov": [44, 40], "need_on": True, "shake": True},
    "low_angle":   {"az": [-14, 6], "el": [-10, -4], "dist": [3.6, 3.1], "fov": [44, 44], "need_on": True},
    "truck_left":  {"az": [0, 0], "el": [8, 8], "dist": [5.2, 5.2], "fov": [46, 46], "dx": [1.4, -1.4]},
    "truck_right": {"az": [0, 0], "el": [8, 8], "dist": [5.2, 5.2], "fov": [46, 46], "dx": [-1.4, 1.4]},
    "still":       {"az": [-3, 3], "el": [8, 8], "dist": [5.4, 5.0], "fov": [46, 46]},
    # on objects (use "on": "<object id>")
    "push_on":     {"az": [8, 3], "el": [14, 10], "dist": [3.4, 1.8], "fov": [44, 40], "need_on": True},
    "insert":      {"az": [10, 4], "el": [18, 14], "dist": [1.7, 1.35], "fov": [40, 40], "need_on": True},
    "reveal":      {"az": [4, 8], "el": [10, 14], "dist": [1.4, 5.0], "fov": [40, 46], "need_on": True},
}
CALM = ["dolly_in", "truck_right", "over_shoulder", "crane_up", "dolly_out", "truck_left"]


def log(m):
    print(m, flush=True)


def word_frame(beat, word, f0):
    """Frame where a word starts, 1 frame early (actions land 0-3 frames before the word)."""
    if not word:
        return f0
    w = word.lower()
    for raw, st, _ in beat["_words"]:
        if re.sub(r"[^\w]", "", raw).lower().startswith(re.sub(r"[^\w]", "", w)):
            return max(f0, int(round(st * FPS)) - 1)
    raise SystemExit(f'word "{word}" not found in: {beat["say"]}')


def resolve_cam(seg, i, cast, objs):
    if isinstance(seg, str):
        seg = {"preset": seg}
    name = seg.get("preset", "wide")
    if name == "over_shoulder":
        on = next((a for a in cast if a["id"] == seg.get("on")), cast[0] if cast else None)
        to = next((a for a in cast if a["id"] == seg.get("to")), next((a for a in cast if a is not on), None)) if cast else None
        if on and to:
            dx, dz = on["x"] - to["x"], on.get("z", 0) - to.get("z", 0)
            az = math.degrees(math.atan2(dx, dz))
            d = math.hypot(dx, dz) + 1.4
            out = {"az": [az + 28, az + 20], "el": [9, 7], "dist": [d + 0.8, d + 0.4], "fov": [42, 42], "on": to["id"]}
            out.update({k: v for k, v in seg.items() if k not in ("preset", "on", "to", "at")})
            return out
        name = "dolly_in"
    out = dict(CAMS.get(name, CAMS["wide"]))
    if out.pop("need_on", False) and "on" not in seg:
        seg = dict(seg, on=cast[i % len(cast)]["id"]) if cast else seg
        if not cast:
            out = dict(CAMS["dolly_in"])
    out.update({k: v for k, v in seg.items() if k not in ("preset", "at")})
    if out.get("on") in objs:  # framing an object instead of a character: look at its front
        o = objs[out["on"]]
        out["focus"] = o["focus"]
        out["az"] = [a + o.get("ry", 0) for a in out["az"]]
    return out


def _surface(w, h):
    s = skia.Surface(w, h)
    s.getCanvas().clear(skia.ColorTRANSPARENT)
    return s


def _alpha_box(surf):
    a = surf.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType)[:, :, 3]
    ys, xs = np.nonzero(a > 8)
    return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1) if len(xs) else None


OX, OY = 1300, 2000  # where a 2D prop's base point is drawn on its work canvas


def _draw_prop(it, opts, t):
    s = _surface(2600, 2600)
    c = s.getCanvas()
    k = PROP_K * it.get("scale", 1.0)
    c.translate(OX, OY)
    c.scale(k, k)
    PR.PROPS[it["type"]](c, 0, 0, t, **opts)
    return s


def draw_decor(it, out_dir, frames):
    """Draws a 2D prop for each state (and each frame on twos if animated), all cropped to one shared box."""
    base = {k: v for k, v in it.items() if k not in ("type", "at", "wall", "scale", "ry", "depth", "id", "states", "state", "animate", "hidden")}
    states = it.get("states") or {"_": {}}
    key = hashlib.md5(json.dumps([it["type"], base, states, it.get("scale", 1), it.get("animate")], sort_keys=True).encode()).hexdigest()[:12]
    box = None
    for st in states.values():
        for t in (0.0, 0.37, 0.71, 1.13):
            b = _alpha_box(_draw_prop(it, {**base, **st}, t))
            if b:
                box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    if not box:
        raise SystemExit(f"2D prop '{it['type']}' drew nothing")
    pad = 6
    box = (max(0, box[0] - pad), max(0, box[1] - pad), min(2600, box[2] + pad), min(2600, box[3] + pad))
    rect = skia.IRect.MakeLTRB(*box)
    todo = [(sn, f) for sn in states for f in (frames if it.get("animate") else [None])]
    for sn, f in todo:
        name = f"{key}_{sn}" + (f"_{f}" if f is not None else "")
        p = out_dir / f"{name}.png"
        if not p.exists():
            _draw_prop(it, {**base, **states[sn]}, (f or 0) / FPS).makeImageSnapshot().makeSubset(rect).save(str(p), skia.kPNG)
    x0, y0, x1, y1 = box
    return {"key": key, "size_m": [(x1 - x0) / PPM, (y1 - y0) / PPM], "dx_m": ((x0 + x1) / 2 - OX) / PPM, "below_m": (y1 - OY) / PPM,
            "states": list(states), "animate": bool(it.get("animate"))}


def draw_backdrop(preset, out_dir):
    s = _surface(1080, 1920)
    spec = dict(PL.PRESETS.get(preset, {}))
    spec.pop("type", None)
    PL.outdoor(s.getCanvas(), 0.0, **spec)
    key = f"backdrop_{preset}"
    s.makeImageSnapshot().save(str(out_dir / f"{key}.png"), skia.kPNG)
    return key


def head_height(spec):
    s = _surface(SPR_W, SPR_H)
    C.draw_character(s.getCanvas(), spec, SPR_W / 2, FEET, CHAR_SCALE, 1, "idle", "neutral", 0.0)
    a = s.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType)[:, :, 3]
    top = int(np.nonzero(a.max(axis=1) > 8)[0].min())
    return (FEET - (top + 78 * CHAR_SCALE)) / PPM


OBJ3D = SKILL / "library" / "oggetti3d"


def resolve_model(m):
    """A model is a Kenney .glb, a library object built from shapes (library/oggetti3d/<name>.json), or inline "parts"."""
    if m.get("parts") or not m.get("m"):
        return m
    j = OBJ3D / f"{m['m']}.json"
    if j.exists():
        return dict(m, parts=json.loads(j.read_text())["parts"])
    return m


def extract_models(work):
    mdir = work / "models"
    if (mdir / ".done").exists():
        return
    (mdir / "Textures").mkdir(parents=True, exist_ok=True)
    for z in sorted((SKILL / "library" / "modelli3d").glob("*.zip")):
        with zipfile.ZipFile(z) as zf:
            for n in zf.namelist():
                if n.endswith(".glb"):
                    (mdir / Path(n).name).write_bytes(zf.read(n))
                elif n.endswith(".png") and "Textures" in n:
                    (mdir / "Textures" / Path(n).name).write_bytes(zf.read(n))
    (mdir / ".done").write_text("ok")


def build_timeline(story_path, work, preview):
    story, beats, shots, clips, sfx_events, chunks, total = R.plan(story_path)
    n = int(total * FPS)
    (work / "spr").mkdir(parents=True, exist_ok=True)
    (work / "decor").mkdir(exist_ok=True)
    extract_models(work)
    # beat frame ranges
    spans = []
    for i, b in enumerate(beats):
        f0 = 0 if i == 0 else int(round(b["_from"] * FPS))
        f1 = n if i + 1 == len(beats) else int(round(beats[i + 1]["_from"] * FPS))
        spans.append((f0, f1))
    # object registry (ids on models and decor) with focus points for the camera
    objs = {}
    for pn, P in story["places"].items():
        for it in P.get("models", []):
            if it.get("id"):
                h = it.get("size", it.get("w", 0.6 if not resolve_model(it).get("parts") else 1.5))
                objs[it["id"]] = {"place": pn, "ry": it.get("ry", 0), "focus": [it["at"][0], it["at"][1] + h * 0.5, it["at"][2]]}
        for it in P.get("decor", []):
            if it.get("id"):
                a = it.get("at", [0, 0, 0])
                objs[it["id"]] = {"place": pn, "ry": it.get("ry", 0), "focus": [a[0], a[1], -P.get("d", 7) / 2] if it.get("wall") == "back" else [a[0], a[1] + 0.5, a[2]]}
    # events: object state / show / hide / pop / move, timed on words
    events = {}
    for i, b in enumerate(beats):
        for e in b.get("do", []):
            if e.get("id") not in objs:
                raise SystemExit(f'beat {i + 1}: "do" targets unknown object id "{e.get("id")}" (give the object an "id")')
            f = word_frame(b, e.get("at"), spans[i][0]) + int(e.get("delay", 0) * FPS)
            events.setdefault(e["id"], []).append([f, {k: v for k, v in e.items() if k not in ("id", "at", "delay")}])
    # 2D props
    frames_in = {}
    for (f0, f1), b in zip(spans, beats):
        frames_in.setdefault(b["place"], []).extend(range(f0 - f0 % STEP, f1, STEP))
    places = {}
    for name, P in story["places"].items():
        P = dict(P)
        P["decor"] = []
        for it in story["places"][name].get("decor", []):
            d = draw_decor(it, work / "decor", frames_in.get(name, []))
            d.update({"at": it.get("at", [0, 0, 0]), "wall": it.get("wall"), "ry": it.get("ry", 0), "depth": it.get("depth", 0),
                      "id": it.get("id"), "state": it.get("state", d["states"][0]), "hidden": it.get("hidden", False),
                      "ev": sorted(events.get(it.get("id"), []), key=lambda x: x[0])})
            P["decor"].append(d)
        P["models"] = [dict(resolve_model(m), ev=sorted(events.get(m.get("id"), []), key=lambda x: x[0])) for m in P.get("models", [])]
        if P.get("backdrop"):
            P["backdrop"] = {"key": draw_backdrop(P["backdrop"], work / "decor")}
        places[name] = P
    specs = story["cast"]
    hy = head_height(next(iter(specs.values()))) if specs else 1.0
    # beats: cast, camera segments (motivated), character changes on words
    tl_beats, prev_place, calm = [], None, 0
    for i, b in enumerate(beats):
        f0, f1 = spans[i]
        cast = []
        for a in b.get("cast", []):
            e = {"id": a["id"], "x": a.get("x", 0.0), "z": a.get("z", 0.0), "s": a.get("s", 1.0)}
            if a.get("enter"):
                e["from"] = word_frame(b, a["enter"], f0)
            if a.get("move"):
                mv = a["move"]
                e["mv"] = [word_frame(b, mv.get("at"), f0), mv["to"][0], mv["to"][1], int(mv.get("dur", 0.8) * FPS)]
            cast.append(e)
        cam = b.get("camera")
        if cam is None:  # automatic, but motivated: new place -> establish; action -> push on it; quoted line -> speaker
            acts = [e for e in b.get("do", []) if e.get("id")]
            if b["place"] != prev_place:
                cam = [{"preset": "establish"}] + ([{"preset": "push_on", "on": acts[0]["id"], "at": acts[0]["at"]}] if acts else [])
            elif acts:
                cam = [{"preset": "wide"}, {"preset": "push_on", "on": acts[0]["id"], "at": acts[0]["at"]}]
            elif "«" in b["say"] and cast:
                cam = {"preset": "closeup", "on": b.get("speaker", cast[0]["id"])}
            else:
                cam = CALM[calm % len(CALM)]
                calm += 1
        segs = cam if isinstance(cam, list) else [cam]
        out = []
        for k, sg in enumerate(segs):
            sg = {"preset": sg} if isinstance(sg, str) else sg
            s0 = f0 if k == 0 else word_frame(b, sg.get("at"), f0)
            out.append(dict(resolve_cam(sg, i, cast, objs), f0=s0, blend=sg.get("blend", 14 if k else 0)))
        for k in range(len(out)):
            out[k]["f1"] = out[k + 1]["f0"] if k + 1 < len(out) else f1
        prev_place = b["place"]
        evf = [min(f1 - 1, word_frame(b, e.get("at"), f0) + 8) for e in b.get("do", [])]
        tl_beats.append({"i": i, "f0": f0, "f1": f1, "place": b["place"], "light": b.get("light"), "cams": out, "cast": cast, "evf": evf, "_src": b})
    tl = {"width": W, "height": H, "fps": FPS, "frames": n, "ink": D.INK_HEX, "ppm": PPM, "sprite_w": SPR_W, "sprite_h": SPR_H,
          "feet_from_bottom": SPR_H - FEET, "sprite_step": STEP, "head_y": hy, "places": places,
          "beats": [{k: v for k, v in tb.items() if k != "_src"} for tb in tl_beats]}
    (work / "timeline.json").write_text(json.dumps(tl, ensure_ascii=False))
    # character drawings on twos; "change" switches pose/face on a word
    t0, count = time.time(), 0
    for tb in tl_beats:
        src = tb["_src"]
        frames = sample_frames(tb) if preview else range(tb["f0"], tb["f1"], STEP)
        for a in src.get("cast", []):
            ch = sorted([(word_frame(src, c.get("at"), tb["f0"]), c) for c in a.get("change", [])], key=lambda x: x[0])
            for f in frames:
                f = f - ((f - tb["f0"]) % STEP)
                p = work / "spr" / f"{a['id']}_{tb['i']}_{f}.png"
                if p.exists():
                    continue
                st = dict(a)
                for cf, c in ch:
                    if cf <= f:
                        st.update({k: v for k, v in c.items() if k != "at"})
                s = _surface(SPR_W, SPR_H)
                C.draw_character(s.getCanvas(), specs[a["id"]], SPR_W / 2, FEET, CHAR_SCALE, st.get("facing", 1), st.get("pose", "idle"),
                                 st.get("face", "neutral"), f / FPS, seed=sum(map(ord, a["id"])) % 7, anim=st.get("anim"), hold=st.get("hold"))
                s.makeImageSnapshot().save(str(p), skia.kPNG)
                count += 1
    log(f"   {count} character drawings in {time.time() - t0:.0f} s")
    return story, beats, tl, tl_beats, clips, sfx_events, chunks, total


def sample_frames(tb):
    a, b = tb["f0"], tb["f1"] - 1
    pts = {a + 2, max(a, b - 2)}
    for c in tb["cams"][1:]:
        pts.add(min(b, c["f0"] + 16))
    pts.update(tb.get("evf", []))
    if len(pts) < 3:
        pts.add((a + b) // 2)
    return sorted(pts)


def run_3d(work, frames_dir, frames=None):
    if not (ENGINE3D / "node_modules" / "playwright").exists():
        raise SystemExit(f"3D engine not installed. Run once:  cd \"{ENGINE3D}\" && npm install && npx playwright install chromium")
    if frames is None:
        cmd = ["node", "render.mjs", str(work), str(frames_dir)]
        r = subprocess.run(cmd, cwd=ENGINE3D, env={**__import__("os").environ, "RESUME": "1"})
        if r.returncode:
            raise SystemExit("3D render failed (see the [page] errors above).")
    else:
        for f in frames:
            r = subprocess.run(["node", "render.mjs", str(work), str(frames_dir), f"{f}-{f}"], cwd=ENGINE3D, capture_output=True, text=True)
            if r.returncode or "pageerror" in r.stderr:
                raise SystemExit(r.stderr[-2000:])


def karaoke_at(chunks, t):
    lead, cur = 0.03, None
    for blk in chunks:
        if blk[0][1] - lead <= t:
            cur = blk
        else:
            break
    if cur is None or t >= cur[-1][2] + 0.6:
        return None
    return [w[0] for w in cur], max(i for i, w in enumerate(cur) if w[1] - lead <= t), t - cur[0][1]


def compose(c, img, chunks, t, captions=True):
    c.drawImage(img, 0, 0)
    D.vignette(c, 0.35)
    k = karaoke_at(chunks, t) if captions else None
    if k:
        D.draw_karaoke(c, *k)


def build(story_path, out=None, preview=False):
    story_path = Path(story_path).resolve()
    name = story_path.stem
    work = Path(out).resolve() if out else Path.cwd() / "out" / name
    work.mkdir(parents=True, exist_ok=True)
    log(f"[1/5] Timing and 2D drawings -> {work}")
    story, beats, tl, tl_beats, clips, sfx_events, chunks, total = build_timeline(story_path, work, preview)
    fdir = work / "frames"
    if preview:
        frames = [f for tb in tl_beats for f in sample_frames(tb)]
        log(f"[2/5] 3D preview frames: {len(frames)}")
        pdir = work / "preview"
        pdir.mkdir(exist_ok=True)
        for old in pdir.glob("*.png"):
            old.unlink()
        run_3d_list(work, fdir, frames)
        surf = skia.Surface(W, H)
        paths = []
        for f in frames:
            img = skia.Image.open(str(fdir / f"f{f:05d}.jpg"))
            compose(surf.getCanvas(), img, chunks, f / FPS)
            p = pdir / f"f{f:05d}.png"
            surf.makeImageSnapshot().save(str(p), skia.kPNG)
            paths.append(p)
        R.save_contact(paths, work / "contact.png")
        log(f"Preview: {work / 'contact.png'}  ({len(tl_beats)} beats, {total:.1f} s)")
        return
    log(f"[2/5] 3D frames: {tl['frames']}")
    run_3d(work, fdir)
    log("[3/5] Music, sound effects and voice")
    m = story.get("music", {})
    track = A.music(total, m.get("mood", "mystery"), m.get("bpm", 100))
    mixed = A.mix(total, clips, sfx_events, track, m.get("gain", 0.08), {})
    wav = work / f"{name}.wav"
    A.write_wav(wav, mixed)
    log("[4/5] Karaoke captions and encode")
    import imageio_ffmpeg
    mp4 = work / f"{name}.mp4"
    proc = subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba",
                             "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", str(wav), "-c:v", "libx264", "-preset", "medium",
                             "-crf", "18", "-pix_fmt", "yuv420p", "-af", f"loudnorm=I={m.get('loudness', -14)}:TP=-1:LRA=11",
                             "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(mp4)], stdin=subprocess.PIPE)
    surf = skia.Surface(W, H)
    for f in range(tl["frames"]):
        img = skia.Image.open(str(fdir / f"f{f:05d}.jpg"))
        b = beats[next(i for i, tb in enumerate(tl_beats) if tb["f0"] <= f < tb["f1"] or i == len(tl_beats) - 1)]
        compose(surf.getCanvas(), img, chunks, f / FPS, b.get("caption", True) is not False)
        proc.stdin.write(surf.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType).tobytes())
    proc.stdin.close()
    proc.wait()
    log(f"[5/5] Done: {mp4}  ({total:.1f} s, {len(tl_beats)} beats)")
    return mp4


def run_3d_list(work, fdir, frames):
    if not (ENGINE3D / "node_modules" / "playwright").exists():
        raise SystemExit(f"3D engine not installed. Run once:  cd \"{ENGINE3D}\" && npm install && npx playwright install chromium")
    (work / "frames.txt").write_text(",".join(map(str, frames)))
    r = subprocess.run(["node", "render.mjs", str(work), str(fdir), "list"], cwd=ENGINE3D)
    if r.returncode:
        raise SystemExit("3D render failed.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("story")
    ap.add_argument("--out")
    ap.add_argument("--preview", action="store_true")
    a = ap.parse_args()
    build(a.story, a.out, a.preview)


if __name__ == "__main__":
    sys.exit(main())
