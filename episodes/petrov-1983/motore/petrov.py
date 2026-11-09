# Genera kit/stories/petrov_1983.json: luoghi, cast e regia battuta per battuta.
import json, os, runpy
W = os.path.dirname(os.path.abspath(__file__))
S = os.path.dirname(W)
runpy.run_path(f"{W}/places.py")
P = json.load(open(f"{W}/places.json"))
T = True


def glow(r, col, at, g=3.0):
    return {"shape": "sphere", "r": r, "at": at, "glow": g, "color": col}


cloud = lambda at, s=1.0, col="#cfd6e6": {"parts": [{"shape": "sphere", "r": 1.2 * s, "at": [0, 0, 0], "color": col, "rough": 1},
                                                   {"shape": "sphere", "r": 0.9 * s, "at": [1.3 * s, -0.2 * s, 0.2], "color": col, "rough": 1},
                                                   {"shape": "sphere", "r": 0.8 * s, "at": [-1.2 * s, -0.25 * s, -0.1], "color": col, "rough": 1}], "at": at}


def plane(id, at, col="#e8e8ec", s=1.0, hidden=False):  # aereo di linea da forme semplici
    k = s
    return {"id": id, "parts": [
        {"shape": "cyl", "r": 0.35 * k, "h": 5.0 * k, "rot": [0, 0, 90], "at": [0, 0, 0], "color": col, "metal": 0.3},
        {"shape": "sphere", "r": 0.35 * k, "at": [2.5 * k, 0, 0], "color": col, "scale": [1.4, 1, 1]},
        {"shape": "cone", "r": 0.35 * k, "h": 0.9 * k, "rot": [0, 0, 90], "at": [-2.95 * k, 0.05 * k, 0], "color": col},
        {"shape": "box", "size": [1.2 * k, 0.06 * k, 5.2 * k], "at": [0.2 * k, -0.1 * k, 0], "color": col, "metal": 0.3},
        {"shape": "box", "size": [0.6 * k, 0.9 * k, 0.06 * k], "at": [-2.9 * k, 0.55 * k, 0], "color": "#2a5aa8"},
        {"shape": "box", "size": [0.5 * k, 0.05 * k, 1.8 * k], "at": [-2.9 * k, 0.1 * k, 0], "color": col},
        {"shape": "box", "size": [4.2 * k, 0.12 * k, 0.02 * k], "at": [0.2 * k, 0.1 * k, 0.355 * k], "color": "#ffe9a8", "glow": 1.6},
        glow(0.08 * k, "#ff3030", [0.2 * k, -0.1 * k, 2.6 * k]), glow(0.08 * k, "#30ff60", [0.2 * k, -0.1 * k, -2.6 * k])], "at": at, "hidden": hidden}


def jet(id, at):
    return {"id": id, "parts": [
        {"shape": "cyl", "r": 0.16, "h": 2.6, "rot": [0, 0, 90], "at": [0, 0, 0], "color": "#7d8790", "metal": 0.5},
        {"shape": "cone", "r": 0.16, "h": 0.7, "rot": [0, 0, -90], "at": [1.65, 0, 0], "color": "#7d8790"},
        {"shape": "box", "size": [1.0, 0.04, 1.9], "at": [-0.3, 0, 0], "color": "#6a747c"},
        {"shape": "box", "size": [0.5, 0.6, 0.04], "at": [-1.1, 0.3, 0], "color": "#6a747c"},
        glow(0.12, "#ffae40", [-1.35, 0, 0], 4.0), glow(0.06, "#ff3030", [-0.3, 0, 0.95])], "at": at, "hidden": True}


def satellite(id, at, s=1.0, hidden=False):
    return {"id": id, "parts": [
        {"shape": "cyl", "r": 0.35 * s, "h": 1.2 * s, "at": [0, 0, 0], "color": "#c9a24a", "metal": 0.8, "rough": 0.3},
        {"shape": "cone", "r": 0.25 * s, "h": 0.5 * s, "rot": [180, 0, 0], "at": [0, -0.85 * s, 0], "color": "#8a8a90", "metal": 0.8},
        {"shape": "box", "size": [1.9 * s, 0.6 * s, 0.03 * s], "at": [-1.3 * s, 0.1 * s, 0], "color": "#1e3a8a", "metal": 0.4, "rough": 0.25},
        {"shape": "box", "size": [1.9 * s, 0.6 * s, 0.03 * s], "at": [1.3 * s, 0.1 * s, 0], "color": "#1e3a8a", "metal": 0.4, "rough": 0.25},
        {"shape": "cyl", "r": 0.03 * s, "h": 0.8 * s, "rot": [0, 0, 90], "at": [0, 0.1 * s, 0], "color": "#aaaaaa", "metal": 1},
        glow(0.06 * s, "#ff4040", [0, 0.65 * s, 0])], "at": at, "hidden": hidden}


# ---------- luoghi ----------
places = {"bunker": P["bunker"]}
places["mare"] = {"type": "outdoor", "light": "notte", "floor": {"color": "#071325"},
                  "models": [cloud([-6, 5.5, -10], 1.6), cloud([5, 7.0, -14], 2.0), cloud([0, 4.0, -6], 1.0, "#aab4c8"), cloud([9, 4.5, -8], 1.3),
                             plane("aereo", [-3, 6, -6]), jet("caccia", [3.5, 6.8, -5.0]),
                             {"id": "aereo_luci", "parts": [glow(0.25, "#ffe9a8", [0, 0, 0], 2.5)], "at": [-3, 6, -6], "hidden": True}],
                  "boards": [{"id": "data_kal", "text": "1 SETTEMBRE\n1983", "at": [0, 2.0, -4], "w": 2.4, "h": 1.2, "bg": "#0b0b12", "ink": "#f2f2f2", "border": "#f2f2f2", "frame": "#111"},
                             {"id": "vittime", "text": "269\nPERSONE A BORDO", "at": [0, 2.0, -3.9], "w": 2.4, "h": 1.2, "bg": "#0b0b12", "ink": "#ff5a4a", "border": "#ff5a4a", "frame": "#111", "hidden": True}]}
