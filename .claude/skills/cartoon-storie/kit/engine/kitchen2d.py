"""Kitchen props for the 2D engine (Italian home kitchen). Base at (x, y) unless noted; wall items use top-left/centre."""
import math
import skia
from .draw import INK, P, col, lin, rad, oval, rrect, shade

def R(x, y, w, h): return skia.Rect.MakeXYWH(x, y, w, h)
def box(c, x, y, w, h, color, r=8, ink=5, grad=True):
    rr = rrect(x, y, w, h, r)
    c.drawRRect(rr, P(shader=lin(0, y, 0, y + h, [shade(color, 1.12), shade(color, 0.9)])) if grad else P(color))
    if ink: c.drawRRect(rr, P(INK, stroke=ink))
def shadow(c, x, y, w): c.drawOval(oval(x, y, w, w * 0.12), P(col("#000000", 0.22), blur=w * 0.05))

def backsplash(c, x, y, t, w=1080, h=260, **_):          # y = top
    c.drawRect(R(x, y, w, h), P("#EAF2EC"))
    s = 52
    for i in range(int(w / s) + 1):
        for j in range(int(h / s) + 1):
            if (i + j) % 2 == 0: c.drawRect(R(x + i * s, y + j * s, s, s), P("#BFDCD4"))
            c.drawCircle(x + i * s + s / 2, y + j * s + s / 2, 6, P("#4A8AC8"))
    c.drawLine(x, y, x + w, y, P(INK, stroke=4))

def stove(c, x, y, t, fire=1.0, **_):
    shadow(c, x, y, 260); w, h = 300, 400
    box(c, x - w / 2, y - h, w, h, "#EDE6D6")
    box(c, x - w / 2 - 6, y - h - 22, w + 12, 26, "#2A2A30", 6)
    box(c, x - 110, y - 250, 220, 160, "#3A3A42", 10)
    c.drawRRect(rrect(x - 90, y - 230, 180, 30, 6), P(col("#FFFFFF", 0.18)))
    for k in range(4): c.drawCircle(x - 105 + k * 70, y - 330, 15, P("#C43C3C")); c.drawCircle(x - 105 + k * 70, y - 330, 15, P(INK, stroke=4))
    burners = ((x - 75, 1.0), (x + 75, 0.8)) if fire <= 1.0 else ((x - 110, 1.0), (x - 37, 0.9), (x + 37, 1.05), (x + 110, 0.85))
    for k, (bx, s) in enumerate(burners):
        ph = t * 9 + k
        for lay, cl in ((1.0, "#E8402A"), (0.72, "#FF8A2A"), (0.45, "#FFE14A")):
            hh = (70 + 10 * math.sin(ph)) * s * lay * fire; ww = 34 * s * lay
            p = skia.Path(); p.moveTo(bx - ww, y - h - 22); p.quadTo(bx - ww, y - h - 22 - hh * 0.6, bx, y - h - 22 - hh); p.quadTo(bx + ww, y - h - 22 - hh * 0.6, bx + ww, y - h - 22); p.close()
            c.drawPath(p, P(cl))

def counter(c, x, y, t, w=360, color="#7FB5A2", top="#C8B89A", **_):
    shadow(c, x, y, w * 0.55); h = 400
    box(c, x - w / 2, y - h, w, h, color)
    n = max(1, int(w / 170))
    for k in range(n):
        dx = x - w / 2 + 12 + k * (w - 24) / n
        c.drawRRect(rrect(dx, y - h + 50, (w - 24) / n - 12, h - 80, 6), P(INK, stroke=4))
        c.drawRRect(rrect(dx + (w - 24) / n / 2 - 22, y - h + 70, 32, 10, 4), P("#B9C4CC"))
    box(c, x - w / 2 - 8, y - h - 24, w + 16, 28, top, 6)

