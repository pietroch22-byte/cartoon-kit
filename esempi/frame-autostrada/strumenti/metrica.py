# Differenza media per pixel (0-255, più basso = più simile) tra il riferimento e uno o più render.
# Esclude l'interfaccia di YouTube sovrapposta al video e le bande laterali del ritaglio.
# Uso: python3 strumenti/metrica.py riferimento.png render1.png [render2.png ...]
import sys
from PIL import Image, ImageChops, ImageDraw, ImageStat
ref = Image.open(sys.argv[1]).convert('RGB')
mask = Image.new('L', ref.size, 255); d = ImageDraw.Draw(mask)
for box in [(0, 0, 1080, 250), (0, 0, 34, 1920), (1046, 0, 1080, 1920), (900, 960, 1080, 1920), (0, 1700, 1080, 1920)]: d.rectangle(box, fill=0)
regions = {'tutto': (0, 0, 1080, 1920), 'cielo+alberi': (34, 300, 1046, 540), 'strada+auto': (34, 520, 1046, 840), 'abitacolo': (34, 840, 1046, 1700)}
for f in sys.argv[2:]:
    diff = ImageChops.difference(ref, Image.open(f).convert('RGB')).convert('L')
    print(f.split('/')[-1].ljust(16), '  '.join(f"{n}={ImageStat.Stat(diff.crop(b), mask.crop(b)).mean[0]:.1f}" for n, b in regions.items()))
