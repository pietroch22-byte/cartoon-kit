# Mondo vivo (motore `engine3d/web/vita.js`)

**Regola [utente]:** tutto ciò che è inquadrato si muove, soprattutto ciò che si vede di più. Nei veri video di Rick (`references/riferimenti-rick.md`, consultabile solo su richiesta) nessuna inquadratura è ferma: porte automatiche che scorrono quando arriva qualcuno (e la luce dell'interno si allarga sul tappetino), lampeggianti rossi che girano sopra le macchine, luce del vicolo che respira, gatto, pianta, camera che avanza sempre piano, facce che cambiano.

## Come funziona
- In ogni scena `M.vita` è il motore. Ogni comportamento è una **funzione pura del tempo**: stesso fotogramma = stessa immagine (anteprima, salti, `--passo`), niente `Math.random`, fasi diverse ma fisse per ogni oggetto.
- **Niente sfarfallio**: le luci pulsano morbide e solo *sotto* il valore di partenza (mai sopra la soglia del bagliore).
- I costruttori pronti di `mondo_disegnato.js` sono già vivi: neon e insegne respirano, insegne appese e lanterne oscillano dal punto in cui sono appese, condizionatori vibrano, vetrine e lampioni pulsano piano, comparse ferme respirano, `furgone` con `"moto": {"a": [x,y,z], "dur", "pausa"}` passa con le ruote che girano.

## Comportamenti (`tipo`)
| tipo | per cosa | opzioni principali |
|---|---|---|
| `gira` | ventole, ruote, palloni, rulli, insegne rotanti | `asse` x/y/z, `vel` giri/s |
| `pendola` | lanterne, cartelli appesi, code | `asse`, `amp` rad, `freq` Hz (perno in alto) |
| `ondeggia` | piante, erba, tende | `amp`, `freq` (perno in basso) |
| `respira` | comparse, gatti, sacchi | `amp`, `freq` |
| `galleggia` | palloncini, cose magiche | `amp`, `freq` |
| `vibra` | condizionatori, frighi, motori | `amp` |
| `rimbalza` | palloni, palline comiche (si schiaccia a terra) | `alt`, `freq`, `schiaccia` |
| `rotola` | pallone/barile su un percorso, angolo giusto = distanza / raggio | `percorso` [[x,z],…], `vel` m/s, `loop` |
| `passa` | auto, bici, carrelli (ruote con nome `ruota`/`wheel` girano) | `da`, `a`, `dur`, `pausa` |
| `lampeggia` | schermi, insegne, vetrine | `min` 0..1, `freq`, `modo` onda/respiro |
| `rincorsa` | lucine in fila che si accendono in sequenza | `pezzi`, `vel`, `coda` |
| `scorri` | schermi, nastri LED, acqua (la texture scorre) | `vel` [u,v] |
| `girofaro` | lampeggiante rotante con luce vera che gira | `vel`, `luce` |
| `porta` | porte automatiche scorrevoli o a battente: **si aprono da sole quando un attore o una comparsa si avvicina** (in modo continuo con la distanza), o su un evento | `tipo` scorrevole/battente, `sensore` m, `vicino` m, `luce` + `luceMax` |
| `cascata` | palline pachinko, monete, coriandoli che cadono | `n`, `w`, `h`, `vel` |
| `ciclo` | chiavi libere ripetute | `chiavi` [[t,{x,y,z,rx,ry,rz,s}]], `periodo` |

Opzioni comuni: `avvia`/`ferma` (secondi), `perno` (`alto`/`basso`/`centro`/[x,y,z]), `id`.

Pronti da script: `M.vita.portaAutomatica({x,z,ry,id})` (ante `PORTA_L/R`, tappetino, luce che cresce aprendo), `M.vita.girofaro({x,y,z,colore})`, `M.vita.pallone({x,z,vita:'gira'|'rimbalza'|'rotola', …})`. (Vecchia prova `mondo_vivo_prova/` archiviata in `archivio/pulizia_progetti_2026-11-13/`.)

## Nel JSON della storia
```json
"luoghi": { "sala": { "vita": [
  { "id": "porta1", "tipo": "porta", "sensore": 2.2 },
  { "nome": "ventola", "tipo": "gira", "asse": "y", "vel": 2 } ] } },
"scene": [ { "oggetti": [ { "id": "porta1", "t": "@esce", "fai": "apri" }, { "id": "pallone", "t": "@calcia", "fai": "avvia" } ] } ]
```
`id` = oggetto registrato in `oggetti` (dai tipi pronti o dallo script); `nome` = espressione cercata nei nomi dei nodi. Eventi: `apri`, `chiudi`, `avvia` (parte da fermo sulla parola), `ferma`. `"vita_auto": false` nel luogo spegne il riconoscimento automatico.

## Modelli da Blender: basta il nome del nodo
- `VIVO_<tipo>[_<asse>][_<vel>]`: `VIVO_gira_y_0.5`, `VIVO_pendola`, `VIVO_lampeggia`, `VIVO_porta`.
- Porte: due ante figlie dello stesso nodo con nome `PORTA_L` e `PORTA_R`, allineate sull'asse x locale (scorrono di quanto sono larghe).
- Parole chiave riconosciute anche senza prefisso: ventola/fan/elica, pallone/ball, lanterna, insegna_appesa, pianta/foglia/erba, coda/tail, schermo/monitor, neon/insegna, condizionatore/frigo/motore, girofaro/beacon, ruota (dentro un oggetto che `passa`).

## Controllo (anteprima)
`--anteprima` misura in ogni fotogramma chiave quanta parte dell'area degli oggetti inquadrati si muove (strutture oltre 4,5 m e segni a terra esclusi; attori e folla contano come vivi) → `kit/out/<nome>/vita.txt` con i fermi più grandi a schermo. Sotto il 60% (`"vita_soglia"` nella storia) stampa un avviso con gli oggetti da animare. **Prima del render ogni inquadratura deve superare la soglia**; ciò che è grande a schermo e fermo va animato per primo.

## Effetti atmosferici e particelle (`vivo.js`)
Tutti puri `f(t)` in stile disegnato (nessun `dt` accumulato, un solo draw-call per effetto, compatibili con `tremolio.py`, controllabili da `LG.oggetti` con `id`/`mostra`/`nascondi` o da script/luogo):
- `pioggia` (scie diagonali attorno alla camera o in zona `{ x, y, z, w, h, d }`, più `pozzanghere: true` opzionale)
- `neve` (fiocchi cartoon morbidi attorno alla camera o in zona)
- `foglie` (foglie/petali `colori: [...]` che planano roteando nel vento)
- `fumo` (sbuffi cartoon densi che salgono, ruotano e sfumano verso `coloreFine`)
- `fuoco` (lingue a strati + braci lente + `PointLight` morbida opzionale `luce: true`)
- `scintille` (archi balistici allineati alla traiettoria, attivabili anche con finestra `{ da, a }`)
- `polverePiedi` (attiva di default sugli attori in cammino/corsa/frenata; disattivabile con `"polvere_piedi": false` su storia/luogo/scena)
- `pioggia` / `neve` / `foglie` si accendono anche da `"vivo": { "pioggia": {...}, "neve": {...}, "foglie": {...} }` sul luogo.

## Librerie e oggetti riusabili (spostato da `SKILL.md` il 16/11)
Personaggi mai immobili; oggetti e ambiente vivi (luci che pulsano, insegne, schermi, tende, vapore, polvere, auto e persone che passano, animali). Tutto da `M.tick` come funzione del tempo (deterministico), ampiezze piccole e fasi diverse.
- **`engine3d/web/vita.js` (`M.vita`)** è il motore principale: 16 comportamenti (porta col sensore, gira, rotola, rimbalza, pendola, ondeggia, lampeggia, girofaro, cascata, passa…), riconoscimento dai nomi dei nodi GLB, eventi `apri`/`chiudi`/`avvia`/`ferma` sulle parole, controllo `vita.txt` (soglia 60%). Regole: `references/mondo-vivo.md`.
- **`engine3d/web/vivo.js`** aggiunge i meccanismi di `library/vivi`, auto con `userData.vivo` e gli FX procedurali puri $f(t)$ in stile disegnato (`polvere`, `vapore`, `pioggia` con `pozzanghere`, `neve`, `foglie`, `fumo`, `fuoco`, `scintille` e `polverePiedi` automatica sui personaggi che camminano/corrono/frenano, registrati su `M` per `LG.oggetti` e `vivo`); non tocca ciò che `M.vita` già anima. Disattivabile sugli attori con `"polvere_piedi": false`.
- **`library/vivi/`**: 8 meccanismi nostri (porta scorrevole, battente, doppia, ventilatore da soffitto e da tavolo, condizionatore, saracinesca, orologio) + `catalogo.json` + generatore `genera_vivi.py`. Uso: `import { vivo } from '/web/vivi.js'; await vivo(M, 'porta_scorrevole', { x, z, ry, s, colori, id })`. Da aggiungere: finestra, tenda, ascensore, semaforo, schermo con numeri, bandiera, frigo.
- **`library/animati/`**: 12 animali animati Quaternius CC0 (`import { animato } from '/web/animati.js'`) + librerie di clip UAL1, UAL2, KayKit. Ogni animale nominato o presente si mette da qui, mai una sagoma ferma.
- **Oggetti costruiti in codice e riusabili**: `engine3d/web/oggetti_stazione.js`, `oggetti_porto.js`; script e GLB dei luoghi già fatti in `kit/stories/*/`.
- Regola: prima di un oggetto nuovo guarda `library/vivi/catalogo.json`; un modello con parti mobili si separa e nomina in Blender e si aggiunge a `genera_vivi.py`. I pacchetti gratuiti servono per la forma, il movimento lo mettiamo noi.
