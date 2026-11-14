// Scena di prova interno cucina: confronto PRIMA (tinta piatta + dipinto canvas) vs DOPO (PBR reale + HDRI)
export async function costruisci(M, D, S, OBJ) {
  const T = M.THREE;
  const X = 4.5, ZF = -4.0, ZB = 4.0, H = 3.2, ZLEN = 8.2, ZMID = 0;
  const usePbr = D.Q.has('pbr');
  if (D.road) D.road.visible = false;

  const mFloor = usePbr
    ? M.pbr('terracotta_floor_tiles', { misure: [9.2, ZLEN], scala: 2.0, rilievo: 0.35, ruvido: 0.85, env: 0.42, emissiva: 0.04 })
    : M.std('#92644d', 0.90);
  const mWall = usePbr
    ? M.pbr('Plaster002', { misure: [9.2, H], scala: 2.4, colore: '#f7ebd8', rilievo: 0.28, ruvido: 0.94, env: 0.25, emissiva: 0.06 })
    : M.std('#e4d4b6', 0.88);
  const mTiles = usePbr
    ? M.pbr('Tiles133A', { misure: [8.8, 1.15], scala: 1.35, colore: '#ebf3ee', rilievo: 0.30, ruvido: 0.55, env: 0.55, emissiva: 0.04 })
    : M.std('#8da48c', 0.86);
  const mWood = usePbr
    ? M.pbr('WoodFloor051', { misure: [2.6, 1.4], scala: 1.4, colore: '#dcb795', rilievo: 0.32, ruvido: 0.72, env: 0.45, emissiva: 0.03 })
    : M.std('#6e4428', 0.80);
  const mCeil = usePbr
    ? M.pbr('Plaster001', { misure: [9.2, ZLEN], scala: 2.6, colore: '#f5ebdc', rilievo: 0.20, ruvido: 0.96, env: 0.20, emissiva: 0.06 })
    : M.std('#ebdfc7', 0.90);

  // Pavimento + soffitto + 4 pareti (parete fondo aperta sopra la finestra? No, lasciamo apertura finestra reale verso esterno!)
  M.box(9.2, 0.14, ZLEN, mFloor, 0, -0.07, ZMID).userData.suolo = true;
  M.box(9.2, 0.14, ZLEN, mCeil, 0, H + 0.07, ZMID);
  // Parete fondo con foro finestra centrato in x = -0.6 (largo 1.6 m: da -1.4 a +0.2)
  M.box(3.2, H, 0.18, mWall, -3.0, H / 2, ZF);
  M.box(4.4, H, 0.18, mWall, 2.4, H / 2, ZF);
  M.box(1.6, 1.1, 0.18, mWall, -0.6, 0.55, ZF);
  M.box(1.6, 0.8, 0.18, mWall, -0.6, 2.8, ZF);
  // Infisso finestra legno allineato al foro [-1.4..+0.2, y 1.1..2.4]
  M.box(1.68, 0.08, 0.22, mWood, -0.6, 1.12, ZF);
  M.box(1.68, 0.08, 0.22, mWood, -0.6, 2.38, ZF);
  M.box(0.08, 1.32, 0.22, mWood, -1.40, 1.75, ZF);
  M.box(0.08, 1.32, 0.22, mWood, 0.20, 1.75, ZF);
  M.box(0.05, 1.24, 0.14, mWood, -0.6, 1.75, ZF);

  M.box(9.2, H, 0.18, mWall, 0, H / 2, ZB);
  M.box(0.18, H, ZLEN, mWall, -X, H / 2, ZMID);
  M.box(0.18, H, ZLEN, mWall, X, H / 2, ZMID);

  // Fascia piastrellata bassa + paraschizzi cucina
  M.box(8.8, 1.10, 0.05, mTiles, 0, 0.55, ZF + 0.10);
  M.box(0.05, 1.10, ZLEN - 0.3, mTiles, -X + 0.10, 0.55, ZMID);
  M.box(0.05, 1.10, ZLEN - 0.3, mTiles, X - 0.10, 0.55, ZMID);

  // Travi soffitto
  for (const tz of [-2.4, -0.3, 1.8]) M.box(8.8, 0.18, 0.22, mWood, 0, H - 0.09, tz);

  // Credenza + piano lavoro legno & pietra a sinistra, tavolo cucina davanti
  const mMarble = usePbr ? M.pbr('marble_tiles', { misure: [2.8, 1.0], scala: 1.5, rilievo: 0.22, ruvido: 0.45, env: 0.65 }) : M.std('#d8d4cc', 0.5);
  M.box(1.0, 0.92, 3.2, mWood, -3.7, 0.46, -1.4);
  M.box(1.06, 0.07, 3.26, mMarble, -3.7, 0.94, -1.4);
  // Tavolo centrale
  M.box(2.2, 0.08, 1.3, mWood, 1.2, 0.78, -1.2);
  for (const [dx, dz] of [[-0.9, -0.5], [0.9, -0.5], [-0.9, 0.5], [0.9, 0.5]]) {
    M.box(0.1, 0.74, 0.1, mWood, 1.2 + dx, 0.37, -1.2 + dz);
  }
  // Lampade: versione legacy piatta vs cinema motivata (finestra + sospensione sopra il tavolo)
  if (D.Q.has('luce_cinema')) {
    M.box(0.03, 0.72, 0.03, M.std('#2a2628', 0.5), 1.0, 2.84, -1.2);
    const paralume = new T.Mesh(
      new T.ConeGeometry(0.28, 0.20, 18, 1, true),
      new T.MeshStandardMaterial({ color: '#d87a4a', roughness: 0.45, metalness: 0.15, side: T.DoubleSide })
    );
    paralume.position.set(1.0, 2.48, -1.2); paralume.castShadow = true; M.add(paralume);
    const bulbo = new T.Mesh(new T.SphereGeometry(0.06, 12, 10), M.emi('#ffe4ad', 1.15));
    bulbo.position.set(1.0, 2.41, -1.2); M.add(bulbo);
    M.luceSpot({ x: 1.0, y: 2.38, z: -1.2, verso: [1.0, 0.0, -1.0], colore: '#ffd59a', forza: 9.5, angolo: 0.68, penombra: 0.68, dist: 9, decadimento: 1.0, ombra: true });
    M.luceVera({ x: 1.0, y: 2.28, z: -1.2, colore: '#ffe0b0', forza: 2.4, dist: 5.5, decadimento: 1.0 });
    M.luceFinestra({ x: -0.6, y: 2.10, z: -3.62, verso: [0.35, 0.0, -0.4], colore: '#fff0d0', coloreCielo: '#bddcff', forza: 11, angolo: 0.36, penombra: 0.62, dist: 14, raggio: 0.022, ombra: true });
  } else {
    M.luceVera({ x: 0.0, y: 2.35, z: -1.2, colore: '#ffe5bf', forza: 11, dist: 12 });
    M.luceVera({ x: -1.6, y: 2.15, z: -1.6, colore: '#ffe0b4', forza: 7.5, dist: 9 });
    M.luceVera({ x: 1.8, y: 2.20, z: -1.6, colore: '#ffe0b4', forza: 7.5, dist: 9 });
  }

  if (D.Q.has('quinte')) {
    M.quinta({ tipo: 'stipite', x: -0.68, y: 1.6, z: 1.75, lato: -1 });
    // Angolo penisola in primo piano a destra in noce scuro per evitare sovraesposizione e dare contrasto al bricco
    M.box(0.80, 0.72, 0.72, mWood, 0.58, 0.36, 1.76);
    M.box(0.84, 0.04, 0.76, M.std('#4f3220', 0.44, 0.04), 0.58, 0.73, 1.76);
    M.quinta({ tipo: 'pianta', x: 0.56, y: 0.75, z: 1.62, scala: 0.72 });
    const bricco = new T.Group();
    bricco.position.set(0.31, 0.75, 1.74);
    const mCer = M.std('#285b7a', 0.18, 0.06), mCrema = M.std('#f2e6cf', 0.20, 0.05), mRame = M.std('#c98643', 0.25, 0.65);
    const baseB = new T.Mesh(new T.CylinderGeometry(0.088, 0.072, 0.14, 16), mCer);
    baseB.position.y = 0.07; bricco.add(baseB);
    const fascia = new T.Mesh(new T.CylinderGeometry(0.090, 0.089, 0.035, 16), mCrema);
    fascia.position.y = 0.13; bricco.add(fascia);
    const collo = new T.Mesh(new T.CylinderGeometry(0.052, 0.082, 0.09, 16), mCer);
    collo.position.y = 0.19; bricco.add(collo);
    const orlo = new T.Mesh(new T.CylinderGeometry(0.062, 0.052, 0.025, 16), mRame);
    orlo.position.y = 0.245; bricco.add(orlo);
    const manico = new T.Mesh(new T.TorusGeometry(0.055, 0.013, 8, 14, Math.PI), mRame);
    manico.position.set(0.072, 0.145, 0); manico.rotation.z = -Math.PI / 2; bricco.add(manico);
    bricco.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.userData.struttura = 1; } });
    M.add(bricco);
    OBJ.bricco = bricco;
  }
}
