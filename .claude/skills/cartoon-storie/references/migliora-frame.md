# Migliora frame: tarare, rifinire e cercare ciò che manca

Principio: **non stimare, misura.** Ogni valore di luce e colore nasce da un campione del riferimento, ogni modifica si giudica con un numero e con un'immagine affiancata. A occhio si sbaglia: in un test una plancia che sembrava "grigia" era #181d23, e schiarirla aveva peggiorato tutto. Esempio completo del metodo, con 30 iterazioni documentate: `esempi/frame-autostrada/` nel repository del kit (`CAMBIAMENTI.md`).

Questa parte della skill serve in tre casi:
1. l'utente porta un **video o un fotogramma da raggiungere** ("voglio questa luce", un contact sheet di un altro canale) → **taratura** (§1-3);
2. il video è pronto ma la luce sembra "da videogioco" → **rendering a passaggi** (§4);
3. un oggetto nominato non c'è nel kit né nella libreria → **ricerca del modello** (§6), poi impostori se è pesante (§5).

## Strumenti (`kit/tools/`)
| Strumento | Cosa fa |
|---|---|
| `ritaglia.py shot.jpg rif.png [--top --bottom]` | trova da solo l'area del video nello screenshot del telefono e la porta a 1080×1920. **Controlla le righe che stampa**: una barra di avanzamento può spostare il bordo di qualche pixel |
| `griglia.py img out [passo] [x0 y0 x1 y1]` | griglia numerata per leggere le coordinate |
| `campiona.py rif render x,y …` | confronta i colori in punti precisi (media 9×9): "troppo chiaro / scuro / tinta diversa" |
| `taratura.py storia.json FRAME rif.png ETICHETTA [--passaggi N] [--config]` | rende **un solo fotogramma** della storia, lo confronta e aggiunge una riga a `out/<storia>/taratura/log.csv` |
| `confronta.py rif render prefisso` | immagini affiancate, sovrapposte al 50% e mappa delle differenze |
| `metrica.py rif render [--config] [--log] [--etichetta]` | differenza media per zona (0-255, più basso = più simile) + **celle peggiori con causa probabile** (colore/luce oppure forma/posizione) |
| `misura.mjs punti.json` | camera dal punto di fuga e pixel → metri (esempio: `misura_punti_esempio.json`). Per rifare un'inquadratura precisa con `"camera": {"keys": …}` |
| `tinta.py src dst R G B k` | porta una texture PBR al colore medio campionato mantenendo il dettaglio |
| `colore_impostori.py $KIT/impostori R G B` | porta il colore delle foto degli alberi al verde campionato |
| `engine3d/bake.mjs nomi` | fotografa modelli del kit da 3 lati → `$KIT/impostori/` (§5) |
| `misura_luce.py` (già esistente) | valori assoluti (mediana, saturazione, bruciati): resta il controllo finale di ogni video |

`metrica_config_esempio.json` mostra come escludere l'interfaccia dell'app (titolo, pulsanti, nome del canale) e come definire le zone.

## 1. Prepara il riferimento
- Un fotogramma **per tipo di luce** (giorno, notte esterna, interno caldo…), non uno per ogni inquadratura: si tarano i preset, che poi valgono per tutti i video.
- `ritaglia.py`, poi `griglia.py` sul frame intero e sugli zoom importanti. Maschera l'interfaccia dell'app nel config: non si ricostruisce e non si misura.
- Campiona 20-40 punti: cielo alto e basso, suolo al sole e in ombra, pareti, vegetazione, pelle e vestiti delle sagome, superfici lucide.

