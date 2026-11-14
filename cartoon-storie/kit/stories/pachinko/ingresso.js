// Ingresso della PRIZE HALL dalla strada: facciata viola, porte a vetri con la sala calda dentro, distributore blu. Facciata nel piano z = -4, ingresso centrato in x = 0.
import { vestiti, modello } from '/scena/oggetti.js';
import { vivo } from '/web/vivi.js';
export async function costruisci(M, D, S, OBJ) {
  const T = M.THREE, V = vestiti(M), mat = (c, e = .22, r = .7) => { const x = M.std(c, r); x.emissive.set(c); x.emissiveIntensity = e; return x; };
  M.box(14, 10, .4, 0, 5, -4.25, mat('#4a3a7a', .24));
  M.pannello({ w: 14, h: 6, x: 0, y: 7, z: -4.04, px: 1024, emissiva: .28, dipingi: (g, W, H) => { const q = g.createLinearGradient(0, 0, 0, H); q.addColorStop(0, '#3a3270'); q.addColorStop(1, '#5a3e86'); g.fillStyle = q; g.fillRect(0, 0, W, H);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) { const x = 40 + c * 98, y = 60 + r * 150; g.fillStyle = (r + c) % 3 ? '#2a3466' : '#e8b27a'; g.fillRect(x, y, 60, 90); g.strokeStyle = '#3a2a2e'; g.lineWidth = 5; g.strokeRect(x, y, 60, 90); } } });
  const fac = await modello(M, V, 'ingresso_prize_hall', { x: 0, z: -4.05, ry: -Math.PI / 2 });
  fac.traverse(o => { if (o.isMesh && (o.material === V.vetro || o.material === V.cromo)) o.visible = false; });   // porte finte del modello: al loro posto la porta scorrevole vera
  OBJ.porta = await vivo(M, 'porta_scorrevole', { x: 0, z: -3.93, s: .92, id: 'porta' });
  // dentro: la sala calda vista attraverso le porte (macchine e corridoio)
  M.box(3.5, 2.5, .1, 0, 1.25, -5.6, mat('#d8a868', .18));
  M.box(3.6, .03, 1.9, 0, .015, -4.75, mat('#9a2a2a', .25)); M.box(3.6, .08, 1.9, 0, 2.5, -4.75, mat('#e8c890', .3)); for (const s of [-1, 1]) M.box(.08, 2.5, 1.9, s * 1.8, 1.25, -4.75, mat('#d8a868', .2));
  const mac = M.tex(512, 256, (g, W, H) => { g.fillStyle = '#f0d6a0'; g.fillRect(0, 0, W, H); for (let i = 0; i < 9; i++) { g.fillStyle = '#1a1420'; g.fillRect(i * 58, 70, 44, 150); g.fillStyle = ['#2a6ad0', '#ff4fa0', '#ffd23f'][i % 3]; g.fillRect(i * 58 + 6, 80, 32, 50); } g.fillStyle = '#9a1a22'; g.fillRect(0, 220, W, 36); });
  for (const s of [-1, 1]) { const p = new T.Mesh(new T.PlaneGeometry(1.6, 2.4), M.dipinto(mac, .4)); p.position.set(s * 1.7, 1.2, -4.9); p.rotation.y = -s * Math.PI / 2; M.root.add(p); }
  M.luce('#ffd9a0', 2.5, 0, 2.0, -4.8, 4); M.luce('#ffcf7a', 2.5, 0, 1.4, -2.8, 4);
  // distributore blu e cestino a destra, lanterna rossa a sinistra
  const vend = new T.Group(); vend.position.set(3.4, 0, -3.55); M.root.add(vend);
  { const b = new T.Mesh(new T.BoxGeometry(.85, 1.85, .7), mat('#1d46c8', .32, .3)); b.position.y = .925; vend.add(b);
    const f = new T.Mesh(new T.PlaneGeometry(.66, 1.15), M.dipinto(M.tex(256, 420, (g, W, H) => { g.fillStyle = '#10204a'; g.fillRect(0, 0, W, H); const cs = ['#e8393d', '#2a9de8', '#ffc533', '#37c27a', '#f2f0e6']; for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) { g.fillStyle = cs[(r + c) % 5]; g.fillRect(14 + c * 58, 20 + r * 78, 38, 58); g.strokeStyle = '#3a2a2e'; g.lineWidth = 3; g.strokeRect(14 + c * 58, 20 + r * 78, 38, 58); } }), 1.0)); f.position.set(0, 1.18, .36); vend.add(f); }
  M.luce('#7fb6ff', 5, 3.4, 1.4, -2.6, 4);
  const lan = new T.Mesh(new T.SphereGeometry(.32, 16, 12), M.emi('#ff3a2a', 1.6)); lan.scale.y = 1.35; lan.position.set(-3.0, 2.6, -3.6); M.root.add(lan); M.luce('#ff4a3a', 6, -3, 2.4, -3.2, 5);
  M.boxLuce(.12, 3.2, .5, '#ff4fb0', 2.6, -2.35, 2.8, -3.85, 4); M.luce('#ff4fb0', 6, -2.2, 2.4, -3.0, 6);
  // torre di scatole portata fuori dall'omino (si muove sulle parole)
  OBJ.torre = await modello(M, V, 'torre_scatole', { x: .55, y: .55, z: -4.6 });
}
