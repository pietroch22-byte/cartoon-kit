"""Round-head stick characters: bodies, faces, hats, hair, poses, walking, laughing, held items."""
import math

import numpy as np
import skia

from .draw import INK, P, back_out, caption_tf, clamp01, col, lin, oval, rad, rrect, shade

POSES = {
    # (back upper, back lower, front upper, front lower) arm angles in degrees; 0 = straight down, + swings forward
    "idle": (-12, -6, 12, 6),
    "place": (-10, -4, 55, 85),
    "point": (-14, -6, 105, 95),
    "point_up": (-14, -6, 120, 140),
    "arms_crossed": (-18, 92, 18, -92),
    "hands_hips": (-42, 42, 42, -42),
    "arms_up": (-145, -165, 145, 165),
    "show_hands": (-105, -160, 105, 160),
    "shrug": (-60, -120, 60, 120),
    "hold": (-12, -6, 40, 100),          # front hand forward at chest height (use with "hold")
    "wave": (-12, -6, 130, 175),
    "facepalm": (-12, -6, 70, 175),
    "think": (-18, 92, 30, 160),
    "run": (-60, -10, 60, 120),
    "cheer": (-150, -170, 20, 8),
    "beg": (-60, -100, 60, 100),
    "reach": (-12, -6, 80, 80),
}

EXPR = {
    # brow inner/outer y offsets (in head radii), mouth type
    "neutral": ((0.0, 0.0), "flat"),
    "smile": ((-0.03, -0.03), "smile"),
    "grin": ((-0.06, -0.04), "grin"),
    "laugh": ((-0.08, -0.05), "grin"),
    "angry": ((0.08, -0.07), "frown"),
    "offended": ((0.05, -0.08), "pout"),
    "shock": ((-0.12, -0.08), "o"),
    "scared": ((-0.1, 0.02), "o"),
    "worried": ((-0.08, 0.05), "wavy"),
    "determined": ((0.025, -0.02), "smirk"),
    "smug": ((0.02, -0.06), "smirk"),
    "sad": ((-0.08, 0.06), "frown"),
    "sleepy": ((0.0, 0.0), "flat"),
    "confused": ((-0.1, 0.04), "wavy"),
}

ANIMS = ("none", "laugh", "jump", "shiver", "nod", "bounce")


def _seg(x, y, ang, length):
    a = math.radians(ang)
    return x + math.sin(a) * length, y + math.cos(a) * length


