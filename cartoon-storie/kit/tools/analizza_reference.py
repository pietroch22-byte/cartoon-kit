"""Reverse engineering automatico di un video reference per ricostruzione nel Mondo di Rick.

Modi d'uso:
    python analizza_reference.py <video_ref.mp4> <nome_storia> [--lang it] [--asr] [--solo-analisi] [--sovrascrivi]
    python analizza_reference.py --confronto <video_ref.mp4> <nostro_video.mp4> [--out <confronto.mp4>]

Produce in `kit/stories/<nome_storia>/reference_analisi/`:
  - `analisi_reference.json`  dati oggettivi per shot (stacchi, flash/whip, camera curve, luce, beat audio)
  - `scheda_reference.md`     scheda REA da compilare con testi 2D, soggetti e regole anti-tremolio
  - `ref_contact.jpg`         contact sheet annotato (in/mid/out + telemetria per shot)
  - `shots/shot_XX_*.jpg`     fotogrammi chiave estratti per ogni inquadratura
  - `sheets/sheet_NNN.jpg`    strisce dense ogni 0.25 s per leggere testi cinetici rapidi
  - `../musica_originale.wav` audio estratto dal reference (se presente)
  - bozza non distruttiva (`<nome>.json`, `mondo_<nome>.js`, `location_<nome>.js`, `grafica_montaggio.js`)
"""

from __future__ import annotations

import argparse
import json
import math
import os
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

TOOLS_DIR = Path(__file__).resolve().parent
KIT_DIR = TOOLS_DIR.parent
STORIES_DIR = KIT_DIR / "stories"

if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))
from camera_misura import fit  # noqa: E402


# ---------------------------------------------------------------------------
# Utility di sistema e video
# ---------------------------------------------------------------------------

def trova_ffmpeg() -> str:
    """Restituisce ffmpeg con priorita' al binario bundled (ha libfreetype/drawtext)."""
    try:
        import imageio_ffmpeg

        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and Path(exe).exists():
            return exe
    except Exception:
        pass
    exe = shutil.which("ffmpeg")
    if not exe:
        raise RuntimeError("ffmpeg non trovato nel venv ne' nel PATH.")
    return exe


def carica_font(size: int = 20) -> ImageFont.ImageFont | ImageFont.FreeTypeFont:
    """Carica un font leggibile cross-platform con fallback PIL default."""
    candidati = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSMono.ttf",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidati:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def formatta_ts(sec: float) -> str:
    return f"{sec:05.2f}s"


def clamp_float(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, float(v)))


# ---------------------------------------------------------------------------
# 1. Lettura fotogrammi e metriche fisiche (optical flow + luma + istogrammi)
# ---------------------------------------------------------------------------

