#!/usr/bin/env bash
# Prepara gli asset reali (Poly Haven, CC0) dal kit: texture PBR, cielo HDR, foto degli alberi (impostori).
# Uso: ./prepara_asset.sh [cartella_con_gli_zip]   (senza argomento scarica gli zip dalla release v1)
set -euo pipefail
cd "$(dirname "$0")"
REL=https://github.com/pietroch22-byte/cartoon-kit/releases/download/v1
ZIPS=${1:-.kit-zip}; mkdir -p "$ZIPS" assets/proc
for z in kit-texture-cieli-indice kit-modelli-1 kit-modelli-2; do
  [ -f "$ZIPS/$z.zip" ] || curl -fL -o "$ZIPS/$z.zip" "$REL/$z.zip"
done
unzip -o -q "$ZIPS/kit-texture-cieli-indice.zip" 'texture/asphalt_02/*' 'texture/leafy_grass/*' 'texture/concrete_floor_painted/*' \
  'texture/fabric_pattern_07/*' 'hdri/kloofendal_48d_partly_cloudy_puresky.hdr' -d assets
unzip -o -q "$ZIPS/kit-modelli-1.zip" 'modelli/island_tree_01/*' 'modelli/island_tree_02/*' -d assets
unzip -o -q "$ZIPS/kit-modelli-2.zip" 'modelli/tree_small_02/*' -d assets
# diffuse ricolorate sui colori misurati nel riferimento (media RGB, contrasto)
T=assets/texture
python3 strumenti/tinta.py $T/asphalt_02/asphalt_02_diff.jpg assets/proc/asphalt.jpg 192 192 192 .7
python3 strumenti/tinta.py $T/leafy_grass/leafy_grass_diff.jpg assets/proc/grass.jpg 128 168 74 .9
python3 strumenti/tinta.py $T/concrete_floor_painted/concrete_floor_painted_diff.jpg assets/proc/concrete.jpg 226 225 222 .45
# foto degli alberi veri da 3 lati con la luce della scena, poi colore portato al verde misurato
node bake.mjs island_tree_01,island_tree_02,tree_small_02
python3 strumenti/colore_impostori.py > /dev/null
echo "asset pronti in assets/"
