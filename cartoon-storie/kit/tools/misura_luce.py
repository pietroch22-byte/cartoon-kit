"""Luce e colore per inquadratura: mediana, p5, p95 della luminanza, % di pixel bruciati, saturazione media.
Uso: python kit/tools/misura_luce.py cartella_frame [cartella_riferimento]
I frame sono file f00030.jpg (o .png). Confronta con i valori obiettivo di references/luce-colore.md."""
import sys, numpy as np
from pathlib import Path
from PIL import Image
def st(p):
    a = np.asarray(Image.open(p).convert("RGB")).astype(float) / 255
    y = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    return np.median(y), np.percentile(y, 5), np.percentile(y, 95), (mx > 0.98).mean() * 100, np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0).mean()
def frames(d):
    return {int(p.stem.lstrip("f")): p for p in sorted(Path(d).glob("f*.*")) if p.suffix in (".jpg", ".png")}
A = frames(sys.argv[1]); B = frames(sys.argv[2]) if len(sys.argv) > 2 else {}
step = max(1, len(A) // 20)
print("frame | mediana  p5   p95  bruciati%  saturazione" + ("  | riferimento" if B else ""))
for f in sorted(A)[::step]:
    m, a, b, c, s = st(A[f]); line = f"{f:5d} | {m:.2f}   {a:.2f}  {b:.2f}  {c:6.1f}     {s:.2f}"
    if f in B:
        m2, a2, b2, c2, s2 = st(B[f]); line += f"  | {m2:.2f} {a2:.2f} {b2:.2f} {c2:5.1f} {s2:.2f}"
    flags = []
    if m > 0.75: flags.append("TROPPO CHIARO")
    if s < 0.40 and m > 0.3: flags.append("SLAVATO")
    if c > 8: flags.append("BRUCIATO")
    if a < 0.02: flags.append("NERI CHIUSI")
    print(line + ("  <- " + ", ".join(flags) if flags else ""))
