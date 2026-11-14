// OGGETTI DA PORTO E CITTÀ costruiti in three.js (niente Blender), riusabili. Stile «carino»: forme smussate, tozze, colori a blocchi, dettagli dipinti.
// Ognuno ritorna un THREE.Group già aggiunto a M.root, con l'origine sul livello dell'acqua (navi) o a terra; fronte verso +z, prua verso +x.
// Tutto ciò che si muove si muove da solo (M.tick, tempo deterministico): navi che dondolano e avanzano, gru col carrello, faro che gira, gabbiani, camion.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '/lib/jsm/geometries/RoundedBoxGeometry.js';
const TAU = Math.PI * 2;
const mat = (M, c, e = .22, r = .6, m = 0) => { const x = M.std(c, r, m); x.emissive.set(c); x.emissiveIntensity = e; return x; };
const RB = (w, h, d, r = .1) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.1, h / 2.1, d / 2.1));
const tela = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
function P(par, geo, m, x, y, z, ombra = true) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = ombra; o.receiveShadow = true; par.add(o); return o; }
const gruppo = (M, x, y, z, ry = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; M.root.add(g); M.tick = M.tick || []; return g; };
let seme = 1; const rnd = () => (seme = (seme * 16807) % 2147483647) / 2147483647;
const PAL = ['#c2382f', '#2a6ad0', '#f2c230', '#3a9a5a', '#e8862a', '#8a4ab0', '#e8e2d6', '#2a8a9a'];
// finestre dipinte a fasce (per navi e palazzi)
const finestre = (righe, col, acceso = .5, base = '#e8e2d6', vetro = '#1d2a44', luce = '#ffd27a') => tela(256, 256, (c, w, h) => { c.fillStyle = base; c.fillRect(0, 0, w, h);
  for (let r = 0; r < righe; r++) for (let k = 0; k < col; k++) { c.fillStyle = rnd() < acceso ? luce : vetro; c.fillRect(k * w / col + w / col * .18, r * h / righe + h / righe * .22, w / col * .64, h / righe * .52); } });
// dondolio sull'acqua: tutto ciò che galleggia
const galleggia = (M, g, amp = .04, f = .25, ph = 0) => { const y0 = g.position.y; M.tick.push(t => { g.rotation.z = Math.sin(t * TAU * f + ph) * amp; g.rotation.x = Math.sin(t * TAU * f * .7 + ph * 2) * amp * .5; g.position.y = y0 + Math.sin(t * TAU * f * 1.3 + ph) * amp * 2; }); };
const naviga = (M, g, { vel = 0, da = -200, a = 200 } = {}) => { if (!vel) return; const x0 = g.position.x, L = a - da; M.tick.push(t => { g.position.x = da + ((((x0 - da) + vel * t) % L) + L) % L; }); };

