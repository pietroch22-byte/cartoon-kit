// Omino «stile Rick» (prova 11/11, references/ricksclips + rapporto characters.md di mromidev).
// Numeri usati (mediane dai fotogrammi): testa H/W 0,93, cima un po' a punta (n 1,7), mascella piena (n 2,26),
// mento stretto (egg -0,125), un lato più largo (+0,10). Contorno prugna #2a1a26 ~5% W, 3× più spesso in basso-destra (64°).
// Corpo 3,5 teste: busto a fagiolo largo 0,8 W, gambe e braccia = un solo tratto d'inchiostro 0,055 W, mani = punti 0,11 W.
// Occhi a punto ovale 0,09×0,13 distanti 0,26 W e spostati +0,08 W verso dove guarda; niente guance rosa, niente luccichii.
// drawRick(ctx, o): disegna con i piedi in (o.x, o.y), testa larga o.W px.
const INK = '#2a1a26';
const mix = (a, b, t) => {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};

// contorno «superellisse» della testa (o del busto), punti in senso orario
function forma(cx, cy, a, b, { nTop = 2, nBot = 2, egg = 0, asym = 0, rot = 0, N = 160 } = {}) {
  const P = [], cr = Math.cos(rot), sr = Math.sin(rot);
  for (let i = 0; i < N; i++) {
    const t = i / N * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), n = s < 0 ? nTop : nBot;
    let X = Math.sign(c) * Math.abs(c) ** (2 / n), Y = Math.sign(s) * Math.abs(s) ** (2 / n);
    X *= (1 + egg * Y) * (1 + asym * Math.sign(X)); const x = a * X, y = b * Y;
    P.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
  }
  return P;
}
const path = P => { const p = new Path2D(); P.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; };
// spessore del contorno secondo la direzione: sottile in alto (0,65), pieno in basso a destra (picco a 64°), rapporto ~3
function peso(ang, luce) { const picco = (luce < 0 ? 64 : 116) * Math.PI / 180; const d = Math.cos(ang - picco); return 0.55 + 0.45 * Math.max(0, d) ** 1.3 * 2.2 - 0.0; }
// riempie la forma e ci mette sopra un contorno a spessore variabile (anello tra contorno esterno e interno)
function inchiostra(g, P, cx, cy, w, fill, luce) {
  const out = [], inn = [];
  P.forEach(([x, y], i) => {
    const [x0, y0] = P[(i + P.length - 1) % P.length], [x1, y1] = P[(i + 1) % P.length];
    let nx = y1 - y0, ny = -(x1 - x0); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    if ((x - cx) * nx + (y - cy) * ny < 0) { nx = -nx; ny = -ny; }
    const k = w * peso(Math.atan2(y - cy, x - cx), luce); out.push([x + nx * k * 0.5, y + ny * k * 0.5]); inn.push([x - nx * k * 0.5, y - ny * k * 0.5]);
  });
  g.fillStyle = INK; g.fill(path(out));
  const pi = path(inn); if (typeof fill === 'function') fill(pi); else { g.fillStyle = fill; g.fill(pi); }
  return pi;
}
// mezzaluna d'ombra morbida sul lato lontano dalla luce (piatto fino a 0,6 R, poi scende a ×0,89, tinta lavanda)
function ombra(g, clip, cx, cy, R, base, luce, tinta = [0.92, 0.9, 0.96]) {
  const p = [1, 3, 5].map(i => parseInt(base.slice(i, i + 2), 16)), sh = 'rgb(' + p.map((v, i) => Math.round(v * tinta[i])).join(',') + ')';
  g.save(); g.clip(clip); g.fillStyle = base; g.fill(clip);
  const gr = g.createRadialGradient(cx + luce * R * 0.28, cy - R * 0.25, R * 0.62, cx + luce * R * 0.28, cy - R * 0.25, R * 1.05);
  gr.addColorStop(0, base); gr.addColorStop(1, sh); g.fillStyle = gr; g.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4); g.restore();
}
const tratto = (g, pts, w, col = INK) => {
  g.beginPath(); g.moveTo(...pts[0]);
  if (pts.length === 3) g.quadraticCurveTo(...pts[1], ...pts[2]); else pts.slice(1).forEach(p => g.lineTo(...p));
  g.lineWidth = w; g.lineCap = g.lineJoin = 'round'; g.strokeStyle = col; g.stroke();
};
const punto = (g, x, y, r, col = INK) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = col; g.fill(); };

// GADGET: il modello è uno solo, i gadget sono varianti. Si scelgono con `accessori: [...]` oppure con `ruolo` (tabella sotto).
// Il generatore della storia mette `ruolo` nel personaggio del JSON in base al copione (impiegato, poliziotto…); senza ruolo = niente gadget.
export const RUOLI = { impiegato: ["cravatta", "cartellino"], manager: ["cravatta"], commesso: ["cartellino"], turista: [], ragazzo: [] };
// drawRick(g, o): un solo modello, si gira e si muove con pochi numeri.
//   verso -1…1: dove guarda rispetto alla camera (0 di fronte, ±0,5 tre quarti, ±1 profilo). Nel motore si calcola dall'angolo
//               camera↔personaggio, così la «carta» non sembra mai piatta: la faccia SCORRE dentro la testa (come nei fotogrammi di Rick),
//               i capelli coprono la nuca, compare il nasino, il busto si stringe, gambe e braccia si avvicinano.
//   passo 0…1: fase della camminata (0 = fermo se `cammina` è falso). Su e giù 4% dell'altezza, più basso quando il piede tocca.
//   faccia: 'neutro'|'felice'|'ghigno'|'triste'|'arrabbiato'|'sorpreso'|'annoiato'|'furbo' — cambia a taglio netto.
//   palpebra 0…1 (sbattere d'occhi), inclina gradi (testa), goccia (sudore), accessori/ruolo (gadget).
// Altezza abbassata in pixel quando seduto (usata anche da storia_disegnato.js per ALTT / occhiDi).
export const POSE_CORPO = new Set(['fermo', 'auto', 'spalle', 'cammina', 'passeggiata', 'fretta', 'corsa', 'soppiatto', 'marcia', 'zoppia', 'seduto', 'seduto_alto', 'seduto_banco', 'fianchi', 'conserte', 'tasca', 'dietro', 'mento', 'dritto', 'teglia', 'vassoio']);
export const GESTI_RICHIAMO_OGG = { telefona: 'telefono', beve: 'tazza', legge: 'giornale', scrive: 'matita', bastone: 'bastone' };

// Parametri biomeccanici delle andature (2D + 3D): vel (m/s default), passoM (lunghezza passo completo in m),
// stride/lift/bob/crouch/armSwing/armLift (frazioni di W), knee/elbow/stFrac (0..1), lean/leanAmp/headNod (gradi).
export const ANDATURE = {
  cammina: { vel: 1.25, passoM: 0.94, stride: 0.42, lift: 0.19, knee: 0.40, bob: 0.075, lean: 3.5, leanAmp: 3.0, armSwing: 0.24, armLift: 0.055, elbow: 0.40, stFrac: 0.56, flight: 0.0, crouch: 0.030, headNod: 1.5 },
  passeggiata: { vel: 0.85, passoM: 0.78, stride: 0.31, lift: 0.12, knee: 0.25, bob: 0.045, lean: 0.5, leanAmp: 1.5, armSwing: 0.16, armLift: 0.025, elbow: 0.22, stFrac: 0.58, flight: 0.0, crouch: 0.020, headNod: 1.0 },
  fretta: { vel: 1.85, passoM: 1.08, stride: 0.48, lift: 0.24, knee: 0.52, bob: 0.095, lean: 6.5, leanAmp: 3.5, armSwing: 0.30, armLift: 0.115, elbow: 0.72, stFrac: 0.52, flight: 0.0, crouch: 0.040, headNod: 2.5 },
  corsa: { vel: 2.85, passoM: 1.36, stride: 0.52, lift: 0.35, knee: 0.82, bob: 0.130, lean: 10.5, leanAmp: 3.5, armSwing: 0.34, armLift: 0.180, elbow: 0.96, stFrac: 0.32, flight: 0.16, crouch: 0.050, headNod: 3.2 },
  soppiatto: { vel: 0.75, passoM: 0.72, stride: 0.35, lift: 0.29, knee: 0.85, bob: 0.055, lean: 9.5, leanAmp: 2.5, armSwing: 0.20, armLift: 0.130, elbow: 0.88, stFrac: 0.56, flight: 0.0, crouch: 0.155, headNod: 1.8, punta: true },
  marcia: { vel: 1.35, passoM: 0.92, stride: 0.44, lift: 0.31, knee: 0.64, bob: 0.060, lean: -1.5, leanAmp: 2.5, armSwing: 0.34, armLift: 0.140, elbow: 0.28, stFrac: 0.55, flight: 0.0, crouch: 0.025, headNod: 1.5 },
  zoppia: { vel: 0.90, passoM: 0.80, stride: 0.38, lift: 0.18, knee: 0.42, bob: 0.085, lean: 4.5, leanAmp: 5.5, armSwing: 0.22, armLift: 0.055, elbow: 0.42, stFrac: 0.56, flight: 0.0, crouch: 0.045, headNod: 5.5, limp: 0.48 },
};

const HAT_TOP_H = {
  cuoco: [0.36, 0.80], cappello: [0.32, 0.44], fedora: [0.27, 0.38],
  elmetto: [0.64, 0.08], paglia: [0.58, 0.12], berretto: [0.70, 0.06],
  zuccotto: [0.64, 0.06], cuffia_medica: [0.60, 0.06], basco: [0.30, 0.34],
  pompadour: [0.43, 0.28], cresta: [0.48, 0.24], ciuffo: [0.43, 0.20],
  spettinato: [0.44, 0.22], ricci: [0.60, 0.04], chignon: [0.72, 0.02], afro: [0.72, 0.02],
};

export function calcolaWAdattato(o = {}, W0 = o.W || 200) {
  if (o.noAutoFit || !W0) return W0;
  const TS = TESTE[o.testa] || TESTE.tonda, CS = CORPI[o.corpo] || CORPI.fagiolo;
  const y0 = o.y ?? 980, x0 = o.x ?? 256;
  const gambeU = 0.93 * 1.4 * (o.gambe ?? CS.gambe ?? 1);
  const bustoU = 0.93 * 1.1 * (o.alto ?? CS.alto ?? 1);
  const hhU = TS.hw;
  const cap = o.capelliTipo || 'corti';
  const [kh, kw] = HAT_TOP_H[cap] || [0.56, 0.05];
  const topU = gambeU + bustoU + hhU * 0.38 + hhU * kh + kw + 0.06;
  const largoScale = o.largo ?? CS.largo ?? 1;
  const walkLean = o.cammina ? 0.22 : 0.14;
  const hatHalf = (cap === 'cappello' || cap === 'paglia') ? 0.66
    : (cap === 'fedora' || cap === 'elmetto' || cap === 'afro') ? 0.65
      : (cap === 'berretto') ? 0.62
        : 0.56;
  const halfU = Math.max(hatHalf + walkLean, 0.44 * largoScale * 1.15);
  const maxH = Math.max(180, y0 - 20);
  const maxHalfX = Math.max(120, Math.min(x0, 512 - x0) - 10);
  return Math.min(W0, maxH / topU, maxHalfX / halfU);
}

export function sedutoDropPx(o = {}, W_eff = null) {
  const p = o.posa;
  if (p !== 'seduto' && p !== 'seduto_alto' && p !== 'seduto_banco') return 0;
  const W = W_eff || calcolaWAdattato(o, o.W || 270), CS = CORPI[o.corpo] || CORPI.fagiolo;
  const gambe = W * 0.93 * 1.4 * (o.gambe ?? CS.gambe ?? 1);
  return gambe * (p === 'seduto_alto' ? 0.20 : p === 'seduto_banco' ? 0.35 : 0.36);
}

// Selezione deterministica della posa asimmetrica di riposo quando posa è 'auto' o 'fermo'
function posaAuto(o) {
  const p = o.posa;
  if (p && p !== 'auto' && p !== 'fermo' && p !== 'spalle' && POSE_CORPO.has(p)) return p;
  if (p === 'dritto') return 'dritto';
  const r = String(o.ruolo || o.tipo || '').toLowerCase();
  if (/capo|manager|prof|giudic|sceriff|polizi|guardi|dirett/.test(r)) return ((o.seme || 0) % 2) ? 'dietro' : 'fianchi';
  if (/impieg|commess|barist|cuoc|cassier/.test(r)) return ((o.seme || 0) % 2) ? 'tasca' : 'conserte';
  if (/nonn|medic|anzian|saggio/.test(r)) return ((o.seme || 0) % 2) ? 'mento' : 'dietro';
  const lista = ['tasca', 'fianchi', 'conserte', 'tasca', 'mento', 'dietro'];
  return lista[Math.abs(o.seme || 0) % lista.length];
}

// IK analitica a 2 ossa per il gomito, con vettore anatomico preferito per evitare ribaltamenti improvvisi
function gomitoIK(ax, sy, px, py, L1, L2, bend) {
  let dx = px - ax, dy = py - sy, d = Math.hypot(dx, dy) || 1e-4;
  let l1 = L1, l2 = L2;
  if (d > l1 + l2 - 1) { const k = (d + 2) / (l1 + l2); l1 *= k; l2 *= k; }
  else if (d < Math.abs(l1 - l2) + 2) {
    const k = Math.max(0.45, (d + 2) / (Math.abs(l1 - l2) + 2));
    if (d < Math.abs(l1 - l2) + 1) { const mid = (l1 + l2) * 0.5; l1 = Math.max(mid * 0.6, d * 0.65); l2 = Math.max(mid * 0.6, d * 0.65); }
    else { l1 *= k; l2 *= k; }
  }
  const ux = dx / d, uy = dy / d, a = Math.max(-l1 * 0.98, Math.min(l1 * 0.98, (l1 * l1 - l2 * l2 + d * d) / (2 * d)));
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a)), mx = ax + ux * a, my = sy + uy * a;
  const nx = -uy, ny = ux;
  const g1 = [mx + nx * h, my + ny * h], g2 = [mx - nx * h, my - ny * h];
  const bx = bend[0], by = bend[1];
  const dot1 = (g1[0] - mx) * bx + (g1[1] - my) * by;
  const dot2 = (g2[0] - mx) * bx + (g2[1] - my) * by;
  return dot1 >= dot2 ? g1 : g2;
}

const sideIdx = s => (s > 0 ? 1 : 0);
const cl01 = v => Math.max(0, Math.min(1, v));
const ss01 = v => { v = cl01(v); return v * v * (3 - 2 * v); };
// Curva con anticipo opposto, scatto e overshoot smorzato (0 -> ~1.14 -> 1)
function snapOvershoot(u, antFrac = 0.22, peakFrac = 0.56, amp = 0.14) {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  if (u < antFrac) return -0.22 * Math.sin((u / antFrac) * Math.PI);
  if (u < peakFrac) return Math.sin(((u - antFrac) / (peakFrac - antFrac)) * (Math.PI * 0.5)) * (1 + amp);
  const w = (u - peakFrac) / (1 - peakFrac);
  return 1 + amp * Math.cos(w * Math.PI * 1.15) * (1 - ss01(w));
}
function sampGaitLeg(p, G, gaitKey, s) {
  const legStFrac = G.limp ? (s === 1 ? 0.42 : 0.64) : G.stFrac;
  const shift = G.limp ? (s === 1 ? 0 : 0.58) : (s === 1 ? 0 : 0.5);
  const u = (((p + shift) % 1) + 1) % 1;
  const strideMult = G.limp && s === 1 ? 0.44 : 1.0;
  const liftMult = G.limp ? (s === 1 ? 0.48 : 1.15) : 1.0;
  let xNorm, liftNorm = 0, footTilt = 0, isStance = false;
  if (u < legStFrac) {
    isStance = true;
    const w = u / legStFrac;
    xNorm = 1 - 2 * w;
    if (w < 0.14) {
      footTilt = G.punta ? 0.28 : -0.34 * (1 - w / 0.14);
      liftNorm = G.punta ? 0.04 : 0;
    } else if (w < 0.72) {
      footTilt = G.punta ? 0.34 : 0;
      liftNorm = G.punta ? 0.04 : 0;
    } else {
      const k = (w - 0.72) / 0.28;
      footTilt = (G.punta ? 0.34 : 0) + 0.52 * ss01(k);
      liftNorm = (G.punta ? 0.04 : 0) + 0.12 * k * k;
    }
  } else {
    const v = (u - legStFrac) / Math.max(0.05, 1 - legStFrac);
    const vPow = gaitKey === 'corsa' ? Math.pow(v, 0.85) : gaitKey === 'marcia' ? Math.pow(v, 0.82) : Math.pow(v, 0.90);
    xNorm = -Math.cos(vPow * Math.PI);
    if (gaitKey === 'corsa') {
      liftNorm = Math.max(0.10 * Math.max(0, 1 - v * 2.4), Math.pow(Math.sin(Math.pow(v, 0.65) * Math.PI), 0.72));
      footTilt = v < 0.52 ? 0.58 * (1 - v / 0.52) : -0.28 * Math.sin(((v - 0.52) / 0.48) * Math.PI * 0.72);
    } else if (gaitKey === 'soppiatto') {
      liftNorm = Math.pow(Math.sin(Math.pow(v, 0.95) * Math.PI), 0.70);
      footTilt = 0.20 + 0.38 * Math.sin(v * Math.PI);
    } else {
      liftNorm = Math.pow(Math.sin(Math.pow(v, 0.86) * Math.PI), gaitKey === 'marcia' ? 0.75 : 0.88);
      footTilt = v < 0.52 ? 0.46 * (1 - v / 0.52) : -0.34 * ss01((v - 0.56) / 0.44);
    }
  }
  return { xNorm, liftNorm, footTilt, isStance, strideMult, liftMult };
}

// Calcola la posa biomeccanica completa di andatura (fasi asimmetriche appoggio/volo, contrapposto, bacino, busto, testa, gambe)
function calcolaCinematica(o, W, HH, gambe, bustoScale, largoScale, sa, ca, dir, sedDrop) {
  const posaNome = o.posa;
  const gaitKey = (o.andatura && ANDATURE[o.andatura]) ? o.andatura : (o.corsa ? 'corsa' : (posaNome && ANDATURE[posaNome] ? posaNome : 'cammina'));
  const inMov = Boolean(!sedDrop && (o.cammina === true || (o.cammina === undefined && (o.corsa || (posaNome && ANDATURE[posaNome] && posaNome !== 'cammina')))));
  const G = inMov ? (ANDATURE[gaitKey] || ANDATURE.cammina) : null;
  const p = (((o.passo || 0) % 1) + 1) % 1;
  const ph = p * Math.PI * 2;
  const sw = inMov ? Math.sin(ph) : 0;
  const hx0 = W * 0.15 * Math.min(1.6, largoScale);
  const legRest = gambe + HH * 0.08;
  const legScale = Math.max(0.62, Math.min(1.25, gambe / (W * 0.93 * 1.4 || 1)));
  const turnVel = o.turnVel || 0;

  const legs = {};
  if (!inMov) {
    const antK = (o.anticipo && o.anticipo.k) || 0;
    const antP = (o.anticipo && o.anticipo.p) ?? (antK > 0 ? 0.5 : 0);
    const setK = (o.assestamento && o.assestamento.k) || 0;
    const setU = (o.assestamento && o.assestamento.u) ?? (Math.abs(setK) > 0 ? 0.25 : 0);
    const crouchSet = setK !== 0 ? Math.sin(Math.min(1, setU / 0.75) * Math.PI) * Math.exp(-setU * 2.2) : 0;
    const bobPx = -(antK * 0.15 + crouchSet * 0.12) * W + Math.max(0, -setK) * 0.03 * W;
    const kneeBendPx = (antK * 0.15 + crouchSet * 0.12) * W;
    const antLean = antK > 0.01 ? (antP < 0.65 ? -Math.sin((antP / 0.65) * (Math.PI / 2)) * 12 : -12 + ((antP - 0.65) / 0.35) * 19) : 0;
    const wSide = ((o.seme || 0) % 2) ? 1 : -1;
    const contrK = (sedDrop || posaNome === 'dritto' || posaNome === 'spalle') ? 0 : Math.max(0, 1 - antK * 1.8);
    // Contrapposto asimmetrico in piedi + caricamento della gamba d'appoggio in anticipo/assestamento
    const hipSwayX = contrK * wSide * W * 0.026 * ca - sa * antK * W * 0.045;
    const hipTiltPx = contrK * wSide * W * 0.014 * ca;
    const leanDeg = sa * (antLean + setK * 11) + contrK * (-wSide) * 1.6 * ca;
    const headDeg = sa * (-antLean * 0.58 - setK * 5.0) + contrK * wSide * 1.8 * ca - turnVel * 8;
    const squashK = Math.max(-0.045, Math.min(0.045, -antK * 0.04 - crouchSet * 0.035));
    const lagY = -antK * W * 0.025 + crouchSet * W * 0.035;
    const lagX = -dir * antK * W * 0.055 * Math.abs(sa) + dir * setK * W * 0.05 * Math.abs(sa) - turnVel * W * 0.16;
    [-1, 1].forEach(s => {
      const isWeight = s === wSide;
      const strideContr = !isWeight ? (posaNome === 'fianchi' ? 0.11 : 0.085) * W * (0.45 + 0.55 * Math.abs(sa)) : -0.025 * W * Math.abs(sa);
      const xNormAnt = (s === dir ? -0.34 : 0.24) * antK;
      const xNormSet = (s === dir ? 0.28 : -0.22) * Math.max(0, 1 - setU * 1.35) * Math.min(1, Math.abs(setK) * 1.8);
      const strideIdle = (contrK * strideContr) + (antK > 0.02 ? xNormAnt * W * 0.22 : 0) + (Math.abs(setK) > 0.02 ? xNormSet * W * 0.20 : 0);
      const kneeFlex = contrK * (!isWeight ? W * 0.038 : 0);
      legs[s] = {
        xNorm: antK > 0.02 ? xNormAnt : xNormSet,
        liftNorm: 0,
        liftPx: antK * (s !== dir ? W * 0.035 : 0),
        footTilt: contrK * (!isWeight ? 0.08 : 0) + antK * (s === dir ? 0.18 : -0.14),
        stridePx: strideIdle,
        kneeFlex,
        isStance: true,
      };
    });
    return {
      inMov: false, gaitKey: null, G: null, p, ph, sw: 0,
      bobPx, kneeBendPx, leanDeg, headDeg, legs, hx0, legRest, legScale,
      hipSwayX, hipTiltPx, twistSa: -turnVel * 0.35, squashY: squashK, lagX, lagY,
    };
  }

  const absSa = Math.abs(sa);
  [-1, 1].forEach(s => {
    const resL = sampGaitLeg(p, G, gaitKey, s);
    const stridePx = (G.stride * legScale * resL.strideMult * (0.16 * ca + absSa)) * W;
    const liftPx = resL.liftNorm * (G.lift * resL.liftMult * (0.42 + 0.58 * legScale)) * W;
    legs[s] = { xNorm: resL.xNorm, liftNorm: resL.liftNorm, liftPx, footTilt: resL.footTilt, stridePx, kneeFlex: 0, isStance: resL.isStance };
  });

  // Rimbalzo verticale del bacino + traslazione laterale verso l'appoggio (sway) e leggera torsione spalle (twist)
  const h = (p * 2) % 1;
  let bobPx, bobVel = 0;
  if (gaitKey === 'corsa') {
    bobPx = (-G.crouch + G.bob * (0.5 - 0.5 * Math.cos((h - 0.25) * Math.PI * 2))) * W * (0.45 + 0.55 * legScale);
    bobVel = Math.sin((h - 0.25) * Math.PI * 2) * G.bob;
  } else {
    const passWave = Math.sin(h * Math.PI);
    const limpWave = G.limp ? Math.max(0, Math.sin((p - 0.02) * Math.PI * 2)) : 0;
    const limpDip = -limpWave * W * 0.11;
    bobPx = (-G.crouch + G.bob * Math.pow(passWave, 1.15)) * W * (0.45 + 0.55 * legScale) + limpDip;
    bobVel = Math.cos(h * Math.PI) * G.bob;
  }
  const swayAmp = gaitKey === 'corsa' ? 0.032 : gaitKey === 'marcia' ? 0.055 : 0.048;
  const hipSwayX = -Math.sin(ph) * W * swayAmp * (0.25 + 0.75 * ca);
  const hipTiltPx = Math.sin(ph) * W * 0.020 * (0.3 + 0.7 * ca);
  const twistSa = -Math.cos(ph) * (gaitKey === 'corsa' ? 0.095 : 0.060) * ca * dir;
  const squashY = Math.max(-0.032, Math.min(0.032, bobVel * 0.24));
  const lagY = -bobVel * W * 0.26;
  const lagX = -dir * absSa * W * (G.lean * 0.0045) - turnVel * W * 0.16;

  // Inclinazione ciclica del busto + contro-bilanciamento elastico della testa (con leggero ritardo)
  const leanOsc = gaitKey === 'corsa' ? (0.5 + 0.5 * Math.cos((h - 0.15) * Math.PI * 2)) : (0.5 + 0.5 * Math.cos(h * Math.PI * 2));
  const explicitLean = o.torsoPiega ?? o.chino ?? 0;
  const leanScale = (1 - Math.min(0.7, Math.abs(explicitLean) / 30)) * Math.min(1, 1.15 / Math.max(0.7, bustoScale));
  const limpLean = G.limp ? Math.max(0, Math.sin((p - 0.02) * Math.PI * 2)) * 5.0 : 0;
  const leanDeg = sa * (G.lean + G.leanAmp * leanOsc + limpLean) * leanScale;
  const limpNod = G.limp ? Math.max(0, Math.sin((p - 0.02) * Math.PI * 2)) * 7.0 * sa : 0;
  const headDeg = -leanDeg * 0.58 + Math.sin(h * Math.PI * 2 - 0.65) * G.headNod * sa + limpNod - turnVel * 7;

  return {
    inMov: true, gaitKey, G, p, ph, sw,
    bobPx, kneeBendPx: 0, leanDeg, headDeg, legs, hx0, legRest, legScale,
    hipSwayX, hipTiltPx, twistSa, squashY, lagX, lagY,
  };
}