def draw_character(c, spec, x, y, scale=1.0, facing=1, pose="idle", face="neutral", t=0.0, seed=0.0,
                   walk=None, anim=None, big_hands=False, hold=None):
    """Draws a character standing with feet at (x, y). Returns big-hand screen positions if big_hands."""
    R = 78 * scale
    L, T = 1.25 * R, 1.35 * R
    bob = math.sin(t * 2 * math.pi * 0.9 + seed) * R * 0.025
    tilt, jx = 0.0, 0.0
    if anim is None and face == "laugh":
        anim = "laugh"
    if anim == "laugh":
        bob = -abs(math.sin(t * 2 * math.pi * 3.2 + seed)) * R * 0.08
        tilt = math.sin(t * 2 * math.pi * 1.6 + seed) * 4
    elif anim == "jump":
        bob = -abs(math.sin(t * 2 * math.pi * 1.4 + seed)) * R * 0.5
    elif anim == "shiver":
        jx = math.sin(t * 2 * math.pi * 14) * R * 0.03
    elif anim == "bounce":
        bob = -abs(math.sin(t * 2 * math.pi * 2.0 + seed)) * R * 0.12
    if walk is not None:
        bob = -abs(math.sin(walk)) * R * 0.06

    c.save()
    c.translate(x + jx, y)
    c.drawOval(oval(0, 0, 0.75 * R, 0.13 * R), P(col("#000000", 0.28), blur=R * 0.06))
    c.scale(facing, 1)
    c.translate(0, bob)
    if tilt:
        c.rotate(tilt, 0, -L)

    lw = 0.11 * R
    body = spec.get("body", "coat")
    # legs
    for k, sx in enumerate((-1, 1)):
        hip = (sx * 0.2 * R, -L)
        if walk is not None:
            ang = math.sin(walk + k * math.pi) * 28
            fx, fy = _seg(hip[0], hip[1], ang, L)
        else:
            fx, fy = sx * 0.32 * R, -0.04 * R - bob
        c.drawLine(hip[0], hip[1], fx, fy, P(INK, stroke=lw))
        c.drawOval(oval(fx + 0.1 * R, fy + 0.02 * R, 0.2 * R, 0.09 * R), P(INK))

    sh_y = -L - T
    _draw_body(c, spec, body, R, L, sh_y)

    fu, fl, nu, nl = POSES.get(pose, POSES["idle"])
    wig = math.sin(t * 2 * math.pi * 1.6 + seed) * 4
    if pose in ("arms_up", "cheer"):
        fu, nu = fu - wig * 2, nu + wig * 2
    if pose in ("point", "point_up", "wave"):
        nl += wig * (4 if pose == "wave" else 1)
    if walk is not None and pose == "idle":
        fu, nu = math.sin(walk) * 25, -math.sin(walk) * 25
        fl, nl = fu + 10, nu + 10
    hands = []
    arm_color = INK
    for (ux, ang_u, ang_l) in ((-0.48 * R, fu, fl), (0.48 * R, nu, nl)):
        ex, ey = _seg(ux, sh_y + 0.08 * R, ang_u, 0.82 * R)
        hx, hy = _seg(ex, ey, ang_l, 0.8 * R)
        arm = skia.Path()
        arm.moveTo(ux, sh_y + 0.08 * R)
        arm.lineTo(ex, ey)
        arm.lineTo(hx, hy)
        c.drawPath(arm, P(arm_color, stroke=lw))
        hands.append((hx, hy, ang_l))
        if not big_hands:
            c.drawCircle(hx, hy, 0.1 * R, P(INK))
    if pose in ("point", "point_up"):
        hx, hy, a = hands[1]
        fx, fy = _seg(hx, hy, a, 0.22 * R)
        c.drawLine(hx, hy, fx, fy, P(INK, stroke=lw * 0.7))
    if hold:
        hx, hy, _ = hands[1]
        draw_held(c, hold, hx, hy, R, t)

    hy0 = sh_y - 0.1 * R - 0.95 * R
    _draw_head(c, spec, 0, hy0, R, face, t, seed)
    c.restore()

    if big_hands:
        return [(x + jx + hx * facing, y + hy + bob) for hx, hy, _ in hands]
    return None


def _draw_body(c, spec, body, R, L, sh_y):
    coat = spec.get("coat", "#3A6EA5")
    if body == "dress":
        path = skia.Path()
        path.moveTo(-0.4 * R, sh_y + 0.05 * R)
        path.quadTo(-0.55 * R, -0.9 * L, -0.95 * R, -0.25 * L)
        path.quadTo(0, -0.12 * L, 0.95 * R, -0.25 * L)
        path.quadTo(0.55 * R, -0.9 * L, 0.4 * R, sh_y + 0.05 * R)
        path.quadTo(0, sh_y - 0.2 * R, -0.4 * R, sh_y + 0.05 * R)
        path.close()
        c.drawPath(path, P(shader=lin(0, sh_y, 0, -0.25 * L, [shade(coat, 1.12), shade(coat, 0.72)])))
        c.drawPath(path, P(INK, stroke=0.05 * R))
        c.drawLine(-0.42 * R, -L - 0.1 * R, 0.42 * R, -L - 0.1 * R, P(shade(coat, 0.55), stroke=0.08 * R))
        return
    hem = {"coat": -0.3 * L, "robe": -0.02 * L, "shirt": -L + 0.05 * R, "armor": -0.55 * L}.get(body, -0.3 * L)
    wide = {"robe": 0.75, "shirt": 0.5, "armor": 0.62}.get(body, 0.66)
    path = skia.Path()
    path.moveTo(-0.46 * R, sh_y + 0.05 * R)
    path.quadTo(-0.6 * R, (sh_y + hem) / 2, -wide * R, hem)
    path.lineTo(wide * R, hem)
    path.quadTo(0.6 * R, (sh_y + hem) / 2, 0.46 * R, sh_y + 0.05 * R)
    path.quadTo(0, sh_y - 0.2 * R, -0.46 * R, sh_y + 0.05 * R)
    path.close()
    c.drawPath(path, P(shader=lin(0, sh_y, 0, hem, [shade(coat, 1.12), shade(coat, 0.72)])))
    if body == "armor":
        for k in range(5):
            yy = sh_y + 0.3 * R + k * 0.28 * R
            c.drawLine(-0.55 * R, yy, 0.55 * R, yy, P(shade(coat, 0.6), stroke=0.04 * R))
    c.drawPath(path, P(INK, stroke=0.05 * R))
    if body in ("coat", "suit"):
        v = skia.Path()
        v.moveTo(-0.2 * R, sh_y - 0.02 * R)
        v.lineTo(0.2 * R, sh_y - 0.02 * R)
        v.lineTo(0.0, sh_y + 0.62 * R)
        v.close()
        c.drawPath(v, P("#F4F1EA"))
        c.drawPath(v, P(INK, stroke=0.035 * R))
        tie = spec.get("tie", "#B23A3A")
        if spec.get("necktie"):
            c.drawLine(0, sh_y + 0.05 * R, 0, sh_y + 0.5 * R, P(tie, stroke=0.1 * R))
        else:
            bow = skia.Path()
            for sx in (-1, 1):
                bow.moveTo(0, sh_y + 0.12 * R)
                bow.lineTo(sx * 0.13 * R, sh_y + 0.04 * R)
                bow.lineTo(sx * 0.13 * R, sh_y + 0.22 * R)
                bow.close()
            c.drawPath(bow, P(tie))
        for by in (0.78, 1.05):
            c.drawCircle(0.08 * R, sh_y + by * R, 0.045 * R, P(shade(coat, 0.5)))
    elif body == "robe":
        c.drawLine(0, sh_y + 0.1 * R, 0, hem, P(shade(coat, 0.6), stroke=0.05 * R))
        c.drawLine(-0.5 * R, -L - 0.2 * R, 0.5 * R, -L - 0.2 * R, P(spec.get("belt", "#C9A23A"), stroke=0.12 * R))
    if spec.get("lanyard"):
        c.drawLine(-0.15 * R, sh_y, 0.05 * R, sh_y + 0.7 * R, P("#2F6FD1", stroke=0.04 * R))
        c.drawRRect(rrect(-0.05 * R, sh_y + 0.68 * R, 0.25 * R, 0.3 * R, 0.04 * R), P("#FFFFFF"))


