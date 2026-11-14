"""ARCHIVIO DEI MECCANISMI VIVI: oggetti con parti mobili già nominate e comportamento dichiarato. Si rigenera con:
    Blender -b --python library/vivi/genera_vivi.py [-- nome1 nome2]      ->  <nome>.glb + catalogo.json in questa cartella
Il motore (engine3d/web/vivo.js) anima da solo ciò che trova nel GLB, senza codice per ogni oggetto.

CONVENZIONE (proprietà personalizzate di Blender -> `extras` del GLB -> `userData` in three.js). Gli ASSI sono quelli del motore (y = su, z = verso la camera):
  radice del meccanismo (vuoto):  vivo_modo = sempre | prossimita | ciclo | evento
        prossimita: si apre se un personaggio è entro `vivo_raggio` m; ciclo: si apre ogni `vivo_periodo` s per `vivo_durata` s (`vivo_fase` s di sfasamento)
        evento: lo decide la storia con  {"id": ..., "t": "@parola", "fai": "apri" | "chiudi", "dur": 0.8}
  parte mobile (vuoto con le forme dentro, perno nel punto di rotazione):  vivo_tipo = scorri | cerniera | su | gira | ondeggia
        scorri/su: si sposta di `vivo_corsa` m sull'asse `vivo_asse` quando la radice è aperta (0..1)
        cerniera: ruota di `vivo_angolo` rad attorno a `vivo_asse`
        gira: ruota di continuo, `vivo_vel` rad/s (ventole, lancette); se la radice è «prossimita/ciclo» gira solo da aperta
        ondeggia: oscilla `vivo_ampiezza` rad, `vivo_freq` Hz (testa di un ventilatore da tavolo)
Materiali per nome (il motore li veste col look): metallo, corpo, legno, vetro (trasparente), nero, luce_* (emissivi).
Origine = pavimento, centro dell'oggetto, fronte verso +z del motore (-Y in Blender), ceiling: l'origine è il punto di attacco al soffitto.
"""
import bpy, math, os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
COL = dict(metallo="#b9bfcc", corpo="#d9d6cc", legno="#8a5a3a", vetro="#cfe6ff", nero="#1d1a24", luce_verde="#5dff9a", luce_rossa="#ff4a3a", bianco="#f1ede2", scuro="#3a3550", rosso="#c2282f", pala="#6a5a48")
def hx(c): c = c.lstrip("#"); return tuple(int(c[i:i + 2], 16) / 255 for i in (0, 2, 4))
def lin(c): return tuple((x / 12.92) if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c)
_m = {}
def mat(n):
    if n not in _m:
        m = bpy.data.materials.new(n); m.use_nodes = True
        b = [x for x in m.node_tree.nodes if x.type == "BSDF_PRINCIPLED"][0]; b.inputs["Base Color"].default_value = (*lin(hx(COL[n])), 1); _m[n] = m
    return _m[n]
def vuoto(nome, loc=(0, 0, 0), p=None, **pr):
    o = bpy.data.objects.new(nome, None); bpy.context.collection.objects.link(o); o.parent = p; o.location = loc
    for k, v in pr.items(): o[k] = v
    return o
def _fin(o, nome, m, p, loc, rot):
    o.name = nome; o.data.materials.append(mat(m)); bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); bpy.ops.object.shade_flat(); o.parent = p; o.location = loc; return o
def box(nome, s, loc, m, p=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0), rotation=rot); o = bpy.context.active_object; o.scale = s; return _fin(o, nome, m, p, loc, rot)
def cil(nome, r, h, loc, m, p=None, rot=(0, 0, 0), seg=20):
    bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=r, depth=h, location=(0, 0, 0), rotation=rot); return _fin(bpy.context.active_object, nome, m, p, loc, rot)
def toro(nome, R, r, loc, m, p=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=28, minor_segments=8, location=(0, 0, 0), rotation=rot); return _fin(bpy.context.active_object, nome, m, p, loc, rot)
def pulisci():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for d in (bpy.data.meshes, bpy.data.materials):
        for x in list(d): d.remove(x)
    _m.clear()