// ---------------------------------------------------------------- NAVI
export function naveCargo(M, { x = 0, z = 0, L = 60, scafo = '#1d2a5a', fondo = '#a8302a', camino = '#e8862a', vel = 0, ry = 0, ph = 0 } = {}) {
  const g = gruppo(M, x, 0, z, ry), B = 10, ms = mat(M, scafo, .22, .5), mb = mat(M, '#e8e2d6', .25, .5);
  P(g, RB(L, 3, B, .8), mat(M, fondo, .2, .6), 0, -.6, 0); P(g, RB(L, 4.2, B, .9), ms, 0, 2.6, 0); P(g, RB(L - .5, .25, B + .05, .1), mb, 0, 4.6, 0);   // scafo (rosso sotto, blu sopra, filo bianco)
  P(g, RB(8, 3, B - .6, .6), ms, L / 2 - 3, 5.2, 0);   // castello di prua
  const fin = new THREE.MeshBasicMaterial({ map: finestre(4, 6, .55) }); const ponte = new THREE.Group(); ponte.position.set(-L / 2 + 6, 4.7, 0); g.add(ponte);
  for (let i = 0; i < 4; i++) { const w = 8 - i * .6, d = B - 1 - i * .4; P(ponte, RB(w, 2.4, d, .3), mb, 0, 1.2 + i * 2.4, 0); const f = new THREE.Mesh(new THREE.PlaneGeometry(w * .9, 1.4), fin); f.position.set(0, 1.3 + i * 2.4, d / 2 + .02); ponte.add(f); }
  P(ponte, RB(10, .35, B + 2, .1), mb, 0, 9.8, 0); P(ponte, RB(2.2, 4, 2.2, .6), mat(M, camino, .3), -2.5, 12, 0); P(ponte, RB(2.3, .6, 2.3, .2), mat(M, '#22242e', .15), -2.5, 14.1, 0);   // ponte di comando, camino
  seme = Math.round(x * 7 + z * 3) + 11; for (let i = 0; i < Math.floor((L - 22) / 6.3); i++) for (let r = -1; r <= 1; r++) { const n = 1 + Math.floor(rnd() * 3); for (let k = 0; k < n; k++) P(g, RB(6, 2.5, 2.4, .12), mat(M, PAL[Math.floor(rnd() * PAL.length)], .28, .6), -L / 2 + 15 + i * 6.3, 6.0 + k * 2.55, r * 2.6); }   // container in pile
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 6, 8), mat(M, '#e8e2d6', .3)); ant.position.set(-L / 2 + 5, 17, 0); g.add(ant); P(g, RB(.4, .4, .4, .1), M.emi('#ff3a2a', 1.6), -L / 2 + 5, 20.1, 0, false);
  galleggia(M, g, .012, .12, ph); naviga(M, g, { vel }); return g;
}
export function traghetto(M, { x = 0, z = 0, L = 40, colore = '#2a6ad0', vel = 0, ry = 0, ph = 0 } = {}) {
  const g = gruppo(M, x, 0, z, ry), B = 9, bianco = mat(M, '#efeae0', .26, .45), fin = new THREE.MeshBasicMaterial({ map: finestre(2, 10, .6, '#efeae0') });
  P(g, RB(L, 4, B, 1.2), bianco, 0, 1, 0); P(g, RB(L + .05, .6, B + .05, .2), mat(M, colore, .3), 0, 1.6, 0); P(g, RB(L, .8, B, .3), mat(M, '#a8302a', .2), 0, -.9, 0);
  for (let i = 0; i < 3; i++) { const w = L - 8 - i * 6, d = B - .6 - i * .8; P(g, RB(w, 2.6, d, .6), bianco, -2 - i, 4.3 + i * 2.6, 0); const f = new THREE.Mesh(new THREE.PlaneGeometry(w * .92, 1.3), fin); f.position.set(-2 - i, 4.4 + i * 2.6, d / 2 + .02); g.add(f); }
  P(g, RB(3, 3.5, 2.6, .8), mat(M, colore, .3), -8, 12.6, 0); for (let i = 0; i < 4; i++) P(g, RB(3, 1, 1.2, .4), mat(M, '#e8702a', .35), -10 + i * 5, 5.2, B / 2 - .3);   // camino, scialuppe arancio
  galleggia(M, g, .015, .15, ph); naviga(M, g, { vel }); return g;
}
export function peschereccio(M, { x = 0, z = 0, colore = '#2a8a9a', vel = 0, ry = 0, ph = 0 } = {}) {
  const g = gruppo(M, x, 0, z, ry), L = 12;
  P(g, RB(L, 2.2, 4, .8), mat(M, colore, .3), 0, .4, 0); P(g, RB(L + .05, .3, 4.05, .1), mat(M, '#efeae0', .3), 0, 1.4, 0); P(g, RB(4, 2.6, 3, .4), mat(M, '#efeae0', .28), -2, 2.8, 0);
  const fin = new THREE.MeshBasicMaterial({ map: finestre(1, 3, .3, '#efeae0') }); const f = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1), fin); f.position.set(-2, 3.3, 1.52); g.add(f);
  const legno = mat(M, '#8a5a3a', .25); const m1 = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 7, 8), legno); m1.position.set(2, 4.5, 0); g.add(m1);
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 6, 6), legno); b.position.set(2, 5.5, s * 2.5); b.rotation.x = s * .9; g.add(b); }   // bracci delle reti
  const rete = tela(128, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = '#d8c890'; c.lineWidth = 3; for (let i = 0; i < w; i += 14) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } });
  const r = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), new THREE.MeshBasicMaterial({ map: rete, transparent: true, side: THREE.DoubleSide, depthWrite: false })); r.position.set(4, 2.6, 0); r.rotation.y = Math.PI / 2; g.add(r);
  for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.35, .14, 8, 14), mat(M, '#1a1a20', .1)); t.position.set(-4 + i * 2.6, .8, 2.05); g.add(t); }   // gomme parabordo
  galleggia(M, g, .05, .3, ph); naviga(M, g, { vel }); return g;
}
export function barcaVela(M, { x = 0, z = 0, vela = '#f2ece0', vel = 0, ry = 0, ph = 0 } = {}) {
  const g = gruppo(M, x, 0, z, ry);
  P(g, RB(7, 1.2, 2.4, .5), mat(M, '#efeae0', .3), 0, .2, 0); P(g, RB(2.5, .8, 1.6, .3), mat(M, '#efeae0', .3), -.8, 1.1, 0);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 9, 8), mat(M, '#c9ced8', .3, .3, .6)); m.position.set(.5, 5.2, 0); g.add(m);
  const tri = new THREE.Shape(); tri.moveTo(0, 0); tri.lineTo(0, 8); tri.lineTo(-3.8, 0); tri.lineTo(0, 0);
  const s = new THREE.Mesh(new THREE.ShapeGeometry(tri), new THREE.MeshStandardMaterial({ color: vela, side: THREE.DoubleSide, emissive: vela, emissiveIntensity: .35 })); s.position.set(.4, 1.2, 0); g.add(s);
  M.tick.push(t => { s.rotation.y = Math.sin(t * .7 + ph) * .15; s.scale.x = 1 + Math.sin(t * 2.1 + ph) * .04; });   // la vela si gonfia
  galleggia(M, g, .07, .35, ph); naviga(M, g, { vel }); return g;
}
export function rimorchiatore(M, { x = 0, z = 0, vel = 0, ry = 0, ph = 0 } = {}) {
  const g = gruppo(M, x, 0, z, ry);
  P(g, RB(11, 2.6, 4.6, 1), mat(M, '#c2382f', .3), 0, .5, 0); P(g, RB(11.05, .5, 4.65, .2), mat(M, '#1a1a20', .12), 0, -.6, 0);
  P(g, RB(4.2, 2.4, 3.4, .5), mat(M, '#efeae0', .3), 1, 3, 0); P(g, RB(3.4, 1.6, 2.8, .4), mat(M, '#efeae0', .3), 1, 4.8, 0); P(g, RB(1.2, 2.2, 1.2, .4), mat(M, '#f2c230', .35), -1.6, 5, 0);
  const fin = new THREE.MeshBasicMaterial({ map: finestre(1, 4, .2, '#efeae0') }); const f = new THREE.Mesh(new THREE.PlaneGeometry(3, .8), fin); f.position.set(1, 5, 1.42); g.add(f);
  for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.4, .16, 8, 14), mat(M, '#1a1a20', .1)); t.position.set(-4.5 + i * 1.8, .9, 2.35); g.add(t); }
  galleggia(M, g, .05, .28, ph); naviga(M, g, { vel }); return g;
}
export function boa(M, { x = 0, z = 0, colore = '#c2382f', ph = 0 } = {}) {
  const g = gruppo(M, x, 0, z); P(g, new THREE.CylinderGeometry(.6, .8, 1.2, 14), mat(M, colore, .35), 0, .3, 0); P(g, new THREE.ConeGeometry(.45, 1.2, 14), mat(M, colore, .35), 0, 1.5, 0);
  const l = P(g, new THREE.SphereGeometry(.18, 10, 8), M.emi('#ffe08a', 1.2), 0, 2.2, 0, false); M.tick.push(t => { l.visible = ((t + ph) % 2) < 1; });
  galleggia(M, g, .12, .4, ph); return g;
}
// ---------------------------------------------------------------- PORTO
export function gru(M, { x = 0, z = 0, colore = '#e8862a', braccio = 30, ry = 0, ph = 0 } = {}) {   // gru da container: 4 gambe, braccio sopra l'acqua (+z), carrello che va avanti e indietro e cavo che sale e scende
  const g = gruppo(M, x, 0, z, ry), m = mat(M, colore, .3, .5), sc = mat(M, '#2a2a34', .15);
  for (const sx of [-6, 6]) for (const sz of [-8, 8]) P(g, RB(1.1, 30, 1.1, .2), m, sx, 15, sz);
  for (const sz of [-8, 8]) P(g, RB(13, 1.2, 1.2, .2), m, 0, 22, sz); for (const sx of [-6, 6]) P(g, RB(1.2, 1.2, 17, .2), m, sx, 22, 0);
  P(g, RB(3.2, 2, braccio + 22, .3), m, 0, 31, braccio / 2 - 3); P(g, RB(8, 5, 8, .5), mat(M, '#e8e2d6', .25), 0, 34, -10);   // braccio lungo, sala macchine
  const car = new THREE.Group(); g.add(car); P(car, RB(4, 1.6, 3.6, .3), sc, 0, 29.4, 0); P(car, RB(2.4, 2, 2.4, .3), mat(M, '#efeae0', .3), 0, 27.6, 0);
  const cavo = P(car, new THREE.CylinderGeometry(.06, .06, 1, 6), sc, 0, 20, 0, false), spr = P(car, RB(6.2, .6, 2.6, .1), m, 0, 12, 0), carico = P(car, RB(6, 2.5, 2.4, .12), mat(M, '#2a6ad0', .3), 0, 10.4, 0);
  M.tick.push(t => { const u = .5 - .5 * Math.cos(t * .25 + ph), h = 4 + 10 * (.5 + .5 * Math.cos(t * .5 + ph)); car.position.z = -2 + u * braccio; spr.position.y = 28 - h * 1.2; carico.position.y = spr.position.y - 1.6; cavo.scale.y = 28.5 - spr.position.y; cavo.position.y = (28.5 + spr.position.y) / 2; });
  return g;
}
export function container(M, { x = 0, y = 0, z = 0, colore = '#2a6ad0', ry = 0, scritta = '' } = {}) {
  const g = gruppo(M, x, y, z, ry), t = tela(256, 128, (c, w, h) => { c.fillStyle = colore; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 4; for (let i = 10; i < w; i += 16) { c.beginPath(); c.moveTo(i, 4); c.lineTo(i, h - 4); c.stroke(); } if (scritta) { c.fillStyle = '#fff'; c.font = '900 34px sans-serif'; c.textAlign = 'center'; c.fillText(scritta, w / 2, h * .62); } });
  const mm = M.std('#ffffff', .6); mm.map = t; mm.emissive.set('#ffffff'); mm.emissiveMap = t; mm.emissiveIntensity = .25; P(g, RB(6, 2.5, 2.4, .1), mm, 0, 1.25, 0); return g;
}
export function pilaContainer(M, { x = 0, z = 0, file = 4, colonne = 3, piani = 3, ry = 0, s = 7 } = {}) { const g = gruppo(M, x, 0, z, ry); seme = s;
  for (let f = 0; f < file; f++) for (let c = 0; c < colonne; c++) { const n = 1 + Math.floor(rnd() * piani); for (let k = 0; k < n; k++) { const o = new THREE.Mesh(RB(6, 2.5, 2.4, .1), mat(M, PAL[Math.floor(rnd() * PAL.length)], .28)); o.position.set(c * 6.4, 1.25 + k * 2.55, f * 2.6); o.castShadow = true; g.add(o); } } return g; }
