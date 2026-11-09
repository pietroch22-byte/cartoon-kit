# Confronta i colori di riferimento e render in punti precisi (media 9x9). Uso: python3 campiona.py rif.png render.png x,y [x,y ...]
import sys
from PIL import Image, ImageFilter
r = Image.open(sys.argv[1]).convert('RGB').filter(ImageFilter.BoxBlur(4)); m = Image.open(sys.argv[2]).convert('RGB').filter(ImageFilter.BoxBlur(4))
hx = lambda c: '#%02x%02x%02x' % c
for p in sys.argv[3:]:
    x, y = map(int, p.split(',')); a, b = r.getpixel((x, y)), m.getpixel((x, y))
    d = [b[i] - a[i] for i in range(3)]
    hint = 'ok' if max(map(abs, d)) < 12 else ('troppo chiaro' if sum(d) > 0 else 'troppo scuro') + (', tinta diversa' if max(d) - min(d) > 25 else '')
    print(f'({x},{y}) rif {hx(a)}  render {hx(b)}  diff {d}  -> {hint}')
