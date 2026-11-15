"""Musica, effetti sonori, ambienti J/L-cut, silenzi e mix misurato. Tutto generato in locale: niente crediti, niente diritti.
La voce è sempre quella dell'utente (film_disegnato.py la carica e non la altera)."""
import os
import re
import unicodedata
import numpy as np

SR = 44100


def _t(d, sr=SR):
    return np.arange(max(1, int(round(d * sr)))) / sr


def _env(n, attack, decay):
    t = np.arange(n) / SR
    return np.minimum(1.0, t / max(attack, 1e-4)) * np.exp(-t / max(decay, 1e-4))


def _env_exp(d, tau):
    return np.exp(-_t(d) / max(tau, 1e-4))


def _lowpass(x, cutoff):
    """One-pole lowpass. cutoff can be a number or an array (sweeps)."""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=np.float64), x.shape)
    a = 1.0 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x, dtype=np.float64)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def _bp(x, lo, hi, o=2):
    from scipy.signal import butter, sosfilt
    lo_c = max(10.0, min(float(lo), SR * 0.43))
    hi_c = max(lo_c + 20.0, min(float(hi), SR * 0.46))
    return sosfilt(butter(o, [lo_c, hi_c], "band", fs=SR, output="sos"), x)


def _lp(x, f, o=2):
    from scipy.signal import butter, sosfilt
    fc = max(15.0, min(float(f), SR * 0.46))
    return sosfilt(butter(o, fc, "low", fs=SR, output="sos"), x)


def _hp(x, f, o=2):
    from scipy.signal import butter, sosfilt
    fc = max(10.0, min(float(f), SR * 0.45))
    return sosfilt(butter(o, fc, "high", fs=SR, output="sos"), x)


def _norm(x, p=1.0):
    m = float(np.abs(x).max()) if len(x) else 0.0
    return (x * (p / m)).astype(np.float32) if m > 1e-9 else x.astype(np.float32)


def _brown(n, rng):
    w = np.cumsum(rng.standard_normal(n))
    if n > 1:
        w -= np.linspace(w[0], w[-1], n)
    return _norm(_hp(w, 20.0))


def _compress(x, thr=0.25, ratio=3.5, att=0.004, rel=0.08):
    env = np.zeros_like(x, dtype=np.float64)
    a, r = np.exp(-1.0 / (max(att, 1e-4) * SR)), np.exp(-1.0 / (max(rel, 1e-4) * SR))
    e = 0.0
    ax = np.abs(x)
    for i in range(len(x)):
        c = float(ax[i])
        e = a * e + (1.0 - a) * c if c > e else r * e + (1.0 - r) * c
        env[i] = e
    g = np.where(env > thr, (thr + (env - thr) / ratio) / np.maximum(env, 1e-9), 1.0)
    return (x * g).astype(np.float32)


def _limit(x, ceil=0.92, look=0.005):
    """Look-ahead limiter 1D (o per canale su stereo)."""
    if x.ndim == 2:
        return np.stack([_limit(x[:, c], ceil, look) for c in range(x.shape[1])], axis=1).astype(np.float32)
    from scipy.ndimage import maximum_filter1d, uniform_filter1d
    n = max(1, int(look * SR))
    pk = np.abs(x)
    m = maximum_filter1d(pk, size=2 * n + 1)
    g = np.minimum(1.0, ceil / np.maximum(m, 1e-9))
    g = uniform_filter1d(g, size=n)
    return (x * g).astype(np.float32)


def radio(x):
    """Filtro walkie-talkie / radio: passa-banda 380-2800 Hz + leggera saturazione + lieve fruscio."""
    rng = np.random.default_rng(31)
    y = _bp(np.asarray(x, dtype=np.float64), 380, 2800, 3)
    y = np.tanh(y * 3.0) / np.tanh(3.0)
    hiss = _bp(rng.standard_normal(len(y)), 1000, 4000, 2) * 0.015
    return _norm(y + hiss, 0.9)


def lontano(x, cutoff=950.0, echo_s=0.075, echo_mix=0.22):
    """Suono distante: attenua gli acuti e aggiunge un piccolo rientro di stanza/eco."""
    y = _lp(np.asarray(x, dtype=np.float64), cutoff, 2)
    d = int(echo_s * SR)
    if 0 < d < len(y):
        out = y.copy()
        out[d:] += y[:-d] * echo_mix
        return out.astype(np.float32)
    return y.astype(np.float32)


def _note(freq_name):
    names = {"C": -9, "C#": -8, "Db": -8, "D": -7, "D#": -6, "Eb": -6, "E": -5, "F": -4,
             "F#": -3, "Gb": -3, "G": -2, "G#": -1, "Ab": -1, "A": 0, "A#": 1, "Bb": 1, "B": 2}
    n, octave = freq_name[:-1], int(freq_name[-1])
    return 440.0 * 2 ** ((names[n] + 12 * (octave - 4)) / 12)


def _pluck(freq, dur, bright=0.5):
    n = max(1, int(dur * SR))
    t = np.arange(n) / SR
    tone = sum((bright ** (k - 1)) * np.sin(2 * np.pi * freq * k * t) / k for k in range(1, 6))
    return (tone * _env(n, 0.004, 0.18)).astype(np.float32)


# ---------- resolution of @word timestamps (matching rendi_disegnato.mjs) ----------

def _norm_word(s):
    s = unicodedata.normalize("NFD", str(s).lower())
    return re.sub(r"[^a-z0-9]", "", s)


def risolvi_tempo(val, words):
    """Risolve '@parola', '@parola#2', '@parola+0.25' -> secondi usando words.json."""
    if not isinstance(val, str) or not val.startswith("@"):
        return val
    m = re.match(r"^([^#+\-\d][^#+]*?)(?:#(\d+))?([+-][\d.]+)?$", val[1:])
    if not m:
        raise ValueError(f"tempo non valido: {val}")
    tgt = _norm_word(m.group(1))
    occ = int(m.group(2) or 1)
    off = float(m.group(3) or 0.0)
    hits = [w for w in words if _norm_word(w[2]) == tgt]
    if len(hits) < occ:
        raise ValueError(f"la parola «{m.group(1)}» non è nella voce ({val})")
    return round(float(hits[occ - 1][0]) + off, 3)


def risolvi_oggetto_tempi(obj, words):
    if not words:
        return obj
    if isinstance(obj, list):
        return [risolvi_oggetto_tempi(x, words) for x in obj]
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k in ("t", "da", "a") and isinstance(v, str) and v.startswith("@"):
                out[k] = risolvi_tempo(v, words)
            else:
                out[k] = risolvi_oggetto_tempi(v, words)
        return out
    return obj


# ---------- music (multi-timbro, 13 mood, variazione dinamica) ----------

def _synth_voice(timbro, freq, dur, vel=1.0):
    n = max(1, int(dur * SR))
    t = np.arange(n, dtype=np.float64) / SR
    if timbro == "marimba":
        atk = np.minimum(1.0, t / 0.004)
        body = np.sin(2 * np.pi * freq * t) * np.exp(-t / max(0.08, dur * 0.42))
        over = 0.28 * np.sin(2 * np.pi * 4.0 * freq * t) * np.exp(-t / 0.032)
        click_ = 0.08 * np.sin(2 * np.pi * 1200 * t) * np.exp(-t / 0.004)
        return ((body + over + click_) * atk * vel).astype(np.float32)
    if timbro == "vibraphone":
        atk = np.minimum(1.0, t / 0.006)
        vib = 1.0 + 0.14 * np.sin(2 * np.pi * 5.2 * t)
        s = (np.sin(2 * np.pi * freq * t) * np.exp(-t / max(0.25, dur * 0.75))
             + 0.22 * np.sin(2 * np.pi * 2.756 * freq * t) * np.exp(-t / 0.14))
        return (s * atk * vib * vel).astype(np.float32)
    if timbro == "piano_felt":
        atk = np.minimum(1.0, t / 0.010)
        tau = max(0.18, dur * 0.65)
        h = sum((0.55 ** (k - 1)) * np.sin(2 * np.pi * freq * k * t) * np.exp(-t * (1 + 0.35 * (k - 1)) / tau)
                for k in range(1, 5))
        return (h * atk * vel * 0.75).astype(np.float32)
    if timbro == "bell":
        atk = np.minimum(1.0, t / 0.003)
        b = (np.sin(2 * np.pi * freq * t) * np.exp(-t / max(0.22, dur * 0.7))
             + 0.35 * np.sin(2 * np.pi * 2.76 * freq * t) * np.exp(-t / 0.16)
             + 0.15 * np.sin(2 * np.pi * 5.40 * freq * t) * np.exp(-t / 0.08))
        return (b * atk * vel * 0.7).astype(np.float32)
    if timbro == "pad":
        atk = np.minimum(1.0, t / min(0.30, dur * 0.45))
        rel = np.minimum(1.0, np.maximum(0.0, (dur - t) / min(0.35, dur * 0.45)))
        w = (0.55 * np.sin(2 * np.pi * freq * t)
             + 0.40 * np.sin(2 * np.pi * freq * 1.0035 * t + 0.7)
             + 0.25 * np.sin(2 * np.pi * freq * 2.0 * 0.997 * t + 1.4))
        return (w * atk * rel * vel * 0.48).astype(np.float32)
    if timbro == "staccato":
        atk = np.minimum(1.0, t / 0.003)
        s = (np.sin(2 * np.pi * freq * t)
             + 0.35 * np.sin(2 * np.pi * 3 * freq * t) * np.exp(-t / 0.04)
             + 0.18 * np.sin(2 * np.pi * 5 * freq * t) * np.exp(-t / 0.025))
        return (s * atk * np.exp(-t / 0.11) * vel * 0.85).astype(np.float32)
    # default: warm pluck
    atk = np.minimum(1.0, t / 0.004)
    tone = sum((0.52 ** (k - 1)) * np.sin(2 * np.pi * freq * k * t) * np.exp(-t * (1 + 0.35 * (k - 1)) / 0.22)
               for k in range(1, 6))
    return (tone * atk * vel).astype(np.float32)


