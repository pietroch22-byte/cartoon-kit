# Libreria preset «disegnato» — costruisce in Blender i modelli riusabili, li esporta in GLB (texture incluse),
# salva il .blend sorgente e rende un'anteprima per ognuno.
# Uso: /Applications/Blender.app/Contents/MacOS/Blender -b -P costruisci_preset.py -- <cartella libreria>
# Convenzioni: metri reali; base a z = 0; fronte verso +Y in Blender (= verso -z nel motore three.js);
# contorno a inchiostro #3a2a2e con «guscio rovesciato» (si vede anche nel motore, che non ha Freestyle).
import bpy, bmesh, math, os, sys, json
from mathutils import Vector
LIB = sys.argv[sys.argv.index('--') + 1]
TEX, OUT, PREV = (os.path.join(LIB, d) for d in ('texture', 'modelli', 'anteprime'))
INK = (0.042, 0.023, 0.027, 1)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def hexc(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1,)

_mats = {}
def mat(name, color='#ffffff', tex=None, rough=0.7, metal=0.0, emis=0.0, rep=1.0):
    k = (name, color, tex, rough, metal, emis, rep)
    if k in _mats: return _mats[k]
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    c = hexc(color)
    if tex:
        im = nt.nodes.new('ShaderNodeTexImage'); im.image = bpy.data.images.load(os.path.join(TEX, tex, f'{tex}_disegnato.jpg'), check_existing=True)
        uv = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (rep, rep, rep)
        nt.links.new(uv.outputs['UV'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], im.inputs['Vector'])
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'OVERLAY'; mx.inputs['Factor'].default_value = 0.55
        nt.links.new(im.outputs['Color'], mx.inputs['B']); mx.inputs['A'].default_value = c; nt.links.new(mx.outputs['Result'], b.inputs['Base Color'])
        if not emis: nt.links.new(mx.outputs['Result'], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = 0.22
    else:
        b.inputs['Base Color'].default_value = c
        if not emis: b.inputs['Emission Color'].default_value = c; b.inputs['Emission Strength'].default_value = 0.22
    if emis: b.inputs['Emission Color'].default_value = c; b.inputs['Emission Strength'].default_value = emis
    _mats[k] = m; return m

def ink_mat():
    if 'inchiostro' in bpy.data.materials: return bpy.data.materials['inchiostro']
    m = bpy.data.materials.new('inchiostro'); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = INK; b.inputs['Roughness'].default_value = 1; m.use_backface_culling = True; return m

def finish(o, m, bevel=0.0, seg=2, outline=0.012, smooth=True):
    """materiale, smusso, ombreggiatura morbida, UV, guscio d'inchiostro"""
    o.data.materials.clear(); o.data.materials.append(m)
    if bevel:
        bv = o.modifiers.new('smusso', 'BEVEL'); bv.width = bevel; bv.segments = seg; bv.limit_method = 'ANGLE'
    if smooth:
        for p in o.data.polygons: p.use_smooth = True
        try: o.modifiers.new('normali', 'WEIGHTED_NORMAL').keep_sharp = True
        except Exception: pass
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.02); bpy.ops.object.mode_set(mode='OBJECT')
    o.select_set(False)
    if outline:
        o.data.materials.append(ink_mat())
        so = o.modifiers.new('inchiostro', 'SOLIDIFY'); so.thickness = outline; so.offset = 1; so.use_flip_normals = True; so.material_offset = 1; so.use_rim = False
    return o

def add(kind, size=(1, 1, 1), loc=(0, 0, 0), rot=(0, 0, 0), **kw):
    if kind == 'box': bpy.ops.mesh.primitive_cube_add(size=1)
    elif kind == 'cyl': bpy.ops.mesh.primitive_cylinder_add(vertices=kw.get('v', 32), radius=0.5, depth=1)
    elif kind == 'sph': bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=14, radius=0.5)
    elif kind == 'tor': bpy.ops.mesh.primitive_torus_add(major_radius=kw.get('R', 0.5), minor_radius=kw.get('r', 0.08), major_segments=40, minor_segments=12)
    elif kind == 'cone': bpy.ops.mesh.primitive_cone_add(vertices=kw.get('v', 24), radius1=0.5, radius2=kw.get('r2', 0), depth=1)
    o = bpy.context.object; o.scale = size; o.location = loc; o.rotation_euler = [math.radians(a) for a in rot]
    bpy.ops.object.transform_apply(scale=True, rotation=False, location=False); return o

