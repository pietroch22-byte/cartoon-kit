# Porta la diffusa PBR al colore medio misurato nel riferimento mantenendo il dettaglio.
import sys, numpy as np
from PIL import Image
src, dst, r, g, b, k = sys.argv[1], sys.argv[2], *map(float, sys.argv[3:7])
a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
m = a.reshape(-1, 3).mean(0)
out = np.clip(np.array([r, g, b]) + (a - m) * k, 0, 255).astype(np.uint8)
Image.fromarray(out).save(dst, quality=92)
print(dst, m.round(), '->', (r, g, b))
