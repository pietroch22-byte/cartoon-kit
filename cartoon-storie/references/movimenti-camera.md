# Movimenti di camera: il vocabolario (13/11)

Perché esiste: in «matita_spazio» tutte le 28 inquadrature facevano la stessa cosa (spinta + scorrimento di lato, una volta a destra e una a sinistra). **[utente 13/11] Non deve essere tutto una carrellata con zoom: ogni movimento va scelto, dinamico e sensato.**

Fonti (skill open source, lette il 13/11):
- **DirectorSKILL** di wuwangzhang1216 (MIT): `references/cinematic-language.md`, `references/blocking-and-staging.md` — significato di ogni movimento, quando NON usarlo, scala delle grandezze, regola dei 30°.
- **visual-skills** di Serge Shima — github.com/smixs/visual-skills (CC BY 4.0): `video/references/dramaturgy.md` — «cosa è cambiato?» (camera motivata), i tre compiti di un'inquadratura, scala dei ritmi.
- **Misure di Rick**: `asset-kit/riferimenti/claude-animated-shorts/references/reports/motion.md` (20 Short) e `linguaggio-camera.md` §9 (4 Short). Lo stile resta quello: i numeri qui sotto vengono da lì. (Veri frame di Rick indicizzati in `references/riferimenti-rick.md`, consultabili solo su richiesta.)

## 0. La camera è un uccello [utente 13/11]
La camera **vola libera in tutto il mondo 3D**: non sta su un binario davanti al personaggio. Può scattare da un viso a un oggetto, passargli accanto, salire, scendere, infilarsi vicino alle cose. Due regole dell'utente:
- **Volo da un soggetto all'altro** (`"volo": true` sulla tappa d'arrivo, nella stessa scena): la camera parte **sulla parola**, scatta veloce e arriva morbida sull'oggetto nominato (primo piano dell'astronauta → ventola dove finisce la scheggia). Durata da sola (0,45-0,9 s) o `"volo": 0.6`. Non diventa mai uno stacco. Serve che i due soggetti siano nello stesso luogo e che il percorso sia libero (passa accanto al personaggio, non attraverso).
- **Tutti gli zoom partono veloci e rallentano alla fine** (`"curva": "frena"`, già dentro `avanti`, `avanti_lenta`, `avanti_forte`, `risucchio`, `indietro`): velocità ~2,3 volte la media all'inizio, 15% alla fine (non si ferma mai del tutto).