def group(name, parts):
    root = bpy.data.objects.new(name, None); sc.collection.objects.link(root)
    for p in parts: p.parent = root
    return root

CAT = {}
def preset(name, desc, tags):
    def deco(fn):
        CAT[name] = {'nome': name, 'descrizione': desc, 'tag': tags, 'fn': fn}; return fn
    return deco

# ------------------------------------------------------------------ MODELLI
@preset('utilitaria_cabrio', "utilitaria cabrio anni '70 azzurra con interni completi (sedili in pelle, cruscotto in legno con quadranti, volante, leva del cambio)", ['macchina', 'auto', 'car', 'utilitaria', 'cabrio'])
def utilitaria():
    P = []; azz = mat('carrozzeria', '#8fd0e8', 'blue_metal_plate', 0.35, 0.1, rep=0.5); cromo = mat('cromo', '#d8dce8', rough=0.25, metal=0.9)
    gom = mat('gomma', '#1c1820', 'rubber_tiles', 0.9); pel = mat('pelle', '#c84a3a', 'leather_red_02', 0.55); leg = mat('legno', '#a0683a', 'dark_wood', 0.45)
    vetro = mat('vetro', '#5a7ab8', rough=0.05); faro = mat('faro', '#fff2c8', rough=0.2, emis=2.5); stop = mat('stop', '#ff3a3a', rough=0.3, emis=1.6)
    # scocca: corpo basso con fiancate arrotondate, cofano e baule
    b = add('box', (1.62, 3.4, 0.5), (0, 0, 0.62)); finish(b, azz, 0.12, 4); P.append(b)
    c = add('box', (1.5, 1.0, 0.14), (0, 1.15, 0.92)); finish(c, azz, 0.06, 3); P.append(c)                 # cofano
    t = add('box', (1.5, 0.8, 0.12), (0, -1.25, 0.92)); finish(t, azz, 0.05, 3); P.append(t)                 # baule
    for x in (-0.82, 0.82):                                                                                  # parafanghi tondi
        for y in (1.1, -1.1): f = add('cyl', (0.78, 0.78, 0.3), (x * 0.98, y, 0.42), (0, 90, 0)); finish(f, azz, 0.05, 3); P.append(f)
    for x in (-0.82, 0.82):
        for y in (1.1, -1.1):
            g = add('cyl', (0.62, 0.62, 0.24), (x, y, 0.31), (0, 90, 0)); finish(g, gom, 0.03, 2); P.append(g)
            h = add('cyl', (0.34, 0.34, 0.05), (x * 1.13, y, 0.31), (0, 90, 0)); finish(h, cromo, 0.01, 2); P.append(h)
    for y, m in ((1.72, cromo), (-1.72, cromo)): pa = add('box', (1.7, 0.1, 0.12), (0, y, 0.45)); finish(pa, m, 0.04, 3); P.append(pa)   # paraurti
    for x in (-0.5, 0.5):
        fa = add('cyl', (0.26, 0.26, 0.08), (x, 1.69, 0.72), (90, 0, 0)); finish(fa, faro, 0.01, 2); P.append(fa)
        an = add('tor', (1, 1, 1), (x, 1.71, 0.72), (90, 0, 0), R=0.14, r=0.025); finish(an, cromo, 0, outline=0.006); P.append(an)
        st = add('box', (0.3, 0.06, 0.12), (x, -1.71, 0.78)); finish(st, stop, 0.02, 2); P.append(st)
    for x in (-0.815, 0.815): ma = add('box', (0.04, 0.22, 0.04), (x, 0.1, 0.8)); finish(ma, cromo, 0.01, 2); P.append(ma)   # maniglie
    # parabrezza con cornice
    for x in (-0.72, 0.72): mo = add('box', (0.05, 0.05, 0.5), (x, 0.62, 1.12), (-22, 0, 0)); finish(mo, cromo, 0.01, 2); P.append(mo)
    tr = add('box', (1.5, 0.05, 0.05), (0, 0.53, 1.36)); finish(tr, cromo, 0.01, 2); P.append(tr)
    ve = add('box', (1.42, 0.02, 0.44), (0, 0.63, 1.12), (-22, 0, 0)); finish(ve, vetro, 0, outline=0); P.append(ve)
    # interni: pianale, sedili, cruscotto, volante, cambio
    pi = add('box', (1.46, 2.0, 0.05), (0, -0.1, 0.88)); finish(pi, gom, 0, outline=0); P.append(pi)
    for x in (-0.36, 0.36):
        se = add('box', (0.56, 0.52, 0.14), (x, -0.05, 0.98)); finish(se, pel, 0.05, 4); P.append(se)
        sc_ = add('box', (0.56, 0.14, 0.52), (x, -0.36, 1.25), (-10, 0, 0)); finish(sc_, pel, 0.05, 4); P.append(sc_)
        pt = add('box', (0.3, 0.1, 0.16), (x, -0.42, 1.6)); finish(pt, pel, 0.04, 3); P.append(pt)
        for k in range(3): cu = add('box', (0.5, 0.02, 0.012), (x, -0.285, 1.08 + k * 0.14), (-10, 0, 0)); finish(cu, mat('cucitura', '#7a2a24'), 0, outline=0); P.append(cu)
    cr = add('box', (1.46, 0.36, 0.26), (0, 0.42, 1.06)); finish(cr, mat('plancia', '#3a2a40', rough=0.6), 0.05, 3); P.append(cr)
    fi = add('box', (1.4, 0.02, 0.09), (0, 0.235, 1.13)); finish(fi, leg, 0.005, 2); P.append(fi)
    for x, r in ((-0.36, 0.11), (-0.16, 0.07), (0.3, 0.06)):
        q = add('cyl', (r * 2, r * 2, 0.03), (x, 0.24, 1.06), (90, 0, 0)); finish(q, mat('quadrante', '#fff2d0', rough=0.4, emis=0.5), 0.005, 2); P.append(q)
        a = add('box', (0.008, 0.005, r * 0.8), (x + r * 0.2, 0.226, 1.06 + r * 0.15), (0, 40, 0)); finish(a, mat('ago', '#d0302a'), 0, outline=0); P.append(a)
    ra = add('box', (0.3, 0.03, 0.1), (0.05, 0.235, 0.98)); finish(ra, mat('radio', '#22202e', rough=0.4), 0.01, 2); P.append(ra)
    dp = add('box', (0.14, 0.01, 0.035), (0.0, 0.219, 1.0)); finish(dp, mat('display', '#7fd0a0', emis=1.2), 0, outline=0); P.append(dp)
    vo = add('tor', (1, 1, 1), (-0.36, 0.12, 1.26), (62, 0, 0), R=0.19, r=0.022); finish(vo, mat('volante', '#2a1e2a', rough=0.4), 0, outline=0.008); P.append(vo)
    for a in (90, 210, 330):
        r_ = add('box', (0.17, 0.02, 0.015), (-0.36 + math.cos(math.radians(a)) * 0.085, 0.12 - math.sin(math.radians(a)) * 0.04, 1.26 + math.sin(math.radians(a)) * 0.075), (62, 0, -a)); finish(r_, cromo, 0, outline=0); P.append(r_)
    cl = add('cyl', (0.11, 0.11, 0.03), (-0.36, 0.12, 1.26), (62, 0, 0)); finish(cl, mat('clacson', '#c0392b', rough=0.4), 0.005, 2); P.append(cl)
    pv = add('cyl', (0.05, 0.05, 0.35), (-0.36, 0.28, 1.15), (62, 0, 0)); finish(pv, mat('piantone', '#2a1e2a')); P.append(pv)
    le = add('cyl', (0.025, 0.025, 0.28), (0.0, 0.08, 1.02), (-15, 0, 0)); finish(le, cromo, 0); P.append(le)
    po = add('sph', (0.07, 0.07, 0.07), (0.0, 0.045, 1.16)); finish(po, mat('pomello', '#1c1820', rough=0.3)); P.append(po)
    sp = add('box', (0.3, 0.04, 0.09), (0, 0.5, 1.42)); finish(sp, mat('specchio', '#9ab0e0', rough=0.05, metal=0.6), 0.01, 2); P.append(sp)
    return group('utilitaria_cabrio', P)

