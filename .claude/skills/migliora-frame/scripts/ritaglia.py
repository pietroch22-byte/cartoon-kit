# Ritaglia lo screenshot di un telefono all'area del video e lo porta a 1080x1920 (9:16).
# Uso: python3 ritaglia.py screenshot.jpg riferimento.png [--top Y --bottom Y]
# Senza --top/--bottom trova da solo la fascia di righe non nere più lunga (il video).
import sys, argparse, numpy as np
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('dst'); ap.add_argument('--top', type=int); ap.add_argument('--bottom', type=int)
ap.add_argument('--w', type=int, default=1080); ap.add_argument('--h', type=int, default=1920); a = ap.parse_args()
im = Image.open(a.src).convert('RGB'); arr = np.asarray(im).astype(np.float32)
if a.top is None or a.bottom is None:
    dark = (arr.mean((1, 2)) < 24) & (arr.std(1).mean(1) < 4)   # righe scure E uniformi (barre del telefono), non le zone scure del video
    best, cur, start = (0, 0), 0, 0
    for y, d in enumerate(list(dark) + [True]):
        if not d: cur, start = (cur + 1, start) if cur else (1, y)
        elif cur:
            if cur > best[1] - best[0]: best = (start, start + cur)
            cur = 0
    top, bottom = best
else: top, bottom = a.top, a.bottom
vid = im.crop((0, top, im.width, bottom)); s = a.h / vid.height; vw = round(vid.width * s)
vid = vid.resize((vw, a.h), Image.LANCZOS); out = Image.new('RGB', (a.w, a.h)); off = (a.w - vw) // 2
out.paste(vid, (off, 0)); out.save(a.dst)
print(f'video tra y={top} e y={bottom} | scala {s:.4f} | bande laterali {max(off,0)} px | -> {a.dst}')
