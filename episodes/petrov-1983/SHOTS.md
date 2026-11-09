# Regia (bozza, battuta per battuta)

Luoghi: **bunker Serpukhov-15** (room 10×8×3,5 m, `interno_notte`, luce fredda dei monitor + lampade rosse d'allarme), **cielo sopra le nuvole** (outdoor, `tramonto`/alba: sole basso, nuvole alte, satellite).
Cast: `petrov` (costume nuovo: uniforme verde-grigia, spalline, capelli scuri), `ufficiale` (operatore al banco, di spalle).

| # | Battuta | Cosa si vede / azione sulla parola | Camera (modello) |
|---|---|---|---|
| 1 | Mezzanotte. Lo schermo dice: cinque missili… | Orologio a muro 00:15 su «Mezzanotte»; su «cinque» compaiono 5 punti rossi sulla mappa | `dettaglio_oggetto` orologio → `rivela_dal_viso` Petrov che fissa la parete |
| 2 | Unione Sovietica, 26 settembre 1983… Petrov | Cartello data; campo largo del bunker con banchi, monitor, mappa del mondo | `ambiente` |
| 3 | Il suo compito… pochi minuti per rispondere | Telefono rosso sul banco (`pop` su «avvisa»), lancette che corrono | `dettaglio_oggetto` telefono → `mezza_figura` |
| 4 | …scritta rossa: LANCIO. La sirena… | Board «LANCIO» `on` sulla parola; lampade rosse `on` + `shake` su «sirena» | `dal_basso_rivela` sulla scritta |
| 5 | Il computer dice che è sicuro. | Monitor con "AFFIDABILITÀ: ALTA" | `dettaglio_oggetto` |
| 6 | Chi attacca… Ne manda centinaia. | Faccia `determined`; sulla mappa i 5 punti, poi (immaginazione) cento punti che si accendono e spariscono | `ecu` → `ambiente` sulla mappa |
| 7 | E i radar a terra… niente. | Schermo radar verde vuoto, linea che gira (`spin`) | `dall_alto_oggetto` |
| 8 | Petrov prende il telefono… falso allarme. | `prop: phone`, posa `phone`; bocca solo su «è un falso allarme» (speaker) | `primo_piano` |
| 9 | Anni dopo… cinquanta per cento. | Petrov anziano (stesso costume, capelli grigi) in poltrona, luce calda | `mezza_figura` |
| 10 | Poi aspetta. Se si sbaglia… | Torniamo al bunker: Petrov immobile, sirena che continua, orologio che avanza | `zoom_comico` lento → `ecu` (sudore) |
| 11 | Passano minuti… Nessun missile. | Lampade rosse `hide` una a una; silenzio | `due_figure_tavolo` Petrov + operatore |
| 12 | Il satellite aveva scambiato il sole… | Cielo sopra le nuvole: sole basso che brilla sulle nuvole, satellite che "vede" i 5 bagliori | `tilt_cielo` → `dettaglio_oggetto` satellite |
| 13 | Non fu premiato. Fu rimproverato… | Registro sul banco, timbro che cade (`pop`) | `dall_alto_oggetto` |
| 14 | Quella notte… disse: no. | Stessa scritta LANCIO che si spegne (callback); viso di Petrov | `primo_piano_finale` |

Oggetti da cercare/creare: orologio a muro, telefono rosso a disco, monitor CRT, banchi di controllo, mappa del mondo (board), lampade rosse (lamps), schermo radar (oggetto da costruire), satellite (da costruire), registro + timbro, poltrona.
Non mostrare: «superiori» (motivo: restano fuori campo, il peso è su Petrov).
