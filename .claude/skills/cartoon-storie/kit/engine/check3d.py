"""Checks a hybrid (3D) story before rendering. Usage: python -m engine.check3d stories/<name>.json"""
import json, sys, zipfile
from pathlib import Path
from . import characters as C, props as PR
from .hybrid import CAMS, SKILL

def models():
    names = set()
    for z in (SKILL / "library" / "modelli3d").glob("*.zip"):
        names |= {Path(n).stem for n in zipfile.ZipFile(z).namelist() if n.endswith(".glb")}
    return names

def check(path):
    st = json.loads(Path(path).read_text())
    E, Wn = [], []
    cast, places = st.get("cast", {}), st.get("places", {})
    v = st.get("voice", {})
    if v.get("file"):
        vf = Path(v["file"]) if Path(v["file"]).is_absolute() else Path(path).parent / v["file"]
        if not vf.exists(): E.append(f"recorded voice not found: {vf}")
        if not v.get("words"): Wn.append("No voice.words: sync will be approximate (run kit/tools/asr_words.py).")
    M = models()
    for pn, P in places.items():
        if P.get("type", "room") not in ("room", "outdoor"): E.append(f"place {pn}: type must be room or outdoor")
        for it in P.get("models", []):
            if not it.get("parts") and it.get("m") not in M and not (SKILL / "library" / "oggetti3d" / f"{it.get('m')}.json").exists(): E.append(f"place {pn}: model '{it.get('m')}' not in library/modelli3d (search: kit/tools/search_library.py; if missing, CREATE it: references/creare-oggetti.md)")
            if len(it.get("at", [])) != 3: E.append(f"place {pn}: model '{it.get('m')}' needs at [x, y, z]")
        for it in P.get("decor", []):
            if it.get("type") not in PR.PROPS: E.append(f"place {pn}: 2D prop '{it.get('type')}' unknown")
            if it.get("wall") and len(it.get("at", [])) != 2: E.append(f"place {pn}: wall prop '{it.get('type')}' needs at [along, height]")
        if len(P.get("models", [])) + len(P.get("decor", [])) < 8: Wn.append(f"place {pn}: only {len(P.get('models', [])) + len(P.get('decor', []))} objects; a believable set needs 15+.")
    prev = None
    for i, b in enumerate(st.get("beats", [])):
        tag = f"beat {i + 1}"
        if b.get("place") not in places: E.append(f"{tag}: place '{b.get('place')}' not defined")
        cam = b.get("camera")
        name = cam if isinstance(cam, str) else (cam or {}).get("preset")
        if name and name not in CAMS and name != "over_shoulder": E.append(f"{tag}: camera '{name}' unknown. Use: {', '.join(list(CAMS) + ['over_shoulder'])}")
        if name and name == prev: Wn.append(f"{tag}: same camera move as the previous beat ({name}).")
        prev = name
        for a in b.get("cast", []):
            if a.get("id") not in cast: E.append(f"{tag}: '{a.get('id')}' not in cast")
            if a.get("pose", "idle") not in C.POSES: E.append(f"{tag}: pose '{a.get('pose')}' unknown. Use: {', '.join(C.POSES)}")
            if a.get("face", "neutral") not in C.EXPR: E.append(f"{tag}: face '{a.get('face')}' unknown. Use: {', '.join(C.EXPR)}")
    return E, Wn

def main():
    E, Wn = check(sys.argv[1])
    for w in Wn: print("⚠️ ", w)
    for e in E: print("❌", e)
    print("✅ No errors" if not E else f"Found {len(E)} error(s).")
    return 1 if E else 0

if __name__ == "__main__":
    sys.exit(main())
