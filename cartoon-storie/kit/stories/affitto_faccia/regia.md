# 50.000 € per affittare la tua faccia 24 ore — Regia (bozza da confermare)

- **Modalità**: Fantasia horror-assurda / cinismo sui soldi (originale, zero gore, zero marchi).
- **Copione**: `copione.txt` — **155 parole**, durata stimata **~54–59 s**, lingua **italiano**.
- **Luoghi (2)**:
  1. `clinica` (`luce: "interno"`, stanza chiusa 4 muri + soffitto — **da far approvare 1 fotogramma prima del render**).
  2. `strada_notte` (`luce: "notte"`, `"esterno": true` — **luce notte già approvata**, con saracinesca della clinica, bar sul vicolo, negozio TV con schermi accesi e vetro riflettente, lampeggianti in fondo all'angolo).

---

## 1. Direzione voce (prima di registrare `voce.mp3`)
| Battuta | Come dirla (`regia-suono.md` §3) | Pausa dopo |
|---|---|---|
| «Cinquantamila euro subito per affittare la tua faccia ventiquattro ore.» | Diretta, subito piena sul numero «Cinquantamila», stacco netto prima di «per affittare» | ~0,25 s |
| «Davide era pieno di debiti e firmò senza leggere un cazzo.» | Cinica, veloce, appoggio sporco su «un cazzo» | ~0,25 s |
| «In quella stanza gli misero un volto anonimo e gli sganciarono i contanti.» | Ritmo da scambio veloce, stacco netto su «i contanti» | ~0,2 s |
| «Lui rise: “Ma chi cazzo se ne frega, domani me la ridanno.”» | Sfacciata, mezza risata da spaccone | ~0,35 s |
| «Invece di stare a casa, fece la bastardata: aspettò il suo socio fuori dal bar e gli fregò valigetta e orologio.» | Cattiva e complice fino a «bastardata:», poi rapida sull'azione | ~0,25 s |
| «Tanto la sera dopo quella faccia finta spariva.» | Leggera, sicura di farla franca | ~0,4 s |
| «Il giorno dopo tornò alla clinica. Saracinesca chiusa. Magazzino vuoto.» | Tre colpi secchi, pause brevi tra le due frasi finali | ~0,3 s |
| «Poi sugli schermi della vetrina esplose il TG: uno con la SUA faccia vera aveva appena rapinato una banca.» | Tono che sale all'improvviso, forte su «SUA faccia vera» | ~0,25 s |
| «Dietro l'angolo urlavano già le sirene.» | Tesa, rapida | ~0,25 s |
| «Davide si specchiò nel vetro per vedere cosa cazzo aveva in testa.» | Ansia crescente, rotta su «cosa cazzo» | ~0,35 s |
| «Tirò giù il cappuccio: niente occhi, niente bocca. Solo una testa bianca con cinquantamila euro in tasca.» | Pausa prima di «niente occhi», voce gelida e lenta su «testa bianca» | ~0,45 s |
| «Adesso è ricco, ricercato e cieco. Ma tu, per cinquantamila euro, l'affitteresti la tua faccia?» | Più bassa e diretta verso chi guarda, domanda finale secca per i commenti | fine |

---

## 2. Cast dal copione (`engine3d/web/cast_rick.js`)
| Personaggio | Tipo (`cast_rick.js`) | Aspetto / varianti | Perché (dal copione) |
|---|---|---|---|
| `davide` (volto vero) | `ragazzo` | `maglia: "#3b6ea5"`, `tessuto: "jeans"`, `vestito: ["zip", "tasca"]`, `capelliTipo: "ricci"`, `pelle: "#f6d9bf"` | Giovane pieno di debiti con felpa blu con zip/cappuccio; volto chiaramente riconoscibile all'inizio e sullo schermo del TG |
| `davide_finto` (volto in affitto) | `ragazzo` (stesso corpo/felpa) | Stessa felpa `#3b6ea5`, ma `testa: "squadrata"`, `capelliTipo: "riga"`, `capelli: "#c99b4a"`, `pelle: "#e9d4c2"`, `accessori: ["occhiali"]` | Deve sembrare lo stesso Davide col corpo ma con una faccia anonima diversa |
| `davide_vuoto` (senza faccia) | `ragazzo` (stesso corpo/felpa) | Stessa felpa `#3b6ea5`, testa bianca `#f4f1ea` **senza occhi, sopracciglia né bocca** (`faccia: "vuota"` da aggiungere in `omino_rick.js` solo con ok prima/dopo) | Il colpo di scena visivo finale davanti allo specchio |
| `dottore` | `scienziata` | `vestito: ["camice", "tasca"]`, `accessori: ["occhiali_sole"]`, `maglia: "#2c3448"` | Medico/operatore losco della clinica clandestina |
| `socio` | `impiegato` | `maglia: "#7a4a3a"`, `tessuto: "spigato"`, `accessori: ["cravatta"]`, porta `valigetta` | Ex socio che esce dal bar e viene derubato |

---

## 3. Tabella di regia (un soggetto = una ripresa per scena; mosse varie e voli)
*Tempi stimati su ~56 s totali prima dell'audio reale (`words.json`).*

| # | Tempo e `@parola` | Cosa deve capire lo spettatore | Cosa si VEDE (letterale) | Azione e parola esatta | Camera, legame con prima e perché (`movimenti-camera.md`) | Cosa è vivo | Suono (`audio.py`) |
|---|---|---|---|---|---|---|---|
| 1 | `0,0–10,0 s` (`0,00` → `@cazzo`) | Offerta assurda da 50.000 € in una clinica losca; Davide accetta al volo senza leggere | **Campo largo** interno `clinica` (4 muri + soffitto, insegna `50.000 € / 24H`, lettino, tavolo con foglio e valigetta aperta di contanti): `davide` seduto/davanti al tavolo col `dottore` in camice; poi dettaglio foglio firmato | `dottore` `porge` `contratto` a `@affittare`; `davide` `firma`/`batte` penna sul foglio a `@firmò` con faccia `furbo` | **Scena 1 (`clinica`)**: `avanti_lenta` (una spinta pulita nei primi 5 s), poi `volo` + `tilt_giu` sul **dettaglio** del contratto/banconote a `@firmò` (largo → dettaglio) | monitor vitale che scorre, lampada chirurgica che oscilla, valigetta lucida | `tick` + `cash` su `@Cinquantamila` |
| 2 | `10,0–17,5 s` (`@In` → `@ridanno`) | Gli scambiano la faccia, intasca i contanti e ride sfacciato | **Mezza figura** `davide_finto` davanti allo specchio della clinica con la faccia anonima nuova e un mazzo di contanti in mano (`soldi`), `dottore` di lato; `davide_finto` ride verso la camera | `davide` sostituito da `davide_finto` a `@anonimo`; prende `mazzetta` a `@contanti`; faccia `ride` a `@rise` | **Scena 2 (`zona: specchio`, `dissolvi 0,27 s`)**: `fermo` mentre scopre la faccia nello specchio → `volo` in **primo piano** + `inclina` (6°) su `davide_finto` che ride sfacciato | schermo dietro che lampeggia, tenda/lampada clinica | `pop` su `@anonimo`, `cash` su `@contanti` |
| 3 | `17,5–29,0 s` (`@Invece` → `@spariva`) | Col volto finto si vendica/deruba il socio fuori dal bar senza paura | **Campo largo** `strada_notte` (`notte` approvata) davanti al bar illuminato: `socio` esce con `valigetta`; `davide_finto` appostato al bordo avanza, lo spinge e strappa valigetta + orologio | `socio` cammina fuori dal bar; `davide_finto` fa `spinge` su `socio` a `@fregò`, `prende` `valigetta_socio`; `socio` cade/indietreggia `scioccato` | **Scena 3 (`strada_notte`)**: `carrello` laterale che accompagna l'agguato (`verso` verso il bar) → `scossa` sull'urto a `@fregò` → `indietro` lento su `davide_finto` che se ne va `ghigno` | insegna bar che respira, gatto che scappa, furgone sul fondo | `night_ambience`, `whoosh` + `crash` secco su `@fregò` |
| 4 | `29,0–34,5 s` (`@Il` → `@vuoto`) | 24 ore dopo la clinica è sparita: tutto chiuso e vuoto | **Mezza figura** davanti all'ingresso della clinica nel vicolo: `davide_finto` con valigetta si avvicina ma trova la `saracinesca` sbarrata; sbircia dentro il vetro/fessura: solo scaffali vuoti e buio | `saracinesca` già giù/bloccata (`chiudi`); `davide_finto` `batte` sulla saracinesca a `@Saracinesca`, faccia `confuso` → `nervoso` | **Scena 4 (`zona: saracinesca`, `dissolvi 0,27 s`)**: `avanti` rapida verso `davide_finto` e il lucchetto della saracinesca (`scossa` leggera sui colpi) | neon spento che frigge appena, vapore tombino | `hammer_tap` metallico su `@Saracinesca`, silenzio brusco su `@vuoto` |
| 5 | `34,5–43,5 s` (`@Poi` → `@sirene`) | Il TG mostra la SUA faccia vera come rapinatore ricercato e arriva la polizia | **Dettaglio** vetrina negozio di elettronica accesa: sui televisori appare il faccione vero di `davide` col titolo `RICERCATO - RAPINA`; poi stacco/volo su `davide_finto` di schiena con luci blu/rosse dei lampeggianti (`girofaro`) dietro l'angolo | `schermo_tg` mostra `davide` vero a `@esplose` / `@SUA`; lampeggianti `girofaro` si accendono a `@sirene`; `davide_finto` `spaventato` | **Scena 5 (`zona: vetrina`, `dissolvi 0,27 s`)**: parte su **dettaglio** TV TG (`avanti_forte` su `@SUA`), poi `volo` indietro di lato su `davide_finto` + `vertigine` (unica nel video!) appena partono le luci blu delle sirene | schermi TG animati, `girofaro` blu/rosso all'angolo | `sting` su `@TG`, `rumble`/tensione crescente su `@sirene` |
| 6 | `43,5–56,5 s` (`@Davide` → fine) | Colpo di scena: si toglie il cappuccio davanti al vetro e non ha più faccia; domanda dibattito | `davide` corre al vetro riflettente della vetrina, abbassa il cappuccio: nel vetro/inquadratura appare `davide_vuoto` (testa bianca liscia senza occhi né bocca!) con tasche/mani piene di contanti; la camera sale e arretra lasciandolo solo sotto i lampeggianti | `davide_finto` corre (`a`) davanti al vetro; su `@cappuccio` passa a `davide_vuoto`; su `@testa` mostra le mazzette di `soldi` | **Scena 6 (`zona: specchio_finale`, `dissolvi 0,27 s`)**: `segui` veloce fino al vetro → `arco` attorno a `davide_vuoto` (unico nel video!) su `@cappuccio` per far vedere la testa vuota davanti e nel riflesso → `gru_su` finale su `@Adesso` che allarga sul vicolo vuoto | lampeggianti blu/rossi riflessi sull'asfalto bagnato, schermi TG dietro che continuano | silenzio 0,3 s prima di `@niente`, colpo secco `sting` su `@testa`, coda pulita sull'ultima parola |

---

## 4. Nota su sottotitoli karaoke e controlli futuri
- **Parole spinte nei sottotitoli**: in `copione.txt` sono presenti `cazzo` (3 volte) e `bastardata`. Prima del render finale confermeremo se nel karaoke a schermo (`karaoke.py`) preferisci lasciarle per intero oppure mascherarle (`C***O`) mantenendo l'audio originale intatto.
- **Luce `interno` (`clinica`)**: prima di fare il render completo di `clinica`, faremo approvare 1 fotogramma fermo (regola di `SKILL.md`).
- **Testa bianca senza faccia (`davide_vuoto`)**: per mostrare davvero la testa liscia senza occhi né bocca in `omino_rick.js`, al momento della prova personaggi faremo un confronto prima/dopo su 1 fotogramma (per aggiungere l'espressione opt-in `vuota` senza cambiare nessun altro personaggio).
