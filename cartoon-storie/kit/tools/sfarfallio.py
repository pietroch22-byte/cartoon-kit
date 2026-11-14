"""Misura lo sfarfallio (flickering) dei fotogrammi di una storia «disegnato» e dice dove sta.
Uso: python3 kit/tools/sfarfallio.py out/<nome>/fotogrammi [out/<nome>/storia_risolta.json]
Per ogni scena: movimento medio, sfarfallio (differenza seconda tra 3 fotogrammi: un tremolio che va avanti e indietro) e il fotogramma peggiore.
Il numero è RELATIVO: serve a confrontare prima e dopo una modifica (deve scendere), non ha una soglia assoluta. Con contorni sottili in movimento sta intorno a 70-80 %. I tagli tra luoghi si scartano da soli."""
import sys, glob, json, os
import numpy as np
from PIL import Image
d = sys.argv[1]; fs = sorted(glob.glob(os.path.join(d, 'f*.jpg')))
A = [np.asarray(Image.open(f).convert('L').resize((270, 480)), dtype=np.float32) for f in fs]
cut = [0, len(A)]
sj = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(d.rstrip('/')), 'storia_risolta.json')
if os.path.exists(sj):
    S = json.load(open(sj)); fps = S.get('fps', 30); cut = sorted({0, len(A)} | {int(round(s['da'] * fps)) for s in S['scene']})
for s, e in zip(cut, cut[1:]):
    if e - s < 4: continue
    mov = np.mean([np.abs(A[i + 1] - A[i]).mean() for i in range(s, e - 1)])
    sf = [np.abs(A[i - 1] - 2 * A[i] + A[i + 1]).mean() / 2 for i in range(s + 2, e - 2)]
    print(f'fotogrammi {s}-{e}: movimento {mov:.2f}  sfarfallio {np.mean(sf):.2f} ({100 * np.mean(sf) / max(mov, 1e-6):.0f} %)  peggiore a f{s + 2 + int(np.argmax(sf))} ({max(sf):.1f})')
