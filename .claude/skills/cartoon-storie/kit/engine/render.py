"""Reads one story file and renders the finished Short (picture + voice + music + sound effects).

Usage:  .venv/bin/python -m engine.render stories/my_story.json [--stills | --stills-only] [--out out/name.mp4]
"""
import argparse
import hashlib
import json
import math
import re
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import skia

from . import audio as A
from . import draw as D
from .scenes import SHOTS

FPS = 30
ROOT = Path(__file__).resolve().parent.parent


def log(msg):
    print(msg, flush=True)


# ---------- timing ----------

def _spoken_len(word):
    core = re.sub(r"[^\w]", "", word)
    if core.isdigit():
        return 4 * len(core)  # "1847" is said "eighteen forty-seven"
    return max(1, len(core))


def word_times(text, t0, dur):
    words = text.split()
    weights = []
    for w in words:
        wt = _spoken_len(w) + 1.5
        end = w.rstrip('"\'*)')[-1:]
        if end in ",;:":
            wt += 3
        if end in ".?!":
            wt += 4
        weights.append(wt)
    tot = sum(weights)
    out, acc = [], 0.0
    for w, wt in zip(words, weights):
        out.append((w, t0 + dur * acc / tot, t0 + dur * (acc + wt) / tot))
        acc += wt
    return out


def word_time(beat, word):
    """When a word (or the start of it) is spoken in this beat. Falls back to the beat start."""
    word = word.lower()
    if word:
        for w, st, _ in beat["_words"]:
            if re.sub(r"[^\w]", "", w).lower().startswith(word):
                return st
    return beat["_start"]


def _clean(w):
    return w.strip('"\'«»“”…').rstrip(",.;:!?…»").lstrip("«").replace("*", "")


def caption_chunks(words):
    """Groups words into 1-2 word captions. Words wrapped in *stars* are highlighted."""
    chunks, i = [], 0
    while i < len(words):
        raw, start, end = words[i]
        hot = "*" in raw
        text = _clean(raw)
        i += 1
        while i < len(words) and len(text) <= 4 and not hot:
            nraw = words[i][0]
            nxt = _clean(nraw)
            if len(text) + 1 + len(nxt) > 11 or "*" in nraw:
                break
            text += " " + nxt
            end = words[i][2]
            i += 1
        chunks.append((text, start, end, hot))
    return chunks


def karaoke_blocks(words, max_words=3, max_chars=16):
    """1-3 words per block; each word keeps its start time for the yellow highlight."""
    blocks, cur = [], []
    for raw, st, en in words:
        w = _clean(raw).upper()
        if not w:
            continue
        if cur and (len(cur) >= max_words or len(" ".join(x[0] for x in cur)) + 1 + len(w) > max_chars):
            blocks.append(cur); cur = []
        cur.append((w, st, en))
        if raw.rstrip("»\"'*")[-1:] in ".?!,:;…":  # break on punctuation
            blocks.append(cur); cur = []
    if cur:
        blocks.append(cur)
    return blocks


class Ctx:
    def __init__(self, story, beats, sfx_events):
        self.cast = story.get("cast", {})
        self.places = story.get("places", {})
        self.default_place = next(iter(self.places), "hospital")
        self.beats = beats
        self.sfx_events = sfx_events

    def word_time(self, beat, word):
        return word_time(beat, word)

    def last_sfx(self, kind, t):
        times = [st for st, k in self.sfx_events if k == kind and st <= t]
        return max(times) if times else None


# ---------- camera ----------

