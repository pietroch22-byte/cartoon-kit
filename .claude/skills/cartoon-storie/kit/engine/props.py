"""Props. Every prop is drawn with its base (feet) at (x, y), except wall items (y = center).
Each takes (c, x, y, t, **options). Add a new prop by writing a function and adding it to PROPS."""
import math

import numpy as np
import skia

from .draw import INK, INK_HEX, P, chalk_tf, col, draw_text_center, lin, oval, rad, rrect, shade, sign_tf


def _shadow(c, x, y, w):
    c.drawOval(oval(x, y, w, w * 0.14), P(col("#000000", 0.25), blur=w * 0.05))


def basin(c, x, y, t, splash_t=None, **_):
    wood, woodd = "#8B5E3C", "#5C3B22"
    top = y - 250
    _shadow(c, x, y, 120)
    for dx in (-95, 0, 95):
        c.drawLine(x + dx, y - (6 if dx == 0 else 0), x + dx * 0.55, top + 20, P(woodd, stroke=16))
    c.drawOval(oval(x, top + 22, 92, 18), P(wood, stroke=14))
    bowl = skia.Path()
    bowl.moveTo(x - 115, top)
    bowl.quadTo(x - 105, top + 85, x, top + 88)
    bowl.quadTo(x + 105, top + 85, x + 115, top)
    bowl.close()
    c.drawPath(bowl, P(shader=lin(x - 115, 0, x + 115, 0, ["#E9EEF2", "#FFFFFF", "#C9D2DA"])))
    c.drawPath(bowl, P(INK, stroke=6))
    c.drawOval(oval(x, top, 115, 22), P("#FFFFFF"))
    c.drawOval(oval(x, top + 2, 100, 16), P(shader=lin(x - 100, 0, x + 100, 0, ["#7FC4DD", "#B5E3F0", "#6AB2CC"])))
    for k in range(2):
        ph = ((t * 0.8 + k * 0.5) % 1.0)
        c.drawOval(oval(x, top + 2, 20 + 75 * ph, 3 + 12 * ph), P(col("#FFFFFF", 0.6 * (1 - ph)), stroke=3))
    c.drawOval(oval(x, top, 115, 22), P(INK, stroke=6))
    if splash_t is not None and 0 <= splash_t < 0.6:
        rng = np.random.default_rng(3)
        for i in range(10):
            a = rng.uniform(-2.6, -0.5)
            v = rng.uniform(250, 450)
            px = x + math.cos(a) * v * splash_t
            py = top + math.sin(a) * v * splash_t + 900 * splash_t ** 2
            c.drawCircle(px, py, 9 * (1 - splash_t / 0.6), P("#9AD4E8"))


def door(c, x, y, t, text="", color="#7A4E2E", **_):
    w, h = 300, 560
    left = x - w / 2
    c.drawRect(skia.Rect.MakeXYWH(left - 22, y - h - 22, w + 44, h + 22), P(shade(color, 0.6)))
    c.drawRect(skia.Rect.MakeXYWH(left, y - h, w, h), P(shader=lin(left, 0, left + w, 0, [color, shade(color, 1.1), shade(color, 0.85)])))
    for i in range(2):
        px = left + i * w / 2
        c.drawLine(px + w / 2, y - h, px + w / 2, y, P(INK, stroke=4))
        for py, ph in ((y - h + 40, 220), (y - h + 300, 210)):
            c.drawRRect(rrect(px + 22, py, w / 2 - 44, ph, 8), P(shade(color, 0.75), stroke=6))
    for dx in (-18, 18):
        c.drawCircle(x + dx, y - h * 0.48, 9, P("#D9B44A"))
    if text:
        _plaque(c, x, y - h - 82, text)


