# Regia del suono

Regole che valgono con qualunque strumento (solo strumenti gratuiti: i nostri effetti sintetizzati in `kit/engine/audio.py`,
la voce dell'utente, ffmpeg per misurare). Il suono si progetta dopo che i tempi delle immagini sono fissati: se cambia un
tempo, si rifà il suono. Con `"regia_audio": true` (o `"silenzi"` / `"ambienti"` / `"sezioni"` / `"musica": "auto"` nella storia) `film_disegnato.py` attiva il mix misurato a 4 strati (`voce`, `musica`, `ambienti` con **J-cut / L-cut**, `effetti` con `silenzi` e livelli misurati in `suoni.md`).

## 1. Un effetto sonoro solo se serve
Prima di mettere un effetto rispondi a tre domande. Se una resta senza risposta, l'effetto non va.
1. **Cosa succede** sullo schermo in quel momento?
2. **Cosa deve notare** lo spettatore?
3. **Perché il suono aiuta** a notarlo (o a capirlo) meglio della sola immagine?

| evento | famiglia di suono | dove metterlo |
|---|---|---|
| passaggio veloce (oggetto, camera che vola, cambio di luogo) | soffio, fruscio, `whoosh` | parte 2-4 fotogrammi prima del movimento, finisce col picco |
| impatto | colpo secondo il materiale: legno sordo, metallo che suona, vetro che tintinna, stoffa morbida | esattamente sul fotogramma del contatto (0-1 f prima) |
| evento lontano | stesso suono più piano, più cupo (passa-basso), con un po' di eco | sull'evento, senza coprire la voce |
| macchina che parte (treno, motore, pachinko) | rombo o ronzio che sale di volume e di tono | inizia sulla parola che lo nomina, cresce col movimento |
| attesa che cresce | un tono che sale, un tic-tac, un rullo | dall'inizio dell'attesa fino al momento che la scioglie, poi silenzio |
| numeri e grafiche (contatori, cartelli, scritte) | clic, «tic» brevi, campanella | uno per ogni comparsa, mai uno per ogni cifra se scorrono veloci |
| salto di tempo | soffio lungo o accordo sospeso, oppure un taglio netto di tutto | sul passaggio |
| rivelazione | piccolo colpo + silenzio breve prima | silenzio 0,2-0,4 s prima della parola, colpo sulla parola |
| ritorno alla normalità | ambiente che rientra (strada, sala) | dopo la rivelazione, piano |
| finale | un ultimo accento, poi la coda pulita | sull'ultima parola; niente che continui dopo la fine |
Regole pratiche: l'ambiente (`ambienti` oppure generato automaticamente da `luogo` quando `regia_audio: true`) sta sempre sotto (`-25 LU`), cambia col luogo con **J-cut** (`0,45 s` entra prima del taglio) e **L-cut** (`0,55 s` sfuma dopo il taglio); i **silenzi pre-rivelazione** (`"silenzi": [{"da": "@parola", "a": "@parola2"}]`) spengono dolcemente musica/ambiente un attimo prima della svolta così il colpo successivo (`snap`, `spark`, `sting`, `ignite`) risalta; mai due effetti forti nello stesso mezzo secondo; mai un effetto sopra una parola importante (spostalo nello spazio tra le parole). Famiglie extra di effetti pronte (`audio.py`): `click`, `clack`/`wood_tap`, `snap`, `creak`, `thump`, `step`, `quindar`, `ignite`, `roar`, `heartbeat`, `paper`, `glass_tap`, `spark`, `riser` (con opzioni `dur`, `pitch`, `pan`, `gain`, `filtro: "radio"|"lontano"`, `j_cut`).

## 2. Musica con un arco variabile, dinamico e coerente col mood
La musica segue la forma della storia, non è mai un tappeto uguale dall'inizio alla fine. `audio.py` offre **13 mood** con timbri e ritmi diversi (`marimba`, `vibraphone`, `piano_felt`, `bell`, `pad`, `staccato`, `pluck`): `mystery`, `playful`, `curious`, `tense`, `chase`, `heist`, `clockwork`, `cosmos`, `ironic`, `drama`, `reveal`, `triumph`, `sad`. Scegli l'arco dal copione (e usa `"musica": "auto"`, `"dinamica": true`, `"sezioni": [...]` o `"mood"` per singola scena così la musica varia intensità e timbro a ogni gradino):
| storia | arco della musica |
|---|---|
| domanda → scoperta | sospesa e leggera all'inizio, si apre (più strumenti, tono più alto) sulla scoperta |
| conseguenza che cresce | un passo per ogni gradino: si aggiunge uno strato a ogni battuta di crescita |
| ribaltamento | si ferma o cambia di colpo sul ribaltamento, riparte diversa |
| viaggio di scala (da piccolo a enorme) | da pochi suoni acuti a bassi ampi, crescita lenta e continua |
| meccanismo (come funziona) | ritmo regolare e pulito, tipo orologio, sotto la spiegazione |
| suspense | poche note, pause, tono che sale; scioglimento sulla risposta |
Sempre: musica **strumentale** (niente parole cantate) sotto la voce; abbassata quando la voce parla, più presente negli spazi
tra le frasi; **finale pulito**: chiude sull'ultima parola o con una coda breve (≤ 1 s), mai tagliata a metà nota.
Nella storia: `"musica": {"mood": …, "bpm": …}`; l'arco si scrive nella tabella dei suoni (sotto).

## 3. Voce diretta per significato
La voce è dell'utente e non si modifica; si dirige **prima** di registrare, battuta per battuta, secondo cosa fa la frase:
| funzione | come dirla |
|---|---|
| inizio (gancio) | diretta, sicura, senza rincorsa; la prima parola già piena |
| contrasto | piccola pausa prima della parte che smentisce |
| meccanismo | più lenta e chiara, una cosa per frase |
| numero | il numero staccato, un filo più lento, mai mangiato |
| crescita | ogni gradino un poco più energico del precedente |
| limite («ma…», «però…») | abbassare il tono, pausa breve dopo |
| rivelazione | pausa prima, parola chiave appoggiata |
| riepilogo / finale | più piano, tono che chiude (non sale) |
Il ritmo si giudica **sulla voce vera** (`kit/tools/asr_words.py`), mai sul testo o su una voce sintetica: se la voce vera è più
lenta o più veloce, si spostano immagini e suoni, non si stira la voce.

## 4. Tabella dei suoni (per ogni video, in `kit/out/<nome>/suoni.md`)
Si scrive prima del mix con i tempi **previsti** dal copione e si completa dopo con i tempi **misurati** sulle parole reali
(`words.json`):
| # | evento | parola | suono | livello | previsto (s) | misurato (s) | serve perché |
|---|---|---|---|---|---|---|---|
| 1 | porta che si apre | «entra» | `sliding` | -18 LU sotto la voce | 3,2 | 3,41 | si vede che il turista entra |
Se previsto e misurato differiscono più di 0,1 s, vale il misurato.

## 5. Mix
1. **Prima la voce**: livello fisso, nessun effetto sopra le parole.
2. **Poi la base** (musica e ambiente): abbassata sotto la voce con attacco ~70 ms e rilascio ~450 ms; quando la voce parla
   la base sta 12-18 LU sotto la voce (misurati), negli spazi può risalire di 4-6 dB.
3. **Poi solo gli effetti utili** (sezione 1), 6-12 LU sotto la voce salvo gli impatti principali.
4. **Volume misurato**: -14 LUFS integrati (YouTube Shorts), picco vero ≤ -1 dBTP, misurati con
   `ffmpeg -i video.mp4 -af ebur128=peak=true -f null -`; normalizzazione in due passaggi (lineare, non comprime la voce).
5. **Niente parole tagliate**: la voce comincia ≥ 0,1 s dopo l'inizio e finisce ≥ 0,3 s prima della fine; nessuna parola
   coperta da un effetto.
6. **Ascolto**: in cuffia e su un altoparlante piccolo (telefono). Se non è stato possibile ascoltare, **dirlo** all'utente.
7. **Dire cosa non si è verificato** (per esempio: ascolto su telefono, voce sintetica al posto di quella vera).
