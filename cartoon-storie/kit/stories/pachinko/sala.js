// Sala pachinko — mondo su misura, look «disegnato». Sala: x -12..-2.6, z 4..-8 (corridoio lungo z).
import { GLTFLoader } from '/lib/jsm/loaders/GLTFLoader.js';
export async function costruisci(M, D, S, OBJ) {
  const { THREE: T } = M;
  const ink = '#3a2a2e';
  const mat = (c, e = .22, r = .6, m = 0) => { const x = M.std(c, r, m); x.emissive.set(c); x.emissiveIntensity = e; return x; };
  const X0 = -12, X1 = -2.6, XC = -7.3, ZF = -8, ZB = 4.2, H = 3.3;
  // ---- involucro: pareti dipinte, soffitto, moquette a rombi
  const carpet = M.tex(1024, 1024, (g, W, Hh) => { g.fillStyle = '#7a1a22'; g.fillRect(0, 0, W, Hh); const n = 8, s = W / n;
    for (let i = -1; i <= n; i++) for (let j = -1; j <= n; j++) { const cx = (i + .5) * s, cy = (j + .5) * s;
      g.fillStyle = (i + j) % 2 ? '#7c1c25' : '#6a161e'; g.beginPath(); g.moveTo(cx, cy - s / 2); g.lineTo(cx + s / 2, cy); g.lineTo(cx, cy + s / 2); g.lineTo(cx - s / 2, cy); g.fill();
      g.strokeStyle = '#b8873e'; g.lineWidth = 14; g.beginPath(); g.moveTo(cx, cy - s * .36); g.lineTo(cx + s * .36, cy); g.lineTo(cx, cy + s * .36); g.lineTo(cx - s * .36, cy); g.closePath(); g.stroke();
      g.fillStyle = '#c99a4c'; g.fillRect(cx - 14, cy - 14, 28, 28); }
    for (let k = 0; k < 500; k++) { g.fillStyle = `rgba(30,6,10,${.04 + (k % 5) * .02})`; g.fillRect((k * 197) % W, (k * 89) % Hh, 10 + k % 17, 3 + k % 5); } });
  carpet.wrapS = carpet.wrapT = T.RepeatWrapping; carpet.repeat.set(2.2, 2.6);
  carpet.generateMipmaps = true; carpet.minFilter = T.LinearMipmapLinearFilter; carpet.anisotropy = 16;
  D.road.material = M.dipinto(carpet, .42, .9);   // la moquette è il piano del motore: così riceve i riflessi del look
  const wallM = mat('#c9a98a', .26, .9), wallDark = mat('#4a3340', .2);
  M.box(.3, H, ZB - ZF, wallM, X0 - .15, H / 2, (ZB + ZF) / 2); M.box(.3, H, ZB - ZF, wallM, X1 + .15, H / 2, (ZB + ZF) / 2);
  M.box(X1 - X0, H, .3, wallM, XC, H / 2, ZF - .15); M.box(X1 - X0 + .6, .3, ZB - ZF + .5, mat('#b89a74', .12, .9), XC, H + .15, (ZB + ZF) / 2);
  for (const x of [X0 + .02, X1 - .02]) { M.box(.06, .16, ZB - ZF, wallDark, x, .08, (ZB + ZF) / 2); M.box(.05, .08, ZB - ZF, M.emi('#ffb060', 1.4), x, 2.55, (ZB + ZF) / 2); }
  // tubi al neon a soffitto (veri emettitori) + poche luci vere calde
  for (const x of [X0 + 1.3, -9.5, XC, -5.1, X1 - 1.3]) for (let z = ZB - .6; z > ZF; z -= 2.4)
    M.boxLuce(.14, .05, 1.5, x === XC || x === -9.5 ? '#ffe9bd' : '#e8f1ff', 1.0, x, H - .06, z, 3);
  for (const z of [2.2, -1.2, -4.4]) M.luce('#ffd9a0', 3.5, XC, 2.4, z, 7);
  M.luce('#ffe6b0', 3, XC, 2.6, ZF + 3.5, 7);
  // ---- macchine pachinko: 4 grafiche di schermo, corpo laccato, vetro, pioli, vassoio cromato, manopola
  const scr = [['#0a2a8a', '#ff2f90'], ['#0b4c55', '#ffb21f'], ['#3b0b60', '#29d8ff'], ['#6a0e12', '#ffe34a']].map(([a, b], i) => M.tex(256, 256, (g, W, Hh) => {
    const q = g.createLinearGradient(0, 0, 0, Hh); q.addColorStop(0, a); q.addColorStop(1, b); g.fillStyle = q; g.fillRect(0, 0, W, Hh);
    for (let k = 0; k < 9; k++) { g.fillStyle = `rgba(255,255,255,${.12 + (k % 3) * .06})`; g.beginPath(); g.arc((k * 83 + i * 31) % W, (k * 59 + 20) % Hh, 14 + k * 4, 0, 6.3); g.fill(); }
    g.fillStyle = '#fff3a0'; g.font = `bold ${Hh * .34}px sans-serif`; g.textAlign = 'center'; g.fillText(['777', '7 7 7', 'RUSH', 'REACH'][i], W / 2, Hh * .62);
    g.strokeStyle = ink; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, Hh - 8); }));
  const field = [['#134c8c', '#7de8d3'], ['#5a1740', '#ffb86b'], ['#14502a', '#e6f27a'], ['#3b1a6b', '#ff7fc0']].map(([a, b], i) => M.tex(256, 256, (g, W, Hh) => {
    const q = g.createLinearGradient(0, 0, W, Hh); q.addColorStop(0, a); q.addColorStop(1, b); g.fillStyle = q; g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#f4e3a1'; for (let r = 0; r < 11; r++) for (let c = 0; c < 9; c++) { g.beginPath(); g.arc(W * .1 + c * W * .1 + (r % 2) * W * .05, Hh * .1 + r * Hh * .08, 3.3, 0, 6.3); g.fill(); }
    g.strokeStyle = ink; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, Hh - 8); }));
  const lacca = mat('#14121e', .12, .25, .15), laccaB = mat('#101c3c', .2, .3, .1), chrome = mat('#c9ced8', .12, .2, .7), gold = mat('#c99a3c', .5, .35, .4);
  const glass = new T.MeshStandardMaterial({ color: '#cfe8ff', roughness: .05, transparent: true, opacity: .16, emissive: '#6aa0ff', emissiveIntensity: .1 });
  const ledC = [['#ff3fa5', '#2de0ff'], ['#ffd23f', '#58ff7a'], ['#2de0ff', '#ff7a2b'], ['#b05cff', '#ffd23f']];
  const disp = [0, 1, 2, 3].map(i => M.tex(512, 140, (g, W, Hh) => { g.fillStyle = '#1a0608'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#ff3b2a'; g.font = `bold ${Hh * .62}px monospace`; g.textAlign = 'center';
    g.fillText(['795  19', '396  12', '221  08', '777  31'][i], W / 2, Hh * .72); g.strokeStyle = ink; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, Hh - 10); }));
  for (const t of [...scr, ...field, ...disp]) { t.wrapT = T.RepeatWrapping; t.repeat.y = -1; t.needsUpdate = true; }
  const proto = (await new GLTFLoader().loadAsync('/scena/macchina_pachinko.glb')).scene;
  const varianti = [0, 1, 2, 3].map(vi => ({ corpo: vi % 2 ? laccaB : lacca, corpo_scuro: mat('#0c0b12', .08, .3), cromo: chrome, oro: gold, rosso: mat('#c0162a', .45, .35),
    schermo: M.dipinto(scr[vi], .5), campo: M.dipinto(field[vi], .5), display: M.dipinto(disp[vi], .9), led_a: M.emi(ledC[vi][0], 1.8), led_b: M.emi(ledC[vi][1], 1.8),
    vetro: glass, pulsante: M.emi('#ffd23f', 1.6) }));
  function macchina(x, z, dir, vi) {
    const g = proto.clone(true); g.position.set(x, 0, z); g.rotation.y = dir > 0 ? 0 : Math.PI;
    g.traverse(o => { if (o.isMesh) { const n = o.material.name, v = varianti[vi % 4]; if (v[n]) o.material = v[n]; o.castShadow = o.receiveShadow = n !== 'vetro'; } });
    M.root.add(g); return g;
  }
  const PITCH = .64, ZS = 3.3, N = 12;
  let vi = 0;
  const lati = [{ x: -9.6, dir: 1 }, { x: -10.0, dir: -1 }, { x: -5.0, dir: -1 }, { x: -4.6, dir: 1 }];
  for (const L of lati) for (let k = 0; k < N; k++) macchina(L.x, ZS - k * PITCH, L.dir, vi++ * 7 % 4 + (k % 2));
  for (const x of [-9.8, -4.8]) { M.box(.1, 2.3, N * PITCH + .2, lacca, x, 1.15, ZS - (N - 1) * PITCH / 2); M.box(.8, .42, N * PITCH + .2, laccaB, x, 2.62, ZS - (N - 1) * PITCH / 2); M.box(.04, .03, N * PITCH + .2, M.emi('#25d8ff', 1.3), x + .4, 2.42, ZS - (N - 1) * PITCH / 2); M.box(.04, .03, N * PITCH + .2, M.emi('#25d8ff', 1.3), x - .4, 2.42, ZS - (N - 1) * PITCH / 2); }
  // ---- sgabelli rossi (cromo + seduta)
  const pelle = mat('#b0171f', .3, .35, 0), geoS = [new T.CylinderGeometry(.2, .2, .025, 22), new T.CylinderGeometry(.022, .022, .58, 10), new T.CylinderGeometry(.17, .17, .07, 24)];
  for (const xs of [-8.65, -6.45, -3.65, -11.0]) for (let k = 0; k < N; k++) { if ((k * 7 + Math.round(xs)) % 5 === 0) continue; const z = ZS - k * PITCH, g = new T.Group(); g.position.set(xs, 0, z); M.root.add(g);
    const a = new T.Mesh(geoS[0], chrome); a.position.y = .013; const p = new T.Mesh(geoS[1], chrome); p.position.y = .3; const s = new T.Mesh(geoS[2], pelle); s.position.y = .65; for (const o of [a, p, s]) { o.castShadow = true; g.add(o); } }
  // ---- banco premi in fondo (a z = ZF)
  const cz = ZF + .55;
  M.box(6.3, 1.05, .7, mat('#5a3422', .24, .5), XC, .525, cz); M.box(6.4, .06, .8, lacca, XC, 1.08, cz);
  const vetrina = new T.Mesh(new T.BoxGeometry(5.9, .46, .62), glass); vetrina.position.set(XC, 1.34, cz); M.root.add(vetrina);
  const shelves = M.tex(1024, 512, (g, W, Hh) => { const q = g.createLinearGradient(0, 0, 0, Hh); q.addColorStop(0, '#f3dfb4'); q.addColorStop(1, '#d9b98b'); g.fillStyle = q; g.fillRect(0, 0, W, Hh);
    const cols = ['#e83d5a', '#2a9de8', '#ffc533', '#37c27a', '#c35be8', '#f2f0e6', '#ff7a2b'];
    for (let r = 0; r < 3; r++) { const y = Hh * (.26 + r * .3); g.fillStyle = '#7a5434'; g.fillRect(0, y, W, 10); g.strokeStyle = ink; g.lineWidth = 4; g.strokeRect(0, y, W, 10);
      for (let i = 0; i < 26; i++) { const w = 22 + (i * 11 + r * 7) % 20, h = 40 + (i * 17 + r * 13) % 48, x = i * 39 + 6; g.fillStyle = cols[(i + r * 2) % 7]; if ((i + r) % 3 === 0) { g.beginPath(); g.arc(x + w / 2, y - h / 2, w / 2, 0, 6.3); g.fill(); g.stroke(); } else { g.fillRect(x, y - h, w, h); g.strokeRect(x, y - h, w, h); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x + 4, y - h + 8, w - 8, 6); } } }
    g.strokeStyle = ink; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, Hh - 10); });
  const wallShelf = new T.Mesh(new T.PlaneGeometry(6.4, 2.0), M.dipinto(shelves, .6)); wallShelf.position.set(XC, 2.0, ZF + .02); M.root.add(wallShelf);
  M.pannello({ w: 3.2, h: .62, x: XC, y: 3.0, z: ZF + .05, px: 768, colore: '#f6f2e6', luminoso: .9, testo: 'PRIZE COUNTER', coloreTesto: '#2a1c22' });
  M.pannello({ w: 1.6, h: .3, x: XC, y: 2.7, z: ZF + .05, px: 512, colore: '#c8202c', luminoso: .9, testo: '景品交換', coloreTesto: '#fff' });
  
  // ---- oggetti nominati dalla voce (compaiono sulla parola): secchio di palline, premi sul banco
  const secchio = new T.Group(); OBJ.secchio = secchio; secchio.position.set(XC + .5, 1.12, cz + .15); M.root.add(secchio);
  const sm = new T.Mesh(new T.CylinderGeometry(.17, .13, .22, 16), mat('#1a1a28', .2, .4)); sm.position.y = .11; secchio.add(sm);
  for (let i = 0; i < 70; i++) { const p = new T.Mesh(new T.SphereGeometry(.018, 8, 6), chrome); const a = i * 2.4, r = .02 + (i % 7) * .016; p.position.set(Math.cos(a) * r, .22 + (i % 3) * .012, Math.sin(a) * r); secchio.add(p); }
  const tray = (id, c, x) => { const g = new T.Group(); OBJ[id] = g; g.position.set(x, 1.12, cz); M.root.add(g); const b = new T.Mesh(new T.BoxGeometry(.28, .2, .2), mat(c, .5, .5)); b.position.y = .1; g.add(b); const f = new T.Mesh(new T.PlaneGeometry(.2, .1), M.emi('#fff6dc', 1.2)); f.position.set(0, .12, .101); g.add(f); };
  tray('biscotti', '#d49a4a', XC - 1.6); tray('cioccolato', '#5a2d1a', XC - 1.0); tray('shampoo', '#3aa8e0', XC - .4); tray('gettoni', '#ffd23f', XC + 1.4);
  // ---- distributore automatico blu (come nel riferimento) + piante + cassetta
  const vend = new T.Group(); vend.position.set(X1 - .5, 0, ZB - 2.2); M.root.add(vend);
  { const b = new T.Mesh(new T.BoxGeometry(.8, 1.85, .72), mat('#1d3fb8', .3, .3)); b.position.y = .925; vend.add(b);
    const f = new T.Mesh(new T.PlaneGeometry(.6, 1.2), M.dipinto(M.tex(256, 400, (g, W, Hh) => { g.fillStyle = '#16264a'; g.fillRect(0, 0, W, Hh); const cs = ['#e8393d', '#2a9de8', '#ffc533', '#37c27a', '#f2f0e6']; for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) { g.fillStyle = cs[(r + c) % 5]; g.fillRect(14 + c * 58, 20 + r * 74, 38, 56); g.strokeStyle = ink; g.lineWidth = 3; g.strokeRect(14 + c * 58, 20 + r * 74, 38, 56); } g.strokeStyle = ink; g.lineWidth = 8; g.strokeRect(3, 3, W - 6, Hh - 6); }), .9)); f.position.set(-.41, 1.15, 0); f.rotation.y = -Math.PI / 2; vend.add(f); }
  M.luce('#7fb6ff', 4, X1 - 1.2, 1.4, ZB - 2.2, 4);
  const pot = (x, z) => { const p = new T.Mesh(new T.CylinderGeometry(.24, .17, .4, 10), mat('#b27658')); p.position.set(x, .2, z); M.root.add(p); for (let i = 0; i < 6; i++) { const o = new T.Mesh(new T.SphereGeometry(.2, 8, 6), mat(i % 2 ? '#5f9a64' : '#3e7a52')); o.scale.set(.7, 1.6, .6); o.position.set(x + Math.cos(i * 2.2) * .14, .7 + (i % 2) * .12, z + Math.sin(i * 2.2) * .14); M.root.add(o); } };
  pot(X0 + .5, ZF + 1.0); pot(X1 - .5, ZF + 1.0); pot(X0 + .5, ZB - .6);
  // torre di scatole palline nere/rosse in corridoio
  const { vestiti, modello } = await import('/scena/oggetti.js'); const VV = vestiti(M);
  OBJ.torre = await modello(M, VV, 'torre_scatole', { x: -7.0, y: .55, z: -5.2, ry: .2 });
  await modello(M, VV, 'torre_scatole', { x: -8.25, z: 1.6, ry: .4 }); await modello(M, VV, 'torre_scatole', { x: -6.2, z: -1.6, ry: -.3 });
  // ingresso: porta nel muro est (z = -4)
  M.box(.1, 2.4, 1.4, mat('#3a2a40', .3), X1 - .01, 1.2, -4); M.box(.06, 2.2, 1.2, M.emi('#9fd8ff', 1.6), X1 - .06, 1.15, -4);
  M.luce('#a8d8ff', 7, X1 - .8, 1.8, -4, 4);
  // comparse sedute alle macchine, rivolte verso lo schermo (come nel reference)
  let ci = 0;
  for (const [xs, ry, v] of [[-8.55, 1.35, -.9], [-6.05, -1.35, .9]]) for (let k = 0; k < N; k++) { if ((k * 5 + ci) % 3 === 2) { ci++; continue; }
    M.omino({ ...M.personalita(ci * 37 + 11), posa: 'seduto', verso: v }, xs, ZS - k * PITCH, ry, .62); ci++; }
  // cartelli numerati e prezzi in testa alle isole
  for (const [x, n, p] of [[-9.8, '9', '¥4 PER BALL'], [-4.8, '11', '¥20 SLOTS']]) {
    M.pannello({ w: .5, h: .32, x, y: 2.98, z: ZS + .45, px: 256, colore: '#f4efe2', luminoso: .95, testo: n, coloreTesto: '#c2182b' });
    M.pannello({ w: .8, h: .5, x, y: 2.0, z: ZS + .42, px: 256, colore: '#c2182b', luminoso: .9, testo: p, coloreTesto: '#ffe14a' }); }
}
