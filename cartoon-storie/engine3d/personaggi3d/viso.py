"""Faccia dei personaggi 3D, modellata in Blender con SHAPE KEY (morph target nel GLB).
Il motore non disegna più la faccia: sceglie solo quali shape key accendere.

Ogni elemento della faccia (occhi, sopracciglia, bocca, guance, occhiali) è una forma sottile appoggiata sulla testa.
Tutte le espressioni hanno la STESSA topologia: cambia solo la posizione dei vertici.

Shape key esportate (nomi nel GLB):
  e_<espressione>   espressioni complete (vedi ESPRESSIONI)
  v_A v_E v_O v_U v_MBP v_FV   visemi (solo bocca) per far parlare
  b_blink           battito di ciglia (solo occhi)
  g_sx g_dx g_su g_giu   sguardo (solo pupille)
Il motore le somma (peso 0..1). Preset e alias: espressioni.json (scritto da scrivi_preset()).

Coordinate della faccia: (u, v) in unità di raggio testa, u a destra, v in alto, (0,0) = centro della testa.
"""
import bpy, math, json, os
from mathutils import Vector

INK = "#2a1a1e"
COLORI = {"viso_inchiostro": INK, "viso_sclera": "#e6dfd2", "viso_bocca": "#5a1f2a", "viso_denti": "#e9e2d0",
          "viso_guancia": "#ee7870", "viso_lenti": "#17121d", "viso_riflesso": "#f2ece0", "viso_vetro": "#ffffff"}
# livello -> (materiale, distanza dalla testa in metri). Ordine = ordine di sovrapposizione.
LIVELLI = {"guancia": ("viso_guancia", .006), "sclera": ("viso_sclera", .010), "bocca": ("viso_bocca", .010),
           "denti": ("viso_denti", .013), "ink": ("viso_inchiostro", .016), "vetro": ("viso_vetro", .018),
           "lenti": ("viso_lenti", .021), "riflesso": ("viso_riflesso", .024)}

BASE = dict(ex=.37, ey=.05, rs=0., rp=.112, open=1., px=0., py=0., rw=.036,      # occhi
            alen=0., acurv=0., ady=0., ath=.046,                                 # linea/arco (occhio chiuso, palpebra)
            by=.31, blen=.2, btilt=0., bcurve=0., bth=.05, bx=.37,             # sopracciglia
            mw=.15, mcy=-.42, cL=0., cR=0., mcurve=0., mopen=0., mp=.7, teeth=0., mth=.044,   # bocca
            blush=.8)