def _plaque(c, x, y, text, w=None):
    font_size = 44
    w = w or max(240, 26 * len(text) + 60)
    c.drawRRect(rrect(x - w / 2, y - 38, w, 76, 10), P("#E9DFC7"))
    c.drawRRect(rrect(x - w / 2, y - 38, w, 76, 10), P("#4A2F1C", stroke=6))
    draw_text_center(c, text, x, y + 16, font_size, sign_tf(), fill="#3A2716")


def bed(c, x, y, t, w=420, **_):
    x = x - w / 2
    _shadow(c, x + w / 2, y + 6, w * 0.55)
    iron = "#4F5B66"
    c.drawRRect(rrect(x, y - 150, w, 70, 14), P(shader=lin(0, y - 150, 0, y - 80, ["#FFFFFF", "#DDE3E8"])))
    c.drawRRect(rrect(x + 20, y - 175, 120, 40, 18), P("#FFFFFF"))
    c.drawRRect(rrect(x + 20, y - 175, 120, 40, 18), P(INK, stroke=4))
    c.drawRRect(rrect(x, y - 150, w, 70, 14), P(INK, stroke=5))
    for bx in (x, x + w):
        c.drawLine(bx, y - 230, bx, y, P(iron, stroke=12))
    c.drawLine(x, y - 210, x + 60, y - 210, P(iron, stroke=8))
    c.drawLine(x, y - 80, x + w, y - 80, P(iron, stroke=10))


def table(c, x, y, t, w=420, color="#8B5E3C", **_):
    _shadow(c, x, y, w * 0.55)
    for dx in (-w / 2 + 30, w / 2 - 30):
        c.drawLine(x + dx, y, x + dx, y - 250, P(shade(color, 0.7), stroke=20))
    c.drawRRect(rrect(x - w / 2, y - 285, w, 40, 8), P(shader=lin(0, y - 285, 0, y - 245, [shade(color, 1.15), color])))
    c.drawRRect(rrect(x - w / 2, y - 285, w, 40, 8), P(INK, stroke=5))


def desk(c, x, y, t, w=460, color="#6E7B87", papers=True, **_):
    _shadow(c, x, y, w * 0.55)
    c.drawRect(skia.Rect.MakeXYWH(x - w / 2 + 10, y - 260, w * 0.35, 260), P(shade(color, 0.85)))
    c.drawRect(skia.Rect.MakeXYWH(x - w / 2 + 10, y - 260, w * 0.35, 260), P(INK, stroke=5))
    for k in range(3):
        c.drawLine(x - w / 2 + 30, y - 200 + k * 75, x - w / 2 + w * 0.3, y - 200 + k * 75, P(INK, stroke=4))
    c.drawLine(x + w / 2 - 30, y, x + w / 2 - 30, y - 260, P(shade(color, 0.6), stroke=16))
    c.drawRRect(rrect(x - w / 2, y - 290, w, 36, 6), P(color))
    c.drawRRect(rrect(x - w / 2, y - 290, w, 36, 6), P(INK, stroke=5))
    if papers:
        for k in range(3):
            c.drawRect(skia.Rect.MakeXYWH(x + 20 + k * 6, y - 300 - k * 8, 120, 14), P("#FBF8EE"))
            c.drawRect(skia.Rect.MakeXYWH(x + 20 + k * 6, y - 300 - k * 8, 120, 14), P(INK, stroke=3))


def chair(c, x, y, t, color="#7A4E2E", **_):
    _shadow(c, x, y, 90)
    for dx in (-60, 60):
        c.drawLine(x + dx, y, x + dx, y - 170, P(shade(color, 0.7), stroke=12))
    c.drawRRect(rrect(x - 75, y - 185, 150, 26, 6), P(color))
    c.drawRRect(rrect(x - 70, y - 380, 20, 210, 6), P(color))
    c.drawRRect(rrect(x - 75, y - 380, 150, 34, 8), P(color))
    for r in (rrect(x - 75, y - 185, 150, 26, 6), rrect(x - 75, y - 380, 150, 34, 8)):
        c.drawRRect(r, P(INK, stroke=4))


