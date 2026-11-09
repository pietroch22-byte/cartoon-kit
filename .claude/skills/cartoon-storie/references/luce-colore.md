# Luce, colore, contrasto e aloni (lezioni dal video «Ho già mangiato», 9/11/2026)

Prima di consegnare un video realistico misura sempre: `python kit/tools/misura_luce.py <frame> [<riferimento>]`. L'occhio sulle miniature inganna: aloni e zone bruciate si vedono solo a piena risoluzione o con i numeri.

## Valori obiettivo (stile cartoon con mondo realistico)
- Mediana luminanza: interni 0.45-0.70, primi piani ≤ 0.72, notte esterna 0.15-0.45.
- Saturazione media: 0.50-0.67 (sotto 0.40 il video sembra slavato).
- Pixel bruciati: < 5 % (eccezione: fiamme e lampadine molto vicine).
- p5 > 0.03: niente neri completamente chiusi.

## Cosa NON funziona (già successo)
1. **Esposizione unica per tutto il video**: interni scuri e primi piani bianchi insieme. → Esposizione per preset di luce.
2. **Tone mapping ACES senza correzione colore**: saturazione crolla da ~0.6 a ~0.3. → Passaggio finale di saturazione (1.2-1.32) e contrasto (1.0-1.1).
3. **Bloom con soglia bassa**: anche muri e facciate al sole "sbavano", velo e alone su tutta la scena (tetti al tramonto, cucina). → Soglia di bloom sopra qualsiasi superficie illuminata (≈1.15 in HDR) e sorgenti di luce che la superano: il bagliore parte solo da fiamme, lampadine, finestre accese.
4. **Occlusione ambientale in screen-space (GTAO/SSAO/SAO): VIETATA.** Anche col raggio piccolo lascia una piega scura sugli oggetti lontani dietro un bordo vicino (stipite della porta sopra Marco) e bande ai bordi dell'inquadratura. → Ombre di contatto solo da: ombre vere del sole/lampade (PCF soft), mappe AO delle texture (ARM), ombra-disco sotto i personaggi, e **rendering a passaggi** (`"qualita": {"passaggi": N}`, `migliora-frame.md` §4): una luce di cielo con ombre da direzioni diverse dà occlusione e contatti veri, senza aloni (test in cucina: luminosità invariata, mediana 0,73 → 0,72).
5. **Fiamme con materiale illuminato + emissione**: luce della scena + emissione saturano tutti i canali → fiamme bianche piatte. → Fiamme e lampadine con materiale non illuminato (solo colore emesso).
6. **"Compressione gamut" verso il grigio**: i colori molto saturi diventano pastello (fiamme arancio chiaro). → Quando un colore supera il bianco, scalarlo intero (stessa tinta e saturazione), non desaturarlo.
7. **Sagome dei personaggi non illuminate**: reagiscono solo all'esposizione, quindi alzare la luce della stanza sbianca i primi piani. → Luminosità delle sagome regolata a parte per preset (0.8-1.0).
8. **Superfici chiare grandi vicino alla camera** (carta da parati crema): primi piani sovraesposti. → Tingere più scuro il materiale (es. `#d2c09c`).
9. **Cielo sbagliato per l'ora**: HDR di crepuscolo usato come notte; piazza «alle nove» resa di giorno. → Leggere l'ora nel copione; controllare che di notte il cielo sia scuro.
10. **Tramonto con sole forte su facciate chiare**: scena bianca. → Sole ~0.8, esposizione ~0.34, nebbia lontana (inizio 60 m).

## Preset tarati (motore di riferimento, ACES)
| Preset | Esposizione | Saturazione | Contrasto | Tinta finale | Sagome |
|---|---|---|---|---|---|
| interno caldo (ingresso) | 1.10 | 1.30 | 1.06 | 1.03, 1.00, 0.95 | 0.80 |
| interno caldo (cucina) | 1.15 | 1.28 | 1.06 | 1.03, 1.00, 0.95 | 0.86 |
| interno notte | 0.85 | 1.22 | 1.03 | 0.97, 0.98, 1.05 | 0.92 |
| tramonto esterno | 0.34 | 1.22 | 1.04 | 1.04, 0.99, 0.94 | 1.00 |
| notte esterna | 0.95 | 1.20 | 0.98 | 0.95, 0.98, 1.06 | 1.00 |
Bloom: forza 0.45, raggio 0.35, soglia 1.15. Nessuna occlusione ambientale in screen-space. Luci-oggetto (lampadine, finestre): colore emesso × 3.2; fiamme: colore dipinto × 2.1.

## Aloni: come evitarli sempre
Un alone è una zona chiara o scura, sfumata, che non appartiene a nessun oggetto: velo sopra una facciata, bagliore attorno a superfici non luminose, piega o banda scura su un personaggio, bordo luminoso attorno alle sagome.
- Cause note: bloom con soglia bassa (velo), occlusione ambientale screen-space (pieghe e bande), sagome con bordi semitrasparenti senza alphaTest (bordo chiaro), nebbia vicina troppo forte (velo uniforme), fiamme/lampade illuminate dalla scena (bianco piatto).
- Controllo obbligatorio prima di consegnare: per ogni inquadratura ritaglia a piena risoluzione (1) i bordi dell'inquadratura, (2) i contorni dei personaggi davanti a oggetti vicini (porte, stipiti, tavoli), (3) le luci. Se serve, aumenta il contrasto del ritaglio (×2) per vedere le bande.
- Se trovi un alone: spegni un effetto alla volta (bloom, AO, nebbia) sullo stesso frame e confronta: l'effetto che lo fa sparire è la causa.

## Tarare un preset su un riferimento
Se l'utente porta un video o un fotogramma da raggiungere, i valori della tabella si ricavano **misurando** quel riferimento: `references/migliora-frame.md` (§1-2, `kit/tools/taratura.py`). Aggiungi qui una riga per ogni preset tarato, con il riferimento usato.

## Procedura
1. Render di 15-20 frame campione (uno per inquadratura) → `misura_luce.py`.
2. Correggi prima l'esposizione per preset, poi saturazione/contrasto, poi bloom e AO; una cosa alla volta.
3. Ritaglia a piena risoluzione i bordi dell'inquadratura, i contorni dei personaggi e le luci: cerca aloni e bande. Per trovare la causa, spegni un effetto alla volta (bloom, AO) e confronta.
4. Rimisura e consegna solo se i valori stanno negli obiettivi.
