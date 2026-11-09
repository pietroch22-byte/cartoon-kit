"""Shot types. Each draws one frame of a shot: (c, ctx, shot, beat, t)."""
import math

import skia

from . import characters as C
from . import places as PL
from . import props as PR
from .draw import H, INK, P, W, back_out, caption_tf, chalk_tf, clamp01, col, ease, ease_out, lin, rrect, sign_tf

CHAR_SCALE = 2.1  # default character size; Ricks-style characters fill the frame
CHAR_Y = 1800


def place_of(ctx, beat):
    p = beat.get("place") or ctx.default_place
    if isinstance(p, str):
        return dict(ctx.places.get(p, {"preset": p}))
    return dict(p)


def draw_background(c, ctx, beat, t, blur=0):
    place = place_of(ctx, beat)
    if blur:
        c.saveLayer(None, skia.Paint(ImageFilter=skia.ImageFilters.Blur(blur, blur)))
        PL.draw_place(c, t, place)
        c.restore()
    else:
        PL.draw_place(c, t, place)


def _scaled(c, x, y, s, fn):
    c.save()
    c.translate(x, y)
    c.scale(s, s)
    c.translate(-x, -y)
    fn()
    c.restore()


def _char_x(e, ctx, beat, t):
    x = e.get("x", 540)
    if "walk_to" not in e:
        return x, None, e.get("facing", 1)
    t0 = beat["_start"] + e.get("walk_start", 0.0)
    dur = e.get("walk_time", 1.4)
    k = clamp01((t - t0) / dur)
    x2 = e["walk_to"]
    pos = x + (x2 - x) * ease(k)
    moving = 0 < k < 1
    facing = e.get("facing", 1 if x2 >= x else -1)
    walk = (pos / (55 * e.get("scale", CHAR_SCALE))) if moving else None
    return pos, walk, facing


def draw_cast(c, ctx, beat, t, extra=None):
    items = list(extra or [])
    crowd = beat.get("crowd")
    if crowd:
        n = crowd.get("n", 5)
        specs = C.crowd_specs(n, crowd.get("seed", 1), crowd.get("hats"), crowd.get("bodies"))
        x0, x1 = crowd.get("x_range", [80, 1000])
        y = crowd.get("y", 1500)
        for i, spec in enumerate(specs):
            x = x0 + (x1 - x0) * (i + 0.5) / n
            yy = y + (i % 2) * 40
            items.append((yy, "crowd", (spec, x, yy, i, crowd)))
    for e in beat.get("cast", []):
        items.append((e.get("y", CHAR_Y), "char", e))
    for _, kind, e in sorted(items, key=lambda it: it[0]):
        if kind == "char":
            spec = ctx.cast[e["id"]]
            x, walk, facing = _char_x(e, ctx, beat, t)
            C.draw_character(c, spec, x, e.get("y", CHAR_Y), e.get("scale", CHAR_SCALE), facing,
                             e.get("pose", "idle"), e.get("face", "neutral"), t, seed=sum(map(ord, e["id"])) % 7,
                             walk=walk, anim=e.get("anim"), hold=e.get("hold"))
        elif kind == "crowd":
            spec, x, yy, i, cr = e
            facing = cr.get("facing", 1 if x < 540 else -1)
            C.draw_character(c, spec, x, yy, cr.get("scale", 1.3), facing, cr.get("pose", "idle"),
                             cr.get("face", "neutral"), t, seed=i * 1.7, anim=cr.get("anim"))
        else:
            e(c)


def prop_items(c, ctx, beat, t):
    """Wall props are drawn now; standing props are returned for depth sorting with the cast."""
    extra = []
    for p in beat.get("props", []):
        fn = PR.PROPS[p["type"]]
        s = p.get("scale", 1.0)
        opts = {k: v for k, v in p.items() if k not in ("type", "x", "y", "scale")}
        if p["type"] == "basin":
            st = ctx.last_sfx("splash", t)
            opts["splash_t"] = (t - st) if st is not None else None
        draw = (lambda cc, p=p, s=s, fn=fn, opts=opts: _scaled(cc, p["x"], p["y"], s, lambda: fn(cc, p["x"], p["y"], t, **opts)))
        if p["type"] in PR.WALL_PROPS or p.get("behind"):
            draw(c)
        else:
            extra.append((p["y"] - 1, "prop", draw))
    return extra


