# Confronto con mromidev/claude-animated-shorts (11/11/2026)

Fonte: https://github.com/mromidev/claude-animated-shorts (codice e documenti MIT, copia letta in
`STORIE CARTOON/asset-kit/riferimenti/claude-animated-shorts/`, report testuali e documenti in `references/reports/` — le vecchie immagini/sheet sono archiviate in `archivio/vecchie_immagini_riferimento_2026-11-13/`). I veri frame di riferimento di @RicksClips3000 sono indicizzati in `references/riferimenti-rick.md` (**consultabili solo su richiesta**): mai dentro un nostro video, mai pubblicati. Il loro motore è three.js dentro Remotion;
il nostro è three.js in Chromium (`rendi_disegnato.mjs`), quindi le ricette si portano quasi riga per riga.

**Attenzione alla luce**: i loro rapporti misurano Rick di **giorno e al tramonto** (ponte del 1831). Il nostro riferimento
(`paxinko_the_window.mp4`) e il nostro look sono **notte al neon**. I valori di colore (curva, punto del nero, saturazione)
non si copiano: si copia il **metodo** e si tara sul nostro riferimento. Le misure di camera, profondità di campo, linee e
mix valgono invece per ogni luce.

## 1. Movimento (motion.md)
| | loro (Rick misurato) | noi |
|---|---|---|
| movimenti | planate simmetriche ~23 fotogrammi (10 in, 10 out), picco 14-16 px/f a 720p | camera viva + tappe con planata 0,8-2,5 s: velocità mediana 34,6 px/s (Pachinko), 55,6 (Treno) |
| fermi | 65% dei fotogrammi si muove; ogni attesa spinge 0,15-0,35 %/f, 0,6 %/f sulle parole forti | fermi 18% (Pachinko), 13,7% (Treno); spinta 0,09 |
| impatti | scossa di 7 fotogrammi che cambia segno ogni fotogramma | `shake` sugli oggetti, nessuna scossa di camera |
| rollio | 4-8° sulle battute forti, planato ≥ 18 f | nessuno |
| personaggi | ammiccamenti ogni 0,5-2,3 s in 4 fotogrammi; cambio di faccia 0-3 f prima della parola | battito con shape key; facce sulla parola |
**Manca**: scossa di camera sugli impatti, rollio sulle battute forti, spinta più forte sulle parole chiave.
**Conviene portare**: `kick` (7 f, segno alterno, ~3 px a 720p) e `roll` come opzioni della tappa in `storia_disegnato.js`; anticipare di 2 fotogrammi i cambi di faccia. Costo basso.

## 2. Profondità (depth.md)
| | loro | noi |
|---|---|---|
| profondità di campo | su ~1/3 del tempo: primi piani, mezze figure, dettagli; cInf 12-16 px a 1080 (primo piano 12-14, mezza figura 10-12, campo largo 0); fuoco sugli occhi; primo piano sfocato 15-24 px | **aggiunta l'11/11** (`"sfocatura": "auto"`, da approvare) |
| oggetti in primo piano | ~20% dei fotogrammi, a 0,3-0,5 della distanza di fuoco, 10-25% del bordo | rari |
| foschia | colore della nebbia = colore dell'orizzonte, lontano tirato del 20-40% verso l'orizzonte | `NebbiaPass` (foschia luminosa dalla scena, 4 → 45 m) + `FogExp2` per luogo |
| bagliore | solo sulle sorgenti, soglia 1.0 | due bagliori (soglia 1.0 + generale 0.42): voluto [utente] |
**Fatto l'11/11 (da approvare)**: la profondità di campo, la differenza più grande.
**Conviene portare**: il loro `lensblur.ts` (lente sottile, una passata a raccolta, 64 campioni a spirale aurea, raggio dalla
profondità, primo piano separato) come passata nostra dopo i contorni e prima dei bagliori, con un valore per tappa
(`"sfocatura": 12` px, 0 = spenta) e fuoco automatico sulla testa del soggetto. Ordine della catena: contorni → sfocatura → nebbia → bagliori, così le linee si sfocano col fondo come nel riferimento.

## 3. Texture (textures.md)
Loro: superfici a pochi campi di colore piatti, linee dipinte 3-5 px a 1080 (fughe, malta, assi), mai sotto L* 19, nuvole a tre toni.
Noi: texture del kit tinte + colori per materiale nei GLB; il look disegnato aggiunge patina e specchio sulla strada.
**Manca**: un controllo sul nero dei materiali (le basi delle macchine del Pachinko danno NERO_PIENO 9-13%).
**Conviene portare**: la regola «nessun materiale sotto L* 16-22: neri colorati», da applicare nei costruttori del mondo. Le loro texture dipinte del ponte non servono (luoghi diversi).

