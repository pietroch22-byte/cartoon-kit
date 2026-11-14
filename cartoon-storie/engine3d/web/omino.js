// Omino «disegnato» (references/look-disegnato.md §6): testa sferica grande, corpo a cilindro ovale con volume,
// braccia e gambe a bastoncino, contorno scuro spesso. Un solo parametro di orientamento guida TUTTO
// (faccia, capelli, braccia, gambe, ombreggiatura), così ogni posa e ogni movimento restano coerenti.
//
// drawOmino(ctx, opzioni) su canvas 512x1024, piedi in basso al centro.
//   verso:  -1 profilo verso sinistra … 0 di fronte … 1 profilo verso destra (valori intermedi = tre quarti)
//           (compatibilità: `profilo` = ±1, `guarda` = tre quarti)
//   passo:  0…1 fase della camminata (posa 'cammina'): gambe e braccia oscillano in opposizione; animarla in modo continuo
//   luce:   -1 luce da sinistra … 1 da destra (lato chiaro di testa e corpo)
//   corpo, capelli, pelle, gambe, faccia ('neutro'|'furbo'|'sorriso'), posa ('fermo'|'cammina'), oggetto ('telefono'), tracolla, capelliTipo ('calotta'|'caschetto'|'pelato'|'ricci'|'spettinato'|'lunghi'|'codino'),
//   accessori ['occhiali','occhiali_sole','baffi','barba','guance','lentiggini','berretto','cuffia','chignon'], vestito ('cravatta'|'zip'|'cappuccio'|'righe'),
//   faccia anche 'sorpreso'|'arrabbiato'|'triste'|'annoiato'. personalita(seme, tipo) crea un personaggio coerente.
export const OW = 512, OH = 1024;
const INK = '#3a2a2e';   // contorno marrone scuro morbido (dipinto, non nero tecnico)

function mix(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const LW = 2.4;   // [utente] linee spesse come nel riferimento: contorni e linee interne ×2,4 (a dimensione di scena devono restare 5-8 px)
const stroke = (g, path, w = 7, col = INK) => { g.lineWidth = col === INK || col.startsWith('#3') ? w * LW : w; g.lineJoin = g.lineCap = 'round'; g.strokeStyle = col; g.stroke(path); };
// cilindro: sfumatura orizzontale (lato in luce → centro → lato in ombra + bordo di luce riflessa)
function cylFill(g, path, base, x0, x1, luce) {
  const gr = g.createLinearGradient(x0, 0, x1, 0), L = luce < 0;   // luce da sinistra: chiaro a sinistra
  const c = [mix(base, '#ffffff', 0.28), mix(base, '#ffffff', 0.1), base, mix(base, '#160c28', 0.32), mix(base, '#160c28', 0.18)];
  const st = [0, 0.22, 0.5, 0.86, 1];
  st.forEach((s, i) => gr.addColorStop(L ? s : 1 - s, c[i]));
  g.fillStyle = gr; g.fill(path);
}
// sfera: sfumatura radiale con il punto di luce spostato verso la luce
function sphFill(g, path, base, cx, cy, r, luce) {
  const gr = g.createRadialGradient(cx + luce * r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r * 1.05);
  gr.addColorStop(0, mix(base, '#ffffff', 0.5)); gr.addColorStop(0.6, base); gr.addColorStop(1, mix(base, '#1a1030', 0.14));
  g.fillStyle = gr; g.fill(path);
}

// ---- tratto a mano e pittura: dopo il disegno pulito, la figura viene «imperfettita» e dipinta ----
// 1) deformazione morbida (rumore a bassa frequenza, ampiezza ~3 px): contorni e forme non sono mai geometrici;
// 2) grana di pennello sui colori (macchie morbide ±6 %); 3) bordo leggermente ammorbidito (blur 0,6 px).
function hash(x, y, s) { const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); }
function vnoise(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function aMano(g, seed, amp = 0.9, freq = 1 / 160, grana = 0) {   // [utente] niente effetto dipinto: forme geometriche, appena irregolari   // deformazione lieve e lenta: imperfetto, mai «a serpente»
  const W = OW, H = OH, src = g.getImageData(0, 0, W, H), dst = g.createImageData(W, H), S = src.data, D = dst.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (vnoise(x * freq, y * freq, seed) - 0.5) * 2 * amp, dy = (vnoise(x * freq + 31, y * freq + 17, seed) - 0.5) * 2 * amp;
    const sx = Math.min(W - 1, Math.max(0, Math.round(x + dx))), sy = Math.min(H - 1, Math.max(0, Math.round(y + dy))), i = (y * W + x) * 4, j = (sy * W + sx) * 4;
    const k = 1 + (vnoise(x / 9, y / 9, seed + 5) - 0.5) * 2 * grana + (vnoise(x / 40, y / 40, seed + 9) - 0.5) * grana;   // pennellate
    D[i] = Math.min(255, S[j] * k); D[i + 1] = Math.min(255, S[j + 1] * k); D[i + 2] = Math.min(255, S[j + 2] * k); D[i + 3] = S[j + 3];
  }
  g.putImageData(dst, 0, 0);
  const t = document.createElement('canvas'); t.width = W; t.height = H; t.getContext('2d').drawImage(g.canvas, 0, 0);
  g.clearRect(0, 0, W, H); g.filter = 'blur(0.35px)'; g.drawImage(t, 0, 0); g.filter = 'none';
}

