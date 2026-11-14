/* Mondo 3D stile Rick per «La ricerca del gettone» + passaggio di compositing tipografico ad alta nitidezza (zero commenti //). */
import { THREE, camera, renderer } from '/web/look_disegnato.js';
import { orologio, cartello } from '/web/buon_senso.js';
import { polvere } from '/web/vivo.js';

const TAU = Math.PI * 2;
const cl = x => Math.min(1, Math.max(0, x));
const ss = x => { const t = cl(x); return t * t * (3 - 2 * t); };
const ss5 = x => { const t = cl(x); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, t) => a === b ? (t >= b ? 1 : 0) : cl((t - a) / (b - a));

/* Pre-genera trama grigia marezzata deterministica per la scena 8 (evita calcoli pesanti ogni frame). */
let _mottledCv = null;
function getMottledCanvas() {
  if (_mottledCv) return _mottledCv;
  const cv = document.createElement('canvas');
  cv.width = 540; cv.height = 960;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(270, 480, 30, 270, 480, 620);
  grad.addColorStop(0, '#c0c0c0');
  grad.addColorStop(0.5, '#969696');
  grad.addColorStop(1, '#585858');
  g.fillStyle = grad;
  g.fillRect(0, 0, 540, 960);
  let s = 4219;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 95; i++) {
    const x = rnd() * 540, y = rnd() * 960, r = 40 + rnd() * 140;
    const sc = rnd() < 0.52;
    const al = 0.04 + rnd() * 0.06;
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, sc ? `rgba(55,55,60,${al})` : `rgba(225,225,230,${al})`);
    rg.addColorStop(1, 'rgba(128,128,128,0)');
    g.fillStyle = rg;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const vig = g.createRadialGradient(270, 480, 180, 270, 480, 660);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(12,12,15,0.68)');
  g.fillStyle = vig;
  g.fillRect(0, 0, 540, 960);
  _mottledCv = cv;
  return cv;
}

/* Tela ausiliaria per sfocatura selettiva reale di singole lettere (Don't quit. -> Do it.). */
let _blurCv = null;
function getBlurCanvas() {
  if (_blurCv) return _blurCv;
  _blurCv = document.createElement('canvas');
  _blurCv.width = 1080; _blurCv.height = 1920;
  return _blurCv;
}