// Calcola target mani/piega/orientamento gomito e oggetto suggerito da posa + gesto + tempo
function calcolaPoseBraccia(o, x, chinY, chinY0, hipY, hcx, hcy, Bw, busto, W, HH, sa, ca, dir, kin, posaCorpo, back = 0) {
  const u = o.gestoT ?? o.t ?? 0;
  const gNome = o.gesto && String(o.gesto).toLowerCase();
  const hy = hipY - busto * 0.05;
  const dom = dir >= 0 ? 1 : -1;
  const absSa = Math.abs(sa);
  const res = {
    pts: [null, null],
    bend: [null, null],
    posaMani: [null, null],
    dietroTorso: [false, false],
    davantiTorso: [false, false],
    inTasca: [false, false],
    torsoPiegaExtra: kin.leanDeg,
    testaExtra: kin.headDeg,
    oggettoAuto: null,
    oggettoMano: o.oggettoMano === 'sinistra' ? -1 : o.oggettoMano === 'destra' ? 1 : dom,
    oggettoExtra: null,
    braccioSopraTesta: false,
  };
  const span = Math.max(Bw * 0.56, W * 0.50);
  const evalIdlePosa = (pNome) => {
    const out = { pts: [null, null], bend: [null, null], posaMani: [null, null], dietroTorso: [false, false], davantiTorso: [false, false], inTasca: [false, false], braccioSopraTesta: false };
    if (pNome === 'seduto' || pNome === 'seduto_alto' || pNome === 'seduto_banco') {
      [-1, 1].forEach(s => {
        const i = sideIdx(s);
        out.pts[i] = [x + s * Bw * (pNome === 'seduto_banco' ? 0.34 : 0.32) * ca + dir * absSa * W * (pNome === 'seduto_banco' ? 0.30 : 0.34), pNome === 'seduto_banco' ? (hipY - busto * 0.22) : (hipY - W * 0.02)];
        out.bend[i] = [s * 0.55 * ca - dir * Math.max(absSa, 0.25) * 0.75, 0.5];
      });
    } else if (pNome === 'fianchi') {
      [-1, 1].forEach(s => {
        const i = sideIdx(s), lat = s * Bw * (0.44 * (0.55 + 0.45 * ca)) - dir * Bw * 0.06 * absSa;
        out.pts[i] = [x + lat, hipY - busto * 0.16];
        out.bend[i] = [s * 0.85 * ca - dir * absSa * 0.65, -0.15];
        out.posaMani[i] = 'presa';
      });
    } else if (pNome === 'conserte') {
      out.pts[0] = [x + Bw * 0.24 * ca + dir * Bw * 0.12 * absSa, hipY - busto * 0.38];
      out.pts[1] = [x - Bw * 0.22 * ca + dir * Bw * 0.20 * absSa, hipY - busto * 0.44];
      out.bend[0] = [-0.85, 0.65];
      out.bend[1] = [0.85, 0.65];
      out.davantiTorso[0] = out.davantiTorso[1] = true;
    } else if (pNome === 'tasca') {
      const tSide = ((o.seme || 0) % 2) ? 1 : -1;
      const ti = sideIdx(tSide), oi = sideIdx(-tSide);
      out.pts[ti] = [x + tSide * Bw * 0.32 * (0.35 + 0.65 * ca) + dir * Bw * 0.08 * absSa, hipY - busto * 0.06];
      out.bend[ti] = [tSide * 0.65 * ca - dir * absSa * 0.72, 0.35];
      out.inTasca[ti] = true;
      out.pts[oi] = [x - tSide * Bw * 0.48 * (0.55 + 0.45 * ca) + dir * Bw * 0.12 * absSa, hy];
      out.bend[oi] = [-tSide * 0.55 * ca - dir * absSa * 0.75, 0.45];
    } else if (pNome === 'dietro') {
      [-1, 1].forEach(s => {
        const i = sideIdx(s);
        out.pts[i] = [x + s * Bw * 0.10 * ca - dir * Bw * 0.20 * absSa, hipY - busto * 0.10];
        out.bend[i] = [s * 0.85 - dir * absSa * 0.55, 0.25];
        out.dietroTorso[i] = true;
      });
    } else if (pNome === 'mento') {
      const mi = sideIdx(dom), oi = sideIdx(-dom);
      out.pts[mi] = [hcx + sa * W * 0.14, Math.max(hcy + HH * 0.50, chinY0 + W * 0.10)];
      out.bend[mi] = [-dom * 0.25, 1.0];
      out.posaMani[mi] = 'pugno';
      out.pts[oi] = [x + dom * span * 0.32 * ca + dir * W * 0.12 * absSa, hipY - busto * 0.34];
      out.bend[oi] = [-dom * 0.8, 0.6];
      out.braccioSopraTesta = true;
    } else {
      [-1, 1].forEach(s => {
        const i = sideIdx(s);
        out.pts[i] = [x + s * span * (0.68 + 0.32 * ca) + dir * W * 0.10 * absSa, hy];
        out.bend[i] = [s * 0.55 * ca - dir * absSa * 0.78, 0.4];
      });
    }
    return out;
  };

  // 1) Base: andatura biomeccanica (overlapping action: mano/avambraccio in ritardo di fase) oppure posa idle/seduto
  if (kin.inMov) {
    const G = kin.G, gk = kin.gaitKey;
    const armLen = busto * 0.89, syA = chinY + busto * 0.25;
    const PEND = {
      passeggiata: [0.28, 0.22, 0.96],
      cammina: [0.52, 0.42, 0.935],
      zoppia: [0.42, 0.32, 0.92],
      fretta: [0.66, 0.52, 0.86],
      marcia: [0.84, 0.64, 0.955],
    };
    const armLag = gk === 'corsa' ? 0.065 : gk === 'passeggiata' ? 0.075 : 0.085;
    [-1, 1].forEach(s => {
      const i = sideIdx(s);
      const legUpper = -kin.legs[s].xNorm;
      const legLag = -sampGaitLeg(kin.p - armLag, G, gk, s).xNorm;   // avambraccio in ritardo (overlapping follow-through)
      const armSw = legUpper * 0.35 + legLag * 0.65;
      const whip = legUpper - legLag;
      const fwd = Math.max(0, armSw), backSw = Math.max(0, -armSw);
      const outArc = (1 - Math.abs(armSw)) * W * 0.036;
      const swingBaseX = x + s * (Math.max(Bw * 0.62, W * 0.48) * ca + outArc * (0.4 + 0.6 * ca));
      let px, py, bendY;
      if (gk === 'corsa') {
        px = swingBaseX + dir * (fwd * 0.48 - backSw * 0.38) * W * (0.14 + 0.86 * absSa);
        py = syA + busto * (0.48 - fwd * 0.25 - backSw * 0.08);
        bendY = (armSw >= 0 ? 0.45 : -0.38) - whip * 0.22;
        res.posaMani[i] = 'pugno';
      } else if (gk === 'soppiatto') {
        px = swingBaseX + dir * (0.38 + armSw * 0.09) * W * (0.20 + 0.80 * absSa);
        py = syA + busto * (0.36 - armSw * 0.07);
        bendY = 0.56;
        res.posaMani[i] = 'aperta';
      } else {
        const [aF, aB, rK] = PEND[gk] || PEND.cammina;
        const reach = armLen * rK;
        const ang = armSw >= 0 ? armSw * aF : armSw * aB;
        px = swingBaseX + Math.sin(ang) * reach * dir * (0.24 + 0.76 * absSa);
        py = syA + Math.cos(ang * (0.40 + 0.60 * absSa)) * reach - Math.max(0, fwd) * W * 0.015;
        bendY = (armSw >= 0 ? 0.42 : 0.14 - backSw * G.elbow * 0.35) - whip * 0.32;
        if (gk === 'marcia') res.posaMani[i] = 'pugno';
      }
      res.pts[i] = [px, py];
      res.bend[i] = [s * 0.62 * (0.25 + 0.75 * ca) - dir * absSa * 0.92, bendY];
    });

    // Oggetto impugnato durante la camminata/corsa (senza gesto): il braccio attivo lo tiene stabile, l'altro oscilla
    if (o.oggetto && !gNome) {
      const tpOgg = String(o.oggetto).toLowerCase();
      const om = res.oggettoMano, oi = sideIdx(om);
      const swDamp = -kin.legs[om].xNorm * W * G.armSwing * dir * (0.25 + 0.75 * absSa);
      if (/valigetta|secchiello|paletta|soldi|banconote|borsa/.test(tpOgg)) {
        res.pts[oi] = [x + om * Bw * 0.44 * (0.38 + 0.62 * ca) + swDamp * 0.24, hy - busto * 0.04];
        res.bend[oi] = [om * 0.75 - dir * absSa * 0.55, 0.30];
      } else if (tpOgg === 'bastone') {
        res.pts[oi] = [x + om * (span * 0.75 + W * 0.08) * (0.45 + 0.55 * ca) + dir * W * 0.20 * absSa + swDamp * 0.3, hipY - busto * 0.14];
        res.bend[oi] = [om * 0.8 - dir * 0.35, 0.35];
      } else {
        res.pts[oi] = [x + om * Bw * 0.34 * ca + dir * W * 0.35 * absSa + swDamp * 0.12, hipY - busto * 0.44];
        res.bend[oi] = [om * 0.82 - dir * absSa * 0.40, 0.56];
      }
      res.posaMani[oi] = 'presa';
    }
  } else {
    const posaIdleEff = (back > 0.42 && posaCorpo === 'mento' && !gNome) ? 'dietro' : posaCorpo;
    const curIdle = evalIdlePosa(posaIdleEff);
    res.pts = curIdle.pts;
    res.bend = curIdle.bend;
    res.posaMani = curIdle.posaMani;
    res.dietroTorso = curIdle.dietroTorso;
    res.davantiTorso = curIdle.davantiTorso;
    res.inTasca = curIdle.inTasca;
    res.braccioSopraTesta = curIdle.braccioSopraTesta;
    if (o.posaPrev && o.posaU !== undefined && o.posaU < 1) {
      const prevIdle = evalIdlePosa(o.posaPrev);
      const kP = snapOvershoot(o.posaU, 0.18, 0.58, 0.10);
      const arcP = Math.sin(cl01(o.posaU) * Math.PI) * W * 0.065;
      [0, 1].forEach(i => {
        if (prevIdle.pts[i] && res.pts[i]) {
          const sSide = i ? 1 : -1;
          res.pts[i] = [
            prevIdle.pts[i][0] + (res.pts[i][0] - prevIdle.pts[i][0]) * kP + sSide * arcP * (0.4 + 0.6 * ca),
            prevIdle.pts[i][1] + (res.pts[i][1] - prevIdle.pts[i][1]) * kP + Math.sin(cl01(o.posaU) * Math.PI) * W * 0.03,
          ];
          if (o.posaU < 0.65) res.inTasca[i] = false;
        }
        if (prevIdle.bend[i] && res.bend[i]) {
          const kb = ss01(o.posaU);
          res.bend[i] = [prevIdle.bend[i][0] + (res.bend[i][0] - prevIdle.bend[i][0]) * kb, prevIdle.bend[i][1] + (res.bend[i][1] - prevIdle.bend[i][1]) * kb];
        }
      });
    }
  }

  // 1a) Posa a due mani per trasportare teglia / vassoio (resta stabile anche camminando, senza oscillare)
  const portaTeglia = Boolean(o.porta || posaCorpo === 'teglia' || posaCorpo === 'vassoio');
  if (portaTeglia && !gNome) {
    const avPx = (o.portaAvanti ?? 0.25) * 512;
    const hwPx = (o.portaLargo ?? 0.30) * 512;
    const cX = x + sa * avPx;
    const bobCarry = kin.inMov ? (-(kin.lagY || 0) * 0.16 + Math.sin(kin.ph * Math.PI * 2) * W * 0.008) : 0;
    const carryY = hipY - busto * 0.20 + bobCarry;
    [-1, 1].forEach(s => {
      const i = sideIdx(s);
      res.pts[i] = [cX + s * hwPx * (0.14 + 0.86 * ca), carryY - s * dir * absSa * W * 0.015];
      res.bend[i] = [s * 0.88 * ca - dir * absSa * 0.72, 0.55];
      res.posaMani[i] = 'presa';
      res.inTasca[i] = false;
      if (back > 0.42) { res.dietroTorso[i] = true; res.davantiTorso[i] = false; }
      else { res.davantiTorso[i] = true; res.dietroTorso[i] = false; }
    });
  }

  // 1b) Anticipo e assestamento sulle braccia da fermo (caricamento prima di scattare / inerzia all'arresto)
  if (!kin.inMov && !gNome && !portaTeglia) {
    const antK = (o.anticipo && o.anticipo.k) || 0;
    const setK = (o.assestamento && o.assestamento.k) || 0;
    if (antK > 0.04) {
      [-1, 1].forEach(s => {
        const i = sideIdx(s), bx0 = res.pts[i] ? res.pts[i][0] : (x + s * span * 0.72);
        const by0 = res.pts[i] ? res.pts[i][1] : hy;
        res.pts[i] = [bx0 * (1 - antK) + (x + s * span * 0.42 * ca - dir * W * (0.34 + 0.24 * antK) * (0.35 + 0.65 * absSa)) * antK, by0 - antK * W * 0.08];
        res.posaMani[i] = 'pugno';
        res.bend[i] = [-dir * 0.85, 0.35];
        res.inTasca[i] = false;
        if (s !== dir) res.dietroTorso[i] = true;
      });
    } else if (Math.abs(setK) > 0.04) {
      [-1, 1].forEach(s => {
        const i = sideIdx(s);
        if (res.pts[i]) res.pts[i] = [res.pts[i][0] + dir * setK * W * 0.22 * (0.25 + 0.75 * absSa), res.pts[i][1] - Math.max(0, setK) * W * 0.06];
      });
    }
  }

  // 2) Sotto-stato di recitazione (o.gesto): helper condiviso anche con uscita morbida o.gestoFine
  const basePts = [res.pts[0], res.pts[1]];
  const baseBend = [res.bend[0], res.bend[1]];
  const applicaGesto = (nome, ut, tgtRes, meta = true) => {
    const act = tgtRes.oggettoMano, actI = sideIdx(act), opp = -act, oppI = sideIdx(opp);
    if (nome === 'telefona') {
      tgtRes.pts[actI] = [hcx + act * W * 0.44 * (0.55 + 0.45 * ca) + sa * W * 0.08, hcy + HH * 0.12];
      tgtRes.bend[actI] = [act * 0.95, 0.3];
      tgtRes.posaMani[actI] = 'presa';
      if (meta) { tgtRes.testaExtra += 4 * dir + Math.sin(ut * 3.0) * 2.5; tgtRes.oggettoAuto = 'telefono'; tgtRes.braccioSopraTesta = true; }
    } else if (nome === 'beve') {
      const sip = 0.5 + 0.5 * Math.sin(ut * 2.2);
      const mxMouth = hcx + sa * W * 0.27;
      tgtRes.pts[actI] = [mxMouth + act * W * (0.28 - 0.08 * sip), hcy + HH * 0.46 - sip * HH * 0.22];
      tgtRes.bend[actI] = [act * 0.95, 0.45];
      tgtRes.posaMani[actI] = 'presa';
      if (meta) { tgtRes.testaExtra += -sip * 8 * dir; tgtRes.oggettoAuto = 'tazza'; tgtRes.braccioSopraTesta = true; }
    } else if (nome === 'scrive') {
      const wx = Math.sin(ut * 9) * W * 0.045, wy = Math.cos(ut * 18) * W * 0.022;
      const padX = x + dir * (span * 0.52 + W * 0.22 * absSa);
      const padY = hipY - busto * 0.34;
      tgtRes.pts[oppI] = [padX - opp * W * 0.04, padY];
      tgtRes.bend[oppI] = [opp * 0.75, 0.65];
      tgtRes.posaMani[oppI] = 'presa';
      tgtRes.pts[actI] = [padX + dir * W * 0.10 + wx, padY - W * 0.07 + wy];
      tgtRes.bend[actI] = [act * 0.85, 0.55];
      tgtRes.posaMani[actI] = 'presa';
      if (meta) { tgtRes.torsoPiegaExtra += 7 * dir; tgtRes.testaExtra += 10 * dir; tgtRes.oggettoAuto = 'matita'; tgtRes.oggettoExtra = { tipo: 'blocco', x: padX, y: padY }; }
    } else if (nome === 'legge') {
      const fX = x + dir * (span * 0.45 + W * 0.22) * absSa, cY = hipY - busto * 0.38;
      tgtRes.pts[0] = [fX - span * 0.50 * (0.55 + 0.45 * ca), cY];
      tgtRes.pts[1] = [fX + span * 0.50 * (0.55 + 0.45 * ca), cY];
      tgtRes.bend[0] = [-0.8, 0.7];
      tgtRes.bend[1] = [0.8, 0.7];
      tgtRes.posaMani[0] = 'presa';
      tgtRes.posaMani[1] = 'presa';
      if (meta) { tgtRes.testaExtra += 10 * dir; tgtRes.oggettoAuto = 'giornale'; }
    } else if (nome === 'manovella' || nome === 'gira') {
      const ang = ut * 6.5, cxM = x + dir * (Bw * 0.5 + W * 0.34), cyM = hipY - busto * 0.42;
      tgtRes.pts[actI] = [cxM + Math.cos(ang) * W * 0.14, cyM + Math.sin(ang) * W * 0.14];
      tgtRes.bend[actI] = [act * 0.8 - dir * 0.4, 0.55];
      tgtRes.posaMani[actI] = 'presa';
      if (meta) tgtRes.torsoPiegaExtra += 6 * dir + Math.sin(ang) * 2.5 * dir;
    } else if (nome === 'spiega' || nome === 'conversa') {
      // Beat espressivo non metronomico: alterna accenti asimmetrici fra mano dominante e supporto
      const b1 = Math.sin(ut * 4.4) * 0.65 + Math.sin(ut * 8.8 - 0.5) * 0.35;
      const b2 = Math.cos(ut * 2.9) * 0.70 + Math.sin(ut * 5.8 + 0.4) * 0.30;
      tgtRes.pts[actI] = [x + act * (span * 0.72 + W * 0.26 * (0.6 + 0.4 * Math.abs(b1))) + dir * W * 0.19 * absSa, hipY - busto * (0.50 + 0.18 * b1)];
      tgtRes.bend[actI] = [act * 0.8 - dir * 0.25, 0.72 - b1 * 0.14];
      tgtRes.posaMani[actI] = 'aperta';
      tgtRes.pts[oppI] = [x + opp * (span * 0.62 + W * 0.15) + dir * W * 0.11 * absSa, hipY - busto * (0.37 + 0.11 * b2)];
      tgtRes.bend[oppI] = [opp * 0.85, 0.66];
      tgtRes.posaMani[oppI] = 'aperta';
      if (meta) { tgtRes.testaExtra += (b1 * 3.8 + b2 * 1.5); tgtRes.torsoPiegaExtra += b1 * 2.2 * dir; }
    } else if (nome === 'pensa') {
      tgtRes.pts[actI] = [hcx + sa * W * 0.14, Math.max(hcy + HH * 0.50, chinY0 + W * 0.10) + Math.sin(ut * 2.0) * W * 0.01];
      tgtRes.bend[actI] = [-act * 0.25, 1.0];
      tgtRes.posaMani[actI] = 'pugno';
      tgtRes.pts[oppI] = [x + act * span * 0.32 * ca, hipY - busto * 0.34];
      tgtRes.bend[oppI] = [opp * 0.8, 0.65];
      if (meta) { tgtRes.testaExtra += -6 * dir; tgtRes.braccioSopraTesta = true; }
    } else if (nome === 'esulta') {
      const pump = Math.sin(ut * 7.5);
      [-1, 1].forEach(s => {
        const i = sideIdx(s), asym = s === 1 ? 0 : 0.4;
        const bobE = Math.sin(ut * 7.5 + asym) * W * 0.06;
        tgtRes.pts[i] = [hcx + s * W * (0.70 + 0.09 * ca + 0.04 * pump), chinY0 - W * 0.26 + bobE];
        tgtRes.bend[i] = [s * 0.82, 0.62 + 0.15 * pump];
        tgtRes.posaMani[i] = 'aperta';
      });
      if (meta) { tgtRes.torsoPiegaExtra += (-5.5 - 2 * Math.abs(pump)) * dir; tgtRes.testaExtra += pump * 3.5; }
    } else if (nome === 'trofeo' || nome === 'coppa') {
      const kLift = ss01(Math.min(1, ut / 0.42));
      const holdPulse = ut > 0.42 ? Math.sin((ut - 0.42) * 3.6) * W * 0.012 : 0;
      const maxLiftY = Math.max(hcy - HH * 0.72, chinY0 - busto * 0.59);
      const cupY = maxLiftY * kLift + (hipY - busto * 0.42) * (1 - kLift) + holdPulse;
      [-1, 1].forEach(s => {
        const i = sideIdx(s);
        tgtRes.pts[i] = [x + s * W * (0.46 + 0.02 * ca), cupY];
        tgtRes.bend[i] = [s * 0.94, 0.28];
        tgtRes.posaMani[i] = 'presa';
        tgtRes.davantiTorso[i] = true;
      });
      if (meta) {
        tgtRes.braccioSopraTesta = true;
      }
    } else if (nome === 'disperato') {
      const j = Math.sin(ut * 6.5) * W * 0.022;
      [-1, 1].forEach(s => {
        const i = sideIdx(s);
        tgtRes.pts[i] = [hcx + s * W * 0.44 * (0.5 + 0.5 * ca) + sa * W * 0.14, hcy + HH * 0.04 + s * j * 0.4 + j];
        tgtRes.bend[i] = [s * 0.85, 0.62];
        tgtRes.posaMani[i] = 'aperta';
      });
      if (meta) { tgtRes.torsoPiegaExtra += 7.5 * dir; tgtRes.testaExtra += Math.sin(ut * 6.5) * 4; tgtRes.braccioSopraTesta = true; }
    } else if (nome === 'applaude') {
      const sep = W * 0.03 + W * 0.14 * (0.5 + 0.5 * Math.cos(ut * 13));
      const cX = x + dir * (Bw * 0.45 + W * 0.20), cY = chinY0 + W * 0.05;
      tgtRes.pts[0] = [cX - sep, cY];
      tgtRes.pts[1] = [cX + sep, cY];
      tgtRes.bend[0] = [-0.9, 0.55];
      tgtRes.bend[1] = [0.9, 0.55];
      tgtRes.posaMani[0] = 'aperta';
      tgtRes.posaMani[1] = 'aperta';
      if (meta) { tgtRes.davantiTorso[0] = tgtRes.davantiTorso[1] = true; tgtRes.braccioSopraTesta = true; }
    } else if (nome === 'bastone') {
      tgtRes.pts[actI] = [x + act * (span * 0.85 + W * 0.12) * (0.55 + 0.45 * ca) + dir * W * 0.20 * absSa, hipY - busto * 0.14];
      tgtRes.bend[actI] = [act * 0.8 - dir * 0.35, 0.35];
      tgtRes.posaMani[actI] = 'presa';
      if (meta) tgtRes.oggettoAuto = 'bastone';
    } else if (nome === 'saluta') {
      const wv = Math.sin(ut * 8.5), elLag = Math.sin(ut * 8.5 - 0.65);
      tgtRes.pts[actI] = [hcx + act * W * 0.72 + wv * W * 0.13, chinY0 - W * 0.23 - Math.cos(ut * 8.5) * W * 0.025];
      tgtRes.bend[actI] = [act * 0.82 + wv * 0.12, 0.62 - elLag * 0.18];
      tgtRes.posaMani[actI] = 'aperta';
      if (meta) { tgtRes.torsoPiegaExtra += -3.2 * act - wv * 1.4; tgtRes.testaExtra += -2.5 * act + elLag * 2.5; }
    } else if (nome === 'indica') {
      const dxReach = span * 1.18 + W * 0.26;
      tgtRes.pts[actI] = [x + (sa !== 0 ? dir : act) * dxReach, hipY - busto * 0.58];
      tgtRes.bend[actI] = [act * 0.5, 0.85];
      tgtRes.posaMani[actI] = 'indica';
      if (meta) { tgtRes.torsoPiegaExtra += 2.8 * dir; tgtRes.testaExtra += -1.5 * dir; }
    }
  };

  if (gNome) {
    applicaGesto(gNome, u, res, true);
    // Entrata con anticipo opposto, arco esterno, overshoot e assestamento (0..0,36 s)
    if (o.gestoAnt !== false && u >= 0 && u < 0.36) {
      const un = u / 0.36;
      const kPose = snapOvershoot(un, 0.25, 0.58, 0.15);
      const kDip = un < 0.25 ? Math.sin((un / 0.25) * Math.PI) : 0;
      const kArc = un > 0.22 && un < 0.75 ? Math.sin(((un - 0.22) / 0.53) * Math.PI) : 0;
      [0, 1].forEach(i => {
        if (res.pts[i] !== basePts[i] && basePts[i] && res.pts[i]) {
          const sSide = i ? 1 : -1;
          const vx = res.pts[i][0] - basePts[i][0], vy = res.pts[i][1] - basePts[i][1];
          const outDir = Math.abs(vx) > W * 0.05 ? Math.sign(vx) : (dir || sSide);
          const tx = basePts[i][0] + vx * kPose + outDir * kArc * W * 0.065;
          const ty = basePts[i][1] + vy * kPose + kDip * W * 0.11;
          res.pts[i] = [tx, ty];
          if (baseBend[i] && res.bend[i]) {
            const kb = ss01(Math.min(1, un / 0.65));
            res.bend[i] = [baseBend[i][0] + (res.bend[i][0] - baseBend[i][0]) * kb, baseBend[i][1] + (res.bend[i][1] - baseBend[i][1]) * kb];
          }
        }
      });
      res.torsoPiegaExtra += -kDip * 3.8 * dir;
      if (un > 0.45 && un < 0.90) {
        const kHeadFollow = Math.sin(((un - 0.45) / 0.45) * Math.PI);
        res.testaExtra += kHeadFollow * 3.2 * dir;
      }
    }
  } else if (o.gestoFine && o.gestoFine.gesto && o.gestoFine.uOut >= 0 && o.gestoFine.uOut < 1) {
    // Ritorno ad arco esterno dal gesto finito verso la posa a riposo (niente taglio sul busto/viso)
    const gf = o.gestoFine, uo = ss01(gf.uOut);
    const outRes = { pts: [basePts[0], basePts[1]], bend: [baseBend[0], baseBend[1]], posaMani: [...res.posaMani], dietroTorso: [...res.dietroTorso], davantiTorso: [...res.davantiTorso], inTasca: [...res.inTasca], torsoPiegaExtra: res.torsoPiegaExtra, testaExtra: res.testaExtra, oggettoAuto: null, oggettoMano: res.oggettoMano, oggettoExtra: null, braccioSopraTesta: false };
    applicaGesto(String(gf.gesto).toLowerCase(), gf.t || 0.6, outRes, false);
    const arcOut = Math.sin(uo * Math.PI) * W;
    [0, 1].forEach(i => {
      if (outRes.pts[i] && basePts[i] && outRes.pts[i] !== basePts[i]) {
        const sSide = i ? 1 : -1;
        res.pts[i] = [
          outRes.pts[i][0] + (basePts[i][0] - outRes.pts[i][0]) * uo + sSide * arcOut * 0.20,
          outRes.pts[i][1] + (basePts[i][1] - outRes.pts[i][1]) * uo + arcOut * 0.04,
        ];
        if (gf.uOut < 0.7) res.inTasca[i] = false;
        if (gf.uOut < 0.45 && outRes.posaMani[i]) res.posaMani[i] = outRes.posaMani[i];
        if (outRes.bend[i] && baseBend[i]) {
          res.bend[i] = [outRes.bend[i][0] + (baseBend[i][0] - outRes.bend[i][0]) * uo, outRes.bend[i][1] + (baseBend[i][1] - outRes.bend[i][1]) * uo];
        }
      }
    });
  }
  // Qualsiasi mano sovrascritta da un gesto o che impugna un oggetto non resta in tasca né nascosta dietro al busto
  [0, 1].forEach(i => {
    if (res.pts[i] !== basePts[i]) {
      res.inTasca[i] = false;
      res.dietroTorso[i] = false;
    }
  });
  if (o.oggetto || res.oggettoAuto) {
    const oi = sideIdx(res.oggettoMano);
    res.inTasca[oi] = false;
    res.dietroTorso[oi] = false;
  }
  // Vista di spalle (`back > 0.42`): inverte la profondità fronte/retro così braccia in avanti vanno dietro al busto e 'dietro' resta visibile
  if (back > 0.42) {
    const posaBackEff = (posaCorpo === 'mento' && !gNome) ? 'dietro' : posaCorpo;
    res.braccioSopraTesta = false;
    if (posaBackEff === 'dietro' && !gNome) {
      res.dietroTorso = [false, false];
      res.davantiTorso = [true, true];
    } else if (portaTeglia && !gNome) {
      res.dietroTorso = [true, true];
      res.davantiTorso = [false, false];
    } else {
      if (kin.inMov) {
        [-1, 1].forEach(s => {
          const i = sideIdx(s);
          const armSw = -kin.legs[s].xNorm;
          if (armSw > 0.08 && Math.abs(ca) > 0.35) res.dietroTorso[i] = true;
          else if (armSw < -0.08) res.davantiTorso[i] = true;
        });
      }
      if (posaCorpo === 'conserte' || posaCorpo === 'mento' || (gNome && /^(conserte|telefona|beve|scrive|legge|applaude|pensa|manovella|gira)$/.test(gNome))) {
        [0, 1].forEach(i => {
          if (res.pts[i] && Math.abs(res.pts[i][0] - x) < Bw * 0.65) {
            res.davantiTorso[i] = false;
            res.dietroTorso[i] = true;
          }
        });
      }
      if (o.oggetto || res.oggettoAuto) {
        const oi = sideIdx(res.oggettoMano);
        if (res.pts[oi] && Math.abs(res.pts[oi][0] - x) < Bw * 0.55) res.dietroTorso[oi] = true;
      }
      if (o.maniPx) {
        [0, 1].forEach(i => {
          const hp = o.maniPx[i];
          if (hp && Math.abs(hp[0] - x) < Bw * 0.55) {
            res.davantiTorso[i] = false;
            res.dietroTorso[i] = true;
          }
        });
      }
    }
  }
  // Mantieni le mani procedurali dentro la tela 512px così i gesti ampi non tagliano i bordi
  if (!o.noAutoFit && !o.maniPx && x >= 180 && x <= 332) {
    const padX = Math.max(46, W * 0.165);
    const minHx = padX, maxHx = 512 - padX;
    [0, 1].forEach(i => {
      if (res.pts[i]) res.pts[i] = [Math.max(minHx, Math.min(maxHx, res.pts[i][0])), res.pts[i][1]];
    });
  }
  return res;
}