export function molo(M, { x0 = -60, x1 = 60, z = 0, prof = 14, h = 2 } = {}) {   // banchina in cemento con bordo giallo, bitte e parabordi
  const g = gruppo(M, 0, 0, 0), cem = mat(M, '#a8a49a', .2, .8);
  P(g, RB(x1 - x0, h + 3, prof, .2), cem, (x0 + x1) / 2, h - 1.5 - 1.5, z - prof / 2); P(g, RB(x1 - x0, .3, .6, .1), mat(M, '#f2c230', .32), (x0 + x1) / 2, h + .05, z - .3);
  for (let x = x0 + 4; x < x1; x += 8) { P(g, new THREE.CylinderGeometry(.35, .45, .8, 12), mat(M, '#2a2a34', .15), x, h + .4, z - 1.2); const pf = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 1.6, 12), mat(M, '#1a1a20', .1)); pf.rotation.x = Math.PI / 2; pf.position.set(x + 4, h - .8, z + .2); g.add(pf); }
  return g; }
export function faro(M, { x = 0, z = 0, h = 16 } = {}) {
  const g = gruppo(M, x, 0, z), bi = mat(M, '#efeae0', .3), ro = mat(M, '#c2382f', .32);
  for (let i = 0; i < 5; i++) P(g, new THREE.CylinderGeometry(1.6 - i * .14, 1.7 - i * .14, h / 5, 18), i % 2 ? ro : bi, 0, h / 10 + i * h / 5, 0);
  P(g, new THREE.CylinderGeometry(1.2, 1.2, 1.6, 18), M.emi('#fff2b8', 1.3), 0, h + .8, 0, false); P(g, new THREE.ConeGeometry(1.5, 1.4, 18), ro, 0, h + 2.3, 0);
  const fascio = new THREE.Mesh(new THREE.ConeGeometry(2.5, 18, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#fff2c8', transparent: true, opacity: .18, depthWrite: false, side: THREE.DoubleSide })); fascio.rotation.z = Math.PI / 2; fascio.position.set(9, 0, 0);
  const rot = new THREE.Group(); rot.position.y = h + .8; rot.add(fascio); g.add(rot); M.tick.push(t => { rot.rotation.y = t * .9; }); return g; }
export function gabbiani(M, { x = 0, y = 14, z = 0, n = 6, raggio = 14 } = {}) {   // stormo che gira in tondo battendo le ali
  const g = gruppo(M, x, y, z), bi = mat(M, '#f4f0e8', .35), gr = mat(M, '#6a6a78', .25), uc = [];
  for (let i = 0; i < n; i++) { const b = new THREE.Group(); g.add(b); P(b, new THREE.SphereGeometry(.22, 10, 8), bi, 0, 0, 0).scale.set(1, .8, 2.2);
    const ali = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * .15, .05, 0); b.add(a); const p = P(a, RB(1.1, .05, .4, .02), bi, s * .55, 0, 0); P(a, RB(.35, .06, .41, .02), gr, s * 1.0, 0, 0); return [a, s]; }); uc.push([b, ali, i]); }
  M.tick.push(t => { for (const [b, ali, i] of uc) { const a = t * .25 + i * TAU / n, r = raggio * (.7 + .3 * Math.sin(i * 1.7)); b.position.set(Math.cos(a) * r, Math.sin(t * .6 + i) * 1.5 + i * .4, Math.sin(a) * r); b.rotation.y = -a; for (const [w, s] of ali) w.rotation.z = s * Math.sin(t * 7 + i) * .6; } });
  return g; }
