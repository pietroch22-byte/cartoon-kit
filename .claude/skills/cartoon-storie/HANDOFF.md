# HANDOFF — leggi prima di continuare

Contesto: Pie (freelance video/AI, Asti) fa cartoon Shorts verticali. Aveva una skill 3D (three.js, `reference/skill-attuali/cartoon-audio-short.md`). Ha portato il kit di Rick ("Ricks Claude Workflow", 2D Python+skia, in `kit/`). Questa skill unisce le due cose.

## Decisioni prese (dall'utente)
- **Stile visivo: quello di Rick** (2D vettoriale, vedi `reference/rick_stile_frames.jpg`), con firma propria (palette, protagonista).
- **Storie: sia vere e curiose (tipo Rick) sia commedia/format** tipo "Mai dire a una nonna italiana" (40k YouTube, 5k TikTok).
- **Durata: libera**, la decide la storia.
- **Oggetti di scena = priorità**: riusare un oggetto già fatto invece di ricrearlo. Soluzione: libreria + manifest + scala di priorità (`references/libreria-oggetti.md`).
- **Studio** (app dell'utente, rende cliccabile ogni oggetto dal JSON): verrà adattato dopo al JSON del kit.

## Cosa prendere dal kit di Rick
find-story (verifica + punteggio + used.txt), story file JSON a battute con vocabolario chiuso, checker automatico (`kit/engine/check.py`), contact sheet, file upload.txt.
## Cosa lasciare
Voci Piper come default (inglese, robotiche): meglio la voce dell'utente. Il motore 3D della vecchia skill per questo stile.

## Già fatto in questo pacchetto
- `SKILL.md`, `references/trova-storia.md`, `references/libreria-oggetti.md`.
- `library/manifest.json` iniziale: 26 oggetti + 16 luoghi del kit, con tag italiani.
- `kit/` = motore 2D ricostruito (codice nostro, non di Rick), senza i sample audio/video.

## Fatto l'8/11/2026
- Scelto il 2D come motore principale (meno token; test: 37 s di video con voce registrata resi in 49 s).
- Voce registrata italiana: `voice.file` + `voice.words` nello story file, allineamento difflib sul trascritto, `kit/tools/asr_words.py`.
- Checker: durata libera (avvisi solo sotto 12 s o sopra 90 s), voce registrata accettata, piper non più obbligatorio.
- `kit/engine/kitchen2d.py`: 23 oggetti cucina; manifest a 49 oggetti; `kit/tools/search_library.py`.
- `library/modelli3d/`: 340 modelli Kenney CC0 in archivi (via 4 della scala).
- Sottotitoli: tolti « » … dalle parole a schermo.

## Fatto il 9/11/2026: motore ibrido
- L'utente vuole lo stile dei disegni 2D ma con veri movimenti di camera 3D: costruito `engine3d/` + `kit/engine/hybrid.py`. Personaggi e oggetti 2D disegnati da skia diventano sagome nel mondo 3D; modelli Kenney CC0 per mobili e cibo; 15 preset di camera con rotazione automatica.
- Test «Ho già mangiato»: 37 s, cucina + piazza notturna, voce originale, karaoke; render completo in 1 min 41 s sul Mac.
- Comandi: `run.py preview3d` e `run.py video3d`; controllo `engine.check3d`.

## Fatto il 9/11/2026: regia
- L'utente ha segnalato camera insensata e oggetti che non reagivano alla voce. Aggiunti: eventi sulle parole (`do`: stato, pop, show, hide, move), `change`/`enter`/`move` dei personaggi, oggetti 2D animati e con stati, camera a segmenti che parte su una parola con planata, camera automatica motivata, `references/regia.md` con piano di regia obbligatorio.
- Esempio `kit/stories/esempio_3d.json` rifatto con regia completa (orologio su «otto», scossa su «Errore», fuochi su «fuochi», lasagna gigante su «lasagna», vicina che entra su «vicina», Marco che rotola verso la porta).

## Da fare (in ordine)
0. Fatto: oggetti 3D da forme semplici (`library/oggetti3d/*.json`, pezzi che girano, `parent`, arrivo in volo) + regola «oggetto mancante si crea» (`references/creare-oggetti.md`). Creati elicottero e forma di parmigiano.
1. Ampliare la libreria: teglie, telefono, porta d'ingresso, auto, bici, animali.
1. **Test 5 oggetti** (es. frigorifero, scooter, cane, pentola, lampione) con le vie 2, 3, 4 della scala; contact sheet affiancato a un frame di Rick; l'utente sceglie quali vie tenere. Poi aggiornare la scala.
2. Scrivere `tools/restyle_svg.py` (passata di stile SVG) e `tools/search_library.py` (cerca nel manifest per tag).
3. Creare `library/palette.json` (palette del canale) e il look fisso del protagonista.
4. Estendere il kit: oggetti caricati da `library/svg/` oltre a `PROPS`, checker che verifica che ogni prop esista nel manifest.
5. Sprite da modelli 3D Kenney (via 4): script di render frontale con contorno, test su 5 oggetti.
6. Convertire le due skill del kit (`find-story`, `make-video`) in `/trova-storia` e `/fai-video` italiane che puntano a questa cartella.
7. Adattare Studio al JSON del kit (id stabili per oggetto).

## Domande aperte per l'utente
- Pubblica solo in italiano o anche in inglese?
- Voce: sempre la sua, o accetta una TTS italiana per velocità?
- Palette/firma visiva: ha preferenze (colore protagonista, cappello/oggetto distintivo)?
- Studio: in che linguaggio è? Può leggere direttamente il JSON del kit?
- Budget crediti Higgsfield per gli oggetti generati con IA?

## Fonti asset verificate (nov 2026)
Poly Pizza (10k+ low-poly, API con chiave gratuita, misto CC0/CC-BY), Kenney (CC0, 270+ pacchetti), Quaternius (CC0), KayKit (CC0, non rivendere i file), FreeSVG.org (CC0), SVG Repo (licenza per icona/collezione, verificare), OpenMoji (CC BY-SA → evitare).

## 9/11/2026 sera: look realistico sul motore di riferimento
- Prova sul progetto «Ho già mangiato» (copia in lab-arricchimento/3d, `web/pbr.js`): ACES, HDR per luogo e ora, GTAO, bloom, texture Poly Haven, 40 modelli CC0 in più. Video completo: lab-arricchimento/ho_gia_mangiato_realistico.mp4.
- L'utente preferisce le camere del motore di riferimento a quelle del motore ibrido: la skill va ricostruita su quel motore (scene da file, regia, libreria), con il look realistico.
- Gli asset (circa 320 MB) vanno in un pacchetto su GitHub scaricato da `setup`: da fare.
- Problema aperto: il tramonto sui tetti sbianca la scena.

## 9/11/2026 notte: skill ricostruita + regista automatico
- Motore = riferimento «Ho già mangiato» generalizzato (`engine3d/web`: engine, cards, look, world, scene, director). Pipeline `kit/engine/film.py`, controllo `check_film.py`, comandi `run.py anteprima|video`.
- L'utente ha bocciato le camere a preset fisso ("non scelte da un regista"): ora `director.js` sceglie ogni camera analizzando il mondo 3D (visibilità, grandezza, terzi, profondità, muri, continuità 180°).
- Esempio completo: `kit/stories/esempio_ho_gia_mangiato.json`.
- Kit asset (520 modelli, 25 texture, 14 HDR, 3 GB) in 3 zip da pubblicare come release GitHub pubblica; `kit/tools/scarica_kit.py` + `kit_repo.txt`.

- 9/11 notte: l'utente ha bocciato anche il regista automatico: ora le camere sono i 18 modelli estratti dal video di riferimento (`library/camere_riferimento.json`).

## 9/11/2026: test «carbonara» dell'utente
Problemi trovati: oggetti nominati non visibili (forchetta, panna, uova, pepe, tegame). Cause: inquadrature di dettaglio tarate su un orologio da 45 cm (gli oggetti piccoli finivano fuori), centro degli oggetti costruiti calcolato male, nessuna azione "trema", nessun controllo sulle parole dette, segmenti di camera non ordinati per tempo, oggetti costruiti poco riconoscibili, oggetti che coprono il soggetto.
Correzioni: refit delle inquadrature sulla grandezza reale dell'oggetto, rotazione automatica attorno agli ostacoli (oggetti e personaggi), azioni `shake`/`hop`/`spin`, controllo «parola detta = oggetto mostrato» (`mostra`/`non_mostrare`), segmenti ordinati, dizionario `library/sinonimi_it_en.json` per cercare i modelli in italiano, regola "prima modelli veri". Storia corretta: `kit/stories/carbonara_panna.json` (originale in `carbonara_panna.originale.json`).

- 9/11: aggiunti piatto di spaghetti (Poly Pizza, CC-BY), frigo con anta apribile, separazione automatica degli oggetti sovrapposti, durata minima 1 s delle inquadrature con priorità alle inquadrature sugli oggetti nominati, soglia del bagliore 1.6 (il bianco non brucia più), id doppi segnalati dal controllo.

- 9/11 (sessione movimenti): movimenti continui `accompagna`, `passaggio`, `piano_sequenza` (film.py: follow_keys, continuous_keys; scene.js: camOf con chiavi lineari e planate curve, controllo coperture ogni 3 fotogrammi su tutto il percorso con correzione automatica). Esempio `kit/stories/esempio_movimenti_continui.json` (voce della carbonara).

## 9/11/2026: unita la skill «migliora-frame» (nel repo cartoon-kit, `.claude/skills/cartoon-storie/`)
La skill vive ora nel repository `pietroch22-byte/cartoon-kit` ed è versionata lì. La skill separata `migliora-frame` è stata assorbita: procedura in `references/migliora-frame.md`, esempio completo in `esempi/frame-autostrada/` (v1 → v5, `CAMBIAMENTI.md`).
- **Taratura su un riferimento**: `kit/tools/ritaglia.py` (ritaglio automatico dello screenshot del telefono), `taratura.py` (un fotogramma della storia → confronto → `out/<storia>/taratura/log.csv`), `metrica.py` (zone + celle peggiori con causa), `confronta.py`, `campiona.py`, `griglia.py`, `misura.mjs` (camera dal punto di fuga, pixel → metri). Si tarano i valori dei preset ACES, non il tone mapping.
- **Rendering a passaggi** in `engine3d/web/look.js` (`?passaggi=N`, `PASSAGGI=N` in `render.mjs`, `"qualita": {"passaggi": N}` nella storia; fotogrammi in `frames_q<N>/`). Test di controllo `PASSAGGI=1 CIELO=0` = stessi pixel del render normale (provato: differenza 0). Cucina della carbonara, 16 passaggi: ombre di contatto vere, mediana luminanza 0,73 → 0,72; ~69 s a fotogramma su server senza GPU, ~7 s normale.
- **Impostori**: `engine3d/bake.mjs` + `web/bake.js` → `$KIT/impostori/`; `kit/tools/colore_impostori.py`, `tinta.py`.
- **Ricerca modelli** con licenza prima di costruire (via 4b della scala) e IA come ultima via, segnalata.
- Trovato durante il test: `kit/stories/esempio_ho_gia_mangiato.json` non passa più il controllo (`porta`, `parmigiano` nominati e non mostrati); `carbonara_panna.json` usa `spaghetti_bowl` (Poly Pizza), che non è nella release del kit. Per il test l'ho sostituito con `bowl-soup` in una copia; la voce era muta (i file di voce non sono nel pacchetto).
- Da fare: ombreggiatura reale sulle sagome (rilievo → normal map → strato in moltiplica + riflessi; codice di riferimento `reliefNormal` in `esempi/frame-autostrada/scene.js`, testato su un solo personaggio) da portare in `cards.js` come opzione; un preset "notte al neon" tarato su un fotogramma vero (contact sheet pachinko dell'utente); aggiungere `spaghetti_bowl` e una berlina realistica alla release del kit.
