// MONDO VIVO, parte 2 (la parte principale è vita.js, M.vita). Qui: meccanismi dei GLB di library/vivi (userData vivo_*), vapore, polvere, auto con userData.vivo = { muovi }.
// Se M.vita esiste, luci e insegne le anima vita.js e qui si saltano. Si applica da solo a ogni luogo, dopo che il mondo è costruito
// (storia_disegnato.js chiama vivifica(M, {camera}); si spegne con "vivo": false nella storia o nel luogo).
// Tutto è una funzione del tempo t (stesso fotogramma = stesso risultato) e piano: niente sfarfallii.
//
// AUTOMATICO per ogni luogo:
//  - luci vere (PointLight/SpotLight) che respirano ±5%, ognuna con la sua fase
//  - materiali accesi (insegne, neon, lampade: MeshBasicMaterial con colore > 1) che pulsano ±8%, uno su sei ogni tanto cala (neon che «respira»)
//  - polvere nella luce: puntini che salgono piano attorno alla camera (parallasse vera)
// CONVENZIONI, per far vivere un oggetto senza scrivere codice (nel nome del nodo del GLB di Blender, o in `userData.vivo`):
//  - nome  gira / gira_x / gira_y / gira_z   → ruota (ventole, ruote, lancette, giostre; `ventola` = attorno all'asse davanti)
//  - nome  ondeggia                          → dondola piano (tende, fili, cartelli, lanterne, bandiere, ciuffi)
//  - nome  pulsa                             → si gonfia e sgonfia (luci, insegne, cuori)
//  - nome  respira                           → alza e abbassa il torace/il corpo di pochi millimetri (animali, statue vive)
//  - userData.vivo = { gira: [rx, ry, rz] (rad/s), ondeggia: { amp, freq, asse }, pulsa: { amp, freq }, muovi: [vx, vy, vz] (m/s), anello: ['z', min, max] }
//    `muovi` + `anello` = va avanti lungo l'asse e rientra dall'altra parte (auto, passanti, nuvole, treni, barche).
// FUNZIONI da chiamare dallo script del luogo: vapore(M, {x, y, z}), fumo, scintille ecc. si aggiungono qui, sempre come funzioni di t.
import * as THREE from 'three';

const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };   // numero 0..1 fisso per ogni n
const TAU = Math.PI * 2;

const gruppoDi = x => { for (let q = x; q; q = q.parent) if (q.userData && q.userData.vivo_modo) return q; return null; };
export function vivifica(M, o = {}) {   // o: { camera, attori: () => [posizioni dei personaggi], polvere }
  M.tick = M.tick || [];
  const luci = [], accesi = [], pezzi = [], mecc = [], stato = new Map(); let k = 0;
  M.root.traverse(x => {
    if (!M.vita && (x.isPointLight || x.isSpotLight)) luci.push({ l: x, i0: x.intensity, f: .25 + .35 * hash(++k), p: TAU * hash(k + 9) });
    if (x.isMesh) for (const m of [].concat(x.material || [])) {
      if (!M.vita && m && m.isMeshBasicMaterial && !m.map && m.color && Math.max(m.color.r, m.color.g, m.color.b) > 1.05 && !m.userData.fermo && !accesi.some(a => a.m === m)) {
        const n = ++k; accesi.push({ m, c0: m.color.clone(), f: .35 + .5 * hash(n), p: TAU * hash(n + 3), cala: hash(n + 5) < .17 ? .6 + 2 * hash(n + 8) : 0, ev: 5 + 5 * hash(n + 11) });
      }
    }
    if (x.userData && x.userData.vivo_tipo) { const g0 = gruppoDi(x); x.userData.vivo = x.userData.vivo || 'meccanismo'; if (g0) g0.userData.vivo = g0.userData.vivo || 'meccanismo'; }   // vita.js li salta e li conta come vivi
    if (x.userData && x.userData.vivo_tipo) mecc.push({ x, u: x.userData, p0: x.position.clone(), r0: x.rotation.clone(), ph: TAU * hash(++k), g: gruppoDi(x) });
    const nome = x.name || '', v = x.userData && x.userData.vivo || {};
    let e = null;
    if (v.gira || v.ondeggia || v.pulsa || v.muovi || v.respira) e = { ...v };
    else if (/^ventola/.test(nome)) e = { gira: [0, 0, 7] };
    else if (/^gira/.test(nome)) e = { gira: nome.endsWith('_x') ? [2, 0, 0] : nome.endsWith('_z') ? [0, 0, 2] : [0, 2, 0] };
    else if (/^ondeggia/.test(nome)) e = { ondeggia: { amp: .06, freq: .35 } };
    else if (/^pulsa/.test(nome)) e = { pulsa: { amp: .05, freq: .6 } };
    else if (/^respira/.test(nome)) e = { respira: true };
    if (e) pezzi.push({ x, e, p0: x.position.clone(), r0: x.rotation.clone(), s0: x.scale.clone(), ph: TAU * hash(++k) });
  });
  const V3 = new THREE.Vector3(), ss = x => x * x * (3 - 2 * x), cl = x => Math.min(1, Math.max(0, x));
  const evento = g => { for (let q = g; q; q = q.parent) if (q.userData && q.userData.apertura !== undefined) return q.userData.apertura; return undefined; };
  const apertura = (g, t) => { if (!g) return 1; let s = stato.get(g); if (!s) stato.set(g, s = { o: 0, tp: -1e9 }); if (s.t === t) return s.o; const u = g.userData, ev = evento(g);
    if (ev !== undefined) s.o = ev;
    else if (u.vivo_modo === 'sempre') s.o = 1;
    else if (u.vivo_modo === 'ciclo') { const P = u.vivo_periodo || 12, D = u.vivo_durata || 5, ph = (((t + (u.vivo_fase || 0)) % P) + P) % P; s.o = ph < .7 ? ss(ph / .7) : ph < D - .7 ? 1 : ph < D ? ss((D - ph) / .7) : 0; }
    else if (u.vivo_modo === 'prossimita') { g.getWorldPosition(V3); const r = u.vivo_raggio || 2, vicino = ((o.attori && o.attori()) || []).some(p => Math.hypot(p.x - V3.x, p.z - V3.z) < r), dt = t - s.tp;
      s.o = (dt < 0 || dt > .5) ? +vicino : s.o + ((vicino ? 1 : 0) - s.o) * Math.min(1, dt * 4); }
    s.tp = t; s.t = t; return s.o; };
  M.tick.push(t => {
    for (const q of mecc) { const u = q.u, ap = apertura(q.g, t), a = u.vivo_asse || 'y', x = q.x;
      if (u.vivo_tipo === 'scorri' || u.vivo_tipo === 'su') x.position[a] = q.p0[a] + (u.vivo_corsa || 0) * ap;
      else if (u.vivo_tipo === 'cerniera') x.rotation[a] = q.r0[a] + (u.vivo_angolo || 1.5) * ap;
      else if (u.vivo_tipo === 'gira') x.rotation[a] = q.r0[a] + (u.vivo_vel || 5) * t * (q.g && q.g.userData.vivo_modo !== 'sempre' ? ap : 1);
      else if (u.vivo_tipo === 'ondeggia') x.rotation[a] = q.r0[a] + (u.vivo_ampiezza || .5) * Math.sin(TAU * (u.vivo_freq || .2) * t + q.ph); }
    for (const a of luci) a.l.intensity = a.i0 * (1 + .05 * Math.sin(TAU * a.f * t + a.p));
    for (const a of accesi) {
      let f = 1 + .08 * Math.sin(TAU * a.f * t + a.p);
      if (a.cala) { const u = (t + a.p) % a.ev; if (u < .5) f *= 1 - .3 * Math.sin(Math.PI * u / .5) ** 2; }   // un calo lento ogni tanto, mai a scatti
      a.m.color.copy(a.c0).multiplyScalar(f);
    }
    for (const q of pezzi) { const { x, e } = q;
      if (e.gira) { x.rotation.set(q.r0.x + e.gira[0] * t, q.r0.y + e.gira[1] * t, q.r0.z + e.gira[2] * t); }
      if (e.ondeggia) { const a = e.ondeggia.amp ?? .06, f = e.ondeggia.freq ?? .35, s = Math.sin(TAU * f * t + q.ph); const asse = e.ondeggia.asse || 'z'; x.rotation[asse] = q.r0[asse] + a * s; x.rotation.x += asse === 'z' ? a * .4 * Math.sin(TAU * f * .7 * t + q.ph) : 0; }
      if (e.pulsa) { const s = 1 + (e.pulsa.amp ?? .05) * Math.sin(TAU * (e.pulsa.freq ?? .6) * t + q.ph); x.scale.copy(q.s0).multiplyScalar(s); }
      if (e.respira) x.position.y = q.p0.y + .006 * Math.sin(TAU * .3 * t + q.ph);
      if (e.muovi) { const [vx, vy, vz] = e.muovi; x.position.set(q.p0.x + vx * t, q.p0.y + vy * t, q.p0.z + vz * t);
        if (e.anello) { const [ax, mn, mx] = e.anello, L = mx - mn, c = q.p0[ax] + e.muovi[{ x: 0, y: 1, z: 2 }[ax]] * t; x.position[ax] = mn + (((c - mn) % L) + L) % L; } }
    }
  });
  if (o.camera) M._camera = o.camera;
  if (o.polvere !== false) polvere(M, o.camera, o.polvere || {});
  if (o.pioggia) pioggia(M, o.camera, typeof o.pioggia === 'object' ? o.pioggia : {});
  if (o.neve) neve(M, o.camera, typeof o.neve === 'object' ? o.neve : {});
  if (o.foglie) foglie(M, o.camera, typeof o.foglie === 'object' ? o.foglie : {});
}