# espressioni: solo ciò che cambia rispetto a BASE
ESPRESSIONI = {
    "neutro": {},
    "sorriso": dict(mw=.2, cL=.05, cR=.05, mcurve=.05, blush=1.0),
    "felice": dict(mw=.27, cL=.07, cR=.07, mcurve=.02, mopen=.14, mp=.55, teeth=1., rp=.125, by=.34, blush=1.2),
    "ride": dict(rp=0., alen=.14, acurv=.075, mw=.29, cL=.08, cR=.08, mopen=.22, mp=.5, teeth=.55, by=.34, blush=1.4),
    "furbo": dict(mw=.18, cL=-.01, cR=.08, mcurve=.02, open=.62, alen=.15, ady=.09, byR=.06, btilt=-.025, py=-.01),
    "annoiato": dict(open=.5, alen=.15, ady=.085, by=.27, mw=.12, mcy=-.40, py=-.02),
    "sorpreso": dict(rs=.16, rp=.045, by=.37, mw=.075, mopen=.15, mp=.4, mcy=-.36, rw=.035),
    "spaventato": dict(rs=.16, rp=.04, by=.36, btilt=.07, mw=.21, mopen=.11, mp=.5, teeth=1., cL=-.04, cR=-.04, mcurve=-.03, rw=.035),
    "arrabbiato": dict(by=.26, btilt=-.075, rp=.1, open=.8, mw=.17, cL=-.04, cR=-.04, mcurve=-.05, mopen=.03),
    "triste": dict(by=.31, btilt=.065, open=.8, py=-.03, mw=.12, cL=-.06, cR=-.06, mcurve=-.045, mcy=-.40),
    "preoccupato": dict(by=.35, btilt=.055, bcurve=.01, mw=.13, cL=.03, cR=-.03, mopen=.02, py=.015),
    "dubbioso": dict(byR=.08, byL=-.03, btilt=-.02, mw=.13, cL=-.04, cR=.03, px=.03, open=.85),
    "determinato": dict(by=.265, btilt=-.045, rp=.125, mw=.18, cL=.005, cR=.005, mcurve=.012),
    "beato": dict(rp=0., alen=.135, acurv=.07, mw=.18, cL=.04, cR=.04, mcurve=.05, blush=1.5, by=.33),
    "imbarazzato": dict(px=.045, py=-.03, by=.33, btilt=.035, mw=.12, cL=.02, cR=.045, mcurve=.01, blush=1.9),
    "disgustato": dict(open=.5, alen=.15, ady=.085, by=.265, btilt=-.04, mw=.15, cL=.035, cR=-.05, mopen=.02),
    "pieno": dict(open=.6, alen=.15, ady=.08, mw=.11, mopen=.03, mcy=-.41, blush=1.7, py=-.02),
}
# nomi italiani e inglesi accettati dal motore (storie vecchie e kit)
ALIAS = {"neutral": "neutro", "smile": "sorriso", "sorrido": "sorriso", "grin": "felice", "laugh": "ride", "sly": "furbo",
         "bored": "annoiato", "shock": "sorpreso", "scared": "spaventato", "angry": "arrabbiato", "sad": "triste", "teary": "triste",
         "worried": "preoccupato", "doubt": "dubbioso", "determined": "determinato", "blissful": "beato", "nervous": "imbarazzato",
         "shy": "imbarazzato", "disgust": "disgustato", "stuffed": "pieno", "chew": "pieno"}
VISEMI = {"A": dict(mw=.17, mopen=.15, mp=.6), "E": dict(mw=.22, mopen=.065, mp=.8), "O": dict(mw=.085, mopen=.13, mp=.4),
          "U": dict(mw=.075, mopen=.06, mp=.5), "MBP": dict(mw=.13), "FV": dict(mw=.16, mopen=.045, teeth=1.)}
OCCHI = {"b_blink": dict(open=.04, alen=.13, ath=.046), "g_sx": dict(px=-.05), "g_dx": dict(px=.05), "g_su": dict(py=.045), "g_giu": dict(py=-.045)}


def chiusi(nome):
    p = ESPRESSIONI[nome]; return p.get("alen", 0) > .05 and p.get("rp", 1) == 0


def tutte_le_chiavi():
    """[(nome shape key, parametri)] nell'ordine di creazione; la prima è la base (neutro)."""
    k = [("e_" + n, dict(BASE, **p)) for n, p in ESPRESSIONI.items()]
    k += [("v_" + n, dict(BASE, **p)) for n, p in VISEMI.items()]
    k += [(n, dict(BASE, **p)) for n, p in OCCHI.items()]
    return k


# ---------------------------------------------------------------- geometria 2D (u, v) -> testa
class Livello:
    def __init__(s): s.p = []; s.f = []
    def add(s, pts, faces):
        b = len(s.p); s.p += pts; s.f += [tuple(b + i for i in q) for q in faces]


def ventaglio(cx, cy, rx, ry, n):
    pts = [(cx, cy)] + [(cx + rx * math.cos(2 * math.pi * i / n), cy + ry * math.sin(2 * math.pi * i / n)) for i in range(n)]
    return pts, [(0, 1 + i, 1 + (i + 1) % n) for i in range(n)]


def anello(cx, cy, r_in, r_out, sy, n):
    po = [(cx + r_out * math.cos(2 * math.pi * i / n), cy + r_out * math.sin(2 * math.pi * i / n) * sy) for i in range(n)]
    pi_ = [(cx + r_in * math.cos(2 * math.pi * i / n), cy + r_in * math.sin(2 * math.pi * i / n) * sy) for i in range(n)]
    return po + pi_, [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]


