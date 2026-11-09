#!/usr/bin/env bash
# Un giro del ciclo: render -> confronto -> metrica -> log. Uso:
#   itera.sh <cartella_scena> <riferimento.png> <etichetta> [pagina=index.html] [config.json]
# Scrive in <cartella_scena>/iterazioni/: <etichetta>.png, _affiancati, _sovrapposti, _differenze, e aggiunge una riga a log.csv
set -euo pipefail
K="$(cd "$(dirname "$0")" && pwd)"; DIR="$(cd "$1" && pwd)"; REF="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"; TAG=$3; PAGE=${4:-index.html}; CFG=${5:-}
mkdir -p "$DIR/iterazioni"; OUT="$DIR/iterazioni/$TAG"
(cd "$DIR" && node "$K/render.mjs" "$DIR" "$PAGE" "$OUT.png")
python3 "$K/confronta.py" "$REF" "$OUT.png" "$OUT"
python3 "$K/metrica.py" "$REF" "$OUT.png" ${CFG:+--config "$CFG"} --log "$DIR/iterazioni/log.csv" --etichetta "$TAG"
echo "--- storico"; python3 -c "import csv,sys; [print('  '.join(f'{c:>14}' for c in r)) for r in list(csv.reader(open(sys.argv[1])))[-8:]]" "$DIR/iterazioni/log.csv"