def _synth_bass(freq, dur, punch=False):
    n = max(1, int(dur * SR))
    t = np.arange(n, dtype=np.float64) / SR
    # Bassi non sotto ~55 Hz (MIDI >= 33) ma con 2a e 3a armonica chiare per telefono (TECHNIQUE.md §5)
    f = max(55.0, float(freq))
    tau = 0.24 if punch else 0.50
    sig = (0.78 * np.sin(2 * np.pi * f * t)
           + 0.36 * np.sin(2 * np.pi * 2 * f * t)
           + 0.18 * np.sin(2 * np.pi * 3 * f * t))
    env = np.minimum(1.0, t / 0.008) * np.exp(-t / tau)
    return (sig * env * 0.33).astype(np.float32)


def _soft_perc(kind, rng):
    if kind == "kick":
        n = int(0.14 * SR)
        t = np.arange(n) / SR
        f = 95.0 * np.exp(-t / 0.035) + 48.0
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(n, 0.002, 0.06) * 0.16).astype(np.float32)
    if kind == "brush":
        n = int(0.06 * SR)
        x = _bp(rng.standard_normal(n), 2200, 6200, 2)
        return _norm(x, 0.05) * _env(n, 0.002, 0.018)
    # rim / soft tick
    n = int(0.03 * SR)
    x = rng.standard_normal(n) * _env(n, 0.001, 0.008) * 0.055
    return x.astype(np.float32)


# Ogni mood definisce accordi + timbro principale, controcanto sulle battute pari, pattern e carattere ritmico
MOOD_SPEC = {
    "mystery": {
        "chords": [("A2", ["A4", "C5", "E5", "C5"]), ("F2", ["F4", "A4", "C5", "A4"]),
                   ("C3", ["E4", "G4", "C5", "G4"]), ("E2", ["E4", "G#4", "B4", "G#4"])],
        "lead": "piano_felt", "top": "vibraphone", "pattern": [0, 1, 2, 3, 2, 1], "perc": "tick", "bass_punch": False,
    },
    "playful": {
        "chords": [("C3", ["C5", "E5", "G5", "E5"]), ("A2", ["A4", "C5", "E5", "C5"]),
                   ("F2", ["F4", "A4", "C5", "A4"]), ("G2", ["G4", "B4", "D5", "B4"])],
        "lead": "marimba", "top": "pluck", "pattern": [0, 2, 1, 3, 0, 2, 3, 1], "perc": "tick", "bass_punch": True,
    },
    "curious": {
        "chords": [("D3", ["D5", "F5", "A5", "F5"]), ("G2", ["D5", "G5", "B5", "G5"]),
                   ("C3", ["E5", "G5", "C6", "G5"]), ("A2", ["C#5", "E5", "A5", "E5"])],
        "lead": "marimba", "top": "vibraphone", "pattern": [0, 1, 3, 2, 1, 3], "perc": "brush", "bass_punch": True,
    },
    "tense": {
        "chords": [("E3", ["E4", "G4", "Bb4", "G4"]), ("C3", ["Eb4", "G4", "C5", "G4"]),
                   ("B2", ["D4", "F#4", "B4", "F#4"]), ("E3", ["E4", "G4", "B4", "E5"])],
        "lead": "staccato", "top": "pad", "pattern": [0, 0, 1, 2, 0, 3, 2, 1], "perc": "tick", "bass_punch": True,
    },
    "chase": {
        "chords": [("A2", ["A4", "C5", "E5", "A5"]), ("G2", ["G4", "B4", "D5", "G5"]),
                   ("F2", ["F4", "A4", "C5", "F5"]), ("E2", ["E4", "G#4", "B4", "E5"])],
        "lead": "staccato", "top": "marimba", "pattern": [0, 1, 2, 3, 3, 2, 1, 0], "perc": "kick", "bass_punch": True,
    },
    "heist": {
        "chords": [("C3", ["C5", "Eb5", "G5", "Bb5"]), ("Ab2", ["C5", "Eb5", "Ab5", "Eb5"]),
                   ("F2", ["C5", "F5", "Ab5", "F5"]), ("G2", ["B4", "D5", "G5", "F5"])],
        "lead": "marimba", "top": "vibraphone", "pattern": [0, 2, 3, 1, 0, 3], "perc": "brush", "bass_punch": True,
    },
    "clockwork": {
        "chords": [("C3", ["C5", "G5", "E5", "G5"]), ("G2", ["B4", "G5", "D5", "G5"]),
                   ("A2", ["C5", "A5", "E5", "A5"]), ("F2", ["A4", "F5", "C5", "F5"])],
        "lead": "marimba", "top": "bell", "pattern": [0, 1, 2, 3, 0, 1, 2, 3], "perc": "tick", "bass_punch": False,
    },
    "cosmos": {
        "chords": [("D3", ["A4", "D5", "F#5", "A5"]), ("A2", ["E5", "A5", "C#6", "E5"]),
                   ("B2", ["F#5", "B5", "D6", "F#5"]), ("G2", ["D5", "G5", "B5", "G5"])],
        "lead": "pad", "top": "bell", "pattern": [0, 2, 1, 3], "perc": "none", "bass_punch": False,
    },
    "ironic": {
        "chords": [("G2", ["B4", "D5", "G5", "D5"]), ("E2", ["G#4", "B4", "E5", "D5"]),
                   ("A2", ["C5", "E5", "A5", "E5"]), ("D3", ["F#4", "A4", "C5", "D5"])],
        "lead": "staccato", "top": "marimba", "pattern": [0, 1, 2, 0, 3], "perc": "brush", "bass_punch": True,
    },
    "drama": {
        "chords": [("A2", ["A4", "C5", "E5", "A5"]), ("D3", ["A4", "D5", "F5", "A5"]),
                   ("F2", ["A4", "C5", "F5", "C5"]), ("E2", ["G#4", "B4", "E5", "B4"])],
        "lead": "piano_felt", "top": "pad", "pattern": [0, 1, 2, 3], "perc": "kick", "bass_punch": False,
    },
    "reveal": {
        "chords": [("D3", ["D5", "F#5", "A5", "D6"]), ("G3", ["D5", "G5", "B5", "D6"]),
                   ("A2", ["E5", "A5", "C#6", "E6"]), ("D3", ["F#5", "A5", "D6", "A5"])],
        "lead": "pluck", "top": "pad", "pattern": [0, 1, 2, 3, 2, 1], "perc": "brush", "bass_punch": False,
    },
    "triumph": {
        "chords": [("C3", ["C5", "E5", "G5", "C6"]), ("G2", ["D5", "G5", "B5", "D6"]),
                   ("A2", ["E5", "A5", "C6", "E6"]), ("F2", ["F5", "A5", "C6", "G5"])],
        "lead": "bell", "top": "pad", "pattern": [0, 1, 2, 3, 2, 3], "perc": "kick", "bass_punch": True,
    },
    "sad": {
        "chords": [("E3", ["E4", "G4", "B4", "G4"]), ("C3", ["E4", "G4", "C5", "G4"]),
                   ("G2", ["D4", "G4", "B4", "G4"]), ("D3", ["D4", "F#4", "A4", "F#4"])],
        "lead": "piano_felt", "top": "pad", "pattern": [0, 2, 1, 3], "perc": "none", "bass_punch": False,
    },
}

