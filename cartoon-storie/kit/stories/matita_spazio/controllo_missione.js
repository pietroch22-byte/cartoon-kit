import { orologio, adattaTesto } from '/web/buon_senso.js';
import { vivo } from '/web/vivi.js';
import { attrezziSpazio, monitorCRT } from './oggetti_spazio.js';

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
  const X = 4.5, ZF = -4.0, ZB = 5.0, H = 3.2;
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
  // 1. MATERIALI ANTI-MOIRE 1960s NASA MOCR (HOUSTON)
  // ==========================================================
  const texPavimento = tela(512, 512, (c, W, Hc) => {
    c.fillStyle = '#c8c4b6'; c.fillRect(0, 0, W, Hc);
    const cell = 128;
    for (let x = 0; x < W; x += cell) {
      for (let y = 0; y < Hc; y += cell) {
        c.fillStyle = ((x / cell + y / cell) % 2 === 0) ? '#cecabd' : '#c0bcb0';
        c.fillRect(x + 3, y + 3, cell - 6, cell - 6);
        c.strokeStyle = 'rgba(110,106,96,0.35)';
        c.lineWidth = 4;
        c.strokeRect(x + 2, y + 2, cell - 4, cell - 4);
      }
    }
  });
  texPavimento.wrapS = texPavimento.wrapT = T.RepeatWrapping;
  texPavimento.repeat.set(4, 4);
  const mPav = dip(texPavimento, 0.14, 0.80);

  // Pannelli acustici larghi per le pareti superiori (zero righe fini)
  const texParete = tela(512, 512, (c, W, Hc) => {
    c.fillStyle = '#ddd8ca'; c.fillRect(0, 0, W, Hc);
    const step = 128;
    for (let x = 0; x < W; x += step) {
      for (let y = 0; y < Hc; y += step) {
        c.fillStyle = ((x / step + y / step) % 2 === 0) ? '#e3decb' : '#d8d3c2';
        c.fillRect(x + 4, y + 4, step - 8, step - 8);
        c.strokeStyle = 'rgba(130,126,115,0.28)';
        c.lineWidth = 3;
        c.strokeRect(x + 2, y + 2, step - 4, step - 4);
      }
    }
  });
  texParete.wrapS = texParete.wrapT = T.RepeatWrapping;
  texParete.repeat.set(4, 2);

  const mParete = dip(texParete, 0.14, 0.88);
  const mNoce = mat('#5c3d28', 0.08, 0.72, 0.05);
  const mCrema = mat('#e5decb', 0.14, 0.78, 0.04);
  const mConsolle = mat('#56667a', 0.10, 0.68, 0.12);
  const mAcciaio = mat('#94a0b0', 0.10, 0.65, 0.14);
  const mScuro = mat('#2a303a', 0.08, 0.76, 0.10);
  const mOttone = mat('#c89c38', 0.12, 0.62, 0.15);
  const mRosso = mat('#d6362c', 0.16, 0.68, 0.04);
  const mVerde = mat('#428a58', 0.14, 0.72, 0.04);
  const mBlu = mat('#2c5aa0', 0.14, 0.68, 0.04);
  const mCarta = mat('#f2ecdc', 0.16, 0.88, 0.02);

  // ==========================================================
  // 2. STRUTTURA DELLA SALA CONTROLLO + ILLUMINAZIONE A CASSETTONI
  // ==========================================================
  str(sm(9.2, 0.14, ZLEN, mPav, 0, -0.065, ZMID, 0));
  str(sm(9.2, H, 0.16, mParete, 0, H / 2, ZF, 0));
  str(sm(9.2, H, 0.16, mParete, 0, H / 2, ZB, 0));
  str(sm(0.16, H, ZLEN, mParete, -X, H / 2, ZMID, 0));
  str(sm(0.16, H, ZLEN, mParete, X, H / 2, ZMID, 0));
  str(sm(9.2, 0.16, ZLEN, mCrema, 0, H + 0.08, ZMID, 0));

  // Boiserie bassa in legno di noce lungo tutte le pareti
  str(sm(9.0, 0.92, 0.08, mNoce, 0, 0.46, ZF + 0.10, 0.01));
  str(sm(0.08, 0.92, ZLEN - 0.2, mNoce, -X + 0.10, 0.46, ZMID, 0.01));
  str(sm(0.08, 0.92, ZLEN - 0.2, mNoce, X - 0.10, 0.46, ZMID, 0.01));
  // Cornici marcapiano
  str(sm(9.0, 0.06, 0.11, mScuro, 0, 0.94, ZF + 0.11, 0.01));
  str(sm(0.11, 0.06, ZLEN - 0.2, mScuro, -X + 0.11, 0.94, ZMID, 0.01));
  str(sm(0.11, 0.06, ZLEN - 0.2, mScuro, X - 0.11, 0.94, ZMID, 0.01));

  // Travi soffitto e pannelli fluorescenti incassati con luci reali sotto
  for (const lz of [-2.4, -0.5, 1.5]) {
    str(sm(8.8, 0.12, 0.22, mScuro, 0, H - 0.06, lz, 0.01));
    for (const lx of [-2.4, 0.0, 2.4]) {
      str(sm(1.5, 0.05, 0.42, mAcciaio, lx, H - 0.02, lz, 0.01));
      str(sm(1.36, 0.03, 0.30, M.emi('#f6f8ff', 0.78), lx, H - 0.04, lz, 0.01));
    }
  }
  M.luce('#f8faff', 3.4, 0.0, 2.75, -0.6, 10.5);
  M.luce('#f4f7ff', 2.8, -2.5, 2.75, -2.1, 8.5);
  M.luce('#f4f7ff', 2.8, 2.5, 2.75, -2.1, 8.5);
  M.luce('#fff4e4', 2.2, 0.0, 2.75, 1.8, 8.0);

  // ==========================================================
  // 3. MAXI SCHERMO ORBITALE NASA + LAVAGNA COSTI + OROLOGI (PARETE DI FONDO)
  // ==========================================================
  // SINISTRA-CENTRO (x = -1.45, y = 1.95): Grande Mappa Orbitale luminosa (zero testo sovrapposto!)
  const mappaG = grp(-1.45, 1.95, ZF + 0.11);
  str(boxG(mappaG, 3.05, 1.44, 0.08, mScuro, 0, 0, 0));
  const texMappaOrbita = tela(1024, 480, (c, W, Hc) => {
    const bg = c.createLinearGradient(0, 0, 0, Hc);
    bg.addColorStop(0, '#071428');
    bg.addColorStop(1, '#0b1e3b');
    c.fillStyle = bg; c.fillRect(0, 0, W, Hc);

    // Reticolo latitudine / longitudine pulito
    c.strokeStyle = 'rgba(78, 178, 255, 0.20)'; c.lineWidth = 2;
    for (let x = 64; x < W; x += 96) { c.beginPath(); c.moveTo(x, 54); c.lineTo(x, Hc - 56); c.stroke(); }
    for (let y = 80; y < Hc - 56; y += 68) { c.beginPath(); c.moveTo(24, y); c.lineTo(W - 24, y); c.stroke(); }

    // Continenti dettagliati multi-vertice in verde-azzurro tenue (profili cartografici reali!)
    c.fillStyle = '#194d66';
    c.strokeStyle = '#48b6e6'; c.lineWidth = 2.6;
    const blobs = [
      [[88, 108], [135, 92], [202, 86], [242, 105], [278, 92], [296, 118], [268, 148], [250, 178], [228, 185], [218, 212], [192, 224], [176, 198], [150, 178], [132, 134], [98, 126]], // Nord America + Florida + Alaska
      [[238, 232], [272, 240], [312, 268], [304, 308], [276, 355], [254, 388], [238, 370], [234, 308], [220, 266]], // Sud America
      [[454, 152], [462, 118], [492, 92], [534, 86], [566, 98], [568, 144], [546, 166], [516, 174], [488, 168], [468, 174]], // Europa + Scandinavia + Italia
      [[468, 190], [526, 186], [568, 198], [598, 238], [592, 272], [568, 312], [552, 362], [524, 368], [512, 312], [496, 262], [462, 236]], // Africa
      [[572, 96], [662, 84], [768, 86], [858, 98], [912, 118], [892, 156], [855, 198], [818, 214], [786, 246], [748, 242], [718, 258], [696, 218], [648, 214], [612, 196], [574, 172]], // Eurasia + India + Cina + Kamchatka
      [[796, 286], [856, 282], [888, 314], [876, 356], [824, 358], [794, 326]] // Australia
    ];
    for (const poly of blobs) {
      c.beginPath();
      c.moveTo(poly[0][0], poly[0][1]);
      for (let i = 1; i < poly.length; i++) c.lineTo(poly[i][0], poly[i][1]);
      c.closePath(); c.fill(); c.stroke();
    }

    // Traiettoria orbitale sinusoidale luminosa + marker Houston & Baikonur
    c.strokeStyle = '#ffe45e'; c.lineWidth = 5;
    c.beginPath();
    for (let x = 28; x <= W - 28; x += 10) {
      const y = 228 - Math.sin((x / W) * Math.PI * 2.2) * 104;
      if (x === 28) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
    // Punti stazioni tracking
    for (const [sx, sy, lbl] of [[205, 175, 'HOUSTON'], [685, 148, 'BAIKONUR']]) {
      c.fillStyle = '#ff5442'; c.beginPath(); c.arc(sx, sy, 8, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffd8c8'; c.font = 'bold 18px sans-serif'; c.fillText(lbl, sx + 14, sy + 6);
    }

    // Intestazione alta ben centrata con ampi margini
    c.fillStyle = '#0f284a'; c.fillRect(0, 0, W, 48);
    c.fillStyle = '#8ce0ff'; c.font = 'bold 26px sans-serif'; c.textAlign = 'center';
    c.fillText('NASA MISSION CONTROL  —  ORBITAL TELEMETRY', W / 2, 33);

    // Barra telemetria in basso nitida
    c.fillStyle = '#091b34'; c.fillRect(0, Hc - 48, W, 48);
    c.fillStyle = '#62ff9e'; c.font = 'bold 22px monospace';
    c.fillText('ALT: 242 KM     VEL: 27,800 KM/H     CAPSULE: GO     CABIN O2: 100%', W / 2, Hc - 17);
  });
  const mMapScreen = new T.MeshBasicMaterial({ map: texMappaOrbita });
  const mapMesh = into(mappaG, new T.Mesh(new T.PlaneGeometry(2.90, 1.30), mMapScreen));
  mapMesh.position.z = 0.045;
  mapMesh.userData.noRick = 1;
  mapMesh.userData.scritta = 1;
  mapMesh.userData.struttura = 1;

  // Blip navicella animato lungo l'orbita della mappa
  const blip = into(mappaG, new T.Mesh(new T.SphereGeometry(0.036, 12, 10), M.emi('#ffe858', 0.85)));
  blip.position.set(0, 0, 0.068);
  blip.userData.vivo = 1;

  // DESTRA-CENTRO (x = +1.85, y = 1.95): Lavagna di Ardesia incorniciata in quercia + mensola gessetti
  const lavG = grp(1.85, 1.95, ZF + 0.11);
  str(boxG(lavG, 2.38, 1.42, 0.07, mNoce, 0, 0, 0));
  const texLavagna = tela(768, 460, (c, W, Hc) => {
    c.fillStyle = '#1b3828'; c.fillRect(0, 0, W, Hc);
    c.fillStyle = 'rgba(255,255,255,0.04)';
    c.fillRect(90, 80, 260, 120); c.fillRect(420, 220, 220, 110);
    c.textAlign = 'left';
    c.fillStyle = '#eef4e8'; c.font = 'bold 30px sans-serif';
    c.fillText('ZERO-G PEN PROGRAM', 46, 62);
    c.strokeStyle = 'rgba(238,244,232,0.45)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(46, 80); c.lineTo(W - 46, 80); c.stroke();

    c.font = 'bold 25px monospace'; c.fillStyle = '#c8f0d8';
    c.fillText('PRESSURE:  ΔP > 1.2 ATM', 48, 142);
    c.fillText('GRAVITY:   0.00 G  (LEO)', 48, 194);
    c.fillText('INK FLOW:  N2 BLADDER', 48, 246);

    c.fillStyle = '#ffe078'; c.font = 'bold 29px sans-serif';
    c.fillText('R&D BUDGET ESTIMATE:', 48, 326);
    c.fillStyle = '#ff8a78'; c.font = 'bold 42px sans-serif';
    c.fillText('$ 1,500,000 ???', 48, 392);
    c.strokeStyle = '#ff8a78'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(48, 404); c.lineTo(400, 404); c.stroke();
  });
  const lavPl = into(lavG, new T.Mesh(new T.PlaneGeometry(2.22, 1.26), dip(texLavagna, 0.14, 0.90)));
  lavPl.position.z = 0.042;
  lavPl.userData.noRick = 1;
  lavPl.userData.scritta = 1;
  lavPl.userData.struttura = 1;
  // Mensolina porta gessetti sotto la lavagna
  str(boxG(lavG, 2.34, 0.05, 0.12, mNoce, 0, -0.71, 0.06));
  str(boxG(lavG, 0.12, 0.04, 0.07, mScuro, -0.65, -0.66, 0.08));
  str(cilG(lavG, 0.012, 0.012, 0.08, mCarta, -0.35, -0.67, 0.08, 0, 0, Math.PI / 2));
  str(cilG(lavG, 0.012, 0.012, 0.07, mRosso, -0.22, -0.67, 0.08, 0, 0, Math.PI / 2));

  // Due orologi a muro sincronizzati sopra mappa e lavagna (Houston & Moscow)
  orologio(M, { x: -2.10, y: 2.90, z: ZF + 0.11, r: 0.21, ora: '09:15', cornice: '#28384e' });
  cartello('HOUSTON CST', 0.68, 0.14, -1.42, 2.90, ZF + 0.12, 0, {
    fondo: '#182436', colore: '#f4f8ff', bordo: '#6282a8', px: 280, righe: 1
  }).userData.struttura = 1;
  orologio(M, { x: 1.15, y: 2.90, z: ZF + 0.11, r: 0.21, ora: '17:15', cornice: '#6e2424' });
  cartello('MOSCOW MSK', 0.68, 0.14, 1.84, 2.90, ZF + 0.12, 0, {
    fondo: '#361616', colore: '#fff2ea', bordo: '#a85a4a', px: 280, righe: 1
  }).userData.struttura = 1;

  // Ventilatore da soffitto sopra la zona centrale per atmosfera vivace MOCR
  const vent = await vivo(M, 'ventilatore_soffitto', { x: 0.10, y: H - 0.02, z: -2.35, s: 1.05 });
  smorza(vent);

  // Bandiera USA nell'angolo sinistro (tutto agganciato al gruppo bandieraG via into!)
  const bandieraG = grp(-3.82, 0, -3.45, 0.45);
  cilG(bandieraG, 0.24, 0.28, 0.08, mOttone, 0, 0.04, 0);
  cilG(bandieraG, 0.024, 0.030, 2.55, mOttone, 0, 1.32, 0);
  const puntaAsta = into(bandieraG, new T.Mesh(new T.SphereGeometry(0.055, 14, 10), mOttone));
  puntaAsta.position.set(0, 2.63, 0);
  const texUSA = tela(320, 200, (c, W, Hc) => {
    const sh = Hc / 13;
    for (let i = 0; i < 13; i++) {
      c.fillStyle = i % 2 === 0 ? '#b82428' : '#f4f0e8';
      c.fillRect(0, i * sh, W, sh + 1);
    }
    c.fillStyle = '#1d326e'; c.fillRect(0, 0, W * 0.42, sh * 7);
    c.fillStyle = '#ffffff';
    for (let r = 0; r < 5; r++) for (let col = 0; col < 6; col++) {
      c.beginPath(); c.arc(14 + col * 20, 12 + r * 20, 3.2, 0, Math.PI * 2); c.fill();
    }
  });
  const drappo = into(bandieraG, new T.Mesh(new T.PlaneGeometry(0.86, 0.56, 8, 4), dip(texUSA, 0.14, 0.85)));
  drappo.position.set(0.42, 2.26, 0.04);
  drappo.rotation.y = -0.18;
  drappo.material.side = T.DoubleSide;
  drappo.userData.noRick = 1;
  M.vita?.aggiungi(drappo, 'ondeggia', { amp: 0.035, freq: 0.38, asse: 'y' });

  // ==========================================================
  // 4. SCRIVANIA IN PRIMO PIANO (scienziato_nasa a x=0.3, z=-1.4) + OBJ.sacco_soldi
  // ==========================================================
  // Centrata a x = +0.10, z = -0.82 (profondità 0.54m -> z da -1.09 a -0.55), lascia spazio dietro z = -1.4!
  const bancoSci = grp(0.08, 0, -0.82);
  // Piano principale e struttura gambe
  str(boxG(bancoSci, 2.45, 0.06, 0.62, mCrema, 0, 0.74, 0));
  str(boxG(bancoSci, 2.34, 0.52, 0.05, mConsolle, 0, 0.45, 0.25)); // pannello frontale pulito
  str(boxG(bancoSci, 0.56, 0.70, 0.54, mConsolle, -0.88, 0.35, 0)); // cassettiera sinistra
  str(boxG(bancoSci, 0.56, 0.70, 0.54, mConsolle, 0.88, 0.35, 0));  // cassettiera destra
  for (let row = 0; row < 3; row++) {
    boxG(bancoSci, 0.16, 0.024, 0.03, mAcciaio, -0.88, 0.56 - row * 0.18, 0.29);
    boxG(bancoSci, 0.16, 0.024, 0.03, mAcciaio, 0.88, 0.56 - row * 0.18, 0.29);
  }

  // Due terminali telemetrici CRT sul lato sinistro del banco
  const mon1 = monitorCRT(M, { x: -0.78, y: 0.77, z: -0.06, ry: 0.28, w: 0.40, h: 0.30, d: 0.28, coloreFosforo: '#55ff90' });
  into(bancoSci, mon1);
  const mon2 = monitorCRT(M, { x: -0.34, y: 0.77, z: -0.10, ry: 0.08, w: 0.34, h: 0.26, d: 0.26, coloreFosforo: '#ffc848' });
  into(bancoSci, mon2);

  // Pannello pulsanti luminosi GO / NO-GO davanti ai terminali
  boxG(bancoSci, 0.48, 0.04, 0.14, mScuro, -0.55, 0.79, 0.16, 0.22);
  for (let i = 0; i < 4; i++) {
    boxG(bancoSci, 0.06, 0.025, 0.05, i === 2 ? mRosso : mVerde, -0.70 + i * 0.10, 0.815, 0.17);
  }

  // Telefono rosso HOTLINE sul centro scrivania
  const telG = into(bancoSci, new T.Group());
  telG.position.set(0.06, 0.77, 0.08);
  boxG(telG, 0.16, 0.07, 0.18, mRosso, 0, 0.035, 0);
  boxG(telG, 0.21, 0.035, 0.055, mRosso, 0, 0.095, -0.02);
  cilG(telG, 0.035, 0.042, 0.02, mCarta, 0, 0.065, 0.045, 0.45); // ghiera disco bianco

  // Tazza NASA fumante + faldoni impilati + blocco note
  cilG(bancoSci, 0.042, 0.038, 0.095, mCarta, 0.30, 0.82, 0.14);
  cilG(bancoSci, 0.044, 0.044, 0.02, mBlu, 0.30, 0.83, 0.14);
  boxG(bancoSci, 0.26, 0.03, 0.32, mBlu, 0.36, 0.785, -0.08, 0, -0.14);
  boxG(bancoSci, 0.25, 0.028, 0.30, mCarta, 0.35, 0.814, -0.08, 0, -0.05);

  // Vapore leggero dalla tazza di caffè sullo scrittoio (noInk evita cerchi neri cartoni!)
  const vaporeBanco = into(bancoSci, new T.Group());
  vaporeBanco.position.set(0.30, 0.90, 0.14);
  const puffTazza = [];
  const mVap = new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false });
  for (let i = 0; i < 3; i++) {
    const p = into(vaporeBanco, new T.Mesh(new T.SphereGeometry(0.022 + i * 0.008, 8, 8), mVap.clone()));
    p.position.y = i * 0.045;
    p.userData.noInk = 1;
    p.userData.noRick = 1;
    p.userData.vivo = 1;
    puffTazza.push(p);
  }
  // Anima gli schermi CRT e segna struttura fissa sulla scrivania
  bancoSci.traverse(o => { if (o.isMesh && !o.userData.vivo) o.userData.struttura = 1; });
  for (const m of [mon1, mon2]) {
    if (m.userData.schermo) {
      m.userData.schermo.userData.struttura = 0;
      M.vita?.aggiungi(m.userData.schermo, 'lampeggia', { min: 0.86, freq: 1.4, modo: 'respiro' });
    }
  }

  // HERO PROP: OBJ.sacco_soldi (su banco destra-centro: world x=+0.74, y=0.77, z=-0.78, inquadrato da t=7.2!)
  const sacco = grp(0.74, 0.77, -0.78, -0.25);
  const mTelaSacco = mat('#d6be86', 0.14, 0.90, 0.02);
  const mSpago = mat('#8a6838', 0.10, 0.88, 0.02);
  const corpoSacco = into(sacco, new T.Mesh(new T.SphereGeometry(0.17, 20, 14), mTelaSacco));
  corpoSacco.scale.set(1.06, 1.18, 0.94);
  corpoSacco.position.y = 0.17;
  // Collo arricciato + nodo di corda
  cilG(sacco, 0.085, 0.058, 0.09, mTelaSacco, 0, 0.37, 0);
  const cordaNodo = into(sacco, new T.Mesh(new T.TorusGeometry(0.062, 0.013, 8, 20), mSpago));
  cordaNodo.rotation.x = Math.PI / 2;
  cordaNodo.position.y = 0.33;
  // Stampa grande "$" sul sacco (usando Plane curvo / cartellino aderente davanti)
  const texDollaro = tela(160, 160, (c, W, Hc) => {
    c.fillStyle = '#d6be86'; c.fillRect(0, 0, W, Hc);
    c.strokeStyle = '#285e2a'; c.lineWidth = 8; c.strokeRect(10, 10, W - 20, Hc - 20);
    c.fillStyle = '#1b5822'; c.font = 'bold 110px sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('$', W / 2, Hc / 2 + 6);
  });
  const fronteSacco = into(sacco, new T.Mesh(new T.PlaneGeometry(0.18, 0.18), dip(texDollaro, 0.18, 0.85)));
  fronteSacco.position.set(0, 0.17, 0.16);
  fronteSacco.userData.scritta = 1;
  // Mazzette verdi di banconote sparse ai piedi del sacco
  for (const [bx, bz, ry] of [[-0.22, 0.11, 0.35], [-0.15, 0.19, -0.22], [0.20, 0.13, 0.18]]) {
    const bill = boxG(sacco, 0.10, 0.022, 0.05, mVerde, bx, 0.011, bz, 0, ry);
    boxG(sacco, 0.022, 0.024, 0.052, mCarta, bx, 0.012, bz, 0, ry); // fascetta bianca banconota
    void bill;
  }
  OBJ.sacco_soldi = sacco;

  // ==========================================================
  // 5. SECONDA FILA DI CONSOLLE DI CONTROLLO (z = -2.55) + PERSONALE
  // ==========================================================
  const creaPostazione = (px, pz, ry = 0) => {
    const pg = grp(px, 0, pz, ry);
    str(boxG(pg, 1.55, 0.74, 0.65, mConsolle, 0, 0.37, 0));
    boxG(pg, 1.58, 0.04, 0.68, mCrema, 0, 0.75, 0);
    boxG(pg, 1.50, 0.28, 0.32, mScuro, 0, 0.90, -0.14);
    const m1 = monitorCRT(M, { x: -0.36, y: 0.77, z: -0.02, ry: 0.1, w: 0.38, h: 0.28, d: 0.26, coloreFosforo: '#50ee88' });
    into(pg, m1);
    const m2 = monitorCRT(M, { x: 0.32, y: 0.77, z: -0.02, ry: -0.1, w: 0.38, h: 0.28, d: 0.26, coloreFosforo: '#62c8ff' });
    into(pg, m2);
    // Sedia girevole davanti alla postazione
    const sed = into(pg, new T.Group());
    sed.position.set(0.05, 0, 0.56);
    cilG(sed, 0.03, 0.03, 0.42, mAcciaio, 0, 0.24, 0);
    boxG(sed, 0.42, 0.06, 0.40, mScuro, 0, 0.46, 0);
    boxG(sed, 0.40, 0.38, 0.06, mScuro, 0, 0.66, 0.18);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.4;
      boxG(sed, 0.28, 0.03, 0.04, mAcciaio, Math.cos(a) * 0.12, 0.03, Math.sin(a) * 0.12, 0, -a);
    }
    pg.traverse(o => { if (o.isMesh) o.userData.struttura = 1; });
    for (const ms of [m1, m2]) if (ms.userData.schermo) {
      ms.userData.schermo.userData.struttura = 0;
      M.vita?.aggiungi(ms.userData.schermo, 'lampeggia', { min: 0.85, freq: 1.3, modo: 'respiro' });
    }
    return pg;
  };
  creaPostazione(-2.45, -2.55, 0.06);
  creaPostazione(2.25, -2.55, -0.06);

  // Tecnici NASA (comparse in stile Rick) dietro alle postazioni laterali, fuori dalle linee di sguardo verso il protagonista
  for (const [cx, cz, seme, ry] of [[-2.42, -3.15, 17, 0.15], [2.42, -3.10, 41, -0.18]]) {
    const tec = M.omino({ ...M.personalita(seme), posa: 'fermo', verso: 1 }, cx, cz, ry);
    tec.name = 'comparsa';
    tec.userData.vivo = 'comparsa';
    M.vita?.aggiungi(tec, 'respira', { amp: 0.013, freq: 0.25, seme });
  }

  // ==========================================================
  // 6. MAINFRAME A NASTRI MAGNETICI (PARETE SINISTRA) + PORTA & ARREDI DESTRA
  // ==========================================================
  const bobine = [];
  for (let k = 0; k < 2; k++) {
    const cab = grp(-X + 0.36, 0, -1.75 + k * 1.15, Math.PI / 2);
    str(boxG(cab, 0.88, 2.05, 0.56, mConsolle, 0, 1.025, 0));
    boxG(cab, 0.78, 0.92, 0.04, mScuro, 0, 1.48, 0.28);
    // Due grandi bobine rotanti dietro la finestra superiore del computer IBM
    for (const bx of [-0.18, 0.18]) {
      const bobinaG = into(cab, new T.Group());
      bobinaG.position.set(bx, 1.56, 0.305);
      cilG(bobinaG, 0.16, 0.16, 0.03, mAcciaio, 0, 0, 0, Math.PI / 2);
      cilG(bobinaG, 0.04, 0.04, 0.045, mRosso, 0, 0, 0.005, Math.PI / 2);
      boxG(bobinaG, 0.26, 0.025, 0.015, mCarta, 0, 0, 0.023);
      M.vita?.aggiungi(bobinaG, 'gira', { vel: 0.9 + k * 0.3, asse: 'z' });
      bobine.push(bobinaG);
    }
    // Pannellino luci binarie intermittenti
    for (let j = 0; j < 6; j++) {
      boxG(cab, 0.06, 0.03, 0.02, j % 2 === 0 ? M.emi('#ffb838', 0.75) : M.emi('#52f088', 0.75), -0.25 + j * 0.10, 0.90, 0.29);
    }
  }

  // Parete destra: doppia porta vetrata d'uscita, scheda cartografica, schedari e distributore acqua
  const porta = await vivo(M, 'porta_doppia', { x: X - 0.10, y: 0, z: 0.55, ry: -Math.PI / 2, s: 1.0 });
  smorza(porta);
  cartello('EXIT  ->  FLIGHT CORRIDOR', 0.82, 0.18, X - 0.11, 2.38, 0.55, -Math.PI / 2, {
    fondo: '#164222', colore: '#e6ffe8', bordo: '#88e296', px: 300, righe: 1
  });

  // Schedari metallici grigi + distributore acqua con boccione azzurro (lato destro fondo)
  for (let i = 0; i < 2; i++) {
    const cas = grp(X - 0.40, 0, -2.15 + i * 0.62, -Math.PI / 2);
    str(boxG(cas, 0.54, 1.38, 0.58, mAcciaio, 0, 0.69, 0));
    for (let d = 0; d < 4; d++) {
      boxG(cas, 0.44, 0.28, 0.02, mCrema, 0, 0.22 + d * 0.32, 0.295);
      boxG(cas, 0.12, 0.025, 0.025, mScuro, 0, 0.22 + d * 0.32, 0.315);
    }
  }
  const acqua = grp(X - 0.42, 0, -0.82, -Math.PI / 2);
  str(boxG(acqua, 0.38, 0.96, 0.38, mCarta, 0, 0.48, 0));
  const mAcquaVetro = new T.MeshStandardMaterial({ color: '#6ec4ff', roughness: 0.25, transparent: true, opacity: 0.65 });
  cilG(acqua, 0.14, 0.15, 0.44, mAcquaVetro, 0, 1.22, 0);

  // ==========================================================
  // 7. VITA CONTINUA (blip mappa + vapore caffè)
  // ==========================================================
  (M.tick = M.tick || []).push(t => {
    // Navicella luminosa che percorre la traiettoria sinusoidale sul maxi schermo
    const phase = (t * 0.08) % 1;
    const bx = -1.36 + phase * 2.72;
    const by = Math.sin(phase * Math.PI * 2.2) * 0.28;
    blip.position.set(bx, by, 0.068);

    // Sbuffi morbidi di vapore caldo dalla tazza NASA
    for (let i = 0; i < puffTazza.length; i++) {
      const p = puffTazza[i];
      const u = ((t * 0.45 + i * 0.33) % 1);
      p.position.y = u * 0.20;
      p.position.x = Math.sin(t * 2 + i) * 0.015;
      p.scale.setScalar(0.7 + u * 0.8);
      p.material.opacity = 0.34 * (1 - u);
    }
  });
}
