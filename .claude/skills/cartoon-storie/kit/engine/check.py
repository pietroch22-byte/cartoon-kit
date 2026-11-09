"""Checks a story file before rendering. Errors (❌) must be fixed; warnings (⚠️) are about variety and pacing.

Usage:  .venv/bin/python -m engine.check stories/my_story.json
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

from . import audio as A
from . import characters as C
from . import places as PL
from . import props as PR
from .render import CAMERA_PRESETS
from .scenes import SHOTS

TRANSITIONS = ("cut", "whip", "flash")
BODIES = ("coat", "suit", "dress", "robe", "shirt", "armor")
SPEC_KEYS = {"coat", "body", "hat", "hat_color", "hat_band", "plume", "hair", "hair_color", "mustache", "beard",
             "monocle", "glasses", "tie", "necktie", "lanyard", "head", "belt"}
FX_TYPES = tuple(PL.FX) + ("lightning", "explosion")
WORDS_PER_SEC = 2.75  # roughly words per second at speed 1.0, including short pauses


def _words(say):
    return [re.sub(r"[^\w]", "", w).lower() for w in say.split()]


def check(path):
    errors, warns = [], []
    try:
        story = json.loads(Path(path).read_text())
    except json.JSONDecodeError as e:
        return [f"The file isn't valid JSON: {e.msg} at line {e.lineno}, column {e.colno}."], []
    except FileNotFoundError:
        return [f"File not found: {path}"], []

    cast = story.get("cast", {})
    places = story.get("places", {})
    beats = story.get("beats", [])
    if not beats:
        return ["No beats. The story needs a \"beats\" list."], []
    vcfg = story.get("voice", {})
    vname = vcfg.get("name", A.DEFAULT_VOICE)
    if vcfg.get("file"):
        vf = Path(path).parent / vcfg["file"] if not Path(vcfg["file"]).is_absolute() else Path(vcfg["file"])
        if not vf.exists():
            errors.append(f"recorded voice not found: {vf}")
        if not vcfg.get("words"):
            warns.append("No voice.words: sync will be approximate. Run tools/asr_words.py on the voice first.")
    elif vname not in A.VOICES:
        errors.append(f"voice '{vname}' unknown. Use one of: {', '.join(A.VOICES)}")
    elif not Path(A.voice_path(Path(__file__).resolve().parent.parent, {"name": vname})).exists():
        errors.append(f"voice '{vname}' isn't downloaded yet. Run setup (it downloads the default voice) or the voices command.")
    if not story.get("facts"):
        warns.append("No \"facts\" field. Write down the real facts and sources so the video stays accurate.")

    for cid, spec in cast.items():
        for k in spec:
            if k not in SPEC_KEYS:
                errors.append(f"cast '{cid}': unknown setting '{k}'. Allowed: {', '.join(sorted(SPEC_KEYS))}")
        if spec.get("hat", "none") not in C.HATS:
            errors.append(f"cast '{cid}': hat '{spec['hat']}' unknown. Use one of: {', '.join(C.HATS)}")
        if spec.get("hair", "side") not in C.HAIRS:
            errors.append(f"cast '{cid}': hair '{spec['hair']}' unknown. Use one of: {', '.join(C.HAIRS)}")
        if spec.get("body", "coat") not in BODIES:
            errors.append(f"cast '{cid}': body '{spec['body']}' unknown. Use one of: {', '.join(BODIES)}")

    for name, p in places.items():
        if "preset" in p and p["preset"] not in PL.PRESETS:
            errors.append(f"place '{name}': preset '{p['preset']}' unknown. Use one of: {', '.join(PL.PRESETS)}")

    if beats[0].get("continue"):
        errors.append("Beat 1 can't use \"continue\" (there's no shot before it).")

    total_words = 0
    shot_keys = []
    prev = None
    for i, b in enumerate(beats, 1):
        tag = f"beat {i} (\"{b.get('say', '')[:40]}…\")"
        say = b.get("say", "")
        if not say.strip():
            errors.append(f"{tag}: empty \"say\".")
            continue
        words = _words(say)
        total_words += len(words)
        if len(words) > 20:
            warns.append(f"{tag}: {len(words)} words is long for one shot. Split it into two beats.")

        def has_word(w, where):
            w = w.lower()
            if not any(x.startswith(w) for x in words):
                errors.append(f"{tag}: {where} word '{w}' isn't in this beat's line.")

        cont = b.get("continue")
        shot = b.get("shot", prev.get("shot", "wide") if (cont and prev) else "wide")
        b_eff = dict(prev or {}) if cont else {}
        b_eff.update(b)
        if shot not in SHOTS:
            errors.append(f"{tag}: shot '{shot}' unknown. Use one of: {', '.join(SHOTS)}")
        place = b_eff.get("place")
        if isinstance(place, str) and place not in places and place not in PL.PRESETS:
            errors.append(f"{tag}: place '{place}' isn't in \"places\" and isn't a preset ({', '.join(PL.PRESETS)}).")
        if isinstance(place, dict) and place.get("preset") and place["preset"] not in PL.PRESETS:
            errors.append(f"{tag}: preset '{place['preset']}' unknown.")

        cam = b.get("camera")
        if cam is not None:
            name = cam if isinstance(cam, str) else cam.get("preset")
            if name and name not in CAMERA_PRESETS:
                errors.append(f"{tag}: camera '{name}' unknown. Use one of: {', '.join(CAMERA_PRESETS)}")
        if b.get("transition", "cut") not in TRANSITIONS:
            errors.append(f"{tag}: transition must be one of {', '.join(TRANSITIONS)}")

        for e in b.get("cast", []):
            cid = e.get("id")
            if cid not in cast:
                errors.append(f"{tag}: character '{cid}' isn't defined in \"cast\".")
            if e.get("pose", "idle") not in C.POSES:
                errors.append(f"{tag}: pose '{e['pose']}' unknown. Use one of: {', '.join(C.POSES)}")
            if e.get("face", "neutral") not in C.EXPR:
                errors.append(f"{tag}: face '{e['face']}' unknown. Use one of: {', '.join(C.EXPR)}")
            if e.get("anim", "none") not in C.ANIMS:
                errors.append(f"{tag}: anim '{e['anim']}' unknown. Use one of: {', '.join(C.ANIMS)}")
            if e.get("hold") and e["hold"] not in C.HELD:
                errors.append(f"{tag}: hold '{e['hold']}' unknown. Use one of: {', '.join(C.HELD)}")
            if shot in ("wide", "board"):
                x, y = e.get("x", 540), e.get("y", 1800)
                if not (-300 <= x <= 1380):
                    warns.append(f"{tag}: '{cid}' x={x} is far off screen.")
                elif not (110 <= x <= 970) and "walk_to" not in e:
                    warns.append(f"{tag}: '{cid}' x={x} is close to the edge and may be cut off (keep x 150–930).")
                if not (1450 <= y <= 1950):
                    warns.append(f"{tag}: '{cid}' y={y}: feet usually sit between 1700 and 1880.")
        if shot == "wide" and len(b.get("cast", [])) >= 2:
            xs = sorted(e.get("x", 540) for e in b["cast"] if "walk_to" not in e)
            for a_, b_ in zip(xs, xs[1:]):
                if b_ - a_ < 250:
                    warns.append(f"{tag}: two characters are only {b_ - a_}px apart and will overlap. Keep them ~300px apart.")
                    break

        for p in b.get("props", []):
            if p.get("type") not in PR.PROPS:
                errors.append(f"{tag}: prop '{p.get('type')}' unknown. Use one of: {', '.join(PR.PROPS)}")
        for s in b.get("sfx", []):
            if s.get("type") not in A.SFX_TYPES:
                errors.append(f"{tag}: sound '{s.get('type')}' unknown. Use one of: {', '.join(A.SFX_TYPES)}")
            if "at_word" in s:
                has_word(s["at_word"], "sound")
        for f in b.get("fx", []):
            if f.get("type") not in FX_TYPES:
                errors.append(f"{tag}: effect '{f.get('type')}' unknown. Use one of: {', '.join(FX_TYPES)}")
            if "at_word" in f:
                has_word(f["at_word"], "effect")
        for key in ("germs_at_word", "clean_at_word"):
            if key in b:
                has_word(b[key], key)
        if b.get("shake", {}).get("at_word") if isinstance(b.get("shake"), dict) else False:
            has_word(b["shake"]["at_word"], "shake")
        for w in b.get("board", {}).get("write", []):
            if "at_word" in w:
                has_word(w["at_word"], "board")

        if shot == "closeup" and not b_eff.get("cast"):
            errors.append(f"{tag}: a closeup needs one character in \"cast\".")
        if shot == "board" and not b_eff.get("board"):
            errors.append(f"{tag}: a board shot needs \"board\": {{\"title\":…, \"write\":[…]}}.")
        if shot == "headline" and not b_eff.get("headline", {}).get("text"):
            errors.append(f"{tag}: a headline shot needs \"headline\": {{\"text\": …}}.")
        if shot == "card" and not b_eff.get("card", {}).get("text"):
            errors.append(f"{tag}: a card shot needs \"card\": {{\"text\": …}}.")

        if not cont or "camera" in b:
            cam_name = cam if isinstance(cam, str) else (cam or {}).get("preset", "push_in")
            first = (b.get("cast") or [{}])[0]
            shot_keys.append({"i": i, "shot": shot, "place": json.dumps(place, sort_keys=True), "camera": cam_name,
                              "look": (first.get("id"), first.get("pose"), first.get("face")), "words": len(words)})
        else:
            if shot_keys:
                shot_keys[-1]["words"] += len(words)
        prev = b_eff

    speed = story.get("voice", {}).get("speed", 1.05)
    est = total_words / (WORDS_PER_SEC * speed) + 0.2 * len(beats) + 0.8
    if est < 12:
        warns.append(f"Estimated length {est:.0f}s is very short ({total_words} words): is the story complete?")
    elif est > 90:
        warns.append(f"Estimated length {est:.0f}s is long ({total_words} words): keep it only if every beat stands on its own.")
    first_words = len(_words(beats[0].get("say", "")))
    if first_words > 18:
        warns.append(f"The hook (beat 1) has {first_words} words. Hooks land harder under ~15 words.")

    # variety
    for a, b in zip(shot_keys, shot_keys[1:]):
        if a["shot"] == b["shot"] == "wide" and a["place"] == b["place"] and a["camera"] == b["camera"] and a["look"] == b["look"]:
            warns.append(f"Beats {a['i']} and {b['i']} look the same (same place, camera, character pose and face). Change one.")
    for k in range(len(shot_keys) - 3):
        run = shot_keys[k:k + 4]
        if len({s["shot"] for s in run}) == 1:
            warns.append(f"Beats {run[0]['i']}–{run[-1]['i']}: 4 '{run[0]['shot']}' shots in a row. Mix in a closeup, board, card or headline.")
            break
    cams = Counter(s["camera"] for s in shot_keys)
    if shot_keys and cams.most_common(1)[0][1] > 0.6 * len(shot_keys) and len(shot_keys) > 5:
        warns.append(f"Camera '{cams.most_common(1)[0][0]}' is used for {cams.most_common(1)[0][1]} of {len(shot_keys)} shots. Mix in punch, pull_out or pans.")
    kinds = {s["shot"] for s in shot_keys}
    if len(shot_keys) > 6 and len(kinds) < 3:
        warns.append(f"Only {len(kinds)} shot type(s) used ({', '.join(kinds)}). Ricks-style videos mix wide shots, closeups and a reveal (board/card/headline).")
    for s in shot_keys:
        sec = s["words"] / (WORDS_PER_SEC * speed)
        if sec > 6:
            warns.append(f"Beat {s['i']}: this shot runs ~{sec:.0f}s. Ricks Clips cuts every 2–4s; break it up.")
    looks = Counter(s["look"] for s in shot_keys if s["look"][0])
    for look, n in looks.items():
        if n >= 3:
            warns.append(f"'{look[0]}' has the same pose '{look[1]}' and face '{look[2]}' in {n} shots. Vary them.")
    return errors, warns


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")  # Windows consoles
    if len(sys.argv) < 2:
        print("Usage: .venv/bin/python -m engine.check stories/my_story.json")
        return 2
    errors, warns = check(sys.argv[1])
    for e in errors:
        print("❌ " + e)
    for w in warns:
        print("⚠️  " + w)
    if not errors and not warns:
        print("✅ Story looks good.")
    elif not errors:
        print(f"✅ No errors ({len(warns)} warning(s) to consider).")
    else:
        print(f"Found {len(errors)} error(s). Fix them before rendering.")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
