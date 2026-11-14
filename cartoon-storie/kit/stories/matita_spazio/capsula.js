import { attrezziSpazio, matitaSpaziale, scheggiaGrafite, pennaFisher, taccuinoVolo } from './oggetti_spazio.js';

export async function costruisci(M, D, S, OBJ) {
  const { T, mat, tela, dip, sm, cil, grp, into, cartello } = attrezziSpazio(M);
  const X = 2.6, ZF = -2.4, ZB = 4.6, H = 2.8;
  const ZLEN = ZB - ZF + 0.2, ZMID = (ZB + ZF) * 0.5;

  // Helpers sicuri: ogni mesh creata dentro un Group viene sempre agganciata al parent
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
  // 1. MATERIALI & TEXTURE ANTI-TREMOlio (trapunta Apollo larga, zero retini fini)
  // ==========================================================
  const texTrapunta = tela(512, 512, (c, W, Hc) => {
    c.fillStyle = '#c8d0dc';
    c.fillRect(0, 0, W, Hc);
    // Grandi pannelli imbottiti 2x2 per piastrella (zero moire)
    const step = 256;
    for (let x = 0; x < W; x += step) {
      for (let y = 0; y < Hc; y += step) {
        const g = c.createRadialGradient(x + step * 0.5, y + step * 0.48, 20, x + step * 0.5, y + step * 0.5, step * 0.72);
        g.addColorStop(0, 'rgba(255,255,255,0.28)');
        g.addColorStop(0.75, 'rgba(180,192,208,0.12)');
        g.addColorStop(1, 'rgba(110,122,140,0.32)');
        c.fillStyle = g;
        c.fillRect(x + 6, y + 6, step - 12, step - 12);
        // Bordi pannello smussati larghi
        c.strokeStyle = 'rgba(72,82,98,0.38)';
        c.lineWidth = 8;
        c.strokeRect(x + 4, y + 4, step - 8, step - 8);
        // Borchie agli angoli del pannello
        c.fillStyle = 'rgba(70,80,96,0.55)';
        for (const [bx, by] of [[18, 18], [step - 18, 18], [18, step - 18], [step - 18, step - 18]]) {
          c.beginPath(); c.arc(x + bx, y + by, 5, 0, Math.PI * 2); c.fill();
        }
      }
    }
  });
  texTrapunta.wrapS = texTrapunta.wrapT = T.RepeatWrapping;
  texTrapunta.repeat.set(2, 1.5);
  const mParete = dip(texTrapunta, 0.14, 0.82);

  const texDeck = tela(512, 512, (c, W, Hc) => {
    c.fillStyle = '#5c6678';
    c.fillRect(0, 0, W, Hc);
    const cell = 128;
    for (let x = 0; x < W; x += cell) {
      for (let y = 0; y < Hc; y += cell) {
        c.fillStyle = ((x / cell + y / cell) % 2 === 0) ? '#636e82' : '#586274';
        c.fillRect(x + 4, y + 4, cell - 8, cell - 8);
        c.strokeStyle = '#3c4452';
        c.lineWidth = 6;
        c.strokeRect(x + 2, y + 2, cell - 4, cell - 4);
        // Piccoli rilievi antiscivolo larghi
        c.fillStyle = 'rgba(255,255,255,0.10)';
        c.fillRect(x + 24, y + 58, cell - 48, 10);
      }
    }
  });
  texDeck.wrapS = texDeck.wrapT = T.RepeatWrapping;
  texDeck.repeat.set(3, 3);
  const mDeck = dip(texDeck, 0.12, 0.78);

  const mCostola = mat('#6e7c90', 0.10, 0.65, 0.14);
  const mChassis = mat('#94a0b2', 0.10, 0.70, 0.12);
  const mScuro = mat('#363e4a', 0.08, 0.76, 0.12);
  const mOttone = mat('#c89c38', 0.12, 0.62, 0.15);
  const mRame = mat('#b86832', 0.10, 0.62, 0.14);
  const mBianco = mat('#e6ebf2', 0.14, 0.78, 0.04);
  const mRosso = mat('#d6382c', 0.16, 0.65, 0.05);
  const mVerde = mat('#4a6e54', 0.10, 0.78, 0.04);
  const mGiallo = mat('#e4b838', 0.14, 0.70, 0.05);
  const mBlu = mat('#386cb0', 0.14, 0.68, 0.05);
  const mTessuto = mat('#7c8672', 0.10, 0.88, 0.02);

  // ==========================================================
  // 2. GUSCIO ERMETICO DELLA CAPSULA (aperture reali per oblò, nessuna fessura!)
  // ==========================================================
  // Pavimento rialzato sopra y=0 (zero z-fighting col piano terra!) + cornice portello
  str(sm(5.3, 0.12, ZLEN, mDeck, 0, -0.055, ZMID, 0.01));
  str(sm(1.35, 0.02, 1.05, mCostola, -0.25, 0.016, -0.45, 0.01));
  const texBandaGialla = tela(256, 64, (c, W, Hc) => {
    c.fillStyle = '#e0b228'; c.fillRect(0, 0, W, Hc);
    c.fillStyle = '#22262e';
    for (let x = -64; x < W + 64; x += 64) {
      c.beginPath();
      c.moveTo(x, Hc); c.lineTo(x + 28, Hc); c.lineTo(x + 56, 0); c.lineTo(x + 28, 0);
      c.closePath(); c.fill();
    }
  });
  const mHazard = dip(texBandaGialla, 0.14, 0.75);
  str(sm(1.52, 0.014, 1.22, mHazard, -0.25, 0.010, -0.45, 0.005));

  // Pareti laterali e retro camera estese fino a ZB = 4.6 per incasso dolly
  str(sm(0.14, H, ZLEN, mParete, -X, H / 2, ZMID, 0.01));
  str(sm(0.14, H, ZLEN, mParete, X, H / 2, ZMID, 0.01));
  str(sm(5.4, H, 0.14, mParete, 0, H / 2, ZB, 0.01));

  // Paratia di fondo (ZF = -2.4) divisa attorno a un VERO FORO quadrato 1.12x1.12m per l'oblò centrato a (1.48, 1.62)
  // Foratura netta: apertura [x: 0.92 .. 2.04], [y: 1.06 .. 2.18]
  str(sm(3.59, H, 0.14, mParete, (-2.67 + 0.92) / 2, H / 2, ZF, 0.01));     // fascia sinistra (-2.67 .. +0.92)
  str(sm(0.63, H, 0.14, mParete, (2.04 + 2.67) / 2, H / 2, ZF, 0.01));      // fascia destra (+2.04 .. +2.67)
  str(sm(1.12, 1.06, 0.14, mParete, 1.48, 0.53, ZF, 0.01));                  // sotto oblò (0 .. 1.06)
  str(sm(1.12, 0.62, 0.14, mParete, 1.48, 2.49, ZF, 0.01));                  // sopra oblò (2.18 .. 2.80)

  // Soffitto arrotondato a costole + pannelli diffusori luminosi
  str(sm(5.4, 0.14, ZLEN, mChassis, 0, H + 0.06, ZMID, 0.01));
  for (const zc of [-2.32, -1.15, 0.05, 1.25, 2.45, 3.65]) {
    str(sm(5.2, 0.14, 0.13, mCostola, 0, H - 0.04, zc, 0.02));
    str(sm(0.12, H, 0.14, mCostola, -X + 0.08, H / 2, zc, 0.02));
    str(sm(0.12, H, 0.14, mCostola, X - 0.08, H / 2, zc, 0.02));
  }
  // Mensole smussate negli spigoli superiori stile capsula ottagonale Apollo
  for (const sx of [-1, 1]) {
    const smusso = str(sm(0.48, 0.42, ZLEN, mCostola, sx * (X - 0.22), H - 0.18, ZMID, 0.02));
    smusso.rotation.z = sx * Math.PI * 0.25;
  }

  // Diffusori soffitto + luci reali posizionali subito sotto
  for (const [lx, lz] of [[-1.1, -0.95], [1.1, -0.95], [0, 0.55]]) {
    str(sm(0.95, 0.05, 0.36, mCostola, lx, H - 0.03, lz, 0.01));
    str(sm(0.84, 0.03, 0.26, M.emi('#eef6ff', 0.78), lx, H - 0.05, lz, 0.01));
  }
  M.luce('#f4f8ff', 3.4, 0.0, 2.38, -0.85, 7.5);
  M.luce('#e8f2ff', 2.6, -1.0, 2.35, 0.75, 6.5);
  M.luce('#60b4ff', 1.5, 1.48, 1.58, -1.85, 3.8); // riflesso azzurro della Terra dall'oblò

  // ==========================================================
  // 3. OBLÒ APERTO CON CORNICE IMBULLONATA, VETRO E TERRA NELLO SPAZIO
  // ==========================================================
  const OX = 1.48, OY = 1.62, OR = 0.48;
  // Scatola ermetica dietro la paratia (spazio profondo sigillato: 0% vuoto!)
  const skyBoxZ = -3.38;
  const wallBoxM = mat('#060b18', 0.02, 0.95, 0);
  wallBoxM.userData = {};
  const backM = (w, h, d, x, y, z) => {
    const m = str(sm(w, h, d, wallBoxM, x, y, z, 0));
    m.userData.noRick = 1;
    return m;
  };
  backM(0.08, 1.5, 1.15, OX - 0.74, OY, -2.92);
  backM(0.08, 1.5, 1.15, OX + 0.74, OY, -2.92);
  backM(1.56, 0.08, 1.15, OX, OY + 0.74, -2.92);
  backM(1.56, 0.08, 1.15, OX, OY - 0.74, -2.92);

  // Fondale dipinto Terra + Stelle visibile attraverso il foro dell'oblò
  const texSpazio = tela(768, 768, (c, W, Hc) => {
    const bg = c.createLinearGradient(0, 0, 0, Hc);
    bg.addColorStop(0, '#040814');
    bg.addColorStop(0.55, '#091532');
    bg.addColorStop(1, '#102c5c');
    c.fillStyle = bg;
    c.fillRect(0, 0, W, Hc);

    // Stelle nitide e piccole galassie
    let s = 4211;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 160; i++) {
      const sx = rnd() * W, sy = rnd() * Hc * 0.72;
      const sr = 0.7 + rnd() * 2.1;
      c.fillStyle = i % 7 === 0 ? 'rgba(180,220,255,0.9)' : i % 11 === 0 ? 'rgba(255,235,190,0.9)' : 'rgba(255,255,255,0.85)';
      c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill();
    }

    // Globo terrestre luminoso sul basso/destra
    const cx = W * 0.56, cy = Hc * 1.12, er = Hc * 0.64;
    // Alone atmosferico azzurro
    const atm = c.createRadialGradient(cx, cy, er * 0.92, cx, cy, er * 1.12);
    atm.addColorStop(0, 'rgba(120,215,255,0.85)');
    atm.addColorStop(0.45, 'rgba(65,165,255,0.35)');
    atm.addColorStop(1, 'rgba(20,70,180,0)');
    c.fillStyle = atm;
    c.beginPath(); c.arc(cx, cy, er * 1.12, 0, Math.PI * 2); c.fill();

    // Oceano terrestre
    c.save();
    c.beginPath(); c.arc(cx, cy, er, 0, Math.PI * 2); c.clip();
    const oc = c.createRadialGradient(cx - er * 0.25, cy - er * 0.45, 20, cx, cy, er);
    oc.addColorStop(0, '#3694f0');
    oc.addColorStop(0.65, '#195eb8');
    oc.addColorStop(1, '#0b2b66');
    c.fillStyle = oc;
    c.fillRect(0, 0, W, Hc);

    // Continenti stilizzati (Europa / Nord Africa)
    c.fillStyle = '#c8aa68';
    c.beginPath();
    c.ellipse(cx - 80, cy - er * 0.76, 130, 52, -0.18, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#6da058';
    c.beginPath();
    c.ellipse(cx - 110, cy - er * 0.85, 85, 36, 0.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#d4b878';
    c.beginPath();
    c.ellipse(cx + 120, cy - er * 0.70, 95, 42, 0.14, 0, Math.PI * 2);
    c.fill();

    // Vortici di nuvole bianche morbide
    c.fillStyle = 'rgba(248,252,255,0.82)';
    for (const [nx, ny, rx, ry, rot] of [
      [-140, -er * 0.80, 90, 20, -0.25],
      [40, -er * 0.88, 120, 24, 0.12],
      [150, -er * 0.75, 85, 18, 0.3],
      [-30, -er * 0.65, 140, 22, -0.08]
    ]) {
      c.save(); c.translate(cx + nx, cy + ny); c.rotate(rot);
      c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    c.restore();

    // Sottile arco luce solare sul terminatore
    c.strokeStyle = 'rgba(180,238,255,0.75)';
    c.lineWidth = 6;
    c.beginPath(); c.arc(cx, cy, er - 2, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
  });
  const sfMat = new T.MeshBasicMaterial({ map: texSpazio });
  const sfPlane = new T.Mesh(new T.PlaneGeometry(1.50, 1.50), sfMat);
  M.root.add(sfPlane);
  sfPlane.position.set(OX, OY, skyBoxZ + 0.05);
  sfPlane.userData.noRick = 1;
  sfPlane.userData.struttura = 1;

  // Telaio quadrato con foro circolare + anello imbullonato dell'oblò (nessun tappo solido!)
  const obloG = grp(OX, OY, ZF + 0.02);
  // Piastra quadrata esterna con foro centrale Shape
  const sq = new T.Shape();
  sq.moveTo(-0.58, -0.58); sq.lineTo(0.58, -0.58); sq.lineTo(0.58, 0.58); sq.lineTo(-0.58, 0.58); sq.closePath();
  const hole = new T.Path();
  hole.absarc(0, 0, OR, 0, Math.PI * 2, true);
  sq.holes.push(hole);
  const piastra = into(obloG, new T.Mesh(new T.ExtrudeGeometry(sq, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01 }), mCostola));
  piastra.position.z = -0.04;
  piastra.userData.struttura = 1;

  // Tunnel cilindrico APERTO (openEnded: true!) che congiunge paratia e vano oblò
  const tunnel = into(obloG, new T.Mesh(new T.CylinderGeometry(OR + 0.01, OR + 0.01, 0.24, 32, 1, true), mScuro));
  tunnel.rotation.x = Math.PI / 2;
  tunnel.position.z = -0.10;
  tunnel.material.side = T.DoubleSide;
  tunnel.userData.struttura = 1;

  // Ghiera pressurizzata Torus + guarnizione ottone + 12 bulloni esagonali
  const ghiera = into(obloG, new T.Mesh(new T.TorusGeometry(OR + 0.02, 0.052, 16, 40), mChassis));
  ghiera.position.z = 0.045;
  ghiera.userData.struttura = 1;
  const guarn = into(obloG, new T.Mesh(new T.TorusGeometry(OR - 0.015, 0.016, 10, 36), mOttone));
  guarn.position.z = 0.02;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    cilG(obloG, 0.016, 0.016, 0.032, mScuro, Math.cos(a) * (OR + 0.025), Math.sin(a) * (OR + 0.025), 0.075, Math.PI / 2, 0, 0, 6);
  }
  // Vetro trasparente leggermente riflessivo
  const mVetro = new T.MeshStandardMaterial({
    color: '#bde4ff', roughness: 0.15, metalness: 0.1,
    transparent: true, opacity: 0.14, depthWrite: false
  });
  const vetro = into(obloG, new T.Mesh(new T.CircleGeometry(OR - 0.01, 32), mVetro));
  vetro.position.z = 0.015;
  vetro.userData.noRick = 1;

  // ==========================================================
  // 4. CONSOLLE PRINCIPALE APOLLO + VANO ELETTRICO SCENA 7 (griglia_comandi)
  // ==========================================================
  // Posizionata a x=-0.28 (copre x: -1.28 .. +0.72), fronte inferiore a z = -1.60!
  // Così la griglia elettrica a destra (x=+0.22, y=0.73, z=-1.60) è al CENTRO della camera Scena 7!
  const cons = grp(-0.28, 0, -1.96);

  // Scocca inferiore portante (struttura solida appoggiata a terra)
  str(boxG(cons, 2.02, 0.88, 0.72, mChassis, 0, 0.44, 0.02));
  // Battiscopa nero
  str(boxG(cons, 2.04, 0.08, 0.74, mScuro, 0, 0.04, 0.02));
  // Ripiano sporgente anteriore poggiapolsi
  str(boxG(cons, 2.06, 0.06, 0.24, mCostola, 0, 0.88, 0.34));

  // Pannello strumenti superiore inclinato (y = 0.88 .. 1.66)
  const plancia = into(cons, new T.Group());
  plancia.position.set(0, 1.24, 0.08);
  plancia.rotation.x = -0.28;
  str(boxG(plancia, 2.00, 0.84, 0.34, mCostola, 0, 0, -0.06));
  // Cornice superiore parasole strumenti
  str(boxG(plancia, 2.04, 0.05, 0.42, mScuro, 0, 0.43, 0.02));

  // --- SINISTRA PLANCIA: COMPUTER DI BORDO DSKY + NAVBALL FDAI ---
  const texDSKY = tela(320, 260, (c, W, Hc) => {
    c.fillStyle = '#141a1e'; c.fillRect(0, 0, W, Hc);
    c.strokeStyle = '#607080'; c.lineWidth = 6; c.strokeRect(4, 4, W - 8, Hc - 8);
    // Display numerico EL verde Apollo
    c.fillStyle = '#0c1c12'; c.fillRect(20, 20, W - 40, 148);
    c.strokeStyle = '#385844'; c.lineWidth = 3; c.strokeRect(20, 20, W - 40, 148);
    c.fillStyle = '#56f082'; c.font = 'bold 20px monospace';
    c.fillText('PROG  11     COMP', 34, 48);
    c.font = 'bold 28px monospace';
    c.fillText('+ 04215  ALT', 34, 86);
    c.fillText('+ 07840  VEL', 34, 122);
    c.fillText('- 00192  APO', 34, 156);
    // Spie di stato
    c.fillStyle = '#e8c438'; c.fillRect(24, 184, 82, 26);
    c.fillStyle = '#181a18'; c.font = 'bold 14px sans-serif'; c.fillText('UPLINK', 36, 202);
    c.fillStyle = '#48c868'; c.fillRect(118, 184, 82, 26);
    c.fillStyle = '#101812'; c.fillText('NO ATT', 130, 202);
    c.fillStyle = '#c84232'; c.fillRect(212, 184, 84, 26);
    c.fillStyle = '#fff0ea'; c.fillText('TEMP!', 228, 202);
  });
  const scrDSKY = boxG(plancia, 0.44, 0.36, 0.03, dip(texDSKY, 0.55, 0.4), -0.68, 0.16, 0.12);
  scrDSKY.userData.scritta = 1;

  // Tastiera DSKY fisica sotto lo schermo
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      boxG(plancia, 0.055, 0.042, 0.028, (row === 0 && col === 4) ? mRosso : mScuro, -0.82 + col * 0.07, -0.10 - row * 0.06, 0.125);
    }
  }
  // Navball 3D (FDAI) + joystick T-handle
  const navBase = cilG(plancia, 0.095, 0.095, 0.04, mScuro, -0.34, 0.22, 0.12, Math.PI / 2);
  navBase.userData.struttura = 1;
  const sferaNav = into(plancia, new T.Mesh(new T.SphereGeometry(0.065, 16, 12), mBlu));
  sferaNav.position.set(-0.34, 0.22, 0.14);
  M.vita?.aggiungi(sferaNav, 'ondeggia', { amp: 0.18, freq: 0.35, asse: 'z' });

  // Joystick controllo assetto sul ripiano sinistro
  boxG(cons, 0.12, 0.06, 0.14, mScuro, -0.78, 0.94, 0.34);
  cilG(cons, 0.018, 0.022, 0.14, mChassis, -0.78, 1.03, 0.34);
  cilG(cons, 0.022, 0.022, 0.11, mScuro, -0.78, 1.10, 0.34, 0, 0, Math.PI / 2);

  // --- CENTRO PLANCIA: MONITOR ORBITA CRT + MANOMETRI + INTERRUTTORI CON ARCO ---
  const texOrbita = tela(360, 260, (c, W, Hc) => {
    c.fillStyle = '#0a1812'; c.fillRect(0, 0, W, Hc);
    c.strokeStyle = 'rgba(72,220,130,0.22)'; c.lineWidth = 2;
    for (let gx = 30; gx < W; gx += 45) { c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, Hc); c.stroke(); }
    for (let gy = 30; gy < Hc; gy += 45) { c.beginPath(); c.moveTo(0, gy); c.lineTo(W, gy); c.stroke(); }
    // Curva orbitale luminosa
    c.strokeStyle = '#62ff9e'; c.lineWidth = 5;
    c.beginPath();
    for (let x = 16; x <= W - 16; x += 8) {
      const y = Hc * 0.52 - Math.sin((x / W) * Math.PI * 2.1) * 58;
      if (x === 16) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
    // Blip navicella
    c.fillStyle = '#ffeb6b';
    c.beginPath(); c.arc(W * 0.62, Hc * 0.52 - Math.sin(0.62 * Math.PI * 2.1) * 58, 9, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#7dffb2'; c.font = 'bold 18px monospace';
    c.fillText('ORBIT 04  ECC 0.002', 18, 30);
    c.fillText('O2 100%   CABIN 21C', 18, Hc - 18);
  });
  boxG(plancia, 0.54, 0.38, 0.06, mScuro, -0.02, 0.16, 0.12);
  const crtScreen = boxG(plancia, 0.46, 0.30, 0.02, dip(texOrbita, 0.72, 0.32), -0.02, 0.16, 0.145);
  crtScreen.userData.scritta = 1;
  M.vita?.aggiungi(crtScreen, 'lampeggia', { min: 0.88, freq: 1.6, modo: 'respiro' });

  // Manometri analogici circolari con lancette animate + interruttori protetti da archetti
  const lancette = [];
  for (let i = 0; i < 4; i++) {
    const gx = -0.30 + i * 0.22;
    const gy = -0.14;
    cilG(plancia, 0.072, 0.072, 0.03, mScuro, gx, gy, 0.125, Math.PI / 2);
    cilG(plancia, 0.058, 0.058, 0.035, mBianco, gx, gy, 0.128, Math.PI / 2);
    const ago = boxG(plancia, 0.008, 0.044, 0.008, mRosso, gx, gy + 0.01, 0.15);
    lancette.push(ago);
  }
  for (let i = 0; i < 7; i++) {
    const ix = -0.34 + i * 0.11;
    // Arco metallico di protezione Apollo attorno alla levetta
    boxG(plancia, 0.008, 0.055, 0.04, mChassis, ix - 0.024, -0.31, 0.13);
    boxG(plancia, 0.008, 0.055, 0.04, mChassis, ix + 0.024, -0.31, 0.13);
    const lev = cilG(plancia, 0.008, 0.008, 0.045, i % 3 === 0 ? mRosso : mBianco, ix, -0.31, 0.135, 0.65);
    if (i === 2) M.vita?.aggiungi(lev, 'pendola', { amp: 0.12, freq: 0.5 });
  }

  // --- DESTRA PLANCIA: SPORTELLO ALLARMI + FUSIBILI ---
  const texSpie = tela(300, 260, (c, W, Hc) => {
    c.fillStyle = '#202630'; c.fillRect(0, 0, W, Hc);
    const cols = ['#e04434', '#e8aa30', '#44b864', '#3890d8'];
    const labels = ['MASTER', 'BUS A', 'FUEL', 'GYRO', 'O2 FLOW', 'RCS', 'CABIN', 'RADIO', 'POWER', 'COOL', 'HATCH', 'WARN'];
    for (let r = 0; r < 4; r++) {
      for (let k = 0; k < 3; k++) {
        const idx = r * 3 + k;
        c.fillStyle = (idx === 0 || idx === 8 || idx === 11) ? cols[0] : (idx % 2 === 0 ? cols[2] : cols[1]);
        c.fillRect(16 + k * 92, 16 + r * 58, 82, 46);
        c.fillStyle = '#101418'; c.font = 'bold 14px sans-serif';
        c.textAlign = 'center'; c.fillText(labels[idx], 57 + k * 92, 44 + r * 58);
      }
    }
  });
  const spiePnl = boxG(plancia, 0.44, 0.36, 0.03, dip(texSpie, 0.52, 0.5), 0.62, 0.14, 0.12);
  spiePnl.userData.scritta = 1;

  // Pulsante MASTER ALARM sporgente rosso
  boxG(plancia, 0.11, 0.08, 0.03, mRosso, 0.62, -0.15, 0.13);
  const etichettaMaster = cartello('MASTER\nCAUTION', 0.28, 0.12, 0, 0, 0, 0, {
    fondo: '#1d2228', colore: '#f2c844', bordo: '#e2b228', px: 220, righe: 2
  });
  into(plancia, etichettaMaster);
  etichettaMaster.position.set(0.62, -0.28, 0.13);

  // --- VANO ELETTRICO INFERIORE CON GRIGLIA DI RAFFREDDAMENTO (FOCALE SCENA 7: world x=+0.22 -> +0.50 in cons!) ---
  // Sporgenza cornice aperta davanti al pannello consolle (z=0.39) con vano nero interno VISIBILE dietro le lamelle!
  const bay = into(cons, new T.Group());
  bay.position.set(0.50, 0.54, 0.40);

  // 4 listelli perimetrali giallo/neri (centro COMPLETAMENTE APERTO per vedere dentro!)
  str(boxG(bay, 0.54, 0.045, 0.05, mHazard, 0, 0.20, 0));
  str(boxG(bay, 0.54, 0.045, 0.05, mHazard, 0, -0.20, 0));
  str(boxG(bay, 0.05, 0.36, 0.05, mHazard, -0.245, 0, 0));
  str(boxG(bay, 0.05, 0.36, 0.05, mHazard, 0.245, 0, 0));

  // Fondale scuro blu-ardesia del vano interno (evita NERO_PIENO e fa staccare lamelle/ventola/cavi)
  const bayBack = boxG(bay, 0.44, 0.36, 0.015, mat('#243448', 0.06, 0.86, 0.04), 0, 0, -0.01);
  bayBack.userData.noRick = 1;
  bayBack.userData.struttura = 1;

  // Ventola di raffreddamento interna che gira dietro alle lamelle + bobine di rame, bus ottone e cavi!
  const ventolaBay = into(bay, new T.Group());
  ventolaBay.position.set(0.0, -0.02, 0.008);
  cilG(ventolaBay, 0.032, 0.032, 0.018, mScuro, 0, 0, 0, Math.PI / 2);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    boxG(ventolaBay, 0.095, 0.028, 0.006, mChassis, Math.cos(a) * 0.06, Math.sin(a) * 0.06, 0.002, 0.25, 0, a);
  }
  M.vita?.aggiungi(ventolaBay, 'gira', { vel: 3.2, asse: 'z' });

  cilG(bay, 0.036, 0.036, 0.18, mRame, -0.14, 0.03, 0.014);
  boxG(bay, 0.055, 0.14, 0.025, mBlu, 0.14, 0.03, 0.014);
  boxG(bay, 0.38, 0.022, 0.022, mOttone, 0, -0.11, 0.015);
  boxG(bay, 0.018, 0.22, 0.018, mRosso, -0.18, 0.02, 0.016);
  boxG(bay, 0.018, 0.22, 0.018, mGiallo, 0.18, 0.02, 0.016);

  // 7 sottili lamelle inclinate davanti ai componenti
  for (let i = 0; i < 7; i++) {
    const ly = -0.135 + i * 0.045;
    str(boxG(bay, 0.43, 0.007, 0.028, mChassis, 0, ly, 0.036, -0.45, 0, 0));
  }
  // Etichetta tecnica sopra la cornice (visibile in Scena 7!)
  const targhettaVolt = cartello('28V DC  MAIN BUS  •  AIR INTAKE', 0.48, 0.075, 0, 0, 0, 0, {
    fondo: '#e6b82a', colore: '#181a1f', bordo: '#22262e', px: 340, righe: 1
  });
  into(bay, targhettaVolt);
  targhettaVolt.position.set(0, 0.265, 0.02);
  targhettaVolt.userData.struttura = 1;

  // Fascio di cavi intrecciati sul fianco destro della consolle (ancorati da fascette!)
  const fascioG = into(cons, new T.Group());
  for (const [dx, col] of [[-0.03, mRosso], [0.0, mBlu], [0.03, mGiallo]]) {
    const pts = [
      new T.Vector3(0.95 + dx, 0.85, 0.16),
      new T.Vector3(1.06 + dx, 0.65, 0.14),
      new T.Vector3(1.08 + dx, 0.32, -0.02),
      new T.Vector3(0.92 + dx, 0.14, -0.18)
    ];
    const crv = new T.TubeGeometry(new T.CatmullRomCurve3(pts), 16, 0.013, 8, false);
    into(fascioG, new T.Mesh(crv, col));
  }
  boxG(fascioG, 0.12, 0.03, 0.05, mScuro, 1.07, 0.56, 0.11); // fascetta metallica di fissaggio

  // Sportelli di ispezione sinistra consolle (struttura) + etichetta Master Caution
  str(boxG(cons, 0.86, 0.72, 0.03, mCostola, -0.46, 0.44, 0.38));
  str(boxG(cons, 0.14, 0.025, 0.03, mOttone, -0.20, 0.62, 0.405));
  str(boxG(cons, 0.14, 0.025, 0.03, mOttone, -0.20, 0.24, 0.405));

  // Scintille elettriche dentro/davanti la griglia (attive a t >= 36.8s)
  const scintille = grp(0.22, 0.72, -1.56);
  const luciArc = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const sp = into(scintille, sm(0.022, 0.13, 0.022, M.emi('#92f0ff', 0.88), Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0, 0.005));
    sp.rotation.z = a + 0.5;
    luciArc.push(sp);
  }
  const luceCorto = M.luce('#80dcff', 0.0, 0.22, 0.74, -1.46, 3.8);
  scintille.visible = false;

  // ==========================================================
  // 5. ALLARME ROSSO A SOFFITTO (OBJ.allarme_rosso)
  // ==========================================================
  const allarmeG = grp(-0.08, H - 0.12, -1.10);
  cilG(allarmeG, 0.15, 0.17, 0.04, mScuro, 0, 0.07, 0);
  cilG(allarmeG, 0.09, 0.11, 0.06, mChassis, 0, 0.02, 0);
  const mCupolaAllarme = new T.MeshStandardMaterial({
    color: '#d8281c', emissive: '#ff1810', emissiveIntensity: 0.06,
    roughness: 0.28, metalness: 0.08
  });
  const cupola = into(allarmeG, new T.Mesh(new T.SphereGeometry(0.095, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.65), mCupolaAllarme));
  cupola.position.y = -0.01;
  cupola.rotation.x = Math.PI;
  // Gabbietta protettiva esterna con 4 archetti sottili
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    boxG(allarmeG, 0.012, 0.12, 0.012, mScuro, Math.cos(a) * 0.105, -0.05, Math.sin(a) * 0.105);
  }
  const luceAllarme = M.luce('#ff2814', 0.0, -0.08, H - 0.36, -1.10, 6.5);
  OBJ.allarme_rosso = allarmeG;

  // ==========================================================
  // 6. BOMBOLE CRIOGENICHE, SEDILI LATERALI, MANIGLIONI E STOVIGLIE ZERO-G
  // ==========================================================
  // Rack bombole O2/N2 sulla parete sinistra vicino alla consolle (x = -2.18, z = -1.45)
  const rackO2 = grp(-2.12, 0, -1.48);
  str(boxG(rackO2, 0.56, 1.52, 0.44, mScuro, 0, 0.76, 0));
  for (const [by, tagCol] of [[0.42, mBianco], [1.06, mBlu]]) {
    const tank = into(rackO2, new T.Mesh(new T.SphereGeometry(0.21, 18, 14), tagCol));
    tank.position.set(0.02, by, 0.04);
    cilG(rackO2, 0.035, 0.04, 0.12, mOttone, 0.02, by + 0.23, 0.04);
    cilG(rackO2, 0.055, 0.055, 0.018, mRosso, 0.02, by + 0.30, 0.04); // volantino valvola
  }
  // Tubo flessibile ossigeno dalla bombola verso la paratia/consolle
  const o2Tube = new T.TubeGeometry(new T.CatmullRomCurve3([
    new T.Vector3(-2.08, 1.34, -1.44),
    new T.Vector3(-1.82, 1.18, -1.58),
    new T.Vector3(-1.42, 0.88, -1.78),
    new T.Vector3(-1.26, 0.72, -1.90)
  ]), 20, 0.022, 8, false);
  const o2Mesh = new T.Mesh(o2Tube, mScuro);
  o2Mesh.userData.struttura = 1;
  M.root.add(o2Mesh);

  const targaO2 = cartello('O2 / N2  LIFE SUPPORT', 0.52, 0.12, -2.10, 1.62, -1.24, 0.35, {
    fondo: '#183862', colore: '#f2f7ff', bordo: '#88b4e6', px: 280, righe: 1
  });
  rackO2.traverse(c => { c.userData.struttura = 1; });
  targaO2.traverse(c => { c.userData.struttura = 1; });
  // Spia flusso ossigeno O2 pulsante sul collettore
  const spiaO2 = grp(-1.90, 1.38, -1.42);
  const ledO2 = into(spiaO2, new T.Mesh(new T.SphereGeometry(0.022, 8, 8), M.emi('#48e878', 0.82)));
  ledO2.userData.vivo = 1; spiaO2.userData.vivo = 1;
  M.vita?.aggiungi(ledO2, 'lampeggia', { min: 0.45, freq: 1.8, modo: 'respiro' });

  // Sedili astronauti sagomati (posti ai lati, struttura fissa)
  const creaSedile = (sx, sz, ry) => {
    const sg = grp(sx, 0, sz, ry);
    str(boxG(sg, 0.48, 0.12, 0.46, mCostola, 0, 0.06, 0));
    str(cilG(sg, 0.055, 0.065, 0.36, mScuro, 0, 0.24, 0));
    str(boxG(sg, 0.52, 0.10, 0.50, mVerde, 0, 0.43, 0.03));
    const sch = str(boxG(sg, 0.50, 0.72, 0.11, mVerde, 0, 0.82, -0.20));
    sch.rotation.x = -0.14;
    str(boxG(sg, 0.34, 0.20, 0.12, mBianco, 0, 1.24, -0.25));
    str(boxG(sg, 0.06, 0.05, 0.42, mCostola, -0.27, 0.58, 0.04));
    str(boxG(sg, 0.06, 0.05, 0.42, mCostola, 0.27, 0.58, 0.04));
    str(boxG(sg, 0.045, 0.52, 0.02, mGiallo, -0.11, 0.82, -0.14));
    str(boxG(sg, 0.045, 0.52, 0.02, mGiallo, 0.11, 0.82, -0.14));
    return sg;
  };
  creaSedile(-1.62, -0.35, 0.32);
  creaSedile(1.38, -0.45, -0.38);

  // Tasche portattrezzi Velcro e maniglioni zero-G sulle pareti laterali
  const tasche = grp(-X + 0.11, 1.38, 0.35, Math.PI / 2);
  str(boxG(tasche, 0.92, 0.62, 0.04, mTessuto, 0, 0, 0));
  str(boxG(tasche, 0.24, 0.30, 0.06, mBianco, -0.28, -0.05, 0.04));
  str(boxG(tasche, 0.24, 0.30, 0.06, mGiallo, 0.02, -0.05, 0.04));
  str(cilG(tasche, 0.028, 0.028, 0.22, mChassis, 0.30, 0.02, 0.05));

  // Maniglioni cromo-gialli anti-gravità
  for (const [gx, gz, ry] of [[-X + 0.14, -0.55, Math.PI / 2], [X - 0.14, 0.15, -Math.PI / 2]]) {
    const mg = grp(gx, 1.65, gz, ry);
    str(boxG(mg, 0.04, 0.04, 0.09, mScuro, -0.24, 0, 0.04));
    str(boxG(mg, 0.04, 0.04, 0.09, mScuro, 0.24, 0, 0.04));
    str(cilG(mg, 0.018, 0.018, 0.54, mGiallo, 0, 0, 0.08, 0, 0, Math.PI / 2));
  }

  // Tubi criogenici orizzontali lungo la parete destra + cartello checklist
  const tuboLungo = grp(X - 0.14, 0.48, -0.25);
  str(cilG(tuboLungo, 0.034, 0.034, 4.2, mChassis, 0, 0.10, 0, Math.PI / 2, 0, 0, 12));
  str(cilG(tuboLungo, 0.034, 0.034, 4.2, mBlu, 0, -0.08, 0, Math.PI / 2, 0, 0, 12));

  const checkCard = cartello('APOLLO CAPSULE CHECKLIST\n1. NO GRAPHITE DUST\n2. SEAL CABIN BREAKER\n3. ZERO-G TETHER ON', 0.72, 0.54, X - 0.10, 1.58, -0.75, -Math.PI / 2, {
    fondo: '#f2eee0', colore: '#1b2434', bordo: '#485870', px: 280, righe: 4
  });
  checkCard.userData.struttura = 1;

  // ==========================================================
  // 7. OGGETTI EROICI FLUTTUANTI (OBJ.matita, OBJ.scheggia, OBJ.taccuino, OBJ.penna)
  // ==========================================================
  // Matita spaziale fluttuante esattamente lungo la visuale della Scena 5 (dettaglio_matita)
  const matitaPos0 = { x: -0.18, y: 1.40, z: -1.14 };
  const matita = matitaSpaziale(M, { ...matitaPos0, rx: 0.16, ry: 0.45, rz: -0.38, s: 1.45, spezzata: true });
  OBJ.matita = matita;

  // Scheggia di grafite separabile: slancio preciso verso le feritoie del vano elettrico (0.22, 0.58, -1.56)
  const scheggia = scheggiaGrafite(M, { x: matitaPos0.x, y: matitaPos0.y, z: matitaPos0.z, s: 1.55 });
  OBJ.scheggia = scheggia;

  // Taccuino di volo aperto fluttuante ancorato con cordino elastico alla consolle
  const taccuino = taccuinoVolo(M, { x: -0.88, y: 1.24, z: -1.36, ry: 0.35, s: 1.05 });
  taccuino.rotation.z = 0.14;
  OBJ.taccuino = taccuino;
  // Cordino nero che lega il taccuino al gancio sinistro della consolle
  const cordaTac = new T.TubeGeometry(new T.CatmullRomCurve3([
    new T.Vector3(-0.88, 1.18, -1.36),
    new T.Vector3(-0.96, 1.02, -1.48),
    new T.Vector3(-1.02, 0.90, -1.60)
  ]), 12, 0.006, 6, false);
  const cordaMesh = new T.Mesh(cordaTac, mScuro);
  cordaMesh.userData.struttura = 1;
  M.root.add(cordaMesh);

  // Penna spaziale Fisher fissata ordinatamente al laccetto laterale sinistro della plancia (mai ad intralciare la matita)
  const penna = pennaFisher(M, { x: -1.18, y: 1.14, z: -1.48, rx: 0.08, ry: 0.25, rz: 1.18, s: 1.05 });
  OBJ.penna = penna;

  // Marca i componenti di consolle/rack come struttura fissa lasciando vivi strumenti, CRT, ventola e allarme
  cons.traverse(o => { if (o.isMesh && !o.userData.vivo && o !== bay) o.userData.struttura = 1; });
  for (const a of lancette) { a.userData.struttura = 0; a.userData.vivo = 1; }
  crtScreen.userData.struttura = 0;
  sferaNav.userData.struttura = 0;
  ventolaBay.traverse(o => { o.userData.struttura = 0; });

  // ==========================================================
  // 8. VITA CONTINUA (M.vita) E TIMELINE SCENA CAPSULA (M.tick)
  // ==========================================================
  M.vita?.aggiungi(matita, 'galleggia', { amp: 0.032, freq: 0.32 });
  M.vita?.aggiungi(taccuino, 'galleggia', { amp: 0.028, freq: 0.26, asse: 'y' });
  M.vita?.aggiungi(sfPlane, 'ondeggia', { amp: 0.015, freq: 0.12, asse: 'z' });

  const vecPunta = new T.Vector3();
  const lancettaA0 = lancettaOffsets();
  function lancettaOffsets() { return lancette.map((_, i) => -0.5 + i * 0.32); }

  (M.tick = M.tick || []).push(t => {
    // Vibrazione dolce delle lancette analogiche
    for (let i = 0; i < lancette.length; i++) {
      const anomalia = (t >= 36.8 && t <= 40.66) ? Math.sin(t * 26 + i * 3) * 0.45 : Math.sin(t * 2.2 + i * 1.7) * 0.08;
      lancette[i].rotation.z = lancettaA0[i] + anomalia;
    }

    // Stato punta spezzata sulla matita
    if (matita.userData.punta) {
      const spezzata = t >= 22.8;
      matita.userData.punta.visible = !spezzata;
    }

    // Traiettoria precisa della scheggia di grafite (Scene 5 -> 6 -> 7)
    if (t < 22.8) {
      scheggia.visible = false;
    } else if (t < 25.02) {
      scheggia.visible = true;
      const k = (t - 22.8) / 2.22;
      scheggia.position.set(
        matitaPos0.x + 0.06 * k,
        matitaPos0.y + 0.06 * k,
        matitaPos0.z + 0.05 * k
      );
      scheggia.rotation.set(t * 1.4, t * 2.1, t * 0.9);
      scheggia.scale.setScalar(1.85);
    } else if (t < 31.9) {
      scheggia.visible = true;
      const k = (t - 25.02) / (31.9 - 25.02);
      // Arco lento davanti alla consolle verso destra/basso
      scheggia.position.set(
        -0.10 + (-0.18) * Math.sin(k * Math.PI) + 0.36 * k,
        1.38 - 0.34 * k + 0.10 * Math.sin(k * Math.PI),
        -1.07 - 0.18 * k
      );
      scheggia.rotation.set(t * 1.6, t * 2.4, t * 1.1);
      scheggia.scale.setScalar(1.85);
    } else if (t < 36.86) {
      scheggia.visible = true;
      const k = Math.min(1, (t - 31.9) / 4.7);
      // Entra dritta al centro delle lamelle (0.22, 0.54, -1.56) lasciando leggibile la targa 28V DC!
      scheggia.position.set(
        0.24 + (0.22 - 0.24) * k,
        0.96 + (0.54 - 0.96) * k,
        -1.26 + (-1.56 + 1.26) * k
      );
      scheggia.rotation.set(t * 2.2, t * 3.1, t * 1.5);
      scheggia.scale.setScalar(1.55 * (1 - 0.30 * k));
    } else {
      scheggia.visible = false;
    }

    if (scheggia.userData.scintilla) {
      scheggia.userData.scintilla.rotation.z = t * 4.5;
    }

    // Corto circuito e allarme rosso (Scena 8: t = 36.86 .. 40.66)
    const emergenza = t >= 36.86 && t <= 40.66;
    scintille.visible = emergenza;
    if (emergenza) {
      const flash = Math.sin(t * 42) > 0.15 ? 1 : 0.2;
      luceCorto.intensity = 4.2 * flash;
      scintille.rotation.z = t * 14;
      for (let i = 0; i < luciArc.length; i++) {
        luciArc[i].scale.setScalar(0.6 + 0.9 * Math.abs(Math.sin(t * 28 + i)));
      }
      const pulse = 0.5 + 0.5 * Math.sin(t * 11);
      mCupolaAllarme.emissiveIntensity = 0.25 + 0.62 * pulse;
      luceAllarme.intensity = 1.2 + 5.2 * pulse;
      allarmeG.rotation.y = (t - 36.86) * 7.5;
    } else {
      luceCorto.intensity = 0;
      mCupolaAllarme.emissiveIntensity = 0.06;
      luceAllarme.intensity = 0;
    }
    void vecPunta;
  });
}
