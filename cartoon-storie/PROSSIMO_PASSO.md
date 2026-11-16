# Prossimo passo (aggiornato il 16/11/2026, dopo il cancello)

Il lavoro che stava scritto qui (il cancello su `run.py video`) è **fatto**: cosa fa è in `references/controlli.md` §0, il racconto in fondo a `HANDOFF.md`. Questo file ora elenca solo cosa viene dopo.

## Da leggere prima (in quest'ordine, e basta)
1. `SKILL.md` (flusso, regole dell'utente, indice).
2. `STATO.md` (approvato / in prova / respinto, lavori aperti, domande aperte).
3. `references/controlli.md` §0.
`HANDOFF.md` è il diario: non leggerlo intero, cercaci dentro solo se serve un dettaglio.

## Cosa viene dopo, solo con l'ok dell'utente
1. **Collocazione completata nel motore**: `COMPENETRATI` e `FUORI_POSTO` sono collegati al cancello senza deroga; casi e limiti in `references/controlli.md`. Le storie esistenti servono solo come dati di prova: non correggerne i mondi. Restano da progettare il riconoscimento automatico degli incastri tra modelli separati e della coerenza con luogo/epoca.
2. Camera: prova v12 (soggetti centrati con `"su"` + `"testa"`, riprese uniche nello stesso luogo) → ok → riscrivere `references/movimenti-camera.md` §8.
3. Rivedere `regia()` in `kit/tools/rendi_disegnato.mjs` (limiti 8/15 s e stacchi): finché non è rivista, quei due avvisi nel cancello avvisano e non fermano.
4. Le tre domande aperte in fondo a `STATO.md`.
5. Tenere separate le modifiche al motore/controlli da quelle alle storie e alle prove camera di altre sessioni.

## Regole che valgono sempre
- Lavora a passi: mostra e fermati. Di' sempre cosa è verificato e cosa no.
- Prove a risparmio: `--controlli` invece dell'anteprima quando servono solo i numeri (niente immagini, solo le scene cambiate).
- Non toccare: `kit/stories/ricerca_gettone/`, le formule `VOLO` / `frena` / `MOSSE`, il look (`look_disegnato.js`).
- `engine3d/web/storia_disegnato.js` e `HANDOFF.md` vengono modificati anche da altre sessioni: rileggi il file subito prima di scriverci.
- Nessun `git commit` e nessuna cancellazione senza l'ok dell'utente.
- `MONDO_OK` non esiste più. `CONTROLLI_OK=1` riguarda solo gli altri controlli, mai il mondo; non usarlo di propria iniziativa. Se il cancello ferma, mostra l’elenco e correggi solo ciò che è autorizzato.
