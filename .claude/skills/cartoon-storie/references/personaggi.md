# Personaggi (sagome disegnate dal motore, stile «Ho già mangiato»)

Pronti: `nonna`, `marco`, `vicina`, `zia1`…`zia5` → `"cast": {"nonna": {"type": "nonna"}}`.

Personaggio nuovo: scrivi il costume con gli stessi campi di `engine3d/web/cards.js` (OUTFITS):
```json
"pescatore": {"h": 1.7, "w": 0.46, "skin": "#e0a882", "top": "#2f6f9a", "pants": "#3a3a4a", "hair": "tuft", "hairC": "#3a2a1a", "shoes": "#2a2a2a", "nose": 1.1, "blush": 0.6}
```
- `h` altezza in metri (bambino ~1.1, adulto 1.5-1.8), `w` larghezza del corpo.
- Abito: `dress` (+ `dot` pois, `apron`) oppure `top` + `pants`.
- Capelli `hair`: bun, tuft, curlers, curly, bob, perm, scarf (colore `hairC`). `glasses`, `pearls` opzionali.
- Ogni personaggio ha una firma visiva fissa (colore, capelli, accessorio) che non cambia tra i video della serie.
Animazione: `pose`, `face`, `change` sulle parole, `anim` per `fat` (si gonfia: oltre 0.85 + `roll` diventa una palla che rotola), `squash`, `tilt`; `speaker` muove la bocca; ciglia e respiro sono automatici.