CAMERA_PRESETS = {
    "push_in": {"move": "zoom", "from": 1.0, "to": 1.22},
    "slow_push": {"move": "zoom", "from": 1.02, "to": 1.12},
    "pull_out": {"move": "zoom", "from": 1.45, "to": 1.0},
    "punch": {"move": "punch", "from": 1.0, "to": 1.45},
    "still": {"move": "zoom", "from": 1.04, "to": 1.09},          # never a frozen hold: it always creeps
    "push_face": {"move": "zoom", "from": 1.1, "to": 1.75},        # use with "on": "<cast id>"
    "pull_reveal": {"move": "zoom", "from": 1.8, "to": 1.05},      # start on a detail, reveal the scene
    "pan_left": {"move": "pan", "dx": 200, "from": 1.25, "to": 1.3},
    "pan_right": {"move": "pan", "dx": -200, "from": 1.25, "to": 1.3},
    "pan_up": {"move": "pan", "dy": 320, "from": 1.2, "to": 1.25},
    "pan_down": {"move": "pan", "dy": -320, "from": 1.2, "to": 1.25},
    "drift_left": {"move": "pan", "dx": 140, "from": 1.15, "to": 1.32},   # pan + push together
    "drift_right": {"move": "pan", "dx": -140, "from": 1.15, "to": 1.32},
    "swing": {"move": "swing", "from": 1.3, "to": 1.3, "dx": 260},      # face to face between two characters
}
AUTO_CAMERAS = ["push_in", "drift_left", "push_face", "pull_out", "drift_right", "pan_up", "slow_push", "swing"]
HEAD_Y = 1150  # where a standing character's face is at default scale


def camera_of(beat, n=0):
    cam = beat.get("camera") or AUTO_CAMERAS[n % len(AUTO_CAMERAS)]  # no camera written -> automatic variety
    if isinstance(cam, list):  # 3D camera segments: the 2D engine uses the first one
        cam = cam[0] if cam else "push_in"
    if isinstance(cam, str):
        cam = {"preset": cam}
    out = dict(CAMERA_PRESETS.get(cam.get("preset", ""), CAMERA_PRESETS["push_in"]))
    out.update({k: v for k, v in cam.items() if k != "preset"})
    cast = beat.get("cast", [])
    if "on" in out and "focus" not in out:
        hit = [e for e in cast if isinstance(e, dict) and e.get("id") == out["on"]]
        if hit:
            out["focus"] = [hit[0].get("x", 540), HEAD_Y + (hit[0].get("y", 1800) - 1800)]
    if out.get("move") == "zoom" and isinstance(out.get("to", 1), (int, float)) and out.get("to", 1) > 1.5 and "focus" not in out and cast:
        out["focus"] = [cast[0].get("x", 540), HEAD_Y]  # push_face without "on": first character
    if "focus" not in out:
        if beat.get("shot", "wide") == "wide" and cast:
            out["focus"] = [sum(e.get("x", 540) for e in cast) / len(cast), 1250]
        else:
            out["focus"] = [540, 1100]
    return out


def apply_camera(c, ctx, shot, t):
    cam = shot["camera"]
    p = D.clamp01((t - shot["from"]) / max(0.01, shot["to"] - shot["from"]))
    age = t - shot["from"]
    fx, fy = cam["focus"]
    if cam.get("move") == "pan":
        a, b = cam.get("from", cam.get("zoom", 1.15)), cam.get("to", cam.get("zoom", 1.15))
        s = a + (b - a) * D.ease(p)
        fx += cam.get("dx", 0) * (D.ease(p) - 0.5) * 2
        fy += cam.get("dy", 0) * (D.ease(p) - 0.5) * 2
    elif cam.get("move") == "swing":
        s = cam.get("from", 1.3)
        fx += cam.get("dx", 260) * (D.ease(min(1, p * 1.6)) - 0.5) * 2
        fy = HEAD_Y + 150
    elif cam.get("move") == "punch":
        a, b = cam.get("from", 1.0), cam.get("to", 1.35)
        s = a + (b - a) * (0.85 * D.ease_out(age / 0.3) + 0.15 * D.ease(p))
    else:
        a, b = cam.get("from", 1.0), cam.get("to", 1.12)
        s = a + (b - a) * D.ease(p)
    s *= 1 + 0.045 * (1 - D.ease_out(age / 0.25))  # small settle after every cut
    # keep the frame inside the drawn world
    half_w, half_h = D.W / 2 / s, D.H / 2 / s
    fx = min(max(fx, half_w), D.W - half_w)
    fy = min(max(fy, half_h), D.H - half_h)
    shake = 0.0
    for b in shot["beats"]:
        if "shake" in cam or b.get("shake"):
            sk = b.get("shake", {}) or {}
            st = ctx.word_time(b, sk.get("at_word", "")) if sk.get("at_word") else b["_start"]
            dt = t - st
            if 0 <= dt < sk.get("time", 0.6):
                shake = max(shake, sk.get("strength", 1.0) * (1 - dt / sk.get("time", 0.6)))
    if cam.get("shake"):
        shake = max(shake, cam["shake"] * 0.4)
    c.translate(D.W / 2, D.H / 2)
    c.scale(s, s)
    c.translate(-fx, -fy)
    if shake:
        c.translate(math.sin(t * 61) * 22 * shake, math.cos(t * 47) * 18 * shake)


