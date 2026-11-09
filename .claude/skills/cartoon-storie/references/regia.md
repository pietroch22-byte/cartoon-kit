# Regia: ogni parola si vede

Obiettivo: lo spettatore deve **vedere** ciò che la voce dice, nel momento in cui lo dice. Una scena bella ma ferma, o una camera che si muove senza motivo, è un fallimento.

## Passo obbligatorio: piano di regia (prima del JSON)
Scrivi una tabella, una riga per battuta, e mostrala all'utente insieme all'anteprima:

| # | Battuta | Cosa si VEDE (letterale) | Azione e parola esatta | Funzione per lo spettatore → modello di camera (`linguaggio-camera.md`) | Arricchimento |
|---|---|---|---|---|---|
| 3 | Poi accende tutti e quattro i fuochi | nonna davanti ai fornelli, fiamme | fornelli `state: on` su «fuochi»; nonna `change` → `grin` su «accende» | `wide`, poi `push_on` fornelli su «accende»: la storia guarda il fuoco | pentola che fuma, gatto che apre un occhio |

Regole della tabella:
1. **Ogni sostantivo visibile** detto dalla voce (fuochi, lasagna, vicina, porta, elicottero) esiste in scena e riceve un'azione o un'inquadratura nel momento in cui è nominato.
2. **Ogni verbo d'azione** (anche «trema» → `shake`, «salta/scappa» → `hop` + `move`, «gira» → `spin`, «si allaccia il grembiule» → `change` con `apron: true`) (accende, arriva, chiama, rotola, ferma) diventa un evento sulla sua parola: `do` (oggetto cambia stato, compare con `pop`, sparisce, si sposta), `change` (posa o faccia del personaggio), `enter` (personaggio entra), `move` (personaggio si sposta).
3. **Reazioni**: chi ascolta reagisce (faccia) entro la stessa battuta; la reazione arriva 0-3 frame prima della parola che la provoca (il motore anticipa già di 1 frame).
4. **Esagerazione comica**: le iperboli si mostrano letteralmente («lasagna grande come una porta» → lasagna gigante con `scale` alto che compare con `pop`).
5. Se un oggetto necessario manca nella libreria, **crealo** seguendo `references/creare-oggetti.md` (oggetto 3D da forme semplici o disegno 2D) e salvalo in libreria. Non saltarlo e non sostituirlo con altro. Di' all'utente cosa hai creato.

## Camera: grammatica del video di riferimento
Scegli per ogni battuta un modello di `library/camere_riferimento.json` (elenco in SKILL.md) seguendo la regia del riferimento: apertura sul viso che rivela il contesto (`rivela_dal_viso`), campo largo a ogni luogo nuovo (`ambiente`, `campo_lungo_alto`, `gru_rivela`), dettaglio sull'oggetto nominato alla sua parola (`dettaglio_oggetto`, `dall_alto_oggetto`), battute dette frontali (`primo_piano`, `mezza_figura`), coppie (`due_figure_*`, `tre_quarti`), grandezza o arrivo dall'alto (`dal_basso_rivela`, `tilt_cielo`), movimento di un personaggio (`carrello_basso_segue`), fila (`carrello_fila`), sorpresa (`ecu` sulla parola), finale (`primo_piano_finale`). Mai due modelli uguali di fila. Movimenti continui (`accompagna`, `passaggio`, `piano_sequenza`) solo quando la regia li giustifica (sotto).

### Movimenti continui nella tabella di regia
Nella colonna camera scrivi anche **perché non stacchi**: «nonna va al frigo: `accompagna` nonna (il tragitto mostra la cucina)», «Marco nomina la panna: `passaggio` marco → panna su «panna»». Usali solo nei casi di `linguaggio-camera.md` §3b (tragitto che conta, sguardo che porta a un oggetto, azione a catena), mai per riempire. Formato:
- `{"preset": "accompagna", "on": "nonna"}` con `"move": {"at": "alza", "to": [1.6, 0.6], "dur": 1.6}` sul personaggio;
- `{"preset": "passaggio", "on": "marco", "verso": "panna", "parola": "panna"}`;
- `{"preset": "piano_sequenza", "tappe": [{"on": "marco", "preset": "primo_piano"}, {"on": "piatto_marco", "at": "carbonara"}, {"on": "nonna", "preset": "mezza_figura", "at": "panna"}]}`.
Il piano sequenza vive dentro una battuta: se deve durare di più, scrivi una battuta più lunga (`say` può contenere più frasi). Nell'anteprima ci sono i fotogrammi a metà planata e all'arrivo di ogni tappa: controlla che l'oggetto si veda sulla sua parola.

## Oggetti realistici al posto delle forme semplici
Ogni oggetto costruito con forme semplici (scatole, cilindri) che ha un equivalente realistico nel kit va sostituito: sedie, tavolini, lampade, piante, vasi, quadri, botti, casse, lampioni, panchine. Restano costruiti a mano solo gli oggetti che la storia anima in modo speciale (fornelli con le fiamme, orologio con le lancette, lasagna gigante). Il modello scelto deve essere coerente con luogo ed epoca: una sedia moderna in pelle in una cucina di nonna è un errore (è già successo); scegli legno dipinto, paglia, ferro battuto.

## Luce e cielo: li decide il copione
Leggi ora e luogo nel testo («alle nove», «al tramonto», «di notte», «a pranzo») e scegli il preset di luce di ogni inquadratura di conseguenza (tabella in `references/look-realistico.md`). Una scena notturna resa di giorno è un errore grave anche se è bella.

## Arricchimento (sempre, senza che l'utente lo chieda)
- Prima di costruire un luogo scrivi l'inventario di ciò che quel posto, in quell'epoca, contiene davvero (15-40 tipi di oggetti) e **procurati tutto**: libreria, poi modelli CC0 scaricabili (Poly Haven), poi oggetti creati (`references/creare-oggetti.md`).
- Ogni luogo ha 15+ oggetti coerenti con posto, epoca e storia, in gruppi leggibili.
- Almeno un elemento animato per luogo (`"animate": true`: fiamme, vapore, gatto che respira, insegne).
- Una piccola sorpresa per luogo che premia chi rivede (il gatto sul frigo, un dettaglio buffo sullo sfondo).
- Facce e posture cambiano a ogni battuta; le comparse hanno una posa propria.
- L'ultimo frame richiama il primo (loop).

## Verifica sull'anteprima
L'anteprima include i frame di ogni azione e di ogni cambio camera. Per ogni riga della tabella controlla: l'oggetto si vede? l'azione avviene sulla parola? la camera inquadra ciò di cui si parla? Se no, correggi il JSON prima del video.

## Formato degli eventi (riassunto)
- Oggetto con id e stati: `{"id": "fornelli", "type": "stove", "at": [-2.5, 0, -3.3], "animate": true, "states": {"off": {"fire": 0}, "on": {"fire": 1}}, "state": "off"}`
- Oggetto nascosto che compare: `{"id": "lasagna", "type": "plate_food", "scale": 4, "at": [0, 0.8, 0.3], "hidden": true}`; nella battuta `"do": [{"id": "lasagna", "at": "lasagna", "pop": true}]`
- Nella battuta: `"do": [{"id": "fornelli", "at": "fuochi", "state": "on"}, {"id": "sedia", "at": "porta", "move": [1, 0, 2], "dur": 15}]`
- Personaggio: `{"id": "marco", "x": 0.7, "face": "neutral", "change": [{"at": "Errore", "face": "shock", "pose": "facepalm"}], "enter": "vicina", "move": {"at": "rotola", "to": [3, 2], "dur": 1.2}}`
