"""Film pipeline (reference engine + realistic look).

    python -m engine.film stories/<name>.json [--preview] [--out DIR]

recorded voice -> word times -> timeline.json (places, objects, events on words, characters, camera keys)
-> engine3d (three.js via Playwright) frames -> music + SFX + voice -> karaoke captions -> MP4.
--preview renders the key frames (shot starts, every action) and a contact sheet."""
import argparse, json, math, os, re, subprocess, sys, zipfile
from pathlib import Path

import skia

from . import audio as A
from . import render as R
from .hybrid import karaoke_at, compose

KIT_ENGINE = Path(__file__).resolve().parent.parent
SKILL = KIT_ENGINE.parent
ENGINE3D = SKILL / "engine3d"
FPS, W, H = 30, 1080, 1920
CARDS = (ENGINE3D / "web" / "cards.js").read_text()
POSES = re.findall(r"^\s{2}(\w+): \[\[", CARDS.split("export const POSES")[1].split("export const FACES")[0], re.M)
FACES = re.findall(r"^\s{2}(\w+): \{ brow", CARDS, re.M)
BUILTIN = re.findall(r"^\s{2}(\w+): \{ h:", CARDS, re.M)

# reference-style camera moves: small and slow (distance changes 10-40 %, a few degrees), cuts between shots
CAMP = {
    "establish": dict(d=[7.0, 6.2], h=[1.3, 1.0], az=[-8, -4], fov=50),
    "wide":      dict(d=[5.6, 5.0], h=[0.6, 0.55], az=[6, 3], fov=50),
    "two_shot":  dict(d=[3.4, 3.0], h=[0.25, 0.2], az=[8, 5], fov=46),
    "drift":     dict(d=[4.2, 4.0], h=[0.4, 0.4], az=[-9, 9], fov=48),
    "rise":      dict(d=[4.0, 3.8], h=[0.1, 1.0], az=[4, 4], fov=48),
    "closeup":   dict(d=[2.5, 2.25], h=[0.05, 0.03], az=[10, 7], fov=40, on=True),
    "ecu":       dict(d=[1.6, 1.45], h=[0.0, 0.0], az=[6, 4], fov=38, on=True),
    "push":      dict(d=[3.4, 2.4], h=[0.2, 0.05], az=[8, 6], fov=44, on=True),
    "pull":      dict(d=[1.8, 3.8], h=[0.05, 0.3], az=[6, 8], fov=44, on=True),
    "insert":    dict(d=[1.25, 1.05], h=[0.45, 0.4], az=[6, 3], fov=42, on=True),
    "top":       dict(d=[0.55, 0.45], h=[1.35, 1.2], az=[0, 4], fov=46, on=True),
    "low":       dict(d=[2.6, 2.3], h=[-0.75, -0.7], az=[-10, -6], fov=46, on=True),
    "punch":     dict(d=[3.0, 2.0], h=[0.05, 0.0], az=[4, 4], fov=42, on=True, shake=True),
}
CALM = ["due_figure_frontale", "tre_quarti", "mezza_figura", "due_figure_soglia", "primo_piano"]
# camera style copied from the reference video: 18 shots turned into subject-relative templates
REFCAM = json.loads((SKILL / "library" / "camere_riferimento.json").read_text())
ALIAS = {"establish": "ambiente", "wide": "ambiente", "two_shot": "due_figure_frontale", "drift": "due_figure_soglia", "rise": "gru_rivela",
         "closeup": "primo_piano", "ecu": "ecu", "push": "mezza_figura", "pull": "rivela_dal_viso", "insert": "dettaglio_oggetto",
         "top": "dall_alto_oggetto", "low": "dal_basso_rivela", "punch": "ecu", "over_shoulder": "tre_quarti"}


def log(m):
    print(m, flush=True)


def kit_dir():
    for c in (os.environ.get("CARTOON_KIT"), SKILL / "asset-kit", SKILL.parent / "asset-kit", Path.home() / "cartoon-kit"):
        if c and (Path(c) / "indice.json").exists():
            return Path(c)
    raise SystemExit("Asset kit not found. Run setup (downloads the kit from GitHub) or set CARTOON_KIT=/path/to/asset-kit")