# ---------- main ----------

def tts_cached(text, model, speed):
    cache = ROOT / "out" / ".voice_cache"
    cache.mkdir(parents=True, exist_ok=True)
    key = hashlib.md5(f"{model}|{speed}|{text}".encode()).hexdigest()
    f = cache / f"{key}.npy"
    if f.exists():
        return np.load(f)
    pcm = A.tts(text, model, speed)
    np.save(f, pcm)
    return pcm


def plan(story_path):
    story = json.loads(Path(story_path).read_text())
    beats = story["beats"]
    voice = story.get("voice", {})
    if voice.get("file"):
        return _plan_recorded(story, beats, voice, Path(story_path).parent)
    model = A.voice_path(ROOT, voice)
    speed = voice.get("speed", 1.05)

    log(f"[1/4] Recording the narrator ({len(beats)} lines)...")
    t, clips = 0.2, []
    for i, b in enumerate(beats):
        pcm = tts_cached(b["say"].replace("*", ""), model, speed)
        dur = len(pcm) / A.SR
        b["_start"], b["_vdur"] = t, dur
        b["_words"] = word_times(b["say"], t, dur)
        clips.append((t, pcm))
        nxt = beats[i + 1] if i + 1 < len(beats) else None
        t += dur + b.get("pause", 0.06 if nxt and nxt.get("continue") else 0.2)
    total = t + story.get("tail", 0.6)
    return _finish_plan(story, beats, clips, total)


def _norm(w):
    return re.sub(r"[^\w]", "", w.lower())


def _load_voice(path):
    import subprocess, imageio_ffmpeg
    raw = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(A.SR),
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def _plan_recorded(story, beats, voice, base):
    """User's recorded voice: never re-timed. Beats are placed on the voice using word timestamps
    (voice.words = JSON [[start, end, word, prob], ...] from tools/asr_words.py). Without it, words are
    spread over the voice length proportionally (rough; warn the user)."""
    vpath = (base / voice["file"]) if not Path(voice["file"]).is_absolute() else Path(voice["file"])
    pcm = _load_voice(vpath)
    dur = len(pcm) / A.SR
    log(f"[1/4] Using the recorded voice {vpath.name} ({dur:.1f}s, never edited)...")
    says = [b["say"].split() for b in beats]
    flat = [w for ws in says for w in ws]
    wfile = voice.get("words")
    if wfile:
        wf = (base / wfile) if not Path(wfile).is_absolute() else Path(wfile)
        asr = json.loads(Path(wf).read_text())
        asr = [[x["t0"], x["t1"], x["w"], 1.0] if isinstance(x, dict) else x for x in asr]
        import difflib
        a, b_ = [_norm(w) for w in flat], [_norm(x[2]) for x in asr]
        times = [None] * len(flat)
        for blk in difflib.SequenceMatcher(None, a, b_, autojunk=False).get_matching_blocks():
            for k in range(blk.size):
                times[blk.a + k] = (asr[blk.b + k][0], asr[blk.b + k][1])
        known = [i for i, t in enumerate(times) if t]
        if not known:
            raise SystemExit("No script word matches the transcript: check voice.words and the script language.")
        for i in range(len(times)):  # fill gaps by interpolation between matched words
            if times[i] is None:
                lo = max([k for k in known if k < i], default=None); hi = min([k for k in known if k > i], default=None)
                t0 = times[lo][1] if lo is not None else 0.0
                t1 = times[hi][0] if hi is not None else dur
                n0 = i - (lo if lo is not None else -1); n1 = (hi if hi is not None else len(times)) - (lo if lo is not None else -1)
                st = t0 + (t1 - t0) * (n0 - 1) / n1; times[i] = (st, st + (t1 - t0) / n1)
        miss = len(flat) - len(known)
        if miss:
            log(f"   {miss} script words not found in the transcript (timed by interpolation): check them.")
    else:
        log("   No word timestamps (voice.words): spreading words over the voice. Run tools/asr_words.py for exact sync.")
        allw = word_times(" ".join(flat), 0.15, max(0.5, dur - 0.3))
        times = [(st, en) for _, st, en in allw]
    k = 0
    for b, ws in zip(beats, says):
        tw = times[k:k + len(ws)]; k += len(ws)
        b["_start"], b["_vdur"] = tw[0][0], max(0.2, tw[-1][1] - tw[0][0])
        b["_words"] = [(w, st, en) for w, (st, en) in zip(ws, tw)]
    return _finish_plan(story, beats, [(0.0, pcm)], dur + story.get("tail", 0.6))


