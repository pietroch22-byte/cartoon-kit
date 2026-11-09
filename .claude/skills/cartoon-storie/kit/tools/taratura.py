"""Taratura del look su un fotogramma di riferimento (references/migliora-frame.md).
Rende un solo fotogramma della storia (senza sottotitoli), lo confronta con il riferimento e scrive una riga di log.
Uso: python kit/tools/taratura.py storia.json FRAME riferimento.png ETICHETTA [--passaggi N] [--config cfg.json]
Uscita in out/<storia>/taratura/: <ETICHETTA>.png, _affiancati, _sovrapposti, _differenze e log.csv.
Il riferimento va prima portato a 1080x1920 con kit/tools/ritaglia.py."""
import sys, argparse, subprocess, shutil
from pathlib import Path
SK = Path(__file__).resolve().parents[1]; sys.path.insert(0, str(SK))
from engine import film
from PIL import Image

ap = argparse.ArgumentParser(); ap.add_argument("story"); ap.add_argument("frame", type=int); ap.add_argument("ref"); ap.add_argument("tag")
ap.add_argument("--passaggi", type=int, default=0); ap.add_argument("--config"); a = ap.parse_args()
story = Path(a.story).resolve(); work = Path.cwd() / "out" / story.stem; work.mkdir(parents=True, exist_ok=True)
film.build_timeline(story, work, True)
kit = film.kit_dir(); tdir = work / "taratura"; tmp = tdir / f"_{a.tag}"
shutil.rmtree(tmp, ignore_errors=True)
film.render3d(work, tmp, kit, [a.frame], a.passaggi)
out = tdir / f"{a.tag}.png"; Image.open(tmp / f"f{a.frame:05d}.jpg").save(out); shutil.rmtree(tmp)
T = Path(__file__).parent
subprocess.run([sys.executable, str(T / "confronta.py"), a.ref, str(out), str(tdir / a.tag)], check=True)
subprocess.run([sys.executable, str(T / "metrica.py"), a.ref, str(out), "--log", str(tdir / "log.csv"), "--etichetta", a.tag]
               + (["--config", a.config] if a.config else []), check=True)
print(f"immagini: {tdir}/{a.tag}_affiancati.png  _sovrapposti.png  _differenze.png")
