// Scena di prova esterno: confronto PRIMA (piatto) vs DOPO (PBR + M.erba 3D + PureSky HDRI)
export async function costruisci(M, D, S, OBJ) {
  const { THREE } = M;
  const dopo = S._scenaCor?.luogo === 'esterno_dopo' || S._modo === 'dopo' || M._modoPbr === true;
  // Detect modo from LG via S.luoghi
  const lgName = Object.keys(S.luoghi).find(k => S.scene.some(sc => sc.luogo === k && sc.scenaId === S._scenaId)) || '';
  const isDopo = D.Q.has('pbr_dopo') || !!D.root.userData.pbrDopo;
  const T = THREE;
  if (D.road) D.road.visible = false;

  const texMat = (nome, misure, scala, flatCol, opt = {}) => {
    if (!D.Q.has('pbr')) return M.std(flatCol, 0.88);
    return M.pbr(nome, { misure, scala, emissiva: 0.04, ...opt });
  };

  // Suolo + prato (prato denso davanti alla camera: z = -5..+5, x = -6..+6)
  if (D.Q.has('pbr')) {
    M.erba({
      x: 0, z: -0.5, w: 12, d: 11,
      densita: 70,
      altezza: [0.16, 0.32],
      terreno: 'Grass005',
      coloreTerreno: '#e2f2d2',
      scalaTerreno: 2.0,
      emissivaTerreno: 0.10,
      vento: 0.05,
      escludi: [[-1.15, -8.5, 1.15, 6.5], [-5.0, -11.5, 5.0, -5.85], [-3.4, -2.5, -1.65, -1.65]],
      seme: 29,
    });
    // Terreno di contorno più lontano verso orizzonte
    const extM = M.pbr('Grass004', { misure: [160, 160], scala: 4.5, ruvido: 0.96, metallo: 0, emissiva: 0.10, colore: '#cde4ae' });
    const extP = new T.Mesh(new T.PlaneGeometry(160, 160), extM);
    extP.rotation.x = -Math.PI / 2; extP.position.set(0, -0.01, -40); extP.receiveShadow = true; extP.userData.suolo = true;
    M.add(extP);
  } else {
    const g = new T.Mesh(new T.PlaneGeometry(80, 80), M.std('#5c8e3d', 0.92));
    g.rotation.x = -Math.PI / 2; g.position.set(0, 0, -18); g.receiveShadow = true; g.userData.suolo = true;
    M.add(g);
  }

  // Sentiero di pietre centrale
  M.box(2.2, 0.06, 13.5, texMat('cobblestone_floor_01', [2.2, 13.5], 1.8, '#8a867e', { rilievo: 0.38 }), 0, 0.025, -0.5).userData.suolo = true;

  // Casa rustica sul fondo (z = -8)
  const mBrick = texMat('red_brick', [7.6, 3.2], 2.0, '#b5563e', { rilievo: 0.36 });
  const mPlaster = texMat('Plaster002', [7.6, 3.0], 2.2, '#e2d4b8', { colore: '#f4e4c8', rilievo: 0.28, emissiva: 0.08 });
  const mWood = texMat('wood_planks', [1.4, 2.3], 1.4, '#6b4228', { rilievo: 0.30 });
  const mRoof = texMat('clay_roof_tiles_02', [8.4, 3.6], 2.0, '#9c422f', { rilievo: 0.36 });
  const mStone = texMat('Bricks042', [2.4, 1.0], 1.6, '#7a786e', { rilievo: 0.35 });

  // Piano terra in mattoni, primo piano intonaco pietra, tetto spiovente
  M.box(7.6, 3.1, 4.6, mBrick, 0, 1.55, -8.2);
  M.box(7.5, 2.7, 4.5, mPlaster, 0, 4.45, -8.2);
  const rf1 = M.box(8.4, 0.25, 3.4, mRoof, 0, 6.25, -6.9); rf1.rotation.x = 0.42;
  const rf2 = M.box(8.4, 0.25, 3.4, mRoof, 0, 6.25, -9.5); rf2.rotation.x = -0.42;

  // Porta in legno + stipite pietra
  M.box(1.5, 2.45, 0.14, mStone, 0, 1.22, -5.88);
  M.box(1.22, 2.28, 0.16, mWood, 0, 1.14, -5.84);

  // Finestre piano terra & piano primo
  const mVetro = M.emi('#ffe19c', 0.65);
  for (const fx of [-2.4, 2.4]) {
    M.box(1.18, 1.35, 0.14, mWood, fx, 1.85, -5.88);
    M.box(0.95, 1.12, 0.16, mVetro, fx, 1.85, -5.86);
    M.box(1.18, 1.25, 0.14, mWood, fx, 4.45, -5.92);
    M.box(0.95, 1.02, 0.16, mVetro, fx, 4.45, -5.90);
  }
  M.box(1.18, 1.25, 0.14, mWood, 0, 4.45, -5.92);
  M.box(0.95, 1.02, 0.16, mVetro, 0, 4.45, -5.90);

  // Muretti bassi laterali + panchina in legno
  M.box(4.8, 0.95, 0.45, mStone, -4.6, 0.48, -4.2);
  M.box(4.8, 0.95, 0.45, mStone, 4.6, 0.48, -4.2);
  // Panchina in legno sul prato a sinistra
  M.box(1.6, 0.08, 0.55, mWood, -2.5, 0.46, -2.0);
  M.box(1.6, 0.45, 0.08, mWood, -2.5, 0.72, -2.24);
  for (const lx of [-3.15, -1.85]) M.box(0.1, 0.44, 0.48, mStone, lx, 0.22, -2.0);

  if (D.Q.has('quinte')) {
    M.quinta({ tipo: 'rami', x: -0.52, y: 2.26, z: 1.48, lato: -1, scala: 0.90, tronco: true });
    // Angolo muretto fioriera in basso a destra con vaso in terracotta per ancorare la quinta a terra
    M.box(0.58, 0.48, 0.58, mStone, 0.72, 0.24, 1.50);
    M.quinta({ tipo: 'pianta', x: 0.62, y: 0.48, z: 1.48, scala: 1.22, vaso: '#7b4328', colore: '#2f5321', vento: 0.024 });
    // Lanterne sfondo (muretto + portico casa) per dischi di bokeh fuori fuoco
    M.box(0.18, 0.06, 0.18, M.std('#2a2422', 0.5, 0.3), 1.95, 0.98, -4.18);
    const glob = new M.THREE.Mesh(new M.THREE.SphereGeometry(0.085, 12, 10), M.emi('#ffe09e', 1.45));
    glob.position.set(1.95, 1.09, -4.18); M.add(glob);
    M.luceVera({ x: 1.95, y: 1.15, z: -4.18, colore: '#ffd28e', forza: 2.2, dist: 5.0, decadimento: 1.2 });
    const sconce = new M.THREE.Mesh(new M.THREE.SphereGeometry(0.09, 12, 10), M.emi('#ffd98a', 1.35));
    sconce.position.set(-1.55, 2.22, -5.58); M.add(sconce);
  }
}