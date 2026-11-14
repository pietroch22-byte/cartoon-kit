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
  if (o.polvere !== false) polvere(M, o.camera, o.polvere || {});
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
  M.tick = M.tick || []; const S = []; const mp = morbido();
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: mp, color: colore, transparent: true, depthWrite: false, opacity: 0, fog: false })); M.root.add(s); S.push(s); }
  M.tick.push(t => {
    const on = !legato || legato.visible;
    S.forEach((s, i) => {
      s.visible = on; if (!on) return;
      const u = ((t * vel + i / n) % 1 + 1) % 1, e = Math.sin(Math.PI * Math.min(1, u * 1.25)) ** 1.5;
      s.position.set(x + vento * u * u + .05 * Math.sin(t * .9 + i * 2.1), y + u * alt, z + .04 * Math.cos(t * .7 + i)); s.scale.setScalar(r * (1 + 3.2 * u)); s.material.opacity = op * e * (1 - u * .6);
    });
  });
}
