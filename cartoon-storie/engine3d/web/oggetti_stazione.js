// OGGETTI DA STAZIONE costruiti direttamente in three.js (niente Blender), riusabili in ogni video con treni e binari.
// Stile «carino»: forme smussate (RoundedBox), proporzioni un po' tozze, pochi pezzi leggibili + dettagli dipinti su tela, materiali del look.
// Uso nello script del luogo:  import * as ST from '/web/oggetti_stazione.js';  const T = ST.treno(M, { x: 5.1, z: -4, porte: [5, 0, -5] });
import * as THREE from 'three';
import { RoundedBoxGeometry } from '/lib/jsm/geometries/RoundedBoxGeometry.js';
import { vivo } from '/web/vivi.js';

const mat = (M, c, e = .22, r = .6, m = 0) => { const x = M.std(c, r, m); x.emissive.set(c); x.emissiveIntensity = e; return x; };
const tela = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const RB = (w, h, d, r = .06) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.1, h / 2.1, d / 2.1));
function pezzo(par, geo, m, x, y, z, ombra = true) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = ombra; o.receiveShadow = true; par.add(o); return o; }

// ---------------------------------------------------------------- TRENO (carrozza vista di fianco, lato banchina verso -x)
// opzioni: x (centro), z (centro), lunghezza, colore (cassa), fascia, fascia2, numero, porte: [dz…] (posizioni porte rispetto al centro), interni: true
export async function treno(M, { x = 5.1, z = -4, y = -1.0, lunghezza = 20, colore = '#e4e2dc', fascia = '#c2282f', fascia2 = '#2a4ab0', numero = '3105', porte = [5, 0, -5], interni = true } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); M.root.add(g);
  const W = 3.0, H = 3.3, L = lunghezza, lato = -W / 2;   // lato banchina
  const cassa = mat(M, colore, .2, .35), scuro = mat(M, '#22242e', .12, .5), vetro = mat(M, '#22355a', .3, .08), gomma = mat(M, '#15161c', .08, .7);
  pezzo(g, RB(W, H, L, .38), cassa, 0, y + H / 2 + .1, 0);                        // cassa smussata
  pezzo(g, RB(W * .94, .32, L - .5, .15), cassa, 0, y + H + .18, 0);   // tetto bombato
  pezzo(g, RB(W + .03, .28, L - .3, .1), mat(M, fascia, .32, .4), 0, y + 1.05, 0); pezzo(g, RB(W + .04, .1, L - .3, .04), mat(M, fascia2, .32, .4), 0, y + 1.32, 0);   // fasce
  pezzo(g, RB(W - .3, .45, L - 1.2, .1), scuro, 0, y + .05, 0);                    // sottocassa
  for (const dz of [-L / 2 + 2.2, L / 2 - 2.2]) { pezzo(g, RB(2.2, .35, 2.6, .1), gomma, 0, y - .05, dz); for (const s of [-1, 1]) for (const w of [-.7, .7]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .18, 18), scuro); r.rotation.z = Math.PI / 2; r.position.set(s * 1.0, y - .2, dz + w); g.add(r); } }   // carrelli e ruote
  for (const dz of [-L / 4, L / 4]) { pezzo(g, RB(1.6, .35, 2.4, .12), mat(M, '#c9c8c4', .2, .4), 0, y + H + .45, dz); pezzo(g, RB(1.2, .05, 2.0, .02), scuro, 0, y + H + .64, dz); }   // condizionatori sul tetto
  const grill = tela(256, 64, (c, w, h) => { c.fillStyle = '#2a2a34'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a8a96'; c.lineWidth = 3; for (let i = 8; i < w; i += 12) { c.beginPath(); c.moveTo(i, 6); c.lineTo(i, h - 6); c.stroke(); } });
  // finestrini: vetro scuro con cornice, riflesso dipinto, e dentro sedili e maniglie (si vedono quando la luce interna è accesa)
  const riflesso = tela(256, 128, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3a5a8a'); gr.addColorStop(.45, '#20365e'); gr.addColorStop(1, '#16223e'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(w * .1, 0); c.lineTo(w * .28, 0); c.lineTo(w * .12, h); c.lineTo(0, h); c.fill(); c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(w * .36, 0); c.lineTo(w * .42, 0); c.lineTo(w * .26, h); c.lineTo(w * .2, h); c.fill(); });
  const mFin = new THREE.MeshBasicMaterial({ map: riflesso, toneMapped: true });
  const libero = dz => porte.every(p => Math.abs(dz - p) > 1.25);
  for (let dz = L / 2 - 1.3; dz > -L / 2 + 1; dz -= 1.55) if (libero(dz)) { pezzo(g, RB(.06, 1.0, 1.25, .08), gomma, lato - .01, y + 2.05, dz, false); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .86), mFin); f.rotation.y = -Math.PI / 2; f.position.set(lato - .05, y + 2.05, dz); g.add(f); }
  // targa con il numero e le luci di porta
  const targa = tela(256, 96, (c, w, h) => { c.fillStyle = '#f6f2ea'; c.fillRect(0, 0, w, h); c.fillStyle = '#1d2a5a'; c.font = '900 64px sans-serif'; c.textAlign = 'center'; c.fillText(numero, w / 2, h * .72); });
  const tg = new THREE.Mesh(new THREE.PlaneGeometry(.55, .2), new THREE.MeshBasicMaterial({ map: targa })); tg.rotation.y = -Math.PI / 2; tg.position.set(lato - .04, y + 2.95, L / 2 - 2.6); g.add(tg);
  // interni: pavimento, sedili lunghi, pali e maniglie, luce calda (visibili dalle porte aperte)
  if (interni) { pezzo(g, RB(W - .3, .06, L - .6, .02), mat(M, '#8a8070', .2), 0, y + 1.02, 0, false); pezzo(g, RB(.06, 2.1, L - .6, .02), mat(M, '#e8e2d4', .35), W / 2 - .2, y + 2.1, 0, false);
    for (const s of [-1, 1]) { pezzo(g, RB(.5, .12, L - 3, .05), mat(M, '#3a62b0', .3), s * .9, y + 1.45, 0, false); pezzo(g, RB(.12, .5, L - 3, .05), mat(M, '#3a62b0', .3), s * 1.15, y + 1.7, 0, false); }
    const metal = mat(M, '#c9ced8', .25, .25, .6); for (const p of porte) for (const s of [-1, 1]) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 2.0, 8), metal); pl.position.set(-.3, y + 2.05, p + s * .7); g.add(pl); }
    for (let dz = -L / 2 + 1; dz < L / 2 - 1; dz += .45) { const an = new THREE.Mesh(new THREE.TorusGeometry(.07, .015, 6, 14), mat(M, '#f2f0e6', .3)); an.position.set(s0(dz), y + 2.6, dz); g.add(an); }
    const luce = new THREE.PointLight('#ffe8c0', 4, 9, 1.6); luce.position.set(0, y + 2.9, 0); g.add(luce); }
  // porte scorrevoli vere (library/vivi): si aprono/chiudono con «apri»/«chiudi» sulla parola o per vicinanza
  const P = []; for (const dz of porte) { pezzo(g, RB(.05, 2.4, 1.55, .05), gomma, lato + .005, y + 2.25, dz, false);   // cornice scura attorno alla porta
    const d = await vivo(M, 'porta_scorrevole', { x: x + lato - .06, y: y + 1.05, z: z + dz, ry: -Math.PI / 2, s: .55, colori: { metallo: '#b9bfcc' } }); g.attach(d); P.push(d); }
  g.userData.vivo = 'treno'; return { gruppo: g, porte: P };
}
function s0(dz) { return (Math.round(dz * 10) % 2 ? .35 : -.35); }