def crate(c, x, y, t, size=200, **_):
    _shadow(c, x, y, size * 0.6)
    r = skia.Rect.MakeXYWH(x - size / 2, y - size, size, size)
    c.drawRect(r, P(shader=lin(0, y - size, 0, y, ["#C99A5B", "#9C7340"])))
    for k in (0.33, 0.66):
        c.drawLine(x - size / 2, y - size * k, x + size / 2, y - size * k, P("#7A5530", stroke=6))
    c.drawLine(x - size / 2, y - size, x + size / 2, y, P("#7A5530", stroke=8))
    c.drawRect(r, P(INK, stroke=6))


def barrel(c, x, y, t, **_):
    _shadow(c, x, y, 110)
    body = skia.Path()
    body.moveTo(x - 80, y)
    body.quadTo(x - 120, y - 140, x - 80, y - 280)
    body.lineTo(x + 80, y - 280)
    body.quadTo(x + 120, y - 140, x + 80, y)
    body.close()
    c.drawPath(body, P(shader=lin(x - 110, 0, x + 110, 0, ["#7A5530", "#B0814A", "#6B4A2E"])))
    for yy in (y - 60, y - 220):
        c.drawLine(x - 100, yy, x + 100, yy, P("#4F5B66", stroke=12))
    c.drawPath(body, P(INK, stroke=6))


def sign(c, x, y, t, text="SIGN", **_):
    c.drawLine(x, y, x, y - 380, P("#6B4A2E", stroke=18))
    w = max(260, 34 * len(text) + 70)
    c.drawRRect(rrect(x - w / 2, y - 470, w, 110, 10), P("#E9DFC7"))
    c.drawRRect(rrect(x - w / 2, y - 470, w, 110, 10), P("#4A2F1C", stroke=7))
    draw_text_center(c, text, x, y - 395, 54, sign_tf(), fill="#3A2716")


def money_bag(c, x, y, t, size=1.0, **_):
    s = size
    _shadow(c, x, y, 100 * s)
    bag = skia.Path()
    bag.moveTo(x - 40 * s, y - 190 * s)
    bag.quadTo(x - 150 * s, y - 120 * s, x - 110 * s, y)
    bag.lineTo(x + 110 * s, y)
    bag.quadTo(x + 150 * s, y - 120 * s, x + 40 * s, y - 190 * s)
    bag.close()
    c.drawPath(bag, P(shader=rad(x - 30 * s, y - 120 * s, 180 * s, ["#E3C489", "#B8925A"])))
    c.drawPath(bag, P(INK, stroke=6))
    c.drawLine(x - 45 * s, y - 190 * s, x + 45 * s, y - 190 * s, P("#7A5530", stroke=12 * s))
    draw_text_center(c, "$", x, y - 45 * s, 110 * s, sign_tf(), fill="#5C3B22")


def wall_clock(c, x, y, t, speed=1.0, **_):
    c.drawCircle(x, y, 95, P("#5C3B22"))
    c.drawCircle(x, y, 80, P("#FBF8EE"))
    for k in range(12):
        a = k * math.pi / 6
        c.drawLine(x + math.cos(a) * 62, y + math.sin(a) * 62, x + math.cos(a) * 72, y + math.sin(a) * 72, P(INK, stroke=5))
    m = t * speed * 2 * math.pi / 6
    c.drawLine(x, y, x + math.sin(m) * 60, y - math.cos(m) * 60, P(INK, stroke=6))
    c.drawLine(x, y, x + math.sin(m / 12) * 40, y - math.cos(m / 12) * 40, P(INK, stroke=9))
    c.drawCircle(x, y, 8, P(INK))