def leggi_video(video_path: Path) -> dict:
    """Estrae frame in scala, istogrammi colore e flusso ottico con camera_misura.fit."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Impossibile aprire il video: {video_path}")

    fps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
    if fps <= 1.0:
        fps = 30.0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1080)
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 1920)

    grays: list[np.ndarray] = []
    thumbs_bgr: list[np.ndarray] = []
    hists: list[np.ndarray] = []
    lumas: list[float] = []
    sats: list[float] = []
    warmths: list[float] = []

    # Risoluzione 270x480 allineata a camera_misura.fit() per metriche in px su base 1080x1920
    tw, th = 270, 480
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        small = cv2.resize(frame, (tw, th), interpolation=cv2.INTER_AREA)
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0, 1], None, [16, 8], [0, 180, 0, 256])
        cv2.normalize(hist, hist, 0, 1, cv2.NORM_MINMAX)

        grays.append(gray)
        thumbs_bgr.append(small)
        hists.append(hist)
        lumas.append(float(np.mean(hsv[:, :, 2])))
        sats.append(float(np.mean(hsv[:, :, 1])))
        # Differenza media R - B per stimare temperatura calda vs fredda
        warmths.append(float(np.mean(small[:, :, 2].astype(np.float32) - small[:, :, 0].astype(np.float32))))

    cap.release()
    n_frames = len(grays)
    if n_frames < 2:
        raise RuntimeError(f"Video troppo corto ({n_frames} frame): {video_path}")

    d1 = np.zeros(n_frames, dtype=np.float32)
    d6 = np.zeros(n_frames, dtype=np.float32)
    hist_corr = np.ones(n_frames, dtype=np.float32)
    tx = np.zeros(n_frames, dtype=np.float32)
    ty = np.zeros(n_frames, dtype=np.float32)
    zoom_k = np.zeros(n_frames, dtype=np.float32)

    for i in range(1, n_frames):
        d1[i] = float(np.mean(cv2.absdiff(grays[i], grays[i - 1])))
        p, q, k = fit(grays[i - 1], grays[i])
        tx[i], ty[i], zoom_k[i] = p, q, k
        i0 = max(0, i - 2)
        i1 = min(n_frames - 1, i + 2)
        hist_corr[i] = float(cv2.compareHist(hists[i0], hists[i1], cv2.HISTCMP_CORREL))

    for i in range(3, n_frames - 3):
        d6[i] = float(np.mean(cv2.absdiff(grays[i + 3], grays[i - 3])))

    return {
        "path": str(video_path),
        "fps": round(fps, 3),
        "width": w,
        "height": h,
        "frames": n_frames,
        "dur": round(n_frames / fps, 3),
        "grays": grays,
        "thumbs_bgr": thumbs_bgr,
        "lumas": np.array(lumas, dtype=np.float32),
        "sats": np.array(sats, dtype=np.float32),
        "warmths": np.array(warmths, dtype=np.float32),
        "d1": d1,
        "d6": d6,
        "hist_corr": hist_corr,
        "tx": tx,
        "ty": ty,
        "zoom_k": zoom_k,
    }


# ---------------------------------------------------------------------------
# 2. Rilevazione tagli, flash, whip e caratterizzazione shot
# ---------------------------------------------------------------------------

def rileva_stacchi(vid: dict) -> tuple[list[tuple[int, int, str]], list[dict]]:
    """Trova i confini reali fra gli shot accorpando transizioni < 0.35 s in un singolo taglio."""
    n = vid["frames"]
    fps = vid["fps"]
    d1, d6 = vid["d1"], vid["d6"]
    corr = vid["hist_corr"]
    lumas = vid["lumas"]

    p82 = float(np.percentile(d6, 82)) if n > 10 else 10.0
    soglia_d6 = max(12.0, p82 * 1.15)
    min_gap = max(3, int(round(0.35 * fps)))

    candidati: list[tuple[int, float, str]] = []
    for i in range(2, n - 2):
        luma_jump = abs(float(lumas[min(n - 1, i + 1)]) - float(lumas[max(0, i - 1)]))
        is_d6_peak = d6[i] >= soglia_d6 and d6[i] >= d6[i - 1] and d6[i] >= d6[i + 1]
        is_flash = (d1[i] > 28.0 or luma_jump > 26.0) and corr[i] < 0.90
        is_hard = d1[i] > 18.0 and corr[i] < 0.78

        if is_flash or is_hard or (is_d6_peak and corr[i] < 0.92):
            score = float(d6[i] + (1.0 - corr[i]) * 40.0 + d1[i] * 0.5)
            if luma_jump > 24.0:
                kind = "flash_o_whip"
            elif d1[i] > 17.0 and corr[i] < 0.80:
                kind = "taglio_secco"
            else:
                kind = "dissolvenza_o_morph"
            candidati.append((i, score, kind))

    # Non-maximum suppression entro min_gap per non creare micro-shot su transizioni di 3-8 frame
    candidati.sort(key=lambda x: x[1], reverse=True)
    scelti: list[tuple[int, str]] = []
    flashes: list[dict] = []
    occupati: list[int] = []

    for idx, _score, kind in candidati:
        vicino = [o for o in occupati if abs(o - idx) < min_gap]
        if vicino:
            if kind == "flash_o_whip":
                flashes.append({"frame": idx, "t": round(idx / fps, 3)})
            continue
        if idx < min_gap or (n - idx) < min_gap:
            continue
        scelti.append((idx, kind))
        occupati.append(idx)
        if kind == "flash_o_whip":
            flashes.append({"frame": idx, "t": round(idx / fps, 3)})

    scelti.sort(key=lambda x: x[0])

    # Costruisci intervalli [f0, f1) e tipo di transizione d'ingresso
    segmenti: list[tuple[int, int, str]] = []
    prev_f = 0
    prev_kind = "inizio"
    for idx, kind in scelti:
        segmenti.append((prev_f, idx, prev_kind))
        prev_f = idx
        prev_kind = kind
    segmenti.append((prev_f, n, prev_kind))

    # Deduplica flashes ordinati per tempo
    flashes_unici = {f["frame"]: f for f in flashes}
    return segmenti, [flashes_unici[k] for k in sorted(flashes_unici)]


def classifica_luce(luma_med: float, warmth_med: float, sat_med: float) -> dict:
    """Converte luma/temperatura del reference in preset indicativo del motore Rick."""
    if luma_med < 75.0:
        preset = "notte"
        carattere = "scuro_noir"
    elif luma_med < 125.0:
        preset = "crepuscolo" if warmth_med < -4.0 or warmth_med > 10.0 else "interno"
        carattere = "drammatico_medio"
    else:
        preset = "tramonto" if warmth_med > 12.0 else "giorno"
        carattere = "chiaro_aperto"

    tono = "caldo" if warmth_med > 8.0 else ("freddo" if warmth_med < -8.0 else "neutro")
    return {
        "carattere": carattere,
        "luce_consigliata": preset,
        "tono": tono,
        "luma_media": round(luma_med, 1),
        "saturazione_media": round(sat_med, 1),
        "calore_r_meno_b": round(warmth_med, 1),
    }


def analizza_shot(idx: int, f0: int, f1: int, stacco_tipo: str, vid: dict) -> dict:
    """Analizza moto camera, forma della curva e luce per un singolo shot."""
    fps = vid["fps"]
    pad = 2 if (f1 - f0) > 8 else 0
    a, b = f0 + pad, max(f0 + pad + 1, f1 - pad)

    tx_s = vid["tx"][a:b] * fps
    ty_s = vid["ty"][a:b] * fps
    kz_s = vid["zoom_k"][a:b] * fps
    speed_s = np.hypot(tx_s, ty_s) + np.abs(kz_s) * 8.0

    pan_x = float(np.median(tx_s))
    pan_y = float(np.median(ty_s))
    zoom_rate = float(np.median(kz_s))
    zoom_cum = float(np.sum(vid["zoom_k"][a:b]))
    vel_med = float(np.median(speed_s))
    vel_picco = float(np.percentile(speed_s, 95))

    n_sp = len(speed_s)
    terzo = max(1, n_sp // 3)
    tot_sp = float(np.sum(speed_s)) + 1e-6
    primo_terzo = float(np.sum(speed_s[:terzo])) / tot_sp
    ultimo_terzo = float(np.sum(speed_s[-terzo:])) / tot_sp

    if vel_picco < 55.0 and abs(zoom_rate) < 3.5:
        forma = "quasi_ferma"
        quota_stima = 0.40
    elif primo_terzo > 0.44:
        forma = "scatto_iniziale_poi_spinta"
        quota_stima = round(clamp_float(1.0 - primo_terzo * 0.72, 0.25, 0.65), 2)
    elif ultimo_terzo > 0.44:
        forma = "accelerazione_finale"
        quota_stima = 0.25
    else:
        forma = "spinta_continua"
        quota_stima = 0.45

    tags: list[str] = []
    if zoom_rate > 3.5 or zoom_cum > 4.0:
        tags.append("zoom_in")
    elif zoom_rate < -3.5 or zoom_cum < -4.0:
        tags.append("zoom_out")
    if pan_x > 35.0:
        tags.append("pan_sx_o_dx")
    elif pan_x < -35.0:
        tags.append("pan_dx_o_sx")
    if abs(pan_y) > 35.0:
        tags.append("tilt_vert")
    if not tags:
        tags.append("statica" if vel_picco < 55.0 else "spostamento_lieve")

    # Eventi interni potenzialmente critici per tremolio.py (SALTO_DI_LUCE / whip mid-shot)
    eventi_interni: list[dict] = []
    lumas = vid["lumas"]
    if (f1 - f0) > int(1.6 * fps):
        for k in range(f0 + 4, f1 - 4):
            jump = abs(float(lumas[k + 1]) - float(lumas[k - 1]))
            if jump > 22.0 and (not eventi_interni or k - eventi_interni[-1]["frame"] > int(0.4 * fps)):
                eventi_interni.append({
                    "frame": k,
                    "t": round(k / fps, 2),
                    "tipo": "salto_luce_o_whip_interno",
                    "delta_luma": round(jump, 1),
                    "nota": "Nel JSON Rick dividi la scena a questo timestamp per evitare SALTO_DI_LUCE in tremolio.py",
                })

    luma_med = float(np.median(vid["lumas"][f0:f1]))
    warmth_med = float(np.median(vid["warmths"][f0:f1]))
    sat_med = float(np.median(vid["sats"][f0:f1]))

    return {
        "id": f"s{idx:02d}",
        "indice": idx,
        "frame_da": f0,
        "frame_a": f1,
        "da": round(f0 / fps, 3),
        "a": round(f1 / fps, 3),
        "dur": round((f1 - f0) / fps, 3),
        "stacco_iniziale": stacco_tipo,
        "camera": {
            "movimento": "+".join(tags),
            "pan_x_px_s": round(pan_x, 1),
            "pan_y_px_s": round(pan_y, 1),
            "zoom_pct_s": round(zoom_rate, 2),
            "zoom_totale_pct": round(zoom_cum, 2),
            "vel_med_px_s": round(vel_med, 1),
            "vel_picco_px_s": round(vel_picco, 1),
            "primo_terzo_energia": round(primo_terzo, 2),
            "forma": forma,
            "curva_riquadro_quota_stimata": quota_stima,
        },
        "luce": classifica_luce(luma_med, warmth_med, sat_med),
        "eventi_interni": eventi_interni,
    }


# ---------------------------------------------------------------------------
# 3. Audio: estrazione WAV, stima BPM / beat e opzionale ASR
# ---------------------------------------------------------------------------

def estrai_audio_e_beat(
    video_path: Path,
    story_dir: Path,
    shots: list[dict],
    ffmpeg_bin: str,
    run_asr: bool = False,
    lang: str = "it",
) -> dict:
    """Estrae musica_originale.wav e stima BPM + picchi ritmici vicini ai tagli."""
    wav_path = story_dir / "musica_originale.wav"
    cmd = [
        ffmpeg_bin,
        "-y",
        "-i",
        str(video_path),
        "-vn",
        "-ac",
        "2",
        "-ar",
        "44100",
        "-acodec",
        "pcm_s16le",
        str(wav_path),
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode != 0 or not wav_path.exists() or wav_path.stat().st_size < 1024:
        if wav_path.exists() and wav_path.stat().st_size < 1024:
            wav_path.unlink(missing_ok=True)
        return {"presente": False, "nota": "Nessuna traccia audio rilevata nel reference."}

    with wave.open(str(wav_path), "rb") as wf:
        sr = wf.getframerate()
        nc = wf.getnchannels()
        nframes = wf.getnframes()
        raw = wf.readframes(nframes)

    samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32)
    if nc > 1:
        samples = samples.reshape(-1, nc).mean(axis=1)
    samples /= 32768.0
    dur = len(samples) / float(sr)

    # Curva di inviluppo ogni 20 ms per trovare picchi percussivi e BPM
    hop = max(1, int(0.02 * sr))
    n_win = len(samples) // hop
    if n_win < 20:
        return {"presente": True, "wav": str(wav_path), "durata_s": round(dur, 3), "bpm_stimato": None}

    trimmed = samples[: n_win * hop].reshape(n_win, hop)
    rms = np.sqrt(np.mean(trimmed * trimmed, axis=1) + 1e-10)
    log_env = np.log1p(rms * 25.0)
    flux = np.maximum(0.0, np.diff(log_env, prepend=log_env[0]))
    hop_s = hop / float(sr)

    # Autocorrelazione nel range realistico 65..185 BPM
    lag_min = max(1, int(round((60.0 / 185.0) / hop_s)))
    lag_max = min(n_win // 2, int(round((60.0 / 65.0) / hop_s)))
    bpm_est = None
    if lag_max > lag_min + 2:
        f_zero = flux - np.mean(flux)
        best_lag, best_val = lag_min, -1.0
        for lag in range(lag_min, lag_max + 1):
            val = float(np.dot(f_zero[:-lag], f_zero[lag:]))
            if val > best_val:
                best_val = val
                best_lag = lag
        bpm_est = round(60.0 / (best_lag * hop_s), 1)

    # Picchi di flusso principali (distanziati almeno 0.22 s)
    soglia_p = float(np.mean(flux) + 1.2 * np.std(flux))
    picchi_t: list[float] = []
    min_sep = max(1, int(round(0.22 / hop_s)))
    for i in range(1, len(flux) - 1):
        if flux[i] > soglia_p and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1]:
            if not picchi_t or (i * hop_s - picchi_t[-1]) >= min_sep * hop_s:
                picchi_t.append(round(i * hop_s, 3))

    tagli_t = [s["da"] for s in shots[1:]]
    sync_tagli: list[dict] = []
    for t_cut in tagli_t:
        if not picchi_t:
            break
        vicino = min(picchi_t, key=lambda bt: abs(bt - t_cut))
        err = round(vicino - t_cut, 3)
        if abs(err) <= 0.14:
            sync_tagli.append({"taglio_s": t_cut, "beat_s": vicino, "scarto_s": err})

    out = {
        "presente": True,
        "wav": str(wav_path),
        "durata_s": round(dur, 3),
        "bpm_stimato": bpm_est,
        "picchi_principali_s": picchi_t[:60],
        "tagli_su_beat": sync_tagli,
    }

    if run_asr:
        words_path = story_dir / "words.json"
        asr_cmd = [sys.executable, str(TOOLS_DIR / "asr_words.py"), str(wav_path), str(words_path), "--lang", lang]
        asr_res = subprocess.run(asr_cmd, text=True)
        if asr_res.returncode != 0:
            raise RuntimeError(f"ASR fallito su {wav_path} (exit {asr_res.returncode}).")
        out["words_json"] = str(words_path)

    return out


# ---------------------------------------------------------------------------
# 4. Generazione fogli visivi: shots/, ref_contact.jpg, sheets/
# ---------------------------------------------------------------------------

def _pil_da_bgr(bgr: np.ndarray) -> Image.Image:
    return Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))


def _disegna_badge(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, font, bg=(12, 14, 18), fg=(245, 248, 255)) -> None:
    x, y = xy
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.rectangle((x, y, x + tw + 12, y + th + 8), fill=bg)
    draw.text((x + 6, y + 4), text, fill=fg, font=font)


def genera_fogli_visivi(vid: dict, shots: list[dict], analisi_dir: Path) -> dict:
    """Salva frame chiave per shot, ref_contact.jpg annotato e filmstrip dense ogni 0.25 s."""
    shots_dir = analisi_dir / "shots"
    sheets_dir = analisi_dir / "sheets"
    shots_dir.mkdir(parents=True, exist_ok=True)
    sheets_dir.mkdir(parents=True, exist_ok=True)

    thumbs = vid["thumbs_bgr"]  # 270x480
    fps = vid["fps"]
    font_h = carica_font(19)
    font_s = carica_font(15)

    fw, fh = 270, 480
    head_h = 54
    row_w = fw * 3
    contact = Image.new("RGB", (row_w, len(shots) * (fh + head_h)), (18, 20, 26))
    draw_c = ImageDraw.Draw(contact)

    shot_paths: list[dict] = []
    for idx_row, sh in enumerate(shots):
        f0, f1 = sh["frame_da"], sh["frame_a"]
        span = max(1, f1 - f0)
        f_in = min(f1 - 1, f0 + max(0, int(span * 0.12)))
        f_mid = min(f1 - 1, f0 + span // 2)
        f_out = min(f1 - 1, f0 + max(0, int(span * 0.88)))

        p_in = shots_dir / f"{sh['id']}_in.jpg"
        p_mid = shots_dir / f"{sh['id']}_mid.jpg"
        p_out = shots_dir / f"{sh['id']}_out.jpg"
        for f_idx, dst in ((f_in, p_in), (f_mid, p_mid), (f_out, p_out)):
            cv2.imwrite(str(dst), thumbs[f_idx], [int(cv2.IMWRITE_JPEG_QUALITY), 90])

        shot_paths.append({"in": str(p_in), "mid": str(p_mid), "out": str(p_out)})

        y0 = idx_row * (fh + head_h)
        draw_c.rectangle((0, y0, row_w, y0 + head_h), fill=(28, 32, 42))
        cam = sh["camera"]
        luce = sh["luce"]
        linea1 = (
            f"#{sh['indice']:02d}  {sh['da']:.2f}-{sh['a']:.2f}s ({sh['dur']:.2f}s) | "
            f"stacco: {sh['stacco_iniziale']} | luce: {luce['carattere']} ({luce['luce_consigliata']})"
        )
        linea2 = (
            f"cam: {cam['movimento']} | {cam['forma']} | zoom {cam['zoom_totale_pct']:+.1f}% "
            f"({cam['zoom_pct_s']:+.1f}%/s) | picco {cam['vel_picco_px_s']:.0f} px/s | quota~{cam['curva_riquadro_quota_stimata']:.2f}"
        )
        draw_c.text((12, y0 + 6), linea1, fill=(255, 225, 130), font=font_h)
        draw_c.text((12, y0 + 30), linea2, fill=(215, 226, 242), font=font_s)

        for col, (lbl, f_idx) in enumerate((("IN", f_in), ("MID", f_mid), ("OUT", f_out))):
            im = _pil_da_bgr(thumbs[f_idx])
            x_col = col * fw
            contact.paste(im, (x_col, y0 + head_h))
            _disegna_badge(draw_c, (x_col + 8, y0 + head_h + 8), f"{lbl} {f_idx / fps:.2f}s", font_s)

    contact_path = analisi_dir / "ref_contact.jpg"
    contact.save(contact_path, quality=92)

    # Strisce dense ogni 0.25 s (griglia 4x2 = 2.0 s per immagine) per testi cinetici rapidi
    step_f = max(1, int(round(0.25 * fps)))
    sample_indices = list(range(0, vid["frames"], step_f))
    sheet_paths: list[str] = []
    cols, rows_g = 4, 2
    per_sheet = cols * rows_g
    cell_w, cell_h = 225, 400

    for s_idx in range(0, len(sample_indices), per_sheet):
        chunk = sample_indices[s_idx : s_idx + per_sheet]
        sheet = Image.new("RGB", (cols * cell_w, rows_g * cell_h), (14, 15, 20))
        draw_s = ImageDraw.Draw(sheet)
        for pos, f_idx in enumerate(chunk):
            c_idx, r_idx = pos % cols, pos // cols
            im = _pil_da_bgr(thumbs[f_idx]).resize((cell_w, cell_h), Image.Resampling.LANCZOS)
            x0, y0 = c_idx * cell_w, r_idx * cell_h
            sheet.paste(im, (x0, y0))
            _disegna_badge(draw_s, (x0 + 6, y0 + 6), f"f{f_idx}  {f_idx / fps:.2f}s", font_s)
        sp = sheets_dir / f"sheet_{len(sheet_paths) + 1:03d}.jpg"
        sheet.save(sp, quality=90)
        sheet_paths.append(str(sp))

    return {
        "ref_contact": str(contact_path),
        "shots": shot_paths,
        "sheets": sheet_paths,
    }


# ---------------------------------------------------------------------------
# 5. Specifica machine-readable + scheda REA markdown
# ---------------------------------------------------------------------------

def scrivi_specifiche(analisi_dir: Path, payload: dict) -> tuple[Path, Path]:
    """Salva analisi_reference.json e la scheda operativa markdown scheda_reference.md."""
    json_path = analisi_dir / "analisi_reference.json"
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    vid = payload["video"]
    aud = payload["audio"]
    shots = payload["shots"]
    righe_tab: list[str] = [
        "| # | Tempo (dur) | Stacco | Moto camera / Curva | Luce | Testi 2D cinetici (DA OSSERVARE) | Soggetto / Azione 3D (DA OSSERVARE) |",
        "|---|---|---|---|---|---|---|",
    ]
    avvisi: list[str] = []

    for sh in shots:
        c = sh["camera"]
        l = sh["luce"]
        righe_tab.append(
            f"| {sh['id']} | {sh['da']:.2f}-{sh['a']:.2f}s ({sh['dur']:.2f}s) | {sh['stacco_iniziale']} | "
            f"`{c['movimento']}` ({c['forma']}, zoom {c['zoom_totale_pct']:+.1f}%, q~{c['curva_riquadro_quota_stimata']:.2f}) | "
            f"{l['luce_consigliata']} ({l['tono']}) | _TODO da ref_contact/sheets_ | _TODO: posa, sguardi, prop Rick_ |"
        )
        for ev in sh["eventi_interni"]:
            avvisi.append(f"- `{sh['id']}` @ **{ev['t']:.2f}s**: {ev['tipo']} (delta luma {ev['delta_luma']}) — {ev['nota']}")

    md_lines = [
        f"# Scheda Reverse Engineering Reference — `{payload['nome_storia']}`",
        "",
        "## Telemetria misurata",
        f"- Video: `{vid['path']}` ({vid['width']}x{vid['height']} @ {vid['fps']} fps, durata **{vid['dur']:.2f} s**, {vid['frames']} frame)",
        f"- Shot rilevati: **{len(shots)}** | Flash/whip sui tagli: **{len(payload['flashes'])}**",
        (
            f"- Audio: `musica_originale.wav` ({aud.get('durata_s')} s, BPM stimato: **{aud.get('bpm_stimato')}**, "
            f"tagli su beat: **{len(aud.get('tagli_su_beat', []))}**)"
            if aud.get("presente")
            else "- Audio: nessun stream audio nel video reference."
        ),
        f"- Foglio generale: `{payload['immagini']['ref_contact']}`",
        f"- Strisce dense (0.25 s): `{len(payload['immagini']['sheets'])}` file in `reference_analisi/sheets/`",
        "",
        "## Tabella shot REA (prima osserva `ref_contact.jpg` e `sheets/`, poi compila)",
        *righe_tab,
        "",
        "## Regole critiche Mondo di Rick",
        "1. Mantieni 1:1 dal reference: durata esatta degli shot, timestamp tagli, `musica_originale.wav`, gerarchia testi 2D post-DOF (`mondo_<nome>.js` + `grafica_montaggio.js`) e ritmo `curva_riquadro`.",
        "2. Traduci nel nostro motore: cast Rick (`PN8`, `cast_rick.js`), materiali opachi (`roughness >= 0.74`, `metalness <= 0.08`), set chiusi (4 muri + soffitto), max 3 PointLight interne (2 esterne), outline 3D attivo + `userData.card = true` su insegne/cartelli.",
        "3. Anti-tremolio: cambi font in 2D almeno ogni 3 frame (`every = 3`), nessuna camera lineare secca, niente flash/whip a pieno schermo dentro la stessa scena (`SALTO_DI_LUCE` in `tremolio.py` -> sposta o dividi la scena sul timestamp del flash).",
        "",
    ]
    if avvisi:
        md_lines.extend(["## Avvisi eventi interni rilevati (rischio SALTO_DI_LUCE)", *avvisi, ""])

    md_path = analisi_dir / "scheda_reference.md"
    md_path.write_text("\n".join(md_lines), encoding="utf-8")
    return json_path, md_path


# ---------------------------------------------------------------------------
# 6. Generazione bozza non distruttiva per il motore disegnato + Mondo Rick
# ---------------------------------------------------------------------------

def _stima_offset_camera_shot(sh: dict) -> dict:
    """Calcola un piccolo spostamento relativo iniziale/finale della camera coerente con lo shot."""
    c = sh["camera"]
    dur = max(0.35, sh["dur"])
    # Converte zoom cumulativo in variazione distanza z (positivo zoom_in => camera piu' vicina)
    dz = clamp_float(c["zoom_totale_pct"] * 0.025, -1.6, 1.8)
    dx = clamp_float(-c["pan_x_px_s"] * dur * 0.0012, -1.2, 1.2)
    dy = clamp_float(c["pan_y_px_s"] * dur * 0.0008, -0.6, 0.6)
    z0 = round(4.4 + max(0.0, dz * 0.5), 2)
    z1 = round(max(1.8, z0 - dz), 2)
    return {"dx": round(dx, 2), "dy": round(dy, 2), "z0": z0, "z1": z1}


def genera_bozza_storia(payload: dict, story_dir: Path, overwrite: bool = False) -> dict:
    """Crea la struttura iniziale compatibile con `kit/run.py` senza sovrascrivere storie esistenti."""
    nome = payload["nome_storia"]
    shots = payload["shots"]
    luce_base = shots[0]["luce"]["luce_consigliata"] if shots else "notte"
    quote = [sh["camera"]["curva_riquadro_quota_stimata"] for sh in shots]
    quota_med = round(float(np.median(quote)) if quote else 0.40, 2)

    json_target = story_dir / f"{nome}.json"
    mod_mondo = f"mondo_{nome}.js"
    mod_loc = f"location_{nome}.js"
    mod_gfx = "grafica_montaggio.js"

    esiste_gia = json_target.exists() and not overwrite
    if esiste_gia:
        json_target = story_dir / f"{nome}_bozza_ref.json"

    scene_json: list[dict] = []
    for sh in shots:
        off = _stima_offset_camera_shot(sh)
        da, a = sh["da"], sh["a"]
        t_mid = round(da + (a - da) * 0.88, 3)
        scene_json.append({
            "id": sh["id"],
            "titolo": f"Shot {sh['indice']:02d} ({sh['stacco_iniziale']} - {sh['camera']['movimento']})",
            "da": da,
            "a": a,
            "luogo": "studio_rick",
            "attori": [
                {
                    "id": "protagonista",
                    "da": da,
                    "x": 0.0,
                    "y": 0.0,
                    "z": 0.0,
                    "posa": "normale",
                    "faccia": "base",
                    "azioni": [],
                }
            ],
            "camera": [
                {
                    "t": da,
                    "pos": [0.0, 1.55, off["z0"]],
                    "guarda": [0.0, 1.25, 0.0],
                    "fov": 44,
                    "fuoco_su": "protagonista",
                },
                {
                    "t": t_mid,
                    "pos": [off["dx"], round(1.55 + off["dy"], 2), off["z1"]],
                    "guarda": [round(off["dx"] * 0.35, 2), round(1.25 + off["dy"] * 0.3, 2), 0.0],
                    "fov": 42,
                    "fuoco_su": "protagonista",
                },
            ],
        })

    story_obj: dict = {
        "motore": "disegnato",
        "titolo": nome.replace("_", " ").title(),
        "fps": int(round(payload["video"]["fps"])) or 30,
        "personaggi": "rick",
        "luce_rick": True,
        "stile_camera": "rick",
        "sfocatura": "vera",
        "diaframma": 2.0,
        "senza_voce": True,
        "karaoke": False,
        "musica": {
            "mood": "mystery",
            "bpm": int(round(payload["audio"].get("bpm_stimato") or 100)),
            "gain": 0.14,
        },
        "curva_riquadro": {"da": 0.10, "a": 0.40, "quota": quota_med, "coda": 0.30},
        "luoghi": {
            "studio_rick": {
                "esterno": False,
                "luce": luce_base,
                "parametri": {"asciutto": 1},
                "script": mod_mondo,
            }
        },
        "cast": {
            "protagonista": {
                "tipo": "impiegato",
                "seme": 1,
                "maglia": "#3366aa",
            }
        },
        "scene": scene_json,
    }
    if payload["audio"].get("presente"):
        story_obj["audio_reference"] = "musica_originale.wav"

    json_target.write_text(json.dumps(story_obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Crea i tre moduli JS solo se mancanti (o --sovrascrivi) per proteggere codice scritto a mano
    creati = [str(json_target)]
    shots_js = json.dumps(
        [{"id": s["id"], "da": s["da"], "a": s["a"], "mov": s["camera"]["movimento"]} for s in shots],
        indent=2,
        ensure_ascii=False,
    )

    loc_path = story_dir / mod_loc
    if overwrite or not loc_path.exists():
        loc_code = f'''// Set chiuso base stile Rick per {nome}: nessun fondale esposto, materiali opachi (roughness >= 0.74).
export function costruisciLocation(M) {{
  const THREE = M.THREE;
  const floorTex = (() => {{
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 512;
    const g = cv.getContext('2d');
    g.fillStyle = '#2c3444';
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = 'rgba(255,255,255,0.08)';
    g.lineWidth = 2;
    for (let x = 0; x <= 512; x += 64) {{
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke();
    }}
    for (let y = 0; y <= 512; y += 64) {{
      g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke();
    }}
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }})();

  const matPav = new THREE.MeshStandardMaterial({{ map: floorTex, roughness: 0.90, metalness: 0.04 }});
  const matMuri = new THREE.MeshStandardMaterial({{ color: '#242b38', roughness: 0.92, metalness: 0.02 }});

  const pav = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), matPav);
  pav.rotation.x = -Math.PI / 2;
  pav.receiveShadow = true;
  M.root.add(pav);

  // Scatola chiusa (4 muri + soffitto) per azzerare il controllo VUOTO_DIETRO_IL_SET
  const muri = [
    {{ pos: [0, 5, -9], rotY: 0 }},
    {{ pos: [0, 5, 9], rotY: Math.PI }},
    {{ pos: [-9, 5, 0], rotY: Math.PI / 2 }},
    {{ pos: [9, 5, 0], rotY: -Math.PI / 2 }},
  ];
  for (const m of muri) {{
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), matMuri);
    wall.position.set(...m.pos);
    wall.rotation.y = m.rotY;
    M.root.add(wall);
  }}
  const soff = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), matMuri);
  soff.position.set(0, 10, 0);
  soff.rotation.x = Math.PI / 2;
  M.root.add(soff);

  // Massimo 3 PointLight interne per evitare overshoot luci in engine3d
  const key = new THREE.PointLight('#ffd29c', 5.5, 22, 1.4);
  key.position.set(2.2, 3.6, 2.8);
  M.root.add(key);

  const rim = new THREE.PointLight('#64b5ff', 3.8, 22, 1.4);
  rim.position.set(-2.4, 2.8, -2.0);
  M.root.add(rim);
}}
'''
        loc_path.write_text(loc_code, encoding="utf-8")
        creati.append(str(loc_path))

    gfx_path = story_dir / mod_gfx
    if overwrite or not gfx_path.exists():
        gfx_code = f'''// Overlay grafico 2D cinetico per {nome}: eseguito post-DOF su canvas 1080x1920.
// Cambia font solo ogni 3 frame (`every = 3`) per evitare falsi allarmi in tremolio.py.

export const SHOTS_REF = {shots_js};

export const FONT_POOL_CAPS = [
  '900 84px Impact, "Arial Black", sans-serif',
  '800 82px "Trebuchet MS", Verdana, sans-serif',
  '900 84px Georgia, "Times New Roman", serif',
];

export function easeOutQuad(u) {{
  const t = Math.max(0, Math.min(1, u));
  return 1 - (1 - t) * (1 - t);
}}

export function scriviTestoCiclico(g, testo, x, y, fIdx, {{ every = 3, color = '#ffffff', shadow = 'rgba(0,0,0,0.85)' }} = {{}}) {{
  const font = FONT_POOL_CAPS[Math.floor(fIdx / every) % FONT_POOL_CAPS.length];
  g.save();
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = 10;
  g.strokeStyle = 'rgba(10,12,16,0.92)';
  g.shadowColor = shadow;
  g.shadowBlur = 18;
  g.strokeText(testo, x, y);
  g.fillStyle = color;
  g.fillText(testo, x, y);
  g.restore();
}}

export function disegnaOverlay(g, t, fIdx) {{
  // TODO REA: aggiungi i testi cinetici e diagrammi per ciascun timestamp osservato in scheda_reference.md
  // Esempio sicuro (attivo solo dopo aver inserito testo reale):
  // if (t >= 0.0 && t <= 1.2) scriviTestoCiclico(g, 'TESTO SHOT 1', 540, 420, fIdx);
}}
'''
        gfx_path.write_text(gfx_code, encoding="utf-8")
        creati.append(str(gfx_path))

    mondo_path = story_dir / mod_mondo
    if overwrite or not mondo_path.exists():
        mondo_code = f'''// Orchestratore scena Rick + overlay 2D cinetico per {nome}.
import {{ costruisciLocation }} from './{mod_loc}';
import {{ disegnaOverlay }} from './{mod_gfx}';

export async function costruisci(M, D, S, OBJ) {{
  costruisciLocation(M, D, S, OBJ);

  let ultimoT = S?.scene?.[0]?.da || 0;
  M.tick = M.tick || [];
  M.tick.push((t) => {{
    ultimoT = t;
  }});

  const compCv = document.createElement('canvas');
  compCv.width = 1080;
  compCv.height = 1920;
  const g = compCv.getContext('2d');

  let hooked = false;
  const installaHook = () => {{
    if (hooked || typeof window.renderFrame !== 'function') return;
    hooked = true;
    const origRender = window.renderFrame;
    window.renderFrame = async (f, N, fps = S.fps || 30) => {{
      const ret = await origRender(f, N, fps);
      const src = window.mossoCanvas || document.querySelector('canvas');
      if (src) {{
        g.clearRect(0, 0, 1080, 1920);
        g.drawImage(src, 0, 0, 1080, 1920);
        disegnaOverlay(g, ultimoT, f);
        window.mossoCanvas = compCv;
      }}
      return ret;
    }};
  }};

  // Wrap M.attendi garantisce l'aggancio dopo l'assegnazione di window.renderFrame e prima di window.ready = true
  const prevAttendi = M.attendi?.bind(M);
  M.attendi = async () => {{
    if (prevAttendi) await prevAttendi();
    installaHook();
  }};
}}
'''
        mondo_path.write_text(mondo_code, encoding="utf-8")
        creati.append(str(mondo_path))

    return {
        "esiste_gia": esiste_gia,
        "json_scritto": str(json_target),
        "file_creati": creati,
    }


# ---------------------------------------------------------------------------
# 7. Confronto affiancato (hstack) tra reference e video Rick
# ---------------------------------------------------------------------------

def crea_confronto(ref_mp4: Path, ours_mp4: Path, out_mp4: Path) -> Path:
    """Genera un MP4 2160x1920 affiancato REFERENCE | MONDO RICK con etichette e timecode."""
    if not ref_mp4.exists():
        raise FileNotFoundError(f"Video reference non trovato: {ref_mp4}")
    if not ours_mp4.exists():
        raise FileNotFoundError(f"Video finale non trovato: {ours_mp4}")

    ffmpeg_bin = trova_ffmpeg()
    filters_chk = subprocess.run([ffmpeg_bin, "-filters"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True).stdout
    has_drawtext = "drawtext" in filters_chk

    base_scale = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30"
    if has_drawtext:
        left = (
            f"[0:v]{base_scale},"
            "drawtext=text='REFERENCE':x=36:y=48:fontsize=42:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=10[l]"
        )
        right = (
            f"[1:v]{base_scale},"
            "drawtext=text='MONDO RICK  %{pts\\:hms}':x=36:y=48:fontsize=42:fontcolor=#ffe07a:box=1:boxcolor=black@0.65:boxborderw=10[r]"
        )
    else:
        left = f"[0:v]{base_scale}[l]"
        right = f"[1:v]{base_scale}[r]"

    fc = f"{left};{right};[l][r]hstack=inputs=2:shortest=0[v]"
    out_mp4.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        ffmpeg_bin,
        "-y",
        "-i",
        str(ref_mp4),
        "-i",
        str(ours_mp4),
        "-filter_complex",
        fc,
        "-map",
        "[v]",
        "-map",
        "1:a?",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-crf",
        "19",
        "-preset",
        "fast",
        "-c:a",
        "aac",
        str(out_mp4),
    ]
    res = subprocess.run(cmd, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"ffmpeg confronto fallito (exit {res.returncode}).")
    return out_mp4


# ---------------------------------------------------------------------------
# Main CLI
# ---------------------------------------------------------------------------

def _esegui_analisi(args: argparse.Namespace) -> None:
    video_ref = Path(args.video_ref).expanduser().resolve()
    if not video_ref.exists():
        raise FileNotFoundError(f"Video reference non trovato: {video_ref}")
    nome = args.nome_storia.strip()
    if not nome or "/" in nome or "\\" in nome:
        raise ValueError(f"Nome storia non valido: {args.nome_storia!r}")

    stories_root = Path(args.cartella_storie).expanduser().resolve() if args.cartella_storie else STORIES_DIR
    story_dir = stories_root / nome
    analisi_dir = story_dir / "reference_analisi"
    analisi_dir.mkdir(parents=True, exist_ok=True)

    ffmpeg_bin = trova_ffmpeg()
    print(f"[ref] Lettura video: {video_ref}")
    vid = leggi_video(video_ref)
    segmenti, flashes = rileva_stacchi(vid)
    shots = [analizza_shot(i + 1, f0, f1, kind, vid) for i, (f0, f1, kind) in enumerate(segmenti)]

    print(f"[ref] Estratti {len(shots)} shot ({vid['dur']:.2f} s @ {vid['fps']} fps). Analisi audio & contact sheet...")
    audio_info = estrai_audio_e_beat(video_ref, story_dir, shots, ffmpeg_bin, run_asr=args.asr, lang=args.lang)
    immagini_info = genera_fogli_visivi(vid, shots, analisi_dir)

    payload = {
        "nome_storia": nome,
        "video": {k: vid[k] for k in ("path", "fps", "width", "height", "frames", "dur")},
        "flashes": flashes,
        "audio": audio_info,
        "shots": shots,
        "immagini": immagini_info,
    }
    json_spec, md_spec = scrivi_specifiche(analisi_dir, payload)

    print(f"[ref] Specifica: {json_spec}")
    print(f"[ref] Scheda REA: {md_spec}")
    print(f"[ref] Contact sheet: {immagini_info['ref_contact']}")
    if not args.solo_analisi:
        bozza = genera_bozza_storia(payload, story_dir, overwrite=args.sovrascrivi)
        if bozza["esiste_gia"]:
            print(f"[ref] ATTENZIONE: {nome}.json esisteva gia'; scritta bozza sicura in {bozza['json_scritto']}")
        else:
            print(f"[ref] Bozza storia pronta: {bozza['json_scritto']}")


def _esegui_confronto(args: argparse.Namespace) -> None:
    ref_mp4 = Path(args.video_ref).expanduser().resolve()
    ours_mp4 = Path(args.nostro_video).expanduser().resolve()
    out_mp4 = (
        Path(args.out).expanduser().resolve()
        if args.out
        else ours_mp4.with_name(f"{ours_mp4.stem}_vs_reference.mp4")
    )
    res_path = crea_confronto(ref_mp4, ours_mp4, out_mp4)
    print(f"[ref] Confronto salvato: {res_path}")


def main() -> None:
    p = argparse.ArgumentParser(description="Reverse engineering video reference -> Mondo di Rick")
    p.add_argument("--confronto", action="store_true", help="Affianca video reference e video finale Mondo Rick")
    p.add_argument("video_ref", help="Percorso del video reference")
    p.add_argument("secondo", help="Nome storia (modalita' analisi) oppure nostro video MP4 (con --confronto)")
    p.add_argument("terzo_opz", nargs="?", default=None, help="Output opzionale MP4 con --confronto")
    p.add_argument("--out", default=None, help="Percorso MP4 output per --confronto")
    p.add_argument("--lang", default="it", help="Lingua per eventuale --asr (default: it)")
    p.add_argument("--asr", action="store_true", help="Esegue trascrizione parole con asr_words.py")
    p.add_argument("--solo-analisi", action="store_true", help="Genera solo contact sheet e schede senza file bozza")
    p.add_argument("--sovrascrivi", action="store_true", help="Sovrascrive JSON/JS esistenti nella cartella storia")
    p.add_argument("--cartella-storie", default=None, help="Cartella radice alternativa al posto di kit/stories")
    args = p.parse_args()

    if args.confronto:
        args.nostro_video = args.secondo
        args.out = args.out or args.terzo_opz
        _esegui_confronto(args)
    else:
        args.nome_storia = args.secondo
        _esegui_analisi(args)


if __name__ == "__main__":
    main()
