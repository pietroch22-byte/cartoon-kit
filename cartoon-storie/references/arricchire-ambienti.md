# Arricchire gli ambienti: trovare, modellare, generare, animare (11/11)

**Prima di questo file leggi `mondo-da-riferimento.md`** (da dove si parte: foto vere e scheda del luogo; come si misura se è ricco). Leggi prima di costruire un luogo nuovo. Obiettivo: luoghi pieni e credibili come nel riferimento (15-40 oggetti coerenti, scritte leggibili, tutto ciò che ha un meccanismo funziona), **mai Roblox** (scatole nude).

## 1. Prima cerca, poi costruisci (scala di priorità)
1. **Archivi nostri**: `library/vivi/catalogo.json` (meccanismi: porte, ventole, saracinesca, orologio…), `library/animati/catalogo.json` (animali animati), `kit/stories/preset/`, oggetti già fatti nelle storie precedenti (`kit/stories/*/` *.glb). `python kit/tools/search_library.py <parole>`.
2. **Pacchetti CC0 da riusare** (forma; il motore li veste col look): Kenney (città, mobili, cibo, auto con ruote separate), Quaternius (props, animali animati), KayKit, Poly Haven (texture e modelli), cataloghi [AssetHoard](https://assethoard.com/free-game-assets) e [cinevva](https://app.cinevva.com/guides/free-3d-model-sites). Link diretti dei pacchetti Quaternius/KayKit su OpenGameArt (`curl -L`); conversione: `Blender -b --python kit/tools/blend_in_glb.py -- <cartella> <uscita>` (o `fbx_in_glb.py`). Licenza: leggi sempre `License.txt` (CC0 sì, CC-BY con citazione, mai senza licenza).
3. **Modellalo in Blender** (sezione 2): per gli oggetti protagonisti e per tutto ciò che deve muoversi.
4. **Generalo con l'IA da un'immagine** (sezione 3): solo per oggetti unici che non trovi, segnalandolo all'utente.

## 2. Come modellare in Blender oggetti «carini» nel nostro stile
Regole (valgono per uno script generatore come `library/vivi/genera_vivi.py` o per il lavoro a mano con computer use):
- **Forme grosse e semplici, proporzioni esagerate**: oggetti un po' tozzi e arrotondati (tazze larghe, lampade col cappello grande, sedie con gambe corte e spesse). Mai pareti sottili realistiche.
- **Smussa tutto** (modificatore Bevel, 2-3 segmenti) e una leggera **irregolarità** (rumore lento sui vertici, come `irregolare()` in `genera_personaggi.py`): niente spigoli perfetti da CAD.
- **Pochi pezzi ma leggibili**: forma principale + 2-4 forme secondarie (maniglia, bordo, piedini, tappo) + dettagli dipinti dal motore (`M.pannello` per scritte ed etichette).
- **Colore a blocchi con materiali con nome** (`metallo`, `legno`, `vetro`, `luce_*`, `corpo`…): il motore dà il colore, la luce e il contorno. Niente texture fotografiche.
- **Scala vera** (metri) e **origine a terra al centro**, fronte verso -Y in Blender (= +z nel motore).
- **Pezzi mobili separati e nominati** come in `library/vivi` (`anta_*`, `ventola`, `gira_*`, `lancetta_*`, `ondeggia`): così il motore li anima da solo.
- **Peso dei dettagli**: dove la camera guarda da vicino, 3-6 dettagli; sullo sfondo forme semplici.

## 3. Generare oggetti 3D con l'IA (ultima via)
- **Meshy** (online): ha la modalità low-poly e la ritopologia; il piano gratuito è limitato e non commerciale, verificare i termini.
- **TRELLIS 2** (open source, MIT con una parte con licenza separata): serve una GPU NVIDIA da 16-24 GB su Linux, quindi non sul Mac; dà mesh statiche, senza rig né UV puliti.
- **Hunyuan3D**: le versioni nuove sono solo online, quelle aperte hanno limiti d'uso per regione.
- **Procedura**: immagine dell'oggetto nello stile (vista frontale e di tre quarti, sfondo neutro) → modello → in Blender si riduce, si smussa, si separano i pezzi mobili, si assegnano i materiali con nome → GLB in libreria. Lo stile «disegnato» lo dà il motore, quindi va bene anche un modello semplice.

## 4. Animare in Blender (massimo controllo)
Due strade, entrambe riusabili in ogni video:
- **Pezzi nominati** (preferita per i meccanismi): il motore li anima con `vivo.js` (sempre, vicinanza, ciclo, sulla parola).
- **Animazione con i keyframe in Blender** (per movimenti particolari: un'insegna che si accende a pezzi, una macchina che fa un gesto): si anima in Blender, si esporta il GLB con l'azione, e nel motore lo si suona con `animato(M, nome, { anim: 'NomeAzione' })` di `engine3d/web/animati.js` (tempo legato alla storia). Il file va in `library/animati/`.

## 5. Vestire un luogo (metodo)
1. **Parti dalle inquadrature**: le camere della regia dicono dove servono i dettagli.
2. **A strati**: grandi (muri, banconi, treni, mobili) → medi (sedie, distributori, piante, cassette) → piccoli (cartelli, fogli, cestini, bottiglie, lattine) → usura e scritte → luci motivate (una lampada vera dietro ogni zona chiara) → vita (`vivo.js`, `animati.js`, comparse).
3. **Oggetti che raccontano**: ciò che la voce nomina è in vista e riconoscibile; il resto dice dove siamo (epoca, paese, mestiere).
4. **Controlli**: anteprima con `controlli.txt` (niente camera dentro gli oggetti né soggetti coperti), `vita.txt` (quanto si muove), contact sheet guardato a occhio contro il riferimento.
5. **Tutto ciò che crei finisce in libreria** (con nome, misure e licenza): il video dopo costa meno.

## Riferimenti trovati
Generatori procedurali di interni ed edifici in Blender (Infinigen Indoors, open source; add-on di città e dungeon a pagamento su Superhive): utili come idea, non necessari per i nostri luoghi piccoli.
