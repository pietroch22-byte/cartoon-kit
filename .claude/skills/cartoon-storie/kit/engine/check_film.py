"""Checks a film story before rendering: python -m engine.check_film stories/<name>.json"""
import json, sys
from pathlib import Path
from .film import POSES, FACES, BUILTIN, REFCAM, ALIAS, kit_dir, SKILL

SIN = json.loads((SKILL / "library" / "sinonimi_it_en.json").read_text())
def _norm(w):
    return w.lower().strip("«»\"'.,;:!?…()").replace("’", "'").split("'")[-1]
def _noun(w):
    """Italian object noun spoken in the line (dictionary + simple plurals)."""
    w = _norm(w)
    for c in (w, w[:-1] + "o", w[:-1] + "a", w[:-1] + "e", "uovo" if w == "uova" else ""):
        if c in SIN: return c
    return None
def _refs(b, P):
    """Everything the beat points at: object ids/names, actions, props, trays."""
    r = set()
    for e in b.get("do", []): r.add(str(e.get("id", "")).lower())
    for a in b.get("cast", []):
        for s_ in [a] + a.get("change", []):
            for k in ("prop", "tray", "pose", "hold"): r.add(str(s_.get(k, "")).lower())
            if s_.get("apron"): r.add("grembiule")
    for c in (b.get("camera") if isinstance(b.get("camera"), list) else [b.get("camera")]):
        if isinstance(c, dict):
            for x in [c.get("on"), c.get("verso")] + [t.get("on") for t in c.get("tappe", [])]: r.add(str(x or "").lower())
    m = b.get("mostra", {})
    for k, v in (m.items() if isinstance(m, dict) else [(x, x) for x in m]): r.add(str(k).lower()); r.add(str(v).lower())
    return r
def _visible_names(P):
    n = set()
    for g in ("models", "fires", "boards", "lamps", "steam", "facades"):
        for it in P.get(g, []):
            if not it.get("hidden"): n.add((str(it.get("id", "")) + " " + str(it.get("m", ""))).lower())
    return n

