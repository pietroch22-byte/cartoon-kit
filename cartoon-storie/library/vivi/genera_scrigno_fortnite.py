"""Genera l'asset riutilizzabile Fortnite Pirate Treasure Chest:
    /Applications/Blender.app/Contents/MacOS/Blender -b --python library/vivi/genera_scrigno_fortnite.py
Produce `library/vivi/scrigno_fortnite.glb` compatibile con `engine3d/web/vivi.js` e `vivo.js`:
- Origine al pavimento (y=0), centrato su X/Z, fronte verso +Z del motore (-Y in Blender).
- Larghezza normalizzata 1.0 m (~0.96 m profondita, ~0.835 m altezza), decimato a ~25k triangoli.
- Materiali nominati per lookup colore da `vivo(M, 'scrigno_fortnite', { colori: ... })`:
    legno, oro, ferro, gemma, interno.
- Coperchio articolato attorno alla cerniera posteriore (`coperchio`: vivo_tipo='cerniera', vivo_asse='x', vivo_angolo=-1.06).
"""
import math
import os
import sys
import bpy
import bmesh

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_STL = '/Users/pietromascia/Downloads/fortnite-pirate-treasure-chest.stl'
SRC_STL = sys.argv[sys.argv.index('--stl') + 1] if '--stl' in sys.argv else DEFAULT_STL
OUT_GLB = os.path.join(HERE, 'scrigno_fortnite.glb')
Z_SPLIT = 0.374

COL = dict(
    legno=(0.24, 0.11, 0.045, 1.0),
    oro=(0.92, 0.65, 0.15, 1.0),
    ferro=(0.26, 0.24, 0.28, 1.0),
    gemma=(1.00, 0.76, 0.12, 1.0),
    interno=(0.045, 0.038, 0.052, 1.0),
)


def clear_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for col in (bpy.data.meshes, bpy.data.materials):
        for item in list(col):
            col.remove(item)


