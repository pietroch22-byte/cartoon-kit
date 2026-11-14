// Vicolo del borgo italiano di notte (scheda luogo: mondo_vicolo.md). Esterno con case a 3 piani, stendipanni e campanile.
import { orologio, cartello } from '/web/buon_senso.js';
import { vapore } from '/web/vivo.js';
import { animato } from '/web/animati.js';
import { attrezzi, bici, piccioni, geraniVaso, lampioneStrada, pianta, comparsa, tegliaLasagna } from '/scena/oggetti_storia.js';

export async function costruisci(M, D, S, OBJ) {
  const { T, mat, tela, dip, sm, cil, grp, into, insegna } = attrezzi(M);
  const str = m => {
    if (m.traverse) m.traverse(c => { c.userData.struttura = 1; });
    m.userData.struttura = 1;
    return m;
  };

  /* 1. PAVIMENTAZIONE ACCIOTTOLATA, MARCIAPIEDI LATERALI E FONDO PIAZZA */
  const texBasoli = tela(512, 512, (g, W, H) => {
    g.fillStyle = '#484e60'; g.fillRect(0, 0, W, H);
    const cols = ['#666e86', '#727a94', '#5c647c', '#6e6a7e', '#78809a'];
    const rows = 8, cw = W / 6, rh = H / rows;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * (cw * 0.5);
      for (let c = -1; c <= 6; c++) {
        g.fillStyle = cols[(r * 7 + c * 3 + 10) % cols.length];
        g.beginPath();
        g.roundRect(c * cw + off + 5, r * rh + 5, cw - 10, rh - 10, 12);
        g.fill();
      }
    }
  });
  texBasoli.wrapS = texBasoli.wrapT = T.RepeatWrapping;
  texBasoli.repeat.set(2, 11);
  str(M.box(5.0, 0.04, 34, dip(texBasoli, 0.20, 0.88), 0, -0.002, -6));

  /* Cordoli laterali stretti (±1.94..±2.48) così x in [-1.90..+1.90] resta libero per attori e porte */
  const mPietra = mat('#9a9284', 0.18, 0.88);
  str(M.box(0.56, 0.08, 30, mPietra, -2.20, 0.04, -5.5));
  str(M.box(0.56, 0.08, 30, mPietra, 2.20, 0.04, -5.5));
  str(M.box(26, 0.08, 14, dip(texBasoli, 0.14, 0.90), 0, -0.02, -26));

  /* 2. QUINTE ARCHITETTONICHE CONTINUE SU ENTRAMBI I LATI (z = +8.5 fino a z = -19.5) */
  const caseSpecs = [
    { x: -2.4, z: 4.5, d: 6.2, h: 9.2, col: '#d4845a', tet: '#a84836', zoc: '#8c6a52', side: -1 },
    { x: -2.4, z: -1.6, d: 6.0, h: 10.4, col: '#dfad64', tet: '#b4563c', zoc: '#967c64', side: -1 },
    { x: -2.4, z: -7.5, d: 5.8, h: 9.6, col: '#c87252', tet: '#9e4434', zoc: '#806452', side: -1 },
    { x: -2.4, z: -13.4, d: 6.0, h: 10.8, col: '#9e9c78', tet: '#a84c38', zoc: '#746c5c', side: -1 },
    { x: 2.4, z: 4.5, d: 6.2, h: 9.8, col: '#dc9a68', tet: '#ad5038', zoc: '#8e6e58', side: 1 },
    { x: 2.4, z: -1.6, d: 6.0, h: 9.2, col: '#cc6f54', tet: '#9c4334', zoc: '#7c5d4e', side: 1 },
    { x: 2.4, z: -7.5, d: 5.8, h: 10.6, col: '#dec082', tet: '#b05238', zoc: '#8c7a62', side: 1 },
    { x: 2.4, z: -13.4, d: 6.0, h: 9.5, col: '#c67c5c', tet: '#a24a36', zoc: '#7c6252', side: 1 }
  ];
  const mScur = mat('#3f6b46', 0.14, 0.80);
  const mVetroNotte = M.emi('#ffd994', 0.78);
  const mVetroSpento = mat('#323c52', 0.14, 0.68);
  const mLegnoS = mat('#664026', 0.14, 0.82);

  for (const c of caseSpecs) {
    const bw = 4.6, cx = c.x + c.side * (bw / 2);
    const palazzo = grp(cx, 0, c.z, 0);
    str(palazzo);
    const muro = M.box(bw, c.h, c.d - 0.06, mat(c.col, 0.16, 0.88), 0, c.h / 2, 0);
    palazzo.add(muro);
    const zocc = M.box(bw + 0.06, 1.35, c.d - 0.04, mat(c.zoc, 0.14, 0.9), 0, 0.68, 0);
    palazzo.add(zocc);
    const corn = M.box(bw + 0.34, 0.24, c.d + 0.04, mat('#d8c8ae', 0.16, 0.86), -c.side * 0.1, c.h - 0.12, 0);
    palazzo.add(corn);
    const fascia = M.box(bw + 0.14, 0.16, c.d, mat('#d2c2a8', 0.14, 0.86), -c.side * 0.04, 3.15, 0);
    palazzo.add(fascia);
    const tetto = new T.Mesh(new T.BoxGeometry(bw + 0.6, 0.75, c.d + 0.2), mat(c.tet, 0.16, 0.85));
    tetto.position.set(-c.side * 0.12, c.h + 0.36, 0);
    tetto.rotation.z = c.side * 0.16;
    str(tetto);
    palazzo.add(tetto);

    /* Pluviale verticale in rame scuro sul bordo */
    const gronda = cil(0.045, 0.045, c.h - 0.3, mat('#544038', 0.12, 0.7), -c.side * (bw / 2 + 0.05), c.h / 2, c.d * 0.44, 8);
    gronda.castShadow = false;
    str(gronda);
    palazzo.add(gronda);

    /* Finestre ai piani superiori (2° e 3° piano, molte accese e con gerani) */
    const fx = -c.side * (bw / 2 + 0.03);
    for (const fy of [4.2, 7.1]) {
      for (const fz of [-1.45, 1.45]) {
        const wAbs = c.z + fz;
        const skipObj = fy < 5 && (Math.abs(wAbs - (-2.5)) < 0.9 || Math.abs(wAbs - (-3.5)) < 0.9 || Math.abs(wAbs - (-8.5)) < 0.9 || Math.abs(wAbs - (-9.5)) < 0.9);
        if (skipObj) continue;
        const acce = ((Math.round(c.z + fy + fz * 3) % 3) !== 0);
        const fG = grp(c.x - c.side * 0.02, fy, wAbs, c.side > 0 ? -Math.PI / 2 : Math.PI / 2);
        into(fG, sm(0.86, 1.18, 0.06, mat('#d6c6ac', 0.16), 0, 0, 0, 0.01));
        const vet = new T.Mesh(new T.PlaneGeometry(0.66, 0.96), acce ? mVetroNotte : mVetroSpento);
        vet.position.z = 0.035;
        fG.add(vet);
        for (const sx of [-0.52, 0.52]) {
          const ps = sm(0.30, 1.04, 0.045, mScur, sx, 0, 0.04, 0.01);
          ps.castShadow = false;
          fG.add(ps);
        }
        into(fG, sm(0.96, 0.08, 0.18, mPietra, 0, -0.62, 0.08, 0.015));
        str(fG);
        if (fy < 5 && fz > 0) {
          geraniVaso(M, { x: c.x - c.side * 0.14, y: fy - 0.56, z: wAbs, ry: c.side > 0 ? -Math.PI / 2 : Math.PI / 2, w: 0.62, s: 0.65, nome: `gerani_${c.side}_${Math.round(wAbs)}` });
        }
      }
    }
  }

  /* Muro e arco di ingresso alle spalle (z = +8.5) così la vista opposta non mostra mai il vuoto */
  str(M.box(4.8, 7.5, 1.4, mat('#b46b4c', 0.16, 0.88), -4.2, 3.75, 8.8));
  str(M.box(4.8, 7.5, 1.4, mat('#cca06c', 0.16, 0.88), 4.2, 3.75, 8.8));
  str(M.box(5.6, 2.2, 1.4, mat('#c88662', 0.16, 0.88), 0, 6.4, 8.8));
  str(M.box(16, 4.2, 1.2, mat('#8c6c56', 0.14, 0.90), 0, 2.1, 13.5));

  /* Arco in fondo al vicolo (z = -17.4) + Campanile in mattoni a sinistra con orologio 21:00 */
  const mArco = mat('#a64d38', 0.16, 0.86);
  str(M.box(1.1, 4.6, 1.4, mArco, -2.15, 2.3, -17.4));
  str(M.box(1.1, 4.6, 1.4, mArco, 2.15, 2.3, -17.4));
  str(M.box(5.6, 1.6, 1.4, mArco, 0, 5.2, -17.4));
  str(M.box(5.8, 0.22, 1.55, mPietra, 0, 6.08, -17.4));

  const camp = grp(-1.8, 0, -20.0, 0, 'campanile_borgo');
  const mMatt = mat('#a44b38', 0.16, 0.88);
  into(camp, str(M.box(3.4, 15.2, 3.4, mMatt, 0, 7.6, 0)));
  into(camp, str(M.box(3.7, 0.35, 3.7, mPietra, 0, 11.2, 0)));
  into(camp, str(M.box(3.7, 0.35, 3.7, mPietra, 0, 15.2, 0)));
  const cusp = new T.Mesh(new T.ConeGeometry(2.65, 3.6, 4), mat('#92402e', 0.16, 0.85));
  cusp.rotation.y = Math.PI / 4;
  cusp.position.y = 17.0;
  str(cusp);
  camp.add(cusp);
  /* Cella campanaria calda illuminata */
  const cella = new T.Mesh(new T.BoxGeometry(1.7, 2.1, 3.55), M.emi('#ffcf86', 0.65));
  cella.position.y = 14.0;
  camp.add(cella);
  const campana = new T.Mesh(new T.CylinderGeometry(0.28, 0.52, 0.72, 14), mat('#987236', 0.18, 0.65));
  campana.position.y = 14.2;
  camp.add(campana);
  orologio(M, { x: -1.8, y: 12.5, z: -18.26, r: 0.92, ora: '21:00', romani: true, cornice: '#6e4028' });

  /* Edificio caldo nello sfondo oltre l'arco (chiude la prospettiva verso la piazza) */
  str(M.box(24, 12, 4, mat('#d8be98', 0.16, 0.88), 1.5, 6, -29));
  for (const fx of [-3.5, 0.5, 4.5, 8.5]) {
    const f = new T.Mesh(new T.PlaneGeometry(1.1, 1.5), mVetroNotte);
    f.position.set(fx, 5.5, -26.95);
    M.root.add(f);
  }

  /* 3. PORTONI PIANO TERRA, BOTTEGA "ALIMENTARI DA ROSA" E FINESTRE SCENA 5 */
  /* Portone Casa Nonna (sinistra, z = 2.5) */
  const portaN = grp(-2.33, 0, 2.5, Math.PI / 2, 'portone_casa_nonna');
  into(portaN, sm(1.22, 2.38, 0.12, mPietra, 0, 1.19, 0, 0.02));
  into(portaN, sm(0.96, 2.20, 0.08, mLegnoS, 0, 1.12, 0.03, 0.015));
  into(portaN, sm(0.08, 0.18, 0.06, mat('#d4a63c', 0.22), 0.34, 1.05, 0.08, 0.01));
  str(portaN);
  cartello(M, { testo: 'CASA PINA', x: -2.26, y: 1.55, z: 3.35, ry: Math.PI / 2, w: 0.52, h: 0.20, fondo: '#e8d8b2', colore: '#4a2416', bordo: '#6e4026', righe: 1 }).name = 'targa_nonna';
  sm(0.42, 1.18, 0.28, mLegnoS, -2.14, 0.59, 0.65, 0.02, 'panca_nonna');
  pianta(M, { x: -2.08, z: 3.75, s: 1.0, vaso: '#b85a38', foglie: '#4a8e3a', nome: 'pianta_porta_nonna' });

  /* Portone + Finestra Vicina (destra, z = 2.5): OBJ.finestra_vicina */
  const portaV = grp(2.33, 0, 1.05, -Math.PI / 2, 'portone_vicina');
  into(portaV, sm(1.18, 2.32, 0.12, mPietra, 0, 1.16, 0, 0.02));
  into(portaV, sm(0.92, 2.15, 0.08, mat('#5c422c', 0.15), 0, 1.10, 0.03, 0.015));
  str(portaV);
  str(sm(0.08, 1.24, 0.98, mat('#d6c6ac', 0.16), 2.33, 1.56, 2.5, 0.02, 'cornice_finestra_vicina'));
  const vetVic = new T.Mesh(new T.PlaneGeometry(0.76, 1.04), mVetroNotte);
  vetVic.rotation.y = -Math.PI / 2;
  vetVic.position.set(2.28, 1.56, 2.5);
  M.root.add(vetVic);
  geraniVaso(M, { x: 2.14, y: 0.88, z: 2.5, ry: -Math.PI / 2, w: 0.78, s: 0.68, nome: 'gerani_vicina' });

  const finV = grp(2.26, 1.56, 2.5, 0, 'finestra_vicina');
  for (const sz of [-0.22, 0.22]) {
    const an = sm(0.05, 1.02, 0.36, mScur, 0, 0, sz, 0.01);
    an.castShadow = false;
    finV.add(an);
  }
  finV.userData.vivo = 'finestra_vicina';
  OBJ.finestra_vicina = finV;

  /* 4 finestre alte che si spalancano nella scena 5 (OBJ.win0..win3 a z = -2.5, -3.5, -8.5, -9.5) */
  const winSpecs = [
    [-2.30, 3.85, -2.5, 1],
    [2.30, 3.85, -3.5, -1],
    [-2.30, 3.85, -8.5, 1],
    [2.30, 3.85, -9.5, -1]
  ];
  winSpecs.forEach(([wx, wy, wz, dir], i) => {
    const frame = grp(wx, wy, wz, dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    into(frame, sm(0.94, 1.18, 0.08, mat('#d8c8ae', 0.16), 0, 0, 0, 0.015));
    const vet = new T.Mesh(new T.PlaneGeometry(0.74, 0.98), mVetroNotte);
    vet.position.z = 0.045;
    frame.add(vet);
    str(frame);
    geraniVaso(M, { x: wx + dir * 0.14, y: wy - 0.62, z: wz, ry: dir > 0 ? Math.PI / 2 : -Math.PI / 2, w: 0.68, s: 0.65, nome: `gerani_win_${i}` });

    /* Sportello persiane OBJ.win{i} davanti al vano luminoso */
    const wg = grp(wx + dir * 0.06, wy, wz, 0, `win${i}`);
    for (const sz of [-0.22, 0.22]) {
      const sh = sm(0.05, 0.98, 0.35, mScur, 0, 0, sz, 0.01);
      sh.castShadow = false;
      wg.add(sh);
    }
    wg.userData.vivo = `win${i}`;
    OBJ[`win${i}`] = wg;
  });

  /* Bottega "ALIMENTARI DA ROSA" a sinistra (z = -3.8) con interno vetrina illustrato (emissiva moderata: zero bruciatura!) */
  const texVetrina = tela(512, 384, (g, W, H) => {
    g.fillStyle = '#3b2214'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#bd8e58'; g.fillRect(16, 16, W - 32, H - 32);
    /* Ripiani caldi interni + lampada */
    g.fillStyle = '#c87e34';
    g.beginPath(); g.arc(W / 2, 42, 24, 0, Math.PI, true); g.fill();
    g.fillStyle = '#6e3f20';
    g.fillRect(28, 128, W - 56, 14);
    g.fillRect(28, 232, W - 56, 14);
    g.fillRect(24, H - 72, W - 48, 52);
    /* Salami appesi in alto */
    for (let i = 0; i < 6; i++) {
      g.fillStyle = i % 2 ? '#7e261e' : '#94382c';
      g.beginPath(); g.roundRect(56 + i * 74, 52, 28, 66, 12); g.fill();
    }
    /* Forme di formaggio e bottiglie sul ripiano medio */
    for (let i = 0; i < 3; i++) {
      g.fillStyle = '#d4aa44';
      g.beginPath(); g.roundRect(48 + i * 95, 168, 72, 62, 10); g.fill();
      g.fillStyle = '#5a2e12'; g.font = 'bold 14px sans-serif'; g.fillText('GRANA', 60 + i * 95, 204);
    }
    for (let i = 0; i < 4; i++) {
      g.fillStyle = i % 2 ? '#325a2c' : '#5e2a24';
      g.fillRect(344 + i * 34, 152, 22, 80);
    }
    /* Ceste di pane & prosciutto sul bancone */
    g.fillStyle = '#ad7236'; g.beginPath(); g.ellipse(120, H - 76, 56, 28, 0, 0, 7); g.fill();
    g.fillStyle = '#b4382e'; g.beginPath(); g.ellipse(275, H - 78, 48, 24, 0, 0, 7); g.fill();
    g.fillStyle = '#cfa44c'; g.fillRect(365, H - 96, 86, 44);
    /* Montanti vetrina scuri */
    g.strokeStyle = '#321c12'; g.lineWidth = 10;
    g.strokeRect(16, 16, W - 32, H - 32);
    g.beginPath(); g.moveTo(W / 2, 16); g.lineTo(W / 2, H - 16); g.stroke();
  });
  const shopG = grp(-2.32, 0, -3.8, Math.PI / 2, 'vetrina_alimentari');
  into(shopG, sm(2.35, 2.35, 0.10, mLegnoS, 0, 1.18, 0, 0.02));
  const vetr = new T.Mesh(new T.PlaneGeometry(2.05, 1.85), dip(texVetrina, 0.28, 0.85));
  vetr.position.set(0, 1.25, 0.06);
  shopG.add(vetr);
  str(shopG);
  M.luce('#ffd488', 3.4, -1.55, 2.05, -3.8, 9.5);
  insegna('ALIMENTARI DA ROSA', 2.25, 0.44, -2.28, 2.92, -3.8, Math.PI / 2, { fondo: '#284434', colore: '#f2d478', bordo: '#b8823c', righe: 1 });
  const texTenda = tela(256, 128, (g, W, H) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#e4d6b8' : '#a83430';
      g.fillRect(i * (W / 8), 0, W / 8, H);
    }
  });
  const tendaS = new T.Mesh(new T.BoxGeometry(0.85, 0.14, 2.35), dip(texTenda, 0.24, 0.90));
  tendaS.position.set(-1.98, 2.48, -3.8);
  tendaS.rotation.z = -0.34;
  tendaS.castShadow = false;
  tendaS.name = 'tenda_alimentari';
  tendaS.userData.vivo = 'tenda_alimentari';
  M.vita.aggiungi(tendaS, 'ondeggia', { amp: 0.02, freq: 0.35, seme: 1.5 });
  M.root.add(tendaS);
  /* Cassette ortaggi rasenti al muro sinistro + frutti/piccoli oggetti separati sui bordi (±1.82..2.14, corsia libera!) */
  for (const [cz, colF, nm] of [[-2.95, '#d44834', 'cassetta_pomodori'], [-4.55, '#e2b244', 'cassetta_limoni']]) {
    const cas = grp(-2.04, 0.08, cz, 0.12, nm);
    into(cas, sm(0.42, 0.24, 0.56, mat('#9e7448', 0.18), 0, 0.12, 0, 0.01));
    for (let k = 0; k < 5; k++) {
      const fr = new T.Mesh(new T.SphereGeometry(0.075, 8, 8), mat(colF, 0.24));
      fr.position.set(((k % 2) - 0.5) * 0.14, 0.25, ((k % 3) - 1) * 0.14);
      fr.castShadow = false;
      cas.add(fr);
    }
  }
  /* Piccoli oggetti individuali in basso a destra e sinistra (riempiono 'piccoli >= 5' + in basso dx/centro bordi) */
  cil(0.11, 0.085, 0.20, mat('#c85a38', 0.22), -1.86, 0.10, 1.45, 12, 'vaso_basilico_sx');
  cil(0.10, 0.09, 0.22, mat('#3a6e8c', 0.24), -1.88, 0.11, 2.05, 12, 'innaffiatoio_nonna');
  sm(0.24, 0.24, 0.24, mat('#8a5a36', 0.20), 1.84, 0.12, 2.95, 0.02, 'sgabello_vicina');
  cil(0.11, 0.08, 0.22, mat('#4e8c40', 0.24), 1.86, 0.11, 1.85, 12, 'vaso_rosmarino_dx');
  cil(0.09, 0.07, 0.24, mat('#e6d8b4', 0.24), 1.84, 0.36, 2.95, 12, 'brocca_vicina');
  sm(0.26, 0.04, 0.20, mat('#e8dec4', 0.24), 1.86, 0.02, 0.35, 0.005, 'giornale_uscio');
  cil(0.07, 0.09, 0.26, mat('#4a7c3a', 0.24), 1.98, 0.99, -5.2, 12, 'fiasco_osteria_1');
  cil(0.07, 0.09, 0.24, mat('#8c3832', 0.24), 2.12, 0.98, -5.35, 12, 'fiasco_osteria_2');
  const pomEx = new T.Mesh(new T.SphereGeometry(0.08, 10, 8), mat('#d84434', 0.26));
  pomEx.position.set(-1.76, 0.08, -2.55); pomEx.name = 'pomodoro_sciolto_1'; M.root.add(pomEx);
  const limEx = new T.Mesh(new T.SphereGeometry(0.075, 10, 8), mat('#e4b644', 0.26));
  limEx.position.set(-1.74, 0.075, -4.35); limEx.name = 'limone_sciolto_1'; M.root.add(limEx);
  cil(0.11, 0.09, 0.20, mat('#b85c38', 0.22), 1.82, 0.10, -1.65, 12, 'vasetto_dx_1');
  cil(0.10, 0.08, 0.18, mat('#4e8e3e', 0.22), 1.76, 0.09, -2.35, 12, 'vasetto_dx_2');
  cil(0.10, 0.08, 0.22, mat('#3a6e8c', 0.22), -1.82, 0.11, -1.25, 12, 'lanternina_terra_sx');
  sm(0.22, 0.12, 0.18, mat('#d8aa54', 0.22), 1.74, 0.06, 0.15, 0.02, 'pacco_pasta_uscio');
  /* Piccoli dettagli bassi sul selciato in primo piano (18.72s in basso al centro, nessun intralcio) */
  sm(0.28, 0.04, 0.20, mat('#d44c3c', 0.24), -0.42, 0.02, 3.45, 0.008, 'strofinaccio_caduto');
  const pomFg1 = new T.Mesh(new T.SphereGeometry(0.075, 10, 8), mat('#d84434', 0.26));
  pomFg1.position.set(-0.78, 0.075, 3.72); pomFg1.name = 'pomodoro_vicolo_1'; M.root.add(pomFg1);
  const pomFg2 = new T.Mesh(new T.SphereGeometry(0.068, 10, 8), mat('#d84434', 0.26));
  pomFg2.position.set(-0.62, 0.068, 3.84); pomFg2.name = 'pomodoro_vicolo_2'; M.root.add(pomFg2);
  cil(0.13, 0.10, 0.06, mat('#b85c38', 0.22), 0.48, 0.03, 3.42, 12, 'piattino_terracotta');
  const limFg = new T.Mesh(new T.SphereGeometry(0.065, 10, 8), mat('#e4b644', 0.26));
  limFg.position.set(0.32, 0.065, 3.78); limFg.name = 'limone_vicolo_1'; M.root.add(limFg);
  sm(0.30, 0.035, 0.07, mat('#b47b44', 0.22), 0.06, 0.018, 3.65, 0.006, 'cucchiaio_caduto');

  /* Osteria destra "OGGI LASAGNE" (z = -4.2): lavagna, botte di vino e bici */
  cartello(M, { testo: 'OGGI:\nLASAGNE', x: 2.26, y: 1.55, z: -4.2, ry: -Math.PI / 2, w: 0.72, h: 0.96, fondo: '#2c303a', colore: '#e8d8b0', bordo: '#6e4628', righe: 2 }).name = 'lavagna_osteria';
  const botte = grp(2.04, 0.08, -5.3, 0, 'botte_vino');
  into(botte, cil(0.28, 0.25, 0.78, mat('#724628', 0.16), 0, 0.39, 0, 14));
  into(botte, cil(0.29, 0.29, 0.05, mat('#343844', 0.14), 0, 0.18, 0, 14));
  into(botte, cil(0.29, 0.29, 0.05, mat('#343844', 0.14), 0, 0.62, 0, 14));

  bici(M, { x: 2.12, y: 0.08, z: -0.9, ry: 0.08, incline: 0.12, colore: '#b83c3a', nome: 'bici_vicolo' });
  pianta(M, { x: 2.08, y: 0.08, z: -7.0, s: 1.1, vaso: '#b85c3a', foglie: '#4e963e', nome: 'pianta_vicolo_dx' });
  pianta(M, { x: -2.08, y: 0.08, z: -10.8, s: 1.15, vaso: '#c2623c', foglie: '#529842', nome: 'pianta_vicolo_sx' });

  /* Bidoni/cestini vicolo laterali lontani dalla corsia centrale */
  cil(0.22, 0.19, 0.68, mat('#3c6248', 0.16), -2.06, 0.42, -13.2, 12, 'cestino_vicolo');

  /* 4. STENDIPANNI E CATENE DI LUCI IN ALTO (riempiono le caselle alte su tutto il vicolo) */
  const panniCols = ['#e6d8be', '#c84a42', '#4a78a4', '#e0b24a', '#5c8c64'];
  for (const [fz, fy, idx] of [[0.5, 4.9, 1], [-5.2, 5.2, 2], [-10.8, 4.7, 3]]) {
    const filo = sm(4.8, 0.02, 0.02, mat('#363842', 0.1), 0, fy, fz, 0.005);
    filo.castShadow = false;
    M.root.add(filo);
    for (let k = 0; k < 4; k++) {
      const px = -1.45 + k * 0.95;
      const pano = grp(px, fy, fz, 0, `panno_${idx}_${k}`);
      const mP = mat(panniCols[(idx + k) % panniCols.length], 0.22, 0.9);
      const telo = sm(0.46, 0.56 + (k % 2) * 0.12, 0.03, mP, 0, -0.28, 0, 0.01);
      telo.castShadow = false;
      pano.add(telo);
      pano.userData.vivo = `panno_${idx}_${k}`;
      M.vita.aggiungi(pano, 'ondeggia', { amp: 0.07, freq: 0.55 + k * 0.08, seme: idx + k });
    }
  }
  /* Fili di lampadine calde appesi attraverso il vicolo */
  for (const [lz, ly] of [[-1.8, 4.15], [-7.8, 4.25]]) {
    const cavo = sm(4.8, 0.018, 0.018, mat('#2c2e38', 0.1), 0, ly, lz, 0.005);
    cavo.castShadow = false;
    M.root.add(cavo);
    for (let b = 0; b < 5; b++) {
      const bx = -1.6 + b * 0.8;
      const drop = Math.sin(((b + 0.5) / 5) * Math.PI) * 0.28;
      const bulb = new T.Mesh(new T.SphereGeometry(0.065, 8, 8), M.emi('#ffe098', 0.92));
      bulb.position.set(bx, ly - drop, lz);
      bulb.castShadow = false;
      bulb.name = `lampadina_vicolo_${Math.round(lz)}_${b}`;
      M.root.add(bulb);
    }
  }

  /* 5. LAMPIONI A BRACCIO SUI MURI LATERALI (intensità calda per evitare TROPPO_SCURO notturno) */
  lampioneStrada(M, { x: -2.28, z: 5.5, h: 3.45, lato: 1, intensita: 8.5, raggio: 14, nome: 'lampione_vicolo_0' });
  lampioneStrada(M, { x: -2.28, z: 2.8, h: 3.45, lato: 1, intensita: 8.5, raggio: 14, nome: 'lampione_vicolo_1' });
  lampioneStrada(M, { x: 2.28, z: 1.5, h: 3.45, lato: -1, intensita: 8.5, raggio: 14, nome: 'lampione_vicolo_1b' });
  lampioneStrada(M, { x: 2.28, z: -2.8, h: 3.45, lato: -1, intensita: 8.5, raggio: 14, nome: 'lampione_vicolo_2' });
  lampioneStrada(M, { x: -2.28, z: -7.2, h: 3.45, lato: 1, intensita: 8.5, raggio: 14, nome: 'lampione_vicolo_3' });
  lampioneStrada(M, { x: 2.28, z: -12.0, h: 3.45, lato: -1, intensita: 8.5, raggio: 14, nome: 'lampione_vicolo_4' });
  M.luce('#ffd89a', 6.5, 0, 3.8, 1.5, 14);
  M.luce('#ffd89a', 5.5, 0, 3.8, -5.5, 13);

  /* 6. VITA ANIMALE E COMPARSE LONTANE DALLA CORSIA CENTRALE */
  try {
    await animato(M, 'Cat', { x: 1.98, z: -2.2, ry: -1.1, alt: 0.30, anim: 'Idle', nome: 'gatto_vicolo' });
  } catch {}
  piccioni(M, { x: -0.4, z: -11.0, n: 4, volo: true, y: 6.2, r: 2.4, nome: 'piccioni_vicolo' });
  comparsa(M, -1.6, -15.5, 0.8, ['nonno', 'signora'], { nome: 'comparsa_fondo_sx' });
  comparsa(M, 1.5, -16.2, -0.9, ['ragazza', 'barista'], { nome: 'comparsa_fondo_dx' });

  /* 7. TEGLIE DI LASAGNA INDIVIDUALI PORTATE A DUE MANI DALLE ZIE (visibili via attore.porta) */
  for (let i = 1; i <= 4; i++) {
    const t = tegliaLasagna(M, { nome: 'teglia_zia' + i, seme: i });
    t.visible = false;
    OBJ['teglia_zia' + i] = t;
  }
}