@preset('telefono_supporto', 'smartphone su supporto a ventosa da cruscotto (schermo da sostituire con la mappa)', ['telefono', 'cellulare', 'navigatore', 'phone'])
def telefono():
    P = []; ne = mat('telnero', '#1b1b22', rough=0.25, metal=0.2)
    c = add('box', (0.085, 0.012, 0.17), (0, 0, 0.18)); finish(c, ne, 0.006, 3, 0.003); P.append(c)
    s = add('box', (0.075, 0.002, 0.155), (0, 0.0065, 0.18)); finish(s, mat('schermo', '#7fd8ff', rough=0.1, emis=0.6), 0, outline=0); s.name = 'schermo'; P.append(s)
    pi = add('box', (0.1, 0.03, 0.02), (0, -0.01, 0.09)); finish(pi, mat('pinza', '#3a3a4a', rough=0.5), 0.005, 2, 0.003); P.append(pi)
    br = add('cyl', (0.02, 0.02, 0.09), (0, -0.02, 0.045)); finish(br, mat('pinza', '#3a3a4a'), 0, outline=0.003); P.append(br)
    ve = add('cyl', (0.07, 0.07, 0.012), (0, -0.02, 0.006)); finish(ve, mat('ventosa', '#5a5a6a', rough=0.3), 0.003, 2, 0.003); P.append(ve)
    return group('telefono_supporto', P)