def _finish_plan(story, beats, clips, total):
    for i, b in enumerate(beats):
        b["_from"] = 0.0 if i == 0 else b["_start"] - 0.05
    for i, b in enumerate(beats):
        b["_to"] = beats[i + 1]["_from"] if i + 1 < len(beats) else total

    shots = []
    for b in beats:
        if b.get("continue") and shots:
            prev = shots[-1]["beats"][-1]
            for k in ("shot", "place", "props", "crowd", "fx", "headline", "card", "hands"):
                if k not in b and k in prev:
                    b[k] = prev[k]
            if "cast" not in b:
                b["cast"] = prev.get("cast", [])
            if "camera" in b:  # same scene, new camera: a cut-in
                b.setdefault("shot", shots[-1]["type"])
                shots.append({"beats": [b], "chain": shots[-1]["chain"] + [b], "type": shots[-1]["type"],
                              "camera": camera_of(b, len(shots)), "transition": b.get("transition", "cut")})
            else:
                shots[-1]["beats"].append(b)
                shots[-1]["chain"].append(b)
        else:
            shots.append({"beats": [b], "chain": [b], "type": b.get("shot", "wide"), "camera": camera_of(b, len(shots)),
                          "transition": b.get("transition", "cut")})
        b["_shot"] = shots[-1]
    for s in shots:
        s["from"], s["to"] = s["beats"][0]["_from"], s["beats"][-1]["_to"]

    sfx_events = []
    for b in beats:
        for e in b.get("sfx", []):
            base = word_time(b, e["at_word"]) if "at_word" in e else b["_from"]
            sfx_events.append((base + e.get("at", 0.0), e["type"]))
    chunks = []
    for b in beats:
        if b.get("caption") is False:
            continue
        for blk in karaoke_blocks(b["_words"]):
            chunks.append(blk)
    return story, beats, shots, clips, sfx_events, chunks, total


def draw_frame(surface, ctx, beats, shots, chunks, t, bi):
    beat = beats[bi]
    shot = beat["_shot"]
    c = surface.getCanvas()
    c.clear(skia.ColorWHITE)
    age = t - shot["from"]
    trans = shot["transition"]
    c.save()
    if trans == "whip" and age < 0.2:
        k = 1 - D.ease_out(age / 0.2)
        c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(60 * k, 4)))
        c.translate(-D.W * 0.25 * k, 0)
    apply_camera(c, ctx, shot, t)
    SHOTS[shot["type"]](c, ctx, shot, beat, t)
    if trans == "whip" and age < 0.2:
        c.restore()
    c.restore()
    if trans == "flash" and age < 0.2:
        c.drawRect(skia.Rect.MakeWH(D.W, D.H), D.P(D.col("#FFFFFF", 0.85 * (1 - age / 0.2))))
    D.vignette(c)
    lead = 0.03  # text leads the sound slightly
    cur = None
    for blk in chunks:  # latest block that has started, held until the next one starts
        if blk[0][1] - lead <= t:
            cur = blk
        else:
            break
    if cur is not None and t < cur[-1][2] + 0.6:
        hot = max(i for i, w in enumerate(cur) if w[1] - lead <= t)
        D.draw_karaoke(c, [w[0] for w in cur], hot, t - cur[0][1])
    return surface.makeImageSnapshot()


def beat_index(beats, t, start=0):
    bi = start
    while bi + 1 < len(beats) and t >= beats[bi + 1]["_from"]:
        bi += 1
    return bi


