# STATO — cartoon-storie (aggiornato 16/11/2026)

Una pagina sola. Si **riscrive**, non si allunga: quando cambia qualcosa si aggiorna la riga e il racconto lungo va in `HANDOFF.md` (diario). Se questa pagina e un'altra si contraddicono su un'approvazione, vale questa.

## Approvato dall'utente (è il default)
| Cosa | Quando |
|---|---|
| Look disegnato, luce `notte`, strada a specchio sfumato | 11/11 |
| Personaggi Rick: metodo di base, pupazzo 2D, recitazione (Livello 2/3), locomozione, vista di spalle, contatti con gli oggetti | 12-14/11 |
| Cast 40 archetipi, protagonista `impiegato` `PN8`, arti orientati verso la testa | 14/11 |
| `luce_rick`, luci e neon del mondo sui personaggi, RimettiPass | 12/11 e 14/11 |
| Antialiasing `ss: 2`, camera a tratto fisso, mani con dita | 12/11 notte |
| Sfocatura «Camera vera» (`"sfocatura": "intelligente"`) | 13/11 |
| Regia v7: si cambia inquadratura solo su un'idea nuova, sulla sua parola; niente spoiler; dissolvenze 0,27 s; `fermo: 0` | 12/11 notte |
| Curva di camera continua `"curva": "monotona"` | 15/11, richiesta di nuovo il 16/11 |
| `readcheck` e karaoke leggibile; regia audio e 13 mood; effetti di `vivo.js` (pioggia, neve, fumo, fuoco…) | 15/11 |
| Solo il nostro karaoke come sottotitoli | scelta dell'utente |

## In prova (si usa solo con un prima/dopo o su richiesta)
| Cosa | Cosa manca |
|---|---|
| **Camera con voli dentro `monotona`** (prove `matita_spazio_v10_cam`, `v11_cam`) | soggetti decentrati o tagliati, troppi tagli nello stesso luogo; fare la v12 e avere l'ok. Profilo **non bloccato** |
| Mosse di camera (`"mossa"`) e `"volo"` | in uso dal 13/11, approvazione esplicita non registrata |
| Zoom veloce (`zoom_soggetto`, `snap_zoom`, `"zoom_veloce"`) | **non approvato** il 12/11: non usarlo. `regia.md` lo descrive come normale: vale questa riga |
| Luce `giorno` e `interno` | un fotogramma da far approvare |
| `mondo_rick` (B1) | ok dell'utente, pezzo per pezzo |
| PBR, `M.erba`, `M.quinta`, cieli HDRI, `luce_cinema` | provati solo in `kit/stories/test_pbr/` |
| Scarpe sagomate | decidere su un video completo |
| Testone, movimento della testa, 8 facce nuove | un video completo a 30 fps con `tremolio.py` |
| Animazioni UAL/KayKit (`animazioni.js`) | mai provate |
| Look «splat» v1 (`"look": "splat"`, `look_splat.js`) | scritte illeggibili, oggetti piccoli impastati, tremolio non misurato, mai provato in interni o di giorno. Non è il default |

## Respinto o vietato
- Camera `matita_spazio_v9` (voli **senza** `monotona`): respinta il 16/11. `references/movimenti-camera.md` §8 descrive quel profilo: non seguirlo.
- Realistico, luce cotta in Blender, oggetti «Roblox», effetto dipinto, mani o oggetti 3D staccati dal corpo, `mondo_rick` v1 («troppo stravolto»).
- Modificare la voce dell'utente; servizi a crediti; aprire i fotogrammi di Rick senza richiesta esplicita.

## Lavori aperti (in ordine)
1. **Camera**: nelle storie usare `"su"` + `"testa"` al posto di `pos`/`guarda` a centro stanza; unire in riprese uniche le scene di fila nello stesso luogo (`capsula`, `laboratorio` in `matita_spazio`); prova v12 solo camera → ok dell'utente → riscrivere `movimenti-camera.md` §8 → render definitivo.
2. **Avvisi REGIA troppo severi**: `regia()` in `kit/tools/rendi_disegnato.mjs` vuole al massimo 8/15 s nello stesso luogo e uno stacco ogni 12 s, contro la regola «un soggetto = una ripresa» (Rick tiene riprese uniche di 20+ s). Finché non è allentata: se la ripresa unica è voluta non si taglia per zittire l'avviso, lo si dice all'utente.
3. **Cancello e collocazione: implementati e provati il 16/11** (`references/controlli.md` §0). Mondo povero, poco vivo, `COMPENETRATI`, `FUORI_POSTO` e controllo fallito bloccano senza deroga; `MONDO_OK` rimossa. Messaggio con percorso GLB gratuiti → dettagli/movimento → componenti in `library/`. Test in `kit/tests/`. Telai montati nei vani riconosciuti anche tra GLB separati; zone diagonali controllate nei propri assi. Restano limiti dichiarati: altri tipi di incastro, passaggi non marcati, coerenza di luogo/epoca. **Le storie esistenti sono solo prove in lettura o in copia: non modificarne i mondi durante il lavoro sul motore.**
4. Video completo a 30 fps dopo testone e facce nuove; decisione sulle scarpe.
5. Estendere PBR, erba, quinte, HDRI alle storie vere; correzione colore finale sui frame di Rick; spessore dei contorni con la distanza.
6. Meccanismi `library/vivi/` mancanti: finestra, tenda, ascensore, semaforo, schermo con numeri, bandiera, frigo.
7. `kit/topics/pubblicati.md`: mancano data e numeri completi dei video usciti (chiederli).
8. Pulizia: `DA_ELIMINARE/` (16 GB) aspetta l'ok dell'utente; modifiche di altre sessioni da tenere separate dai commit del motore e delle guide; varianti di prova `v8`-`v11` dentro `kit/stories/matita_spazio/`.
9. Proposte tecniche in attesa: avviso «chiave sconosciuta» nel JSON; prova di non-regressione automatica su una scena fissa; bozza a risoluzione ridotta; `--workers` nel render (accantonato dall'utente il 15/11); `words.json` allineato sul copione invece che da trascrizione libera.

## In parallelo: non toccare senza richiesta
- `kit/stories/ricerca_gettone/` (lavoro attivo, anche con altri agenti).
- `HANDOFF.md` e `engine3d/web/storia_disegnato.js` vengono modificati anche da altre sessioni: rileggi il file prima di scriverci.

## Domande aperte per l'utente
1. Zoom veloce: lo approvi (con un prima/dopo) o lo togliamo da `regia.md`?
2. «Niente marchi» nelle regole, ma `ricerca_gettone` è a tema Fortnite: la regola vale solo per le storie originali?
3. Confronto col riferimento a fine render: tolto dal flusso normale perché dal 13/11 i riferimenti si aprono solo su richiesta. Va bene così?

## Video fatti (`~/STORIE CARTOON/video/`)
`pachinko`, `treno_venti_secondi`, `matita_spazio` (v5 salvata dall'utente; v8, v9 respinta), `affitto_faccia`, `ho_gia_mangiato` («Mai dire a una nonna italiana»), `ricerca_del_gettone` (bozza), `parigi_finta` (16/11).

## Riordino dei documenti (16/11)
`SKILL.md` è passata da 39 KB a una pagina di flusso + indice. I dettagli sono stati spostati pari pari in `references/personaggi-rick.md`, `camera-motore.md`, `controlli.md`, `bozze-veloci.md`, `mappa-codice.md` e in coda a `regia-suono.md`, `mondo-vivo.md`, `buon-senso.md`. Copia di tutto com'era prima: `~/STORIE CARTOON/archivio/skill_prima_riordino_2026-11-16/`.
