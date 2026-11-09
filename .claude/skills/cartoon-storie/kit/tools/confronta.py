# Affiancati, sovrapposti al 50% e mappa delle differenze. Uso: python3 confronta.py rif.png render.png prefisso
import sys
from PIL import Image, ImageChops, ImageOps
ref = Image.open(sys.argv[1]).convert('RGB'); me = Image.open(sys.argv[2]).convert('RGB'); out = sys.argv[3]
side = Image.new('RGB', (ref.width * 2, ref.height)); side.paste(ref, (0, 0)); side.paste(me, (ref.width, 0))
side.resize((ref.width, ref.height // 2)).save(out + '_affiancati.png')
Image.blend(ref, me, .5).resize((ref.width // 2, ref.height // 2)).save(out + '_sovrapposti.png')
diff = ImageOps.autocontrast(ImageChops.difference(ref, me).convert('L'))
ImageOps.colorize(diff, '#000000', '#ff3030', '#ffff60').resize((ref.width // 2, ref.height // 2)).save(out + '_differenze.png')