def sink(c, x, y, t, **_):  # sits on counter top line y
    c.drawRRect(rrect(x - 90, y - 8, 180, 18, 6), P("#9AA6AE")); c.drawRRect(rrect(x - 90, y - 8, 180, 18, 6), P(INK, stroke=4))
    p = skia.Path(); p.moveTo(x + 40, y - 8); p.lineTo(x + 40, y - 90); p.quadTo(x + 40, y - 120, x + 5, y - 120); p.lineTo(x - 10, y - 110)
    c.drawPath(p, P("#B9C4CC", stroke=14)); c.drawPath(p, P(INK, stroke=3))

def fridge(c, x, y, t, **_):
    shadow(c, x, y, 220); w, h = 240, 820
    box(c, x - w / 2, y - h, w, h, "#F4EFE2", 26)
    c.drawLine(x - w / 2, y - h + 300, x + w / 2, y - h + 300, P(INK, stroke=5))
    for yy in (y - h + 150, y - h + 420): c.drawRRect(rrect(x - w / 2 + 18, yy, 14, 120, 6), P("#B9C4CC")); c.drawRRect(rrect(x - w / 2 + 18, yy, 14, 120, 6), P(INK, stroke=3))
    for k, cl in enumerate(("#E8467C", "#4AB0E8", "#FFD34A", "#6DBB5A")):
        c.drawRRect(rrect(x - 20 + (k % 2) * 50, y - h + 360 + k * 40, 40, 34, 6), P(cl)); c.drawRRect(rrect(x - 20 + (k % 2) * 50, y - h + 360 + k * 40, 40, 34, 6), P(INK, stroke=3))
    c.drawRect(R(x - 10, y - h + 520, 90, 120), P("#FFFFFF")); c.drawRect(R(x - 10, y - h + 520, 90, 120), P(INK, stroke=3))
    for k in range(4): c.drawLine(x, y - h + 550 + k * 22, x + 70, y - h + 550 + k * 22, P("#7A7A84", stroke=4))

def upper_cabinet(c, x, y, t, w=320, h=220, color="#7FB5A2", **_):  # top-left
    box(c, x, y, w, h, color, 10)
    for k in range(2):
        c.drawRRect(rrect(x + 14 + k * w / 2, y + 14, w / 2 - 28, h - 28, 6), P(INK, stroke=4))
        c.drawRRect(rrect(x + w / 2 + (-30 if k == 0 else 18), y + h - 70, 10, 40, 4), P("#E8E2D4"))

def pendant(c, x, y, t, night=False, **_):  # y = cord top
    c.drawLine(x, y, x, y + 300, P(INK, stroke=5))
    c.drawCircle(x, y + 420, 260, P(shader=rad(x, y + 420, 260, [col("#FFD9A0", 0.35), col("#FFD9A0", 0.0)])))
    p = skia.Path(); p.moveTo(x - 30, y + 300); p.lineTo(x + 30, y + 300); p.lineTo(x + 120, y + 400); p.lineTo(x - 120, y + 400); p.close()
    c.drawPath(p, P(shader=lin(0, y + 300, 0, y + 400, ["#F2643C", "#D94040"]))); c.drawPath(p, P(INK, stroke=5))
    c.drawOval(oval(x, y + 400, 120, 14), P("#FFE7B0")); c.drawOval(oval(x, y + 400, 120, 14), P(INK, stroke=4))

def beams(c, x, y, t, **_):
    for k, yy in enumerate((40, 150)):
        box(c, -20, yy, 1120, 46, "#6A4022", 4)
    for xx in (180, 900):
        box(c, xx - 23, 0, 46, 210, "#5A3418", 4)