@preset('sacchetto_forno', 'sacchetto di carta del forno con filone di pane che spunta', ['pane', 'forno', 'sacchetto', 'bread', 'bakery'])
def sacchetto():
    P = []; ca = mat('carta', '#e8c890', 'plastered_wall_02', 0.9, rep=0.6)
    s = add('box', (0.26, 0.16, 0.34), (0, 0, 0.17)); finish(s, ca, 0.015, 2, 0.006); P.append(s)
    for k in range(7): pi = add('box', (0.04, 0.165, 0.02), (-0.12 + k * 0.04, 0, 0.345 - (k % 2) * 0.01)); finish(pi, ca, 0, outline=0.004); P.append(pi)
    st = add('box', (0.2, 0.005, 0.07), (0, 0.083, 0.2)); finish(st, mat('stampa', '#c0501a', rough=0.8), 0, outline=0); P.append(st)
    fi = add('cyl', (0.085, 0.085, 0.42), (0.02, 0.0, 0.42), (0, 18, 0), v=20); finish(fi, mat('crosta', '#d89a4a', rough=0.75), 0.03, 3, 0.006); P.append(fi)
    for k in range(4): ta = add('box', (0.07, 0.03, 0.012), (0.05 + k * 0.012, 0.042, 0.36 + k * 0.07), (0, 18 - 30, 0)); finish(ta, mat('taglio', '#f0d0a0'), 0, outline=0); P.append(ta)
    return group('sacchetto_forno', P)

@preset('lampione_paese', 'lampione in ghisa da paese con lanterna accesa', ['lampione', 'luce', 'strada', 'street lamp'])
def lampione():
    P = []; gh = mat('ghisa', '#24202c', 'metal_plate', 0.45, 0.6)
    for (r, h, z) in ((0.16, 0.25, 0.125), (0.1, 0.35, 0.42), (0.055, 3.3, 2.25), (0.08, 0.1, 3.9)): o = add('cyl', (r * 2, r * 2, h), (0, 0, z)); finish(o, gh, 0.01, 2); P.append(o)
    br = add('box', (0.05, 0.6, 0.05), (0, 0.28, 3.85)); finish(br, gh, 0.01, 2); P.append(br)
    la = add('cone', (0.36, 0.36, 0.45), (0, 0.55, 3.75), (180, 0, 0), v=6, r2=0.6); finish(la, mat('vetrolanterna', '#ffe0a0', rough=0.2, emis=3.0), 0, outline=0.008); P.append(la)
    tp = add('cone', (0.44, 0.44, 0.2), (0, 0.55, 4.05), v=6); finish(tp, gh, 0.01, 2); P.append(tp)
    return group('lampione_paese', P)

