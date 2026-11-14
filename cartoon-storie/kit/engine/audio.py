"""Musica, effetti sonori e mix. Tutto generato in locale: niente crediti, niente diritti. La voce è sempre quella dell'utente (film_disegnato.py la carica)."""
import numpy as np

SR = 44100

def _env(n, attack, decay):
    t = np.arange(n) / SR
    return np.minimum(1.0, t / max(attack, 1e-4)) * np.exp(-t / decay)


def _lowpass(x, cutoff):
    """One-pole lowpass. cutoff can be a number or an array (sweeps)."""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=np.float64), x.shape)
    a = 1.0 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def _note(freq_name):
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    n, octave = freq_name[:-1], int(freq_name[-1])
    return 440.0 * 2 ** ((names[n] + 12 * (octave - 4)) / 12)


def _pluck(freq, dur, bright=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    tone = sum((bright ** (k - 1)) * np.sin(2 * np.pi * freq * k * t) / k for k in range(1, 6))
    return (tone * _env(n, 0.004, 0.18)).astype(np.float32)


# ---------- music ----------

MOODS = {
    # chords as (bass, [arpeggio notes])
    "mystery": [("A2", ["A4", "C5", "E5", "C5"]), ("F2", ["F4", "A4", "C5", "A4"]),
                ("C3", ["E4", "G4", "C5", "G4"]), ("E2", ["E4", "G#4", "B4", "G#4"])],
    "playful": [("C3", ["C5", "E5", "G5", "E5"]), ("A2", ["A4", "C5", "E5", "C5"]),
                ("F2", ["F4", "A4", "C5", "A4"]), ("G2", ["G4", "B4", "D5", "B4"])],
}


def _place(buf, i, clip):
    k = min(len(clip), len(buf) - i)
    if i >= 0 and k > 0:
        buf[i:i + k] += clip[:k]


def music(duration, mood="mystery", bpm=100):
    n = int(duration * SR) + SR
    out = np.zeros(n, np.float32)
    beat = 60.0 / bpm
    chords = MOODS.get(mood, MOODS["mystery"])
    bar, t0 = 0, 0.0
    while t0 < duration + 1:
        bass, arp = chords[bar % len(chords)]
        for b in range(4):  # 4 beats per bar, 8th-note arpeggio
            for half in range(2):
                st = t0 + (b + half * 0.5) * beat
                i = int(st * SR)
                if i >= n:
                    break
                tone = _pluck(_note(arp[(b * 2 + half) % 4]), 0.5, 0.45) * (0.22 if half else 0.3)
                _place(out, i, tone)
                if half:  # soft tick on the off-beat
                    k = int(0.03 * SR)
                    tick = np.random.randn(k).astype(np.float32) * _env(k, 0.001, 0.008) * 0.05
                    _place(out, i, tick)
            if b in (0, 2):
                st = int((t0 + b * beat) * SR)
                k = int(beat * 1.6 * SR)
                tt = np.arange(k) / SR
                f = _note(bass)
                bs = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * _env(k, 0.01, 0.5) * 0.35
                _place(out, st, bs.astype(np.float32))
        bar += 1
        t0 += 4 * beat
    out = out[: int(duration * SR)]
    fade = int(0.8 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out / (np.abs(out).max() + 1e-9)


# ---------- sound effects ----------

def sfx(kind):
    rng = np.random.default_rng(sum(map(ord, kind)))
    if kind == "whoosh":
        n = int(0.45 * SR)
        sweep = np.linspace(300, 4000, n) * np.sin(np.linspace(0, np.pi, n)) + 200
        x = _lowpass(rng.standard_normal(n), sweep) * np.sin(np.linspace(0, np.pi, n)) ** 2
        return (x * 3.0).astype(np.float32)
    if kind == "splash":
        n = int(0.7 * SR)
        x = _lowpass(rng.standard_normal(n), np.linspace(5000, 600, n)) * _env(n, 0.005, 0.18) * 2.5
        t = np.arange(n) / SR
        for k in range(5):  # little bubbles
            st = rng.uniform(0.05, 0.4)
            f0 = rng.uniform(500, 1100)
            bub = np.sin(2 * np.pi * (f0 + 1500 * (t - st)) * (t - st)) * np.exp(-np.maximum(t - st, 0) / 0.04) * (t > st)
            x += bub * 0.25
        return x.astype(np.float32)
    if kind == "pop":
        n = int(0.12 * SR)
        t = np.arange(n) / SR
        return (np.sin(2 * np.pi * (900 - 3000 * t) * t) * _env(n, 0.001, 0.03) * 0.8).astype(np.float32)
    if kind == "sting":  # low brass "dun"
        n = int(1.1 * SR)
        t = np.arange(n) / SR
        saw = sum(np.sin(2 * np.pi * 110 * k * t) / k for k in range(1, 12))
        saw += 0.6 * sum(np.sin(2 * np.pi * 55 * k * t) / k for k in range(1, 8))
        return (_lowpass(saw, np.linspace(1800, 400, n)) * _env(n, 0.02, 0.35) * 0.7).astype(np.float32)
    if kind == "squish":
        n = int(0.35 * SR)
        t = np.arange(n) / SR
        wob = np.sin(2 * np.pi * (180 + 120 * np.sin(2 * np.pi * 18 * t)) * t)
        return (_lowpass(wob + 0.3 * rng.standard_normal(n), 1200) * _env(n, 0.01, 0.1) * 1.4).astype(np.float32)
    if kind == "chalk":
        n = int(0.9 * SR)
        x = rng.standard_normal(n)
        scratch = (np.sin(2 * np.pi * 7 * np.arange(n) / SR) > 0.2).astype(float)
        hp = x - _lowpass(x, 2500)
        return (hp * scratch * _env(n, 0.01, 0.6) * 0.6).astype(np.float32)
    if kind == "chime":
        n = int(1.6 * SR)
        t = np.arange(n) / SR
        x = np.zeros(n)
        for i, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
            st = i * 0.07
            x += np.sin(2 * np.pi * f * (t - st)) * np.exp(-np.maximum(t - st, 0) / 0.5) * (t > st)
        return (x * 0.35).astype(np.float32)
    if kind == "thunder":
        n = int(2.4 * SR)
        t = np.arange(n) / SR
        crack = rng.standard_normal(n) * np.exp(-t / 0.08)
        rumble = _lowpass(rng.standard_normal(n), 120) * 8 * np.exp(-t / 0.9) * (1 + 0.5 * np.sin(2 * np.pi * 3 * t))
        return (crack * 0.8 + rumble).astype(np.float32)
    if kind == "crash":
        n = int(1.0 * SR)
        x = _lowpass(rng.standard_normal(n), np.linspace(6000, 300, n)) * _env(n, 0.002, 0.2) * 2.5
        t = np.arange(n) / SR
        x += np.sin(2 * np.pi * 60 * t) * _env(n, 0.002, 0.25) * 0.8
        return x.astype(np.float32)
    if kind == "rumble":
        n = int(2.0 * SR)
        t = np.arange(n) / SR
        x = _lowpass(rng.standard_normal(n), 90) * 10 * np.sin(np.pi * t / 2.0) * (1 + 0.6 * np.sin(2 * np.pi * 5 * t))
        return x.astype(np.float32)
    if kind == "tick":
        n = int(0.05 * SR)
        x = rng.standard_normal(n) * _env(n, 0.0005, 0.006)
        return (x - _lowpass(x, 3000)).astype(np.float32) * 2
    if kind == "coins":
        n = int(0.9 * SR)
        t = np.arange(n) / SR
        x = np.zeros(n)
        for i in range(7):
            st = i * 0.09 + rng.uniform(0, 0.03)
            f = rng.uniform(2500, 4200)
            x += np.sin(2 * np.pi * f * (t - st)) * np.exp(-np.maximum(t - st, 0) / 0.08) * (t > st)
        return (x * 0.4).astype(np.float32)
    if kind == "ding":
        n = int(1.2 * SR)
        t = np.arange(n) / SR
        return ((np.sin(2 * np.pi * 1318.5 * t) + 0.4 * np.sin(2 * np.pi * 2637 * t)) * np.exp(-t / 0.4) * 0.5).astype(np.float32)
    if kind == "boing":
        n = int(0.5 * SR)
        t = np.arange(n) / SR
        f = 220 + 180 * np.sin(2 * np.pi * 9 * t) * np.exp(-t / 0.2)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(n, 0.003, 0.2) * 0.7).astype(np.float32)
    if kind in ("night_ambience", "pachinko_hall", "sliding", "jackpot", "cash"):   # effetti aggiunti per il Pachinko (riusabili): ambienti e meccanismi
        r = np.random.default_rng(7)
        if kind == "night_ambience":   # città di notte lontana: rumore scuro + ronzio, molto piano
            n = int(6 * SR); t = np.arange(n) / SR; x = np.cumsum(r.normal(0, 1, n)); x -= np.convolve(x, np.ones(800) / 800, "same"); x /= np.max(np.abs(x)) + 1e-9
            x = x * 0.25 + 0.05 * np.sin(2 * np.pi * 60 * t) + 0.03 * np.sin(2 * np.pi * 120 * t)
            return (x * _env(n, 0.8, 1.5) * 2.0).astype(np.float32)
        if kind == "pachinko_hall":   # sala: pioggia fitta di palline d'acciaio + motivetti elettronici
            n = int(6 * SR); t = np.arange(n) / SR; x = np.zeros(n)
            for st in r.uniform(0, 5.9, 900):
                i0 = int(st * SR); L = int(0.03 * SR); tt = np.arange(L) / SR; f = r.uniform(3000, 6500)
                x[i0:i0 + L] += np.sin(2 * np.pi * f * tt)[: n - i0] * np.exp(-tt / 0.006)[: n - i0] * 0.25
            for k, f in enumerate([880, 1175, 1318, 1568, 1318, 1175] * 3):
                st = 0.3 + k * 0.3; m = (t > st) & (t < st + 0.22); x[m] += 0.12 * np.sign(np.sin(2 * np.pi * f * (t[m] - st)))
            return (x * _env(n, 0.3, 1.0) * 0.6).astype(np.float32)
        if kind == "sliding":   # porta automatica: soffio pneumatico che sale e scende
            n = int(1.0 * SR); t = np.arange(n) / SR; x = r.normal(0, 1, n); x = np.convolve(x, np.ones(6) / 6, "same")
            return (x * np.sin(np.pi * t / 1.0) ** 2 * 0.35).astype(np.float32)
        if kind == "jackpot":   # vincita: arpeggio di campanelli che sale
            n = int(1.6 * SR); t = np.arange(n) / SR; x = np.zeros(n)
            for k, f in enumerate([1046.5, 1318.5, 1568, 2093, 2637]):
                st = k * 0.11; m = t > st; x[m] += np.sin(2 * np.pi * f * (t[m] - st)) * np.exp(-(t[m] - st) / 0.35) * 0.3
            return x.astype(np.float32)
        if kind == "cash":   # cassa: scatto meccanico + «ching»
            n = int(1.0 * SR); t = np.arange(n) / SR; x = r.normal(0, 1, n) * np.exp(-t / 0.01) * 0.4
            m = t > 0.06; x[m] += (np.sin(2 * np.pi * 2093 * (t[m] - .06)) + 0.6 * np.sin(2 * np.pi * 3136 * (t[m] - .06))) * np.exp(-(t[m] - .06) / 0.3) * 0.35
            return x.astype(np.float32)
    if kind == "hammer_tap":   # martelletto su crosta di Parmigiano: tocco sordo-armonico legnoso + lieve risonanza metallica
        n = int(0.35 * SR); t = np.arange(n) / SR
        wood = (np.sin(2 * np.pi * 310 * t) + 0.55 * np.sin(2 * np.pi * 620 * t)) * np.exp(-t / 0.045)
        ring = 0.25 * np.sin(2 * np.pi * 1480 * t) * np.exp(-t / 0.09)
        click = rng.normal(0, 1, n) * np.exp(-t / 0.004) * 0.35
        return ((wood + ring + click) * 0.65).astype(np.float32)
    raise ValueError(f"unknown sound effect: {kind}")


def crowd_laugh(clips):
    """Layers a few narrator 'ha ha' takes, shifted in pitch and time, into a small crowd laugh."""
    n = int(1.8 * SR)
    out = np.zeros(n, np.float32)
    for i, (clip, rate) in enumerate([(c, r) for c in clips for r in (0.85, 1.12)]):
        idx = np.arange(0, len(clip) - 1, rate)
        shifted = np.interp(idx, np.arange(len(clip)), clip).astype(np.float32)
        st = int((0.04 * i) * SR)
        k = min(len(shifted), n - st)
        if k > 0:
            out[st:st + k] += shifted[:k] * (0.5 if i % 2 else 0.4)
    out = _lowpass(out.astype(np.float64), 3500).astype(np.float32)
    fade = int(0.4 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out / (np.abs(out).max() + 1e-9)


SFX_GAIN = {"whoosh": 0.35, "splash": 0.45, "pop": 0.4, "sting": 0.5, "squish": 0.4, "chalk": 0.25, "chime": 0.45,
            "thunder": 0.7, "crash": 0.55, "rumble": 0.6, "tick": 0.5, "coins": 0.45, "ding": 0.4, "boing": 0.4,
            "laugh": 0.55}
SFX_TYPES = tuple(SFX_GAIN)


SFX_LEVEL = 0.3  # overall sound-effects level under the narrator


def mix(duration, voice_clips, sfx_events, music_track, music_gain=0.08, custom=None):
    """voice_clips: [(start_sec, pcm)]; sfx_events: [(start_sec, kind)]; custom: {kind: ready-made clip}."""
    custom = custom or {}
    n = int(duration * SR)

    def place(buf, st, clip):
        i = max(0, int(st * SR))
        k = min(len(clip), n - i)
        if k > 0:
            buf[i:i + k] += clip[:k]

    voice = np.zeros(n, np.float32)
    for st, pcm in voice_clips:
        place(voice, st, pcm)
    fx = np.zeros(n, np.float32)
    for st, kind in sfx_events:
        clip = custom[kind] if kind in custom else sfx(kind)
        place(fx, st, clip * SFX_GAIN.get(kind, 0.4) * SFX_LEVEL)
    # duck the music while the narrator talks
    active = _lowpass((np.abs(voice) > 0.02).astype(np.float64), 6.0)
    duck = 1.0 - 0.55 * np.clip(active * 4, 0, 1)
    m = np.zeros(n, np.float32)
    m[: min(n, len(music_track))] = music_track[:n]
    out = voice + fx + m * music_gain * duck
    return (out / (np.abs(out).max() + 1e-9) * 0.95).astype(np.float32)


def write_wav(path, pcm):
    import wave
    data = (np.clip(pcm, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


# ------------------------------------------------------------------ mix MISURATO (11/11, references/regia-suono.md §5)
# Prima la voce (mai toccata), poi la base sotto la voce di "musica_lu" LU misurati mentre si parla (risale di "pausa_db" negli spazi tra le frasi,
# attacco 70 ms / rilascio 450 ms), poi gli effetti a "effetti_lu" LU sotto la voce. Il volume si misura in LUFS veri con ffmpeg (ebur128).
def lufs(x):
    """Loudness integrata (LUFS) di un segnale mono, misurata da ffmpeg. -70 se è silenzio."""
    import subprocess, tempfile, os, re, imageio_ffmpeg
    if not np.any(np.abs(x) > 1e-5):
        return -70.0
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, "x.wav"); write_wav(p, x / max(1.0, float(np.abs(x).max())))
        out = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-nostats", "-i", p, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
        m = re.findall(r"I:\s+(-?[\d.]+) LUFS", out)
        return float(m[-1]) + 20 * np.log10(max(1.0, float(np.abs(x).max()))) if m else -70.0


def _inviluppo(target_db, att=0.07, rel=0.45):
    """Segue un guadagno in dB: scende in fretta (attacco) e risale piano (rilascio)."""
    blk = int(0.01 * SR); nb = (len(target_db) + blk - 1) // blk
    tb = np.array([target_db[i * blk:(i + 1) * blk].min() for i in range(nb)])
    g = np.empty(nb); cur = tb[0]; ka, kr = 1 - np.exp(-0.01 / att), 1 - np.exp(-0.01 / rel)
    for i, v in enumerate(tb):
        cur += (v - cur) * (ka if v < cur else kr); g[i] = cur
    return np.repeat(g, blk)[:len(target_db)]


def mix_misurato(duration, voice_clips, sfx_events, music_track, musica_lu=-15.0, pausa_db=5.0, effetti_lu=-9.0, custom=None):
    """Restituisce (mix, numeri). numeri = livelli misurati, per la tabella dei suoni."""
    custom = custom or {}
    n = int(duration * SR)
    def place(buf, st, clip):
        i = max(0, int(st * SR)); k = min(len(clip), n - i)
        if k > 0: buf[i:i + k] += clip[:k]
    voice = np.zeros(n, np.float32)
    for st, pcm in voice_clips: place(voice, st, pcm)
    fx = np.zeros(n, np.float32)
    for st, kind in sfx_events: place(fx, st, (custom[kind] if kind in custom else sfx(kind)) * SFX_GAIN.get(kind, 0.4))
    m = np.zeros(n, np.float32); m[: min(n, len(music_track))] = music_track[:n]
    parla = _lowpass((np.abs(voice) > 0.02).astype(np.float64), 4.0) > 0.08   # dove la voce è presente (spazi < ~0,25 s chiusi)
    Lv = lufs(voice)
    num = {"voce_lufs": round(Lv, 1)}
    if Lv > -69 and np.any(m):
        # livello della musica mentre si parla = voce + musica_lu (misurato), negli spazi + pausa_db
        Lm = lufs(m[parla]) if parla.sum() > SR else lufs(m)
        g0 = (Lv + musica_lu) - Lm
        m = m * (10 ** (_inviluppo(np.where(parla, g0, g0 + pausa_db)) / 20)).astype(np.float32)
        num["musica_sotto_voce_lu"] = round(lufs(m[parla]) - Lv, 1) if parla.sum() > SR else None
    if Lv > -69 and np.any(fx):
        on = np.abs(fx) > 1e-4; Lf = lufs(fx[on]); fx = fx * np.float32(10 ** (((Lv + effetti_lu) - Lf) / 20))
        num["effetti_sotto_voce_lu"] = round(lufs(fx[on]) - Lv, 1)
    out = voice + fx + m
    pk = float(np.abs(out).max())
    if pk > 0.95: out = out * (0.95 / pk)   # il volume finale lo fa il master in due passaggi (film_disegnato.py)
    return out.astype(np.float32), num
