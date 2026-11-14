# Dalla skill «ricksclips-short-style» (portata dentro l'11/11)

L'utente ha fornito la skill `ricksclips-short-style` (personaggi a ritagli 2D in un mondo 3D, asset generati con Higgsfield). Ne abbiamo preso **le misure e i controlli**, non il motore (i nostri personaggi 3D fanno già di più) né la generazione con Higgsfield (costa crediti).

- `style-rules.md`, `rules.json`: regole misurate fotogramma per fotogramma su 20 Short di @ricksclips3000 (34.359 fotogrammi). Inquadrature di 1,2 s (mediana), 30 passaggi al minuto, stacchi netti < 1%, camera sempre in movimento (spinta +2,6 %/s, 44 px/s), testa al 20% della larghezza nei primi piani, contorni 10 px `#271925`, ombre colorate mai grigie, luce media 120/255, sottotitoli 1-2 parole a 1350 px.
- `kit/tools/shortkit.py` (copiato tale e quale): `check video.mp4` (velocità e zoom della camera col flusso ottico), `measure cartella out/` (misura uno o più video: camera, colore, linee, tagli; scrive `measured.json` e fogli ogni 2 s), `compare nostro.jpg riferimento.png` (numeri affiancati e cosa cambiare), `words voce.mp3 testo.txt` (tempi delle parole). Richiede `pip install numpy pillow scipy opencv-python-headless`.

## Misure dell'11/11 (stesso strumento)
| | riferimento `paxinko_the_window.mp4` | nostro `pachinko.mp4` | 20 Short di Rick |
|---|---|---|---|
| velocità camera (mediana) | 29,6 px/s | **11,8 px/s** | 44 px/s |
| zoom (mediana) | +7,6 %/s | +3,2 %/s | +2,6 %/s |
| fotogrammi fermi | 31,8% | **57,5%** | ≤ 9% inquadrature bloccate |
| luce media | 73 | **109** | 120 (giorno) |
| saturazione | 0,53 | 0,43 | 0,37 |
| ombre | 54, rosso-bruno 44% / blu 46% / viola 9% | 54, 39 / 44 / 17% | tinte, valore ~76 |
| linee | #4a2a26 | #3c2630 | #271925 |
**Cosa dice**: la nostra camera si muove meno della metà del riferimento e resta ferma più di metà del tempo → più movimento in ogni inquadratura (tappe più lontane tra loro, spinte più decise, arrivo veloce e poi assestamento). L'immagine è più chiara e meno satura del riferimento (che è notturno): per il Pachinko abbassare l'esposizione e alzare la saturazione.

## Dopo le correzioni (11/11 sera, stesso strumento)
| | riferimento | Pachinko prima | Pachinko dopo |
|---|---|---|---|
| velocità camera | 29,6 px/s | 11,8 | **34,6** |
| fotogrammi fermi | 31,8% | 57,5% | **18,3%** |
| zoom | +7,6 %/s | +3,2 | +3,5 |
| luce media | 73 | 109 | **80** |
| saturazione | 0,53 | 0,43 | **0,52** |
| linee | #4a2a26 | #3c2630 | #452628 |
| testa del soggetto (anteprima) | ~20% | 44% | **23%** |
Come: camera viva automatica (`storia_disegnato.js`), `esp` 0,8 e `cb` 1,35 nei luoghi, camere dei primi piani allontanate (e nella sala lungo il corridoio, se no finiscono dentro le macchine).

## Con che motore è fatto il riferimento (analisi dell'11/11)
Il file non lo dice: è stato ricodificato da YouTube («ISO Media file produced by Google», x264, Lavf), i dati del programma originale sono persi. Dai fotogrammi a piena risoluzione:
- personaggi **disegnati in 2D** (tratto a mano leggermente irregolare, lucido dipinto sul corpo, sfocatura di movimento sulle braccia) messi come sagome nel mondo 3D;
- mondo **3D vero** (prospettiva, ombre morbide, riflessi sul pavimento bagnato) con **linee d'inchiostro sottili su tutti gli spigoli e le pieghe**, anche dentro le superfici, tipiche di un contorno calcolato (Freestyle/Line Art di Blender) più che di un contorno a guscio;
- **profondità di campo con bokeh rotondo**, bagliore ampio, **sfocatura di movimento** vera, nebbia luminosa.
Ipotesi più probabile: **Blender (EEVEE) con Freestyle o Line Art + personaggi 2D su piani** (o Grease Pencil), montato con sottotitoli a parte (CapCut/Premiere). Non è verificabile dal file. La skill «ricksclips» dell'utente ottiene lo stesso stile con three.js, quindi il motore conta meno delle misure: profondità di campo e sfocatura di movimento sono le due cose che il nostro motore ancora non ha.