def word_frame(beat, word, f0):
    if not word:
        return f0
    w = re.sub(r"[^\w]", "", word.lower())
    for raw, st, _ in beat["_words"]:
        if re.sub(r"[^\w]", "", raw.lower()).startswith(w):
            return max(f0, int(round(st * FPS)) - 1)  # actions land 1 frame before the word
    raise SystemExit(f'word "{word}" not in: {beat["say"]}')


def lip_sync(b):
    """Mouth moves only while the speaker's words are heard: one open-close per syllable, from the voice's word times.
    If the line mixes narration and a quote in «», only the quoted words are the character's."""
    words = b["_words"]; quoted = "«" in b["say"]; inside = False; out = []
    for raw, st, en in words:
        if "«" in raw: inside = True
        if not quoted or inside:
            syl = max(1, len(re.findall(r"[aeiouàèéìíòóù]+", raw.lower())))
            out.append([int(round(st * FPS)), max(int(round(st * FPS)) + 2, int(round(en * FPS))), syl])
        if "»" in raw: inside = False
    return out


def resolve_model(m, kit, idx, work):
    if m.get("parts") or not m.get("m"):
        return m
    name = m["m"]
    if name in idx["modelli"]:
        return dict(m, url=f"/kit/{idx['modelli'][name]['file']}")
    j = SKILL / "library" / "oggetti3d" / f"{name}.json"
    if j.exists():
        jo = json.loads(j.read_text())
        return dict(m, parts=jo["parts"], **({"cerniere": jo["cerniere"]} if "cerniere" in jo else {}))
    mdir = work / "models"
    if not (mdir / ".done").exists():
        (mdir / "Textures").mkdir(parents=True, exist_ok=True)
        for z in (SKILL / "library" / "modelli3d").glob("*.zip"):
            with zipfile.ZipFile(z) as zf:
                for n in zf.namelist():
                    if n.endswith(".glb"):
                        (mdir / Path(n).name).write_bytes(zf.read(n))
                    elif n.endswith(".png") and "Textures" in n:
                        (mdir / "Textures" / Path(n).name).write_bytes(zf.read(n))
        (mdir / ".done").write_text("ok")
    if (mdir / f"{name}.glb").exists():
        return dict(m, url=f"/work/models/{name}.glb")
    raise SystemExit(f'model "{name}" not found in kit, Kenney library or library/oggetti3d: search it or create it (references/creare-oggetti.md)')


def head_y(spec, s=1.0):
    return (spec.get("h", 1.6) - 0.28) * s


def _ss(u):
    u = min(1.0, max(0.0, u)); return u * u * u * (u * (u * 6 - 15) + 10)   # same smootherstep as engine.js


def actor_at(c, f):
    """Where a character stands at frame f (its 'move' eased exactly as scene.js draws it)."""
    if not c.get("mv"):
        return c["x"], c["z"], 0.0
    m = c["mv"]; u = _ss((f - m[0]) / max(1, m[3]))
    return c["x"] + (m[1] - c["x"]) * u, c["z"] + (m[2] - c["z"]) * u, u


def follow_keys(seg, c, specs, room, f0, f1):
    """'accompagna': tracking shot at eye height beside a walking character, from where it starts to where it stops.
    The camera stays on the open side of the path at a constant distance (about 2.9 m: mezza figura / figura intera),
    leaves a little room ahead of the character while it moves and settles when it stops. One key every 3 frames,
    read linearly by scene.js, so the camera moves exactly with the character (no stop-and-go)."""
    hy = head_y(specs[c["id"]], c["s"]) + c.get("y", 0)
    dx, dz = (c["mv"][1] - c["x"], c["mv"][2] - c["z"]) if c.get("mv") else (1.0, 0.0)
    L = math.hypot(dx, dz) or 1.0; d = (dx / L, dz / L)
    n = (-d[1], d[0])
    if n[1] < 0: n = (d[1], -d[0])                           # side towards +z (the open side of rooms)
    if n[1] < 0.5:                                           # walking towards / away from the camera: 3/4 view instead
        n = (0.6 if n[0] >= 0 else -0.6, 0.8)
    if seg.get("lato") == -1: n = (-n[0], n[1])
    dist = seg.get("dist", 2.9); fov = seg.get("fov", 44); keys = []
    frames = list(range(f0, f1, 3)) + [f1]
    for k, f in enumerate(frames):
        x, z, u = actor_at(c, f)
        prog = k / max(1, len(frames) - 1)
        dd = dist * (1.04 - 0.08 * prog)                       # the reference's slow push, spread over the shot
        lead = 0.45 * math.sin(math.pi * u) if c.get("mv") else 0.0   # room ahead only while walking
        pos = [x + n[0] * dd - d[0] * 0.3, max(0.6, hy - 0.08), z + n[1] * dd - d[1] * 0.3]
        if room:
            pos[1] = min(pos[1], room[0] - 0.3)
            pos[0] = max(-room[1] / 2 + 0.3, min(room[1] / 2 - 0.3, pos[0]))
        keys.append([f, pos, [x + d[0] * lead, hy - 0.22, z + d[1] * lead], fov, {"lin": 1}])
    return keys