## 2. Taratura del look (il motore resta lo stesso)
Il look è **ACES con esposizione per preset** (`engine3d/web/look.js`, tabella in `luce-colore.md`). Non cambiare il tone mapping: si tarano i valori del preset.
1. Scrivi una storia minima di prova (1 battuta, il luogo e la luce da tarare, una camera simile al riferimento; `"camera": {"keys": …}` per un'inquadratura precisa) e scegli il fotogramma.
2. `python kit/tools/taratura.py prova.json FRAME rif.png it01 --config cfg.json`
3. Leggi le celle peggiori:
   - **colore/luce**: `campiona.py` nei punti della cella, poi correggi in quest'ordine, **una cosa per giro**: esposizione → luci del preset (`BASE`: sole, emisfera, ambiente, nebbia) → saturazione/contrasto/tinta → luminosità delle sagome (`card`);
   - **forma/posizione**: è la scena, non il look. Correggi camera, oggetti e luogo nella storia, non il preset.
4. Tieni la modifica se la zona migliora. Se peggiora, torna indietro, salvo un miglioramento evidente di forme o penombre (scrivilo nel log con il motivo).
5. Fermati quando 3 giri di fila migliorano meno di 0,3 punti.
6. Salva il preset tarato in `look.js` (un nome nuovo se è un look diverso, es. `notte_neon`) e una riga nella tabella di `luce-colore.md` con il riferimento usato. Poi `misura_luce.py`: il risultato deve restare nei valori obiettivo.

## 3. Ciclo di correzione: errori già incontrati
- Un materiale con `vertexColors: true` su una geometria senza attributo `color` diventa nero.
- Un `ExtrudeGeometry` ruotato di 180° estrude verso −z: l'oggetto finisce a chilometri.
- Una tinta applicata anche ai riflessi dell'ambiente rende viola le superfici al sole.
- Vetro e carrozzeria coincidenti danno z-fighting: sposta di qualche cm e taglia.
- `script.py | head` interrompe lo script a metà: le ricolorazioni restano parziali.
- I riflessi aggiunti su una base dal colore sbagliato non sembrano mai veri: prima la base (campioni a griglia), poi i riflessi.

## 4. Rendering a passaggi (qualità "alla Blender", senza Blender)
Ogni fotogramma è la media di N render. In ognuno, con sequenze deterministiche:
- il sole si sposta in un disco di ~1,5° (penombre morbide);
- una **luce di cielo con ombre** arriva da una direzione casuale della volta e prende l'80% della luce ambiente (occlusione e ombre di contatto **vere**, dalle ombre: niente aloni, quindi la regola "niente AO in screen-space" resta rispettata);
- la camera si sposta di frazioni di pixel (bordi puliti).

Uso:
- nella storia: `"qualita": {"passaggi": 16}` → solo il **video finale**; l'anteprima resta veloce. I fotogrammi vanno in `out/<nome>/frames_q16/`;
- a mano: `PASSAGGI=16 node render.mjs …`.

Regole:
- **Test di controllo** dopo ogni modifica al codice: `PASSAGGI=1 CIELO=0` deve dare **gli stessi pixel** del render normale. Provato: differenza 0. Se non torna, non tarare nulla finché non torna.
- La media si fa sui pixel finali (`readPixels`). Un buffer float intermedio ha dato colori sbagliati.
- La luminosità resta uguale (mediana 0,73 → 0,72 in cucina): i preset tarati restano validi.
- Tempi misurati su un server con 4 core senza GPU: ~7 s a fotogramma normale, ~69 s con 16 passaggi. Su un Mac con GPU (0,03 s a fotogramma) 16 passaggi restano sotto il secondo.
- Quando conviene: video finale, inquadrature ferme, oggetti appoggiati (si vede il contatto), luce radente. Non serve nelle anteprime.

## 5. Impostori: oggetti veri e pesanti, ripetuti molte volte
Alberi e piante del kit pesano 40-100 MB l'uno: centinaia di copie non si possono istanziare. Allora:
1. `cd engine3d && KIT=… node bake.mjs island_tree_01,island_tree_02,tree_small_02 --sole x,y,z` → 3 foto per modello con lo stesso sole della scena, in `$KIT/impostori/` (+ `meta.json` con lato e altezza in metri).
2. `python kit/tools/colore_impostori.py $KIT/impostori R G B` con il verde campionato nel riferimento. Moltiplica i canali: alzare solo la luminosità lascia il verde oliva.
3. In scena: `THREE.Sprite` con `center (0.5, 0)`, `alphaTest`, nebbia attiva. Altezze ricavate dalla linea delle cime nel riferimento.

È la via 4 della scala della libreria ("3D → sprite"), verificata.

## 6. Oggetto mancante: cercalo ogni volta, prima di costruirlo
Se la voce o il riferimento mostrano un oggetto importante (auto, mezzo, animale, mobile…) che non c'è:
1. **Kit su GitHub e libreria**: `kit/tools/search_library.py <parole>` (kit = release di `pietroch22-byte/cartoon-kit`, `indice.json`; libreria = `library/`).
2. **Web, modelli glTF/GLB con licenza**, in quest'ordine:
   - Poly Haven (CC0);
   - Kenney (CC0);
   - Quaternius (CC0);
   - KayKit (CC0, non rivendere i file);
   - Khronos glTF-Sample-Assets (licenza per modello in `metadata.json`);
   - Poly Pizza (CC0/CC-BY, API con chiave);
   - Sketchfab ("downloadable" + licenza CC);
   - GitHub: `gh api -X GET search/code -f q='filename:<nome>.glb'`.
3. **Licenza obbligatoria**: solo CC0, CC-BY (con attribuzione) o licenze che permettono l'uso. Senza licenza dichiarata **non si usa**, anche se è bello. Registra fonte, autore, licenza e URL nel manifest (`libreria-oggetti.md`).
4. **Valuta prima di adottare**: anteprima con la luce della scena e l'angolo dell'inquadratura. Adottalo solo se è migliore di ciò che c'è già (in un test il Kenney Car Kit era peggio dell'auto costruita).
5. **Limiti dell'ambiente**: se un sito non risponde (host bloccato dalla rete) o un file su GitHub è un puntatore Git LFS da ~130 byte, dillo all'utente. Va aggiunto l'host alle impostazioni di rete, oppure l'utente scarica il modello e lo carica nella release del kit.
6. Proponi di **aggiungere al kit** ogni modello buono trovato: la volta dopo si trova al passo 1.
7. Solo se non c'è niente: costruiscilo (`creare-oggetti.md`) o, come **ultima via**, IA (`libreria-oggetti.md` via 5), sempre segnalata all'utente.

## 7. Documenta
Per ogni taratura o rifinitura importante scrivi in `out/<nome>/taratura/NOTE.md`:
- prima/dopo affiancati (solo i tuoi render, mai lo screenshot del riferimento nel repository);
- la tabella della metrica per iterazione (da `log.csv`), **comprese quelle peggiorate**, con il motivo;
- i valori finali del preset.

I preset tarati vanno nella tabella di `luce-colore.md` e nell'HANDOFF.