# ---------------------------------------------------------------- i meccanismi
def porta_scorrevole(w=2.0, h=2.4):
    """porta automatica a due ante di vetro: si apre quando qualcuno si avvicina. `w` = luce di passaggio; ai lati due vetri fissi."""
    r = vuoto("porta_scorrevole", vivo_modo="prossimita", vivo_raggio=2.0)
    box("architrave", (2 * w + .2, .24, .26), (0, 0, h + .13), "metallo", r); box("sensore", (.18, .05, .06), (0, -.13, h + .13), "luce_verde", r)
    for s in (-1, 1): box("montante", (.1, .24, h), (s * (w + .05), 0, h / 2), "metallo", r)
    for s in (-1, 1):
        box("vetro_fisso", (w / 2 - .06, .02, h - .12), (s * w * .75, .07, h / 2), "vetro", r)
    for s, n in ((-1, "anta_sx"), (1, "anta_dx")):
        a = vuoto(n, (s * w / 4, -.05, 0), r, vivo_tipo="scorri", vivo_asse="x", vivo_corsa=s * (w / 2 - .03) * 1.0)
        W = w / 2 - .02; box("vetro", (W - .1, .02, h - .14), (0, 0, h / 2), "vetro", a)
        for z in (.05, h - .05): box("telaio", (W, .05, .1), (0, 0, z), "metallo", a)
        for x in (-W / 2 + .03, W / 2 - .03): box("telaio", (.06, .05, h), (x, 0, h / 2), "metallo", a)
        box("maniglia", (.03, .04, .5), (-s * (W / 2 - .12), -.05, h * .5), "nero", a)
    return r
def porta_battente(w=.95, h=2.1):
    """porta a un'anta con cerniera a sinistra: si apre verso chi guarda quando qualcuno si avvicina."""
    r = vuoto("porta_battente", vivo_modo="prossimita", vivo_raggio=1.5)
    box("stipite", (.08, .16, h), (-w / 2 - .04, 0, h / 2), "legno", r); box("stipite", (.08, .16, h), (w / 2 + .04, 0, h / 2), "legno", r); box("traversa", (w + .16, .16, .08), (0, 0, h + .04), "legno", r)
    a = vuoto("anta", (-w / 2, 0, 0), r, vivo_tipo="cerniera", vivo_asse="y", vivo_angolo=-1.7)
    box("pannello", (w - .02, .05, h - .02), (w / 2, 0, h / 2), "corpo", a); box("riquadro", (w - .3, .02, h - .5), (w / 2, -.03, h / 2), "legno", a)
    cil("maniglia", .025, .12, (w - .1, -.08, h * .48), "metallo", a, rot=(math.pi / 2, 0, 0)); return r
def porta_doppia(w=1.9, h=2.2):
    """porta a due battenti con vetro (negozio, sala): le ante si aprono verso chi guarda."""
    r = vuoto("porta_doppia", vivo_modo="prossimita", vivo_raggio=1.7)
    box("stipite", (.1, .2, h), (-w / 2 - .05, 0, h / 2), "metallo", r); box("stipite", (.1, .2, h), (w / 2 + .05, 0, h / 2), "metallo", r); box("traversa", (w + .2, .2, .1), (0, 0, h + .05), "metallo", r)
    for s, n in ((-1, "anta_sx"), (1, "anta_dx")):
        a = vuoto(n, (s * w / 2, 0, 0), r, vivo_tipo="cerniera", vivo_asse="y", vivo_angolo=-s * 1.7); W = w / 2 - .02
        box("vetro", (W - .12, .02, h - .3), (-s * W / 2, 0, h / 2 + .05), "vetro", a)
        for z in (.08, h - .08): box("telaio", (W, .05, .16), (-s * W / 2, 0, z), "metallo", a)
        for x in (.04, W - .04): box("telaio", (.08, .05, h), (-s * x, 0, h / 2), "metallo", a)
        box("maniglia", (.03, .05, .45), (-s * (W - .12), -.05, h * .5), "nero", a)
    return r
