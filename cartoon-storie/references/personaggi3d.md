# Personaggi 3D (Blender → motore «disegnato»)

Omini veri in 3D disegnati come nel reference: testa grande, corpo a sacco con il vestito dipinto, gambe e braccia sottili con ginocchia e gomiti. Ognuno è **irregolare e diverso** (rumore lento sulla forma, proporzioni dal seme). Sono riusabili in ogni video.

## Dove stanno
- `engine3d/personaggi3d/<nome>.glb` + `catalogo.json` (altezza, occhiali, capelli, accessori).
- Generatore: `engine3d/personaggi3d/genera_personaggi.py` (Blender, circa 0,4 s a personaggio).
  `Blender -b --python engine3d/personaggi3d/genera_personaggi.py` rifà tutti; `-- nome1 nome2` solo quelli.
- Nel motore: `engine3d/web/personaggi3d.js` (`creaPersonaggio3D`, `dipingiFaccia`).

## Pronti (10)
turista_arancio, impiegato_blu, poliziotto, duro_sole, nonna_chignon, nonno_baffi, ragazza_lunghi, ragazzo_spettinato, studente_ricci, commesso_papillon.
Nuovo personaggio: aggiungi una voce in `CAST` nel generatore (corpo, capelli: calotta | corti | caschetto | lunghi | spettinato | ricci | chignon | pelato; accessori: cravatta, papillon, occhiali, occhiali_sole, berretto, cappello_polizia, baffi, macchina_foto, zaino, cintura; seme; proporzioni) e rilancia.

