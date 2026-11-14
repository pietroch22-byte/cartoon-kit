# Libreria preset «disegnato»

Modelli e texture riusabili per i cartoni (skill cartoon-storie, motore «disegnato»). Niente va perso: tutto è qui.

- `modelli/*.glb` – i modelli pronti per il motore (texture incluse). Fronte verso -z nel motore, misure in metri, base a terra.
- `modelli/libreria_preset.blend` – il file Blender sorgente con tutti i modelli (aprilo per ritoccare a mano).
- `texture/<nome>/` – texture CC0 Poly Haven: `_diff` originale, `_disegnato` adattata allo stile, `_nor`, `_rough`. Licenze in `texture/LICENZE.txt`.
- `anteprime/*.png` + `catalogo.jpg` – come appare ogni modello.
- `catalogo.json` – elenco con descrizione, tag, misure.
- `script/costruisci_preset.py` – rigenera tutto: `/Applications/Blender.app/Contents/MacOS/Blender -b -P script/costruisci_preset.py -- "<questa cartella>"`.
  Per aggiungere un oggetto: scrivi una funzione con `@preset(nome, descrizione, tag)` e rilancia.

Uso in una storia: la cartella è collegata a `kit/stories/preset`; nello script del luogo
`const { GLTFLoader } = await import('/lib/jsm/loaders/GLTFLoader.js')` e carica `/scena/preset/modelli/<nome>.glb`
(esempio completo: `kit/stories/zia_interno.js`, funzione `metti`).
