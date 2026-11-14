"""Scarica il kit curato di texture PBR (1k JPG diff/nor/arm) e cieli HDRI (2k) da Poly Haven e ambientCG (CC0).
Normalizza tutte le texture in asset-kit/texture/<id>/<id>_{diff,nor,arm}.jpg e aggiorna asset-kit/indice.json.
"""
import concurrent.futures as cf
import io
import json
import os
import urllib.request
import zipfile
import numpy as np
from PIL import Image

OUT = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "cartoon-storie-kit/1.0"}

POLYHAVEN_TEXTURES = {
    "forrest_ground_01": {"uso": "terreno_bosco", "nome": "Forrest Ground 01", "categorie": ["terrain", "outdoor"]},
    "brown_mud_leaves_01": {"uso": "terreno_foglie", "nome": "Brown Mud Leaves 01", "categorie": ["terrain", "outdoor"]},
    "mossy_rock": {"uso": "roccia_muschio", "nome": "Mossy Rock", "categorie": ["rock", "outdoor"]},
    "red_brick": {"uso": "mattoni_rossi", "nome": "Red Brick", "categorie": ["brick", "outdoor"]},
    "cracked_concrete_wall": {"uso": "cemento_crepe", "nome": "Cracked Concrete Wall", "categorie": ["concrete", "outdoor"]},
    "plastered_wall": {"uso": "intonaco_muro", "nome": "Plastered Wall", "categorie": ["plaster", "wall"]},
    "grey_plaster": {"uso": "intonaco_grigio", "nome": "Grey Plaster", "categorie": ["plaster", "wall"]},
    "plastered_stone_wall": {"uso": "muro_pietra_intonaco", "nome": "Plastered Stone Wall", "categorie": ["stone", "plaster", "outdoor"]},
    "laminate_floor_02": {"uso": "laminato_interno", "nome": "Laminate Floor 02", "categorie": ["wood", "floor", "indoor"]},
    "wood_planks": {"uso": "assi_legno", "nome": "Wood Planks", "categorie": ["wood", "indoor", "outdoor"]},
}

AMBIENTCG_TEXTURES = {
    "Grass005": {"uso": "erba_prato_folto", "nome": "Grass 005", "categorie": ["grass", "outdoor"]},
    "Grass004": {"uso": "erba_giardino", "nome": "Grass 004", "categorie": ["grass", "outdoor"]},
    "Grass001": {"uso": "erba_campo", "nome": "Grass 001", "categorie": ["grass", "outdoor"]},
    "Ground037": {"uso": "terra_spoglia", "nome": "Ground 037", "categorie": ["ground", "outdoor"]},
    "Bricks042": {"uso": "mattoni_facciata", "nome": "Bricks 042", "categorie": ["brick", "outdoor"]},
    "Plaster001": {"uso": "intonaco_interno_fine", "nome": "Plaster 001", "categorie": ["plaster", "indoor"]},
    "Plaster002": {"uso": "intonaco_caldo", "nome": "Plaster 002", "categorie": ["plaster", "indoor", "outdoor"]},
    "Plaster007": {"uso": "intonaco_rustico", "nome": "Plaster 007", "categorie": ["plaster", "indoor", "outdoor"]},
    "Wallpaper001A": {"uso": "carta_parati_righe", "nome": "Wallpaper 001A", "categorie": ["wallpaper", "indoor"]},
    "Wallpaper002A": {"uso": "carta_parati_motivo", "nome": "Wallpaper 002A", "categorie": ["wallpaper", "indoor"]},
    "Tiles133A": {"uso": "piastrelle_cucina_chiare", "nome": "Tiles 133A", "categorie": ["tiles", "indoor"]},
    "Tiles139": {"uso": "piastrelle_pavimento", "nome": "Tiles 139", "categorie": ["tiles", "indoor"]},
    "WoodFloor051": {"uso": "parquet_caldo", "nome": "Wood Floor 051", "categorie": ["wood", "floor", "indoor"]},
}

POLYHAVEN_HDRIS = {
    "kloppenheim_06_puresky": {"uso": "giorno_puresky_nubi", "nome": "Kloppenheim 06 (Pure Sky)", "categorie": ["skies", "puresky", "day"]},
    "kloppenheim_02_puresky": {"uso": "giorno_puresky_ampio", "nome": "Kloppenheim 02 (Pure Sky)", "categorie": ["skies", "puresky", "day"]},
    "evening_road_01_puresky": {"uso": "tramonto_puresky", "nome": "Evening Road 01 (Pure Sky)", "categorie": ["skies", "puresky", "sunset"]},
    "qwantani_dusk_2_puresky": {"uso": "crepuscolo_puresky", "nome": "Qwantani Dusk 2 (Pure Sky)", "categorie": ["skies", "puresky", "dusk"]},
    "rogland_clear_night": {"uso": "notte_chiara_stelle", "nome": "Rogland Clear Night", "categorie": ["skies", "night"]},
}


