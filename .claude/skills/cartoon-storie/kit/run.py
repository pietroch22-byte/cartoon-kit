"""One launcher for everything, on Mac and Windows.

    Mac:      python3 run.py <command>
    Windows:  py run.py <command>        (or: python run.py <command>)

Commands:
    setup                        install everything inside this folder (safe to run again)
    check   stories/<name>.json  check a story file for mistakes
    stills  stories/<name>.json  draw 2 still images per shot (fast look check)
    render  stories/<name>.json  make the finished video in out/
    voices                       download all 5 narrator voices and make a sample of each
    anteprima stories/<name>.json   main engine: key frames of every shot and action + contact sheet
    video     stories/<name>.json   main engine: finished MP4 (voice, music, karaoke)
    preview3d stories/<name>.json  3D world with real cameras: 3 frames per beat + contact sheet
    video3d   stories/<name>.json  3D world with real cameras: finished MP4 (voice, music, karaoke)
"""
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VENV = ROOT / ".venv"
IS_WIN = os.name == "nt"
VPY = VENV / ("Scripts/python.exe" if IS_WIN else "bin/python")
DEFAULT_VOICE = "en_US-joe-medium"
ALL_VOICES = ["en_US-joe-medium", "en_US-john-medium", "en_US-bryce-medium", "en_US-norman-medium", "en_US-kristin-medium"]
LIBS = "import skia, numpy, PIL, imageio_ffmpeg"  # piper only for the English TTS fallback
ENV = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1")

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def say(msg):
    print(msg, flush=True)


def fail(msg):
    say("❌ " + msg)
    sys.exit(1)


def vrun(args, quiet=False):
    """Runs the folder's private Python. Returns True if it worked."""
    kw = {"stdout": subprocess.DEVNULL, "stderr": subprocess.DEVNULL} if quiet else {}
    return subprocess.run([str(VPY)] + args, cwd=ROOT, env=ENV, **kw).returncode == 0


def voice_ok(name):
    onnx, cfg = ROOT / "voices" / f"{name}.onnx", ROOT / "voices" / f"{name}.onnx.json"
    return onnx.exists() and onnx.stat().st_size > 20_000_000 and cfg.exists()


def get_voice(name):
    if voice_ok(name):
        return
    say(f"• Downloading narrator voice {name} (about 60 MB, one time)...")
    (ROOT / "voices").mkdir(exist_ok=True)
    for f in (ROOT / "voices").glob(f"{name}.onnx*"):
        f.unlink()  # remove a half-finished download
    if not vrun(["-m", "piper.download_voices", "--download-dir", "voices", name]) or not voice_ok(name):
        fail("Voice download failed. Check your internet, then run setup again (it continues where it stopped).")


def ready():
    return VPY.exists() and vrun(["-c", LIBS], quiet=True)


def restore_skills():
    """Some downloads drop hidden folders. Put .claude/ back from the visible claude-skills/ copy."""
    backup = ROOT / "claude-skills"
    restored = False
    for skill in ("find-story", "make-video"):
        dst = ROOT / ".claude" / "skills" / skill / "SKILL.md"
        if not dst.exists() and (backup / skill / "SKILL.md").exists():
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(backup / skill / "SKILL.md", dst)
            restored = True
    if not (ROOT / ".claude" / "settings.json").exists() and (backup / "settings.json").exists():
        shutil.copy2(backup / "settings.json", ROOT / ".claude" / "settings.json")
        restored = True
    if restored:
        say("✓ Restored the /find-story and /make-video skills (start a new Claude Code session to load them)")


