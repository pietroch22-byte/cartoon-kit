# Piano per avvicinarci al reference («The Window That Breaks Japan's Gambling Law»)

Scritto l'11/11/2026. Basato su: 180 fotogrammi del reference (4 al secondo, 0-45 s) e 60 del nostro video (`pachinko_inizio_3d`, 14,9 s, poi superato da `kit/stories/pachinko/`), guardati a gruppi di 16 affiancati; `frames/ref_words.json` per i tempi delle parole.
Dove scrivo «circa» sono misure a occhio dai fotogrammi (altezze camera, durate), non numeri esatti. Le prove tecniche (tempi, render) sono misurate.

---
> **Stato 11/11 sera:** fatti i punti 1 (sala), 2 (arti con ginocchio/gomito e mani sugli oggetti, in `personaggi3d.js` senza Blender), 3 (città ricca), 4 parziale (facce a tratti), 5 (personaggi opachi disegnati), 6 (dissolvenze). Mancano: bocca che parla, oggetti vivi, libreria versionata, strumento di confronto, antisfarfallio nel montaggio. Scala comparse ora ≈ 0,5. Dove sotto si legge «lacca/clearcoat» o «rig v2 in Blender» vale questa nota.

## 1. Il reference, inquadratura per inquadratura

Il reference ha circa **15 inquadrature in 45 s** (una ogni ~3 s). Quasi nessuna è ferma: ogni luogo ha **un movimento lento e uno sguardo finale fermo**. I passaggi tra luoghi sono per metà **dissolvenze incrociate di ~0,3-0,5 s** (si vedono fotogrammi «fantasma» a 4,5 - 8,0 - 13,75 - 18,75 - 24,0 - 37,0 - 43,5 s) e per metà stacchi netti (10,3 - 26,8 - 28,0 - 32,5).

| Tempo (s) | Parole | Luogo e camera | Personaggi e gesti |
|---|---|---|---|
| 0 - 2 | Gambling is illegal in Japan | **Vicolo**. Camera bassa (circa 1 m), lenta avanzata verso la finestrella accesa. Punto focale = finestrella gialla con aloni. | Un turista arancio entra camminando in primo piano a sinistra (gambe sottili che si piegano al ginocchio). Due seduti: «duro» con occhiali da sole su cassetta gialla, impiegato triste su sgabello verde. Sguardi diversi, sopracciglia. |
| 2 - 4,5 | yet there's a gambling hall on almost every street | **Strada di notte**. Parte a livello vetrina, insegna rosa con freccia, poi la camera **sale** (gru) e inclina: file di neon ciano/rosa/giallo, auto, cartello P, folla in lontananza. | Due omini in fila davanti alla porta luminosa. |
| 4,5 - 4,8 | street. Inside, | Vista aerea (circa 40 m) su una città fitta: decine di palazzi con finestre, insegne, strisce pedonali, macchine, bagliore ciano. **Dissolvenza** nella sala. | — |
| 4,8 - 8 | thousands of machines… screaming | **Sala**. Camera bassa nel corridoio, avanza; omini seduti ai lati in primo piano (di profilo, piccoli rispetto alle macchine), poi **sale a circa 2,5 m** e guarda il corridoio che fugge. Moquette rossa a rombi, soffitto con tubi luminosi, cartelli isola «9 / 11», prezzi «¥4 BALL». | Tutti seduti sugli sgabelli rossi, schiena dritta, gambe che pendono, uno sguardo di lato verso la camera. |
| 8 - 10,3 | people carry out buckets full of steel balls | Camera bassa che **segue** la torre di scatole rosse/nere portata da una nonna con occhiali. | Nonna che cammina dietro la torre; ai lati gente seduta che guarda i monitor. |
| 10,3 - 13,7 | Police stroll right past the door | **Ingresso «PRIZE HALL»** in strada: grande insegna dorata, poster «7», distributore, strada bagnata viola. Camera quasi ferma, bassa, un po' di lato. | Poliziotto che cammina con il passo vero (ginocchia, braccia che oscillano), occhi mezzi chiusi; poi sorride (occhi chiusi ad arco) quando passa la nonna. |
| 13,8 - 16,2 | you win a bucket yourself | **Sala, vicino alla macchina 777**. Camera a livello dell'omino seduto, piano americano. | Turista seduto: gambe piegate, braccio che lancia le palline, **faccia che cambia 4 volte in 2 s** (occhi a puntini → occhiali → sorriso con denti → sorriso). |
| 16,2 - 24 | try to cash it in… cookies, chocolate, shampoo | **Banco premi**. Cartello PRIZE COUNTER, scaffali pieni di scatoline, vetrina con peluche. Camera frontale che **entra piano**, poi si abbassa. | Turista che prende un oggetto, commessa con papillon sorridente; il turista mima ogni oggetto citato (scatola, cioccolato, bottiglia di shampoo in mano). |
| 24 - 26,8 | The guy in front takes the tokens and heads outside | Davanti alla porta automatica «THANK YOU». Camera fissa a livello omini. | Il «duro» viola passa, si gira di spalle, esce; il turista lo guarda con occhi tondi. |
| 26,8 - 32 | You follow him around the corner to a little window | **Vicolo**, camera che gira l'angolo e **si avvicina alla finestrella** (da 3 m a 1,5 m). | Duro di spalle, il turista segue (di spalle, poi di fronte). |
| 32 - 40 | technically a separate shop… | Dietro la nuca del duro, poi **primo piano suo** (occhiali da sole, sorriso), poi sulle mani. | Braccio che sporge, gettoni, banconote da ¥, mani che passano oggetti. |
| 43,5 - 45 | on paper, nobody gambles | Vicolo, poliziotto con cartello «GAMBLING: NONE ✓» e turista seduto sul gradino che saluta con la mano. | Seduta sul gradino con gambe e braccia piegate. |

