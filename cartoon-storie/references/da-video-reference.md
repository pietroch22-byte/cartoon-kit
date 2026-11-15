# Da Video Reference → Mondo di Rick (solo su richiesta esplicita)

> [!IMPORTANT]
> **Quando si usa questa guida**: **SOLO** quando l'utente invia o indica un video reference chiedendo esplicitamente di ricrearlo nel **Mondo di Rick** (stessi tagli, ritmo, testi, transizioni e musica, ma con i nostri personaggi, materiali e motore 3D/2D).
> In **tutti gli altri casi** (storie originali, idee da sviluppare, voce dell'utente da zero) vale invariato il flusso standard `SKILL.md` (`Flusso` 1-9).

Esempio canonico completato nel progetto: `kit/stories/ricerca_gettone/` (`ricerca_gettone.json`, `mondo_gettone.js`, `location_noir.js`, `grafica_montaggio.js`, `musica_originale.wav`).

---

## Principio generale (REA — Evidenza prima di scrivere codice)

Non si indovina mai a memoria cosa succede nel reference: prima si misurano fotogrammi, tagli, curve di camera e audio, si ispezionano contact sheet e filmstrip dense, poi si costruisce separando nettamente:

| Resta 1:1 dal reference | Si traduce nel Mondo di Rick (`engine3d`) |
|---|---|
| Durata totale e timestamp esatti di ogni taglio (`scene[].da`, `scene[].a`) | Cast Rick (`"personaggi": "rick"`, `"luce_rick": true`), archetipi `cast_rick.js` (es. `impiegato` → pelle `#ffffff` + cartellino `PN8`), `FACCE` e `ANDATURE` (`omino_rick.js`) |
| Ritmo camera (`zoom`, `pan`, curva `curva_riquadro`) | Set chiusi (`"esterno": false`, 4 muri + soffitto, `"asciutto": 1` negli interni), materiali opachi (`roughness >= 0.74`, `metalness <= 0.08`) |
| Gerarchia, posizionamento e tempi esatti di testi 2D cinetici, diagrammi e callout | Outline a inchiostro 3D di serie + `userData.card = true` (e `noInk` sul retro) su insegne/carte piane |
| Traccia musicale/ritmica estratta (`musica_originale.wav`) e sync sui beat | Illuminazione controllata (`luce_rick`, max 3 `PointLight` interne / 2 esterne) e sfocatura fisica (`"sfocatura": "vera"`, `"diaframma": 2.0`) |

---

## Fase 1 — Estrazione e analisi automatica (`da-reference`)

Lancia il comando unico dalla radice del progetto:

```bash
python3 kit/run.py da-reference "/percorso/assoluto/reference.mp4" <nome_storia>
```

Opzioni utili:
- `--asr --lang it`: se nel reference c'è parlato da trascrivere parola per parola (`words.json` tramite `kit/tools/asr_words.py`).
- `--solo-analisi`: produce solo analisi e contact sheet senza generare file JSON/JS di bozza.
- `--sovrascrivi`: rigenera anche `<nome>.json` e gli script JS nella cartella storia (di default è **non distruttivo**: se `<nome>.json` esiste già, scrive `<nome>_bozza_ref.json` e non tocca i `.js` già presenti).

Output creati in `kit/stories/<nome_storia>/`:
1. `reference_analisi/analisi_reference.json` — fps, durata, stacchi, flash/whip rilevati, velocità camera (`camera_misura.fit` in px/s su 1080×1920), `curva_riquadro.quota` stimata, luminanza/temperatura per shot, BPM e picchi beat vicini ai tagli.
2. `reference_analisi/ref_contact.jpg` — fotogrammi `IN / MID / OUT` per ogni shot con banda telemetrica impressa.
3. `reference_analisi/sheets/sheet_NNN.jpg` — filmstrip dense ogni `0.25 s` (griglia 4×2 da 2 s l'una) per leggere testi rapidi, transizioni frame-accurate e morph.
4. `reference_analisi/shots/shot_XX_*.jpg` e `reference_analisi/scheda_reference.md`.
5. `musica_originale.wav` — estratto dal video reference (se ha stream audio).
6. Bozza eseguibile con `kit/run.py`: `<nome>.json` (`"motore": "disegnato"`), `mondo_<nome>.js`, `location_<nome>.js`, `grafica_montaggio.js`.

---

## Fase 2 — Lettura visiva e compilazione di `scheda_reference.md`

Prima di modificare JSON o JS:
1. Apri e osserva `reference_analisi/ref_contact.jpg` e tutte le `reference_analisi/sheets/sheet_*.jpg`.
2. Annota nella tabella di `scheda_reference.md` ogni elemento osservabile in ogni shot:
   - **Testi 2D**: testo esatto, maiuscole/minuscole, font approssimato, colori, bordi/glow, posizione (top/center/bottom), fotogramma esatto di entrata e uscita.
   - **Transizioni**: taglio netto vs dissolvenza vs whip/flash cromatico.
   - **Camera**: direzione reale, entrata veloce + spinta lenta (`curva_riquadro`), entità dello zoom.
   - **3D & Azione**: soggetto inquadrato, posa/espressione/camminata, oggetti chiave, luci dominanti (es. noir ambrato/ciano).

---

## Fase 3 — Architettura scena + overlay 2D post-DOF

Lo schema provato su `kit/stories/ricerca_gettone/` separa in modo pulito mondo 3D e grafica cinetica 2D:

1. **`location_<nome>.js`**: costruisce gli ambienti 3D chiusi su `M.root` usando `const THREE = M.THREE;`.
   - Mantiene sempre superfici opache (`roughness >= 0.74`, `metalness <= 0.08`).
   - Imposta `userData.card = true` sui piani texturizzati o cartelli che non devono ricevere outline sporco sui bordi.
   - Limita le luci puntiformi dinamiche (≤ 3 interne, ≤ 2 esterne).
2. **`grafica_montaggio.js`**: contiene le helper 2D (`FONT_POOL_CAPS`, `scriviTestoCiclico`, callout, diagrammi, cronometri) disegnate su canvas 1080×1920 al tempo globale `t` e indice frame `f`.
3. **`mondo_<nome>.js`**:
   - Chiama `costruisciLocation(M, D, S, OBJ)`.
   - Registra `M.tick.push((t) => { ultimoT = t; })` per conoscere il tempo exact di scena (`SC.da + f / fps`).
   - Wrappa `window.renderFrame` dentro `M.attendi` (eseguito da `engine3d/web/storia_disegnato.js` subito dopo l'assegnazione di `window.renderFrame` e **prima** di `window.ready = true`), disegnando `window.mossoCanvas || canvas` sul compositore 2D, sovrapponendo `disegnaOverlay(g, ultimoT, f)` **dopo** `D.render()` + DOF (testi sempre nitidi!), e riassegnando `window.mossoCanvas`.
   - Se un personaggio sale/scende scale o quote variabili e usa `fuoco_su`, aggiorna l'eventuale posizione verticale prima di `camAt(t)` (es. `sharedState.preFrame`) così anche `anteprima` mantiene la messa a fuoco esatta.

---

## Fase 4 — Regole anti-tremolio e anti-`SALTO_DI_LUCE` (`kit/tools/tremolio.py`)

I controlli automatici del motore fermano il video se compaiono sfarfallii o salti di luminanza. Prima di renderizzare:

1. **`SALTO_DI_LUCE` a metà scena**: `tremolio.py` controlla le differenze fra fotogrammi *dentro* ogni intervallo fra due `tagli` (`scene[].da`/`a`) e boccia la scena se più del 3% del quadro cambia luminanza di colpo a metà inquadratura.
   - **Soluzione**: se il reference ha un flash, whip-pan lampo o cambio sfondo violento dentro un segmento lungo (segnalato in `scheda_reference.md` sotto *Avvisi eventi interni*), **spezza la scena JSON** al timestamp esatto di quell'evento così `tremolio.py` lo riconosce come confine fra scene diverse, oppure usa un accento grafico locale che non alteri l'intera luminanza del frame.
2. **Cambio font ciclico in 2D**: ruota il font ogni **3 fotogrammi** (`every = 3`), mai 1 font diverso ad ogni singolo fotogramma.
3. **Curva `curva_riquadro`**: usa `"stile_camera": "rick"` + `"curva_riquadro": { "da": 0.10, "a": 0.40, "quota": ..., "coda": 0.30 }` invece di curve lineari spezzate.

---

## Fase 5 — Verifica, render finale e confronto affiancato

1. **Anteprima e diagnostica**:
   ```bash
   python3 kit/run.py anteprima "$PWD/kit/stories/<nome>/<nome>.json"
   ```
   Controlla `kit/out/<nome>/contact.jpg`, `controlli.txt`, `fluidita.txt`, `ricchezza.txt`, `recitazione.txt`. Correggi prima i muri/set, poi i personaggi, poi la camera.
2. **Video finale**:
   ```bash
   python3 kit/run.py video "$PWD/kit/stories/<nome>/<nome>.json"
   ```
   Verifica `kit/out/<nome>/tremolio_report.txt` e l'eventuale report di `kit/tools/camera_misura.py`.
   Se la storia non usa voce narrante ma riproduce esattamente l'audio del reference, verifica che `musica_originale.wav` sia muxato pulito nel video finale (rispettando `ebur128=peak=true`).
3. **Confronto affiancato 1:1 col reference**:
   ```bash
   python3 kit/run.py confronto-reference "/percorso/assoluto/reference.mp4" "$PWD/kit/out/<nome>/<nome>.mp4" "$PWD/kit/out/<nome>/confronto_reference.mp4"
   ```
   Apri alcuni fotogrammi o guarda il confronto per verificare sincronizzazione tagli, proporzione testi, curve di camera e resa nel Mondo di Rick.
4. Copia il video approvato in `~/STORIE CARTOON/video/<nome>.mp4`.