def painting(c, x, y, t, color="#6A8F6B", **_):
    c.drawRect(skia.Rect.MakeXYWH(x - 130, y - 100, 260, 200), P("#B8892E"))
    c.drawRect(skia.Rect.MakeXYWH(x - 112, y - 82, 224, 164), P(shader=lin(0, y - 82, 0, y + 82, ["#BFD9EA", color])))
    hill = skia.Path()
    hill.moveTo(x - 112, y + 82)
    hill.quadTo(x - 30, y - 10, x + 112, y + 40)
    hill.lineTo(x + 112, y + 82)
    hill.close()
    c.drawPath(hill, P(shade(color, 0.7)))
    c.drawRect(skia.Rect.MakeXYWH(x - 130, y - 100, 260, 200), P(INK, stroke=5))


def bookshelf(c, x, y, t, **_):
    _shadow(c, x, y, 200)
    c.drawRect(skia.Rect.MakeXYWH(x - 180, y - 620, 360, 620), P("#6B4A2E"))
    rng = np.random.default_rng(5)
    for r in range(4):
        sy = y - 600 + r * 150
        bx = x - 165
        while bx < x + 150:
            bw = rng.uniform(18, 34)
            bh = rng.uniform(90, 125)
            c.drawRect(skia.Rect.MakeXYWH(bx, sy + 130 - bh, bw, bh), P(["#8E2F2F", "#2F5E8E", "#4F7F52", "#B07D3A", "#6B5B95"][rng.integers(5)]))
            bx += bw + 3
        c.drawRect(skia.Rect.MakeXYWH(x - 180, sy + 130, 360, 20), P("#4A2F1C"))
    c.drawRect(skia.Rect.MakeXYWH(x - 180, y - 620, 360, 620), P(INK, stroke=6))


def street_lamp(c, x, y, t, lit=True, **_):
    c.drawLine(x, y, x, y - 700, P("#2E3238", stroke=18))
    c.drawRect(skia.Rect.MakeXYWH(x - 40, y - 30, 80, 30), P("#2E3238"))
    if lit:
        glow = P(col("#FFD27A", 0.4), blur=70)
        glow.setBlendMode(skia.BlendMode.kScreen)
        c.drawCircle(x, y - 760, 170, glow)
    lamp = skia.Path()
    lamp.moveTo(x - 50, y - 700)
    lamp.lineTo(x - 35, y - 820)
    lamp.lineTo(x + 35, y - 820)
    lamp.lineTo(x + 50, y - 700)
    lamp.close()
    c.drawPath(lamp, P("#FFE7A8" if lit else "#9AA4AE"))
    c.drawPath(lamp, P("#2E3238", stroke=8))
    c.drawLine(x - 60, y - 822, x + 60, y - 822, P("#2E3238", stroke=14))


def bell(c, x, y, t, swing=0.0, **_):
    """Hanging bell, y = top of the rope. swing = degrees of swing."""
    a = math.sin(t * 4) * swing
    c.save()
    c.rotate(a, x, y)
    c.drawLine(x, y, x, y + 60, P("#6B4A2E", stroke=10))
    b = skia.Path()
    b.moveTo(x - 30, y + 60)
    b.quadTo(x - 45, y + 150, x - 95, y + 200)
    b.lineTo(x + 95, y + 200)
    b.quadTo(x + 45, y + 150, x + 30, y + 60)
    b.close()
    c.drawPath(b, P(shader=lin(x - 95, 0, x + 95, 0, ["#8A6A1E", "#E0B84A", "#7A5A14"])))
    c.drawPath(b, P(INK, stroke=6))
    c.drawCircle(x, y + 210, 18, P("#5A4410"))
    c.restore()


def tree(c, x, y, t, color="#4F8A3A", **_):
    _shadow(c, x, y, 170)
    c.drawRRect(rrect(x - 26, y - 420, 52, 420, 18), P(shader=lin(x - 26, 0, x + 26, 0, ["#7A5530", "#5C3B22"])))
    sway = math.sin(t * 1.3) * 6
    for dx, dy, r in ((-90, -480, 150), (90, -500, 140), (0, -620, 170), (-40, -560, 130), (60, -420, 110)):
        c.drawCircle(x + dx + sway, y + dy, r, P(shade(color, 0.8)))
    for dx, dy, r in ((-90, -490, 130), (90, -510, 120), (0, -635, 150)):
        c.drawCircle(x + dx + sway - 10, y + dy - 10, r * 0.85, P(color))


