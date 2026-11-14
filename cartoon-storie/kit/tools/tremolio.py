"""CONTROLLO TREMOLIO (sfarfallio dei dettagli fini), severo — [utente 12/11].
Uso: kit/.venv/bin/python kit/tools/tremolio.py kit/out/<nome>/fotogrammi [storia_risolta.json] [--mappe cartella] [--soglia 1.0]
Esce con codice 1 se trova problemi (il montaggio del video si ferma; TREMOLIO_OK=1 per andare avanti lo stesso).

Cosa misura: i dettagli fini (contorni sottili, piastrelle, scaffali, finestre lontane) che «friggono» quando la camera si allontana,
si avvicina o scorre: un tratto che compare in un fotogramma e sparisce nel successivo. Il vecchio sfarfallio.py faceva la differenza
seconda dei pixel e scambiava il movimento per tremolio; qui il movimento si toglie davvero:
  1. flusso ottico Farneback dal fotogramma i a i-1 e a i+1 (540x960), i vicini si «rimettono a posto» sul fotogramma i;
  2. resto = MINIMO tra |i - (i-1 riallineato)| e |i - (i+1 riallineato)|, e i due vicini riallineati devono somigliarsi tra loro
     (ciò che si muove davvero, come gambe che camminano o fiocchi che cadono, è diverso in tutti e tre e non conta): ciò che si muove liscio o che si scopre/copre da un lato
     solo dà resto basso; un dettaglio che c'è SOLO nel fotogramma i (o manca solo lì) dà resto alto da tutte e due le parti;
  3. si contano solo i pixel con dettaglio (gradiente forte) e il resto si confronta con il contrasto locale;
  4. tasselli 24x24: un tassello «trema» se oltre il 10% dei suoi pixel di dettaglio ha resto > 16/255.
Problemi (severi): in una scena più dello 0,3% del quadro trema in media, o un fotogramma supera il 2%, o lo stesso punto trema
in 4+ fotogrammi su 5 su più dello 0,5% del quadro (tarato il 12/11: neve, vapore, lancette e vetri che scorrono non devono bocciare); SALTO_DI_LUCE se più del 3% del quadro cambia luce di colpo in un fotogramma.
Ciò che si muove per conto suo (personaggi, muletto, fogli, polvere: flusso diverso dai vicini) non conta. Per ogni problema: tempo, zona del quadro, e una mappa (rosso = trema) del fotogramma peggiore."""
import sys, os, glob, json
import numpy as np
import cv2

T = 24

def carica(f):
    im = cv2.imread(f, cv2.IMREAD_GRAYSCALE)
    return cv2.resize(im, (540, 960), interpolation=cv2.INTER_AREA).astype(np.float32)

