# Libreria oggetti: riusare prima di ricreare

Principio: l'LLM COMPONE dalla libreria, GENERA solo ciò che manca, e ogni oggetto approvato torna in libreria (la libreria cresce a ogni video). Coerenza visiva = qualunque fonte passa per la stessa ricetta di stile.

## Scala di priorità (in ordine)
1. **Libreria** (`library/manifest.json`): cerca per id/tag. Match buono → usa.
2. **Disegno in codice** (come `kit/engine/props.py`): per oggetti semplici (15-30 righe skia). Stile identico, parametrico (colore, scala, stato). Aggiungi la funzione al dizionario `PROPS` e al checker.
3. **SVG CC0 + passata di stile automatica** (vedi sotto). Fonti: FreeSVG.org (tutto CC0), Openclipart (CC0), Public Domain Vectors, SVG Repo solo icone marcate CC0/MIT. EVITARE: OpenMoji (CC BY-SA, share-alike), Freepik/Vecteezy free (attribuzione), Twemoji (CC-BY).
4. **3D → sprite 2D**: modelli CC0 Kenney / Quaternius / KayKit (GLB) renderizzati una volta, vista frontale/3/4 ortografica, ombreggiatura piatta 2-3 toni + contorno → PNG/SVG in libreria. Poly Pizza ha API (chiave gratuita, filtro CC0). Per il mondo 3D la versione **verificata** sono gli impostori (`engine3d/bake.mjs`, `migliora-frame.md` §5): foto del modello con la luce della scena, ottime per alberi e oggetti pesanti ripetuti. Resta da testare la versione "disegnata" con contorno per le sagome.
4b. **Modello vero dal web, con licenza**: se manca nel kit e nella libreria, cerca un glTF/GLB (Poly Haven, Kenney, Quaternius, KayKit, Khronos, Poly Pizza, Sketchfab, GitHub) seguendo `migliora-frame.md` §6: licenza dichiarata obbligatoria, anteprima con la luce della scena, adottalo solo se è migliore, proponi di aggiungerlo al kit.
5. **IA** (ultima via, sempre segnalata all'utente) (Higgsfield generate_image, output SVG o PNG + remove_background) con immagine di riferimento dello stile: solo oggetti protagonisti complessi. Costa crediti.

## Ricetta di stile (da `kit/engine/draw.py` e `props.py`)
- Contorno: `INK #1E1E24`, spessore ~5-6 px a scala 1 (frame 1080x1920).
- Riempimenti: gradiente lineare morbido a 3 stop (scuro-chiaro-scuro o alto chiaro → basso scuro); `shade(hex,k)` per varianti.
- Ombra a terra: ovale nero 25% alpha, sfocato, largo quanto la base.
- Base dell'oggetto a (x,y) = punto a terra; oggetti a parete: y = centro/alto.
- Palette: definirne una NOSTRA (firma del canale) in `library/palette.json` (da creare).

## Passata di stile per SVG importati (da implementare: `tools/restyle_svg.py`)
1. Pulisci (rimuovi testo, gradienti esterni, filtri).
2. Mappa i colori al più vicino della palette.
3. Forza stroke = INK, spessore uniforme in proporzione alla scala.
4. Aggiungi gradiente morbido dall'alto + ombra a terra.
5. Normalizza il bounding box: base in basso al centro (ancora "floor").
6. Rasterizza o converti in path skia; salva in `library/svg/<id>.svg` + voce nel manifest.

## Schema manifest (una voce per oggetto)
```json
{"id":"frigorifero","nome":"frigorifero anni 60","tag":["cucina","frigo","casa"],
 "fonte":"codice|svg|sprite3d|ia","file":"library/svg/frigorifero.svg",
 "licenza":"CC0 (freesvg.org/…)","url_origine":"…","ancora":"floor|wall|water",
 "dimensione_tipica":{"w":260,"h":520},"varianti":{"colore":true,"stato":["aperto","chiuso"]},
 "approvato":true}
```
L'LLM legge solo il manifest, non tutti i file. Id stabili (servono a Studio per rendere cliccabile ogni oggetto). Registra sempre licenza e URL d'origine.

## Regola per l'LLM nel copione/scene
"Cerca nel manifest → se c'è usa → altrimenti segui la scala e segnala l'oggetto come NUOVO nel report all'utente."