def rock(c, x, y, t, size=1.0, **_):
    s = size
    p = skia.Path()
    p.moveTo(x - 130 * s, y)
    p.quadTo(x - 140 * s, y - 120 * s, x - 30 * s, y - 150 * s)
    p.quadTo(x + 110 * s, y - 160 * s, x + 140 * s, y)
    p.close()
    c.drawPath(p, P(shader=lin(0, y - 150 * s, 0, y, ["#A8A8A0", "#6E6E68"])))
    c.drawPath(p, P(INK, stroke=6))


def boat(c, x, y, t, color="#8B5E3C", sail=True, **_):
    """y = waterline."""
    rock_a = math.sin(t * 1.4) * 3
    c.save()
    c.rotate(rock_a, x, y)
    hull = skia.Path()
    hull.moveTo(x - 280, y - 110)
    hull.lineTo(x + 300, y - 110)
    hull.quadTo(x + 240, y + 20, x + 150, y + 30)
    hull.lineTo(x - 180, y + 30)
    hull.quadTo(x - 250, y + 10, x - 280, y - 110)
    hull.close()
    c.drawPath(hull, P(shader=lin(0, y - 110, 0, y + 30, [shade(color, 1.1), shade(color, 0.7)])))
    c.drawPath(hull, P(INK, stroke=7))
    c.drawLine(x - 280, y - 80, x + 290, y - 80, P(shade(color, 0.55), stroke=5))
    if sail:
        c.drawLine(x, y - 110, x, y - 700, P("#5C3B22", stroke=16))
        s = skia.Path()
        s.moveTo(x + 10, y - 680)
        s.quadTo(x + 230, y - 450, x + 10, y - 160)
        s.close()
        c.drawPath(s, P("#F4EEDC"))
        c.drawPath(s, P(INK, stroke=6))
    c.restore()


def cart(c, x, y, t, **_):
    _shadow(c, x, y, 200)
    c.drawRRect(rrect(x - 200, y - 230, 400, 120, 10), P("#9C7340"))
    c.drawRRect(rrect(x - 200, y - 230, 400, 120, 10), P(INK, stroke=6))
    c.drawLine(x + 200, y - 170, x + 360, y - 120, P("#6B4A2E", stroke=12))
    for dx in (-120, 120):
        c.drawCircle(x + dx, y - 75, 75, P("#6B4A2E", stroke=14))
        for k in range(6):
            a = k * math.pi / 3 + t
            c.drawLine(x + dx, y - 75, x + dx + math.cos(a) * 70, y - 75 + math.sin(a) * 70, P("#6B4A2E", stroke=6))


def campfire(c, x, y, t, **_):
    glow = P(col("#FF9B2F", 0.35), blur=80)
    glow.setBlendMode(skia.BlendMode.kScreen)
    c.drawCircle(x, y - 80, 220, glow)
    for a in (-20, 20):
        c.save()
        c.rotate(a, x, y - 20)
        c.drawRRect(rrect(x - 110, y - 40, 220, 34, 16), P("#6B4A2E"))
        c.restore()
    for k, (dx, h, colr) in enumerate(((-30, 150, "#FF6B2F"), (25, 180, "#FF9B2F"), (0, 120, "#FFD25A"))):
        f = 1 + 0.12 * math.sin(t * 11 + k * 2)
        fl = skia.Path()
        fl.moveTo(x + dx, y - 30 - h * f)
        fl.quadTo(x + dx + 60, y - 60, x + dx, y - 20)
        fl.quadTo(x + dx - 60, y - 60, x + dx, y - 30 - h * f)
        c.drawPath(fl, P(colr))