// ---- linee a pressione variabile (come nel riferimento: contorni e linee interne scure, irregolari, più spesse e più sottili) ----
// 1) trova i pixel di inchiostro; 2) li sfoca; 3) li ri-soglia con una soglia che varia nello spazio (rumore):
// dove la soglia è bassa la linea ingrassa, dove è alta si assottiglia, alle estremità si affusola da sola;
// 4) sotto le linee vecchie rimette il colore di riempimento preso dai vicini.
function inchiostro(g, seed, forza = 1) {
  const W = OW, H = OH, img = g.getImageData(0, 0, W, H), P = img.data, N = W * H;
  const M = new Float32Array(N), B = new Float32Array(N), T = new Float32Array(N);
  for (let i = 0; i < N; i++) { const r = P[i * 4], gg = P[i * 4 + 1], b = P[i * 4 + 2], a = P[i * 4 + 3] / 255; const l = (0.3 * r + 0.59 * gg + 0.11 * b) / 255;
    M[i] = a > 0.5 && Math.abs(r - 58) + Math.abs(gg - 42) + Math.abs(b - 46) < 46 ? 1 : 0; }   // solo il colore dell'inchiostro, non capelli scuri o ombre
  const R = 3;   // sfocatura a box separabile
  for (let y = 0; y < H; y++) { let acc = 0; for (let x = -R; x < W + R; x++) { if (x + R < W) acc += M[y * W + x + R]; if (x - R - 1 >= 0) acc -= M[y * W + x - R - 1]; if (x >= 0 && x < W) T[y * W + x] = acc / (2 * R + 1); } }
  for (let x = 0; x < W; x++) { let acc = 0; for (let y = -R; y < H + R; y++) { if (y + R < H) acc += T[(y + R) * W + x]; if (y - R - 1 >= 0) acc -= T[(y - R - 1) * W + x]; if (y >= 0 && y < H) B[y * W + x] = acc / (2 * R + 1); } }
  const out = new Uint8ClampedArray(P);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x;
    // [utente] bordo esterno netto, bordo interno appena ondulato (onde lunghe e morbide, non a serpente):
    // la linea originale resta com'è; la variazione si aggiunge solo VERSO L'INTERNO della sagoma
    const inside = P[i * 4 + 3] > 250;
    const t = 0.16 + 0.26 * vnoise(x / 48, y / 48, seed + 3) * forza;   // un solo rumore lento
    const m = M[i] ? 1 : inside ? Math.min(1, Math.max(0, (B[i] - t) / 0.1)) : 0;
    if (m <= 0 && !M[i]) continue;
    let fr = P[i * 4], fg = P[i * 4 + 1], fb = P[i * 4 + 2];
    if (M[i]) {   // colore di riempimento sotto la linea originale: media dei vicini non-inchiostro
      let n = 0, sr = 0, sg = 0, sb = 0; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; for (const d of [5, 8, 11]) { const xx = Math.round(x + Math.cos(a) * d), yy = Math.round(y + Math.sin(a) * d); if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = yy * W + xx; if (!M[j] && P[j * 4 + 3] > 128) { sr += P[j * 4]; sg += P[j * 4 + 1]; sb += P[j * 4 + 2]; n++; break; } } }
      if (n) { fr = sr / n; fg = sg / n; fb = sb / n; } }
    out[i * 4] = fr + (58 - fr) * m; out[i * 4 + 1] = fg + (42 - fg) * m; out[i * 4 + 2] = fb + (46 - fb) * m;   // inchiostro #3a2a2e
  }
  g.putImageData(new ImageData(out, W, H), 0, 0);
}