// polvere nella luce: n puntini in una scatola attorno alla camera, che salgono e si muovono piano; fissi nel mondo (la camera passa e li lascia dietro)
export function polvere(M, camera, { n = 200, w = 7, h = 4, d = 12, colore = '#ffe6c0', dim = .05, op = .4 } = {}) {
  if (!camera) return;
  const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), base = [], vel = [];
  for (let i = 0; i < n; i++) { base.push([hash(i * 3 + 1) * w, hash(i * 3 + 2) * h, hash(i * 3 + 3) * d]); vel.push([(hash(i + 40) - .5) * .08, .03 + hash(i + 70) * .05, (hash(i + 90) - .5) * .08]); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const P = new THREE.Points(g, new THREE.PointsMaterial({ map: morbido(), color: colore, size: dim, sizeAttenuation: true, transparent: true, opacity: op, depthWrite: false, fog: false }));
  P.frustumCulled = false; M.root.add(P);
  M.tick.push(t => { const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z, w2 = (a, b, c) => ((a % b) + b) % b;
    for (let i = 0; i < n; i++) { const b = base[i], v = vel[i];
      pos[i * 3] = cx - w / 2 + w2(b[0] + v[0] * t - (cx - w / 2), w, 0);
      pos[i * 3 + 1] = Math.max(0, cy - h / 2) + w2(b[1] + v[1] * t, h, 0);
      pos[i * 3 + 2] = cz - d / 2 + w2(b[2] + v[2] * t - (cz - d / 2), d, 0); }
    g.attributes.position.needsUpdate = true; });
}

// vapore che sale da un punto (sfiato, tombino, pentola, bocca di un condizionatore): n sbuffi morbidi che salgono, si allargano e svaniscono
const morbido = (() => { let t = null; return () => t || (t = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx; })()); })();
export function vapore(M, { x = 0, y = 0, z = 0, n = 7, alt = 1.6, r = .14, colore = '#cfd6ff', vel = .35, op = .28, vento = .25, legato = null } = {}) {
  M.tick = M.tick || [];
  const grp = new THREE.Group();
  grp.userData = { noInk: true, noRick: true, noLight: true, struttura: true, particella: true, vivo: 'vapore' };
  const S = []; const mp = morbido();
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: mp, color: colore, transparent: true, depthWrite: false, opacity: 0, fog: false }));
    s.userData = { noInk: true, noRick: true, noLight: true, struttura: true, particella: true, vivo: 'vapore' };
    grp.add(s); S.push(s);
  }
  M.root.add(grp);
  M.tick.push(t => {
    const on = grp.visible && (!legato || legato.visible);
    S.forEach((s, i) => {
      s.visible = on; if (!on) return;
      const u = ((t * vel + i / n) % 1 + 1) % 1, e = Math.sin(Math.PI * Math.min(1, u * 1.25)) ** 1.5;
      s.position.set(x + vento * u * u + .05 * Math.sin(t * .9 + i * 2.1), y + u * alt, z + .04 * Math.cos(t * .7 + i)); s.scale.setScalar(r * (1 + 3.2 * u)); s.material.opacity = op * e * (1 - u * .6);
    });
  });
  return grp;
}

