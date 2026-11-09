# genera i luoghi della storia Petrov (JSON) con codice, per tenere pulite le coordinate
import json
def dot(i, x, y, col="#ff3b30", r=0.07):
    return {"id": f"missile{i}", "parts": [{"shape": "sphere", "r": r, "at": [0, 0, 0], "glow": 3.0, "color": col}], "at": [x, y, -3.88], "hidden": True}
desk = lambda x, z, ry=0, id=None: [{"m": "metal_office_desk", "at": [x, 0, z], "size": 0.76, "ry": ry, **({"id": id} if id else {})},
                                    {"m": "television_02", "at": [x - 0.35, 0.76, z - 0.1], "size": 0.38, "ry": ry, "color": "#c8c4b8"},
                                    {"m": "vintage_radio_transceiver", "at": [x + 0.3, 0.76, z - 0.12], "w": 0.42, "ry": ry},
                                    {"m": "SchoolChair_01", "at": [x, 0, z + 0.75], "size": 0.85, "ry": 180 + ry}]
bunker = {"type": "room", "w": 10, "d": 8, "h": 3.6, "light": "interno_notte",
  "floor": {"tex": "concrete_floor_painted", "tint": "#9aa59a", "rep": 5},
  "wall": {"tex": "painted_plaster_wall", "tint": "#7f9a8c", "rep": [3, 1.2]},
  "ceiling": {"color": "#5a625c"},
  "boards": [
    {"id": "mappa", "text": "SISTEMA OKO\n\n\n", "at": [0, 1.95, -3.95], "w": 5.2, "h": 2.2, "bg": "#0b1c14", "ink": "#38e07a", "border": "#2a6a44", "frame": "#2a2e2a"},
    {"id": "lancio", "text": "LANCIO", "at": [0, 3.3, -3.93], "w": 1.9, "h": 0.42, "bg": "#2a0303", "ink": "#ff2a2a", "border": "#ff2a2a", "frame": "#1a1a1a", "hidden": True},
    {"id": "affidabilita", "text": "AFFIDABILITÀ\nMASSIMA", "at": [3.6, 1.7, -3.95], "w": 1.1, "h": 0.7, "bg": "#0b1c14", "ink": "#ffd23a", "border": "#2a6a44", "frame": "#2a2e2a", "hidden": True},
    {"id": "data", "text": "26 SETTEMBRE 1983\nORE 00:15", "at": [-3.6, 1.7, -3.95], "w": 1.2, "h": 0.6, "bg": "#0b1c14", "ink": "#38e07a", "border": "#2a6a44", "frame": "#2a2e2a"},
    {"id": "radar", "text": "RADAR\nNESSUN\nBERSAGLIO", "at": [4.95, 1.6, -1.6], "ry": -90, "w": 1.0, "h": 0.8, "bg": "#061a0e", "ink": "#38e07a", "border": "#38e07a", "frame": "#2a2e2a"}],
  "lamps": [
    {"at": [0, 3.3, 0.5], "intensity": 2.2, "color": "#cfe8ff", "bulb": False},
    {"id": "allarme1", "at": [-4.6, 3.1, -3.6], "intensity": 9, "range": 12, "color": "#ff2a20", "on": False},
    {"id": "allarme2", "at": [4.6, 3.1, -3.6], "intensity": 9, "range": 12, "color": "#ff2a20", "on": False},
    {"id": "luce_mappa", "at": [0, 1.9, -3.2], "intensity": 2.5, "range": 6, "color": "#40ff90", "bulb": False}],
  "models": [
    *desk(-1.6, -1.2), *desk(1.6, -1.2),
    {"m": "metal_office_desk", "at": [0, 0, 0.6], "size": 0.76, "w": 1.5, "id": "banco_petrov"},
    {"m": "Television_01", "at": [-0.4, 0.76, 0.45], "size": 0.42, "ry": 180, "id": "monitor"},
    {"m": "desk_lamp_arm_01", "at": [0.55, 0.76, 0.45], "size": 0.45, "ry": 200},
    {"id": "telefono", "parts": [{"shape": "box", "size": [0.22, 0.08, 0.18], "at": [0, 0.04, 0], "color": "#b01e1e", "rough": 0.3},
                                  {"shape": "cyl", "r": 0.03, "h": 0.24, "rot": [0, 0, 90], "at": [0, 0.11, 0], "color": "#b01e1e", "rough": 0.3},
                                  {"shape": "cyl", "r": 0.05, "h": 0.01, "at": [0, 0.081, 0.05], "rot": [-20, 0, 0], "color": "#eeeeee"}], "at": [0.15, 0.76, 0.65], "ry": 180},
    {"m": "office_notepads", "at": [-0.05, 0.76, 0.8], "w": 0.25, "id": "registro"},
    {"m": "wall_clock", "at": [-2.6, 2.6, -3.95], "size": 0.42, "id": "orologio"},
    {"m": "SchoolChair_01", "at": [0, 0, 1.35], "size": 0.85, "ry": 180},
    {"m": "steel_frame_shelves_01", "at": [-4.6, 0, -1.6], "size": 2.0, "ry": 90},
    {"m": "drawer_cabinet", "at": [-4.6, 0, 0.6], "size": 1.2, "ry": 90},
    {"m": "power_box_01", "at": [4.9, 1.5, 0.8], "size": 0.6, "ry": -90},
    {"m": "fire_alarm", "at": [4.95, 1.4, -3.0], "size": 0.2, "ry": -90},
    {"m": "modular_airduct_circular_01", "at": [-3, 3.3, -2.5], "w": 2.0},
    {"m": "mounted_fluorescent_lights", "at": [0, 3.5, -1.5], "w": 1.3},
    {"m": "mounted_fluorescent_lights", "at": [0, 3.5, 1.5], "w": 1.3},
    {"m": "clipboard", "at": [-1.3, 0.76, -1.1], "w": 0.25},
    {"m": "retro_multimeter", "at": [1.95, 0.76, -1.05], "w": 0.2},
    *[dot(i + 1, -1.2 + 0.35 * i, 2.35 - 0.12 * i) for i in range(5)],
    {"id": "centinaia", "parts": [{"shape": "sphere", "r": 0.04, "glow": 3.0, "color": "#ff6a30", "at": [(-2.2 + (k * 0.37) % 4.4), 1.3 + (k * 0.23) % 1.4, 0]} for k in range(60)], "at": [0, 0, -3.88], "hidden": True}]}
json.dump({"bunker": bunker}, open(__file__.replace("places.py", "places.json"), "w"), ensure_ascii=False, indent=1)
