# Storia «disegnato» — come fare un video nuovo con il look approvato

Il look (strada a specchio sfumato, contorni a inchiostro, nebbia luminosa, bagliori, omini con personalità) è **chiuso** dentro `engine3d/web/look_disegnato.js`: sono le passate della scena approvata copiate riga per riga. Per un video nuovo **non si tocca il look**: si scrive un JSON che dice **prima com'è fatto il mondo, poi chi c'è e come si muove la camera**.
Esempio minimo di schema JSON: `kit/stories/disegnato_esempio.json` (esempio pre-Rick della via della sala giochi); per le storie nuove con `"personaggi": "rick"`, `"luce_rick": true`, `"stile_camera": "rick"` vedi `kit/stories/matita_spazio/prova_camera_v5.json`.

## Comandi
```
python3 kit/run.py anteprima "$PWD/kit/stories/<nome>/<nome>.json"   → kit/out/<nome>/contact.jpg + controlli.txt + vita.txt + ricchezza.txt + fluidita.txt + recitazione.txt + lettura.txt
python3 kit/run.py video     "$PWD/kit/stories/<nome>/<nome>.json"   → kit/out/<nome>/<nome>.mp4 (voce, musica, effetti, karaoke)
node kit/tools/readcheck.mjs "$PWD/kit/stories/<nome>/<nome>.json"     → verifica continua leggibilità scritte 3D e sottotitoli karaoke (exit 0/1/2)
node kit/tools/rendi_disegnato.mjs "$PWD/kit/stories/<nome>/<nome>.json" --scena 0 --passo 5   → prova veloce del movimento (1 fotogramma su 5)
```
Il percorso della storia va dato **assoluto** (con un percorso relativo il render fallisce). Ogni storia sta in una sua cartella `kit/stories/<nome>/` con voce, parole, script e GLB. `RESUME=1` riprende un render interrotto. Sul Mac va su Metal; senza scheda video (SwiftShader) ~10-20 s a fotogramma: lì si fa solo l'anteprima.

## Ordine di lavoro (ogni tappa: anteprima, controlli, mostra all'utente, ⏸)
1. **Mondo**: luogo, luce, palazzi, oggetti (regole `look-disegnato.md` §0a-§5b, §8). Una sola camera fissa di prova.
2. **Personaggi**: protagonisti con un `tipo` e comparse che **fanno qualcosa** (§6, §6c, §8).
3. **Camera continua** sulle parole della voce (§6d). Niente stacchi dentro lo stesso luogo se non servono alla storia.
4. Video finale. Confronto affiancato con il riferimento, se c'è (§0).

## Formato
```json
{
  "motore": "disegnato", "titolo": "…", "fps": 30,
  "voce": { "file": "voce.mp3", "parole": "voce.words.json" },
  "musica": { "mood": "mystery", "bpm": 96, "dinamica": true, "sezioni": [ … ] },
  "regia_audio": true,
  "silenzi": [ { "da": "@parola", "a": "@parola2" } ],
  "luoghi": { "via": { "luce": "notte", "mondo": { "xr": 7, "xl": 2.6, "seme": 7 }, "oggetti": [ … ], "script": "via_extra.js", "parametri": { } } },
  "cast": { "ken": { "tipo": "turista", "seme": 3, "corpo": "#e8742a" } },
  "scene": [ { "luogo": "via", "da": 0, "a": 6, "attori": [ … ], "camera": [ … ], "oggetti": [ … ] } ]
}
```
- `voce.parole`: uscita di `kit/tools/asr_words.py` (`[[inizio, fine, parola], …]`). `"musica": false` la toglie; `"karaoke": false` toglie le scritte; **`"karaoke": "leggibile"`** (o `"karaoke_leggibile": true`) unisce in modo sicuro i blocchi troppo brevi (`< 0,65 s`) o veloci (`> 20 car/s`) e salva il controllo in `lettura_sottotitoli.txt` e `suoni.md`. `"testi_passa": ["…"]` esclude insegne 3D decorative da `readcheck.mjs`.
- **Tempi**: secondi dall'inizio del video, oppure una parola della voce: `"@pachinko"`, `"@pachinko+0.3"`, `"@pachinko#2"` (seconda volta). Vale per `t`, `da`, `a`. Se la parola non è nella voce il render si ferma con un errore chiaro.
- Le scene sono in fila: `da` di una = `a` di quella prima. Scena nuova = luogo o tempo nuovo (lì lo stacco è giusto).

