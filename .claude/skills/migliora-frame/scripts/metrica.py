# Metrica di somiglianza + diagnosi automatica.
# Uso: python3 metrica.py rif.png render.png [--config config.json] [--log log.csv] [--etichetta it07]
# config.json (facoltativo): {"maschere": [[x0,y0,x1,y1],...], "zone": {"cielo": [x0,y0,x1,y1], ...}, "celle": [6,10]}
# Stampa la differenza media per zona (0-255, più basso = più simile) e le celle peggiori con la causa probabile.
import sys, json, argparse, csv, os, numpy as np
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument('ref'); ap.add_argument('render'); ap.add_argument('--config'); ap.add_argument('--log'); ap.add_argument('--etichetta', default='')
ap.add_argument('--peggiori', type=int, default=6); a = ap.parse_args()
R = np.asarray(Image.open(a.ref).convert('RGB')).astype(np.float32); M = np.asarray(Image.open(a.render).convert('RGB')).astype(np.float32)
H, W = R.shape[:2]; cfg = json.load(open(a.config)) if a.config else {}
mask = np.ones((H, W), bool)
for x0, y0, x1, y1 in cfg.get('maschere', []): mask[y0:y1, x0:x1] = False
zone = {'tutto': [0, 0, W, H], **cfg.get('zone', {})}
D = np.abs(R - M).mean(2)
res = {}
for n, (x0, y0, x1, y1) in zone.items():
    mm = mask[y0:y1, x0:x1]; res[n] = float(D[y0:y1, x0:x1][mm].mean()) if mm.any() else float('nan')
print(f"{os.path.basename(a.render):18s} " + '  '.join(f'{n}={v:.1f}' for n, v in res.items()))
cx, cy = cfg.get('celle', [6, 10]); cells = []
for j in range(cy):
    for i in range(cx):
        x0, x1, y0, y1 = i * W // cx, (i + 1) * W // cx, j * H // cy, (j + 1) * H // cy
        mm = mask[y0:y1, x0:x1]
        if mm.mean() < .5: continue
        d = float(D[y0:y1, x0:x1][mm].mean()); off = (M[y0:y1, x0:x1][mm] - R[y0:y1, x0:x1][mm]).mean(0)
        # se lo scarto medio di colore spiega gran parte della differenza è un problema di colore/luce, altrimenti di forma/posizione
        kind = 'colore/luce' if np.abs(off).mean() > .55 * d else 'forma/posizione/dettaglio'
        cells.append((d, x0, y0, x1, y1, off, kind))
print('celle peggiori (x0,y0,x1,y1): differenza | scarto medio RGB render-rif | causa probabile')
for d, x0, y0, x1, y1, off, kind in sorted(cells, reverse=True)[:a.peggiori]:
    lum = 'troppo chiaro' if off.mean() > 6 else 'troppo scuro' if off.mean() < -6 else ''
    print(f'  ({x0},{y0},{x1},{y1}): {d:5.1f} | {off.round().astype(int).tolist()} {lum} | {kind}')
if a.log:
    new = not os.path.exists(a.log)
    with open(a.log, 'a', newline='') as f:
        w = csv.writer(f)
        if new: w.writerow(['etichetta', 'render'] + list(res))
        w.writerow([a.etichetta, a.render] + [f'{v:.2f}' for v in res.values()])
