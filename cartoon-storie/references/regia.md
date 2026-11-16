# Regia: ogni parola si vede

Obiettivo: lo spettatore **vede** ciò che la voce dice, nel momento in cui lo dice. Una scena bella ma ferma, o una camera che si muove senza motivo, è un fallimento. Formato del JSON: `storia-disegnato.md`.

## Passo obbligatorio: tabella di regia (prima del JSON, da mostrare all'utente ⏸)
Una riga per frase o mezza frase con **un solo senso compiuto** (il confine tra una riga e l'altra è dove la camera ha motivo di cambiare inquadratura — **mai spezzare a caso a metà frase**):

| # | Tempo e parola chiave (`@parola`) | Cosa deve capire lo spettatore | Cosa si VEDE (letterale) | Azione e parola esatta | Camera, legame con prima e perché (`linguaggio-camera.md`) | Cosa è vivo | Suono (`regia-suono.md`) |
|---|---|---|---|---|---|---|---|
| 1 | `0,00` («Un contadino») | Chi è e dove va | Piazza larga: il contadino cammina verso la porta della banca | `contadino` `"a": [0.1, -20.9]`; mano con valigetta | `stabilisci` (`dolly` avanti): apre ampio e segue l'ingresso | traffico, folla, bandiere | passi / ambiente |
| 2 | `@apre` (`2,28`) | Entra e apre la valigetta | Interno banca lungo: contadino al banco e banchiere | `valigetta` `mostra`, contadino guarda giù | `dissolvi 0,27 s`, `mezza` → `due` opposto: dall'esterno dentro sul verbo | cassieri, orologio, vapore | `pop` su «apre» |
| 3 | `@dentro` (`3,98`) → `@sono` (`4,90`) | Non ci sono soldi: il banchiere resta di stucco | Banchiere al banco: prima perplesso, poi sbalordito | `banchiere` `confuso` → `sorpreso` a `@sono` | primo piano + `zoom_veloce` su `banchiere` a `@sono`: la reazione scoppia sulla parola | lampada, cassiere dietro | — |

Regole di senso e racconto (su **tutto** il cartoon):
1. **Un'inquadratura = un'unità di senso**: prima di scrivere il JSON, chiediti *«cosa capisce lo spettatore qui?»* e *«perché taglio proprio qui?»*. Un cambio senza motivo (nuovo soggetto/luogo nominato, causa → effetto, azione → reazione/sguardo, da fuori → dentro o viceversa, dettaglio-prova, apertura del contesto) si toglie o si sposta.
2. **Niente spoiler visivi**: non far vedere nel campo prima l'oggetto o il segreto che la voce rivela solo nella frase dopo (prima la reazione di chi guarda, poi il dettaglio dell'oggetto sulla sua parola).
3. **Arco narrativo dall'inizio alla fine**:
   - **Gancio (0-3 s)**: azione chiara subito, chiusa dalla prima frase compiuta (~1,5-2,5 s).
   - **Sviluppo / spiegazione («Il motivo?», numeri, meccanismo)**: prima **dove/chi** ampio (`stabilisci`/`ambiente`), poi catena visiva lineare **causa → effetto** (se X allora Y); niente inquadrature decorative scollegate da quello che la voce sta dicendo.
   - **Svolte e battute**: usa l'esagerazione visiva (oggetto enorme con `pop`) e **ogni tanto** uno **zoom veloce sul soggetto (`zoom_soggetto` / `snap_zoom` / `zoom_veloce`)**, mai di fila.
   - **Chiusura (finale)**: reazione in primo piano o gru che allarga e richiama la prima immagine (loop).
4. **Ogni sostantivo e verbo visibile** detto dalla voce esiste in scena e si muove/appare **sulla sua parola** (`"t": "@parola"`).
5. **Reazioni**: chi ascolta cambia faccia entro la stessa frase, 0-3 fotogrammi prima della parola che la provoca (oppure parte subito con lo zoom veloce sulla battuta).
6. **Oggetto mancante**: prima `library/vivi`, `library/animati`, `kit/stories/*/` (script e GLB già fatti), poi pacchetti CC0 (`arricchire-ambienti.md`), poi Blender solo per la forma. Mai saltarlo o sostituirlo; di' all'utente cosa hai creato.

## Cast dal copione
Per ogni personaggio nominato nel copione si sceglie il `tipo` di `engine3d/web/cast_rick.js` più vicino a età, mestiere e corporatura. Poi si mettono `ruolo` e `vestito` **solo se il copione li giustifica** (mestiere, divisa, oggetto citato), e un `tessuto` coerente. **Mai due personaggi vicini con lo stesso tipo e colore.** Prima del JSON si presenta il cast in una tabella:

