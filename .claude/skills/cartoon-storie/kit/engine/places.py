"""Backgrounds (rooms and outdoor scenes) and weather/effects overlays."""
import math

import numpy as np
import skia

from .draw import H, INK, INK_HEX, P, W, col, lin, oval, rad, rrect, shade

HORIZON = 1250  # outdoor horizon line
FLOOR_TOP = 1400  # indoor wall/floor line


# ---------- rooms ----------

def _wall(c, wall, wainscot=True):
    c.drawRect(skia.Rect.MakeWH(W, FLOOR_TOP), P(shader=lin(0, 0, 0, FLOOR_TOP, [shade(wall, 0.78), wall, shade(wall, 1.08)])))
    for i in range(0, W + 90, 90):
        c.drawLine(i, 170, i, 1150, P(col("#FFFFFF", 0.06), stroke=24))
    c.drawRect(skia.Rect.MakeXYWH(0, 130, W, 40), P(shade(wall, 0.75)))
    c.drawLine(0, 170, W, 170, P(col(INK_HEX, 0.35), stroke=4))
    if wainscot:
        c.drawRect(skia.Rect.MakeXYWH(0, 1150, W, 260), P(shader=lin(0, 1150, 0, 1410, ["#8A6140", "#6B4A2E"])))
        c.drawRect(skia.Rect.MakeXYWH(0, 1140, W, 22), P("#5A3B22"))
        for i in range(6):
            c.drawRRect(rrect(30 + i * 180, 1195, 140, 170, 6), P("#5A3B22", stroke=5))
    else:
        c.drawRect(skia.Rect.MakeXYWH(0, FLOOR_TOP - 30, W, 30), P(shade(wall, 0.7)))


def _floor(c, style="checker"):
    top = FLOOR_TOP
    vx, vy = W / 2, 520
    base = {"checker": "#D9CDB4", "wood": "#A9784A", "carpet": "#5F6F86", "stone": "#9A968C", "marble": "#E6E1D6"}.get(style, "#D9CDB4")
    c.drawRect(skia.Rect.MakeXYWH(0, top, W, H - top), P(base))
    rows = [top]
    y, step = top, 34
    while y < H + 200:
        y += step
        step *= 1.32
        rows.append(y)

    def xat(k, yy):
        return vx + (vx + k * 150 - vx) * (yy - vy) / (H - vy)

    if style in ("checker", "marble", "stone"):
        dark = {"checker": "#8F7C66", "marble": "#B8B0A0", "stone": "#7E7A70"}[style]
        for r in range(len(rows) - 1):
            for k in range(-14, 15):
                if style == "checker" and (r + k) % 2:
                    continue
                y0, y1 = rows[r], rows[r + 1]
                pth = skia.Path()
                pth.moveTo(xat(k, y0), y0)
                pth.lineTo(xat(k + 1, y0), y0)
                pth.lineTo(xat(k + 1, y1), y1)
                pth.lineTo(xat(k, y1), y1)
                pth.close()
                if style == "checker":
                    c.drawPath(pth, P(dark))
                else:
                    c.drawPath(pth, P(dark, stroke=3))
    elif style == "wood":
        for k in range(-14, 15):
            c.drawLine(xat(k, top), top, xat(k, H), H, P(shade(base, 0.75), stroke=4))
    elif style == "carpet":
        c.drawRect(skia.Rect.MakeXYWH(0, top, W, H - top), P(shader=lin(0, top, 0, H, [shade(base, 0.8), base])))
    c.drawRect(skia.Rect.MakeXYWH(0, top, W, 160), P(shader=lin(0, top, 0, top + 160, [col("#000000", 0.28), col("#000000", 0.0)])))