// ---------------------------------------------------------------- BANCHINA: pavimento a piastrelle, bordo con la linea gialla tattile a puntini, linea bianca, segni d'attesa dipinti
export function banchina(M, { x0 = -3.2, x1 = 3.1, z0 = 9, z1 = -21, y = .03, colore = '#b4ad9f' } = {}) {
  const W = x1 - x0, L = z0 - z1, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const pav = tela(512, 512, (c, w, h) => { c.fillStyle = colore; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(60,50,40,.28)'; c.lineWidth = 3; for (let i = 0; i <= w; i += 64) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); }
    for (let k = 0; k < 40; k++) { c.fillStyle = `rgba(90,80,70,${Math.random() * .08})`; c.beginPath(); c.arc(Math.random() * w, Math.random() * h, 6 + Math.random() * 18, 0, 7); c.fill(); } });
  pav.wrapS = pav.wrapT = THREE.RepeatWrapping; pav.repeat.set(W / 1.2, L / 1.2);
  const m = M.std('#ffffff', .8); m.map = pav; m.emissive.set('#ffffff'); m.emissiveMap = pav; m.emissiveIntensity = .18;
  const p = new THREE.Mesh(RB(W, .4, L, .05), m); p.position.set(cx, y - .2, cz); p.receiveShadow = true; M.root.add(p);
  // linea gialla tattile a puntini (istanze: migliaia di puntini a un costo)
  const giallo = mat(M, '#f2c230', .32, .5); M.box(.5, .02, L, giallo, x1 - .55, y + .012, cz);
  const dot = new THREE.CylinderGeometry(.018, .022, .02, 8), n = Math.floor(L / .1) * 4, I = new THREE.InstancedMesh(dot, giallo, n), q = new THREE.Object3D(); let k = 0;
  for (let zz = z1 + .05; zz < z0 && k < n; zz += .1) for (let c = 0; c < 4 && k < n; c++) { q.position.set(x1 - .73 + c * .12, y + .03, zz); q.updateMatrix(); I.setMatrixAt(k++, q.matrix); }
  I.count = k; M.root.add(I);
  M.box(.12, .02, L, mat(M, '#f4f0e6', .3), x1 - .12, y + .013, cz);
  // segni d'attesa dipinti a terra davanti alle porte (frecce e file), come sulle banchine giapponesi
  return { y };
}
export function segniAttesa(M, { x = 1.9, z = 0, y = .045 } = {}) {
  const t = tela(256, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = '#3a8ad0'; c.lineWidth = 10; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(w / 2 + s * 70, 40); c.lineTo(w / 2 + s * 70, 200); c.stroke(); c.beginPath(); c.moveTo(w / 2 + s * 70 - 22, 175); c.lineTo(w / 2 + s * 70, 210); c.lineTo(w / 2 + s * 70 + 22, 175); c.stroke(); } c.fillStyle = '#3a8ad0'; c.font = '700 34px sans-serif'; c.textAlign = 'center'; c.fillText('3', w / 2, 140); });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); p.rotation.x = -Math.PI / 2; p.rotation.z = Math.PI / 2; p.position.set(x, y, z); M.root.add(p); return p; }

