// BUON SENSO del mondo (12/11, richiesta dell'utente): le cose devono essere come nella realtà, anche quando sono disegnate.
// Regole complete in references/buon-senso.md. Qui gli aiuti che le applicano da soli:
//   adattaTesto(c, testo, W, H, opz)  → scrive su una tela 2D: testo SEMPRE centrato, proporzionato al supporto (margine), va a capo da solo
//   cartello(M, opz)                  → cartello/insegna 3D con cornice e testo adattato
//   quadrante(c, W, H, ore, minuti)   → quadrante d'orologio con 12 numeri, tacche, lancette all'ora giusta
//   orologio(M, opz)                  → orologio 3D da muro che segna l'ora e muove la lancetta dei secondi (mondo vivo)
//   avvisi                            → elenco degli avvisi (testo troppo piccolo, troppo lungo…) letto dal controllo inquadrature
export const avvisi = [];

// testo centrato e proporzionato: margine (frazione del lato più corto), al massimo `righe` righe, dimensione massima `max` (frazione dell'altezza)
export function adattaTesto(c, testo, W, H, { margine = 0.12, righe = H > W * 0.8 ? 4 : 3, max = 0.62, font = '900', famiglia = 'sans-serif', colore = '#1d1a24', x0 = 0, y0 = 0, interlinea = 1.12, maiuscolo = false, minimo = 14 } = {}) {
  const t = maiuscolo ? String(testo).toUpperCase() : String(testo), m = Math.min(W, H) * margine, aw = W - 2 * m, ah = H - 2 * m, parole = t.split(/\s+/).filter(Boolean).reduce((o, w) => (/^[·•\-–—|:,.;!?]+$/.test(w) && o.length ? (o[o.length - 1] += ' ' + w, o) : (o.push(w), o)), []);   // la punteggiatura da sola resta attaccata alla parola prima
  let meglio = null;
  for (let n = 1; n <= Math.min(righe, parole.length); n++) {   // prova 1, 2, 3 righe: tiene quella con il testo più grande
    const L = spezza(c, parole, n, famiglia, font); let fs = Math.min(ah * max, ah / (n * interlinea));
    c.font = `${font} ${fs}px ${famiglia}`; const wmax = Math.max(...L.map(r => c.measureText(r).width)); if (wmax > aw) fs *= aw / wmax;
    if (!meglio || fs > meglio.fs) meglio = { L, fs }; }
  const { L, fs } = meglio; if (fs < minimo) avvisi.push(`testo «${t.slice(0, 30)}» troppo piccolo per il supporto (${fs.toFixed(0)} px): accorcialo o allarga il supporto`);
  c.save(); c.font = `${font} ${fs}px ${famiglia}`; c.fillStyle = colore; c.textAlign = 'center'; c.textBaseline = 'middle';
  const h = fs * interlinea, y = y0 + H / 2 - (L.length - 1) * h / 2; L.forEach((r, i) => c.fillText(r, x0 + W / 2, y + i * h)); c.restore(); return fs;
}
function spezza(c, parole, n, famiglia, font) { if (n === 1) return [parole.join(' ')];   // divide in n righe di lunghezza simile
  c.font = `${font} 100px ${famiglia}`; const tot = c.measureText(parole.join(' ')).width, out = []; let r = [];
  for (const p of parole) { r.push(p); if (out.length < n - 1 && c.measureText(r.join(' ')).width >= tot / n * 0.92) { out.push(r.join(' ')); r = []; } }
  if (r.length) out.push(r.join(' ')); return out; }

const tela = (THREE, W, H, fn) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; fn(cv.getContext('2d'), W, H); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return { cv, t }; };

// cartello: w, h in metri; la tela ha la stessa proporzione del supporto (le lettere non si stirano mai)
export function cartello(M, { testo = 'APERTO', w = 1.2, h = 0.4, x = 0, y = 2, z = 0, ry = 0, fondo = '#f4efe2', colore = '#1d1a24', bordo = '#2a1a26', spessore = 0.04, righe = 2, maiuscolo = true, font = '900', passa = false } = {}) {
  const { THREE } = M, px = 512, Hp = Math.max(32, Math.round(px * h / w)), g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry;
  const { t } = tela(THREE, px, Hp, (c, W, H) => { c.fillStyle = fondo; c.fillRect(0, 0, W, H); c.strokeStyle = bordo; c.lineWidth = Math.min(W, H) * 0.06; c.strokeRect(c.lineWidth / 2, c.lineWidth / 2, W - c.lineWidth, H - c.lineWidth);
    adattaTesto(c, testo, W, H, { colore, righe, maiuscolo, font, margine: 0.14 }); });
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, spessore), new THREE.MeshStandardMaterial({ color: bordo, roughness: 0.8 })); g.add(box);
  const fr = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.98, h * 0.96), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 })); fr.position.z = spessore / 2 + 0.002;
  fr.userData.scritta = 1; fr.userData.testo = String(testo); if (passa) fr.userData.testoPassa = 1;
  g.add(fr); g.name = 'cartello_' + testo; g.userData.testo = String(testo); if (passa) g.userData.testoPassa = 1; M.root.add(g); return g;
}