def draw_held(c, what, x, y, R, t):
    if what == "lantern":
        c.drawLine(x, y, x, y + 0.25 * R, P(INK, stroke=0.04 * R))
        glow = P(col("#FFD27A", 0.35), blur=0.4 * R)
        glow.setBlendMode(skia.BlendMode.kScreen)
        c.drawCircle(x, y + 0.5 * R, 0.6 * R, glow)
        c.drawRRect(rrect(x - 0.17 * R, y + 0.25 * R, 0.34 * R, 0.45 * R, 0.06 * R), P("#FFE7A8"))
        c.drawRRect(rrect(x - 0.17 * R, y + 0.25 * R, 0.34 * R, 0.45 * R, 0.06 * R), P(INK, stroke=0.04 * R))
    elif what == "book":
        c.drawRRect(rrect(x - 0.3 * R, y - 0.2 * R, 0.6 * R, 0.42 * R, 0.04 * R), P("#8E2F2F"))
        c.drawRRect(rrect(x - 0.3 * R, y - 0.2 * R, 0.6 * R, 0.42 * R, 0.04 * R), P(INK, stroke=0.04 * R))
    elif what == "paper":
        c.drawRect(skia.Rect.MakeXYWH(x - 0.22 * R, y - 0.5 * R, 0.44 * R, 0.58 * R), P("#FBF8EE"))
        c.drawRect(skia.Rect.MakeXYWH(x - 0.22 * R, y - 0.5 * R, 0.44 * R, 0.58 * R), P(INK, stroke=0.03 * R))
        for k in range(4):
            c.drawLine(x - 0.15 * R, y - 0.4 * R + k * 0.12 * R, x + 0.15 * R, y - 0.4 * R + k * 0.12 * R, P("#9A9A9A", stroke=0.02 * R))
    elif what == "phone":
        c.drawRRect(rrect(x - 0.16 * R, y - 0.45 * R, 0.32 * R, 0.56 * R, 0.06 * R), P("#22252B"))
        c.drawRRect(rrect(x - 0.13 * R, y - 0.41 * R, 0.26 * R, 0.46 * R, 0.04 * R), P("#7FC4F0"))
    elif what == "cup":
        c.drawRRect(rrect(x - 0.15 * R, y - 0.3 * R, 0.3 * R, 0.34 * R, 0.06 * R), P("#FFFFFF"))
        c.drawRRect(rrect(x - 0.15 * R, y - 0.3 * R, 0.3 * R, 0.34 * R, 0.06 * R), P(INK, stroke=0.04 * R))
    elif what == "bag":
        c.drawOval(oval(x, y + 0.3 * R, 0.32 * R, 0.3 * R), P("#C8A165"))
        c.drawOval(oval(x, y + 0.3 * R, 0.32 * R, 0.3 * R), P(INK, stroke=0.04 * R))
        c.drawString("$", x - 0.1 * R, y + 0.42 * R, skia.Font(caption_tf(), 0.32 * R), P("#5C3B22"))
    elif what == "sword":
        c.drawLine(x, y, x + 0.1 * R, y - 1.1 * R, P("#C9D2DA", stroke=0.08 * R))
        c.drawLine(x - 0.18 * R, y - 0.08 * R, x + 0.2 * R, y - 0.1 * R, P("#8B6B2E", stroke=0.07 * R))
    elif what == "key":
        c.drawCircle(x, y - 0.1 * R, 0.1 * R, P("#D4A72C", stroke=0.05 * R))
        c.drawLine(x, y, x, y + 0.35 * R, P("#D4A72C", stroke=0.05 * R))
    elif what == "torch":
        c.drawLine(x, y + 0.2 * R, x, y - 0.4 * R, P("#6B4A2E", stroke=0.08 * R))
        f = 1 + 0.1 * math.sin(t * 15)
        fl = skia.Path()
        fl.moveTo(x, y - 0.95 * R * f)
        fl.quadTo(x + 0.22 * R, y - 0.5 * R, x, y - 0.38 * R)
        fl.quadTo(x - 0.22 * R, y - 0.5 * R, x, y - 0.95 * R * f)
        c.drawPath(fl, P("#FF9B2F"))


