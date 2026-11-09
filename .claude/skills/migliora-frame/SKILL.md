---
name: migliora-frame
description: Ricostruisce e migliora in automatico un frame three.js finché assomiglia a un frame di riferimento (screenshot di un video, Short, Reel). Misura il riferimento (punto di fuga, posizioni, colori), poi ripete il ciclo render → confronto → metrica → diagnosi → correzione e documenta ogni passo. Ha anche un pass di realismo con texture PBR, cielo HDR e alberi veri del cartoon-kit. Usala quando l'utente vuole un frame "uguale" a un'immagine, vuole migliorare la somiglianza o il realismo di una scena, o chiede di "migliorare in automatico".
---

# Migliora frame: dal riferimento al frame uguale, in automatico

Principio: **non stimare, misura.** Ogni posizione nasce da un pixel del riferimento, ogni colore da un campione, ogni modifica si giudica con un numero e con un'immagine affiancata. A occhio si sbaglia: nel caso di studio una plancia "grigia" era in realtà #181d23.

Strumenti in `scripts/` (Python con PIL/numpy; Node con `three` e `playwright` nella cartella della scena):

| Script | Cosa fa |
|---|---|
| `ritaglia.py shot.jpg rif.png [--top --bottom]` | trova da solo l'area del video nello screenshot del telefono e la porta a 1080×1920. **Controlla sempre** le righe che stampa |
| `griglia.py img out [passo] [x0 y0 x1 y1]` | griglia numerata per leggere le coordinate |
| `misura.mjs punti.json` | risolve la camera dal punto di fuga e trasforma i pixel in metri (suolo, quota nota, altezza sopra un punto, piano z) |
| `campiona.py rif render x,y …` | confronta i colori in punti precisi e dice "troppo chiaro / scuro / tinta diversa" |
| `render.mjs dir pagina out [sel]` | render headless; la pagina deve impostare `window.DONE = true` |
| `confronta.py rif render prefisso` | immagini affiancate, sovrapposte al 50% e mappa delle differenze |
| `metrica.py rif render [--config] [--log] [--etichetta]` | differenza media per zona + **celle peggiori con causa probabile** (colore/luce oppure forma/posizione) |
| `itera.sh dir rif etichetta [pagina] [config]` | un giro completo: render → confronto → metrica → riga in `iterazioni/log.csv` |
| `tinta.py src dst R G B k` | ricolora una diffusa PBR sul colore medio misurato mantenendo il dettaglio |
| `bake.html` + `bake.js` | fotografa modelli glTF da 3 lati con la luce della scena → "impostori" PNG |
| `colore_impostori.py dir R G B` | porta il colore delle foto degli alberi al verde campionato |

`config_esempio.json` mostra come escludere dalla metrica l'interfaccia dell'app (titolo, pulsanti, barre) e come definire le zone.

## Procedura

### 1. Prepara il riferimento
1. `python3 scripts/ritaglia.py screenshot.jpg riferimento.png`. Se l'app ha barre o una barra di avanzamento, verifica top/bottom e passali a mano. Tieni `riferimento.png` fuori da git.
2. Scrivi un `config.json` con le **maschere** sopra l'interfaccia sovrapposta (non fa parte del video, non va né ricostruita né misurata) e 3-4 zone di senso (cielo, soggetto, primo piano…).
3. `griglia.py` su tutto il frame e sugli zoom delle zone importanti; guarda anche i ritagli a piena risoluzione dello screenshot originale per i dettagli (personaggi, targhe, testi).