- **Cast disponibile (40 archetipi in `engine3d/web/cast_rick.js`)**:
  - **Quotidiano, età e famiglia (15)**: `impiegato`, `capo`, `nonna`, `nonno`, `bambino`, `bambina`, `ragazza`, `ragazzo`, `ragazzina`, `studente`, `signora`, `palestrato`, `magrolino`, `turista`, `jazz80`.
  - **Servizi, scienza, cultura e affari (11)**: `cuoco` (`folla: false`), `barista`, `medico` (`folla: false`), `chirurgo` (`folla: false`), `professore`, `giornalista`, `fattorino`, `banchiere`, `giudice` (`folla: false`), `ricco`, `detective`.
  - **Mestieri operativi, divise e archetipi speciali (14, tutti `folla: false`)**: `poliziotto`, `pompiere`, `operaio`, `meccanico`, `contadino`, `ufficiale`, `pilota`, `astronauta`, `ladro`, `detenuto`, `cowboy`, `scienziata`, `mago`, `gigante`.
- **Folla e comparse (`COMPARSE` / `RICK_COMPARSA`)**: la folla generica pesca automaticamente solo dai 22 archetipi senza `folla: false`; le comparse nominate possono usare anche ruoli specifici o sinonimi comuni (`dottore`→`medico`, `vigile`→`poliziotto`, `commesso`→`barista`, `avvocato`→`banchiere`, ecc.).
- **Verifica modifiche al cast**: per validare aggiunte o varianti ai personaggi (silhouette, margini, bocca/occhi, schiena, miniatura) esegui `node kit/tools/valuta_personaggio.mjs --tutti`.

| Personaggio | Tipo (`cast_rick.js`) | Gadget (`ruolo`, `vestito`, `accessori`, `tessuto`) | Perché (dal copione) |
|---|---|---|---|
| contadino | `contadino` | `capelliTipo: "basco"`, `maglia: "#c8782a"`, `tessuto: "velluto"` | casaro anziano in osteria (variante calda diversa dal banchiere) |
| banchiere | `banchiere` | `tessuto: "spigato"` | direttore di banca che valuta le forme come garanzia |

## Camera (stile Rick e continuità narrativa)
Regole misurate sui video di Rick (`linguaggio-camera.md` §9-§10) e grammatica di montaggio:
- **Tagli sulla parola**: ogni cambio di scena o inquadratura parte all'inizio della parola che lo motiva (`"@parola"`, entro 0,1 s). Quasi sempre dissolvenza breve (`"passaggio": "dissolvi", "passaggioDur": 0.27`) con `"fermo": 0` (la camera non frena prima di dissolvere); stacco netto (`"taglio": true`) solo per colpi comici o cambi bruschi.
- **[utente 13/11] Ogni inquadratura sceglie la sua mossa** (`"mossa": …`, vocabolario e regole in `movimenti-camera.md`): un solo movimento, deciso da «cosa è cambiato?» nella voce (spinta, allontanamento, panoramica, tilt, carrello, gru, arco, fermo, fluttua, inclina…). **Mai tutte spinta + scorrimento di lato**, mai destra/sinistra alternate per abitudine: la direzione ha sempre una ragione (verso ciò che si nomina dopo, verso lo sguardo, parti opposte = versi opposti). Nella tabella la colonna «Camera» dice: inquadratura · mossa · cosa è cambiato. Niente planate tra due punti sotto i 3,5 s: tienile solo nei rari piano sequenza continui quando lo sguardo deve restare unito a chi cammina o passa un oggetto (`linguaggio-camera.md` §3b).
- **Zoom veloce sul soggetto (stile Rick)**: usa **ogni tanto** (`preset: "zoom_soggetto"` / `"snap_zoom"` o `"zoom_veloce": { "su": id, "fattore": 1.45, "dur": 0.6 }`) sui colpi di scena, sulle reazioni o sulle battute importanti: la camera parte più larga, stringe veloce (+45% in ~0,6 s) sul soggetto e poi rallenta in una spinta dolce. **Mai due di fila.**
- **Legame tra inquadrature vicine**: cambia in modo netto grandezza o angolo (mai due uguali di fila); **regola dei 180°** (i personaggi restano dallo stesso lato dello schermo e chi cammina nello stesso verso); segui la linea di sguardo (chi guarda → ciò che guarda).
- Profondità di campo `"sfocatura": "vera"` (automatica nello stile Rick): stacca il soggetto dal fondo nei primi piani e nei dettagli.

