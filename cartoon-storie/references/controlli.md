# Controlli automatici e misure

> Dettagli spostati qui da `SKILL.md` il 16/11/2026 (testo pari pari, salvo le correzioni segnate **[corretto 16/11]**). Stato di approvazione di ogni pezzo: `STATO.md`.

## 0. Cosa ferma davvero il video: il cancello (nel codice dal 16/11)
- **Regola**: mai il video finale se `controlli.txt`, gli avvisi REGIA, FLUIDITÀ, RECITAZIONE o `lettura.txt` segnalano problemi.
- **Nel codice dal 16/11** `python3 kit/run.py video` passa dal **cancello** (`cancello()` in `kit/engine/film_disegnato.py`) prima di rendere i fotogrammi. Il cancello lancia `rendi_disegnato.mjs --controlli` e poi decide:

  | Avvisi | Effetto | Per andare avanti lo stesso |
  |---|---|---|
  | Inquadrature (quelli di `controlli.txt`), REGIA, FLUIDITÀ, RECITAZIONE, scritte tagliate o piccole (`lettura.txt`) | ferma, codice di uscita 1 | `CONTROLLI_OK=1` |
  | **Mondo**: `MONDO_POVERO`, `VITA_BASSA` (sotto il 60%), `COMPENETRATI`, `FUORI_POSTO`, `COLLOCAZIONE_ERRORE` | ferma sempre: correggere il luogo o il controllo fallito | Nessuna deroga: `MONDO_OK` rimossa; `CONTROLLI_OK=1` non vale |
  | Avvisi di formato del JSON (buchi tra scene, fov o altezze insolite) | solo avviso | — |
  | Tremolio (dopo i fotogrammi) | ferma, com'era | `TREMOLIO_OK=1` |

- **REGIA rivista (16/11)**: `kit/tools/controllo_regia.mjs` separa tappe, viste e riprese. Nessun limite di 8/15 s nel luogo o numero minimo di tagli ogni 12 s. Una planata sullo stesso soggetto non genera falsi avvisi di inquadrature/mosse ripetute. Restano le soglie delle tappe (0,65–4 s), campo largo iniziale, rapporto con le parole, varietà tra riprese e tagli ripetuti sullo stesso soggetto. Tolta l’eccezione provvisoria del cancello: gli avvisi REGIA ancora emessi fermano come gli altri. Gli avvisi statici si ricalcolano anche quando si riusano i controlli visivi.
- **`--controlli` costa poco**: stessi controlli dell'anteprima ma **non salva immagini, contact sheet né i file `.txt`**; scrive solo `kit/out/<nome>/avvisi.json`. Ogni scena ha un'«impronta» (la scena, il suo luogo, lo script del luogo e i file che importa): se non è cambiata i controlli non si rifanno. Misurato: `matita_spazio_v9`, 63 fotogrammi chiave, meno di 20 s la prima volta e 0 s al secondo lancio, 36 KB. Anche l'anteprima normale aggiorna `avvisi.json`. Limite: l'impronta non guarda il codice del motore (`engine3d/web`): dopo una modifica al motore `node kit/tools/rendi_disegnato.mjs <storia> --controlli --tutte`.
- L'elenco (scena, tempo, codice) resta in `kit/out/<nome>/cancello.txt`. Dopo `--controlli` i file `controlli.txt`, `vita.txt` ecc. sono quelli dell'ultima anteprima, quindi possono essere più vecchi di `avvisi.json`: per il cancello vale `avvisi.json`.
- **Collocazione nel codice**: `M.vita.collocazione(camera)` in `engine3d/web/vita.js`, raccolta in `ricchezza().posti` e `avvisi.json`. `COMPENETRATI` e `FUORI_POSTO` sono avvisi MONDO. Anche un errore interno (`COLLOCAZIONE_ERRORE`) ferma: un controllo fallito non equivale a un mondo verificato.
- **Cosa il cancello NON misura**: plausibilità di un oggetto rispetto al luogo o all'epoca (es. un frigorifero sulla Luna). Questa verifica resta visiva (`buon-senso.md`). Le zone di passaggio non dichiarate non sono riconoscibili automaticamente.
- Perché esiste: prima del cancello `matita_spazio_v9` è stato reso con 15 fotogrammi chiave segnalati su 63 (6 `SOGGETTO_FUORI`, 6 `SOGGETTO_TAGLIATO`, 5 `NERO_PIENO`), cioè proprio i soggetti decentrati e tagliati che l'utente ha poi respinto.
- File dell'anteprima (`kit/out/<nome>/`): `contact.jpg`, `controlli.txt`, `vita.txt` (soglia 60%), `fluidita.txt`, `ricchezza.txt` (`MONDO_POVERO`), `recitazione.txt`, `lettura.txt`.

### Collocazione: come si dichiara e cosa misura