def ventilatore_soffitto():
    """ventilatore a pale: origine = attacco al soffitto, pende verso il basso. Gira sempre."""
    r = vuoto("ventilatore_soffitto", vivo_modo="sempre")
    cil("calotta", .1, .06, (0, 0, -.03), "metallo", r); cil("stelo", .02, .3, (0, 0, -.2), "metallo", r); cil("motore", .13, .12, (0, 0, -.41), "scuro", r)
    p = vuoto("pale", (0, 0, -.47), r, vivo_tipo="gira", vivo_asse="y", vivo_vel=7.0)
    for i in range(4):
        a = i * math.pi / 2; q = vuoto("pala%d" % i, (0, 0, 0), p); q.rotation_euler = (0, 0, a)
        box("pala", (.62, .13, .012), (.4, 0, 0), "pala", q, rot=(.12, 0, 0)); box("braccio", (.14, .04, .012), (.1, 0, 0), "metallo", q)
    cil("disco", .09, .03, (0, 0, -.49), "metallo", r); return r
def ventilatore_tavolo():
    """ventilatore da tavolo: pale che girano e testa che si gira piano a destra e sinistra."""
    r = vuoto("ventilatore_tavolo", vivo_modo="sempre")
    cil("base", .14, .04, (0, 0, .02), "scuro", r); cil("stelo", .025, .34, (0, 0, .2), "metallo", r)
    t = vuoto("testa", (0, 0, .42), r, vivo_tipo="ondeggia", vivo_asse="y", vivo_ampiezza=.75, vivo_freq=.12)
    cil("motore", .07, .16, (0, .05, 0), "scuro", t, rot=(math.pi / 2, 0, 0)); toro("gabbia", .19, .008, (0, -.1, 0), "metallo", t, rot=(math.pi / 2, 0, 0)); toro("gabbia2", .1, .006, (0, -.1, 0), "metallo", t, rot=(math.pi / 2, 0, 0))
    for i in range(6):
        b = box("raggio", (.012, .006, .38), (0, -.1, 0), "metallo", t); b.rotation_euler = (0, i * math.pi / 6, 0)
    p = vuoto("pale", (0, -.06, 0), t, vivo_tipo="gira", vivo_asse="z", vivo_vel=15.0)
    for i in range(3):
        q = vuoto("pala%d" % i, (0, 0, 0), p); q.rotation_euler = (0, i * 2 * math.pi / 3, 0); box("pala", (.06, .008, .16), (0, 0, .09), "corpo", q, rot=(0, .3, 0))
    return r
def condizionatore(w=.95, h=.7):
    """unità esterna del condizionatore con la ventola che gira. Fronte verso +z."""
    r = vuoto("condizionatore", vivo_modo="sempre")
    box("corpo", (w, .35, h), (0, 0, h / 2), "corpo", r)
    for z in (.03, h - .03): box("piede", (w - .1, .4, .04), (0, 0, z), "metallo", r)
    toro("griglia", .27, .012, (0, -.19, h / 2), "metallo", r, rot=(math.pi / 2, 0, 0)); toro("griglia2", .15, .008, (0, -.19, h / 2), "metallo", r, rot=(math.pi / 2, 0, 0))
    for i in range(6): b = box("sbarra", (.012, .01, .54), (0, -.19, h / 2), "metallo", r); b.rotation_euler = (0, i * math.pi / 6, 0)
    cil("fondo", .26, .02, (0, -.15, h / 2), "nero", r, rot=(math.pi / 2, 0, 0))
    p = vuoto("ventola", (0, -.17, h / 2), r, vivo_tipo="gira", vivo_asse="z", vivo_vel=11.0)
    for i in range(4):
        q = vuoto("pala%d" % i, (0, 0, 0), p); q.rotation_euler = (0, i * math.pi / 2, 0); box("pala", (.11, .01, .22), (0, 0, .12), "scuro", q, rot=(0, .35, 0))
    cil("mozzo", .04, .03, (0, -.17, h / 2), "metallo", r, rot=(math.pi / 2, 0, 0)); return r
