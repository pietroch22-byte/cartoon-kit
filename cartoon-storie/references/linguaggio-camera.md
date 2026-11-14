# Linguaggio della camera: scegliere l'inquadratura per ciò che deve provare lo spettatore

Fonti: sintesi di skill open source con licenza MIT (nolanx-ai «shot-size-and-angle-language» e «director-visual-language», fal-ai «cinematography», Rylaispirit «cinematic-video-prompt-skill»), adattate al motore 3D e allo stile del video di riferimento. Le distanze e i movimenti restano quelli del riferimento (`reference-completo.md`, `piano-reference.md`).

## 0. Come si scrivono queste inquadrature nel motore «disegnato»
I nomi tra backtick in questa guida (`primo_piano`, `gru_rivela`…) sono **tipi di inquadratura**, non comandi: nel JSON si scrivono come tappe di camera (`storia-disegnato.md`, «Camera»). Traduzione:
| tipo | tappa |
|---|---|
| `ecu`, `primo_piano_finale` | `{"su": id, "testa": 0.30, "angolo": 0}` |
| `primo_piano` | `{"su": id, "testa": 0.22, "angolo": 15}` |
| `mezza_figura` | `{"su": id, "testa": 0.14}` |
| `due_figure_*`, `tre_quarti` | tappa a mano (`pos`, `guarda`) a metà tra i due, 3,5-5 m, `angolo` 30-45° per il tre quarti |
| `ambiente`, `campo_lungo_alto` | tappa a mano alta (3-5 m) e larga (7-8 m), `guarda` sul centro del luogo |
| `dettaglio_oggetto`, `dall_alto_oggetto` | tappa a mano a 0,8-1,5 m dall'oggetto (dall'alto: `pos` sopra, poi una seconda tappa a 3/4) |
| `rivela_dal_viso`, `gru_rivela` | due tappe: primo piano, poi tappa lontana e alta sulla parola che rivela |
| `dal_basso_rivela`, `dal_basso_eroe`, `tilt_cielo` | `alt` 0,4-0,9 e `guardaAlt` alto |
| `accompagna`, `carrello_*` | tappa `{"su": id, "segue": true, "dist": 2.9, "angolo": 70-90}` mentre l'attore cammina |
| `passaggio`, `piano_sequenza` | tappe in fila, ognuna sulla parola (`"t": "@parola"`) del soggetto che diventa importante |
| `zoom_soggetto`, `snap_zoom` | `{"t": "@parola", "preset": "zoom_soggetto", "su": id}` (o `"zoom_veloce": true \| { "su", "t", "fattore", "dur" }` su `pos`+`guarda`) |
Distanze tipiche del riferimento: primo piano 1,9-2,2 m, mezza figura 2,7 m, due figure 3,7-5 m, campo largo 7-8 m (con i nostri personaggi a scala 1 usa `testa`, che calcola la distanza da sé).

## 1. Ogni inquadratura ha una funzione
Prima di scegliere il modello scrivi nella tabella di regia **cosa deve capire o provare lo spettatore** in quel momento. Il modello viene da lì, mai dal caso. Cambiare grandezza dell'inquadratura = cambiare cosa è più importante.

| Funzione | Grandezza | Modelli |
|---|---|---|
| Dove siamo, geografia, scala, nuovo luogo | campo lunghissimo / lungo | `ambiente`, `campo_lungo_alto`, `gru_rivela` |
| Corpo, azione, rapporto tra personaggi e ambiente | figura intera | `due_figure_soglia`, `due_figure_frontale`, `tre_quarti` |
| Battuta, dialogo leggibile | mezza figura / primo piano | `mezza_figura`, `primo_piano` |
| Emozione forte, realizzazione, ossessione | primo piano / primissimo | `primo_piano_finale`, `ecu`, `vertigine` |
| Importanza di un oggetto, indizio | dettaglio | `dettaglio_oggetto`, `dall_alto_oggetto` |
| Rivelare ciò che non si vedeva | allontanarsi | `rivela_dal_viso`, `gru_rivela`, `dal_basso_rivela` |

