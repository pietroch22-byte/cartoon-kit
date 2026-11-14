# Strada urbana di notte con saracinesche, bar e vetrina elettronica

- **Dove, quando, che ora**: Vicolo / via commerciale cittadina di notte (~23:30–00:30), asfalto bagnato, pioggia appena smessa.
- **Fonti osservate**:
  1. `https://commons.wikimedia.org/wiki/File:Chatime_Keelung_Baifu_Store_closed_20251126_T1739.jpg`
  2. `https://commons.wikimedia.org/wiki/File:%22Crossing_of_death%22_at_night_2_-_panoramio.jpg`
  3. `https://commons.wikimedia.org/wiki/File:Luxor_Television_Street_R01.jpg`

## Pianta in sei righe
- **Fondo**: Via lunga fino all'orizzonte tra palazzi multi-piano con finestre accese qua e là, lampioni ambrati, strisce pedonali riflettenti sull'asfalto bagnato e lampeggianti della polizia dietro l'angolo.
- **Sinistra**: Facciata continua con tre vetrine chiave lungo la corsia: (1) ingresso del `BAR` illuminato con porta a vetri, tavolino e insegna al neon; (2) ingresso clinica `CLINICA 24H` con `saracinesca.glb` metallica chiusa, lucchetto e foglietto attaccato; (3) negozio `TV & ELETTRONICA` con vetrina piena di schermi accesi (`TG 24 - RAPINA`) e specchio/vetro riflettente.
- **Destra**: Palazzi notturni con insegne sporgenti sovrapposte, condizionatori a muro, cavi pensili, cestini, idrante/colonnina, scooter parcheggiato e furgone che passa lontano.
- **Cielo / alto**: Cielo notturno blu-indaco profondo, cavi elettrici tesi tra le facciate, lampioni gialli che proiettano scie sull'asfalto umido.
- **Pavimento**: Asfalto scuro lucido/sfumato da pozzanghere con strisce pedonali bianche e marciapiedi rialzati con cordoli ai due lati.
- **Primo piano (vicino alla camera)**: Bordi di insegne verticali, paletti pedonali, cassette e cassonetto vicino al marciapiede per dare parallasse nei carrelli.

## Inventario a strati
- **Strutture (6)**: `strada_asfalto`, `marciapiede_sx`, `marciapiede_dx`, `facciate_sx`, `facciate_dx`, `strisce_pedonali`.
- **Grandi ≥ 1,2 m (6)**: `bar_vetrina` (con `porta_battente.glb` o porta a vetri automatica), `saracinesca_clinica` (`saracinesca.glb` di `library/vivi/`), `vetrina_tv` (grande teca illuminata con vetro e schermi TG), `furgone_lontano` (che passa a distanza), `lampione_strada` (3+ pali), `scooter_parcheggiato` (o bici davanti al palazzo).
- **Medi 0,35–1,2 m (10)**: `insegna_bar`, `insegna_clinica`, `insegna_elettronica`, `tv_principale` + 4 `tv_vetrina`, `tavolino_bar`, `sgabello_esterno` (×2), `condizionatore` (×3 `condizionatore.glb`), `cassonetto_raccolta`, `gatto_vicolo` (`Cat.glb` di `library/animati/`), `panche_cassetta`.
- **Piccoli < 0,35 m (12)**: `girofaro_blu` e `girofaro_rosso` all'angolo, `lucchetto_saracinesca`, `avviso_chiuso` (foglio attaccato a metà serranda), `adesivi_pilastro`, `bottoni_tombino` + `vapore_tombino`, `bottiglie_tavolino` + `posacenere_bar`, `paletti_marciapiede`, `centralina_contatori`, `tubi_scarico`, `telecamera_muro`.
- **Scritte (6, testo esatto)**:
  1. Insegna neon calda: `BAR NOTTE`
  2. Insegna sopra serranda: `CLINICA 24H`
  3. Foglietto sulla saracinesca: `CHIUSO`
  4. Insegna negozio: `TV ELETTRONICA`
  5. Schermi TG in vetrina: `ULTIM'ORA - RAPINA` / `RICERCATO`
  6. Cartello stradale: `SENSO UNICO`
- **Luci e cose vive (7)**: `insegna_bar` (respiro morbido), `tv_principale` + schermi secondari (`lampeggia`/`scorri` ticker TG), `girofaro_blu` + `girofaro_rosso` (attivati all'angolo nella scena 5-6!), `condizionatore` (vibra), `gatto_vicolo` (`Cat.glb` animato), `furgone` (`passa` lento sullo sfondo), `vapore` dal tombino.
- **Usura**: Foglietti staccati e adesivi sui pilastri tra le saracinesche, tubi pluviali e cavi aerei asimmetrici, asfalto leggermente scrostato attorno alle strisce pedonali.

## La firma del luogo (3 dettagli immediati)
1. **Saracinesca metallica chiusa** con fessure di aerazione in alto e foglio attaccato a metà altezza.
2. **Asfalto scuro umido con strisce pedonali** che riflettono in verticale le luci arancioni e i neon della via.
3. **Vetrina luminosa piena di televisori accesi** che taglia il buio del marciapiede con schermi di telegiornale.

## Tre colori dominanti
- `#1e2752` (blu notte freddo di fondo e ombre urbane)
- `#d96b38` (ambra/arancio caldo dei lampioni e dell'insegna bar)
- `#38c4e8` (ciano/blu elettrico degli schermi TV e lampeggianti)

## Cosa non c'è
- Niente marchi reali o scritte illegibili/deformate (`Uber Eats`, `Chatime`, ecc.). Niente folla immobile o luci oltre soglia sfarfallio.

