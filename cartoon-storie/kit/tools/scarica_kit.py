"""Scarica il kit di asset (modelli CC0, texture, cieli HDR) dalla release GitHub e lo estrae in asset-kit/.
Uso: python kit/tools/scarica_kit.py [--repo utente/nome] [--dest percorso]"""
import argparse, json, urllib.request, zipfile, io, os
from pathlib import Path
SKILL = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser(); ap.add_argument("--repo", default=os.environ.get("CARTOON_KIT_REPO", "")); ap.add_argument("--dest", default=str(SKILL.parent / "asset-kit"))
a = ap.parse_args()
if not a.repo:
    a.repo = (SKILL / "kit" / "tools" / "kit_repo.txt").read_text().strip()
dest = Path(a.dest); dest.mkdir(parents=True, exist_ok=True)
rel = json.loads(urllib.request.urlopen(f"https://api.github.com/repos/{a.repo}/releases/latest").read())
for asset in rel["assets"]:
    if not asset["name"].endswith(".zip") or (dest / f".{asset['name']}.done").exists():
        continue
    print("scarico", asset["name"], round(asset["size"] / 1e6), "MB", flush=True)
    data = urllib.request.urlopen(asset["browser_download_url"]).read()
    zipfile.ZipFile(io.BytesIO(data)).extractall(dest)
    (dest / f".{asset['name']}.done").write_text("ok")
print("Kit pronto in", dest, "-> imposta CARTOON_KIT se non è accanto alla skill")