def shelf(c, x, y, t, w=360, items="plates", **_):  # y = shelf line
    box(c, x - w / 2, y, w, 20, "#8A5A32", 4)
    if items == "plates":
        for k, cl in enumerate(("#F4EFE2", "#4A8AC8", "#F4EFE2", "#D94040", "#F4EFE2")):
            cx = x - w / 2 + 40 + k * (w - 80) / 4
            c.drawOval(oval(cx, y - 52, 34, 52), P(cl)); c.drawOval(oval(cx, y - 52, 34, 52), P(INK, stroke=4)); c.drawOval(oval(cx, y - 52, 18, 30), P(col("#000000", 0.08)))
    else:
        for k, cl in enumerate(("#F2C14A", "#C8643A", "#6DBB5A", "#D94040", "#E8E2D4")):
            cx = x - w / 2 + 36 + k * (w - 72) / 4; hh = 70 + (k % 2) * 24
            box(c, cx - 26, y - hh, 52, hh, "#DFEFF4", 8, 4); c.drawRect(R(cx - 20, y - hh * 0.75, 40, hh * 0.7), P(cl)); box(c, cx - 28, y - hh - 14, 56, 16, "#8A5A32", 4, 3)
    for k in range(4):
        cx = x - w / 2 + 50 + k * (w - 100) / 3
        c.drawLine(cx, y + 20, cx, y + 40, P(INK, stroke=4)); box(c, cx - 22, y + 40, 44, 44, ("#F2C14A", "#D94040", "#7FB5A2", "#F4EFE2")[k], 8, 4)

def garlic(c, x, y, t, n=6, color="#F4EFE2", **_):  # y = top
    sw = math.sin(t * 1.5 + x) * 4
    c.drawLine(x, y, x + sw, y + n * 46, P("#8A6A3A", stroke=6))
    for k in range(n):
        cx = x + sw * k / n; cy = y + 30 + k * 46
        c.drawOval(oval(cx, cy, 30, 26), P(color)); c.drawOval(oval(cx, cy, 30, 26), P(INK, stroke=4))

def peppers(c, x, y, t, n=7, **_):
    for k in range(n):
        cx = x + math.sin(t + k) * 2; cy = y + 20 + k * 40
        c.drawOval(oval(cx, cy, 14, 28), P("#D43A2A")); c.drawOval(oval(cx, cy, 14, 28), P(INK, stroke=3))
        c.drawLine(cx, cy - 28, cx, cy - 38, P("#3A6A2A", stroke=4))

def pot(c, x, y, t, color="#B9C4CC", w=150, **_):
    box(c, x - w / 2, y - w * 0.7, w, w * 0.7, color, 12)
    box(c, x - w / 2 - 20, y - w * 0.62, 24, 14, color, 4, 3); box(c, x + w / 2 - 4, y - w * 0.62, 24, 14, color, 4, 3)
    box(c, x - w / 2 - 6, y - w * 0.72 - 14, w + 12, 18, shade(color, 0.85), 8, 4)
    for k in range(3):
        a = (t * 0.6 + k / 3) % 1
        c.drawCircle(x - 30 + k * 30 + math.sin(t * 2 + k) * 10, y - w * 0.8 - a * 220, 18 + a * 20, P(col("#FFFFFF", 0.45 * (1 - a))))

def pan(c, x, y, t, **_):
    c.drawOval(oval(x, y - 14, 90, 22), P("#2A2A30")); c.drawOval(oval(x, y - 14, 90, 22), P(INK, stroke=4))
    c.drawLine(x + 85, y - 18, x + 200, y - 30, P("#2A2A30", stroke=16))
    c.drawOval(oval(x - 10, y - 20, 34, 12), P("#FFF4D6")); c.drawCircle(x - 10, y - 21, 10, P("#F2B51C"))

def bottle(c, x, y, t, color="#2A5A3A", h=200, **_):
    p = skia.Path(); p.moveTo(x - 28, y); p.lineTo(x - 28, y - h * 0.6); p.quadTo(x - 28, y - h * 0.72, x - 10, y - h * 0.78); p.lineTo(x - 10, y - h); p.lineTo(x + 10, y - h); p.lineTo(x + 10, y - h * 0.78); p.quadTo(x + 28, y - h * 0.72, x + 28, y - h * 0.6); p.lineTo(x + 28, y); p.close()
    c.drawPath(p, P(color)); c.drawPath(p, P(INK, stroke=4)); c.drawRect(R(x - 22, y - h * 0.45, 44, h * 0.25), P("#F4EFE2"))
    c.drawLine(x - 14, y - h * 0.55, x - 14, y - 20, P(col("#FFFFFF", 0.35), stroke=6))

