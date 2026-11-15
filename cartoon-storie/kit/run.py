"""Comando unico della skill cartoon-storie (motore «disegnato»).

    python3 kit/run.py setup                                                installa Python privato e librerie (si può rifare)
    python3 kit/run.py anteprima           /percorso/assoluto/storia.json   fotogrammi chiave + contact sheet + controlli
    python3 kit/run.py video               /percorso/assoluto/storia.json   MP4 1080x1920 con voce, musica, effetti, karaoke
    python3 kit/run.py da-reference        <video.mp4> <nome_storia>        analisi REA + sheet + bozza nel Mondo di Rick
    python3 kit/run.py confronto-reference <ref.mp4> <nostro.mp4> [out.mp4] affianca reference e ricostruzione Mondo Rick

La storia deve avere "motore": "disegnato" (references/storia-disegnato.md). Il render dei fotogrammi usa Node + Playwright
(cd engine3d && npm install && npx playwright install chromium).
"""
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VENV = ROOT / ".venv"
IS_WIN = os.name == "nt"
VPY = VENV / ("Scripts/python.exe" if IS_WIN else "bin/python")
LIBS = "import skia, numpy, PIL, imageio_ffmpeg"
ENV = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1")
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def say(msg):
    print(msg, flush=True)


def fail(msg):
    say("❌ " + msg)
    sys.exit(1)


def vrun(args, quiet=False):
    kw = {"stdout": subprocess.DEVNULL, "stderr": subprocess.DEVNULL} if quiet else {}
    return subprocess.run([str(VPY)] + args, cwd=ROOT, env=ENV, **kw).returncode == 0


def setup():
    if sys.version_info < (3, 9):
        fail(f"Serve Python 3.9 o più recente (questo è {sys.version.split()[0]}).")
    if VENV.exists() and not vrun(["-c", "import sys"], quiet=True):
        say("• Il Python privato (.venv) non funziona su questo computer: lo rifaccio...")
        shutil.rmtree(VENV, ignore_errors=True)
    if not VPY.exists():
        say("• Creo il Python privato in kit/.venv...")
        if subprocess.run([sys.executable, "-m", "venv", str(VENV)]).returncode != 0 or not VPY.exists():
            fail("Non riesco a creare kit/.venv.")
    if not vrun(["-c", LIBS], quiet=True):
        say("• Installo le librerie (solo la prima volta, 2-5 minuti)...")
        vrun(["-m", "pip", "install", "--upgrade", "pip", "-q"])
        if not vrun(["-m", "pip", "install", "-r", "requirements.txt"]) or not vrun(["-c", LIBS], quiet=True):
            fail("Installazione delle librerie non riuscita: controlla internet e rifai setup.")
    say("✓ Python e librerie pronti")
    if not shutil.which("node"):
        say("⚠ Manca Node 18+: serve per il render dei fotogrammi (https://nodejs.org).")
    elif not (ROOT.parent / "engine3d" / "node_modules" / "playwright").exists():
        say("⚠ Manca Playwright: cd engine3d && npm install && npx playwright install chromium")
    else:
        say("✓ Node e Playwright pronti")


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help", "help", "aiuto"):
        say(__doc__); return
    cmd, rest = args[0], args[1:]
    if cmd == "setup":
        setup(); return
    if cmd not in ("anteprima", "video", "da-reference", "confronto-reference"):
        fail(f"Comando sconosciuto «{cmd}». Comandi: setup, anteprima, video, da-reference, confronto-reference.")
    if not VPY.exists() or not vrun(["-c", LIBS], quiet=True):
        say("Setup non ancora fatto: lo faccio adesso..."); setup()
    tool_ref = str(Path(__file__).resolve().parent / "tools" / "analizza_reference.py")
    if cmd == "da-reference":
        if len(rest) < 2 or rest[0] in ("-h", "--help"):
            fail("Uso: python3 kit/run.py da-reference <video_reference.mp4> <nome_storia> [--asr] [--lang it] [--solo-analisi] [--sovrascrivi]")
        video_ref = str(Path(rest[0]).expanduser().resolve())
        sys.exit(0 if vrun([tool_ref, video_ref] + rest[1:]) else 1)
    if cmd == "confronto-reference":
        if len(rest) < 2 or rest[0] in ("-h", "--help"):
            fail("Uso: python3 kit/run.py confronto-reference <video_reference.mp4> <nostro.mp4> [out.mp4]")
        ref_p = str(Path(rest[0]).expanduser().resolve())
        ours_p = str(Path(rest[1]).expanduser().resolve())
        extra = list(rest[2:])
        if extra and not extra[0].startswith("-"):
            extra[0] = str(Path(extra[0]).expanduser().resolve())
        sys.exit(0 if vrun([tool_ref, "--confronto", ref_p, ours_p] + extra) else 1)
    if not rest:
        fail("Quale storia? Esempio: python3 kit/run.py anteprima /percorso/assoluto/kit/stories/pachinko/pachinko.json")
    story = Path(rest[0]).expanduser().resolve()   # percorso assoluto: con un percorso relativo il render fallisce
    if not story.exists():
        fail(f"Storia non trovata: {rest[0]}")
    if json.loads(story.read_text(encoding="utf-8")).get("motore") != "disegnato":
        fail('La storia deve avere "motore": "disegnato" (i formati vecchi non esistono più).')
    sys.exit(0 if vrun(["-m", "engine.film_disegnato", str(story)] + (["--preview"] if cmd == "anteprima" else [])) else 1)


if __name__ == "__main__":
    main()