- **COMPENETRATI**: due oggetti con nome, appartenenti a rami diversi del mondo, con almeno il 30% dei campioni della superficie del più piccolo dentro il solido dell'altro, oltre 3 cm. La percentuale è una stima dei campioni, non del volume. Si usano triangoli reali, non solo scatole di ingombro. Appoggi di pochi millimetri e oggetti nelle cavità di contenitori aperti non contano. Pezzi dello stesso gruppo/GLB non si confrontano: un montante e la sua porta sono un oggetto composto.
- **Incastri tra modelli separati**: il motore riconosce montanti/stipiti e architravi (`montante`, `stipite`, `architrave`, `jamb`, `lintel`, anche numerati) sotto un nodo porta/finestra. Il nome è solo un candidato: servono un componente sottile e allineato, un supporto poco profondo e un vano realmente libero nei triangoli del supporto. Verifica materiale da un lato e apertura dall’altro su cinque punti del bordo; per un architrave che attraversa il vano verifica entrambi gli appoggi laterali e il vuoto centrale. Funziona anche con modelli ruotati. Pareti piene e casse compenetrate restano errori. Altri tipi di incastro non sono riconosciuti automaticamente: tenere i componenti dello stesso oggetto nello stesso gruppo; `userData.sovrapposto_ok = true` resta una dichiarazione esplicita da motivare, mai un modo per nascondere un errore.
- **FUORI_POSTO**: oggetto alto più di 25 cm, con il centro della pianta nella zona. Contano solo oggetti nel quadro; strutture/grandi oggetti oltre 7,2 m e cose sospese oltre 2,2 m sopra la zona sono esclusi. La zona deve avere geometria e `userData.passaggio = { nome: 'binario', per: ['treno', 'vagone', 'locomotiva'] }`, oppure un nome contenente `binari`, `rotaie`, `carreggiata` o `corsia`.
- La geometria della zona deve coprire **solo il passaggio**, senza banchina, marciapiede o spazio laterale. Il controllo usa gli assi locali della zona: una zona diagonale non comprende più gli angoli vuoti del suo ingombro mondiale. Per curve o zone concave usare più tratti stretti: ogni tratto resta un parallelepipedo locale, non una ricostruzione semantica della strada. I nomi dei nodi del modello intero e i metadati testuali `userData.tipo` / `userData.vivo` identificano i veicoli ammessi, anche se il gruppo esterno non ha nome. Un oggetto registrato con comportamento `passa` è ammesso; `userData.nel_passaggio = true` dichiara una presenza intenzionale.
- **Limiti**: non rileva tutte le intersezioni sottili, oggetti senza nome, mesh instanziate/skinned, contenuti completamente nascosti o ogni guasto tra due fotogrammi campionati. Massimo 12 segnalazioni per campione; nella stessa scena la stessa coppia si segnala una sola volta anche se cambia percentuale. Non cambia né corregge automaticamente una scena.
- I risultati si riusano solo a pose, geometria, visibilità e soglie invariate. `CONTROLLI_V = 4` invalida le vecchie impronte salvate. Dopo altre modifiche al motore usare ancora `--tutte`.
- **Mondo povero**: il messaggio chiede di cercare prima in `library/`, partire da modelli GLB gratuiti con licenza verificata, aggiungere dettagli coerenti e movimento, salvare i componenti riusabili in `library/` con fonte e licenza. Non basta moltiplicare scatole per superare un numero.

### Prove ripetibili, senza modificare le storie

```sh
node --test kit/tests/test_collocazione.mjs kit/tests/test_regia.mjs
python3 -m unittest discover -s kit/tests -p 'test_cancello.py'
python3 kit/tests/regressione_collocazione.py --out /tmp/cartoon-collocazione
```

L'ultima prova legge cinque storie vere (`matita_spazio_v9` se presente, altrimenti `matita_spazio`) e genera una **copia** del treno con lampione sui binari e cassa nel distributore, più appoggio e mela nella ciotola come casi da ignorare. Scrive solo nella cartella di prova e verifica che gli script/JSON originali non cambino. Non produce MP4. Gli avvisi delle storie sono dati diagnostici: non autorizzano a modificarne i mondi [utente 16/11].

## 1. Controllo inquadrature
**Controllo inquadrature** (anteprima → `controlli.txt`): `CAMERA_DENTRO`, `SOGGETTO_COPERTO`, `SOGGETTO_FUORI`, `SOGGETTO_TAGLIATO` (**[corretto 16/11]** mancava: soggetto tagliato dal bordo del quadro per il 20% o più, o fuori dal bordo della sua carta quando è chino), `CARTA_DI_TAGLIO` (la sagoma è vista quasi di taglio), `TROPPO_VICINO`, `SOVRAPPOSTI`, `QUADRO_PIATTO`, `TROPPO_SCURO`, `TROPPO_CHIARO`, `NERO_PIENO`, `BIANCO_BRUCIATO` + grandezza della testa del soggetto (Rick ~20%). Trova i guasti, non la noia: il contact sheet si guarda comunque.

