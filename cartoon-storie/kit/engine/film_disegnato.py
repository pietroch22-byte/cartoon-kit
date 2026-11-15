"""Video finito con il look «disegnato»: fotogrammi (kit/tools/rendi_disegnato.mjs) + voce dell'utente + musica + karaoke -> MP4.

  python -m engine.film_disegnato stories/<nome>.json [--preview]      (oppure: python kit/run.py disegnato <storia> [--anteprima])

Formato della storia: references/storia-disegnato.md. Niente vignettatura né correzioni colore qui: il look è già finito nei fotogrammi.
"""
import json, re, shutil, subprocess, sys
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


def _scrivi_suoni_md(path, name, total, num):
    """Scrive la scheda riepilogativa dei suoni e dei livelli misurati in out/<nome>/suoni.md."""
    lines = [
        f"# Tabella dei suoni — {name} ({total:.2f} s)",
        "",
        f"- Voce integrata: `{num.get('voce_lufs', 'n/d')} LUFS`",
        f"- Musica sotto voce: `{num.get('musica_sotto_voce_lu', 'n/d')} LU`",
        f"- Ambiente sotto voce: `{num.get('ambiente_sotto_voce_lu', 'n/d')} LU`",
        f"- Effetti sotto voce: `{num.get('effetti_sotto_voce_lu', 'n/d')} LU`",
        f"- Banda bassa musica (20-120 Hz vs resto): `{num.get('musica_banda_bassa_db', 'n/d')} dB`",
        f"- Canali: `{num.get('canali', 1)}` · Silenzi: `{num.get('silenzi', 0)}`",
        "",
    ]
    if num.get("sezioni_musica"):
        lines += ["## Arco musicale (sezioni)", "| Da (s) | A (s) | Mood | BPM | Intensita |", "|---|---|---|---|---|"]
        for sm in num["sezioni_musica"]:
            lines.append(f"| {sm['da']} | {sm['a']} | `{sm['mood']}` | {sm['bpm']} | {sm.get('intensita', 1.0)} |")
        lines.append("")
    if num.get("ambienti"):
        lines += ["## Ambienti e transizioni J-cut / L-cut", "| Ambiente | Da visivo (s) | A visivo (s) | J-cut (s) | L-cut (s) |", "|---|---|---|---|---|"]
        for a in num["ambienti"]:
            lines.append(f"| `{a['tipo']}` | {a['da_visivo']} | {a['a_visivo']} | {a['j_cut_s']} | {a['l_cut_s']} |")
        lines.append("")
    if num.get("effetti_piazzati"):
        lines += ["## Effetti sonori piazzati", "| Tempo (s) | Tipo | Pan |", "|---|---|---|"]
        for t, kind, pan in num["effetti_piazzati"]:
            lines.append(f"| {t} | `{kind}` | {pan} |")
        lines.append("")
    if num.get("sottotitoli"):
        st = num["sottotitoli"]
        lines += [
            "## Leggibilita sottotitoli",
            f"- Blocchi: `{st['chunks']}` · Problemi: `{st['bad']}` · Hold minimo: `{st['min_hold']} s` · Picco: `{st['max_cps']} car/s` · Font minimo: `{st['min_font']} px`",
            "",
        ]
    path.write_text("\n".join(lines), encoding="utf-8")