places["cremlino"] = {"type": "room", "w": 8, "d": 7, "h": 3.6, "light": "interno_notte",
  "floor": {"tex": "wood_floor", "tint": "#c89a7a", "rep": 4}, "wall": {"tex": "painted_plaster_wall", "tint": "#c9b48a", "rep": [3, 1.2]},
  "lamps": [{"at": [0, 3.0, 0], "intensity": 2.5, "color": "#ffc98a"}, {"at": [0.9, 1.3, -0.3], "intensity": 2.0, "range": 4, "color": "#ffd9a0", "bulb": False}],
  "boards": [{"id": "giornale", "text": "WASHINGTON\nACCUSA\nMOSCA", "at": [-2.4, 1.6, -3.45], "w": 1.0, "h": 1.2, "bg": "#efe8d6", "ink": "#1a1a1a", "border": "#1a1a1a", "frame": "#6a4022"},
             {"id": "pravda", "text": "MOSCA:\n«ERA UN\nAEREO SPIA»", "at": [2.4, 1.6, -3.45], "w": 1.0, "h": 1.2, "bg": "#efe8d6", "ink": "#b01e1e", "border": "#b01e1e", "frame": "#6a4022"},
             {"id": "sospetto", "text": "ATTACCO\nA SORPRESA?", "at": [0, 2.3, -3.45], "w": 1.4, "h": 0.8, "bg": "#2a0a0a", "ink": "#ff5a4a", "border": "#ff5a4a", "frame": "#3a2a1a", "hidden": True}],
  "models": [{"m": "WoodenTable_02", "at": [0, 0, -0.4], "size": 0.78, "w": 1.8},
             {"m": "ArmChair_01", "at": [0, 0, -1.4], "size": 1.0},
             {"m": "desk_lamp_arm_01", "at": [0.7, 0.78, -0.55], "size": 0.5, "ry": -30},
             {"m": "Chandelier_01", "at": [0, 2.6, 0], "size": 0.9},
             {"m": "wooden_bookshelf_worn", "at": [-3.4, 0, -2.6], "size": 2.0, "ry": 90},
             {"m": "ClassicConsole_01", "at": [3.3, 0, -2.9], "size": 0.85},
             {"m": "mantel_clock_01", "at": [3.3, 0.85, -2.9], "size": 0.3},
             {"m": "fancy_picture_frame_01", "at": [3.95, 1.6, -0.5], "size": 0.8, "ry": -90},
             {"id": "bandiera", "parts": [{"shape": "box", "size": [0.9, 0.6, 0.02], "at": [0.45, 1.75, 0], "color": "#c8102e"}, {"shape": "cyl", "r": 0.02, "h": 2.1, "at": [0, 1.05, 0], "color": "#c9a24a", "metal": 1},
                                           {"shape": "box", "size": [0.12, 0.12, 0.025], "at": [0.15, 1.92, 0], "color": "#ffd23a", "glow": 0.6}], "at": [-1.8, 0, -3.2]},
             {"id": "fascicolo", "parts": [{"shape": "box", "size": [0.34, 0.03, 0.46], "at": [0, 0.015, 0], "color": "#b5402a"}, {"shape": "box", "size": [0.3, 0.032, 0.1], "at": [0, 0.02, -0.1], "color": "#f2e6c8"}], "at": [-0.25, 0.78, -0.25], "ry": 10},
             {"id": "telefono_k", "parts": [{"shape": "box", "size": [0.22, 0.08, 0.18], "at": [0, 0.04, 0], "color": "#1a1a1a", "rough": 0.3}, {"shape": "cyl", "r": 0.03, "h": 0.24, "rot": [0, 0, 90], "at": [0, 0.11, 0], "color": "#1a1a1a"}], "at": [0.35, 0.78, -0.15]}]}
places["cremlino"]["boards"].append({"id": "ryan", "text": "RYAN", "at": [-0.25, 0.80, -0.25], "w": 0.28, "h": 0.12, "bg": "#f2e6c8", "ink": "#b01e1e", "border": "#b01e1e", "frame": "#b5402a", "rot": [-90, 0, 0]})
places["washington"] = {"type": "outdoor", "light": "notte", "floor": {"tex": "asphalt_02", "tint": "#9a9aa8", "rep": 24},
  "facades": [{"at": [-6, 0, -9], "w": 6, "h": 10, "color": "#cfc6b4"}, {"at": [0.5, 0, -11], "w": 7, "h": 12, "color": "#e6e0d0"},
              {"id": "finestre", "at": [0.5, 0, -10.9], "w": 7, "h": 12, "color": "#e6e0d0", "lit": True, "hidden": True},
              {"at": [7, 0, -9], "w": 6, "h": 9, "color": "#bfb6a6", "lit": True}, {"at": [-9.5, 0, -2], "w": 6, "h": 8, "color": "#c9bfa8", "lit": True, "ry": 90}],
  "lamps": [{"at": [-4.5, 3.6, -3.5], "intensity": 6, "range": 14, "color": "#ffc477"}, {"at": [4.5, 3.6, -3.5], "intensity": 6, "range": 14, "color": "#ffc477"}],
  "boards": [{"id": "ospedale", "text": "OSPEDALE", "at": [7, 3.2, -8.75], "w": 2.2, "h": 0.6, "bg": "#f2f2f2", "ink": "#c8102e", "border": "#c8102e", "frame": "#333"},
             {"id": "guerra", "text": "SI PREPARANO\nALLA GUERRA?", "at": [0, 2.4, -2.5], "w": 1.8, "h": 0.9, "bg": "#2a0a0a", "ink": "#ff5a4a", "border": "#ff5a4a", "frame": "#111", "hidden": True}],
  "models": [{"m": "street_lamp_02", "at": [-4.5, 0, -3.5], "size": 3.8}, {"m": "street_lamp_02", "at": [4.5, 0, -3.5], "size": 3.8},
             {"m": "fire_hydrant", "at": [2.6, 0, -2.6], "size": 0.75}, {"m": "water_manhole_cover", "at": [0, 0.01, -0.5], "w": 0.8},
             {"m": "utility_box_01", "at": [-2.8, 0, -4.0], "size": 1.2},
             {"id": "sangue", "parts": [{"shape": "box", "size": [0.16, 0.26, 0.05], "at": [x * 0.2, 0.13, 0], "color": "#8a0d14", "rough": 0.2} for x in range(-2, 3)]
                                     + [{"shape": "box", "size": [1.1, 0.03, 0.3], "at": [0, 0, 0], "color": "#d8d8d8", "metal": 0.6}], "at": [6.0, 1.0, -5.0], "hidden": True}]}
places["spazio"] = {"type": "room", "w": 30, "d": 30, "h": 24, "light": "tramonto",
  "floor": {"color": "#010205"}, "wall": {"color": "#010205"}, "ceiling": {"color": "#010205"},
  "lamps": [{"at": [12, 14, 6], "intensity": 40, "range": 60, "color": "#fff2d8"}],
  "models": [{"id": "terra", "parts": [{"shape": "sphere", "r": 6, "at": [0, 0, 0], "color": "#1d4f9a", "rough": 0.6},
                                     *[{"shape": "sphere", "r": 1.3 + (k % 3) * 0.4, "at": [(k * 2.3) % 9 - 4.5, 3.2 + (k % 4) * 0.5, 4.2], "color": "#eef2f6", "rough": 1, "scale": [1.6, 0.25, 1]} for k in range(7)],
                                     {"shape": "sphere", "r": 2.2, "at": [-2.5, 2.5, 4.6], "color": "#3a7a3a", "scale": [1.6, 0.5, 0.4]}], "at": [0, 4.5, -8]},
             satellite("satellite", [0, 12.5, -3], 1.0), satellite("satellite2", [4, 13.2, -4], 0.8, hidden=True),
             {"parts": [glow(0.04, "#ffffff", [((k * 3.7) % 28) - 14, 2 + (k * 1.9) % 20, 0], 2.0) for k in range(90)], "at": [0, 0, -14.8]},
             {"id": "raggio", "parts": [{"shape": "cyl", "r": 0.03, "h": 6, "at": [0, 0, 0], "color": "#ffe07a", "glow": 2.0, "rot": [25, 0, 0]}], "at": [0, 9.5, -4.5], "hidden": True}]}