def make_mat(name, rgba, metal=0.0, rough=0.65, emit=(0.0, 0.0, 0.0), emit_str=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = [n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'][0]
    b.inputs['Base Color'].default_value = rgba
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    if 'Emission Color' in b.inputs:
        b.inputs['Emission Color'].default_value = (*emit, 1.0)
        b.inputs['Emission Strength'].default_value = emit_str
    return m


def slice_part(src_obj, keep_upper, name):
    copy = src_obj.copy()
    copy.data = src_obj.data.copy()
    copy.name = name
    bpy.context.collection.objects.link(copy)
    bm = bmesh.new()
    bm.from_mesh(copy.data)
    res = bmesh.ops.bisect_plane(
        bm,
        geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
        plane_co=(0.0, 0.0, Z_SPLIT),
        plane_no=(0.0, 0.0, 1.0 if keep_upper else -1.0),
        clear_inner=True,
        clear_outer=False,
    )
    cut_edges = [g for g in res['geom_cut'] if isinstance(g, bmesh.types.BMEdge)]
    cap = bmesh.ops.holes_fill(bm, edges=cut_edges, sides=0) if cut_edges else {'faces': []}
    cap_faces = [f for f in cap.get('faces', []) if f.is_valid]
    bm.normal_update()
    if cap_faces:
        try:
            bmesh.ops.triangulate(bm, faces=cap_faces)
        except Exception:
            pass
    bm.to_mesh(copy.data)
    bm.free()
    copy.data.update()
    return copy


def classify_faces(obj, is_lid, mats):
    for m in mats:
        obj.data.materials.append(m)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.faces.ensure_lookup_table()
    for f in bm.faces:
        c = f.calc_center_median()
        ax, ay, z = abs(c.x), abs(c.y), c.z
        # 1. Superficie di taglio: bordo oro esterno + cavita' interna scura
        if abs(z - Z_SPLIT) < 0.008 and abs(f.normal.z) > 0.90:
            f.material_index = 4 if (ax < 0.345 and ay < 0.355) else 1
            continue

        # 2. Gemme sfaccettate (raggi calibrati per lasciare intatti i castoni oro)
        if is_lid:
            if z > 0.790 and (ax + ay) < 0.21:
                f.material_index = 3
                continue
            if math.hypot(ax - 0.302, math.hypot(ay - 0.302, z - 0.708)) < 0.056:
                f.material_index = 3
                continue
            if c.y < -0.415 and math.hypot(ax - 0.088, z - 0.482) < 0.055:
                f.material_index = 3
                continue
        else:
            if ay > 0.395 and math.hypot(ax - 0.270, z - 0.122) < 0.048:
                f.material_index = 3
                continue

        # 3. Catene a contrasto in ferro/brunito sulla fascia bassa e fianchi
        if not is_lid and z < 0.295:
            if ay > 0.422 and ax > 0.090 and z > 0.072:
                f.material_index = 2
                continue
            if ax > 0.395 and z > 0.068:
                f.material_index = 2
                continue

        # 4. Doghe di legno incassate vs fasce/teschio/borchie d'oro in rilievo
        if is_lid:
            if ax > 0.375 and math.hypot(c.y, z - Z_SPLIT) < 0.365 and ax < 0.406 and z > 0.395:
                f.material_index = 0
                continue
            if ax < 0.29 and c.y > -0.385 and math.hypot(c.y, z - 0.40) < 0.405:
                f.material_index = 0
                continue
            f.material_index = 1
        else:
            if 0.078 < z < 0.302:
                if 0.085 < ax < 0.265 and ay < 0.398 and not (c.y < -0.35 and z > 0.175):
                    f.material_index = 0
                    continue
                if ay < 0.255 and ax < 0.376 and not (ay < 0.085 and z > 0.18):
                    f.material_index = 0
                    continue
            f.material_index = 1

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()


def build():
    clear_scene()
    if not os.path.exists(SRC_STL):
        raise FileNotFoundError(f'STL sorgente non trovato: {SRC_STL}')

    bpy.ops.wm.stl_import(filepath=SRC_STL)
    meshes = [x for x in bpy.data.objects if x.type == 'MESH']
    o = meshes[0]
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.mesh.separate(type='LOOSE')
    parts = sorted([x for x in bpy.data.objects if x.type == 'MESH'], key=lambda x: len(x.data.vertices), reverse=True)
    o = parts[0]
    for extra in parts[1:]:
        bpy.data.objects.remove(extra, do_unlink=True)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)

    mesh = o.data
    xs = [v.co.x for v in mesh.vertices]
    ys = [v.co.y for v in mesh.vertices]
    zs = [v.co.z for v in mesh.vertices]
    cx = (min(xs) + max(xs)) * 0.5
    cy = (min(ys) + max(ys)) * 0.5
    z0 = min(zs)
    sc = 1.0 / max(max(xs) - min(xs), max(ys) - min(ys), max(zs) - z0)
    for v in mesh.vertices:
        v.co.x = (v.co.x - cx) * sc
        v.co.y = (v.co.y - cy) * sc
        v.co.z = (v.co.z - z0) * sc
    mesh.update()

    dec = o.modifiers.new('Decimate', 'DECIMATE')
    dec.decimate_type = 'COLLAPSE'
    dec.ratio = 0.0135
    bpy.ops.object.modifier_apply(modifier='Decimate')

    base = slice_part(o, False, 'scrigno_base')
    lid = slice_part(o, True, 'scrigno_coperchio')
    bpy.data.objects.remove(o, do_unlink=True)

    mats = [
        make_mat('legno', COL['legno'], metal=0.0, rough=0.74),
        make_mat('oro', COL['oro'], metal=0.72, rough=0.30),
        make_mat('ferro', COL['ferro'], metal=0.55, rough=0.48),
        make_mat('gemma', COL['gemma'], metal=0.08, rough=0.18, emit=(1.0, 0.72, 0.08), emit_str=0.65),
        make_mat('interno', COL['interno'], metal=0.0, rough=0.92),
    ]
    classify_faces(base, False, mats)
    classify_faces(lid, True, mats)

    # Radice + gerarchia compatibile con `engine3d/web/vivo.js`
    root = bpy.data.objects.new('scrigno_fortnite', None)
    bpy.context.collection.objects.link(root)
    root['vivo_modo'] = 'evento'

    base.parent = root
    pivot = bpy.data.objects.new('coperchio', None)
    bpy.context.collection.objects.link(pivot)
    pivot.parent = root
    pivot.location = (0.0, 0.39, Z_SPLIT)
    pivot['vivo_tipo'] = 'cerniera'
    pivot['vivo_asse'] = 'x'
    pivot['vivo_angolo'] = -1.06

    lid.parent = pivot
    lid.location = (0.0, -0.39, -Z_SPLIT)

    bpy.context.view_layer.update()
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format='GLB',
        export_yup=True,
        export_extras=True,
        export_materials='EXPORT',
    )
    print(f'GLB esportato: {OUT_GLB} ({os.path.getsize(OUT_GLB)} bytes)')


if __name__ == '__main__':
    build()
