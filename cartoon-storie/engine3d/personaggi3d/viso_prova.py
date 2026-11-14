"""Foglio di prova delle espressioni (solo Blender, senza motore).
Blender -b --python viso_prova.py -- <out.png> [occhiali|sole]
Disegna una testa per ogni shape key, in griglia, con camera ortografica frontale."""
import bpy, sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import viso
a = sys.argv[sys.argv.index("--") + 1:]; out = a[0]; flag = a[1] if len(a) > 1 else ""
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
R = .38; D = (R * 1.02, R * .94, R * 1.0, R)
bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=32, radius=1, location=(0, 0, 0)); h = bpy.context.active_object
h.scale = (D[0], D[1], D[2]); bpy.ops.object.transform_apply(scale=True); bpy.ops.object.shade_smooth()
pm = bpy.data.materials.new("pelle"); pm.diffuse_color = (.97, .94, .9, 1); h.data.materials.append(pm)
fo = viso.crea_viso((0, 0, 0), (0, 0, 0), D, occhiali=(flag == "occhiali"), sole=(flag == "sole"))
nomi = [k.name for k in fo[0].data.shape_keys.key_blocks][1:]
nomi = ["Basis"] + nomi
cols = 6
if len(a) > 2: nomi = [n for n in nomi if n in a[2].split(",")]; cols = min(cols, len(nomi))   # terzo argomento: solo queste chiavi (es. Basis,e_felice)
rows = math.ceil(len(nomi) / cols); pas = 1.0
for i, n in enumerate(nomi):
    x, z = (i % cols) * pas, -(i // cols) * pas
    for src in [h] + fo:
        c = src.copy(); c.data = src.data.copy(); bpy.context.collection.objects.link(c); c.location = (x, 0, z)
        if c.data.shape_keys and n != "Basis": c.data.shape_keys.key_blocks[n].value = 1.0
sc = bpy.context.scene
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); bpy.context.collection.objects.link(cam); sc.camera = cam
cam.data.type = "ORTHO"; cam.data.ortho_scale = cols * pas + .1
cam.location = ((cols - 1) * pas / 2, -5, -(rows - 1) * pas / 2); cam.rotation_euler = (math.pi / 2, 0, 0)
sc.render.engine = "BLENDER_WORKBENCH"; sh = sc.display.shading; sh.light = "FLAT"; sh.color_type = "MATERIAL"; sh.show_object_outline = True
sc.render.resolution_x = 300 * cols; sc.render.resolution_y = int(300 * rows); sc.render.film_transparent = False
sc.world = bpy.data.worlds.new("w"); sc.world.color = (.35, .45, .6)
sc.render.filepath = out; bpy.ops.render.render(write_still=True)
print("NOMI", nomi)