def _window(c, x0, y0, w, h, t, kind="arched", night=False):
    frame = "#5A3B22"
    path = skia.Path()
    if kind == "arched":
        path.moveTo(x0, y0 + h)
        path.lineTo(x0, y0 + w / 2)
        path.arcTo(skia.Rect.MakeXYWH(x0, y0, w, w), 180, 180, False)
        path.lineTo(x0 + w, y0 + h)
        path.close()
    else:
        path.addRect(skia.Rect.MakeXYWH(x0, y0, w, h))
        frame = "#3E4650" if kind == "city" else frame
    c.drawPath(path, P(frame, stroke=36))
    sky = ["#0E1A33", "#22365C", "#3B4F78"] if night else ["#9FC9E6", "#D8ECF6", "#F7F3E4"]
    c.drawPath(path, P(shader=lin(0, y0, 0, y0 + h, sky)))
    c.save()
    c.clipPath(path, doAntiAlias=True)
    if kind == "city":
        rng = np.random.default_rng(4)
        bx = x0 - 20
        while bx < x0 + w:
            bw, bh = rng.uniform(60, 130), rng.uniform(h * 0.3, h * 0.9)
            c.drawRect(skia.Rect.MakeXYWH(bx, y0 + h - bh, bw, bh), P("#5C6F8A" if not night else "#1E2A40"))
            for wy in np.arange(y0 + h - bh + 20, y0 + h, 40):
                for wx in np.arange(bx + 10, bx + bw - 15, 28):
                    if rng.random() < (0.5 if night else 0.3):
                        c.drawRect(skia.Rect.MakeXYWH(wx, wy, 14, 20), P("#FFE7A8" if night else "#C9DCEA"))
            bx += bw + 8
    elif not night:
        for i in range(3):
            cx = x0 + w * (0.2 + 0.3 * i) + math.sin(t * 0.2 + i) * 20
            c.drawOval(oval(cx, y0 + h * 0.35 + i * 60, 90, 28), P(col("#FFFFFF", 0.7), blur=10))
    else:
        c.drawCircle(x0 + w * 0.7, y0 + h * 0.25, 40, P("#F4F1DE"))
    c.restore()
    if kind != "city":
        c.drawLine(x0 + w / 2, y0, x0 + w / 2, y0 + h, P(frame, stroke=14))
        for k in (0.42, 0.7):
            c.drawLine(x0, y0 + h * k, x0 + w, y0 + h * k, P(frame, stroke=12))
    else:
        c.drawLine(x0 + w / 2, y0, x0 + w / 2, y0 + h, P(frame, stroke=10))
    c.drawRect(skia.Rect.MakeXYWH(x0 - 40, y0 + h, w + 80, 30), P(shade(frame, 1.2)))


def _beam(c, x0, y0, x1, y1, spread, alpha=0.16):
    beam = skia.Path()
    beam.moveTo(x0, y0)
    beam.lineTo(x0 + 40, y0 - 60)
    beam.lineTo(x1 + spread, y1)
    beam.lineTo(x1 - spread * 0.3, y1 + 120)
    beam.close()
    p = P(col("#FFF2C4", alpha), blur=30)
    p.setBlendMode(skia.BlendMode.kScreen)
    c.drawPath(beam, p)


def _sconce(c, x, y, t):
    flick = 1 + 0.08 * math.sin(t * 13) + 0.05 * math.sin(t * 7.3)
    glow = P(col("#FFD27A", 0.35), blur=60 * flick)
    glow.setBlendMode(skia.BlendMode.kScreen)
    c.drawCircle(x, y - 40, 110 * flick, glow)
    c.drawRRect(rrect(x - 14, y - 10, 28, 70, 8), P("#B8892E"))
    c.drawOval(oval(x, y - 10, 34, 10), P("#C99A3C"))
    flame = skia.Path()
    flame.moveTo(x, y - 75 * flick)
    flame.quadTo(x + 18, y - 30, x, y - 14)
    flame.quadTo(x - 18, y - 30, x, y - 75 * flick)
    c.drawPath(flame, P("#FFB648"))


def _ceiling_light(c, x, t):
    c.drawLine(x, 0, x, 120, P("#3E4650", stroke=6))
    c.drawRRect(rrect(x - 150, 120, 300, 26, 8), P("#F2F4F6"))
    glow = P(col("#FFFFFF", 0.25), blur=60)
    glow.setBlendMode(skia.BlendMode.kScreen)
    c.drawOval(oval(x, 200, 260, 90), glow)