// =============================================================================
// MODULI FX PROCEDURALI CARTOON (puri f(t), 1 draw-call ciascuno, sicuri per tremolio.py)
// =============================================================================

const _fr = x => x - Math.floor(x);
const _h01 = n => _fr(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
const _cl = (v, a, b) => Math.max(a, Math.min(b, v));
const _ss = u => { const c = _cl(u, 0, 1); return c * c * (3 - 2 * c); };
const _lerp = (a, b, t) => a + (b - a) * t;

const _colMap = new Map();
function _col(hex) {
  const k = String(hex || '#ffffff');
  let c = _colMap.get(k);
  if (!c) { const tc = new THREE.Color(k); c = [tc.r, tc.g, tc.b]; _colMap.set(k, c); }
  return c;
}

const _texMap = new Map();
function _mkTex(nome, w, h, disegna) {
  if (_texMap.has(nome)) return _texMap.get(nome);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  disegna(c.getContext('2d'), w, h);
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.minFilter = THREE.LinearMipmapLinearFilter;
  tx.magFilter = THREE.LinearFilter;
  _texMap.set(nome, tx);
  return tx;
}

function _tex(nome) {
  if (_texMap.has(nome)) return _texMap.get(nome);
  if (nome === 'sbuffo') return _mkTex('sbuffo', 96, 96, g => {
    const blobs = [[48, 42, 27, 1], [32, 52, 22, .95], [64, 52, 22, .95], [48, 56, 23, .9]];
    for (const [cx, cy, r, a] of blobs) {
      const gr = g.createRadialGradient(cx, cy, r * .18, cx, cy, r);
      gr.addColorStop(0, `rgba(255,255,255,${a})`);
      gr.addColorStop(.72, `rgba(255,255,255,${a * .82})`);
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    }
  });
  if (nome === 'goccia') return _mkTex('goccia', 64, 128, g => {
    const gr = g.createLinearGradient(0, 8, 0, 120);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(.28, 'rgba(255,255,255,.92)');
    gr.addColorStop(.86, 'rgba(255,255,255,1)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.save();
    g.translate(32, 64);
    const rx = g.createRadialGradient(0, 0, 3, 0, 0, 17);
    rx.addColorStop(0, 'rgba(255,255,255,1)');
    rx.addColorStop(.62, 'rgba(255,255,255,.9)');
    rx.addColorStop(1, 'rgba(255,255,255,0)');
    g.scale(1, 3.6);
    g.fillStyle = rx; g.beginPath(); g.arc(0, 0, 17, 0, Math.PI * 2); g.fill();
    g.restore();
    g.globalCompositeOperation = 'destination-in';
    g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
  });
  if (nome === 'fiocco') return _mkTex('fiocco', 64, 64, g => {
    const gr = g.createRadialGradient(32, 32, 3, 32, 32, 24);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(.45, 'rgba(255,255,255,.85)');
    gr.addColorStop(.78, 'rgba(255,255,255,.18)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 4.5; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI / 3, dx = Math.cos(a) * 18, dy = Math.sin(a) * 18;
      g.beginPath(); g.moveTo(32 - dx, 32 - dy); g.lineTo(32 + dx, 32 + dy); g.stroke();
    }
  });
  if (nome === 'foglia') return _mkTex('foglia', 64, 64, g => {
    g.save(); g.translate(32, 32); g.rotate(-.4);
    g.shadowColor = 'rgba(255,255,255,.5)'; g.shadowBlur = 4;
    g.fillStyle = 'rgba(255,255,255,.95)';
    g.beginPath(); g.moveTo(-22, 0); g.quadraticCurveTo(0, -18, 22, 0); g.quadraticCurveTo(0, 18, -22, 0); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 2.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-24, 2); g.quadraticCurveTo(0, -1, 19, 0); g.stroke();
    g.restore();
  });
  if (nome === 'fiamma') return _mkTex('fiamma', 64, 96, g => {
    const halo = g.createRadialGradient(32, 62, 4, 32, 56, 30);
    halo.addColorStop(0, 'rgba(255,255,255,.9)');
    halo.addColorStop(.65, 'rgba(255,255,255,.32)');
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = halo; g.fillRect(0, 0, 64, 96);
    g.save();
    g.shadowColor = 'rgba(255,255,255,.75)'; g.shadowBlur = 6;
    g.fillStyle = 'rgba(255,255,255,.98)';
    g.beginPath();
    g.moveTo(32, 10);
    g.bezierCurveTo(48, 36, 54, 58, 48, 74);
    g.quadraticCurveTo(32, 90, 16, 74);
    g.bezierCurveTo(10, 58, 16, 36, 32, 10);
    g.closePath(); g.fill();
    g.restore();
  });
  if (nome === 'scintilla') return _mkTex('scintilla', 64, 64, g => {
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 28);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(.4, 'rgba(255,255,255,.75)');
    gr.addColorStop(.78, 'rgba(255,255,255,.18)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(255,255,255,.98)';
    g.beginPath(); g.moveTo(32, 10); g.quadraticCurveTo(36, 28, 48, 32); g.quadraticCurveTo(36, 36, 32, 54); g.quadraticCurveTo(28, 36, 16, 32); g.quadraticCurveTo(28, 28, 32, 10); g.closePath(); g.fill();
  });
  if (nome === 'onda') return _mkTex('onda', 64, 64, g => {
    const gr = g.createRadialGradient(32, 32, 14, 32, 32, 29);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(.52, 'rgba(255,255,255,.12)');
    gr.addColorStop(.74, 'rgba(255,255,255,.92)');
    gr.addColorStop(.92, 'rgba(255,255,255,.15)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  });
  return morbido();
}

const _vR = new THREE.Vector3(1, 0, 0), _vU = new THREE.Vector3(0, 1, 0), _vF = new THREE.Vector3(0, 0, -1), _vC = new THREE.Vector3(0, 1.5, 4);
const _vD = new THREE.Vector3(), _vS = new THREE.Vector3();
function _basiCam(camOrFn, M) {
  const c = typeof camOrFn === 'function' ? camOrFn() : (camOrFn || M?._camera || (typeof M?._getCamera === 'function' ? M._getCamera() : null));
  if (!c || !c.quaternion) { _vR.set(1, 0, 0); _vU.set(0, 1, 0); _vF.set(0, 0, -1); _vC.set(0, 1.5, 4); return false; }
  if (c.parent) c.updateMatrixWorld();
  _vR.set(1, 0, 0).applyQuaternion(c.quaternion);
  _vU.set(0, 1, 0).applyQuaternion(c.quaternion);
  _vF.set(0, 0, -1).applyQuaternion(c.quaternion);
  c.getWorldPosition(_vC);
  return true;
}

function _attivo(t, grp, o) {
  if (!grp.visible) return 0;
  if (o.legato && !o.legato.visible) return 0;
  const t0 = o.da ?? o.t0 ?? null;
  const t1 = o.a ?? (t0 != null && (o.dur ?? o.durata) != null ? t0 + (o.dur ?? o.durata) : null);
  const fade = Math.max(.04, o.dissolvi ?? .32);
  let e = 1;
  if (t0 != null) { if (t < t0) return 0; e *= _ss((t - t0) / fade); }
  if (t1 != null) { if (t > t1) return 0; e *= _ss((t1 - t) / fade); }
  return e;
}

function _creaBatch(M, { nome, n, map, fog = false, ordine = 2 }) {
  const N = Math.max(1, n | 0);
  const pos = new Float32Array(N * 12), uv = new Float32Array(N * 8), col = new Float32Array(N * 16);
  const idx = N * 4 > 65535 ? new Uint32Array(N * 6) : new Uint16Array(N * 6);
  for (let i = 0; i < N; i++) {
    const u0 = i * 8, v0 = i * 4, k0 = i * 6;
    uv[u0] = 0; uv[u0 + 1] = 0; uv[u0 + 2] = 1; uv[u0 + 3] = 0; uv[u0 + 4] = 1; uv[u0 + 5] = 1; uv[u0 + 6] = 0; uv[u0 + 7] = 1;
    idx[k0] = v0; idx[k0 + 1] = v0 + 1; idx[k0 + 2] = v0 + 2; idx[k0 + 3] = v0; idx[k0 + 4] = v0 + 2; idx[k0 + 5] = v0 + 3;
  }
  const geo = new THREE.BufferGeometry();
  const aPos = new THREE.BufferAttribute(pos, 3); aPos.setUsage(THREE.DynamicDrawUsage);
  const aCol = new THREE.BufferAttribute(col, 4); aCol.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', aPos);
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', aCol);
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const mat = new THREE.MeshBasicMaterial({ map, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false; mesh.renderOrder = ordine; mesh.raycast = () => {};
  mesh.userData = { noInk: true, noRick: true, noLight: true, struttura: true, particella: true, vivo: nome };
  const grp = new THREE.Group();
  grp.userData = { noInk: true, noRick: true, noLight: true, struttura: true, particella: true, vivo: nome };
  grp.add(mesh); M.root.add(grp);
  const quad = (i, px, py, pz, rx, ry, rz, ux, uy, uz, r, g, b, a) => {
    const p = i * 12, c = i * 16;
    pos[p]     = px - rx - ux; pos[p + 1]  = py - ry - uy; pos[p + 2]  = pz - rz - uz;
    pos[p + 3] = px + rx - ux; pos[p + 4]  = py + ry - uy; pos[p + 5]  = pz + rz - uz;
    pos[p + 6] = px + rx + ux; pos[p + 7]  = py + ry + uy; pos[p + 8]  = pz + rz + uz;
    pos[p + 9] = px - rx + ux; pos[p + 10] = py - ry + uy; pos[p + 11] = pz - rz + uz;
    for (let j = 0; j < 16; j += 4) { col[c + j] = r; col[c + j + 1] = g; col[c + j + 2] = b; col[c + j + 3] = a; }
  };
  const bill = (i, px, py, pz, hw, hh, ang, R, U, r, g, b, a) => {
    const ca = ang ? Math.cos(ang) : 1, sa = ang ? Math.sin(ang) : 0;
    const rx = (R.x * ca + U.x * sa) * hw, ry = (R.y * ca + U.y * sa) * hw, rz = (R.z * ca + U.z * sa) * hw;
    const ux = (U.x * ca - R.x * sa) * hh, uy = (U.y * ca - R.y * sa) * hh, uz = (U.z * ca - R.z * sa) * hh;
    quad(i, px, py, pz, rx, ry, rz, ux, uy, uz, r, g, b, a);
  };
  const nascondiDa = k => {
    for (let i = k; i < N; i++) {
      const p = i * 12, c = i * 16;
      for (let j = 0; j < 12; j++) pos[p + j] = 0;
      for (let j = 3; j < 16; j += 4) col[c + j] = 0;
    }
  };
  const chiudi = (usati = N) => {
    if (usati < N) nascondiDa(usati);
    aPos.needsUpdate = true; aCol.needsUpdate = true;
  };
  return { grp, mesh, quad, bill, nascondiDa, chiudi, N };
}

function _risolviCamOpt(camOrOpt, opt) {
  if (opt !== undefined) return [camOrOpt, opt || {}];
  if (camOrOpt && (camOrOpt.isCamera || typeof camOrOpt === 'function')) return [camOrOpt, {}];
  return [camOrOpt?.camera || null, camOrOpt || {}];
}

// 1. PIOGGIA: scie morbide diagonali attorno alla camera (o in una zona [x,y,z]) + piccole onde sulle pozzanghere
export function pioggia(M, camOrOpt, maybeOpt) {
  M.tick = M.tick || [];
  const [camArg, o] = _risolviCamOpt(camOrOpt, maybeOpt);
  const { n = 190, w = 7.5, h = 6, d = 9, lun = .46, lar = .04, vel = 7.4, vento = 1.05, ventoZ = .15, colore = '#dcebff', op = .56, pozzanghere = true, nPozz = 22, terra = 0 } = o;
  const col = _col(colore);
  const gocce = _creaBatch(M, { nome: 'pioggia', n, map: _tex('goccia'), fog: false, ordine: 3 });
  const onde = pozzanghere ? _creaBatch(M, { nome: 'pioggia_onde', n: nPozz, map: _tex('onda'), fog: false, ordine: 1 }) : null;
  if (onde) gocce.grp.add(onde.grp);
  const vLen = Math.hypot(vento, -vel, ventoZ) || 1;
  const vdx = vento / vLen, vdy = -vel / vLen, vdz = ventoZ / vLen;
  M.tick.push(t => {
    const env = _attivo(t, gocce.grp, o);
    gocce.mesh.visible = env > 0;
    if (onde) onde.mesh.visible = env > 0;
    if (env <= 0) return;
    _basiCam(camArg, M);
    const fisso = o.x !== undefined && o.z !== undefined;
    const ax = fisso ? o.x : _vC.x, ay = o.y !== undefined ? o.y : Math.max(terra + h * .45, _vC.y + .4), az = fisso ? o.z : _vC.z;
    for (let i = 0; i < n; i++) {
      const ix = _h01(i * 3.1 + 1), iy = _h01(i * 5.7 + 2), iz = _h01(i * 7.9 + 3), sp = .82 + .36 * _h01(i * 11.3);
      const fx = (((ix + (vento * sp * t - ax) / w) % 1) + 1) % 1;
      const fy = (((iy + (-vel * sp * t - ay) / h) % 1) + 1) % 1;
      const fz = (((iz + (ventoZ * sp * t - az) / d) % 1) + 1) % 1;
      const px = ax + (fx - .5) * w, py = ay + (fy - .5) * h, pz = az + (fz - .5) * d;
      if (py < terra + .06) { gocce.quad(i, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); continue; }
      const fadeY = Math.sin(Math.PI * fy) ** .55 * _ss((py - terra) / .65);
      _vD.set(px - _vC.x, py - _vC.y, pz - _vC.z);
      const dist = _vD.length() || 1; _vD.multiplyScalar(1 / dist);
      _vS.set(vdy * _vD.z - vdz * _vD.y, vdz * _vD.x - vdx * _vD.z, vdx * _vD.y - vdy * _vD.x);
      const sLen = _vS.length();
      if (sLen < 1e-4) _vS.copy(_vR); else _vS.multiplyScalar(1 / sLen);
      const hw = lar * (.85 + .3 * ix), hh = lun * .5 * sp * (.85 + .25 * iy);
      const distFade = _ss((dist - 1.45) / .95);
      gocce.quad(i, px, py, pz, _vS.x * hw, _vS.y * hw, _vS.z * hw, vdx * hh, vdy * hh, vdz * hh, col[0], col[1], col[2], op * env * fadeY * distFade);
    }
    gocce.chiudi(n);
    if (onde) {
      const gx = fisso ? o.x : _vC.x, gz = fisso ? o.z : _vC.z;
      for (let i = 0; i < nPozz; i++) {
        const ix = _h01(i * 13.7 + 4), iz = _h01(i * 17.3 + 9), per = .55 + .45 * _h01(i * 19.1);
        const step = Math.floor(t / per + ix);
        const u = ((t / per + ix) % 1 + 1) % 1;
        const jx = (_h01(step * 7.1 + i * 2.3) - .5) * w * .72, jz = (_h01(step * 11.7 + i * 3.9) - .5) * d * .72;
        const rad = (.05 + .17 * u) * (.8 + .4 * iz);
        const envO = Math.sin(Math.PI * u) * (1 - u * .45);
        const df = _ss((Math.hypot(jx, jz) - 1.1) / .8);
        onde.quad(i, gx + jx, terra + .018, gz + jz, rad, 0, 0, 0, 0, rad, col[0], col[1], col[2], op * .52 * env * envO * df);
      }
      onde.chiudi(nPozz);
    }
  });
  return gocce.grp;
}

// 2. NEVE: fiocchi cartoon morbidi con oscillazione laterale dolce
export function neve(M, camOrOpt, maybeOpt) {
  M.tick = M.tick || [];
  const [camArg, o] = _risolviCamOpt(camOrOpt, maybeOpt);
  const { n = 140, w = 7.5, h = 5.5, d = 9, dim = .082, vel = .95, vento = .32, colore = '#f6f9ff', op = .78, terra = 0 } = o;
  const col = _col(colore);
  const b = _creaBatch(M, { nome: 'neve', n, map: _tex('fiocco'), fog: false, ordine: 3 });
  M.tick.push(t => {
    const env = _attivo(t, b.grp, o); b.mesh.visible = env > 0; if (env <= 0) return;
    _basiCam(camArg, M);
    const fisso = o.x !== undefined && o.z !== undefined;
    const ax = fisso ? o.x : _vC.x, ay = o.y !== undefined ? o.y : Math.max(terra + h * .45, _vC.y + .35), az = fisso ? o.z : _vC.z;
    for (let i = 0; i < n; i++) {
      const ix = _h01(i * 3.7 + 1), iy = _h01(i * 6.1 + 2), iz = _h01(i * 9.3 + 3), sp = .72 + .56 * _h01(i * 12.9);
      const sx = .22 * Math.sin(t * 1.15 + ix * 19.3) + .11 * Math.cos(t * .7 + iz * 11.7);
      const sz = .18 * Math.cos(t * .95 + iz * 17.1);
      const fx = (((ix + (vento * t + sx - ax) / w) % 1) + 1) % 1;
      const fy = (((iy + (-vel * sp * t - ay) / h) % 1) + 1) % 1;
      const fz = (((iz + (sz - az) / d) % 1) + 1) % 1;
      const px = ax + (fx - .5) * w, py = ay + (fy - .5) * h, pz = az + (fz - .5) * d;
      if (py < terra + .05) { b.quad(i, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); continue; }
      const hr = dim * (.65 + .65 * _h01(i * 15.1)) * .5;
      const fadeY = Math.sin(Math.PI * fy) ** .65 * _ss((py - terra) / .5);
      const dist = Math.hypot(px - _vC.x, py - _vC.y, pz - _vC.z);
      b.bill(i, px, py, pz, hr, hr, t * (.4 + .5 * ix) + iy * 6.28, _vR, _vU, col[0], col[1], col[2], op * env * fadeY * _ss((dist - 1.35) / .9));
    }
    b.chiudi(n);
  });
  return b.grp;
}

// 3. FOGLIE / PETALI: foglie cartoon che planano roteando dolcemente nel vento
export function foglie(M, camOrOpt, maybeOpt) {
  M.tick = M.tick || [];
  const [camArg, o] = _risolviCamOpt(camOrOpt, maybeOpt);
  const { n = 56, w = 6.5, h = 4.2, d = 7.5, dim = .155, vel = .65, vento = .72, colore, colori = ['#e68a2e', '#d9532f', '#f0b840', '#7db84e'], op = .92, terra = 0 } = o;
  const pal = (colore ? [colore] : colori).map(_col);
  const b = _creaBatch(M, { nome: 'foglie', n, map: _tex('foglia'), fog: true, ordine: 2 });
  M.tick.push(t => {
    const env = _attivo(t, b.grp, o); b.mesh.visible = env > 0; if (env <= 0) return;
    _basiCam(camArg, M);
    const fisso = o.x !== undefined && o.z !== undefined;
    const ax = fisso ? o.x : _vC.x, ay = o.y !== undefined ? o.y : Math.max(terra + h * .45, _vC.y + .4), az = fisso ? o.z : _vC.z;
    for (let i = 0; i < n; i++) {
      const ix = _h01(i * 4.3 + 5), iy = _h01(i * 7.1 + 6), iz = _h01(i * 10.7 + 7), sp = .75 + .5 * _h01(i * 14.3);
      const fl = .34 * Math.sin(t * 1.45 + ix * 23), flz = .26 * Math.cos(t * 1.15 + iz * 17);
      const fx = (((ix + (vento * sp * t + fl - ax) / w) % 1) + 1) % 1;
      const fy = (((iy + (-vel * sp * t - ay) / h) % 1) + 1) % 1;
      const fz = (((iz + (vento * .25 * t + flz - az) / d) % 1) + 1) % 1;
      const px = ax + (fx - .5) * w, py = ay + (fy - .5) * h, pz = az + (fz - .5) * d;
      if (py < terra + .05) { b.quad(i, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); continue; }
      const c = pal[i % pal.length], hr = dim * (.7 + .55 * _h01(i * 18.1)) * .5;
      const yaw = t * (1.2 + ix * 1.3) + iy * 6.28, pitch = .6 * Math.sin(t * 1.8 + iz * 11), tilt = .55 * Math.cos(t * 1.3 + ix * 9);
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp2 = Math.sin(pitch);
      const rx = cy * hr, ry = sp2 * hr * .55, rz = sy * hr;
      const ux = (-sy * cp * .7 + Math.sin(tilt) * .35) * hr, uy = (cp * .85) * hr, uz = (cy * cp * .7) * hr;
      const fadeY = Math.sin(Math.PI * fy) ** .65 * _ss((py - terra) / .45);
      const dist = Math.hypot(px - _vC.x, py - _vC.y, pz - _vC.z);
      b.quad(i, px, py, pz, rx, ry, rz, ux, uy, uz, c[0], c[1], c[2], op * env * fadeY * _ss((dist - 1.3) / .9));
    }
    b.chiudi(n);
  });
  return b.grp;
}

// 4. FUMO: sbuffi cartoon densi e vaporosi che salgono, ruotano piano e si allargano
export function fumo(M, o = {}) {
  M.tick = M.tick || [];
  const { x = 0, y = 0, z = 0, n = 12, alt = 2.6, r = .24, espandi = 2.7, colore = '#7b8494', coloreFine = '#bfc7d6', vel = .28, vento = .42, ventoZ = .1, op = .5 } = o;
  const c0 = _col(colore), c1 = _col(coloreFine || colore);
  const b = _creaBatch(M, { nome: 'fumo', n, map: _tex('sbuffo'), fog: true, ordine: 2 });
  M.tick.push(t => {
    const env = _attivo(t, b.grp, o); b.mesh.visible = env > 0; if (env <= 0) return;
    _basiCam(o.camera, M);
    for (let i = 0; i < n; i++) {
      const ph = i / n + _h01(i * 3.7) * .04;
      const u = ((t * vel + ph) % 1 + 1) % 1;
      const s0 = _h01(i * 9.1), s1 = _h01(i * 14.7);
      const px = x + vento * (u ** 1.45) + (.07 + .12 * u) * Math.sin(t * 1.1 + i * 2.1 + s0 * 6);
      const py = y + u * alt;
      const pz = z + ventoZ * (u ** 1.4) + (.06 + .09 * u) * Math.cos(t * .9 + i * 1.7 + s1 * 6);
      const rad = r * (1 + espandi * (u ** .85)) * (.85 + .3 * s0);
      const cr = _lerp(c0[0], c1[0], u), cg = _lerp(c0[1], c1[1], u), cb = _lerp(c0[2], c1[2], u);
      const e = (Math.sin(Math.PI * Math.min(1, u * 1.18)) ** 1.15) * (1 - u * .52);
      const ang = (s0 - .5) * .9 * t + i * 1.1;
      b.bill(i, px, py, pz, rad, rad, ang, _vR, _vU, cr, cg, cb, op * env * e);
    }
    b.chiudi(n);
  });
  return b.grp;
}

// 5. FUOCO: lingue di fiamma cartoon a strati + braci lente + PointLight morbida (sicura contro SALTO_DI_LUCE)
export function fuoco(M, o = {}) {
  M.tick = M.tick || [];
  const { x = 0, y = 0, z = 0, n = 14, alt = .92, r = .24, vel = .95, vento = .08, coloreEsterno = '#ff541a', coloreBase = '#ff8a24', coloreInterno = '#ffe56b', op = .88, braci = 8, luce = true, coloreLuce = '#ff8e3c', intensita = 1.1, distanza = 4.8 } = o;
  const cOut = _col(coloreEsterno), cMid = _col(coloreBase), cIn = _col(coloreInterno);
  const nIn = Math.max(3, Math.ceil(n * .45));
  const bOut = _creaBatch(M, { nome: 'fuoco_est', n, map: _tex('fiamma'), fog: false, ordine: 3 });
  const bIn = _creaBatch(M, { nome: 'fuoco_int', n: nIn, map: _tex('fiamma'), fog: false, ordine: 4 });
  const bBr = braci > 0 ? _creaBatch(M, { nome: 'fuoco_braci', n: braci, map: _tex('scintilla'), fog: false, ordine: 4 }) : null;
  bOut.grp.add(bIn.grp);
  if (bBr) bOut.grp.add(bBr.grp);
  let ptLight = null;
  if (luce && typeof M.luce === 'function') ptLight = M.luce(x, y + alt * .45, z, coloreLuce, intensita, distanza);
  else if (luce) { ptLight = new THREE.PointLight(coloreLuce, intensita, distanza, 1.5); ptLight.position.set(x, y + alt * .45, z); bOut.grp.add(ptLight); }

  M.tick.push(t => {
    const env = _attivo(t, bOut.grp, o);
    bOut.mesh.visible = env > 0; bIn.mesh.visible = env > 0; if (bBr) bBr.mesh.visible = env > 0;
    if (ptLight) ptLight.intensity = env > 0 ? intensita * env * (1 + .065 * Math.sin(t * 2.4) + .035 * Math.sin(t * 3.9)) : 0;
    if (env <= 0) return;
    _basiCam(o.camera, M);
    for (let i = 0; i < n; i++) {
      const u = ((t * vel + i / n + _h01(i * 4.1) * .12) % 1 + 1) % 1;
      const sx = (_h01(i * 7.3) - .5) * r * 1.15, sz = (_h01(i * 11.9) - .5) * r * 1.15;
      const osc = .07 * Math.sin(t * 3.2 + i * 1.9) * (u + .25);
      const px = x + sx * (1 - u * .45) + vento * u + osc;
      const py = y + u * alt * .65 + r * .45;
      const pz = z + sz * (1 - u * .45);
      const hw = r * (.66 + .32 * Math.sin(Math.PI * u)) * (1 - u * .56);
      const hh = alt * (.42 + .32 * _h01(i * 5.3)) * (1 - u * .3);
      const cr = _lerp(cMid[0], cOut[0], u), cg = _lerp(cMid[1], cOut[1], u), cb = _lerp(cMid[2], cOut[2], u);
      const e = Math.sin(Math.PI * u) ** .75;
      bOut.bill(i, px, py, pz, hw, hh, .14 * Math.sin(t * 2.8 + i * 1.7), _vR, _vU, cr, cg, cb, op * env * e);
    }
    bOut.chiudi(n);
    for (let i = 0; i < nIn; i++) {
      const u = ((t * (vel * 1.15) + i / nIn + .17) % 1 + 1) % 1;
      const sx = (_h01(i * 13.1) - .5) * r * .55, sz = (_h01(i * 17.7) - .5) * r * .55;
      const px = x + sx - _vF.x * .03 + .04 * Math.sin(t * 3.6 + i * 2.3);
      const py = y + u * alt * .4 + r * .3;
      const pz = z + sz - _vF.z * .03;
      const hw = r * .44 * (1 - u * .55), hh = alt * .3 * (1 - u * .4);
      const e = Math.sin(Math.PI * u) ** .8;
      bIn.bill(i, px, py, pz, hw, hh, .1 * Math.cos(t * 3.1 + i), _vR, _vU, cIn[0], cIn[1], cIn[2], Math.min(1, op * 1.05) * env * e);
    }
    bIn.chiudi(nIn);
    if (bBr) {
      for (let i = 0; i < braci; i++) {
        const s0 = _h01(i * 21.3), s1 = _h01(i * 29.7);
        const u = ((t * (vel * .55) + s0) % 1 + 1) % 1;
        const px = x + (s0 - .5) * r * 1.6 + vento * u * 1.8 + .1 * Math.sin(t * 2.4 + i * 3.1);
        const py = y + alt * .35 + u * alt * 1.15;
        const pz = z + (s1 - .5) * r * 1.6 + .08 * Math.cos(t * 2.1 + i * 2.7);
        const dim = .052 * (1 - u * .45);
        const cr = _lerp(cIn[0], cOut[0], u), cg = _lerp(cIn[1], cOut[1], u), cb = _lerp(cIn[2], cOut[2], u);
        bBr.bill(i, px, py, pz, dim, dim, u * 2.5, _vR, _vU, cr, cg, cb, env * Math.sin(Math.PI * u));
      }
      bBr.chiudi(braci);
    }
  });
  return bOut.grp;
}

// 6. SCINTILLE: archi balistici luminosi allineati alla traiettoria (nessun flash strobo a 42 rad/s)
export function scintille(M, o = {}) {
  M.tick = M.tick || [];
  const { x = 0, y = 0, z = 0, n = 18, raggio = .95, alt = .8, gravita = 2.6, vel = .95, colore = '#ffe078', coloreFine = '#ff6d1f', dim = .08, op = .92, luce = false, coloreLuce = '#ffcf70', intensita = .85, distanza = 3.5 } = o;
  const c0 = _col(colore), c1 = _col(coloreFine);
  const b = _creaBatch(M, { nome: 'scintille', n, map: _tex('scintilla'), fog: false, ordine: 4 });
  let ptLight = null;
  if (luce && typeof M.luce === 'function') ptLight = M.luce(x, y + .15, z, coloreLuce, intensita, distanza);
  else if (luce) { ptLight = new THREE.PointLight(coloreLuce, intensita, distanza, 1.5); ptLight.position.set(x, y + .15, z); b.grp.add(ptLight); }

  M.tick.push(t => {
    const env = _attivo(t, b.grp, o); b.mesh.visible = env > 0;
    if (ptLight) ptLight.intensity = env > 0 ? intensita * env * (1 + .05 * Math.sin(t * 2.6)) : 0;
    if (env <= 0) return;
    _basiCam(o.camera, M);
    const invVel = vel > 0 ? 1 / vel : 1;
    for (let i = 0; i < n; i++) {
      const s0 = _h01(i * 7.7 + 1), s1 = _h01(i * 11.3 + 2), s2 = _h01(i * 17.9 + 3);
      const raw = t * vel + s0;
      const ciclo = Math.floor(raw), u = raw - ciclo;
      const a = _h01(ciclo * 13.7 + i * 5.3) * Math.PI * 2;
      const sp = .55 + .7 * _h01(ciclo * 19.1 + i * 2.9);
      const vx = Math.cos(a) * raggio * sp * vel, vz = Math.sin(a) * raggio * sp * vel;
      const vy0 = (alt + .45 * s1) * vel + .5 * gravita * invVel;
      const dt = u * invVel;
      const px = x + vx * dt, py = y + vy0 * dt - .5 * gravita * dt * dt, pz = z + vz * dt;
      if (py < (o.terra ?? 0) + .02) { b.quad(i, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); continue; }
      const vy = vy0 - gravita * dt;
      const vLen = Math.hypot(vx, vy, vz) || 1;
      const vdx = vx / vLen, vdy = vy / vLen, vdz = vz / vLen;
      _vD.set(px - _vC.x, py - _vC.y, pz - _vC.z).normalize();
      _vS.set(vdy * _vD.z - vdz * _vD.y, vdz * _vD.x - vdx * _vD.z, vdx * _vD.y - vdy * _vD.x);
      const sl = _vS.length(); if (sl < 1e-4) _vS.copy(_vR); else _vS.multiplyScalar(1 / sl);
      const hw = dim * .5 * (.75 + .45 * s2) * (1 - u * .45), hh = hw * (1.35 + Math.min(1.6, vLen * .25));
      const cr = _lerp(c0[0], c1[0], u), cg = _lerp(c0[1], c1[1], u), cb = _lerp(c0[2], c1[2], u);
      const e = Math.sin(Math.PI * u) ** .65;
      b.quad(i, px, py, pz, _vS.x * hw, _vS.y * hw, _vS.z * hw, vdx * hh, vdy * hh, vdz * hh, cr, cg, cb, op * env * e);
    }
    b.chiudi(n);
  });
  return b.grp;
}

// 7. POLVERE AI PIEDI: sbuffi cartoon sotto le scarpe dei personaggi quando camminano, corrono o frenano (puro f(t))
export function polverePiedi(M, getAttori, o = {}) {
  M.tick = M.tick || [];
  const { max = 48, r = .13, alt = .19, colore = '#efe7d8', op = .42, opCorsa = .58 } = o;
  const col = _col(colore);
  const b = _creaBatch(M, { nome: 'polvere_piedi', n: max, map: _tex('sbuffo'), fog: true, ordine: 2 });
  M.tick.push(t => {
    const att = typeof getAttori === 'function' ? getAttori(t) : (getAttori || []);
    const env = _attivo(t, b.grp, o);
    if (env <= 0 || !att.length) { b.mesh.visible = false; return; }
    _basiCam(o.camera, M);
    let k = 0;
    const emetti = (px, py, pz, rad, ang, a) => {
      if (k >= max || a <= .005) return;
      b.bill(k++, px, py, pz, rad, rad * .88, ang, _vR, _vU, col[0], col[1], col[2], a);
    };
    for (let ai = 0; ai < att.length && k < max; ai++) {
      const a = att[ai];
      if (!a || a.visibile === false) continue;
      const sc = a.scala || 1, rotY = a.rotY || 0;
      const fx = Math.sin(rotY), fz = Math.cos(rotY), sx = Math.cos(rotY), sz = -Math.sin(rotY);
      if (a.cammina && a.passo !== undefined) {
        const corsa = a.andatura === 'corsa' || a.andatura === 'fretta' || a.andatura === 'fuga';
        const opBase = (corsa ? opCorsa : op) * env;
        const rBase = r * sc * (corsa ? 1.25 : 1);
        for (let piede = 0; piede < 2; piede++) {
          const offsetP = piede === 0 ? .02 : .52;
          const u = ((a.passo - offsetP) % 1 + 1) % 1;
          if (u >= .54) continue;
          const life = u / .54;
          const side = (piede === 0 ? -.11 : .11) * sc;
          const trail = -(.06 + life * (corsa ? .48 : .28)) * sc;
          const px = a.x + sx * side + fx * trail, py = (a.y || 0) + (.05 + life * alt) * sc, pz = a.z + sz * side + fz * trail;
          const e = Math.sin(Math.PI * life) * (1 - life * .22);
          const rad = rBase * (.58 + .85 * life);
          emetti(px, py, pz, rad, (piede ? .5 : -.5) * life + ai, opBase * e);
          if (life > .12) emetti(px - fx * .11 * sc, py + .035 * sc, pz - fz * .11 * sc, rad * .72, -life, opBase * (corsa ? .62 : .42) * e);
        }
      }
      if (a.frena > 0 && a.frena < 1) {
        const life = a.frena, e = Math.sin(Math.PI * life) * (1 - life * .28);
        for (let side = -1; side <= 1; side += 2) {
          const lat = side * (.14 + .24 * life) * sc;
          emetti(a.x + sx * lat, (a.y || 0) + (.055 + life * alt * .92) * sc, a.z + sz * lat, r * sc * (.7 + .95 * life), side * life, opCorsa * env * e);
        }
      }
    }
    b.mesh.visible = k > 0;
    if (k > 0) b.chiudi(k);
  });
  return b.grp;
}

// Registra i costruttori FX su M per poterli usare direttamente in LG.oggetti ({ tipo: "fuoco" | "fumo" | "scintille" | "pioggia" | "neve" | "foglie" | "vapore", ... })
export function registraSuMondo(M, getCamera) {
  if (!M) return;
  M._getCamera = typeof getCamera === 'function' ? getCamera : () => getCamera || M._camera;
  if (!M.vapore) M.vapore = o => vapore(M, o);
  if (!M.pioggia) M.pioggia = o => pioggia(M, M._getCamera, o);
  if (!M.neve) M.neve = o => neve(M, M._getCamera, o);
  if (!M.foglie) M.foglie = o => foglie(M, M._getCamera, o);
  if (!M.fumo) M.fumo = o => fumo(M, o);
  if (!M.fuoco) M.fuoco = o => fuoco(M, o);
  if (!M.scintille) M.scintille = o => scintille(M, o);
}
