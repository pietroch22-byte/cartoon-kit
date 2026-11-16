# Buon senso del mondo (regole fisse, 12/11)

Il mondo è disegnato ma deve essere **credibile**: ogni oggetto ha quello che ha nella realtà. Prima di consegnare un luogo, ripassa questa lista sul contact sheet. Gli aiuti in `engine3d/web/buon_senso.js` ne applicano molte da soli: usali invece di riscrivere testo e orologi a mano.

## Scritte (insegne, cartelli, etichette, schermi)
- **Sempre centrate** sul supporto, in orizzontale e in verticale. Margine 10-15% del lato corto: mai lettere che toccano il bordo.
- **Proporzionate al supporto**: la tela ha la stessa forma dell'oggetto (lettere mai stirate); il testo prende la dimensione più grande che ci sta, va a capo da solo (max 2-3 righe). Usa `adattaTesto` o `cartello`.
- Leggibili nell'inquadratura in cui contano: altezza lettere ≥ 3% del quadro; se non ci stanno, accorcia il testo o avvicina la camera.
- **Controllo continuo (`kit/tools/readcheck.mjs` e `lettura.txt` in `--anteprima`)**: ogni scritta chiave (`cartello`, `M.pannello`, o qualsiasi mesh con `userData.scritta = 1` e `userData.testo`) deve restare intera nel quadro per almeno `max(1,5 s, lunghezza/15 + 1,5 s)` e alta almeno `22 px/riga` senza uscire dai bordi (`clipped`). Insegne decorative secondarie (`M.insegna`, `cartelloAppeso`) usano `passa: true` (`userData.testoPassa = 1`) oppure vanno elencate in `"testi_passa"` nel JSON della storia per non bloccare il controllo.
- Italiano corretto, maiuscole coerenti, niente refusi; prezzi con la valuta (€ 2,50), date e orari coerenti con la storia.
- Un'insegna sta sopra o accanto a ciò che indica (porta, negozio, sportello), mai a caso.

## Orologi e cose che misurano
- **Orologi: sempre 12 numeri (o tacche), lancette di ore e minuti, secondi che si muovono.** L'ora è coerente con la luce (notte = sera tardi) e con la storia, e va avanti durante il video. Usa `orologio(M, { ora: '22:40' })`.
- Termometri, bilance, contatori, display: hanno numeri plausibili e cambiano se la storia lo dice.
- Ascensori: numeri dei piani in ordine; semafori: un colore acceso alla volta, nell'ordine giusto.

## Oggetti comuni
- Porte: maniglia o pomello, cornice, a volte un cartello (TIRARE/SPINGERE). Finestre: cornice, vetro con riflesso, tende o tapparelle.
- Schermi e monitor: accesi con un contenuto (non grigi), cornice nera, cavo o supporto. Telefoni: schermo acceso quando si usano.
- Bottiglie e barattoli: etichetta e tappo. Libri: dorsi colorati di altezze diverse. Scaffali: oggetti diversi, non copie identiche in fila.
- Tavoli apparecchiati: piatti con posate ai lati, bicchieri; sedie rivolte verso il tavolo.
- Banche, uffici: sportelli numerati, penna con catenella, cartelli degli orari. Negozi: prezzi, cassa, insegna.
- Strade: marciapiede, strisce pedonali vicino agli incroci, lampioni accesi di notte, targhe sulle auto.

## Proporzioni e posizione
- Le cose stanno appoggiate su qualcosa (niente oggetti che galleggiano), ombra di contatto sotto.
- Altezze realistiche rispetto ai personaggi: maniglia a metà porta, bancone all'altezza della vita, quadri all'altezza degli occhi, interruttori vicino alle porte.
- Luci: ogni lampada accesa illumina qualcosa attorno; di notte le finestre accese sono calde.

## Coerenza con la storia
- Ciò che la voce nomina si vede (e al momento giusto, con `"oggetti"` sulle parole).
- Stesso luogo = stessi oggetti negli stessi posti da una scena all'altra.
- Il mondo vivo segue le cose vere: le porte si aprono quando passa qualcuno, i ventilatori girano, l'orologio avanza.

## Ancora (arricchito 12/11)
- **Luoghi pubblici**: uscita di sicurezza verde sopra le porte, estintore rosso a parete, cestino, cartello WC; negozi con orari sulla porta e cartello APERTO/CHIUSO coerente con l'ora.
- **Cucina e tavola**: fornelli con manopole, pentole con manico verso l'interno, frigo con magneti; cibo fumante solo se caldo; bicchieri pieni solo se qualcuno beve.
- **Ufficio e banca**: computer con tastiera e mouse, telefono con filo, pile di fogli, timbri; sportelli con vetro e fessura; code con nastri.
- **Casa**: interruttori accanto alle porte, prese vicino al pavimento, tende ai lati delle finestre, quadri dritti, letto con cuscino, divano rivolto verso la TV.
- **Esterni**: cielo coerente con l'ora (stelle di notte, sole o nuvole di giorno), alberi con ombra, pozzanghere solo se ha piovuto, auto parcheggiate nel verso della strada, cartelli stradali italiani (forme e colori veri).
- **Veicoli**: ruote che girano quando vanno, fari accesi di notte, targa davanti e dietro, autista dentro se l'auto si muove.
- **Persone e oggetti**: chi parla al telefono lo tiene all'orecchio; chi legge guarda il foglio; chi porta un oggetto pesante si piega; nessuno attraversa muri, tavoli o altre persone.
- **Tempo e stagioni**: vestiti coerenti con la stagione (cappotti d'inverno, maniche corte d'estate), luce calda la sera, fredda al mattino; calendari e giornali con la data giusta.
- **Numeri e soldi**: banconote in euro con il colore del taglio, monete dorate e argento, prezzi realistici per il luogo e l'epoca; numeri civici sulle porte, in ordine lungo la via.
- **Scala e quantità**: un negozio piccolo non ha 50 clienti; una folla ha persone diverse (tipi del cast diversi, mai copie vicine uguali); oggetti in fila con piccole differenze.
- **Epoca**: se la storia è nel passato, niente telefoni moderni, auto e insegne dell'epoca, scritte con caratteri d'epoca.

## Riassunto e aiuti nel motore (spostato da `SKILL.md` il 16/11)
Ogni oggetto ha ciò che ha nella realtà: orologi con 12 numeri e lancette che avanzano, scritte **sempre centrate e proporzionate al supporto** (margine 10-15%, a capo da sole, mai stirate), insegne sopra ciò che indicano, porte con maniglia, schermi accesi, etichette, prezzi con €, ora coerente con la luce. Lista completa: `references/buon-senso.md` (ripassarla sul contact sheet di ogni luogo). Aiuti: `engine3d/web/buon_senso.js` → `adattaTesto` (qualsiasi tela), `cartello(M, …)`, `quadrante`, `orologio(M, { ora: '22:40' })`; avvisi se un testo è troppo piccolo per il suo supporto.