HELD = ("lantern", "book", "paper", "phone", "cup", "bag", "sword", "key", "torch")


def _hair_back(c, spec, cx, cy, R):
    hair = spec.get("hair", "side")
    hc = spec.get("hair_color", "#4A3324")
    if hair == "receding":
        for sx in (-1, 1):
            tuft = skia.Path()
            tuft.addArc(oval(cx, cy, R * 1.04, R * 1.04), 200 if sx < 0 else 290, 50)
            c.drawPath(tuft, P(hc, stroke=0.22 * R))
    elif hair == "long":
        p = skia.Path()
        p.addRRect(rrect(cx - 1.12 * R, cy - 0.9 * R, 2.24 * R, 2.0 * R, 0.9 * R))
        c.drawPath(p, P(hc))
        c.drawPath(p, P(INK, stroke=0.04 * R))
    elif hair == "bun":
        c.drawCircle(cx - 0.2 * R, cy - 1.0 * R, 0.38 * R, P(hc))
        c.drawCircle(cx - 0.2 * R, cy - 1.0 * R, 0.38 * R, P(INK, stroke=0.04 * R))


def _hair_front(c, spec, cx, cy, R):
    hair = spec.get("hair", "side")
    hc = spec.get("hair_color", "#4A3324")
    if hair in ("side", "long", "bun"):
        cap = skia.Path()
        cap.addArc(oval(cx, cy, R * 0.98, R * 0.98), 195, 150)
        cap.close()
        c.drawPath(cap, P(hc))
        c.drawPath(cap, P(INK, stroke=0.04 * R))
    elif hair == "bald":
        c.drawOval(oval(cx - 0.35 * R, cy - 0.62 * R, 0.18 * R, 0.08 * R), P(col("#FFFFFF", 0.9)))
        for sx in (-1, 1):
            fr = skia.Path()
            fr.addArc(oval(cx, cy, R * 1.0, R * 1.0), 160 if sx < 0 else 340, 40)
            c.drawPath(fr, P(hc, stroke=0.16 * R))
    elif hair == "receding":
        for sx in (-1, 1):
            c.drawLine(cx + sx * 0.93 * R, cy - 0.2 * R, cx + sx * 0.9 * R, cy + 0.25 * R, P(hc, stroke=0.13 * R))
    elif hair == "spiky":
        p = skia.Path()
        p.moveTo(cx - 0.95 * R, cy - 0.3 * R)
        for k in range(7):
            a0 = math.radians(195 + k * 22)
            a1 = math.radians(195 + k * 22 + 11)
            p.lineTo(cx + math.cos(a1) * 1.3 * R, cy + math.sin(a1) * 1.3 * R)
            p.lineTo(cx + math.cos(a0 + math.radians(22)) * 0.95 * R, cy + math.sin(a0 + math.radians(22)) * 0.95 * R)
        p.close()
        c.drawPath(p, P(hc))
        c.drawPath(p, P(INK, stroke=0.04 * R))