// ---------------------------------------------------------------- CITTÀ
export function palazzo(M, { x = 0, z = 0, w = 12, d = 10, h = 30, colore = '#c8b8a0', ry = 0, s = 3, tetto = true } = {}) {
  const g = gruppo(M, x, 0, z, ry); seme = s; const t = finestre(Math.max(3, Math.round(h / 3.2)), Math.max(2, Math.round(w / 2.6)), .45, colore, '#2a3456', '#ffd27a');
  const mm = M.std('#ffffff', .7); mm.map = t; mm.emissive.set('#ffffff'); mm.emissiveMap = t; mm.emissiveIntensity = .3;
  P(g, RB(w, h, d, .4), mm, 0, h / 2, 0);
  if (tetto) { P(g, RB(w * .4, 2, d * .4, .3), mat(M, '#8a8f9a', .2), w * .15, h + 1, -d * .1); P(g, new THREE.CylinderGeometry(1.2, 1.2, 2.4, 12), mat(M, '#7a8aa8', .25), -w * .25, h + 1.2, d * .2); if (rnd() < .5) P(g, RB(w * .7, 2.6, .3, .1), M.emi(PAL[Math.floor(rnd() * 6)], 1.1), 0, h + 2.4, d / 2 - .4, false); }
  return g; }