MOODS = {k: v["chords"] for k, v in MOOD_SPEC.items()}

# Progressioni dinamiche automatiche quando la storia non scrive manualmente "sezioni"
DYNAMIC_ARCS = {
    "playful": ("curious", "playful", "tense", "reveal"),
    "mystery": ("mystery", "curious", "tense", "reveal"),
    "tense": ("mystery", "tense", "chase", "reveal"),
    "heist": ("mystery", "heist", "tense", "triumph"),
    "clockwork": ("clockwork", "curious", "tense", "reveal"),
    "cosmos": ("cosmos", "mystery", "drama", "reveal"),
    "ironic": ("playful", "ironic", "heist", "reveal"),
    "drama": ("sad", "mystery", "drama", "triumph"),
    "chase": ("curious", "tense", "chase", "triumph"),
    "curious": ("curious", "mystery", "playful", "reveal"),
    "reveal": ("mystery", "curious", "tense", "reveal"),
    "triumph": ("curious", "playful", "drama", "triumph"),
    "sad": ("sad", "mystery", "drama", "reveal"),
}


def infer_music_sections(story, duration, default_mood="mystery", default_bpm=96):
    """Costruisce un arco musicale variabile e dinamico dalle scene o dal mood di base."""
    scenes = story.get("scene") or []
    explicit_scene_moods = [sc for sc in scenes if sc.get("mood")]
    if explicit_scene_moods:
        out = []
        for idx, sc in enumerate(scenes):
            da, a = float(sc.get("da", 0.0)), min(duration, float(sc.get("a", duration)))
            if a <= da:
                continue
            md = sc.get("mood") or (out[-1]["mood"] if out else default_mood)
            bp = float(sc.get("bpm", default_bpm))
            frac = da / max(1.0, duration)
            inten = float(sc.get("intensita", 0.84 + 0.30 * min(1.0, frac * 1.15)))
            if out and out[-1]["mood"] == md and abs(out[-1]["a"] - da) < 0.06:
                out[-1]["a"] = a
            else:
                out.append({"da": round(da, 2), "a": round(a, 2), "mood": md, "bpm": bp, "intensita": round(inten, 2)})
        if out:
            return out

    # Arco automatico a 3-4 gradini sui tagli naturali delle scene (intro -> sviluppo -> climax -> apertura)
    arc = DYNAMIC_ARCS.get(default_mood, DYNAMIC_ARCS["mystery"])
    if duration < 14.0:
        cut_t = duration * 0.55
        return [
            {"da": 0.0, "a": round(cut_t, 2), "mood": arc[0], "bpm": float(default_bpm) - 4, "intensita": 0.88},
            {"da": round(cut_t, 2), "a": round(duration, 2), "mood": arc[3], "bpm": float(default_bpm) + 4, "intensita": 1.08},
        ]
    cuts = [round(sc["da"], 2) for sc in scenes if 2.0 < float(sc.get("da", 0)) < duration - 2.0]
    targets = [duration * 0.22, duration * 0.56, duration * 0.80]
    snapped = []
    for tgt in targets:
        best = min(cuts, key=lambda c: abs(c - tgt)) if cuts else tgt
        val = best if abs(best - tgt) <= duration * 0.14 else tgt
        if not snapped or val - snapped[-1] >= 2.5:
            snapped.append(round(val, 2))
    bounds = [0.0] + snapped + [round(duration, 2)]
    bpm_offs = [-6, 0, +8, +2]
    intensities = [0.80, 0.96, 1.14, 1.05]
    out = []
    for j in range(len(bounds) - 1):
        md = arc[min(j, len(arc) - 1)]
        out.append({
            "da": bounds[j],
            "a": bounds[j + 1],
            "mood": md,
            "bpm": max(72.0, min(144.0, float(default_bpm) + bpm_offs[min(j, 3)])),
            "intensita": intensities[min(j, 3)],
        })
    return out


def _place(buf, i, clip):
    k = min(len(clip), len(buf) - i)
    if i >= 0 and k > 0:
        buf[i:i + k] += clip[:k]