**Cosa lo rende «vivo» (in ordine di importanza)**
1. Ogni inquadratura ha **più di una cosa che succede** (camminata + sguardo + oggetto + luce). Mai un omino che sta fermo con la faccia fissa.
2. **Gambe e braccia sottili con ginocchia e gomiti**: si siedono davvero, camminano, prendono oggetti.
3. **Facce che cambiano spesso** e grandi sulla testa (occhi tondi con pupilla, occhiali, bocca con denti).
4. **Densità**: ogni inquadratura ha 15-40 oggetti piccoli e specifici (scaffali con scatoline colorate e prezzi, cartelli leggibili, cavi, condizionatori, casse di bottiglie, gatto, pianta, bici, lanterne, tubi al soffitto, numeri sugli schermi).
5. **Scala giusta**: le macchine sono grandi, gli omini piccoli. In sala si vedono sempre gli schermi illuminati dietro le teste.
6. **Camera**: bassa (1-1,5 m) dentro i luoghi, alta solo per il volo sulla città; una sola mossa lenta per inquadratura; passaggi con dissolvenza.
7. **Luce a due mondi**: interno ambra con soffitto luminoso e moquette rossa; esterno blu-viola con un punto caldo.
8. Personaggi **opachi** (colore pieno, contorno scuro spesso, ombreggiatura morbida), non lucidi.

---
## 2. Confronto con il nostro video (primi 14 s del reference rifatti)

Il nostro video ha 4 luoghi in 14,9 s: vicolo 0-2 s, strada/volo 2-4,5 s, sala 4,5-9,6 s, ingresso 9,6-14,9 s.

| Reference (s) | Nostro (s) | Differenza principale |
|---|---|---|
| Vicolo 0-2 (camera bassa, avanza, 3 omini, gatto, pianta, bici, casse, distributore, AC, cavi) | Vicolo 0-2: camera quasi ferma a 1,6 m, tre omini ammassati, pochi oggetti, luce meno focale | Mancano profondità (pareti laterali con cose), movimento, gatto/pianta/bici, omini diversi per posa. |
| Strada 2-4,5 (neon fitti, sale in gru) | Strada 2-4,5: bella ma meno fitta; camera che sale a 26 m | Pochi neon e insegne, poche auto e folla; il volo arriva a un blocco blu scuro quasi vuoto. |
| Aerea 4,5 (città fittissima, dissolvenza) | Aerea 4-4,5 (blocchi blu piatti, pochi punti luce, stacco netto) | **Differenza più grande della città**: 10× meno dettaglio, niente insegne vive, niente auto/semafori, niente dissolvenza. |
| Sala 4,8-10,3 (macchine con schermi illuminati, sgabelli, omini piccoli, camera che sale) | Sala 4,5-9,6: **muro di omini giganti** (teste larghe quanto una macchina) che nasconde le macchine, camera quasi ferma a 1,3 m | Scala sbagliata dei comparse (alti ~1,5-1,8 m da seduti, con corpo larghissimo): coprono tutto. Poca varietà. Camera senza la salita. |
| Ingresso 10,3-13,7 (insegna dorata, poster, strada bagnata, poliziotto che passa) | Ingresso 9,6-14,9: facciata quasi piatta, porta luminosa grande, insegna piccola, poliziotto rigido, nonna senza gesti | Pochi dettagli sulla facciata; camminata «a bastone»; nessuna espressione che cambia; la torre di scatole poco leggibile. |
| Persone 8-24 s: gesti con oggetti e facce | Persone: facce piccole fisse, braccia che penzolano | Quasi tutti i gesti mancano (nessuno prende, lancia, saluta). |
| Passaggi: 50% dissolvenze | Passaggi: stacchi netti | Aggiungere dissolvenza 0,3-0,5 s. |

