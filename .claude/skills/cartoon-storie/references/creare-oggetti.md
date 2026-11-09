# Oggetto mancante: si crea, non si salta

Se la voce nomina qualcosa che deve vedersi (elicottero, parmigiano, telefono, porta, teglia…) e la libreria non ce l'ha, **la skill lo crea prima del video**. Saltarlo o sostituirlo con qualcos'altro senza dirlo è un errore.

## 1. Cerca (sempre per primo)
`python kit/tools/search_library.py elicottero helicopter` cerca in: oggetti 2D (`library/manifest.json`), oggetti 3D costruiti (`library/oggetti3d/*.json`), modelli Kenney CC0 (`library/modelli3d/`). Prova anche il nome inglese e un sinonimo.

## 1b. Prima i modelli veri
Un oggetto costruito con forme semplici è l'ultima risorsa: un macinapepe fatto di due sfere o una carbonara fatta di dischi impilati non si riconoscono (successo nel test «carbonara»). Cerca prima nel kit Poly Haven e nei modelli Kenney (cibo e cucina hanno nomi inglesi: `plate-dinner`, `plate-deep`, `bowl`, `utensil-fork`, `cooking-fork`, `pepper-mill`, `shaker-pepper`, `carton` (panna, latte), `egg`, `frying-pan`, `pot`, `cheese`, `bacon`…). Se costruisci, guarda l'oggetto in un'inquadratura di dettaglio nell'anteprima: deve riconoscersi senza leggere la didascalia. Gli oggetti non devono compenetrarsi (panna e pepe nello stesso punto).

## 1c. Cercare fuori dal kit
Se kit e Kenney non hanno l'oggetto (es. un piatto di pasta), cerca su Poly Pizza (poly.pizza, modelli low poly CC0 e CC-BY: il file .glb è su static.poly.pizza) e verifica la licenza nella pagina del modello. Se è CC-BY, aggiungi l'autore in `crediti` nella storia e nella descrizione del video. Salva il modello in `asset-kit/modelli/<nome>/<nome>.glb` con un `LICENZA.txt` e aggiungilo a `asset-kit/indice.json` (nome, tag italiani e inglesi, licenza). Esempio: `spaghetti_bowl` (Jarlan Perez, CC-BY).

## 1d. Oggetti che si aprono
Ante, sportelli e coperchi: nei `parts` assegna `"gruppo": "anta"` ai pezzi mobili e definisci `"cerniere": {"anta": {"at": [x, y, z], "asse": "y"}}`; nella battuta `{"id": "frigo", "at": "parola", "open": "anta"}` (`angle` in gradi, `dur` in secondi; `close` per richiudere). Esempio completo: `library/oggetti3d/frigo_anni60.json` (ripiani a y 0.55, 0.92, 1.3: lì vanno uova, latte, panna).

## 2. Se manca, scegli come crearlo
- **Veicoli, macchine, oggetti grandi o che si muovono nello spazio** (elicottero, auto, barca, carrello, forma di formaggio, mobili particolari) → **oggetto 3D da forme semplici**: file `library/oggetti3d/<nome>.json`.
- **Oggetti piatti o pieni di dettagli disegnati** (insegne, quadri, giornali, cartelli, cibo visto di fronte) → **disegno 2D**: funzione skia in `kit/engine/` (stile di `kitchen2d.py`: contorno `INK`, gradiente morbido, ombra) registrata in `PROPS`, più la voce in `library/manifest.json`.

## 3. Oggetto 3D da forme semplici (formato)
```json
{"nome": "...", "tag": ["...", "..."], "altezza_m": 2.4,
 "parts": [
  {"shape": "sphere", "r": 0.9, "scale": [1.55, 1, 1], "at": [0, 1.2, 0], "color": "#D94040"},
  {"shape": "box", "size": [5.2, 0.05, 0.2], "at": [0, 2.42, 0], "color": "#3A3A42", "spin": ["y", 4]},
  {"shape": "cyl", "r": 0.13, "r_top": 0.08, "h": 2.3, "rot": [0, 0, 90], "at": [-2, 1.4, 0], "color": "#D94040"}]}
```
- Forme: `box` (`size` [l, a, p]), `cyl` (`r`, `r_top`, `h`), `cone` (`r`, `h`), `sphere` (`r`), `torus` (`r`, `tube`). `at` in metri dal punto a terra dell'oggetto, `rot` in gradi, `scale` per deformare.
- `spin: [asse, giri al secondo]` fa girare un pezzo (rotori, ruote, ventilatori).
- Misure reali in metri; muso o fronte verso +x per i veicoli, verso +z per i mobili.
- Colori pieni e saturi; il motore aggiunge contorno scuro e ombreggiatura cartoon.
- 10-25 pezzi bastano: silhouette riconoscibile prima dei dettagli.
- Esempi: `library/oggetti3d/elicottero.json`, `library/oggetti3d/forma_parmigiano.json`.

## 4. Usarlo nella scena
- Nel luogo: `{"id": "elicottero", "m": "elicottero", "at": [0, 4.5, -2], "ry": 0, "hidden": true}`.
- Appeso o portato da un altro oggetto: `{"id": "formaggio", "m": "forma_parmigiano", "parent": "elicottero", "at": [0, -1.75, 0]}` (si muove con lui).
- Arriva in volo su una parola: `"do": [{"id": "elicottero", "at": "arriva", "show": true, "from": [-9, 8, -5], "dur": 45}]`.
- La camera lo segue: `{"preset": "wide", "on": "elicottero", "at": "elicottero"}`.

## 5. Controlla e salva
Guardalo nell'anteprima (un frame vicino). Se non si riconosce, correggi la silhouette, non i dettagli. Resta in libreria per i video successivi: aggiungi `nome` e `tag` italiani perché `search_library.py` lo trovi.