def _columns(c, color):
    for x in (90, 990):
        c.drawRect(skia.Rect.MakeXYWH(x - 60, 170, 120, FLOOR_TOP - 170), P(shader=lin(x - 60, 0, x + 60, 0, [shade(color, 0.7), shade(color, 1.15), shade(color, 0.7)])))
        for k in range(-2, 3):
            c.drawLine(x + k * 20, 220, x + k * 20, FLOOR_TOP - 60, P(shade(color, 0.6), stroke=3))
        c.drawRect(skia.Rect.MakeXYWH(x - 80, 170, 160, 50), P(shade(color, 0.85)))
        c.drawRect(skia.Rect.MakeXYWH(x - 80, FLOOR_TOP - 60, 160, 60), P(shade(color, 0.85)))


def room(c, t, wall="#E2CFA6", floor="checker", window="arched", window_x=70, lamp="sconce", lamp_x=560,
         night=False, wainscot=True, columns=False, banner=None, **_):
    _wall(c, wall, wainscot)
    if columns:
        _columns(c, "#D8CBB0")
    if banner:
        for x in (330, 750):
            b = skia.Path()
            b.moveTo(x - 80, 200)
            b.lineTo(x + 80, 200)
            b.lineTo(x + 80, 900)
            b.lineTo(x, 820)
            b.lineTo(x - 80, 900)
            b.close()
            c.drawPath(b, P(banner))
            c.drawPath(b, P(INK, stroke=5))
    if window and window != "none":
        if window == "city":
            _window(c, window_x, 330, 420, 620, t, "city", night)
        else:
            _window(c, window_x, 330, 300, 720, t, window, night)
    if lamp == "sconce":
        _sconce(c, lamp_x, 640, t)
    elif lamp == "ceiling":
        _ceiling_light(c, lamp_x, t)
    _floor(c, floor)
    if window and window != "none" and not night and window != "city":
        _beam(c, window_x + 300, 700, window_x + 910, 1720, 260)
    if night:
        c.drawRect(skia.Rect.MakeWH(W, H), P(col("#0A1430", 0.35)))


# ---------- outdoor ----------

SKIES = {
    "day": ["#6FB1E0", "#A9D3EE", "#E4F1F7"],
    "sunset": ["#3B4C8C", "#C0607A", "#F7A65A"],
    "night": ["#070E22", "#14244A", "#2C3F6B"],
    "storm": ["#1F2630", "#3A4552", "#5A6673"],
    "dawn": ["#8DA9D4", "#F1C6A8", "#FCE6C4"],
}
GROUNDS = {"grass": "#6FA34E", "sand": "#E2C88E", "snow": "#EEF3F7", "street": "#7C7F84", "dirt": "#A5825A",
           "water": "#3C7FB0", "stone": "#9A968C"}


