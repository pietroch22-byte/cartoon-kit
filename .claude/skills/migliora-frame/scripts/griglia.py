# Sovrappone una griglia numerata per leggere le coordinate dei pixel. Uso: python3 griglia.py img.png out.png [passo=50] [x0 y0 x1 y1]
import sys
from PIL import Image, ImageDraw
im = Image.open(sys.argv[1]).convert('RGB'); step = int(sys.argv[3]) if len(sys.argv) > 3 else 50
box = tuple(map(int, sys.argv[4:8])) if len(sys.argv) >= 8 else (0, 0, im.width, im.height)
c = im.crop(box); d = ImageDraw.Draw(c)
for y in range((box[1] // step + 1) * step - box[1], c.height, step): d.line([(0, y), (c.width, y)], fill=(255, 0, 255)); d.text((2, y + 1), str(y + box[1]), fill=(255, 0, 255))
for x in range((box[0] // step + 1) * step - box[0], c.width, step): d.line([(x, 0), (x, c.height)], fill=(0, 255, 255)); d.text((x + 1, 2), str(x + box[0]), fill=(0, 255, 255))
c.save(sys.argv[2])
