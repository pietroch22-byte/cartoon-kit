"""Cerca nella libreria per parola (id, nome, tag) senza leggere tutto il manifest: risparmia token.
Uso: python kit/tools/search_library.py frigo pane gatto"""
import json, sys
from pathlib import Path
m = json.loads((Path(__file__).resolve().parents[2] / "library" / "manifest.json").read_text())
SIN = json.loads((Path(__file__).resolve().parents[2] / "library" / "sinonimi_it_en.json").read_text())
QUERIES = []
for a in sys.argv[1:]:
    QUERIES += [a.lower()] + SIN.get(a.lower(), [])
for q in QUERIES:
    hit = [o for o in m["oggetti"] + m.get("luoghi", []) if isinstance(o, dict) and (q in o.get("id", "").lower() or q in o.get("nome", "").lower() or any(q in t for t in o.get("tag", [])))]
    print(f"{q}: " + (", ".join(f'{o["id"]} ({o.get("nome", "")})' for o in hit) or "nessun oggetto 2D"))
o3 = Path(__file__).resolve().parents[2] / "library" / "oggetti3d"
for q in QUERIES:
    hit = []
    for f in sorted(o3.glob("*.json")):
        d = json.loads(f.read_text())
        if q in f.stem.lower() or q in d.get("nome", "").lower() or any(q in t for t in d.get("tag", [])):
            hit.append(f'{f.stem} ({d.get("nome", "")})')
    if hit: print(f"  oggetti 3D costruiti per '{q}': {', '.join(hit)}")
idx = Path(__file__).resolve().parents[2] / "library" / "modelli3d" / "README.md"
if idx.exists():
    names = idx.read_text().split()
    for q in QUERIES:
        mm = [n for n in names if q in n.lower() and len(n) < 40][:12]
        if mm: print(f"  modelli 3D CC0 per '{q}': {' '.join(mm)}")

print("Se manca del tutto: crealo (references/creare-oggetti.md).")

kit = None
import os
for c in (os.environ.get("CARTOON_KIT"), Path(__file__).resolve().parents[3] / "asset-kit", Path(__file__).resolve().parents[2].parent / "asset-kit"):
    if c and (Path(c) / "indice.json").exists(): kit = Path(c); break
if kit:
    idx = json.loads((kit / "indice.json").read_text())["modelli"]
    for q in QUERIES:
        hit = [k for k, v in idx.items() if q in k.lower() or any(q in str(t).lower() for t in (v.get("tag") or []))][:12]
        if hit: print(f"  modelli kit (Poly Haven) per '{q}': {' '.join(hit)}")