places["pianure"] = {"type": "outdoor", "light": "tramonto", "floor": {"tex": "grass_ground", "tint": "#c8b890", "rep": 30},
  "models": [{"m": "modular_chainlink_fence", "at": [-3, 0, -4], "w": 3}, {"m": "modular_chainlink_fence", "at": [0, 0, -4], "w": 3}, {"m": "modular_chainlink_fence", "at": [3, 0, -4], "w": 3},
             {"m": "modular_electricity_poles", "at": [-7, 0, -9], "size": 7}, {"m": "boulder_01", "at": [5, 0, -2], "size": 0.8},
             *[{"m": "grass_medium_01", "at": [x, 0, z], "size": 0.5} for x, z in [(-2, -1), (1.5, -2), (3.5, 0.5), (-4, 1), (0, 1.5)]],
             {"m": "shrub_01", "at": [-5, 0, -3], "size": 1.0},
             {"id": "silo", "parts": [{"shape": "cyl", "r": 1.3, "h": 0.4, "at": [0, 0.2, 0], "color": "#8a8a84"}, {"shape": "cyl", "r": 1.0, "h": 0.15, "at": [0, 0.47, 0], "color": "#6a6a66", "metal": 0.5}], "at": [0, 0, -7]},
             *[cloud([-8 + 4 * k, 14 + (k % 2), -20 - 2 * (k % 3)], 2.4, "#ffd6b0") for k in range(5)],
             {"id": "riflessi", "parts": [glow(0.5, "#fff1c0", [-8 + 4 * k, 13 + (k % 2), 1.5], 4.5) for k in range(5)], "at": [0, 0, -20], "hidden": True}]}
places["indagine"] = {"type": "room", "w": 7, "d": 6, "h": 3.2, "light": "interno",
  "floor": {"tex": "concrete_floor_painted", "tint": "#b8b4a8", "rep": 4}, "wall": {"tex": "painted_plaster_wall", "tint": "#a8b0a0", "rep": [3, 1.2]},
  "lamps": [{"at": [0, 2.8, 0], "intensity": 2.8, "color": "#f2f0e0"}],
  "boards": [{"id": "lode", "text": "LODE", "at": [-1.6, 2.1, -2.95], "w": 1.1, "h": 0.5, "bg": "#f2ecd8", "ink": "#2a7a3a", "border": "#2a7a3a", "frame": "#555", "hidden": True},
             {"id": "rimprovero", "text": "RIMPROVERO", "at": [1.6, 2.1, -2.95], "w": 1.4, "h": 0.5, "bg": "#f2ecd8", "ink": "#b01e1e", "border": "#b01e1e", "frame": "#555", "hidden": True},
             {"id": "memorie", "text": "MEMORIE\nGEN. VOTINTSEV\n1998", "at": [0, 1.6, -2.95], "w": 1.0, "h": 1.3, "bg": "#3a2a1a", "ink": "#e8d8a8", "border": "#c9a24a", "frame": "#2a1a0a", "hidden": True}],
  "models": [{"m": "metal_office_desk", "at": [0, 0, -0.6], "size": 0.76, "w": 1.6},
             {"m": "SchoolChair_01", "at": [0, 0, -1.4], "size": 0.85}, {"m": "SchoolChair_01", "at": [-0.4, 0, 0.4], "size": 0.85, "ry": 180},
             {"m": "hanging_industrial_lamp", "at": [0, 2.4, -0.6], "size": 0.7}, {"m": "drawer_cabinet", "at": [2.9, 0, -2.4], "size": 1.3, "id": "cassetto"},
             {"m": "vintage_stapler", "at": [0.6, 0.76, -0.55], "w": 0.18}, {"m": "clipboard", "at": [-0.6, 0.76, -0.55], "w": 0.24},
             {"id": "registro_vuoto", "parts": [{"shape": "box", "size": [0.4, 0.03, 0.3], "at": [0, 0.015, 0], "color": "#f4f0e4"}, {"shape": "box", "size": [0.02, 0.035, 0.3], "at": [0, 0.017, 0], "color": "#7a5a3a"}], "at": [0, 0.76, -0.4]},
             {"id": "timbro", "parts": [{"shape": "cyl", "r": 0.05, "h": 0.1, "at": [0, 0.05, 0], "color": "#b01e1e"}, {"shape": "sphere", "r": 0.05, "at": [0, 0.13, 0], "color": "#2a1a1a"}], "at": [0.15, 0.79, -0.35], "hidden": True}]}