def outdoor(c, t, sky="day", ground="grass", far="hills", sun=True, horizon=HORIZON, **_):
    c.drawRect(skia.Rect.MakeWH(W, horizon + 10), P(shader=lin(0, 0, 0, horizon, SKIES.get(sky, SKIES["day"]))))
    rng = np.random.default_rng(2)
    if sky == "night":
        for _ in range(90):
            x, y = rng.uniform(0, W), rng.uniform(0, horizon * 0.8)
            tw = 0.5 + 0.5 * math.sin(t * rng.uniform(1, 4) + x)
            c.drawCircle(x, y, rng.uniform(1.5, 4), P(col("#FFFFFF", 0.4 + 0.6 * tw)))
        if sun:
            glow = P(col("#F4F1DE", 0.25), blur=60)
            c.drawCircle(780, 330, 160, glow)
            c.drawCircle(780, 330, 85, P("#F4F1DE"))
    elif sky in ("day", "sunset", "dawn") and sun:
        sy = 380 if sky == "day" else horizon - 260
        sc = "#FFF4C2" if sky == "day" else "#FFC86B"
        glow = P(col(sc, 0.45), blur=80)
        glow.setBlendMode(skia.BlendMode.kScreen)
        c.drawCircle(800, sy, 230, glow)
        c.drawCircle(800, sy, 95, P(sc))
    if sky in ("day", "sunset", "dawn", "storm"):
        cc = "#FFFFFF" if sky == "day" else ("#F3C8B0" if sky != "storm" else "#2A323D")
        for i in range(5):
            cx = (rng.uniform(0, W) + t * (12 if sky != "storm" else 40)) % (W + 400) - 200
            cy = rng.uniform(150, horizon * 0.55)
            a = 0.85 if sky != "storm" else 0.95
            for dx, dy, r in ((-90, 10, 70), (0, -20, 95), (95, 10, 70)):
                c.drawCircle(cx + dx, cy + dy, r * (1.6 if sky == "storm" else 1), P(col(cc, a), blur=6))

    # far layer
    if far == "hills":
        for k, (hc, yo) in enumerate((("#8DB87A", -110), ("#79A866", -40))):
            p = skia.Path()
            p.moveTo(0, horizon)
            for x in range(0, W + 60, 60):
                p.lineTo(x, horizon + yo - 60 * math.sin(x / 260 + k * 2) - 30)
            p.lineTo(W, horizon + 10)
            p.close()
            c.drawPath(p, P(hc if sky == "day" else shade(hc, 0.55)))
    elif far == "mountains":
        p = skia.Path()
        p.moveTo(0, horizon)
        for x, y in ((120, horizon - 380), (300, horizon - 200), (520, horizon - 520), (760, horizon - 240), (950, horizon - 420), (1080, horizon - 300)):
            p.lineTo(x, y)
        p.lineTo(W, horizon + 10)
        p.close()
        c.drawPath(p, P(shade("#7D8A9A", 0.6 if sky == "night" else 1)))
    elif far in ("city", "town"):
        rng2 = np.random.default_rng(9)
        x = -20
        while x < W:
            bw = rng2.uniform(90, 170)
            bh = rng2.uniform(150, 420 if far == "city" else 220)
            bc = "#566A85" if sky == "day" else "#1C2638"
            c.drawRect(skia.Rect.MakeXYWH(x, horizon - bh, bw, bh + 10), P(bc))
            if far == "town":
                r = skia.Path()
                r.moveTo(x - 10, horizon - bh)
                r.lineTo(x + bw / 2, horizon - bh - 70)
                r.lineTo(x + bw + 10, horizon - bh)
                r.close()
                c.drawPath(r, P(shade("#8E3B2E", 0.5 if sky != "day" else 1)))
            for wy in np.arange(horizon - bh + 25, horizon - 10, 45):
                for wx in np.arange(x + 15, x + bw - 20, 35):
                    if rng2.random() < 0.35:
                        c.drawRect(skia.Rect.MakeXYWH(wx, wy, 14, 20), P("#FFE7A8" if sky != "day" else "#C9DCEA"))
            x += bw + 6
    elif far == "sea":
        c.drawRect(skia.Rect.MakeXYWH(0, horizon - 120, W, 130), P(shader=lin(0, horizon - 120, 0, horizon, ["#3C7FB0", "#2E6A96"])))

    # ground
    gc = GROUNDS.get(ground, GROUNDS["grass"])
    if sky in ("night", "storm"):
        gc = shade(gc, 0.5)
    elif sky == "sunset":
        gc = shade(gc, 0.8)
    c.drawRect(skia.Rect.MakeXYWH(0, horizon, W, H - horizon), P(shader=lin(0, horizon, 0, H, [shade(gc, 0.85), gc])))
    if ground == "water":
        for k in range(14):
            y = horizon + 30 + k * k * 4.2
            ph = t * 1.5 + k
            p = skia.Path()
            p.moveTo(0, y)
            for x in range(0, W + 40, 40):
                p.lineTo(x, y + math.sin(x / 70 + ph) * (3 + k))
            c.drawPath(p, P(col("#FFFFFF", 0.18), stroke=3 + k * 0.3))
    elif ground == "street":
        c.drawRect(skia.Rect.MakeXYWH(0, horizon, W, 90), P(shade(gc, 1.35)))
        for x in range(-100, W + 200, 260):
            c.drawRect(skia.Rect.MakeXYWH(x, 1700, 140, 18), P("#F2E6A0"))
    elif ground in ("grass", "dirt", "sand"):
        rng3 = np.random.default_rng(6)
        for _ in range(60):
            x, y = rng3.uniform(0, W), rng3.uniform(horizon + 40, H)
            c.drawLine(x, y, x + 6, y - 14 * (y - horizon) / 600, P(shade(gc, 0.75), stroke=3))
    if sky == "night":
        c.drawRect(skia.Rect.MakeWH(W, H), P(col("#0A1430", 0.25)))