def _draw_hat(c, hat, cx, cy, R, spec):
    if not hat or hat == "none":
        return
    top = cy - 0.78 * R
    if hat == "top":
        crown = skia.Path()
        crown.moveTo(cx - 0.5 * R, top)
        crown.lineTo(cx - 0.55 * R, top - 1.0 * R)
        crown.lineTo(cx + 0.55 * R, top - 1.0 * R)
        crown.lineTo(cx + 0.5 * R, top)
        crown.close()
        c.drawPath(crown, P(shader=lin(cx - 0.5 * R, 0, cx + 0.5 * R, 0, ["#3A3A44", "#141418", "#0C0C10"])))
        c.drawPath(crown, P(INK, stroke=0.04 * R))
        c.drawRect(skia.Rect.MakeLTRB(cx - 0.51 * R, top - 0.25 * R, cx + 0.51 * R, top - 0.1 * R), P(spec.get("hat_band", "#7A2E2E")))
        c.drawRRect(rrect(cx - 0.82 * R, top - 0.08 * R, 1.64 * R, 0.16 * R, 0.08 * R), P("#141418"))
    elif hat == "bowler":
        dome = skia.Path()
        dome.addArc(oval(cx, top + 0.02 * R, 0.62 * R, 0.62 * R), 180, 180)
        dome.close()
        c.drawPath(dome, P(spec.get("hat_color", "#1E1E22")))
        c.drawRRect(rrect(cx - 0.85 * R, top - 0.06 * R, 1.7 * R, 0.14 * R, 0.07 * R), P(spec.get("hat_color", "#1E1E22")))
    elif hat == "cap":
        hc = spec.get("hat_color", "#3D5A80")
        dome = skia.Path()
        dome.addArc(oval(cx, top + 0.15 * R, 0.85 * R, 0.55 * R), 180, 180)
        dome.close()
        c.drawPath(dome, P(hc))
        c.drawPath(dome, P(INK, stroke=0.04 * R))
        for k in range(-2, 3):
            c.drawLine(cx + k * 0.25 * R, top - 0.35 * R, cx + k * 0.3 * R, top + 0.12 * R, P(shade(hc, 0.75), stroke=0.05 * R))
        c.drawRRect(rrect(cx, top + 0.05 * R, 0.95 * R, 0.14 * R, 0.07 * R), P(shade(hc, 0.7)))
    elif hat == "crown":
        p = skia.Path()
        p.moveTo(cx - 0.6 * R, top + 0.05 * R)
        for k, (dx, dy) in enumerate([(-0.6, -0.6), (-0.3, -0.25), (0, -0.7), (0.3, -0.25), (0.6, -0.6)]):
            p.lineTo(cx + dx * R, top + dy * R)
        p.lineTo(cx + 0.6 * R, top + 0.05 * R)
        p.close()
        c.drawPath(p, P(shader=lin(0, top - 0.7 * R, 0, top, ["#FFE27A", "#D4A72C"])))
        c.drawPath(p, P(INK, stroke=0.04 * R))
        c.drawCircle(cx, top - 0.15 * R, 0.08 * R, P("#C0392B"))
    elif hat == "helmet":
        hc = spec.get("hat_color", "#8C98A4")
        dome = skia.Path()
        dome.addArc(oval(cx, top + 0.35 * R, 1.02 * R, 0.85 * R), 180, 180)
        dome.close()
        c.drawPath(dome, P(shader=lin(cx - R, 0, cx + R, 0, [shade(hc, 1.3), hc, shade(hc, 0.6)])))
        c.drawPath(dome, P(INK, stroke=0.045 * R))
        c.drawLine(cx - 1.02 * R, top + 0.35 * R, cx + 1.02 * R, top + 0.35 * R, P(shade(hc, 0.5), stroke=0.1 * R))
        if spec.get("plume"):
            c.drawOval(oval(cx, top - 0.65 * R, 0.12 * R, 0.25 * R), P(spec["plume"]))
    elif hat == "chef":
        c.drawRect(skia.Rect.MakeLTRB(cx - 0.55 * R, top - 0.3 * R, cx + 0.55 * R, top + 0.1 * R), P("#FFFFFF"))
        for dx in (-0.35, 0.0, 0.35):
            c.drawCircle(cx + dx * R, top - 0.55 * R, 0.38 * R, P("#FFFFFF"))
        c.drawRect(skia.Rect.MakeLTRB(cx - 0.55 * R, top - 0.3 * R, cx + 0.55 * R, top + 0.1 * R), P(INK, stroke=0.035 * R))
    elif hat == "straw":
        c.drawOval(oval(cx, top + 0.02 * R, 1.25 * R, 0.2 * R), P("#E2C26A"))
        c.drawOval(oval(cx, top + 0.02 * R, 1.25 * R, 0.2 * R), P(INK, stroke=0.035 * R))
        dome = skia.Path()
        dome.addArc(oval(cx, top + 0.02 * R, 0.6 * R, 0.5 * R), 180, 180)
        dome.close()
        c.drawPath(dome, P("#D9B65A"))
        c.drawPath(dome, P(INK, stroke=0.035 * R))
    elif hat == "hood":
        hc = spec.get("hat_color", "#5B4A3A")
        p = skia.Path()
        p.addArc(oval(cx, cy, 1.18 * R, 1.18 * R), 160, 220)
        c.drawPath(p, P(hc, stroke=0.3 * R))


