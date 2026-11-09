---
name: cartoon-storie
description: Unica skill per i cartoni: propone idee e scrive storie (fantasia, storie vere verificate, spiegazioni), copioni e regia, poi crea Shorts verticali animati (1080x1920) nello stile di «Ho già mangiato»: personaggi cartoon disegnati (sagome) in un mondo 3D realistico con camere cinematografiche, dalla voce registrata dell'utente. Trova la storia, scrive copione e regia, compone i luoghi da un kit di 520 modelli CC0 + texture + cieli HDR, rende l'MP4 con musica e sottotitoli karaoke. Tara il look su un fotogramma o un video di riferimento misurandolo (luce, colore, confronto automatico), rende la qualità finale a passaggi (ombre morbide e di contatto vere) e cerca sul web, con licenza, i modelli che mancano. Guida l'utente passo per passo (piano scritto e conferma, poi copione, regia, contact sheet, video) e consegna subito il video solo se lo chiede espressamente. Usa per /trova-storia, /fai-video o qualsiasi richiesta di cartoon short, anche quando l'utente chiede solo idee, un copione, una regia, di sistemare un video già fatto, di rendere una scena uguale o più realistica di un riferimento, o di migliorare la qualità in automatico.
---

# Cartoon storie

Obiettivo di qualità: il video di riferimento «Ho già mangiato» (`kit/stories/esempio_ho_gia_mangiato.json` lo ricrea). Rispondi nella lingua dell'utente; copione nella lingua di pubblicazione (default italiano). Leggi `HANDOFF.md`.

## Come accompagni l'utente (leggi per primo)
L'utente vuole arrivare a un video buono con poche revisioni. Il modo più economico è fermarsi nei punti dove una correzione costa poco (idea, copione, regia, contact sheet) invece di scoprire i problemi a video finito, quando rifare costa render, tempo e token. Per questo lavori a tappe con conferma, e lo dici all'utente fin dall'inizio.

**1. Prima risposta: piano scritto breve + richiesta di conferma.** Prima di fare qualsiasi cosa pesante, scrivi in pochi punti cosa farai e cosa ti serve, poi chiedi conferma. Formato:

```
Ecco cosa farò:
1. Storia: <proposte di idee | sviluppo dell'idea X | uso il tuo copione>
2. Copione: <durata stimata, n. parole, lingua>
3. Voce: <mi serve il file della tua voce | uso quella già caricata>
4. Regia: tabella battuta per battuta (cosa si vede, azione sulla parola, camera)
5. Luoghi: <elenco luoghi, luce/ora dal copione, oggetti da creare se mancano>
6. Anteprima: contact sheet con l'inizio di ogni inquadratura e ogni azione
   (solo se c'è un riferimento da raggiungere: prima taro il look su un suo fotogramma per tipo di luce)
7. Video finale: MP4 1080x1920 con voce, musica, karaoke (qualità: <normale | a passaggi, ombre morbide>) + controllo luce/aloni + testi per la pubblicazione
Mi servono: <voce, testo esatto, durata, pubblico…>. Procedo?
```

**2. Tappe con conferma (⏸).** Dopo ogni tappa mostra il risultato in forma compatta e chiedi se andare avanti o cosa cambiare:
- ⏸ **idee / storia scelta** (storie-metodo, trova-storia);
- ⏸ **copione** (con conteggio parole e durata);
- ⏸ **voce ricevuta** (controlla che il testo coincida con la voce; segnala le parole dubbie);
- ⏸ **tabella di regia** (cosa si vede, azioni sulle parole, camere, oggetti creati);
- ⏸ **taratura su un riferimento** (solo se l'utente porta un video/fotogramma da raggiungere): affiancati prima/dopo e numeri della metrica, `references/migliora-frame.md`;
- ⏸ **contact sheet dell'anteprima** (`out/<nome>/contact.png`): è la tappa più importante, perché qui si vedono inquadrature, luce e oggetti a costo quasi zero;
- **video finale**: consegna l'MP4 con poche righe su cosa mostra ogni inquadratura, i numeri del controllo luce e cosa resta da migliorare.
Se l'utente corregge, rifai solo la tappa interessata e rimostrala.

**3. Eccezione: video subito.** Solo se l'utente lo chiede espressamente («fai direttamente il video», «non fermarti», «dammi subito l'MP4») salti le conferme intermedie: scrivi comunque il piano in 3-5 righe (senza aspettare risposta), esegui tutto, guarda tu il contact sheet prima del render e consegna il video con l'elenco delle scelte fatte e dei punti incerti.

