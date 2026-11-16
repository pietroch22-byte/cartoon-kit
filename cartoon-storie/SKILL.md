---
name: cartoon-storie
description: Unica skill per i cartoni: idee, storie (anche vere e verificate), copione, regia e Shorts verticali animati 1080x1920 dalla voce dell'utente, con musica, effetti e karaoke. Look «disegnato» (mondo 3D disegnato con contorni, strada a specchio sfumato, neon, personaggi con personalità, mondo vivo, camera continua): si costruisce prima il mondo da un JSON e poi si muove la camera. Lavora a tappe con conferma. Usa per /trova-storia, /fai-video o qualsiasi richiesta di cartoon short, anche solo idee, copione, regia o sistemare un video già fatto.
---

# Cartoon storie

Un solo motore: il look **«disegnato»** (three.js in Chromium). Obiettivo di qualità e stile: i video di **@RicksClips3000**. I fotogrammi di riferimento (`references/riferimenti-rick.md`) si aprono **solo su richiesta esplicita dell'utente**: per una storia normale bastano le regole e le misure scritte. Rispondi nella lingua dell'utente; copione nella lingua di pubblicazione (default italiano). Se l'utente fornisce già una script (`copione.txt`), parti subito da quella seguendo il flusso.

**Prima di lavorare leggi `STATO.md`** (una pagina: cosa è approvato, cosa è in prova, cosa è respinto, lavori aperti). Se `STATO.md` e un'altra pagina si contraddicono su un'approvazione, vale `STATO.md`. `HANDOFF.md` è il diario lungo: non leggerlo intero, cercaci dentro solo il dettaglio che serve. Questa pagina dice cosa fare e in che ordine; i dettagli stanno nelle reference dell'**Indice** in fondo: apri solo quelle della tappa in cui sei.

