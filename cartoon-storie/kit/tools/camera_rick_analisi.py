"""Analizza i movimenti di camera di un video di riferimento (Rick) inquadratura per inquadratura (12/11).
Uso: kit/.venv/bin/python kit/tools/camera_rick_analisi.py video.mp4 [parole.json] [--json out.json]
Per ogni inquadratura: durata, tipo di passaggio in entrata (stacco/dissolvenza), zoom %/s, panoramica px/s e direzione,
forma della velocità (costante / parte forte e rallenta / accelera), quota del movimento nel primo terzo, distanza dalla parola più vicina."""
import sys, json, numpy as np, cv2
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from camera_misura import fit
av = sys.argv[1:]; vid = av[0]; pj = next((a for a in av[1:] if a.endswith('.json') and av[av.index(a) - 1] != '--json'), None)
cap = cv2.VideoCapture(vid); fps = cap.get(cv2.CAP_PROP_FPS); G = []; C = []
while True:
    ok, f = cap.read()
    if not ok: break
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY); G.append(cv2.resize(g, (270, 480), interpolation=cv2.INTER_AREA)); C.append(cv2.resize(f, (27, 48), interpolation=cv2.INTER_AREA).astype(np.float32))
n = len(G); K = 1080 / 270 / 4   # fit() moltiplica già per 4 (270 -> 1080)
M = np.array([(0, 0, 0)] + [fit(G[i - 1], G[i]) for i in range(1, n)], float)
d = np.array([0] + [np.abs(C[i] - C[i - 1]).mean() for i in range(1, n)])
# passaggio: la differenza a 6 fotogrammi di distanza (miniature 27x48, il movimento di camera quasi non le cambia) fa un picco;
# stacco se quasi tutto il cambio sta in un fotogramma, dissolvenza se è spalmato
D6 = np.array([0] * 6 + [np.abs(C[i] - C[i - 6]).mean() for i in range(6, n)]); sog = max(14, 2.5 * np.median(D6)); tagli = []; i = 6
while i < n:
    if D6[i] > sog:
        j = i
        while j + 1 < n and D6[j + 1] > sog: j += 1
        a = max(1, i - 6); fr = d[a:j + 1]; tagli.append((a + int(np.argmax(fr >= 0.25 * fr.max())), j - 5 if j - 5 > a else a + 1, 'stacco' if fr.max() > 0.6 * fr.sum() else 'dissolvenza')); i = j + 4
    else: i += 1
W = []
if pj:
    P = json.load(open(pj)); P = P.get('words', P) if isinstance(P, dict) else P
    W = np.array([w[0] if isinstance(w, list) else w.get('start', w.get('da', 0)) for w in P])
bordi = [(0, 0, 'inizio')] + tagli + [(n, n, 'fine')]; R = []
for (a0, a1, tipo), (b0, _, _) in zip(bordi, bordi[1:]):
    s, e = a1 + 2, b0 - 1
    if e - s < 8: continue
    tx, ty, z = M[s:e, 0], M[s:e, 1], M[s:e, 2]
    v = np.hypot(tx, ty) + np.abs(z) / 100 * 734; L = len(v); t3 = L // 3
    forma = v[:t3].mean() / (v[-t3:].mean() + 0.3)
    R.append(dict(da=round(a1 / fps, 2), dur=round((b0 - a1) / fps, 2), entra=tipo, zoom=round(float(z.mean() * fps), 2), panx=round(float(tx.mean() * fps), 1), pany=round(float(ty.mean() * fps), 1),
                  vmed=round(float(np.median(v)), 1), vmax=round(float(v.max()), 1), forma=round(float(forma), 2), primo_terzo=round(float(v[:t3].sum() / (v.sum() + 1e-6)), 2),
                  cambi_x=int((np.diff(np.sign(tx[np.abs(tx) > 1.5])) != 0).sum()), cambi_z=int((np.diff(np.sign(z[np.abs(z) > 0.08])) != 0).sum()),
                  parola=round(float(np.abs(W - a1 / fps).min()), 2) if len(W) else None))
for r in R: print(f"{r['da']:6.2f} +{r['dur']:4.2f}s {r['entra']:11s} zoom {r['zoom']:+6.2f}%/s  pan x {r['panx']:+7.1f} y {r['pany']:+7.1f} px/s  v med {r['vmed']:5.1f} max {r['vmax']:5.1f}  forma {r['forma']:5.2f}  1°terzo {r['primo_terzo']:.2f}  cambi x{r['cambi_x']} z{r['cambi_z']}  parola {r['parola']}")
A = lambda k: np.array([r[k] for r in R], float)
z, px, py = A('zoom'), A('panx'), A('pany'); dom = np.where(np.abs(z) / 100 * 734 > np.hypot(px, py), np.where(z > 0, 'avanti', 'indietro'), np.where(np.abs(px) > np.abs(py), np.where(px > 0, 'pan→', 'pan←'), np.where(py > 0, 'giù', 'su')))
fermo = (np.abs(z) < 0.6) & (np.hypot(px, py) < 12); dom = np.where(fermo, 'quasi fermo', dom)
print(f"\nINQUADRATURE {len(R)}  durata mediana {np.median(A('dur')):.2f} s  passaggi: " + ', '.join(f"{t} {sum(r['entra'] == t for r in R)}" for t in ('stacco', 'dissolvenza')))
print('MOVIMENTO DOMINANTE: ' + ', '.join(f"{k} {100 * (dom == k).mean():.0f}%" for k in sorted(set(dom), key=lambda k: -(dom == k).sum())))
print(f"zoom mediano {np.median(z):+.2f} %/s (p10 {np.percentile(z, 10):+.2f}, p90 {np.percentile(z, 90):+.2f})   pan |x| mediano {np.median(np.abs(px)):.0f} px/s, |y| {np.median(np.abs(py)):.0f}")
print(f"forma (velocità primo terzo / ultimo terzo): mediana {np.median(A('forma')):.2f}; parte forte (>1.5) {100 * (A('forma') > 1.5).mean():.0f}%, costante (0.67-1.5) {100 * ((A('forma') >= 0.67) & (A('forma') <= 1.5)).mean():.0f}%, accelera (<0.67) {100 * (A('forma') < 0.67).mean():.0f}%")
print(f"cambi di direzione dentro l'inquadratura: x {A('cambi_x').sum():.0f}, zoom {A('cambi_z').sum():.0f};  inquadrature senza cambi x {100 * (A('cambi_x') == 0).mean():.0f}%")
sx = np.sign(px[np.abs(px) > 12]); print(f"pan consecutive con lo stesso verso: {100 * (sx[1:] == sx[:-1]).mean():.0f}% (50% = a caso)" if len(sx) > 2 else '')
lun = A('dur') > np.median(A('dur')); print(f"zoom |%/s| inquadrature corte {np.median(np.abs(z[~lun])):.2f}, lunghe {np.median(np.abs(z[lun])):.2f};  v mediana corte {np.median(A('vmed')[~lun]):.1f}, lunghe {np.median(A('vmed')[lun]):.1f} px/f")
if len(W): p = A('parola')[1:]; print(f"passaggio rispetto alla parola più vicina: mediana {np.median(p):.2f} s, entro 0,1 s {100 * (p <= 0.1).mean():.0f}%")
if '--json' in av: json.dump(R, open(av[av.index('--json') + 1], 'w'), indent=0)