def saracinesca(w=2.4, h=2.3):
    """saracinesca di negozio: si alza e si abbassa a ciclo (di default aperta 6 s ogni 16)."""
    r = vuoto("saracinesca", vivo_modo="ciclo", vivo_periodo=16.0, vivo_durata=7.0, vivo_fase=6.0)
    box("cassonetto", (w + .2, .3, .3), (0, 0, h + .15), "scuro", r)
    for s in (-1, 1): box("guida", (.08, .16, h), (s * (w / 2 + .04), 0, h / 2), "metallo", r)
    t = vuoto("tenda", (0, 0, 0), r, vivo_tipo="su", vivo_asse="y", vivo_corsa=h * .92)
    n = int(h / .07)
    for i in range(n): box("lamella", (w, .03, .062), (0, 0, i * .07 + .035), "metallo" if i % 2 else "corpo", t)
    box("maniglia", (.3, .04, .04), (0, -.04, .25), "nero", t); return r
def orologio(R=.22):
    """orologio da parete tondo con lancette che girano (veloci, in stile cartone: la lancetta lunga fa un giro in ~12 s)."""
    r = vuoto("orologio", vivo_modo="sempre")
    cil("cassa", R, .05, (0, 0, 0), "scuro", r, rot=(math.pi / 2, 0, 0)); cil("quadrante", R * .88, .02, (0, -.03, 0), "bianco", r, rot=(math.pi / 2, 0, 0))
    for i in range(12): a = i * math.pi / 6; box("tacca", (.012, .006, .035), (math.sin(a) * R * .74, -.045, math.cos(a) * R * .74), "nero", r, rot=(0, -a, 0))
    for n, L, v in (("lancetta_min", R * .75, -.5), ("lancetta_ore", R * .5, -.04)):
        p = vuoto(n, (0, -.05, 0), r, vivo_tipo="gira", vivo_asse="z", vivo_vel=v); box("lancia", (.014, .008, L), (0, 0, L / 2), "nero", p)
    cil("perno", .018, .02, (0, -.06, 0), "rosso", r, rot=(math.pi / 2, 0, 0)); return r

MECC = {  # nome: (funzione, tag, descrizione breve, dimensioni)
    "porta_scorrevole": (porta_scorrevole, ["porta", "scorrevole", "automatica", "negozio", "ingresso"], "porta automatica a vetri, si apre all'avvicinarsi", "luce 2,0 m, h 2,4 m (larga 4 m coi vetri fissi)"),
    "porta_battente": (porta_battente, ["porta", "casa", "stanza"], "porta a un'anta con cerniera", "0,95 x 2,1 m"),
    "porta_doppia": (porta_doppia, ["porta", "doppia", "vetri", "negozio", "sala"], "porta a due battenti con vetro", "1,9 x 2,2 m"),
    "ventilatore_soffitto": (ventilatore_soffitto, ["ventilatore", "soffitto", "pale"], "ventilatore a pale, origine al soffitto", "pale ø 1,0 m, pende 0,5 m"),
    "ventilatore_tavolo": (ventilatore_tavolo, ["ventilatore", "tavolo"], "ventilatore da tavolo con testa che oscilla", "h 0,6 m"),
    "condizionatore": (condizionatore, ["condizionatore", "ventola", "parete", "esterno"], "unità esterna con ventola che gira", "0,95 x 0,7 m"),
    "saracinesca": (saracinesca, ["saracinesca", "negozio", "vetrina"], "saracinesca che si alza e si abbassa a ciclo", "2,4 x 2,3 m"),
    "orologio": (orologio, ["orologio", "parete"], "orologio da parete con lancette", "ø 0,44 m"),
}
if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []; cf = os.path.join(HERE, "catalogo.json")
    cat = json.load(open(cf)) if os.path.exists(cf) else {}
    for n in (args or MECC):
        pulisci(); f, tag, d, dim = MECC[n]; f(); bpy.ops.object.select_all(action="SELECT")
        bpy.ops.export_scene.gltf(filepath=os.path.join(HERE, n + ".glb"), export_format="GLB", export_yup=True, export_extras=True, use_selection=True)
        cat[n] = dict(file=n + ".glb", tag=tag, descrizione=d, dimensioni=dim); print("VIVO", n, os.path.getsize(os.path.join(HERE, n + ".glb")) // 1000, "KB")
    json.dump(cat, open(cf, "w"), indent=1, ensure_ascii=False)