def draw_fx(c, ctx, beat, t):
    for f in beat.get("fx", []):
        kind = f["type"]
        if kind == "explosion":
            st = ctx.word_time(beat, f["at_word"]) if "at_word" in f else beat["_start"] + f.get("at", 0.0)
            PL.fx_explosion(c, t, st, f.get("x", 540), f.get("y", 1300))
        elif kind == "lightning":
            st = ctx.word_time(beat, f["at_word"]) if "at_word" in f else beat["_start"] + f.get("at", 0.3)
            PL.fx_lightning(c, t, [st], f.get("x", 540), f.get("target_y", 900))
        elif kind in PL.FX:
            fn = PL.FX[kind]
            kw = {k: v for k, v in f.items() if k in ("strength", "x", "y")}
            fn(c, t, **kw)


# ---------- shot types ----------

def shot_wide(c, ctx, shot, beat, t):
    draw_background(c, ctx, beat, t)
    extra = prop_items(c, ctx, beat, t)
    draw_cast(c, ctx, beat, t, extra)
    draw_fx(c, ctx, beat, t)


def shot_closeup(c, ctx, shot, beat, t):
    draw_background(c, ctx, beat, t, blur=16)
    c.drawRect(skia.Rect.MakeWH(W, H), P(col("#000000", 0.15)))
    e = beat["cast"][0]
    spec = ctx.cast[e["id"]]
    hands = beat.get("hands")
    pose = "show_hands" if hands else e.get("pose", "idle")
    out = C.draw_character(c, spec, e.get("x", 540), 2010, 3.0, e.get("facing", 1), pose, e.get("face", "shock"), t,
                           anim=e.get("anim"), big_hands=bool(hands), hold=e.get("hold"))
    if hands:
        germ_t, clean_t = None, None
        for b in shot["chain"]:
            if "germs_at_word" in b and germ_t is None:
                germ_t = ctx.word_time(b, b["germs_at_word"])
            if "clean_at_word" in b:
                clean_t = ctx.word_time(b, b["clean_at_word"])
        germs = clamp01((t - germ_t) / 0.6) if (hands == "germs" and germ_t is not None) else 0.0
        if clean_t is not None and t > clean_t:
            germs *= 1 - clamp01((t - clean_t) / 0.35)
            if t - clean_t < 1.2:
                PL.fx_sparkles(c, t, 1.0, 540, 1050)
        for i, (hx, hy) in enumerate(out):
            C.draw_big_hand(c, hx, hy - 40, 200, -1 if i == 0 else 1, t, germs, seed=i + 1)
    draw_fx(c, ctx, beat, t)


def shot_board(c, ctx, shot, beat, t):
    place = place_of(ctx, beat)
    if place.get("type", PL.PRESETS.get(place.get("preset"), {}).get("type", "room")) == "room":
        place.update({"window": "none", "lamp_x": 960})
    PL.draw_place(c, t, place)
    bx, by, bw, bh = 70, 330, 700, 760
    PR.chalkboard(c, bx, by, t, bw, bh)
    title, writes = "", []
    for b in shot["chain"]:
        if b["_start"] > t + 0.5:
            break
        board = b.get("board", {})
        title = board.get("title", title)
        for w in board.get("write", []):
            writes.append((ctx.word_time(b, w.get("at_word", "")), w))
    from .draw import chalk_write
    if title:
        chalk_write(c, title, bx + bw / 2, by + 140, bw - 80, 84, 1.0, "#F2F2EA")
        c.drawLine(bx + 200, by + 170, bx + bw - 200, by + 170, P(col("#F2F2EA", 0.8), stroke=5))
    slots = [by + 360, by + 540, by + 700]
    for at, w in writes:
        y = slots[min(w.get("slot", 0), 2)]
        chalk_write(c, w["text"], bx + bw / 2, y, bw - 90, w.get("size", 140), (t - at) / 0.55, w.get("color", "#F2F2EA"))
        if "strike" in w:
            sy = slots[w["strike"]] - 45
            k = ease_out((t - at + 0.25) / 0.3)
            if k > 0:
                c.drawLine(bx + 90, sy + 20, bx + 90 + (bw - 180) * k, sy - 20, P(col("#FF6B6B", 0.95), stroke=12))
    draw_cast(c, ctx, beat, t, prop_items(c, ctx, beat, t))
    draw_fx(c, ctx, beat, t)


def _wrap(text, font, max_w):
    lines, cur = [], ""
    for w in text.split():
        trial = (cur + " " + w).strip()
        if font.measureText(trial) > max_w and cur:
            lines.append(cur)
            cur = w
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return lines