def house(c, x, y, t, color="#D9C29A", roof="#8E3B2E", lit=False, **_):
    w, h = 420, 360
    _shadow(c, x, y, w * 0.6)
    c.drawRect(skia.Rect.MakeXYWH(x - w / 2, y - h, w, h), P(shader=lin(0, y - h, 0, y, [color, shade(color, 0.8)])))
    c.drawRect(skia.Rect.MakeXYWH(x - w / 2, y - h, w, h), P(INK, stroke=6))
    r = skia.Path()
    r.moveTo(x - w / 2 - 40, y - h)
    r.lineTo(x, y - h - 220)
    r.lineTo(x + w / 2 + 40, y - h)
    r.close()
    c.drawPath(r, P(roof))
    c.drawPath(r, P(INK, stroke=6))
    c.drawRect(skia.Rect.MakeXYWH(x - 50, y - 180, 100, 180), P("#6B4A2E"))
    for dx in (-140, 140):
        c.drawRect(skia.Rect.MakeXYWH(x + dx - 45, y - 280, 90, 90), P("#FFE7A8" if lit else "#9FC9E6"))
        c.drawRect(skia.Rect.MakeXYWH(x + dx - 45, y - 280, 90, 90), P(INK, stroke=6))


def church(c, x, y, t, rod=False, bell_swing=0.0, color="#CFC3AC", **_):
    w, h = 460, 520
    _shadow(c, x, y, w * 0.6)
    tw = 190
    th = 1050
    c.drawRect(skia.Rect.MakeXYWH(x - w / 2, y - h, w, h), P(shader=lin(0, y - h, 0, y, [color, shade(color, 0.78)])))
    c.drawRect(skia.Rect.MakeXYWH(x - w / 2, y - h, w, h), P(INK, stroke=6))
    c.drawRect(skia.Rect.MakeXYWH(x - tw / 2, y - th, tw, th - h + 4), P(shader=lin(0, y - th, 0, y - h, [shade(color, 1.05), shade(color, 0.85)])))
    c.drawRect(skia.Rect.MakeXYWH(x - tw / 2, y - th, tw, th - h + 4), P(INK, stroke=6))
    belfry = skia.Rect.MakeXYWH(x - 60, y - th + 70, 120, 170)
    c.drawRect(belfry, P("#2A2A30"))
    bell(c, x, y - th + 80, t, swing=bell_swing * 0.6) if bell_swing else bell(c, x, y - th + 80, t)
    spire = skia.Path()
    spire.moveTo(x - tw / 2 - 20, y - th)
    spire.lineTo(x, y - th - 330)
    spire.lineTo(x + tw / 2 + 20, y - th)
    spire.close()
    c.drawPath(spire, P("#5E6B78"))
    c.drawPath(spire, P(INK, stroke=6))
    if rod:
        c.drawLine(x, y - th - 330, x, y - th - 470, P("#B87333", stroke=10))
        c.drawLine(x + tw / 2 + 5, y - th, x + tw / 2 + 5, y, P("#B87333", stroke=6))
    c.drawRRect(rrect(x - 70, y - 260, 140, 260, 70), P("#5C3B22"))
    c.drawRRect(rrect(x - 70, y - 260, 140, 260, 70), P(INK, stroke=6))
    c.drawCircle(x, y - 400, 55, P("#9FC9E6"))
    c.drawCircle(x, y - 400, 55, P(INK, stroke=6))


def well(c, x, y, t, **_):
    _shadow(c, x, y, 170)
    c.drawRRect(rrect(x - 150, y - 200, 300, 200, 20), P(shader=lin(0, y - 200, 0, y, ["#A8A8A0", "#78786F"])))
    c.drawRRect(rrect(x - 150, y - 200, 300, 200, 20), P(INK, stroke=6))
    for dx in (-130, 130):
        c.drawLine(x + dx, y - 200, x + dx, y - 470, P("#6B4A2E", stroke=16))
    r = skia.Path()
    r.moveTo(x - 190, y - 450)
    r.lineTo(x, y - 560)
    r.lineTo(x + 190, y - 450)
    r.close()
    c.drawPath(r, P("#8E3B2E"))
    c.drawPath(r, P(INK, stroke=6))


