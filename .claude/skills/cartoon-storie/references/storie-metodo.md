# Metodo per trovare e scrivere storie (ex skill story-generator)


# Generatore di storie brevi

**Riferimento editoriale: Ricks Clips — metodo ricostruito dai racconti analizzati per proporre idee, scrivere copioni e trasformarli in scene originali. Non sono i prompt o il sistema privato del canale.**

L'obiettivo principale è generare storie interessanti. Colori, personaggi e camera vengono dopo.
Il materiale osservato è in `references/analisi-ricks-clips.md`.

## Capire cosa generare

Ricava dalla richiesta tema, pubblico, lingua, durata e tipo di storia. Non imporre una sequenza di domande quando il contesto basta.
In questo progetto la lingua predefinita è l'italiano; un nuovo racconto di fantasia può partire da 45–60 secondi e circa 115–155 parole, da adattare alla voce effettiva.
Se non è specificato, usa un pubblico generalista adolescente/adulto. «Fantasia» significa vicenda inventata: non implica automaticamente fiabe, magia, animali parlanti o una morale per bambini.

Distingui il tipo di lavoro:

- **Proponi idee:** restituisci idee valutabili; non renderizzare un video.
- **Sviluppa/genera una storia:** produci il racconto completo e il piano delle scene. Se l'utente non ha scelto un'idea, sviluppa la migliore e spiega la scelta in una frase.
- **Crea il video:** completa anche personaggi, set, regia, voce autorizzata, animazione ed export. Un copione o una skill non costituiscono un video generato.

Per il contenuto scegli una modalità, dichiarandola:

- **Fantasia:** vicende inventate, coerenti nelle proprie regole; non presentarle come fatti accaduti.
- **Storia documentata:** cerca fonti affidabili prima di sviluppare il copione. Non colmare le lacune inventando dialoghi, cause, date o protagonisti come se fossero documentati.
- **Spiegazione:** parti da un fenomeno verificato e usa una dimostrazione o un'analogia visiva corretta; indica i limiti dell'analogia quando servono.

Se il contesto è il cartone della nonna, la modalità naturale è fantasia comica. La richiesta generica «come Ricks» non obbliga tutti gli episodi a parlare della nonna o a essere presentati come storia vera.

## 1. Proporre idee che contengono già una storia

Se non è richiesto un numero, proponi cinque idee. Per ognuna mostra:

1. Titolo concreto e modalità.
2. Apertura narrata di una o due frasi.
3. Domanda che lo spettatore vuole risolvere.
4. Complicazione principale e almeno un tentativo che peggiora la situazione.
5. Rivelazione finale, esplicita per l'utente che sta scegliendo.
6. Un'immagine o un'azione distintiva da animare.

Varia il meccanismo tra le proposte. Evita cinque titoli con lo stesso trucco o storie che richiedono solo oggetti sempre più grandi.
Preferisci premesse rappresentabili con persone, oggetti e azioni; un titolo curioso senza una risposta soddisfacente non è ancora un'idea pronta.

## 2. Scegliere un motore narrativo

I campioni analizzati suggeriscono tre famiglie, da usare come principi e non come trame da ricopiare:

- **Segnale frainteso:** un avvertimento viene ignorato; il primo evento rafforza l'interpretazione sbagliata; una conseguenza obbliga a rileggerlo; il meccanismo chiarisce il finale.
- **Regola assurda con motivo nascosto:** una piccola azione si ripete; le contromisure falliscono per una ragione coerente; alla fine si scopre quale vantaggio o obiettivo la motivava.
- **Paradosso spiegato:** mostri un risultato controintuitivo, poni una domanda, costruisci un'analogia o una dimostrazione visiva e torni al risultato iniziale.

Non applicare sempre la stessa struttura. Scegli quella adatta alla premessa, senza riprendere oggetti, svolte e sequenze distintive dei riferimenti cambiando solo nomi e ambientazione.

## 3. Scrivere partendo dalla risposta