// Oggetti disegnati direttamente in mano (prop-socket stile Rick con contorno #2a1a26)
function disegnaOggettoMano(g, tipoOgg, px, py, ux, uy, W, dir, yFloor) {
  if (!tipoOgg) return;
  const tp = String(tipoOgg).toLowerCase();
  const ang = Math.atan2(uy, ux);
  const fillStroke = (pathFn, col, lw = W * 0.024) => {
    const P = new Path2D(); pathFn(P);
    g.fillStyle = col; g.fill(P); g.lineWidth = lw; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke(P);
  };
  if (tp === 'bastone') {
    const topX = px, topY = py - W * 0.03, botY = yFloor - 2, slant = dir * W * 0.04;
    tratto(g, [[topX, topY], [topX + slant, botY]], W * 0.042, '#6a4124');
    tratto(g, [[topX, topY], [topX + slant, botY]], W * 0.016, '#9c663b');
    g.beginPath(); g.arc(topX - dir * W * 0.045, topY + W * 0.02, W * 0.05, Math.PI, Math.PI * 2);
    g.lineWidth = W * 0.042; g.lineCap = 'round'; g.strokeStyle = '#6a4124'; g.stroke();
    return;
  }
  if (tp === 'telefono' || tp === 'cellulare') {
    g.save(); g.translate(px, py); g.rotate(ang + Math.PI * 0.5);
    fillStroke(P => P.roundRect(-W * 0.06, -W * 0.12, W * 0.12, W * 0.22, W * 0.02), '#262834');
    g.fillStyle = '#9fe3ff'; g.fillRect(-W * 0.04, -W * 0.095, W * 0.08, W * 0.16);
    g.restore();
    return;
  }
  if (tp === 'tazza' || tp === 'caffe') {
    const tx = px - dir * W * 0.04, ty = py - W * 0.03;
    g.beginPath(); g.arc(tx + dir * W * 0.08, ty, W * 0.052, 0, Math.PI * 2); g.lineWidth = W * 0.025; g.strokeStyle = INK; g.stroke();
    fillStroke(P => P.roundRect(tx - W * 0.08, ty - W * 0.09, W * 0.16, W * 0.18, W * 0.025), '#fffdf6');
    g.fillStyle = '#4e2f1e'; g.beginPath(); g.ellipse(tx, ty - W * 0.075, W * 0.068, W * 0.022, 0, 0, Math.PI * 2); g.fill();
    return;
  }
  if (tp === 'giornale') {
    fillStroke(P => P.roundRect(px - W * 0.16, py - W * 0.14, W * 0.32, W * 0.24, W * 0.015), '#f2ece0');
    g.fillStyle = '#38303c'; g.fillRect(px - W * 0.13, py - W * 0.11, W * 0.26, W * 0.04);
    for (let k = 0; k < 3; k++) tratto(g, [[px - W * 0.12, py - W * 0.02 + k * W * 0.04], [px + W * 0.12, py - W * 0.02 + k * W * 0.04]], W * 0.014, '#7a7280');
    return;
  }
  if (tp === 'blocco' || tp === 'quaderno' || tp === 'cartella') {
    fillStroke(P => P.roundRect(px - W * 0.11, py - W * 0.14, W * 0.22, W * 0.26, W * 0.018), '#f7dc78');
    g.fillStyle = '#8b95a5'; g.fillRect(px - W * 0.05, py - W * 0.155, W * 0.10, W * 0.035);
    for (let k = 0; k < 4; k++) tratto(g, [[px - W * 0.08, py - W * 0.07 + k * W * 0.045], [px + W * 0.08, py - W * 0.07 + k * W * 0.045]], W * 0.012, '#6280b5');
    return;
  }
  if (tp === 'penna' || tp === 'matita') {
    const len = W * (tp === 'matita' ? 0.26 : 0.20), col = tp === 'matita' ? '#f0b83a' : '#2a4d8f';
    g.save(); g.translate(px, py); g.rotate(ang - 0.35);
    fillStroke(P => P.rect(-len * 0.3, -W * 0.022, len, W * 0.044), col, W * 0.018);
    if (tp === 'matita') {
      fillStroke(P => { P.moveTo(len * 0.7, -W * 0.022); P.lineTo(len * 0.88, 0); P.lineTo(len * 0.7, W * 0.022); P.closePath(); }, '#f2d3a8', W * 0.016);
      punto(g, len * 0.86, 0, W * 0.012);
      fillStroke(P => P.rect(-len * 0.36, -W * 0.022, W * 0.06, W * 0.044), '#e88b98', W * 0.014);
    }
    g.restore();
    return;
  }
  if (tp === 'valigetta') {
    const vx = px, vy = py + W * 0.05;
    g.beginPath(); g.arc(vx, vy - W * 0.02, W * 0.055, Math.PI, Math.PI * 2); g.lineWidth = W * 0.025; g.strokeStyle = INK; g.stroke();
    fillStroke(P => P.roundRect(vx - W * 0.18, vy, W * 0.36, W * 0.24, W * 0.025), '#7a492c');
    g.fillStyle = '#e5bd4a'; g.fillRect(vx - W * 0.03, vy + W * 0.02, W * 0.06, W * 0.04);
    return;
  }
  if (tp === 'soldi' || tp === 'banconote') {
    [-0.22, 0.05].forEach(r => {
      g.save(); g.translate(px, py - W * 0.04); g.rotate(r);
      fillStroke(P => P.roundRect(-W * 0.11, -W * 0.05, W * 0.22, W * 0.10, W * 0.012), '#7ec46f', W * 0.018);
      g.fillStyle = '#3b7335'; g.fillRect(-W * 0.025, -W * 0.05, W * 0.05, W * 0.10);
      g.restore();
    });
    return;
  }
  if (tp === 'martello' || tp === 'martelletto') {
    g.save(); g.translate(px, py); g.rotate(ang);
    fillStroke(P => P.rect(-W * 0.04, -W * 0.02, W * 0.24, W * 0.04), '#9e683b', W * 0.018);
    fillStroke(P => P.roundRect(W * 0.15, -W * 0.09, W * 0.09, W * 0.18, W * 0.02), '#6a3c22', W * 0.022);
    g.restore();
    return;
  }
  if (tp === 'lente') {
    g.save(); g.translate(px, py); g.rotate(ang - 0.3);
    tratto(g, [[0, 0], [W * 0.14, 0]], W * 0.035, '#7c4e2d');
    g.beginPath(); g.arc(W * 0.21, 0, W * 0.08, 0, Math.PI * 2); g.fillStyle = 'rgba(180,235,255,0.68)'; g.fill();
    g.lineWidth = W * 0.026; g.strokeStyle = INK; g.stroke();
    g.restore();
    return;
  }
  if (tp === 'secchiello' || tp === 'paletta') {
    const sy2 = py + W * 0.06;
    g.beginPath(); g.arc(px, sy2, W * 0.075, Math.PI, Math.PI * 2); g.lineWidth = W * 0.018; g.strokeStyle = INK; g.stroke();
    fillStroke(P => { P.moveTo(px - W * 0.10, sy2); P.lineTo(px + W * 0.10, sy2); P.lineTo(px + W * 0.075, sy2 + W * 0.17); P.lineTo(px - W * 0.075, sy2 + W * 0.17); P.closePath(); }, '#eb6649');
    return;
  }
  if (tp === 'microfono') {
    g.save(); g.translate(px, py); g.rotate(ang - 0.4);
    fillStroke(P => P.roundRect(-W * 0.02, -W * 0.02, W * 0.16, W * 0.04, W * 0.015), '#323440', W * 0.018);
    g.beginPath(); g.arc(W * 0.17, 0, W * 0.055, 0, Math.PI * 2); g.fillStyle = '#8b93a6'; g.fill(); g.lineWidth = W * 0.022; g.strokeStyle = INK; g.stroke();
    g.restore();
    return;
  }
  if (tp === 'sassofono' || tp === 'sax') {
    g.save(); g.translate(px, py); g.rotate(dir * 0.10);
    tratto(g, [[-dir * W * 0.10, -W * 0.18], [-dir * W * 0.02, -W * 0.10], [dir * W * 0.03, W * 0.14]], W * 0.028, INK);
    fillStroke(P => {
      P.moveTo(-dir * W * 0.02, -W * 0.12);
      P.quadraticCurveTo(dir * W * 0.05, W * 0.06, dir * W * 0.08, W * 0.22);
      P.quadraticCurveTo(dir * W * 0.17, W * 0.27, dir * W * 0.22, W * 0.15);
      P.lineTo(dir * W * 0.29, W * 0.05);
      P.lineTo(dir * W * 0.20, W * 0.01);
      P.lineTo(dir * W * 0.14, W * 0.15);
      P.quadraticCurveTo(dir * W * 0.10, W * 0.03, dir * W * 0.035, -W * 0.12);
      P.closePath();
    }, '#f0c244', W * 0.026);
    g.beginPath(); g.ellipse(dir * W * 0.245, W * 0.032, W * 0.058, W * 0.028, dir * 0.4, 0, Math.PI * 2);
    g.fillStyle = '#9e6814'; g.fill(); g.lineWidth = W * 0.022; g.strokeStyle = INK; g.stroke();
    [-0.02, 0.045, 0.11].forEach(ky => punto(g, dir * W * 0.045, W * ky, W * 0.017, '#fff6d6'));
    g.restore();
    return;
  }
  if (tp === 'tromba') {
    g.save(); g.translate(px, py); g.rotate(ang * 0.35);
    fillStroke(P => { P.moveTo(0, -W * 0.022); P.lineTo(dir * W * 0.26, -W * 0.022); P.lineTo(dir * W * 0.36, -W * 0.09); P.lineTo(dir * W * 0.36, W * 0.09); P.lineTo(dir * W * 0.26, W * 0.022); P.lineTo(0, W * 0.022); P.closePath(); }, '#f2c646', W * 0.024);
    g.restore();
    return;
  }
  if (tp === 'vinile' || tp === 'disco') {
    const vx = px, vy = py + W * 0.02;
    g.beginPath(); g.arc(vx, vy, W * 0.19, 0, Math.PI * 2); g.fillStyle = '#201e28'; g.fill(); g.lineWidth = W * 0.024; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.arc(vx, vy, W * 0.13, -0.7, 0.35); g.lineWidth = W * 0.016; g.strokeStyle = '#5a566b'; g.stroke();
    g.beginPath(); g.arc(vx, vy, W * 0.068, 0, Math.PI * 2); g.fillStyle = '#dc4c3e'; g.fill(); g.lineWidth = W * 0.018; g.strokeStyle = INK; g.stroke();
    punto(g, vx, vy, W * 0.018, '#f4f1ea');
    return;
  }
  if (tp === 'libri' || tp === 'libro' || tp === 'pila_libri') {
    const bx = px, by = py + W * 0.02;
    [['#3c6fb5', W * 0.06, -0.05], ['#d95448', -W * 0.01, 0.03], ['#4a9e68', -W * 0.08, -0.02]].slice(0, tp === 'libro' ? 1 : 3).forEach(([colB, dyB, rotB]) => {
      g.save(); g.translate(bx, by + dyB); g.rotate(rotB);
      fillStroke(P => P.roundRect(-W * 0.15, -W * 0.035, W * 0.30, W * 0.07, W * 0.012), colB, W * 0.022);
      g.fillStyle = '#f4f0e4'; g.fillRect(-W * 0.12, -W * 0.015, W * 0.24, W * 0.03);
      g.restore();
    });
    return;
  }
  if (tp === 'borsa') {
    const vx = px, vy = py + W * 0.06;
    g.beginPath(); g.arc(vx, vy - W * 0.01, W * 0.065, Math.PI, Math.PI * 2); g.lineWidth = W * 0.024; g.strokeStyle = INK; g.stroke();
    fillStroke(P => P.roundRect(vx - W * 0.16, vy, W * 0.32, W * 0.25, W * 0.025), '#c97a46');
    return;
  }
  if (tp === 'chiavi') {
    g.save(); g.translate(px, py + W * 0.03);
    g.beginPath(); g.arc(0, 0, W * 0.04, 0, Math.PI * 2); g.lineWidth = W * 0.02; g.strokeStyle = '#d9b44a'; g.stroke();
    fillStroke(P => P.roundRect(-W * 0.014, W * 0.03, W * 0.028, W * 0.11, W * 0.008), '#e6c24c', W * 0.016);
    g.restore();
  }
}