### Lista delle differenze in ordine di impatto
1. **Scala e densità della sala** (comparse enormi, macchine nascoste, poche cose). Impatto massimo: è la scena di apertura del racconto.
2. **Omini rigidi**: niente ginocchia/gomiti, niente pose (seduto, tiene l'oggetto, saluta), niente bocca.
3. **Città dall'alto povera**.
4. **Facce piccole e lucide** (palla di plastica con clearcoat) invece di opache e con contorno.
5. **Vicolo e ingresso poveri** (mancano 10-25 oggetti per inquadratura).
6. **Camera**: troppo ferma dentro i luoghi (sala, ingresso, vicolo); manca la «mossa lenta + sguardo finale».
7. **Passaggi senza dissolvenza.**
8. Moquette viola (RISOLTO), comparse non sedute sugli sgabelli (RISOLTO in parte, vedi §4).

---
## 3. Pipeline, tempi misurati e metodo «base → migliorato → riusato»

### Come funziona oggi e quanto costa (misurato su questo Mac)
| Passo | Cosa | Tempo |
|---|---|---|
| Blender: 1 personaggio (`genera_personaggi.py`) | forma + export GLB | ~1 s (10 personaggi ≈ 10 s) |
| Blender: oggetti (7 GLB, script in `~/STORIE CARTOON/blender-sala-p5/`) | forme con materiali con nome | ~1,5 s |
| Anteprima di un luogo (6-8 fotogrammi) | `rendi_disegnato.mjs --anteprima --scena N` | ~2 s |
| Anteprima dell'intera storia (20 fotogrammi) | idem senza `--scena` | ~11 s |
| Render dei fotogrammi in prova (scena sala, 1 su 3) | Playwright + Metal | 0,03-0,04 s a fotogramma dopo il caricamento (la stima precedente «video ~40 s» resta valida: caricamento dei 4 luoghi + voce/musica/karaoke) |

Conclusione: **il collo di bottiglia non è il render né Blender: sono le mie ore di scrittura di mondi e dettagli** (ogni luogo è uno script `.js` di 100-300 righe fatto a mano, `sala3d.js` 105 righe). Con Blender in 1-2 s e anteprima in 2 s si possono fare **decine di iterazioni al giorno**: quindi conviene spostare i dettagli in Blender (forma) e le regole nel motore.

### Cosa va in Blender e cosa nel motore
- **Blender (forma, una volta sola, riusabile)**: macchine, sgabelli, casse, distributori, insegne con cornici, banco premi con scaffali pieni, oggetti piccoli (scatoline, bottiglie, cestini), edifici con balconi/AC/cavi, personaggi con scheletro a nodi (anca, **ginocchio**, spalla, **gomito**, collo).
- **Motore (colore, scritte, luce, riflessi, movimento)**: materiali dipinti, testi leggibili, emissive, animazioni, regia.
- Non si usa luce cotta (decisione dell'utente).

### Libreria versionata
Struttura proposta (`library/3d/`):
```
library/3d/<categoria>/<nome>/
   v1.glb  v2.glb  …     (si tiene sempre la versione precedente)
   scheda.json           { id, versione, stato: base|migliorato|approvato, ancore, misure_m, materiali, usato_in: [video…] }
   sorgente.py           (script Blender che lo rigenera)
library/3d/manifest.json  (elenco di tutti, versione attuale, data)
```
Regole:
1. **Primo video**: ogni oggetto nasce in versione base (forma riconoscibile).
2. **A ogni video** si migliorano solo gli oggetti inquadrati da vicino (promossi a v2/v3): +bordi smussati, +dettagli piccoli, +etichette.
3. **Riuso**: lo script di storia chiede `libreria('macchina_pachinko')` e riceve l'ultima versione approvata.
4. Un controllo automatico (`kit/tools`) avvisa se un oggetto inquadrato a meno di 3 m è ancora «base».

### Punti salvati negli oggetti (soluzione ai personaggi che compenetrano gli oggetti)
In Blender ogni oggetto ha **empty con nome convenzionale** (`SIT_0` = punto di seduta con direzione, `HAND_L`/`HAND_R`, `LOOK`, `STAND_0`, `DOOR`), esportati nel GLB come nodi. Il motore li legge e dà una funzione `siedi(personaggio, oggetto, 'SIT_0')`:
- posiziona l'anca sul punto, gira il personaggio nella direzione dell'empty, applica la posa «seduto» compensando la scala (con **piedi** che toccano il pavimento o poggiati sul sostegno);
- stesso meccanismo per `prendi(personaggio, oggetto, 'HAND_R')` (la mano segue il punto).
Così uno sgabello, una cassetta, un gradino «sanno» dove ci si siede, e un controllo automatico verifica che l'anca sia a ±3 cm dal punto.

### Personaggi v2
Aggiungere nel generatore: coscia+stinco con nodo `ginocchio_L/R`, braccio+avambraccio con `gomito_L/R`, mani con 3 posizioni (aperta, stringe, punta), `collo`. Nel motore una **libreria di pose** in JSON (`seduto`, `cammina`, `lancia`, `tiene_oggetto`, `saluta`, `braccia_incrociate`, `punta`) con transizioni dolci. Bocca: 4 forme (chiusa, aperta piccola, aperta grande, «o») scelte dal volume della parola; occhi più grandi, sopracciglia più spesse; materiali **opachi** con contorno (clearcoat 0, 2 bande di luce).

---
## 4. Problemi già noti: stato e soluzione

| Problema | Stato | Cosa ho fatto / cosa propongo |
|---|---|---|
| Comparse sedute dentro lo sgabello | **Corretto** | Il motore non compensava la scala del personaggio: con scala 0,6 il bacino finiva al 60% dell'altezza giusta. Ora `seduta` è divisa per la scala (`personaggi3d.js`). In più la fila sinistra era spostata di 0,5 m dallo sgabello: corretto in `sala3d.js`. Verificato con anteprima: sgabelli visibili sotto i corpi. **Resta** il punto salvato (`SIT_0`) e il ginocchio piegato: vedi priorità. |
| Posa seduta vera (ginocchia, gomiti piegati) | Da fare | Serve il rig v2 (Blender, 1 s per personaggio) + pose JSON. |
| Espressioni più ricche e bocca | **Parziale** | Occhi, sopracciglia e bocca ora più grandi (lineamenti ingranditi 1,5× sulla testa). Bocca che parla e più espressioni: da fare. |
| Braccia e gesti | Da fare | Rig v2 + pose + `HAND_*`. |
| Interni sempre dettagliati, mai stile Roblox | Da fare | Regola sotto + controllo del numero di oggetti per inquadratura. |
| Città dall'alto più ricca | Da fare | Vedi priorità 3. |
| Moquette viola | **Corretto** | Il piano a specchio della sala azzurrava il rosso. Con `"asciutto": 1` nei parametri del luogo `sala` (storia JSON) la moquette resta rosso scuro. Verificato. |
| Facce piccole | **Corretto in parte** | Lineamenti ×1,5 e linee più spesse (`dipingiFaccia`). Verificato su close-up del nonno. Resta il tema «opaco, non lucido». |

### Regola «mai Roblox» (da aggiungere a `look-disegnato.md`)
Ogni oggetto inquadrato a <4 m ha **tre livelli**: (1) forma primaria con **bordi smussati** (bevel), (2) **forme secondarie** (maniglie, viti, cornici, piedini, pulsanti, cavi, fessure), (3) **dettagli dipinti** (etichetta con testo, prezzo, sporco, riflesso finto). Più **un gruppo di oggetti piccoli attorno** (3-6). Un oggetto con solo il livello 1 è «base» e non va inquadrato da vicino.
Minimi per inquadratura: vicolo ≥25 oggetti, sala ≥30, banco premi ≥40 (scatoline!), strada ≥ 15 insegne/vetrine, città aerea ≥ 60 insegne e 20 veicoli.

---
## 5. Priorità, lavoro e tempi

Tempi = ore di lavoro mio (con le anteprime da 2-11 s incluse) + render finale (~1 min). Quelle con «CHIEDI» cambiano il look o i file condivisi: **ne parliamo prima**.

| # | Miglioramento | Perché | Lavoro stimato | Note |
|---|---|---|---|---|
| 0 | Fatto: seduta con scala, fila di sinistra sullo sgabello, moquette, facce ×1,5 | piccoli e verificati | 1 h (fatto) | backup `.bak` accanto ai file |
| 1 | **Sala: scala delle comparse** (più piccole e magre), macchine visibili e più piene (cartelli, schermi), camera che sale come nel reference | impatto massimo | 2-3 h | CHIEDI: cambia il look della sala approvato |
| 2 | **Rig personaggi v2** (ginocchia, gomiti, mani, collo) + libreria di pose + `SIT_0`/`HAND_*` | seduti veri, gesti | 5-7 h (generatore 2 h, pose 2 h, sistema punti 2 h, prove 1 h) | CHIEDI: rigenera tutti i GLB (con backup) |
| 3 | **Città dall'alto ricca**: istanze di palazzi con finestre accese, 60+ insegne neon, 20+ auto con fari, semafori, strisce, pioggia, nebbia a strati; volo dalla strada | impatto alto | 3-4 h | il costo di render è basso (istanze) |
| 4 | **Bocca e espressioni**: 4 forme + più facce (sorriso con denti, occhi ad arco, occhi tondi) | personalità | 2 h | usa le parole della voce |
| 5 | **Personaggi opachi con contorno** (clearcoat 0, 2 bande di luce) | stesso disegno del reference | 1-2 h | CHIEDI: tocca `look` dei personaggi |
| 6 | **Dissolvenze** tra luoghi (0,3-0,5 s) nel motore e nel JSON (`"passaggio": "dissolvi"`) | ritmo del reference | 1-2 h | piccolo ma tocca il render: provare |
| 7 | **Vicolo, ingresso, banco premi**: più oggetti (regola dei tre livelli), insegna dorata, scaffali con 80 scatoline, peluche, distributore con lattine | densità | 4-6 h (3 luoghi) | modelli in Blender, 1-2 s ciascuno |
| 8 | **Libreria versionata** (`library/3d`, manifest, schede, script di promozione) | riuso | 3 h | si fa mentre si fanno i punti 1-7 |
| 9 | **Strumento di confronto**: stesso fotogramma del reference e del nostro affiancati per parola (da scrivere; oggi si fa con ffmpeg `hstack`) | meno giri di prove | 1-2 h | usa `ref_words.json` |

Ordine consigliato: 1 → 2 → 4 → 3 → 7 → 5 → 6 → 8 → 9. Tempo totale: circa 25-30 ore di lavoro mio, spezzabili in tappe da mezza giornata; dopo il rig v2 e la libreria, **un video nuovo di 45 s** costa: storia+mondo 2-4 h, anteprime e ritocchi 1-2 h, render finale ~1-2 min.

### Metodo di lavoro per ogni video nuovo
1. Guardare il reference a 4 fotogrammi al secondo e scrivere **la tabella delle inquadrature** come al §1 (camera, mossa, personaggi, oggetti da avere).
2. Controllare la libreria: riusare i modelli ≥ v2; per ciò che manca, modello base in Blender (script + export).
3. Mondo → anteprima (2-11 s) → confronto affiancato → correzioni.
4. Personaggi con pose dalla libreria e punti salvati; controllo automatico (anca sul punto, niente compenetrazioni, ≥ N oggetti per inquadratura).
5. Camera: una mossa lenta + sguardo finale fermo, dissolvenza tra luoghi.
6. Render finale, poi **promuovere** nella libreria gli oggetti migliorati.