@preset('panchina_legno', 'panchina in legno e ghisa da piazza', ['panchina', 'bench', 'piazza'])
def panchina():
    P = []; le = mat('doghe', '#b07040', 'dark_wood', 0.6, rep=0.7); gh = mat('ghisa', '#24202c', 'metal_plate', 0.45, 0.6)
    for k in range(3): o = add('box', (1.7, 0.12, 0.04), (0, -0.15 + k * 0.14, 0.45)); finish(o, le, 0.01, 2); P.append(o)
    for k in range(2): o = add('box', (1.7, 0.04, 0.12), (0, -0.25, 0.65 + k * 0.16), (-12, 0, 0)); finish(o, le, 0.01, 2); P.append(o)
    for x in (-0.75, 0.75):
        for (sz, lo, ro) in (((0.06, 0.06, 0.45), (x, 0.12, 0.22), (0, 0, 0)), ((0.06, 0.06, 0.85), (x, -0.22, 0.42), (-12, 0, 0)), ((0.06, 0.45, 0.05), (x, -0.02, 0.6), (0, 0, 0))):
            o = add('box', sz, lo, ro); finish(o, gh, 0.01, 2); P.append(o)
    return group('panchina_legno', P)

@preset('cassonetto', 'cassonetto verde dei rifiuti con coperchio e ruote', ['cassonetto', 'rifiuti', 'spazzatura', 'bin'])
def cassonetto():
    P = []; ve = mat('cassonetto', '#3a8a4a', 'green_metal_rust', 0.6, 0.3)
    c = add('box', (1.2, 0.8, 1.0), (0, 0, 0.65)); finish(c, ve, 0.04, 3); P.append(c)
    co = add('box', (1.26, 0.86, 0.08), (0, 0.02, 1.19), (-6, 0, 0)); finish(co, mat('coperchio', '#2f6a3a', 'green_metal_rust', 0.6), 0.03, 3); P.append(co)
    for x in (-0.45, 0.45):
        for y in (-0.3, 0.3): r = add('cyl', (0.16, 0.16, 0.06), (x, y, 0.08), (0, 90, 0)); finish(r, mat('gomma', '#1c1820', 'rubber_tiles', 0.9)); P.append(r)
    ad = add('box', (0.4, 0.01, 0.25), (0, 0.405, 0.75)); finish(ad, mat('adesivo', '#f4f0e0', rough=0.8), 0, outline=0.003); P.append(ad)
    return group('cassonetto', P)

@preset('vaso_pianta', 'vaso di terracotta con pianta tonda (ingressi, balconi)', ['vaso', 'pianta', 'fiori', 'plant'])
def vaso():
    P = []; te = mat('terracotta', '#c0603a', 'red_plaster_weathered', 0.8, rep=0.5)
    v = add('cone', (0.6, 0.6, 0.55), (0, 0, 0.275), (0, 0, 0), v=28, r2=0.72); finish(v, te, 0.02, 2); P.append(v)
    b = add('tor', (1, 1, 1), (0, 0, 0.55), R=0.31, r=0.04); finish(b, te, 0, outline=0.006); P.append(b)
    for (s, x, y, z) in ((0.62, 0, 0, 0.85), (0.4, 0.2, 0.1, 1.05), (0.36, -0.18, -0.05, 1.0)):
        f = add('sph', (s, s, s * 0.9), (x, y, z)); finish(f, mat('foglie', '#3a9a4a', rough=0.8)); P.append(f)
    for k in range(5): fl = add('sph', (0.08, 0.08, 0.08), (math.cos(k * 1.3) * 0.25, math.sin(k * 1.3) * 0.25, 1.0 + (k % 2) * 0.12)); finish(fl, mat('fiore', ['#ff5a9a', '#ffd23a'][k % 2], emis=0.3), 0, outline=0.004); P.append(fl)
    return group('vaso_pianta', P)