def jar(c, x, y, t, color="#B08A3E", **_):
    _shadow(c, x, y, 140)
    b = skia.Path()
    b.moveTo(x - 70, y - 380)
    b.quadTo(x - 220, y - 260, x - 120, y)
    b.lineTo(x + 120, y)
    b.quadTo(x + 220, y - 260, x + 70, y - 380)
    b.close()
    c.drawPath(b, P(shader=lin(x - 180, 0, x + 180, 0, [shade(color, 0.7), shade(color, 1.2), shade(color, 0.6)])))
    c.drawPath(b, P(INK, stroke=6))
    c.drawRRect(rrect(x - 85, y - 410, 170, 40, 10), P(shade(color, 0.8)))
    c.drawRRect(rrect(x - 85, y - 410, 170, 40, 10), P(INK, stroke=5))


def chalkboard(c, x, y, t, w=700, h=760, **_):
    """Wall item; (x, y) = top-left corner."""
    x0, y0 = x, y
    c.drawRRect(rrect(x0 - 26, y0 - 26, w + 52, h + 52, 14), P(shader=lin(0, y0, 0, y0 + h, ["#8A5A34", "#5C3B22"])))
    c.drawRect(skia.Rect.MakeXYWH(x0, y0, w, h), P(shader=rad(x0 + w * 0.4, y0 + h * 0.4, w, ["#3E5C47", "#2C4434", "#22362A"])))
    rng = np.random.default_rng(11)
    for _ in range(14):
        sx, sy = rng.uniform(x0, x0 + w), rng.uniform(y0, y0 + h)
        c.drawOval(oval(sx, sy, rng.uniform(40, 120), rng.uniform(10, 30)), P(col("#FFFFFF", 0.05), blur=12))
    c.drawRect(skia.Rect.MakeXYWH(x0 - 10, y0 + h + 6, w + 20, 18), P("#6B4A2E"))


def tower_building(c, x, y, t, rod=True, color="#7D8FA6", **_):
    w, h = 300, 1250
    c.drawRect(skia.Rect.MakeXYWH(x - w / 2, y - h, w, h), P(shader=lin(x - w / 2, 0, x + w / 2, 0, [shade(color, 1.15), shade(color, 0.8)])))
    for wy in range(int(y - h + 40), int(y - 40), 70):
        for wx in (-100, -35, 30, 95):
            c.drawRect(skia.Rect.MakeXYWH(x + wx - 18, wy, 36, 44), P("#CFE3F2"))
    c.drawRect(skia.Rect.MakeXYWH(x - w / 2, y - h, w, h), P(INK, stroke=6))
    if rod:
        c.drawLine(x, y - h, x, y - h - 220, P("#B87333", stroke=12))
        c.drawCircle(x, y - h - 225, 10, P("#B87333"))


PROPS = {
    "basin": basin, "door": door, "bed": bed, "table": table, "desk": desk, "chair": chair, "crate": crate,
    "barrel": barrel, "sign": sign, "money_bag": money_bag, "wall_clock": wall_clock, "painting": painting,
    "bookshelf": bookshelf, "street_lamp": street_lamp, "bell": bell, "tree": tree, "rock": rock, "boat": boat,
    "cart": cart, "campfire": campfire, "house": house, "church": church, "well": well, "jar": jar,
    "tower_building": tower_building,
}
WALL_PROPS = {"wall_clock", "painting", "bell"}

from .kitchen2d import KITCHEN_PROPS, KITCHEN_WALL
PROPS.update(KITCHEN_PROPS)
WALL_PROPS |= KITCHEN_WALL