// VFX stilizzati sul personaggio (cicli a scatti lenti >=3-5 fotogrammi per non innescare tremolio.py)
function disegnaVfx(g, o, hcx, hcy, W, HH, dir) {
  const v = o.vfx; if (!v && !o.goccia) return;
  const lista = Array.isArray(v) ? v : v ? [String(v)] : [];
  const step6 = Math.floor(((o.vfxT ?? o.t ?? 0) * 6)) % 6;
  const ph = step6 / 6;
  if (o.goccia || lista.includes('sudore')) {
    const gx = hcx - dir * W * 0.25, gy = hcy - HH * 0.16 + ph * W * 0.12;
    const d = new Path2D(); d.moveTo(gx, gy - W * 0.09); d.quadraticCurveTo(gx + W * 0.07, gy + W * 0.02, gx, gy + W * 0.05); d.quadraticCurveTo(gx - W * 0.07, gy + W * 0.02, gx, gy - W * 0.09);
    g.fillStyle = '#8fd0f5'; g.fill(d); g.lineWidth = W * 0.02; g.strokeStyle = INK; g.stroke(d);
  }
  if (lista.includes('fumo')) {
    [-1, 1].forEach(s => {
      for (let k = 0; k < 2; k++) {
        const u = (ph + k * 0.5) % 1;
        const px = hcx + s * W * (0.52 + u * 0.26), py = hcy - HH * (0.04 + u * 0.40);
        const r = W * (0.075 + 0.055 * u);
        g.save(); g.globalAlpha = 1 - u * 0.35;
        g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill();
        g.lineWidth = W * 0.032; g.strokeStyle = INK; g.stroke();
        g.restore();
      }
    });
  }
  if (lista.includes('scatto') || lista.includes('sorpresa')) {
    const r0 = W * 0.54, r1 = W * (0.68 + 0.06 * (step6 % 2));
    [-2.4, -1.9, -1.25, -0.75].forEach(an => {
      tratto(g, [[hcx + Math.cos(an) * r0, hcy + Math.sin(an) * r0], [hcx + Math.cos(an) * r1, hcy + Math.sin(an) * r1]], W * 0.032, '#ffd84d');
      tratto(g, [[hcx + Math.cos(an) * r0, hcy + Math.sin(an) * r0], [hcx + Math.cos(an) * (r1 * 0.96), hcy + Math.sin(an) * (r1 * 0.96)]], W * 0.015, INK);
    });
  }
  if (lista.includes('rabbia')) {
    const rx = hcx - dir * W * 0.24, ry = hcy - HH * 0.30, s = W * (0.055 + 0.008 * (step6 % 2));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
      tratto(g, [[rx + a * s * 0.3, ry + b * s], [rx + a * s * 0.25, ry + b * s * 0.25], [rx + a * s, ry + b * s * 0.3]], W * 0.024, '#e64238');
    });
  }
  if (lista.includes('domanda') || lista.includes('esclamazione')) {
    const ch = lista.includes('domanda') ? '?' : '!';
    const capp = /^(cuoco|cappello|berretto|cresta|chignon|fedora|basco|pompadour|ciuffo|spettinato|afro|elmetto|zuccotto|paglia|cuffia_medica)$/.test(o.capelliTipo || '');
    const tx = hcx + dir * W * 0.24, ty = hcy - HH * (capp ? 0.88 : 0.72) - (step6 % 2) * W * 0.025;
    g.save(); g.font = `900 ${Math.round(W * 0.32)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = W * 0.05; g.strokeStyle = INK; g.strokeText(ch, tx, ty);
    g.fillStyle = '#ffe055'; g.fillText(ch, tx, ty);
    g.restore();
  }
  if (lista.includes('cuori')) {
    for (let k = 0; k < 2; k++) {
      const u = (ph + k * 0.5) % 1, cxH = hcx + (k ? 1 : -1) * W * 0.26, cyH = hcy - HH * (0.55 + u * 0.35), r = W * 0.055;
      const P = new Path2D();
      P.moveTo(cxH, cyH + r * 0.8);
      P.bezierCurveTo(cxH - r * 1.3, cyH, cxH - r * 0.9, cyH - r * 1.1, cxH, cyH - r * 0.4);
      P.bezierCurveTo(cxH + r * 0.9, cyH - r * 1.1, cxH + r * 1.3, cyH, cxH, cyH + r * 0.8);
      g.fillStyle = '#ef5a7d'; g.fill(P); g.lineWidth = W * 0.018; g.strokeStyle = INK; g.stroke(P);
    }
  }
}

// Scarpa cartoon articolata lungo la curva tallone -> pianta -> punta, con contorno #2a1a26 anti-tremolio
function disegnaScarpa(g, o, x0, y0, xm, ym, x1, y1, W, maglia) {
  const st = o.scarpeTipo || 'classiche';
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
  const fx = L > 1 ? dx / L : 1, fy = L > 1 ? dy / L : 0;
  let ux = fy, uy = -fx;
  if (uy > 0) { ux = -ux; uy = -uy; }
  const col = o.scarpeCol || (st === 'anfibi' ? '#252730' : st === 'stivali' ? '#5c3420' : st === 'sneakers' ? '#365896' : st === 'mocassini' ? '#262028' : mix(maglia || '#4f8fdc', '#1a1620', 0.56));
  const [hBack, hInstep, hToe] = st === 'stivali' ? [W * 0.165, W * 0.105, W * 0.058]
    : st === 'anfibi' ? [W * 0.145, W * 0.102, W * 0.064]
      : st === 'sneakers' ? [W * 0.102, W * 0.096, W * 0.062]
        : st === 'mocassini' ? [W * 0.086, W * 0.082, W * 0.052]
          : [W * 0.090, W * 0.086, W * 0.056];
  const soleOff = W * 0.014;
  // Vista quasi frontale dello scarpone/piede puntato verso camera: silhouette arrotondata senza schiacciarsi a zero
  if (L < W * 0.032 && Math.abs(o.verso || 0) < 0.05) {
    const rw = Math.max(W * 0.052, L * 0.48), rh = hInstep * 0.62, cyF = ym - rh * 0.36;
    const PF = new Path2D();
    PF.ellipse(xm, cyF, rw, rh, 0, 0, Math.PI * 2);
    g.fillStyle = col; g.fill(PF);
    if (st === 'sneakers') {
      g.save(); g.clip(PF);
      g.fillStyle = '#f4f1ea';
      g.fillRect(xm - rw - 2, cyF + rh * 0.40, (rw + 2) * 2, rh * 0.85);
      g.restore();
    } else if (st === 'mocassini' && o.scarpeBicolore) {
      g.save(); g.clip(PF);
      g.fillStyle = typeof o.scarpeBicolore === 'string' ? o.scarpeBicolore : '#f4f1ea';
      g.fillRect(xm - rw * 0.42, cyF - rh, rw * 0.84, rh * 1.15);
      g.restore();
    }
    g.lineWidth = W * 0.024; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke(PF);
    return;
  }
  const bx0 = x0 - ux * soleOff, by0 = y0 - uy * soleOff;
  const bxm = xm - ux * soleOff, bym = ym - uy * soleOff;
  const bx1 = x1 - ux * soleOff, by1 = y1 - uy * soleOff;
  const P = new Path2D();
  P.moveTo(bx0, by0);
  P.lineTo(bxm, bym);
  P.lineTo(bx1, by1);
  P.quadraticCurveTo(bx1 + fx * W * 0.022 + ux * (hToe * 0.55), by1 + fy * W * 0.022 + uy * (hToe * 0.55), x1 - fx * L * 0.10 + ux * hToe, y1 - fy * L * 0.10 + uy * hToe);
  P.quadraticCurveTo(xm + ux * hInstep, ym + uy * hInstep, x0 + fx * L * 0.18 + ux * hBack, y0 + fy * L * 0.18 + uy * hBack);
  P.lineTo(x0 - fx * W * 0.01 + ux * (hBack * 0.85), y0 - fy * W * 0.01 + uy * (hBack * 0.85));
  P.closePath();
  g.fillStyle = col; g.fill(P);
  if (st === 'sneakers') {
    g.save(); g.clip(P);
    g.beginPath();
    g.moveTo(bx0 - ux * W * 0.01, by0 - uy * W * 0.01);
    g.lineTo(bx1 + fx * W * 0.03, by1 + fy * W * 0.03);
    g.lineTo(bx1 + fx * W * 0.03 + ux * W * 0.026, by1 + fy * W * 0.03 + uy * W * 0.026);
    g.lineTo(bx0 + ux * W * 0.026, by0 + uy * W * 0.026);
    g.closePath();
    g.fillStyle = '#f4f1ea'; g.fill();
    // Punta sneaker chiara arrotondata
    g.beginPath(); g.arc(bx1 - fx * L * 0.04 + ux * W * 0.022, by1 - fy * L * 0.04 + uy * W * 0.022, W * 0.038, 0, Math.PI * 2);
    g.fillStyle = '#f4f1ea'; g.fill();
    g.restore();
  } else if (st === 'mocassini' && o.scarpeBicolore) {
    // Scarpa bicolore jazz/anni 80: fascia centrale chiara staccata fra tallone e punta scuri (direction-invariant)
    g.save(); g.clip(P);
    const s0 = 0.30, s1 = 0.68, upH = hInstep * 1.25, dnH = soleOff * 0.4;
    g.beginPath();
    g.moveTo(x0 + fx * L * s0 - ux * dnH, y0 + fy * L * s0 - uy * dnH);
    g.lineTo(x0 + fx * L * s1 - ux * dnH, y0 + fy * L * s1 - uy * dnH);
    g.lineTo(x0 + fx * L * s1 + ux * upH, y0 + fy * L * s1 + uy * upH);
    g.lineTo(x0 + fx * L * s0 + ux * upH, y0 + fy * L * s0 + uy * upH);
    g.closePath();
    g.fillStyle = typeof o.scarpeBicolore === 'string' ? o.scarpeBicolore : '#f4f1ea'; g.fill();
    g.restore();
  } else if (st === 'anfibi') {
    g.save(); g.clip(P);
    g.fillStyle = '#18181e';
    g.fillRect(Math.min(bx0, bx1) - W * 0.05, Math.max(by0, by1) - W * 0.032, Math.abs(bx1 - bx0) + W * 0.1, W * 0.05);
    g.restore();
  } else if (st === 'stivali') {
    tratto(g, [[x0 - fx * W * 0.01 + ux * (hBack * 0.68), y0 - fy * W * 0.01 + uy * (hBack * 0.68)], [x0 + fx * L * 0.28 + ux * (hBack * 0.72), y0 + fy * L * 0.28 + uy * (hBack * 0.72)]], W * 0.018, mix(col, '#000000', 0.35));
  }
  g.lineWidth = W * 0.024; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke(P);
}

export function drawRick(g, o = {}) {
  const W = calcolaWAdattato(o, o.W || 200), x0 = o.x ?? 256, luce = o.luce ?? -1, a = Math.max(-1, Math.min(1, o.verso ?? 0)), saBase = Math.sin(a * Math.PI / 2), caBase = Math.cos(a * Math.PI / 2), dir = Math.sign(a) || 1;
  const back = Math.max(0, Math.min(1, o.spalle ?? (o.posa === 'spalle' ? 1 : 0))), isBack = back > 0.42;
  const acc = new Set(o.accessori ?? RUOLI[o.ruolo] ?? []);
  const pelle = o.pelle || '#fbf6f2', maglia = o.maglia || '#4f8fdc', capelli = o.capelli || '#26222a', TS = TESTE[o.testa] || TESTE.tonda, CS = CORPI[o.corpo] || CORPI.fagiolo, HH = W * TS.hw, ink = W * 0.044;
  const gambe = W * 0.93 * 1.4 * (o.gambe ?? CS.gambe ?? 1), bustoScale = o.alto ?? CS.alto ?? 1, largoScale = o.largo ?? CS.largo ?? 1, busto = W * 0.93 * 1.1 * bustoScale;
  const sedDrop = sedutoDropPx(o, W);
  const kin = calcolaCinematica(o, W, HH, gambe, bustoScale, largoScale, saBase, caBase, dir, sedDrop);
  const posaCorpo = kin.inMov ? kin.gaitKey : posaAuto(o);
  // Torsione lieve delle spalle (twistSa) e basculamento bacino intorno al baricentro x
  const aTorso = Math.max(-1, Math.min(1, a + (kin.twistSa || 0) * 0.65));
  const sa = Math.sin(aTorso * Math.PI / 2), ca = Math.cos(aTorso * Math.PI / 2);
  const Bw = W * 0.8 * largoScale * (1 - 0.22 * Math.abs(sa));
  const x = x0 + (sedDrop > 0 ? 0 : (kin.hipSwayX || 0));
  const y0 = o.y ?? 980, hipYOrig = (y0 - kin.bobPx) - gambe + sedDrop;
  const breathPy = 0;   // respiro disabilitato su richiesta dell'utente
  const chinY = hipYOrig - busto - breathPy, chinY0 = chinY, hcx = x + saBase * W * 0.04, hcy = chinY - HH * 0.38;
  const lw = W * 0.044;

  // Gambe ancorate a terra (non ruotano con torsoPiega: i piedi restano piantati; ordine [-dir, dir] così la gamba vicina sta davanti)
  [-dir, dir].forEach(s => {
    if (sedDrop > 0) {
      const hx = x + s * kin.hx0 * ca;
      const kx = x + s * kin.hx0 * 1.38 * ca + dir * Math.abs(saBase) * (gambe * 0.48 + (s === dir ? W * 0.04 : -W * 0.03));
      const ky = hipYOrig + W * (0.04 + 0.10 * Math.pow(caBase, 2));
      const fy = posaCorpo === 'seduto_alto' ? Math.min(y0, ky + gambe * 0.45) : y0;
      const fx = Math.abs(saBase) > 0.25 ? (kx + dir * W * 0.03 * Math.abs(saBase) + s * W * 0.02 * caBase) : (x + s * kin.hx0 * 1.42 * caBase);
      tratto(g, [[hx, hipYOrig - HH * 0.08], [kx, ky]], lw);
      tratto(g, [[kx, ky], [fx, fy]], lw);
      const absSaS = Math.abs(saBase);
      const turnFt = absSaS > 0.04 ? dir * Math.max(absSaS, 0.32) : s * caBase * (1 - 0.55 * back);
      const hxFtS = fx - dir * W * 0.025 * Math.max(absSaS, 0.2), txFtS = fx + turnFt * W * 0.11;
      disegnaScarpa(g, o, hxFtS, fy, (hxFtS + txFtS) * 0.5, fy + 0.5, txFtS, fy + 1, W, maglia);
    } else {
      const L = kin.legs[s], hx = x + s * kin.hx0 * caBase;
      const hyHipLeg = hipYOrig - HH * 0.08 + s * (kin.hipTiltPx || 0) * (kin.inMov ? -0.45 : 0.45);
      if (kin.inMov) {
        const fx = x0 + s * (kin.hx0 + W * 0.09) * caBase + L.xNorm * L.stridePx * dir;
        const absSa = Math.abs(saBase);
        const legLen = Math.max(W * 0.55, kin.legRest);
        const legSlack = kin.gaitKey === 'passeggiata' || kin.gaitKey === 'marcia' ? 0.506 : 0.514;
        const K1 = legLen * legSlack, K2 = legLen * legSlack;
        const tiltA = L.footTilt * absSa;
        const cT = Math.cos(tiltA), sT = Math.sin(tiltA);
        const bL = W * (0.032 + 0.022 * back * (1 - absSa)) * Math.max(absSa, back);
        const fProf = W * 0.115 * Math.max(absSa, 0.28), fFront = absSa > 0.04 ? 0 : s * caBase * W * 0.09 * (1 - 0.65 * back);
        let fy = y0 - L.liftPx;
        let hyFt = fy - bL * sT;
        let tyFt = fy + fProf * sT;
        // Ancoraggio suolo: in fase d'appoggio/rullata la suola o punta resta a quota y0
        if (!kin.G.flight && L.liftNorm <= 0.14) {
          const maxY = Math.max(fy, hyFt, tyFt);
          if (maxY > y0) { const corr = maxY - y0; fy -= corr; hyFt -= corr; tyFt -= corr; }
        }
        const [kProfX, kProfY] = gomitoIK(hx, hyHipLeg, fx, fy, K1, K2, [dir * absSa + s * 0.06 * caBase, 0.22 - L.liftNorm * 0.36]);
        // In vista frontale (|sa| piccolo) il ginocchio sollevato resta allineato davanti all'anca anziché aprirsi a rana
        const tProf = Math.min(1, absSa / 0.38);
        const kFrontX = (hx + fx) * 0.5 + s * W * 0.035 * caBase;
        const kFrontY = (hyHipLeg + fy) * 0.5 - L.liftPx * 0.28;
        const kx = kFrontX * (1 - tProf) + kProfX * tProf;
        const ky = kFrontY * (1 - tProf) + kProfY * tProf;
        tratto(g, [[hx, hyHipLeg], [kx, ky], [(kx + fx) * 0.5, (ky + fy) * 0.5], [fx, fy]], lw);
        // Piede articolato tallone -> pianta -> punta (piega naturale in rullata di spinta e in appoggio)
        const hxFt = fx - dir * bL * cT;
        const txFt = fx + dir * fProf * cT + fFront;
        const flexPush = (L.isStance && L.footTilt > 0.12) ? Math.min(1, L.footTilt / 0.48) : 0;
        const mxFt = fx + dir * fProf * 0.28 * cT + fFront * 0.35;
        const myFt = fy + (flexPush > 0 ? Math.min(y0 - fy, (tyFt - fy) * 0.35 + flexPush * W * 0.018) : fProf * 0.28 * sT);
        const tyArt = flexPush > 0 ? Math.min(y0, Math.max(myFt, tyFt - flexPush * W * 0.025)) : tyFt;
        disegnaScarpa(g, o, hxFt, hyFt, mxFt, myFt, txFt, tyArt, W, maglia);
      } else {
        const absSaI = Math.abs(saBase);
        const hasWalkOffset = Math.abs(L.xNorm) > 0.01;
        const dirK = absSaI > 0.04 ? dir * Math.max(absSaI, 0.28) : s * caBase * 0.35;
        const stanceOff = hasWalkOffset ? L.stridePx * dir : dirK * L.stridePx;
        const fx = x0 + s * (kin.hx0 + W * 0.09) * caBase + stanceOff;
        const fy = y0 - L.liftPx;
        const kneePush = dir * (kin.kneeBendPx || 0) * absSaI + (L.kneeFlex || 0) * dirK;
        tratto(g, [[hx, hyHipLeg], [(hx + fx) / 2 + s * W * 0.03 * caBase * (1 - absSaI) + kneePush, (hyHipLeg + fy) / 2], [fx, fy]], lw);
        const tiltIdle = L.footTilt * absSaI * W * 0.06;
        const turnFtI = absSaI > 0.04 ? dir * Math.max(absSaI, 0.34) : s * caBase * (1 - 0.55 * back);
        const hxFtI = fx - dir * W * 0.03 * Math.max(absSaI, 0.22), hyFtI = fy - tiltIdle * 0.3;
        const txFtI = fx + turnFtI * W * 0.11, tyFtI = fy + 1 + tiltIdle * 0.4;
        disegnaScarpa(g, o, hxFtI, hyFtI, (hxFtI + txFtI) * 0.5, (hyFtI + tyFtI) * 0.5, txFtI, tyFtI, W, maglia);
      }
    }
  });

  // Parte superiore (busto, braccia, testa) ruotata attorno al perno dell'anca (x, hipYOrig) con torsoPiega/chino
  const pose = calcolaPoseBraccia(o, x, chinY, chinY0, hipYOrig, hcx, hcy, Bw, busto, W, HH, sa, ca, dir, kin, posaCorpo, back);
  const tpDeg = (o.torsoPiega ?? o.chino ?? 0) + pose.torsoPiegaExtra;
  const tpRad = tpDeg * Math.PI / 180, tpCos = Math.cos(tpRad), tpSin = Math.sin(tpRad);
  const hasSq = Math.abs(kin.squashY || 0) > 0.002;
  const sqY = hasSq ? (1 + kin.squashY) : 1, sqX = hasSq ? (1 / Math.sqrt(sqY)) : 1;
  const sy = chinY + busto * 0.25, hy = hipYOrig - busto * 0.05;
  const L1 = busto * 0.45, L2 = busto * 0.44;
  const puntiMani = [null, null];
  const oggPrincipale = o.porta ? null : (o.oggetto !== undefined ? o.oggetto : pose.oggettoAuto);

  const armCoord = s => {
    const idx = s > 0 ? 1 : 0;
    const shX = x + (s === dir ? s * Bw * (0.34 - 0.17 * Math.abs(sa)) : s * Bw * 0.30);
    const h = o.mano && o.mano[idx];
    const hp = o.maniPx && o.maniPx[idx];
    let px, py;
    if (hp) {
      px = hp[0]; py = hp[1];
      if (o.piega) {
        const pRad = o.piega * Math.PI / 180, pCos = Math.cos(pRad), pSin = Math.sin(pRad);
        const dx = px - 256, dy = py - 1010;
        px = 256 + dx * pCos + dy * pSin;
        py = 1010 - dx * pSin + dy * pCos;
      }
      if (tpRad) {
        const dx = px - x, dy = py - hipYOrig;
        px = x + dx * tpCos + dy * tpSin;
        py = hipYOrig - dx * tpSin + dy * tpCos;
      }
      if (hasSq) {
        px = x + (px - x) / sqX;
        py = hipYOrig + (py - hipYOrig) / sqY;
      }
      puntiMani[idx] = [hp[0], hp[1]];
    } else {
      if (h) {
        px = x + h[0] * W; py = hipYOrig - busto + h[1] * W;
      } else if (pose.pts[idx]) {
        px = pose.pts[idx][0]; py = pose.pts[idx][1];
      } else {
        const armSw = kin.inMov ? -kin.legs[s].xNorm : 0;
        px = x + s * Bw * 0.62 + armSw * W * 0.18 * dir * Math.abs(sa);
        py = hy;
      }
      // Posizione reale della mano nello spazio finale della carta (per INMANO / interazioni)
      let rpx = px, rpy = py;
      if (hasSq) {
        rpx = x + (rpx - x) * sqX;
        rpy = hipYOrig + (rpy - hipYOrig) * sqY;
      }
      if (tpRad) {
        const dx = rpx - x, dy = rpy - hipYOrig;
        rpx = x + dx * tpCos - dy * tpSin;
        rpy = hipYOrig + dx * tpSin + dy * tpCos;
      }
      if (o.piega) {
        const rad = o.piega * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
        const dx = rpx - 256, dy = rpy - 1010;
        rpx = 256 + dx * cos - dy * sin;
        rpy = 1010 + dx * sin + dy * cos;
      }
      puntiMani[idx] = [rpx, rpy];
    }
    const bend = hp ? [s * 0.55 * ca - dir * Math.abs(sa) * 0.65, 0.72] : (pose.bend[idx] || [s * 0.55 * ca - dir * Math.abs(sa) * 0.75, 0.4]);
    let [gx, gy] = gomitoIK(shX, sy, px, py, L1, L2, bend);
    if (hp && o.maniContact && o.maniContact[idx]) {
      const posaArm = (o.maniPosa && o.maniPosa[idx]) || o.manoPosa || 'presa';
      const rH = W * 0.05;
      const backK = posaArm === 'presa' ? 0.90 : posaArm === 'indica' ? 1.55 : posaArm === 'aperta' ? 1.05 : posaArm === 'pugno' ? 0.95 : 0;
      const maxPull = Math.max(0, Math.hypot(px - shX, py - sy) - rH * 1.5);
      const backOff = Math.min(rH * backK, maxPull);
      if (backOff > 0.5) {
        const fx = px - gx, fy = py - gy, fl = Math.hypot(fx, fy) || 1;
        px -= (fx / fl) * backOff;
        py -= (fy / fl) * backOff;
        [gx, gy] = gomitoIK(shX, sy, px, py, L1, L2, bend);
      }
    }
    return { idx, shX, gx, gy, px, py, hp };
  };

  const V = new Set(o.vestito || []);
  const braccio = s => {
    const c = armCoord(s), { idx, shX, gx, gy, px, py, hp } = c;
    tratto(g, [[shX, sy], [(shX + gx * 2) / 3, (sy + gy * 2) / 3], [gx, gy], [px, py]], W * 0.042);
    if (!hp && pose.inTasca[idx]) return;   // mano infilata in tasca: resta dietro/dentro al fianco senza dita fuori
    const posa = (o.maniPosa && o.maniPosa[idx]) || o.manoPosa || (hp ? 'presa' : (pose.posaMani[idx] || (oggPrincipale && s === pose.oggettoMano && !hp ? 'presa' : 'aperta')));
    let ux = px - gx, uy = py - gy; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul; const nx = -uy * s, ny = ux * s, r = W * 0.045, dw = W * 0.023;
    if (V.has('polsini')) {
      const wx = px - ux * W * 0.072, wy = py - uy * W * 0.072;
      g.save(); g.translate(wx, wy); g.rotate(Math.atan2(uy, ux));
      g.beginPath(); g.roundRect(-W * 0.028, -W * 0.036, W * 0.056, W * 0.072, W * 0.012);
      g.fillStyle = o.polsiniCol || '#f4f1ea'; g.fill();
      g.fillStyle = o.polsiniBanda || '#d9483b'; g.fillRect(-W * 0.009, -W * 0.032, W * 0.018, W * 0.064);
      g.lineWidth = W * 0.018; g.strokeStyle = INK; g.stroke();
      g.restore();
    } else if (acc.has('orologio') && s === 1) {
      const wx = px - ux * W * 0.072, wy = py - uy * W * 0.072;
      g.save(); g.translate(wx, wy); g.rotate(Math.atan2(uy, ux));
      g.beginPath(); g.roundRect(-W * 0.014, -W * 0.033, W * 0.028, W * 0.066, W * 0.008);
      g.fillStyle = '#38241e'; g.fill(); g.lineWidth = W * 0.014; g.strokeStyle = INK; g.stroke();
      g.beginPath(); g.arc(0, 0, W * 0.023, 0, Math.PI * 2);
      g.fillStyle = '#f2d266'; g.fill(); g.lineWidth = W * 0.014; g.strokeStyle = INK; g.stroke();
      g.restore();
    }
    if (oggPrincipale && s === pose.oggettoMano && !hp) disegnaOggettoMano(g, oggPrincipale, px, py, ux, uy, W, dir, y0);
    if (pose.oggettoExtra && s !== pose.oggettoMano && !hp) disegnaOggettoMano(g, pose.oggettoExtra.tipo, pose.oggettoExtra.x, pose.oggettoExtra.y, ux, uy, W, dir, y0);
    if (posa === 'punto') { punto(g, px, py, W * 0.055); return; }
    const dito = (ang, len, w = dw, da = 0.7) => { const cA = Math.cos(ang), sn = Math.sin(ang), vx = ux * cA + nx * sn, vy = uy * cA + ny * sn; tratto(g, [[px + vx * r * da, py + vy * r * da], [px + vx * (r + len), py + vy * (r + len)]], w); };
    if (posa === 'pugno') { punto(g, px + ux * r * 0.3, py + uy * r * 0.3, r * 1.3); dito(1.5, r * 0.5, dw * 1.1, 0.9); return; }
    punto(g, px, py, r);
    if (posa === 'indica') { dito(0, r * 1.9, dw * 1.1); dito(1.25, r * 0.8); punto(g, px + ux * r * 0.7 - nx * r * 0.3, py + uy * r * 0.7 - ny * r * 0.3, r * 0.7); return; }
    if (posa === 'presa') {
      dito(1.15, r * 1.0, dw * 1.1);[-0.15, -0.5, -0.85].forEach(an => {
        const cA = Math.cos(an), sn = Math.sin(an), vx = ux * cA + nx * sn, vy = uy * cA + ny * sn, kx = px + vx * (r + r * 0.7), ky = py + vy * (r + r * 0.7);
        tratto(g, [[px + vx * r * 0.7, py + vy * r * 0.7], [kx, ky], [kx + nx * r * 0.75, ky + ny * r * 0.75]], dw);
      }); return;
    }
    dito(1.2, r * 0.95, dw * 1.1);[0.38, 0.05, -0.28, -0.6].forEach((an, i) => dito(an, r * (i === 1 || i === 2 ? 1.35 : 1.1)));
  };

  g.save();
  if (tpRad) { g.translate(x, hipYOrig); g.rotate(tpRad); g.translate(-x, -hipYOrig); }
  if (hasSq) { g.translate(x, hipYOrig); g.scale(sqX, sqY); g.translate(-x, -hipYOrig); }
  const bcy = chinY + busto * 0.5, B = forma(x, bcy, Bw / 2, busto / 2 + W * 0.075, { nTop: CS.nTop, nBot: CS.nBot, egg: CS.egg, asym: 0.04 * dir * (1 - back * 0.85) });
  const farIdx = sideIdx(-dir), nearIdx = sideIdx(dir);
  if (!isBack) vestitiEsterni(g, o, V, x, bcy, chinY0, hipYOrig, Bw, busto, W, sa, ca, dir, maglia, back, kin.lagX || 0, kin.lagY || 0);
  // Se le mani vanno dietro la schiena (pose 'dietro'), vanno entrambe dietro al busto; davantiTorso le porta davanti (conserte, applaude)
  if (!pose.davantiTorso[farIdx]) braccio(-dir);
  if (pose.dietroTorso[nearIdx]) braccio(dir);
  if (o.gonna) {
    const gy = hipYOrig - busto * 0.15, P = new Path2D(); P.moveTo(x - Bw * 0.42, gy); P.lineTo(x + Bw * 0.42, gy); P.lineTo(x + Bw * 0.62, hipYOrig + gambe * 0.35); P.quadraticCurveTo(x, hipYOrig + gambe * 0.42, x - Bw * 0.62, hipYOrig + gambe * 0.35); P.closePath();
    g.fillStyle = o.gonna; g.fill(P); g.lineWidth = ink * 0.9; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke(P);
  }
  inchiostra(g, B, x, bcy, ink * 0.9, p => {
    ombra(g, p, x, bcy, Bw * 0.6, maglia, luce, [0.8, 0.8, 0.88]);
    tessuto(g, p, o, x, bcy, Bw, busto, W, sa);
    vestitiFondo(g, o, V, p, x, bcy, chinY0, hipYOrig, Bw, busto, W, sa, ca, dir, maglia, back);
    const tx = x + sa * Bw * 0.38, tc = chinY0 + W * 0.09, tw = ca * 0.7 + 0.3, tieLagX = (kin.lagX || 0) * 0.45;
    if (!isBack && acc.has('cravatta')) {
      g.save(); g.clip(p); const T = new Path2D();
      T.moveTo(tx - W * 0.035 * tw, tc); T.lineTo(tx + W * 0.035 * tw, tc); T.lineTo(tx + tieLagX + W * 0.045 * tw, tc + busto * 0.62); T.lineTo(tx + tieLagX, tc + busto * 0.72); T.lineTo(tx + tieLagX - W * 0.045 * tw, tc + busto * 0.62); T.closePath();
      g.fillStyle = o.cravattaCol || '#2d4a9a'; g.fill(T); g.save(); g.clip(T);
      for (let k = -3; k < 12; k++) { const yy = tc + k * W * 0.07; tratto(g, [[tx + tieLagX * 0.5 - W * 0.08, yy], [tx + tieLagX * 0.5 + W * 0.08, yy + W * 0.06]], W * 0.018, '#9fb6ee'); }
      g.restore(); g.lineWidth = W * 0.02; g.strokeStyle = INK; g.stroke(T);
      const N = new Path2D(); N.moveTo(tx - W * 0.04 * tw, tc + W * 0.01); N.lineTo(tx + W * 0.04 * tw, tc + W * 0.01); N.lineTo(tx + W * 0.025 * tw, tc + W * 0.07); N.lineTo(tx - W * 0.025 * tw, tc + W * 0.07); N.closePath();
      g.fillStyle = o.cravattaCol || '#2d4a9a'; g.fill(N); g.stroke(N);
      tratto(g, [[tx - W * 0.04 * tw, tc], [tx - W * 0.15 * tw, tc + W * 0.1], [tx - W * 0.03 * tw, tc + W * 0.06]], W * 0.022);
      tratto(g, [[tx + W * 0.04 * tw, tc], [tx + W * 0.15 * tw, tc + W * 0.1], [tx + W * 0.03 * tw, tc + W * 0.06]], W * 0.022);
      g.restore();
    }
    if (!isBack && acc.has('cartellino') && sa > -0.7) {
      const txt = o.cartellinoTesto ? String(o.cartellinoTesto) : '';
      const cx2 = x + (sa - 0.78 * ca) * Bw * 0.38, cy2 = chinY + busto * (txt ? 0.27 : 0.36);
      const bw = W * (txt ? 0.28 : 0.22) * (ca * 0.58 + 0.42), bh = W * (txt ? 0.165 : 0.15);
      if (Math.abs(cx2 - x) < Bw * 0.45) {
        g.save(); g.clip(p);
        tratto(g, [[cx2 - bw * 0.36, cy2 - W * 0.038], [cx2 + bw * 0.36, cy2 - W * 0.038]], W * 0.015);
        g.beginPath(); g.roundRect(cx2 - bw / 2, cy2, bw, bh, W * 0.015); g.fillStyle = txt ? '#faf8f2' : '#f4f1ea'; g.fill(); g.lineWidth = W * 0.02; g.strokeStyle = INK; g.stroke();
        g.fillStyle = '#d24a3c'; g.fillRect(cx2 - bw / 2 + W * 0.01, cy2 + W * 0.01, bw - W * 0.02, bh * 0.26);
        if (txt) {
          const sxTxt = ca * 0.65 + 0.35;
          let fs = Math.max(8, Math.round(bh * 0.56));
          g.save(); g.translate(cx2, cy2 + bh * 0.65); g.scale(sxTxt, 1);
          g.font = `900 ${fs}px system-ui, "Helvetica Neue", Arial, sans-serif`;
          const maxW = (bw * 0.84) / Math.max(0.25, sxTxt), tw = g.measureText(txt).width;
          if (tw > maxW) { fs = Math.max(7, Math.floor(fs * (maxW / tw))); g.font = `900 ${fs}px system-ui, "Helvetica Neue", Arial, sans-serif`; }
          g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(txt, 0, 0);
          g.restore();
        } else {
          tratto(g, [[cx2 - bw * 0.3, cy2 + bh * 0.62], [cx2 + bw * 0.3, cy2 + bh * 0.62]], W * 0.014);
          tratto(g, [[cx2 - bw * 0.3, cy2 + bh * 0.82], [cx2 + bw * 0.1, cy2 + bh * 0.82]], W * 0.014);
        }
        g.restore();
      }
    }
    vestiti(g, o, p, x, bcy, chinY0, hipYOrig, Bw, busto, W, sa, ca, dir, maglia, back);
  }, luce);
  if (isBack) vestitiEsterni(g, o, V, x, bcy, chinY0, hipYOrig, Bw, busto, W, sa, ca, dir, maglia, back, kin.lagX || 0, kin.lagY || 0);
  vestitiCollo(g, o, V, acc, x, chinY0, bcy, Bw, busto, W, sa, ca, dir, maglia, back, kin.lagX || 0, kin.lagY || 0);
  if (pose.davantiTorso[farIdx] && !pose.braccioSopraTesta && !pose.dietroTorso[farIdx]) braccio(-dir);
  if (!pose.dietroTorso[nearIdx] && !pose.braccioSopraTesta) braccio(dir);
  void farIdx;
  // testa: la forma resta tonda; si gonfia appena dal lato della faccia (neutro di spalle) + movimento/reazione naturale su cambio espressione
  const incTarget = (INCLINA[o.faccia] || 0) * (o.inclinaFaccia ?? 1);
  const incPrev = (INCLINA[o.facciaPrev] || 0) * (o.inclinaFaccia ?? 1);
  let fTiltNow = incTarget, fKick = 0, fDipY = 0;
  let fSqY = 1, fPop = 0;
  if (typeof o.facciaDt === 'number' && o.facciaDt >= 0 && o.facciaDt < 0.24) {
    const uF = o.facciaDt / 0.24, wF = Math.exp(-uF * 5.2) * Math.sin(uF * Math.PI * 3.0);
    const easeU = 1 - Math.pow(1 - Math.min(1, o.facciaDt / 0.16), 3);
    fTiltNow = incPrev + (incTarget - incPrev) * easeU;
    const excFace = /^(sorpreso|scioccato|urla|esaltato|panico|spaventato|nei_guai|esasperato)$/.test(o.faccia || '');
    fKick = wF * (excFace ? 4.2 : 2.2) * (dir || 1);
    fDipY = (excFace ? -HH * 0.024 : HH * 0.012) * Math.sin(Math.min(1, o.facciaDt / 0.14) * Math.PI) * Math.exp(-uF * 2.5);
    const stretchFace = /^(sorpreso|scioccato|urla|felice|ride|contento|fiero|esaltato)$/.test(o.faccia || '');
    const squashFace = /^(arrabbiato|spaventato|triste|deciso|schifato|furbo|digrigna|esasperato|serio|sospetto|nei_guai)$/.test(o.faccia || '');
    if (stretchFace) fSqY = 1 + 0.075 * wF;
    else if (squashFace) fSqY = 1 - 0.065 * wF;
    fPop = wF;
  }
  const rot = ((o.tilt ?? -2) + (o.inclina || 0) + pose.testaExtra + fTiltNow + fKick) * Math.PI / 180;
  const fSqX = 1 / Math.sqrt(fSqY);
  g.save(); g.translate(hcx, hcy + HH * 0.45 + fDipY); g.rotate(rot); if (Math.abs(fSqY - 1) > 0.002) g.scale(fSqX, fSqY); g.translate(-hcx, -hcy - HH * 0.45);
  const ey = hcy + HH * 0.005;
  const disegnaOrecchio = (sx, outerSide, dietroTesta) => {
    const kO = dietroTesta ? 0.85 : (0.7 + 0.3 * caBase);
    const earW = W * 0.072 * kO, earH = W * 0.095;
    g.beginPath(); g.ellipse(sx, ey + HH * 0.07, earW, earH, outerSide * 0.15, 0, Math.PI * 2);
    g.fillStyle = pelle; g.fill();
    g.beginPath();
    g.arc(sx, ey + HH * 0.07, earW * 0.92, outerSide < 0 ? Math.PI * 0.45 : -Math.PI * 0.55, outerSide < 0 ? Math.PI * 1.55 : Math.PI * 0.55);
    g.lineWidth = W * 0.026; g.lineCap = 'round'; g.strokeStyle = INK; g.stroke();
    tratto(g, [[sx + outerSide * earW * 0.15, ey + HH * 0.07 - earH * 0.25], [sx - outerSide * earW * 0.1, ey + HH * 0.07 + earH * 0.25]], W * 0.016);
    if (acc.has('orecchini')) {
      g.beginPath(); g.arc(sx + outerSide * earW * 0.15, ey + HH * 0.07 + earH * 1.05, W * 0.032, 0, Math.PI * 2);
      g.fillStyle = o.orecchiniCol || '#f2c84a'; g.fill(); g.lineWidth = W * 0.018; g.strokeStyle = INK; g.stroke();
    }
  };
  const hLagX = kin.lagX || 0, hLagY = kin.lagY || 0;
  if (!isBack) capelliDietro(g, o, hcx, hcy, W, HH, saBase, dir, capelli, back, hLagX, hLagY);
  else if (Math.abs(saBase) < 0.72) disegnaOrecchio(hcx + dir * W * (0.49 - 0.12 * Math.abs(saBase)), dir, true);
  if (isBack && Math.abs(saBase) <= 0.13) disegnaOrecchio(hcx - dir * W * 0.49, -dir, true);
  if (!isBack && acc.has('orecchini') && Math.abs(saBase) <= 0.13) {
    [-1, 1].forEach(sEar => {
      g.beginPath(); g.arc(hcx + sEar * W * 0.48, ey + HH * 0.15, W * 0.03, 0, Math.PI * 2);
      g.fillStyle = o.orecchiniCol || '#f2c84a'; g.fill(); g.lineWidth = W * 0.018; g.strokeStyle = INK; g.stroke();
    });
  }
  const H = forma(hcx, hcy, W / 2, HH / 2, { nTop: TS.nTop, nBot: TS.nBot, egg: TS.egg, asym: (0.06 + 0.06 * Math.abs(saBase)) * dir * Math.max(0, 1 - back * 1.4) });
  const fx = hcx + saBase * W * 0.27, sp = W * 0.122 * (0.35 + 0.65 * caBase);
  inchiostra(g, H, hcx, hcy, ink, p => {
    ombra(g, p, hcx, hcy, W / 2, pelle, luce);
    g.save(); g.clip(p); capelliDentro(g, o, hcx, hcy, W, HH, saBase, dir, fx, capelli, acc, back);
    g.restore();
  }, luce);
  // Orecchio visibile sul lato posteriore (in vista di spalle oltre |sa|>0.13 resta sul lato -dir)
  if (Math.abs(saBase) > 0.13) disegnaOrecchio(hcx - dir * W * (0.49 - 0.16 * Math.abs(saBase)), -dir, false);
  // da lontano (personaggio piccolo nel quadro) occhi, bocca e sopracciglia si ingrandiscono e ingrassano: l'espressione resta leggibile
  const zf = o.zoomFaccia || 1; PELLE_ORA = pelle;
  if (!isBack) {
    g.save(); g.beginPath(); g.ellipse(hcx, hcy, W * 0.49, HH * 0.49, 0, 0, Math.PI * 2); g.clip(); g.translate(fx, ey + HH * 0.08); g.scale(zf, zf); g.translate(-fx, -ey - HH * 0.08);
    faccia(g, o.faccia || 'neutro', fx, ey, hcy, HH, W, sp, saBase, caBase, dir, o.palpebra || 0, o.sguardo, o.bocca, fPop, acc.has('sopracciglia_folte'));
    extraFaccia(g, acc, fx, ey, hcy, HH, W, sp, saBase, caBase, dir, capelli, o);
    // Nasino cartoon morbido in tre quarti / profilo (|sa| > 0,30)
    if (Math.abs(saBase) > 0.30) {
      const kN = Math.min(1, (Math.abs(saBase) - 0.28) / 0.45);
      const nx = fx + dir * W * 0.075 * kN, ny = ey + HH * 0.095;
      const nr = W * (0.032 + 0.016 * kN);
      const NP = new Path2D();
      NP.moveTo(nx, ny - nr * 0.38);
      NP.bezierCurveTo(nx + dir * nr * 1.15, ny - nr * 0.12, nx + dir * nr * 1.15, ny + nr * 0.40, nx - dir * nr * 0.12, ny + nr * 0.42);
      g.fillStyle = pelle; g.fill(NP);
      g.lineWidth = W * 0.022; g.lineCap = 'round'; g.strokeStyle = INK; g.stroke(NP);
    }
    g.restore();
  }
  capelliSopra(g, o, hcx, hcy, W, HH, saBase, dir, capelli, back, hLagX, hLagY);
  if (isBack) capelliDietro(g, o, hcx, hcy, W, HH, saBase, dir, capelli, back, hLagX, hLagY);
  disegnaVfx(g, o, hcx, hcy, W, HH, dir);
  g.restore();
  if (pose.braccioSopraTesta) {
    if (pose.davantiTorso[farIdx] && !pose.dietroTorso[farIdx]) braccio(-dir);
    if (!pose.dietroTorso[nearIdx]) braccio(dir);
  }
  o._maniPxEffettive = puntiMani;
  g.restore();
}

// facce a taglio netto stile Rick: sclera bianca espressiva con taglio palpebre, > < strizzati, archi ^ ^, pupille mobili e bocche con denti.
// Ogni faccia = [occhi, sopracciglio sinistro, destro, bocca, opt]. Per aggiungerne una basta una riga in FACCE.
export const INCLINA = { triste: -6, piange: -7, dolore: -5, ride: 7, confuso: 8, pensieroso: -6, fiero: -5, scettico: 3, imbarazzato: -6, schifato: 5, incredulo: -3, assonnato: 8, annoiato: 4, spaventato: -3, panico: -4, serio: 0, digrigna: -3, esaltato: 5, nei_guai: -3, sospetto: 4, esasperato: -4, concentrato: -3, occhiolino: 5 };   // gradi, si somma a `inclina`
export const FACCE = {
  neutro:      ['bianchi', [0.19, 0.20], [0.20, 0.19], 'dritta',         { topCut: 0.30, pupil: 0.036 }],
  felice:      ['bianchi', [0.22, 0.24], [0.24, 0.22], 'sorriso',        { topCut: 0, botCut: 0, rx: 0.090, ry: 0.094, pupil: 0.048 }],
  ghigno:      ['bianchi', [0.19, 0.23], [0.23, 0.21], 'denti',          { topCut: 0.24, botCut: 0, rx: 0.102, ry: 0.102, asym: 0.10, pupil: 0.042 }],
  triste:      ['bianchi', [0.14, 0.25], [0.25, 0.14], 'giu',            { topCut: 0.32, topSlope: -0.22, pupil: 0.033 }],
  arrabbiato:  ['bianchi', [0.24, 0.13], [0.13, 0.24], 'stretti',        { topCut: 0.36, topSlope: 0.24, ruga: true, mento: true, pupil: 0.032 }],
  sorpreso:    ['bianchi', [0.26, 0.27], [0.27, 0.26], 'o',              { rx: 0.118, ry: 0.122, pupil: 0.025 }],
  annoiato:    ['bianchi', [0.15, 0.15], [0.15, 0.15], 'dritta',         { topCut: 0.48, mento: true, pupil: 0.034 }],
  furbo:       ['bianchi', [0.16, 0.20], [0.25, 0.22], 'lato',           { topCut: 0.38, asym: 0.16, botCut: 0, pupil: 0.035 }],
  scettico:    ['bianchi', [0.16, 0.16], [0.25, 0.24], 'lato',           { topCut: 0.42, asym: 0.22, mento: true, pupil: 0.034 }],
  ride:        ['archi',   [0.24, 0.23], [0.23, 0.24], 'aperta'],
  contento:    ['archi',   [0.21, 0.22], [0.22, 0.21], 'sorriso'],
  spaventato:  ['bianchi', [0.18, 0.28], [0.28, 0.18], 'onda',           { rx: 0.118, ry: 0.122, topCut: 0, botCut: 0, ruga: true, pupil: 0.018 }],
  nervoso:     ['bianchi', [0.15, 0.24], [0.24, 0.15], 'onda',           { topCut: 0.24, topSlope: -0.14, botCut: 0, pupil: 0.025 }],
  scioccato:   ['bianchi', [0.27, 0.28], [0.28, 0.27], 'stretti',        { rx: 0.122, ry: 0.124, topCut: 0, botCut: 0, ruga: true, pupil: 0.017 }],
  incredulo:   ['bianchi', [0.18, 0.24], [0.26, 0.20], 'giu',            { rx: 0.116, ry: 0.118, topCut: 0.18, asym: 0.24, botCut: 0, ruga: true, mento: true, pupil: 0.019 }],
  urla:        ['bianchi', [0.25, 0.14], [0.14, 0.25], 'urlo',           { rx: 0.118, ry: 0.120, topCut: 0.24, topSlope: 0.18, ruga: true, pupil: 0.021 }],
  panico:      ['bianchi', [0.17, 0.28], [0.28, 0.17], 'denti_tristi',   { rx: 0.124, ry: 0.126, topCut: 0, botCut: 0, ruga: true, pupil: 0.016 }],
  dolore:      ['strizzati', [0.15, 0.24], [0.24, 0.15], 'denti_tristi', { ruga: true }],
  piange:      ['strizzati', [0.15, 0.25], [0.25, 0.15], 'aperta_giu'],
  pensieroso:  ['bianchi', [0.16, 0.16], [0.25, 0.26], 'lato',           { topCut: 0.34, topSlope: -0.05, asym: -0.10, pupil: 0.032 }],
  confuso:     ['bianchi', [0.26, 0.25], [0.15, 0.16], 'onda',           { topCut: 0.28, asym: 0.34, pupil: 0.030 }],
  schifato:    ['bianchi', [0.14, 0.18], [0.18, 0.14], 'storta',         { topCut: 0.42, topSlope: 0.14, asym: 0.12, botCut: 0.16, ruga: true, mento: true, pupil: 0.025 }],
  assonnato:   ['bianchi', [0.14, 0.14], [0.14, 0.14], 'o_piccola',      { topCut: 0.62, botCut: 0, pupil: 0.028 }],
  deciso:      ['bianchi', [0.22, 0.14], [0.14, 0.22], 'dritta',         { topCut: 0.34, topSlope: 0.18, mento: true, pupil: 0.035 }],
  imbarazzato: ['bianchi', [0.16, 0.24], [0.24, 0.16], 'onda_piccola',   { topCut: 0.24, topSlope: -0.14, pupil: 0.028 }],
  fiero:       ['archi',   [0.23, 0.19], [0.19, 0.23], 'lato'],
  serio:       ['bianchi', [0.17, 0.16], [0.16, 0.17], 'dritta_piccola', { topCut: 0.44, rx: 0.102, ry: 0.092, asym: 0.04, pupil: 0.042 }],
  digrigna:    ['bianchi', [0.22, 0.16], [0.16, 0.22], 'digrigna',       { topCut: 0.38, topSlope: 0.18, ry: 0.098, pupil: 0.036 }],
  esaltato:    ['bianchi', [0.26, 0.28], [0.28, 0.26], 'aperta',         { topCut: 0, botCut: 0, rx: 0.096, ry: 0.104, pupil: 0.044 }],
  nei_guai:    ['bianchi', [0.15, 0.22], [0.22, 0.15], 'arco_triste',    { topCut: 0.04, botCut: 0, rx: 0.122, ry: 0.072, pupil: 0.026 }],
  sospetto:    ['bianchi', [0.15, 0.16], [0.19, 0.22], 'smorfia',        { topCut: 0.50, botCut: 0.14, rx: 0.112, ry: 0.096, asym: 0.12, pupil: 0.032 }],
  esasperato:  ['strizzati', [0.23, 0.13], [0.13, 0.23], 'stretti_larghi', { ruga: true }],
  concentrato: ['bianchi', [0.20, 0.15], [0.15, 0.20], 'stretta',        { topCut: 0.44, topSlope: 0.12, botCut: 0.16, pupil: 0.032 }],
  occhiolino:  ['occhiolino', [0.22, 0.24], [0.17, 0.15], 'lato',        { topCut: 0, botCut: 0, rx: 0.094, ry: 0.098, pupil: 0.044 }],
};
let PELLE_ORA = '#fbf6f2';
function faccia(g, e, fx, ey, hcy, HH, W, sp, sa, ca, dir, pal, sguardo = null, boccaOvr = null, fPop = 0, soprFolte = false) {
  const spec = FACCE[e] || FACCE.neutro;
  const [occhi, b0, b1, boccaBase, eyeOpt = {}] = spec;
  const bocca = boccaOvr || boccaBase;
  const hasSg = Array.isArray(sguardo);
  const gxS = hasSg ? Math.max(-1, Math.min(1, +(sguardo[0] || 0))) : 0;
  const gyS = hasSg ? Math.max(-1, Math.min(1, +(sguardo[1] || 0))) : 0;
  const eyeW = s => W * 0.054 * (s === dir ? 1 : 0.60 + 0.40 * ca);
  const ex = s => fx + s * sp;
  const my = hcy + HH * 0.205, mx = fx + dir * W * 0.01 * Math.abs(sa), mw = W * (0.5 + 0.5 * ca);
  const lontano = s => s !== dir && Math.abs(sa) > 0.92;
  const gxPx = s => (hasSg ? gxS * eyeW(s) * 0.48 : 0), gyPx = hasSg ? gyS * W * 0.022 : 0;

  const winkSide = occhi === 'occhiolino' ? (Math.abs(sa) > 0.35 ? dir : 1) : 0;
  [-1, 1].forEach(s => {
    if (lontano(s)) return;
    const X = ex(s), persp = (s === dir ? 1 : 0.60 + 0.40 * ca), w = eyeW(s), exO = X + gxPx(s), eyO = ey + gyPx;
    const eyeKind = (occhi === 'occhiolino' && s === winkSide) ? 'wink' : (occhi === 'occhiolino' ? 'bianchi' : occhi);
    if (pal > 0.5 || eyeKind === 'chiusi') {
      return tratto(g, [[X - w * 1.45, ey + W * 0.012], [X, ey + W * 0.036], [X + w * 1.45, ey + W * 0.012]], W * 0.032);
    }
    if (eyeKind === 'strizzati' || eyeKind === 'wink') {
      const tipX = X - s * w * (eyeKind === 'wink' ? 0.65 : 0.72), outX = X + s * w * 1.18, hyS = W * (eyeKind === 'wink' ? 0.056 : 0.068);
      return tratto(g, [[outX, ey - hyS], [tipX, ey], [outX, ey + hyS]], W * 0.034);
    }
    if (eyeKind === 'archi') {
      return tratto(g, [[X - w * 1.45, ey + W * 0.025], [X, ey - W * 0.046], [X + w * 1.45, ey + W * 0.025]], W * 0.036);
    }
    if (eyeKind.startsWith('bianchi')) {
      const rx = W * (eyeOpt.rx || 0.106) * persp, ry = W * (eyeOpt.ry || 0.106);
      const asymSide = eyeOpt.asym ? (s === dir ? -eyeOpt.asym * 0.5 : eyeOpt.asym * 0.5) : 0;
      const topCut = Math.max(0, Math.min(0.78, (eyeOpt.topCut || 0) + asymSide + pal * 0.35));
      const topSlope = eyeOpt.topSlope || 0;
      const botCut = Math.max(0, Math.min(0.45, eyeOpt.botCut || 0));
      const botSlope = eyeOpt.botSlope || 0;
      const E = new Path2D();
      E.ellipse(X, ey, rx, ry, 0, 0, Math.PI * 2);

      // Calcolo taglio palpebre morbido: inner (-s) vs outer (+s) con leggera curvatura organica sull'occhio
      const yTopL = -ry + ry * 2 * (topCut - s * (-1) * topSlope);
      const yTopR = -ry + ry * 2 * (topCut - s * (+1) * topSlope);
      const yBotL = ry - ry * 2 * (botCut - s * (-1) * botSlope);
      const yBotR = ry - ry * 2 * (botCut - s * (+1) * botSlope);
      const spanLid = rx * 1.06;
      const yTopCtrl = (yTopL + yTopR) * 0.5 - ry * 0.14 * (topSlope === 0 ? 1 : 0.45);
      const AP = new Path2D();
      AP.moveTo(X - spanLid, ey + yTopL);
      AP.quadraticCurveTo(X, ey + yTopCtrl, X + spanLid, ey + yTopR);
      AP.lineTo(X + spanLid, ey + yBotR);
      AP.lineTo(X - spanLid, ey + yBotL);
      AP.closePath();

      const yLidMid = ey + ((yTopL + yTopR) * 0.25 + yTopCtrl * 0.5), yBotMid = ey + (yBotL + yBotR) * 0.5;
      const pupilR = W * (eyeKind === 'bianchi_piccoli' ? 0.018 : (eyeOpt.pupil || 0.034));
      const defGx = hasSg ? gxS : (Math.abs(sa) > 0.08 ? dir * 0.20 : 0);
      const defGy = hasSg ? gyS : 0;
      const pxE = X + defGx * rx * 0.48;
      let pyE = ey + defGy * ry * 0.40;
      if (topCut > 0.15) pyE = Math.max(pyE, yLidMid + pupilR * 0.85);
      if (botCut > 0.12) pyE = Math.min(pyE, yBotMid - pupilR * 0.85);

      g.save();
      g.clip(AP);
      g.fillStyle = '#ffffff';
      g.fill(E);
      g.save();
      g.clip(E);
      punto(g, pxE, pyE, pupilR);
      g.restore();
      g.lineWidth = W * 0.026;
      g.strokeStyle = INK;
      g.stroke(E);
      g.restore();

      if (topCut > 0.02 || topSlope !== 0 || pal > 0.08) {
        tratto(g, [[X - spanLid, ey + yTopL], [X, ey + yTopCtrl], [X + spanLid, ey + yTopR]], W * 0.030);
      }
      if (botCut > 0.05 || botSlope !== 0) {
        tratto(g, [[X - rx * 0.94, ey + yBotL], [X + rx * 0.94, ey + yBotR]], W * 0.022);
      }
      return;
    }
    if (eyeKind === 'palpebra') {
      g.beginPath(); g.ellipse(exO, eyO, w * 1.85, W * 0.065, 0, 0, Math.PI); g.fillStyle = INK; g.fill();
      tratto(g, [[X - w * 2.1, eyO], [X + w * 2.1, eyO - (e === 'furbo' ? s * W * 0.015 : 0)]], W * 0.032);
      return;
    }
    g.beginPath(); g.ellipse(exO, eyO, w, W * 0.072 * (1 - pal), 0, 0, Math.PI * 2); g.fillStyle = INK; g.fill();
  });

  if (eyeOpt.ruga && pal < 0.5) {
    [-1, 1].forEach(rs => {
      const rxF = fx + rs * W * 0.015;
      tratto(g, [[rxF, ey - W * 0.140], [rxF - rs * W * 0.005, ey - W * 0.092]], W * 0.015);
    });
  }

  const brow = (s, h0, h1) => {
    if (lontano(s)) return;
    const bOff = (hasSg ? -gyS * 0.024 : 0) + fPop * 0.028 * Math.sign((h0 + h1) * 0.5 - 0.18 || 1);
    const mapH = h => Math.max(0.145, 0.195 + (h - 0.19) * 1.15) + bOff;
    h0 = mapH(h0);
    h1 = mapH(h1);
    const X = ex(s) + gxPx(s) * 0.35, l = W * 0.072 * (s === dir ? 1 : 0.65 + 0.35 * ca);
    const xL = s > 0 ? Math.max(fx + W * 0.018, X - l) : X - l;
    const xR = s < 0 ? Math.min(fx - W * 0.018, X + l) : X + l;
    const xM = (xL + xR) * 0.5;
    tratto(g, [[xL, ey - W * (h0 - 0.03)], [xM, ey - W * ((h0 + h1) / 2 - 0.014)], [xR, ey - W * (h1 - 0.03)]], W * (soprFolte ? 0.070 : 0.044));
  };
  if (winkSide < 0) { brow(-1, b1[1], b1[0]); brow(1, b0[1], b0[0]); }
  else { brow(-1, ...b0); brow(1, ...b1); }

  const T = (pts, w = 0.036) => tratto(g, pts, W * w), riempi = (P, col) => { g.fillStyle = col; g.fill(P); g.lineWidth = W * 0.03; g.strokeStyle = INK; g.stroke(P); };
  const onda = (l, h) => {
    g.beginPath(); for (let k = 0; k <= 16; k++) { const u = k / 16, px = mx - l + 2 * l * u, py = my + W * 0.03 + Math.sin(u * Math.PI * 4) * h; k ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.lineWidth = W * 0.032; g.lineCap = 'round'; g.strokeStyle = INK; g.stroke();
  };
  const boccaAperta = (l, h0, h1, lingua, dentiTop = true) => {
    const P = new Path2D(); P.moveTo(mx - l, my + h0); P.quadraticCurveTo(mx, my + h0 - W * 0.02, mx + l, my + h0); P.quadraticCurveTo(mx, my + h1, mx - l, my + h0);
    riempi(P, '#54212a');
    g.save(); g.clip(P);
    if (lingua) { g.beginPath(); g.ellipse(mx, my + h1 - W * 0.018, l * 0.62, W * 0.048, 0, 0, Math.PI * 2); g.fillStyle = '#d9666b'; g.fill(); }
    if (dentiTop) { g.fillStyle = '#ffffff'; g.fillRect(mx - l, my + Math.min(h0, h1) - W * 0.02, l * 2, W * 0.042); }
    g.restore();
    g.lineWidth = W * 0.028; g.strokeStyle = INK; g.stroke(P);
  };
  g.save(); g.translate(mx, my); g.scale(1.36, 1.38); g.translate(-mx, -my);
  switch (bocca) {
    case 'chiusa': T([[mx - mw * 0.075, my + W * 0.02], [mx + mw * 0.075, my + W * 0.02]], 0.030); break;
    case 'stretta': T([[mx - mw * 0.055, my + W * 0.03], [mx + mw * 0.055, my + W * 0.03]]); break;
    case 'sorriso': T([[mx - mw * 0.125, my - W * 0.015], [mx, my + W * 0.095], [mx + mw * 0.125, my - W * 0.015]]); break;
    case 'giu': T([[mx - mw * 0.10, my + W * 0.068], [mx, my - W * 0.022], [mx + mw * 0.10, my + W * 0.068]]); break;
    case 'dritta': T([[mx - mw * 0.095, my + W * 0.028], [mx + mw * 0.095, my + W * 0.018]]); break;
    case 'dritta_piccola': T([[mx - mw * 0.062, my + W * 0.026], [mx + mw * 0.062, my + W * 0.022]], 0.034); break;
    case 'lato': T([[mx - mw * 0.075, my + W * 0.028], [mx + mw * 0.035, my + W * 0.038], [mx + mw * 0.115, my - W * 0.018]]); break;
    case 'smorfia': T([[mx - mw * 0.055, my + W * 0.032], [mx + mw * 0.015, my + W * 0.042], [mx + mw * 0.075, my + W * 0.012]], 0.032); break;
    case 'arco_triste': T([[mx - mw * 0.125, my + W * 0.078], [mx, my - W * 0.038], [mx + mw * 0.125, my + W * 0.078]], 0.036); break;
    case 'storta': T([[mx - mw * 0.10, my + W * 0.055], [mx, my + W * 0.018], [mx + mw * 0.10, my - W * 0.018]]); break;
    case 'digrigna': {
      const P = new Path2D(), l = mw * 0.175;
      P.moveTo(mx - l, my - W * 0.018); P.quadraticCurveTo(mx, my + W * 0.010, mx + l, my - W * 0.018); P.quadraticCurveTo(mx, my + W * 0.155, mx - l, my - W * 0.018);
      g.fillStyle = '#ffffff'; g.fill(P); g.save(); g.clip(P);
      T([[mx - l, my + W * 0.036], [mx, my + W * 0.050], [mx + l, my + W * 0.036]], 0.016);
      for (let k = -2; k <= 2; k++) T([[mx + k * l * 0.34, my - W * 0.03], [mx + k * l * 0.34, my + W * 0.14]], 0.014);
      g.restore(); g.lineWidth = W * 0.03; g.strokeStyle = INK; g.stroke(P); break;
    }
    case 'stretti_larghi': {
      const P = new Path2D(), l = mw * 0.175;
      P.roundRect(mx - l, my - W * 0.022, 2 * l, W * 0.118, W * 0.034);
      g.fillStyle = '#ffffff'; g.fill(P); g.save(); g.clip(P);
      for (let k = -3; k <= 3; k++) T([[mx + k * l * 0.28, my - W * 0.05], [mx + k * l * 0.28, my + W * 0.15]], 0.014);
      T([[mx - l, my + W * 0.038], [mx + l, my + W * 0.038]], 0.016);
      g.restore(); g.lineWidth = W * 0.03; g.strokeStyle = INK; g.stroke(P); break;
    }
    case 'o': { const P = new Path2D(); P.ellipse(mx, my + W * 0.03, mw * 0.065, W * 0.085, 0, 0, Math.PI * 2); riempi(P, '#54212a'); break; }
    case 'o_piccola': { g.beginPath(); g.ellipse(mx, my + W * 0.03, mw * 0.032, W * 0.038, 0, 0, Math.PI * 2); g.fillStyle = '#54212a'; g.fill(); g.lineWidth = W * 0.026; g.strokeStyle = INK; g.stroke(); break; }
    case 'aperta': boccaAperta(mw * 0.155, -W * 0.02, W * 0.165, true, true); break;
    case 'larga': boccaAperta(mw * 0.175, -W * 0.03, W * 0.185, true, true); break;
    case 'aperta_giu': boccaAperta(mw * 0.115, W * 0.065, -W * 0.035, false, false); break;
    case 'denti_tristi': boccaAperta(mw * 0.14, W * 0.075, -W * 0.045, true, true); break;
    case 'urlo': {
      g.beginPath(); g.ellipse(mx, my + W * 0.05, mw * 0.115, W * 0.125, 0, 0, Math.PI * 2); g.fillStyle = '#54212a'; g.fill(); g.lineWidth = W * 0.03; g.strokeStyle = INK; g.stroke();
      g.save(); g.clip(); g.beginPath(); g.ellipse(mx, my + W * 0.15, mw * 0.085, W * 0.052, 0, 0, Math.PI * 2); g.fillStyle = '#d9666b'; g.fill(); g.fillStyle = '#fff'; g.fillRect(mx - mw * 0.12, my - W * 0.08, mw * 0.24, W * 0.052); g.restore(); break;
    }
    case 'onda': onda(mw * 0.11, W * 0.017); break;
    case 'onda_piccola': onda(mw * 0.07, W * 0.012); break;
    case 'stretti': case 'denti': {
      const P = new Path2D(), l = mw * (bocca === 'denti' ? 0.165 : 0.145);
      if (bocca === 'denti') { P.moveTo(mx - l, my - W * 0.025); P.quadraticCurveTo(mx, my + W * 0.018, mx + l, my - W * 0.035); P.quadraticCurveTo(mx, my + W * 0.165, mx - l, my - W * 0.025); }
      else P.roundRect(mx - l, my - W * 0.015, 2 * l, W * 0.088, W * 0.028);
      g.fillStyle = '#ffffff'; g.fill(P); g.save(); g.clip(P);
      for (let k = -2; k <= 2; k++) T([[mx + k * l * 0.36, my - W * 0.05], [mx + k * l * 0.36, my + W * 0.17]], 0.014);
      T([[mx - l, my + W * 0.030], [mx + l, my + W * 0.030]], 0.014);
      g.restore();
      g.lineWidth = W * 0.03; g.strokeStyle = INK; g.stroke(P); break;
    }
    default: T([[mx - mw * 0.07, my + W * 0.01], [mx + mw * 0.005, my + W * 0.065], [mx + mw * 0.09, my - W * 0.015]]);
  }
  if (eyeOpt.mento) {
    T([[mx - mw * 0.035, my + W * 0.115], [mx + mw * 0.035, my + W * 0.115]], 0.020);
  }
  g.restore();
  if (e === 'piange') [-1, 1].forEach(s => {
    if (lontano(s)) return; const X = ex(s) + s * W * 0.02; const P = new Path2D(); P.moveTo(X, ey + W * 0.04); P.quadraticCurveTo(X + s * W * 0.032, ey + W * 0.15, X, ey + W * 0.21);
    P.quadraticCurveTo(X - s * W * 0.022, ey + W * 0.13, X, ey + W * 0.04); g.fillStyle = '#8fd0f5'; g.fill(P); g.lineWidth = W * 0.016; g.strokeStyle = INK; g.stroke(P);
  });
  if (e === 'imbarazzato') [-1, 1].forEach(s => { if (lontano(s)) return; for (let k = 0; k < 3; k++) T([[ex(s) + s * W * 0.02 + (k - 1) * W * 0.035, ey + W * 0.115], [ex(s) + s * W * 0.02 + (k - 1) * W * 0.035 - W * 0.015, ey + W * 0.155]], 0.013); });
}

// ---------------- VARIETÀ: forme di testa e corpo, capelli, accessori (tutto a numeri, stesse facce per tutti) ----------------
// testa: hw = altezza/larghezza; nTop/nBot = quanto è squadrata sopra/sotto (2 tondo, 4 squadrato, <2 a punta); egg = mento stretto (-) o largo (+)
export const TESTE = {
  tonda: { hw: 0.89, nTop: 1.85, nBot: 2.32, egg: -0.06 }, squadrata: { hw: 0.87, nTop: 3.05, nBot: 3.10, egg: 0.01 }, uovo: { hw: 0.96, nTop: 1.90, nBot: 2.22, egg: -0.09 },
  larga: { hw: 0.81, nTop: 2.15, nBot: 2.55, egg: 0.04 }, lunga: { hw: 1.03, nTop: 2.15, nBot: 2.30, egg: -0.06 }, pera: { hw: 0.90, nTop: 1.90, nBot: 2.68, egg: 0.14 },
  triangolo: { hw: 0.92, nTop: 2.35, nBot: 1.95, egg: -0.18 }, fagiolo: { hw: 0.87, nTop: 1.95, nBot: 2.12, egg: -0.04 },
};
// corpo: largo/alto rispetto al busto base, gambe = lunghezza; stessa logica di forma della testa
export const CORPI = {
  fagiolo: { nTop: 1.85, nBot: 2.15, egg: -0.18, largo: 0.78, alto: 0.78, gambe: 0.80 }, tondo: { nTop: 2.0, nBot: 2.0, egg: 0, largo: 1.04, alto: 0.78, gambe: 0.70 },
  squadrato: { nTop: 3.4, nBot: 3.4, egg: 0, largo: 0.88, alto: 0.78, gambe: 0.78 }, triangolo: { nTop: 3.0, nBot: 2.2, egg: -0.35, largo: 0.95, alto: 0.82, gambe: 0.82 },
  pera: { nTop: 2.0, nBot: 2.4, egg: 0.36, largo: 0.86, alto: 0.78, gambe: 0.74 }, magro: { nTop: 2.0, nBot: 2.2, egg: -0.08, largo: 0.66, alto: 0.82, gambe: 0.88 },
  bambino: { nTop: 1.9, nBot: 2.1, egg: -0.14, largo: 0.64, alto: 0.56, gambe: 0.50 }, botte: { nTop: 2.5, nBot: 2.5, egg: 0.08, largo: 1.12, alto: 0.74, gambe: 0.64 },
  gigante: { nTop: 2.6, nBot: 2.4, egg: -0.22, largo: 1.08, alto: 0.96, gambe: 0.88 },
};
const tipo = o => o.capelliTipo || 'corti';
function capelliDietro(g, o, cx, cy, W, HH, sa, dir, col, back = 0, lagX = 0, lagY = 0) {
  const t = tipo(o), P = new Path2D(), isBack = back > 0.42;
  const ox = -sa * W * (isBack ? 0.12 : 0.08);
  const fxL = lagX * 0.75, fyL = lagY * 0.75;
  if (t === 'lunghi') {
    P.moveTo(cx + ox - W * 0.5, cy - HH * 0.15); P.bezierCurveTo(cx + ox - W * 0.64 + fxL * 0.4, cy + HH * 0.3 + fyL * 0.4, cx + ox - W * 0.6 + fxL, cy + HH * 0.6 + fyL, cx + ox - W * 0.42 + fxL, cy + HH * 0.72 + fyL);
    P.quadraticCurveTo(cx + ox - W * 0.3 + fxL * 0.7, cy + HH * 0.58 + fyL * 0.7, cx + ox + fxL * 0.5, cy + HH * 0.5 + fyL * 0.5); P.quadraticCurveTo(cx + ox + W * 0.3 + fxL * 0.7, cy + HH * 0.58 + fyL * 0.7, cx + ox + W * 0.42 + fxL, cy + HH * 0.72 + fyL);
    P.bezierCurveTo(cx + ox + W * 0.6 + fxL, cy + HH * 0.6 + fyL, cx + ox + W * 0.64 + fxL * 0.4, cy + HH * 0.3 + fyL * 0.4, cx + ox + W * 0.5, cy - HH * 0.15); P.quadraticCurveTo(cx + ox + W * 0.5, cy - HH * 0.62, cx + ox, cy - HH * 0.62); P.quadraticCurveTo(cx + ox - W * 0.5, cy - HH * 0.62, cx + ox - W * 0.5, cy - HH * 0.15);
  }
  else if (t === 'caschetto') {
    P.moveTo(cx + ox - W * 0.52, cy - HH * 0.14);
    P.bezierCurveTo(cx + ox - W * 0.62 + fxL * 0.25, cy + HH * 0.18, cx + ox - W * 0.58 + fxL * 0.4, cy + HH * 0.38 + fyL * 0.3, cx + ox - W * 0.38 + fxL * 0.35, cy + HH * 0.40 + fyL * 0.3);
    P.quadraticCurveTo(cx + ox + fxL * 0.25, cy + HH * 0.32 + fyL * 0.2, cx + ox + W * 0.38 + fxL * 0.35, cy + HH * 0.40 + fyL * 0.3);
    P.bezierCurveTo(cx + ox + W * 0.58 + fxL * 0.4, cy + HH * 0.38 + fyL * 0.3, cx + ox + W * 0.62 + fxL * 0.25, cy + HH * 0.18, cx + ox + W * 0.52, cy - HH * 0.14);
    P.quadraticCurveTo(cx + ox + W * 0.52, cy - HH * 0.60, cx + ox, cy - HH * 0.60);
    P.quadraticCurveTo(cx + ox - W * 0.52, cy - HH * 0.60, cx + ox - W * 0.52, cy - HH * 0.14);
  }
  else if (t === 'afro') {
    P.ellipse(cx - sa * W * 0.08 + fxL * 0.15, cy - HH * 0.10 + fyL * 0.15, W * 0.70, HH * 0.62, 0, 0, Math.PI * 2);
  }
  else if (t === 'trecce') {
    [-1, 1].forEach(s => {
      if (s === dir && Math.abs(sa) > (isBack ? 0.85 : 0.7)) return; const tx = cx + s * W * 0.5 * (1 - 0.4 * Math.abs(sa)) + ox; P.moveTo(tx + W * 0.13 + fxL * 0.3, cy + HH * 0.08 + fyL * 0.3); P.ellipse(tx + fxL * 0.3, cy + HH * 0.08 + fyL * 0.3, W * 0.13, W * 0.22, s * 0.25 - fxL / W * 1.5, 0, Math.PI * 2);
      P.moveTo(tx + s * W * 0.06 + fxL + W * 0.1, cy + HH * 0.5 + fyL); P.ellipse(tx + s * W * 0.06 + fxL, cy + HH * 0.5 + fyL, W * 0.1, W * 0.16, s * 0.2 - fxL / W * 2.0, 0, Math.PI * 2);
    });
  }
  else if (t === 'chignon') {
    const chY = cy - HH * (0.50 - 0.16 * back) + fyL * 0.25;
    P.ellipse(cx - sa * W * (isBack ? 0.26 : 0.30) + fxL * 0.25, chY, W * 0.24, W * 0.19, 0, 0, Math.PI * 2);
  }
  else if (t === 'codino') {
    if (isBack) {
      const hx = cx - sa * W * 0.22, hy = cy + HH * 0.02;
      const cxT = cx - sa * W * 0.30 + fxL, cyT = cy + HH * 0.24 + fyL;
      P.ellipse(cxT, cyT, W * 0.13, W * 0.26, -sa * 0.22 - fxL / W * 2.2, 0, Math.PI * 2);
      g.fillStyle = col; g.fill(P); g.lineWidth = W * 0.045; g.strokeStyle = INK; g.stroke(P);
      punto(g, hx, hy, W * 0.065, INK);
      return;
    }
    const codX = cx - dir * W * (0.35 + 0.25 * Math.abs(sa)) + fxL;
    P.ellipse(codX, cy - HH * 0.15 + fyL, W * 0.15, W * 0.28, dir * 0.5 - fxL / W * 2.0, 0, Math.PI * 2);
  }
  else return;
  g.fillStyle = col; g.fill(P); g.lineWidth = W * 0.045; g.strokeStyle = INK; g.stroke(P);
  if (t === 'lunghi') { g.save(); g.clip(P); g.globalAlpha = 0.4;[-0.38, -0.2, 0.2, 0.38].forEach(d => tratto(g, [[cx + ox + d * W, cy], [cx + ox + d * W * 1.05 + fxL * 0.5, cy + HH * 0.3 + fyL * 0.5], [cx + ox + d * W * 0.95 + fxL, cy + HH * 0.58 + fyL]], W * 0.02, '#ffffff')); g.restore(); }
  if (t === 'afro') { g.save(); g.clip(P); g.globalAlpha = 0.26;[-0.32, 0.16].forEach(d => { g.beginPath(); g.arc(cx - sa * W * 0.08 + d * W, cy - HH * 0.38, W * 0.14, Math.PI * 1.1, Math.PI * 1.75); g.lineWidth = W * 0.025; g.strokeStyle = '#ffffff'; g.stroke(); }); g.restore(); }
}
function capelliDentro(g, o, cx, cy, W, HH, sa, dir, fx, col, acc, back = 0) {
  const t = tipo(o), isBack = back > 0.42; g.fillStyle = col;
  if (!isBack && acc.has('barba')) {
    const P = new Path2D(); P.moveTo(cx - W, cy + HH * 0.14); P.quadraticCurveTo(fx, cy + HH * 0.36, cx + W, cy + HH * 0.14); P.lineTo(cx + W, cy + HH); P.lineTo(cx - W, cy + HH); P.closePath(); g.fill(P);
    g.fillStyle = PELLE_ORA; g.beginPath(); g.ellipse(fx, cy + HH * 0.23, W * 0.145, W * 0.105, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = col;
  }
  if (t === 'pelato') { g.globalAlpha = 0.5; tratto(g, [[cx - W * 0.22 + (isBack ? -sa : sa) * W * 0.1, cy - HH * 0.36], [cx - W * 0.1 + (isBack ? -sa : sa) * W * 0.1, cy - HH * 0.42]], W * 0.03, '#ffffff'); g.globalAlpha = 1; return; }
  if (t === 'cappello' || t === 'cuoco' || t === 'berretto' || t === 'elmetto' || t === 'zuccotto' || t === 'paglia' || t === 'cuffia_medica') {
    if (isBack) {
      const B = new Path2D(); B.moveTo(cx - W, cy + HH * 0.40); B.quadraticCurveTo(cx, cy + HH * 0.31, cx + W, cy + HH * 0.40);
      B.lineTo(cx + W, cy - HH); B.lineTo(cx - W, cy - HH); B.closePath(); g.fill(B);
    }
    return;
  }
  if (t === 'calvo_lati') {
    if (isBack) { const C = new Path2D(); C.moveTo(cx - W, cy - HH * 0.02); C.quadraticCurveTo(cx, cy + HH * 0.06, cx + W, cy - HH * 0.02); C.lineTo(cx + W, cy + HH * 0.34); C.quadraticCurveTo(cx, cy + HH * 0.26, cx - W, cy + HH * 0.34); C.closePath(); g.fill(C); return; }
    [-1, 1].forEach(s => { if (s === dir && Math.abs(sa) > 0.2) return; g.beginPath(); g.ellipse(cx + s * W * 0.47 + sa * W * 0.25, cy - HH * 0.02, W * 0.1, HH * 0.15, 0, 0, Math.PI * 2); g.fill(); }); return;
  }
  const alto = { ricci: 0.32, lunghi: 0.26, trecce: 0.26, chignon: 0.27, caschetto: 0.24, afro: 0.28, codino: 0.24, riga: 0.2, cresta: 0.38, frangia: 0.08, fedora: 0.22, basco: 0.20, ciuffo: 0.22, pompadour: 0.22, spettinato: 0.22 }[t] ?? 0.2;
  if (isBack) {
    // Vista di spalle: la capigliatura avvolge tutta la nuca fino quasi alla base del collo
    const P = new Path2D(), baseY = t === 'cresta' ? cy + HH * 0.12 : (t === 'caschetto' || t === 'fedora' ? cy + HH * 0.35 : cy + HH * 0.44);
    P.moveTo(cx - W, baseY);
    P.quadraticCurveTo(cx, cy + HH * (t === 'cresta' ? 0.04 : 0.34), cx + W, baseY);
    P.lineTo(cx + W, cy - HH); P.lineTo(cx - W, cy - HH); P.closePath(); g.fill(P);
    if (t !== 'ricci' && t !== 'afro') {
      g.globalAlpha = 0.45;[[-0.28, -0.24, 0.38], [-0.14, -0.34, 0.42], [0.02, -0.32, 0.34], [-0.22, -0.02, 0.44]].forEach(([dx, dy, l]) => {
        tratto(g, [[cx + (dx - sa * 0.08) * W, cy + dy * HH], [cx + (dx - sa * 0.08 + l * 0.5) * W, cy + (dy - 0.06) * HH], [cx + (dx - sa * 0.08 + l) * W, cy + (dy + 0.05) * HH]], W * 0.022, '#8a8494');
      }); g.globalAlpha = 1;
    }
    return;
  }
  const P = new Path2D(); P.moveTo(cx - W, cy - HH * alto);
  if (t === 'lunghi' || t === 'trecce' || t === 'chignon' || t === 'caschetto') {   // capigliatura piena: riga al centro della faccia, ciocche che scendono ai lati
    const px = fx, pt = cy - HH * (t === 'caschetto' ? 0.34 : 0.36), sideY = cy + HH * (t === 'caschetto' ? 0.02 : 0.05); P.moveTo(cx - W, sideY); P.lineTo(cx - W * 0.5, sideY);
    P.quadraticCurveTo(cx - W * 0.42 + sa * W * 0.2, cy - HH * 0.3, px - W * 0.02, pt); P.quadraticCurveTo(cx + W * 0.42 + sa * W * 0.2, cy - HH * 0.3, cx + W * 0.5, sideY); P.lineTo(cx + W, sideY);
  }
  else if (t === 'riga') { P.quadraticCurveTo(cx - W * 0.2, cy - HH * (alto + 0.12), cx - dir * W * 0.2 + sa * W * 0.2, cy - HH * (alto + 0.18)); P.quadraticCurveTo(cx + W * 0.2, cy - HH * (alto - 0.15), cx + W, cy - HH * (alto - 0.25)); }
  else if (t === 'frangia') { for (let k = 0; k <= 6; k++) P.lineTo(cx - W * 0.55 + k * W * 0.183 + sa * W * 0.15, cy - HH * (alto + (k % 2 ? 0.08 : 0))); P.lineTo(cx + W, cy - HH * alto); }
  else { P.quadraticCurveTo(cx - W * 0.1 + sa * W * 0.3, cy - HH * (alto - 0.1), fx + W * 0.06 * dir, cy - HH * (alto + 0.08)); P.quadraticCurveTo(cx + W * 0.3, cy - HH * alto, cx + W, cy - HH * (alto - 0.1)); }
  P.lineTo(cx + W, cy - HH); P.lineTo(cx - W, cy - HH); P.closePath(); g.fill(P);
  if (Math.abs(sa) > 0.15 && !['cresta', 'lunghi', 'trecce', 'chignon', 'caschetto'].includes(t)) {
    const k = Math.abs(sa), nx = cx - dir * W * 0.5, N = new Path2D();   // nuca
    N.moveTo(cx - dir * W * (0.5 - 0.62 * k) * 0.6, cy - HH * 0.3); N.quadraticCurveTo(cx - dir * W * (0.18 - 0.1 * k), cy + HH * 0.05, nx - dir * W * 0.1, cy + HH * 0.2 * k);
    N.lineTo(nx - dir * W, cy + HH * 0.5); N.lineTo(nx - dir * W, cy - HH); N.closePath(); g.fill(N);
  }
  if (t !== 'ricci' && t !== 'afro') {
    g.globalAlpha = 0.5;[[-0.34, -0.3, 0.42], [-0.22, -0.4, 0.5], [-0.06, -0.44, 0.46], [0.1, -0.42, 0.36]].forEach(([dx, dy, l]) => {
      if (-dy < alto + 0.04) return;
      tratto(g, [[cx + (dx + sa * 0.1) * W, cy + dy * HH], [cx + (dx + sa * 0.1 + l * 0.5) * W, cy + (dy - 0.07) * HH], [cx + (dx + sa * 0.1 + l) * W, cy + (dy + 0.05) * HH]], W * 0.022, '#8a8494');
    }); g.globalAlpha = 1;
  }
}
function capelliSopra(g, o, cx, cy, W, HH, sa, dir, col, back = 0, lagX = 0, lagY = 0) {
  const t = tipo(o), cap = o.cappelloCol || '#7a4a2a', isBack = back > 0.42, ax = isBack ? -sa : sa;
  const pieno = (P, c) => { g.fillStyle = c; g.fill(P); g.lineWidth = W * 0.045; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke(P); };
  if (t === 'ricci') {
    const pts = []; for (let k = 0; k <= 8; k++) { const an = Math.PI * (1.08 + k * 0.105); pts.push([cx + Math.cos(an) * W * 0.47 + ax * W * 0.05, cy + Math.sin(an) * HH * 0.47]); }
    pts.forEach(([px, py]) => { g.beginPath(); g.arc(px, py, W * 0.12, 0, Math.PI * 2); g.fillStyle = INK; g.fill(); });
    pts.forEach(([px, py]) => { g.beginPath(); g.arc(px, py, W * 0.095, 0, Math.PI * 2); g.fillStyle = col; g.fill(); });
  }
  if (t === 'cuoco') {
    const top = cy - HH * 0.36, F = new Path2D(), Bd = new Path2D(); const bx = cx + ax * W * 0.05;
    F.moveTo(bx - W * 0.3, top); F.bezierCurveTo(bx - W * 0.62, top - W * 0.2, bx - W * 0.42, top - W * 0.62, bx - W * 0.15, top - W * 0.52);
    F.bezierCurveTo(bx - W * 0.1, top - W * 0.78, bx + W * 0.25, top - W * 0.78, bx + W * 0.2, top - W * 0.52);
    F.bezierCurveTo(bx + W * 0.5, top - W * 0.62, bx + W * 0.62, top - W * 0.2, bx + W * 0.3, top); F.closePath(); pieno(F, '#ffffff');
    tratto(g, [[bx - W * 0.12, top - W * 0.1], [bx - W * 0.1, top - W * 0.36]], W * 0.018); tratto(g, [[bx + W * 0.12, top - W * 0.1], [bx + W * 0.1, top - W * 0.36]], W * 0.018);
    Bd.roundRect(bx - W * 0.36, top - W * 0.06, W * 0.72, W * 0.16, W * 0.04); pieno(Bd, '#f2f0ec');
  }
  if (t === 'ricci') {
    g.globalAlpha = 0.45; for (let k = 0; k < 9; k += 2) {
      const an = Math.PI * (1.08 + k * 0.105), px = cx + Math.cos(an) * W * 0.47 + ax * W * 0.05, py = cy + Math.sin(an) * HH * 0.47;
      g.beginPath(); g.arc(px, py, W * 0.06, Math.PI * 1.1, Math.PI * 1.6); g.lineWidth = W * 0.02; g.strokeStyle = '#ffffff'; g.stroke();
    } g.globalAlpha = 1;
  }
  if (t === 'cresta') {
    const P = new Path2D(), bx = cx + ax * W * 0.15, top = cy - HH * 0.48; P.moveTo(bx - W * 0.18, top + HH * 0.1);
    for (let k = 0; k < 4; k++) { P.lineTo(bx - W * 0.18 + (k + 0.5) * W * 0.09, top - W * (0.18 + 0.04 * (k % 2))); P.lineTo(bx - W * 0.18 + (k + 1) * W * 0.09, top + HH * 0.02); } P.closePath(); pieno(P, col);
  }
  if (t === 'ciuffo' || t === 'pompadour') {
    const isPomp = t === 'pompadour', top = cy - HH * 0.43 + lagY * 0.16;
    const d = isBack ? -dir : dir, qx = cx + ax * W * 0.12 + lagX * 0.22;
    const hQ = W * (isPomp ? 0.29 : 0.22), fSpan = W * (isPomp ? 0.34 : 0.26), bSpan = W * (isPomp ? 0.36 : 0.32);
    const P = new Path2D();
    P.moveTo(qx - d * bSpan, top + HH * 0.05);
    P.bezierCurveTo(qx - d * bSpan * 0.85, top - hQ * 0.72, qx + d * fSpan * 0.55, top - hQ * 1.15, qx + d * fSpan, top - hQ * 0.42);
    P.quadraticCurveTo(qx + d * fSpan * 0.88, top + HH * 0.04, qx + d * fSpan * 0.22, top + HH * 0.07);
    P.quadraticCurveTo(qx - d * bSpan * 0.4, top + HH * 0.10, qx - d * bSpan, top + HH * 0.05);
    P.closePath();
    pieno(P, col);
    g.save(); g.clip(P); g.globalAlpha = 0.28;
    tratto(g, [[qx - d * bSpan * 0.4, top - hQ * 0.36], [qx + d * fSpan * 0.45, top - hQ * 0.62]], W * 0.024, '#ffffff');
    g.restore();
  }
  if (t === 'spettinato') {
    const bx = cx + ax * W * 0.08 + lagX * 0.18, top = cy - HH * 0.44 + lagY * 0.16;
    const P = new Path2D();
    P.moveTo(bx - W * 0.32, top + HH * 0.12);
    P.quadraticCurveTo(bx - W * 0.40, top - W * 0.14, bx - W * 0.16, top - W * 0.04);
    P.quadraticCurveTo(bx - W * 0.04, top - W * 0.26, bx + W * 0.08, top - W * 0.06);
    P.quadraticCurveTo(bx + W * 0.34, top - W * 0.22, bx + W * 0.30, top + HH * 0.10);
    P.quadraticCurveTo(bx, top + HH * 0.15, bx - W * 0.32, top + HH * 0.12);
    P.closePath();
    pieno(P, col);
  }
  if (t === 'fedora') {
    const fedCol = o.cappelloCol || '#292530', bandCol = o.fasciaCol || '#c94a38', top = cy - HH * 0.27 + lagY * 0.10;
    const bx = cx + ax * W * 0.05, ang = (isBack ? dir : -dir) * 0.075 + lagX / W * 0.12;
    g.save(); g.translate(bx, top); g.rotate(ang);
    const B = new Path2D(), C = new Path2D();
    B.ellipse(0, 0, W * (0.58 + 0.04 * Math.abs(sa)), W * 0.100, 0, 0, Math.PI * 2);
    pieno(B, mix(fedCol, '#000000', 0.14));
    C.moveTo(-W * 0.37, W * 0.01);
    C.lineTo(-W * 0.27, -W * 0.31);
    C.quadraticCurveTo(-W * 0.14, -W * 0.35, 0, -W * 0.28);
    C.quadraticCurveTo(W * 0.14, -W * 0.35, W * 0.27, -W * 0.31);
    C.lineTo(W * 0.37, W * 0.01);
    C.quadraticCurveTo(0, W * 0.055, -W * 0.37, W * 0.01);
    C.closePath();
    pieno(C, fedCol);
    g.save(); g.clip(C);
    g.fillStyle = bandCol; g.fillRect(-W * 0.5, -W * 0.085, W, W * 0.095);
    g.lineWidth = W * 0.016; g.strokeStyle = INK; g.strokeRect(-W * 0.5, -W * 0.085, W, W * 0.095);
    g.restore();
    g.restore();
  }
  if (t === 'basco') {
    const berCol = o.cappelloCol || '#463a4d', top = cy - HH * 0.30 + lagY * 0.12;
    const bx = cx + ax * W * 0.06, ang = (isBack ? dir : -dir) * 0.16 + lagX / W * 0.12;
    g.save(); g.translate(bx, top);
    const Rm = new Path2D(); Rm.ellipse(0, 0, W * 0.45, W * 0.075, 0, 0, Math.PI * 2);
    pieno(Rm, mix(berCol, '#000000', 0.25));
    g.translate((isBack ? dir : -dir) * W * 0.07, -W * 0.09); g.rotate(ang);
    const P = new Path2D(); P.ellipse(0, 0, W * 0.56, W * 0.22, 0, 0, Math.PI * 2);
    pieno(P, berCol);
    tratto(g, [[0, -W * 0.22], [(isBack ? dir : -dir) * W * 0.04, -W * 0.28]], W * 0.032, INK);
    g.restore();
  }
  if (t === 'cappello') {
    const top = cy - HH * 0.32, B = new Path2D(), C = new Path2D(); B.ellipse(cx + ax * W * 0.04, top, W * 0.61, W * 0.105, 0, 0, Math.PI * 2); pieno(B, cap);
    C.moveTo(cx - W * 0.38, top); C.quadraticCurveTo(cx - W * 0.4, top - W * 0.4, cx, top - W * 0.4); C.quadraticCurveTo(cx + W * 0.4, top - W * 0.4, cx + W * 0.38, top); C.quadraticCurveTo(cx, top + W * 0.06, cx - W * 0.38, top); pieno(C, cap);
    g.save(); g.clip(C); g.fillStyle = INK; g.globalAlpha = 0.6; g.fillRect(cx - W, top - W * 0.12, W * 2, W * 0.08); g.restore();
  }
  if (t === 'berretto') {
    const top = cy - HH * 0.18, D = new Path2D(), V = new Path2D(); D.moveTo(cx - W * 0.52, top); D.quadraticCurveTo(cx - W * 0.54, cy - HH * 0.7, cx, cy - HH * 0.7); D.quadraticCurveTo(cx + W * 0.54, cy - HH * 0.7, cx + W * 0.52, top); D.closePath();
    if (!isBack) {
      const vx = cx + (sa * 0.34 + 0.03 * dir) * W;
      V.ellipse(vx + dir * W * 0.04 * Math.abs(sa), top + W * 0.01, W * (0.29 - 0.09 * Math.abs(sa)), W * 0.066, 0, 0, Math.PI * 2);
      pieno(V, mix(cap, '#000000', 0.25));
    } else if (Math.abs(sa) > 0.42) {
      const vx = cx + dir * W * 0.34;
      V.ellipse(vx, top + W * 0.01, W * 0.18 * Math.abs(sa), W * 0.06, 0, 0, Math.PI * 2);
      pieno(V, mix(cap, '#000000', 0.25));
    }
    pieno(D, cap);
    if (isBack) {
      const sx = cx - sa * W * 0.26, sw = W * (0.24 - 0.08 * Math.abs(sa)), sh = W * 0.10;
      const AR = new Path2D(); AR.ellipse(sx, top, sw, sh, 0, Math.PI, Math.PI * 2); AR.closePath();
      g.fillStyle = o.capelliTipo === 'pelato' ? PELLE_ORA : col; g.fill(AR); g.lineWidth = W * 0.025; g.strokeStyle = INK; g.stroke(AR);
      tratto(g, [[sx - sw * 0.9, top], [sx + sw * 0.9, top]], W * 0.036, mix(cap, '#000000', 0.35));
    }
    g.beginPath(); g.arc(cx + ax * W * 0.1, cy - HH * 0.69, W * 0.035, 0, Math.PI * 2); g.fillStyle = INK; g.fill();
  }
  if (t === 'elmetto') {
    const elmCol = o.cappelloCol || '#f2b726', top = cy - HH * 0.18 + lagY * 0.06, bx = cx + ax * W * 0.04;
    const B = new Path2D(), D = new Path2D();
    D.moveTo(cx - W * 0.54, top);
    D.bezierCurveTo(cx - W * 0.56, cy - HH * 0.68, cx + W * 0.56, cy - HH * 0.68, cx + W * 0.54, top);
    D.closePath();
    pieno(D, elmCol);
    // Nervatura centrale dell'elmetto
    const cr = new Path2D();
    cr.roundRect(bx - W * 0.075, cy - HH * 0.66, W * 0.15, HH * 0.36, W * 0.04);
    pieno(cr, mix(elmCol, '#ffffff', 0.22));
    // Tesa rigida dell'elmetto
    B.ellipse(bx + (isBack ? -sa : sa) * W * 0.04, top + W * 0.015, W * 0.56, W * 0.082, 0, 0, Math.PI * 2);
    pieno(B, mix(elmCol, '#000000', 0.15));
    if (!isBack && o.elmettoStemma) {
      const S = new Path2D(), sx = cx + sa * W * 0.22, sy = cy - HH * 0.38;
      S.moveTo(sx - W * 0.10, sy - W * 0.09); S.lineTo(sx + W * 0.10, sy - W * 0.09);
      S.lineTo(sx + W * 0.08, sy + W * 0.05); S.lineTo(sx, sy + W * 0.11); S.lineTo(sx - W * 0.08, sy + W * 0.05); S.closePath();
      pieno(S, '#f0c430');
    }
  }
  if (t === 'zuccotto') {
    const zCol = o.cappelloCol || '#22242a', top = cy - HH * 0.16;
    const D = new Path2D();
    D.moveTo(cx - W * 0.52, top);
    D.quadraticCurveTo(cx - W * 0.50, cy - HH * 0.66, cx, cy - HH * 0.66);
    D.quadraticCurveTo(cx + W * 0.50, cy - HH * 0.66, cx + W * 0.52, top);
    D.closePath();
    pieno(D, zCol);
    const C = new Path2D();
    C.roundRect(cx - W * 0.54, top - W * 0.08, W * 1.08, W * 0.145, W * 0.055);
    pieno(C, mix(zCol, '#000000', 0.18));
    for (let k = -3; k <= 3; k++) {
      tratto(g, [[cx + k * W * 0.13, top - W * 0.07], [cx + k * W * 0.13, top + W * 0.05]], W * 0.016, mix(zCol, '#ffffff', 0.18));
    }
  }
  if (t === 'paglia') {
    const pCol = o.cappelloCol || '#e0bd68', fCol = o.fasciaCol || '#b83228', top = cy - HH * 0.28 + lagY * 0.08;
    const bx = cx + ax * W * 0.04;
    const B = new Path2D(), C = new Path2D();
    B.ellipse(bx, top, W * 0.60, W * 0.105, 0, 0, Math.PI * 2);
    pieno(B, mix(pCol, '#b88c38', 0.20));
    C.moveTo(cx - W * 0.38, top);
    C.lineTo(cx - W * 0.30, top - W * 0.30);
    C.quadraticCurveTo(cx, top - W * 0.35, cx + W * 0.30, top - W * 0.30);
    C.lineTo(cx + W * 0.38, top);
    C.quadraticCurveTo(cx, top + W * 0.05, cx - W * 0.38, top);
    C.closePath();
    pieno(C, pCol);
    g.save(); g.clip(C);
    g.fillStyle = fCol; g.fillRect(cx - W * 0.45, top - W * 0.09, W * 0.90, W * 0.095);
    g.lineWidth = W * 0.016; g.strokeStyle = INK; g.strokeRect(cx - W * 0.45, top - W * 0.09, W * 0.90, W * 0.095);
    tratto(g, [[cx - W * 0.24, top - W * 0.18], [cx + W * 0.24, top - W * 0.18]], W * 0.015, mix(pCol, '#8c6220', 0.45));
    g.restore();
  }
  if (t === 'cuffia_medica') {
    const mCol = o.cappelloCol || '#2d8a88', top = cy - HH * 0.17;
    const D = new Path2D();
    D.moveTo(cx - W * 0.52, top);
    D.bezierCurveTo(cx - W * 0.56, cy - HH * 0.62, cx + W * 0.56, cy - HH * 0.62, cx + W * 0.52, top);
    D.quadraticCurveTo(cx, top + W * 0.06, cx - W * 0.52, top);
    D.closePath();
    pieno(D, mCol);
    tratto(g, [[cx - W * 0.48, top - W * 0.02], [cx + W * 0.48, top - W * 0.02]], W * 0.024, mix(mCol, '#ffffff', 0.26));
    if (isBack) {
      const kx = cx - sa * W * 0.16;
      tratto(g, [[kx, top], [kx - W * 0.08, top + W * 0.11]], W * 0.026, mCol);
      tratto(g, [[kx, top], [kx + W * 0.08, top + W * 0.11]], W * 0.026, mCol);
      punto(g, kx, top, W * 0.036, mix(mCol, '#000000', 0.20));
    }
  }
}
function extraFaccia(g, acc, fx, ey, cy, HH, W, sp, sa, ca, dir, col, o = {}) {
  const lon = s => s !== dir && Math.abs(sa) > 0.92;
  if (acc.has('rughe')) {
    g.save(); g.globalAlpha = 0.42;
    [-1, 1].forEach(s => {
      if (lon(s)) return;
      const sx = fx + s * (sp + W * 0.055);
      tratto(g, [[sx - s * W * 0.03, ey + HH * 0.14], [sx, ey + HH * 0.22]], W * 0.017, '#6b4c42');
    });
    if (ca > 0.3) tratto(g, [[fx - W * 0.08, ey - HH * 0.22], [fx + W * 0.08, ey - HH * 0.22]], W * 0.016, '#6b4c42');
    g.restore();
  }
  if (acc.has('occhiali') || acc.has('occhiali_sole')) {
    const sole = acc.has('occhiali_sole'), gKind = o.occhialiTipo || 'tondi', frCol = o.occhialiCol || INK;
    [-1, 1].forEach(s => {
      if (lon(s)) return;
      const kx = (s === dir ? 1 : 0.60 + 0.40 * ca), cxE = fx + s * sp;
      const P = new Path2D();
      if (gKind === 'spessi' || gKind === 'quadrati') {
        const lwR = W * 0.22 * kx, lhR = W * (gKind === 'spessi' ? 0.195 : 0.175);
        P.roundRect(cxE - lwR / 2, ey - lhR / 2, lwR, lhR, W * (gKind === 'spessi' ? 0.048 : 0.026));
      } else if (gKind === 'anni80' || gKind === 'wayfarer') {
        const tw = W * 0.125 * kx, bw = W * 0.098 * kx;
        P.moveTo(cxE - tw, ey - W * 0.078); P.lineTo(cxE + tw, ey - W * 0.078);
        P.quadraticCurveTo(cxE + tw * 0.98, ey + W * 0.080, cxE + bw * 0.25, ey + W * 0.088);
        P.quadraticCurveTo(cxE - bw * 0.85, ey + W * 0.084, cxE - tw, ey - W * 0.078);
        P.closePath();
      } else if (gKind === 'aviator') {
        const tw = W * 0.118 * kx;
        P.moveTo(cxE - tw, ey - W * 0.076); P.lineTo(cxE + tw, ey - W * 0.076);
        P.bezierCurveTo(cxE + tw * 1.05, ey + W * 0.09, cxE + s * W * 0.03 * kx, ey + W * 0.12, cxE - s * W * 0.02 * kx, ey + W * 0.095);
        P.bezierCurveTo(cxE - tw * 0.95, ey + W * 0.07, cxE - tw, ey - W * 0.076, cxE - tw, ey - W * 0.076);
        P.closePath();
      } else {
        P.ellipse(cxE, ey, W * 0.116 * kx, W * 0.112, 0, 0, Math.PI * 2);
      }
      if (sole) { g.fillStyle = o.lentiTrasparenti ? 'rgba(29, 26, 36, 0.34)' : (gKind === 'anni80' ? '#20192b' : '#1d1a24'); g.fill(P); }
      g.lineWidth = W * (gKind === 'spessi' || gKind === 'anni80' ? 0.034 : 0.023);
      g.lineJoin = 'round'; g.strokeStyle = frCol; g.stroke(P);
      if (sole && gKind === 'anni80') {
        g.save(); g.clip(P); g.globalAlpha = 0.28;
        tratto(g, [[cxE - W * 0.05 * kx, ey - W * 0.06], [cxE + W * 0.02 * kx, ey + W * 0.05]], W * 0.022, '#ffffff');
        g.restore();
      }
    });
    if (gKind === 'aviator') {
      tratto(g, [[fx - sp + W * 0.08, ey - W * 0.072], [fx + sp - W * 0.08, ey - W * 0.072]], W * 0.017, frCol);
      tratto(g, [[fx - sp + W * 0.085, ey - W * 0.02], [fx + sp - W * 0.085, ey - W * 0.02]], W * 0.017, frCol);
    } else {
      tratto(g, [[fx - sp + W * 0.085, ey - W * (gKind === 'anni80' || gKind === 'spessi' ? 0.04 : 0.01)], [fx + sp - W * 0.085, ey - W * (gKind === 'anni80' || gKind === 'spessi' ? 0.04 : 0.01)]], W * (gKind === 'spessi' || gKind === 'anni80' ? 0.030 : 0.020), frCol);
    }
    if (Math.abs(sa) > 0.2) tratto(g, [[fx - dir * (sp + W * 0.105), ey - W * 0.01], [fx - dir * (sp + W * 0.105) - dir * W * 0.19 * Math.abs(sa), ey - W * 0.03]], W * (gKind === 'spessi' || gKind === 'anni80' ? 0.026 : 0.020), frCol);
  }
  if (acc.has('baffi')) {
    const by = cy + HH * 0.100, P = new Path2D(), l = W * (o.baffiTipo === 'folti' ? 0.155 : 0.125) * (0.6 + 0.4 * ca);
    const drop = o.baffiTipo === 'folti' ? 0.048 : 0.026, peak = o.baffiTipo === 'folti' ? -0.05 : -0.04;
    P.moveTo(fx, by - W * 0.022); P.quadraticCurveTo(fx + l, by + W * peak, fx + l * 1.08, by + W * drop); P.quadraticCurveTo(fx + l * 0.4, by + W * (drop * 0.35), fx, by + W * 0.015);
    P.quadraticCurveTo(fx - l * 0.4, by + W * (drop * 0.35), fx - l * 1.08, by + W * drop); P.quadraticCurveTo(fx - l, by + W * peak, fx, by - W * 0.022);
    g.fillStyle = col; g.fill(P); g.lineWidth = W * 0.02; g.strokeStyle = INK; g.stroke(P);
  }
  if (acc.has('maschera_occhi')) {
    const mw = sp + W * 0.165 * (0.6 + 0.4 * ca), mh = W * 0.118;
    const M = new Path2D();
    M.roundRect(fx - mw, ey - mh, mw * 2, mh * 1.95, W * 0.075);
    [-1, 1].forEach(s => {
      if (lon(s)) return;
      const kx = (s === dir ? 1 : 0.60 + 0.40 * ca);
      M.moveTo(fx + s * sp + W * 0.104 * kx, ey);
      M.ellipse(fx + s * sp, ey, W * 0.104 * kx, W * 0.098, 0, 0, Math.PI * 2);
    });
    g.fillStyle = o.mascheraCol || '#1d1c24';
    g.fill(M, 'evenodd');
    g.lineWidth = W * 0.018; g.strokeStyle = INK; g.stroke(M);
  }
  if (acc.has('occhiaie')) {
    g.save(); g.globalAlpha = 0.45;
    [-1, 1].forEach(s => {
      if (lon(s)) return;
      const kx = (s === dir ? 1 : 0.55 + 0.45 * ca), cxE = fx + s * sp;
      tratto(g, [[cxE - W * 0.065 * kx, ey + W * 0.082], [cxE, ey + W * 0.105], [cxE + W * 0.065 * kx, ey + W * 0.082]], W * 0.016, '#6e525c');
    });
    g.restore();
  }
  if (acc.has('cerotto')) {
    const bx = fx - dir * (sp + W * 0.045), by = ey + W * 0.165;
    g.save(); g.translate(bx, by); g.rotate(-dir * 0.25);
    const P = new Path2D(); P.roundRect(-W * 0.072, -W * 0.028, W * 0.144, W * 0.056, W * 0.016);
    g.fillStyle = '#e6b28a'; g.fill(P); g.lineWidth = W * 0.016; g.strokeStyle = INK; g.stroke(P);
    g.fillStyle = '#f8e6d6'; g.fillRect(-W * 0.026, -W * 0.020, W * 0.052, W * 0.040);
    [-1, 1].forEach(s => punto(g, s * W * 0.048, 0, W * 0.006, '#a67658'));
    g.restore();
  }
  if (acc.has('mascherina') && o.mascherinaSu) {
    const mw = W * 0.22 * (0.6 + 0.4 * ca), my = cy + HH * 0.06;
    tratto(g, [[fx - mw * 0.9, my + W * 0.02], [fx - W * 0.46, ey + HH * 0.06]], W * 0.016, '#f4f8fa');
    tratto(g, [[fx + mw * 0.9, my + W * 0.02], [fx + W * 0.46, ey + HH * 0.06]], W * 0.016, '#f4f8fa');
    const M = new Path2D(); M.roundRect(fx - mw, my, mw * 2, HH * 0.34, W * 0.05);
    g.fillStyle = o.mascherinaCol || '#7ad4d0'; g.fill(M); g.lineWidth = W * 0.02; g.strokeStyle = INK; g.stroke(M);
  }
  if (acc.has('pizzetto')) {
    const pzW = W * 0.095 * (0.6 + 0.4 * ca), py0 = cy + HH * 0.30, P = new Path2D();
    P.moveTo(fx - pzW * 0.55, py0);
    P.quadraticCurveTo(fx, py0 + HH * 0.02, fx + pzW * 0.55, py0);
    P.quadraticCurveTo(fx + pzW * 0.45, py0 + HH * 0.12, fx, py0 + HH * 0.14);
    P.quadraticCurveTo(fx - pzW * 0.45, py0 + HH * 0.12, fx - pzW * 0.55, py0);
    P.closePath();
    g.fillStyle = col; g.fill(P); g.lineWidth = W * 0.02; g.strokeStyle = INK; g.stroke(P);
  }
  if (acc.has('lentiggini')) [-1, 1].forEach(s => { if (lon(s)) return; for (let k = 0; k < 3; k++) punto(g, fx + s * (sp + W * 0.02) + (k - 1) * W * 0.03, ey + W * 0.1 + (k % 2) * W * 0.02, W * 0.01, '#b07a5a'); });
}

function vestitiFondo(g, o, V, p, x, bcy, top, hipY, Bw, busto, W, sa, ca, dir, base, back = 0) {
  if (!V.size) return;
  const isBack = back > 0.42, cx = x + (isBack ? -sa : sa) * Bw * 0.38;
  g.save(); g.clip(p);
  if (V.has('canotta')) {
    const P = new Path2D(), scW = Bw * 0.24 * (0.55 + 0.45 * ca), dp = busto * (isBack ? 0.17 : 0.24);
    P.moveTo(cx - scW, top - W * 0.08);
    P.quadraticCurveTo(cx, top + dp, cx + scW, top - W * 0.08);
    P.closePath();
    g.fillStyle = o.pelle || '#fbf6f2'; g.fill(P);
    g.lineWidth = W * 0.024; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke(P);
  }
  if (!isBack && V.has('giacca_revers')) {
    const P = new Path2D(), shCol = o.camiciaCol || (V.has('dolcevita') ? (o.dolcevitaCol || '#23212a') : '#f4f1ea');
    const vw = Bw * 0.20 * (0.55 + 0.45 * ca), vy = top + busto * 0.56;
    P.moveTo(cx - vw, top - W * 0.06); P.lineTo(cx + vw, top - W * 0.06); P.lineTo(cx, vy); P.closePath();
    g.fillStyle = shCol; g.fill(P);
    g.lineWidth = W * 0.02; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke(P);
  }
  g.restore();
}

function vestitiEsterni(g, o, V, x, bcy, top, hipY, Bw, busto, W, sa, ca, dir, base, back = 0, lagX = 0, lagY = 0) {
  if (!V.size) return;
  const isBack = back > 0.42;
  if (V.has('zaino')) {
    const zCol = o.zainoCol || '#3d6b58', zDark = mix(zCol, '#14101a', 0.28);
    if (isBack) {
      const zx = x - sa * Bw * 0.20 + lagX * 0.14, zy = top + busto * 0.12 + lagY * 0.12;
      const zw = Bw * 0.66, zh = busto * 0.72;
      g.beginPath(); g.arc(zx, zy, W * 0.09, Math.PI, Math.PI * 2);
      g.lineWidth = W * 0.036; g.strokeStyle = INK; g.stroke();
      const B = new Path2D(); B.roundRect(zx - zw / 2, zy, zw, zh, W * 0.09);
      g.fillStyle = zCol; g.fill(B); g.lineWidth = W * 0.036; g.strokeStyle = INK; g.stroke(B);
      const Pk = new Path2D(); Pk.roundRect(zx - zw * 0.38, zy + zh * 0.46, zw * 0.76, zh * 0.42, W * 0.06);
      g.fillStyle = zDark; g.fill(Pk); g.lineWidth = W * 0.022; g.stroke(Pk);
      tratto(g, [[zx - zw * 0.24, zy + zh * 0.56], [zx + zw * 0.24, zy + zh * 0.56]], W * 0.018, '#f0d68a');
    } else if (Math.abs(sa) > 0.14) {
      const pk = Math.min(1, Math.abs(sa) / 0.55);
      const zx = x - dir * (Bw * 0.36 + W * 0.11 * pk) + lagX * 0.16, zy = top + busto * 0.46 + lagY * 0.12;
      g.save(); g.translate(zx, zy); g.rotate(dir * 0.08);
      const P = new Path2D(); P.roundRect(-W * (0.14 + 0.08 * pk), -busto * 0.32, W * (0.28 + 0.16 * pk), busto * 0.64, W * 0.09);
      g.fillStyle = zCol; g.fill(P); g.lineWidth = W * 0.036; g.strokeStyle = INK; g.stroke(P);
      const Pk = new Path2D(); Pk.roundRect(-W * (0.11 + 0.06 * pk), busto * 0.02, W * (0.22 + 0.10 * pk), busto * 0.24, W * 0.05);
      g.fillStyle = zDark; g.fill(Pk); g.lineWidth = W * 0.02; g.stroke(Pk);
      g.restore();
    }
  }
  if (V.has('felpa_cappuccio')) {
    const hCol = mix(base, '#160c28', 0.16);
    if (isBack) {
      const hx = x - sa * Bw * 0.20, hy = top - W * 0.02 + lagY * 0.10, hw = Bw * 0.48 * (0.7 + 0.3 * ca);
      const H = new Path2D();
      H.moveTo(hx - hw * 0.62, hy); H.quadraticCurveTo(hx, hy - W * 0.05, hx + hw * 0.62, hy);
      H.lineTo(hx + hw * 0.75, hy + busto * 0.30);
      H.quadraticCurveTo(hx, hy + busto * 0.36, hx - hw * 0.75, hy + busto * 0.30);
      H.closePath();
      g.fillStyle = hCol; g.fill(H); g.lineWidth = W * 0.028; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke(H);
      tratto(g, [[hx, hy + W * 0.04], [hx, hy + busto * 0.26]], W * 0.018, INK);
    } else {
      const H = new Path2D();
      H.ellipse(x - sa * Bw * 0.06, top + W * 0.03, W * 0.25, W * 0.095, 0, 0, Math.PI * 2);
      g.fillStyle = hCol; g.fill(H); g.lineWidth = W * 0.028; g.strokeStyle = INK; g.stroke(H);
    }
  }
}

function vestitiCollo(g, o, V, acc, x, top, bcy, Bw, busto, W, sa, ca, dir, base, back = 0, lagX = 0, lagY = 0) {
  const hasC = k => V.has(k) || acc.has(k);
  if (!V.size && !acc.has('cuffie_collo') && !acc.has('sciarpa') && !acc.has('mascherina') && !acc.has('stetoscopio') && !acc.has('catena_oro') && !acc.has('papillon') && !acc.has('collo_pelliccia') && !acc.has('bavero_giudice') && !acc.has('collare_tuta') && !acc.has('spalline') && !acc.has('tracolla')) return;
  const isBack = back > 0.42, cx = x + (isBack ? -sa : sa) * Bw * 0.38;
  const nx = cx * 0.45 + x * 0.55;
  if (hasC('spalline')) {
    const sCol = o.spallineCol || '#e8b830';
    [-1, 1].forEach(s => {
      if (s === -dir && Math.abs(sa) > 0.78) return;
      const sx = x + s * Bw * (0.34 - 0.14 * Math.abs(sa)), syS = top + busto * 0.07;
      g.save(); g.translate(sx, syS); g.rotate(s * 0.32 * (0.4 + 0.6 * ca));
      const Ep = new Path2D(); Ep.roundRect(-W * 0.09, -W * 0.024, W * 0.18, W * 0.048, W * 0.018);
      g.fillStyle = sCol; g.fill(Ep); g.lineWidth = W * 0.018; g.strokeStyle = INK; g.stroke(Ep);
      punto(g, -s * W * 0.05, 0, W * 0.014, mix(sCol, '#000000', 0.25));
      g.restore();
    });
  }
  if (hasC('collare_tuta')) {
    const C = new Path2D(); C.ellipse(nx, top + W * 0.04, W * 0.24, W * 0.085, 0, 0, Math.PI * 2);
    g.fillStyle = '#cfd6e0'; g.fill(C); g.lineWidth = W * 0.026; g.strokeStyle = INK; g.stroke(C);
    const Ci = new Path2D(); Ci.ellipse(nx, top + W * 0.035, W * 0.16, W * 0.048, 0, 0, Math.PI * 2);
    g.fillStyle = '#5c6a80'; g.fill(Ci); g.lineWidth = W * 0.016; g.stroke(Ci);
    if (!isBack) {
      punto(g, nx - W * 0.17, top + W * 0.05, W * 0.024, '#d93838');
      punto(g, nx + W * 0.17, top + W * 0.05, W * 0.024, '#2b68c4');
    }
  }
  if (hasC('collo_pelliccia')) {
    const pCol = o.pellicciaCol || '#9e6a42';
    const P = new Path2D();
    P.moveTo(nx - W * 0.28, top - W * 0.02);
    P.bezierCurveTo(nx - W * 0.34, top + W * 0.15, nx - W * 0.12, top + W * 0.20, nx, top + W * 0.14);
    P.bezierCurveTo(nx + W * 0.12, top + W * 0.20, nx + W * 0.34, top + W * 0.15, nx + W * 0.28, top - W * 0.02);
    P.quadraticCurveTo(nx, top - W * 0.07, nx - W * 0.28, top - W * 0.02);
    P.closePath();
    g.fillStyle = pCol; g.fill(P); g.lineWidth = W * 0.024; g.strokeStyle = INK; g.stroke(P);
    [-0.14, 0, 0.14].forEach(dx => tratto(g, [[nx + dx * W, top + W * 0.02], [nx + dx * W * 1.1, top + W * 0.11]], W * 0.014, mix(pCol, '#ffffff', 0.28)));
  }
  if (!isBack && hasC('bavero_giudice')) {
    [-1, 1].forEach(s => {
      const T = new Path2D();
      T.moveTo(cx, top + W * 0.04);
      T.lineTo(cx + s * W * 0.11 * (0.6 + 0.4 * ca), top + W * 0.04);
      T.lineTo(cx + s * W * 0.13 * (0.6 + 0.4 * ca), top + busto * 0.34);
      T.lineTo(cx + s * W * 0.015, top + busto * 0.30);
      T.closePath();
      g.fillStyle = '#f7f5f0'; g.fill(T); g.lineWidth = W * 0.018; g.strokeStyle = INK; g.stroke(T);
    });
  }
  if (!isBack && hasC('papillon')) {
    const pCol = o.cravattaCol || '#a82832', pyB = top + W * 0.095, kB = 0.55 + 0.45 * ca;
    [-1, 1].forEach(s => {
      const B = new Path2D();
      B.moveTo(cx, pyB);
      B.lineTo(cx + s * W * 0.115 * kB, pyB - W * 0.055);
      B.quadraticCurveTo(cx + s * W * 0.135 * kB, pyB, cx + s * W * 0.115 * kB, pyB + W * 0.055);
      B.closePath();
      g.fillStyle = pCol; g.fill(B); g.lineWidth = W * 0.018; g.strokeStyle = INK; g.stroke(B);
    });
    const K = new Path2D(); K.roundRect(cx - W * 0.026, pyB - W * 0.026, W * 0.052, W * 0.052, W * 0.014);
    g.fillStyle = mix(pCol, '#000000', 0.15); g.fill(K); g.lineWidth = W * 0.016; g.stroke(K);
  }
  if (!isBack && hasC('catena_oro')) {
    const chY = top + busto * 0.36;
    tratto(g, [[nx - W * 0.18 * (0.6 + 0.4 * ca), top + W * 0.02], [cx, chY], [nx + W * 0.18 * (0.6 + 0.4 * ca), top + W * 0.02]], W * 0.042, INK);
    tratto(g, [[nx - W * 0.18 * (0.6 + 0.4 * ca), top + W * 0.02], [cx, chY], [nx + W * 0.18 * (0.6 + 0.4 * ca), top + W * 0.02]], W * 0.024, '#f2c12e');
    g.beginPath(); g.arc(cx, chY + W * 0.025, W * 0.042, 0, Math.PI * 2);
    g.fillStyle = '#f2c12e'; g.fill(); g.lineWidth = W * 0.018; g.strokeStyle = INK; g.stroke();
    punto(g, cx, chY + W * 0.025, W * 0.016, '#fff2b0');
  }
  if (hasC('stetoscopio')) {
    const stCol = '#2a2e38';
    if (isBack) {
      g.beginPath(); g.arc(nx, top + W * 0.04, W * 0.17, Math.PI * 0.08, Math.PI * 0.92);
      g.lineWidth = W * 0.042; g.strokeStyle = INK; g.stroke();
      g.lineWidth = W * 0.022; g.strokeStyle = stCol; g.stroke();
    } else {
      tratto(g, [[nx - W * 0.15 * ca, top + W * 0.02], [nx - W * 0.18 * ca, top + busto * 0.24], [cx + W * 0.10, top + busto * 0.44]], W * 0.036, INK);
      tratto(g, [[nx - W * 0.15 * ca, top + W * 0.02], [nx - W * 0.18 * ca, top + busto * 0.24], [cx + W * 0.10, top + busto * 0.44]], W * 0.018, stCol);
      tratto(g, [[nx + W * 0.15 * ca, top + W * 0.02], [nx + W * 0.18 * ca, top + busto * 0.26], [nx + W * 0.14 * ca, top + busto * 0.40]], W * 0.036, INK);
      tratto(g, [[nx + W * 0.15 * ca, top + W * 0.02], [nx + W * 0.18 * ca, top + busto * 0.26], [nx + W * 0.14 * ca, top + busto * 0.40]], W * 0.018, stCol);
      g.beginPath(); g.arc(cx + W * 0.10, top + busto * 0.44, W * 0.042, 0, Math.PI * 2);
      g.fillStyle = '#dce4ec'; g.fill(); g.lineWidth = W * 0.018; g.strokeStyle = INK; g.stroke();
      punto(g, cx + W * 0.10, top + busto * 0.44, W * 0.016, '#8c96a4');
    }
  }
  if (!isBack && acc.has('mascherina') && !o.mascherinaSu) {
    // Mascherina chirurgica abbassata sotto il mento per lasciare la bocca completamente libera al lip-sync
    const mCol = o.mascherinaCol || '#7ad4d0', mw = W * 0.18 * (0.65 + 0.35 * ca), mh = W * 0.105, myM = top + W * 0.015;
    tratto(g, [[nx - mw * 0.9, myM + mh * 0.3], [nx - W * 0.26, top - W * 0.08]], W * 0.014, '#f4f8fa');
    tratto(g, [[nx + mw * 0.9, myM + mh * 0.3], [nx + W * 0.26, top - W * 0.08]], W * 0.014, '#f4f8fa');
    const M = new Path2D(); M.roundRect(nx - mw, myM, mw * 2, mh, W * 0.036);
    g.fillStyle = mCol; g.fill(M); g.lineWidth = W * 0.02; g.strokeStyle = INK; g.stroke(M);
    tratto(g, [[nx - mw * 0.72, myM + mh * 0.38], [nx + mw * 0.72, myM + mh * 0.38]], W * 0.012, mix(mCol, '#000000', 0.25));
    tratto(g, [[nx - mw * 0.72, myM + mh * 0.68], [nx + mw * 0.72, myM + mh * 0.68]], W * 0.012, mix(mCol, '#000000', 0.25));
  }
  if (!isBack && hasC('tracolla')) {
    const sx = x - dir * Bw * 0.36, sy = top + busto * 0.86;
    const Bag = new Path2D(); Bag.roundRect(sx - W * 0.11, sy, W * 0.22, W * 0.18, W * 0.03);
    g.fillStyle = o.tracollaCol || '#5c3820'; g.fill(Bag); g.lineWidth = W * 0.024; g.strokeStyle = INK; g.stroke(Bag);
    const Flap = new Path2D(); Flap.roundRect(sx - W * 0.11, sy, W * 0.22, W * 0.075, W * 0.025);
    g.fillStyle = mix(o.tracollaCol || '#5c3820', '#000000', 0.18); g.fill(Flap); g.stroke(Flap);
  }
  if (V.has('dolcevita')) {
    const dCol = o.dolcevitaCol || (V.has('giacca_revers') ? '#23212a' : base);
    const D = new Path2D(); D.roundRect(nx - W * 0.155, top - W * 0.055, W * 0.31, W * 0.125, W * 0.055);
    g.fillStyle = dCol; g.fill(D); g.lineWidth = W * 0.026; g.strokeStyle = INK; g.stroke(D);
    tratto(g, [[nx - W * 0.09, top + W * 0.01], [nx + W * 0.09, top + W * 0.01]], W * 0.016, mix(dCol, '#ffffff', 0.22));
  }
  if (V.has('felpa_cappuccio') && !isBack) {
    const C = new Path2D(); C.ellipse(nx, top + W * 0.03, W * 0.19 * (0.65 + 0.35 * ca), W * 0.055, 0, 0, Math.PI * 2);
    g.fillStyle = mix(base, '#160c28', 0.18); g.fill(C); g.lineWidth = W * 0.022; g.strokeStyle = INK; g.stroke(C);
    [-1, 1].forEach(s => {
      const x0 = nx + s * W * 0.05 * ca, y0 = top + W * 0.055, x1 = x0 + lagX * 0.38, y1 = y0 + W * 0.20 + lagY * 0.10;
      tratto(g, [[x0, y0], [x1, y1]], W * 0.032, INK);
      tratto(g, [[x0, y0], [x1, y1]], W * 0.018, '#f2efe8');
      punto(g, x1, y1, W * 0.018, INK);
    });
  }
  if (acc.has('cuffie_collo')) {
    const rBand = W * 0.185;
    if (isBack) {
      g.beginPath(); g.arc(nx, top + W * 0.03, rBand, Math.PI * 0.08, Math.PI * 0.92);
      g.lineWidth = W * 0.052; g.lineCap = 'round'; g.strokeStyle = INK; g.stroke();
      g.lineWidth = W * 0.028; g.strokeStyle = '#363240'; g.stroke();
    } else {
      g.beginPath(); g.arc(nx, top + W * 0.05, rBand, Math.PI * 0.15, Math.PI * 0.85);
      g.lineWidth = W * 0.048; g.lineCap = 'round'; g.strokeStyle = INK; g.stroke();
      g.lineWidth = W * 0.024; g.strokeStyle = '#363240'; g.stroke();
      [-1, 1].forEach(s => {
        if (s !== dir && Math.abs(sa) > 0.72) return;
        const exC = nx + s * W * 0.155 * (0.55 + 0.45 * ca), eyC = top + W * 0.145;
        g.save(); g.translate(exC, eyC); g.rotate(-s * 0.25);
        g.beginPath(); g.ellipse(0, 0, W * 0.055, W * 0.082, 0, 0, Math.PI * 2);
        g.fillStyle = '#25222c'; g.fill(); g.lineWidth = W * 0.024; g.strokeStyle = INK; g.stroke();
        g.beginPath(); g.ellipse(-s * W * 0.012, 0, W * 0.028, W * 0.046, 0, 0, Math.PI * 2);
        g.fillStyle = o.cuffieCol || '#68a8d8'; g.fill();
        g.restore();
      });
    }
  }
  if (acc.has('sciarpa') || V.has('foulard')) {
    const scCol = o.sciarpaCol || '#c94a38', tailSide = dir;
    const T = new Path2D();
    const tx0 = nx + (isBack ? -sa : tailSide * 0.12) * W * 0.6;
    T.moveTo(tx0 - W * 0.055, top + W * 0.03);
    T.lineTo(tx0 + W * 0.055, top + W * 0.03);
    T.quadraticCurveTo(tx0 + lagX * 0.5 + W * 0.06, top + W * 0.24, tx0 + lagX * 0.55 + W * 0.05, top + busto * 0.44 + lagY * 0.1);
    T.lineTo(tx0 + lagX * 0.55 - W * 0.05, top + busto * 0.42 + lagY * 0.1);
    T.closePath();
    g.fillStyle = mix(scCol, '#140e1a', 0.14); g.fill(T); g.lineWidth = W * 0.022; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke(T);
    const R = new Path2D(); R.roundRect(nx - W * 0.21, top - W * 0.025, W * 0.42, W * 0.115, W * 0.05);
    g.fillStyle = scCol; g.fill(R); g.lineWidth = W * 0.024; g.strokeStyle = INK; g.stroke(R);
  }
}

// dettagli dei vestiti: o.vestito = ['bottoni','colletto','tasca','cintura','camice','grembiule','righe','distintivo','zip','bretelle','stella','fiocco','giacca_revers','dolcevita','canotta','felpa_cappuccio','zaino','polsini','fazzoletto','penne_taschino']
// tutti dentro il busto, seguono la girata (sa) e la luce; linee interne sottili (0,4-0,6 del contorno, come nel rapporto)
function vestiti(g, o, p, x, bcy, top, hipY, Bw, busto, W, sa, ca, dir, base, back = 0) {
  const V = new Set(o.vestito || []), isBack = back > 0.42, cx = x + (isBack ? -sa : sa) * Bw * 0.38, scuro = mix(base, '#160c28', 0.45), line = W * 0.02;
  const hasAcc = a => (o.accessori && o.accessori.includes(a)) || (RUOLI[o.ruolo] && RUOLI[o.ruolo].includes(a));
  const hasV = a => V.has(a) || hasAcc(a);
  if (!V.size && !hasAcc('fotocamera') && !hasAcc('spilla')) return;
  g.save(); g.clip(p);
  if (hasV('righe')) { g.globalAlpha = o.righeCol ? 0.90 : 0.5; for (let k = 0; k < 7; k++) { const yy = top + busto * (0.12 + k * 0.14); tratto(g, [[x - Bw, yy], [x, yy + (isBack ? -1 : 1) * W * 0.03], [x + Bw, yy]], W * 0.05, o.righeCol || mix(base, '#ffffff', 0.55)); } g.globalAlpha = 1; }
  if (hasV('gilet')) {
    const gCol = o.giletCol || '#6e2832';
    if (isBack && !hasV('giacca_revers') && !hasV('doppiopetto')) {
      const G = new Path2D(); G.roundRect(x - Bw, top - W * 0.02, Bw * 2, hipY + busto - top, W * 0.04);
      g.fillStyle = gCol; g.fill(G);
      tratto(g, [[x - Bw * 0.6, top + busto * 0.62], [x + Bw * 0.6, top + busto * 0.62]], W * 0.035, mix(gCol, '#000000', 0.25));
    } else if (hasV('giacca_revers')) {
      const vw = Bw * 0.20 * (0.55 + 0.45 * ca), vy = top + busto * 0.56;
      const G = new Path2D();
      G.moveTo(cx - vw * 0.72, top + busto * 0.22); G.lineTo(cx, top + busto * 0.38); G.lineTo(cx + vw * 0.72, top + busto * 0.22);
      G.lineTo(cx + vw, vy + W * 0.08); G.lineTo(cx - vw, vy + W * 0.08); G.closePath();
      g.fillStyle = gCol; g.fill(G); g.lineWidth = line; g.strokeStyle = INK; g.stroke(G);
      for (let k = 0; k < 3; k++) punto(g, cx, top + busto * (0.41 + k * 0.08), W * 0.016, '#2a1a26');
    } else {
      const vw = Bw * 0.22 * (0.55 + 0.45 * ca), vy = top + busto * 0.36;
      [-1, 1].forEach(s => {
        const P = new Path2D();
        P.moveTo(cx + s * Bw, top - W * 0.02); P.lineTo(cx + s * vw, top - W * 0.02);
        P.lineTo(cx + s * W * 0.015, vy); P.lineTo(cx + s * W * 0.015, hipY + busto);
        P.lineTo(cx + s * Bw, hipY + busto); P.closePath();
        g.fillStyle = gCol; g.fill(P); g.lineWidth = line; g.strokeStyle = INK; g.stroke(P);
      });
      for (let k = 0; k < 3; k++) punto(g, cx, vy + busto * (0.08 + k * 0.14), W * 0.018, '#2a1a26');
    }
  }
  if (hasV('salopette')) {
    const sCol = o.salopetteCol || '#36587c', sDark = mix(sCol, '#000000', 0.25);
    const P = new Path2D();
    if (isBack) {
      [-1, 1].forEach(s => tratto(g, [[cx + s * Bw * 0.24 * ca, top], [cx + s * Bw * 0.18 * ca, top + busto * 0.48]], W * 0.075, sCol));
      P.roundRect(x - Bw, top + busto * 0.45, Bw * 2, hipY + busto - top, W * 0.03);
      g.fillStyle = sCol; g.fill(P); g.lineWidth = line; g.strokeStyle = INK; g.stroke(P);
    } else {
      [-1, 1].forEach(s => {
        const sx = cx + s * Bw * 0.22 * ca;
        tratto(g, [[sx, top - W * 0.02], [sx, top + busto * 0.32]], W * 0.085, INK);
        tratto(g, [[sx, top - W * 0.02], [sx, top + busto * 0.32]], W * 0.055, sCol);
      });
      const bw = Bw * 0.34 * (0.55 + 0.45 * ca);
      P.roundRect(cx - bw, top + busto * 0.28, bw * 2, busto * 0.42, W * 0.03);
      P.roundRect(x - Bw, top + busto * 0.62, Bw * 2, hipY + busto - top, W * 0.02);
      g.fillStyle = sCol; g.fill(P); g.lineWidth = line; g.strokeStyle = INK; g.stroke(P);
      [-1, 1].forEach(s => punto(g, cx + s * Bw * 0.22 * ca, top + busto * 0.31, W * 0.022, '#f0c430'));
      g.strokeStyle = sDark; g.lineWidth = W * 0.015;
      g.strokeRect(cx - bw * 0.45, top + busto * 0.38, bw * 0.9, busto * 0.16);
    }
  }
  if (hasV('gilet_alta_vis')) {
    const vCol = o.altaVisCol || '#d8eb2a';
    if (isBack) {
      const G = new Path2D(); G.roundRect(x - Bw, top + W * 0.02, Bw * 2, busto * 0.92, W * 0.03);
      g.fillStyle = vCol; g.fill(G); g.lineWidth = line; g.strokeStyle = INK; g.stroke(G);
      [0.44, 0.70].forEach(f => {
        g.fillStyle = '#e2e8f0'; g.fillRect(x - Bw, top + busto * f, Bw * 2, busto * 0.11);
        g.lineWidth = W * 0.014; g.strokeStyle = '#6d7a8a'; g.strokeRect(x - Bw, top + busto * f, Bw * 2, busto * 0.11);
      });
    } else {
      const gap = W * 0.075 * (0.55 + 0.45 * ca);
      [-1, 1].forEach(s => {
        const P = new Path2D();
        P.moveTo(cx + s * gap, top + W * 0.04); P.lineTo(cx + s * Bw, top + W * 0.04);
        P.lineTo(cx + s * Bw, top + busto * 0.94); P.lineTo(cx + s * gap, top + busto * 0.94); P.closePath();
        g.fillStyle = vCol; g.fill(P); g.lineWidth = line; g.strokeStyle = INK; g.stroke(P);
        [0.44, 0.70].forEach(f => {
          g.fillStyle = '#e2e8f0';
          g.fillRect(s < 0 ? cx - Bw : cx + gap, top + busto * f, Bw - gap, busto * 0.11);
          g.lineWidth = W * 0.014; g.strokeStyle = '#6d7a8a';
          g.strokeRect(s < 0 ? cx - Bw : cx + gap, top + busto * f, Bw - gap, busto * 0.11);
        });
      });
    }
  }
  if (hasV('tracolla')) {
    const tCol = o.tracollaCol || '#5c3820';
    const xA = isBack ? (x + dir * Bw * 0.34) : (x + dir * Bw * 0.34);
    const xB = isBack ? (x - dir * Bw * 0.42) : (x - dir * Bw * 0.42);
    tratto(g, [[xA, top - W * 0.02], [xB, hipY]], W * 0.068, INK);
    tratto(g, [[xA, top - W * 0.02], [xB, hipY]], W * 0.040, tCol);
  }
  if (hasV('collare_tuta') && !isBack) {
    const bx = cx - sa * W * 0.02, by = top + busto * 0.32, bw = W * 0.24 * (0.6 + 0.4 * ca), bh = W * 0.18;
    const B = new Path2D(); B.roundRect(bx - bw / 2, by, bw, bh, W * 0.025);
    g.fillStyle = '#cfd6e0'; g.fill(B); g.lineWidth = line; g.strokeStyle = INK; g.stroke(B);
    punto(g, bx - bw * 0.24, by + bh * 0.35, W * 0.020, '#d93838');
    punto(g, bx, by + bh * 0.35, W * 0.020, '#38a856');
    punto(g, bx + bw * 0.24, by + bh * 0.35, W * 0.020, '#2b68c4');
    tratto(g, [[bx - bw * 0.3, by + bh * 0.72], [bx + bw * 0.3, by + bh * 0.72]], W * 0.016, '#4a5568');
  }
  if (V.has('camice') || V.has('grembiule')) {
    const c = V.has('camice') ? '#f6f6fa' : (o.grembiuleCol || '#ffffff'), P = new Path2D();
    if (isBack) {
      if (V.has('camice')) { P.roundRect(x - Bw, top - W * 0.02, Bw * 2, hipY + busto - top, W * 0.04); g.fillStyle = c; g.fill(P); tratto(g, [[cx, top + busto * 0.35], [cx, hipY + busto]], line, '#2a1a26'); }
      else {
        const yTie = top + busto * 0.44;
        tratto(g, [[x - Bw, yTie], [cx - W * 0.05, yTie + W * 0.02], [cx + W * 0.05, yTie + W * 0.02], [x + Bw, yTie]], W * 0.055, '#2a1a26');
        tratto(g, [[cx - W * 0.03, yTie + W * 0.02], [cx - W * 0.14, yTie + W * 0.18]], W * 0.046, '#2a1a26');
        tratto(g, [[cx + W * 0.03, yTie + W * 0.02], [cx + W * 0.12, yTie + W * 0.20]], W * 0.046, '#2a1a26');
        tratto(g, [[x - Bw, yTie], [cx - W * 0.05, yTie + W * 0.02], [cx + W * 0.05, yTie + W * 0.02], [x + Bw, yTie]], W * 0.034, c);
        tratto(g, [[cx - W * 0.03, yTie + W * 0.02], [cx - W * 0.14, yTie + W * 0.18]], W * 0.026, c);
        tratto(g, [[cx + W * 0.03, yTie + W * 0.02], [cx + W * 0.12, yTie + W * 0.20]], W * 0.026, c);
      }
    } else {
      if (V.has('camice')) {
        P.moveTo(x - Bw, top); P.lineTo(cx - W * 0.1, top + W * 0.02); P.lineTo(cx - W * 0.03, hipY + busto); P.lineTo(x - Bw, hipY + busto); P.closePath();
        P.moveTo(x + Bw, top); P.lineTo(cx + W * 0.1, top + W * 0.02); P.lineTo(cx + W * 0.03, hipY + busto); P.lineTo(x + Bw, hipY + busto); P.closePath();
      }
      else P.roundRect(cx - Bw * 0.32 * (0.5 + 0.5 * ca), top + busto * 0.28, Bw * 0.64 * (0.5 + 0.5 * ca), busto * 1.2, W * 0.05);
      g.fillStyle = c; g.fill(P); g.lineWidth = line; g.strokeStyle = '#2a1a26'; g.stroke(P);
      if (V.has('grembiule')) tratto(g, [[cx - Bw * 0.3, top + busto * 0.28], [cx - Bw * 0.2, top], [cx + Bw * 0.2, top], [cx + Bw * 0.3, top + busto * 0.28]], line);
    }
  }
  if (V.has('giacca_revers')) {
    if (isBack) {
      tratto(g, [[cx, top + busto * 0.45], [cx, hipY + busto]], line, '#2a1a26');
    } else {
      const vw = Bw * 0.20 * (0.55 + 0.45 * ca), vy = top + busto * 0.56, revCol = mix(base, '#ffffff', 0.08);
      [-1, 1].forEach(s => {
        const L = new Path2D();
        L.moveTo(cx + s * vw, top - W * 0.04);
        L.lineTo(cx + s * (vw + W * 0.13 * (0.55 + 0.45 * ca)), top + busto * 0.22);
        L.lineTo(cx + s * (vw * 0.45 + W * 0.08 * (0.55 + 0.45 * ca)), top + busto * 0.28);
        L.lineTo(cx + s * W * 0.015, vy);
        L.closePath();
        g.fillStyle = revCol; g.fill(L); g.lineWidth = line; g.lineJoin = 'round'; g.strokeStyle = '#2a1a26'; g.stroke(L);
      });
      punto(g, cx, vy + busto * 0.09, W * 0.024, '#2a1a26');
      tratto(g, [[cx, vy], [cx, hipY + busto]], line, scuro);
    }
  }
  if (V.has('felpa_cappuccio') && !isBack) {
    const pw = Bw * 0.56 * (0.6 + 0.4 * ca), pyTop = top + busto * 0.58, pyBot = top + busto * 0.88;
    const K = new Path2D();
    K.moveTo(cx - pw * 0.36, pyTop); K.lineTo(cx + pw * 0.36, pyTop);
    K.lineTo(cx + pw * 0.50, pyBot); K.lineTo(cx - pw * 0.50, pyBot); K.closePath();
    g.fillStyle = mix(base, '#160c28', 0.10); g.fill(K); g.lineWidth = line; g.lineJoin = 'round'; g.strokeStyle = scuro; g.stroke(K);
  }
  if (V.has('zaino') && !isBack) {
    const zCol = o.zainoCol || '#3d6b58';
    [-1, 1].forEach(s => {
      const sx = cx + s * Bw * 0.25 * (0.55 + 0.45 * ca), sxBot = x + s * Bw * 0.34;
      tratto(g, [[sx, top - W * 0.05], [sx, top + busto * 0.32], [sxBot, top + busto * 0.54]], W * 0.056, '#2a1a26');
      tratto(g, [[sx, top - W * 0.05], [sx, top + busto * 0.32], [sxBot, top + busto * 0.54]], W * 0.032, zCol);
    });
  }
  if (V.has('bretelle')) [-1, 1].forEach(s => tratto(g, [[cx + s * Bw * 0.22 * ca, top], [cx + s * Bw * 0.18 * ca, hipY]], W * 0.035, o.bretelleCol || '#7a3a2a'));
  if (!isBack && V.has('zip')) { tratto(g, [[cx, top], [cx, hipY + busto]], line, scuro); for (let k = 1; k < 9; k++) tratto(g, [[cx - W * 0.015, top + k * busto * 0.1], [cx + W * 0.015, top + k * busto * 0.1]], W * 0.01, scuro); }
  if (!isBack && V.has('bottoni')) for (let k = V.has('giacca_revers') ? 2 : 0; k < 4; k++) punto(g, cx, top + busto * (0.22 + k * 0.2), W * 0.022, '#2a1a26');
  if (!isBack && hasV('doppiopetto')) {
    const bCol = o.bottoniCol || '#e0b434';
    [-1, 1].forEach(s => {
      for (let k = 0; k < 3; k++) {
        const bx = cx + s * W * 0.08 * (0.6 + 0.4 * ca), by = top + busto * (0.36 + k * 0.16);
        g.beginPath(); g.arc(bx, by, W * 0.022, 0, Math.PI * 2);
        g.fillStyle = bCol; g.fill(); g.lineWidth = W * 0.012; g.strokeStyle = INK; g.stroke();
      }
    });
  }
  if (!isBack && hasV('medaglie')) {
    const mx = cx - dir * Bw * 0.22 * ca, my = top + busto * 0.25, kw = 0.6 + 0.4 * ca;
    const cols = ['#d93829', '#f2c430', '#2b68c4'];
    cols.forEach((mc, i) => {
      const rx = mx + (i - 1) * W * 0.055 * kw;
      g.fillStyle = mc; g.fillRect(rx - W * 0.024 * kw, my, W * 0.048 * kw, W * 0.036);
      g.lineWidth = W * 0.012; g.strokeStyle = INK; g.strokeRect(rx - W * 0.024 * kw, my, W * 0.048 * kw, W * 0.036);
      g.beginPath(); g.arc(rx, my + W * 0.068, W * 0.024, 0, Math.PI * 2);
      g.fillStyle = i === 1 ? '#dce4ec' : '#f2c84a'; g.fill(); g.stroke();
    });
  }
  if (!isBack && hasV('matricola')) {
    const mx = cx + dir * Bw * 0.21 * ca, my = top + busto * 0.28, mw = W * 0.22 * (0.6 + 0.4 * ca), mh = W * 0.11;
    const M = new Path2D(); M.roundRect(mx - mw / 2, my, mw, mh, W * 0.014);
    g.fillStyle = '#f5f2eb'; g.fill(M); g.lineWidth = line; g.strokeStyle = INK; g.stroke(M);
    for (let k = -2; k <= 2; k++) {
      tratto(g, [[mx + k * mw * 0.14, my + mh * 0.25], [mx + k * mw * 0.14, my + mh * 0.75]], W * 0.014, INK);
    }
  }
  if (V.has('cintura')) { const yy = hipY - busto * 0.12; tratto(g, [[x - Bw, yy], [x + Bw, yy]], W * 0.06, o.cinturaCol || '#3a2a22'); if (!isBack) { g.beginPath(); g.roundRect(cx - W * 0.05, yy - W * 0.04, W * 0.1, W * 0.08, W * 0.015); g.fillStyle = '#e8c23a'; g.fill(); g.lineWidth = W * 0.015; g.strokeStyle = '#2a1a26'; g.stroke(); } }
  if (!isBack && (V.has('tasca') || V.has('fazzoletto') || V.has('penne_taschino'))) {
    const tx = cx + dir * Bw * 0.26 * ca - sa * Bw * 0.08, ty = top + busto * 0.31;
    if (V.has('fazzoletto')) {
      const Fz = new Path2D(); Fz.moveTo(tx - W * 0.05, ty + W * 0.01); Fz.lineTo(tx - W * 0.01, ty - W * 0.07); Fz.lineTo(tx + W * 0.04, ty + W * 0.01); Fz.closePath();
      g.fillStyle = o.fazzolettoCol || '#e85a4a'; g.fill(Fz); g.lineWidth = W * 0.016; g.strokeStyle = '#2a1a26'; g.stroke(Fz);
    }
    if (V.has('penne_taschino')) {
      tratto(g, [[tx - W * 0.03, ty + W * 0.01], [tx - W * 0.04, ty - W * 0.075]], W * 0.024, '#d9483b');
      tratto(g, [[tx + W * 0.02, ty + W * 0.01], [tx + W * 0.025, ty - W * 0.082]], W * 0.024, '#2d5ca8');
    }
    g.beginPath(); g.roundRect(tx - W * 0.07, ty, W * 0.14, W * 0.13, [0, 0, W * 0.03, W * 0.03]); g.lineWidth = W * 0.016; g.strokeStyle = scuro; g.stroke();
  }
  if (!isBack && (V.has('distintivo') || V.has('stella'))) {
    const dx = cx - dir * Bw * 0.25 * ca, dy = top + busto * 0.32, P = new Path2D(); for (let k = 0; k < 10; k++) { const r = (k % 2 ? 0.035 : 0.08) * W, an = -Math.PI / 2 + k * Math.PI / 5; k ? P.lineTo(dx + Math.cos(an) * r, dy + Math.sin(an) * r) : P.moveTo(dx + Math.cos(an) * r, dy + Math.sin(an) * r); }
    P.closePath(); g.fillStyle = '#f2c84a'; g.fill(P); g.lineWidth = W * 0.015; g.strokeStyle = '#2a1a26'; g.stroke(P);
  }
  g.restore();
  if (V.has('colletto')) {
    if (isBack) {
      const cxB = x + dir * Bw * 0.05 * ca + sa * Bw * 0.12, tp = top + W * 0.03, cw = W * 0.14 * (0.55 + 0.45 * ca), P = new Path2D();
      P.moveTo(cxB - cw, tp); P.quadraticCurveTo(cxB, tp + W * 0.06, cxB + cw, tp); P.lineTo(cxB + cw * 0.86, tp + W * 0.075); P.quadraticCurveTo(cxB, tp + W * 0.12, cxB - cw * 0.86, tp + W * 0.075); P.closePath();
      g.fillStyle = o.collettoCol || '#ffffff'; g.fill(P); g.lineWidth = W * 0.018; g.lineJoin = 'round'; g.strokeStyle = '#2a1a26'; g.stroke(P);
    } else if (o.collettoTipo === 'pizzo') {
      const tp = top + W * 0.06, kx = 0.55 + 0.45 * ca;
      [-1, 1].forEach(s => {
        const P = new Path2D();
        P.moveTo(cx, tp);
        P.bezierCurveTo(cx + s * W * 0.08 * kx, tp + W * 0.12, cx + s * W * 0.22 * kx, tp + W * 0.10, cx + s * W * 0.19 * kx, tp - W * 0.01);
        P.closePath();
        g.fillStyle = o.collettoCol || '#faf7f0'; g.fill(P); g.lineWidth = W * 0.02; g.lineJoin = 'round'; g.strokeStyle = '#2a1a26'; g.stroke(P);
      });
    } else[-1, 1].forEach(s => {
      const P = new Path2D(), tp = top + W * 0.07; P.moveTo(cx + s * W * 0.03, tp + W * 0.02); P.lineTo(cx + s * W * 0.17 * (0.5 + 0.5 * ca), tp - W * 0.01); P.lineTo(cx + s * W * 0.12 * (0.5 + 0.5 * ca), tp + W * 0.11); P.closePath();
      g.fillStyle = o.collettoCol || '#ffffff'; g.fill(P); g.lineWidth = W * 0.018; g.lineJoin = 'round'; g.strokeStyle = '#2a1a26'; g.stroke(P);
    });
  }
  if (!isBack && (V.has('spilla') || hasAcc('spilla'))) {
    const sx = cx + dir * W * 0.06, sy = top + W * 0.13;
    g.beginPath(); g.arc(sx, sy, W * 0.036, 0, Math.PI * 2); g.fillStyle = '#f2c84a'; g.fill();
    g.lineWidth = W * 0.018; g.strokeStyle = '#2a1a26'; g.stroke();
    punto(g, sx, sy, W * 0.015, '#d9483b');
  }
  if (!isBack && (V.has('fotocamera') || hasAcc('fotocamera'))) {
    const fyC = top + busto * 0.44, fw = W * 0.26 * (0.6 + 0.4 * ca), fh = W * 0.17;
    tratto(g, [[cx - W * 0.13 * ca, top - W * 0.02], [cx - fw * 0.35, fyC - fh * 0.45]], W * 0.022, '#2a1a26');
    tratto(g, [[cx + W * 0.13 * ca, top - W * 0.02], [cx + fw * 0.35, fyC - fh * 0.45]], W * 0.022, '#2a1a26');
    const Cam = new Path2D(); Cam.roundRect(cx - fw / 2, fyC - fh / 2, fw, fh, W * 0.03);
    g.fillStyle = '#2d2a34'; g.fill(Cam); g.lineWidth = W * 0.022; g.strokeStyle = '#2a1a26'; g.stroke(Cam);
    g.beginPath(); g.arc(cx + dir * fw * 0.05, fyC, W * 0.058, 0, Math.PI * 2);
    g.fillStyle = '#d4dae4'; g.fill(); g.lineWidth = W * 0.018; g.stroke();
    punto(g, cx + dir * fw * 0.05, fyC, W * 0.03, '#263448');
  }
  if (!isBack && V.has('sceriffo')) {   // stella da sceriffo con le punte a pallino e targhetta «SCERIFFO»
    const dx = cx - dir * Bw * 0.22 * ca + sa * Bw * 0.05, dy = top + busto * 0.45, P = new Path2D(), R1 = W * 0.13, R2 = W * 0.065, k0 = 0.6 + 0.4 * ca;
    for (let k = 0; k < 10; k++) { const r = k % 2 ? R2 : R1, an = -Math.PI / 2 + k * Math.PI / 5, px = dx + Math.cos(an) * r * k0, py = dy + Math.sin(an) * r; k ? P.lineTo(px, py) : P.moveTo(px, py); }
    P.closePath(); g.fillStyle = '#f2c84a'; g.fill(P); g.lineWidth = W * 0.02; g.lineJoin = 'round'; g.strokeStyle = '#2a1a26'; g.stroke(P);
    for (let k = 0; k < 5; k++) { const an = -Math.PI / 2 + k * 2 * Math.PI / 5; g.beginPath(); g.arc(dx + Math.cos(an) * R1 * k0, dy + Math.sin(an) * R1, W * 0.022, 0, Math.PI * 2); g.fillStyle = '#f2c84a'; g.fill(); g.lineWidth = W * 0.014; g.stroke(); }
    g.beginPath(); g.arc(dx, dy, W * 0.035, 0, Math.PI * 2); g.fillStyle = '#d9a52a'; g.fill(); g.lineWidth = W * 0.012; g.stroke();
    const tw = W * 0.3 * k0, ty = dy + R1 + W * 0.03; g.beginPath(); g.roundRect(dx - tw / 2, ty, tw, W * 0.075, W * 0.015); g.fillStyle = '#f2c84a'; g.fill(); g.lineWidth = W * 0.015; g.stroke();
    g.save(); g.translate(dx, ty + W * 0.04); g.scale(k0, 1); g.fillStyle = '#2a1a26'; g.font = `bold ${Math.round(W * 0.055)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SCERIFFO', 0, 0); g.restore();
  }
  if (!isBack && V.has('bandana')) {
    const by = top + W * 0.1, P = new Path2D(), l = W * 0.24 * (0.5 + 0.5 * ca); P.moveTo(cx - l, by); P.quadraticCurveTo(cx, by + W * 0.05, cx + l, by); P.lineTo(cx + dir * W * 0.03, by + W * 0.24); P.closePath();
    g.fillStyle = o.bandanaCol || '#c8323a'; g.fill(P); g.lineWidth = W * 0.02; g.lineJoin = 'round'; g.strokeStyle = '#2a1a26'; g.stroke(P);
    for (let k = 0; k < 4; k++) punto(g, cx - l * 0.5 + k * l * 0.33 + dir * W * 0.01 * k, by + W * 0.04 + (k % 2) * W * 0.05, W * 0.012, '#ffffff');
  }
  if (!isBack && V.has('fiocco')) { const fy = top + W * 0.13;[-1, 1].forEach(s => { g.beginPath(); g.moveTo(cx, fy); g.lineTo(cx + s * W * 0.1, fy - W * 0.05); g.lineTo(cx + s * W * 0.1, fy + W * 0.05); g.closePath(); g.fillStyle = o.fioccoCol || '#d23a4a'; g.fill(); g.lineWidth = W * 0.015; g.strokeStyle = '#2a1a26'; g.stroke(); }); punto(g, cx, fy, W * 0.025, o.fioccoCol || '#d23a4a'); }
}