export function skyline(M, { x0 = -120, x1 = 120, z = -60, file = 3, s = 5 } = {}) { seme = s; const C = ['#c8b8a0', '#a8b8c8', '#d8c8b0', '#b8a8c0', '#c0c8b8', '#e0d4c0'];
  for (let f = 0; f < file; f++) for (let x = x0; x < x1;) { const w = 9 + rnd() * 10, h = 12 + rnd() * (25 + f * 25); palazzo(M, { x: x + w / 2, z: z - f * 22 - rnd() * 6, w, d: 9 + rnd() * 6, h, colore: C[Math.floor(rnd() * C.length)], s: Math.floor(rnd() * 999) }); x += w + 1 + rnd() * 3; } }
export function camion(M, { x = 0, y = 0, z = 0, colore = '#2a6ad0', carico = '#c2382f', vel = 0, da = -80, a = 80, ry = 0 } = {}) {
  const g = gruppo(M, x, y, z, ry), sc = mat(M, '#22242e', .12);
  P(g, RB(2.6, 2.6, 2.4, .5), mat(M, colore, .3), 4.6, 1.9, 0); const fin = P(g, RB(1.0, 1.0, 2.3, .2), mat(M, '#2a3a5a', .3, .1), 5.6, 2.5, 0); P(g, RB(9, .4, 2.2, .1), sc, -.5, .9, 0);
  P(g, RB(7.4, 2.5, 2.4, .12), mat(M, carico, .28), -1.2, 2.4, 0); const ruote = [];
  for (const wx of [4.6, -2, -4]) for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .4, 16), sc); r.rotation.x = Math.PI / 2; r.position.set(wx, .55, s * 1.05); g.add(r); ruote.push(r); }
  if (vel) { const L = a - da, x0 = x; M.tick.push(t => { g.position.x = da + ((((x0 - da) + vel * t) % L) + L) % L; for (const r of ruote) r.rotation.y = 0, r.rotation.z = -vel * t / .55; }); } return g; }
