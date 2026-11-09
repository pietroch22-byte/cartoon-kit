# Look realistico (provato su «Ho già mangiato», 9/11/2026)

Personaggi cartoon (sagome disegnate) in un mondo con materiali veri. Funziona se TUTTI questi ingredienti ci sono insieme; tolto uno, la scena diventa spenta o finta.

## Ingredienti obbligatori
1. **Tone mapping ACES** con esposizione per luogo (non una sola per tutto il video).
2. **Cielo HDR come luce d'ambiente** (`scene.environment`) e, all'aperto, anche come sfondo visibile.
3. **Sole/luna direzionale** con ombre morbide (PCF soft), più le luci pratiche della scena (lampade, lampioni, fuochi).
4. **Occlusione ambientale** (GTAO) per le ombre di contatto.
5. **Bloom** solo sulle parti molto luminose (soglia ~0.92): fiamme, lampadine, finestre accese.
6. **Materiali PBR completi**: colore + normal + ARM (AO/ruvidità) con scala realistica; colore leggermente "spinto" (l'ACES desatura): es. intonaco giallo tinta `#ffc95a`, cotto `#ffd2bc`.
7. **Modelli realistici CC0** (Poly Haven, 1k) che riempiono ogni luogo.

## La luce la decide il copione
Prima della scena leggi ora e luogo nel testo («alle nove», «di notte», «al tramonto», «a pranzo»). Ogni inquadratura ha un preset di luce coerente:

| Preset | Quando | Cielo HDR (Poly Haven) | Esposizione |
|---|---|---|---|
| interno caldo | casa, cucina, giorno o sera con lampade | `kiara_interior` | 1.55-1.6 |
| interno notte | casa di notte | `kiara_interior` + lampade | ~1.05 |
| tramonto | «al tramonto», ora d'oro | `belfast_sunset_puresky`, sole basso morbido (intensità ~1) | ~0.7 |
| notte esterna | «alle nove», «di sera», «di notte» | `moonlit_golf` (stelle e luna), lampioni e lucine con bloom | ~1.0 |
| giorno esterno | «a mezzogiorno», «di mattina» | `kloofendal_48d_partly_cloudy_puresky`, sole alto | ~1.05 |

Errore già fatto: una piazza «alle nove» resa di giorno, e un HDR di crepuscolo (`qwantani_moonrise`) scambiato per notte. Controlla l'anteprima: di notte il cielo deve essere scuro e la luce deve venire dalle lampade.
Problema aperto: il tramonto con sole forte sulle facciate chiare sbianca la scena; abbassare sole ed esposizione insieme.

## Materiali tarati (Poly Haven, CC0)
Pavimenti: `terracotta_floor_tiles` (2k, ripetizione 4), `wood_floor`, `cobblestone_floor_01` (2k, ripetizione 14). Muri: `yellow_plaster`, `red_brick_plaster_patch_02`, `square_tiled_wall` (piastrelle cucina). Esterni: `grass_ground`. Tetti: `clay_roof_tiles_02`.

## Modelli usati per arricchire (Poly Haven, CC0)
Cucina: wine_bottles_01, CheeseBox_01, antique_ceramic_vase_01, brass_pot_01, brass_pan_01, pot_enamel_01, ceramic_pot, wicker_basket_01/02, food_apple_01, lemon, yellow_onion, potted_plant_01.
Casa/ingresso: vintage_grandfather_clock_01, ArmChair_01, mantel_clock_01, brass_candleholders, Shelf_01, ornate_mirror_01, hanging_picture_frame_02, potted_plant_02, Sofa_01, side_table_01, fancy_picture_frame_01.
Piazza/strada: street_lamp_01/02, wine_barrel_01, wooden_crate_01, wooden_bucket_01, planter_pot_clay, planter_box_01, flower_gazania, jacaranda_tree, CoffeeCart_01, painted_wooden_bench, potted_plant_04, Lantern_01, watering_can_metal_01.