CONT = ("passaggio", "piano_sequenza")


def stops_of(seg, objs):
    """The subjects a continuous shot visits, in order. 'passaggio' is the two-stop case (A, then B on its word)."""
    if seg.get("preset") == "passaggio":
        st = [{"on": seg.get("on")}, {"on": seg.get("verso"), "at": seg.get("parola", seg.get("verso"))}]
        if seg.get("da_preset"): st[0]["preset"] = seg["da_preset"]
        if seg.get("verso_preset"): st[1]["preset"] = seg["verso_preset"]
    else:
        st = [dict(t) for t in seg.get("tappe", [])]
    for t in st:   # framing of each stop: reference templates (detail for objects, mezza figura for people)
        t.setdefault("preset", "dettaglio_oggetto" if t.get("on") in objs else "mezza_figura")
    return st


def continuous_keys(seg, b, i, cast, objs, specs, room, s0, s1):
    """One shot, no cut: the camera holds each stop with its reference framing and glides to the next one so that it
    ARRIVES on the stop's word (the named object is in frame when it is said). Glides last 0.8-2.5 s depending on the
    distance (soft, never a whip); every stop lasts at least 1 s (stops too close are merged, named objects win)."""
    T = stops_of(seg, objs)
    if not T:
        raise SystemExit(f"beat {i + 1}: '{seg.get('preset')}' without stops ('tappe', or 'on' + 'verso')")
    arr = [s0] + [word_frame(b, t.get("at"), s0) + 4 for t in T[1:]]
    order = sorted(range(len(T)), key=lambda k: (arr[k], k)); T = [T[k] for k in order]; arr = [arr[k] for k in order]; arr[0] = s0
    k = 1
    while k < len(T):                        # merge stops closer than 1 s (keep the one showing a named object)
        nxt = arr[k + 1] if k + 1 < len(T) else s1
        if arr[k] - arr[k - 1] < FPS or (k == len(T) - 1 and nxt - arr[k] < FPS // 2):
            drop = k - 1 if (T[k].get("on") in objs and T[k - 1].get("on") not in objs) else k
            T.pop(drop); arr.pop(drop); arr[0] = s0; k = 1
            continue
        k += 1
    def tkeys(t, a0, a1):
        sub = dict(t); sub.pop("at", None)
        if sub.get("preset") == "accompagna":
            c = next((c for c in cast if c["id"] == sub.get("on")), None)
            if c: return follow_keys(sub, c, specs, room, a0, a1)
            sub["preset"] = "mezza_figura"
        return cam_keys(sub, i, cast, objs, specs, room[0] if room else None, a0, a1)
    # first pass with provisional timing, to measure how far each glide travels
    ends = [arr[k + 1] if k + 1 < len(T) else s1 for k in range(len(T))]
    prov = [tkeys(t, arr[k], ends[k]) for k, t in enumerate(T)]
    glide = [0]
    for k in range(1, len(T)):
        dist = math.dist(prov[k - 1][-1][1], prov[k][0][1]) + 0.5 * math.dist(prov[k - 1][-1][2], prov[k][0][2])
        g = int(round(min(2.5, max(0.8, 0.6 + 0.35 * dist)) * FPS))
        glide.append(min(g, max(12, arr[k] - arr[k - 1] - 12)))    # at least 0.4 s of hold on the previous stop
    keys, stops = [], []
    for k, t in enumerate(T):
        h0 = arr[k]; h1 = (arr[k + 1] - glide[k + 1]) if k + 1 < len(T) else s1
        kk = tkeys(t, h0, max(h0 + 1, h1))
        stops.append({"on": t.get("on"), "preset": t["preset"], "k0": len(keys), "k1": len(keys) + len(kk), "f0": h0 - glide[k], "arr": h0, "f1": h1,
                      "target": objs[t["on"]]["focus"] if t.get("on") in objs else None, "tsize": objs[t["on"]]["size"] if t.get("on") in objs else None,
                      "follow": t["preset"] == "accompagna"})
        keys += kk
    return keys, stops


def cam_keys(seg, i, cast, objs, specs, room, f0, f1):
    """Camera keys from the reference templates (library/camere_riferimento.json), anchored on the subject."""
    if "keys" in seg:  # explicit keys: [frac or frame offset, pos, look, fov]
        return [[f0 + int(k[0] * (f1 - f0)) if k[0] <= 1 else f0 + int(k[0]), k[1], k[2], k[3]] for k in seg["keys"]]
    name = ALIAS.get(seg.get("preset"), seg.get("preset"))
    T = REFCAM.get(name) or REFCAM["due_figure_frontale"]
    on = seg.get("on")
    def head(c): return head_y(specs[c["id"]], c["s"]) + c.get("y", 0)
    if T["ancora"] == "object" and on in objs:
        f = objs[on]["focus"]; A = [f[0], f[1], f[2]]
    elif T["ancora"] == "actor" and cast:
        c = next((c for c in cast if c["id"] == on), None) or cast[i % len(cast)]
        A = [c["x"], head(c), c["z"]]
        if c.get("mv") and c["mv"][0] < f1:  # subject moving during the shot: the camera follows it
            mvc = c
    elif cast:
        grp = [c for c in cast if c["id"] == on] or cast
        A = [sum(c["x"] for c in grp) / len(grp), sum(head(c) for c in grp) / len(grp), sum(c["z"] for c in grp) / len(grp)]
    elif on in objs:
        A = objs[on]["focus"]
    else:
        A = [0, 1.2, -1.0]
    rot = 0.0
    if T.get("direzione_fila_rif") is not None and len(cast) > 1:  # align the dolly with this story's line of people
        a0 = next((c for c in cast if c["id"] == on), cast[0]); a1 = max(cast, key=lambda c: math.hypot(c["x"] - a0["x"], c["z"] - a0["z"]))
        rot = math.atan2(a1["x"] - a0["x"], a1["z"] - a0["z"]) - T["direzione_fila_rif"]
    cr, sr = math.cos(rot), math.sin(rot)
    R = lambda v: [v[0] * cr + v[2] * sr, v[1], -v[0] * sr + v[2] * cr]
    mvc = locals().get("mvc")
    keys = []
    for fr, p, l, fov in T["keys"]:
        p, l = R(p), R(l)
        fk = f0 + int(fr * (f1 - f0))
        if mvc:  # follow the moving subject along its path
            u = min(1, max(0, (fk - mvc["mv"][0]) / max(1, mvc["mv"][3]))); u = u * u * (3 - 2 * u)
            A = [mvc["x"] + (mvc["mv"][1] - mvc["x"]) * u, A[1], mvc["z"] + (mvc["mv"][2] - mvc["z"]) * u]
        pos = [A[0] + p[0], max(0.25, A[1] + p[1]), A[2] + p[2]]
        if room:
            pos[1] = min(pos[1], room - 0.3)
        keys.append([fk, pos, [A[0] + l[0], A[1] + l[1], A[2] + l[2]], seg.get("fov", fov)])
    if mvc and len(keys) == 2:  # add the path's midpoint so the follow is smooth
        pass
    return keys


def build_timeline(story_path, work, preview):
    story, beats, shots, clips, sfx_events, chunks, total = R.plan(story_path)
    n = int(total * FPS)
    kit = kit_dir()
    idx = json.loads((kit / "indice.json").read_text())
    specs = {}
    for cid, sp in story["cast"].items():
        specs[cid] = dict(sp)
    spans = []
    for i, b in enumerate(beats):
        f0 = 0 if i == 0 else int(round(b["_from"] * FPS))
        f1 = n if i + 1 == len(beats) else int(round(beats[i + 1]["_from"] * FPS))
        spans.append((f0, f1))
    places, objs = {}, {}
    for pn, P in story["places"].items():
        P = dict(P)
        P["models"] = [resolve_model(m, kit, idx, work) for m in P.get("models", [])]
        for group in ("models", "fires", "boards", "lamps", "steam", "facades"):
            for it in P.get(group, []):
                if it.get("id"):
                    a = it.get("at", [0, 0, 0])
                    hgt = it.get("size", it.get("h", 0.6 if group != "fires" else 0.4))
                    if it.get("parts"):  # built objects: real extent from their parts
                        ext = [abs(p_.get("at", [0, 0, 0])[0]) + max(p_.get("size", [0, 0, 0])[0] / 2, p_.get("r", 0), p_.get("h", 0) / 2) for p_ in it["parts"]]
                        hgt = max(hgt, 2 * max(ext) * 0.7)
                    objs[it["id"]] = {"place": pn, "ry": it.get("ry", 0), "size": max(float(hgt), float(it.get("w", 0) or 0)), "focus": it.get("focus", [a[0], a[1] + hgt * 0.5, a[2]])}
        places[pn] = P
    events = {}
    tl_beats, prev_place, calm = [], None, 0
    for i, b in enumerate(beats):
        f0, f1 = spans[i]
        for e in b.get("do", []):
            if e.get("id") not in objs:
                raise SystemExit(f'beat {i + 1}: "do" on unknown object "{e.get("id")}"')
            ev = {k: v for k, v in e.items() if k not in ("id", "at", "delay")}
            if "dur" in ev:
                ev["dur"] = int(ev["dur"] * FPS) if ev["dur"] < 10 else ev["dur"]
            events.setdefault(e["id"], []).append([word_frame(b, e.get("at"), f0) + int(round(e.get("delay", 0) * FPS)), ev])
        cast = []
        for a in b.get("cast", []):
            sp = specs[a["id"]]
            c = {"id": a["id"], "x": a.get("x", 0.0), "z": a.get("z", 0.0), "y": a.get("y", 0.0), "s": a.get("s", 1.0),
                 "type": sp.get("type", a["id"]) if sp.get("type", a["id"]) in BUILTIN else "marco",
                 "outfit": None if sp.get("type", a["id"]) in BUILTIN and len(sp) <= 1 else {k: v for k, v in sp.items() if k != "type"},
                 "pose": a.get("pose", "hang"), "expr": a.get("face", "neutral"), "flip": a.get("flip", False),
                 "prop": a.get("prop"), "tray": a.get("tray"), "seed": sum(map(ord, a["id"])) % 11}
            c["events"] = [[word_frame(b, ch.get("at"), f0), {("expr" if k == "face" else k): v for k, v in ch.items() if k != "at"}] for ch in a.get("change", [])]
            anim, last = {}, {}
            for an in a.get("anim", []):
                s0 = word_frame(b, an.get("at"), f0); p = an["prop"]
                fr = an.get("from", last.get(p, a.get(p, 0)))
                anim.setdefault(p, []).append([s0, s0 + int(an.get("dur", 1.0) * FPS), fr, an["to"]]); last[p] = an["to"]
            c["anim"] = anim
            for p in ("fat", "roll", "squash", "tilt"):
                if p in a:
                    c[p] = a[p]
            if a.get("enter"):
                c["from"] = word_frame(b, a["enter"], f0)
            if a.get("move"):
                mv = a["move"]; c["mv"] = [word_frame(b, mv.get("at"), f0), mv["to"][0], mv["to"][1], int(mv.get("dur", 0.8) * FPS)]
            if b.get("speaker") == a["id"] or a.get("talk"):
                c["talk"] = lip_sync(b)
            cast.append(c)
        cam = b.get("camera")
        acts = [e for e in b.get("do", []) if e.get("id")]
        if cam is None:  # automatic but motivated
            if b["place"] != prev_place:
                cam = [{"preset": "establish"}] + ([{"preset": "insert", "on": acts[0]["id"], "at": acts[0]["at"]}] if acts else [])
            elif acts:
                cam = [{"preset": "two_shot"}, {"preset": "insert", "on": acts[0]["id"], "at": acts[0]["at"]}]
            elif b.get("speaker"):
                cam = {"preset": "closeup", "on": b["speaker"]}
            else:
                cam = CALM[calm % len(CALM)]; calm += 1
        segs = [({"preset": s} if isinstance(s, str) else s) for s in (cam if isinstance(cam, list) else [cam])]
        starts = [f0] + [word_frame(b, s.get("at"), f0) for s in segs[1:]]
        order = sorted(range(len(segs)), key=lambda k: (starts[k], k))  # shots tied to words play in spoken order
        segs = [segs[k] for k in order]; starts = [starts[k] for k in order]; starts[0] = f0
        # rhythm: no shot shorter than ~1 s. When two cuts are too close keep the one that shows the named
        # object or action (it carries the story) and drop the generic one (the user found 0.6 s cuts choppy).
        MIN_SHOT = int(1.0 * FPS)
        prio = lambda sg: 2 if (sg.get("on") in objs or sg.get("verso") in objs or any(t.get("on") in objs for t in sg.get("tappe", []))) else (1 if sg.get("on") else 0)
        for _ in range(20):                       # bounded: each pass removes at most one shot
            ends = starts[1:] + [f1]
            bad = [k for k in range(len(segs)) if ends[k] - starts[k] < MIN_SHOT]
            if not bad or len(segs) == 1:
                break
            k = bad[0]
            if k == 0:                            # opening shot too short: merge the next one into it
                segs.pop(1); starts.pop(1)
            else:                                 # keep the more meaningful of the two neighbours
                drop = k if prio(segs[k]) <= prio(segs[k - 1]) else k - 1
                segs.pop(drop); starts.pop(drop)
            starts[0] = f0
        PL = places[b["place"]]
        room_h = PL.get("h", 3) if PL.get("type", "room") == "room" else None
        room = (room_h, PL.get("w", 8)) if room_h else None
        cams = []
        for k, sg in enumerate(segs):
            s0, s1 = starts[k], (starts[k + 1] if k + 1 < len(segs) else f1)
            if sg.get("preset") in CONT:          # continuous shot: several subjects, no cut
                keys, stops = continuous_keys(sg, b, i, cast, objs, specs, room, s0, s1)
                cams.append({"f0": s0, "f1": s1, "shake": False, "keys": keys, "preset": sg["preset"], "on": None, "stops": stops,
                             "manual": False, "target": None, "tsize": None})
                continue
            if sg.get("preset") == "accompagna":  # tracking beside a walking character
                c = next((c for c in cast if c["id"] == sg.get("on")), None) or (cast[0] if cast else None)
                if not c:
                    raise SystemExit(f"beat {i + 1}: 'accompagna' needs a character ('on')")
                kk = follow_keys(sg, c, specs, room, s0, s1)
                cams.append({"f0": s0, "f1": s1, "shake": False, "keys": kk, "preset": "accompagna", "on": None,
                             "stops": [{"on": c["id"], "preset": "accompagna", "k0": 0, "k1": len(kk), "f0": s0, "f1": s1, "target": None, "tsize": None, "follow": True}],
                             "manual": False, "target": None, "tsize": None})
                continue
            on = sg.get("on")
            if not on and sg.get("preset") in ("closeup", "ecu", "push", "punch", "insert", "top", "low", "pull") and cast:
                on = b.get("speaker") or cast[i % len(cast)]["id"]
            cams.append({"f0": s0, "f1": s1, "shake": sg.get("preset") == "punch" or bool(sg.get("shake")), "keys": cam_keys(sg, i, cast, objs, specs, room_h, s0, s1),
                         "preset": sg.get("preset", "two_shot"), "on": on, "to": sg.get("to"), "fov": sg.get("fov"), "manual": "keys" in sg or bool(sg.get("manual")),
                         "target": objs[on]["focus"] if on in objs else None, "tsize": objs[on].get("size", 0.6) if on in objs else None})
        evf = [word_frame(b, e.get("at"), f0) + 6 for e in b.get("do", [])]
        evf += [ch[0] + 6 for c in cast for ch in c["events"]] + [v[0] + 10 for c in cast for tr in c["anim"].values() for v in tr]
        tl_beats.append({"i": i, "f0": f0, "f1": f1, "place": b["place"], "light": b.get("light") or places[b["place"]].get("light", "interno"),
                         "cams": cams, "cast": cast, "evf": sorted({min(f1 - 1, x) for x in evf})})
        prev_place = b["place"]
    for v in events.values():
        v.sort(key=lambda x: x[0])
    tl = {"width": W, "height": H, "fps": FPS, "frames": n, "places": places, "beats": tl_beats, "events": events}
    (work / "timeline.json").write_text(json.dumps(tl, ensure_ascii=False))
    return story, tl, clips, sfx_events, chunks, total, kit


def render3d(work, fdir, kit, frames=None, passes=0):
    if not (ENGINE3D / "node_modules" / "playwright").exists():
        raise SystemExit(f'3D engine not installed. Run once:  cd "{ENGINE3D}" && npm install && npx playwright install chromium')
    env = {**os.environ, "KIT": str(kit), "RESUME": "1"}
    if passes and passes > 1 and not os.environ.get("PASSAGGI"):
        env["PASSAGGI"] = str(passes)   # rendering a passaggi (story JSON: "qualita": {"passaggi": N})
    args = ["node", "render.mjs", str(work), str(fdir)]
    if frames is not None:
        (work / "frames.txt").write_text(",".join(map(str, frames))); args.append("list")
    if subprocess.run(args, cwd=ENGINE3D, env=env).returncode:
        raise SystemExit("3D render failed (see [page] errors).")


def build(story_path, out=None, preview=False):
    story_path = Path(story_path).resolve()
    name = story_path.stem
    work = Path(out).resolve() if out else Path.cwd() / "out" / name
    work.mkdir(parents=True, exist_ok=True)
    log(f"[1/4] Timing, places, direction -> {work}")
    story, tl, clips, sfx_events, chunks, total, kit = build_timeline(story_path, work, preview)
    fdir = work / "frames"
    if preview:
        frames = sorted({f for b in tl["beats"] for f in [b["f0"] + 3, b["f1"] - 4] + [c["f0"] + 5 for c in b["cams"][1:]] + b["evf"]
                                     + [x for c in b["cams"] for s in c.get("stops", [])[1:] for x in ((s["f0"] + s["arr"]) // 2, s["arr"] + 2)]})
        log(f"[2/4] Preview frames: {len(frames)}")
        render3d(work, fdir, kit, frames)
        surf = skia.Surface(W, H); paths = []
        (work / "preview").mkdir(exist_ok=True)
        for f in frames:
            compose(surf.getCanvas(), skia.Image.open(str(fdir / f"f{f:05d}.jpg")), chunks, f / FPS)
            p = work / "preview" / f"f{f:05d}.png"; surf.makeImageSnapshot().save(str(p), skia.kPNG); paths.append(p)
        R.save_contact(paths, work / "contact.png")
        log(f"Preview: {work / 'contact.png'}")
        return
    passes = int(story.get("qualita", {}).get("passaggi", 0))
    log(f"[2/4] 3D frames: {tl['frames']}" + (f"  (qualità: {passes} passaggi per fotogramma)" if passes > 1 else ""))
    if passes > 1:
        fdir = work / f"frames_q{passes}"   # cartella separata: RESUME non deve riusare i fotogrammi normali dell'anteprima
    render3d(work, fdir, kit, passes=passes)
    log("[3/4] Music, sound effects, voice")
    m = story.get("music", {})
    mixed = A.mix(total, clips, sfx_events, A.music(total, m.get("mood", "warm"), m.get("bpm", 96)), m.get("gain", 0.08), {})
    wav = work / f"{name}.wav"; A.write_wav(wav, mixed)
    log("[4/4] Karaoke captions and encode")
    import imageio_ffmpeg
    mp4 = work / f"{name}.mp4"
    proc = subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                             "-i", str(wav), "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-af", "loudnorm=I=-14:TP=-1:LRA=11",
                             "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(mp4)], stdin=subprocess.PIPE)
    surf = skia.Surface(W, H)
    for f in range(tl["frames"]):
        compose(surf.getCanvas(), skia.Image.open(str(fdir / f"f{f:05d}.jpg")), chunks, f / FPS)
        proc.stdin.write(surf.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType).tobytes())
    proc.stdin.close(); proc.wait()
    log(f"Done: {mp4}  ({total:.1f} s)")
    return mp4


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("story"); ap.add_argument("--out"); ap.add_argument("--preview", action="store_true")
    a = ap.parse_args(); build(a.story, a.out, a.preview)


if __name__ == "__main__":
    sys.exit(main())