def nastro(pts, ths):
    n = len(pts); L = []; R = []
    for i, (p, t) in enumerate(zip(pts, ths)):
        a = pts[max(i - 1, 0)]; b = pts[min(i + 1, n - 1)]; dx, dy = b[0] - a[0], b[1] - a[1]; d = math.hypot(dx, dy)
        nx, ny = (-dy / d, dx / d) if d > 1e-6 else (0, 1)
        L.append((p[0] + nx * t / 2, p[1] + ny * t / 2)); R.append((p[0] - nx * t / 2, p[1] - ny * t / 2))
    return L + R, [(i, i + 1, n + i + 1, n + i) for i in range(n - 1)]


def striscia(A, B):
    n = len(A); return A + B, [(i, i + 1, n + i + 1, n + i) for i in range(n - 1)]


def lin(n): return [-1 + 2 * i / (n - 1) for i in range(n)]


def costruisci(P, G):
    """P: parametri dell'espressione, G: {'occhiali','sole'} (fissi). Ritorna {livello: Livello} con punti (u, v)."""
    g = lambda k, s=0: P[k] + (P.get(k + "L", 0) if s < 0 else P.get(k + "R", 0) if s > 0 else 0)
    Lv = {n: Livello() for n in LIVELLI}
    gl, sole = G.get("occhiali"), G.get("sole")
    dby = .03 if (gl or sole) else 0
    for s in (-1, 1):
        cx, cy, op = s * g("ex", s), g("ey", s), g("open", s)
        rs = 0 if sole else g("rs", s); rout = rs + (g("rw", s) if rs > .01 else 0)   # con gli occhiali da sole gli occhi non si vedono
        Lv["sclera"].add(*ventaglio(cx, cy, rs, rs * op, 16))
        Lv["ink"].add(*anello(cx, cy, rs, rout, op, 16))
        rp = 0 if sole else g("rp", s) * (.72 if gl else 1); px, py = cx + g("px", s), cy + g("py", s)
        Lv["ink"].add(*ventaglio(px, py, rp, rp * op, 12))
        Lv["riflesso"].add(*ventaglio(px - rp * .28, py + rp * .28 * op, rp * .24, rp * .24 * op, 8))
        al, ac, ady = g("alen", s), g("acurv", s), g("ady", s)
        Lv["ink"].add(*nastro([(cx + al * t, cy + ady + ac * (1 - t * t)) for t in lin(9)], [g("ath", s) if al > .005 else 0] * 9))
        bl, bt, bc = g("blen", s), g("btilt", s), g("bcurve", s)
        Lv["ink"].add(*nastro([(s * (g("bx", s) + bl * t), g("by", s) + dby - bt * t + bc * (1 - t * t)) for t in lin(7)], [g("bth", s) * (.55 + .45 * (1 - t * t)) for t in lin(7)]))
        Lv["guancia"].add(*ventaglio(s * .52, -.2, .085 * g("blush", s), .055 * g("blush", s), 12))
        # occhiali: fissi
        if gl:
            Lv["ink"].add(*anello(cx, cy, .125, .158, 1, 28))
            Lv["ink"].add(*nastro([(s * (.37 + .158 + .13 * t), .05 + .01 * t) for t in [i / 4 for i in range(5)]], [.03] * 5))
        if sole:
            Lv["lenti"].add(*ventaglio(cx, cy, .175, .115, 28))
            Lv["riflesso"].add(*ventaglio(cx - .07, cy + .05, .042, .016, 8))
            Lv["ink"].add(*nastro([(s * (.37 + .175 + .12 * t), .06 + .01 * t) for t in [i / 4 for i in range(5)]], [.03] * 5))
    if gl or sole:
        Lv["ink"].add(*nastro([(-.2 + .4 * t, .07 + .03 * (1 - (2 * t - 1) ** 2)) for t in [i / 6 for i in range(7)]], [.03] * 7))
    # bocca
    mw, mcy, cL, cR, mc, mo, mp, te = g("mw") * 1.25, g("mcy"), g("cL"), g("cR"), g("mcurve"), g("mopen") * 1.3, g("mp"), g("teeth")
    up = []; lo = []
    for xt in lin(11):
        v = mcy + cL + (cR - cL) * (xt + 1) / 2 - mc * (1 - xt * xt)
        up.append((xt * mw, v)); lo.append((xt * mw, v - mo * max(0, 1 - xt * xt) ** mp))
    Lv["bocca"].add(*striscia(up, lo))
    Lv["denti"].add(*striscia(up, [(a[0], a[1] + (b[1] - a[1]) * te) for a, b in zip(up, lo)]))
    Lv["ink"].add(*nastro(up, [g("mth")] * 11)); Lv["ink"].add(*nastro(lo, [g("mth")] * 11))
    return Lv