## 4. Personaggi (characters.md)
Loro: carte 2D, 3,5 teste, testa a fagiolo h/w 0,94, contorno prugna #241726 più spesso dal lato in ombra, niente guance rosse, occhi 0,26 W, facce chiare (luma ≥ 0,85).
Noi: personaggi 3D da Blender (testa larga, contorno bruno, 17 espressioni). La forma è una scelta nostra approvata: **non si cambia**.
**Conviene portare**: solo due misure da controllare: facce chiare ≥ 0,85 anche nelle scene scure (il nostro tetto 0,9 per non bruciare va bene) e contorno più spesso dal lato in ombra se un giorno si ridisegna il contorno.

## 5. Luce (lighting.md)
Loro: ombre colorate mai grigie (giorno: ombra/luce 0,5 con saturazione tenuta; tramonto: ombre viola-blu), sole di lato o in controluce, ombra a macchia sotto i piedi, niente occlusione ambientale.
Noi: notte con luci vere, `lightCards` (bordo di luce colorato sui personaggi), ombra di contatto, niente SSAO (fa aloni).
**Già allineato**: niente occlusione ambientale, personaggi illuminati dalla scena, ombre colorate dai neon.
**Conviene portare**: il controllo «ombre colorate» nella misura (`shortkit.py measure` lo dà già: Pachinko 39/44/17% rosso-bruno/blu/viola contro 44/46/9%).

## 6. Contorni (outlines.md)
| | loro | noi (`look_disegnato.js` passo 4) |
|---|---|---|
| tecnica | passata propria: sagome + salti di profondità + pieghe dalle normali + contatti | stessa idea: Sobel su profondità (kd 0,06) e normali (kn 0,5), 8 direzioni |
| spessore | 3,4 px vicino (6 m) → 2,2 px lontano (90 m), pieghe ×0,64 | raggio 2,4 px fisso, lontano più chiaro (×0,35 da 15 a 70 m) |
| colore | #0b0a0c, intensità 1,0, lontano 0,75 | #1c1430 al 90% |
| ordine | contorni → sfocatura → bagliore → tono → colore | contorni → nebbia → bagliori (nessuna sfocatura) |
| quanti spigoli hanno la linea | 74% | non misurato |
**Il brief diceva «mancano i contorni»: in realtà la passata c'è.** Va misurata: quanti spigoli la ricevono e se la nebbia e il
bagliore generale la sbiancano (misura `linee` di `shortkit.py`: #452628 contro #4a2a26 del riferimento, quindi il colore è già vicino).
**Conviene portare**: spessore che dipende dalla distanza (3,4 → 2,2 px), linea anche nei contatti oggetto-pavimento, e
tenere la passata prima della sfocatura. Da fare solo dopo una misura prima/dopo.

## 7. Colore (grade.md)
Loro: una correzione dopo il tono, adattata con i numeri sui fotogrammi del riferimento: curva a 7 punti, saturazione per
ombre/medi/luci, tinta per zona, vignetta (giorno k 0,10 r0 0,45; tramonto k 0,16 r0 0,40), punto del nero caldo e sollevato.
Noi: ACES + esposizione per luogo (`esp` 0,8), `cb` 1,35; nessuna curva finale, nessuna vignetta.
**Manca**: una correzione finale **misurata** sul nostro riferimento notturno.
**Conviene portare**: il loro metodo (`grade.ts` in GLSL + l'adattamento ai quantili dei fotogrammi) con i **nostri** numeri:
curva e saturazione adattate a `paxinko_the_window.mp4` (luce media 73, saturazione 0,53), vignetta, punto del nero colorato.
Opzionale e spento di default finché l'utente non approva il confronto.

## 8. Suono (templates/audio, mix.py)
| | loro | noi (`audio.py` `mix`, `film_disegnato.py`) |
|---|---|---|
| volume finale | -15 LUFS integrati, picco vero ≤ -1,2 dBTP, limitatore proprio | `loudnorm` a -14 LUFS in un passaggio: Pachinko -14,5, Treno -14,4 (LRA 1,8 / 1,6) |
| musica sotto la voce | abbassamento con attacco 70 ms / rilascio 450 ms, livello per sezione **misurato** rispetto alla voce | abbassamento fisso del 55% (~-7 dB) quando la voce supera una soglia; guadagno 0,08 |
| effetti | tabella evento → suono sintetizzato, -6 dB | 18 effetti sintetizzati, guadagno per tipo |
| uscita | 48 kHz, durata esatta, tracce separate + `cues.md` | un wav unico |
**Manca**: livelli misurati (musica ed effetti sotto la voce di quanti LU, per sezione), controllo del picco vero, file con le tracce separate, registro dei suoni previsti/misurati.
**Conviene portare**: la misura LUFS per sezione e l'abbassamento con attacco/rilascio (in numpy, già usato da noi), il controllo del picco, un `cues.md` per video. Regole di regia del suono: `../regia-suono.md`.

## Ordine di lavoro (una cosa alla volta, ognuna con prima/dopo approvato)
1. Profondità di campo — fatta, confronto in `~/STORIE CARTOON/confronti/`, in attesa dell'ok.
2. Contorni: misura, poi spessore con la distanza.
3. Colore: correzione finale tarata sul riferimento notturno.
4. Mix audio misurato.
Fuori da questo giro (costo basso, chiedere): scossa e rollio di camera, ammiccamenti più frequenti.
