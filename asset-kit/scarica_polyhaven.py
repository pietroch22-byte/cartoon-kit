"""Scarica in locale gli asset CC0 di Poly Haven per il kit della skill e scrive indice.json.
Modelli: tutti (glTF 1k). Texture: superfici utili (pavimenti, muri, terreno, tetti, legno, metallo, tessuti) 1k.
HDRI: cieli e interni selezionati 2k. Riprende da dove si era fermato."""
import json, os, re, sys, urllib.request, concurrent.futures as cf
OUT = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "cartoon-storie-kit/1.0"}
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=180).read()
def save(u, p):
    if os.path.exists(p) and os.path.getsize(p) > 0: return 0
    os.makedirs(os.path.dirname(p), exist_ok=True); d = get(u); open(p + ".part", "wb").write(d); os.replace(p + ".part", p); return len(d)
idx = {"modelli": {}, "texture": {}, "hdri": {}}
def model(k, info):
    f = json.loads(get(f"https://api.polyhaven.com/files/{k}")); g = f["gltf"]["1k"]["gltf"]
    save(g["url"], f"{OUT}/modelli/{k}/{k}.gltf")
    for rel, inc in g.get("include", {}).items(): save(inc["url"], f"{OUT}/modelli/{k}/{rel}")
    return "modelli", k, {"nome": info.get("name"), "categorie": info.get("categories"), "tag": info.get("tags"), "file": f"modelli/{k}/{k}.gltf"}
def texture(k, info):
    f = json.loads(get(f"https://api.polyhaven.com/files/{k}"))
    for key, nm in (("Diffuse", "diff"), ("nor_gl", "nor"), ("arm", "arm")):
        if key in f and "1k" in f[key]: save(f[key]["1k"]["jpg"]["url"], f"{OUT}/texture/{k}/{k}_{nm}.jpg")
    return "texture", k, {"nome": info.get("name"), "categorie": info.get("categories"), "tag": info.get("tags"), "dir": f"texture/{k}"}
def hdri(k, info):
    f = json.loads(get(f"https://api.polyhaven.com/files/{k}")); save(f["hdri"]["2k"]["hdr"]["url"], f"{OUT}/hdri/{k}.hdr")
    return "hdri", k, {"nome": info.get("name"), "categorie": info.get("categories"), "tag": info.get("tags"), "file": f"hdri/{k}.hdr"}
M = json.loads(get("https://api.polyhaven.com/assets?t=models"))
T = json.loads(get("https://api.polyhaven.com/assets?t=textures"))
Hh = json.loads(get("https://api.polyhaven.com/assets?t=hdris"))
tex_ok = re.compile(r"floor|wall|tile|plaster|brick|stone|cobble|grass|ground|dirt|soil|sand|gravel|asphalt|road|roof|wood|plank|bark|metal|rust|concrete|fabric|leather|marble|terrazzo|snow|mud|rock|moss|leaves|carpet|rug|paint", re.I)
hdri_ok = re.compile(r"puresky|sunset|night|moon|interior|room|kitchen|studio|street|square|piazza|town|village|forest|field|beach|park|garden|courtyard|lounge|house|hall|church|market|alley", re.I)
jobs = [(model, k, v) for k, v in M.items() if not os.path.exists(f"{OUT}/modelli/{k}/{k}.gltf")]
print(len(jobs), "asset da scaricare", flush=True)
done = 0
with cf.ThreadPoolExecutor(10) as ex:
    for fut in cf.as_completed([ex.submit(fn, k, v) for fn, k, v in jobs]):
        try:
            kind, k, meta = fut.result(); idx[kind][k] = meta
        except Exception as e:
            print("ERR", e, flush=True)
        done += 1
        if done % 50 == 0:
            print(done, "/", len(jobs), flush=True); pass
pass
print("FINITO", {k: len(v) for k, v in idx.items()}, flush=True)