Dove sta: la cartella vera è `~/STORIE CARTOON/cartoon-storie` (`~/.claude/skills/cartoon-storie` è solo un collegamento). Accanto: `asset-kit/` (texture e cieli CC0, riferimenti studiati), `video/` (video finiti), `voci/` (registrazioni dell'utente), `confronti/` (prima/dopo da approvare).

## Come accompagni l'utente (leggi per primo)
L'utente vuole un video buono con poche revisioni: ci si ferma dove correggere costa poco (idea, copione, regia, contact sheet), non a video finito.

**1. Prima risposta: piano breve + conferma.**
```
Ecco cosa farò:
1. Storia: <proposte | sviluppo dell'idea X | uso il tuo copione>
2. Copione: <durata, n. parole, lingua>
3. Voce: <mi serve il file della tua voce | uso quella già caricata>
4. Regia: tabella frase per frase (cosa si vede, azione sulla parola, camera, cosa è vivo, suono)
5. Luoghi: <elenco, luce dal copione, oggetti da creare>
6. Anteprima: contact sheet + controlli automatici
7. Video finale: MP4 1080x1920 con voce, musica, effetti, karaoke + misure + testi per la pubblicazione
Mi servono: <…>. Procedo?
```
**2. Tappe con conferma (⏸)**: idee/storia · copione (parole e durata) · voce ricevuta (testo = voce, parole dubbie) · tabella di regia · contact sheet (la tappa più importante) · video finale con cosa mostra, numeri dei controlli e cosa resta da migliorare. Se l'utente corregge, rifai solo quella tappa. Ogni correzione dell'utente diventa una regola scritta (qui, nella reference giusta o in `STATO.md`).
**3. Video subito** solo se l'utente lo chiede espressamente: piano in 3-5 righe senza aspettare, guarda tu il contact sheet prima del render, consegna con le scelte fatte e i punti incerti.
**4. Sempre**: parole semplici; di' cosa è verificato e cosa no; mai dichiarare fatto un video non generato e controllato. **Ogni modifica al look si fa con un confronto prima/dopo approvato dall'utente** (in `confronti/`).
**5. Bozze veloci [utente 13/11]: l'anteprima il prima possibile.** Due bozze per due domande: **bozza camera** (video a bassa qualità, mondo anche povero, niente controlli lunghi, musica o karaoke: si giudicano inquadrature, movimenti e ritmo) e **bozza mondo** (pochi fotogrammi fermi a qualità piena + `ricchezza.txt`: si giudica il luogo). Ordine: bozza camera approvata → mondo arricchito → controlli completi → video finale; i controlli lunghi si fanno una volta sola, sul finale. All'utente si dice sempre che è una bozza e cosa manca. Comandi e soglie: `references/bozze-veloci.md`.
**6. Dati dei video pubblicati [utente 13/11].** All'inizio di ogni video nuovo, e quando l'utente dice di averne pubblicato uno, **chiedi i numeri** dei video usciti (piattaforma, data, visualizzazioni, quanti arrivano alla fine, mi piace, commenti, condivisioni, salvataggi) e scrivili in `kit/topics/pubblicati.md`. Come si confrontano e cosa se ne ricava è scritto in testa a quel file.

## Prima volta (una sola volta per computer)
1. `python3 kit/run.py setup` (Python privato in `kit/.venv` con numpy, pillow, skia, imageio-ffmpeg, scipy, opencv, faster-whisper).
2. Node 18+: `cd engine3d && npm install && npx playwright install chromium`.
3. Blender solo per creare modelli nuovi (forma): `/Applications/Blender.app/Contents/MacOS/Blender -b --python …`.
Il render vuole un computer con scheda video (Mac: ~0,37 s a fotogramma). Senza esecuzione di codice si preparano storia, copione, regia, JSON, codice e documenti.

## Flusso
1. **Storia** → `references/storie-metodo.md` (fantasia, sviluppo, copione) oppure `references/trova-storia.md` (storie vere: 2+ fonti, temi usati in `kit/topics/used.txt`). Solo idee → rispondi in chat. ⏸
2. **Copione** → gancio ≤ 12 parole, domanda aperta, un cambio visivo ogni 2-4 s, rivelazione nelle ultime parole, finale che richiama l'inizio. Prima di chiedere la voce passa gancio e premessa dalla skill `copione-social-intrattenimento`, se c'è, e scarta le premesse deboli. ⏸
3. **Voce** dell'utente, mai modificata: `kit/.venv/bin/python kit/tools/asr_words.py voce.mp3 kit/stories/<nome>/words.json --lang it`. ⏸
4. **Regia** → `references/regia.md` (tabella obbligatoria), poi le reference di recitazione, camera e suono dell'Indice. ⏸
5. **Mondo** → `references/mondo-da-riferimento.md` (ricerca di foto vere, scheda del luogo, quando è ricco, bozza mondo), **poi `references/problemi-noti.md`** (ciò che è già andato storto, con i rimedi: va letta prima di scrivere i luoghi), poi le altre reference «Luogo nuovo» dell'Indice.
6. **Storia JSON** in `kit/stories/<nome>/<nome>.json` con `"motore": "disegnato"` (formato: `references/storia-disegnato.md`): prima i `luoghi`, poi `cast`, poi `scene` con attori, azioni sulle parole (`"t": "@parola"`) e camera a tappe. **Nei luoghi si segna `"esterno": true` solo per strade, piazze e campagna**: tutti gli altri sono stanze chiuse (4 muri + soffitto) e il controllo VUOTO_DIETRO_IL_SET le verifica. Esempi: `kit/stories/ho_gia_mangiato/` (camera «uccello»), `kit/stories/matita_spazio/` (stile Rick completo), `kit/stories/pachinko/`, `kit/stories/treno_venti_secondi/`, `kit/stories/disegnato_esempio.json`.
7. **Anteprima** `python3 kit/run.py anteprima "$PWD/kit/stories/<nome>/<nome>.json"` → `kit/out/<nome>/contact.jpg`, `controlli.txt`, `vita.txt`, `fluidita.txt`, `ricchezza.txt`, `recitazione.txt`, `lettura.txt`. Un passaggio per giro: mondo → personaggi → camera. ⏸
8. **Video** `python3 kit/run.py video "$PWD/kit/stories/<nome>/<nome>.json"` → `kit/out/<nome>/<nome>.mp4` (`RESUME=1` riprende un render interrotto). **Mai il video finale se i controlli segnalano problemi: dal 16/11 lo fa rispettare il comando stesso (il «cancello»).** Prima dei fotogrammi rifà i controlli delle sole scene cambiate, senza salvare immagini (pochi secondi), e se ci sono avvisi si ferma con l'elenco in `kit/out/<nome>/cancello.txt`. `CONTROLLI_OK=1` va avanti lo stesso per inquadrature, REGIA, FLUIDITÀ, RECITAZIONE e scritte. **Mondo povero, poco vivo, oggetti compenetrati o fuori posto: il video si ferma sempre.** La vecchia chiave `MONDO_OK` è rimossa; `CONTROLLI_OK` non scavalca il mondo. Il messaggio guida a partire da GLB gratuiti con licenza verificata, aggiungere dettagli e movimento, salvare componenti riusabili in `library/`. Per lavorare sul motore, le storie esistenti si usano solo in lettura o in copia, senza modificarne i mondi [utente 16/11]. Dettagli: `references/controlli.md` §0.
9. **Controllo** → tremolio (automatico), `camera_misura.py`, `shortkit.py check`, volume con `ffmpeg -af ebur128=peak=true` (dettagli e numeri: `references/controlli.md`). Confronto affiancato col riferimento solo se l'utente lo chiede. Poi `upload.txt` (3 titoli, descrizione, fonti, 5-8 hashtag), tema in `kit/topics/used.txt`, copia del video in `~/STORIE CARTOON/video/`.

Il percorso della storia va dato **assoluto**: con un percorso relativo il render fallisce.

**Da Video Reference → Mondo di Rick**: solo se l'utente manda un video e chiede di ricrearlo con i nostri personaggi e il nostro motore. Segui `references/da-video-reference.md` (`python3 kit/run.py da-reference …`, `confronto-reference …`; esempio `kit/stories/ricerca_gettone/`). Il flusso sopra resta invariato.

## Regole dell'utente (non si cambiano senza chiedere)
**Il look non si riscrive.** Sta in `engine3d/web/look_disegnato.js`: le passate della scena approvata copiate riga per riga (strada a specchio sfumato, contorni a inchiostro su profondità e normali, nebbia luminosa, due bagliori, catena finale **senza OutputPass**). Si cambia solo il mondo (`mondo_disegnato.js`, script del luogo). Luce: `notte` approvata; `giorno` e `interno` da far approvare con un fotogramma. Notte del riferimento: `"esp": 0.8, "cb": 1.35` nei `parametri` del luogo. Interni con moquette: `"asciutto": 1`.
**Lezioni dell'utente (11/11):** (1) cartoon disegnato, mai realistico né luce cotta in Blender; (2) Blender solo per la **forma** (GLB con materiali con nome), il motore dà colore, scritte, luce, riflessi e movimento; (3) personaggi disegnati (colori smorzati, contorno bruno, testa larga) che **interagiscono davvero** (siedono, tengono, toccano); (4) gli oggetti con un meccanismo funzionano; (5) **mai Roblox**: ogni oggetto vicino ha forma smussata + dettagli dipinti + 3-6 oggetti attorno; (6) **niente sfarfallio** (`sfarfallio.py` prima e dopo ogni modifica, lucine ≤ 1 sotto la soglia del bagliore); (7) confronto affiancato col riferimento quando l'utente lo chiede (dal 13/11 i riferimenti si aprono solo su richiesta); (8) scala giusta (comparse sedute 0,40-0,46); (9) camera continua quando possibile.
- **Camera**: ogni inquadratura ha la sua mossa, scelta da «cosa è cambiato?» nella voce; **un soggetto = una ripresa** (si taglia solo quando cambia soggetto o luogo; nello stesso luogo di solito la camera vola, non taglia); **sempre fluida, anche quando è veloce**; tagli sulla parola e mai spoiler prima della parola; inquadrature ampie: se il set è piccolo si allarga il mondo, non si stringe la camera. Le formule `VOLO`/`frena`/`MOSSE` del motore non si toccano senza richiesta esplicita.
- **Personaggi**: `"personaggi": "rick"`, `tipo` dai 40 archetipi di `engine3d/web/cast_rick.js`; protagonista ufficiale `impiegato` con faccia bianca e targhetta `PN8`; mai due vicini con stesso tipo e colore; il gesto lo fa il personaggio (niente mani o oggetti staccati dal corpo).
- **Mondo vivo**: tutto ciò che è inquadrato si muove, da `M.tick` come funzione del tempo (deterministico), ampiezze piccole e fasi diverse. Prima di un oggetto nuovo guarda `library/vivi/catalogo.json`; gli animali vengono da `library/animati/`, mai una sagoma ferma.
- **Buon senso [12/11]**: ogni oggetto ha ciò che ha nella realtà (orologi con 12 numeri, scritte centrate e proporzionate, porte con maniglia, prezzi con €, ora coerente con la luce).
- **Suono**: voce dell'utente mai modificata; sottotitoli solo il nostro karaoke; -14 LUFS, picco ≤ -1 dBTP; voce sintetica solo come segnaposto, da dire all'utente.
- **Contenuti**: fatti verificati con 2+ fonti; niente persone reali viventi come bersaglio, marchi, gore; storie e personaggi originali. Ogni oggetto ha senso per luogo ed epoca; oggetti bianchi o chiarissimi tinti panna o grigio chiaro (il bianco puro brucia). Ogni parola-oggetto detta dalla voce si vede sulla sua parola.

## Modo di lavorare (preferenze dell'utente)
- **Prove a risparmio**: solo pochi fotogrammi diversi per scena; ogni cambio si valuta con un contact sheet (anche di un fotogramma) prima di andare avanti. `rendi_disegnato.mjs` riusa i fotogrammi già fatti nella cartella di uscita: per rifare una clip cancella prima `out/<nome>`.
- **Pochi token**: leggi, decidi, agisci solo quanto serve; una contact sheet per giro; correggi il JSON prima del motore.
- **Niente Blender se si può fare in three.js**; Blender da riga di comando per ciò che va rifatto (generatori), a vista con computer use per ritocchi una tantum.
- **Solo strumenti gratuiti** con licenza verificata (niente Higgsfield o servizi a crediti). Tutto riusabile nei prossimi video.
- **Qualità**: nel video finale non si abbassa mai la qualità per fare prima; le bozze sono un'altra cosa e si dichiarano come bozze.
- Dove si esegue: senza il computer dell'utente si fanno storia, copione, regia, JSON, codice, documenti. Render: Node + Chromium con WebGL.

## Indice: cosa leggere e quando
| Quando | Leggi |
|---|---|
| Sempre, all'inizio | `STATO.md` |
| Idee, storie di fantasia, copione | `references/storie-metodo.md`, `storie-esempio.md`, `analisi-ricks-clips.md` |
| Storie vere, /trova-storia | `references/trova-storia.md` |
| Tabella di regia e cast dal copione | `references/regia.md` |
| Pose, sguardi, pause degli attori | `references/recitazione.md` |
| Quale inquadratura, quale movimento | `references/linguaggio-camera.md`, `movimenti-camera.md` (il §8 non è valido: vedi `STATO.md`) |
| Scrivere la camera nel JSON (mosse, preset, tappe, sfocatura) | `references/camera-motore.md` |
| Cast, facce, gesti, interazioni, luce sui personaggi | `references/personaggi-rick.md` (modelli 3D: `personaggi3d.md`) |
| Luogo nuovo | `references/mondo-da-riferimento.md`, `problemi-noti.md`, schede in `library/luoghi/`, `look-disegnato.md` (§0-§0b sempre, poi le sezioni del tipo di luogo; il §10 è diario), `arricchire-ambienti.md`, `mondo-vivo.md`, `buon-senso.md` |
| Formato del JSON | `references/storia-disegnato.md` |
| Effetti, musica, mix | `references/regia-suono.md` |
| Bozze camera e mondo | `references/bozze-veloci.md` |
| Controlli, soglie, misure | `references/controlli.md` |
| Qualcosa va storto | `references/problemi-noti.md` |
| Dove sta un pezzo di codice, comandi, opzioni | `references/mappa-codice.md` |
| Ricreare un video reference (solo su richiesta) | `references/da-video-reference.md` |
| Confronto col riferimento Rick (solo su richiesta) | `references/riferimenti-rick.md`, `piano-reference.md`, `reference-completo.md`, `ricksclips/` |
| Storia del lavoro, numeri di una prova | `HANDOFF.md` (cerca, non leggere tutto) |