### Luogo
Convenzione: la strada corre verso **-z**, la camera sta a z positivo; facciata destra a x = `xr`, sinistra a x = `-xl`; misure in metri; personaggi alti 2 m.
- `luce`: `notte` (approvata). `giorno` e `interno` esistono ma **non sono ancora tarati con l'utente** in questo motore: prima di usarli in un video fai un fotogramma e fallo approvare (prototipo storico archiviato in `archivio/vecchie_immagini_riferimento_2026-11-13/look-disegnato/prova_giorno.js`; per i veri frame di Rick di riferimento vedi `references/riferimenti-rick.md` solo su richiesta).
- `strada`: `{ "w": 14, "l": 120, "x": 0, "z": -50, "colore" }` = il piano che riflette.
- **Interni con moquette/legno** (sala, negozio, casa): metti `"asciutto": 1` nei `parametri` del luogo, se no il riflesso del motore tinge il pavimento di viola.
- `parametri`: gli stessi nomi dei parametri della scena modello (`wk` forza riflesso, `fh` dissolvenza in metri, `gs` bagliore largo, `nk` nebbia luminosa, `asciutto: 1` niente riflessi…). **Non cambiarli per la notte**: sono i valori approvati.
- `oggetti`: lista di `{ "tipo": …, opzioni }`. Tipi pronti (`engine3d/web/mondo_disegnato.js`, ognuno è un pezzo della scena approvata reso a parametri):

| tipo | cosa fa | opzioni principali |
|---|---|---|
| `viaCitta` | tutta la via di notte: palazzi sui due lati, neon, insegne appese, vetrine con tettoie e lanterne, cavi, furgone, strisce con folla che attraversa, lampioni | `protagonista: [z0, z1]` tratto a destra lasciato al palazzo della storia; `parole` delle insegne; `strisce` (z o `false`); `folla`, `furgone`, `cavi`, `neon`, `vetrine`, `insegne`, `lampioni` (true/false) |
| `facciata` | palazzo dipinto: marcapiani, finestre incorniciate, condizionatori 3D | `lato` 1/-1, `z0`, `z1`, `h`, `base`, `terra`, `accesa`, `emissiva` |
| `porta` | porta luminosa a due ante + fascia piatta + luci vere | `lato`, `z`, `w` 2,4, `h` 2,3, `colori`, `fascia`, `luceC` |
| `insegna` | insegna a bandiera con lampadine, cassone, staffe, luce vera | `testo`, `sopra`, `x y z`, `w h`, `ry`, `fondo`, `lettere`, `freccia`, `luceC`, `luceF` |
| `filaPalazzi`, `neon`, `insegneAppese`, `vetrine`, `cavi`, `furgone`, `strisce`, `lampioni`, `mezzeria`, `lanterna`, `condizionatore` | i singoli pezzi di `viaCitta` | vedi il file |
| `follaAttraversa` / `follaFerma` | comparse con personalità che attraversano / aspettano | `z`, `n`, `x0`, `seme` / `punti` |
| `scatola`, `scatolaLuce`, `pannello`, `luceVera` | pezzi generici | misure, `colore`, `testo`, `luminoso`, `faccia` |
- `"id"` su un oggetto lo rende comandabile dalle scene; `"nascosto": true` lo fa partire invisibile.
- **Mondo su misura** (`"script": "nome.js"` accanto alla storia): per tutto ciò che i tipi pronti non coprono (un bar, una cucina, una spiaggia, un oggetto nominato dalla voce). Il file esporta `export function costruisci(M, D, storia, oggetti) { … }` e usa gli attrezzi di `M` (`box`, `boxLuce`, `tex`, `dipinto`, `std`, `emi`, `luce`, `pannello`, `omino`, `THREE`, `root`). Regole obbligatorie: aggiungi **solo** a `M.root` (mai a `scene`: sparirebbe dal riflesso); ogni oggetto con lo standard §0a (3-5 dettagli dipinti, sporco leggero, contorno `#3a2a2e`, emissiva 0,15-0,35), in scala §0b, piatto o con volume secondo §5b; ogni sorgente importante ha una luce vera vicina (§2). Registra in `oggetti.nome = mesh` ciò che la scena deve comandare.

