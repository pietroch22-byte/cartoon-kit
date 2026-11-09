"""Shared drawing basics: colors, paints, easing, fonts, chalk text, vignette, captions."""
import math
import os

import numpy as np
import skia

W, H = 1080, 1920
INK_HEX = "#1E1E24"


# ---------- basics ----------

def col(hexstr, a=1.0):
    h = hexstr.lstrip("#")
    return skia.ColorSetARGB(int(max(0, min(1, a)) * 255), int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def shade(hexstr, k):
    """k<1 darker, k>1 lighter."""
    h = hexstr.lstrip("#")
    rgb = [int(h[i:i + 2], 16) for i in (0, 2, 4)]
    if k < 1:
        rgb = [int(v * k) for v in rgb]
    else:
        rgb = [int(v + (255 - v) * (k - 1)) for v in rgb]
    return "#%02X%02X%02X" % tuple(max(0, min(255, v)) for v in rgb)


INK = col(INK_HEX)


def P(color=INK, stroke=None, alpha=None, blur=None, shader=None):
    p = skia.Paint(AntiAlias=True)
    p.setColor(color if not isinstance(color, str) else col(color))
    if alpha is not None:
        p.setAlphaf(alpha)
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(stroke)
        p.setStrokeCap(skia.Paint.kRound_Cap)
        p.setStrokeJoin(skia.Paint.kRound_Join)
    if blur:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    if shader is not None:
        p.setShader(shader)
    return p


def lin(x0, y0, x1, y1, colors):
    return skia.GradientShader.MakeLinear([skia.Point(x0, y0), skia.Point(x1, y1)], [col(c) if isinstance(c, str) else c for c in colors])


def rad(x, y, r, colors):
    return skia.GradientShader.MakeRadial(skia.Point(x, y), r, [col(c) if isinstance(c, str) else c for c in colors])


def clamp01(x):
    return max(0.0, min(1.0, x))


def ease(x):
    x = clamp01(x)
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = clamp01(x)
    return 1 - (1 - x) ** 3


def back_out(x):
    x = clamp01(x)
    c1 = 1.9
    return 1 + (c1 + 1) * (x - 1) ** 3 + c1 * (x - 1) ** 2


def rrect(x, y, w, h, r):
    return skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r)


def oval(cx, cy, rx, ry):
    return skia.Rect.MakeLTRB(cx - rx, cy - ry, cx + rx, cy + ry)


# ---------- fonts ----------

# The folder's own fonts come first, so Mac and Windows look the same. System fonts are only a fallback.
_FONT_DIRS = [os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fonts"),
              "/System/Library/Fonts/Supplemental", "/System/Library/Fonts", "/Library/Fonts",
              os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts")]
_tf_cache = {}


def typeface(*names):
    key = names
    if key not in _tf_cache:
        tf = None
        for n in names:
            for d in _FONT_DIRS:
                p = os.path.join(d, n)
                if os.path.exists(p):
                    tf = skia.Typeface.MakeFromFile(p)
                    break
            if tf:
                break
        _tf_cache[key] = tf or skia.Typeface.MakeDefault()
    return _tf_cache[key]


def caption_tf():
    return typeface("Fredoka-Bold.ttf", "Arial Rounded Bold.ttf", "arialbd.ttf")


def chalk_tf():
    return typeface("CabinSketch-Bold.ttf", "Chalkduster.ttf", "segoepr.ttf")


def sign_tf():
    return typeface("PatuaOne-Regular.ttf", "Georgia Bold.ttf", "georgiab.ttf")


def draw_text_center(c, text, x, y, size, tf, fill="#FFFFFF", stroke=None, stroke_hex=INK_HEX, alpha=1.0):
    font = skia.Font(tf, size)
    w = font.measureText(text)
    blob = skia.TextBlob(text, font)
    if stroke:
        c.drawTextBlob(blob, x - w / 2, y, P(col(stroke_hex, alpha), stroke=stroke))
    c.drawTextBlob(blob, x - w / 2, y, P(col(fill, alpha)))
    return w


# ---------- texture ----------

_grain = None


def grain_image():
    global _grain
    if _grain is None:
        rng = np.random.default_rng(7)
        n = rng.integers(0, 255, (H // 2, W // 2), dtype=np.uint8)
        a = np.stack([n, n, n, np.full_like(n, 255)], -1)
        _grain = skia.Image.fromarray(np.ascontiguousarray(a))
    return _grain


def chalk_write(c, text, cx, y, max_w, size, progress, color="#F2F2EA"):
    """Writes chalk text left-to-right. progress 0..1."""
    if progress <= 0:
        return
    tf = chalk_tf()
    font = skia.Font(tf, size)
    w = font.measureText(text)
    while w > max_w and size > 30:
        size -= 4
        font = skia.Font(tf, size)
        w = font.measureText(text)
    x = cx - w / 2
    c.save()
    c.clipRect(skia.Rect.MakeLTRB(x - 10, y - size * 1.2, x + w * ease_out(progress) + 10, y + size * 0.4))
    c.drawTextBlob(skia.TextBlob(text, font), x, y, P(col(color, 0.95)))
    c.restore()
    return x, w


def vignette(c, strength=0.5):
    c.drawRect(skia.Rect.MakeWH(W, H), P(shader=skia.GradientShader.MakeRadial(
        skia.Point(W / 2, H * 0.48), H * 0.75, [col("#000000", 0.0), col("#000000", 0.0), col("#000000", strength)], [0.0, 0.55, 1.0])))
    gp = skia.Paint(AntiAlias=True)
    gp.setAlphaf(0.05)
    gp.setBlendMode(skia.BlendMode.kOverlay)
    c.drawImageRect(grain_image(), skia.Rect.MakeWH(W, H), skia.SamplingOptions(), gp)


# ---------- captions ----------

def draw_caption(c, text, age, y=1580, color="#FFFFFF"):
    if not text:
        return
    pop = 0.8 + 0.2 * back_out(age / 0.12)
    size = 104
    tf = caption_tf()
    font = skia.Font(tf, size)
    w = font.measureText(text)
    if w > W - 120:
        size = size * (W - 120) / w
        font = skia.Font(tf, size)
        w = font.measureText(text)
    c.save()
    c.translate(W / 2, y)
    c.scale(pop, pop)
    blob = skia.TextBlob(text, font)
    c.drawTextBlob(blob, -w / 2 + 4, 8, P(col("#000000", 0.45), blur=6))
    c.drawTextBlob(blob, -w / 2, 0, P(INK, stroke=size * 0.2))
    c.drawTextBlob(blob, -w / 2, 0, P(color))
    c.restore()


def draw_karaoke(c, words, hot, age, y=1385, max_w=920):
    """TikTok-style karaoke: uppercase, white with dark outline, the word being spoken in yellow."""
    tf = caption_tf()
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
    pop = 0.85 + 0.15 * back_out(min(1.0, age / 0.12))
    c.save()
    c.translate(W / 2, y)
    c.scale(pop, pop)
    x = -total / 2
    for i, (w, wd) in enumerate(zip(words, widths)):
        blob = skia.TextBlob(w, font)
        c.drawTextBlob(blob, x + 5, 9, P(col("#000000", 0.45), blur=7))
        c.drawTextBlob(blob, x, 0, P("#2A1730", stroke=size * 0.19))
        c.drawTextBlob(blob, x, 0, P("#FFCE40" if i == hot else "#FFFFFF"))
        x += wd + space
    c.restore()
