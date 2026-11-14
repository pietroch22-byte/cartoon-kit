import { orologio, cartello } from '/web/buon_senso.js';

export async function costruisci(M, D, S, OBJ) {
  const { THREE, root, std, emi, box, luce } = M;
  const X = 4.5, ZF = -4.0, ZB = 4.0, H = 3.2;
  const ZLEN = ZB - ZF + 0.2, ZMID = (ZB + ZF) / 2;
  const str = m => { m.traverse(c => { c.userData.struttura = 1; }); m.userData.struttura = 1; return m; };

  const mCotto = std('#a85d44', 0.85), mMuro = std('#efe0c6', 0.88), mLegno = std('#7a4e2d', 0.78), mTav = std('#d84a3a', 0.88);
  // Pavimento top a +0.015 per evitare ogni z-fighting con D.road
  str(box(9.2, 0.14, ZLEN, mCotto, 0, -0.055, ZMID));
  str(box(9.2, 0.14, ZLEN, std('#f4ecdc', 0.9), 0, H + 0.07, ZMID));
  str(box(9.2, H, 0.18, mMuro, 0, H / 2, ZF));
  str(box(9.2, H, 0.18, mMuro, 0, H / 2, ZB));
  str(box(0.18, H, ZLEN, mMuro, -X, H / 2, ZMID));
  str(box(0.18, H, ZLEN, mMuro, X, H / 2, ZMID));

  // Blocco fornelli a sinistra (x = -3.6, z = -2.2..-0.4) con 4 fuochi e 4 pentole segnaposto
  box(0.85, 0.90, 2.2, std('#d8ccb8', 0.8), -3.75, 0.45, -1.3).name = 'blocco_fornelli';
  for (let i = 0; i < 4; i++) {
    const fz = -2.0 + i * 0.46;
    const pent = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.16, 16), std('#7c828e', 0.65, 0.15));
    pent.position.set(-3.7, 0.99, fz); pent.name = `pentola${i}`; root.add(pent);
    const fiamma = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 8, 18), emi('#45b8ff', 1.4));
    fiamma.rotation.x = Math.PI / 2; fiamma.position.set(-3.7, 0.915, fz); fiamma.name = `fuoco${i}`; root.add(fiamma);
    OBJ[`fuoco${i}`] = fiamma;
  }
  box(1.1, 0.6, 2.2, std('#b66a46', 0.72), -3.75, 2.45, -1.3).name = 'cappa';

  // Tavolo centrale con tovaglia rossa a quadretti segnaposto + sedia
  box(2.0, 0.08, 1.2, mTav, 0, 0.78, -0.3).name = 'tavolo';
  for (const [sx, sz] of [[-0.85, -0.5], [0.85, -0.5], [-0.85, 0.5], [0.85, 0.5]]) box(0.08, 0.75, 0.08, mLegno, sx, 0.37, -0.3 + sz);

  // Porta cucina sullo sfondo destro (riferimento visivo "grande come una porta")
  box(1.05, 2.15, 0.08, mLegno, 2.45, 1.08, ZF + 0.14).name = 'porta_cucina';
  cartello(M, { testo: 'CUCINA', x: 2.45, y: 2.38, z: ZF + 0.18, ry: 0, w: 0.7, h: 0.22, fondo: '#f4ead2', colore: '#5a2d1b' });

  // Mega lasagna segnaposto che arriva sul tavolo: larghissima come una porta ma bassa così Marco si vede bene sopra
  const las = new THREE.Group(); las.position.set(0, 0.82, -0.15); root.add(las);
  const teglia = new THREE.Mesh(new THREE.BoxGeometry(1.90, 0.08, 0.92), std('#b4b8c2', 0.7));
  teglia.position.y = 0.04; las.add(teglia);
  const pasta = new THREE.Mesh(new THREE.BoxGeometry(1.80, 0.14, 0.84), std('#e6a844', 0.82));
  pasta.position.y = 0.15; las.add(pasta);
  const ragu = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.05, 0.82), std('#c83828', 0.8));
  ragu.position.y = 0.245; las.add(ragu);
  las.name = 'lasagna_gigante';
  OBJ.lasagna = las;

  // Pila di teglie vuote sul lato sinistro del tavolo così in Scena 4 lascia completamente scoperto Marco a destra
  const pile = new THREE.Group(); pile.position.set(-0.55, 0.83, -0.25); root.add(pile);
  for (let i = 0; i < 6; i++) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.92 - i * 0.06, 0.10, 0.68 - i * 0.04), std('#9aa0ac', 0.7));
    t.position.set((i % 2 ? 0.03 : -0.03), 0.05 + i * 0.105, 0); t.rotation.y = (i % 2 ? 0.07 : -0.06); pile.add(t);
  }
  const crosta = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 20), std('#e6c258', 0.8));
  crosta.position.set(0.68, 0.09, 0.18); pile.add(crosta);
  pile.visible = false; pile.name = 'pile_teglie'; OBJ.pile_teglie = pile;

  orologio(M, { x: 1.5, y: 2.3, z: ZF + 0.12, r: 0.24, ora: '20:10' });
  // Lampada sospensione calda sopra tavolo + luce sotto cappa
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.18, 16), emi('#ffe6b0', 1.15));
  lamp.position.set(0, H - 0.7, -0.3); root.add(lamp);
  luce('#ffe2b0', 6.5, 0, H - 0.9, -0.3, 12);
  luce('#ffd498', 4.0, -3.1, 2.0, -1.3, 7);
}