def bread(c, x, y, t, **_):
    c.drawOval(oval(x, y - 34, 110, 40), P("#D9A05A")); c.drawOval(oval(x, y - 34, 110, 40), P(INK, stroke=4))
    for k in range(4): c.drawLine(x - 60 + k * 40, y - 54, x - 40 + k * 40, y - 22, P("#A86A2A", stroke=5))

def fruit_bowl(c, x, y, t, **_):
    for k, (dx, cl) in enumerate(((-40, "#E0402E"), (0, "#F2C14A"), (40, "#6DBB5A"), (-20, "#F28C2A"), (20, "#E0402E"))):
        c.drawCircle(x + dx, y - 60 - (k > 2) * 34, 30, P(cl)); c.drawCircle(x + dx, y - 60 - (k > 2) * 34, 30, P(INK, stroke=4))
    p = skia.Path(); p.moveTo(x - 90, y - 60); p.quadTo(x, y + 20, x + 90, y - 60); p.close()
    c.drawPath(p, P("#C8A060")); c.drawPath(p, P(INK, stroke=4))

def plate_food(c, x, y, t, food="lasagna", **_):
    c.drawOval(oval(x, y - 10, 110, 26), P("#FBFBF6")); c.drawOval(oval(x, y - 10, 110, 26), P(INK, stroke=4))
    if food == "lasagna":
        for k, cl in enumerate(("#F2C14A", "#D9502E", "#F4E4B0", "#D9502E")):
            c.drawRect(R(x - 60, y - 30 - k * 16, 120, 16), P(cl))
        c.drawRect(R(x - 60, y - 94, 120, 64), P(INK, stroke=4))
    else:
        c.drawOval(oval(x, y - 26, 70, 26), P("#E8B24A")); c.drawOval(oval(x, y - 26, 70, 26), P(INK, stroke=4))
        for k in range(5): c.drawCircle(x - 40 + k * 20, y - 30 - (k % 2) * 8, 8, P("#D9402E"))

def glass(c, x, y, t, **_):
    p = skia.Path(); p.moveTo(x - 24, y - 120); p.quadTo(x - 24, y - 60, x, y - 56); p.quadTo(x + 24, y - 60, x + 24, y - 120); p.close()
    c.drawPath(p, P(col("#DFEFF4", 0.7))); c.drawRect(R(x - 22, y - 96, 44, 30), P("#8A1A2A")); c.drawPath(p, P(INK, stroke=4))
    c.drawLine(x, y - 56, x, y - 6, P(INK, stroke=5)); c.drawOval(oval(x, y - 6, 24, 6), P(INK, stroke=5))

def table_front(c, x, y, t, w=900, h=360, items=(), **_):  # tablecloth table drawn in front of the cast
    shadow(c, x, y, w * 0.5)
    for dx in (-w / 2 + 50, w / 2 - 50): box(c, x + dx - 16, y - h + 60, 32, h - 60, "#7A4A28", 6, 4)
    top = y - h
    c.drawRRect(rrect(x - w / 2 - 20, top, w + 40, 150, 14), P("#FFFFFF"))
    sq = 30
    for i in range(int((w + 40) / sq) + 1):
        if i % 2 == 0: c.drawRect(R(x - w / 2 - 20 + i * sq, top, sq, 150), P(col("#D94040", 0.85)))
    for j in range(5):
        if j % 2 == 0: c.drawRect(R(x - w / 2 - 20, top + j * sq, w + 40, sq), P(col("#D94040", 0.45)))
    c.drawRRect(rrect(x - w / 2 - 20, top, w + 40, 150, 14), P(INK, stroke=6))
    for it in items:
        it = dict(it); fn = KITCHEN_PROPS[it.pop('type')]; fn(c, it.pop('x'), top + 30, t, **it)

