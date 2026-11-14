# Il video di riferimento per intero: cosa fa e cosa ci manca (11/11)

Fonte: `/Users/pietromascia/STORIE CARTOON/riferimenti_rick/01_paxinko_notte_negozio/` (`video.mp4` = `paxinko_the_window.mp4`, 45 s, 30 fps, con `trascrizione_en.txt` e `trascrizione_en_parole.json`, 161 parole; consultabile solo su richiesta via `references/riferimenti-rick.md`).

## Le inquadrature (una ogni ~2,8 s, quasi tutte con la camera che si muove piano)
| s | luogo | cosa si vede | camera |
|---|---|---|---|
| 0-2 | vicolo notte | due omini seduti su cassette davanti alla finestrella accesa, gatto, piante, bici | bassa, spinta lenta in avanti |
| 2-5 | città dall'alto | volo sopra la via con insegne verticali al neon, frecce, auto, pioggia | gru che sale e si apre |
| 5-10 | sala pachinko | corridoio di macchine con schermi accesi, sgabelli rossi, moquette a rombi, comparse sedute; secchio di palline in primo piano | carrello lungo la fila, all'altezza degli occhi |
| 10-13 | ingresso | facciata PRIZE HALL, poliziotto che passa davanti alla porta; dissolvenza dalla sala | spinta lenta, dal basso |
| 13-16 | sala, protagonista | il protagonista (turista arancio con macchina foto) seduto alla macchina col secchio pieno, primo piano grande | primo piano frontale, poi si gira verso il banco |
| 16-24 | banco premi | due figure: protagonista e commessa dietro il bancone; scaffali pieni di prodotti con etichette (CHIPS, CHOCO, shampoo), cartelli PRIZE COUNTER e THANK YOU; la faccia del protagonista cambia ad ogni prodotto | mezza figura, piccole spinte |
| 24-26 | uscita | porta automatica che si apre sul vicolo, zerbino WELCOME; il tizio viola esce coi gettoni | camera alle spalle che segue |
| 26-30 | vicolo | lo seguiamo fino alla finestrella senza insegna, distributore blu, cassa di bottiglie, gatto in primo piano sfocato | carrello dietro, primo piano di passaggio |
| 30-33 | finestrella | il tizio di spalle allo sportello, la luce calda come centro | quasi fermo, si avvicina |
| 33-36 | facciata + coda | dall'esterno: la sala e la gente in fila alla finestrella | camera lontana che scorre |
| 36-41 | finestrella, primo piano | il tizio con occhiali da sole, primo piano; la mano che fa scivolare i gettoni, il denaro che esce | primo piano frontale stretto, inserto della mano |
| 41-45 | finale | poliziotto e nonna con il foglio «GAMBLING: NONE ✓» | due figure frontali, chiusura |

## Cosa ci manca per arrivare al suo risultato (in ordine di peso)
1. **Primi piani veri**: nel riferimento la testa riempie il 40-60% del quadro in metà delle inquadrature; da noi quasi tutto è campo medio. → tappe con `"su"` e `"testa": 0.22-0.30` (primo piano), `0.14` (mezza figura), camera all'altezza degli occhi (`linguaggio-camera.md` §0). Nota: il 40-60% qui è l'altezza della testa nel quadro a occhio; la misura del controllo (`testa`, larghezza) per Rick è ~20-25%.
2. **Profondità di campo**: sfondo sfocato nei primi piani e oggetti in primo piano sfocati che passano (gatto, piante, bottiglie). → c'è dall'11/11: `"sfocatura": "auto"` (in prova, da approvare); mettere anche oggetti in primo piano vicini alla camera, che la sfocatura rende morbidi.
3. **Dissolvenze tra i luoghi** (0,3-0,5 s: sala → ingresso, sala → banco). → esiste già: nella scena `"passaggio": "dissolvi"` (e `"passaggioDur": 0.4`), `kit/engine/film_disegnato.py`. Usarla a ogni cambio di luogo come nel riferimento.
4. **Un protagonista che torna** (il «tu» della storia, turista arancio con macchina foto) e personaggi che **tengono le cose**: il secchio di palline, i gettoni, il denaro, il foglio finale. → `porta`/`mani` degli attori 3D, e un inserto della mano.
5. **Luoghi pieni di oggetti leggibili**: scaffali del banco premi con prodotti etichettati, cartelli con scritte (PRIZE COUNTER, THANK YOU, OPEN, WELCOME), moquette a rombi, schermi delle macchine con numeri. → archivio `library/vivi` + pannelli dipinti (`M.pannello`) per le scritte.
6. **Tutto si muove** (regola «Mondo vivo»): gente in coda, passanti, il gatto, la porta automatica, le palline, il denaro che scivola. → `vivo.js` + meccanismi.
7. **Luce**: dentro caldo con le strisce di luce al soffitto e bagliore; fuori blu-viola con la finestra calda come centro; foschia e vignettatura. Il nostro look le ha già: vanno usate in ogni luogo (luce che motiva il punto focale).
8. **Sottotitoli**: nel riferimento sono 1-3 parole in **minuscolo/maiuscolo come dette**, bianche, grassetto, bordo scuro, a ~70% dell'altezza, senza colore evidenziato. Scelta dell'utente: teniamo il nostro karaoke (maiuscolo, parola gialla), non si copia.

## Per rifarlo tutto in italiano
Luoghi pronti: vicolo, strada dall'alto, sala, ingresso. Da costruire: banco premi (bancone, scaffali, commessa, cartelli), uscita con porta automatica (c'è `porta_scorrevole`), coda alla finestrella, primo piano della finestrella con la mano, foglio finale. Servono il copione italiano con gli stessi tempi e la voce (dell'utente o, per le prove, sintetica).

## Prova «solo Blender» (11/11, chiusa)
Rifatta la prima inquadratura tutta in Blender (EEVEE, Freestyle): 5,1 s a fotogramma contro 0,37 del motore, luce più piatta, niente bagliore, facce spente. Decisione: il motore three.js resta; Blender solo per la forma.