def _render_music_segment(duration, mood="mystery", bpm=100, end_fade=0.8, dinamica=True):
    n = max(1, int(duration * SR) + SR)
    out = np.zeros(n, np.float32)
    beat = 60.0 / max(40.0, float(bpm))
    spec = MOOD_SPEC.get(mood, MOOD_SPEC["mystery"])
    chords = spec["chords"]
    lead = spec["lead"]
    top = spec["top"]
    pat = spec["pattern"]
    perc_kind = spec["perc"]
    rng = np.random.default_rng(100 + sum(map(ord, str(mood))))
    bar, t0 = 0, 0.0
    while t0 < duration + 1:
        bass, arp = chords[bar % len(chords)]
        # Variazione per battuta: prima battuta più ariosa, battute successive arricchite con controcanto/pad
        bar_scale = (0.84 if bar == 0 and dinamica else (1.06 if bar % 4 == 3 else 0.96))
        steps = len(pat)
        for s_idx, note_idx in enumerate(pat):
            frac = (s_idx / steps) * 4.0
            st = t0 + frac * beat
            i = int(st * SR)
            if i >= n:
                break
            vel = (0.28 if s_idx % 2 == 0 else 0.21) * bar_scale * rng.uniform(0.92, 1.08)
            f_note = _note(arp[note_idx % len(arp)])
            tone = _synth_voice(lead, f_note, max(0.28, 1.6 * beat / max(1, steps / 4)), vel=vel)
            _place(out, i, tone)
            if dinamica and bar % 2 == 1 and s_idx in (0, steps // 2):
                # Controcanto alto/pad sulle battute pari per dare respiro dinamico
                hi_note = _synth_voice(top, f_note * (1.0 if top == "pad" else 2.0), max(0.35, 1.4 * beat), vel=0.14 * bar_scale)
                _place(out, i, hi_note)
            if perc_kind != "none" and s_idx % 2 == 1:
                _place(out, i, _soft_perc(perc_kind, rng))
        # Basso: su battuta 0 solo sul 1° quarto se prima battuta introduttiva, poi 1° e 3° quarto
        bass_beats = (0,) if (dinamica and bar == 0 and duration > 5.0) else (0, 2)
        for b in bass_beats:
            st = int((t0 + b * beat) * SR)
            if st < n:
                bs = _synth_bass(_note(bass), beat * 1.6, punch=spec["bass_punch"]) * bar_scale
                _place(out, st, bs)
        if perc_kind == "kick":
            _place(out, int(t0 * SR), _soft_perc("kick", rng))
        bar += 1
        t0 += 4 * beat
    out = out[: max(1, int(round(duration * SR)))]
    if end_fade > 0:
        fade = min(len(out), int(end_fade * SR))
        if fade > 0:
            out[-fade:] *= np.linspace(1.0, 0.0, fade) ** 1.3
    return out / (np.abs(out).max() + 1e-9)


def music(duration, mood="mystery", bpm=100):
    return _render_music_segment(duration, mood=mood, bpm=bpm, end_fade=0.8, dinamica=True)


def measure_low_band_db(x):
    """Differenza in dB tra banda 20-120 Hz e banda >120 Hz (target <= -3 dB come TECHNIQUE.md)."""
    mono = x.mean(1) if x.ndim == 2 else x
    if not np.any(np.abs(mono) > 1e-6):
        return -99.0
    low = _bp(mono.astype(np.float64), 20.0, 120.0, 2)
    hi = _hp(mono.astype(np.float64), 120.0, 2)
    e_low = float(np.sqrt(np.mean(low ** 2) + 1e-16))
    e_hi = float(np.sqrt(np.mean(hi ** 2) + 1e-16))
    return round(20.0 * np.log10(e_low / e_hi), 2)


def _bass_guard(x, max_low_db=-3.0):
    """Contiene la banda 20-120 Hz entro max_low_db rispetto a >120 Hz senza svuotare il mix."""
    diff = measure_low_band_db(x)
    if diff <= max_low_db:
        return x, diff
    excess = 10 ** ((max_low_db - diff) / 20.0)
    xf = x.astype(np.float64)
    lo = _lp(xf, 120.0, 2)
    hi = xf - lo
    y = hi + lo * excess
    return y.astype(np.float32), measure_low_band_db(y)


def _smooth_mask_segment(n, da, a, floor=0.0, att=0.14, rel=0.05):
    """Curva morbida 1 -> floor -> 1 con rampe coseno (zero click DC)."""
    m = np.ones(n, dtype=np.float32)
    i0 = max(0, int(round((da - max(0.01, att)) * SR)))
    i1 = min(n, max(i0, int(round(da * SR))))
    i2 = min(n, max(i1, int(round(a * SR))))
    i3 = min(n, max(i2, int(round((a + max(0.01, rel)) * SR))))
    if i1 > i0:
        u = np.linspace(0.0, 1.0, i1 - i0, dtype=np.float32)
        m[i0:i1] = 1.0 - (1.0 - floor) * 0.5 * (1.0 - np.cos(np.pi * u))
    if i2 > i1:
        m[i1:i2] = floor
    if i3 > i2:
        u = np.linspace(0.0, 1.0, i3 - i2, dtype=np.float32)
        m[i2:i3] = floor + (1.0 - floor) * 0.5 * (1.0 - np.cos(np.pi * u))
    return m


def _apply_silences(buf, silenzi, key="musica", default_floor=0.0):
    if not silenzi:
        return buf
    n = len(buf)
    mask = np.ones(n, dtype=np.float32)
    for s in silenzi:
        da = float(s["da"])
        a = float(s["a"])
        if a <= da:
            continue
        floor = float(s.get(key, s.get("livello", default_floor)))
        att = float(s.get("attacco", s.get("fade_in", 0.14)))
        rel = float(s.get("rilascio", s.get("fade_out", 0.05)))
        mask *= _smooth_mask_segment(n, da, a, floor=floor, att=att, rel=rel)
    if buf.ndim == 2:
        return (buf * mask[:, None]).astype(np.float32)
    return (buf * mask).astype(np.float32)


def music_regia(duration, mood="mystery", bpm=96, sezioni=None, silenzi=None, bass_guard=True, story=None, dinamica=True):
    """Musica con arco a sezioni (o inferito da scene/mood), silenzi pre-rivelazione e guardia basse 20-120 Hz."""
    n = max(1, int(round(duration * SR)))
    if not sezioni and dinamica and story is not None:
        sezioni = infer_music_sections(story, duration, default_mood=mood, default_bpm=bpm)
    if not sezioni:
        track = _render_music_segment(duration, mood=mood, bpm=bpm, end_fade=0.8, dinamica=dinamica)[:n]
    else:
        track = np.zeros(n, np.float32)
        for sec in sezioni:
            da = max(0.0, float(sec.get("da", 0.0)))
            a = min(duration, float(sec.get("a", duration)))
            if a <= da or sec.get("silenzio"):
                continue
            seg_d = max(0.2, (a - da) + 0.6)
            seg = _render_music_segment(seg_d, mood=sec.get("mood", mood), bpm=sec.get("bpm", bpm), end_fade=0.0, dinamica=dinamica)
            seg = seg[: min(len(seg), int(round((a - da + 0.5) * SR)))] * float(sec.get("intensita", 1.0))
            i0 = int(round(da * SR))
            k = min(len(seg), n - i0)
            if k <= 0:
                continue
            env = np.ones(k, np.float32)
            fi = min(k // 2, int(0.45 * SR))
            fo = min(k // 2, int(0.55 * SR))
            if fi > 1 and da > 0.05:
                env[:fi] = np.sin(np.linspace(0.0, np.pi / 2, fi)) ** 2
            if fo > 1:
                env[-fo:] = np.cos(np.linspace(0.0, np.pi / 2, fo)) ** 2
            track[i0:i0 + k] += seg[:k] * env
        fade = min(n, int(0.8 * SR))
        if fade > 0:
            track[-fade:] *= np.linspace(1.0, 0.0, fade) ** 1.3
    track = _apply_silences(track, silenzi, key="musica", default_floor=0.0)
    low_db = measure_low_band_db(track)
    if bass_guard and np.any(np.abs(track) > 1e-6):
        track, low_db = _bass_guard(track, -3.0)
    pk = float(np.abs(track).max())
    if pk > 1e-9:
        track = (track / pk).astype(np.float32)
    return track, low_db, (sezioni or [])


# ---------- sound effects ----------

SFX_ALIASES = {
    "wood": "wood_tap",
    "clack_wood": "wood_tap",
    "vetro": "glass_tap",
    "carta": "paper",
    "scintilla": "spark",
    "battito": "heartbeat",
    "passo": "step",
    "spezza": "snap",
    "scatto": "click",
    "bip_radio": "quindar",
    "accensione": "ignite",
    "boato": "roar",
    "crescendo": "riser",
    "scricchiolio": "creak",
    "tonfo": "thump",
}


def sfx(kind, dur=None, pitch=1.0, seed=None, filtro=None):
    kind = SFX_ALIASES.get(kind, kind)
    rng = np.random.default_rng(sum(map(ord, kind)) if seed is None else int(seed))
    p = max(0.25, float(pitch))

    if kind == "whoosh":
        d = float(dur) if dur else 0.45
        n = max(1, int(round(d * SR)))
        sweep = np.linspace(300, 4000, n) * np.sin(np.linspace(0, np.pi, n)) + 200
        x = _lowpass(rng.standard_normal(n), sweep) * np.sin(np.linspace(0, np.pi, n)) ** 2
        out = (x * 3.0).astype(np.float32)
    elif kind == "splash":
        n = int(0.7 * SR)
        x = _lowpass(rng.standard_normal(n), np.linspace(5000, 600, n)) * _env(n, 0.005, 0.18) * 2.5
        t = np.arange(n) / SR
        for _ in range(5):
            st = rng.uniform(0.05, 0.4)
            f0 = rng.uniform(500, 1100)
            bub = np.sin(2 * np.pi * (f0 + 1500 * (t - st)) * (t - st)) * np.exp(-np.maximum(t - st, 0) / 0.04) * (t > st)
            x += bub * 0.25
        out = x.astype(np.float32)
    elif kind == "pop":
        n = int(0.12 * SR)
        t = np.arange(n) / SR
        out = (np.sin(2 * np.pi * (900 * p - 3000 * t) * t) * _env(n, 0.001, 0.03) * 0.8).astype(np.float32)
    elif kind == "sting":
        n = int(1.1 * SR)
        t = np.arange(n) / SR
        saw = sum(np.sin(2 * np.pi * 110 * p * k * t) / k for k in range(1, 12))
        saw += 0.6 * sum(np.sin(2 * np.pi * 55 * p * k * t) / k for k in range(1, 8))
        out = (_lowpass(saw, np.linspace(1800, 400, n)) * _env(n, 0.02, 0.35) * 0.7).astype(np.float32)
    elif kind == "squish":
        n = int(0.35 * SR)
        t = np.arange(n) / SR
        wob = np.sin(2 * np.pi * (180 + 120 * np.sin(2 * np.pi * 18 * t)) * t)
        out = (_lowpass(wob + 0.3 * rng.standard_normal(n), 1200) * _env(n, 0.01, 0.1) * 1.4).astype(np.float32)
    elif kind == "chalk":
        n = int(0.9 * SR)
        x = rng.standard_normal(n)
        scratch = (np.sin(2 * np.pi * 7 * np.arange(n) / SR) > 0.2).astype(float)
        hp = x - _lowpass(x, 2500)
        out = (hp * scratch * _env(n, 0.01, 0.6) * 0.6).astype(np.float32)
    elif kind == "chime":
        n = int(1.6 * SR)
        t = np.arange(n) / SR
        x = np.zeros(n)
        for i, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
            st = i * 0.07
            x += np.sin(2 * np.pi * f * p * (t - st)) * np.exp(-np.maximum(t - st, 0) / 0.5) * (t > st)
        out = (x * 0.35).astype(np.float32)
    elif kind == "thunder":
        n = int(2.4 * SR)
        t = np.arange(n) / SR
        crack = rng.standard_normal(n) * np.exp(-t / 0.08)
        rumble = _lowpass(rng.standard_normal(n), 120) * 8 * np.exp(-t / 0.9) * (1 + 0.5 * np.sin(2 * np.pi * 3 * t))
        out = (crack * 0.8 + rumble).astype(np.float32)
    elif kind == "crash":
        n = int(1.0 * SR)
        x = _lowpass(rng.standard_normal(n), np.linspace(6000, 300, n)) * _env(n, 0.002, 0.2) * 2.5
        t = np.arange(n) / SR
        x += np.sin(2 * np.pi * 60 * t) * _env(n, 0.002, 0.25) * 0.8
        out = x.astype(np.float32)
    elif kind == "rumble":
        d = float(dur) if dur else 2.0
        n = max(1, int(round(d * SR)))
        t = np.arange(n) / SR
        x = _lowpass(rng.standard_normal(n), 95) * 10 * np.sin(np.pi * t / d) * (1 + 0.6 * np.sin(2 * np.pi * 5 * t))
        out = x.astype(np.float32)
    elif kind == "tick":
        n = int(0.05 * SR)
        x = rng.standard_normal(n) * _env(n, 0.0005, 0.006)
        out = (x - _lowpass(x, 3000)).astype(np.float32) * 2
    elif kind == "coins":
        n = int(0.9 * SR)
        t = np.arange(n) / SR
        x = np.zeros(n)
        for i in range(7):
            st = i * 0.09 + rng.uniform(0, 0.03)
            f = rng.uniform(2500, 4200) * p
            x += np.sin(2 * np.pi * f * (t - st)) * np.exp(-np.maximum(t - st, 0) / 0.08) * (t > st)
        out = (x * 0.4).astype(np.float32)
    elif kind == "ding":
        n = int(1.2 * SR)
        t = np.arange(n) / SR
        out = ((np.sin(2 * np.pi * 1318.5 * p * t) + 0.4 * np.sin(2 * np.pi * 2637 * p * t)) * np.exp(-t / 0.4) * 0.5).astype(np.float32)
    elif kind == "boing":
        n = int(0.5 * SR)
        t = np.arange(n) / SR
        f = (220 + 180 * np.sin(2 * np.pi * 9 * t) * np.exp(-t / 0.2)) * p
        out = (np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(n, 0.003, 0.2) * 0.7).astype(np.float32)
    elif kind == "night_ambience":
        r = np.random.default_rng(7)
        n = int((dur or 6.0) * SR)
        t = np.arange(n) / SR
        x = np.cumsum(r.normal(0, 1, n))
        x -= np.convolve(x, np.ones(800) / 800, "same")
        x /= np.max(np.abs(x)) + 1e-9
        x = x * 0.25 + 0.05 * np.sin(2 * np.pi * 60 * t) + 0.03 * np.sin(2 * np.pi * 120 * t)
        out = (x * _env(n, 0.8, 1.5) * 2.0).astype(np.float32)
    elif kind == "pachinko_hall":
        r = np.random.default_rng(7)
        n = int(6 * SR)
        t = np.arange(n) / SR
        x = np.zeros(n)
        for st in r.uniform(0, 5.9, 900):
            i0 = int(st * SR); L = int(0.03 * SR); tt = np.arange(L) / SR; f = r.uniform(3000, 6500)
            x[i0:i0 + L] += np.sin(2 * np.pi * f * tt)[: n - i0] * np.exp(-tt / 0.006)[: n - i0] * 0.25
        for k, f in enumerate([880, 1175, 1318, 1568, 1318, 1175] * 3):
            st = 0.3 + k * 0.3; m = (t > st) & (t < st + 0.22); x[m] += 0.12 * np.sign(np.sin(2 * np.pi * f * (t[m] - st)))
        out = (x * _env(n, 0.3, 1.0) * 0.6).astype(np.float32)
    elif kind == "sliding":
        n = int(1.0 * SR); t = np.arange(n) / SR; x = rng.normal(0, 1, n)
        x = np.convolve(x, np.ones(6) / 6, "same")
        out = (x * np.sin(np.pi * t / 1.0) ** 2 * 0.35).astype(np.float32)
    elif kind == "jackpot":
        n = int(1.6 * SR); t = np.arange(n) / SR; x = np.zeros(n)
        for k, f in enumerate([1046.5, 1318.5, 1568, 2093, 2637]):
            st = k * 0.11; m = t > st; x[m] += np.sin(2 * np.pi * f * (t[m] - st)) * np.exp(-(t[m] - st) / 0.35) * 0.3
        out = x.astype(np.float32)
    elif kind == "cash":
        n = int(1.0 * SR); t = np.arange(n) / SR; x = rng.normal(0, 1, n) * np.exp(-t / 0.01) * 0.4
        m = t > 0.06
        x[m] += (np.sin(2 * np.pi * 2093 * (t[m] - .06)) + 0.6 * np.sin(2 * np.pi * 3136 * (t[m] - .06))) * np.exp(-(t[m] - .06) / 0.3) * 0.35
        out = x.astype(np.float32)
    elif kind == "hammer_tap":
        n = int(0.35 * SR); t = np.arange(n) / SR
        wood = (np.sin(2 * np.pi * 310 * p * t) + 0.55 * np.sin(2 * np.pi * 620 * p * t)) * np.exp(-t / 0.045)
        ring = 0.25 * np.sin(2 * np.pi * 1480 * p * t) * np.exp(-t / 0.09)
        click_ = rng.normal(0, 1, n) * np.exp(-t / 0.004) * 0.35
        out = ((wood + ring + click_) * 0.65).astype(np.float32)

    # --- nuovi SFX procedurali da lemo-opuscar/core/audio/sfx.py + storia ---
    elif kind == "click":
        d = 0.06; tt = _t(d); n = len(tt)
        tr = _hp(rng.standard_normal(n), 2500) * _env_exp(d, 0.0015)
        res = sum(a * np.sin(2 * np.pi * f * p * tt + rng.random() * 6.0) * _env_exp(d, tau)
                  for f, a, tau in [(2900, 0.6, 0.012), (4600, 0.4, 0.008), (1500, 0.35, 0.018)])
        body = np.sin(2 * np.pi * 190 * p * tt) * _env_exp(d, 0.01) * 0.5
        out = _norm(tr * 0.8 + res + body)
    elif kind in ("clack", "wood_tap"):
        d = 0.09; tt = _t(d); n = len(tt)
        q = p * (0.9 + rng.random() * 0.2)
        x = _hp(rng.standard_normal(n), 1200) * _env_exp(d, 0.004) + sum(
            a * np.sin(2 * np.pi * f * q * tt) * _env_exp(d, tau)
            for f, a, tau in [(1200, 0.6, 0.02), (2300, 0.5, 0.012), (380, 0.5, 0.03)]
        )
        out = _norm(x)
    elif kind == "snap":
        # Spezzamento secco legno/grafite (impulso breve + crack acuto)
        d = float(dur) if dur else 0.14
        tt = _t(d); n = len(tt)
        crack = _bp(rng.standard_normal(n), 1600, 6800) * _env_exp(d, 0.004)
        wood = (0.7 * np.sin(2 * np.pi * 460 * p * tt) * _env_exp(d, 0.014)
                + 0.5 * np.sin(2 * np.pi * 1850 * p * tt) * _env_exp(d, 0.007))
        echo = np.zeros(n, dtype=np.float64)
        off = min(n - 1, int(0.028 * SR))
        if off < n:
            echo[off:] = crack[: n - off] * 0.35
        out = _norm(crack * 1.1 + wood + echo)
    elif kind == "creak":
        d = float(dur) if dur else 0.22; tt = _t(d); f0 = (70 + rng.random() * 35) * p
        saw = 2.0 * ((tt * f0 * (1.0 + 0.3 * np.sin(2 * np.pi * 9 * tt))) % 1.0) - 1.0
        out = _norm(_bp(saw, 400, 3000) * (np.abs(np.sin(2 * np.pi * 23 * tt)) ** 3) * np.sin(np.pi * tt / d))
    elif kind == "thump":
        d = float(dur) if dur else 0.35; tt = _t(d); n = len(tt); f = 70.0 * p
        out = _norm(np.sin(2 * np.pi * f * tt * (1.0 - 0.3 * tt)) * _env_exp(d, 0.07)
                    + _lp(rng.standard_normal(n), 300) * _env_exp(d, 0.02) * 0.5)
    elif kind == "step":
        d = 0.05; tt = _t(d); n = len(tt)
        out = _norm(_hp(rng.standard_normal(n), 1800) * _env_exp(d, 0.004)
                    + np.sin(2 * np.pi * 2200 * p * tt) * _env_exp(d, 0.006) * 0.5)
    elif kind == "quindar":
        d = float(dur) if dur else 0.24; tt = _t(d); x = np.sin(2 * np.pi * 2525 * p * tt)
        edge = min(len(x) // 3, 220)
        if edge > 1:
            x[:edge] *= np.linspace(0, 1, edge); x[-edge:] *= np.linspace(1, 0, edge)
        out = (x * 0.55).astype(np.float32)
    elif kind == "ignite":
        d = float(dur) if dur else 1.6; tt = _t(d); n = len(tt)
        sub = np.sin(2 * np.pi * 48 * p * tt * (1.0 - 0.2 * tt / d)) * _env_exp(d, 0.45)
        burst = _lp(rng.standard_normal(n), 1300) * _env_exp(d, 0.32)
        out = _norm(sub * 0.85 + burst)
    elif kind == "roar":
        d = float(dur) if dur else 1.6; tt = _t(d); n = len(tt)
        b = _lp(_brown(n, rng), 700)
        crack = _hp(rng.standard_normal(n), 3000) * (rng.random(n) > 0.994) * 2.5
        e = np.minimum(1.0, tt / min(0.35, d * 0.3)) * np.minimum(1.0, (d - tt) / min(0.5, d * 0.4))
        out = _norm((b + _lp(crack, 6000) * 0.3) * e)
    elif kind == "heartbeat":
        h1 = sfx("thump", dur=0.28, pitch=55 / 70.0 * p, seed=(seed or 7))
        h2 = sfx("thump", dur=0.28, pitch=50 / 70.0 * p, seed=(seed or 7) + 1) * 0.7
        gap = int(0.22 * SR)
        out_arr = np.zeros(max(len(h1), gap + len(h2)), dtype=np.float32)
        out_arr[:len(h1)] += h1
        out_arr[gap:gap + len(h2)] += h2
        out = _norm(out_arr)
    elif kind == "paper":
        d = float(dur) if dur else 0.45; tt = _t(d); n = len(tt)
        x = _bp(rng.standard_normal(n), 1800, 6800) * (np.sin(np.pi * tt / d) ** 1.5)
        out = _norm(x)
    elif kind == "glass_tap":
        d = 0.5; tt = _t(d)
        base = np.pad(sfx("clack", pitch=1.6 * p, seed=(seed or 11)), (0, len(tt)))[:len(tt)]
        ring = sum(a * np.sin(2 * np.pi * f * p * tt) * _env_exp(d, tau)
                   for f, a, tau in [(3150, 0.25, 0.09), (5230, 0.15, 0.05), (1870, 0.12, 0.12)])
        out = _norm(base * 0.75 + ring * 0.55)
    elif kind == "spark":
        d = float(dur) if dur else 0.36; tt = _t(d); n = len(tt)
        zaps = np.zeros(n, dtype=np.float64)
        for st, amp in [(0.0, 1.0), (0.045, 0.65), (0.095, 0.4)]:
            i0 = int(st * SR)
            if i0 < n:
                seg_t = tt[i0:] - st
                crackle = _bp(rng.standard_normal(len(seg_t)), 2400, 7500) * np.exp(-seg_t / 0.018)
                ping = np.sin(2 * np.pi * (4200 * p - 2400 * seg_t) * seg_t) * np.exp(-seg_t / 0.014) * 0.45
                zaps[i0:] += (crackle + ping) * amp
        th = np.sin(2 * np.pi * 110 * tt) * _env_exp(d, 0.04) * 0.35
        out = _norm(zaps + th)
    elif kind == "riser":
        d = float(dur) if dur else 2.5; tt = _t(d); n = len(tt)
        ramp = (tt / d) ** 2.2
        lo = _bp(rng.standard_normal(n), 320, 1200) * (1.0 - 0.3 * tt / d)
        hi = _bp(rng.standard_normal(n), 1400, 4800) * (tt / d)
        tone = np.sin(2 * np.pi * np.cumsum(160 * p + 420 * (tt / d) ** 1.5) / SR) * 0.22
        cut = min(n, max(16, int(0.012 * SR)))
        tail_off = np.ones(n, dtype=np.float64); tail_off[-cut:] = np.linspace(1.0, 0.0, cut)
        out = _norm((lo * 0.55 + hi * 0.75 + tone) * ramp * tail_off)
    else:
        raise ValueError(f"unknown sound effect: {kind}")

    if filtro == "radio":
        out = radio(out)
    elif filtro == "lontano":
        out = lontano(out)
    return out


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


SFX_GAIN = {
    "whoosh": 0.35, "splash": 0.45, "pop": 0.40, "sting": 0.50, "squish": 0.40, "chalk": 0.25, "chime": 0.45,
    "thunder": 0.70, "crash": 0.55, "rumble": 0.60, "tick": 0.45, "coins": 0.45, "ding": 0.40, "boing": 0.40,
    "laugh": 0.55, "night_ambience": 0.22, "pachinko_hall": 0.26, "sliding": 0.32, "jackpot": 0.45,
    "cash": 0.45, "hammer_tap": 0.45,
    "click": 0.45, "clack": 0.42, "wood_tap": 0.42, "snap": 0.55, "creak": 0.36, "thump": 0.55,
    "step": 0.25, "quindar": 0.30, "ignite": 0.72, "roar": 0.55, "heartbeat": 0.48, "paper": 0.30,
    "glass_tap": 0.40, "spark": 0.60, "riser": 0.52,
}
SFX_TYPES = tuple(SFX_GAIN)
SFX_LEVEL = 0.3  # overall sound-effects level under the narrator (legacy mix)


# ---------- continuous ambience beds & J-cut / L-cut ----------

def _ambience_mono(kind, n, seed=11):
    rng = np.random.default_rng(seed)
    t = np.arange(n, dtype=np.float64) / SR
    k = str(kind).lower()
    if k in ("amb_capsula", "capsula", "spazio", "cosmos"):
        hum = 0.14 * np.sin(2 * np.pi * 92 * t) + 0.07 * np.sin(2 * np.pi * 184 * t)
        vent = _bp(rng.standard_normal(n), 150, 520, 2)
        mod = 0.75 + 0.25 * np.sin(2 * np.pi * 0.17 * t + seed)
        return _norm(vent * 0.45 * mod + hum * 0.22, 0.7)
    if k in ("amb_controllo", "controllo_missione", "bunker"):
        room = _lp(_brown(n, rng), 260) * 0.35
        hum = 0.10 * np.sin(2 * np.pi * 110 * t) + 0.06 * np.sin(2 * np.pi * 220 * t)
        air = _bp(rng.standard_normal(n), 600, 2200, 2) * 0.08
        return _norm(room + hum + air, 0.7)
    if k in ("amb_laboratorio", "laboratorio"):
        room = _lp(_brown(n, rng), 280) * 0.32
        hum = 0.08 * np.sin(2 * np.pi * 150 * t) + 0.04 * np.sin(2 * np.pi * 300 * t)
        return _norm(room + hum + _bp(rng.standard_normal(n), 450, 1400, 2) * 0.07, 0.65)
    if k in ("amb_ufficio", "ufficio", "stanza", "casa", "cucina"):
        room = _lp(_brown(n, rng), 230) * 0.35
        air = _bp(rng.standard_normal(n), 280, 900, 2) * 0.06
        return _norm(room + air, 0.6)
    if k in ("amb_notte", "strada_notte", "esterno_notte"):
        wind = _lp(_brown(n, rng), 350) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.14 * t + 0.7))
        city = _lp(rng.standard_normal(n), 160) * 0.12
        return _norm(wind * 0.4 + city, 0.7)
    if k in ("amb_vento", "vento", "esterno", "strada", "giorno", "amb_giorno"):
        w = _bp(rng.standard_normal(n), 120, 650, 2)
        g = 0.6 + 0.4 * np.sin(2 * np.pi * 0.21 * t + seed * 0.3) ** 2
        return _norm(w * g, 0.7)
    if k in ("amb_fabbrica", "officina", "stazione"):
        mach = _lp(_brown(n, rng), 190) * 0.4 + 0.12 * np.sin(2 * np.pi * 84 * t)
        return _norm(mach, 0.7)
    if k in ("amb_silenzio", "vuoto", "silenzio"):
        return np.zeros(n, dtype=np.float32)
    return _norm(_lp(_brown(n, rng), 250) * 0.3, 0.6)


def infer_ambience(luogo):
    s = str(luogo or "").lower()
    if any(w in s for w in ("capsul", "navicell", "razz", "spazi", "orbita")):
        return "amb_capsula"
    if any(w in s for w in ("controllo", "mission", "bunker", "centrale")):
        return "amb_controllo"
    if any(w in s for w in ("lab", "officin", "studio")):
        return "amb_laboratorio"
    if any(w in s for w in ("ufficio", "stanz", "cas", "cucin", "camera")):
        return "amb_ufficio"
    if any(w in s for w in ("nott", "vicol")):
        return "amb_notte"
    if any(w in s for w in ("strad", "piaz", "giardin", "parco", "esterno")):
        return "amb_giorno"
    if any(w in s for w in ("stazion", "fabbr", "porto", "treno")):
        return "amb_fabbrica"
    return "amb_ufficio"


def _scenes_to_ambient_blocks(scene_list, default_j=0.45, default_l=0.55):
    """Raggruppa scene contigue dello stesso luogo e prepara J-cut / L-cut ai confini."""
    blocks = []
    for sc in scene_list:
        da, a = float(sc.get("da", 0.0)), float(sc.get("a", 0.0))
        if a <= da:
            continue
        luogo = sc.get("luogo", "")
        tipo = sc.get("ambiente") or infer_ambience(luogo)
        jc = float(sc.get("j_cut", default_j))
        lc = float(sc.get("l_cut", default_l))
        gain = float(sc.get("ambiente_gain", 1.0))
        if blocks and blocks[-1]["tipo"] == tipo and abs(blocks[-1]["a"] - da) < 0.06:
            blocks[-1]["a"] = a
            blocks[-1]["l_cut"] = lc
        else:
            blocks.append({"da": da, "a": a, "tipo": tipo, "j_cut": jc, "l_cut": lc, "gain": gain, "luogo": luogo})
    return blocks


def build_ambience(duration, story, default_j=0.45, default_l=0.55, stereo=True):
    """Costruisce lo strato ambiente con J-cut (entra prima del taglio) e L-cut (sborda dopo il taglio)."""
    n = max(1, int(round(duration * SR)))
    buf = np.zeros((n, 2), dtype=np.float32) if stereo else np.zeros(n, dtype=np.float32)
    events_log = []
    explicit = story.get("ambienti")
    if explicit:
        blocks = [dict(b) for b in explicit]
    elif story.get("regia_audio") or story.get("j_cut") is not None or story.get("l_cut") is not None:
        dj = float(story.get("j_cut", default_j)) if not isinstance(story.get("j_cut"), bool) else default_j
        dl = float(story.get("l_cut", default_l)) if not isinstance(story.get("l_cut"), bool) else default_l
        blocks = _scenes_to_ambient_blocks(story.get("scene", []), default_j=dj, default_l=dl)
    else:
        return buf, events_log

    for idx, b in enumerate(blocks):
        da, a = float(b["da"]), float(b["a"])
        tipo = b.get("tipo", "amb_ufficio")
        jc = float(b.get("j_cut", default_j)) if da > 0.05 else 0.0
        lc = float(b.get("l_cut", default_l)) if a < duration - 0.05 else 0.0
        t_start = max(0.0, da - jc)
        t_end = min(duration, a + lc)
        if t_end <= t_start:
            continue
        i0, i1 = int(round(t_start * SR)), min(n, int(round(t_end * SR)))
        k = i1 - i0
        if k <= 4:
            continue
        env = np.ones(k, dtype=np.float32)
        fi = min(k // 2, int(round(max(0.25, jc if jc > 0 else 0.35) * SR)))
        fo = min(k // 2, int(round(max(0.25, lc if lc > 0 else 0.45) * SR)))
        if fi > 1:
            u = np.linspace(0.0, np.pi / 2, fi, dtype=np.float32)
            env[:fi] = np.sin(u) ** 2
        if fo > 1:
            u = np.linspace(0.0, np.pi / 2, fo, dtype=np.float32)
            env[-fo:] = np.cos(u) ** 2
        g = float(b.get("gain", 1.0))
        if stereo:
            # Due seed indipendenti per stereofonia ampia e zero comb-filtering se ridotto a mono
            mL = _ambience_mono(tipo, k, seed=21 + idx * 7) * env * g
            mR = _ambience_mono(tipo, k, seed=101 + idx * 7) * env * g
            pan = max(-0.7, min(0.7, float(b.get("pan", 0.0))))
            l_w = np.cos((pan + 1.0) * np.pi / 4.0) * 1.414
            r_w = np.sin((pan + 1.0) * np.pi / 4.0) * 1.414
            buf[i0:i1, 0] += mL * l_w
            buf[i0:i1, 1] += mR * r_w
        else:
            buf[i0:i1] += _ambience_mono(tipo, k, seed=21 + idx * 7) * env * g
        events_log.append({
            "tipo": tipo, "da_visivo": round(da, 2), "a_visivo": round(a, 2),
            "j_cut_s": round(da - t_start, 2), "l_cut_s": round(t_end - a, 2),
        })
    return buf, events_log


# ---------- legacy & measured mix ----------

def _to_stereo(x, pan=0.0):
    th = (max(-1.0, min(1.0, float(pan))) + 1.0) * np.pi / 4.0
    lw = np.float32(np.cos(th))
    rw = np.float32(np.sin(th))
    if x.ndim == 2:
        return x.astype(np.float32)
    return np.stack([x * lw, x * rw], axis=1).astype(np.float32)


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
    active = _lowpass((np.abs(voice) > 0.02).astype(np.float64), 6.0)
    duck = 1.0 - 0.55 * np.clip(active * 4, 0, 1)
    m = np.zeros(n, np.float32)
    m[: min(n, len(music_track))] = music_track[:n]
    out = voice + fx + m * music_gain * duck
    return (out / (np.abs(out).max() + 1e-9) * 0.95).astype(np.float32)


def write_wav(path, pcm):
    import wave
    arr = np.asarray(pcm, dtype=np.float32)
    nch = 2 if arr.ndim == 2 and arr.shape[1] == 2 else 1
    data = (np.clip(arr.reshape(-1), -1.0, 1.0) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(nch)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


# ------------------------------------------------------------------ mix MISURATO & REGIA AUDIO
def lufs(x):
    """Loudness integrata (LUFS) di un segnale mono o stereo, misurata da ffmpeg. -70 se è silenzio."""
    import subprocess, tempfile, imageio_ffmpeg
    arr = np.asarray(x, dtype=np.float32)
    pk = float(np.abs(arr).max()) if arr.size else 0.0
    if pk <= 1e-5:
        return -70.0
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, "x.wav")
        write_wav(p, arr / max(1.0, pk))
        out = subprocess.run(
            [imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-nostats", "-i", p, "-af", "ebur128", "-f", "null", "-"],
            capture_output=True, text=True
        ).stderr
        m = re.findall(r"I:\s+(-?[\d.]+) LUFS", out)
        return float(m[-1]) + 20 * np.log10(max(1.0, pk)) if m else -70.0


def _inviluppo(target_db, att=0.07, rel=0.45):
    """Segue un guadagno in dB: scende in fretta (attacco) e risale piano (rilascio)."""
    blk = int(0.01 * SR)
    nb = (len(target_db) + blk - 1) // blk
    tb = np.array([target_db[i * blk:(i + 1) * blk].min() for i in range(nb)])
    g = np.empty(nb)
    cur = tb[0]
    ka, kr = 1.0 - np.exp(-0.01 / max(att, 1e-4)), 1.0 - np.exp(-0.01 / max(rel, 1e-4))
    for i, v in enumerate(tb):
        cur += (v - cur) * (ka if v < cur else kr)
        g[i] = cur
    return np.repeat(g, blk)[:len(target_db)]


def mix_misurato(duration, voice_clips, sfx_events, music_track, musica_lu=-15.0, pausa_db=5.0, effetti_lu=-9.0, custom=None):
    """Restituisce (mix, numeri). numeri = livelli misurati, per la tabella dei suoni."""
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
        place(fx, st, (custom[kind] if kind in custom else sfx(kind)) * SFX_GAIN.get(kind, 0.4))
    m = np.zeros(n, np.float32)
    m[: min(n, len(music_track))] = music_track[:n]
    parla = _lowpass((np.abs(voice) > 0.02).astype(np.float64), 4.0) > 0.08
    Lv = lufs(voice)
    num = {"voce_lufs": round(Lv, 1)}
    if Lv > -69 and np.any(m):
        Lm = lufs(m[parla]) if parla.sum() > SR else lufs(m)
        g0 = (Lv + musica_lu) - Lm
        m = m * (10 ** (_inviluppo(np.where(parla, g0, g0 + pausa_db)) / 20)).astype(np.float32)
        num["musica_sotto_voce_lu"] = round(lufs(m[parla]) - Lv, 1) if parla.sum() > SR else None
    if Lv > -69 and np.any(fx):
        on = np.abs(fx) > 1e-4
        Lf = lufs(fx[on])
        fx = fx * np.float32(10 ** (((Lv + effetti_lu) - Lf) / 20))
        num["effetti_sotto_voce_lu"] = round(lufs(fx[on]) - Lv, 1)
    out = voice + fx + m
    pk = float(np.abs(out).max())
    if pk > 0.95:
        out = out * (0.95 / pk)
    return out.astype(np.float32), num


def _render_sfx_event(ev, custom):
    if isinstance(ev, (tuple, list)):
        st, kind = float(ev[0]), ev[1]
        opt = {}
    else:
        st = float(ev.get("t", 0.0))
        kind = ev["tipo"]
        opt = ev
    if kind in custom:
        clip = np.asarray(custom[kind], dtype=np.float32)
    else:
        clip = sfx(kind, dur=opt.get("dur"), pitch=opt.get("pitch", 1.0),
                   seed=opt.get("seed"), filtro=opt.get("filtro"))
    j_anticipo = float(opt.get("j_cut", 0.0))
    st = max(0.0, st - j_anticipo)
    base_g = SFX_GAIN.get(SFX_ALIASES.get(kind, kind), 0.4)
    gain = base_g * float(opt.get("gain", opt.get("vol", 1.0)))
    pan = float(opt.get("pan", 0.0))
    return st, clip * gain, pan, kind


def mix_regia(duration, voice_clips, sfx_events, music_track, amb_track=None, silenzi=None,
              musica_lu=-15.5, pausa_db=4.5, effetti_lu=-8.5, amb_lu=-25.0,
              vocal_dip_db=2.5, stereo=True, custom=None):
    """Mix misurato a 4 strati (voce intatta, musica con dip spettrale + silenzi, ambiente J/L-cut, SFX stereo/mono)."""
    custom = custom or {}
    n = max(1, int(round(duration * SR)))

    def place_mono(buf, st, clip):
        i = max(0, int(st * SR))
        k = min(len(clip), n - i)
        if k > 0:
            buf[i:i + k] += clip[:k]

    def place_stereo(buf, st, clip, pan=0.0):
        i = max(0, int(st * SR))
        st_clip = _to_stereo(clip, pan)
        k = min(len(st_clip), n - i)
        if k > 0:
            buf[i:i + k] += st_clip[:k]

    voice_m = np.zeros(n, np.float32)
    for st, pcm in voice_clips:
        p1 = pcm.mean(1) if pcm.ndim == 2 else pcm
        place_mono(voice_m, st, p1)

    parla = _lowpass((np.abs(voice_m) > 0.02).astype(np.float64), 4.0) > 0.08
    has_parla = parla.sum() > SR
    Lv = lufs(voice_m)

    # Musica
    m = np.zeros(n, np.float32)
    if music_track is not None and len(music_track):
        mt = music_track.mean(1) if music_track.ndim == 2 else music_track
        m[: min(n, len(mt))] = mt[:n]

    num = {"voce_lufs": round(Lv, 1), "silenzi": len(silenzi or []), "canali": 2 if stereo else 1}
    if np.any(np.abs(m) > 1e-6):
        ref = Lv if Lv > -69 else -18.0
        nz = np.abs(m) > 1e-5
        Lm = lufs(m[parla]) if (has_parla and np.any(np.abs(m[parla]) > 1e-5)) else lufs(m[nz])
        if Lm > -69:
            g0 = (ref + musica_lu) - Lm
            env_db = _inviluppo(np.where(parla, g0, g0 + pausa_db), att=0.07, rel=0.45)
            m = (m * (10.0 ** (env_db / 20.0))).astype(np.float32)
        if vocal_dip_db > 0 and has_parla:
            # Lieve attenuazione 300-3800 Hz della musica mentre si parla (tecnica dark-documentary)
            # _inviluppo usa att su v < cur e rel su v > cur: invertendo (0 in parla, 1 in pausa) il dip attacca in 70 ms e rilascia in 350 ms
            dip_w = 1.0 - _inviluppo(np.where(parla, 0.0, 1.0), att=0.07, rel=0.35)
            dip_k = 1.0 - 10.0 ** (-vocal_dip_db / 20.0)
            m = (m - _bp(m.astype(np.float64), 300.0, 3800.0, 2) * (dip_w * dip_k)).astype(np.float32)
        if has_parla and np.any(np.abs(m[parla]) > 1e-5) and Lv > -69:
            num["musica_sotto_voce_lu"] = round(lufs(m[parla]) - Lv, 1)

    # Ambiente (gia comprensivo di J-cut/L-cut) + eventuali silenzi anche sull'ambiente
    if amb_track is not None and np.any(np.abs(amb_track) > 1e-6):
        amb = amb_track[:n].copy() if len(amb_track) >= n else np.pad(amb_track, ((0, n - len(amb_track)), (0, 0)) if amb_track.ndim == 2 else (0, n - len(amb_track)))
        amb = _apply_silences(amb, silenzi, key="ambiente", default_floor=0.08)
        ref = Lv if Lv > -69 else -18.0
        am_mono = amb.mean(1) if amb.ndim == 2 else amb
        nz = np.abs(am_mono) > 1e-5
        La = lufs(amb[parla]) if (has_parla and np.any(np.abs(am_mono[parla]) > 1e-5)) else (lufs(amb[nz]) if np.any(nz) else -70.0)
        if La > -69:
            ga0 = (ref + amb_lu) - La
            a_env = _inviluppo(np.where(parla, ga0, ga0 + 3.5), att=0.08, rel=0.45)
            scale = (10.0 ** (a_env / 20.0)).astype(np.float32)
            amb = (amb * (scale[:, None] if amb.ndim == 2 else scale)).astype(np.float32)
        if has_parla and Lv > -69 and np.any(np.abs(am_mono[parla]) > 1e-5):
            num["ambiente_sotto_voce_lu"] = round(lufs(amb[parla]) - Lv, 1)
    else:
        amb = np.zeros((n, 2), dtype=np.float32) if stereo else np.zeros(n, dtype=np.float32)

    # SFX
    fx = np.zeros((n, 2), dtype=np.float32) if stereo else np.zeros(n, dtype=np.float32)
    sfx_log = []
    for ev in (sfx_events or []):
        st, clip, pan, kind = _render_sfx_event(ev, custom)
        if stereo:
            place_stereo(fx, st, clip, pan)
        else:
            place_mono(fx, st, clip)
        sfx_log.append((round(st, 2), kind, round(pan, 2)))

    fx_abs = np.max(np.abs(fx), axis=1) if fx.ndim == 2 else np.abs(fx)
    fx_pk = float(fx_abs.max()) if len(fx_abs) else 0.0
    if fx_pk > 1e-4:
        on = fx_abs > max(1e-4, fx_pk * 0.05)
        Lf = lufs(fx[on]) if on.sum() >= int(0.8 * SR) else -70.0
        if Lf > -69 and Lv > -69:
            gain_fx = 10.0 ** (((Lv + effetti_lu) - Lf) / 20.0)
        elif has_parla:
            rms_v = float(np.sqrt(np.mean(voice_m[parla] ** 2) * (0.5 if stereo else 1.0) + 1e-16))
            rms_f = float(np.sqrt(np.mean(fx[on] ** 2) + 1e-16))
            gain_fx = (rms_v * (10.0 ** (effetti_lu / 20.0))) / rms_f
        else:
            rms_f = float(np.sqrt(np.mean(fx[on] ** 2) + 1e-16))
            gain_fx = (10.0 ** (-24.0 / 20.0)) / rms_f
        # Non lasciare mai che un singolo transiente superi il picco vocale (salvo mix senza voce)
        max_pk_cap = max(0.35, float(np.abs(voice_m).max()) * 0.95) if Lv > -69 else 0.85
        if fx_pk * gain_fx > max_pk_cap:
            gain_fx = max_pk_cap / fx_pk
        fx = (fx * np.float32(gain_fx)).astype(np.float32)
        if Lv > -69:
            Lf_after = lufs(fx[on]) if on.sum() >= int(0.8 * SR) else -70.0
            if Lf_after > -69:
                num["effetti_sotto_voce_lu"] = round(float(Lf_after - Lv), 1)
            elif has_parla:
                rms_v = float(np.sqrt(np.mean(voice_m[parla] ** 2) * (0.5 if stereo else 1.0) + 1e-16))
                rms_f = float(np.sqrt(np.mean(fx[on] ** 2) + 1e-16))
                num["effetti_sotto_voce_lu"] = round(float(20.0 * np.log10((rms_f + 1e-12) / (rms_v + 1e-12))), 1)

    if stereo:
        # Voce centrata (pan=0: L=R=0.7071 preserva la potenza totale e i LUFS)
        voice_out = _to_stereo(voice_m, 0.0)
        mus_out = _to_stereo(m, 0.0)
        amb_out = _to_stereo(amb, 0.0) if amb.ndim == 1 else amb
        out = voice_out + fx + mus_out + amb_out
    else:
        out = voice_m + fx + m + (amb.mean(1) if amb.ndim == 2 else amb)

    out = _limit(out, ceil=0.92, look=0.005)
    num["effetti_piazzati"] = sfx_log
    num["musica_banda_bassa_db"] = measure_low_band_db(m)
    return out.astype(np.float32), num