// quadrante con 12 numeri, 60 tacche (le 12 delle ore più spesse), lancette di ore, minuti e secondi
export function quadrante(c, W, H, ore = 10, minuti = 10, secondi = 0, { fondo = '#fbf8f0', cornice = '#c0283a', numeri = '#1d1a24', romani = false } = {}) {
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2; c.clearRect(0, 0, W, H);
  c.beginPath(); c.arc(cx, cy, R * 0.98, 0, 7); c.fillStyle = cornice; c.fill(); c.beginPath(); c.arc(cx, cy, R * 0.86, 0, 7); c.fillStyle = fondo; c.fill();
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, o = i % 5 ? 0.04 : 0.09; c.beginPath(); c.moveTo(cx + Math.sin(a) * R * 0.82, cy - Math.cos(a) * R * 0.82); c.lineTo(cx + Math.sin(a) * R * (0.82 - o), cy - Math.cos(a) * R * (0.82 - o));
    c.lineWidth = R * (i % 5 ? 0.012 : 0.03); c.strokeStyle = numeri; c.stroke(); }
  const RM = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  c.fillStyle = numeri; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 ${R * (romani ? 0.13 : 0.17)}px sans-serif`;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillText(romani ? RM[i] : String(i || 12), cx + Math.sin(a) * R * 0.6, cy - Math.cos(a) * R * 0.6); }
  const lan = (ang, l, w, col) => { c.beginPath(); c.moveTo(cx - Math.sin(ang) * l * 0.15, cy + Math.cos(ang) * l * 0.15); c.lineTo(cx + Math.sin(ang) * l, cy - Math.cos(ang) * l); c.lineWidth = w; c.lineCap = 'round'; c.strokeStyle = col; c.stroke(); };
  const m = minuti + secondi / 60, h = (ore % 12) + m / 60;
  lan(h / 12 * Math.PI * 2, R * 0.42, R * 0.07, numeri); lan(m / 60 * Math.PI * 2, R * 0.66, R * 0.045, numeri); lan(secondi / 60 * Math.PI * 2, R * 0.72, R * 0.015, cornice);
  c.beginPath(); c.arc(cx, cy, R * 0.05, 0, 7); c.fillStyle = numeri; c.fill();
}

// orologio da muro: ora di partenza "hh:mm" (o l'ora della storia), poi va avanti col tempo del video; la lancetta dei secondi scatta ogni secondo
export function orologio(M, { x = 0, y = 2.2, z = 0, ry = 0, r = 0.22, ora = '10:10', romani = false, cornice = '#c0283a' } = {}) {
  const { THREE } = M, [h0, m0] = String(ora).split(':').map(Number), g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry;
  const { cv, t } = tela(THREE, 512, 512, (c, W, H) => quadrante(c, W, H, h0, m0, 0, { romani, cornice }));
  const fondo = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.05, 48), new THREE.MeshStandardMaterial({ color: cornice, roughness: 0.6 })); fondo.rotation.x = Math.PI / 2; g.add(fondo);
  const fac = new THREE.Mesh(new THREE.CircleGeometry(r * 0.99, 64), new THREE.MeshBasicMaterial({ map: t, transparent: true })); fac.position.z = 0.027; g.add(fac);
  g.name = 'orologio'; g.userData.vivo = 'orologio'; M.root.add(g); let ult = -1;
  (M.tick = M.tick || []).push(tt => { const s = Math.floor(tt); if (s === ult) return; ult = s; const tot = h0 * 3600 + m0 * 60 + s;
    quadrante(cv.getContext('2d'), 512, 512, Math.floor(tot / 3600), Math.floor(tot / 60) % 60, tot % 60, { romani, cornice }); t.needsUpdate = true; });
  return g;
}