## Varietà e dinamismo [utente, 11/11]
Le riprese continue non bastano: un video di 40-60 s piatto o con tagli casuali non regge. Regole (controllate da `rendi_disegnato.mjs`, avvisi **REGIA** nell'anteprima: vanno risolti prima del video come gli altri controlli):
- **Inquadrature brevi**: nessuna tappa più lunga di 4 s (Rick cambia ogni ~1,2-2,5 s) e nessuna sotto ~0,65 s se non si legge; almeno una tappa ogni 3 s. Non esiste un numero minimo di tagli: una ripresa continua può durare oltre 20 s.
- **Grandezze alternate (anche tra scene diverse)**: mai tre inquadrature di fila della stessa grandezza (`primo piano` / `mezza figura` / `campo largo`). **[utente 13/11] Il `dettaglio` (un oggetto, nessun personaggio nel quadro) è una grandezza a parte, non un primo piano**: al massimo 4 dettagli di fila, poi serve chi guarda o reagisce. Alterna anche l'angolo (`frontale`, `tre quarti`, `dal basso`, `dall'alto`).
- **[utente 13/11] Un soggetto = una ripresa**: si taglia solo quando cambia il soggetto o il luogo. Finché la voce parla della stessa cosa resta **una scena sola con più tappe** (la camera si avvicina, segue l'oggetto con `"guarda_ogg"`, vola con `"volo"`), con un solo viaggio coerente e non una mossa diversa a ogni frase. Tre scene di fila sullo stesso soggetto = avviso REGIA. Dettagli: `movimenti-camera.md` §0b.
- **[utente 13/11] Camera sempre fluida**: anche i movimenti veloci partono e arrivano morbidi e accompagnano quello prima; niente scatti, niente avanti-e-indietro nella stessa ripresa, una mossa sola e chiara nei primi secondi. Gli avvisi **FLUIDITÀ** dell'anteprima (`fluidita.txt`) si risolvono come gli altri (`movimenti-camera.md` §0c).
- **[utente 13/11] Nello stesso luogo di solito non si taglia**: anche verso il punto opposto della stanza la camera vola dentro la scena (`"volo"`), niente stacco né dissolvenza; il taglio resta per i cambi di luogo, i salti di tempo, le reazioni secche e i colpi (non sempre, ma quasi).
- **Durata guidata dalla storia**: nessun limite automatico di 8/15 s nello stesso luogo. Finché resta lo stesso soggetto, la ripresa può proseguire con tappe coerenti; un cambio di luogo o un taglio devono avere un motivo narrativo.
- **Mosse varie tra riprese effettive**: i conteggi delle mosse usano inizi di scena e tagli espliciti, non ogni tappa del movimento. Resta il controllo di ripetizione tra riprese distinte. Anche il controllo di grandezza non conta come tre viste nuove una planata sullo stesso soggetto alla stessa scala; cambi di soggetto, grandezza e tagli restano valutati.
- **Zoom veloce dosato**: al massimo ~20-30% delle inquadrature, solo dove la storia lo chiede.
- **Mondo vasto al primo passaggio**: ogni luogo nuovo ha un campo largo al primo passaggio che mostra dove siamo e quanto è grande (si costruisce anche fuori dal quadro stretto così la camera può allargarsi). Eccezione voluta: il gancio d'apertura che parte dal viso e poi rivela.

## Luce: la decide il copione
Ora e luogo dal testo («alle nove», «al tramonto», «di notte»). `notte` è la luce approvata; `giorno` e `interno` vanno fatti approvare con un fotogramma prima del video. Una scena notturna resa di giorno è un errore grave.

## Arricchimento (sempre, senza che l'utente lo chieda)
- Inventario di ciò che quel posto, in quell'epoca, contiene davvero (15-40 tipi di oggetti), in gruppi leggibili, in scala giusta (`look-disegnato.md` §0b, §8b «mai Roblox»).
- **Mondo vivo**: in ogni inquadratura qualcosa si muove oltre ai personaggi (`mondo-vivo.md`).
- Una piccola sorpresa per luogo che premia chi rivede.
- Facce e gesti cambiano a ogni frase; le comparse fanno qualcosa.
- L'ultimo fotogramma richiama il primo (loop).

## Verifica sull'anteprima (a coppie senza audio)
L'anteprima ha i fotogrammi chiave, `controlli.txt`, `vita.txt`, `ricchezza.txt`, `fluidita.txt` e **`recitazione.txt`**. Prima del render finale controlla che non restino avvisi **RECITAZIONE** (attori trattati come statue immobili, dialoghi con faccia neutra senza gesti). Oltre a controllare ogni riga della tabella (oggetto visibile, azione sulla parola, camera sul soggetto), estrai un foglio con **primo e ultimo fotogramma di ogni inquadratura** e guardalo **senza audio**: si capisce tutta la storia dall'inizio alla fine? Ogni taglio e ogni zoom veloce hanno un «perché» chiaro? Se qualcosa sembra brusco, ripetitivo o anticipa una rivelazione, correggi la tabella di regia e il JSON prima del render finale.