### Cast e attori
- `cast`: `tipo` (40 tipi Rick in `engine3d/web/cast_rick.js`: `impiegato`, `capo`, `nonna`, `nonno`, `bambino`, `bambina`, `ragazza`, `ragazzo`, `ragazzina`, `studente`, `signora`, `palestrato`, `magrolino`, `turista`, `jazz80`, `cuoco`, `barista`, `medico`, `chirurgo`, `professore`, `giornalista`, `fattorino`, `banchiere`, `giudice`, `ricco`, `detective`, `poliziotto`, `pompiere`, `operaio`, `meccanico`, `contadino`, `ufficiale`, `pilota`, `astronauta`, `ladro`, `detenuto`, `cowboy`, `scienziata`, `mago`, `gigante`; gli ultimi 4 + i 14 mestieri/ruoli speciali e `cuoco` hanno `folla: false`) + `seme` + override estetici (`corpo`, `testa`, `pelle`, `maglia`, `capelli`, `capelliTipo`, `accessori`, `cartellinoTesto`, `vestito`, `gonna`, `tessuto`, `scarpeTipo`, `ruolo`, `W`, `scala`). Nota: `impiegato` ha di serie `pelle: "#ffffff"` e `cartellinoTesto: "PN8"`. Mai colori del corpo vicini a `#2a1a26` / `#3a2a2e`.
- attore in scena (`attori`): `{ "id", "x", "z", "verso": -1…1, "yaw", "posa", "andatura", "corsa", "anticipo", "gestoAnt", "respiro", "gesto", "faccia", "bocca", "sguardo", "oggetto", "oggettoMano", "chino", "parla", "vfx", "manoPosa", "azioni": [ … ] }`:
  - **`posa`** (`POSE_CORPO`): `'auto'` / `'fermo'` (scelta asimmetrica deterministica dal ruolo/seme: `tasca`, `fianchi`, `conserte`, `dietro`, `mento`), `'spalle'` (forza vista posteriore 180° completa; inoltre qualsiasi attore o comparsa ruota a 360° e passa automaticamente in vista di spalle con capelli posteriori, acconciatura completa, dettagli schiena e lacci grembiule quando `yaw`/cammino dà le spalle alla camera via `cosRel`), `'seduto'` (gambe piegate ad L su sedia/poltrona, altezza ribassata automatica per `ALTT`/`occhiDi`/camera), `'seduto_alto'` (sgabello alto), `'seduto_banco'` (seduto dietro scrivania/bancone), `'fianchi'`, `'conserte'`, `'tasca'`, `'dietro'`, `'mento'`, `'dritto'` (disattiva la posa idle asimmetrica), oppure un nome di andatura (`'cammina'`, `'passeggiata'`, `'fretta'`, `'corsa'`, `'soppiatto'`, `'marcia'`, `'zoppia'`). Le pose mano di `interazioni.js` (`aperta`, `pugno`, `presa`, `indica`, `punto`) vanno in `"manoPosa"` / `"maniPosa"` o in `azione.posa` se non sono pose del corpo.
  - **`andatura`** / **`corsa`** / **`anticipo`** (`ANDATURE`): `'cammina'` (1,25 m/s default), `'passeggiata'` (0,85 m/s), `'fretta'` (1,85 m/s), `'corsa'` (2,85 m/s con fase aerea e braccia a 90°), `'soppiatto'` (0,75 m/s chinato sulle punte), `'marcia'` (1,35 m/s impettita), `'zoppia'` (0,90 m/s asimmetrica). Su un'azione `a: [x, z]`, l'andatura può essere data in `"andatura"`, `"corsa": true` o `"posa"`; se omessa, viene scelta automaticamente dalla velocità reale del tratto (`≥ 2,15 m/s` → `corsa`, `≥ 1,62 m/s` → `fretta`, `≤ 0,92 m/s` → `passeggiata`, altrimenti `cammina`). Prima delle partenze rapide (`corsa`, `fretta`, velocità `≥ 1,55 m/s`, o `"anticipo": true`; escluso in catena o `"anticipo": false`) parte una carica elastica di `0,16-0,20 s`, e all'arresto un breve **assestamento** smorzato; **in idle neutro il personaggio resta fermo** (`respiro` disabilitato `breathPy = 0`, scelta dell'utente). Il passo integra la distanza percorsa senza slittamenti, mantiene il braccio con `oggetto` stabile mentre l'altro oscilla in controfase e consente `gesto` simultanei.
  - **`gesto`**: 14 gesti continui a IK gomito (`telefona`, `beve`, `scrive`, `legge`, `manovella`/`gira`, `spiega`/`conversa`, `pensa`, `esulta`, `disperato`, `applaude`, `bastone`, `saluta`, `indica`) con micro-carica d'anticipo all'ingresso (`"gestoAnt": false` per disattivarla); con `t` cambiabili nelle azioni (es. `"gesto": null` per tornare a riposo).
  - **`faccia`** e **`bocca`**: **34 espressioni di `FACCE`** (`neutro`, `felice`, `ghigno`, `triste`, `arrabbiato`, `sorpreso`, `annoiato`, `furbo`, `scettico`, `ride`, `contento`, `spaventato`, `nervoso`, `scioccato`, `incredulo`, `urla`, `panico`, `dolore`, `piange`, `pensieroso`, `confuso`, `schifato`, `assonnato`, `deciso`, `imbarazzato`, `fiero`, `serio`, `digrigna`, `esaltato`, `nei_guai`, `sospetto`, `esasperato`, `concentrato`, `occhiolino`) con battito d'occhi stile Rick (`1,35-2,19 s`, anticipo prima del cambio faccia) e micro-reazione della testa su `facciaPrev -> faccia`; `"parla": true` muove la bocca **solo vocalica** sincronizzata sulle parole di `words.json` (`_parole`, tenuta minima 4 fotogrammi, anticipo 2 fotogrammi, ondeggio frase e cenni sulle parole accentate) oppure con `"bocca"` manuale (`chiusa`, `stretta`, `o_piccola`, `aperta`, `larga`…).
  - **`sguardo`**: `[gx, gy]` (`-1…1`), `'camera'`/`'cam'`, `'dx'`/`'destra'`, `'sx'`/`'sinistra'`, `'su'`/`'alto'`, `'giu'`/`'basso'`, `<id attore>`, `<id oggetto in OBJ>`; se omesso, guarda automaticamente chi sta parlando o interagendo in scena (o verso il foglio con `scrive`/`legge`), con blend fluido (`0,14 s`) e leggero accompagnamento della testa.
  - **`oggetto` / `oggettoMano`**: 19 oggetti disegnati direttamente in mano (`bastone`, `telefono`/`cellulare`, `tazza`/`caffe`, `giornale`, `blocco`/`quaderno`/`cartella`, `penna`, `matita`, `valigetta`, `soldi`/`banconote`, `martello`/`martelletto`, `lente`, `secchiello`/`paletta`, `microfono`, `sassofono`/`sax`, `tromba`, `vinile`/`disco`, `libri`/`libro`/`pila_libri`, `borsa`, `chiavi`; con `"oggettoMano": "sinistra" | "destra"`). Alcuni gesti (`telefona`, `beve`, `legge`, `scrive`, `bastone`) richiamano l'oggetto automaticamente; `"oggetto": null` lo toglie.
  - **`chino` (`torsoPiega`)**: gradi di inclinazione del busto sull'anca (mantiene i piedi piantati a terra, a differenza di `piega` delle interazioni fisiche).
  - **`vfx`**: effetti cartoon attorno alla testa (`sudore`/`goccia`, `fumo`, `scatto`, `rabbia`, `domanda`, `esclamazione`, `cuori`), aggiornati a scatti da ~6 Hz per zero tremolio.