## Nella storia (JSON)
Nel `cast` basta `"modello3d": "<nome>"`; tutto il resto (attori, `azioni` con `a`, `faccia`, `verso`, `posa`) è identico agli omini 2D.
```json
"cast": { "poliziotto": { "modello3d": "poliziotto" } },
"attori": [ { "id": "poliziotto", "x": -3, "z": -2.5, "faccia": "annoiato", "azioni": [ { "t": "@passa", "a": [2, -2.5], "dur": 2.6 }, { "t": "@nessuno", "faccia": "sorriso" } ] } ]
```
- `posa: "seduto"` + `"seduta": 0.62` (altezza del sedile in m, **nel mondo**; cassetta 0,34, sgabello 0,62-0,66). Vale anche con `scala` ≠ 1: il motore divide per la scala, così il bacino resta sul sedile (prima dell'11/11 con scala 0,6 il personaggio affondava nello sgabello). Metti il personaggio **sulla x/z del sedile**, non accanto.
- `"ry3"` fissa la direzione del corpo (radianti); senza, guarda la camera e `verso` lo gira (±1 ≈ ±63°). Chi cammina si gira da solo verso dove va (anche di spalle: niente limite delle sagome).
- Comparse da script: `const P = await creaPersonaggio3D(M.root, 'nonno_baffi', { seduta: .66, faccia: 'annoiato' }); P.obj.position.set(x, 0, z); P.stato({ posa: 'seduto' })` (import da `/web/personaggi3d.js`).

## Stile (come il reference, dall'11/11 sera)
Omini **disegnati**, non plastica: colori smorzati da vestito, pelle crema, ombra morbida dipinta nei vertici (basso più scuro, un lato più scuro), contorno bruno spesso (guscio rovesciato), filo di luce bianca sul bordo solo dove arriva luce vera. **Niente lacca, niente bande nette** (la versione a bande è `personaggi3d.js.bak3`).
- Corpo **a sacco** (spalle strette, fondo largo) e testa **più larga che alta**; gambe e braccia sottili brune, mani e piedi tondi.
- **Vestito disegnato sul corpo** (`vestito()` in `personaggi3d.js`): giacca+camicia+cravatta (impiegato), papillon (commesso), cardigan con bottoni (nonni), divisa con cintura e distintivo (poliziotto), felpa con zip (duro), maglia a righe con macchina foto (turista, ragazzi). Cravatte, cinture e accessori 3D attaccati al corpo si nascondono: ci sono già sul vestito.
- **Capelli su tutta la nuca** (calotta dietro la testa) tranne i `pelato`: da dietro non deve mai vedersi una palla bianca (sembra una faccia girata al contrario).
- Il corpo guarda **dove sta guardando** (macchina, oggetto, strada); gira solo la `testa` (radianti, azione `"testa"`) verso la camera. Ruotare tutto il corpo verso la camera fa sembrare i seduti «al contrario».

## Arti a due pezzi e interazione con gli oggetti
Ogni gamba e braccio ha **ginocchio/gomito calcolati** (`piega()`): il motore sa dove sta l'attacco (anca, spalla) e dove deve arrivare la punta.
- `posa: "seduto"` + `seduta` (altezza sedile nel mondo): seduta bassa (cassetta 0,34-0,38) = piedi a terra e ginocchia in su; alta (sgabello 0,62-0,69) = gambe che pendono. Metti il personaggio **sulla x/z del sedile**.
- **Mani sugli oggetti**: da script `P.stato({ posa:'seduto', t, mani: [[x,y,z],[x,y,z]] })` (punti del mondo che le mani toccano, sinistra poi destra). Dalla storia (JSON) l'attore ha `"porta": { "id": "torre", "avanti": .6, "lato": -.12, "y": .02, "largo": .26, "presa": .55, "dietro": .15 }`: l'oggetto sta davanti a lui, lo segue mentre cammina e le mani lo tengono.
- `"gesto": "saluta"` (azione): braccio destro alzato che oscilla. `"testa": rad` gira la testa.
- Passi legati alla strada percorsa (niente piedi che scivolano), rimbalzo e leggera inclinazione in avanti camminando; battito di ciglia ogni ~3 s.
- Comparse da script: `const P = await creaPersonaggio3D(M.root, nome, { seme, seduta: .69, faccia }); … M.tick.push(t => P.stato({ posa:'seduto', t, mani, testa }))` — `M.tick` è una lista di funzioni chiamate a ogni fotogramma con il tempo `t`: **qui vive tutto ciò che si anima** (comparse, porte, giostre).

## Faccia (modellata in Blender, con shape key — dal 11/11)
Occhi, sopracciglia, bocca, guance e occhiali sono **forme sottili sulla testa**, fatte in Blender da `engine3d/personaggi3d/viso.py` e esportate nel GLB come **shape key** (morph target). Il motore non disegna più nulla: accende le shape key. Prima la faccia era una tela dipinta e usciva capovolta (UV di Blender con v rovesciato): non esiste più.
- **Preset**: `engine3d/personaggi3d/espressioni.json` (scritto da `viso.py`) con espressioni, alias e colori. Si cambia una espressione in `ESPRESSIONI` di `viso.py` (pochi parametri: apertura occhi, pupille, inclinazione sopracciglia, angoli e curva della bocca, denti, guance) e si rilancia il generatore.
- **Espressioni (17)**: neutro, sorriso, felice, ride, furbo, annoiato, sorpreso, spaventato, arrabbiato, triste, preoccupato, dubbioso, determinato, beato, imbarazzato, disgustato, pieno. Alias inglesi e dei vecchi nomi: smile, grin, sly, worried, teary, shock, stuffed, chew, determined, nervous, blissful…
- **Bocca che parla**: nell'attore `"parla": true` (azione, come `faccia`): il motore alterna i visemi A E O U MBP FV a ~9 al secondo, mentre l'espressione resta. Da collegare alle sillabe delle parole (oggi è un ritmo fisso).
- **Sguardo**: `guarda` (numero, già usato) sposta le pupille; `"sguardo": "su"|"giu"` nell'azione.
- **Battito** ogni ~3 s da solo (non si somma agli occhi già chiusi: ride, beato). Passaggio tra due espressioni: dissolvenza di 0,14 s.
- **Occhiali** (tondi) e **occhiali da sole** sono geometria fissa; con gli occhiali da sole gli occhi non si vedono.
- **Prova delle espressioni** (solo Blender, pochi secondi): `Blender -b --python engine3d/personaggi3d/viso_prova.py -- foglio.png [occhiali|sole] [Basis,e_felice,…]`. Prova nel motore: `kit/stories/pachinko_inizio/prova_espressioni.json` (un personaggio, tutte le espressioni, `node kit/tools/rendi_disegnato.mjs … --anteprima`).
- **Attenzione**: in Blender 5 le shape key nascono con valore 1: `viso.py` le azzera. I GLB vecchi senza `viso_*` usano ancora la faccia dipinta (`dipingiFaccia`).
- Capelli: la fronte resta libera per le sopracciglia (`genera_personaggi.py`, regola nella `calotta`). Bianchi di occhi e denti volutamente tenuti sotto il bianco puro (`#e6dfd2`), se no il bagliore brucia la faccia.

## Limiti di oggi
- La bocca parla a ritmo fisso (visemi a rotazione), non ancora legata alle sillabe delle parole.
- Capelli senza ciocche disegnate, nessuna bocca aperta che parla, nessuna presa a più dita.
- Le passate del look che proteggono gli omini 2D dai bagliori non valgono per i 3D: tieni le luci forti lontano dalle teste (le teste crema sopra la soglia del bagliore «bruciano»).
