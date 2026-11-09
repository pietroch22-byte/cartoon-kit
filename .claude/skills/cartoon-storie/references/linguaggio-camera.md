# Linguaggio della camera: scegliere l'inquadratura per ciò che deve provare lo spettatore

Fonti: sintesi di skill open source con licenza MIT (nolanx-ai «shot-size-and-angle-language» e «director-visual-language», fal-ai «cinematography», Rylaispirit «cinematic-video-prompt-skill»), adattate al motore 3D e allo stile del video di riferimento. Le distanze e i movimenti restano quelli del riferimento (`library/camere_riferimento.json`).

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
- **Avvicinarsi lentamente** (quasi tutti i modelli del riferimento): attenzione, intimità, capire qualcosa.
- **Allontanarsi**: solitudine, chiusura, rivelare il contesto.
- **Zoom di scatto** (`zoom_comico`): comicità, sorpresa, shock. È il movimento più "cartone": usalo sulle battute.
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
apertura `primo_piano` o `mezza_figura` → oggetto/azione `dettaglio_oggetto` sulla parola → reazione `zoom_comico` o `ecu` sulla parola chiave → conseguenza in `ambiente` o `gru_rivela`.

## 7. Limiti delle sagome (verificato)
I personaggi sono disegni piatti che si girano verso la camera: oltre ~25° sopra o sotto l'altezza degli occhi si vede che sono di cartone (Marco visto dall'alto diventa un disco). Per i personaggi resta entro ±25° (`dall_alto_vulnerabile` e `dal_basso_eroe` sono già tarati così); gli angoli estremi (dall'alto a picco, dal basso a terra) solo su oggetti e luoghi (`dall_alto_oggetto`, `tilt_cielo`). Il dal basso vuole il primo piano libero: una ringhiera o un tavolo tra camera e viso rovina l'inquadratura (successo con la vicina sul balcone).

## 8. Controllo
Per ogni inquadratura dell'anteprima: si capisce la funzione scritta nella tabella? L'angolo dice la cosa giusta? Il movimento è uno solo? Lo stacco con la precedente è netto e dallo stesso lato? Un movimento continuo è giustificato da §3b e nell'anteprima non compare `camera coperta`? Se no, cambia modello, non coordinate.
