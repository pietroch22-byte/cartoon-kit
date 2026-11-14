// Vicolo di notte con la finestrella senza insegna (gancio iniziale). Vicolo largo 4 m: x -2..2, z 6..-6; finestrella nel muro di fondo a z = -5.6.
import { vestiti, modello } from '/scena/oggetti.js';
import { vivo } from '/web/vivi.js';
export async function costruisci(M, D, S, OBJ) {
  const T = M.THREE, V = vestiti(M), mat = (c, e = .22, r = .8) => { const x = M.std(c, r); x.emissive.set(c); x.emissiveIntensity = e; return x; };
  for (const lato of [-1, 1]) M.facciata({ lato, z0: 6, z1: -6.2, h: 9, base: lato > 0 ? ['#4a4f86', '#5a5c92'] : ['#3d4478', '#4a4f86'], terra: '#323866', accesa: ['#e8b27a', '#a8764e'], emissiva: .26, condizionatori: false });
  M.box(4.6, 9, .3, mat('#454b82', .22), 0, 4.5, -6.0);                                  // muro di fondo
  M.pannello({ w: 4.4, h: 3.6, x: 0, y: 4.6, z: -5.84, dipingi: (g, W, H) => { g.fillStyle = '#4c5290'; g.fillRect(0, 0, W, H); g.strokeStyle = '#2e2a48'; g.lineWidth = 3; for (let y = 30; y < H; y += 46) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } g.fillStyle = '#c0522a'; g.fillRect(W * .3, H * .55, W * .4, 20); }, px: 512, emissiva: .25 });
  await modello(M, V, 'finestrella', { x: .15, z: -5.85, ry: -Math.PI / 2 });
  M.luce('#ffcf8a', 3.2, .15, 1.7, -4.6, 5); M.luce('#ffb870', 1.2, .15, 2.2, -5.4, 3);
  // props di scambio gettoni e mano che allunga i contanti alla finestrella
  const gett = new T.Mesh(new T.BoxGeometry(.18, .03, .12), mat('#ffd23f', .8, .3));
  gett.position.set(.15, 1.43, -5.62);
  OBJ.gettoni_vicolo = gett;
  M.root.add(gett);

  const manoContanti = new T.Group();
  manoContanti.position.set(.15, 1.44, -5.7);
  const braccio = new T.Mesh(new T.BoxGeometry(.09, .08, .32), mat('#efe5d3', .3, .6));
  braccio.position.set(0, 0, .15);
  manoContanti.add(braccio);
  const cont = new T.Mesh(new T.BoxGeometry(.22, .035, .14), mat('#f0ebd8', .8, .5));
  cont.position.set(0, .04, .28);
  manoContanti.add(cont);
  OBJ.contanti = manoContanti;
  M.root.add(manoContanti);
  // condizionatori e tubi sui muri (come nel reference)
  for (const [x, y, z, ry] of [[-1.85, 3.2, -3.2, 0], [-1.85, 4.6, -1.0, 0], [1.85, 3.8, -2.4, Math.PI], [1.85, 2.6, .6, Math.PI], [.9, 3.4, -5.7, -Math.PI / 2]]) await vivo(M, 'condizionatore', { x, y: y - .35, z, ry: ry === 0 ? Math.PI / 2 : ry === Math.PI ? -Math.PI / 2 : 0 });
  const tubo = mat('#6a6f9a', .2, .5);
  for (const [x, z] of [[-1.9, -4.8], [1.9, -4.2], [1.9, 1.6]]) M.box(.08, 8, .08, tubo, x, 4, z);
  M.box(3.6, .08, .08, tubo, 0, 3.0, -5.75); M.box(.08, .08, 8, tubo, -1.92, 2.2, -1);
  // cassette gialle (una fa da sedile), cassa di bottiglie, pianta, bici, gatto
  const sedile = await modello(M, V, 'cassetta_gialla', { x: .35, z: -4.25 });
  for (const [x, y, z, ry] of [[1.45, 0, -4.9, .2], [1.45, .33, -4.85, -.1], [1.5, 0, -4.2, .4]]) await modello(M, V, 'cassetta_gialla', { x, y, z, ry });
  await modello(M, V, 'cassa_bottiglie', { x: 1.5, z: -3.5, ry: .3 }); await modello(M, V, 'cassa_bottiglie', { x: 1.45, y: .34, z: -3.55, ry: -.2 });
  const pot = (x, z, s) => { const p = new T.Mesh(new T.CylinderGeometry(.2 * s, .14 * s, .34 * s, 10), mat('#a8705a')); p.position.set(x, .17 * s, z); M.root.add(p);
    for (let i = 0; i < 7; i++) { const o = new T.Mesh(new T.SphereGeometry(.16 * s, 7, 5), mat(i % 2 ? '#4f8a5e' : '#3a6e50', .26)); o.scale.set(.5, 2.0, .45); o.rotation.z = (i - 3) * .25; o.position.set(x + (i - 3) * .05 * s, .62 * s, z + Math.sin(i) * .06); M.root.add(o); } };
  pot(-1.55, -4.6, 1.3); pot(-1.6, -2.2, 1.0);
  const bici = new T.Group(); bici.position.set(1.65, 0, -1.6); M.root.add(bici); const ir = mat('#2a2a3a', .15, .4);
  for (const dz of [-.55, .55]) { const w = new T.Mesh(new T.TorusGeometry(.34, .03, 6, 22), ir); w.rotation.y = Math.PI / 2; w.position.set(0, .36, dz); bici.add(w); }
  for (const [a, b] of [[[0, .36, -.55], [0, .8, -.1]], [[0, .8, -.1], [0, .36, .2]], [[0, .36, .2], [0, .36, -.55]], [[0, .8, -.1], [0, .82, .45]], [[0, .82, .45], [0, .36, .55]]]) {
    const d = new T.Vector3(...b).sub(new T.Vector3(...a)); const o = new T.Mesh(new T.CylinderGeometry(.022, .022, d.length(), 6), mat('#3a8a6a', .25)); o.position.copy(new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5)); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); bici.add(o); }
  // gatto calico (sagoma disegnata, come una comparsa)
  const gatto = M.pannello({ w: .45, h: .42, x: .85, y: .21, z: -3.9, ry: -.3, px: 256, colore: 'rgba(0,0,0,0)', dipingi: (g, W, H) => { g.clearRect(0, 0, W, H);
    g.fillStyle = '#f6f2ea'; g.strokeStyle = '#3a2a2e'; g.lineWidth = 7; g.beginPath(); g.ellipse(W * .5, H * .68, W * .3, H * .27, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(W * .5, H * .32, W * .2, 0, 7); g.fill(); g.stroke(); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(W * (.5 + s * .17), H * .22); g.lineTo(W * (.5 + s * .2), H * .03); g.lineTo(W * (.5 + s * .06), H * .16); g.closePath(); g.fill(); g.stroke(); }
    g.fillStyle = '#e8862a'; g.beginPath(); g.arc(W * .38, H * .26, W * .09, 0, 7); g.fill(); g.beginPath(); g.ellipse(W * .62, H * .7, W * .12, H * .1, 0, 0, 7); g.fill(); g.fillStyle = '#2a2020'; g.beginPath(); g.ellipse(W * .4, H * .72, W * .08, H * .08, 0, 0, 7); g.fill();
    g.fillStyle = '#2a2020'; g.beginPath(); g.arc(W * .44, H * .33, 5, 0, 7); g.arc(W * .56, H * .33, 5, 0, 7); g.fill(); } });
  gatto.material.transparent = true; gatto.material.alphaTest = .5;
  // lampada fredda in alto a sinistra e insegna lontana per il riflesso viola
  M.boxLuce(.5, .12, .25, '#d8e4ff', 2.5, -1.6, 3.4, -.2, 3); M.luce('#9fb0ff', 4, -1.4, 3.0, -.2, 6);
  M.boxLuce(.12, 2.2, .5, '#ff4fb0', 2.8, -1.95, 2.6, 3.5, 0); M.luce('#ff4fb0', 5, -1.5, 2, 3.5, 6);
  // sgabello verde (seduta dell'impiegato) + dettagli sui muri: manifesti, contatori, cavi, lanterna, insegnina
  { const sg = new T.Mesh(new T.CylinderGeometry(.24, .2, .36, 14), mat('#3f9a5a', .3, .5)); sg.position.set(-.8, .18, -4.35); sg.castShadow = true; M.root.add(sg); }
  const poster = (x, y, z, ry, w, h, bg, fg, txt) => M.pannello({ w, h, x, y, z, ry, px: 256, emissiva: .3, dipingi: (g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = fg; g.font = `900 ${W * .3}px sans-serif`; g.textAlign = 'center'; [...txt].forEach((c, i) => g.fillText(c, W / 2, H * .3 + i * W * .34)); g.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 4; i++) g.fillRect(W * .15, H * (.78 + i * .045), W * (.7 - i * .1), 4); g.strokeStyle = '#3a2a2e'; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, H - 8); } });
  const L = Math.PI / 2;
  poster(-1.97, 1.5, -3.6, L, .5, .75, '#e9dfc6', '#b8242c', '火の用心'); poster(-1.97, 1.45, -2.9, L, .45, .65, '#2a3a7a', '#ffd84a', '酒'); poster(-1.97, 2.3, -1.6, L, .6, .9, '#c2182b', '#fff3d0', '営業中');
  poster(1.97, 1.6, -2.7, -L, .5, .8, '#e9dfc6', '#2a3a7a', '空室'); poster(1.97, 1.5, -.6, -L, .55, .7, '#f2c230', '#2a2020', '注意'); poster(1.97, 2.6, -4.4, -L, .5, 1.3, '#16205a', '#ff6fb8', 'バー');
  poster(-1.2, 1.55, -5.83, 0, .4, .55, '#e9dfc6', '#2a2020', '両替'); poster(1.25, 2.1, -5.83, 0, .36, .9, '#2a3a7a', '#e9dfc6', '質屋');
  const grigio = mat('#8a8ea8', .2, .5), scuro = mat('#2a2c44', .15, .5);
  for (const [x, y, z] of [[-1.93, 1.3, -1.9], [1.93, 1.2, -1.5], [1.93, 1.25, -3.9], [-1.93, 1.9, -4.5]]) { M.box(.12, .42, .3, grigio, x, y, z); M.box(.14, .1, .2, scuro, x, y + .05, z); M.box(.04, 1.2, .04, scuro, x, y - .8, z + .08); }
  for (let i = 0; i < 5; i++) { const z = -4.8 + i * 1.6, y = 4.2 + (i % 2) * .7; for (let k = 0; k < 8; k++) { const u = k / 8, u2 = (k + 1) / 8, sag = t => y - Math.sin(t * Math.PI) * .35; const a = new T.Vector3(-1.95 + u * 3.9, sag(u), z + u * .5), b = new T.Vector3(-1.95 + u2 * 3.9, sag(u2), z + u2 * .5), d = b.clone().sub(a); const o = new T.Mesh(new T.CylinderGeometry(.012, .012, d.length(), 4), scuro); o.position.copy(a.add(b).multiplyScalar(.5)); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); M.root.add(o); } }
  const lan = new T.Mesh(new T.SphereGeometry(.2, 14, 10), M.emi('#ff5a3a', 1.5)); lan.scale.y = 1.35; lan.position.set(-1.7, 2.5, -3.2); M.root.add(lan); M.box(.03, .5, .03, scuro, -1.7, 3.0, -3.2); const lanLuce = M.luce('#ff6a4a', 2.5, -1.5, 2.3, -3.2, 3.5);
  M.box(.9, 2.0, .06, mat('#3a2f52', .2), -1.96, 1.0, .4); M.box(.06, .12, .06, mat('#d3a443', .5, .3), -1.9, 1.0, .1);   // porta di servizio
  for (const [x, z, c] of [[-1.6, -.6, '#3a6ad0'], [-1.55, -1.1, '#8a8ea8'], [1.6, .9, '#c2182b']]) { const b = new T.Mesh(new T.CylinderGeometry(.2, .17, .6, 12), mat(c, .25, .5)); b.position.set(x, .3, z); b.castShadow = true; M.root.add(b); const t = new T.Mesh(new T.CylinderGeometry(.215, .215, .04, 12), scuro); t.position.set(x, .62, z); M.root.add(t); }

  // animazione vicolo: lanterna che dondola nella brezza notturna e coda del gatto
  M.tick = M.tick || [];
  M.tick.push(t => {
    lan.rotation.z = Math.sin(t * 1.8) * 0.08;
    gatto.rotation.z = Math.sin(t * 2.5) * 0.035;
    lanLuce.intensity = 2.5 + Math.sin(t * 5) * 0.3;
  });
}