places["casa"] = {"type": "room", "w": 7, "d": 6, "h": 2.8, "light": "interno",
  "floor": {"tex": "wood_floor", "tint": "#d8b090", "rep": 4}, "wall": {"tex": "painted_plaster_wall", "tint": "#e8cfa0", "rep": [3, 1.2]},
  "windows": [{"x": 1.6, "y": 1.6, "w": 1.0, "h": 1.0, "view": "sera"}],
  "lamps": [{"at": [-1.2, 1.4, -1.5], "intensity": 2.0, "range": 5, "color": "#ffc98a"}],
  "models": [{"m": "Rockingchair_01", "at": [-0.6, 0, -1.2], "size": 1.05}, {"m": "Sofa_01", "at": [2.2, 0, -2.4], "size": 0.85, "w": 1.9},
             {"m": "side_table_01", "at": [-1.4, 0, -1.4], "size": 0.55}, {"m": "desk_lamp_arm_01", "at": [-1.4, 0.55, -1.5], "size": 0.4},
             {"m": "Television_01", "at": [-2.8, 0, -2.3], "size": 0.6, "ry": 30}, {"m": "hanging_picture_frame_01", "at": [-0.6, 1.7, -2.95], "size": 0.5},
             {"m": "ClassicNightstand_01", "at": [0.6, 0, -2.7], "size": 0.6}, {"m": "mantel_clock_01", "at": [0.6, 0.6, -2.7], "size": 0.25},
             {"id": "lettere", "parts": [{"shape": "box", "size": [0.22, 0.01, 0.15], "at": [(k % 4) * 0.12 - 0.2, 0.01 * k, (k // 4) * 0.1], "rot": [0, k * 23, 0], "color": "#f6f0e0"} for k in range(9)], "at": [-1.4, 0.56, -1.2], "hidden": True},
             {"id": "premio", "parts": [{"shape": "cyl", "r": 0.06, "h": 0.03, "at": [0, 0.015, 0], "color": "#3a2a1a"}, {"shape": "cyl", "r": 0.03, "h": 0.2, "at": [0, 0.13, 0], "color": "#d8b04a", "metal": 1, "rough": 0.2}, {"shape": "sphere", "r": 0.06, "at": [0, 0.26, 0], "color": "#d8b04a", "metal": 1, "rough": 0.2}], "at": [0.75, 0.6, -2.65], "hidden": True},
             {"id": "giornalisti", "parts": [{"shape": "box", "size": [0.14, 0.09, 0.08], "at": [0, 0, 0], "color": "#1a1a1a"}, glow(0.05, "#ffffff", [0, 0.06, 0.05], 5.0)], "at": [1.4, 1.5, 0.6], "hidden": True}]}
places["onu"] = {"type": "room", "w": 14, "d": 10, "h": 5, "light": "interno",
  "floor": {"tex": "marble_tiles", "tint": "#d8d4cc", "rep": 6}, "wall": {"tex": "painted_plaster_wall", "tint": "#b8c8d8", "rep": [4, 1.5]},
  "lamps": [{"at": [0, 4.5, 0], "intensity": 3.5, "color": "#fff0d8"}],
  "boards": [{"id": "insegna_onu", "text": "NAZIONI UNITE\nNEW YORK · 2006", "at": [0, 3.4, -4.95], "w": 3.6, "h": 1.2, "bg": "#1d4f9a", "ink": "#ffffff", "border": "#ffffff", "frame": "#123"}],
  "models": [{"m": "WoodenTable_02", "at": [0, 0, -3.2], "size": 0.9, "w": 2.4, "id": "podio"}, {"m": "projector_screen", "at": [-4.5, 0, -4.6], "size": 2.6},
             *[{"m": "dining_chair_02", "at": [x, 0, z], "size": 0.95, "ry": 180} for x in (-3, -1.8, -0.6, 0.6, 1.8, 3) for z in (1.6, 2.8)]]}
places["bunker"]["boards"].append({"id": "missili5", "text": "MISSILI: 5", "at": [3.6, 2.6, -3.95], "w": 1.1, "h": 0.42, "bg": "#2a0303", "ink": "#ff2a2a", "border": "#ff2a2a", "frame": "#1a1a1a", "hidden": True})

cast = {
    "petrov": {"h": 1.76, "w": 0.44, "skin": "#e8b894", "top": "#5d6a4a", "pants": "#3e4434", "hair": "tuft", "hairC": "#2a1e16", "shoes": "#1a1a1a", "nose": 1.05, "blush": 0.3},
    "petrov_anziano": {"h": 1.72, "w": 0.48, "skin": "#e8b894", "top": "#6a5a4a", "pants": "#3a3a40", "hair": "tuft", "hairC": "#c8c8c8", "shoes": "#2a1a1a", "nose": 1.1, "blush": 0.4, "glasses": True},
    "operatore": {"h": 1.72, "w": 0.42, "skin": "#efc4a0", "top": "#6c7658", "pants": "#3e4434", "hair": "tuft", "hairC": "#7a5a3a", "shoes": "#1a1a1a", "nose": 1, "blush": 0.4},
    "operatore2": {"h": 1.66, "w": 0.44, "skin": "#e2b08a", "top": "#6c7658", "pants": "#3e4434", "hair": "bob", "hairC": "#3a2a1a", "shoes": "#1a1a1a", "nose": 1, "blush": 0.6},
    "kgb": {"h": 1.74, "w": 0.5, "skin": "#efc8a8", "top": "#3a3e48", "pants": "#2a2e38", "hair": "tuft", "hairC": "#9a9aa0", "shoes": "#111", "nose": 1.2, "blush": 0.5, "glasses": True},
    "spia": {"h": 1.78, "w": 0.46, "skin": "#e8bc98", "top": "#7a6a50", "pants": "#3a3a3a", "hair": "tuft", "hairC": "#1a1a1a", "shoes": "#111", "nose": 1.1, "blush": 0.2},
    "generale": {"h": 1.7, "w": 0.52, "skin": "#efc4a4", "top": "#4a5a3a", "pants": "#3a4430", "hair": "tuft", "hairC": "#d0d0d0", "shoes": "#111", "nose": 1.2, "blush": 0.7},
    "diplomatica": {"type": "zia2"}, "diplomatico": {"type": "marco"}, "ospite": {"type": "zia1"},
}

# ---------- regia ----------
pet = lambda pose="hang", face="neutral", **k: {"id": "petrov", "x": 0, "z": 1.3, "pose": pose, "face": face, **k}
op1 = lambda face="neutral", pose="hang", **k: {"id": "operatore", "x": 1.6, "z": -0.45, "pose": pose, "face": face, **k}
op2 = lambda face="neutral", pose="hang", **k: {"id": "operatore2", "x": -1.6, "z": -0.45, "pose": pose, "face": face, **k}
ALARM = [{"id": "allarme1", "at": None, "on": T}, {"id": "allarme2", "at": None, "on": T}]


def alarm(word): return [{"id": "allarme1", "at": word, "on": T}, {"id": "allarme2", "at": word, "on": T}]


def cam(*segs):
    out = []
    for s in segs:
        p, on, at = (s + (None, None))[:3]
        d = {"preset": p}
        if on: d["on"] = on
        if at: d["at"] = at
        out.append(d)
    return out


B = []
def beat(say, place, camera, cast=(), do=(), **k):
    b = {"say": say, "place": place, "camera": camera, "cast": list(cast)}
    if do: b["do"] = list(do)
    b.update(k); B.append(b)

# 0 · apertura
beat("Mezzanotte passata.", "bunker", cam(("dettaglio_oggetto", "orologio")), [pet()], light="interno_notte")
beat("In un bunker vicino a Mosca, una sirena comincia a urlare.", "bunker", cam(("ambiente",), ("ecu", "petrov", "sirena")),
     [pet(change=[{"at": "sirena", "face": "shock"}]), op1(change=[{"at": "urlare", "face": "worried"}]), op2()], alarm("sirena"), mostra={"bunker": "mappa"})
beat("Sulla parete si accende una sola parola, in rosso: LANCIO.", "bunker", cam(("rivela_dal_viso", "petrov"), ("dal_basso_rivela", "lancio", "LANCIO")),
     [pet(face="shock"), op1("worried"), op2("worried")], [{"id": "lancio", "at": "LANCIO", "pop": T}] + alarm("Sulla"), mostra={"parete": "mappa", "parola": "lancio"})
beat("Secondo il computer, un missile nucleare americano è appena partito verso l'Unione Sovietica.", "bunker",
     cam(("dettaglio_oggetto", "monitor"), ("dettaglio_oggetto", "mappa", "missile")),
     [pet(face="shock"), op1("shock"), op2("worried")], [{"id": "missile1", "at": "missile", "pop": T}, {"id": "lancio", "at": "Secondo", "show": T}] + alarm("Secondo"),
     mostra={"computer": "monitor", "missile": "missile1", "unione": "mappa"})
beat("L'uomo seduto davanti a quello schermo ha pochi minuti per capire se è l'inizio della fine del mondo.", "bunker",
     cam(("mezza_figura", "petrov"), ("primo_piano", "petrov", "minuti"), ("ecu", "petrov", "fine")),
     [pet(face="worried", change=[{"at": "fine", "face": "nervous"}])], [{"id": "lancio", "at": "seduto", "show": T}, {"id": "missile1", "at": "seduto", "show": T}] + alarm("seduto"),
     mostra={"uomo": "petrov", "schermo": "monitor", "mondo": "mappa"}, non_mostrare=["minuti: è il tempo, lo dice il viso"])
beat("Per capire perché quella notte faceva così paura, bisogna tornare indietro di tre settimane.", "bunker",
     cam(("vertigine", "petrov"), ("dettaglio_oggetto", "orologio", "tornare")),
     [pet(face="nervous")], [{"id": "lancio", "at": "Per", "show": T}, {"id": "orologio", "at": "tornare", "spin": -3, "dur": 2.0}] + alarm("Per"), non_mostrare=["notte: siamo nel bunker di notte"])
# 1 · tre settimane prima
beat("Primo settembre 1983.", "mare", cam(("dettaglio_oggetto", "data_kal")), [], [{"id": "data_kal", "at": "Primo", "pop": T}], mostra={"settembre": "data_kal"})
beat("Un aereo di linea coreano, partito da New York, finisce fuori rotta sopra il territorio sovietico.", "mare",
     cam(("tilt_cielo", "aereo"), ("dettaglio_oggetto", "aereo", "rotta")),
     [], [{"id": "data_kal", "at": "Un", "hide": T}, {"id": "aereo", "at": "aereo", "move": [3, 6.3, -7], "dur": 6.5}],
     mostra={"aereo": "aereo", "territorio": "aereo"}, non_mostrare=["new york: è solo il punto di partenza"])
beat("È notte. Un caccia sovietico lo raggiunge.", "mare", cam(("campo_lungo_alto", "aereo"), ("dettaglio_oggetto", "caccia", "caccia")),
     [], [{"id": "data_kal", "at": "notte", "hide": T}, {"id": "caccia", "at": "caccia", "show": T, "from": [9, 7.5, -4], "dur": 1.5}, {"id": "aereo", "at": "notte", "move": [3.6, 6.3, -7.2], "dur": 4}],
     mostra={"caccia": "caccia", "notte": "aereo"})
beat("E lo abbatte.", "mare", cam(("campo_lungo_alto", "aereo")),
     [], [{"id": "data_kal", "at": "abbatte", "hide": T}, {"id": "caccia", "at": "E", "show": T, "move": [8, 8.5, -6], "dur": 1.5}, {"id": "aereo", "at": "abbatte", "hide": T}, {"id": "aereo_luci", "at": "abbatte", "pop": T, "move": [3.6, 2.0, -7.2], "dur": 2.5}],
     non_mostrare=["abbatte: niente violenza, l'aereo sparisce nel buio"])
beat("Muoiono tutte le duecentosessantanove persone a bordo.", "mare", cam(("dettaglio_oggetto", "vittime")),
     [], [{"id": "vittime", "at": "Muoiono", "show": T}, {"id": "aereo", "at": "Muoiono", "hide": T}], mostra={"persone": "vittime"}, non_mostrare=["bordo: le vittime non si mostrano"])
beat("Il mondo è sotto shock. Washington accusa Mosca.", "cremlino", cam(("ambiente",), ("dettaglio_oggetto", "giornale", "Washington")),
     [{"id": "kgb", "x": 0, "z": -1.0, "pose": "hang", "face": "shock"}], mostra={"mondo": "giornale", "mosca": "giornale"})
beat("Mosca risponde che quello era un aereo spia.", "cremlino", cam(("dettaglio_oggetto", "pravda"), ("primo_piano", "kgb", "spia")),
     [{"id": "kgb", "x": 0, "z": -1.0, "pose": "point", "face": "determined"}], mostra={"mosca": "pravda", "aereo": "pravda", "spia": "pravda"})
beat("E al Cremlino cresce un sospetto: gli americani stanno preparando un attacco a sorpresa.", "cremlino",
     cam(("mezza_figura", "kgb"), ("dettaglio_oggetto", "sospetto", "attacco")),
     [{"id": "kgb", "x": 0, "z": -1.0, "pose": "hang", "face": "sly", "change": [{"at": "attacco", "face": "worried"}]}], [{"id": "sospetto", "at": "attacco", "pop": T}],
     mostra={"cremlino": "bandiera", "sospetto": "sospetto", "americani": "sospetto"})
beat("Da due anni il KGB porta avanti un'operazione segreta per scoprirlo in anticipo.", "cremlino", cam(("tre_quarti", "kgb"), ("dall_alto_oggetto", "fascicolo", "segreta")),
     [{"id": "kgb", "x": 0, "z": -1.0, "pose": "point", "face": "sly"}], [{"id": "sospetto", "at": "Da", "show": T}], mostra={"kgb": "kgb", "operazione": "fascicolo"}, non_mostrare=["anni: è una durata", "porta"])
beat("Si chiama RYAN.", "cremlino", cam(("dettaglio_oggetto", "ryan")), [{"id": "kgb", "x": 0, "z": -1.0, "pose": "hang", "face": "sly"}], [{"id": "ryan", "at": "RYAN", "pop": T}], mostra={"ryan": "ryan"})
beat("Le spie sovietiche all'estero devono osservare segnali strani:", "washington", cam(("ambiente",), ("mezza_figura", "spia", "osservare")),
     [{"id": "spia", "x": -1.0, "z": -1.5, "pose": "hip", "face": "sly", "change": [{"at": "osservare", "pose": "point", "face": "determined"}]}], mostra={"spie": "spia", "segnali": "finestre"})
beat("le finestre accese di notte negli uffici del governo,", "washington", cam(("dal_basso_rivela", "finestre")),
     [{"id": "spia", "x": -1.0, "z": -1.5, "pose": "point", "face": "determined"}], [{"id": "finestre", "at": "accese", "show": T}], mostra={"finestre": "finestre", "uffici": "finestre", "governo": "finestre"})
beat("le scorte di sangue negli ospedali.", "washington", cam(("dettaglio_oggetto", "sangue")),
     [{"id": "spia", "x": -1.0, "z": -1.5, "pose": "point", "face": "sly"}], [{"id": "finestre", "at": "le", "show": T}, {"id": "sangue", "at": "sangue", "pop": T}], mostra={"scorte": "sangue", "sangue": "sangue", "ospedali": "ospedale"})
beat("Ogni luce accesa a Washington può voler dire una cosa sola: si preparano alla guerra.", "washington",
     cam(("campo_lungo_alto", "finestre"), ("primo_piano", "spia", "guerra")),
     [{"id": "spia", "x": -1.0, "z": -1.5, "pose": "hang", "face": "worried", "change": [{"at": "guerra", "face": "shock"}]}], [{"id": "finestre", "at": "Ogni", "show": T}, {"id": "guerra", "at": "guerra", "pop": T}],
     mostra={"luce": "finestre", "washington": "finestre", "guerra": "guerra"})
beat("Quell'autunno, da una parte e dall'altra, migliaia di testate nucleari sono pronte.", "bunker", cam(("dettaglio_oggetto", "mappa"), ("ambiente", None, "migliaia")),
     [op1(), op2()], [{"id": "centinaia", "at": "migliaia", "pop": T}, {"id": "centinaia", "at": "pronte", "hide": T}], light="interno",
     mostra={"testate": "centinaia"}, non_mostrare=["autunno: è un tempo"])
beat("Basta un errore.", "bunker", cam(("dettaglio_oggetto", "lancio")), [], [{"id": "lancio", "at": "Basta", "pop": T}, {"id": "lancio", "at": "errore", "shake": 0.05}], light="interno_notte", mostra={"errore": "lancio"})
# 2 · l'uomo e la macchina
beat("Stanislav Petrov ha quarantaquattro anni.", "bunker", cam(("rivela_dal_viso", "petrov")), [{"id": "petrov", "x": -2.5, "z": 1.8, "pose": "hang", "face": "neutral", "enter": "Stanislav", "move": {"at": "Petrov", "to": [0, 1.3], "dur": 2.5}}], light="interno", non_mostrare=["anni: è l'età"])
beat("È nato a Vladivostok.", "bunker", cam(("primo_piano", "petrov")), [pet("hip", "smile")], light="interno", non_mostrare=["vladivostok: è un luogo citato"])
beat("È tenente colonnello della difesa aerea, ma prima di tutto è un ingegnere.", "bunker", cam(("mezza_figura", "petrov"), ("dettaglio_oggetto", "monitor", "ingegnere")),
     [pet("hip", "determined", change=[{"at": "ingegnere", "pose": "point", "face": "smile"}])], light="interno", mostra={"colonnello": "petrov", "ingegnere": "petrov", "difesa": "petrov"}, non_mostrare=["aerea", "aereo"])
beat("Lavora a Serpukhov-15, il centro che riceve i dati di Oko:", "bunker", cam(("ambiente",), ("dettaglio_oggetto", "mappa", "Oko")),
     [pet(), op1(), op2()], light="interno", mostra={"centro": "mappa", "dati": "mappa", "oko": "mappa"})
beat("una rete di satelliti che guarda le basi missilistiche americane, giorno e notte.", "spazio", cam(("gru_rivela", "satellite"), ("dall_alto_oggetto", "terra", "basi")),
     [], [{"id": "satellite", "at": "satelliti", "spin": 0.3, "dur": 4}], mostra={"rete": "satellite", "satelliti": "satellite", "basi": "terra"}, non_mostrare=["giorno: è una durata"])
beat("Il loro compito è vedere il fuoco dei motori di un missile appena partito.", "spazio", cam(("dettaglio_oggetto", "satellite"), ("dall_alto_oggetto", "terra", "fuoco")),
     [], [{"id": "raggio", "at": "vedere", "show": T}, {"id": "raggio", "at": "missile", "hide": T}], mostra={"fuoco": "raggio", "motori": "raggio", "missile": "raggio"}, non_mostrare=["compito: concetto"])
beat("Così Mosca avrebbe qualche minuto in più per reagire.", "bunker", cam(("dettaglio_oggetto", "orologio"), ("mezza_figura", "petrov", "reagire")), [pet()], light="interno", mostra={"mosca": "mappa"}, non_mostrare=["minuto: tempo"])
beat("Petrov conosce bene quel sistema. Sa che è nuovo.", "bunker", cam(("passaggio", "petrov"),), [pet("point", "smile")], light="interno", mostra={"sistema": "monitor"})
B[-1]["camera"] = [{"preset": "passaggio", "on": "petrov", "verso": "monitor", "parola": "nuovo"}]
beat("E sa che non è perfetto.", "bunker", cam(("primo_piano", "petrov")), [pet("hang", "sly")], light="interno")
beat("La notte tra il 25 e il 26 settembre è lui l'ufficiale di turno.", "bunker", cam(("dettaglio_oggetto", "data"), ("mezza_figura", "petrov", "lui")),
     [pet("hang", "neutral"), op1(), op2()], light="interno_notte", mostra={"notte": "data", "settembre": "data", "ufficiale": "petrov"}, non_mostrare=["turno: è il suo ruolo"])
# 3 · i minuti
beat("Poco dopo mezzanotte, la sirena.", "bunker", cam(("dettaglio_oggetto", "orologio"), ("ecu", "petrov", "sirena")),
     [pet(change=[{"at": "sirena", "face": "shock"}]), op1(), op2()], alarm("sirena"), mostra={"mezzanotte": "orologio"})
beat("Sullo schermo: un missile partito da una base negli Stati Uniti.", "bunker", cam(("dettaglio_oggetto", "mappa"), ("dal_basso_rivela", "lancio", "partito")),
     [pet(face="shock"), op1("shock"), op2("shock")], [{"id": "missile1", "at": "missile", "pop": T}, {"id": "lancio", "at": "partito", "pop": T}] + alarm("Sullo"),
     mostra={"schermo": "mappa", "missile": "missile1", "base": "mappa", "stati": "mappa"})
beat("Il sistema indica il livello di affidabilità più alto.", "bunker", cam(("dettaglio_oggetto", "affidabilita")),
     [pet(face="shock")], [{"id": "affidabilita", "at": "affidabilità", "pop": T}, {"id": "lancio", "at": "Il", "show": T}, {"id": "missile1", "at": "Il", "show": T}] + alarm("Il"),
     mostra={"sistema": "affidabilita", "livello": "affidabilita"})
beat("I suoi uomini si girano verso di lui. Aspettano un ordine.", "bunker", cam(("due_figure_tavolo", "operatore"), ("ecu", "petrov", "Aspettano")),
     [pet(face="worried"), {"id": "operatore", "x": 1.6, "z": -0.45, "pose": "hang", "face": "shock", "flip": True, "change": [{"at": "girano", "flip": False}]},
      {"id": "operatore2", "x": -1.6, "z": -0.45, "pose": "hang", "face": "worried", "flip": True, "change": [{"at": "girano", "flip": False}]}],
     [{"id": "lancio", "at": "I", "show": T}, {"id": "missile1", "at": "I", "show": T}] + alarm("I"), mostra={"uomini": "operatore"}, non_mostrare=["ordine: non arriva, si vede l'attesa"])
beat("Il protocollo è chiaro: se l'attacco è vero, va avvisato subito il comando.", "bunker", cam(("dettaglio_oggetto", "telefono"), ("primo_piano", "petrov", "comando")),
     [pet(face="nervous")], [{"id": "lancio", "at": "Il", "show": T}, {"id": "missile1", "at": "Il", "show": T}, {"id": "telefono", "at": "comando", "shake": 0.02}] + alarm("Il"),
     mostra={"protocollo": "registro", "comando": "telefono", "attacco": "lancio"})
beat("E lassù, con pochissimi minuti, qualcuno potrebbe decidere di rispondere.", "bunker", cam(("dal_basso_rivela", "lancio"), ("ecu", "petrov", "rispondere")),
     [pet(face="nervous")], [{"id": "lancio", "at": "E", "show": T}, {"id": "missile1", "at": "E", "show": T}] + alarm("E"), non_mostrare=["qualcuno: i vertici restano fuori campo", "minuti: tempo"])
beat("Petrov resta seduto. Il telefono in una mano, il microfono nell'altra.", "bunker", cam(("mezza_figura", "petrov"), ("dettaglio_oggetto", "telefono", "telefono")),
     [pet("phone", "determined", prop="phone")], [{"id": "lancio", "at": "Petrov", "show": T}, {"id": "missile1", "at": "Petrov", "show": T}, {"id": "telefono", "at": "telefono", "hop": 0.04}] + alarm("Petrov"),
     mostra={"telefono": "telefono", "microfono": "telefono", "mano": "petrov"})
beat("Poi il sistema segnala un secondo missile.", "bunker", cam(("dettaglio_oggetto", "mappa"),),
     [pet("phone", "shock", prop="phone")], [{"id": "lancio", "at": "Poi", "show": T}, {"id": "missile1", "at": "Poi", "show": T}, {"id": "missile2", "at": "secondo", "pop": T}] + alarm("Poi"),
     mostra={"sistema": "mappa", "missile": "missile2"})
beat("Un terzo. Un quarto. Un quinto.", "bunker", cam(("dettaglio_oggetto", "mappa"), ("ecu", "petrov", "quinto")),
     [pet("phone", "shock", prop="phone")], [{"id": f"missile{i}", "at": "Un", "show": T} for i in (1, 2)] + [{"id": "missile3", "at": "terzo", "pop": T}, {"id": "missile4", "at": "quarto", "pop": T}, {"id": "missile5", "at": "quinto", "pop": T},
     {"id": "missili5", "at": "quinto", "pop": T}, {"id": "lancio", "at": "Un", "show": T}] + alarm("Un"))
M5 = [{"id": f"missile{i}", "at": None, "show": T} for i in range(1, 6)] + [{"id": "lancio", "at": None, "show": T}, {"id": "missili5", "at": None, "show": T}]


def m5(word): return [dict(e, at=word) for e in M5] + alarm(word)


beat("Qualcosa non torna.", "bunker", cam(("primo_piano_finale", "petrov"),), [pet("phone", "determined", prop="phone")], m5("Qualcosa"))
beat("Se gli Stati Uniti volessero davvero colpire per primi, non manderebbero cinque missili.", "bunker", cam(("mezza_figura", "petrov"), ("dettaglio_oggetto", "mappa", "cinque")),
     [pet("hang", "determined")], m5("Se"), mostra={"stati": "mappa", "missili": "mappa"})
beat("Ne manderebbero centinaia, tutti insieme, per non lasciare all'avversario la possibilità di rispondere.", "bunker", cam(("ambiente", None), ("primo_piano", "petrov", "possibilità")),
     [pet("point", "determined")], m5("Ne") + [{"id": "centinaia", "at": "centinaia", "pop": T}, {"id": "centinaia", "at": "possibilità", "hide": T}], mostra={"centinaia": "centinaia", "avversario": "mappa"})
beat("E c'è un altro dettaglio. I radar a terra non vedono niente.", "bunker", cam(("primo_piano", "petrov"), ("dettaglio_oggetto", "radar", "radar")),
     [pet("hang", "sly")], m5("E") + [{"id": "radar", "at": "niente", "shake": 0.01}], mostra={"dettaglio": "radar", "radar": "radar", "terra": "radar"})
beat("Petrov chiama l'ufficiale di servizio al comando.", "bunker", cam(("dettaglio_oggetto", "telefono"), ("primo_piano", "petrov", "comando")),
     [pet("phone", "determined", prop="phone")], m5("Petrov"), mostra={"ufficiale": "telefono", "comando": "telefono", "servizio": "telefono"})
beat("E dice: è un guasto del sistema.", "bunker", cam(("primo_piano_finale", "petrov"),), [pet("phone", "determined", prop="phone", talk=True)], m5("E"), mostra={"guasto": "petrov", "sistema": "mappa"})
beat("Anni dopo racconterà che non ne era affatto sicuro. Per lui era cinquanta e cinquanta.", "casa", cam(("mezza_figura", "petrov_anziano"), ("primo_piano", "petrov_anziano", "cinquanta")),
     [{"id": "petrov_anziano", "x": -0.6, "z": -0.6, "pose": "shrug", "face": "neutral", "talk": True, "change": [{"at": "cinquanta", "face": "sly"}]}], non_mostrare=["anni: tempo"])
beat("Ora non resta che aspettare.", "bunker", cam(("vertigine", "petrov"),), [pet("hang", "nervous")], m5("Ora"))
beat("Se ha ragione, non succederà niente.", "bunker", cam(("mezza_figura", "petrov"),), [pet("hang", "nervous")], m5("Se"), non_mostrare=["ragione: concetto"])
beat("Se ha torto, i missili arriveranno tra pochi minuti.", "bunker", cam(("dettaglio_oggetto", "mappa"), ("ecu", "petrov", "minuti")), [pet("hang", "teary")], m5("Se"),
     mostra={"missili": "mappa"}, non_mostrare=["minuti: tempo", "torto", "torta"])
beat("E nessuno sarà stato avvisato.", "bunker", cam(("dettaglio_oggetto", "telefono"),), [pet("hang", "teary")], m5("E"))
beat("Nel bunker cala il silenzio.", "bunker", cam(("ambiente",),), [pet("hang", "nervous"), op1("nervous"), op2("nervous")], m5("Nel"), mostra={"silenzio": "petrov"})
beat("Gli occhi vanno all'orologio. Poi allo schermo. Poi di nuovo all'orologio.", "bunker", cam(("dettaglio_oggetto", "orologio"), ("dettaglio_oggetto", "mappa", "schermo"), ("dettaglio_oggetto", "orologio", "nuovo")),
     [pet("hang", "nervous")], m5("Gli") + [{"id": "orologio", "at": "nuovo", "shake": 0.01}], mostra={"occhi": "petrov", "schermo": "mappa"})
beat("Passa un minuto.", "bunker", cam(("primo_piano", "petrov"),), [pet("hang", "nervous")], m5("Passa") + [{"id": "orologio", "at": "minuto", "spin": 0.05, "dur": 1}])
beat("Ne passano dieci. Venti.", "bunker", cam(("dettaglio_oggetto", "orologio"), ("ecu", "petrov", "Venti")), [pet("hang", "teary")], m5("Ne") + [{"id": "orologio", "at": "dieci", "spin": 0.1, "dur": 1.2}])
beat("Niente esplode.", "bunker", cam(("ambiente",),), [pet("hang", "nervous"), op1("nervous"), op2("nervous")],
     [dict(e, at="Niente") for e in M5] + [{"id": "allarme1", "at": "Niente", "on": False}, {"id": "allarme2", "at": "Niente", "on": False}])
beat("Nessun missile arriva.", "bunker", cam(("dettaglio_oggetto", "mappa"),), [pet()],
     [{"id": f"missile{i}", "at": "Nessun", "show": T} for i in range(1, 6)] + [{"id": f"missile{i}", "at": "arriva", "hide": T} for i in range(1, 6)] + [{"id": "lancio", "at": "Nessun", "hide": T}],
     mostra={"missile": "mappa"})
beat("Petrov aveva ragione.", "bunker", cam(("primo_piano_finale", "petrov"),), [pet("hang", "blissful")])
# 4 · rivelazione
beat("Ma allora, cosa avevano visto i satelliti?", "spazio", cam(("dettaglio_oggetto", "satellite"),), [], [{"id": "satellite", "at": "visto", "spin": 0.25, "dur": 3}], mostra={"satelliti": "satellite"})
beat("Quella notte il sole, le nuvole sopra gli Stati Uniti e i satelliti si erano allineati in un modo rarissimo.", "spazio",
     cam(("gru_rivela", "satellite"), ("dall_alto_oggetto", "terra", "nuvole")), [], [{"id": "raggio", "at": "allineati", "show": T}],
     mostra={"sole": "raggio", "nuvole": "terra", "stati": "terra", "satelliti": "satellite"}, non_mostrare=["notte: tempo", "modo: concetto"])
beat("La luce del sole rimbalzava su nuvole molto alte, proprio sopra le basi missilistiche.", "pianure", cam(("tilt_cielo", "riflessi"), ("dettaglio_oggetto", "silo", "basi")),
     [], [{"id": "riflessi", "at": "rimbalzava", "pop": T}], mostra={"luce": "riflessi", "sole": "riflessi", "nuvole": "riflessi", "basi": "silo"})
beat("E dallo spazio, quei riflessi sembravano il fuoco dei motori.", "spazio", cam(("dall_alto_oggetto", "terra"), ("dettaglio_oggetto", "satellite", "fuoco")),
     [], [{"id": "raggio", "at": "riflessi", "show": T}], mostra={"spazio": "terra", "riflessi": "raggio", "fuoco": "raggio", "motori": "raggio"})
beat("Il computer non aveva visto cinque missili. Aveva visto il sole.", "bunker", cam(("dettaglio_oggetto", "mappa"), ("primo_piano", "petrov", "sole")),
     [pet("hang", "smile")], [{"id": f"missile{i}", "at": "computer", "show": T} for i in range(1, 6)] + [{"id": "luce_mappa", "at": "sole", "on": T}],
     light="interno_notte", mostra={"computer": "mappa", "missili": "mappa", "sole": "mappa"})
beat("Dopo quella notte, l'Unione Sovietica aggiunse altri satelliti, in un'orbita diversa, per controllare ogni allarme da un secondo punto di vista.", "spazio",
     cam(("dettaglio_oggetto", "satellite2"), ("arco", "satellite", "controllare")), [], [{"id": "satellite2", "at": "satelliti", "show": T, "from": [12, 18, -4], "dur": 2.5}],
     mostra={"satelliti": "satellite2", "orbita": "satellite2", "unione": "terra", "allarme": "satellite"}, non_mostrare=["notte: tempo", "punto: concetto", "vista: concetto"])
# 5 · dopo
beat("E Petrov? Nessuna medaglia.", "indagine", cam(("mezza_figura", "petrov"),), [{"id": "petrov", "x": -0.4, "z": 0.4, "pose": "hang", "face": "neutral"}], non_mostrare=["medaglia: non c'è"])
beat("Ci fu un'indagine. All'inizio lo lodarono.", "indagine", cam(("due_figure_tavolo", "petrov"), ("dettaglio_oggetto", "lode", "lodarono")),
     [{"id": "petrov", "x": -0.4, "z": 0.4, "pose": "hang", "face": "smile", "flip": True}, {"id": "generale", "x": 0, "z": -1.4, "pose": "hip", "face": "smile"}],
     [{"id": "lode", "at": "lodarono", "pop": T}], mostra={"indagine": "generale"})
beat("Poi lo rimproverarono: in quelle ore non aveva compilato il registro di servizio.", "indagine", cam(("primo_piano", "generale"), ("dall_alto_oggetto", "registro_vuoto", "registro")),
     [{"id": "petrov", "x": -0.4, "z": 0.4, "pose": "hang", "face": "worried", "flip": True}, {"id": "generale", "x": 0, "z": -1.4, "pose": "point", "face": "determined"}],
     [{"id": "lode", "at": "Poi", "hide": T}, {"id": "rimprovero", "at": "rimproverarono", "pop": T}, {"id": "timbro", "at": "registro", "show": T, "from": [0.15, 1.3, -0.35], "dur": 0.5}],
     mostra={"registro": "registro_vuoto", "servizio": "registro_vuoto"}, non_mostrare=["ore: tempo"])
beat("La storia finì in un cassetto.", "indagine", cam(("dettaglio_oggetto", "cassetto"),), [], [{"id": "registro_vuoto", "at": "storia", "move": [2.9, 1.35, -2.4], "dur": 1.2}, {"id": "cassetto", "at": "cassetto", "shake": 0.02}],
     mostra={"storia": "registro_vuoto", "cassetto": "cassetto"})
beat("Per quindici anni nessuno ne seppe niente.", "indagine", cam(("ambiente",),), [], non_mostrare=["anni: tempo"])
beat("Solo nel 1998 il suo comandante di allora, il generale Votintsev, la raccontò nelle sue memorie.", "indagine", cam(("mezza_figura", "generale"), ("dettaglio_oggetto", "memorie", "memorie")),
     [{"id": "generale", "x": 0, "z": -1.4, "pose": "hang", "face": "smile"}], [{"id": "memorie", "at": "Solo", "pop": T}], mostra={"comandante": "generale", "generale": "generale", "votintsev": "memorie", "memorie": "memorie"})
beat("Poi arrivarono i giornalisti, le lettere, i premi.", "casa", cam(("mezza_figura", "petrov_anziano"), ("dettaglio_oggetto", "lettere", "lettere"), ("dettaglio_oggetto", "premio", "premi")),
     [{"id": "petrov_anziano", "x": -0.6, "z": -0.6, "pose": "hang", "face": "shock"}],
     [{"id": "giornalisti", "at": "giornalisti", "pop": T}, {"id": "lettere", "at": "lettere", "show": T, "from": [-1.4, 2.4, 1.5], "dur": 0.8}, {"id": "premio", "at": "premi", "pop": T}],
     mostra={"giornalisti": "giornalisti", "lettere": "lettere", "premi": "premio"})
beat("Nel 2006 fu ricevuto alle Nazioni Unite, a New York.", "onu", cam(("ambiente",), ("dettaglio_oggetto", "insegna_onu", "Nazioni")),
     [{"id": "petrov_anziano", "x": 0, "z": -2.4, "pose": "wave", "face": "smile"}, {"id": "diplomatica", "x": -1.8, "z": 2.0, "pose": "up", "face": "smile", "flip": True},
      {"id": "diplomatico", "x": 1.8, "z": 2.0, "pose": "up", "face": "grin", "flip": True}, {"id": "ospite", "x": 0.6, "z": 3.2, "pose": "up", "face": "smile", "flip": True}],
     mostra={"nazioni": "insegna_onu", "new": "insegna_onu", "york": "insegna_onu"})
beat("Lui ripeteva sempre la stessa cosa: non sono un eroe, ero solo la persona giusta nel posto giusto.", "casa", cam(("mezza_figura", "petrov_anziano"), ("primo_piano", "petrov_anziano", "eroe")),
     [{"id": "petrov_anziano", "x": -0.6, "z": -0.6, "pose": "shrug", "face": "smile", "talk": True}], [{"id": "lettere", "at": "Lui", "show": T}, {"id": "premio", "at": "Lui", "show": T}],
     mostra={"persona": "petrov_anziano", "eroe": "petrov_anziano"}, non_mostrare=["posto: concetto", "cosa: concetto"])
beat("Stanislav Petrov morì nel maggio 2017, vicino a Mosca.", "casa", cam(("dettaglio_oggetto", "Rockingchair"),), [], [{"id": "lettere", "at": "Stanislav", "show": T}, {"id": "premio", "at": "Stanislav", "show": T}],
     non_mostrare=["petrov: è morto, resta la sedia vuota", "mosca: luogo citato", "maggio: data"])
beat("Il mondo lo scoprì solo mesi dopo.", "casa", cam(("dettaglio_oggetto", "premio"),), [], [{"id": "lettere", "at": "Il", "show": T}, {"id": "premio", "at": "Il", "show": T}], non_mostrare=["mondo: concetto", "mesi: tempo"])
# finale
beat("Quella notte, una macchina disse che il mondo stava finendo.", "bunker", cam(("dal_basso_rivela", "lancio"), ("primo_piano", "petrov", "finendo")),
     [pet("hang", "determined")], m5("Quella"), light="interno_notte", mostra={"macchina": "mappa", "mondo": "mappa"}, non_mostrare=["notte: tempo"])
beat("Un uomo, da solo, al buio, disse: no.", "bunker", cam(("primo_piano_finale", "petrov"),),
     [pet("hang", "determined", talk=True)], m5("Un") + [{"id": "lancio", "at": "no", "hide": T}, {"id": "allarme1", "at": "no", "on": False}, {"id": "allarme2", "at": "no", "on": False}] + [{"id": f"missile{i}", "at": "no", "hide": T} for i in range(1, 6)],
     mostra={"uomo": "petrov"}, non_mostrare=["buio: è la scena stessa"])

# sedia a dondolo con id per il penultimo dettaglio
for m in places["casa"]["models"]:
    if m.get("m") == "Rockingchair_01": m["id"] = "Rockingchair"

story = {"title": "La notte in cui il mondo non finì", "facts": "storia vera, fonti in episodes/petrov-1983/SOURCES.md",
         "voice": {"file": f"{W}/voce.mp3", "words": f"{W}/words.json"}, "music": {"mood": "mystery", "bpm": 72, "gain": 0.07},
         "cast": cast, "places": places, "beats": B}
json.dump(story, open(f"{S}/skill/kit/stories/petrov_1983.json", "w"), ensure_ascii=False, indent=1)
print(len(B), "battute")