## 2. Angolo = significato
- **Altezza degli occhi**: neutro, realistico, confronto alla pari (default del riferimento).
- **Dal basso**: potere, minaccia, grandezza, trionfo → `dal_basso_eroe` (persona), `dal_basso_rivela` / `tilt_cielo` (oggetto grande o che arriva dall'alto).
- **Dall'alto**: personaggio piccolo, vulnerabile, sopraffatto → `dall_alto_vulnerabile`; per oggetti e schemi → `dall_alto_oggetto`.
- **Profilo / tre quarti**: il tre quarti è il ritratto più leggibile; il profilo dà distanza e mistero.

## 3. Movimento = emozione (uno solo per inquadratura)
**[13/11] Il vocabolario completo delle mosse, come sceglierle («cosa è cambiato?») e come si scrivono (`"mossa": …`) sta in `movimenti-camera.md`: leggilo prima di scrivere la camera.** Qui sotto il riassunto.
- **Avvicinarsi lentamente** (quasi tutti i modelli del riferimento): attenzione, intimità, capire qualcosa.
- **Allontanarsi**: solitudine, chiusura, rivelare il contesto.
- **Zoom veloce sul soggetto (`zoom_soggetto`, `snap_zoom`, `"zoom_veloce"`)**: comicità, sorpresa, svolta o reazione improvvisa. Stringe veloce (+45-50% in ~0,6 s) centrando `"su"` (o `"punto"`) poi rallenta in una spinta dolce; usalo **ogni tanto** sulle battute chiave, mai a raffica.
- **Vertigine** (`vertigine`): realizzazione improvvisa, panico, "oh no".
- **Arco** (`arco`): momento eroico o decisivo; raro, al massimo una volta per video.
- **Seguire** (`carrello_basso_segue`, `carrello_fila`): personaggio o gruppo in movimento; per un tragitto intero `accompagna` (§3b).
- **Salire** (`gru_rivela`): grandezza, finale, conseguenze che si allargano.
- **Quasi fermo** (`dettaglio_oggetto`): far leggere un dettaglio. Un'inquadratura non è mai del tutto ferma.

## 3b. Movimenti continui: quando NON staccare
Il riferimento stacca quasi sempre. Il movimento continuo si usa solo quando lo stacco spezzerebbe un legame che lo spettatore deve sentire; altrimenti stacca.
| Situazione nel copione | Modello | Perché |
|---|---|---|
| Un personaggio va da un punto all'altro e il tragitto conta (va al frigo, attraversa la piazza, scappa) | `accompagna` | lo spettatore cammina con lui e vede lo spazio che attraversa |
| Il personaggio nomina o guarda un oggetto e la causa-effetto deve restare unita («guarda… la torta») | `passaggio` | lo sguardo dello spettatore segue quello del personaggio, senza perdere chi parla |
| Un'azione a catena nello stesso luogo (prende, porta, posa; uno passa la cosa all'altro) | `piano_sequenza` con 2-4 tappe | la catena si capisce perché non viene interrotta |
| Battuta comica, sorpresa, rivelazione di grandezza, luogo nuovo | stacco (modelli del riferimento) | lo stacco è il colpo comico; non ammorbidirlo |
Regole: al massimo 1-2 movimenti continui ogni 30 s (sono un'eccezione, come nel riferimento); ogni tappa è comunque un'inquadratura del riferimento (stesse distanze e altezza degli occhi); la camera arriva sull'oggetto **sulla sua parola**; niente tappe sotto 1 s; mai un movimento continuo che giri attorno ai personaggi oltre ~45° (resta la regola dei 180°). La planata la decide il motore (0,8-2,5 s, morbida): non scriverla a mano.

## 4. Composizione
- Testa sul terzo superiore, un po' d'aria sopra; spazio davanti allo sguardo (chi guarda a destra sta a sinistra).
- Tre livelli di profondità: qualcosa in primo piano al bordo, il soggetto, uno sfondo ricco.
- Linee guida (tavolo, fila, strada) che portano l'occhio al soggetto.
- Niente oggetti grandi tra camera e viso; niente teste tagliate a metà sopra gli occhi.

## 5. Copertura e montaggio
- Ogni stacco cambia grandezza o angolo in modo netto (almeno ~30° o un salto di grandezza): niente stacchi quasi uguali.
- Regola dei 180°: in una scena con due personaggi la camera resta dallo stesso lato della linea che li unisce; la direzione sullo schermo di chi si muove non si inverte tra due stacchi.
- Lo stesso linguaggio (obiettivo, luce, altezza) resta stabile nelle inquadrature vicine; cambialo solo quando la storia cambia tono.
- Se un personaggio guadagna potere, la camera scende sotto di lui; se lo perde, sale sopra di lui.

## 6. Ricetta per una battuta comica (stile del riferimento)
apertura `primo_piano` o `mezza_figura` → oggetto/azione `dettaglio_oggetto` sulla parola → reazione `zoom_soggetto` / `snap_zoom` sulla parola chiave → conseguenza in `ambiente` o `gru_rivela`.

## 7. Limiti delle sagome (verificato)
I personaggi sono disegni piatti che si girano verso la camera: oltre ~25° sopra o sotto l'altezza degli occhi si vede che sono di cartone (Marco visto dall'alto diventa un disco). Per i personaggi resta entro ±25° (`dall_alto_vulnerabile` e `dal_basso_eroe` sono già tarati così); gli angoli estremi (dall'alto a picco, dal basso a terra) solo su oggetti e luoghi (`dall_alto_oggetto`, `tilt_cielo`). Il dal basso vuole il primo piano libero: una ringhiera o un tavolo tra camera e viso rovina l'inquadratura (successo con la vicina sul balcone).

## 8. Controllo
Per ogni inquadratura dell'anteprima: si capisce la funzione scritta nella tabella? L'angolo dice la cosa giusta? Il movimento è uno solo? Lo stacco con la precedente è netto e dallo stesso lato? Un movimento continuo è giustificato da §3b e nell'anteprima non compare `camera coperta`? Se no, cambia modello, non coordinate.

## 9. La camera di Rick, misurata (12/11, `kit/tools/camera_rick_analisi.py`)
Misura su 4 Short di Rick (`paxinko_the_window` + 3 mandati dall'utente il 12/11): 75 inquadrature, ~225 s.
| Cosa | Rick | Perché lo fa |
|---|---|---|
| Passaggi | quasi tutti dissolvenze brevi (65 su 71; stacchi secchi solo in un video); nel video con la trascrizione l'82% parte entro 0,1 s da una parola | ogni frase nuova = immagine nuova |
| Verso della spinta | **avanti nel 73%** delle inquadrature, a ogni durata | porta l'occhio sul soggetto |
| **Tratto per inquadratura** | circa fisso: +12-29% di ingrandimento, quindi corta = veloce (19 %/s sotto 1,2 s), lunga = lenta (6 %/s sopra 3,5 s); panoramica mediana 69 px/s (115 nelle corte, 47 nelle lunghe) | l'immagine cambia sempre della stessa quantità: il ritmo lo dà la durata |
| Direzione | costante nel 70-77% delle inquadrature sotto 3,5 s; in quelle lunghe (> 3,5 s, metà del tempo dei video) cambia: lì la camera va davvero da un soggetto all'altro | sotto 3,5 s un movimento solo; le planate tra tappe solo nelle inquadrature lunghe |
| Velocità | parte forte e rallenta nel 20-61% (dipende dal video), costante nel resto | l'arrivo veloce è giusto ma non obbligato |
**Nel motore (fatto il 12/11, aggiornato con zoom veloce)**: con `stile_camera: "rick"` la spinta è `tratto / durata` (18%, tra 5 e 20 %/s) e la panoramica `110 px / durata` (tra 45 e 115 px/s); `zoom_veloce` (`preset: "zoom_soggetto"` / `"snap_zoom"`) aggiunge uno stringimento rapido (+45-50% in ~0,6 s) sul soggetto e poi rallenta a ~4 %/s. `"camera_rick": { "zoom": 3, "pan": 40 }` rimette i valori fissi; `tratto`, `zoomMin`, `zoomMax`, `panTratto`, `panMin`, `panMax` si possono cambiare.
Limite della misura: il riconoscimento dei passaggi può perdere dissolvenze tra immagini simili (le inquadrature lunghe possono essere due unite).

## 10. Regole di senso dei cambi (perché tagliare, su tutto il cartoon)
1. **Un cambio = una nuova cosa da capire**: soggetto nuovo nominato, causa → effetto, azione → reazione (sguardo), esterno ↔ interno, dettaglio-prova, o contesto largo che spiega dove siamo. Se manca il «perché», sposta o togli il taglio.
2. **Mai spezzare una frase breve**: cambia inquadratura all'inizio di una parola chiave (`"@parola"`, entro 0,1 s) che apre un'idea nuova.
3. **Niente spoiler visivi**: non far vedere prima l'oggetto o la sorpresa che la voce nomina solo nell'inquadratura dopo.
4. **Spazio coerente (180° e grandezza)**: chi dialoga resta dallo stesso lato dello schermo; tra due tagli vicini cambia sempre grandezza o angolo (mai quasi uguali).
5. **Zoom veloce sul soggetto ogni tanto**: usalo sulle svolte e sulle reazioni (`zoom_soggetto` / `"zoom_veloce"`), mai due volte di fila.
6. **Dissolvenze brevi, zero frenate**: con `"passaggio": "dissolvi", "passaggioDur": 0.27` metti `"fermo": 0` (la camera entra nella dissolvenza ancora viva); `"taglio": true` solo sui colpi comici.
7. **Prova muta a coppie**: guarda primo e ultimo fotogramma di ogni inquadratura senza audio — il senso e i legami tra un'immagine e l'altra devono capirsi da soli.