Prima del copione annota la rivelazione e il nesso che la rende possibile. Poi costruisci gli eventi necessari a guadagnarsela.

- La prima frase mette in scena una contraddizione o un evento concreto. Evita saluti, spiegazioni del canale e promesse vuote come «non ci crederai».
- Introduci soltanto le informazioni necessarie a capire cosa vuole il protagonista e cosa lo ostacola.
- Ogni tentativo modifica il problema successivo. La progressione deve poter essere raccontata con «perciò» o «ma», non soltanto con «e poi».
- Pianta uno o due indizi leggibili prima del finale. Non tenere nascosta una premessa indispensabile per poi aggiungerla arbitrariamente come soluzione.
- Una regola fantastica deve essere stabilita prima del suo impiego risolutivo; un oggetto magico introdotto al finale non sostituisce un meccanismo preparato. Nei contesti quotidiani preferisci motivi, incentivi e conseguenze comprensibili.
- Ritarda la spiegazione quanto basta a sostenere la curiosità; non ritardare le informazioni necessarie a capire l'azione.
- La rivelazione risponde alla domanda iniziale e dà senso agli indizi. Chiudi con una conseguenza breve o una battuta coerente con la stessa regola.
- Una pausa, una reazione o un dialogo breve può sostituire una frase del narratore. Nessuna scena esiste soltanto per riempire la durata.

Le durate sono scelte di lavoro, non misure universali del canale. Conta le parole e stima la durata; dopo una registrazione usa i timestamp reali.

## 4. Consegnare una storia producibile

Per l'idea sviluppata prepara:

- **Premessa e risposta finale**, visibili all'utente ma non necessariamente entrambe al pubblico subito.
- **Copione pulito**, pronto per essere letto, separato dalle note tecniche.
- **Piano delle scene:** intervallo stimato, frase, azione visibile, indizio/rivelazione, personaggi, oggetto e suono utile.
- **Asset necessari e riuso possibile**, mantenendo un numero ragionevole di set.
- **Fonti** per le affermazioni fattuali, oppure etichetta esplicita di fantasia.

Scrivi in una nuova cartella `episodes/<slug>/` del progetto: `IDEA.md`, `SCRIPT.md`, `SHOTS.md` e, se serve, `SOURCES.md`. Non sovrascrivere il cartone corrente per generare una proposta.
Se l'utente chiede soltanto poche idee, basta la risposta in chat: non creare una cartella per ogni titolo.

Quando viene richiesto il video, prosegui con il flusso di questa skill (regia, JSON, anteprima, video).
Una nuova storia richiede il proprio audio; non dichiarare di aver generato una voce o un filmato senza un file effettivo verificato.

## 5. Controllo prima di consegnare

Rileggi il copione come spettatore che ignora la soluzione:

- La domanda iniziale è chiara?
- Gli eventi causano quelli successivi?
- La rivelazione è preparata e risponde alla domanda?
- Ogni scena può mostrare qualcosa, oltre a illustrare il testo?
- Il testo rientra nella durata e distingue fantasia e fatti verificati?

Correggi i problemi nella storia prima di intervenire sul look. Se la premessa funziona solo grazie a una spiegazione lunga o a un finale arbitrario, cambia premessa.

## Richieste pronte da usare

Un esempio originale sviluppato è in `references/storie-esempio.md`: mostra come passare da una contraddizione a copione e sei scene.

«Usa cartoon-storie. Proponimi cinque storie originali di fantasia per Shorts italiani da 50 secondi. Per ciascuna dammi apertura, domanda, complicazione, rivelazione e azione da animare. Consiglia la più forte.»

«Usa cartoon-storie. Sviluppa l'idea scelta: scrivi il copione parlato e il piano delle scene. Anticipa due indizi e fai rispondere il finale alla promessa iniziale.»

«Usa cartoon-storie. Cerca tre storie documentate su invenzioni insolite; verifica le fonti, poi sviluppa quella con il meccanismo più chiaro da mostrare.»
