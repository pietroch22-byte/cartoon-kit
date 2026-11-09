# Porta il colore medio del fogliame delle foto degli alberi al verde misurato (alfa intatta).
import glob, numpy as np
from PIL import Image
TARGET = np.array([82, 132, 92], np.float32)   # verde-acqua del riferimento, prima della foschia
for f in glob.glob('assets/impostori/*_[0-9].png'):
    a = np.asarray(Image.open(f).convert('RGBA')).astype(np.float32)
    m = a[..., 3] > 128; mean = a[m][:, :3].mean(0)
    a[..., :3] = np.clip(a[..., :3] * (TARGET / mean), 0, 255)
    Image.fromarray(a.astype(np.uint8), 'RGBA').save(f.replace('.png', '_c.png'))
    print(f.split('/')[-1], mean.round(), '->', TARGET)