- `azioni` (in ordine di tempo): `{ "t", "a": [x, z], "dur", "andatura", "corsa", "curva" }` si sposta fin lì (velocità default dell'andatura, `1,25 m/s` per `cammina`, o dedotta da `dur`; easing trapezio C1 `curvaPasso` con continuità automatica tra tappe consecutive entro `0,14 s`, disattivabile con `"curva": "lineare"`); `{ "t", "posa" | "andatura" | "corsa" | "gesto" | "faccia" | "bocca" | "parla" | "sguardo" | "oggetto" | "oggettoMano" | "chino" | "vfx" | "verso" | "yaw" | "ry" | "visibile" }` cambia sulla parola (`"@parola"`). Interazioni fisiche di `interazioni.js`: `{ "t", "fai": "spinge"|"tira"|"strattona"|"abbraccia"|"schiaffo"|"prende"|"porge"|"lascia"|"saluta"|"indica"|"batte", … }`.
- Solo per i personaggi 3D (`modello3d`): in `azioni` anche `"gesto": "saluta"`, `"testa": rad`; sull'attore `"porta": {id, avanti, lato, y, largo, presa, dietro}` = tiene davvero un oggetto della scena. Limite omini 2D legacy (`omino.js`): non vedono di spalle.

### Passaggio tra luoghi
Su una scena `"passaggio": "dissolvi"` (+ `"passaggioDur"`, default 0,35 s; il reference usa 0,3-0,5): dissolvenza incrociata dall'ultimo fotogramma della scena prima (fatta nel montaggio, `film_disegnato.py`). Dissolvenze dove cambia il luogo, **stacchi netti** per le sorprese: il reference alterna.

### Camera (continua)
Tappe in ordine di tempo; tra una e l'altra la camera plana morbida (smootherstep). Due forme:
- `{ "t", "pos": [x, y, z], "guarda": [x, y, z], "fov" }`
- `{ "t", "su": "id attore", "dist": 3, "angolo": 20, "alt": 1.6, "guardaAlt": 1.25, "fov": 85, "segue": true }` — relativa al personaggio (`angolo` 0 = davanti a lui sull'asse z, positivo = verso destra); con `segue` lo accompagna mentre cammina.
- `"taglio": true` su una tappa = stacco netto (solo per uno stacco comico; il controllo avvisa se sono più di uno per luogo).
- Valori del look: altezza occhi 1,6-2,6 m, fov 80-95, ruotata ~20° verso il soggetto, movimenti di 3-8 m in 3-5 s, **l'ultima tappa sull'inquadratura chiave e ferma almeno 1 s** (due tappe uguali). La camera deve stare dentro la strada (tra `-xl` e `xr`) e sopra il piano.

### Stile di camera «rick», zoom veloce, luce nel tempo, sfocatura vera
- **Mosse (13/11)**: in ogni tappa `"mossa": "avanti" | "indietro" | "pan" | "tilt_su" | "tilt_giu" | "carrello" | "gru_su" | "gru_giu" | "arco" | "fermo" | "fluttua" | "inclina" | "risucchio" | "vertigine" | "segui"…` (con `preset`, `su` o `pos`+`guarda`); `"verso": 1 | -1`, `"verso_a": "<attore>" | [x, y, z]`, `"ancora": "mezzo" | "inizio" | "fine"`, `"tratto"` (%), `"panTratto"` ([px, px]), `"scossa": { "f": 1.2, "t": "@parola" }`. `"volo": true | secondi` sulla tappa d'arrivo (scatto rapido dalla tappa prima, parte sulla parola); `"curva": "frena" | "monotona"` (`"frena"` = zoom che parte veloce e rallenta, già nelle mosse di zoom; `"monotona"` su storia, scena o `camera_rick` = interpolazione cubica monotona di Fritsch–Carlson fra tutte le tappe dello stesso segmento, senza frenate intermedie né scatti — usa `"sosta": true` su una tappa per una pausa controllata senza rimbalzi e `"taglio": true` per spezzare in un nuovo segmento continuo); `"mosso": false | { "otturatore", "soglia", "pieno", "max" }` (storia o scena: sfocatura di movimento sui movimenti veloci di camera, accesa di base con lo stile Rick); `"grandezza": "dettaglio" | …` nella tappa per il controllo REGIA; `"guarda_ogg": "<id di OBJ>"` in una tappa a mano = la camera tiene d'occhio quell'oggetto mentre si muove (mira ammorbidita; `"guarda"` resta come riserva). Regole: `movimenti-camera.md`.
- `"stile_camera": "rick"` (storia o scena): ogni tappa è un'inquadratura che parte sulla sua parola; la camera **arriva veloce e poi rallenta**, dentro l'inquadratura spinge (`tratto / durata` ~18%, o `"zoom"` fisso) e scorre (`"pan"`: [px/s, px/s], `"camera_rick": {"verso": 1 | -1}`), e passa alla tappa dopo con una planata su misura (`planata`: 0,6-2 s solo se sopra 3,5 s). `"glide": "lens"` (gira e zooma) o `"dolly"` (sposta la camera). Tra scene brevi con `"passaggio": "dissolvi", "passaggioDur": 0.27`, metti `"fermo": 0` così non frena prima di dissolvere.
- **Zoom veloce sul soggetto** (`preset: "zoom_soggetto"` / `"snap_zoom"`, oppure `"zoom_veloce": true | 1.45 | { "t": "@parola", "su": "attore", "punto": [x, y, z], "fattore": 1.45, "dur": 0.6 }`): stringe veloce (+45% in ~0,6 s con curva morbida senza scatti, centrando `"su"` o `"punto"`) e poi rallenta a spinta dolce (~4 %/s). Funziona sia con `"su"` sia con `"pos"`+`"guarda"` (`dolly` o `lens`). Usalo **ogni tanto** su svolte, reazioni o battute, mai due di fila.
- **Fermata al cambio di scena [utente]**: negli ultimi `"fermo"` s di ogni scena (0,6 di default per stacchi secchi; `0` per dissolvenze stile Rick) la camera rallenta fino a fermarsi.
- **`"zona"`** nella scena: un altro punto dello stesso luogo (banco premi, uscita, finestrella). Per il controllo REGIA conta come un luogo nuovo, ma solo se c'è uno stacco e l'inquadratura cambia davvero lato.
- `"luce_tempo"` (nella scena): `[{ "t": "@parola", "dur": 1.5, "esp": 0.62, "cielo": [alto, orizzonte], "nebbia": "#…", "ambiente": [colore, intensità], "sole": [colore, intensità] }, { "t": "@parola", "torna": true }]` = la luce cambia con la storia (es. notte più blu per la spiegazione) e sfuma.
- `"sfocatura": "vera"` (+ `"diaframma": 2`, `"fuoco_ritardo": 0.18`): sfocatura da obiettivo vero, calcolata da focale (fov), distanza di fuoco e diaframma: grandangolo quasi nitido, primo piano stretto molto sfocato. Il fuoco **insegue** il soggetto con ~0,2 s di ritardo: quando la camera passa a un altro personaggio c'è un cambio di fuoco morbido. `"auto"` resta (valori fissi dalla testa nel quadro).

### Oggetti sulle parole
`"oggetti": [ { "id", "t": "@parola", "fai": "pop" | "mostra" | "nascondi" }, { "id", "t", "a": [x, y, z], "dur" } ]` — ogni oggetto nominato dalla voce compare o si muove **sulla sua parola**. Per gli oggetti vivi (`references/mondo-vivo.md`): `"fai": "apri" | "chiudi" | "avvia" | "ferma"`, e `"vita": [{ "id" | "nome", "tipo", … }]` nel luogo o nella scena.

## Avvicinarsi al reference
Prima di scrivere le scene leggi `references/piano-reference.md`: tabella delle inquadrature del reference (camera, mossa, gesti, oggetti), differenze più frequenti del nostro motore e metodo per ogni video (tabella inquadrature → libreria → mondo → anteprima affiancata → personaggi → camera → render → promuovere in libreria i modelli migliorati).

## Controlli prima di consegnare
- Lo script blocca: luogo o attore inesistente, camera mancante, parole non trovate; avvisa: buchi tra le scene, fov/altezze strane, troppi stacchi.
- **`node kit/tools/readcheck.mjs "$PWD/kit/stories/<nome>/<nome>.json"`** (anche via `lettura.txt` in `--anteprima`): controlla che ogni scritta 3D chiave resti intera nel quadro abbastanza a lungo (`>= max(1,5 s, len/15 + 1,5 s)`) e alta almeno `22 px/riga`, più la leggibilità dei sottotitoli karaoke (`--scena N`, `--no-sottotitoli`, `--json` opzionali).
- Guarda il contact sheet e fai i **Controlli** di `look-disegnato.md` (§0b porta ≈ 1,3-1,4 × personaggio; §3 metà bassa piena di riflessi; §4 insegna leggibile; §8 almeno 15 oggetti nell'inquadratura, comparse che fanno qualcosa, niente fuori campo).
- Ogni correzione dell'utente diventa una regola **[utente]** in `look-disegnato.md` (§11.6).