def get(url, timeout=180):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def atomic_write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    part = path + ".part"
    with open(part, "wb") as f:
        f.write(data)
    os.replace(part, path)


def tex_ready(tid):
    d = os.path.join(OUT, "texture", tid)
    return all(os.path.exists(os.path.join(d, f"{tid}_{s}.jpg")) and os.path.getsize(os.path.join(d, f"{tid}_{s}.jpg")) > 0 for s in ("diff", "nor", "arm"))


def download_ph_texture(tid, meta):
    out_dir = os.path.join(OUT, "texture", tid)
    if not tex_ready(tid):
        files = json.loads(get(f"https://api.polyhaven.com/files/{tid}"))
        for key, nm in (("Diffuse", "diff"), ("nor_gl", "nor"), ("arm", "arm")):
            p = os.path.join(out_dir, f"{tid}_{nm}.jpg")
            if os.path.exists(p) and os.path.getsize(p) > 0:
                continue
            entry = files.get(key, {}).get("1k", {}).get("jpg")
            if entry:
                atomic_write(p, get(entry["url"]))
    return "texture", tid, {
        "nome": meta["nome"],
        "uso": meta["uso"],
        "categorie": meta["categorie"],
        "fonte": "Poly Haven (CC0)",
        "dir": f"texture/{tid}",
    }


def _open_gray_from_zip(zf, name, size):
    with Image.open(io.BytesIO(zf.read(name))) as im:
        g = im.convert("L")
        if g.size != size:
            g = g.resize(size, Image.Resampling.BILINEAR)
        return np.asarray(g, dtype=np.uint8)


def download_acg_texture(tid, meta):
    out_dir = os.path.join(OUT, "texture", tid)
    if not tex_ready(tid):
        data = json.loads(get(f"https://ambientcg.com/api/v2/full_json?id={tid}&include=downloadData"))
        assets = data.get("foundAssets") or []
        if not assets:
            raise RuntimeError(f"ambientCG asset non trovato: {tid}")
        zips = assets[0]["downloadFolders"]["default"]["downloadFiletypeCategories"]["zip"]["downloads"]
        pick = next((d for d in zips if d.get("attribute") == "1K-JPG"), None) or next((d for d in zips if "1K" in d.get("attribute", "")), zips[0])
        zbytes = get(pick["fullDownloadPath"])
        with zipfile.ZipFile(io.BytesIO(zbytes)) as zf:
            names = [n for n in zf.namelist() if not n.endswith("/")]
            def find_map(tag):
                tl = tag.lower()
                return next((n for n in names if tl in n.lower() and (n.lower().endswith(".jpg") or n.lower().endswith(".png"))), None)

            col_n = find_map("_Color.") or find_map("Color")
            nor_gl = find_map("_NormalGL.")
            nor_dx = find_map("_NormalDX.")
            ao_n = find_map("_AmbientOcclusion.")
            rgh_n = find_map("_Roughness.")
            met_n = find_map("_Metalness.")

            if not col_n:
                raise RuntimeError(f"Manca Color map nello zip ambientCG di {tid}: {names}")

            with Image.open(io.BytesIO(zf.read(col_n))) as cim:
                rgb = cim.convert("RGB")
                sz = rgb.size
                buf = io.BytesIO()
                rgb.save(buf, format="JPEG", quality=92)
                atomic_write(os.path.join(out_dir, f"{tid}_diff.jpg"), buf.getvalue())

            if nor_gl:
                with Image.open(io.BytesIO(zf.read(nor_gl))) as nim:
                    nrgb = nim.convert("RGB")
                    if nrgb.size != sz:
                        nrgb = nrgb.resize(sz, Image.Resampling.BILINEAR)
                    buf = io.BytesIO()
                    nrgb.save(buf, format="JPEG", quality=92)
                    atomic_write(os.path.join(out_dir, f"{tid}_nor.jpg"), buf.getvalue())
            elif nor_dx:
                with Image.open(io.BytesIO(zf.read(nor_dx))) as nim:
                    arr = np.asarray(nim.convert("RGB"), dtype=np.uint8).copy()
                    arr[:, :, 1] = 255 - arr[:, :, 1]  # DX -> GL
                    nrgb = Image.fromarray(arr, mode="RGB")
                    if nrgb.size != sz:
                        nrgb = nrgb.resize(sz, Image.Resampling.BILINEAR)
                    buf = io.BytesIO()
                    nrgb.save(buf, format="JPEG", quality=92)
                    atomic_write(os.path.join(out_dir, f"{tid}_nor.jpg"), buf.getvalue())
            else:
                flat = Image.new("RGB", sz, (128, 128, 255))
                buf = io.BytesIO()
                flat.save(buf, format="JPEG", quality=90)
                atomic_write(os.path.join(out_dir, f"{tid}_nor.jpg"), buf.getvalue())

            ao = _open_gray_from_zip(zf, ao_n, sz) if ao_n else np.full((sz[1], sz[0]), 255, dtype=np.uint8)
            rgh = _open_gray_from_zip(zf, rgh_n, sz) if rgh_n else np.full((sz[1], sz[0]), 200, dtype=np.uint8)
            met = _open_gray_from_zip(zf, met_n, sz) if met_n else np.zeros((sz[1], sz[0]), dtype=np.uint8)
            arm = Image.fromarray(np.stack([ao, rgh, met], axis=-1), mode="RGB")
            buf = io.BytesIO()
            arm.save(buf, format="JPEG", quality=90)
            atomic_write(os.path.join(out_dir, f"{tid}_arm.jpg"), buf.getvalue())

    return "texture", tid, {
        "nome": meta["nome"],
        "uso": meta["uso"],
        "categorie": meta["categorie"],
        "fonte": "ambientCG (CC0)",
        "dir": f"texture/{tid}",
    }