HATS = ("none", "top", "bowler", "cap", "crown", "helmet", "chef", "straw", "hood")
HAIRS = ("side", "receding", "bald", "long", "bun", "spiky", "none")


def _draw_head(c, spec, cx, cy, R, face, t, seed):
    _hair_back(c, spec, cx, cy, R)
    skin = spec.get("head", "#FFFFFF")
    c.drawCircle(cx, cy, R, P(shader=rad(cx - 0.35 * R, cy - 0.4 * R, 1.5 * R, [skin, shade(skin, 0.96), shade(skin, 0.86)])))
    c.drawCircle(cx, cy, R, P(INK, stroke=0.065 * R))
    _hair_front(c, spec, cx, cy, R)

    fx = 0.14 * R
    ph = (t + seed * 0.7) % 3.2
    blink = 0.15 if ph < 0.1 else 1.0
    (bi, bo), mouth = EXPR.get(face, EXPR["neutral"])
    if face in ("shock", "scared"):
        blink = 1.25
    for sx in (-1, 1):
        ex = cx + fx + sx * 0.3 * R
        ey = cy - 0.02 * R
        if face == "laugh":
            p = skia.Path()
            p.moveTo(ex - 0.09 * R, ey + 0.03 * R)
            p.quadTo(ex, ey - 0.12 * R, ex + 0.09 * R, ey + 0.03 * R)
            c.drawPath(p, P(INK, stroke=0.05 * R))
        elif face == "sleepy":
            c.drawLine(ex - 0.08 * R, ey, ex + 0.08 * R, ey, P(INK, stroke=0.05 * R))
        else:
            c.drawOval(oval(ex, ey, 0.075 * R, 0.115 * R * blink), P(INK))
            if blink > 0.5:
                c.drawCircle(ex - 0.02 * R, ey - 0.04 * R, 0.022 * R, P("#FFFFFF"))
        x_in, x_out = ex - sx * 0.1 * R, ex + sx * 0.14 * R
        y_base = cy - 0.3 * R
        bi2, bo2 = (-0.1, -0.05) if (face in ("offended", "confused") and sx > 0) else (bi, bo)
        c.drawLine(x_in, y_base + bi2 * R, x_out, y_base + bo2 * R, P(INK, stroke=0.06 * R))
    if face in ("worried", "scared"):
        d = skia.Path()
        dx, dy = cx - 0.75 * R, cy - 0.35 * R
        d.moveTo(dx, dy - 0.16 * R)
        d.quadTo(dx + 0.1 * R, dy, dx, dy + 0.06 * R)
        d.quadTo(dx - 0.1 * R, dy, dx, dy - 0.16 * R)
        c.drawPath(d, P("#8FD3F4"))
    if spec.get("glasses"):
        for sx in (-1, 1):
            c.drawCircle(cx + fx + sx * 0.3 * R, cy - 0.02 * R, 0.17 * R, P(INK, stroke=0.035 * R))
        c.drawLine(cx + fx - 0.13 * R, cy - 0.04 * R, cx + fx + 0.13 * R, cy - 0.04 * R, P(INK, stroke=0.035 * R))

    mx, my = cx + fx, cy + 0.4 * R
    hc = spec.get("hair_color", "#4A3324")
    if spec.get("mustache"):
        m = skia.Path()
        m.moveTo(mx, my - 0.17 * R)
        m.cubicTo(mx - 0.12 * R, my - 0.27 * R, mx - 0.3 * R, my - 0.2 * R, mx - 0.34 * R, my - 0.08 * R)
        m.cubicTo(mx - 0.22 * R, my - 0.12 * R, mx - 0.1 * R, my - 0.1 * R, mx, my - 0.1 * R)
        m.cubicTo(mx + 0.1 * R, my - 0.1 * R, mx + 0.22 * R, my - 0.12 * R, mx + 0.34 * R, my - 0.08 * R)
        m.cubicTo(mx + 0.3 * R, my - 0.2 * R, mx + 0.12 * R, my - 0.27 * R, mx, my - 0.17 * R)
        m.close()
        c.drawPath(m, P(hc))
    if spec.get("beard"):
        b = skia.Path()
        b.addArc(oval(cx, cy, R * 0.98, R * 0.98), 25, 130)
        b.arcTo(oval(cx, cy + 0.05 * R, R * 0.62, R * 0.55), 155, -130, False)
        b.close()
        c.drawPath(b, P(hc))
        c.drawPath(b, P(INK, stroke=0.035 * R))
        my -= 0.06 * R

    mp = P(INK, stroke=0.06 * R)
    if mouth == "smile":
        p = skia.Path()
        p.moveTo(mx - 0.2 * R, my)
        p.quadTo(mx, my + 0.2 * R, mx + 0.2 * R, my)
        c.drawPath(p, mp)
    elif mouth == "grin":
        big = 1.25 if face == "laugh" else 1.0
        p = skia.Path()
        p.moveTo(mx - 0.28 * R * big, my - 0.05 * R)
        p.quadTo(mx, my - 0.02 * R, mx + 0.28 * R * big, my - 0.05 * R)
        p.quadTo(mx, my + 0.42 * R * big, mx - 0.28 * R * big, my - 0.05 * R)
        p.close()
        c.drawPath(p, P(INK))
        c.drawOval(oval(mx, my + 0.15 * R * big, 0.12 * R, 0.06 * R), P("#D9535F"))
        c.drawRect(skia.Rect.MakeLTRB(mx - 0.22 * R * big, my - 0.04 * R, mx + 0.22 * R * big, my + 0.03 * R), P("#FFFFFF"))
    elif mouth == "frown":
        p = skia.Path()
        p.moveTo(mx - 0.18 * R, my + 0.08 * R)
        p.quadTo(mx, my - 0.1 * R, mx + 0.18 * R, my + 0.08 * R)
        c.drawPath(p, mp)
    elif mouth == "pout":
        p = skia.Path()
        p.moveTo(mx - 0.12 * R, my + 0.04 * R)
        p.quadTo(mx - 0.04 * R, my - 0.04 * R, mx + 0.02 * R, my + 0.02 * R)
        p.quadTo(mx + 0.08 * R, my + 0.07 * R, mx + 0.14 * R, my)
        c.drawPath(p, mp)
    elif mouth == "o":
        c.drawOval(oval(mx, my + 0.04 * R, 0.1 * R, 0.15 * R), P(INK))
    elif mouth == "smirk":
        p = skia.Path()
        p.moveTo(mx - 0.16 * R, my + 0.02 * R)
        p.quadTo(mx + 0.04 * R, my + 0.08 * R, mx + 0.18 * R, my - 0.05 * R)
        c.drawPath(p, mp)
    elif mouth == "wavy":
        p = skia.Path()
        p.moveTo(mx - 0.18 * R, my + 0.03 * R)
        p.quadTo(mx - 0.09 * R, my - 0.05 * R, mx, my + 0.03 * R)
        p.quadTo(mx + 0.09 * R, my + 0.1 * R, mx + 0.18 * R, my + 0.02 * R)
        c.drawPath(p, mp)
    else:
        c.drawLine(mx - 0.12 * R, my, mx + 0.12 * R, my, mp)

    if spec.get("monocle"):
        ex = cx + fx + 0.3 * R
        c.drawCircle(ex, cy - 0.02 * R, 0.17 * R, P("#D4A72C", stroke=0.035 * R))
        c.drawCircle(ex, cy - 0.02 * R, 0.16 * R, P(col("#BFE3F2", 0.25)))
        c.drawLine(ex + 0.12 * R, cy + 0.12 * R, ex + 0.3 * R, cy + 0.9 * R, P("#D4A72C", stroke=0.02 * R))
    _draw_hat(c, spec.get("hat"), cx, cy, R, spec)


