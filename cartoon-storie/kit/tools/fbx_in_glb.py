"""Converte una cartella di FBX (es. animali animati di Quaternius) in GLB con le animazioni.
Blender -b --python kit/tools/fbx_in_glb.py -- <cartella_fbx> <cartella_glb>"""
import bpy, sys, os, glob
a = sys.argv[sys.argv.index("--") + 1:]; src, dst = a[0], a[1]; os.makedirs(dst, exist_ok=True)
for f in sorted(glob.glob(os.path.join(src, "**", "*.fbx"), recursive=True)):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=f)
    out = os.path.join(dst, os.path.splitext(os.path.basename(f))[0] + ".glb")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_animations=True, export_yup=True)
    print("GLB", out, len(bpy.data.actions), "animazioni")
