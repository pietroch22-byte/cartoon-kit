# Frame "autostrada" (POV abitacolo + personaggio 2D)

Un singolo frame 1080×1920 fatto solo di codice, senza AI e senza asset scaricati:
- **Mondo 3D** (three.js r160, PBR): cielo a gradiente con sole, nebbia, strada con segnaletica, spartitraffico, guardrail, alberi istanziati, portale con cartelli, traffico.
- **Auto rossa tamponata**: carrozzeria smussata con ammaccatura ottenuta deformando i vertici, luci emissive (bloom), targa disegnata su canvas.
- **Personaggio 2D**: disegno su canvas applicato a un piano rivolto alla camera, con ombra vera (`customDepthMaterial` con la sua sagoma). Porta il collare cervicale, così il personaggio è coerente con la battuta.
- **Abitacolo**: cofano 3D illuminato; cruscotto, quadro strumenti e radio come pannelli dipinti legati alla camera; volante 3D; crepa sul parabrezza.
- **Sottotitolo** in HTML/CSS sopra il canvas.

```bash
npm install
npm run render   # → frame.png (Playwright + Chromium headless)
```

Per un video: rendi `scene.js` funzione del numero di frame (offset della strada, oscillazione della camera, posa del personaggio), salva un PNG per frame e unisci tutto con ffmpeg.