def draw_big_hand(c, x, y, size, flip, t, germs=0.0, seed=0):
    """A big mitten hand (palm toward camera). germs = 0..1 how many germs have popped in."""
    c.save()
    c.translate(x, y)
    c.scale(flip, 1)
    s = size
    palm = skia.Path()
    palm.addRRect(rrect(-0.5 * s, -0.35 * s, 1.0 * s, 1.0 * s, 0.38 * s))
    fingers = [rrect(fx * s - 0.11 * s, -0.35 * s - fh * s, 0.22 * s, fh * s + 0.3 * s, 0.11 * s)
               for fx, fh in [(-0.36, 0.55), (-0.12, 0.66), (0.12, 0.62), (0.36, 0.5)]]
    thumb = rrect(-0.85 * s, -0.05 * s, 0.5 * s, 0.22 * s, 0.11 * s)
    fill = P(shader=rad(-0.1 * s, -0.3 * s, 1.2 * s, ["#FFFFFF", "#ECE8DF"]))
    for f in fingers + [thumb]:
        c.drawRRect(f, fill)
        c.drawRRect(f, P(INK, stroke=0.045 * s))
    c.drawPath(palm, fill)
    c.drawPath(palm, P(INK, stroke=0.045 * s))
    for f in fingers:
        r = f.rect()
        c.drawRect(skia.Rect.MakeLTRB(r.left() + 0.03 * s, -0.36 * s, r.right() - 0.03 * s, -0.2 * s), fill)
    rng = np.random.default_rng(seed)
    n = 7
    for i in range(n):
        appear = clamp01(germs * n - i)
        if appear <= 0:
            continue
        gx, gy = rng.uniform(-0.38, 0.38) * s, rng.uniform(-0.25, 0.5) * s
        gr = rng.uniform(0.07, 0.12) * s * back_out(appear)
        wob = math.sin(t * 9 + i) * 0.015 * s
        c.drawCircle(gx + wob, gy, gr, P("#7BC043"))
        c.drawCircle(gx + wob, gy, gr, P("#3E7A1E", stroke=0.02 * s))
        for k in range(6):
            a = k * math.pi / 3 + t * 2
            c.drawLine(gx + wob + math.cos(a) * gr, gy + math.sin(a) * gr,
                       gx + wob + math.cos(a) * gr * 1.35, gy + math.sin(a) * gr * 1.35, P("#3E7A1E", stroke=0.015 * s))
        for ex in (-0.3, 0.3):
            c.drawCircle(gx + wob + ex * gr, gy - 0.15 * gr, 0.13 * gr, P(INK))
    c.restore()


CROWD_COATS = ["#3A6EA5", "#8E3B46", "#4F7F52", "#6B5B95", "#B07D3A", "#2B2B33", "#5F7A8A", "#9C6644"]
CROWD_HATS = ["none", "none", "top", "bowler", "cap", "none", "straw"]
CROWD_HAIR = ["side", "bald", "spiky", "long", "receding", "bun"]


def crowd_specs(n, seed=1, hats=None, bodies=None):
    rng = np.random.default_rng(seed)
    out = []
    for i in range(n):
        hair = CROWD_HAIR[rng.integers(len(CROWD_HAIR))]
        out.append({
            "coat": CROWD_COATS[rng.integers(len(CROWD_COATS))],
            "hat": (hats or CROWD_HATS)[rng.integers(len(hats or CROWD_HATS))],
            "hair": hair,
            "hair_color": ["#3B2A1E", "#6B4226", "#9A9A9A", "#C99A3C", "#1E1E22"][rng.integers(5)],
            "mustache": bool(rng.integers(3) == 0) and hair != "long",
            "body": (bodies or ["coat"])[rng.integers(len(bodies or ["coat"]))] if hair != "long" else "dress",
        })
    return out
