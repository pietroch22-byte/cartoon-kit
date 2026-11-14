# Scheda ambiente: `ufficio_mosca` (derivata da `ufficio_sovietico_anni60.md`)

Adattamento per `matita_spazio` rispetto alla scheda generale [ufficio_sovietico_anni60.md](file:///Users/pietromascia/STORIE%20CARTOON/cartoon-storie/library/luoghi/ufficio_sovietico_anni60.md):
- **Regola `struttura` vs oggetti indipendenti (testata con `vita.txt` + `ricchezza.txt`)**: restano marcate `userData.struttura = 1` le superfici e i 6 grandi arredi fissi a parete/pavimento (`scrivania`, `mappa_urss`, `libreria_sx`, `libreria_dx`, `credenza_dx`, `porta_doppia`), oltre a pavimento, pareti, soffitto, cornice finestra e tappeto — altrimenti `vita.js` li conta come enormi masse ferme al `50%–194%` dello schermo e fa crollare `mondo vivo` al `22–25%`. Tutti i **mobili medi e piccoli oggetti indipendenti** (oltre 25 oggetti nominati) restano invece senza `struttura`, azzerando `MONDO_POVERO` e mantenendo `mondo vivo` al `65%–76%` su tutte le inquadrature larghe/medie.
- **Arricchimento lato sinistro e parete destra (`vuoto` in `v5`)**:
  - `poltrona_ospiti` a `(-2.55, 0, 0.28)`, `appendiabiti_cappotto` a `(-2.98, 0, -1.36)`, `cassaforte_kgb` a `(-3.06, 0, -1.98)`, `tavolino_vertushka` + `interfono_vertushka` con LED a `(-1.82, 0, -1.52)` e `bacheca_progetti` (`ОБЪЕКТ Е-6`) a `(-3.40, 1.72, -1.92)`.
  - `cestino_ufficio` con carte stropicciate a `(-1.34, 0, -1.16)` rientrato vicino al fianco della scrivania.
  - `portaprogetti` verticale con rotoli tecnici a `(1.50, 0, -2.34)` sotto il gagliardetto destro (`grandi >= 2` anche alla prima vista `10.24 s`).
- **Arricchimento parete di fondo e dettaglio scrivania**:
  - `pendolo_angolo` animato a `(-1.54, 0, -2.72)`, `modello_sputnik` `(-2.72, 2.30, -2.62)` e `mappamondo_libreria` `(-2.14, 2.30, -2.64)` sopra `libreria_sx`, `razzo_vostok` `(2.45, 1.26, -2.62)` in `libreria_dx`.
  - `quadro_capo` `(0, 2.77, -2.90)`, `gagliardetto_urss` `(+1.54, 1.84, -2.89)` e due `applique` calde (`±1.54, 2.34, -2.87`).
  - Sulla scrivania attorno a `OBJ.scatola_sovietica`: `portamatite`, `sveglia_tavolo`, `pila_dossier` `(0.52, 0.766, -0.64)`, `dossier_segreto`, `occhiali_scrivania`, `calamaio`, `tamponatore`, `timbro_gomma` e `posacenere`.
