# Ricks Clips — analisi e ricetta per lo Studio

Fonte principale: https://www.youtube.com/watch?v=VS1Z_Q-Klt8
Confronti: https://www.youtube.com/watch?v=nzbkkEZFM8g e https://www.youtube.com/watch?v=TgyHSIttwdM

## Osservazioni verificate

Video scaricato: 64,854 s, 720×1280, 30 fps, 10.780.446 byte. Esaminati 14 fotogrammi narrativi e 12 campioni temporali; lette anche le caption automatiche dei due confronti.

- **Storia:** minaccia → derisione → segnale frainteso → esclusione → escalation → conseguenza → spiegazione, intorno a 47–49 s. La veridicità storica non è stata verificata.
- **Look:** visi piatti e contorni scuri; ambienti profondi, materiali variati, luci locali; primi piani e vista interna dell’oggetto protagonista.
- **Animazione:** nei campioni 6,0–7,2 s cambiano espressioni, inclinazioni e inquadratura. Una tenuta precede il passaggio alla notte a circa 33 s. Caption incorporate bianche, bordate, in piccoli gruppi.

Il risultato appare 2.5D. Il software e il procedimento dell’autore restano sconosciuti.

## Decisioni proposte per la nostra versione

Queste sono scelte creative per il nostro progetto, non parametri misurati del canale.

1. **Una domanda per episodio.** Scrivere prima la curiosità da risolvere e la risposta finale. Togliere ogni scena che non avvicini alla risposta o non complichi la situazione.
2. **Hook concreto, subito visibile.** Aprire sull’evento anomalo; spiegare dopo come ci si è arrivati. Esempio originale: «Marco disse: “Ho già mangiato”. Venti minuti dopo, il parmigiano arrivò in elicottero».
3. **Personaggi più semplici, pose più intenzionali.** Nel nostro `cards.js` introdurre transizioni fra pose e controllo continuo di testa, avambracci e mani. Preparare profilo e tre quarti per non ruotare la stessa card frontale nelle azioni laterali.
4. **Set con gerarchie.** Per il prossimo test: una luce principale motivata, lampade calde, piani distinti, ombre di contatto e materiali meno uniformi. Conservare le facce leggibili, senza caricarle di effetti.
5. **Oggetto protagonista.** Costruire meglio la lasagna o il parmigiano e mostrarne peso, deformazione e contatto. Dedicare almeno un’inquadratura al meccanismo della gag.
6. **Camera per ogni battuta.** Scegliere un solo movimento principale: avvicinamento per una rivelazione, carrello per mostrare quantità, fermata per una reazione. Il registratore dello Studio consente già questi percorsi.
7. **Timing di partenza.** Provare inquadrature da 1,5–3 s e reazioni tenute per 6–10 frame, modificando le durate in funzione della voce. Sono valori di lavoro, non regole del riferimento.
8. **Caption sincronizzate.** Aggiungere una o due parole per blocco usando `work/words_clean.json`; mantenere dimensione, bordo e posizione coerenti. Effetti sonori sugli eventi fisici e musica sotto la voce.

## Prossima prova consigliata

Un test da 8–10 secondi: Nonna posa la teglia, Marco la vede, la camera rivela la lasagna enorme, reazione e battuta. Misurare leggibilità, profondità, contatti e sincronizzazione prima di rifare il video completo. Non serve cambiare motore per provare queste scelte.

## Materiali di analisi

- `ancient-jar.mp4`: video scaricato per la richiesta.
- `story-sheet.jpg`: 14 campioni; ordine e tempi in `story-sheet-times.json`.
- `motion-sheet.jpg`: tre sequenze di quattro campioni, tempi in `motion-sheet-times.json`.
- `*-transcript.txt`: caption automatiche, utili all’analisi ma non corrette a mano.
- `scene-candidates.json`: rilevamento automatico con soglia 0,30; insufficiente per contare tutti i tagli, quindi non usato per stimarne la frequenza.

Il progetto e gli audio originali non sono stati modificati.