// ---------------- TESSUTI (Poly Haven, CC0): solo la trama, ricolorata dal colore del vestito e «avvolta» sul busto ----------------
// Si usa con `tessuto: 'jeans'` (+ `tessutoForza` 0…1, default 0,35, e `tessutoScala`, default 1). Senza tessuto = colore pieno (come Rick).
// Prima di disegnare: await caricaTessuti(cartella) — cartella che contiene asset-kit/texture (nel test: '/kit/texture/').
export const TESSUTI = {
  jeans: 'denim_fabric', maglia: 'cotton_jersey', lana: 'knitted_fleece', quadretti: 'gingham_check', spigato: 'poly_wool_herringbone',
  velluto: 'ribbed_corduroy', pelle: 'brown_leather', fiori: 'floral_jacquard', lino: 'rough_linen'
};
const TEX = {};
export async function caricaTessuti(base = '/kit/texture/', nomi = Object.keys(TESSUTI)) {
  await Promise.all(nomi.map(n => new Promise(ok => {
    const k = TESSUTI[n], im = new Image(); im.onerror = () => ok();
    im.onload = () => {
      const S = 512, c = document.createElement('canvas'); c.width = S * 2; c.height = S; const q = c.getContext('2d'); q.drawImage(im, 0, 0, S, S);
      const d = q.getImageData(0, 0, S, S), D = d.data; let m = 0; for (let i = 0; i < D.length; i += 4) m += D[i] * 0.3 + D[i + 1] * 0.59 + D[i + 2] * 0.11; m /= D.length / 4;
      let v = 0; for (let i = 0; i < D.length; i += 4) { const l = D[i] * 0.3 + D[i + 1] * 0.59 + D[i + 2] * 0.11 - m; v += l * l; } const sd = Math.sqrt(v / (D.length / 4)) || 1;
      for (let i = 0; i < D.length; i += 4) { const l = D[i] * 0.3 + D[i + 1] * 0.59 + D[i + 2] * 0.11, t = Math.max(0, Math.min(255, 128 + (l - m) / sd * 42)); D[i] = D[i + 1] = D[i + 2] = t; D[i + 3] = 255; }
      q.putImageData(d, 0, 0); q.putImageData(d, S, 0); TEX[n] = c; ok();
    };
    im.src = base + k + '/' + k + '_diff.jpg';
  })));
}
function tessuto(g, p, o, x, bcy, Bw, busto, W, sa) {
  const T = o.tessuto && TEX[o.tessuto]; if (!T) return;
  const S = T.height, scala = (o.tessutoScala || 1) * W * 0.9 / S, N = 28, R = Bw / 2, top = bcy - busto * 0.75, h = busto * 1.5;
  g.save(); g.clip(p); g.globalCompositeOperation = 'overlay'; g.globalAlpha = o.tessutoForza ?? 0.35;
  for (let i = 0; i < N; i++) {
    const u0 = i / N * 2 - 1, u1 = (i + 1) / N * 2 - 1, th0 = Math.asin(u0 * 0.999), th1 = Math.asin(u1 * 0.999);
    const s0 = ((th0 + sa * Math.PI / 2) * R / scala) % S, sw = (th1 - th0) * R / scala, sx = (s0 + S * 4) % S;
    g.drawImage(T, sx, 0, Math.min(sw, S), Math.min(S, h / scala), x + u0 * R, top, (u1 - u0) * R + 0.6, Math.min(h, S * scala));
    if (h > S * scala) g.drawImage(T, sx, 0, Math.min(sw, S), (h - S * scala) / scala, x + u0 * R, top + S * scala, (u1 - u0) * R + 0.6, h - S * scala);
  }
  g.restore();
}