def sulla_testa(u, v, off, D):
    rx, ry, rz, R = D; x, z = u * R, v * R
    y = -ry * math.sqrt(max(1 - (x / rx) ** 2 - (z / rz) ** 2, .04))
    n = Vector((x / rx ** 2, y / ry ** 2, z / rz ** 2)); n.normalize()
    return Vector((x, y, z)) + n * off


def _mat(nome):
    m = bpy.data.materials.get(nome) or bpy.data.materials.new(nome); m.use_nodes = True
    c = COLORI[nome].lstrip("#"); rgb = tuple(int(c[i:i + 2], 16) / 255 for i in (0, 2, 4))
    l = tuple((x / 12.92) if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in rgb)
    b = [n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"]
    if b: b[0].inputs["Base Color"].default_value = (*l, 1)
    m.diffuse_color = (*l, 1); return m


def crea_viso(testa_loc, testa_rot, D, occhiali=False, sole=False, genitore=None):
    """Crea gli oggetti viso_* con tutte le shape key. D = (rx, ry, rz, R) della testa. Ritorna la lista degli oggetti."""
    G = dict(occhiali=occhiali, sole=sole); chiavi = tutte_le_chiavi(); geo = []
    for nome, P in chiavi:
        Lv = costruisci(P, G); geo.append({n: [sulla_testa(u, v, LIVELLI[n][1], D) for u, v in L.p] for n, L in Lv.items()})
        if len(geo) == 1: facce = {n: L.f for n, L in Lv.items()}
        else: assert all(len(geo[-1][n]) == len(geo[0][n]) for n in LIVELLI), nome
    oggetti = []
    for n, (mname, _) in LIVELLI.items():
        if not geo[0][n]: continue
        me = bpy.data.meshes.new("viso_" + n); me.from_pydata([tuple(p) for p in geo[0][n]], [], facce[n]); me.update()
        o = bpy.data.objects.new("viso_" + n, me); bpy.context.collection.objects.link(o)
        o.location = testa_loc; o.rotation_euler = testa_rot; me.materials.append(_mat(mname))
        o.shape_key_add(name="Basis", from_mix=False)
        for (nome, _), g_ in zip(chiavi, geo):
            if nome == "e_neutro": continue
            sk = o.shape_key_add(name=nome, from_mix=False); sk.value = 0.0   # in Blender 5 il valore parte da 1
            for i, p in enumerate(g_[n]): sk.data[i].co = p
        for q in me.polygons: q.use_smooth = False
        if genitore: o.parent = genitore
        oggetti.append(o)
    return oggetti


def scrivi_preset(cartella):
    d = dict(note="Preset espressioni dei personaggi 3D. Shape key nel GLB: e_<nome>, v_<visema>, b_blink, g_<sguardo>.",
             espressioni={n: dict(chiusi=chiusi(n)) for n in ESPRESSIONI}, alias=ALIAS, visemi=list(VISEMI), sguardo=["sx", "dx", "su", "giu"],
             materiali={m: COLORI[m] for m in COLORI})
    json.dump(d, open(os.path.join(cartella, "espressioni.json"), "w"), indent=1, ensure_ascii=False)