### 2. Misura
- **Punto di fuga**: prendi 2-3 punti su ciascuna di due linee parallele del suolo (corsie, bordi) e intersecale.
- **Altezza della camera**: misura la stessa linea in 3 punti con `misura.mjs`. Se le x non coincidono o un oggetto noto ha misure assurde (un'auto larga 1,36 m), cambia `altezza` finché tornano. Nel caso di studio la risposta era 1,8 m: un SUV, non un'auto bassa.
- **Posizioni**: piedi dei personaggi e base degli oggetti con `suolo`; altezze con `sopra`; oggetti lontani (cartelli, portali) con `profondita` scegliendo uno z plausibile.
- **Colori**: campiona 20-40 punti (cielo alto e basso, asfalto al sole e in ombra, vegetazione, vernici, vetri, superfici dell'abitacolo) con `campiona.py` usando lo stesso file come render, oppure con PIL.
- Annota tutto in una tabella "pixel → mondo": diventa la sezione Misure della documentazione.

### 3. Costruisci la scena in modo misurabile
- Camera `rotation.order='YXZ'`, risolta nella pagina dal punto di fuga (stesso ciclo di `misura.mjs`), con gli helper `atH/atZ` per **posizionare gli oggetti dai pixel**.
- `renderer.toneMapping = NoToneMapping`, così i colori si confrontano 1:1 con i campioni (ACES li sposta).
- Ciò che è solidale alla camera (abitacolo, HUD, cornici, crepe sul vetro) va **dipinto in coordinate schermo** su un canvas 1080×1920, in un passaggio separato dopo il mondo 3D. Gli oggetti 3D che devono stare sopra (volante) vanno in un **altro** passaggio: three disegna i trasparenti dopo gli opachi, qualunque sia il `renderOrder`.
- Testi sovrapposti (sottotitoli) in HTML, con la dimensione del font calcolata per riempire la larghezza misurata.

### 4. Ciclo automatico di miglioramento
Ripeti, numerando le iterazioni (`it01`, `it02`…):

1. `scripts/itera.sh <scena> riferimento.png itNN index.html config.json`
2. Leggi le **celle peggiori**:
   - *colore/luce* → `campiona.py` nei punti della cella, poi correggi materiale, luce, nebbia o colore dipinto verso il campione;
   - *forma/posizione* → guarda `_sovrapposti` e `_affiancati` di quella zona (ritaglia e affianca), poi correggi geometria o posizione rimisurando i pixel.
3. Applica **un gruppo di correzioni coerente per giro** (per esempio "luce" oppure "auto"), non tutto insieme: così sai cosa ha funzionato.
4. Decidi:
   - la metrica della zona migliora → tieni;
   - peggiora → torna indietro, a meno che l'immagine sia chiaramente più fedele (forme). Scrivilo nel log con il motivo;
   - "a occhio sembra meglio" non basta se il campione dice il contrario.
5. Fermati quando 3 giri di fila migliorano il totale di meno di 0,3, oppure quando resta solo ciò che richiede asset nuovi. Poi passa al realismo (sezione 5) o chiudi.

Errori già incontrati, da controllare subito:
- materiale con `vertexColors: true` su una geometria senza attributo `color` → nero;
- `ExtrudeGeometry` ruotato di 180° estrude verso −z → oggetto spostato di chilometri;
- tinta applicata anche ai riflessi dell'ambiente → superfici viola;
- vetro che coincide con la carrozzeria → z-fighting (sposta di qualche cm e taglia);
- `script.py | head` interrompe lo script a metà (pipe chiusa).

### 5. Pass di realismo (dopo la somiglianza)
Quando forme e colori tornano, le superfici sembrano ancora "plastilina". Allora:
1. **Texture PBR vere** dal cartoon-kit (`kit-texture-cieli-indice.zip`, Poly Haven CC0): diffusa + normal + ARM. Ricolora la diffusa con `tinta.py` sul colore **misurato** (contrasto 0,4-0,9) e tieni normali e rugosità originali. Ripetizioni a scala reale (asfalto: 1 ogni 3-4 m).
2. **Cielo HDR** del kit come `scene.environment`: i riflessi diventano veri. Abbassa `envMapIntensity` dove il riferimento non riflette (suolo 0,1; vernice 0,4-0,5; vetro scuro 0,1).
3. **Vegetazione vera con impostori**: i modelli del kit (`kit-modelli-*.zip`) pesano decine di MB, quindi non istanziarli. Copia `bake.html` e `bake.js` nella scena, fotografa i modelli con la stessa direzione del sole, ricolora con `colore_impostori.py` verso il verde campionato e usali come `Sprite` con `center (0.5, 0)` e `alphaTest`. Moltiplica i canali: alzare solo la luminosità lascia il verde oliva.
4. **Abitacolo e primo piano**: occlusione ambientale dipinta in moltiplica nei bordi e negli incavi, grana leggera (±7) sulle plastiche, riflessi sfocati del cielo sulle carrozzerie dipinte, normal map di tessuto sulla pelle.
5. **Riflessi reali sulle superfici dipinte** (abitacolo, HUD, personaggi 2D). Un disegno piatto non riflette nulla, quindi:
   - prima controlla la **base**: campiona il riferimento a griglia (per esempio 13 righe × 9 colonne con `campiona.py`) e ridipingi i colori sbagliati. I riflessi su una base sbagliata non sembrano mai veri;
   - dipingi con le stesse coordinate un **rilievo** in grigi (sporgenze chiare, incavi scuri, sfumato 2-3 px), un'**inclinazione** per zona (R,G = normale di base: le superfici che guardano in alto riflettono il cielo) e una mappa **rugosità (G) / metallo (B)**;
   - ricava la normal map (`reliefNormal` in `esempi/frame-autostrada/scene.js`) e aggiungi sopra il disegno uno strato `MeshPhysicalMaterial` con colore nero, `AdditiveBlending`, `scene.environment` HDR e un sole nella stessa direzione del mondo (`SUN_DIR.transformDirection(camera.matrixWorldInverse)` per ciò che è solidale alla camera). Il cromo ha colore chiaro e metallo 1;
   - intensità dell'ambiente intorno a **0,3**: a 1 l'HDR stende un velo chiaro su tutto;
   - sulle superfici **bianche** un riflesso sommato non si vede: aggiungi uno strato in `MultiplyBlending` (materiale bianco illuminato, `color` > 1 perché il lato al sole resti pieno, `alphaTest` sulla sagoma) che scurisce il lato in ombra. Così la testa di un personaggio 2D prende il volume di una sfera.
6. **Tutto il frame**: grana di pellicola (alfa ≈4/255) e vignettatura ≤12%, come ultimo passaggio. Di più peggiora sia la metrica sia l'aspetto.
7. Verifica con il ciclo: la zona dove hai messo asset veri deve migliorare. Il resto può peggiorare di 1-2 punti perché il riferimento compresso è più liscio. Dichiaralo come scambio voluto.

### 6. Rendering a passaggi (qualità "alla Blender" senza Blender)
Quando la luce sembra "da videogioco" (ombre nette, niente occlusione, bordi a scalette), renderizza lo stesso frame N volte e fai la media. Implementazione di riferimento: `progressive()` in `esempi/frame-autostrada/scene.js`, attivo con `?passaggi=N`.
- A ogni passaggio, con sequenze di Halton deterministiche: sole spostato in un disco di ~1,5° (penombre); **luce di cielo con ombre** da una direzione casuale della volta (distribuzione coseno), che sostituisce quasi tutta la luce ambiente piatta (emisfera ≈0,05, IBL del suolo ≈0,03); camera spostata di frazioni di pixel con `setViewOffset` (anti-aliasing).
- **Colore della luce di cielo = colore delle ombre del riferimento**: con #3a66ff le ombre blu escono da sole, senza tinte finte.
- **La media va fatta sui pixel finali** (`readPixels` dopo la catena normale), non in un buffer float intermedio: quest'ultimo ha dato colori sbagliati.
- **Test di controllo obbligatorio**: 1 passaggio con le stesse luci del render normale deve dare gli stessi pixel (entro 1-2 livelli). Se non torna, la catena di accumulo è sbagliata: non tarare le luci finché il test non passa.
- Tempi su un server da 4 core senza GPU: ~2,7 s a passaggio a 1080×1920. Usa 1 passaggio per le iterazioni e 16-32 per il risultato finale.

### 7. Modelli 3D mancanti: cercali ogni volta
Se il riferimento contiene un oggetto importante (auto, mezzo, edificio, mobile, animale…) che la libreria non ha, **non costruirlo con scatole prima di aver cercato un modello vero**:
1. **Prima la libreria collegata alla skill**: la release GitHub del cartoon-kit (`pietroch22-byte/cartoon-kit`, release v1). Consulta `indice.json` (dentro `kit-texture-cieli-indice.zip`) cercando nei campi `categorie` e `tag`.
2. **Se non c'è, cerca sul web** un modello glTF/GLB, in quest'ordine: Poly Haven (CC0), Kenney (CC0), Quaternius (CC0), Khronos glTF-Sample-Assets (CC0/CC-BY, licenza per modello in `metadata.json`), Poly Pizza, Sketchfab con filtro "downloadable" + licenza CC, GitHub (`gh api -X GET search/code -f q='filename:<nome>.glb'`).
3. **Licenza obbligatoria**: usa solo CC0, CC-BY (con attribuzione) o licenze che permettono l'uso. Un modello senza licenza dichiarata **non si usa**, anche se è bello. Annota fonte, autore e licenza in `CREDITI.md` nella cartella della scena.
4. **Valuta prima di adottare**: renderizza un'anteprima con la luce della scena (da dietro 3/4, come nel frame). Adottalo solo se è più vicino al riferimento di ciò che hai già.
5. **Limiti dell'ambiente**: se un sito non risponde (host bloccato) o i file su GitHub sono puntatori Git LFS da ~130 byte, dillo all'utente. Va aggiunto l'host alle impostazioni di rete, oppure l'utente scarica il modello e lo carica nella release del kit: così la volta successiva la skill lo trova al passo 1.
6. Proponi all'utente di **aggiungere al kit** ogni modello buono trovato, per arricchire la libreria.

### 8. Documenta (sempre)
Scrivi o aggiorna `CAMBIAMENTI.md` nella cartella della scena con:
- immagine prima/dopo affiancata (solo i tuoi render: lo screenshot del riferimento non va nel repository);
- tabella della metrica per versione;
- metodo e tabella delle misure;
- tabelle "prima → dopo → perché" per zona;
- cronologia delle iterazioni dal `log.csv` (cosa è cambiato, numero, nota), **comprese quelle peggiorate** e come le hai corrette;
- errori tecnici trovati;
- cosa resta diverso, detto onestamente.

Salva le iterazioni ridotte (540×960 jpg) in `confronto/iterazioni/`.

## Regole
- L'interfaccia dell'app (titolo, pulsanti, nome del canale) non si ricostruisce: si maschera.
- Testi, personaggi e marchi copiati dal riferimento servono solo allo studio. Per pubblicare, ricorda all'utente di usare i suoi.
- Niente AI generativa: solo codice, misure e asset CC0 del kit.
- Esempio completo di tutto il processo: `esempi/frame-autostrada/` (v1 → v2 → v3, con `CAMBIAMENTI.md`).