// calcola la posizione in pixel [px, py] della mano (0 o 1) sulla tela (512x1024)
export function calcolaManoPx(o = {}, mano = 0) {
  if (o._maniPxEffettive && o._maniPxEffettive[mano]) return o._maniPxEffettive[mano];
  const hp = o.maniPx && o.maniPx[mano];
  if (hp) return [hp[0], hp[1]];
  const s = mano ? 1 : -1;
  const W = calcolaWAdattato(o, o.W || 270), x0 = o.x ?? 256, a = Math.max(-1, Math.min(1, o.verso ?? 0));
  const saBase = Math.sin(a * Math.PI / 2), caBase = Math.cos(a * Math.PI / 2), dir = Math.sign(a) || 1;
  const TS = TESTE[o.testa] || TESTE.tonda, CS = CORPI[o.corpo] || CORPI.fagiolo, HH = W * TS.hw;
  const gambe = W * 0.93 * 1.4 * (o.gambe ?? CS.gambe ?? 1);
  const bustoScale = o.alto ?? CS.alto ?? 1;
  const largoScale = o.largo ?? CS.largo ?? 1;
  const busto = W * 0.93 * 1.1 * bustoScale;
  const back = Math.max(0, Math.min(1, o.spalle ?? (o.posa === 'spalle' ? 1 : 0)));
  const sedDrop = sedutoDropPx(o, W);
  const kin = calcolaCinematica(o, W, HH, gambe, bustoScale, largoScale, saBase, caBase, dir, sedDrop);
  const aTorso = Math.max(-1, Math.min(1, a + (kin.twistSa || 0) * 0.65));
  const sa = Math.sin(aTorso * Math.PI / 2), ca = Math.cos(aTorso * Math.PI / 2);
  const Bw = W * 0.8 * largoScale * (1 - 0.22 * Math.abs(sa));
  const x = x0 + (sedDrop > 0 ? 0 : (kin.hipSwayX || 0));
  const posaCorpo = kin.inMov ? kin.gaitKey : posaAuto(o);
  const hipYOrig = ((o.y ?? 1010) - kin.bobPx) - gambe + sedDrop;
  const chinY = hipYOrig - busto, hcx = x + saBase * W * 0.04, hcy = chinY - HH * 0.38;
  const pose = calcolaPoseBraccia(o, x, chinY, chinY, hipYOrig, hcx, hcy, Bw, busto, W, HH, sa, ca, dir, kin, posaCorpo, back);
  const h = o.mano && o.mano[mano];
  let [px, py] = h ? [x + h[0] * W, hipYOrig - busto + h[1] * W] : (pose.pts[mano] || [x + s * Bw * 0.62, hipYOrig - busto * 0.05]);
  if (Math.abs(kin.squashY || 0) > 0.002) {
    const sqY = 1 + kin.squashY, sqX = 1 / Math.sqrt(sqY);
    px = x + (px - x) * sqX;
    py = hipYOrig + (py - hipYOrig) * sqY;
  }
  const tpRad = ((o.torsoPiega ?? o.chino ?? 0) + pose.torsoPiegaExtra) * Math.PI / 180;
  if (tpRad) {
    const cos = Math.cos(tpRad), sin = Math.sin(tpRad), dx = px - x, dy = py - hipYOrig;
    px = x + dx * cos - dy * sin;
    py = hipYOrig + dx * sin + dy * cos;
  }
  if (o.piega) {
    const rad = o.piega * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
    const dx = px - 256, dy = py - 1010;
    px = 256 + dx * cos - dy * sin;
    py = 1010 + dx * sin + dy * cos;
  }
  return [px, py];
}
