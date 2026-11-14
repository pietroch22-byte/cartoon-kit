"""Personaggi 3D «omini» per il look disegnato: testa grande, corpo a fagiolo, gambe e braccia sottili. Ognuno IRREGOLARE e diverso (seme).
Blender -b --python genera_personaggi.py [-- nome1 nome2 …]   ->  <nome>.glb in questa cartella + catalogo.json
Struttura del GLB (il motore la anima): omino > corpo, testa, viso_* (occhi, sopracciglia, bocca… con shape key), capelli, accessori…, anca_L/anca_R (gambe), spalla_L/spalla_R (braccia).
Materiali: pelle, corpo, capelli, gambe, accessorio, cravatta, viso_*.  Fronte verso -Y in Blender = +Z nel motore.
Aggiungere un personaggio: nuova voce in CAST qui sotto e rilancia lo script.
"""
import bpy, bmesh, math, os, sys, json, random
from mathutils import Vector, noise, Matrix
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import viso   # faccia con shape key (viso.py)
# nome: tipo, colore corpo, capelli (tipo, colore), accessori, seme, proporzioni (altezza, larghezza, testa) 0..1
CAST = {
  "turista_arancio": dict(corpo="#e8742a", capelli=("calotta", "#6b4630"), acc=["macchina_foto"], seme=3, prop=(.6, .55, .5)),
  "impiegato_blu":   dict(corpo="#2c3670", capelli=("calotta", "#2a1e1a"), acc=["cravatta", "occhiali"], seme=9, prop=(.75, .4, .45)),
  "poliziotto":      dict(corpo="#2a4ab0", capelli=("corti", "#2a1e1a"), acc=["cappello_polizia", "cintura"], seme=31, prop=(.7, .6, .5)),
  "duro_sole":       dict(corpo="#6a4ad0", capelli=("pelato", "#2a1e1a"), acc=["berretto", "occhiali_sole"], seme=21, prop=(.55, .7, .55)),
  "nonna_chignon":   dict(corpo="#d85a3a", capelli=("chignon", "#d8d4cc"), acc=["occhiali"], seme=17, prop=(.25, .7, .6)),
  "nonno_baffi":     dict(corpo="#c8a03a", capelli=("pelato", "#d8d4cc"), acc=["baffi", "occhiali"], seme=44, prop=(.35, .6, .65)),
  "ragazza_lunghi":  dict(corpo="#c84a6a", capelli=("lunghi", "#3a2418"), acc=[], seme=8, prop=(.55, .35, .5)),
  "ragazzo_spettinato": dict(corpo="#4a9a5a", capelli=("spettinato", "#8a5a2a"), acc=[], seme=14, prop=(.65, .45, .4)),
  "studente_ricci":  dict(corpo="#5ab0c0", capelli=("ricci", "#2a1e1a"), acc=["occhiali", "zaino"], seme=27, prop=(.5, .5, .55)),
  "commesso_papillon": dict(corpo="#2a2a32", capelli=("caschetto", "#1a1412"), acc=["papillon"], seme=52, prop=(.45, .45, .5)),
}
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
NOMI = args or list(CAST)
INK = "#3a2a2e"
def hex2(c): c = c.lstrip("#"); return tuple(int(c[i:i + 2], 16) / 255 for i in (0, 2, 4))
def lin(c): return tuple((x / 12.92) if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c)

def reset():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for d in (bpy.data.meshes, bpy.data.materials):
        for x in list(d): d.remove(x)
def mat(n, col):
    m = bpy.data.materials.get(n) or bpy.data.materials.new(n); m.use_nodes = True
    bs = [x for x in m.node_tree.nodes if x.type == "BSDF_PRINCIPLED"]
    if not bs: bs = [m.node_tree.nodes.new("ShaderNodeBsdfPrincipled")]
    bs[0].inputs["Base Color"].default_value = (*lin(hex2(col)), 1); return m
def irregolare(o, seme, amp=.035, scala=1.6):
    """deforma la mesh con un rumore lento: nessuna sagoma perfetta, ognuno diverso"""
    me = o.data; off = Vector((seme * 1.7, seme * .9, seme * 2.3))
    for v in me.vertices:
        p = v.co * scala + off; n = noise.noise(p)
        v.co += v.normal * n * amp