def check(path):
    st = json.loads(Path(path).read_text()); E, Wn = [], []
    try:
        idx = json.loads((kit_dir() / "indice.json").read_text())["modelli"]
    except SystemExit as e:
        return [str(e)], []
    o3 = {p.stem for p in (SKILL / "library" / "oggetti3d").glob("*.json")}
    import zipfile
    for z in (SKILL / "library" / "modelli3d").glob("*.zip"):
        o3 |= {Path(n).stem for n in zipfile.ZipFile(z).namelist() if n.endswith(".glb")}
    places, cast = st.get("places", {}), st.get("cast", {})
    ids = set()
    for pn, P in places.items():
        for g in ("models", "fires", "boards", "lamps", "steam", "facades"):
            for it in P.get(g, []):
                if it.get("id"):
                    if it["id"] in ids: E.append(f"{pn}: id '{it['id']}' usato due volte: ogni oggetto deve avere un nome unico")
                    ids.add(it["id"])
        for it in P.get("models", []):
            if it.get("m") and it["m"] not in idx and it["m"] not in o3:
                E.append(f"{pn}: model '{it['m']}' not in kit or library/oggetti3d (search: kit/tools/search_library.py; else create it: references/creare-oggetti.md)")
        n = len(P.get("models", [])) + len(P.get("facades", [])) + len(P.get("boards", []))
        if n < 12: Wn.append(f"{pn}: only {n} objects. Enrich it: inventory of what this place really contains (references/regia.md).")
    prev = None
    for i, b in enumerate(st.get("beats", []), 1):
        if b.get("place") not in places: E.append(f"beat {i}: place '{b.get('place')}' not defined")
        for e in b.get("do", []):
            if e.get("id") not in ids: E.append(f"beat {i}: do on unknown id '{e.get('id')}'")
        cams = b.get("camera"); cams = cams if isinstance(cams, list) else [cams] if cams else []
        for c in cams:
            nm = c if isinstance(c, str) else c.get("preset")
            if nm and nm not in REFCAM and nm not in ALIAS and not (isinstance(c, dict) and "keys" in c): E.append(f"beat {i}: camera '{nm}' unknown. Use: {', '.join(REFCAM)}")
        sayw = [_norm(w) for w in b.get("say", "").split()]
        for c in cams:  # continuous shots: every stop exists and arrives on a word of this line
            if not isinstance(c, dict) or c.get("preset") not in ("passaggio", "piano_sequenza", "accompagna"): continue
            st = c.get("tappe", []) if c["preset"] == "piano_sequenza" else [{"on": c.get("on")}, {"on": c.get("verso"), "at": c.get("parola", c.get("verso"))}] if c["preset"] == "passaggio" else [{"on": c.get("on")}]
            if c["preset"] == "piano_sequenza" and len(st) < 2: E.append(f"beat {i}: piano_sequenza vuole almeno 2 tappe")
            for k, t in enumerate(st):
                if t.get("on") not in ids and t.get("on") not in {a.get("id") for a in b.get("cast", [])}:
                    E.append(f"beat {i}: {c['preset']}: soggetto '{t.get('on')}' non è un oggetto con id né un personaggio della battuta")
                w = _norm(str(t.get("at") or ""))
                if k and (not w or not any(x.startswith(w) for x in sayw)):
                    E.append(f"beat {i}: {c['preset']}: la tappa '{t.get('on')}' deve arrivare su una parola della battuta ('at'/'parola'), «{w}» non c'è")
            if c["preset"] == "accompagna" and not any(a.get("id") == c.get("on") and a.get("move") for a in b.get("cast", [])):
                Wn.append(f"beat {i}: accompagna su '{c.get('on')}' che non si sposta ('move'): usa mezza_figura o aggiungi il movimento")
        names = [c if isinstance(c, str) else c.get("preset") for c in cams]
        if names and names[0] == prev: Wn.append(f"beat {i}: same opening camera as the previous beat ({prev}).")
        prev = names[-1] if names else None
        # every object the voice names must be shown in this beat (not just exist somewhere)
        P = places.get(b.get("place"), {}); refs = _refs(b, P); vis = _visible_names(P)
        skip = {str(x).lower() for x in b.get("non_mostrare", [])}
        for w in b.get("say", "").split():
            n = _noun(w)
            if not n or n in skip: continue
            keys = [n[:max(3, len(n) - 2)]] + [e[:5] for e in SIN[n]]
            if not any(k and any(k in r for r in refs) for k in keys):
                hint = " (c'è in scena ma la battuta non lo inquadra né lo usa)" if any(any(k in v for v in vis) for k in keys) else " (non esiste in scena: crealo o scaricalo)"
                E.append(f"beat {i}: la voce dice «{_norm(w)}» ma la battuta non lo mostra{hint}. Inquadralo ('on'), usalo in 'do'/'prop'/'tray', elencalo in 'mostra', oppure mettilo in 'non_mostrare' spiegando perché.")
        for c in cams:
            if isinstance(c, dict) and not c.get("preset") and "keys" not in c:
                E.append(f"beat {i}: un'inquadratura non ha 'preset' (tipo di camera)")
        for a in b.get("cast", []):
            if a.get("id") not in cast: E.append(f"beat {i}: '{a.get('id')}' not in cast")
            for s in [a] + a.get("change", []):
                if s.get("pose") and s["pose"] not in POSES: E.append(f"beat {i}: pose '{s['pose']}' unknown. Use: {', '.join(POSES)}")
                if s.get("face") and s["face"] not in FACES: E.append(f"beat {i}: face '{s['face']}' unknown. Use: {', '.join(FACES)}")
    for cid, sp in cast.items():
        if sp.get("type") not in BUILTIN and "h" not in sp: Wn.append(f"cast {cid}: custom character without outfit fields (h, w, skin, dress/top, hair, hairC...): see references/personaggi.md")
    return E, Wn

def main():
    E, Wn = check(sys.argv[1])
    for w in Wn: print("⚠️ ", w)
    for e in E: print("❌", e)
    print("✅ No errors" if not E else f"Found {len(E)} error(s).")
    return 1 if E else 0

if __name__ == "__main__":
    sys.exit(main())
