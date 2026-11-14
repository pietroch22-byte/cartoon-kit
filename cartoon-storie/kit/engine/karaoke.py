"""Sottotitoli a karaoke e caricamento della voce per film_disegnato.py (gli unici pezzi dei vecchi motori 2D che servono ancora).
Unico stile (scelta dell'utente): karaoke, 1-3 parole in maiuscolo, bianche con bordo scuro, la parola detta in giallo."""
import os
import subprocess

import numpy as np
import skia

W, H = 1080, 1920
_FONT_DIRS = [os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fonts"),
              "/System/Library/Fonts/Supplemental", "/System/Library/Fonts", "/Library/Fonts",
              os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts")]
_tf = None


def _col(hexstr, a=1.0):
    h = hexstr.lstrip("#")
    return skia.ColorSetARGB(int(max(0, min(1, a)) * 255), int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def _paint(color, stroke=None, blur=None):
    p = skia.Paint(AntiAlias=True)
    p.setColor(color if not isinstance(color, str) else _col(color))
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style); p.setStrokeWidth(stroke)
        p.setStrokeCap(skia.Paint.kRound_Cap); p.setStrokeJoin(skia.Paint.kRound_Join)
    if blur:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    return p


def _typeface():
    global _tf
    if _tf is None:
        for n in ("Fredoka-Bold.ttf", "Arial Rounded Bold.ttf", "arialbd.ttf"):
            for d in _FONT_DIRS:
                p = os.path.join(d, n)
                if os.path.exists(p):
                    _tf = skia.Typeface.MakeFromFile(p)
                    break
            if _tf:
                break
        _tf = _tf or skia.Typeface.MakeDefault()
    return _tf


def _back_out(x):
    x = max(0.0, min(1.0, x)); c1 = 1.9
    return 1 + (c1 + 1) * (x - 1) ** 3 + c1 * (x - 1) ** 2


def _clean(w):
    return w.strip('"\'«»“”…').rstrip(",.;:!?…»").lstrip("«").replace("*", "")


def blocchi(words, max_words=3, max_chars=16, maiuscolo=True):
    """words = [(parola, inizio, fine)] -> blocchi di 1-3 parole; si va a capo anche sulla punteggiatura."""
    out, cur = [], []
    for raw, st, en in words:
        w = _clean(raw).upper() if maiuscolo else _clean(raw)
        if not w:
            continue
        if cur and (len(cur) >= max_words or len(" ".join(x[0] for x in cur)) + 1 + len(w) > max_chars):
            out.append(cur); cur = []
        cur.append((w, st, en))
        if raw.rstrip("»\"'*")[-1:] in ".?!,:;…":
            out.append(cur); cur = []
    if cur:
        out.append(cur)
    return out


def al_tempo(chunks, t):
    """Il blocco da mostrare al tempo t: (parole, indice della parola detta, età del blocco) oppure None."""
    lead, cur = 0.03, None
    for blk in chunks:
        if blk[0][1] - lead <= t:
            cur = blk
        else:
            break
    if cur is None or t >= cur[-1][2] + 0.6:
        return None
    return [w[0] for w in cur], max(i for i, w in enumerate(cur) if w[1] - lead <= t), t - cur[0][1]


def disegna(c, words, hot, age, y=1385, max_w=920):
    tf = _typeface()
    size = 96
    font = skia.Font(tf, size)
    space = font.measureText(" ") + size * 0.22
    widths = [font.measureText(w) for w in words]
    total = sum(widths) + space * (len(words) - 1)
    if total > max_w:
        size *= max_w / total
        font = skia.Font(tf, size)
        space = font.measureText(" ") + size * 0.22
        widths = [font.measureText(w) for w in words]
        total = sum(widths) + space * (len(words) - 1)
    pop = 0.85 + 0.15 * _back_out(min(1.0, age / 0.12))
    c.save(); c.translate(W / 2, y); c.scale(pop, pop)
    x = -total / 2
    for i, (w, wd) in enumerate(zip(words, widths)):
        blob = skia.TextBlob(w, font)
        c.drawTextBlob(blob, x + 5, 9, _paint(_col("#000000", 0.45), blur=7))
        c.drawTextBlob(blob, x, 0, _paint("#2A1730", stroke=size * 0.19))
        c.drawTextBlob(blob, x, 0, _paint("#FFCE40" if i == hot else "#FFFFFF"))
        x += wd + space
    c.restore()


def carica_voce(path, sr):
    """La voce dell'utente così com'è (mono, sr Hz): non si modifica mai."""
    import imageio_ffmpeg
    raw = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sr),
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
