# Affianca e sovrappone un render al riferimento (1080x1920).
# Uso: python3 strumenti/confronta.py riferimento.png frame.png [prefisso_uscita]
import sys
from PIL import Image
ref = Image.open(sys.argv[1]).convert('RGB'); me = Image.open(sys.argv[2]).convert('RGB')
out = sys.argv[3] if len(sys.argv) > 3 else 'confronto'
side = Image.new('RGB', (2160, 1920)); side.paste(ref, (0, 0)); side.paste(me, (1080, 0))
side.resize((1080, 960)).save(out + '_affiancati.png')
Image.blend(ref, me, .5).resize((540, 960)).save(out + '_sovrapposti.png')