PLACE_TYPES = {"room": room, "outdoor": outdoor}

# ready-made places a story can name directly
PRESETS = {
    "hospital": {"type": "room", "wall": "#E2CFA6", "floor": "checker", "window": "arched"},
    "ward": {"type": "room", "wall": "#D6DCCF", "floor": "checker", "window": "none", "lamp_x": 960},
    "office": {"type": "room", "wall": "#E6E9EC", "floor": "carpet", "window": "city", "window_x": 560, "lamp": "ceiling", "lamp_x": 300, "wainscot": False},
    "palace": {"type": "room", "wall": "#9E3B2E", "floor": "marble", "window": "none", "columns": True, "banner": "#D4A72C", "lamp_x": 540},
    "study": {"type": "room", "wall": "#C9B38A", "floor": "wood", "window": "square", "window_x": 640},
    "tavern": {"type": "room", "wall": "#8A6A4A", "floor": "wood", "window": "square", "night": True},
    "field": {"type": "outdoor", "sky": "day", "ground": "grass", "far": "hills"},
    "town_day": {"type": "outdoor", "sky": "day", "ground": "dirt", "far": "town"},
    "town_night": {"type": "outdoor", "sky": "night", "ground": "dirt", "far": "town"},
    "storm": {"type": "outdoor", "sky": "storm", "ground": "dirt", "far": "town", "sun": False},
    "sea": {"type": "outdoor", "sky": "day", "ground": "water", "far": "none"},
    "sea_storm": {"type": "outdoor", "sky": "storm", "ground": "water", "far": "none", "sun": False},
    "desert": {"type": "outdoor", "sky": "day", "ground": "sand", "far": "mountains"},
    "city_street": {"type": "outdoor", "sky": "day", "ground": "street", "far": "city"},
    "snowfield": {"type": "outdoor", "sky": "dawn", "ground": "snow", "far": "mountains"},
    "canyon": {"type": "outdoor", "sky": "sunset", "ground": "dirt", "far": "mountains"},
}


def draw_place(c, t, place):
    spec = dict(PRESETS.get(place.get("preset"), {}))
    spec.update({k: v for k, v in place.items() if k != "preset"})
    fn = PLACE_TYPES[spec.pop("type", "room")]
    fn(c, t, **spec)


# ---------- weather / effects (drawn over the scene) ----------

def fx_rain(c, t, strength=1.0):
    rng = np.random.default_rng(1)
    n = int(160 * strength)
    for i in range(n):
        x0 = rng.uniform(-200, W + 200)
        sp = rng.uniform(1600, 2400)
        y = (rng.uniform(0, H) + t * sp) % (H + 200) - 100
        x = x0 - (y * 0.18)
        c.drawLine(x, y, x - 10, y + 55, P(col("#C9D8E6", 0.55), stroke=3))


def fx_snow(c, t, strength=1.0):
    rng = np.random.default_rng(2)
    for i in range(int(120 * strength)):
        x0 = rng.uniform(0, W)
        sp = rng.uniform(60, 160)
        y = (rng.uniform(0, H) + t * sp) % H
        x = x0 + math.sin(t + i) * 25
        c.drawCircle(x, y, rng.uniform(4, 9), P(col("#FFFFFF", 0.85)))


