# Porta il colore medio delle foto degli alberi (impostori) al colore campionato nel riferimento (alfa intatta).
# Uso: python3 kit/tools/colore_impostori.py $KIT/impostori R G B   (scrive *_c.png accanto agli originali)
import sys, glob, numpy as np
from PIL import Image
d, T = sys.argv[1], np.array(list(map(float, sys.argv[2:5])), np.float32)
for f in sorted(glob.glob(f'{d}/*_[0-9].png')):
    a = np.asarray(Image.open(f).convert('RGBA')).astype(np.float32); m = a[..., 3] > 128; mean = a[m][:, :3].mean(0)
    a[..., :3] = np.clip(a[..., :3] * (T / mean), 0, 255); Image.fromarray(a.astype(np.uint8), 'RGBA').save(f.replace('.png', '_c.png'))
print('ricolorate', len(glob.glob(f'{d}/*_[0-9].png')), 'foto verso', T)
