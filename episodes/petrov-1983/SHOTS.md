# Regia per scene (bozza: la tabella parola per parola si fa sui tempi reali della voce)

Ritmo: un cambio visivo ogni 2-4 s → circa 90-110 inquadrature in 5 min. Nelle battute di attesa (scena 3, «Passa un minuto…») inquadrature più lunghe e quasi ferme: è lì che sale l'ansia.

## Luoghi (9)
| # | Luogo | Tipo / luce | Inventario principale |
|---|---|---|---|
| L1 | **Bunker Serpukhov-15, notte** (luogo principale) | room 12×9×3,5, `interno_notte`, luce fredda dei monitor + lampade rosse | parete-schermo con mappa del mondo, scritta LANCIO (board), banchi di controllo, monitor CRT, telefono, microfono, orologio a muro, sedie da ufficio anni '70, schedari, registro di servizio, tazza di tè, posacenere |
| L2 | Bunker, giorno (scena 2) | stesso set, `interno`, luci normali | stessi oggetti, alarm spenti |
| L3 | Cielo notturno sul mare del Giappone | outdoor `notte`, nuvole, mare | aereo di linea (luci), caccia (sagoma lontana), luna |
| L4 | Ufficio al Cremlino | room `interno_notte`, lampada da tavolo | scrivania, telefoni, cartelle «RYAN», bandiera |
| L5 | Washington di notte | outdoor `notte`, facades con finestre accese | palazzi governativi, lampioni, auto anni '80, spia con cappotto |
| L6 | Spazio sopra la Terra | outdoor, sole basso | satellite Oko (da costruire), terra con nuvole |
| L7 | Pianure USA all'alba | outdoor `tramonto` | nuvole alte illuminate, campi, recinto della base missilistica |
| L8 | Ufficio dell'indagine | room `interno`, luce grigia | tavolo, due ufficiali, registro, timbro |
| L9 | Appartamento di Petrov / sala delle Nazioni Unite | room `interno` caldo / sala grande | poltrona, lettere, foto; leggio, applausi |

## Cast
`petrov` (uniforme verde-grigia, poi giacca civile e capelli grigi), `operatore1-3` (squadra del bunker), `ufficiale_comando` (voce al telefono, fuori campo), `generale` (scena 5), `spia` (scena 1), folla ONU.

## Scene
| Scena | Tempo stimato | Cosa si vede (azioni sulle parole) | Camere guida |
|---|---|---|---|
| 0 Apertura | 0:00-0:25 | orologio su «Mezzanotte»; lampade rosse `on`+`shake` su «sirena»; LANCIO `on`; viso di Petrov nel rosso | `ecu` → `dal_basso_rivela` sulla scritta → `rivela_dal_viso` |
| 1 Tre settimane prima | 0:25-1:25 | aereo che attraversa le nuvole, luci che si spengono (niente violenza mostrata); cartello «1 settembre 1983»; Cremlino con cartella RYAN `pop`; Washington: finestre che si accendono una a una su «finestre accese»; sacche di sangue su «scorte di sangue» | `tilt_cielo`, `dettaglio_oggetto`, `campo_lungo_alto`, `carrello_fila` lungo le facciate |
| 2 L'uomo e la macchina | 1:25-2:05 | Petrov che entra (`enter`), cartello «Vladivostok»; satellite che ruota (`spin`) sopra la Terra; Petrov tocca un monitor con aria scettica | `accompagna`, `gru_rivela`, `mezza_figura` |
| 3 I minuti | 2:05-3:35 | sirena, «1» sulla mappa; uomini che si girano (`change` face `worried`); telefono + microfono (`prop: phone`); punti 2-3-4-5 `pop` uno per parola; centinaia di punti immaginati che si accendono e spariscono; radar vuoto con linea che gira; telefonata (speaker solo su «è un guasto del sistema»); attesa: orologio, schermo, orologio; lampade che si spengono una a una su «Niente esplode» | `primo_piano`, `ecu`, `passaggio` Petrov→mappa, `due_figure_tavolo`, `vertigine` sull'attesa, `zoom_comico` lentissimo |
| 4 Rivelazione | 3:35-4:10 | il sole sorge dietro nuvole alte, riflessi che brillano come 5 fiammelle; satellite che li «vede»; i 5 punti sulla mappa coincidono coi riflessi; nuovo satellite che si aggiunge | `tilt_cielo`, `dall_alto_oggetto`, `arco` |
| 5 Dopo | 4:10-4:50 | registro vuoto + timbro `pop` su «rimproverarono»; cassetto che si chiude (`close`) su «cassetto»; libro di memorie su «1998»; lettere che arrivano in volo (`show`+`from`); sala ONU che applaude; Petrov anziano in poltrona su «non sono un eroe» | `dall_alto_oggetto`, `dettaglio_oggetto`, `ambiente`, `primo_piano` |
| Finale | 4:50-5:00 | ritorno al bunker: scritta LANCIO che si spegne su «no»; buio | `primo_piano_finale` (stessa geometria dell'apertura) |

Oggetti da costruire se mancano nel kit: satellite Oko, schermo radar, parete-mappa con punti luminosi, aereo di linea, caccia, sacche di sangue, cartella RYAN.
Non mostrare: le vittime del volo (motivo: niente violenza; si mostrano solo le luci che spariscono), le testate nucleari (motivo: astratte, bastano i punti sulla mappa).