// ---------------------------------------------------------------- PENSILINA: tetto con travi, lampade a striscia, cartelli appesi, altoparlante
export function pensilina(M, { x0 = -2.9, x1 = 2.4, z0 = 7, z1 = -19, h = 4.1, pilastri = [3, -3, -9, -15] } = {}) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, L = z0 - z1, W = x1 - x0 + 1.2, grigio = mat(M, '#9c978c', .18), trave = mat(M, '#6f7680', .2, .4);
  M.box(W, .18, L, grigio, cx, h + .1, cz); for (let z = z0; z > z1; z -= 2.5) M.box(W, .16, .14, trave, cx, h - .02, z);
  for (const z of pilastri) for (const x of [x0 + .4, x1 - .4]) { const c = new THREE.Mesh(RB(.24, h, .24, .06), mat(M, '#7a8a9a', .2, .4)); c.position.set(x, h / 2, z); c.castShadow = true; M.root.add(c); }
  for (let z = z0 - 1.5; z > z1; z -= 5) { M.box(1.4, .07, .16, M.emi('#fff1d0', .85), cx, h - .12, z); M.box(1.5, .05, .22, trave, cx, h - .07, z); }
  return { h };
}
export function cartelloAppeso(M, { x = 0, y = 3.4, z = 0, w = 1.6, h = .42, testo = 'USCITA →', sotto = '出口', fondo = '#1d3a8a', colore = '#ffffff', ry = 0, passa = true } = {}) {
  const t = tela(512, Math.round(512 * h / w), (c, W, H) => { c.fillStyle = fondo; c.fillRect(0, 0, W, H); c.fillStyle = colore; c.textAlign = 'center'; c.font = `900 ${H * .45}px sans-serif`; c.fillText(testo, W / 2, H * .5); c.font = `700 ${H * .26}px sans-serif`; c.fillText(sotto, W / 2, H * .85); });
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; M.root.add(g);
  const f = new THREE.Mesh(RB(w + .06, h + .06, .06, .03), mat(M, '#2a2a34', .15)); g.add(f);
  const txt = [testo, sotto].filter(Boolean).join(' ');
  for (const s of [1, -1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t })); p.position.z = s * .032; if (s < 0) p.rotation.y = Math.PI; p.userData.scritta = 1; p.userData.testo = txt; if (passa) p.userData.testoPassa = 1; g.add(p); }
  for (const s of [-1, 1]) M.box(.02, .5, .02, mat(M, '#3a3a44', .15), x + s * w * .4 * Math.cos(ry), y + h / 2 + .25, z - s * w * .4 * Math.sin(ry));
  g.userData.vivo = { ondeggia: { amp: .02, freq: .3, asse: 'z' } }; g.userData.testo = txt; if (passa) g.userData.testoPassa = 1; return g; }
export function specchio(M, { x = 2.0, z = -1, y = 2.6, ry = -.7 } = {}) {   // specchio convesso per il capotreno: palo + disco con cornice arancio
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; M.root.add(g);
  const palo = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, y, 10), mat(M, '#8a8f9a', .2, .4)); palo.position.y = y / 2; g.add(palo);
  const c = new THREE.Mesh(new THREE.TorusGeometry(.32, .05, 10, 28), mat(M, '#e8702a', .35)); c.position.y = y + .3; g.add(c);
  const s = new THREE.Mesh(new THREE.SphereGeometry(.32, 24, 12, 0, Math.PI * 2, 0, .6), mat(M, '#c8d8ea', .4, .08, .8)); s.rotation.x = Math.PI / 2; s.position.set(0, y + .3, .02); s.scale.z = .25; g.add(s); return g; }
export function altoparlante(M, { x = 0, y = 3.8, z = 0, ry = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; M.root.add(g); const m = mat(M, '#e8e4dc', .25);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(.18, .08, .32, 16, 1, true), m); c.rotation.x = Math.PI / 2 + .4; g.add(c); const b = new THREE.Mesh(RB(.12, .12, .12, .03), m); b.position.z = -.16; g.add(b); return g; }