def setup():
    say("== Ricks Claude Workflow: setup ==")
    restore_skills()
    if sys.version_info < (3, 9):
        fail(f"Python 3.9 or newer is needed (this is {sys.version.split()[0]}). See START HERE.pdf, step 2.")
    say(f"✓ Python {sys.version.split()[0]}")

    # A private Python just for this folder. Rebuild it if it came from another computer.
    if VENV.exists() and not vrun(["-c", "import sys"], quiet=True):
        say("• The .venv folder doesn't work on this computer. Rebuilding it...")
        shutil.rmtree(VENV, ignore_errors=True)
    if not VPY.exists():
        say("• Creating a private Python for this folder...")
        if subprocess.run([sys.executable, "-m", "venv", str(VENV)]).returncode != 0 or not VPY.exists():
            fail("Couldn't create the .venv folder. On Linux-style Pythons install the 'venv' package; otherwise reinstall Python from python.org.")

    if not vrun(["-c", LIBS], quiet=True):
        say("• Installing drawing, voice and video libraries (first time only, about 2-5 minutes)...")
        vrun(["-m", "pip", "install", "--upgrade", "pip", "-q"])
        if not vrun(["-m", "pip", "install", "-r", "requirements.txt"]) or not vrun(["-c", LIBS], quiet=True):
            fail("Library install failed. Check your internet and run setup again.")
    say("✓ Libraries ready")

    get_voice(DEFAULT_VOICE)
    say("✓ Narrator voice ready")

    if not vrun(["-c", "import imageio_ffmpeg; imageio_ffmpeg.get_ffmpeg_exe()"], quiet=True):
        fail("Video encoder missing. Run setup again.")
    say("✓ Video encoder ready")

    say("• Self-test: checking the example story...")
    if not vrun(["-m", "engine.check", "stories/handwashing_doctor.json"], quiet=True):
        fail("Self-test failed. Run:  check stories/handwashing_doctor.json  to see why.")
    say("✓ All set. In Claude Code, type  /find-story  to get story ideas.")


def ensure_ready():
    if not ready():
        say("Setup isn't finished yet. Running setup first...")
        setup()


def story_arg(args):
    if not args:
        fail("Which story? Example:  run.py render stories/handwashing_doctor.json")
    p = Path(args[0])
    if not (ROOT / p).exists() and not p.exists():
        fail(f"Story file not found: {args[0]}")
    return args[0]


def voices():
    ensure_ready()
    for v in ALL_VOICES:
        get_voice(v)
    out = ROOT / "samples" / "voices"
    out.mkdir(parents=True, exist_ok=True)
    code = (
        "import sys; from pathlib import Path; from engine import audio as A\n"
        "line = 'In eighteen forty-seven, a young doctor put a bowl of chlorine water by the hospital door.'\n"
        "for name in A.VOICES:\n"
        "    pcm = A.tts(line, A.voice_path(Path('.'), {'name': name}), 1.05)\n"
        "    A.write_wav(Path('samples/voices') / f'{name}.wav', pcm)\n"
        "    print('  made samples/voices/' + name + '.wav', flush=True)\n"
    )
    say("• Making a short sample of each voice...")
    if not vrun(["-c", code]):
        fail("Couldn't make the voice samples.")
    say('✓ Listen to the files in samples/voices/. To use one, set  "voice": {"name": "john"}  in a story file.')


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help", "help"):
        say(__doc__)
        return
    cmd, rest = args[0], args[1:]
    if cmd == "setup":
        setup()
    elif cmd == "voices":
        voices()
    elif cmd == "check":
        ensure_ready()
        sys.exit(0 if vrun(["-m", "engine.check", story_arg(rest)]) else 1)
    elif cmd in ("stills", "render"):
        ensure_ready()
        story = story_arg(rest)
        if not vrun(["-m", "engine.check", story]):
            fail("Fix the ❌ errors above, then run this again.")
        flag = "--stills-only" if cmd == "stills" else "--stills"
        sys.exit(0 if vrun(["-m", "engine.render", story, flag]) else 1)
    elif cmd in ("anteprima", "video"):
        ensure_ready()
        story = story_arg(rest)
        if not vrun(["-m", "engine.check_film", story]):
            fail("Fix the errors above, then run this again.")
        sys.exit(0 if vrun(["-m", "engine.film", story] + (["--preview"] if cmd == "anteprima" else [])) else 1)
    elif cmd in ("preview3d", "video3d"):
        ensure_ready()
        story = story_arg(rest)
        if not vrun(["-m", "engine.check3d", story]):
            fail("Fix the errors above, then run this again.")
        sys.exit(0 if vrun(["-m", "engine.hybrid", story] + (["--preview"] if cmd == "preview3d" else [])) else 1)
    else:
        fail(f"Unknown command '{cmd}'. Run:  run.py help")


if __name__ == "__main__":
    main()
