import { orologio, adattaTesto } from '/web/buon_senso.js';
import { vivo } from '/web/vivi.js';
import { attrezziSpazio, pennaFisher, scatolaNasa } from './oggetti_spazio.js';

function smorza(o) {
  o.traverse(m => {
    if (!m.isMesh) return;
    const ms = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of ms) {
      if (!mat) continue;
      if (mat.roughness !== undefined && mat.roughness < 0.55) mat.roughness = 0.62;
      if (mat.metalness !== undefined && mat.metalness > 0.25) mat.metalness = 0.14;
      if (mat.emissiveIntensity !== undefined && mat.emissiveIntensity > 0.85) mat.emissiveIntensity = 0.82;
    }
  });
  return o;
}

export async function costruisci(M, D, S, OBJ) {
  const { T, mat, tela, dip, sm, cil, grp, into, cartello } = attrezziSpazio(M);
  const X = 4.0, ZF = -3.8, ZB = 4.8, H = 3.0;
  const ZLEN = ZB - ZF + 0.2, ZMID = (ZB + ZF) * 0.5;

  const boxG = (g, w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const o = into(g, sm(w, h, d, m, x, y, z, 0.012));
    if (rx || ry || rz) o.rotation.set(rx, ry, rz);
    return o;
  };
  const cilG = (g, rt, rb, h, m, x, y, z, rx = 0, ry = 0, rz = 0, seg = 20) => {
    const o = into(g, cil(rt, rb, h, m, x, y, z, seg));
    if (rx || ry || rz) o.rotation.set(rx, ry, rz);
    return o;
  };
  const str = (m) => { m.userData.struttura = 1; return m; };

  // ==========================================================
  // 1. MATERIALI ANTI-MOIRE (OFFICINA DI PRECISIONE FISHER)
  // ==========================================================
  const texPavLab = tela(512, 512, (c, W, Hc) => {
    c.fillStyle = '#aeb8c2'; c.fillRect(0, 0, W, Hc);
    const step = 128;
    for (let x = 0; x < W; x += step) {
      for (let y = 0; y < Hc; y += step) {
        c.fillStyle = ((x / step + y / step) % 2 === 0) ? '#b6c0ca' : '#a6b0ba';
        c.fillRect(x + 3, y + 3, step - 6, step - 6);
        c.strokeStyle = 'rgba(72,82,94,0.35)';
        c.lineWidth = 4;
        c.strokeRect(x + 2, y + 2, step - 4, step - 4);
      }
    }
  });
  texPavLab.wrapS = texPavLab.wrapT = T.RepeatWrapping;
  texPavLab.repeat.set(4, 4);
  const mPav = dip(texPavLab, 0.14, 0.78);

  // Rivestimento inferiore a piastrelle smaltate larghe + intonaco officina caldo sopra
  const texMuro = tela(512, 512, (c, W, Hc) => {
    c.fillStyle = '#e8e2d2'; c.fillRect(0, 0, W, Hc);
    // Zoccolatura ceramica bassa a due toni pieni senza righe sottili (anti-tremolio)
    for (let i = 0; i < 4; i++) {
      c.fillStyle = (i % 2 === 0) ? '#d6ded8' : '#ccd5ce';
      c.fillRect(i * 128, Hc * 0.65, 128, Hc * 0.35);
    }
  });
  texMuro.wrapS = texMuro.wrapT = T.RepeatWrapping;
  texMuro.repeat.set(4, 1);

  const mMuro = dip(texMuro, 0.14, 0.88);
  const mQuercia = mat('#986c42', 0.10, 0.72, 0.04);
  const mNoce = mat('#6e4e35', 0.09, 0.75, 0.04);
  const mAcciaio = mat('#8d9aa8', 0.10, 0.64, 0.14);
  const mGhisa = mat('#404c5a', 0.08, 0.72, 0.14);
  const mScuro = mat('#282e38', 0.08, 0.76, 0.10);
  const mOttone = mat('#caa03a', 0.12, 0.62, 0.15);
  const mBluBombola = mat('#2c68b2', 0.12, 0.65, 0.08);
  const mRosso = mat('#d6382c', 0.14, 0.68, 0.05);
  const mVerde = mat('#2e6c44', 0.12, 0.74, 0.04);
  const mCarta = mat('#f4efe0', 0.14, 0.88, 0.02);

  // ==========================================================
  // 2. STRUTTURA CAPANNONE + CAPRIATE E LAMPADE VERDI DA OFFICINA
  // ==========================================================
  str(sm(8.2, 0.14, ZLEN, mPav, 0, -0.065, ZMID, 0));
  str(sm(8.2, H, 0.16, mMuro, 0, H / 2, ZF, 0));
  str(sm(8.2, H, 0.16, mMuro, 0, H / 2, ZB, 0));
  str(sm(0.16, H, ZLEN, mMuro, -X, H / 2, ZMID, 0));
  str(sm(0.16, H, ZLEN, mMuro, X, H / 2, ZMID, 0));
  str(sm(8.2, 0.16, ZLEN, mat('#dcd8cc', 0.14, 0.85, 0), 0, H + 0.08, ZMID, 0));

  // Cornici marcapiano a mezza altezza + travi metalliche soffitto
  str(sm(8.0, 0.06, 0.08, mScuro, 0, 1.05, ZF + 0.10, 0.01));
  str(sm(0.08, 0.06, ZLEN - 0.2, mScuro, -X + 0.10, 1.05, ZMID, 0.01));
  str(sm(0.08, 0.06, ZLEN - 0.2, mScuro, X - 0.10, 1.05, ZMID, 0.01));
  for (const tz of [-2.4, -0.4, 1.6]) {
    str(sm(7.9, 0.12, 0.14, mGhisa, 0, H - 0.06, tz, 0.01));
  }

  // 3 lampadari industriali smaltati verdi appesi al soffitto + ventilatore officina
  const creaSospensione = (lx, lz) => {
    const lg = grp(lx, H, lz);
    str(cilG(lg, 0.012, 0.012, 0.56, mScuro, 0, -0.28, 0));
    str(cilG(lg, 0.08, 0.28, 0.16, mVerde, 0, -0.58, 0));
    const bulb = into(lg, new T.Mesh(new T.SphereGeometry(0.065, 14, 10), M.emi('#fff3cc', 0.82)));
    bulb.position.y = -0.64;
    bulb.userData.struttura = 1;
    M.vita?.aggiungi(lg, 'ondeggia', { amp: 0.015, freq: 0.22, asse: 'z' });
    return lg;
  };
  creaSospensione(-0.95, -1.65);
  creaSospensione(0.95, -1.65);
  creaSospensione(0.0, 0.45);
  smorza(await vivo(M, 'ventilatore_soffitto', { x: -0.35, y: H - 0.02, z: -2.45, s: 1.0 }));

  M.luce('#fff5e0', 3.4, -0.85, 2.25, -1.50, 7.0);
  M.luce('#fff5e0', 3.2, 0.90, 2.25, -1.50, 7.0);
  M.luce('#f6f8ff', 2.6, 0.0, 2.25, 0.70, 7.5);

  // ==========================================================
  // 3. GRANDE PROGETTO BREVETTO FISHER (ZF = -3.8) + SCAFFALI & OROLOGIO
  // ==========================================================
  const bpG = grp(-0.35, 2.02, ZF + 0.11);
  str(boxG(bpG, 3.02, 1.48, 0.06, mNoce, 0, 0, 0));
  const texBlueprint = tela(1024, 512, (c, W, Hc) => {
    c.fillStyle = '#0f3c78'; c.fillRect(0, 0, W, Hc);
    // Bordo tecnico bianco a doppia linea con margini generosi (0% taglio testi!)
    c.strokeStyle = 'rgba(235,248,255,0.85)'; c.lineWidth = 4;
    c.strokeRect(18, 18, W - 36, Hc - 36);
    c.lineWidth = 1.5;
    c.strokeRect(26, 26, W - 52, Hc - 52);

    // Intestazioni superiori ben distanziate dai bordi
    c.fillStyle = '#e6f4ff'; c.font = 'bold 26px monospace'; c.textAlign = 'left';
    c.fillText('U.S. PATENT #3,285,228', 46, 62);
    c.textAlign = 'right';
    c.fillStyle = '#ffe478';
    c.fillText('MODEL AG-7  SPACE PEN', W - 46, 62);

    // Schema spaccato centrale della cartuccia pressurizzata
    const cy = 225;
    // Corpo esterno penna
    c.strokeStyle = '#ffffff'; c.lineWidth = 4;
    c.strokeRect(175, cy - 42, 620, 84);
    // Punta e sfera in carburo di tungsteno
    c.beginPath();
    c.moveTo(175, cy - 42); c.lineTo(105, cy - 10); c.lineTo(105, cy + 10); c.lineTo(175, cy + 42);
    c.stroke();
    c.fillStyle = '#ffe478'; c.beginPath(); c.arc(98, cy, 10, 0, Math.PI * 2); c.fill();

    // Camera inchiostro tissotropico (sinistra-centro)
    c.fillStyle = 'rgba(54,158,255,0.55)'; c.fillRect(190, cy - 28, 300, 56);
    // Pistone flottante di separazione
    c.fillStyle = '#ffd248'; c.fillRect(492, cy - 32, 26, 64);
    // Camera azoto N2 compresso (destra)
    c.fillStyle = 'rgba(255,112,72,0.42)'; c.fillRect(522, cy - 28, 255, 56);

    // Frecce e didascalie chiare e staccate dal disegno
    c.fillStyle = '#ffffff'; c.font = 'bold 20px sans-serif'; c.textAlign = 'center';
    c.fillText('TUNGSTEN', 112, cy - 72);
    c.fillText('BALL', 112, cy - 48);
    c.fillText('THIXOTROPIC INK', 340, cy - 68);
    c.fillText('PISTON', 505, cy + 78);
    c.fillStyle = '#ffba82';
    c.fillText('N2 GAS  (35 PSI  PRESSURIZED)', 650, cy - 68);

    // Cartiglio tecnico inferiore
    c.fillStyle = '#092852'; c.fillRect(28, Hc - 78, W - 56, 48);
    c.fillStyle = '#d4ecff'; c.font = 'bold 23px sans-serif'; c.textAlign = 'center';
    c.fillText('PAUL C. FISHER PRECISION LABS  —  ZERO-GRAVITY SEALED CARTRIDGE', W / 2, Hc - 47);
  });
  const bpPlane = into(bpG, new T.Mesh(new T.PlaneGeometry(2.86, 1.32), dip(texBlueprint, 0.22, 0.78)));
  bpPlane.position.z = 0.036;
  bpPlane.userData.noRick = 1;
  bpPlane.userData.scritta = 1;

  // Orologio d'officina + scaffalatura campioni accanto al blueprint
  orologio(M, { x: 2.30, y: 2.38, z: ZF + 0.11, r: 0.22, ora: '14:25', cornice: '#364454' });

  // Scaffale industriale aperto a 4 montanti con campioni e boccette sulla parete fondo sinistra (x = -2.88, z = -3.45)
  const scaff = grp(-2.88, 0, -3.45);
  for (const sx of [-0.60, 0.60]) {
    for (const sz of [-0.20, 0.20]) {
      str(boxG(scaff, 0.045, 2.20, 0.045, mGhisa, sx, 1.10, sz));
    }
  }
  str(boxG(scaff, 1.24, 2.16, 0.025, mScuro, 0, 1.10, -0.21));
  for (const sy of [0.10, 0.55, 1.15, 1.75, 2.20]) {
    boxG(scaff, 1.22, 0.036, 0.42, mQuercia, 0, sy, 0);
  }
  // Boccette di inchiostro colorato, provette e cassette prototipi bene in vista sui ripiani
  for (let i = 0; i < 4; i++) {
    cilG(scaff, 0.055, 0.06, 0.18, i % 2 === 0 ? mBluBombola : mRosso, -0.38 + i * 0.24, 1.26, 0.03);
    cilG(scaff, 0.03, 0.03, 0.04, mScuro, -0.38 + i * 0.24, 1.37, 0.03);
  }
  boxG(scaff, 0.42, 0.20, 0.28, mVerde, -0.25, 1.87, 0.02);
  boxG(scaff, 0.36, 0.24, 0.26, mAcciaio, 0.28, 1.89, 0.02);
  boxG(scaff, 0.48, 0.22, 0.30, mNoce, 0.0, 0.68, 0.02);

  // Porta vetrata officina + cartello sicurezza gas (parete destra)
  const portaLab = await vivo(M, 'porta_battente', { x: X - 0.09, y: 0, z: 0.75, ry: -Math.PI / 2, s: 1.0 });
  smorza(portaLab);
  const tagWarn = cartello('WARNING: N2 PRESSURIZED TESTING', 0.85, 0.22, X - 0.11, 2.35, 0.75, -Math.PI / 2, {
    fondo: '#e6b82a', colore: '#181a1f', bordo: '#22262e', px: 300, righe: 1
  });
  tagWarn.traverse(o => { o.userData.struttura = 1; });

  // ==========================================================
  // 4. BANCO DA LAVORO IN QUERCIA E ACCIAIO (z = -2.35 .. -1.30, y = 0.86)
  // ==========================================================
  // Paul Fisher è davanti a (-0.4, -1.2) SOLO nella Scena 9; nelle Scene 10-12 i macro vedono i pezzi appoggiati qui!
  const banco = grp(0, 0, -1.82);
  // Piano massiccio butcher-block unico 3.52m x 1.06m (z mondo: -2.35 .. -1.29, y = 0.74..0.86: niente giunzioni sottili sottopiano!)
  const pianoBanco = str(boxG(banco, 3.52, 0.12, 1.06, mQuercia, 0, 0.80, 0));
  pianoBanco.castShadow = false;
  // Zampe robuste d'acciaio e ripiano inferiore con cassette attrezzi
  for (const lx of [-1.62, -0.55, 0.55, 1.62]) {
    for (const lz of [-0.42, 0.42]) {
      str(boxG(banco, 0.075, 0.74, 0.075, mGhisa, lx, 0.37, lz));
    }
  }
  str(boxG(banco, 3.30, 0.04, 0.90, mAcciaio, 0, 0.20, 0));
  // Tre cassetti sottopiano con maniglie in ottone
  for (const dx of [-1.10, 0, 1.10]) {
    boxG(banco, 0.92, 0.16, 0.44, mNoce, dx, 0.64, 0.26);
    boxG(banco, 0.18, 0.025, 0.03, mOttone, dx, 0.64, 0.495);
  }
  // Cassette porta-attrezzi e flaconi industriali sul ripiano inferiore
  boxG(banco, 0.52, 0.20, 0.30, mRosso, -1.10, 0.32, 0.08);
  boxG(banco, 0.44, 0.18, 0.28, mScuro, 1.05, 0.31, 0.06);

  // Morsa da banco in ghisa fissata sul lato sinistro del tavolo (into(banco, ...)!)
  const morsa = into(banco, new T.Group());
  morsa.position.set(-1.42, 0.86, 0.38);
  boxG(morsa, 0.22, 0.14, 0.22, mGhisa, 0, 0.07, 0);
  boxG(morsa, 0.20, 0.12, 0.05, mAcciaio, 0, 0.16, 0.06);
  boxG(morsa, 0.20, 0.12, 0.05, mAcciaio, 0, 0.16, -0.05);
  cilG(morsa, 0.012, 0.012, 0.26, mAcciaio, 0.12, 0.11, 0.06, 0, 0, Math.PI / 2);

  // Lampada snodabile da banco sul lato sinistro per illuminare i dettagli macro
  const lampBanco = into(banco, new T.Group());
  lampBanco.position.set(-1.02, 0.86, -0.32);
  cilG(lampBanco, 0.11, 0.12, 0.035, mScuro, 0, 0.018, 0);
  cilG(lampBanco, 0.015, 0.018, 0.44, mAcciaio, -0.02, 0.24, 0.02, 0.25, 0, -0.2);
  const cappaL = cilG(lampBanco, 0.045, 0.12, 0.11, mVerde, 0.06, 0.43, 0.12, 0.55, 0, -0.25);
  void cappaL;
  const bulbBanco = into(lampBanco, new T.Mesh(new T.SphereGeometry(0.036, 10, 8), M.emi('#fff0ba', 0.78)));
  bulbBanco.position.set(0.06, 0.38, 0.13);
  M.luce('#fff0cc', 1.75, -0.45, 1.65, -1.52, 3.5);

  // ==========================================================
  // 5. HERO BENCH PROPS (OBJ.scatola_nasa, OBJ.penna_spaccato, LE 3 PROVE ESTREME)
  // ==========================================================
  // Marca banco, scaffale, cassettiera e blueprint frame come struttura fissa
  bpPlane.userData.struttura = 1;
  scaff.traverse(o => { if (o.isMesh) o.userData.struttura = 1; });
  banco.traverse(o => { if (o.isMesh && o !== bulbBanco) o.userData.struttura = 1; });

  // 5A. SCENA 12 (prezzo_nasa): OBJ.scatola_nasa arretrata/dimensionata così "$ 2.95" e box blu stanno interi nel quadro!
  const zonaPrezzo = grp(-0.46, 0.86, -1.55, 0.08);
  str(boxG(zonaPrezzo, 0.36, 0.01, 0.28, mVerde, 0, 0.005, 0));
  const scatolaN = smorza(scatolaNasa(M, { x: -0.46, y: 0.87, z: -1.55, ry: 0.08, s: 0.68 }));
  scatolaN.userData.vivo = 1;
  M.vita?.aggiungi(scatolaN, 'ondeggia', { amp: 0.010, freq: 0.35, asse: 'y' });
  OBJ.scatola_nasa = scatolaN;
  // Lente d'ingrandimento in ottone posata a sinistra della scatola
  const lenteG = into(zonaPrezzo, new T.Group());
  lenteG.position.set(-0.14, 0.02, 0.07);
  const anelloLente = into(lenteG, new T.Mesh(new T.TorusGeometry(0.036, 0.007, 10, 24), mOttone));
  anelloLente.rotation.x = Math.PI / 2;
  cilG(lenteG, 0.009, 0.011, 0.08, mNoce, 0.04, -0.004, 0.04, Math.PI / 2, 0, -0.7);
  lenteG.traverse(o => { o.userData.struttura = 1; });

  // 5B. SCENA 10 (spaccato_azoto): OBJ.penna_spaccato smorzata contro riflessi bianchi
  const cullaPenna = grp(0.04, 0.86, -1.40, -0.04);
  str(boxG(cullaPenna, 0.34, 0.024, 0.14, mNoce, 0, 0.012, 0));
  str(boxG(cullaPenna, 0.028, 0.052, 0.07, mOttone, -0.11, 0.048, 0));
  str(boxG(cullaPenna, 0.028, 0.052, 0.07, mOttone, 0.11, 0.048, 0));
  const pennaSpaccato = smorza(pennaFisher(M, { x: 0.04, y: 0.935, z: -1.40, rx: 0.0, ry: -0.04, rz: Math.PI / 2, s: 1.15, spaccato: true }));
  M.vita?.aggiungi(pennaSpaccato, 'vibra', { amp: 0.0025, freq: 1.4 });
  OBJ.penna_spaccato = pennaSpaccato;

  // Targhetta compatta e contrassegnata struttura (traverse completo sui figli cartello)
  const tagSpaccato = cartello('AG-7  •  35 PSI N2 CARTRIDGE', 0.22, 0.046, 0.04, 0.885, -1.32, -0.04, {
    fondo: '#1a2434', colore: '#ffe47a', bordo: '#c8a040', px: 220, righe: 1
  });
  tagSpaccato.rotation.x = -0.62;
  tagSpaccato.traverse(o => { o.userData.struttura = 1; });

  // 5C. SCENA 11 (tre_prove): Le 3 prove estreme tutte APPOGGIATE SUL BANCO (z mondo = -1.80!)
  // PROVA 1: Scrittura a testa in giù (world x=+0.28, y=0.86, z=-1.80)
  const provaSu = grp(0.28, 0.86, -1.80, -0.12);
  str(boxG(provaSu, 0.24, 0.02, 0.20, mGhisa, 0, 0.01, 0));
  str(cilG(provaSu, 0.014, 0.016, 0.42, mAcciaio, -0.08, 0.22, -0.04));
  str(boxG(provaSu, 0.22, 0.018, 0.03, mAcciaio, 0, 0.40, 0));
  str(boxG(provaSu, 0.20, 0.022, 0.16, mCarta, 0.02, 0.37, 0.02));
  const pennaSu = smorza(pennaFisher(M, { x: 0.02, y: 0.23, z: 0.02, rx: 0, ry: 0, rz: 0, s: 0.92, spaccato: false }));
  into(provaSu, pennaSu);
  pennaSu.userData.vivo = 1;
  M.vita?.aggiungi(pennaSu, 'vibra', { amp: 0.008, freq: 2.4 });
  const tagP1 = cartello('UPSIDE DOWN', 0.20, 0.048, 0, 0.045, 0.11, 0, {
    fondo: '#1d2d44', colore: '#f0f6ff', bordo: '#7aa4d6', px: 190, righe: 1
  });
  tagP1.rotation.x = -0.55;
  tagP1.traverse(o => { o.userData.struttura = 1; });
  into(provaSu, tagP1);

  // PROVA 2: Ghiaccio criogenico (-45°C) con vapore freddo animato senza aloni neri (world x=+0.64, y=0.86, z=-1.82)
  const provaGhiaccio = grp(0.64, 0.86, -1.82, -0.15);
  str(boxG(provaGhiaccio, 0.28, 0.035, 0.26, mAcciaio, 0, 0.018, 0));
  const mGhiaccio = new T.MeshStandardMaterial({
    color: '#9ee8ff', roughness: 0.22, metalness: 0.05, transparent: true, opacity: 0.72
  });
  str(boxG(provaGhiaccio, 0.20, 0.14, 0.18, mGhiaccio, 0, 0.10, -0.01, 0.02, 0.12));
  str(cilG(provaGhiaccio, 0.008, 0.008, 0.18, mAcciaio, 0.10, 0.12, -0.06));
  const texTermo = tela(128, 128, (c, W, Hc) => {
    c.fillStyle = '#f8f6ee'; c.beginPath(); c.arc(W / 2, Hc / 2, W * 0.46, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#1b5078'; c.lineWidth = 6; c.stroke();
    c.fillStyle = '#0c467a'; c.font = 'bold 28px sans-serif'; c.textAlign = 'center';
    c.fillText('-45°', W / 2, Hc * 0.68);
    c.strokeStyle = '#d42c24'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(W / 2, Hc / 2); c.lineTo(W * 0.28, Hc * 0.34); c.stroke();
  });
  const quadrTermo = into(provaGhiaccio, new T.Mesh(new T.CircleGeometry(0.048, 20), dip(texTermo, 0.2, 0.8)));
  quadrTermo.position.set(0.10, 0.22, -0.048);
  quadrTermo.userData.scritta = 1;
  quadrTermo.userData.struttura = 1;
  const pennaGhiaccio = smorza(pennaFisher(M, { x: -0.02, y: 0.21, z: 0.02, rx: 0.22, ry: 0, rz: -0.45, s: 0.88 }));
  into(provaGhiaccio, pennaGhiaccio);
  M.vita?.aggiungi(pennaGhiaccio, 'vibra', { amp: 0.004, freq: 1.8 });
  const tagP2 = cartello('-45°C FREEZE', 0.20, 0.048, 0, 0.045, 0.14, 0, {
    fondo: '#16466c', colore: '#d4f6ff', bordo: '#72d2f8', px: 190, righe: 1
  });
  tagP2.rotation.x = -0.55;
  tagP2.traverse(o => { o.userData.struttura = 1; });
  into(provaGhiaccio, tagP2);

  // Sbuffi di vapore freddo sopra il ghiaccio (userData.noInk=1 elimina i contorni neri!)
  const nebbiaG = into(provaGhiaccio, new T.Group());
  nebbiaG.position.set(0, 0.19, 0);
  const puffGhiaccio = [];
  const mNebbia = new T.MeshBasicMaterial({ color: '#e6f8ff', transparent: true, opacity: 0.35, depthWrite: false });
  for (let i = 0; i < 4; i++) {
    const p = into(nebbiaG, new T.Mesh(new T.SphereGeometry(0.028 + i * 0.006, 8, 8), mNebbia.clone()));
    p.position.x = (i - 1.5) * 0.032;
    p.userData.noInk = 1;
    p.userData.noRick = 1;
    p.userData.vivo = 1;
    puffGhiaccio.push(p);
  }

  // PROVA 3: Piastra rovente (+200°C) con spira incandescente e vapore (world x=+1.00, y=0.86, z=-1.84)
  const provaCaldo = grp(1.00, 0.86, -1.84, -0.18);
  str(boxG(provaCaldo, 0.28, 0.09, 0.26, mScuro, 0, 0.045, 0));
  str(cilG(provaCaldo, 0.105, 0.105, 0.018, mGhisa, 0, 0.098, 0));
  const spira = into(provaCaldo, new T.Mesh(new T.TorusGeometry(0.068, 0.010, 8, 24), M.emi('#ff6a22', 0.80)));
  spira.rotation.x = Math.PI / 2;
  spira.position.y = 0.109;
  M.vita?.aggiungi(spira, 'lampeggia', { min: 0.65, freq: 1.5, modo: 'respiro' });
  str(cilG(provaCaldo, 0.022, 0.022, 0.025, mRosso, 0.08, 0.045, 0.135, Math.PI / 2));
  const pennaCalda = smorza(pennaFisher(M, { x: 0, y: 0.165, z: 0, rx: 0, ry: 0.25, rz: Math.PI / 2 - 0.15, s: 0.88 }));
  into(provaCaldo, pennaCalda);
  M.vita?.aggiungi(pennaCalda, 'vibra', { amp: 0.004, freq: 2.0 });
  const tagP3 = cartello('+200°C HEAT', 0.20, 0.048, 0, 0.045, 0.145, 0, {
    fondo: '#6e1e12', colore: '#ffe8d4', bordo: '#f27848', px: 190, righe: 1
  });
  tagP3.rotation.x = -0.55;
  tagP3.traverse(o => { o.userData.struttura = 1; });
  into(provaCaldo, tagP3);
  M.luce('#ff7234', 1.1, 1.00, 1.15, -1.80, 2.0);

  // Vapore di calore sopra la piastra (userData.noInk=1 per nebbia liscia!)
  const caloreG = into(provaCaldo, new T.Group());
  caloreG.position.set(0, 0.14, 0);
  const puffCaldo = [];
  const mVap = new T.MeshBasicMaterial({ color: '#fff2e4', transparent: true, opacity: 0.30, depthWrite: false });
  for (let i = 0; i < 4; i++) {
    const p = into(caloreG, new T.Mesh(new T.SphereGeometry(0.022 + i * 0.006, 8, 8), mVap.clone()));
    p.position.x = Math.sin(i * 1.4) * 0.035;
    p.userData.noInk = 1;
    p.userData.noRick = 1;
    p.userData.vivo = 1;
    puffCaldo.push(p);
  }

  // Bombola N2, Pegboard e cassettiera segnati come struttura d'ambiente
  // Bombola e tubo seguono sotto...

  // ==========================================================
  // 6. BOMBOLA AZOTO N2 ACCANTO AL BANCO + TUBO COLLEGATO + PEGBOARD & TORNO
  // ==========================================================
  // Bombola N2 a terra sul fianco destro del banco (x = +1.98, z = -1.80) con catenella e riduttore!
  const bombola = grp(1.98, 0, -1.80);
  str(boxG(bombola, 0.44, 0.05, 0.44, mScuro, 0, 0.025, 0)); // pedana supporto
  cilG(bombola, 0.16, 0.16, 1.25, mBluBombola, 0, 0.67, 0);
  const calottaB = into(bombola, new T.Mesh(new T.SphereGeometry(0.16, 18, 12), mBluBombola));
  calottaB.position.y = 1.30;
  cilG(bombola, 0.04, 0.05, 0.12, mOttone, 0, 1.49, 0); // valvola in ottone
  cilG(bombola, 0.06, 0.06, 0.02, mRosso, 0, 1.56, 0);  // volantino rosso
  cilG(bombola, 0.042, 0.042, 0.025, mCarta, 0.08, 1.49, 0.03, Math.PI / 2); // manometro 35 PSI
  into(bombola, cartello('NITROGEN N2\n35 PSI', 0.28, 0.16, 0, 0.88, 0.168, 0, {
    fondo: '#f2ecdc', colore: '#122848', bordo: '#2c68b2', px: 200, righe: 2
  }));
  // Tubo nero flessibile dal riduttore della bombola direttamente al banco prove (x=1.42, y=0.88, z=-1.82)!
  const tuboN2 = new T.TubeGeometry(new T.CatmullRomCurve3([
    new T.Vector3(1.94, 1.48, -1.78),
    new T.Vector3(1.80, 1.22, -1.80),
    new T.Vector3(1.62, 0.94, -1.82),
    new T.Vector3(1.36, 0.89, -1.82)
  ]), 18, 0.016, 8, false);
  const tuboMesh = new T.Mesh(tuboN2, mScuro);
  tuboMesh.userData.struttura = 1;
  M.root.add(tuboMesh);
  str(boxG(banco, 0.14, 0.07, 0.10, mOttone, 1.34, 0.895, 0.0));
  bombola.traverse(o => { if (o.isMesh) o.userData.struttura = 1; });

  // Parete sinistra: pannello forato portattrezzi (Pegboard) con chiavi e cacciaviti
  const pegG = grp(-X + 0.12, 1.72, -1.45, Math.PI / 2);
  boxG(pegG, 1.48, 0.92, 0.04, mQuercia, 0, 0, 0);
  boxG(pegG, 1.38, 0.82, 0.02, mNoce, 0, 0, 0.02);
  for (let i = 0; i < 5; i++) {
    boxG(pegG, 0.032, 0.26 - i * 0.025, 0.018, mAcciaio, -0.52 + i * 0.13, 0.12, 0.04);
    cilG(pegG, 0.018, 0.018, 0.09, i % 2 === 0 ? mRosso : mOttone, 0.18 + i * 0.10, -0.05, 0.04);
    cilG(pegG, 0.006, 0.006, 0.14, mAcciaio, 0.18 + i * 0.10, -0.16, 0.04);
  }
  pegG.traverse(o => { if (o.isMesh) o.userData.struttura = 1; });

  // Cassettiera rossa officina + flaconi sopra (liberi dalla visuale centrale!)
  const cassettiera = grp(-2.85, 0, -1.45, 0.25);
  str(boxG(cassettiera, 0.78, 0.96, 0.52, mRosso, 0, 0.48, 0));
  for (let r = 0; r < 5; r++) {
    boxG(cassettiera, 0.70, 0.14, 0.02, mAcciaio, 0, 0.16 + r * 0.17, 0.265);
    boxG(cassettiera, 0.24, 0.022, 0.025, mScuro, 0, 0.16 + r * 0.17, 0.285);
  }
  cilG(cassettiera, 0.06, 0.06, 0.18, mBluBombola, -0.18, 1.05, 0.05);
  boxG(cassettiera, 0.28, 0.03, 0.18, mCarta, 0.16, 0.975, 0.05);
  cassettiera.traverse(o => { if (o.isMesh) o.userData.struttura = 1; });

  // ==========================================================
  // 7. VITA CONTINUA (pistone N2 + vapore ghiaccio/caldo + moto scrittura)
  // ==========================================================
  (M.tick = M.tick || []).push(t => {
    // Micro movimento di scrittura sulla penna a testa in giù (prova zero-G)
    pennaSu.position.x = 0.02 + Math.sin(t * 5.2) * 0.012;
    pennaSu.position.z = 0.02 + Math.cos(t * 4.4) * 0.010;

    // Micro spinta pulsante sul pistone nello spaccato (Scena 10)
    if (pennaSpaccato.userData.pistone) {
      if (pennaSpaccato.userData.pistoneY0 === undefined) {
        pennaSpaccato.userData.pistoneY0 = pennaSpaccato.userData.pistone.position.y;
      }
      pennaSpaccato.userData.pistone.position.y =
        pennaSpaccato.userData.pistoneY0 + Math.sin(t * 2.8) * 0.008;
    }

    // Vapore freddo discendente/morbido sopra il blocco di ghiaccio (-45°C)
    for (let i = 0; i < puffGhiaccio.length; i++) {
      const p = puffGhiaccio[i];
      const u = ((t * 0.42 + i * 0.25) % 1);
      p.position.y = u * 0.14;
      p.position.x = (i - 1.5) * 0.03 + Math.sin(t * 1.8 + i) * 0.015;
      p.scale.setScalar(0.8 + u * 0.9);
      p.material.opacity = 0.34 * (1 - u);
    }

    // Sbuffi caldi ascendenti sopra la piastra (+200°C)
    for (let i = 0; i < puffCaldo.length; i++) {
      const p = puffCaldo[i];
      const u = ((t * 0.65 + i * 0.25) % 1);
      p.position.y = u * 0.24;
      p.position.x = Math.sin(t * 3.1 + i * 2) * 0.022;
      p.scale.setScalar(0.65 + u * 0.85);
      p.material.opacity = 0.30 * (1 - u);
    }
  });
}
