"""Misura il movimento di camera di una storia «disegnato» fotogramma per fotogramma e lo confronta con Rick (12/11).
Uso: kit/.venv/bin/python kit/tools/camera_misura.py kit/out/<nome>/fotogrammi [storia_risolta.json] [--grafico out.png]

Metodo (lo stesso del rapporto motion.md sui 20 Short di Rick): flusso ottico Farneback su fotogrammi grigi 270x480,
punti con texture, fit robusto  flusso = t + (s-1)*(p - centro)  (4 giri di scarto al 70° percentile).
Per ogni inquadratura (scena) dice: velocità mediana e p90 (px/fotogramma a 1080x1920), picco, salita (fotogrammi dal 10% al picco),
SCATTI (accelerazione oltre 6 px/f² tra due fotogrammi), INVERSIONI (la direzione orizzontale cambia segno dentro la stessa scena
con un movimento vero, cioè ≥ 1,5 px/f prima e dopo), FERMI (< 0,3 px/f).
Numeri di Rick (motion.md): mediana 3,6 px/f, p90 16,9, picco mosse 13,7 (p75 24,6), salita ~10 f simmetrica, fermi 10%,
nessun ondeggiamento a mano, direzione costante dentro l'inquadratura, spinta in avanti 0,14 %/f nei momenti calmi."""
import sys, os, glob, json
import numpy as np
import cv2

def fit(a, b):
    f = cv2.calcOpticalFlowFarneback(a, b, None, 0.5, 3, 21, 3, 5, 1.1, 0)
    gy, gx = np.gradient(a.astype(np.float32)); g = np.hypot(gx, gy)
    ys, xs = np.mgrid[4:a.shape[0] - 4:8, 4:a.shape[1] - 4:8]
    m = g[ys, xs] > 20
    if m.sum() < 30: return 0.0, 0.0, 0.0
    px, py = xs[m].astype(np.float64), ys[m].astype(np.float64); fx, fy = f[ys, xs, 0][m], f[ys, xs, 1][m]
    cx, cy = a.shape[1] / 2, a.shape[0] / 2; keep = np.ones(len(px), bool)
    for _ in range(4):
        A = np.zeros((2 * keep.sum(), 3)); A[0::2, 0] = 1; A[1::2, 1] = 1; A[0::2, 2] = px[keep] - cx; A[1::2, 2] = py[keep] - cy
        B = np.zeros(2 * keep.sum()); B[0::2] = fx[keep]; B[1::2] = fy[keep]
        sol, *_ = np.linalg.lstsq(A, B, rcond=None); tx, ty, k = sol
        r = np.hypot(fx - (tx + k * (px - cx)), fy - (ty + k * (py - cy)))
        keep = r <= np.percentile(r[keep], 70)
    return tx * 4, ty * 4, k * 100   # px/f a 1080x1920, zoom %/f

def main():
    av = sys.argv[1:]; args = [a for i, a in enumerate(av) if not a.startswith('--') and not (i and av[i - 1] == '--grafico')]; d = args[0]
    sj = args[1] if len(args) > 1 else os.path.join(os.path.dirname(d.rstrip('/')), 'storia_risolta.json')
    graf = sys.argv[sys.argv.index('--grafico') + 1] if '--grafico' in sys.argv else None
    fs = sorted(glob.glob(os.path.join(d, 'f*.jpg'))); fps = 30
    tagli = [0, len(fs)]
    if os.path.exists(sj):
        S = json.load(open(sj)); fps = S.get('fps', 30); tagli = sorted({0, len(fs)} | {int(round(s['da'] * fps)) for s in S['scene']})
    G = [cv2.resize(cv2.imread(f, cv2.IMREAD_GRAYSCALE), (270, 480), interpolation=cv2.INTER_AREA) for f in fs]
    M = [(0.0, 0.0, 0.0)] + [fit(G[i - 1], G[i]) for i in range(1, len(G))]
    tx = np.array([m[0] for m in M]); ty = np.array([m[1] for m in M]); zm = np.array([m[2] for m in M])
    vel = np.hypot(tx, ty) + np.abs(zm) / 100 * 734   # come motion.md: traslazione + zoom × raggio d'angolo
    for t in tagli: vel[max(0, t - 1):t + 2] = np.nan; tx[max(0, t - 1):t + 2] = np.nan   # i tagli non sono movimento
    righe, tot = [], {'scatti': 0, 'inversioni': 0}
    for s, e in zip(tagli, tagli[1:]):
        v = vel[s + 2:e - 1]; x = tx[s + 2:e - 1]; v = v[~np.isnan(v)]; x = x[~np.isnan(x)]
        if len(v) < 6: continue
        acc = np.abs(np.diff(v)); scatti = int((acc > 6).sum())
        sx = np.sign(np.where(np.abs(x) >= 1.5, x, 0)); nz = sx[sx != 0]; inv = int((np.diff(nz) != 0).sum()) if len(nz) > 1 else 0
        pk = int(np.argmax(v)); sal = pk - (np.where(v[:pk + 1] < 0.1 * v[pk])[0].max() if (v[:pk + 1] < 0.1 * v[pk]).any() else 0)
        tot['scatti'] += scatti; tot['inversioni'] += inv
        righe.append(f"{s / fps:6.2f}-{e / fps:6.2f} s  mediana {np.median(v):5.1f}  p90 {np.percentile(v, 90):5.1f}  picco {v.max():5.1f} px/f  salita {sal:2d} f  scatti {scatti:2d}  inversioni {inv:2d}  fermi {100 * (v < 0.3).mean():3.0f}%")
    V = vel[~np.isnan(vel)]
    print('\n'.join(righe))
    print(f"TUTTO: mediana {np.median(V):.1f} px/f (Rick 3,6)  p90 {np.percentile(V, 90):.1f} (Rick 16,9)  fermi {100 * (V < 0.3).mean():.0f}% (Rick 10%)  scatti {tot['scatti']}  inversioni {tot['inversioni']} (Rick ~0: direzione costante nell'inquadratura)")
    if graf:   # grafico senza matplotlib: velocità (blu, linea rossa = p90 di Rick) e direzione orizzontale (verde = destra, viola = sinistra)
        from PIL import Image, ImageDraw
        W, H = min(3000, len(vel) * 2), 360; im = Image.new('RGB', (W, H), 'white'); g = ImageDraw.Draw(im); X = lambda i: i * W / len(vel)
        Y1 = lambda v: 170 - min(v, 80) / 80 * 160; g.line([(0, Y1(16.9)), (W, Y1(16.9))], fill=(230, 80, 80))
        for t in tagli: g.line([(X(t), 0), (X(t), H)], fill=(190, 190, 190))
        for i in range(1, len(vel)):
            if not np.isnan(vel[i]) and not np.isnan(vel[i - 1]): g.line([(X(i - 1), Y1(vel[i - 1])), (X(i), Y1(vel[i]))], fill=(40, 80, 200), width=2)
            if not np.isnan(tx[i]): c = (40, 160, 60) if tx[i] > 0 else (150, 60, 170); g.line([(X(i), 270), (X(i), 270 - max(-80, min(80, tx[i])))], fill=c)
        g.line([(0, 270), (W, 270)], fill=(0, 0, 0)); im.save(graf)

if __name__ == '__main__': main()