@preset('motorino', "motorino giallo anni '80 parcheggiato", ['motorino', 'scooter', 'vespa', 'moto'])
def motorino():
    P = []; gi = mat('scocca_moto', '#e8c040', 'painted_metal_shutter', 0.4, 0.1, rep=0.4); gom = mat('gomma', '#1c1820', 'rubber_tiles', 0.9); cr = mat('cromo', '#d8dce8', rough=0.25, metal=0.9)
    for y in (0.55, -0.55): r = add('tor', (1, 1, 1), (0, y, 0.26), (0, 90, 0), R=0.2, r=0.07); finish(r, gom, 0, outline=0.006); P.append(r)
    s = add('box', (0.42, 0.9, 0.42), (0, -0.25, 0.55)); finish(s, gi, 0.12, 4); P.append(s)
    se = add('box', (0.32, 0.55, 0.1), (0, -0.25, 0.82)); finish(se, mat('sella', '#2a1e2a', 'leather_red_02', 0.5), 0.04, 3); P.append(se)
    sc_ = add('box', (0.36, 0.12, 0.8), (0, 0.5, 0.6), (-15, 0, 0)); finish(sc_, gi, 0.05, 3); P.append(sc_)
    pe = add('box', (0.34, 0.5, 0.06), (0, 0.15, 0.3)); finish(pe, gi, 0.02, 2); P.append(pe)
    ma = add('cyl', (0.03, 0.03, 0.6), (0, 0.62, 1.02), (0, 90, 0)); finish(ma, cr, 0); P.append(ma)
    fa = add('cyl', (0.14, 0.14, 0.06), (0, 0.66, 0.95), (90, 0, 0)); finish(fa, mat('faro', '#fff2c8', rough=0.2, emis=2.0), 0.005, 2); P.append(fa)
    for x in (-0.25, 0.25): sp = add('sph', (0.06, 0.03, 0.04), (x, 0.6, 1.12)); finish(sp, cr, 0, outline=0.004); P.append(sp)
    return group('motorino', P)

@preset('cartello_stradale', 'cartello stradale tondo blu su palo (freccia dipinta)', ['cartello', 'segnale', 'sign', 'rotonda'])
def cartello():
    P = []; pa = mat('palo', '#8a8ca0', 'metal_plate', 0.4, 0.7)
    p = add('cyl', (0.07, 0.07, 2.4), (0, 0, 1.2)); finish(p, pa, 0); P.append(p)
    d = add('cyl', (0.7, 0.7, 0.04), (0, 0.04, 2.45), (90, 0, 0)); finish(d, mat('blu', '#2a5ab0', rough=0.4), 0.01, 2); P.append(d)
    b = add('tor', (1, 1, 1), (0, 0.065, 2.45), (90, 0, 0), R=0.34, r=0.015); finish(b, mat('bianco', '#f4f4f8', rough=0.4), 0, outline=0); P.append(b)
    for (s, l, r) in (((0.06, 0.01, 0.35), (0, 0.065, 2.4), (0, 0, 0)), ((0.06, 0.01, 0.2), (0.06, 0.065, 2.58), (0, -45, 0)), ((0.06, 0.01, 0.2), (-0.06, 0.065, 2.58), (0, 45, 0))):
        o = add('box', s, l, r); finish(o, mat('bianco', '#f4f4f8', rough=0.4), 0, outline=0); P.append(o)
    return group('cartello_stradale', P)