def download_ph_hdri(hid, meta):
    out_p = os.path.join(OUT, "hdri", f"{hid}.hdr")
    if not (os.path.exists(out_p) and os.path.getsize(out_p) > 0):
        files = json.loads(get(f"https://api.polyhaven.com/files/{hid}"))
        url = files["hdri"]["2k"]["hdr"]["url"]
        atomic_write(out_p, get(url))
    return "hdri", hid, {
        "uso": meta["uso"],
        "nome": meta["nome"],
        "categorie": meta["categorie"],
        "fonte": "Poly Haven (CC0)",
        "file": f"hdri/{hid}.hdr",
    }


def main():
    idx_path = os.path.join(OUT, "indice.json")
    with open(idx_path, "r", encoding="utf-8") as f:
        idx = json.load(f)
    idx.setdefault("texture", {})
    idx.setdefault("hdri", {})

    jobs = []
    for k, m in POLYHAVEN_TEXTURES.items():
        jobs.append((download_ph_texture, k, m))
    for k, m in AMBIENTCG_TEXTURES.items():
        jobs.append((download_acg_texture, k, m))
    for k, m in POLYHAVEN_HDRIS.items():
        jobs.append((download_ph_hdri, k, m))

    print(f"Avvio scaricamento curato: {len(jobs)} asset ({len(POLYHAVEN_TEXTURES)} PH tex, {len(AMBIENTCG_TEXTURES)} ambientCG tex, {len(POLYHAVEN_HDRIS)} HDRI)...", flush=True)
    errors = []
    with cf.ThreadPoolExecutor(max_workers=6) as ex:
        fut_map = {ex.submit(fn, k, m): (fn.__name__, k) for fn, k, m in jobs}
        for fut in cf.as_completed(fut_map):
            fn_name, k = fut_map[fut]
            try:
                kind, asset_id, entry = fut.result()
                idx[kind][asset_id] = entry
                print(f"  OK {kind}/{asset_id}", flush=True)
            except Exception as e:
                errors.append((fn_name, k, str(e)))
                print(f"  ERR {fn_name} {k}: {e}", flush=True)

    with open(idx_path + ".part", "w", encoding="utf-8") as f:
        json.dump(idx, f, indent=2, ensure_ascii=False)
    os.replace(idx_path + ".part", idx_path)

    credit_path = os.path.join(OUT, "CREDITI_PBR.txt")
    with open(credit_path, "w", encoding="utf-8") as f:
        f.write("Asset PBR e Cieli HDRI integrati nel kit (tutti CC0 Public Domain)\n")
        f.write("- Poly Haven (polyhaven.com, CC0): texture 1K JPG (diff/nor/arm) + cieli PureSky / Clear Night HDR 2K.\n")
        f.write("- ambientCG (ambientcg.com, CC0): texture 1K JPG normalizzate in diff/nor/arm (R=AO, G=Roughness, B=Metalness).\n")

    print(f"COMPLETATO: {len(idx['texture'])} texture totali, {len(idx['hdri'])} HDRI totali. Errori: {len(errors)}", flush=True)
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

