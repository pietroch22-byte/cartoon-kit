"""Video finito con il look «disegnato»: fotogrammi (kit/tools/rendi_disegnato.mjs) + voce dell'utente + musica + karaoke -> MP4.

  python -m engine.film_disegnato stories/<nome>.json [--preview]      (oppure: python kit/run.py disegnato <storia> [--anteprima])

Formato della storia: references/storia-disegnato.md. Niente vignettatura né correzioni colore qui: il look è già finito nei fotogrammi.
"""
import json, shutil, subprocess, sys
from pathlib import Path

W, H = 1080, 1920
KIT = Path(__file__).resolve().parents[1]


def log(m):
    print(m, flush=True)


def fotogrammi(story_path, work, preview):
    node = shutil.which("node")
    if not node:
        sys.exit("Node non trovato: installa Node 18+ (vedi SKILL.md, «Prima volta»).")
    cmd = [node, str(KIT / "tools" / "rendi_disegnato.mjs"), str(story_path), "--out", str(work)] + (["--anteprima"] if preview else ["--solo-fotogrammi"])
    if subprocess.run(cmd).returncode:
        sys.exit("Render dei fotogrammi fallito (leggi gli errori qui sopra).")


def build(story_path, out=None, preview=False):
    story_path = Path(story_path).resolve()
    name = story_path.stem
    work = Path(out).resolve() if out else Path.cwd() / "out" / name
    work.mkdir(parents=True, exist_ok=True)
    log(f"[1/3] Fotogrammi -> {work}")
    fotogrammi(story_path, work, preview)
    if preview:
        log(f"Anteprima: {work / 'contact.jpg'}")
        return
    import numpy as np, skia, imageio_ffmpeg, os
    from . import audio as A, karaoke as K
    # [utente 12/11] CONTROLLO TREMOLIO severo prima del montaggio (kit/tools/tremolio.py): dettagli fini che friggono, salti di luce.
    # Se trova problemi il video NON si fa (mappe rosse in <out>/tremolio/); TREMOLIO_OK=1 per montarlo lo stesso, sapendolo.
    tr = subprocess.run([sys.executable, str(KIT / "tools" / "tremolio.py"), str(work / "fotogrammi"), str(work / "storia_risolta.json"), "--mappe", str(work / "tremolio")], capture_output=True, text=True)
    (work / "tremolio.txt").write_text(tr.stdout + tr.stderr, encoding="utf-8")
    righe = [r for r in tr.stdout.splitlines() if r.startswith(("TREMOLIO", "SALTO_DI_LUCE"))]
    if tr.returncode:
        log("CONTROLLO TREMOLIO: problemi trovati (dettagli in " + str(work / "tremolio.txt") + ", mappe in " + str(work / "tremolio") + "):\n  " + "\n  ".join(righe))
        if not os.environ.get("TREMOLIO_OK"):
            sys.exit("Video fermato dal controllo tremolio. Correggi (references/problemi-noti.md §6) oppure rilancia con TREMOLIO_OK=1.")
    else:
        log("Controllo tremolio: nessun problema")
    story = json.loads((work / "storia_risolta.json").read_text(encoding="utf-8"))
    fps = story.get("fps", 30)
    total = max(s["a"] for s in story["scene"])
    n = int(round(total * fps))
    log("[2/3] Voce e musica")
    v = story.get("voce") or {}
    clips, chunks = [], []
    if v.get("file") and not story.get("senza_voce"):
        clips = [(0.0, K.carica_voce(story_path.parent / v["file"], A.SR))]   # la voce dell'utente non si modifica mai
    if v.get("parole") and story.get("karaoke", True):
        words = json.loads((story_path.parent / v["parole"]).read_text(encoding="utf-8"))
        chunks = K.blocchi([(w[2], w[0], w[1]) for w in words])
    m = story.get("musica", {})
    track = np.zeros(int(total * A.SR), np.float32) if m is False else A.music(total, m.get("mood", "mystery"), m.get("bpm", 96))
    mixed = A.mix(total, clips, [(e["t"], e["tipo"]) for e in story.get("effetti", [])], track, 0 if m is False else m.get("gain", 0.08), {})   # musica ed effetti a metà della voce o meno
    wav = work / f"{name}.wav"
    A.write_wav(wav, mixed)
    # volume in DUE passaggi (12/11): il loudnorm a un passaggio lasciava picchi oltre 0 dBFS. -14 LUFS, picco ≤ -1,5 dBTP, lineare.
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    mis = subprocess.run([ff, "-hide_banner", "-nostats", "-i", str(wav), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    try:
        mj = json.loads(mis[mis.rindex("{"):mis.rindex("}") + 1])
        af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={mj['input_i']}:measured_TP={mj['input_tp']}:measured_LRA={mj['input_lra']}"
              f":measured_thresh={mj['input_thresh']}:offset={mj['target_offset']}:linear=true")
        wn = work / f"{name}_norm.wav"
        if subprocess.run([ff, "-y", "-loglevel", "error", "-i", str(wav), "-af", af, "-ar", str(A.SR), str(wn)]).returncode == 0: wav = wn
    except Exception as e:
        log(f"avviso: normalizzazione a due passaggi non riuscita ({e}): resta quella semplice")
    log("[3/3] Karaoke e montaggio")
    mp4 = work / f"{name}.mp4"
    proc = subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
                             "-i", str(wav), "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
                             "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(mp4)], stdin=subprocess.PIPE)
    surf = skia.Surface(W, H)
    c = surf.getCanvas()
    # dissolvenza tra luoghi: scena con "passaggio": "dissolvi" (durata "passaggioDur", 0.35 s) sfuma dall'ultimo fotogramma della scena prima
    diss = {}
    for sc in story["scene"]:
        if sc.get("passaggio") == "dissolvi" and sc["da"] > 0:
            f0, nd = int(round(sc["da"] * fps)), max(2, int(round(sc.get("passaggioDur", 0.35) * fps)))
            for j in range(nd):
                diss[f0 + j] = (f0 - 1, 1 - (j + 1) / (nd + 1))
    for f in range(n):
        p = work / "fotogrammi" / f"f{f:05d}.jpg"
        if not p.exists():
            sys.exit(f"Manca il fotogramma {p.name}: rilancia il comando (RESUME=1 riprende da dove si era fermato).")
        c.drawImage(skia.Image.open(str(p)), 0, 0)
        if f in diss:
            pf, al = diss[f]
            c.drawImage(skia.Image.open(str(work / "fotogrammi" / f"f{pf:05d}.jpg")), 0, 0, skia.SamplingOptions(), skia.Paint(Alphaf=al))
        k = K.al_tempo(chunks, f / fps) if chunks else None
        if k:
            K.disegna(c, *k)
        proc.stdin.write(surf.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType).tobytes())
    proc.stdin.close()
    proc.wait()
    log(f"Fatto: {mp4}  ({total:.1f} s)")
    return mp4


if __name__ == "__main__":
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    build(a[0], preview="--preview" in sys.argv or "--anteprima" in sys.argv)