def _misura_ebur128(ff, path):
    r = subprocess.run([ff, "-hide_banner", "-nostats", "-i", str(path), "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    mi = re.findall(r"^\s+I:\s+(-?[\d.]+)\s+LUFS", r, re.M)
    mp = re.findall(r"^\s+Peak:\s+(-?[\d.]+)\s+dBFS", r, re.M)
    ml = re.findall(r"^\s+LRA:\s+(-?[\d.]+)\s+LU", r, re.M)
    return (float(mi[-1]) if mi else None, float(ml[-1]) if ml else None, float(mp[-1]) if mp else None)


def _guarda_true_peak_aac(ff, work, name, wav, mp4, ln_filter_base, sr):
    """Verifica il True Peak post-AAC (deve restare <= -1.0 dBTP); se sfora, ri-codifica solo l'audio."""
    i_val, lra_val, tp_val = _misura_ebur128(ff, mp4)
    if tp_val is not None:
        log(f"Audio MP4: I={i_val:.1f} LUFS, LRA={lra_val:.1f} LU, Peak={tp_val:.2f} dBTP")
    if tp_val is None or tp_val <= -1.0 or not ln_filter_base:
        return wav, mp4
    ceil = -1.6
    src_wav = work / f"{name}.wav"
    for attempt in range(3):
        ceil = round(ceil - (tp_val + 1.3), 2)
        log(f"True peak {tp_val:.2f} dB > -1.0 dBTP dopo AAC: ri-codifico solo audio (limiter {ceil} dBFS, tentativo {attempt + 1})")
        af = ln_filter_base + f",aresample=192000,alimiter=limit={10 ** (ceil / 20):.4f}:attack=10:release=200:level=disabled:latency=1,aresample={sr}"
        tmp_mp4 = work / f"{name}.tp_tmp.mp4"
        cmd = [ff, "-y", "-loglevel", "error", "-i", str(mp4), "-i", str(src_wav), "-filter_complex", f"[1:a]{af}[a]",
               "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(tmp_mp4)]
        if subprocess.run(cmd).returncode != 0 or not tmp_mp4.exists():
            break
        tmp_mp4.replace(mp4)
        i_val, lra_val, tp_val = _misura_ebur128(ff, mp4)
        if tp_val is not None:
            log(f"Audio MP4 ri-codificato: I={i_val:.1f} LUFS, LRA={lra_val:.1f} LU, Peak={tp_val:.2f} dBTP")
        if tp_val is None or tp_val <= -1.0:
            break
    return wav, mp4


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
    clips, chunks, words_raw = [], [], []
    if v.get("file") and not story.get("senza_voce"):
        clips = [(0.0, K.carica_voce(story_path.parent / v["file"], A.SR))]   # la voce dell'utente non si modifica mai
    sub_res = None
    if v.get("parole"):
        pw = story_path.parent / v["parole"]
        if pw.exists():
            words_raw = json.loads(pw.read_text(encoding="utf-8"))
            words_raw = [w if isinstance(w, list) else [w["start"], w["end"], w["word"]] for w in words_raw]
            if story.get("karaoke", True):
                k_leg = (story.get("karaoke") == "leggibile") or bool(story.get("karaoke_leggibile", False))
                chunks = K.blocchi([(w[2], w[0], w[1]) for w in words_raw], leggibile=k_leg, total=total)
                sub_res = K.controlla_leggibilita(chunks, total=total)
                log(f"Sottotitoli: {sub_res['chunks']} blocchi, {sub_res['bad']} avvisi leggibilita (hold min {sub_res['min_hold']:.2f} s)")
                (work / "lettura_sottotitoli.txt").write_text(
                    "\n".join(
                        [f"{'OK ' if r['ok'] else 'BAD'} [{r['t0']:.2f}->{r['t1']:.2f}s {r['hold']:.2f}s {r['cps']:.1f}c/s {r['font_px']:.0f}px] {r['text']}" + (f" -> {', '.join(r['flags'])}" if r['flags'] else "")
                         for r in sub_res["righe"]]
                    ) + "\n",
                    encoding="utf-8",
                )
    if words_raw:
        story = A.risolvi_oggetto_tempi(story, words_raw)
    m = story.get("musica", {})
    if m == "auto":
        m = {"mood": "mystery", "bpm": 96, "dinamica": True}
    effetti = story.get("effetti", [])
    silenzi = list(story.get("silenzi", []))
    if isinstance(m, dict) and m.get("silenzi"):
        silenzi.extend(m["silenzi"])
    usa_regia = bool(
        story.get("regia_audio")
        or story.get("ambienti")
        or silenzi
        or story.get("j_cut") is not None
        or story.get("l_cut") is not None
        or story.get("mix") == "misurato"
        or any(sc.get("mood") for sc in story.get("scene", []))
        or (isinstance(m, dict) and (m.get("sezioni") or m.get("dinamica") or m.get("lu") is not None))
    )
    if usa_regia:
        sezioni_log = []
        if m is False:
            track = np.zeros(int(total * A.SR), np.float32)
            low_db = -99.0
        else:
            md_base = m.get("mood", "mystery") if isinstance(m, dict) else "mystery"
            bpm_base = m.get("bpm", 96) if isinstance(m, dict) else 96
            din_flag = m.get("dinamica", True) if isinstance(m, dict) else True
            track, low_db, sezioni_log = A.music_regia(
                total,
                mood=md_base,
                bpm=bpm_base,
                sezioni=m.get("sezioni") if isinstance(m, dict) else None,
                silenzi=silenzi,
                bass_guard=m.get("bass_guard", True) if isinstance(m, dict) else True,
                story=story,
                dinamica=din_flag,
            )
        amb_track, amb_log = A.build_ambience(total, story, stereo=True)
        ra = story.get("regia_audio") if isinstance(story.get("regia_audio"), dict) else {}
        mixed, audio_num = A.mix_regia(
            total,
            clips,
            effetti,
            track,
            amb_track=amb_track,
            silenzi=silenzi,
            musica_lu=float((m.get("lu") if isinstance(m, dict) and m.get("lu") is not None else ra.get("musica_lu", -15.5))),
            pausa_db=float((m.get("pausa_db") if isinstance(m, dict) and m.get("pausa_db") is not None else ra.get("pausa_db", 4.5))),
            effetti_lu=float(ra.get("effetti_lu", -8.5)),
            amb_lu=float(ra.get("amb_lu", -25.0)),
            vocal_dip_db=float(ra.get("vocal_dip_db", 2.5)),
            stereo=bool(ra.get("stereo", True)),
            custom={},
        )
        audio_num["ambienti"] = amb_log
        audio_num["sezioni_musica"] = sezioni_log
        audio_num["musica_banda_bassa_db"] = low_db
        if sub_res:
            audio_num["sottotitoli"] = sub_res
        _scrivi_suoni_md(work / "suoni.md", name, total, audio_num)
    else:
        track = np.zeros(int(total * A.SR), np.float32) if m is False else A.music(total, m.get("mood", "mystery"), m.get("bpm", 96))
        mixed = A.mix(total, clips, [(e["t"], e["tipo"]) for e in effetti], track, 0 if m is False else m.get("gain", 0.08), {})   # musica ed effetti a metà della voce o meno
    wav = work / f"{name}.wav"
    A.write_wav(wav, mixed)
    # volume in DUE passaggi (12/11) + limiter 192 kHz anti-picco inter-sample AAC (da lemo-opuscar/mux.sh, 15/11).
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    ln_filter_base = None
    mis = subprocess.run([ff, "-hide_banner", "-nostats", "-i", str(wav), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    try:
        mj = json.loads(mis[mis.rindex("{"):mis.rindex("}") + 1])
        ln_filter_base = (
            f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={mj['input_i']}:measured_TP={mj['input_tp']}:measured_LRA={mj['input_lra']}"
            f":measured_thresh={mj['input_thresh']}:offset={mj['target_offset']}:linear=true"
        )
        lim_ceils = -1.6
        af = ln_filter_base + f",aresample=192000,alimiter=limit={10 ** (lim_ceils / 20):.4f}:attack=10:release=200:level=disabled:latency=1,aresample={A.SR}"
        wn = work / f"{name}_norm.wav"
        if subprocess.run([ff, "-y", "-loglevel", "error", "-i", str(wav), "-af", af, "-ar", str(A.SR), str(wn)]).returncode == 0:
            wav = wn
    except Exception as e:
        log(f"avviso: normalizzazione a due passaggi non riuscita ({e}): resta quella semplice")
    log("[3/3] Karaoke e montaggio")
    mp4 = work / f"{name}.mp4"
    proc = subprocess.Popen([ff, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
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
    if proc.returncode:
        sys.exit("Montaggio ffmpeg fallito.")
    # Guardia post-AAC True Peak <= -1.0 dBTP (da lemo-opuscar/core/render/mux.sh): se AAC sfora -1.0 dBTP, ri-codifica solo l'audio copiando il video.
    wav, mp4 = _guarda_true_peak_aac(ff, work, name, wav, mp4, ln_filter_base, A.SR)
    log(f"Fatto: {mp4}  ({total:.1f} s)")
    return mp4


if __name__ == "__main__":
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    build(a[0], preview="--preview" in sys.argv or "--anteprima" in sys.argv)
