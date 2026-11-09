#!/bin/bash
# render parallelo a mezza risoluzione, poi audio + karaoke + MP4
cd /tmp/claude-0/-home-user-cartoon-kit/2bd09bc3-b9bc-5f62-9d4d-95e36f5a87d9/scratchpad/skill/kit
W=out/petrov_1983; rm -rf $W/frames
python3 -c "
from pathlib import Path; from engine import film
film.build_timeline(Path('stories/petrov_1983.json').resolve(), Path('$W').resolve(), False)" > $W/../render_all.log 2>&1
N=$(python3 -c "import json;print(json.load(open('$W/timeline.json'))['frames'])")
Q=$(( (N + 3) / 4 ))
cd ../engine3d
for k in 0 1 2 3; do a=$(( k*Q )); b=$(( (k+1)*Q - 1 )); [ $b -ge $N ] && b=$(( N-1 ))
  RES_SCALE=0.5 RESUME=1 KIT=/tmp/claude-0/-home-user-cartoon-kit/2bd09bc3-b9bc-5f62-9d4d-95e36f5a87d9/scratchpad/asset-kit node render.mjs ../kit/$W ../kit/$W/frames $a-$b > ../kit/out/part$k.log 2>&1 &
done; wait
cd ../kit; RES_SCALE=0.5 python3 -m engine.film stories/petrov_1983.json >> out/render_all.log 2>&1
echo FINITO >> out/render_all.log