def riallinea(cur, vic):
    """vicino riallineato sul fotogramma corrente + maschera di ciò che si muove per conto suo (personaggi, muletto, fogli, polvere)"""
    fl = cv2.calcOpticalFlowFarneback(cur.astype(np.uint8), vic.astype(np.uint8), None, 0.5, 4, 19, 3, 5, 1.2, 0)
    h, w = cur.shape; gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    W = cv2.remap(vic, gx + fl[..., 0], gy + fl[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    liscio = cv2.blur(fl, (41, 41)); mob = np.hypot(*(fl - liscio).transpose(2, 0, 1)) > 1.5
    return W, cv2.dilate(mob.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0

def zona(cx, cy):
    return ('in alto' if cy < 0.33 else 'in basso' if cy > 0.66 else 'al centro') + (' a sinistra' if cx < 0.33 else ' a destra' if cx > 0.66 else '')

def main():
    av = sys.argv[1:]; vals = {'--mappe': None, '--soglia': '1.0'}
    args = []; i = 0
    while i < len(av):
        if av[i] in vals: vals[av[i]] = av[i + 1]; i += 2
        else: args.append(av[i]); i += 1
    d = args[0]; sj = args[1] if len(args) > 1 else os.path.join(os.path.dirname(d.rstrip('/')), 'storia_risolta.json')
    k = float(vals['--soglia']); mappe = vals['--mappe']
    fs = sorted(glob.glob(os.path.join(d, 'f*.jpg'))); fps = 30; tagli = [0, len(fs)]
    if os.path.exists(sj):
        S = json.load(open(sj)); fps = S.get('fps', 30); tagli = sorted({0, len(fs)} | {int(round(s['da'] * fps)) for s in S['scene']})
    if mappe: os.makedirs(mappe, exist_ok=True)
    problemi, righe = [], []
    for s, e in zip(tagli, tagli[1:]):
        if e - s < 5: continue
        F = {}; get = lambda j: F.setdefault(j, carica(fs[j]))
        quote, mappe_t, peggio, salti = [], [], (-1.0, s + 1, None), []
        for j in range(s + 1, e - 1):
            c = get(j); p, mp = riallinea(c, get(j - 1)); n, mn = riallinea(c, get(j + 1)); fermo = ~(mp | mn)
            ep = cv2.GaussianBlur(c - p, (3, 3), 0); en = cv2.GaussianBlur(c - n, (3, 3), 0)
            gx = cv2.Sobel(c, cv2.CV_32F, 1, 0, ksize=3); gy = cv2.Sobel(c, cv2.CV_32F, 0, 1, ksize=3); det = (np.hypot(gx, gy) > 60) & fermo
            # tremolio vero: il pixel è più chiaro (o più scuro) di TUTTI E DUE i vicini riallineati (un errore del flusso dà segni a caso)
            accordo = cv2.GaussianBlur(np.abs(p - n), (5, 5), 0) < 10 * k   # i due vicini riallineati si somigliano: solo il fotogramma di mezzo è diverso (tremolio);
            # una gamba che cammina o un fiocco che cade è diverso in tutti e tre i fotogrammi, quindi non conta
            trema = (np.abs(ep) > 16 * k) & (np.abs(en) > 16 * k) & (np.sign(ep) == np.sign(en)) & accordo & det
            # salto di luce: una zona larga che diventa più chiara/scura solo in questo fotogramma (lampade, bagliori)
            bp = cv2.blur(ep, (31, 31)); bn = cv2.blur(en, (31, 31)); salto = (np.abs(bp) > 6 * k) & (np.abs(bn) > 6 * k) & (np.sign(bp) == np.sign(bn)) & fermo
            salti.append(salto.mean())
            H, W = c.shape; th, tw = H // T, W // T
            nt = trema[:th * T, :tw * T].reshape(th, T, tw, T).sum(axis=(1, 3)); nd = det[:th * T, :tw * T].reshape(th, T, tw, T).sum(axis=(1, 3))
            tas = (nd > 20) & (nt > 0.10 * np.maximum(nd, 1))
            q = tas.mean(); quote.append(q); mappe_t.append(tas)
            if q > peggio[0] or peggio[2] is None: peggio = (q, j, tas)
            F.pop(j - 1, None)
        if not quote: continue
        Q = np.array(quote); M = np.array(mappe_t)
        pers = 0.0   # quota del quadro dove lo STESSO tassello trema in 4+ fotogrammi su 5 (il tremolio di un dettaglio fermo dura; ciò che si muove cambia posto)
        if len(M) >= 5: C = np.apply_along_axis(lambda x: np.convolve(x, np.ones(5), 'valid').max(), 0, M.astype(float)); pers = (C >= 4).mean()
        SL = np.array(salti); js = int(np.argmax(SL))
        riga = f"{s / fps:6.2f}-{e / fps:6.2f} s  trema in media {100 * Q.mean():.2f}% del quadro, peggio {100 * Q.max():.2f}% a {peggio[1] / fps:.2f} s, fisso {100 * pers:.2f}%, salto di luce {100 * SL.max():.1f}% a {(s + 1 + js) / fps:.2f} s"
        righe.append(riga)
        if SL.max() > 0.03: problemi.append(f"SALTO_DI_LUCE {s / fps:.2f}-{e / fps:.2f} s: {100 * SL.max():.1f}% del quadro cambia luce di colpo a {(s + 1 + js) / fps:.2f} s")
        if Q.mean() > 0.003 or Q.max() > 0.02 or pers > 0.005:
            ys, xs = np.nonzero(peggio[2]); cz = zona(xs.mean() / peggio[2].shape[1], ys.mean() / peggio[2].shape[0]) if len(xs) else ''
            problemi.append(f"TREMOLIO {s / fps:.2f}-{e / fps:.2f} s: {100 * Q.mean():.2f}% in media, {100 * Q.max():.2f}% a {peggio[1] / fps:.2f} s ({cz})")
            if mappe:
                im = cv2.imread(fs[peggio[1]]); ov = cv2.resize(peggio[2].astype(np.uint8) * 255, (im.shape[1], im.shape[0]), interpolation=cv2.INTER_NEAREST)
                im[ov > 0] = (0.45 * im[ov > 0] + 0.55 * np.array([40, 40, 255])).astype(np.uint8)
                cv2.imwrite(os.path.join(mappe, f"tremolio_{peggio[1] / fps:06.2f}s.jpg"), cv2.resize(im, (540, 960)))
    print('\n'.join(righe))
    print(('\n'.join(problemi)) if problemi else 'tremolio: nessun problema')
    sys.exit(1 if problemi else 0)

if __name__ == '__main__': main()