@preset('vetrina_bottega', 'vetrina di bottega con tenda a righe, insegna vuota, vasi e cassette di frutta (lato fronte +Y)', ['vetrina', 'negozio', 'bottega', 'shop', 'forno', 'alimentari'])
def vetrina():
    P = []; mu = mat('muro', '#a07890', 'plastered_wall_02', 0.85, rep=0.8)
    m = add('box', (3.2, 0.3, 3.0), (0, -0.15, 1.5)); finish(m, mu, 0.02, 2); P.append(m)
    v = add('box', (2.0, 0.05, 1.5), (-0.3, 0.02, 1.25)); finish(v, mat('vetrinaluce', '#ffd890', rough=0.2, emis=1.4), 0, outline=0.01); P.append(v)
    for (s, l) in (((2.1, 0.08, 0.08), (-0.3, 0.05, 2.03)), ((2.1, 0.08, 0.08), (-0.3, 0.05, 0.48)), ((0.08, 0.08, 1.6), (-1.32, 0.05, 1.25)), ((0.08, 0.08, 1.6), (0.72, 0.05, 1.25))):
        o = add('box', s, l); finish(o, mat('telaio', '#5a3a20', 'dark_wood', 0.5), 0.01, 2); P.append(o)
    po = add('box', (0.75, 0.06, 2.1), (1.15, 0.02, 1.05)); finish(po, mat('porta', '#6a3a24', 'dark_wood', 0.5), 0.02, 2); P.append(po)
    te = add('box', (3.0, 0.9, 0.05), (0, 0.45, 2.55), (-25, 0, 0)); finish(te, mat('tenda', '#c83a3a', 'fabric_pattern_05', 0.8, rep=0.7), 0.01, 2); P.append(te)
    for k in range(8): fr = add('box', (0.375, 0.02, 0.12), (-1.31 + k * 0.375, 0.86, 2.31)); finish(fr, mat('frangia', ['#c83a3a', '#f4ead0'][k % 2]), 0, outline=0.004); P.append(fr)
    ins = add('box', (2.2, 0.08, 0.5), (0, 0.04, 2.75)); ins.name = 'insegna'; finish(ins, mat('insegna', '#2a1e2a', rough=0.5), 0.02, 2); P.append(ins)
    for x in (-1.0, -0.4):
        ca = add('box', (0.5, 0.35, 0.25), (x, 0.35, 0.13)); finish(ca, mat('cassetta', '#c09060', 'dark_wood', 0.7, rep=0.5), 0.01, 2); P.append(ca)
        for k in range(6): fr = add('sph', (0.1, 0.1, 0.1), (x - 0.18 + (k % 3) * 0.18, 0.28 + (k // 3) * 0.14, 0.3)); finish(fr, mat('frutto', ['#ff7a30', '#e83a3a', '#ffd23a'][k % 3], rough=0.4), 0, outline=0.004); P.append(fr)
    return group('vetrina_bottega', P)

# ------------------------------------------------------------------ COSTRUZIONE, EXPORT, ANTEPRIME
os.makedirs(OUT, exist_ok=True); os.makedirs(PREV, exist_ok=True)
sc.render.engine = 'BLENDER_EEVEE'; sc.render.resolution_x = sc.render.resolution_y = 512; sc.render.film_transparent = False
sc.view_settings.view_transform = 'AgX'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.3, 0.32, 0.55, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.5
bpy.ops.object.light_add(type='SUN'); sun = bpy.context.object; sun.data.energy = 4.5; sun.rotation_euler = (math.radians(50), 0, math.radians(30))
catalogo = []
for name, info in CAT.items():
    root = info['fn'](); bpy.context.view_layer.update()
    objs = [root] + list(root.children_recursive)
    pts = [o.matrix_world @ Vector(c) for o in objs if o.type == 'MESH' for c in o.bound_box]
    mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx = Vector([max(p[i] for p in pts) for i in range(3)]); dim = mx - mn
    for o in bpy.data.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name + '.glb'), use_selection=True, export_apply=True, export_format='GLB', export_yup=True)
    # anteprima 3/4
    cd = bpy.data.cameras.new('c'); cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam; cd.lens = 50
    ctr = (mn + mx) / 2; r = max(dim) * 1.7 + 0.3; cam.location = ctr + Vector((r * 0.75, r * 0.9, r * 0.55))
    cam.rotation_euler = (ctr - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(PREV, name + '.png'); bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam)
    root.hide_render = True
    for o in root.children_recursive: o.hide_render = True; o.hide_set(True)
    catalogo.append({'nome': name, 'file': f'modelli/{name}.glb', 'anteprima': f'anteprime/{name}.png', 'descrizione': info['descrizione'], 'tag': info['tag'],
                     'misure_m': [round(dim.x, 2), round(dim.y, 2), round(dim.z, 2)], 'fronte': '+Y in Blender = -z nel motore', 'stile': 'disegnato', 'licenza': 'creato da noi; texture CC0 Poly Haven'})
for o in bpy.data.objects: o.hide_render = False; o.hide_set(False)
json.dump(catalogo, open(os.path.join(LIB, 'catalogo.json'), 'w'), ensure_ascii=False, indent=1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(LIB, 'modelli', 'libreria_preset.blend'))
print('PRESET OK', len(catalogo))