export function auto(M, { x = 0, y = 0, z = 0, colore = '#c2382f', vel = 0, da = -80, a = 80, ry = 0 } = {}) {
  const g = gruppo(M, x, y, z, ry), sc = mat(M, '#22242e', .12); P(g, RB(4, 1, 1.8, .4), mat(M, colore, .3, .35), 0, .75, 0); P(g, RB(2.2, .8, 1.6, .35), mat(M, '#2a3a5a', .3, .1), -.2, 1.55, 0);
  const ruote = []; for (const wx of [1.3, -1.3]) for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .3, 14), sc); r.rotation.x = Math.PI / 2; r.position.set(wx, .36, s * .85); g.add(r); ruote.push(r); }
  P(g, RB(.1, .2, .4, .05), M.emi('#fff3c0', 1.5), 2.02, .85, .55, false); P(g, RB(.1, .2, .4, .05), M.emi('#fff3c0', 1.5), 2.02, .85, -.55, false);
  if (vel) { const L = a - da, x0 = x; M.tick.push(t => { g.position.x = da + ((((x0 - da) + vel * t) % L) + L) % L; for (const r of ruote) r.rotation.z = -vel * t / .36; }); } return g; }
export function lampione(M, { x = 0, y = 0, z = 0, h = 6 } = {}) { const g = gruppo(M, x, y, z), m = mat(M, '#3a3f4a', .18, .4); P(g, new THREE.CylinderGeometry(.1, .14, h, 10), m, 0, h / 2, 0); P(g, RB(1.4, .12, .12, .05), m, .6, h, 0); P(g, RB(.6, .2, .35, .08), M.emi('#fff1d0', 1.1), 1.2, h - .1, 0, false); return g; }
// ---------------------------------------------------------------- ACQUA: grande piano con onde vere (vertici mossi nel tempo), colore a bande, schiuma chiara sulle creste
export function mare(M, { x = 0, z = 60, w = 600, d = 200, colore = '#2a6a9a', chiaro = '#6ab0d0' } = {}) {
  const geo = new THREE.PlaneGeometry(w, d, 120, 60); geo.rotateX(-Math.PI / 2); const p = geo.attributes.position, base = p.array.slice(), col = new Float32Array(p.count * 3), c1 = new THREE.Color(colore), c2 = new THREE.Color(chiaro), cc = new THREE.Color();
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .25, metalness: .05, emissive: colore, emissiveIntensity: .22, flatShading: true });
  const o = new THREE.Mesh(geo, m); o.position.set(x, -.3, z); o.receiveShadow = true; M.root.add(o); M.tick = M.tick || [];
  M.tick.push(t => { for (let i = 0; i < p.count; i++) { const X = base[i * 3], Z = base[i * 3 + 2], y = Math.sin(X * .08 + t * 1.1) * .35 + Math.sin(Z * .13 - t * .8 + X * .02) * .25 + Math.sin((X + Z) * .3 + t * 2) * .06;
      p.array[i * 3 + 1] = y; cc.copy(c1).lerp(c2, Math.min(1, Math.max(0, (y + .2) * 1.2))); col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b; }
    p.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.computeVertexNormals(); });
  return o; }
