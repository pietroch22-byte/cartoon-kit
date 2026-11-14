# STORIE CARTOON — Skill, Motore 3D/2D e Kit Asset (`cartoon-storie`)

Repository di lavoro e backup completo del progetto **cartoon-storie**: pipeline per creare Shorts verticali animati (`1080×1920`) con mondo 3D disegnato (Three.js + Chromium), personaggi stile Rick, regia, voce, audio, effetti, karaoke e controlli automatici.

> **Nota per gli LLM che leggono questo repository**:
> - Inizia da [`cartoon-storie/SKILL.md`](cartoon-storie/SKILL.md) (regole complete, flusso di produzione, strumenti, controlli) e [`cartoon-storie/HANDOFF.md`](cartoon-storie/HANDOFF.md) (stato dettagliato e aggiornato dello sviluppo).
> - La skill è collegata anche in [`.claude/skills/cartoon-storie`](.claude/skills/cartoon-storie) per compatibilità con strumenti che cercano le skill sotto `.claude/skills/`.

---

## Struttura del repository

| Percorso | Contenuto principale |
| :--- | :--- |
| [`cartoon-storie/`](cartoon-storie/) | Skill unica, motore di rendering, storie JSON, libreria e documentazione operativa. |
| [`cartoon-storie/SKILL.md`](cartoon-storie/SKILL.md) | Istruzioni principali della skill, flusso in 9 punti e riferimento rapido ai file. |
| [`cartoon-storie/HANDOFF.md`](cartoon-storie/HANDOFF.md) | Registro aggiornato dello stato lavori, esperimenti, verifiche e decisioni aperte. |
| [`cartoon-storie/engine3d/web/`](cartoon-storie/engine3d/web/) | Motore client Three.js / WebGL / Canvas 2D: `engine.js`, `look_disegnato.js`, `mondo_disegnato.js`, `storia_disegnato.js`, `camera_preset.js`, `omino_rick.js`, `cast_rick.js`, `omino.js`, `personaggi3d.js`, `interazioni.js`, `vita.js`, `vivo.js`, `vivi.js`, `animati.js`, `animazioni.js`, `buon_senso.js`, `oggetti_porto.js`, `oggetti_stazione.js`, `storia.html`, `disegnato.html`. |
| [`cartoon-storie/kit/`](cartoon-storie/kit/) | CLI e pipeline Python/Node: `run.py` (`setup`, `anteprima`, `video`), `setup.sh`, `requirements.txt`, `engine/` (`audio.py`, `film_disegnato.py`, `karaoke.py`), `tools/` (`rendi_disegnato.mjs`, `valuta_personaggio.mjs`, `tremolio.py`, `camera_misura.py`, `shortkit.py`, `asr_words.py`, `scarica_kit.py`, ecc.), `stories/`, `fonts/`, `topics/`. |
| [`cartoon-storie/library/`](cartoon-storie/library/) | Schede luoghi (`luoghi/`), meccanismi vivi (`vivi/`), animali e clip animati (`animati/`), modelli base (`modelli3d/`). |
| [`cartoon-storie/references/`](cartoon-storie/references/) | Guide dettagliate su regia, recitazione, camera, look disegnato, mondo vivo, buon senso, suono, problemi noti e analisi `ricksclips/`. |
| [`cartoon-storie/confronti/`](cartoon-storie/confronti/) | Immagini e clip prima/dopo delle prove su PBR e luci. |
| [`asset-kit/`](asset-kit/) | Indice `indice.json`, crediti CC0, riferimenti (`riferimenti/claude-animated-shorts/`), script `scarica_kit_realistico.py` / `scarica_polyhaven.py` e le 9 trame tessuto in `texture/` usate da `omino_rick.js`. |
| [`confronti/`](confronti/) | Tavole visive e video di verifica su animazione, locomozione, recitazione e cast 40 archetipi. |
| [`libreria-preset/`](libreria-preset/) | Modelli GLB/Blender, texture stilizzate e script `script/costruisci_preset.py` per oggetti riusabili. |
| [`voci/`](voci/) | Registrazioni vocali originali dell'utente per le storie. |

---

## Asset pesanti (Release `v1` e script di download)

Per mantenere il branch Git snello e navigabile, gli asset CC0 di grandi dimensioni non sono tracciati su `main`, ma restano scaricabili in qualsiasi momento:

1. **Kit base dalla Release [`v1`](https://github.com/pietroch22-byte/cartoon-kit/releases/tag/v1)** (520 modelli GLB, texture Poly Haven, 14 cieli HDRI e `indice.json`):
   ```bash
   python3 cartoon-storie/kit/tools/scarica_kit.py
   ```
   *(Scarica ed estrae gli archivi in `asset-kit/`, oppure nella cartella indicata da `CARTOON_KIT`.)*

2. **Texture PBR curati da Poly Haven + ambientCG e cieli HDRI 2K**:
   ```bash
   python3 asset-kit/scarica_kit_realistico.py
   ```

3. **Dipendenze locali della skill** (prima esecuzione su una nuova macchina):
   ```bash
   cd cartoon-storie
   python3 kit/run.py setup
   cd engine3d && npm install && npx playwright install chromium
   ```
   *(Richiede Node 18+, Python 3 e Playwright/Chromium per il rendering WebGL.)*

## Cosa è escluso dal backup Git (`.gitignore`)

- Output di rendering temporanei/finali (`cartoon-storie/out/`, `cartoon-storie/kit/out/`, `video/`).
- Ambienti installabili (`cartoon-storie/engine3d/node_modules/`, `cartoon-storie/kit/.venv/`).
- Archivi storici e cartelle di pulizia locale (`archivio/`, `DA_ELIMINARE/`).
- Video di riferimento di terzi (`riferimenti_rick/`).
- File binari pesanti di `asset-kit/` già presenti nella Release `v1` (`modelli/`, `pacchetti_animati/`, `hdri/`, e le texture non-tessuto rigenerabili via script). Le 9 texture dei tessuti usate da `engine3d/web/omino_rick.js` sono incluse nel repository.