def rug(c, x, y, t, w=1100, h=230, **_):  # y = top edge, floor item drawn behind
    cols = ("#C8643A", "#F2C14A", "#4A8AC8", "#F4EFE2")
    for k in range(16):
        p = skia.Path(); x0 = x - w / 2 + k * w / 16; p.moveTo(x0 + 40, y); p.lineTo(x0 + w / 16 + 40, y); p.lineTo(x0 + w / 16 - 30, y + h); p.lineTo(x0 - 30, y + h); p.close()
        c.drawPath(p, P(cols[k % 4]))

def plant(c, x, y, t, **_):
    shadow(c, x, y, 100)
    for k in range(9):
        a = -1.2 + k * 0.3 + math.sin(t * 1.2 + k) * 0.04
        ex, ey = x + math.sin(a) * 160, y - 140 - math.cos(a) * 170
        p = skia.Path(); p.moveTo(x, y - 140); p.quadTo((x + ex) / 2 + 30 * math.cos(a), (y - 140 + ey) / 2, ex, ey); p.quadTo((x + ex) / 2 - 30 * math.cos(a), (y - 140 + ey) / 2, x, y - 140)
        c.drawPath(p, P("#4F8A3A" if k % 2 else "#6DBB5A")); c.drawPath(p, P(INK, stroke=3))
    p = skia.Path(); p.moveTo(x - 70, y - 150); p.lineTo(x + 70, y - 150); p.lineTo(x + 50, y); p.lineTo(x - 50, y); p.close()
    c.drawPath(p, P("#C8643A")); c.drawPath(p, P(INK, stroke=5))

def cat(c, x, y, t, **_):
    br = 1 + 0.03 * math.sin(t * 2.5)
    c.drawOval(oval(x, y - 40, 90, 44 * br), P("#E08A3A")); c.drawOval(oval(x, y - 40, 90, 44 * br), P(INK, stroke=4))
    c.drawCircle(x + 80, y - 56, 38, P("#E08A3A")); c.drawCircle(x + 80, y - 56, 38, P(INK, stroke=4))
    for s in (-1, 1):
        p = skia.Path(); p.moveTo(x + 80 + s * 30, y - 76); p.lineTo(x + 80 + s * 22, y - 110); p.lineTo(x + 80 + s * 4, y - 90); p.close(); c.drawPath(p, P("#E08A3A")); c.drawPath(p, P(INK, stroke=3))
        c.drawLine(x + 80 + s * 18, y - 56, x + 80 + s * 6, y - 54, P(INK, stroke=4))
    c.drawLine(x - 80, y - 30, x - 130, y - 70, P("#E08A3A", stroke=16))

def frame_pic(c, x, y, t, color="#4A8AC8", **_):
    box(c, x - 70, y - 55, 140, 110, "#6A4022", 6); c.drawRect(R(x - 52, y - 38, 104, 76), P(color))
    c.drawCircle(x + 20, y - 15, 14, P("#FFE14A"))
    p = skia.Path(); p.moveTo(x - 52, y + 38); p.lineTo(x - 10, y - 5); p.lineTo(x + 30, y + 38); p.close(); c.drawPath(p, P(shade(color, 0.6)))

KITCHEN_PROPS = {k: v for k, v in dict(backsplash=backsplash, stove=stove, counter=counter, sink=sink, fridge=fridge, upper_cabinet=upper_cabinet,
    pendant=pendant, beams=beams, shelf=shelf, garlic=garlic, peppers=peppers, pot=pot, pan=pan, bottle=bottle, bread=bread,
    fruit_bowl=fruit_bowl, plate_food=plate_food, glass=glass, table_front=table_front, rug=rug, plant=plant, cat=cat, frame_pic=frame_pic).items()}
KITCHEN_WALL = {"backsplash", "upper_cabinet", "pendant", "beams", "shelf", "garlic", "peppers", "frame_pic", "rug"}