## 2. Controllo tremolio
**Controllo tremolio [utente 12/11]** (`kit/tools/tremolio.py`, severo): flusso ottico verso il fotogramma prima e dopo, conta i dettagli fini che compaiono/spariscono in UN fotogramma solo (più chiari o più scuri di tutti e due i vicini riallineati) e i SALTI_DI_LUCE (zone larghe che cambiano luce di colpo); ciò che si muove per conto suo (personaggi, muletto, fogli, polvere) non conta. Soglie: media > 0,3% del quadro, picco > 2%, stesso punto in 4+ fotogrammi su 5 su più dello 0,5% del quadro (**[corretto 16/11]** così è nel codice), salto di luce > 3%. Gira da solo in `kit/run.py video` e lo ferma (`TREMOLIO_OK=1` per andare avanti sapendolo). Si usa anche su una scena sola: `rendi_disegnato.mjs <storia> --scena N --solo-fotogrammi --out <cartella>` e poi `tremolio.py <cartella>/fotogrammi`.

## 3. Misura della camera
**`kit/tools/camera_misura.py`**: velocità, picchi, salita, scatti (> 6 px/f²) e inversioni destra-sinistra per scena, con grafico; numeri di Rick: mediana 3,6 px/f, p90 16,9, picco mosse ~14 (p90 36), salita ~10 f simmetrica, inversioni ~0. Comando: `kit/.venv/bin/python kit/tools/camera_misura.py kit/out/<nome>/fotogrammi` (scatti e destra-sinistra contro i numeri di Rick).

## 4. shortkit e regole misurate su Rick
**`kit/tools/shortkit.py`** (`check` video, `measure` riferimento, `compare` fotogrammi) e regole misurate su 20 Short di Rick: `references/ricksclips/LEGGIMI.md`, `style-rules.md`, `rules.json`.

## 5. Confronto con mromidev/claude-animated-shorts
**Confronto con mromidev/claude-animated-shorts** (report testuali in `~/STORIE CARTOON/asset-kit/riferimenti/claude-animated-shorts/references/reports/`, media archiviati in `archivio/vecchie_immagini_riferimento_2026-11-13/`; per i veri frame di Rick vedi `references/riferimenti-rick.md`, consultabile solo su richiesta): `references/ricksclips/confronto_mromidev.md`. Ordine dei lavori: profondità di campo (fatta, camera vera attiva) → contorni (la passata c'è: misurare, spessore con la distanza) → colore (correzione finale tarata sul riferimento notturno) → mix audio misurato.

## 6. Leggibilità delle scritte (readcheck)
**`kit/tools/readcheck.mjs`** (approvato 15/11 su `confronti/punto2_readcheck_prima_dopo.mp4`): controlla il tempo di lettura continuo delle scritte 3D visibili (`cartello`, `M.insegna`, `M.pannello` o `userData.scritta=1, userData.testo`) e dei sottotitoli karaoke (`min 1,5 s`, `15 car/s` latini + `1,5 s` cuscinetto, font 3D `≥ 22 px/riga`; insegne decorative escludibili con `passa: true` / `testoPassa: 1` o `"testi_passa"` nel JSON; exit `0/1/2`). L'anteprima salva il risultato anche in `lettura.txt`. Codici di `readcheck.mjs`: `TAGLIATO_BORDI`, `TAGLIATO_PARZIALE`, `TROPPO_PICCOLO`, `TROPPO_BREVE`.

## 7. Sottotitoli
**Sottotitoli**: solo il nostro karaoke (scelta dell'utente): 1-3 parole in maiuscolo, la parola detta in giallo (`kit/engine/karaoke.py`). `"karaoke": false` li toglie; **`"karaoke": "leggibile"`** (o `"karaoke_leggibile": true`) evita blocchi "lampo" (`< 0,65 s`) o troppo veloci (`> 20 car/s`) fondendo/ridistribuendo in modo sicuro, e `film_disegnato.py` scrive `lettura_sottotitoli.txt` e la sezione `## Leggibilita sottotitoli` in `suoni.md`.

## 8. Giro di controllo finale (passo 9 del flusso, com'era in `SKILL.md`)
**Controllo** → il **controllo tremolio** gira da solo prima del montaggio e ferma il video se trova problemi (`kit/tools/tremolio.py`, mappe rosse in `kit/out/<nome>/tremolio/`); `kit/.venv/bin/python kit/tools/camera_misura.py kit/out/<nome>/fotogrammi` (scatti e destra-sinistra contro i numeri di Rick); `sfarfallio.py` (vecchio, solo prima/dopo), `misura_luce.py`, `shortkit.py check` sul video, confronto affiancato col riferimento (ffmpeg `hstack`), volume con `ffmpeg -af ebur128=peak=true`. Poi `upload.txt` (3 titoli, descrizione, fonti, 5-8 hashtag), tema in `kit/topics/used.txt`, copia del video in `~/STORIE CARTOON/video/`.
**[corretto 16/11]** Il confronto affiancato col riferimento si fa solo se l'utente lo chiede: dal 13/11 i fotogrammi di Rick si aprono solo su richiesta esplicita (`riferimenti-rick.md`).