def fx_lightning(c, t, strikes, x=540, target_y=900):
    """strikes: list of absolute times. Draws the bolt and a screen flash."""
    for st in strikes:
        dt = t - st
        if 0 <= dt < 0.35:
            rng = np.random.default_rng(int(st * 100))
            p = skia.Path()
            px, py = x + rng.uniform(-150, 150), -20
            p.moveTo(px, py)
            while py < target_y:
                py += rng.uniform(60, 120)
                px += rng.uniform(-70, 70)
                p.lineTo(px, min(py, target_y))
            a = 1 - dt / 0.35
            glow = P(col("#CFE3FF", 0.8 * a), stroke=26, blur=14)
            c.drawPath(p, glow)
            c.drawPath(p, P(col("#FFFFFF", a), stroke=8))
            c.drawRect(skia.Rect.MakeWH(W, H), P(col("#FFFFFF", 0.55 * a * a)))


def fx_dust(c, t, strength=1.0):
    rng = np.random.default_rng(3)
    for i in range(int(40 * strength)):
        x = (rng.uniform(0, W) + t * rng.uniform(10, 40)) % W
        y = rng.uniform(300, H - 200) + math.sin(t + i) * 20
        c.drawCircle(x, y, rng.uniform(2, 5), P(col("#FFF2C4", 0.35)))


def fx_sparkles(c, t, strength=1.0, x=540, y=900):
    rng = np.random.default_rng(4)
    for i in range(int(14 * strength)):
        ph = (t * 1.2 + rng.uniform(0, 1)) % 1.0
        sx, sy = x + rng.uniform(-300, 300), y + rng.uniform(-300, 300) - ph * 80
        s = 26 * math.sin(ph * math.pi)
        p = skia.Path()
        p.moveTo(sx, sy - s)
        p.quadTo(sx, sy, sx + s, sy)
        p.quadTo(sx, sy, sx, sy + s)
        p.quadTo(sx, sy, sx - s, sy)
        p.quadTo(sx, sy, sx, sy - s)
        c.drawPath(p, P(col("#FFE27A", 0.9)))


def fx_smoke(c, t, strength=1.0, x=540, y=1100):
    rng = np.random.default_rng(5)
    for i in range(int(12 * strength)):
        ph = (t * 0.35 + i / 12) % 1.0
        sx = x + rng.uniform(-120, 120) + ph * 80
        sy = y - ph * 700
        c.drawCircle(sx, sy, 60 + ph * 140, P(col("#8A8A8A", 0.35 * (1 - ph)), blur=20))


def fx_dark(c, t, strength=1.0):
    c.drawRect(skia.Rect.MakeWH(W, H), P(col("#0A1430", 0.45 * strength)))


def fx_explosion(c, t, start, x=540, y=1300):
    dt = t - start
    if dt < 0:
        return
    if dt < 0.25:
        c.drawRect(skia.Rect.MakeWH(W, H), P(col("#FFF2C4", 0.8 * (1 - dt / 0.25))))
    k = min(1.0, dt / 0.6)
    fade = max(0.0, 1 - max(0.0, dt - 0.8) / 1.5)
    if fade <= 0:
        return
    for r, colr, a in ((520, "#FF6B2F", 0.55), (380, "#FF9B2F", 0.7), (230, "#FFE27A", 0.85)):
        glow = P(col(colr, a * fade), blur=40)
        glow.setBlendMode(skia.BlendMode.kScreen)
        c.drawCircle(x, y - 200 * k, r * (0.3 + 0.7 * k), glow)
    rng = np.random.default_rng(8)
    for i in range(16):
        a = rng.uniform(math.pi * 1.05, math.pi * 1.95)
        v = rng.uniform(500, 1100)
        px, py = x + math.cos(a) * v * dt, y + math.sin(a) * v * dt + 700 * dt * dt
        c.drawRect(skia.Rect.MakeXYWH(px, py, 18, 12), P(col("#3A2A1E", fade)))


FX = {"rain": fx_rain, "snow": fx_snow, "dust": fx_dust, "sparkles": fx_sparkles, "smoke": fx_smoke, "dark": fx_dark}