- **Mosso sui movimenti veloci [utente 13/11]**: quando la camera supera ~24 px a fotogramma (voli, panoramiche a frusta, planate rapide) il motore mette da solo la sfocatura di movimento, come Rick sugli scatti: scia fino a ~60% dello spostamento del fotogramma, piena sopra 60 px/f. Sotto la soglia non cambia nessun pixel. Solo nel render vero (non nell'anteprima). Si regola con `"mosso": { "otturatore": 0.6, "soglia": 24, "pieno": 60, "max": 16 }` nella storia o nella scena; `"mosso": false` lo spegne. Costa fino a 16 passate in più solo per quei fotogrammi (il volo di prova: 23 fotogrammi).

**Dove si mette la camera (regole estratte dai veri frame di Rick; se l'utente chiede un confronto visivo vedi `references/riferimenti-rick.md`)**: Rick non sta quasi mai ad altezza occhi, di fronte, col soggetto al centro. Usa:
- dal basso a terra guardando in su (la scala che sale, il personaggio piccolo in un angolo in primo piano);
- da dietro la testa o sopra la spalla, con la testa enorme e sfocata in primo piano che guarda la cosa;
- dall'alto (cerchio di sedie, campo di battaglia, torre) per far capire lo spazio;
- **attraverso qualcosa** (oblò, sbarre, un buco nero attorno al viso);
- oggetto che riempie tutto il quadro (biglietti, cassa, pulsante), spesso storto di qualche grado;
- soggetto fuori centro e tagliato dal bordo, con qualcosa di grande davanti.
Quindi per ogni inquadratura chiediti anche **da dove guarderebbe un uccello curioso**: se tre inquadrature di fila sono «altezza occhi, di fronte, al centro», cambiane una.

## 0b. Un soggetto = una ripresa [utente 13/11]
**La camera ha una regia: non taglia e non cambia movimento a ogni frase.** Errore visto in una prova: tra 21 e 27 s tre cambi di scena sulla stessa matita, ognuno con un movimento diverso. Regole:
- **Si taglia (scena nuova, dissolvenza o stacco) solo quando cambia il soggetto o il luogo**: da un oggetto a chi lo guarda, da un posto a un altro, dal dettaglio alla conseguenza larga.
- **Finché la voce parla della stessa cosa, la ripresa è una sola**: una scena con più tappe sulle parole. La camera fa **un solo viaggio coerente** (per esempio sempre più vicina, o dietro all'oggetto che si muove), non una mossa diversa a ogni tappa.
- **Se l'oggetto si muove, la camera lo segue**: `"guarda_ogg": "<id dell'oggetto del luogo>"` nella tappa a mano (resta `"guarda"` come riserva). La scheggia che si stacca, galleggia e viene risucchiata è un'unica ripresa che le sta dietro.
- **Da un viso alla cosa che guarda**: `"volo": true`, nella stessa scena, non un taglio.
- **[utente 13/11] Stesso luogo = quasi sempre niente taglio, anche se il punto di vista è opposto**: se la camera deve andare da un angolo della stanza all'altro, dal campo largo al viso, dal viso all'oggetto, **vola dentro la scena** (`"volo": true`, o una planata) invece di tagliare, e nemmeno la dissolvenza breve di Rick. Vale la maggior parte delle volte, non sempre: il taglio o la dissolvenza restano quando cambia il tempo (un ricordo, «nelle prime missioni»), per una reazione secca, per un colpo (la scintilla), o quando la ripresa supererebbe i 15 s. Il taglio vero si tiene per i cambi di luogo.
- Due scene di fila sullo stesso soggetto vanno bene (largo → stretto). **Alla terza il controllo REGIA avvisa** («N scene di fila sullo stesso soggetto: fanne una ripresa sola»). Vale per gli oggetti sullo stesso banco (entro ~0,8 m) e per lo stesso personaggio.
- Una ripresa continua può durare fino a 15 s; scene tagliate nello stesso luogo restano a 8 s. Ogni tappa dentro la ripresa dura al massimo 4 s: **una tappa è un cambio d'inquadratura dentro la ripresa, non un taglio**.
- La varietà delle mosse (§4) si cerca **tra una ripresa e l'altra**, non cambiando mossa a ogni frase sulla stessa cosa.
Esempio (`kit/stories/matita_spazio/prova_camera_v3.json`, 20,1-37,3 s): prima 5 scene con 5 mosse; ora 2 riprese. A: matita → «si spezza» (più vicino + scossa) → la camera segue la scheggia che galleggia. B: viso dell'astronauta che capisce → volo sulla ventola a «risucchiato» → scorre sui fili. Tagli: 3 invece di 6.

## 0c. Sempre fluida, anche quando è veloce [utente 13/11]
**Nessun movimento di camera deve essere brusco o a scatti: anche i più veloci accompagnano il movimento, con una partenza e un arrivo morbidi.** (Detto dall'utente sulla prova v4: l'inizio del video era «troppo brusco e scattoso»; dal resto in poi andava bene.) Cosa c'era di sbagliato all'inizio e cosa vale per sempre:
- **Un movimento alla volta, uno dentro l'altro**: un volo finiva mentre era già partito il movimento dopo (l'arco) e la camera saltava di colpo. Ora ogni passaggio ha la sua finestra di tempo e due finestre non si sovrappongono mai; la mossa dell'inquadratura d'arrivo comincia mentre il volo sta ancora atterrando, così lo prosegue.
- **Niente strappi dentro una mossa**: arco e gru erano fatti di più pezzi che partivano e si fermavano. Ora sono un movimento solo e continuo.
- **Ogni mossa parte da ferma in ~0,25 s** (`"rampa"`), anche gli zoom che «partono veloci»: veloce vuol dire che raggiunge presto la velocità, non che scatta al primo fotogramma.
- **I voli durano quanto serve per restare morbidi**: 0,68-1,5 s, più lunghi se la distanza è grande (accelerazione sotto ~15 px/f²); la direzione dello sguardo ruota in modo regolare; atterraggio lungo. Le planate: 0,75-2,2 s, accelerazione sotto ~5 px/f².
- **Un solo verso per ripresa**: non avvicinarsi e poi riallontanarsi (o destra e poi sinistra) dentro la stessa ripresa in pochi secondi. Prima del volo verso un viso, l'inquadratura larga spinge poco (`avanti_lenta`), così il volo continua ad avvicinarsi invece di tornare indietro.
- **Mai tre movimenti diversi nei primi 5 secondi**: il gancio vuole una spinta sola e chiara; il resto arriva dopo.
**Controllo automatico** (nessun render): `node kit/tools/rendi_disegnato.mjs <storia.json> --profilo` (dalla cartella `engine3d`; `--scena N` per una sola; `--numeri` stampa la velocità fotogramma per fotogramma) → `out/<nome>/fluidita.txt`. Gira anche da solo nell'anteprima. Avvisa **FLUIDITÀ** quando la velocità della camera cambia di colpo: più di 6 px/f in un fotogramma fuori dai voli, più di 18 dentro un volo, o un'inquadratura che parte già oltre 20 px/f. **Mai il video finale con un avviso FLUIDITÀ**: si allunga il movimento o si sposta la tappa. Limite: la misura segue la camera, non dice se il risultato «sembra» bello: l'inizio si guarda comunque.

## 1. La regola che decide tutto: «cosa è cambiato?»
La camera si muove solo se nel racconto è cambiato qualcosa. Prima di scegliere la mossa, rispondi in una riga:
| Cosa è cambiato nella voce | Mossa |
|---|---|
| Una cosa diventa più importante, pressione, si capisce qualcosa | `avanti` (lenta se è una spiegazione, forte sulla parola chiave) |
| Qualcosa tira dentro, cade, precipita | `risucchio` (spinta lunga e di scatto) |
| La voce passa da chi guarda alla cosa guardata, nello stesso posto | `"volo": true` sulla tappa della cosa (scatto) |
| Il pensiero è finito, conseguenza, «tutto/intero», solitudine, morale | `indietro` (parte solo dopo che il momento è chiuso) |
| Si nomina una seconda cosa legata alla prima; uno sguardo; un oggetto lungo | `pan` verso quella cosa (`verso_a`) |
| Altezza, autorità; dall'oggetto al viso; qualcosa sale | `tilt_su` |
| Dal titolo alla prova, dal viso alle mani; qualcosa cade | `tilt_giu` |
| Si entra in un luogo nuovo, si percorre una fila, un viaggio | `carrello` (o `gru_giu` per entrare dall'alto) |
| Qualcuno cammina e il tragitto conta | `segui` |
| Finale, liberazione, il luogo si apre | `gru_su` |
| Minaccia attorno a chi sta fermo, confronto, trasformazione | `arco` (1 per video) |
| Battuta secca, imbarazzo, attesa prima del colpo, il quadro recita da solo | `fermo` |
| Senza peso, sogno, nave, ubriaco | `fluttua` |
| Bugia, qualcosa non torna, follia, «a testa in giù» | `inclina` (max 2 per video) |
| «Oh no»: realizzazione che toglie il terreno | `vertigine` (1 per video) |
| Colpo fisico: si spezza, sbatte, scoppia | `"scossa": { "f": 1.2, "t": "@parola" }` sopra la mossa che c'è |
| Non è cambiato niente | nessuna inquadratura nuova: togli il taglio |

Ogni inquadratura deve fare almeno uno di tre compiti: cambiare un'emozione, far avanzare l'azione, alzare la pressione. Se non ne fa nessuno si toglie.

## 2. Come si scrive
L'**inquadratura** (grandezza e angolo) e la **mossa** (movimento) sono due scelte separate:
```json
{ "t": "@poteva", "preset": "primo_piano", "su": "astronauta", "mossa": "arco" }
{ "t": "@La", "pos": [0, 1.8, 2.5], "guarda": [0, 1.2, -10.5], "fov": 75, "mossa": "carrello", "verso": 1 }
{ "t": "@grafite", "pos": [...], "guarda": [...], "mossa": "pan", "verso_a": [-0.29, 0.12, -5.09] }
```
- `"mossa"` funziona con un `preset` d'inquadratura, con `su`+`testa`, o con `pos`+`guarda`. Le voci scritte nella tappa vincono sempre.
- **Una mossa = un solo movimento dominante**: niente scorrimento di lato «di contorno». Mai due insieme (spinta + arco).
- **Tratto fisso come Rick**: la mossa percorre sempre la stessa quantità (`tratto` % di ingrandimento, `panTratto` px a 1080x1920), quindi inquadratura corta = veloce, lunga = lenta. Di base l'inquadratura scritta è il **punto di mezzo** (regola delle inquadrature ampie).
- `"ancora": "fine"` = la mossa **arriva** sull'inquadratura scritta (rivelazioni: pan o tilt che finisce sulla cosa nominata, sulla sua parola); `"inizio"` = parte da lì.
- `"verso": 1 | -1` (destra | sinistra) per `pan` e `carrello`; `"verso_a": "<attore>"` o `[x, y, z]` punta la mossa verso quel soggetto.
- Elenco e numeri: `MOSSE` in `engine3d/web/camera_preset.js`.

| Mossa | Cosa fa | Numeri |
|---|---|---|
| `fermo` | quasi ferma (spinta minima 1,5 %/s) | — |
| `avanti` / `avanti_lenta` / `avanti_forte` | spinta dritta | +18% / +8% / +28% (arriva forte e frena) |
| `risucchio` | spinta lunga e di scatto | +34% |
| `indietro` | allarga, parte piano | −16% |
| `pan` | la camera gira di lato (ferma sul posto) | 240 px |
| `tilt_su` / `tilt_giu` | la camera gira in su / in giù | 200 px |
| `carrello` | la camera si sposta di lato: parallasse | 140 px contati sul punto guardato (ciò che è più vicino scorre di più: con `guarda` lontano usa `"panTratto": [70, 0]`) |
| `gru_su` / `gru_giu` | sale / scende di 1,2 m (`"salita"` per cambiarlo); con `pos`+`guarda` **arriva** sull'inquadratura scritta | planata ≤ 2 s |
| `arco` | 30° attorno al soggetto (vuole `su`) | — |
| `segui` | accompagna chi cammina | — |
| `fluttua` | rollio che scorre per tutta l'inquadratura | 5° totali (`"rollioTratto"`) |
| `inclina` | camera storta | 6° (`"rollio"`: fino a 10 su una gag) |
| `vertigine` | avanza e allarga l'obiettivo: soggetto uguale, fondo che scappa | +30% |
Effetto sopra qualsiasi mossa: `"scossa"` (7 fotogrammi, cambia verso a ogni fotogramma come Rick).

## 3. La direzione non è mai a caso
Destra o sinistra si sceglie con una ragione, in quest'ordine:
1. **Verso ciò che la voce nomina dopo** (il soggetto dell'inquadratura seguente): `verso_a`.
2. **Nel verso dello sguardo o del cammino** del personaggio (spazio davanti a lui).
3. **Parti opposte = versi opposti**: se due luoghi o due squadre si contrappongono (America / Russia), uno va sempre a destra e l'altro sempre a sinistra, per tutto il video.
4. **Stesso soggetto = stesso verso** tra inquadrature vicine (la direzione sullo schermo sopravvive al taglio).
Mai alternare destra/sinistra per abitudine: se non c'è una ragione, la mossa non è laterale.

## 4. Varietà (controllata dagli avvisi REGIA dell'anteprima)
- **Dettaglio ≠ primo piano [utente 13/11]**: primo piano = un **viso** grande; dettaglio = un **oggetto**, nessun personaggio nel quadro. Il controllo li distingue da solo (camera a mano senza attori nel quadro e obiettivo sotto 66° = dettaglio; più largo = campo largo; `"grandezza": "dettaglio" | "primo piano" | "mezza figura" | "campo largo"` nella tappa per deciderlo a mano). Viso → oggetto → viso non conta come «tre uguali di fila». Una catena di dettagli va bene fino a 4; alla quinta avvisa: mostra chi guarda o reagisce.
- Mai la stessa mossa tre volte di fila tra riprese diverse (dentro una ripresa lo stesso movimento che prosegue va bene); una mossa non supera ~45% delle inquadrature (Rick spinge in avanti nel 73% dei casi, ma alterna allontanamenti — 180 contro 336 spinte —, rollii, gru, panoramiche e scosse).
- Almeno 5 mosse diverse in un video intero; `arco`, `vertigine`, `frusta` una volta sola; `inclina` al massimo due.
- Più del 40% di inquadrature senza `"mossa"` = avviso (fanno tutte la spinta + laterale automatica).
- **Ritmo a scala**: lunga, più corta, più corta, pausa (`fermo`), colpo. Prima del taglio più forte ci va sempre una pausa.
- `fermo` non è pigrizia: serve quando si muove il quadro (un oggetto che galleggia, una faccia che cambia) o quando la battuta è la faccia.

## 5. Quando NON usarla
- `avanti` se la faccia o la cosa non cambia durante la spinta: promette una svolta che non arriva.
- `indietro` prima che il momento sia chiuso.
- `pan` / `tilt` per mostrare quello che il campo largo ha già mostrato.
- `arco` su un dialogo tranquillo; mai oltre ~45° (regola dei 180°).
- Camera che si muove mentre un personaggio si gira o attraversa il primo piano: i due movimenti si disturbano → `fermo`.
- `carrello` e `gru` in un set che non regge (muri mancanti): allarga il mondo, non stringere la camera.
- Sagome: mai oltre ±25° sopra o sotto gli occhi (`linguaggio-camera.md` §7); la gru sui personaggi resta entro questo limite.

## 6. Nella tabella di regia
La colonna «Camera» ha tre cose: **inquadratura · mossa (e verso) · cosa è cambiato**. Esempio: `primo piano · arco · «poteva uccidere»: il pericolo gli gira attorno`. Senza la terza voce la riga non è finita.

## 7. Prova fatta e limiti
- Prova: `kit/stories/matita_spazio/prova_camera_v2.json` (stesse inquadrature, 13 mosse diverse su 29 inquadrature); foglio `~/STORIE CARTOON/confronti/camera_mosse_v1_prima_dopo.jpg`. **Da approvare dall'utente sul video**: finora visti solo fotogrammi di inizio e fine.
- Volo e curva «frena»: approvati dall'utente a voce il 13/11 («vanno bene») su `~/STORIE CARTOON/confronti/camera_volo_v1_prova.mp4`. Mosso: chiesto dall'utente e aggiunto, clip `confronti/camera_volo_v2_mosso.mp4` (**da approvare**); il mosso muove solo la camera (personaggi e oggetti che si muovono da soli non lasciano scia).
- Non ancora provate in un render: `vertigine`, `segui`, `gru_su`, `tilt_su` su un personaggio.
- Non ci sono ancora: cambio di fuoco come mossa (da un piano all'altro), panoramica a frusta con mosso vero.
- Lo zoom veloce (`zoom_soggetto`) resta **non approvato**.