**4. Sempre:** spiega con parole semplici (niente gergo tecnico non necessario), di' cosa hai verificato e cosa no, e non dichiarare mai fatto un video che non hai generato e controllato.

## Prima volta (una sola volta per PC)
1. Python 3: `pip install skia-python numpy pillow imageio-ffmpeg faster-whisper`.
2. Node 18+: `cd engine3d && npm install && npx playwright install chromium`.
3. Kit di asset (520 modelli, texture, cieli HDR, ~3 GB, CC0): `python kit/tools/scarica_kit.py` scarica la release di https://github.com/pietroch22-byte/cartoon-kit in `asset-kit/` accanto alla skill (oppure imposta `CARTOON_KIT=/percorso/asset-kit`).
Il video si genera solo su un computer con Python, Node e scheda video (Mac: ~0,03 s per fotogramma). Senza esecuzione di codice la skill prepara storia, copione, regia e JSON.

## Flusso (con le tappe ⏸ della sezione precedente)
1. **Storia** → `references/storie-metodo.md` (idee che contengono già una storia, motori narrativi, scrivere partendo dalla risposta, controllo; esempio in `storie-esempio.md`) e, per storie vere, `references/trova-storia.md` (fonti verificate; temi usati in `kit/topics/used.txt`). Se l'utente chiede solo idee, rispondi in chat senza fare il video. ⏸
2. **Copione** → hook ≤12 parole, loop aperto, un cambio visivo ogni 2-4 s, payoff nelle ultime parole, finale che richiama l'inizio. ⏸
3. **Voce** dell'utente, mai modificata: `python kit/tools/asr_words.py voce.mp3 work/words.json --lang it`. ⏸
4. **Regia (obbligatoria)** → `references/regia.md` e, per pose, sguardi, pause e ritmo degli attori, `references/recitazione.md`: tabella battuta per battuta (cosa si vede, azione sulla parola, camera e perché, arricchimento). Ogni verbo e ogni oggetto detto si vede sulla sua parola (si accende, arriva, rotola, si gonfia…). Ora e luce le decide il copione. ⏸
5. **Ogni parola-oggetto ha il suo oggetto, fatto bene e al suo posto** → gli oggetti si mostrano come si usano davvero: le uova escono da un frigo che si apre (`library/oggetti3d/frigo_anni60.json`, `"open": "anta"`), il cibo sta nei piatti, gli oggetti sul tavolo non si sovrappongono (il motore separa da solo quelli accavallati, ma posizionali già distanziati di almeno 5 cm). Oggetti bianchi o molto chiari (frigo, piatti, mobili) vanno tinti color panna o grigio chiaro: il bianco puro sotto le luci della scena brucia.  il controllo blocca il video se la voce nomina un oggetto (forchetta, panna, uova, frigo…) che la battuta non mostra: inquadralo con `on`, usalo in `do`/`prop`/`tray`, mappalo in `mostra`, o motivalo in `non_mostrare`. Gli oggetti piccoli (forchetta, uovo) vanno inquadrati da vicino: il motore adatta il dettaglio alla loro grandezza reale.
6. **Luoghi ricchi** → inventario di 15-40 oggetti coerenti per luogo; cerca con `python kit/tools/search_library.py sedia lampione` (kit + libreria; le parole italiane sono tradotte con `library/sinonimi_it_en.json`, i modelli Kenney di cibo e cucina hanno nomi inglesi: plate-dinner, utensil-fork, pepper-mill, carton, egg, frying-pan…). Prima un modello vero: se non è nel kit né nella libreria, **cercalo sul web con licenza** (`references/migliora-frame.md` §6) e proponi di aggiungerlo al kit; solo se manca davvero, crealo (`references/creare-oggetti.md`); IA come ultima via, sempre segnalata. Oggetti pesanti ripetuti molte volte (alberi, piante): impostori (§5). Mai saltare un oggetto nominato.
7. **Story file** `kit/stories/<nome>.json` (formato sotto; esempio completo: `esempio_ho_gia_mangiato.json`).
8. **Anteprima** `python kit/run.py anteprima kit/stories/<nome>.json` → controllo automatico + `out/<nome>/contact.png` (inizio di ogni inquadratura e ogni azione). Correggi il JSON. ⏸ (contact sheet)
8b. **Taratura su un riferimento** (facoltativa, se l'utente porta un video o un fotogramma da raggiungere) → `references/migliora-frame.md`: `kit/tools/ritaglia.py`, poi `kit/tools/taratura.py storia.json FRAME rif.png itNN` ripetuto, una correzione per giro, e il preset tarato salvato in `look.js` + `luce-colore.md`. ⏸
9. **Video** `python kit/run.py video kit/stories/<nome>.json` → `out/<nome>/<nome>.mp4`. Qualità finale: `"qualita": {"passaggi": 16}` nella storia (ombre morbide e di contatto vere, bordi puliti; molto più lento, vedi `migliora-frame.md` §4).
10. **Controllo qualità** → `python kit/tools/misura_luce.py out/<nome>/frames` e ritagli a piena risoluzione contro gli aloni (`references/luce-colore.md`). Poi `upload.txt` (3 titoli, descrizione, fonti, 5-8 hashtag) e il tema in `kit/topics/used.txt`.

## Formato JSON (riassunto)
- `cast`: `{"nonna": {"type": "nonna"}}` per i personaggi pronti (nonna, marco, vicina, zia1-5) oppure un costume nuovo (`references/personaggi.md`).
- `places`: `type` room (w, d, h; parete di fondo a z = -d/2, camera verso z positivo) o outdoor. `light`: interno, interno_notte, giorno, tramonto, notte. `floor`/`wall`/`tiles` = texture del kit `{"tex", "tint", "rep"}`. Poi: `models` (`{"m": nome, "at": [x,y,z], "size": altezza | "w": larghezza, "ry", "id", "hidden", "parent", "color", "colori": {"nome materiale": "#colore"}}`: `colori` ricolora singole parti di un modello, es. il sugo rosso dello spaghetti_bowl (mat8) diventa crema d'uovo per la carbonara; i nomi dei materiali si leggono dal .glb), `facades` (case dipinte con finestre accese), `windows`, `beams`, `lamps` (luci vere), `strings` (lucine), `boards` (cartelli e ricami con testo), `fires` (fiamme con `id`), `steam`.
- `beats`: `say` (testo esatto della voce, si può spezzare una frase in più battute), `place`, `light`, `speaker` (chi parla: la bocca si apre una volta per sillaba solo mentre si sentono le sue parole; se la battuta mescola narratore e dialogo, il dialogo va tra « » e solo quelle parole muovono la bocca; una frase detta da un personaggio che continua nella battuta dopo vuole `speaker` anche lì), `camera`, `do` (azioni sugli oggetti alla parola `at`: `show`, `pop`, `hide`, `move`+`dur`, `on` per fuochi e luci, `show`+`from` per arrivare in volo, `shake` per tremare, `hop` per saltellare, `spin` per girare su se stesso, `open`/`close` con il nome dell'anta per aprire frigo, ante e coperchi), `mostra` (`{"parola": "id"}` quando la parola detta è mostrata da un oggetto con un altro nome, es. carbonara → piatto), `non_mostrare` (parole volutamente non mostrate, con motivo), `cast` con `x`, `z`, `pose`, `face`, `change` (posa/faccia su una parola), `anim` (`{"at", "prop": "fat"|"roll"|"squash"|"tilt", "to", "dur"}`: si gonfia, rotola…), `enter`, `move` (`{"at", "to": [x,z], "dur"}`), `prop` (`phone`, `spoon`, `fork`), `tray` (`lasagna`, `pie`, `cake`, `arancini`), `apron: true` in `change` per indossare il grembiule.
- Pose: hang, hip, up, wave, point, stop, belly, cheek, tray, phone, defend, spoon, eat, apron, shrug. Facce: neutral, smile, grin, sly, worried, teary, shock, stuffed, chew, determined, nervous, blissful.

## Camera: lo stile del video di riferimento
Le camere sono le 18 inquadrature del video di riferimento trasformate in modelli relativi al soggetto (`library/camere_riferimento.json`): stessa distanza, altezza, angolo, obiettivo e movimento, applicati al personaggio o all'oggetto indicato con `on`. Nel JSON scegli il **modello** e il **soggetto**; il motore calcola le posizioni. Se il soggetto si sposta durante l'inquadratura, la camera lo segue; i carrelli lungo una fila si orientano sulla fila.
Grammatica del riferimento: si apre sul viso e si rivela il contesto; ogni luogo nuovo ha un campo largo; ogni oggetto nominato ha il suo dettaglio sulla parola; le battute dette sono in primo piano o mezza figura frontale; le rivelazioni di grandezza sono dal basso; il finale è un primo piano frontale stretto. Distanze tipiche: primo piano 1,9-2,2 m, mezza figura 2,7 m, due figure 3,7-5 m, campo largo 7-8 m; camera all'altezza degli occhi; movimenti di 0,3-1 m in 1-3 s; stacchi tra inquadrature (o, quando la regia lo giustifica, un movimento continuo: sotto).
Modelli:
- `rivela_dal_viso` (actor): primo piano che resta un attimo e poi si allontana rivelando ciò che il personaggio guarda — inquadratura 1 «hook board» del video di riferimento, 2.2 s
- `due_figure_soglia` (group): due personaggi a figura intera, lento avvicinamento di 1 m — inquadratura 2 «doorstep two-shot» del video di riferimento, 2.9 s
- `dettaglio_oggetto` (object): dettaglio di un oggetto a parete o sul mobile, quasi fermo — inquadratura 3 «clock insert» del video di riferimento, 1.4 s
- `ecu` (actor): primissimo piano frontale, piccola spinta — inquadratura 4 «nonna glint ECU» del video di riferimento, 0.8 s
- `ambiente` (group): campo largo del luogo dall'alto della stanza, lenta spinta in diagonale — inquadratura 5 «kitchen wide» del video di riferimento, 1.5 s
- `dall_alto_oggetto` (object): dall'alto sopra un oggetto (fornelli, piatto), poi si alza e si apre a 3/4 — inquadratura 6 «stove insert» del video di riferimento, 2.7 s
- `due_figure_tavolo` (group): due personaggi dietro un tavolo, frontale, lenta spinta — inquadratura 7 «over-table two-shot» del video di riferimento, 2.1 s
- `dal_basso_rivela` (object): camera bassa che si inclina verso l'alto seguendo un oggetto che cresce o arriva — inquadratura 8 «lasagna low angle» del video di riferimento, 2.8 s
- `mezza_figura` (actor): mezza figura frontale, piccola spinta — inquadratura 9 «marco stuffed MCU» del video di riferimento, 1.6 s
- `primo_piano` (actor): primo piano leggermente di lato — inquadratura 10 «nonna on the phone» del video di riferimento, 1.7 s
- `gru_rivela` (actor): parte sul personaggio e sale all'indietro rivelando tutto il paesaggio — inquadratura 11 «rooftops chain» del video di riferimento, 1.7 s
- `campo_lungo_alto` (object): campo lungo dall'alto che scende verso la scena — inquadratura 12 «piazza queue wide» del video di riferimento, 2.1 s
- `carrello_fila` (actor): carrello laterale lungo una fila di persone: ancora sulla persona all'inizio della fila — inquadratura 13 «trays dolly» del video di riferimento, 1.7 s
- `tilt_cielo` (group): camera bassa che parte guardando il cielo e scende seguendo ciò che arriva dall'alto fino al gruppo a terra — inquadratura 14 «helicopter parmesan» del video di riferimento, 2.2 s
- `due_figure_frontale` (group): due personaggi frontali, spinta lenta — inquadratura 15 «marco eating» del video di riferimento, 2.3 s
- `carrello_basso_segue` (actor): camera bassa che avanza seguendo un personaggio che si muove o rotola — inquadratura 16 «marco rolls» del video di riferimento, 1.7 s
- `tre_quarti` (group): tre quarti diagonale su due personaggi, lieve spinta — inquadratura 17 «nonna stops him» del video di riferimento, 2.4 s
- `primo_piano_finale` (actor): primo piano frontale stretto, spinta minima (finale) — inquadratura 18 «payoff CU + loop» del video di riferimento, 1.6 s
**Movimenti continui (senza stacco)**, sempre all'altezza degli occhi e con planate morbide, mai a caso:
- `accompagna` (`on`: personaggio con `move`): carrello laterale che accompagna chi cammina da un punto all'altro a distanza costante (~2,9 m), con un po' di spazio davanti e si ferma con lui. Opzioni: `dist`, `lato: -1` (l'altro lato), `fov`.
- `passaggio` (`on` → `verso`, `parola`): dal personaggio all'oggetto che nomina (o da un soggetto all'altro) senza stacco: la camera **arriva** sul secondo soggetto sulla sua parola. Opzioni: `da_preset`, `verso_preset` (di default mezza figura per le persone, dettaglio per gli oggetti).
- `piano_sequenza` (`tappe`: `[{"on", "preset", "at"}, …]`): attraversa il luogo seguendo l'azione; ogni tappa è un'inquadratura del riferimento (anche `accompagna`) e la camera ci arriva sulla parola `at`.
Il motore calcola la planata (0,8-2,5 s secondo la distanza), tiene ogni tappa almeno 1 s (fonde le tappe troppo vicine, vince l'oggetto nominato) e controlla ogni 3 fotogrammi che nessun oggetto copra il soggetto: se succede gira attorno al soggetto, si avvicina o curva la planata; se non ci riesce lo segnala come errore `camera coperta` nell'anteprima. Quando usarli: `references/linguaggio-camera.md` §3b e `references/regia.md`. Esempio: `kit/stories/esempio_movimenti_continui.json`.
Più inquadrature in una battuta: la successiva parte sulla parola `at`. Per scegliere il modello giusto per ciò che deve provare lo spettatore (funzione, angolo, movimento, composizione, copertura, 180°) usa `references/linguaggio-camera.md`; oltre ai 18 modelli del riferimento ci sono 5 inquadrature classiche: `zoom_comico`, `vertigine`, `arco`, `dall_alto_vulnerabile`, `dal_basso_eroe`. Camera fissata a mano: `{"keys": [[0, [x,y,z], [lx,ly,lz], fov], [1, ...]]}`. I vecchi nomi (closeup, wide, insert…) sono alias di questi modelli. Il motore corregge da solo due cose: le inquadrature su un oggetto si adattano alla sua grandezza e al suo centro reali (una forchetta viene inquadrata da vicino, un elicottero da lontano); se un mobile o un oggetto copre il soggetto, la camera gira un po' attorno a lui finché lo vede libero. Per un oggetto che si sposta molto (uova che scappano) preferisci un'inquadratura larga che mostri tutto il percorso.
**Ritmo:** nessuna inquadratura sotto 1 secondo (il motore lo impone: se due parole-chiave sono troppo vicine tiene l'inquadratura sull'oggetto o sull'azione nominata e toglie quella generica). Non mettere più di 2-3 inquadrature in una battuta corta: l'utente le ha trovate troppo taglienti. Il regista automatico (`director.js`) resta disponibile solo se richiesto (`"director": true`): l'utente preferisce lo stile del riferimento.

## Look (già tarato, non cambiarlo senza misurare)
ACES con esposizione per preset di luce, cielo HDR del kit scelto dall'ora, bloom solo sulle sorgenti di luce, correzione colore finale, nessuna occlusione ambientale in screen-space (fa aloni). Dettagli e valori: `references/look-realistico.md`, `references/luce-colore.md`. Per cambiarlo o aggiungere un look nuovo (es. notte al neon) si **misura**: `references/migliora-frame.md` (taratura su un riferimento). Ombre di contatto vere senza aloni: rendering a passaggi (§4).

## Regole
- Fatti verificati con 2+ fonti; niente persone reali viventi come bersaglio, marchi, gore; storie e personaggi originali.
- Ogni oggetto in scena ha senso per luogo ed epoca (una sedia moderna in pelle in una cucina di nonna è un errore).
- Limite skill 200 file: gli asset grandi stanno nel kit su GitHub, non nella skill.
- Risparmio token: cerca con `search_library.py` invece di leggere l'indice; una contact sheet per giro; correggi il JSON, non il motore.

## Risorse
`engine3d/` motore (three.js: `web/engine.js`, `cards.js` personaggi, `look.js` look realistico, `world.js` luoghi, `scene.js` tempo/azioni/camere). `kit/engine/film.py` pipeline, `check_film.py` controllo. `library/oggetti3d/` oggetti costruiti (elicottero, forma di parmigiano…), `library/modelli3d/` Kenney CC0. `references/` regia, recitazione, linguaggio-camera, creare oggetti, luce e colore, look realistico, personaggi, trova-storia, storie-metodo (+ storie-esempio, analisi-ricks-clips), libreria-oggetti, migliora-frame (taratura, rendering a passaggi, impostori, ricerca modelli). `kit/tools/`: taratura, ritaglia, griglia, campiona, confronta, metrica, misura.mjs, tinta, colore_impostori. `engine3d/bake.mjs`: impostori. Il vecchio motore 2D (`run.py render`) e quello ibrido restano solo come ripiego.