def shot_headline(c, ctx, shot, beat, t):
    draw_background(c, ctx, beat, t, blur=18)
    c.drawRect(skia.Rect.MakeWH(W, H), P(col("#000000", 0.25)))
    hd = beat.get("headline", {})
    age = t - shot["from"]
    k = ease_out(age / 0.55)
    c.save()
    c.translate(W / 2, 980)
    c.rotate((1 - k) * 540 - 4)
    c.scale(0.15 + 0.85 * k, 0.15 + 0.85 * k)
    pw, ph = 860, 1080
    c.drawRect(skia.Rect.MakeXYWH(-pw / 2 + 14, -ph / 2 + 18, pw, ph), P(col("#000000", 0.35), blur=14))
    c.drawRect(skia.Rect.MakeXYWH(-pw / 2, -ph / 2, pw, ph), P(shader=lin(0, -ph / 2, 0, ph / 2, ["#F4EEDC", "#E6DCC2"])))
    mast = hd.get("paper", "THE DAILY NEWS")
    f = skia.Font(sign_tf(), 70)
    w = f.measureText(mast)
    if w > pw - 80:
        f = skia.Font(sign_tf(), 70 * (pw - 80) / w)
        w = f.measureText(mast)
    c.drawTextBlob(skia.TextBlob(mast, f), -w / 2, -ph / 2 + 110, P(INK))
    c.drawLine(-pw / 2 + 40, -ph / 2 + 140, pw / 2 - 40, -ph / 2 + 140, P(INK, stroke=6))
    c.drawLine(-pw / 2 + 40, -ph / 2 + 152, pw / 2 - 40, -ph / 2 + 152, P(INK, stroke=2))
    hf = skia.Font(caption_tf(), 96)
    y = -ph / 2 + 270
    for line in _wrap(hd.get("text", "").upper(), hf, pw - 100):
        lw = hf.measureText(line)
        c.drawTextBlob(skia.TextBlob(line, hf), -lw / 2, y, P(INK))
        y += 108
    y += 20
    for col_i in range(2):
        cx = -pw / 2 + 50 + col_i * (pw / 2 - 20)
        for r in range(int((ph / 2 - y - 40) / 34)):
            c.drawLine(cx, y + r * 34, cx + pw / 2 - 90, y + r * 34, P(col("#8A8478", 0.8), stroke=8))
    c.restore()


def shot_card(c, ctx, shot, beat, t):
    draw_background(c, ctx, beat, t, blur=22)
    c.drawRect(skia.Rect.MakeWH(W, H), P(col("#0B0F1A", 0.55)))
    cd = beat.get("card", {})
    age = t - shot["from"]
    s = 0.7 + 0.3 * back_out(age / 0.35)
    c.save()
    c.translate(W / 2, 900)
    c.scale(s, s)
    text = cd.get("text", "")
    tf = caption_tf()
    size = 150
    f = skia.Font(tf, size)
    lines = _wrap(text, f, W - 140)
    while len(lines) > 3 and size > 70:
        size -= 10
        f = skia.Font(tf, size)
        lines = _wrap(text, f, W - 140)
    y0 = -(len(lines) - 1) * size * 1.1 / 2
    for k, line in enumerate(lines):
        w = f.measureText(line)
        if w > W - 120:
            f2 = skia.Font(tf, size * (W - 120) / w)
            w = f2.measureText(line)
        else:
            f2 = f
        c.drawTextBlob(skia.TextBlob(line, f2), -w / 2, y0 + k * size * 1.1, P(INK, stroke=size * 0.18))
        c.drawTextBlob(skia.TextBlob(line, f2), -w / 2, y0 + k * size * 1.1, P(cd.get("color", "#FFE27A")))
    sub_y = y0 + (len(lines) - 1) * size * 1.1 + 120
    if cd.get("sub"):
        sf = skia.Font(tf, 64)
        sw = sf.measureText(cd["sub"])
        c.drawTextBlob(skia.TextBlob(cd["sub"], sf), -sw / 2, sub_y, P(INK, stroke=12))
        c.drawTextBlob(skia.TextBlob(cd["sub"], sf), -sw / 2, sub_y, P("#FFFFFF"))
    c.restore()
    draw_fx(c, ctx, beat, t)


SHOTS = {"wide": shot_wide, "closeup": shot_closeup, "board": shot_board, "headline": shot_headline, "card": shot_card}