def save_contact(paths, out):
    from PIL import Image
    ims = [Image.open(p).resize((270, 480)) for p in paths]
    cols = min(6, len(ims))
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (270 * cols, 480 * rows), "white")
    for i, im in enumerate(ims):
        sheet.paste(im, ((i % cols) * 270, (i // cols) * 480))
    sheet.save(out)


def build(story_path, out_path=None, stills=False, stills_only=False):
    story_path = Path(story_path)
    name = story_path.stem
    out_dir = ROOT / "out"
    out_dir.mkdir(exist_ok=True)
    out_path = Path(out_path) if out_path else out_dir / f"{name}.mp4"
    story, beats, shots, clips, sfx_events, chunks, total = plan(story_path)
    ctx = Ctx(story, beats, sfx_events)
    surface = skia.Surface(D.W, D.H)

    still_times = {}
    if stills or stills_only:
        sd = out_dir / f"{name}_stills"
        sd.mkdir(exist_ok=True)
        for old in sd.glob("*.png"):
            old.unlink()
        for i, s in enumerate(shots):
            for k, frac in enumerate((0.35, 0.9)):
                still_times[int((s["from"] + (s["to"] - s["from"]) * frac) * FPS)] = sd / f"shot{i + 1:02d}_{k + 1}.png"

    if stills_only:
        log(f"[2/2] Drawing {len(still_times)} stills...")
        for f, path in sorted(still_times.items()):
            t = f / FPS
            draw_frame(surface, ctx, beats, shots, chunks, t, beat_index(beats, t)).save(str(path), skia.kPNG)
        save_contact(sorted(still_times.values()), out_dir / f"{name}_stills" / "contact.png")
        log(f"Stills: {out_dir / (name + '_stills')}  (contact sheet: contact.png)  length {total:.1f}s, {len(shots)} shots")
        return None

    log(f"[2/4] Making music and sound effects ({total:.1f} s)...")
    m = story.get("music", {})
    track = A.music(total, m.get("mood", "mystery"), m.get("bpm", 100))
    custom = {}
    if any(k == "laugh" for _, k in sfx_events):
        model = A.voice_path(ROOT, story.get("voice", {}))
        custom["laugh"] = A.crowd_laugh([tts_cached(txt, model, sp) for txt, sp in
                                         (("Ha ha ha ha ha!", 1.3), ("Hah hah hah hah!", 1.0), ("Ho ho ho ho!", 1.15))])
    mixed = A.mix(total, clips, sfx_events, track, m.get("gain", 0.08), custom)
    wav = out_dir / f"{name}.wav"
    A.write_wav(wav, mixed)

    n_frames = int(total * FPS)
    log(f"[3/4] Drawing {n_frames} frames (this is the slow part, about 1-2 minutes)...")
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    proc = subprocess.Popen([ff, "-y", "-loglevel", "error",
                             "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{D.W}x{D.H}", "-r", str(FPS), "-i", "-",
                             "-i", str(wav),
                             "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
                             "-af", f"loudnorm=I={m.get('loudness', -18)}:TP=-3:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
                             "-shortest", "-movflags", "+faststart", str(out_path)], stdin=subprocess.PIPE)
    started = time.time()
    bi = 0
    for f in range(n_frames):
        t = f / FPS
        bi = beat_index(beats, t, bi)
        img = draw_frame(surface, ctx, beats, shots, chunks, t, bi)
        if f in still_times:
            img.save(str(still_times[f]), skia.kPNG)
        proc.stdin.write(img.toarray(colorType=skia.kRGBA_8888_ColorType).tobytes())
        if f % 150 == 0 and f:
            el = time.time() - started
            log(f"      frame {f}/{n_frames}  (~{el / f * (n_frames - f):.0f} s left)")
    proc.stdin.close()
    proc.wait()
    if still_times:
        save_contact(sorted(still_times.values()), out_dir / f"{name}_stills" / "contact.png")
    log(f"[4/4] Done: {out_path}  ({total:.1f} s, {len(shots)} shots)")
    return out_path


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")  # Windows consoles
    ap = argparse.ArgumentParser()
    ap.add_argument("story")
    ap.add_argument("--out")
    ap.add_argument("--stills", action="store_true", help="also save 2 still images per shot")
    ap.add_argument("--stills-only", action="store_true", help="only draw the stills (fast look check, no video)")
    a = ap.parse_args()
    build(a.story, a.out, a.stills, a.stills_only)


if __name__ == "__main__":
    sys.exit(main())
