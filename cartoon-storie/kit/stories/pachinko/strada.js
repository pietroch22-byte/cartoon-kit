// Strada di città di notte con la sala pachinko a destra: insegna verticale modellata in Blender (lampadine, freccia).
import { vestiti, modello } from '/scena/oggetti.js';
export async function costruisci(M, D, S, OBJ) {
  const V = vestiti(M);
  await modello(M, V, 'insegna_pachinko', { x: 6.75, y: 5.4, z: -1.5, ry: Math.PI });
  for (const z of [-22, -40, -58]) await modello(M, V, 'insegna_pachinko', { x: 6.75, y: 5.4, z, ry: Math.PI, mats: { pannello_pachinko: z % 4 ? V.pannello_pachinko : V.pannello_newmachines } });
  for (const z of [-30, -50]) await modello(M, V, 'insegna_pachinko', { x: -2.35, y: 5.0, z, ry: 0, s: .8 });
  M.luce('#ff4fb0', 14, 5.6, 3.2, -1.5, 9); M.luce('#ffcf7a', 8, 5.8, 1.0, -1.5, 5);
  // ---- città ricca vista dall'alto: tetti pieni, seconde e terze file di palazzi con finestre accese, insegne, auto con i fari
  const T = M.THREE; let sd = 11; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const mat = (c, e = .25, r = .8) => { const x = M.std(c, r); x.emissive.set(c); x.emissiveIntensity = e; return x; };
  const muri = [['#3c4680', '#ffd27a'], ['#46427e', '#ffe6b0'], ['#35487a', '#9fd8ff'], ['#4a4a86', '#ffb860']].map(([b, w]) => { const t = M.tex(256, 512, (g, W, H) => { g.fillStyle = b; g.fillRect(0, 0, W, H);
    for (let r = 0; r < 12; r++) { g.fillStyle = 'rgba(20,16,40,.35)'; g.fillRect(0, r * 42 + 36, W, 5); for (let c = 0; c < 6; c++) { const on = R() < .42; g.fillStyle = on ? w : '#1c2450'; g.fillRect(12 + c * 41, r * 42 + 8, 28, 24); if (on && R() < .5) { g.fillStyle = 'rgba(60,30,20,.45)'; g.fillRect(12 + c * 41, r * 42 + 8, 28, 9); } g.strokeStyle = '#231b33'; g.lineWidth = 3; g.strokeRect(12 + c * 41, r * 42 + 8, 28, 24); } } });
    t.wrapS = t.wrapT = T.RepeatWrapping; return t; });
  const tettoM = [mat('#2c3160', .2), mat('#343a6c', .2), mat('#3a3566', .2)], grigio = mat('#8f93b0', .25, .5), scuro = mat('#1f2244', .15), acqua = mat('#6a7aa8', .25, .4);
  const neonC = ['#ff3aa8', '#30d8ff', '#ffb040', '#7cff6a', '#ff5a3a', '#b46aff'];
  const tetto = (x, y, z, w, d) => {   // oggetti sul tetto: parapetto, condizionatori, cisterna, casotto scale, antenna, a volte un cartellone acceso
    M.box(w, .12, d, tettoM[Math.floor(R() * 3)], x, y + .06, z); for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) M.box(sx ? .14 : w, .5, sx ? d : .14, scuro, x + sx * (w / 2 - .07), y + .25, z + sz * (d / 2 - .07));
    const n = 2 + Math.floor(R() * 4); for (let i = 0; i < n; i++) { const px = x + (R() - .5) * (w - 1.6), pz = z + (R() - .5) * (d - 1.6), k = R();
      if (k < .45) { M.box(.9, .55, .6, grigio, px, y + .4, pz); const v = new T.Mesh(new T.CylinderGeometry(.2, .2, .04, 10), scuro); v.position.set(px, y + .7, pz); M.root.add(v); }
      else if (k < .7) { const c = new T.Mesh(new T.CylinderGeometry(.55, .55, 1.1, 12), acqua); c.position.set(px, y + 1.0, pz); M.root.add(c); for (const a of [-.35, .35]) M.box(.06, .5, .06, scuro, px + a, y + .25, pz + a); }
      else if (k < .88) { M.box(1.4, 1.5, 1.2, mat('#4a5088', .25), px, y + .75, pz); M.box(.5, .9, .05, M.emi('#ffd890', 1.2), px, y + .6, pz + .62); }
      else { M.box(.05, 2.4, .05, scuro, px, y + 1.2, pz); M.box(.8, .04, .04, scuro, px, y + 2.0, pz); M.box(.08, .08, .08, M.emi('#ff3030', 2.5), px, y + 2.45, pz); } }
    if (R() < .4) { const c = neonC[Math.floor(R() * 6)], bw = Math.min(w - .6, 2.5 + R() * 2); M.box(bw, 1.3, .12, M.emi(c, 1.5), x, y + 1.6, z + d / 2 - .3); M.box(bw + .2, 1.5, .08, scuro, x, y + 1.6, z + d / 2 - .38); for (const a of [-1, 1]) M.box(.07, 1, .07, scuro, x + a * bw * .4, y + .5, z + d / 2 - .36); } };
  // tetti sui palazzi che il motore ha già messo (scatole alte lungo la via)
  const esist = []; M.root.traverse(o => { const q = o.isMesh && o.geometry && o.geometry.parameters; if (q && q.height >= 7 && q.width >= 3 && q.depth >= 3 && Math.abs(o.rotation.y) < .01) esist.push([o.position.x, q.height / 2 + o.position.y, o.position.z, q.width, q.depth]); });
  for (const [x, y, z, w, d] of esist) tetto(x, y, z, w, d);
  // seconde e terze file ai due lati + fondo
  const palazzo = (x, z, w, d, h) => { const i = Math.floor(R() * 4), tx = muri[i].clone(); tx.needsUpdate = true; tx.repeat.set(Math.max(1, Math.round(w / 6)), h / 18); const m = M.dipinto(tx, .75, .9);
    const b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, h / 2, z); M.root.add(b); tetto(x, h, z, w, d);
    if (R() < .5) { const c = neonC[Math.floor(R() * 6)]; M.box(.25, 2.5 + R() * 3, .7, M.emi(c, 1.7), x + (x > 0 ? -1 : 1) * (w / 2 + .15), h * .55, z + (R() - .5) * d * .6); } };
  for (const lato of [1, -1]) for (let fila = 0; fila < 3; fila++) { const x0 = lato > 0 ? 13.6 + fila * 9.5 : -9.2 - fila * 9.5; for (let z = 10; z > -95;) { const d = 5 + R() * 5, w = 6.5 + R() * 2, h = 7 + R() * (10 + fila * 6); palazzo(x0 + lato * w / 2, z - d / 2, w, d, h); z -= d + (R() < .25 ? 2.5 : .4); } }
  // insegne verticali fitte sulle due facciate lungo la via
  for (let z = -8; z > -80; z -= 3.2 + R() * 2.4) for (const lato of [1, -1]) { if (lato > 0 && z > -15) continue; const c = neonC[Math.floor(R() * 6)], h = 1.6 + R() * 3, y = 3 + R() * 6, x = lato > 0 ? 6.55 : -2.15;
    M.box(.5, h, .14, M.emi(c, 1.6), x, y, z); M.box(.6, h + .15, .08, scuro, x, y, z + .06); M.box(.5, .06, .06, scuro, x + lato * .3, y + h * .3, z); }
  // auto e taxi con fari e stop lungo la via, moto parcheggiate
  const carC = ['#d8dbe6', '#e8c23a', '#2a2e48', '#c23a3a', '#3a7ac0', '#f2f0e6'];
  const auto = (x, z, dir, c) => { const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = dir > 0 ? 0 : Math.PI; M.root.add(g); const B = (w, h, d, m, px, py, pz) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(px, py, pz); o.castShadow = true; g.add(o); return o; };
    B(1.7, .55, 4.0, mat(c, .22, .35), 0, .55, 0); B(1.5, .5, 2.0, mat('#1a2244', .2, .2), 0, 1.05, .1); B(1.52, .06, 2.02, mat(c, .22, .35), 0, 1.32, .1);
    for (const sx of [-.6, .6]) { B(.3, .16, .06, M.emi('#fff3c0', 2.6), sx, .6, -2.01); B(.3, .14, .06, M.emi('#ff2a2a', 2.2), sx, .62, 2.01); for (const sz of [-1.25, 1.25]) { const w = new T.Mesh(new T.CylinderGeometry(.3, .3, .2, 12), scuro); w.rotation.z = Math.PI / 2; w.position.set(sx * 1.4, .3, sz); g.add(w); } }
    if (c === '#e8c23a') B(.5, .16, .25, M.emi('#fff0a0', 2), 0, 1.44, .1); };
  let ci = 0; for (const [x, dir] of [[.9, 1], [3.6, -1]]) for (let z = -12 - (dir > 0 ? 0 : 5); z > -85; z -= 8 + R() * 7) { if (Math.abs(z + 24) < 4 && x < 2) continue; auto(x + (R() - .5) * .3, z, dir, carC[ci++ % 6]); }
  for (const z of [-9.5, -11, -17.5, -19]) { M.box(.2, .7, 1.5, mat(carC[(ci++) % 6], .25, .4), 5.9, .55, z); M.box(.12, .12, .1, M.emi('#ff3030', 1.8), 5.9, .8, z + .78); }

  // Auto in movimento lungo la via con fari vivi (visibili dal volo sulla citta)
  const autoMobili = [];
  for (let k = 0; k < 6; k++) {
    const dir = k % 2 === 0 ? 1 : -1;
    const x = dir > 0 ? 1.0 : 3.5;
    const g = new T.Group();
    g.rotation.y = dir > 0 ? 0 : Math.PI;
    M.root.add(g);
    const col = carC[k % carC.length];
    const b1 = new T.Mesh(new T.BoxGeometry(1.7, .55, 3.8), mat(col, .25, .35)); b1.position.y = .55; g.add(b1);
    const b2 = new T.Mesh(new T.BoxGeometry(1.5, .5, 2.0), mat('#1a2244', .2, .2)); b2.position.set(0, 1.05, .1); g.add(b2);
    for (const sx of [-.6, .6]) {
      const f1 = new T.Mesh(new T.BoxGeometry(.3, .16, .06), M.emi('#fff6c0', 3.2)); f1.position.set(sx, .6, -1.92); g.add(f1);
      const f2 = new T.Mesh(new T.BoxGeometry(.3, .14, .06), M.emi('#ff2a2a', 2.5)); f2.position.set(sx, .62, 1.92); g.add(f2);
    }
    autoMobili.push({ g, x, z0: -10 - k * 14, dir, vel: 8 + k * 1.5 });
  }

  // Luci di segnalazione aeree rosse lampeggianti sui tetti alti
  const torri = [];
  for (const [x, y, z] of [[15, 26, -30], [-18, 28, -45], [22, 32, -60], [-20, 24, -20]]) {
    const b = new T.Mesh(new T.SphereGeometry(.25, 8, 8), M.emi('#ff2020', 3.0));
    b.position.set(x, y, z);
    M.root.add(b);
    torri.push(b);
  }

  M.tick = M.tick || [];
  M.tick.push(t => {
    for (const c of autoMobili) {
      const span = 85;
      const prog = ((c.z0 - c.dir * c.vel * t) % span + span) % span - 80;
      c.g.position.set(c.x, 0, prog);
    }
    const blink = Math.sin(t * 6) > 0 ? 3.0 : 0.3;
    for (const tr of torri) tr.material.emissiveIntensity = blink;
  });
}