export function drawOmino(g, o = {}) {
  drawOminoPulito(g, o);
  if (o.inchiostro !== false && !window.NOINK) inchiostro(g, (o.seme ?? 7) + 11, o.pressione ?? 1);
  if (o.aMano !== false && !window.NOMANO) aMano(g, o.seme ?? Math.floor((o.corpo || '#e8742a').split('').reduce((a, c) => a + c.charCodeAt(0), 0) + (o.verso || 0) * 13));
}
function drawOminoPulito(g, o = {}) {
  const { corpo = '#e8742a', capelli = '#6b4630', pelle = '#f7f3ee', gambe = '#3a2a3a', faccia = 'neutro', posa = 'fermo',
    oggetto = null, tracolla = false, capelliTipo = 'calotta' } = o;
  const V = Math.max(-1, Math.min(1, o.verso ?? (o.profilo ? o.profilo : (o.guarda || 0) * 0.45)));   // orientamento unico
  const luce = o.luce ?? -1, ph = (o.passo ?? 0.25) * Math.PI * 2, walk = posa === 'cammina';
  const side = Math.abs(V), dir = Math.sign(V) || 1;           // quanto è girato, e verso dove
  g.clearRect(0, 0, OW, OH);
  // ---- proporzioni diverse per ogni personaggio (dal seme, o forzate con opzioni): chi più lungo, chi più corto, chi più tondo
  const sd = o.seme ?? (o.corpo || '#e8742a').split('').reduce((a, c) => a + c.charCodeAt(0) * 7, 0) + (o.capelli || '').length * 13;
  const rr = k => { const x = Math.sin(sd * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
  const altezza = o.altezza ?? rr(1), larghezza = o.larghezza ?? rr(2), tondo = o.tondo ?? rr(3), testa = o.testa ?? rr(4);
  // proporzioni del riferimento: testa GRANDE (~35-40 % dell'altezza), corpo pieno, gambe corte (~25 %)
  const cx = 256, hr = 150 + testa * 45, hy = 14 + hr;                     // testa: raggio 150-195 px su 1024
  const by0 = hy + hr * 0.7, by1 = 992 - (170 + (1 - altezza) * 90);       // gambe corte 170-260 px (come nel riferimento), il corpo riempie il resto
  const bw0 = 104 + larghezza * 46;                                        // larghezza 104-150 px
  const bw = bw0 - side * bw0 * 0.22;                                      // di profilo il cilindro ovale è più stretto (sezione ovale)
  const pancia = (tondo - 0.3) * 34;                                       // quanto si gonfia in mezzo (tondo) o resta dritto (snello)
  // ---- gambe (dietro il corpo); la camminata: di profilo il passo si vede in avanti/indietro, di fronte poco
  const leg = (sx, sw, near) => {
    const swing = walk ? Math.sin(ph + sw) : 0, fx = sx + dir * swing * (30 + side * 60), knee = sx + dir * swing * (14 + side * 26);
    const p = new Path2D(); p.moveTo(sx, by1 - 36);
    if (posa === 'seduto') { const kx = sx + dir * (50 + side * 90), ky = by1 + 40; p.quadraticCurveTo(sx + dir * 10, ky + 10, kx, ky); p.quadraticCurveTo(kx + dir * 6, (ky + 992) / 2, kx, 992); p.lineTo(kx + dir * 24, 994);   // seduto: coscia in avanti, stinco giù
      stroke(g, p, 13, near ? gambe : mix(gambe, '#000000', 0.25)); return; }
    p.quadraticCurveTo(knee + (walk ? -dir * 10 * Math.cos(ph + sw) : 0), (by1 + 990) / 2, fx, 992);
    p.lineTo(fx + (side > 0.3 ? dir * 24 : (sx < cx ? -14 : 14)), 994);   // piede verso dove guarda
    stroke(g, p, 13, near ? gambe : mix(gambe, '#000000', 0.25));
  };
  const lx = cx - 26 * (1 - side) - dir * side * 6, rx = cx + 26 * (1 - side) + dir * side * 6;
  leg(dir > 0 ? lx : rx, Math.PI, false); leg(dir > 0 ? rx : lx, 0, true);
  // ---- braccio lontano (dietro il corpo, più scuro): di profilo oscilla opposto alla gamba vicina
  const shoulderY = by0 + 70;
  const arm = (sx, swing, far, hold) => {
    const p = new Path2D(); p.moveTo(sx, shoulderY);
    let hx, hyy;
    if (hold) { hx = cx + dir * (40 + side * 40); hyy = by0 + (by1 - by0) * 0.55; }                      // regge il telefono davanti
    else { hx = sx + dir * swing * (20 + side * (bw + 45)) + (side < 0.3 ? (sx < cx ? -14 : 14) : 0); hyy = by0 + (by1 - by0) * 0.7 - Math.abs(swing) * 30 * side; }   // di profilo la mano esce dalla sagoma avanti/indietro
    p.quadraticCurveTo(sx + (hx - sx) * 0.3 + (side < 0.3 ? (sx < cx ? -16 : 16) : 0), (shoulderY + hyy) / 2 + 10, hx, hyy);
    stroke(g, p, 9, far ? mix(INK, '#000000', 0.1) : INK);
    return [hx, hyy];
  };
  const swingA = walk ? Math.sin(ph) : 0;
  const farSx = side > 0.3 ? cx - dir * bw * 0.15 : cx + dir * (bw - 12), nearSx = side > 0.3 ? cx + dir * bw * 0.05 : cx - dir * (bw - 12);
  if (side > 0.3) arm(farSx, swingA, true, false);           // di profilo il braccio lontano spunta dietro
  // ---- corpo: cilindro ovale con volume (sfumatura orizzontale), cima arrotondata che entra sotto la testa
  const b = new Path2D();
  b.moveTo(cx - bw, by0 + 60);
  b.bezierCurveTo(cx - bw, by0 - 20, cx + bw, by0 - 20, cx + bw, by0 + 60);                           // spalle tonde (nascoste in parte dalla testa)
  b.bezierCurveTo(cx + bw + 10 + pancia, by0 + (by1 - by0) * 0.45, cx + bw + 6 + pancia * 0.7, by1 - 50, cx + bw * (0.45 + tondo * 0.12), by1);   // fianco (più o meno pancia)
  b.bezierCurveTo(cx + bw * 0.15, by1 + 12 + tondo * 14, cx - bw * 0.15, by1 + 12 + tondo * 14, cx - bw * (0.45 + tondo * 0.12), by1);   // fondo tondo
  b.bezierCurveTo(cx - bw - 6 - pancia * 0.7, by1 - 50, cx - bw - 10 - pancia, by0 + (by1 - by0) * 0.45, cx - bw, by0 + 60); b.closePath();
  cylFill(g, b, corpo, cx - bw - 10, cx + bw + 10, luce);
  g.save(); g.clip(b);
  // ombra della testa sul corpo: lega testa e corpo (la testa sta SOPRA il corpo e lo ombreggia)
  const sh = g.createRadialGradient(cx - luce * 14, hy + 40, hr * 0.7, cx - luce * 14, hy + 40, hr * 1.25);
  sh.addColorStop(0, 'rgba(20,10,40,0.38)'); sh.addColorStop(1, 'rgba(20,10,40,0)'); g.fillStyle = sh; g.fillRect(0, 0, OW, OH);
  // riflesso lungo il lato in luce: dà la rotondità del cilindro
  // (niente striscia di riflesso fissa: la luce sui bordi la mette la scena, dinamica)
  g.restore();
  stroke(g, b, 8);
  // ---- dettagli del vestito (personalità)
  const vest = o.vestito;
  if (vest === 'cravatta' && side < 0.6) { const tx = cx + V * bw * 0.5, tv = new Path2D(); tv.moveTo(tx - 14, by0 + 34); tv.lineTo(tx + 14, by0 + 34); tv.lineTo(tx + 20, by0 + 170); tv.lineTo(tx, by0 + 196); tv.lineTo(tx - 20, by0 + 170); tv.closePath(); g.fillStyle = o.coloreAccessorio || '#c83a3a'; g.fill(tv); stroke(g, tv, 6);
    const cl = new Path2D(); cl.moveTo(tx - 50, by0 + 20); cl.lineTo(tx, by0 + 44); cl.lineTo(tx + 50, by0 + 20); stroke(g, cl, 6); }
  if (vest === 'zip') { const z = new Path2D(); z.moveTo(cx + V * bw * 0.5, by0 + 40); z.lineTo(cx + V * bw * 0.5, by1 - 20); stroke(g, z, 5); }
  if (vest === 'cappuccio' && side < 0.6) { for (const d of [-1, 1]) { const c = new Path2D(); c.moveTo(cx + V * bw * 0.5 + d * 22, by0 + 40); c.quadraticCurveTo(cx + V * bw * 0.5 + d * 26, by0 + 110, cx + V * bw * 0.5 + d * 20, by0 + 150); stroke(g, c, 5); } }
  if (vest === 'righe') { g.save(); g.clip(b); g.fillStyle = 'rgba(255,255,255,0.28)'; for (let y = by0 + 60; y < by1; y += 46) g.fillRect(0, y, OW, 18); g.restore(); stroke(g, b, 8); }
  if (tracolla) { const t = new Path2D(); t.moveTo(cx + 50 * (1 - side), by0 + 30); t.lineTo(cx - 40 + dir * side * 50, by0 + 190); stroke(g, t, 6);
    const kx = cx - 62 + dir * side * 70; g.fillStyle = '#2a2a30'; g.fillRect(kx, by0 + 170, 56, 40); g.lineWidth = 5; g.strokeStyle = INK; g.strokeRect(kx, by0 + 170, 56, 40); g.fillStyle = '#9ab'; g.beginPath(); g.arc(kx + 28, by0 + 190, 10, 0, 7); g.fill(); }
  // ---- braccio vicino (davanti al corpo) e, di fronte, anche l'altro
  const tel = oggetto === 'telefono';
  let hand;
  if (side > 0.3) hand = arm(nearSx, -swingA, false, tel);
  else { arm(cx - bw + 12, swingA, false, false); hand = arm(cx + bw - 12, -swingA, false, tel); if (tel) arm(cx - bw + 12, 0, false, true); }
  if (tel) { g.save(); g.translate(hand[0] + dir * 6, hand[1] - 14); g.rotate(-0.2 * dir); g.fillStyle = '#f2f2f2'; g.fillRect(-15, -24, 30, 46); g.lineWidth = 5; g.strokeStyle = INK; g.strokeRect(-15, -24, 30, 46); g.restore(); }
  // ---- testa: sfera sopra il corpo
  const h = new Path2D(); h.arc(cx, hy, hr, 0, Math.PI * 2);
  sphFill(g, h, pelle, cx, hy, hr, luce);
  // capelli ritagliati nella testa, che ruotano con il verso
  const fr = hy - 22, P = side > 0.3 ? dir : 0, sh3 = V * 40;   // di tre quarti la frangia si sposta verso dove guarda
  const hair = new Path2D();
  if (P) {
    hair.moveTo(cx + P * hr * 0.75, fr - 30); hair.quadraticCurveTo(cx + P * hr * 0.2, fr - 4, cx - P * hr * 0.1, fr + 4);
    hair.quadraticCurveTo(cx - P * hr * 0.35, hy + 40, cx - P * hr * 0.55, hy + 78); hair.lineTo(cx - P * (hr + 40), hy + 78); hair.lineTo(cx - P * (hr + 40), hy - hr - 40); hair.lineTo(cx + P * (hr + 40), hy - hr - 40); hair.closePath();
  } else if (capelliTipo === 'caschetto') {
    hair.moveTo(cx - hr - 12, hy + 70); hair.lineTo(cx - hr * 0.72 + sh3, hy + 70); hair.quadraticCurveTo(cx - hr * 0.78 + sh3, fr + 10, cx - hr * 0.55 + sh3, fr); hair.lineTo(cx + hr * 0.55 + sh3, fr);
    hair.quadraticCurveTo(cx + hr * 0.78 + sh3, fr + 10, cx + hr * 0.72 + sh3, hy + 70); hair.lineTo(cx + hr + 12, hy + 70); hair.lineTo(cx + hr + 12, hy - hr - 40); hair.lineTo(cx - hr - 12, hy - hr - 40); hair.closePath();
  } else if (capelliTipo === 'pelato') {
    hair.moveTo(cx - hr - 10, hy + 40); hair.quadraticCurveTo(cx - hr * 0.9, hy - 10, cx - hr * 0.78, hy - 20); hair.lineTo(cx - hr - 10, hy - 20); hair.closePath();   // solo ai lati
    hair.moveTo(cx + hr + 10, hy + 40); hair.quadraticCurveTo(cx + hr * 0.9, hy - 10, cx + hr * 0.78, hy - 20); hair.lineTo(cx + hr + 10, hy - 20); hair.closePath();
  } else if (capelliTipo === 'ricci') {   // massa di ricci: bordo a onde corte
    hair.moveTo(cx - hr - 10, hy + 20); for (let i = 0; i <= 10; i++) { const t = i / 10, x = cx - hr * 0.95 + t * hr * 1.9 + sh3, y = fr + 4 - Math.sin(t * Math.PI) * 10; hair.quadraticCurveTo(x - hr * 0.1, y + 22, x, y); }
    hair.lineTo(cx + hr + 10, hy + 20); hair.lineTo(cx + hr + 10, hy - hr - 40); hair.lineTo(cx - hr - 10, hy - hr - 40); hair.closePath();
  } else if (capelliTipo === 'spettinato') {   // ciuffi a punta che escono dalla testa
    hair.moveTo(cx - hr - 10, hy + 6); for (let i = 0; i <= 7; i++) { const t = i / 7, x = cx - hr + t * hr * 2 + sh3; hair.lineTo(x - hr * 0.12, fr + (i % 2 ? 18 : -2)); hair.lineTo(x, fr + (i % 2 ? -2 : 14)); }
    hair.lineTo(cx + hr + 10, hy + 6); hair.lineTo(cx + hr + 10, hy - hr - 40); hair.lineTo(cx - hr - 10, hy - hr - 40); hair.closePath();
  } else if (capelliTipo === 'lunghi') {   // lunghi fino alle spalle, riga in mezzo
    hair.moveTo(cx - hr - 14, hy + hr * 0.95); hair.lineTo(cx - hr * 0.62 + sh3, hy + hr * 0.95); hair.quadraticCurveTo(cx - hr * 0.7 + sh3, fr + 20, cx - hr * 0.1 + sh3, fr - 18);
    hair.quadraticCurveTo(cx + hr * 0.7 + sh3, fr + 20, cx + hr * 0.62 + sh3, hy + hr * 0.95); hair.lineTo(cx + hr + 14, hy + hr * 0.95); hair.lineTo(cx + hr + 14, hy - hr - 40); hair.lineTo(cx - hr - 14, hy - hr - 40); hair.closePath();
  } else {
    hair.moveTo(cx - hr - 10, hy + 6); hair.quadraticCurveTo(cx - hr * 0.6 + sh3, fr + 6, cx - hr * 0.25 + sh3, fr - 6); hair.quadraticCurveTo(cx + hr * 0.1 + sh3, fr + 10, cx + hr * 0.4 + sh3, fr - 2);
    hair.quadraticCurveTo(cx + hr * 0.75 + sh3, fr + 2, cx + hr + 10, hy + 6); hair.lineTo(cx + hr + 10, hy - hr - 40); hair.lineTo(cx - hr - 10, hy - hr - 40); hair.closePath();
  }
  g.save(); { const ch = new Path2D(); ch.arc(cx, hy, hr + (capelliTipo === 'lunghi' || capelliTipo === 'ricci' ? 14 : capelliTipo === 'caschetto' ? 8 : 0), 0, Math.PI * 2); if (capelliTipo === 'lunghi' && !P) ch.rect(cx - hr - 14, hy, hr * 2 + 28, hr * 0.95); g.clip(ch); }
  const hg = g.createRadialGradient(cx + luce * hr * 0.35, hy - hr * 0.5, 10, cx, hy - hr * 0.2, hr * 1.1);
  hg.addColorStop(0, mix(capelli, '#ffffff', 0.18)); hg.addColorStop(0.7, capelli); hg.addColorStop(1, mix(capelli, '#000000', 0.3));
  g.fillStyle = hg; g.fill(hair); stroke(g, hair, 6);
  stroke(g, (() => { const c = new Path2D(); c.moveTo(cx + sh3 * 0.5 - P * 10, hy - hr + 14); c.quadraticCurveTo(cx + sh3 * 0.5 - P * 4 - 6, hy - hr + 48, cx + sh3 * 0.5 - P * 30 - 18, fr - 6); return c; })(), 4, mix(capelli, '#000000', 0.4));
  g.restore();
  stroke(g, h, 8);
  // ---- accessori della testa (personalità)
  const acc = o.accessori || [];
  if (capelliTipo === 'codino' || acc.includes('chignon')) { const bp = new Path2D(); bp.arc(cx - V * 30, hy - hr - 18, hr * 0.32, 0, 7); g.fillStyle = capelli; g.fill(bp); stroke(g, bp, 6); }
  if (acc.includes('berretto')) { const bc = o.coloreAccessorio || '#c83a3a', c = new Path2D(); c.moveTo(cx - hr * 1.02, hy - hr * 0.25); c.quadraticCurveTo(cx, hy - hr * 1.45, cx + hr * 1.02, hy - hr * 0.25); c.closePath();
    g.fillStyle = bc; g.fill(c); stroke(g, c, 7); const v = new Path2D(); v.moveTo(cx + dir * hr * 0.2 - hr * 0.1, hy - hr * 0.28); v.quadraticCurveTo(cx + dir * hr * 1.1, hy - hr * 0.32, cx + dir * hr * 1.25, hy - hr * 0.14); v.lineTo(cx + dir * hr * 0.3, hy - hr * 0.16); v.closePath(); g.fillStyle = mix(bc, '#000000', 0.25); g.fill(v); stroke(g, v, 6); }
  if (acc.includes('poliziotto')) { const bc = o.coloreAccessorio || '#1f3a8a', c = new Path2D(); c.moveTo(cx - hr * 0.95, hy - hr * 0.55); c.lineTo(cx - hr * 1.15, hy - hr * 1.05); c.quadraticCurveTo(cx, hy - hr * 1.35, cx + hr * 1.15, hy - hr * 1.05); c.lineTo(cx + hr * 0.95, hy - hr * 0.55); c.closePath();
    g.fillStyle = bc; g.fill(c); stroke(g, c, 7); const f = new Path2D(); f.rect(cx - hr * 0.97, hy - hr * 0.62, hr * 1.94, hr * 0.16); g.fillStyle = '#10204a'; g.fill(f); stroke(g, f, 5);
    const v = new Path2D(); v.moveTo(cx - hr * 0.9, hy - hr * 0.48); v.quadraticCurveTo(cx + dir * hr * 0.3, hy - hr * 0.22, cx + hr * 0.95, hy - hr * 0.48); v.closePath(); g.fillStyle = '#0c1530'; g.fill(v); stroke(g, v, 5);
    const bd = new Path2D(); bd.arc(cx + V * hr * 0.3, hy - hr * 0.85, hr * 0.13, 0, 7); g.fillStyle = '#f0c040'; g.fill(bd); stroke(g, bd, 4); }
  if (acc.includes('cuffia')) { const bc = o.coloreAccessorio || '#3a6ac0', c = new Path2D(); c.moveTo(cx - hr * 1.0, hy - hr * 0.15); c.quadraticCurveTo(cx, hy - hr * 1.5, cx + hr * 1.0, hy - hr * 0.15); c.lineTo(cx + hr * 1.0, hy - hr * 0.02); c.lineTo(cx - hr * 1.0, hy - hr * 0.02); c.closePath();
    g.fillStyle = bc; g.fill(c); stroke(g, c, 7); const pp = new Path2D(); pp.arc(cx, hy - hr * 1.08, hr * 0.18, 0, 7); g.fillStyle = mix(bc, '#ffffff', 0.4); g.fill(pp); stroke(g, pp, 5); }
  // ---- faccia: scorre sulla sfera con il verso (sin dell'angolo), un occhio sparisce oltre il bordo
  const FK = hr / 118 * (o.espressione ?? 1.15);   // espressioni in scala con la testa, e un po' più grandi (si leggono da lontano)
  g.save(); g.translate(cx, hy); g.scale(FK, FK); g.translate(-cx, -hy);
  const a = V * Math.PI / 2, ey = hy + 22, fx = cx + Math.sin(a) * 62;
  g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round';
  const eyes = [-1, 1].map(s => ({ x: cx + Math.sin(a + s * 0.42) * 118 * 0.72, vis: Math.cos(a + s * 0.42) > 0.15 }));
  for (const e of eyes) if (e.vis) {
    if (faccia === 'sorpreso') { g.beginPath(); g.ellipse(e.x, ey - 2, 12, 17, 0, 0, 7); g.fill(); g.lineWidth = 11; g.beginPath(); g.arc(e.x, ey - 30, 16, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    else if (faccia === 'arrabbiato') { g.beginPath(); g.ellipse(e.x, ey + 2, 9.5, 11, 0, 0, 7); g.fill(); const inn = e.x < cx + Math.sin(a) * 62 ? 1 : -1; g.lineWidth = 14; g.beginPath(); g.moveTo(e.x - 20 * inn, ey - 32); g.lineTo(e.x + 18 * inn, ey - 18); g.stroke(); }
    else if (faccia === 'triste') { g.beginPath(); g.ellipse(e.x, ey + 2, 9, 12, 0, 0, 7); g.fill(); const inn = e.x < cx + Math.sin(a) * 62 ? 1 : -1; g.lineWidth = 11; g.beginPath(); g.moveTo(e.x - 18 * inn, ey - 20); g.lineTo(e.x + 16 * inn, ey - 32); g.stroke(); }
    else if (faccia === 'annoiato') { g.beginPath(); g.ellipse(e.x, ey + 3, 9.5, 8, 0, 0, Math.PI); g.fill(); g.lineWidth = 9; g.beginPath(); g.moveTo(e.x - 18, ey + 1); g.lineTo(e.x + 18, ey + 1); g.stroke(); }
    else if (faccia === 'sorriso') { g.lineWidth = 10; g.beginPath(); g.arc(e.x, ey + 4, 13, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    else { g.beginPath(); g.ellipse(e.x, ey, 9.5, 13, 0, 0, 7); g.fill();
      if (faccia === 'furbo') { g.fillStyle = mix(pelle, '#000000', 0.03); g.fillRect(e.x - 22, ey - 16, 44, 14); g.fillStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(e.x - 18, ey - 5); g.lineTo(e.x + 18, ey - 5); g.stroke(); }
      else { g.lineWidth = 13; g.beginPath(); g.moveTo(e.x - 18, ey - 27); g.quadraticCurveTo(e.x, ey - 31, e.x + 18, ey - 28); g.stroke(); } }
  }
  g.lineWidth = 9; g.beginPath(); const mx0 = fx + Math.sin(a) * 14;
  if (faccia === 'sorpreso') { g.ellipse(mx0, ey + 50, 11, 15, 0, 0, 7); g.fillStyle = '#6a2a2a'; g.fill(); }
  else if (faccia === 'arrabbiato') { g.moveTo(mx0 - 16, ey + 52); g.quadraticCurveTo(mx0, ey + 40, mx0 + 16, ey + 52); }
  else if (faccia === 'triste') { g.moveTo(mx0 - 14, ey + 54); g.quadraticCurveTo(mx0, ey + 42, mx0 + 14, ey + 54); }
  else if (faccia === 'annoiato') { g.moveTo(mx0 - 12, ey + 48); g.lineTo(mx0 + 10, ey + 50); }
  else if (faccia === 'sorriso') g.arc(mx0, ey + 40, 15 - side * 4, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (faccia === 'furbo') { g.moveTo(mx0 - 12, ey + 46); g.quadraticCurveTo(mx0 + 6, ey + 54, mx0 + 22, ey + 40); }
  else { g.moveTo(mx0 - 10 + side * 6, ey + 46); g.lineTo(mx0 + 12 - side * 4, ey + 46); }
  g.stroke();
  // ---- accessori del viso
  if (acc.includes('guance')) { g.fillStyle = 'rgba(230,110,110,0.35)'; for (const e of eyes) if (e.vis) { g.beginPath(); g.ellipse(e.x + (e.x < fx ? -8 : 8), ey + 30, 16, 9, 0, 0, 7); g.fill(); } }
  if (acc.includes('lentiggini')) { g.fillStyle = 'rgba(140,80,50,0.55)'; for (const e of eyes) if (e.vis) for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(e.x - 10 + (i % 3) * 10, ey + 24 + Math.floor(i / 3) * 8, 2.4, 0, 7); g.fill(); } }
  if (acc.includes('baffi')) { g.fillStyle = mix(o.capelli || '#6b4630', '#000000', 0.2); g.beginPath(); g.ellipse(mx0 - 13, ey + 36, 15, 7, -0.25, 0, 7); g.ellipse(mx0 + 13, ey + 36, 15, 7, 0.25, 0, 7); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); }
  if (acc.includes('barba')) { const bb = new Path2D(); bb.moveTo(fx - 58, ey + 18); bb.quadraticCurveTo(fx - 50, ey + 96, fx, ey + 100); bb.quadraticCurveTo(fx + 50, ey + 96, fx + 58, ey + 18); bb.quadraticCurveTo(fx, ey + 60, fx - 58, ey + 18);
    g.fillStyle = mix(o.capelli || '#6b4630', '#000000', 0.1); g.fill(bb); g.lineWidth = 7; g.strokeStyle = INK; g.stroke(bb); }
  if (acc.includes('occhiali')) { g.lineWidth = 7; g.strokeStyle = INK; const vis = eyes.filter(e => e.vis); for (const e of vis) { g.beginPath(); g.arc(e.x, ey, 22, 0, 7); g.stroke(); } if (vis.length === 2) { g.beginPath(); g.moveTo(vis[0].x + 22, ey - 2); g.lineTo(vis[1].x - 22, ey - 2); g.stroke(); } }
  if (acc.includes('occhiali_sole')) { g.fillStyle = '#1a1420'; const vis = eyes.filter(e => e.vis); for (const e of vis) { g.beginPath(); g.ellipse(e.x, ey, 26, 18, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(e.x - 14, ey - 9, 8, 5); g.fillStyle = '#1a1420'; } if (vis.length === 2) { g.lineWidth = 7; g.strokeStyle = '#1a1420'; g.beginPath(); g.moveTo(vis[0].x + 24, ey - 4); g.lineTo(vis[1].x - 24, ey - 4); g.stroke(); } }
  g.restore();
}

// ---- personalità: un seme → un personaggio coerente (stile capelli, accessori, vestiti, espressione abituale)
// Tipi: ragazzo, ragazza, impiegato, nonno, nonna, sportivo, studente, artista, turista, duro. Usa `tipo` per sceglierlo, o lascia scegliere al seme.
export function personalita(seme, tipo) {
  const r = k => { const x = Math.sin(seme * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); }, pick = (k, a) => a[Math.floor(r(k) * a.length) % a.length];
  const tipi = ['ragazzo', 'ragazza', 'impiegato', 'nonno', 'nonna', 'sportivo', 'studente', 'artista', 'turista', 'duro'];
  const t = tipo || pick(1, tipi);
  const base = { seme, corpo: pick(2, ['#e8742a', '#3a7ac0', '#c84a6a', '#4a9a5a', '#e8c040', '#7a5ac0', '#2c3670', '#d85a3a', '#5ab0c0', '#8a6a4a']), capelli: pick(3, ['#6b4630', '#2a1e1a', '#8a5a30', '#3a2a20']), accessori: [], faccia: pick(4, ['neutro', 'sorriso', 'furbo', 'annoiato']) };
  const P = {
    ragazzo: { capelliTipo: pick(5, ['spettinato', 'calotta', 'ricci']), accessori: r(6) < 0.3 ? ['lentiggini'] : [] },
    ragazza: { capelliTipo: pick(5, ['lunghi', 'caschetto', 'codino']), accessori: r(6) < 0.5 ? ['guance'] : [] },
    impiegato: { capelliTipo: 'calotta', vestito: 'cravatta', accessori: r(6) < 0.5 ? ['occhiali'] : [], faccia: pick(4, ['neutro', 'annoiato', 'triste']), corpo: pick(2, ['#2c3670', '#4a4a5a', '#3a4a6a']) },
    nonno: { capelliTipo: 'pelato', capelli: '#c8c8c8', accessori: ['occhiali', r(6) < 0.6 ? 'baffi' : 'barba'], faccia: pick(4, ['sorriso', 'neutro', 'furbo']), altezza: 0.2 },
    nonna: { capelliTipo: 'codino', capelli: '#d0d0d8', accessori: ['occhiali', 'guance'], faccia: 'sorriso', tondo: 0.9, altezza: 0.1 },
    sportivo: { capelliTipo: 'calotta', accessori: ['berretto'], coloreAccessorio: pick(7, ['#c83a3a', '#2a6ac0', '#3a9a4a']), vestito: 'zip', faccia: pick(4, ['sorriso', 'furbo']) },
    studente: { capelliTipo: pick(5, ['spettinato', 'ricci']), accessori: ['occhiali'], vestito: 'cappuccio', faccia: pick(4, ['sorpreso', 'neutro', 'sorriso']) },
    artista: { capelliTipo: pick(5, ['ricci', 'lunghi']), accessori: ['cuffia', r(6) < 0.5 ? 'barba' : 'lentiggini'], coloreAccessorio: pick(7, ['#e8c040', '#c84a6a', '#4a9a5a']), vestito: 'righe' },
    turista: { capelliTipo: 'calotta', accessori: ['occhiali_sole'], tracolla: true, vestito: 'righe', faccia: 'sorriso' },
    duro: { capelliTipo: pick(5, ['pelato', 'calotta']), accessori: ['occhiali_sole', r(6) < 0.5 ? 'barba' : 'baffi'], faccia: pick(4, ['arrabbiato', 'annoiato']), larghezza: 0.95, corpo: pick(2, ['#4a4a5e', '#7a3a4a', '#5c5c66'])   /* mai vicino al colore inchiostro: verrebbe trattato come linea */ },
  }[t];
  return { ...base, ...P, tipo: t, accessori: [...base.accessori, ...(P.accessori || [])] };
}
