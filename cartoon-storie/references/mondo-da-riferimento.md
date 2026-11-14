# Mondo da riferimento reale: quando un luogo è ricco e come farlo ricco (13/11)

**[utente 13/11]** Il mondo deve sembrare **un posto vero, ma a cartone**, e dobbiamo avere **il controllo su tutta la scena**. Non importa che sia identico a una foto: importa che dentro ci sia quello che in quel posto c'è davvero. La skill lo faceva solo in parte (`arricchire-ambienti.md` dice come procurarsi gli oggetti): qui c'è **da dove si parte** (foto vere), **come si capisce se è ricco** (numeri) e **come si prova a poco costo** (bozza mondo).

## 1. Ricerca: guardare il posto vero (prima di costruire)
Per ogni luogo nuovo, **una** ricerca e **al massimo 3 immagini** guardate davvero:
1. Cerca foto di quel tipo di posto, in quell'epoca e paese (es. «sala d'attesa stazione italiana anni 60 interno», «ufficio sovietico anni 60»). Una vista larga, una da un altro angolo, una di un dettaglio tipico.
2. Guarda le immagini e **scrivi quello che c'è**, non quello che ti aspetti. Le foto servono solo a sapere cosa c'è e dove: non si copia un design riconoscibile, un marchio, una persona.
3. Se c'è da risparmiare contesto, la ricerca la fa **un altro agente** (un sottoagente con ricerca web e browser) che riporta solo la scheda del punto 2, non le immagini. Non serve un connettore nuovo: bastano la ricerca web e il browser.
4. **Prima di cercare guarda `library/luoghi/`**: se la scheda di quel tipo di posto c'è già, si riusa (una stazione si studia una volta sola).

## 2. La scheda del luogo
Si scrive in `library/luoghi/<tipo>.md` (riusabile) e si copia/adatta in `kit/stories/<nome>/mondo_<luogo>.md`. Una pagina:
- **Dove, quando, che ora** (una riga) e le **fonti** (indirizzi delle immagini guardate).
- **Pianta in sei righe**: cosa c'è sul fondo, a sinistra, a destra, sul soffitto, sul pavimento, in primo piano vicino alla camera.
- **Inventario a strati** (i numeri sono il minimo):
  - strutture (4-8): muri, colonne, travi, finestre, porte, pedane;
  - grandi (4-8, oltre 1,2 m): banconi, armadi, macchinari, panche, veicoli;
  - medi (8-12, da 35 cm a 1,2 m): sedie, lampade, monitor, cestini, piante, valigie;
  - piccoli (10-20, sotto 35 cm): fogli, tazze, telefoni, penne, bottiglie, targhette, interruttori;
  - scritte (5-10, **con il testo esatto**): insegne, cartelli, orari, etichette, numeri;
  - luci (ogni lampada vera che si vede) e **cose vive** (almeno 5: `mondo-vivo.md`);
  - usura: macchie, graffi, cose storte, cose lasciate lì.
- **La firma del luogo**: i 3 dettagli che lo fanno riconoscere al primo sguardo (stazione: tabellone degli orari, orologio a due facce, panche di legno).
- **Tre colori dominanti** presi dalle foto.
- **Cosa non c'è** (anacronismi: niente schermi piatti negli anni 60).

## 3. Dal vero al cartone
- Per ogni voce della scheda: prima `library/vivi`, `library/animati`, `library/modelli3d`, `engine3d/web/oggetti_*.js` e gli script dei luoghi già fatti; poi si costruisce in codice; Blender solo per la forma (`arricchire-ambienti.md`).
- **Cartone**: forme semplificate e smussate, proporzioni leggibili, dettagli dipinti, i nostri colori e contorni (`look-disegnato.md`). Vero è l'elenco delle cose e dove stanno, non la resa.
- **Controllo su tutta la scena**: ogni oggetto è un gruppo **con un nome** (`o.name`), e quelli che la storia può muovere, accendere o nascondere stanno in `OBJ`. Un bancone pieno di strumenti fatto come un gruppo solo conta come **un** oggetto e non si può dirigere pezzo per pezzo: si dà un nome ai suoi pezzi.
- **Spazio per la camera che vola**: il luogo regge tutti i punti di vista (quattro muri e soffitto, o esterno pieno) e ha qualcosa **in primo piano vicino ai bordi** e qualcosa sul fondo, così i movimenti hanno profondità.

## 4. Quando è ricco: i numeri (anteprima → `ricchezza.txt`)
L'anteprima misura ogni fotogramma chiave (`M.vita.ricchezza`, avvisi **MONDO_POVERO**): oggetti distinti nel quadro (strutture escluse), divisi in grandi / medi / piccoli; quante delle 12 caselle del quadro (3 x 4) hanno almeno un oggetto; piani di profondità; tinte diverse; **quali caselle sono vuote**, cioè dove aggiungere.
| Inquadratura | Soglia |
|---|---|
| Prima vista di ogni luogo | almeno 15 oggetti (2 grandi, 4 medi, 5 piccoli), 8 caselle piene su 12, 3 tinte |
| Tutte le altre | almeno 4 oggetti e 4 caselle piene |
Numeri di partenza presi dai nostri luoghi (13/11, `prova_camera_v4.json`): sala di controllo NASA 21 oggetti (6 grandi, 13 medi, 2 piccoli), laboratorio 11, ufficio di Mosca 6, capsula 6. Quindi oggi solo la sala di controllo passa quasi tutto (le mancano i piccoli); l'ufficio di Mosca è povero; la capsula risulta povera anche perché la consolle è un gruppo solo.
Come si corregge: lo strato che manca dice cosa aggiungere (pochi piccoli → fogli, tazze, targhette sul piano), le caselle vuote dicono dove (in alto → lampade, tubi, cartelli appesi, orologio).
Limiti: la misura conta, non giudica se le cose hanno senso (per quello `buon-senso.md` e il contact sheet); un gruppo con nome conta uno; le comparse contano come oggetti; i personaggi della storia no.

## 5. La bozza mondo (poco costo, si decide presto)
Per capire un mondo **non serve un video**: servono pochi fotogrammi a qualità piena e i numeri. Per ogni luogo nuovo, prima di personaggi e camera:
1. la scheda (§2), in chat, da far confermare all'utente ⏸ (costa zero render);
2. una storia di prova di 2-3 inquadrature fisse sul luogo vuoto (la vista principale, l'angolo opposto, un dettaglio della «firma») → `anteprima` → 3 fotogrammi + `ricchezza.txt`;
3. si mostrano all'utente i 3 fotogrammi con i numeri e le caselle vuote; si arricchisce lo strato che manca; un solo giro di correzione per luogo, poi si va avanti.
La bozza camera (`SKILL.md`, punto 5) si fa su un mondo anche povero; la bozza mondo si fa con camere fisse. Sono due prove separate: non si aspetta un mondo finito per provare la camera, e non si giudica il mondo da un video a bassa qualità.