def liscia(o, lv=2):
    s = o.modifiers.new("s", "SUBSURF"); s.levels = lv; s.render_levels = lv
    bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier="s"); bpy.ops.object.shade_smooth()
def parent(o, p): o.parent = p; return o
def applica(o):
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

def crea(nome, c):
    reset(); R = random.Random(c["seme"]); s = c["seme"]
    alt, lar, tes = c["prop"]
    H_leg = .40 + (1 - alt) * .12                    # gambe corte come nel reference
    H_body = .78 + alt * .32; W_body = .26 + lar * .10; R_head = .33 + tes * .09
    M = {k: mat(k, v) for k, v in dict(pelle="#f7f3ee", corpo=c["corpo"], capelli=c["capelli"][1], gambe="#3a2a3a", accessorio="#2a2040", cravatta="#c83a3a", faccia="#ffffff").items()}
    root = bpy.data.objects.new("omino", None); bpy.context.collection.objects.link(root)
    # ---- corpo a fagiolo (più largo in basso, pancia secondo il seme), irregolare
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=1, location=(0, 0, 0)); b = bpy.context.active_object; b.name = "corpo"
    pancia = .9 + R.random() * .25
    for v in b.data.vertices:
        z = v.co.z; k = (1 - z) / 2                 # 0 in alto, 1 in basso
        r = W_body * (.82 + .25 * k * pancia) ; v.co.x *= r; v.co.y *= r * .88; v.co.z = z * H_body / 2
    irregolare(b, s, .012, 3.0); b.location = (0, 0, H_leg + H_body / 2 - .03); b.data.materials.append(M["corpo"]); liscia(b, 1); parent(b, root)
    # strisce/zip/dettagli dipinti come mesh: bottoni
    if "cravatta" in c["acc"]:
        bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=.05, depth=.32, location=(0, -W_body * .9, H_leg + H_body * .62), rotation=(math.pi, 0, math.pi / 4))
        t = bpy.context.active_object; t.scale = (1, .25, 1); t.name = "cravatta"; t.data.materials.append(M["cravatta"]); parent(t, root)
    if "papillon" in c["acc"]:
        for sx in (-1, 1):
            bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=.06, depth=.09, location=(sx * .045, -W_body * .92, H_leg + H_body * .86), rotation=(0, sx * math.pi / 2, 0))
            p = bpy.context.active_object; p.name = "papillon"; p.data.materials.append(M["cravatta"]); parent(p, root)
    if "cintura" in c["acc"]:
        bpy.ops.mesh.primitive_torus_add(major_radius=W_body * 1.02, minor_radius=.025, location=(0, 0, H_leg + H_body * .28)); t = bpy.context.active_object; t.scale = (1, .9, 1); t.name = "cintura"; t.data.materials.append(M["accessorio"]); parent(t, root)
    if "macchina_foto" in c["acc"]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(.04, -W_body * 1.0, H_leg + H_body * .52)); t = bpy.context.active_object; t.scale = (.13, .06, .09); t.name = "macchina_foto"; t.data.materials.append(M["accessorio"]); parent(t, root)
        bpy.ops.mesh.primitive_torus_add(major_radius=W_body * .95, minor_radius=.008, location=(0, -.02, H_leg + H_body * .7), rotation=(.5, .0, .3)); t = bpy.context.active_object; t.name = "tracolla"; t.data.materials.append(M["accessorio"]); parent(t, root)
    if "zaino" in c["acc"]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, W_body * .95, H_leg + H_body * .6)); t = bpy.context.active_object; t.scale = (.3, .14, .36); t.name = "zaino"; t.data.materials.append(M["accessorio"])
        b2 = t.modifiers.new("b", "BEVEL"); b2.width = .04; b2.segments = 3; bpy.context.view_layer.objects.active = t; bpy.ops.object.modifier_apply(modifier="b"); parent(t, root)
    # ---- testa grande, appena a uovo e storta
    hz = H_leg + H_body - .02 + R_head * .82
    bpy.ops.mesh.primitive_uv_sphere_add(segments=36, ring_count=24, radius=R_head, location=(0, 0, 0)); h = bpy.context.active_object; h.name = "testa"
    h.scale = (1 + (R.random() - .5) * .1, .94, 1 + (R.random() - .3) * .12); dim_testa = (R_head * h.scale.x, R_head * h.scale.y, R_head * h.scale.z, R_head); applica(h); irregolare(h, s + 5, .01, 4.0)
    h.location = (0, 0, hz); h.rotation_euler = (0, (R.random() - .5) * .08, 0); h.data.materials.append(M["pelle"]); bpy.ops.object.shade_smooth(); parent(h, root)
    # faccia: occhi, sopracciglia, bocca, guance, occhiali = forme sottili sulla testa con shape key (espressioni, visemi, battito, sguardo)
    viso.crea_viso(h.location, h.rotation_euler, dim_testa, occhiali=("occhiali" in c["acc"]), sole=("occhiali_sole" in c["acc"]), genitore=root)
    # ---- capelli
    tipo = c["capelli"][0]
    def calotta(taglio, gonfio=1.04, nome_="capelli"):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=36, ring_count=24, radius=R_head * gonfio, location=(0, 0, 0)); o = bpy.context.active_object; o.name = nome_
        o.scale = h.scale; applica(o)
        bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.delete(bm, geom=[q for q in bm.faces if not (taglio(q.calc_center_median()) and (q.calc_center_median().y > -R_head * .5 or q.calc_center_median().z > R_head * .4))], context="FACES"); bm.to_mesh(o.data); bm.free()   # la fronte resta libera per le sopracciglia
        irregolare(o, s + 9, .015, 5); o.location = h.location; o.data.materials.append(M["capelli"]); liscia(o, 1); parent(o, root); return o
    if tipo == "calotta": calotta(lambda p: p.z > R_head * (.18 + .25 * max(0, -p.y / R_head)))
    elif tipo == "corti": calotta(lambda p: p.z > R_head * .35)
    elif tipo == "caschetto": calotta(lambda p: (p.z > R_head * .25 or p.y > -R_head * .2) and p.z > -R_head * .45, 1.06)
    elif tipo == "lunghi":
        calotta(lambda p: p.z > R_head * .2 or (p.y > -R_head * .1 and p.z > -R_head * 1.0), 1.06)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, R_head * .35, hz - R_head * 1.0)); o = bpy.context.active_object; o.scale = (R_head * 1.7, R_head * .5, R_head * 1.1); o.name = "capelli_lunghi"
        bv = o.modifiers.new("b", "BEVEL"); bv.width = .08; bv.segments = 4; bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier="b"); o.data.materials.append(M["capelli"]); bpy.ops.object.shade_smooth(); parent(o, root)
    elif tipo == "spettinato":
        calotta(lambda p: p.z > R_head * .3)
        for i in range(9):
            a = i / 9 * math.pi * 2 + R.random() * .3; d = Vector((math.cos(a) * .55, math.sin(a) * .55, .75)).normalized()
            bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=.07, depth=.2 + R.random() * .08, location=h.location + d * R_head * 1.0)
            o = bpy.context.active_object; o.rotation_euler = d.to_track_quat("Z", "Y").to_euler(); o.name = "ciuffo"; o.data.materials.append(M["capelli"]); parent(o, root)
    elif tipo == "ricci":
        for i in range(40):
            u = R.random() * math.pi * 2; v = R.random() * .9
            d = Vector((math.cos(u) * math.sin(v * 1.6), math.sin(u) * math.sin(v * 1.6), math.cos(v * 1.6)))
            if d.y < -.55 and d.z < .55: continue
            bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6, radius=.075 + R.random() * .03, location=h.location + d * R_head * 1.0); o = bpy.context.active_object; o.name = "riccio"; o.data.materials.append(M["capelli"]); bpy.ops.object.shade_smooth(); parent(o, root)
    elif tipo == "chignon":
        calotta(lambda p: p.z > R_head * .15 and p.y > -R_head * .75, 1.03)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=R_head * .33, location=h.location + Vector((0, R_head * .3, R_head * .98))); o = bpy.context.active_object; o.name = "chignon"; o.data.materials.append(M["capelli"]); irregolare(o, s, .01, 6); bpy.ops.object.shade_smooth(); parent(o, root)
    # ---- cappelli 3D
    if "berretto" in c["acc"]:
        calotta(lambda p: p.z > R_head * .28, 1.08, "berretto").data.materials[0] = M["accessorio"]
        bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=R_head * .62, depth=.03, location=h.location + Vector((0, -R_head * .72, R_head * .32))); o = bpy.context.active_object; o.scale = (1, .75, 1); o.rotation_euler = (-.25, 0, 0); o.name = "visiera"; o.data.materials.append(M["accessorio"]); parent(o, root)
    if "cappello_polizia" in c["acc"]:
        mat("accessorio", "#1f3a8a")
        bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=R_head * .92, depth=R_head * .35, location=h.location + Vector((0, 0, R_head * .72))); o = bpy.context.active_object; o.name = "cappello"; o.data.materials.append(M["accessorio"]); parent(o, root)
        bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=R_head * 1.08, depth=.05, location=h.location + Vector((0, -.03, R_head * .92))); o = bpy.context.active_object; o.name = "cappello_top"; o.scale = (1, 1.05, 1); o.data.materials.append(M["accessorio"]); parent(o, root)
        bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=R_head * .6, depth=.025, location=h.location + Vector((0, -R_head * .8, R_head * .52))); o = bpy.context.active_object; o.scale = (1, .65, 1); o.rotation_euler = (-.35, 0, 0); o.name = "visiera"; o.data.materials.append(mat("visiera", "#0c1530")); parent(o, root)
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=.05, depth=.02, location=h.location + Vector((0, -R_head * .93, R_head * .78)), rotation=(math.pi / 2, 0, 0)); o = bpy.context.active_object; o.name = "distintivo"; o.data.materials.append(mat("oro", "#f0c040")); parent(o, root)
    if "baffi" in c["acc"]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=.1, location=h.location + Vector((0, -dim_testa[1] * .95 - .01, -R_head * .27))); o = bpy.context.active_object; o.scale = (1.7, .38, .42); o.name = "baffi"; o.data.materials.append(M["capelli"]); bpy.ops.object.shade_smooth(); parent(o, root)
    # ---- gambe (pivot all'anca) e braccia (pivot alla spalla): il motore le fa oscillare
    for sx, lato in ((-1, "L"), (1, "R")):
        anca = bpy.data.objects.new("anca_" + lato, None); bpy.context.collection.objects.link(anca); anca.location = (sx * W_body * .42, 0, H_leg + .02); parent(anca, root)
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=.028, depth=H_leg, location=(0, 0, -H_leg / 2)); g = bpy.context.active_object; g.name = "gamba_" + lato; g.data.materials.append(M["gambe"]); parent(g, anca)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=.06, location=(0, -.04, -H_leg + .02)); p = bpy.context.active_object; p.scale = (.8, 1.5, .55); p.name = "piede_" + lato; p.data.materials.append(M["gambe"]); bpy.ops.object.shade_smooth(); parent(p, anca)
        sp = bpy.data.objects.new("spalla_" + lato, None); bpy.context.collection.objects.link(sp); sp.location = (sx * W_body * .9, 0, H_leg + H_body * .68); parent(sp, root)
        La = H_body * .5
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=.022, depth=La, location=(sx * .04, 0, -La / 2), rotation=(0, sx * .18, 0)); a = bpy.context.active_object; a.name = "braccio_" + lato; a.data.materials.append(mat("braccio", INK)); parent(a, sp)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6, radius=.04, location=(sx * .09, 0, -La)); m_ = bpy.context.active_object; m_.name = "mano_" + lato; m_.data.materials.append(M["pelle"]); parent(m_, sp)
    # esporta
    bpy.ops.object.select_all(action="SELECT")
    f = os.path.join(HERE, nome + ".glb")
    bpy.ops.export_scene.gltf(filepath=f, export_format="GLB", export_yup=True, use_selection=True)
    return dict(file=nome + ".glb", altezza=round(hz + R_head, 2), occhiali=("occhiali" in c["acc"]), occhiali_sole=("occhiali_sole" in c["acc"]), corpo=c["corpo"], capelli=tipo, accessori=c["acc"], viso=True)

cat_f = os.path.join(HERE, "catalogo.json"); cat = json.load(open(cat_f)) if os.path.exists(cat_f) else {}
for n in NOMI:
    cat[n] = crea(n, CAST[n]); print("PERSONAGGIO", n, cat[n]["altezza"], "m", os.path.getsize(os.path.join(HERE, n + ".glb")) // 1000, "KB")
json.dump(cat, open(cat_f, "w"), indent=1, ensure_ascii=False)
viso.scrivi_preset(HERE)
