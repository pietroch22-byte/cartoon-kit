"""Converte i .blend di una cartella (es. animali animati di Quaternius, che nei .blend hanno i colori giusti) in GLB con le animazioni.
Blender -b --python kit/tools/blend_in_glb.py -- <cartella_blend> <cartella_glb>"""
import bpy, sys, os, glob
a = sys.argv[sys.argv.index("--") + 1:]; src, dst = a[0], a[1]; os.makedirs(dst, exist_ok=True)
for f in sorted(glob.glob(os.path.join(src, "**", "*.blend"), recursive=True)):
    bpy.ops.wm.open_mainfile(filepath=f)
    kd = {}   # colori dal .mtl gemello (Kd), quando il .blend non li ha
    for mt in glob.glob(os.path.join(src, "**", os.path.splitext(os.path.basename(f))[0] + ".mtl"), recursive=True):
        nome = None
        for r in open(mt, errors="ignore"):
            w = r.split()
            if w[:1] == ["newmtl"]: nome = w[1]
            elif w[:1] == ["Kd"] and nome: kd[nome] = tuple(float(x) for x in w[1:4]) + (1.0,)
    for m in bpy.data.materials:
        if m.name in kd: m.diffuse_color = kd[m.name]
    for m in bpy.data.materials:   # i vecchi .blend tengono il colore in diffuse_color: lo portiamo nel nodo che il GLB esporta
        c = tuple(m.diffuse_color); m.use_nodes = True; b = [n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"]
        if not b: b = [m.node_tree.nodes.new("ShaderNodeBsdfPrincipled")]; o = [n for n in m.node_tree.nodes if n.type == "OUTPUT_MATERIAL"] or [m.node_tree.nodes.new("ShaderNodeOutputMaterial")]; m.node_tree.links.new(b[0].outputs[0], o[0].inputs[0])
        if not b[0].inputs["Base Color"].is_linked: b[0].inputs["Base Color"].default_value = c
        print("MAT", m.name, [round(x, 2) for x in c])
    out = os.path.join(dst, os.path.splitext(os.path.basename(f))[0] + ".glb")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_animations=True, export_yup=True)
    print("GLB", os.path.basename(out), len(bpy.data.actions))
