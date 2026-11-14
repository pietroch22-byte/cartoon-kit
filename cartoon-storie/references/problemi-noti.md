# Problemi noti e rimedi (dal «Parmigiano da zero», 12/11)

Tutto quello che è andato storto rifacendo un video intero da zero con il motore, con il sintomo che si vede, la causa e cosa fare.
Leggila **prima di scrivere i luoghi e la storia** e ripassala sul contact sheet. Le regole [utente] non si cambiano senza chiedere.

## 1. Luce e ombre
| Sintomo | Causa | Rimedio |
|---|---|---|
| In un luogo chiuso ci sono ombre che non vengono da nessuna lampada visibile | la luce Rick usava un «sole» nascosto dietro la camera | **[utente]** nei chiusi luce e ombre solo dalle lampade inquadrate (fatto nel look, solo con luce Rick). Ogni lampada visibile deve avere una `M.luce` vera vicina (sotto il paralume). Lampada fuori quadro = niente ombre portate. |
| Una stanza intera diventa lilla (tutto «in ombra») | lampade DIETRO un muro contate come visibili | il look scarta le lampade coperte da muri/pavimenti/soffitti; per volumi pieni (scaffali) il luogo dichiara `M.root.userData.occlusori = [Box3…]` |
| Muro di fondo lilla anche col lampadario davanti | una direzione unica per una lampada vicina | (risolto) la luce di ogni punto viene dalla posizione vera della lampada |
| Luogo segnato chiuso/aperto in modo sbagliato (portici) | prima lo si indovinava con un raggio | il luogo è chiuso se NON ha `"esterno": true` (`chiuso` passato al look) |
| Bagliore bianco enorme su lampadari, porte scorrevoli, vetri | riflesso speculare di metalli/vetri lucidi vicino a una luce vera: il tetto di luce non lo ferma | metalli `roughness ≥ 0,6`, `metalness ≤ 0,15`; luce vera SOTTO il paralume, non dentro; GLB vivi: `smorza(oggetto)` (oggetti_zero.js) |
| Bagliore bianco in fondo a corridoi lunghi (70 m) | nebbia luminosa del look su grande profondità | nei parametri del luogo `"nk": 0.05` |
| TROPPO_CHIARO (media > 190) | muri crema/calce + carta bianca che riempiono il quadro | tinte di calce più calde e scure (#e6d4b4), carta #efe4cc; tetto di luce per luogo o scena: `"parametri": { "lr_cap": 0.62-0.72 }` |
| NERO_PIENO su un display | fondo nero puro | fondo scuro colorato (#1e4438), mai #000 |
| Il rosso diventa arancione | il mondo Rick v1 e la saturazione della luce spostano la tinta | colori pieni: non toccarli; per i pavimenti rossi usare bordeaux (#8e4a4c), non salmone |
| Strisce/cunei neri su uno schermo | due superfici sullo stesso piano (z-fighting) | la cornice/il pannello dietro va 1-3 cm più indietro |

## 2. Personaggi Rick (sagome piatte) vicino agli oggetti
| Sintomo | Causa | Rimedio |
|---|---|---|
| Lo scaffale/il bancone taglia il corpo; l'oggetto passa davanti alla pancia | la sagoma s'inclina verso la camera facendo perno sui piedi (fino a 35°): con la camera più alta del suo centro la parte alta va indietro di ~0,3 m | nei dettagli vicini agli oggetti camera a ~1 m d'altezza; personaggi ad almeno 0,3 m dai mobili |
| La mano non arriva all'oggetto, l'oggetto «galleggia» da solo | la mano si disegna sulla tela della sagoma: portata laterale (vista dalla camera) ≤ ~0,27 m dal centro del corpo | mettere l'oggetto di lato, entro 0,27 m; scegliere l'angolo di camera che lo porta di fianco al corpo |
| L'oggetto toccato attraversa la sagoma | l'oggetto sta a cavallo del piano della sagoma | l'oggetto tutto davanti o tutto dietro la sagoma (es. la forma da battere su un carrello in corsia, non nello scaffale) |
| Le mani sono palline | (risolto 12/11) | mani con palmo, pollice e dita: `manoPosa` nel personaggio o `"posa"` nell'azione: `aperta` (di base), `pugno` (da sola in `batte`), `presa` (da sola quando prende/porge), `indica` (da sola in `indica`), `punto` (la vecchia pallina) |
| Mani o oggetti staccati dal corpo | **[utente]** non si fanno mani 3D sole | il gesto lo fa il personaggio: `prende`, `porge`, `batte` (con `colpi`) |
| Nel colpo la sagoma si gira ed entra nel mobile | l'azione cambiava la direzione del corpo | `batte` muove solo la mano; per manopole/sportelli/piani usa `gira`, `preme`, `tocca`, `apri`, `chiudi`, `appoggia` in `interazioni.js` (calcolo automatico sosta lungo la normale `dist: 0,44` e continuità d'orientamento) |
| Tipo errore `Cannot read properties of null (reading 'matrixWorld')` in `Sprite.raycast` quando si prende/lascia un oggetto in stanze con fumo/vapore | un `Raycaster` su `M.root.children` privo di `rc.camera = camera` colpisce uno `Sprite` (`vapore`) | (risolto 13/11) tutti i `Raycaster` di `storia_disegnato.js` impostano `rc.camera = camera` |
| Un oggetto nominato nello script del luogo (es. `macinapepe`, `tavolo`) non viene raccolto da `prende`/`appoggia` | non era registrato esplicitamente in `OBJ[id]` | (risolto 13/11) `storia_disegnato.js` auto-risolve in `OBJ` gli oggetti nominati in `M.root` usati da scena/azioni/camera |
| Il cassiere è un cuoco, la cassiera arrabbiata | le comparse Rick prendevano tipo e faccia a caso | `M.omino({ …, tipoRick: 'impiegato', posa: 'seduto_banco' })`, o `comparsa(M, x, z, ry, tipi)` di oggetti_zero.js (pose asimmetriche e cenni lenti automatici in `storia_disegnato.js`) |
| Il personaggio seduto o chino sembra sospeso o la camera gli guarda sopra la testa | `ALTT` usava sempre altezza in piedi e non esisteva perno sull'anca | usare `posa: 'seduto' | 'seduto_alto' | 'seduto_banco'` (`sedutoDropPx` scala da solo gambe e mira camera/sguardi) e `chino` / `torsoPiega` per piegarsi tenendo i piedi fissi a terra |
| Attore fermo come una statua in campo medio/primo piano | mancano cambi di faccia, posa, gesto o sguardo tra le parole | usare `"parla": true` + gesti (`spiega`, `telefona`, `beve`, `scrive`, `pensa`…), `"sguardo"` verso chi parla/agisce, `"vfx"`; controllare `recitazione.txt` nell'anteprima |
| Il gatto è grande come una mucca | i GLB Quaternius hanno scale diverse | `animato(M, nome, { alt: 0.32 })` (altezza in metri), mai `s` |
| SOVRAPPOSTI / SOGGETTO_COPERTO da una comparsa | comparse sul percorso del protagonista | tenere le comparse fuori dalla linea camera→protagonista |

## 3. Camera e regia
| Sintomo | Causa | Rimedio |
|---|---|---|
| Camera «scattosa», scatti fino a 150 px/fotogramma | planate tra tappe sempre di 0,8 s anche per spostamenti di metri | (risolto nel motore) la planata dura in base allo spostamento, picco ~20 px/f come Rick; se non c'è tempo diventa uno stacco (il registro lo dice: `[d] camera: tappa …`). Spostamenti grandi = scene o `zona` nuove |
| La camera va destra-sinistra-destra a caso | la panoramica di base cambiava segno a ogni tappa | (risolto) stessa direzione in tutta la scena; `"camera_rick": { "verso": 1 | -1 }` per sceglierla |
| Un fotogramma tutto di un colore all'inizio di una scena | la spinta a tratto fisso parte «più larga»: in `dolly` la camera arretrava dentro un muro o un mobile | (risolto) la camera non va mai più indietro della posizione scritta: la parte larga la fa l'obiettivo |
| La camera attraversa scaffali o banconi in una planata | la planata va dritta tra due posizioni | spostamenti che passano attraverso i mobili: stacco (scena nuova o `zona`) |
| Negli stacchi ravvicinati la camera guarda il vuoto | con `glide: "lens"` (di base) la camera resta ferma e gira | `"camera_rick": { "glide": "dolly" }` quando le tappe cambiano posizione |
| REGIA: «tutte primo piano», «nessun campo largo» anche con inquadrature larghe | la REGIA misura la grandezza dalla distanza **pos→guarda** (campo largo = testa 0,9 m < 11% del quadro: con fov 72 servono > 10 m) | allungare `guarda` nella stessa direzione (non cambia l'inquadratura) |
| Teste al 36-42% del quadro (Rick 20%) | obiettivi stretti | **[utente] inquadrature ampie**: primi piani fov 50-60, non 36-46 |
| SOGGETTO_FUORI nei dettagli di oggetti | il controllo cerca sempre il personaggio più vicino al centro | dettagli senza personaggi = scena (o `zona`) a sé senza attori |
| Un oggetto sparisce nella scena dopo | ogni scena riparte da zero: gli OBJ nascosti restano nascosti | rimostrare (`"fai": "mostra"`) in OGNI scena che li inquadra |
| `tempo non valido: @12` | le parole che cominciano con una cifra non si possono usare come tempo | tempo in secondi |
| Avviso «azione fuori dalla scena» | azioni prima di `da` (es. prendere un oggetto prima dello stacco) | va bene: è voluto (le azioni sono funzioni del tempo) |

## 4. Mondo vivo (vita.txt sotto il 60%)
| Causa | Rimedio |
|---|---|
| il conteggio prende solo oggetti < 4,5 m e non `struttura`: mobili fissi (banconi, tavoli, cornici, archi) contano come «fermi» | segnare `userData.struttura = 1` sui mobili e pezzi architettonici fissi |
| cose mosse da `M.tick` (porte, contatori, calendari) non risultano vive | `userData.vivo = '<nome>'` sul gruppo |
| comparse ferme | respirano (`comparsa()` lo fa da sola); lampade appese pendolano piano |

## 5. Codice degli script dei luoghi
- **Mai `//` in mezzo a una riga con altro codice dopo**: due volte ha commentato il resto della riga (e una volta nel motore aveva spento la riga delle comparse Rick). Usare `/* … */`.
- Gli script si aggiungono solo a `M.root`; `node --check file.js` prima di ogni render.
- Le prove dei luoghi si fanno con un JSON di prova (`prova_<luogo>.json`) con 3-6 tappe fisse e `--solo-fotogrammi --passo 30` (un fotogramma a scena).

## 6. Sfarfallio e audio
- **Tremolio dei dettagli fini** (contorni sottili, piastrelle, scaffali lontani che «friggono» in movimento): `kit/tools/tremolio.py` (severo, flusso ottico) gira da solo prima del montaggio e ferma il video se trova problemi; mappa rossa dei punti che tremano (`kit/out/<nome>/tremolio/`). Criterio: il pixel è diverso da TUTTI E DUE i vicini riallineati e i due vicini si somigliano; bocciato se trema in media > 0,3% del quadro, o un fotogramma > 2%, o lo stesso punto in 4 fotogrammi su 5 su > 0,5%. Rimedi, in ordine:
  - righe sottili e fitte nelle texture (fughe, stecche, puntini, griglie del soffitto): più larghe (≥ 4-8 px sulla texture), meno contrasto (alpha 0,2-0,4), oppure due toni pieni senza righe;
  - scacchi e motivi: stessa misura su tutte le facce dello stesso oggetto (bordo tovaglia = piano);
  - cifre e scritte che cambiano: al massimo ogni 4 fotogrammi (`Math.floor(t*7.5)/7.5`), mai a ogni fotogramma;
  - ombre a righe di pezzi sottili (montanti, sbarre, traverse < 15 cm): `.castShadow = false` su quei pezzi;
  - particelle piccole (fiocchi, polvere): rotazione lenta, niente facce più sottili di 1 px;
  - antialiasing `"ss": 2` nei parametri del luogo (render doppio, linee uguali): toglie il resto. **Di base con Rick dal 12/11** (`"ss": 1` nei parametri del luogo lo spegne; il render dura di più).
- **Audio**: il mix del motore può superare 0 dBFS di picco. Dopo il montaggio: `ffmpeg -af ebur128=peak=true`; se il picco è sopra -1 dBTP, loudnorm lineare a -14 LUFS / -1,5 dBTP (due passaggi) copiando il video.
- Copia per il telefono sotto i 30 MB: `ffmpeg -i video.mp4 -c:v libx264 -crf 26 -c:a copy video_leggero.mp4`.