/* Disegna il Gettone d'oro iconico con corona segmentata in 4 archi, tacche a croce, nucleo con F e raggi radiali. */
function disegnaGettoneOro(ctx, cx, cy, r, t, opts = {}) {
  if (r <= 0.5) return;
  const alpha = opts.alpha ?? 1;
  if (alpha <= 0.01) return;
  const rotRays = opts.rot ?? (t * 0.14);
  const rayCount = opts.rayCount ?? 18;
  const rayLen = opts.rayLen ?? (r * 4.4);
  const rayAlpha = opts.rayAlpha ?? 0.30;
  const drawEmblem = opts.emblem !== false;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);

  /* Bagliore morbido esterno */
  const bgGlow = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r * 3.4);
  bgGlow.addColorStop(0, 'rgba(255, 245, 175, 0.72)');
  bgGlow.addColorStop(0.28, 'rgba(255, 200, 70, 0.34)');
  bgGlow.addColorStop(0.65, 'rgba(210, 140, 30, 0.10)');
  bgGlow.addColorStop(1, 'rgba(210, 140, 30, 0)');
  ctx.fillStyle = bgGlow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 3.4, 0, TAU);
  ctx.fill();

  /* Raggi di luce radiali sottili */
  if (rayAlpha > 0.01 && rayLen > r) {
    ctx.save();
    ctx.rotate(rotRays);
    for (let i = 0; i < rayCount; i++) {
      const a = (i / rayCount) * TAU;
      const w = (i % 2 === 0 ? 0.065 : 0.036);
      const rg = ctx.createLinearGradient(0, 0, Math.cos(a) * rayLen, Math.sin(a) * rayLen);
      rg.addColorStop(0, `rgba(255, 224, 120, ${rayAlpha})`);
      rg.addColorStop(0.55, `rgba(255, 205, 90, ${rayAlpha * 0.35})`);
      rg.addColorStop(1, 'rgba(255, 195, 70, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - w) * rayLen, Math.sin(a - w) * rayLen);
      ctx.lineTo(Math.cos(a + w) * rayLen, Math.sin(a + w) * rayLen);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /* Corona esterna segmentata (4 archi oro con 4 intagli a croce N/S/E/W) */
  const outerR = r;
  const innerR = r * 0.70;
  const ringMid = (outerR + innerR) * 0.5;
  const ringW = outerR - innerR;
  const gap = 0.14;
  ctx.lineWidth = ringW;
  ctx.lineCap = 'butt';
  const rimGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, outerR);
  rimGrad.addColorStop(0, '#fff4a8');
  rimGrad.addColorStop(0.55, '#ffd44c');
  rimGrad.addColorStop(1, '#c98818');
  ctx.strokeStyle = rimGrad;
  for (let k = 0; k < 4; k++) {
    const a0 = k * (Math.PI / 2) + gap;
    const a1 = (k + 1) * (Math.PI / 2) - gap;
    ctx.beginPath();
    ctx.arc(0, 0, ringMid, a0, a1);
    ctx.stroke();
  }

  /* Tacche scure interne sugli intagli cardinali */
  ctx.strokeStyle = '#3a2408';
  ctx.lineWidth = Math.max(1.5, r * 0.07);
  for (let k = 0; k < 4; k++) {
    const a = k * (Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * innerR * 0.94, Math.sin(a) * innerR * 0.94);
    ctx.lineTo(Math.cos(a) * outerR * 1.04, Math.sin(a) * outerR * 1.04);
    ctx.stroke();
  }

  /* Anello interno sottile luminoso */
  ctx.strokeStyle = '#fff3b8';
  ctx.lineWidth = Math.max(1.2, r * 0.05);
  ctx.beginPath();
  ctx.arc(0, 0, innerR * 0.90, 0, TAU);
  ctx.stroke();

  /* Nucleo centrale luminoso bianco-oro */
  const coreG = ctx.createRadialGradient(0, 0, 0, 0, 0, innerR * 0.85);
  coreG.addColorStop(0, '#ffffff');
  coreG.addColorStop(0.45, '#fff6b2');
  coreG.addColorStop(0.85, '#ffd140');
  coreG.addColorStop(1, '#e69b1e');
  ctx.fillStyle = coreG;
  ctx.beginPath();
  ctx.arc(0, 0, innerR * 0.85, 0, TAU);
  ctx.fill();

  /* Emblema stilizzato F / sigillo interno come nei frame di riferimento */
  if (drawEmblem && r >= 12) {
    ctx.fillStyle = '#fffef2';
    ctx.strokeStyle = 'rgba(212, 136, 16, 0.45)';
    ctx.lineWidth = Math.max(1, r * 0.035);
    const fw = r * 0.34, fh = r * 0.56, bar = Math.max(2, r * 0.13);
    ctx.beginPath();
    ctx.rect(-fw * 0.52, -fh * 0.5, bar, fh);
    ctx.rect(-fw * 0.52, -fh * 0.5, fw, bar);
    ctx.rect(-fw * 0.52, -bar * 0.52, fw * 0.78, bar * 0.9);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/* Testo con scia direzionale orizzontale (compaia/scompaia con motion blur) */
function disegnaTestoMosso(ctx, testo, x, y, blurPx, alpha, font, fill, align = 'center', stroke = null, strokeW = 0) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = fill;
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeW; ctx.lineJoin = 'round'; }
  if (blurPx <= 0.6) {
    ctx.globalAlpha = alpha;
    if (stroke) ctx.strokeText(testo, x, y);
    ctx.fillText(testo, x, y);
  } else {
    const steps = 11;
    for (let i = 0; i < steps; i++) {
      const u = (i / (steps - 1)) * 2 - 1;
      const w = Math.exp(-2.2 * u * u);
      ctx.globalAlpha = alpha * (w / 4.2);
      ctx.fillText(testo, x + u * blurPx, y);
    }
  }
  ctx.restore();
}

/* Cono di luce morbido in 2D per rinforzare la composizione teatrale del riferimento */
function disegnaConoLuce(ctx, xTop, yTop, wTop, xBot, yBot, wBot, col0, col1) {
  ctx.save();
  const g = ctx.createLinearGradient(xTop, yTop, xBot, yBot);
  g.addColorStop(0, col0);
  g.addColorStop(1, col1);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(xTop - wTop * 0.5, yTop);
  ctx.lineTo(xTop + wTop * 0.5, yTop);
  ctx.lineTo(xBot + wBot * 0.5, yBot);
  ctx.lineTo(xBot - wBot * 0.5, yBot);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* Flash bianco-crema morbido centrato sul taglio tra scene (monotono dentro ogni scena per tremolio.py) */
function flashConfine(ctx, t, scDa, scA, entraFlash, esceFlash) {
  let al = 0;
  if (entraFlash) {
    const dtIn = t - scDa;
    if (dtIn < 0.14) al = Math.max(al, Math.pow(1 - cl(dtIn / 0.14), 1.45) * 0.96);
  }
  if (esceFlash) {
    const dtOut = scA - t;
    if (dtOut < 0.14) al = Math.max(al, Math.pow(1 - cl(dtOut / 0.14), 1.45) * 0.96);
  }
  if (al > 0.01) {
    ctx.save();
    ctx.globalAlpha = al;
    ctx.fillStyle = '#f6f3ea';
    ctx.fillRect(0, 0, 1080, 1920);
    ctx.restore();
  }
}

/* Proietta un punto 3D (x, y, z) su coordinate schermo 1080x1920; fallback sicuro se fuori camera. */
function proietta3D(x, y, z, cam, T) {
  const v = new T.Vector3(x, y, z);
  v.project(cam);
  if (!isFinite(v.x) || !isFinite(v.y) || v.z > 1.2) return { x: 540, y: 960, ok: false };
  return { x: (v.x * 0.5 + 0.5) * 1080, y: (-v.y * 0.5 + 0.5) * 1920, ok: true };
}

/* Font coerenti con il pacchetto di riferimento e macOS */
const F_COND = '900 %dpx "DIN Condensed", "Arial Narrow", "Impact", sans-serif';
const F_SANS = '700 %dpx "Helvetica Neue", "Arial", sans-serif';
const F_SERIF = '400 %dpx "Georgia", "Times New Roman", serif';
const F_SERIF_IT = 'italic 400 %dpx "Georgia", "Times New Roman", serif';
const fmtFont = (tpl, sz) => tpl.replace('%d', String(Math.round(sz)));

/* ---- RENDER TIPOGRAFICO & GRAFICA DINAMICA DELLE 11 SCENE ---- */
function disegnaGraficaScena(ctx, scIdx, f, fps, scDa, scA, T, cam, state) {
  const t = scDa + f / fps;
  const tl = t - scDa;

  /* Velatura atmosferica morbida sui locali chiusi per far risaltare le scritte lasciando visibile il mondo di Rick */
  const dim = a => {
    if (a <= 0) return;
    ctx.save();
    const g = ctx.createRadialGradient(540, 860, 120, 540, 960, 1180);
    g.addColorStop(0, `rgba(12, 13, 19, ${a})`);
    g.addColorStop(0.65, `rgba(12, 13, 19, ${a * 0.78})`);
    g.addColorStop(1, `rgba(10, 11, 16, ${a * 0.92})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1080, 1920);
    ctx.restore();
  };

  /* ---- SCENA 0 (0.00 - 1.533 s): Still no token? ---- */
  if (scIdx === 0) {
    const pTok = proietta3D(0, 4.75, -8.2, cam, T);
    const dist = cam.position.distanceTo(new T.Vector3(0, 4.75, -8.2));
    const tokR = cl(520 / Math.max(4, dist)) * 0.92 + 24;
    disegnaConoLuce(ctx, 540, -20, 160, pTok.x, pTok.y + 720, 1080, 'rgba(255, 224, 145, 0.24)', 'rgba(255, 195, 75, 0.0)');
    disegnaGettoneOro(ctx, pTok.x, pTok.y, tokR, t, { rayAlpha: 0.34, rayLen: 680 });

    const uStill = ss5(inv(0.02, 0.24, tl));
    const blurStill = (1 - uStill) * 34;
    const xStill = uStill < 1 ? 540 : 458;
    const uNoJoin = ss5(inv(0.45, 0.62, tl));
    const xS = lerp(540, 458, uNoJoin);

    disegnaTestoMosso(ctx, 'STILL', xS, 420, blurStill, cl(tl / 0.10), fmtFont(F_COND, 96), '#f5f3ec', 'center', 'rgba(10,12,18,0.65)', 7);

    if (tl >= 0.44) {
      const uNo = ss5(inv(0.44, 0.63, tl));
      disegnaTestoMosso(ctx, 'NO', lerp(740, 628, uNo), 420, (1 - uNo) * 28, uNo, fmtFont(F_COND, 96), '#f5f3ec', 'center', 'rgba(10,12,18,0.65)', 7);
    }

    if (tl >= 0.88) {
      const uTok = ss5(inv(0.88, 1.08, tl));
      if (uTok < 1) {
        const ghostS = 1 + (1 - uTok) * 0.28;
        ctx.save();
        ctx.translate(540, 526);
        ctx.scale(ghostS, ghostS);
        disegnaTestoMosso(ctx, 'TOKEN?', 0, 0, (1 - uTok) * 14, (1 - uTok) * 0.35, fmtFont(F_COND, 108), '#ffd97b', 'center');
        ctx.restore();
      }
      disegnaTestoMosso(ctx, 'TOKEN?', 540, 526, (1 - uTok) * 16, uTok, fmtFont(F_COND, 108), '#ffd97b', 'center', 'rgba(10,12,18,0.72)', 8);
    }
    return;
  }

  /* ---- SCENA 1 (1.533 - 4.567 s): IF YOU -> SEARCH (FOUND IT / NOT YET) / QUIT -> NEVER ---- */
  if (scIdx === 1) {
    dim(0.46);
    disegnaConoLuce(ctx, 210, -40, 290, 520, 1940, 540, 'rgba(245, 240, 232, 0.16)', 'rgba(200, 195, 190, 0.02)');

    /* Trasformazione globale dell'albero: all'inizio entra da sinistra grande, poi arretra per mostrare l'intero schema */
    const uFit = ss5(inv(0.80, 2.85, tl));
    const scTree = lerp(1.18, 0.90, uFit);
    const ox = lerp(220, 540, uFit);
    const oy = 970;

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scTree, scTree);

    /* Coordinate locali del diagramma centrato attorno a 0 */
    const xIf = -360, xBr1 = -205, xSearch = -65, xBr2 = 110, xLeaf = 250, xQuit = -65, xNever = 255;
    const yMid = 0, yTop = -195, yBot = 195, yFound = -290, yNot = -105;

    const uIf = ss5(inv(0.02, 0.28, tl));
    disegnaTestoMosso(ctx, 'IF YOU', lerp(xIf - 160, xIf, uIf), yMid, (1 - uIf) * 42, uIf, fmtFont(F_SANS, 48), '#f4f2ec', 'center');

    /* Linea da IF YOU al primo bivio + parentesi SEARCH / QUIT */
    ctx.strokeStyle = '#e8e6e0';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    const uL0 = ss(inv(0.25, 0.65, tl));
    if (uL0 > 0) {
      ctx.beginPath();
      ctx.moveTo(xIf + 100, yMid);
      ctx.lineTo(lerp(xIf + 100, xBr1, uL0), yMid);
      ctx.stroke();
    }

    const uUp1 = ss(inv(0.55, 0.95, tl));
    if (uUp1 > 0) {
      ctx.beginPath();
      ctx.moveTo(xBr1, yMid);
      ctx.lineTo(xBr1, lerp(yMid, yTop, uUp1));
      if (uUp1 > 0.72) ctx.lineTo(lerp(xBr1, xSearch - 86, inv(0.72, 1, uUp1)), yTop);
      ctx.stroke();
    }

    const uSearch = ss5(inv(0.88, 1.12, tl));
    if (uSearch > 0) {
      disegnaTestoMosso(ctx, 'SEARCH', xSearch + 22, yTop, (1 - uSearch) * 20, uSearch, fmtFont(F_SANS, 52), '#ffffff', 'center');
    }

    /* Secondo bivio da SEARCH -> FOUND IT / NOT YET */
    const uBr2 = ss(inv(1.05, 1.55, tl));
    if (uBr2 > 0) {
      ctx.beginPath();
      ctx.moveTo(xSearch + 130, yTop);
      ctx.lineTo(lerp(xSearch + 130, xBr2, Math.min(1, uBr2 * 2)), yTop);
      if (uBr2 > 0.45) {
        const vv = inv(0.45, 1, uBr2);
        ctx.moveTo(xBr2, yTop);
        ctx.lineTo(xBr2, lerp(yTop, yFound, vv));
        ctx.lineTo(lerp(xBr2, xLeaf - 55, Math.max(0, vv * 1.4 - 0.4)), yFound);
        ctx.moveTo(xBr2, yTop);
        ctx.lineTo(xBr2, lerp(yTop, yNot, vv));
        ctx.lineTo(lerp(xBr2, xLeaf - 75, Math.max(0, vv * 1.4 - 0.4)), yNot);
      }
      ctx.stroke();
    }

    const uFound = ss5(inv(1.42, 1.72, tl));
    if (uFound > 0) {
      disegnaGettoneOro(ctx, xLeaf + 45, yFound - 78, 42 * (0.4 + 0.6 * uFound), t, { alpha: uFound, rayAlpha: 0.25, rayLen: 185 });
      disegnaTestoMosso(ctx, 'FOUND IT', xLeaf + 45, yFound + 2, (1 - uFound) * 16, uFound, fmtFont(F_SANS, 34), '#ffd97b', 'center');
    }

    const uNot = ss5(inv(1.52, 1.82, tl));
    if (uNot > 0) {
      disegnaTestoMosso(ctx, 'NOT YET', xLeaf + 45, yNot + 2, (1 - uNot) * 16, uNot, fmtFont(F_SANS, 34), '#d8dce4', 'center');
    }

    /* Ramo inferiore QUIT -> NEVER */
    const uDn1 = ss(inv(1.70, 2.02, tl));
    if (uDn1 > 0) {
      ctx.beginPath();
      ctx.moveTo(xBr1, yMid);
      ctx.lineTo(xBr1, lerp(yMid, yBot, uDn1));
      if (uDn1 > 0.72) ctx.lineTo(lerp(xBr1, xQuit - 65, inv(0.72, 1, uDn1)), yBot);
      ctx.stroke();
    }

    const uQuit = ss5(inv(1.90, 2.15, tl));
    if (uQuit > 0) {
      disegnaTestoMosso(ctx, 'QUIT', xQuit + 5, yBot, (1 - uQuit) * 20, uQuit, fmtFont(F_SANS, 50), '#ffffff', 'center');
    }

    const uL2 = ss(inv(2.08, 2.38, tl));
    if (uL2 > 0) {
      ctx.beginPath();
      ctx.moveTo(xQuit + 74, yBot);
      ctx.lineTo(lerp(xQuit + 74, xNever - 88, uL2), yBot);
      ctx.stroke();
    }

    const uNever = ss5(inv(2.26, 2.55, tl));
    if (uNever > 0) {
      disegnaTestoMosso(ctx, 'NEVER', xNever + 10, yBot, (1 - uNever) * 22, uNever, fmtFont(F_SANS, 52), '#d93232', 'center');
    }

    ctx.restore();
    return;
  }

  /* ---- SCENA 2 (4.567 - 6.000 s): yesterday / tomorrow / NOW. -> Zoom nel gettone -> Flash ---- */
  if (scIdx === 2) {
    dim(0.50);

    /* Raggi tenui radiali dietro NOW */
    const uZoomIn = ss5(inv(1.06, 1.433, tl));
    const zoomScale = 1 + Math.pow(uZoomIn, 2.15) * 19.5;
    const fadeOutWords = 1 - ss(inv(1.06, 1.24, tl));

    ctx.save();
    ctx.translate(540, 960);
    ctx.scale(zoomScale, zoomScale);

    /* Raggi radiali sottili al centro */
    ctx.save();
    ctx.globalAlpha = 0.24 * (1 - uZoomIn * 0.4);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * TAU + t * 0.08;
      const g = ctx.createLinearGradient(0, 0, Math.cos(a) * 440, Math.sin(a) * 440);
      g.addColorStop(0, 'rgba(255, 224, 140, 0.35)');
      g.addColorStop(1, 'rgba(255, 224, 140, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - 0.03) * 440, Math.sin(a - 0.03) * 440);
      ctx.lineTo(Math.cos(a + 0.03) * 440, Math.sin(a + 0.03) * 440);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    /* yesterday + sbarra rossa */
    const uYest = ss5(inv(0.02, 0.26, tl));
    if (uYest > 0 && fadeOutWords > 0.01) {
      disegnaTestoMosso(ctx, 'yesterday', 0, -290, (1 - uYest) * 16, uYest * fadeOutWords, fmtFont(F_SERIF, 78), '#d4d6dc', 'center');
      const uStrY = ss5(inv(0.32, 0.56, tl));
      if (uStrY > 0) {
        ctx.save();
        ctx.globalAlpha = fadeOutWords;
        ctx.strokeStyle = '#d93232';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-178, -288);
        ctx.lineTo(lerp(-178, 178, uStrY), -288);
        ctx.stroke();
        ctx.restore();
      }
    }

    /* tomorrow + sbarra rossa */
    if (tl >= 0.42 && fadeOutWords > 0.01) {
      const uTom = ss5(inv(0.42, 0.64, tl));
      disegnaTestoMosso(ctx, 'tomorrow', 0, 290, (1 - uTom) * 16, uTom * fadeOutWords, fmtFont(F_SERIF, 78), '#d4d6dc', 'center');
      const uStrT = ss5(inv(0.70, 0.94, tl));
      if (uStrT > 0) {
        ctx.save();
        ctx.globalAlpha = fadeOutWords;
        ctx.strokeStyle = '#d93232';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-180, 292);
        ctx.lineTo(lerp(-180, 180, uStrT), 292);
        ctx.stroke();
        ctx.restore();
      }
    }

    /* NOW. con Gettone d'oro esattamente al posto della O */
    if (tl >= 0.78) {
      const uNow = ss5(inv(0.78, 1.06, tl));
      disegnaTestoMosso(ctx, 'N', -168, 0, (1 - uNow) * 20, uNow * fadeOutWords, fmtFont(F_SERIF, 162), '#ffffff', 'center');
      disegnaTestoMosso(ctx, 'W.', 190, 0, (1 - uNow) * 20, uNow * fadeOutWords, fmtFont(F_SERIF, 162), '#ffffff', 'center');
      disegnaGettoneOro(ctx, 0, -4, 62 * (0.4 + 0.6 * uNow), t, { alpha: uNow, rayAlpha: 0.40, rayLen: 260 });
    }

    ctx.restore();
    flashConfine(ctx, t, scDa, scA, false, true);
    return;
  }

  /* ---- SCENA 3 (6.000 - 7.533 s): A BAD START / ISN'T A BAD FINISH. ---- */
  if (scIdx === 3) {
    /* Rinforza gettone luminoso tra le mani alzate del 3° personaggio Rick (a destra) */
    const uTok = ss5(inv(0.95, 1.25, tl));
    if (uTok > 0) {
      const p3 = proietta3D(2.35, 2.38, -0.3, cam, T);
      const d3 = cam.position.distanceTo(new T.Vector3(2.35, 2.38, -0.3));
      const r3 = cl(420 / Math.max(4, d3)) * 0.72 + 16;
      disegnaGettoneOro(ctx, p3.x, p3.y, r3, t, { alpha: uTok, rayAlpha: 0.36, rayLen: 260 });
    }

    /* Titolo condensed in alto con ritmi fedeli (6.10, 6.62, 6.96 s) */
    const uHead = ss5(inv(0.06, 0.28, tl));
    const uShift = ss5(inv(0.58, 1.15, tl));
    const yT1 = lerp(420, 412, uShift);
    disegnaTestoMosso(ctx, 'A BAD START', 540, yT1, (1 - uHead) * 32, uHead, fmtFont(F_COND, 96), '#f5f3ec', 'center', 'rgba(10,12,18,0.68)', 8);

    if (tl >= 0.56) {
      const uIsnt = ss5(inv(0.56, 0.80, tl));
      const uFin = tl >= 0.90 ? ss5(inv(0.90, 1.16, tl)) : 0;
      const xIsnt = lerp(280, 295, uFin);
      disegnaTestoMosso(ctx, "ISN'T", xIsnt, 520, (1 - uIsnt) * 26, uIsnt, fmtFont(F_COND, 96), '#f5f3ec', 'center', 'rgba(10,12,18,0.68)', 8);
      if (uFin > 0) {
        disegnaTestoMosso(ctx, 'A BAD FINISH.', 628, 520, (1 - uFin) * 24, uFin, fmtFont(F_COND, 96), '#ffd97b', 'center', 'rgba(10,12,18,0.72)', 8);
      }
    }

    flashConfine(ctx, t, scDa, scA, true, false);
    return;
  }

  /* ---- SCENA 4 (7.533 - 9.033 s): EVERY EMPTY CHEST / IS A STEP UP. ---- */
  if (scIdx === 4) {
    /* Etichette «empty» e gettone proiettati in modo nitido sopra i gradini 3D */
    const uBlurIn = ss5(inv(0.0, 0.38, tl));
    const mBlur = (1 - uBlurIn) * 34;

    for (let i = 0; i < 6; i++) {
      const bx = -3.0 + i * 0.96, by = 0.22 + i * 0.40, bz = -0.3;
      const pL = proietta3D(bx - 0.44, by, bz + 0.46, cam, T);
      const pR = proietta3D(bx + 0.44, by, bz + 0.46, cam, T);
      const pC = proietta3D(bx, by, bz + 0.46, cam, T);
      if (!pC.ok) continue;
      const wPx = Math.max(48, Math.abs(pR.x - pL.x));
      const hPx = wPx * 0.42;
      ctx.save();
      ctx.fillStyle = 'rgba(20, 22, 30, 0.86)';
      ctx.strokeStyle = 'rgba(236, 236, 240, 0.88)';
      ctx.lineWidth = 2.6;
      ctx.fillRect(pC.x - wPx * 0.5, pC.y - hPx * 0.5, wPx, hPx);
      ctx.strokeRect(pC.x - wPx * 0.5, pC.y - hPx * 0.5, wPx, hPx);
      disegnaTestoMosso(ctx, 'empty', pC.x, pC.y, mBlur * 0.5, 0.96, fmtFont(F_SANS, Math.max(18, wPx * 0.22)), '#f0f0f2', 'center');
      ctx.restore();
    }

    /* Gradino bianco finale in cima a destra + Gettone d'oro */
    const tx = -3.0 + 6 * 0.96, ty = 0.22 + 6 * 0.40, tz = -0.3;
    const pTopL = proietta3D(tx - 0.44, ty, tz + 0.46, cam, T);
    const pTopR = proietta3D(tx + 0.44, ty, tz + 0.46, cam, T);
    const pTopC = proietta3D(tx, ty, tz + 0.46, cam, T);
    if (pTopC.ok) {
      const wPx = Math.max(52, Math.abs(pTopR.x - pTopL.x));
      const hPx = wPx * 0.42;
      ctx.save();
      ctx.fillStyle = '#f4f2ec';
      ctx.fillRect(pTopC.x - wPx * 0.5, pTopC.y - hPx * 0.5, wPx, hPx);
      ctx.restore();
    }
    const pTok = proietta3D(tx, ty + 0.72, tz, cam, T);
    if (pTok.ok) {
      const dist = cam.position.distanceTo(new T.Vector3(tx, ty + 0.72, tz));
      const rTok = cl(420 / Math.max(4, dist)) * 0.78 + 16;
      disegnaGettoneOro(ctx, pTok.x, pTok.y, rTok, t, { rayAlpha: 0.36, rayLen: 260 });
    }

    /* Titoli in alto con blur in entrata -> nitido */
    disegnaTestoMosso(ctx, 'EVERY EMPTY CHEST', 540, 420, mBlur, cl(0.3 + uBlurIn * 0.7), fmtFont(F_COND, 96), '#f5f3ec', 'center', 'rgba(10,12,18,0.7)', 8);
    if (tl >= 0.74) {
      const uSub = ss5(inv(0.74, 1.00, tl));
      disegnaTestoMosso(ctx, 'IS A STEP UP.', 540, 526, (1 - uSub) * 18, uSub, fmtFont(F_COND, 96), '#ffd97b', 'center', 'rgba(10,12,18,0.72)', 8);
    }
    return;
  }

  /* ---- SCENA 5 (9.033 - 10.567 s): I failed / X / learned / where the token isn't. ---- */
  if (scIdx === 5) {
    dim(0.48);
    disegnaConoLuce(ctx, 790, -40, 280, 540, 1940, 560, 'rgba(245, 240, 232, 0.14)', 'rgba(200, 195, 190, 0.02)');

    const uBlurIn = ss5(inv(0.02, 0.34, tl));
    const uMoveUp = ss5(inv(0.75, 1.06, tl));
    const uScale = ss5(inv(1.10, 1.50, tl));
    const yFail = lerp(930, 825, uMoveUp);

    ctx.save();
    ctx.translate(540, 960);
    ctx.scale(lerp(1.0, 0.92, uScale), lerp(1.0, 0.92, uScale));
    ctx.translate(-540, -960);

    disegnaTestoMosso(ctx, 'I failed', 540, yFail, (1 - uBlurIn) * 28, uBlurIn, fmtFont(F_SANS, 96), '#ffffff', 'center', 'rgba(10,12,18,0.5)', 5);

    /* X rossa sopra failed con due tratti diagonali indipendenti */
    const uX1 = ss5(inv(0.40, 0.56, tl));
    const uX2 = ss5(inv(0.50, 0.66, tl));
    if (uX1 > 0) {
      ctx.save();
      ctx.strokeStyle = '#d93232';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(435, yFail - 46);
      ctx.lineTo(lerp(435, 705, uX1), lerp(yFail - 46, yFail + 46, uX1));
      if (uX2 > 0) {
        ctx.moveTo(705, yFail - 46);
        ctx.lineTo(lerp(705, 435, uX2), lerp(yFail - 46, yFail + 46, uX2));
      }
      ctx.stroke();
      ctx.restore();
    }

    /* learned scritto progressivamente in rosso sotto */
    if (tl >= 0.78) {
      const uLearn = ss(inv(0.78, 1.22, tl));
      const fullW = 'learned';
      const subW = fullW.slice(0, Math.max(1, Math.round(uLearn * fullW.length)));
      ctx.save();
      ctx.font = fmtFont(F_SANS, 96);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#d93232';
      ctx.fillText(subW, 435, 955);
      ctx.restore();
    }

    /* where the token isn't. con "token" in oro */
    if (tl >= 1.15) {
      const uWhere = ss5(inv(1.15, 1.44, tl));
      ctx.save();
      ctx.globalAlpha = uWhere;
      ctx.font = fmtFont(F_SANS, 52);
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      const p1 = 'where the ', p2 = 'token', p3 = " isn't.";
      const w1 = ctx.measureText(p1).width, w2 = ctx.measureText(p2).width, w3 = ctx.measureText(p3).width;
      const x0 = 540 - (w1 + w2 + w3) * 0.5;
      ctx.fillStyle = '#e8e6e0';
      ctx.fillText(p1, x0, 1072);
      ctx.fillStyle = '#ffd97b';
      ctx.fillText(p2, x0 + w1, 1072);
      ctx.fillStyle = '#e8e6e0';
      ctx.fillText(p3, x0 + w1 + w2, 1072);
      ctx.restore();
    }

    ctx.restore();
    return;
  }

  /* ---- SCENA 6 (10.567 - 13.500 s): DISTRACTION -> DISTR cade / ACTION -> Gettone su O / focus. ---- */
  if (scIdx === 6) {
    dim(0.52);

    const uIn = ss5(inv(0.02, 0.25, tl));
    const uStrike = ss5(inv(0.56, 0.80, tl));
    const uFall = ss5(inv(0.80, 1.42, tl));
    const uActDim = ss5(inv(1.60, 1.94, tl));

    /* Misura esatta di DISTRACTION e ACTION per centrare la O con precisione */
    ctx.save();
    ctx.font = fmtFont(F_COND, 128);
    const wFull = ctx.measureText('DISTRACTION').width;
    const wPref = ctx.measureText('DISTR').width;
    const wAct = ctx.measureText('ACTION').width;
    const xStartFull = 540 - wFull * 0.5;
    const xStartActCentered = 540 - wAct * 0.5;

    /* Prefisso DISTR + sbarra rossa che poi ruota e cade in basso a sinistra */
    if (uFall < 0.99) {
      const fRot = -uFall * 0.34;
      const fDx = -uFall * 145;
      const fDy = uFall * uFall * 280 + uFall * 50;
      const fAlpha = (1 - ss(inv(0.25, 0.98, uFall))) * uIn;
      if (fAlpha > 0.01) {
        ctx.save();
        ctx.translate(xStartFull + wPref * 0.5 + fDx, 955 + fDy);
        ctx.rotate(fRot);
        disegnaTestoMosso(ctx, 'DISTR', 0, 0, (1 - uIn) * 20 + uFall * 12, fAlpha, fmtFont(F_COND, 128), '#f5f3ec', 'center');
        if (uStrike > 0) {
          ctx.globalAlpha = fAlpha;
          ctx.strokeStyle = '#d93232';
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(-wPref * 0.52, 0);
          ctx.lineTo(lerp(-wPref * 0.52, wPref * 0.52, uStrike), 0);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    /* Suffisso ACTION che scivola al centro e poi si attenua in grigio */
    const xAct = lerp(xStartFull + wPref, xStartActCentered, ss5(inv(0.76, 1.32, tl)));
    const pushFocus = 1 + ss(inv(1.75, 2.85, tl)) * 0.08;

    ctx.save();
    ctx.translate(540, 955);
    ctx.scale(pushFocus, pushFocus);
    ctx.translate(-540, -955);

    const grayV = Math.round(lerp(248, 90, uActDim));
    const actCol = `rgb(${grayV},${grayV},${grayV})`;
    disegnaTestoMosso(ctx, 'ACTION', xAct + wAct * 0.5, 955, (1 - uIn) * 20, uIn, fmtFont(F_COND, 128), actCol, 'center');

    /* Posizione esatta della lettera O in ACTION */
    const wBefO = ctx.measureText('ACTI').width;
    const wO = ctx.measureText('O').width;
    const xO = xAct + wBefO + wO * 0.5;
    if (tl >= 1.56) {
      const uTok = ss5(inv(1.56, 1.94, tl));
      disegnaGettoneOro(ctx, xO, 950, 56 * (0.45 + 0.55 * uTok), t, { alpha: uTok, rayAlpha: 0.36, rayLen: 360 });
    }

    /* "focus." in piccolo serif corsivo sotto */
    if (tl >= 1.72) {
      const uFoc = ss5(inv(1.72, 2.02, tl));
      disegnaTestoMosso(ctx, 'focus.', 540, 1085, (1 - uFoc) * 14, uFoc, fmtFont(F_SERIF_IT, 50), '#e8e6e0', 'center');
    }

    ctx.restore();
    ctx.restore();
    flashConfine(ctx, t, scDa, scA, false, true);
    return;
  }

  /* ---- SCENA 7 (13.500 - 15.767 s): discipline + [ˈdɪs.ə.plɪn] noun + typewriter + gettone dal forziere ---- */
  if (scIdx === 7) {
    dim(0.34);

    /* Cono di luce ambra caldo dall'alto-destra sul forziere d'oro con teschio in basso */
    const pChest = proietta3D(0.35, 0.55, -1.3, cam, T);
    disegnaConoLuce(ctx, 840, -20, 420, pChest.x, pChest.y + 80, 620, 'rgba(255, 206, 108, 0.28)', 'rgba(218, 152, 54, 0.04)');

    /* Scheda dizionario con ingresso rapido dal flash/sfocatura alla massima nitidezza */
    const uCard = ss5(inv(0.08, 0.72, tl));
    const cBlur = (1 - uCard) * 28;
    const xCard = 175;
    disegnaTestoMosso(ctx, 'discipline', xCard, 665, cBlur, uCard, fmtFont(F_SERIF, 106), '#f8f6f0', 'left', 'rgba(10,12,18,0.45)', 4);

    if (tl >= 0.32) {
      const uPhon = ss5(inv(0.32, 0.85, tl));
      disegnaTestoMosso(ctx, '[ˈdɪs.ə.plɪn] noun', xCard + 4, 752, (1 - uPhon) * 16, uPhon, fmtFont(F_SERIF, 44), '#d2d4dc', 'left');
      ctx.save();
      ctx.globalAlpha = uPhon * 0.85;
      ctx.strokeStyle = '#d2d4dc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(xCard + 4, 798);
      ctx.lineTo(lerp(xCard + 4, xCard + 485, uPhon), 798);
      ctx.stroke();
      ctx.restore();
    }

    /* Macchina da scrivere fluida su 2 righe */
    if (tl >= 0.86) {
      const l1 = 'opening one more chest';
      const l2 = 'when you want to quit.';
      const totLen = l1.length + l2.length;
      const uTyp = cl(inv(0.86, 2.08, tl));
      const chCount = Math.floor(uTyp * totLen);
      const s1 = l1.slice(0, Math.min(l1.length, chCount));
      const s2 = chCount > l1.length ? l2.slice(0, chCount - l1.length) : '';
      ctx.save();
      ctx.font = fmtFont(F_SERIF, 48);
      ctx.fillStyle = '#eceae4';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      if (s1) ctx.fillText(s1, xCard + 4, 868);
      if (s2) ctx.fillText(s2, xCard + 4, 932);
      ctx.restore();
    }

    /* Il Gettone d'oro emerge sopra il forziere col teschio */
    if (tl >= 1.72) {
      const uGem = ss5(inv(1.72, 2.18, tl));
      const yGem = lerp(pChest.y - 30, pChest.y - 165, uGem);
      disegnaGettoneOro(ctx, pChest.x, yGem, 38 * (0.4 + 0.6 * uGem), t, { alpha: uGem, rayAlpha: 0.35, rayLen: 210 });
    }

    flashConfine(ctx, t, scDa, scA, true, false);
    return;
  }

  /* ---- SCENA 8 (15.767 - 17.267 s): If I drop, / I drop for the token. con evidenziatore oro ---- */
  if (scIdx === 8) {
    /* Fondo grigio marezzato con morbida fusione ai bordi verso l'ambiente di Rick */
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.drawImage(getMottledCanvas(), 0, 0, 1080, 1920);
    ctx.restore();

    const uEnter = ss5(inv(0.0, 0.36, tl));
    const uPull = ss5(inv(0.0, 1.50, tl));
    const scTxt = lerp(1.06, 0.94, uPull);
    const yOff = lerp(-36, 0, uEnter);
    const outBlur = tl > 1.38 ? ss(inv(1.38, 1.50, tl)) * 12 : 0;

    ctx.save();
    ctx.translate(540, 960 + yOff);
    ctx.scale(scTxt, scTxt);

    const fontQ = fmtFont(F_SERIF, 78);
    ctx.font = fontQ;
    const wLine1 = ctx.measureText('If I drop,').width;
    const wLine2 = ctx.measureText('I drop for the token.').width;

    /* Maschere evidenziatore oro sinistra -> destra su riga 1 e poi riga 2 */
    const uHi1 = ss5(inv(0.50, 0.80, tl));
    const uHi2 = ss5(inv(0.80, 1.18, tl));
    ctx.fillStyle = 'rgba(236, 178, 42, 0.56)';
    if (uHi1 > 0) {
      ctx.fillRect(-wLine1 * 0.52, -96, wLine1 * 1.04 * uHi1, 84);
    }
    if (uHi2 > 0) {
      ctx.fillRect(-wLine2 * 0.52, 8, wLine2 * 1.04 * uHi2, 84);
    }

    /* Testo nero serif centrato */
    disegnaTestoMosso(ctx, 'If I drop,', 0, -54, (1 - uEnter) * 14 + outBlur, 0.96, fontQ, '#121216', 'center');
    disegnaTestoMosso(ctx, 'I drop for the token.', 0, 50, (1 - uEnter) * 14 + outBlur, 0.96, fontQ, '#121216', 'center');

    ctx.restore();
    return;
  }

  /* ---- SCENA 9 (17.267 - 19.500 s): Don't quit. -> sfocato selettivo -> Do it. ---- */
  if (scIdx === 9) {
    dim(0.54);

    const uIn = ss5(inv(0.0, 0.56, tl));
    const uSel = ss5(inv(1.12, 1.72, tl));
    const pushScale = lerp(0.96, 1.06, ss5(inv(0.60, 2.20, tl)));

    const fBig = fmtFont(F_SERIF, 152);
    ctx.save();
    ctx.font = fBig;
    const wDo = ctx.measureText('Do').width;
    const wNt = ctx.measureText("n't").width;
    const wQu = ctx.measureText('qu').width;
    const wIt = ctx.measureText('it').width;
    const xBase = 345;
    const yTop = 875, yBot = 1035;

    ctx.save();
    ctx.translate(540, 955);
    ctx.scale(pushScale, pushScale);
    ctx.translate(-540, -955);

    /* Parte sfocata e attenuata selettivamente: "n't" e "qu" */
    if (uIn > 0.02) {
      if (uSel > 0.02) {
        const bCv = getBlurCanvas();
        const bCtx = bCv.getContext('2d');
        bCtx.clearRect(0, 0, 1080, 1920);
        bCtx.save();
        bCtx.font = fBig;
        bCtx.textAlign = 'left';
        bCtx.textBaseline = 'middle';
        bCtx.fillStyle = '#e8e6e0';
        bCtx.filter = `blur(${(uSel * 9.5).toFixed(1)}px)`;
        bCtx.fillText("n't", xBase + wDo, yTop);
        bCtx.fillText('qu', xBase, yBot);
        bCtx.restore();
        ctx.save();
        ctx.globalAlpha = uIn * lerp(1.0, 0.22, uSel);
        ctx.drawImage(bCv, 0, 0);
        ctx.restore();
      } else {
        disegnaTestoMosso(ctx, "n't", xBase + wDo, yTop, (1 - uIn) * 65, uIn, fBig, '#ffffff', 'left');
        disegnaTestoMosso(ctx, 'qu', xBase, yBot, (1 - uIn) * 65, uIn, fBig, '#ffffff', 'left');
      }

      /* Parte che resta sempre nitidissima e bianca: "Do" e "it" */
      disegnaTestoMosso(ctx, 'Do', xBase, yTop, (1 - uIn) * 65, uIn, fBig, '#ffffff', 'left');
      disegnaTestoMosso(ctx, 'it', xBase + wQu, yBot, (1 - uIn) * 65, uIn, fBig, '#ffffff', 'left');

      /* Il punto finale si accende nel piccolo Gettone d'oro con raggi */
      const xDot = xBase + wQu + wIt + 28, yDot = yBot + 42;
      if (uSel < 0.25) {
        disegnaTestoMosso(ctx, '.', xBase + wQu + wIt, yBot, (1 - uIn) * 40, uIn * (1 - uSel / 0.25), fBig, '#ffffff', 'left');
      }
      if (uIn > 0.5) {
        const dotAlpha = cl((uIn - 0.5) / 0.4);
        const rDot = lerp(5.5, 22, uSel);
        disegnaGettoneOro(ctx, xDot, yDot, rDot, t, { alpha: dotAlpha, rayAlpha: lerp(0.18, 0.42, uSel), rayLen: lerp(95, 260, uSel) });
      }
    }

    ctx.restore();
    ctx.restore();
    flashConfine(ctx, t, scDa, scA, false, true);
    return;
  }

  /* ---- SCENA 10 (19.500 - 21.000 s): THE TOKEN / WON'T FIND ITSELF. + keep searching. ---- */
  if (scIdx === 10) {
    const pTok = proietta3D(0, 4.75, -8.2, cam, T);
    const dist = cam.position.distanceTo(new T.Vector3(0, 4.75, -8.2));
    const tokR = cl(520 / Math.max(4, dist)) * 0.90 + 22;

    disegnaConoLuce(ctx, 540, -20, 180, pTok.x, pTok.y + 820, 1140, 'rgba(255, 224, 145, 0.28)', 'rgba(255, 195, 75, 0.0)');
    disegnaGettoneOro(ctx, pTok.x, pTok.y, tokR, t, { rayAlpha: 0.42, rayLen: 760 });

    /* Particelle dorate 2D su più piani attorno al gettone finale */
    ctx.save();
    for (let i = 0; i < 36; i++) {
      const ang = i * 2.39996 + t * (0.12 + (i % 5) * 0.02);
      const rad = 75 + ((i * 37) % 360) + Math.sin(t * 1.4 + i) * 14;
      const px = pTok.x + Math.cos(ang) * rad * 1.15;
      const py = pTok.y + Math.sin(ang) * rad * 0.72;
      if (py < 320 || py > 1320) continue;
      const pr = 2.2 + (i % 4) * 1.4;
      ctx.globalAlpha = 0.38 + 0.35 * Math.sin(t * 2.2 + i);
      ctx.fillStyle = i % 3 === 0 ? '#ffffff' : '#ffe27a';
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    /* Titolo finale in alto: THE TOKEN / WON'T FIND ITSELF. */
    const uHead = ss5(inv(0.05, 0.44, tl));
    disegnaTestoMosso(ctx, 'THE TOKEN', 540, 412, (1 - uHead) * 28, uHead, fmtFont(F_COND, 92), '#f8f6f0', 'center', 'rgba(10,12,18,0.72)', 8);
    if (tl >= 0.24) {
      const uSub = ss5(inv(0.24, 0.56, tl));
      disegnaTestoMosso(ctx, "WON'T FIND ITSELF.", 540, 506, (1 - uSub) * 24, uSub, fmtFont(F_COND, 92), '#ffd97b', 'center', 'rgba(10,12,18,0.75)', 8);
    }

    /* "keep searching." in corsivo serif chiaro sui gradini bassi della scala */
    if (tl >= 0.74) {
      const uKeep = ss5(inv(0.74, 1.05, tl));
      disegnaTestoMosso(ctx, 'keep searching.', 540, 1238, (1 - uKeep) * 12, uKeep, fmtFont(F_SERIF_IT, 54), '#f2efe6', 'center', 'rgba(16,14,18,0.85)', 6);
    }

    flashConfine(ctx, t, scDa, scA, true, false);
    return;
  }
}

/* ---- COSTRUTTORE DEGLI AMBIENTI 3D NEL MONDO DI RICK ---- */
export async function costruisci(M, D, S, OBJ) {
  const { THREE: T, box, luce, std, emi, dipinto, tex } = M;
  const scIdx = +(new URLSearchParams(window.location.search).get('scena') || 0);
  const sc = (S.scene && S.scene[scIdx]) || {};
  const scDa = sc.da || 0;
  const scA = sc.a || (scDa + 2);

  /* Intercetta window.renderFrame prima di storia_disegnato.js per sovrapporre la grafica nitida sopra al 3D */
  let _origRF = null, _wrappedRF = null;
  const compCv = document.createElement('canvas');
  compCv.width = 1080; compCv.height = 1920;
  const compCtx = compCv.getContext('2d');
  const sharedState = { attRef: null };
  Object.defineProperty(window, 'renderFrame', {
    configurable: true,
    enumerable: true,
    get() { return _wrappedRF; },
    set(fn) {
      _origRF = fn;
      _wrappedRF = async (f, N, fps = 30) => {
        const r = await _origRF(f, N, fps);
        const src = window.mossoCanvas || renderer.domElement;
        compCtx.clearRect(0, 0, 1080, 1920);
        compCtx.drawImage(src, 0, 0, 1080, 1920);
        disegnaGraficaScena(compCtx, scIdx, f, fps, scDa, scA, T, camera, sharedState);
        window.mossoCanvas = compCv;
        return r;
      };
    }
  });

  /* Helper locali per materiali, volumi, noInk su griglie fitte e oggetti vivi stile Rick */
  const mat = (col, rough = 0.82, met = 0.08, emCol = null, emInt = 0.20) => {
    const m = std(col, rough, met);
    m.emissive.set(emCol || col);
    m.emissiveIntensity = emInt;
    return m;
  };
  const sm = (w, h, d, m, x, y, z, nome, noInk = false) => {
    const o = box(w, h, d, m, x, y, z);
    o.name = nome;
    if (noInk) o.userData.noInk = true;
    return o;
  };
  const setStr = o => {
    o.userData.struttura = 1;
    if (o.traverse) o.traverse(c => { c.userData.struttura = 1; });
    return o;
  };
  const addGrp = (x, y, z, nome) => {
    const g = new T.Group();
    g.position.set(x, y, z);
    g.name = nome;
    M.root.add(g);
    return g;
  };
  const live = (o, tipo, opt = {}) => {
    o.userData.vivo = tipo;
    M.vita.aggiungi(o, tipo, opt);
    return o;
  };
  const noInkTree = o => {
    o.traverse(c => { if (c.isMesh) c.userData.noInk = true; });
    return o;
  };

  /* Costruisce la stanza chiusa (4 pareti, pavimento, soffitto: vuotoDietroIlSet = 0%) */
  function stanzaChiusa(w, h, d, wallCol, floorCol, ceilCol, trimCol, zMid = -1.5) {
    setStr(sm(w + 0.4, 0.25, d + 0.4, mat(floorCol, 0.88, 0.04, floorCol, 0.16), 0, -0.125, zMid, 'pavimento_sala', true));
    setStr(sm(w + 0.4, 0.25, d + 0.4, mat(ceilCol, 0.92, 0.02, ceilCol, 0.14), 0, h + 0.125, zMid, 'soffitto_sala', true));
    setStr(sm(w + 0.4, h + 0.2, 0.25, mat(wallCol, 0.88, 0.04, wallCol, 0.18), 0, h / 2, zMid - d / 2, 'parete_fondo', true));
    setStr(sm(w + 0.4, h + 0.2, 0.25, mat(wallCol, 0.88, 0.04, wallCol, 0.18), 0, h / 2, zMid + d / 2, 'parete_dietro', true));
    setStr(sm(0.25, h + 0.2, d + 0.4, mat(wallCol, 0.88, 0.04, wallCol, 0.18), -w / 2, h / 2, zMid, 'parete_sinistra', true));
    setStr(sm(0.25, h + 0.2, d + 0.4, mat(wallCol, 0.88, 0.04, wallCol, 0.18), w / 2, h / 2, zMid, 'parete_destra', true));
    setStr(sm(w, 0.45, 0.08, mat(trimCol, 0.72, 0.08, trimCol, 0.16), 0, 0.225, zMid - d / 2 + 0.14, 'zoccolatura_fondo', true));
    setStr(sm(0.08, 0.45, d, mat(trimCol, 0.72, 0.08, trimCol, 0.16), -w / 2 + 0.14, 0.225, zMid, 'zoccolatura_sx', true));
    setStr(sm(0.08, 0.45, d, mat(trimCol, 0.72, 0.08, trimCol, 0.16), w / 2 - 0.14, 0.225, zMid, 'zoccolatura_dx', true));
  }

  /* Forziere stile Rick (argento o oro con fregio teschio opzionale) */
  function creaForziere(x, y, z, s = 1, oro = false, aperto = false, teschio = false, nome = 'forziere') {
    const g = addGrp(x, y, z, nome);
    const mBody = mat(oro ? '#d9a432' : '#8b929e', 0.42, oro ? 0.55 : 0.35, oro ? '#b87c18' : '#525866', oro ? 0.26 : 0.18);
    const mTrim = mat(oro ? '#ffd97b' : '#bfc6d2', 0.32, 0.6, oro ? '#ffd97b' : '#8e95a4', 0.25);
    const base = new T.Mesh(new T.BoxGeometry(0.95 * s, 0.52 * s, 0.62 * s), mBody);
    base.position.y = 0.26 * s;
    g.add(base);
    for (const bx of [-0.36 * s, 0.36 * s]) {
      const band = new T.Mesh(new T.BoxGeometry(0.09 * s, 0.55 * s, 0.65 * s), mTrim);
      band.position.set(bx, 0.27 * s, 0);
      g.add(band);
    }
    const lid = new T.Mesh(new T.BoxGeometry(0.96 * s, 0.24 * s, 0.64 * s), mBody);
    if (aperto) {
      lid.position.set(0, 0.72 * s, -0.26 * s);
      lid.rotation.x = -0.78;
      const dark = new T.Mesh(new T.BoxGeometry(0.84 * s, 0.06 * s, 0.50 * s), mat('#181a24', 0.9, 0, '#101218', 0.1));
      dark.position.set(0, 0.525 * s, 0);
      g.add(dark);
    } else {
      lid.position.set(0, 0.64 * s, 0);
    }
    g.add(lid);
    if (teschio) {
      const skullTex = tex(128, 128, (c, W, H) => {
        c.fillStyle = '#d49a28'; c.fillRect(0, 0, W, H);
        c.strokeStyle = '#ffdf78'; c.lineWidth = 8; c.strokeRect(4, 4, W - 8, H - 8);
        c.strokeStyle = '#f8f2e4'; c.lineWidth = 10; c.lineCap = 'round';
        c.beginPath(); c.moveTo(26, 28); c.lineTo(102, 100); c.moveTo(102, 28); c.lineTo(26, 100); c.stroke();
        c.fillStyle = '#f8f2e4';
        c.beginPath(); c.arc(64, 52, 24, 0, TAU); c.fill();
        c.fillRect(48, 66, 32, 22);
        c.fillStyle = '#241812';
        c.beginPath(); c.arc(54, 50, 6, 0, TAU); c.arc(74, 50, 6, 0, TAU); c.fill();
        c.fillRect(58, 74, 3, 10); c.fillRect(64, 74, 3, 10); c.fillRect(70, 74, 3, 10);
      });
      const plaque = new T.Mesh(new T.PlaneGeometry(0.56 * s, 0.44 * s), dipinto(skullTex, 0.35, 0.5));
      plaque.position.set(0, 0.36 * s, 0.32 * s);
      g.add(plaque);
    }
    noInkTree(g);
    return g;
  }

  /* Lanterna pendente animata con luce vera */
  function creaLanterna(x, y, z, col = '#ffcf7a', intens = 3.2, dist = 7, nome = 'lanterna') {
    const g = addGrp(x, y, z, nome);
    const cord = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 0.55, 8), mat('#2d2520', 0.8));
    cord.position.y = -0.27;
    g.add(cord);
    const cap = new T.Mesh(new T.ConeGeometry(0.22, 0.16, 10), mat('#3a302a', 0.6));
    cap.position.y = -0.52;
    g.add(cap);
    const bulb = new T.Mesh(new T.SphereGeometry(0.11, 14, 10), emi(col, 1.8));
    bulb.position.y = -0.64;
    g.add(bulb);
    if (intens > 0) luce(col, intens, x, y - 0.8, z, dist);
    live(g, 'pendola', { amp: 0.055, freq: 0.34, perno: [x, y, z] });
    noInkTree(g);
    return g;
  }

  /* Gettone 3D galleggiante + fascio luminoso volumetrico */
  function creaGettone3D(x, y, z, r = 0.45, nome = 'gettone_doro') {
    const g = addGrp(x, y, z, nome);
    const rim = new T.Mesh(new T.TorusGeometry(r, r * 0.18, 12, 28), emi('#ffd97b', 1.4));
    const core = new T.Mesh(new T.CylinderGeometry(r * 0.72, r * 0.72, 0.10, 24), emi('#fff2b2', 1.6));
    core.rotation.x = Math.PI / 2;
    g.add(rim, core);
    noInkTree(g);
    live(g, 'galleggia', { amp: 0.03, freq: 0.4, gira: 0.12 });
    return g;
  }

  /* Cono di luce 3D semitrasparente morbido */
  function creaCono3D(x, y, z, rBot = 2.4, h = 6.5, col = '#ffd98a', op = 0.14, rx = 0, rz = 0, nome = 'cono_luce') {
    const m = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide });
    const mesh = new T.Mesh(new T.ConeGeometry(rBot, h, 24, 1, true), m);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, 0, rz);
    mesh.name = nome;
    mesh.userData.noInk = true;
    M.root.add(mesh);
    live(mesh, 'lampeggia', { min: 0.82, freq: 0.30, modo: 'respiro' });
    return mesh;
  }

  /* Pile di libri, stendardi e cristalli attorno alla sala (arricchiscono griglia 3x4, profondità e tinte) */
  function popolaSalaRicca(config = {}) {
    const yBase = config.yBase ?? 0;
    const zBack = config.zBack ?? -5.2;
    const sideX = config.sideX ?? 3.35;
    const colsLibri = ['#b83c36', '#3d6ea8', '#4c8c5c', '#d8a23c', '#885496', '#c8683a'];

    /* Scaffali laterali con libri colorati che respirano leggermente e mappe animate */
    for (const sx of [-1, 1]) {
      const rx = sx * sideX;
      setStr(sm(0.65, 2.6, 3.6, mat('#483428', 0.8, 0.05, '#3a281e', 0.18), rx, yBase + 1.3, -2.5, `scaffale_${sx > 0 ? 'dx' : 'sx'}`, true));
      for (let i = 0; i < 6; i++) {
        const lib = sm(0.28, 0.34 + (i % 3) * 0.08, 0.14, mat(colsLibri[i], 0.65, 0.05, colsLibri[i], 0.22), rx - sx * 0.18, yBase + 1.15 + Math.floor(i / 3) * 0.65, -3.5 + (i % 3) * 0.85, `libro_archivio_${sx > 0 ? 'dx' : 'sx'}_${i}`, true);
        live(lib, 'galleggia', { amp: 0.012, freq: 0.25 + i * 0.03, gira: 0.02 });
      }
      /* Bandiera / stendardo verticale pendente */
      const st = sm(0.06, 1.8, 0.62, mat(sx > 0 ? '#9c342e' : '#2e588c', 0.8, 0.05, sx > 0 ? '#78221e' : '#1e3c62', 0.24), rx - sx * 0.38, yBase + 2.8, -4.1, `stendardo_${sx > 0 ? 'dx' : 'sx'}`, true);
      live(st, 'ondeggia', { amp: 0.04, freq: 0.32 });
    }

    /* Sfera/globo rotante + cristalli ambra + lanterne a destra e sinistra per riempire tutti i piani e le celle */
    for (let i = 0; i < 4; i++) {
      const pz = -4.2 + i * 1.45;
      const sx = i % 2 ? -sideX + 0.55 : sideX - 0.55;
      const orb = new T.Mesh(new T.OctahedronGeometry(0.20, 1), mat(i % 2 ? '#e8b63a' : '#58a8c8', 0.25, 0.4, i % 2 ? '#e8b63a' : '#58a8c8', 0.42));
      orb.position.set(sx, yBase + 1.05 + (i % 2) * 0.6, pz);
      orb.name = `cristallo_luce_${i}`;
      orb.userData.noInk = true;
      M.root.add(orb);
      live(orb, 'gira', { asse: 'y', vel: 0.22 });
    }

    creaForziere(-sideX + 0.9, yBase, zBack + 1.4, 0.75, false, false, false, 'baule_angolare_sx');
    creaForziere(sideX - 0.9, yBase, zBack + 1.4, 0.75, true, true, false, 'baule_angolare_dx');
    creaLanterna(-sideX + 1.1, yBase + 4.4, -2.0, '#ffd080', 3.0, 9, 'lanterna_alta_sx');
    creaLanterna(sideX - 1.1, yBase + 4.4, -2.0, '#ffd080', 3.0, 9, 'lanterna_alta_dx');
    orologio(M, { x: -sideX + 0.36, y: yBase + 3.05, z: -3.2, ry: Math.PI / 2, r: 0.34, ora: '11:45', cornice: '#c9942c' });
    polvere(M, camera, { n: 180, w: 8, h: 5, d: 11, colore: '#ffe4a8', dim: 0.045, op: 0.42 });
  }

  /* ---- COSTRUZIONE DEL MONDO 3D PER OGNI SCENA ---- */
  if (scIdx === 0 || scIdx === 10) {
    /* GRANDE SCALINATA PROSPETTICA NEL MONDO DI RICK */
    stanzaChiusa(11.0, 7.6, 17.5, '#2b2420', '#231e1b', '#1d1a1c', '#4a3525', -2.5);
    luce('#ffd480', 6.5, 0, 5.8, -6.5, 16);
    luce('#ffe4a8', 4.8, 0, 3.2, 2.5, 14);
    luce('#b8c4e0', 2.4, -3.6, 2.4, 1.0, 12);

    /* 32 gradini alternati crema/ardesia senza contorno (zero sfarfallio quando la camera arretra) */
    const nSteps = 32;
    for (let i = 0; i < nSteps; i++) {
      const u = i / (nSteps - 1);
      const sz = lerp(4.2, -7.8, u);
      const sy = u * 4.2;
      const stepW = lerp(3.4, 2.2, u * 0.35);
      const lightStep = i % 2 === 0;
      const col = lightStep ? '#dfd7c6' : '#58555c';
      setStr(sm(stepW, 0.145, 0.40, mat(col, 0.78, 0.05, col, lightStep ? 0.32 : 0.18), 0, sy, sz, `gradino_scala_${i}`, true));
    }

    /* Altare e Gettone sacro in cima alla scala */
    sm(2.4, 0.45, 1.2, mat('#66564a', 0.6, 0.1, '#483c34', 0.25), 0, 4.02, -8.3, 'piedistallo_cima', true);
    OBJ.gettone_apex = creaGettone3D(0, 4.75, -8.2, 0.56, 'gettone_cima');
    creaCono3D(0, 4.2, -7.5, 3.1, 7.4, '#ffd980', 0.12, 0, 0, 'fascio_scala');

    /* Pilastri, lanterne, forzieri laterali e archi del mondo di Rick ai lati della scala */
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const pz = 2.6 - i * 3.1;
        const px = sx * 3.45;
        sm(0.45, 6.8, 0.45, mat('#3d322c', 0.85, 0.05, '#2b231f', 0.2), px, 3.4, pz, `pilastro_scala_${sx > 0 ? 'dx' : 'sx'}_${i}`, true);
        creaLanterna(sx * 2.85, 4.9 + i * 0.45, pz + 0.3, '#ffcf78', i < 2 ? 2.4 : 1.6, 8, `lanterna_scala_${sx}_${i}`);
      }
      creaForziere(sx * 2.55, 0.02, 2.2, 0.9, sx > 0, sx < 0, false, `forziere_basso_${sx > 0 ? 'dx' : 'sx'}`);
      creaForziere(sx * 2.25, 2.10, -2.5, 0.82, true, false, false, `forziere_meta_${sx > 0 ? 'dx' : 'sx'}`);
      const stend = sm(0.08, 2.4, 0.72, mat(sx > 0 ? '#c4322e' : '#325a94', 0.7, 0.05, sx > 0 ? '#a82824' : '#24426e', 0.28), sx * 3.1, 4.4, -3.5, `stendardo_scala_${sx > 0 ? 'dx' : 'sx'}`, true);
      live(stend, 'ondeggia', { amp: 0.045, freq: 0.36 });
    }
    cartello(M, { testo: 'VAULT', x: -3.15, y: 3.1, z: -0.6, ry: Math.PI / 2, w: 0.95, h: 0.36, fondo: '#382a24', colore: '#ffd97b', bordo: '#c9942c' });
    polvere(M, camera, { n: 220, w: 8.5, h: 6.5, d: 13.5, colore: '#ffe394', dim: 0.05, op: 0.48 });

    /* Posiziona l'attore Rick esattamente sull'altezza del gradino su cui cammina */
    M.tick.push(() => {
      for (const child of M.root.children) {
        if (child.userData && child.userData.card && child.visible) {
          const u = cl((4.2 - child.position.z) / 12.0);
          child.position.y = u * 4.2 + 0.05;
        }
      }
    });
  } else if (scIdx === 3) {
    /* GALLERIA DEI TRE FORZIERI (A BAD START ISN'T A BAD FINISH.) */
    stanzaChiusa(12.0, 6.2, 10.5, '#252838', '#222430', '#1d1f2a', '#42332c', -2.0);
    luce('#ffd498', 5.2, 0.4, 4.2, 2.2, 14);
    luce('#ff6e64', 2.8, -2.3, 2.2, 1.4, 7);
    luce('#ffd860', 4.2, 2.3, 2.6, 1.4, 8);

    /* Linea rossa a sinistra e linea oro a destra sul pavimento 3D */
    setStr(sm(3.0, 0.08, 0.24, emi('#d93232', 1.1), -2.0, 0.04, -0.3, 'linea_rossa_inizio', true));
    setStr(sm(3.8, 0.08, 0.24, emi('#ffd97b', 1.25), 1.5, 0.04, -0.3, 'linea_oro_arrivo', true));

    /* Forziere grigio aperto accanto al primo Rick chino */
    creaForziere(-1.50, 0.02, -0.25, 0.66, false, true, false, 'forziere_grigio_vuoto');
    creaForziere(-3.75, 0.02, -2.8, 0.85, false, false, false, 'forziere_retro_sx');
    creaForziere(3.75, 0.02, -2.8, 0.85, true, false, true, 'forziere_retro_dx');
    OBJ.gettone_mano = creaGettone3D(2.35, 2.38, -0.3, 0.34, 'gettone_vittoria');
    popolaSalaRicca({ yBase: 0, zBack: -6.8, sideX: 4.4 });
  } else if (scIdx === 4) {
    /* GRADINATA DIAGONALE DI FORZIERI VUOTI (EVERY EMPTY CHEST IS A STEP UP.) */
    stanzaChiusa(12.0, 6.8, 10.5, '#222634', '#20222e', '#1b1d28', '#3c3028', -1.8);
    luce('#ffe0a0', 5.4, 0.8, 4.8, 2.5, 14);
    luce('#a8b8e0', 2.6, -3.2, 3.0, 1.8, 10);

    for (let i = 0; i < 6; i++) {
      const bx = -3.0 + i * 0.96, by = 0.22 + i * 0.40, bz = -0.3;
      sm(0.88, 0.38, 0.86, mat('#2a2d3a', 0.72, 0.1, '#262936', 0.22), bx, by - 0.19, bz, `gradino_vuoto_${i}`, true);
    }
    const tx = -3.0 + 6 * 0.96, ty = 0.22 + 6 * 0.40, tz = -0.3;
    sm(0.92, 0.38, 0.88, emi('#edeae2', 1.15), tx, ty - 0.19, tz, 'gradino_bianco_cima', true);
    OBJ.gettone_cima = creaGettone3D(tx, ty + 0.72, tz, 0.38, 'gettone_step_up');
    creaCono3D(tx, ty + 1.8, tz, 2.0, 4.6, '#ffd97a', 0.13, 0, 0.15, 'cono_step_up');
    popolaSalaRicca({ yBase: 0, zBack: -6.6, sideX: 4.6 });

    /* Regola altezza del personaggio Rick mentre sale i gradini in profilo */
    M.tick.push(() => {
      for (const child of M.root.children) {
        if (child.userData && child.userData.card && child.visible && Math.abs(child.position.z + 0.3) < 0.8) {
          const stepU = (child.position.x + 3.0) / 0.96;
          const idx = Math.round(stepU);
          const frac = stepU - idx;
          const baseH = 0.22 + Math.max(0, Math.min(6, idx)) * 0.40;
          const arc = Math.max(0, Math.cos(frac * Math.PI)) * 0.04;
          child.position.y = baseH + arc;
        }
      }
    });
  } else if (scIdx === 7) {
    /* CRIPTA DEL TESORO D'ORO CON TESCHIO (DISCIPLINE) */
    stanzaChiusa(9.6, 6.2, 9.6, '#26201c', '#211c19', '#1c1816', '#4a3626', -1.8);
    luce('#ffcf78', 5.8, 1.4, 4.6, 1.2, 13);
    luce('#9cb0d8', 2.2, -2.8, 2.6, 1.5, 9);

    sm(1.6, 0.16, 1.4, mat('#4e3c30', 0.7, 0.08, '#3b2c22', 0.2), 0.35, 0.08, -1.3, 'pedana_tesoro', true);
    OBJ.forziere_teschio = creaForziere(0.35, 0.16, -1.3, 0.92, true, false, true, 'forziere_doro_teschio');
    OBJ.gettone_teschio = creaGettone3D(0.35, 1.35, -1.3, 0.28, 'gettone_cripta');
    creaCono3D(1.1, 2.8, -1.3, 2.3, 5.8, '#ffca66', 0.16, 0, 0.28, 'cono_ambra_cripta');
    popolaSalaRicca({ yBase: 0, zBack: -6.2, sideX: 3.65 });
  } else {
    /* SALE DEL BIVIO, TEMPO, PROVE, AZIONE, MARMO E SVOLTA (SCENE 1, 2, 5, 6, 8, 9) */
    const palettes = {
      1: ['#24293d', '#20222f', '#1c1f2e', '#443528'],
      2: ['#282436', '#211e2b', '#1b1925', '#4a3826'],
      5: ['#242834', '#1f222c', '#1a1d26', '#423228'],
      6: ['#262838', '#20222d', '#1c1d28', '#483624'],
      8: ['#4b4d54', '#383a42', '#30323a', '#55524d'],
      9: ['#222536', '#1e202c', '#191b26', '#463424'],
    };
    const pal = palettes[scIdx] || palettes[1];
    stanzaChiusa(9.0, 5.8, 9.6, pal[0], pal[1], pal[2], pal[3], -1.8);
    luce('#ffd48c', 4.6, 0.2, 4.4, 1.8, 13);
    luce('#a6b8e0', 2.4, -2.5, 2.8, 1.5, 10);

    creaForziere(-2.2, 0.0, -3.4, 0.85, false, true, false, 'forziere_ricerca_sx');
    creaForziere(2.2, 0.0, -3.4, 0.85, true, false, false, 'forziere_ricerca_dx');
    creaCono3D(scIdx === 5 ? 0.9 : -0.8, 2.9, -2.2, 2.4, 6.2, '#ffd994', 0.10, 0, scIdx === 5 ? 0.24 : -0.22, 'fascio_sala');
    creaGettone3D(0, 2.4, -4.4, 0.36, 'gettone_sfondo');
    popolaSalaRicca({ yBase: 0, zBack: -6.2, sideX: 3.5 });
  }
}
