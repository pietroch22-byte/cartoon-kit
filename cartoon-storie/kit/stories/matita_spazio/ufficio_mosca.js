import { orologio, adattaTesto } from '/web/buon_senso.js';
import { vivo } from '/web/vivi.js';
import { attrezziSpazio } from './oggetti_spazio.js';

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
  const X = 3.5, ZF = -3.0, ZB = 5.0, H = 3.0;
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
  const str = (m) => {
    if (m.traverse) m.traverse(c => { c.userData.struttura = 1; });
    m.userData.struttura = 1;
    return m;
  };

  // ==========================================================
  // 1. MATERIALI ANTI-MOIRE MINISTERIALE MOSCA (1960s)
  // ==========================================================
  // Parquet a listoni larghi di rovere caldo (0 righe sottili anti-tremolio)
  const texParquet = tela(512, 512, (c, W, Hc) => {
    c.fillStyle = '#7d5230'; c.fillRect(0, 0, W, Hc);
    const cols = ['#845834', '#764d2b', '#8d603a', '#6e4626'];
    const pw = 128, ph = 64;
    for (let y = 0; y < Hc; y += ph) {
      const shift = ((y / ph) % 2) * 64;
      for (let x = -64; x < W + 64; x += pw) {
        const idx = Math.abs(Math.floor((x + y) / 64)) % cols.length;
        c.fillStyle = cols[idx];
        c.fillRect(x + shift + 2, y + 2, pw - 4, ph - 4);
        c.strokeStyle = 'rgba(48,28,14,0.35)';
        c.lineWidth = 3;
        c.strokeRect(x + shift + 1, y + 1, pw - 2, ph - 2);
      }
    }
  });
  texParquet.wrapS = texParquet.wrapT = T.RepeatWrapping;
  texParquet.repeat.set(3, 4);
  const mParquet = dip(texParquet, 0.10, 0.72);

  // Carta da parati verde-salvia a fasce verticali ampie e tenui (zero moire)
  const texParati = tela(512, 512, (c, W, Hc) => {
    c.fillStyle = '#5c725e'; c.fillRect(0, 0, W, Hc);
    for (let x = 0; x < W; x += 64) {
      c.fillStyle = (x / 64) % 2 === 0 ? '#657c68' : '#566b58';
      c.fillRect(x, 0, 64, Hc);
    }
    // Finitura boiserie bassa dipinta in basso
    c.fillStyle = '#4a2e1b';
    c.fillRect(0, Hc * 0.66, W, Hc * 0.34);
  });
  texParati.wrapS = texParati.wrapT = T.RepeatWrapping;
  texParati.repeat.set(3, 1);

  const mMuro = dip(texParati, 0.12, 0.86);
  const mNoce = mat('#5c3820', 0.10, 0.68, 0.05);
  const mMogano = mat('#743022', 0.12, 0.66, 0.05);
  const mOttone = mat('#c89c38', 0.12, 0.60, 0.15);
  const mOro = mat('#deb848', 0.14, 0.62, 0.14);
  const mPelleVerde = mat('#1c4e36', 0.10, 0.74, 0.04);
  const mVetroVerde = mat('#1d6e46', 0.24, 0.45, 0.05);
  const mRosso = mat('#b82422', 0.14, 0.72, 0.04);
  const mRossoScuro = mat('#7c1818', 0.12, 0.82, 0.03);
  const mAcciaio = mat('#98a2b0', 0.10, 0.64, 0.14);
  const mCarta = mat('#f2ebd6', 0.14, 0.88, 0.02);
  const mScuro = mat('#222428', 0.08, 0.78, 0.08);

  // ==========================================================
  // 2. STRUTTURA STANZA MINISTERIALE + FINESTRA NOTTURNA SU MOSCA
  // ==========================================================
  // Pavimento top a +0.005 (evita Z-fighting con D.road a y=0) e parete posteriore oltre il dolly (ZB=5.0)
  str(sm(7.2, 0.14, ZLEN, mParquet, 0, -0.065, ZMID, 0));
  str(sm(7.2, H, 0.16, mMuro, 0, H / 2, ZF, 0));
  str(sm(7.2, H, 0.16, mMuro, 0, H / 2, ZB, 0));
  str(sm(0.16, H, ZLEN, mMuro, X, H / 2, ZMID, 0));
  // Parete sinistra con vera apertura finestra su Mosca (-X, centrata a z=-0.6, y=1.65, 1.35x1.50m)
  // Foratura netta lungo Z: [-3.10 .. -1.28], [-1.28 .. +0.08 aperto x y: 0.90..2.40], [+0.08 .. +5.10]
  str(sm(0.16, H, 1.82, mMuro, -X, H / 2, -2.19, 0));
  str(sm(0.16, H, ZB + 0.02, mMuro, -X, H / 2, (0.08 + ZB + 0.10) * 0.5, 0));
  str(sm(0.16, 0.90, 1.36, mMuro, -X, 0.45, -0.60, 0));
  str(sm(0.16, 0.60, 1.36, mMuro, -X, 2.70, -0.60, 0));

  // Soffitto crema caldo + cornici perimetrali
  str(sm(7.2, 0.16, ZLEN, mat('#e6dec8', 0.14, 0.86, 0), 0, H + 0.08, ZMID, 0));
  str(sm(7.0, 0.07, 0.10, mNoce, 0, 1.05, ZF + 0.10, 0.01));
  str(sm(0.10, 0.07, ZLEN - 0.2, mNoce, X - 0.10, 1.05, ZMID, 0.01));
  str(sm(7.0, 0.10, 0.12, mOro, 0, H - 0.06, ZF + 0.10, 0.01));
  str(sm(0.10, 0.10, ZLEN - 0.2, mOro, X - 0.10, H - 0.06, ZMID, 0.01));

  // Scatola esterna ermetica dietro la finestra sinistra (notte innevata sul Cremlino, 0% vuoto!)
  const winBoxM = mat('#0a1224', 0.04, 0.92, 0);
  const wb = (w, h, d, x, y, z) => { const m = str(sm(w, h, d, winBoxM, x, y, z, 0)); m.userData.noRick = 1; return m; };
  wb(0.9, 1.9, 0.10, -X - 0.45, 1.65, -1.38);
  wb(0.9, 1.9, 0.10, -X - 0.45, 1.65, 0.18);
  wb(0.9, 0.10, 1.66, -X - 0.45, 2.55, -0.60);
  wb(0.9, 0.10, 1.66, -X - 0.45, 0.75, -0.60);

  const texMoscaNotte = tela(512, 512, (c, W, Hc) => {
    const g = c.createLinearGradient(0, 0, 0, Hc);
    g.addColorStop(0, '#09122a');
    g.addColorStop(0.65, '#192a54');
    g.addColorStop(1, '#26365c');
    c.fillStyle = g; c.fillRect(0, 0, W, Hc);
    // Stelle e fiocchi di neve leggeri
    let s = 7731;
    const rn = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 65; i++) {
      c.fillStyle = 'rgba(230,240,255,0.75)';
      c.beginPath(); c.arc(rn() * W, rn() * Hc, 1.2 + rn() * 2, 0, Math.PI * 2); c.fill();
    }
    // Torri rosse del Cremlino e tetti innevati in lontananza (Torre Spasskaya + mura)
    c.fillStyle = '#2d1c24';
    c.fillRect(0, Hc * 0.72, W, Hc * 0.28);
    // Palazzo iluminato sulla sinistra
    c.fillStyle = '#3b242a';
    c.fillRect(28, Hc * 0.60, 102, Hc * 0.14);
    for (let wx = 40; wx < 120; wx += 22) {
      c.fillStyle = '#ffd978'; c.fillRect(wx, Hc * 0.63, 10, 14);
    }
    // Torre Spasskaya con orologio dorato
    c.fillStyle = '#48222a';
    c.fillRect(140, Hc * 0.46, 86, Hc * 0.27);
    c.fillStyle = '#18141c'; c.beginPath(); c.arc(183, Hc * 0.56, 17, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#e8c456'; c.lineWidth = 3; c.stroke();
    c.beginPath(); c.moveTo(183, Hc * 0.56); c.lineTo(183, Hc * 0.51); c.moveTo(183, Hc * 0.56); c.lineTo(192, Hc * 0.56); c.stroke();
    c.fillStyle = '#48222a';
    c.beginPath(); c.moveTo(132, Hc * 0.46); c.lineTo(183, Hc * 0.20); c.lineTo(234, Hc * 0.46); c.closePath(); c.fill();
    // Seconda torre in lontananza sulla destra
    c.fillStyle = '#3a1c24';
    c.fillRect(320, Hc * 0.54, 62, Hc * 0.19);
    c.beginPath(); c.moveTo(314, Hc * 0.54); c.lineTo(351, Hc * 0.34); c.lineTo(388, Hc * 0.54); c.closePath(); c.fill();
    // Stella rossa sulla punta della torre principale
    c.fillStyle = '#ff4438'; c.beginPath(); c.arc(183, Hc * 0.18, 9, 0, Math.PI * 2); c.fill();
    // Tetti bianchi di neve
    c.fillStyle = '#dce8f8';
    c.fillRect(0, Hc * 0.72, W, 10);
  });
  const bgNotte = new T.Mesh(new T.PlaneGeometry(1.56, 1.72), new T.MeshBasicMaterial({ map: texMoscaNotte }));
  M.root.add(bgNotte);
  bgNotte.position.set(-X - 0.85, 1.65, -0.60);
  bgNotte.rotation.y = Math.PI / 2;
  bgNotte.userData.noRick = 1;
  bgNotte.userData.struttura = 1;

  // Fiocchi di neve leggeri animati nello spessore esterno dietro il vetro
  const neveG = grp(-X - 0.48, 1.65, -0.60);
  neveG.userData.vivo = 1; neveG.userData.noRick = 1; neveG.userData.noInk = 1;
  const mNeve = new T.MeshBasicMaterial({ color: '#eef6ff', transparent: true, opacity: 0.78 });
  const fiocchi = [];
  for (let i = 0; i < 14; i++) {
    const f = into(neveG, new T.Mesh(new T.SphereGeometry(0.011 + (i % 3) * 0.004, 6, 6), mNeve));
    f.userData.noInk = 1; f.userData.noRick = 1; f.userData.vivo = 1;
    f.position.set(((i * 37) % 10 - 5) * 0.03, 0, -0.58 + (i / 13) * 1.16);
    fiocchi.push({ m: f, fase: i * 0.21, z0: f.position.z });
  }

  // Telaio finestra in legno, traversini, vetro e tende di velluto rosso scuro
  const finG = grp(-X + 0.08, 1.65, -0.60, Math.PI / 2);
  boxG(finG, 1.42, 0.08, 0.14, mNoce, 0, 0.75, 0);
  boxG(finG, 1.46, 0.09, 0.18, mNoce, 0, -0.75, 0);
  boxG(finG, 0.08, 1.50, 0.14, mNoce, -0.68, 0, 0);
  boxG(finG, 0.08, 1.50, 0.14, mNoce, 0.68, 0, 0);
  boxG(finG, 0.045, 1.44, 0.06, mNoce, 0, 0, 0);
  boxG(finG, 1.32, 0.045, 0.06, mNoce, 0, 0.12, 0);
  const vetroFin = into(finG, new T.Mesh(
    new T.PlaneGeometry(1.30, 1.44),
    new T.MeshBasicMaterial({ color: '#b4cce8', transparent: true, opacity: 0.10, depthWrite: false })
  ));
  vetroFin.userData.noInk = 1; vetroFin.userData.noRick = 1;
  // Tende pesanti bordeaux ai lati
  boxG(finG, 0.34, 1.88, 0.10, mRossoScuro, -0.76, -0.08, 0.08);
  boxG(finG, 0.34, 1.88, 0.10, mRossoScuro, 0.76, -0.08, 0.08);
  cilG(finG, 0.022, 0.022, 2.05, mOttone, 0, 0.86, 0.08, 0, 0, Math.PI / 2);
  str(finG);

  // Tappeto orientale russo sotto la scrivania (ben staccato sopra +0.005)
  const texTappeto = tela(512, 360, (c, W, Hc) => {
    c.fillStyle = '#6e1c1a'; c.fillRect(0, 0, W, Hc);
    c.strokeStyle = '#d4aa48'; c.lineWidth = 10; c.strokeRect(18, 18, W - 36, Hc - 36);
    c.strokeStyle = '#243a4c'; c.lineWidth = 5; c.strokeRect(34, 34, W - 68, Hc - 68);
    c.fillStyle = '#8b2420'; c.fillRect(58, 58, W - 116, Hc - 116);
    c.strokeStyle = '#e0be62'; c.lineWidth = 4; c.strokeRect(72, 72, W - 144, Hc - 144);
  });
  const tappeto = str(sm(3.85, 0.015, 2.45, dip(texTappeto, 0.12, 0.88), 0, 0.013, -0.88, 0));
  tappeto.userData.noRick = 1;

  // ==========================================================
  // 3. LAMPADARIO CLASSICO A BRACCI + LUCE CALDA CALIBRATA (ZERO ABBAGLI!)
  // ==========================================================
  const lampadario = grp(0, H, -0.86);
  cilG(lampadario, 0.12, 0.14, 0.05, mOro, 0, -0.025, 0);
  cilG(lampadario, 0.024, 0.028, 0.56, mOttone, 0, -0.30, 0);
  cilG(lampadario, 0.085, 0.065, 0.10, mOro, 0, -0.58, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const gx = Math.cos(a) * 0.36, gz = Math.sin(a) * 0.36;
    const br = boxG(lampadario, 0.38, 0.024, 0.024, mOttone, gx * 0.5, -0.57, gz * 0.5, 0, -a, 0.12);
    void br;
    cilG(lampadario, 0.055, 0.042, 0.04, mOro, gx, -0.53, gz);
    // Globo opalino tenue (emissiva <= 0.82 per evitare aloni bianchi giganti!)
    const globo = into(lampadario, new T.Mesh(new T.SphereGeometry(0.088, 16, 12), M.emi('#fff1c8', 0.80)));
    globo.position.set(gx, -0.45, gz);
    globo.userData.vivo = 1;
  }
  lampadario.userData.vivo = 1;
  M.vita?.aggiungi(lampadario, 'ondeggia', { amp: 0.014, freq: 0.22, asse: 'z' });
  M.luce('#ffe6bd', 3.4, 0.0, 2.25, -0.75, 8.5);
  M.luce('#fff0d2', 2.4, -1.6, 2.25, 0.85, 6.5);
  M.luce('#ffdcb0', 2.2, 1.6, 2.25, -1.25, 6.5);
  M.luce('#ffe8c4', 2.0, 0.0, 2.25, 2.60, 7.0);
  M.luce('#ffe2b4', 1.5, -2.3, 1.75, -1.95, 4.2);

  // Helper locale per creare ogni oggetto indipendente top-level con nome proprio (ricchezza + regia)
  const objG = (name, x, y, z, ry = 0) => {
    const g = grp(x, y, z, ry);
    g.name = name;
    return g;
  };
  const mVerdeAcciaio = mat('#405848', 0.12, 0.72, 0.12);
  const mPelleMarrone = mat('#5c321c', 0.12, 0.72, 0.04);
  const mCappotto = mat('#5a6066', 0.10, 0.86, 0.02);
  const mPelo = mat('#362c28', 0.08, 0.90, 0.02);
  const mLegnoChiaro = mat('#9e7448', 0.12, 0.70, 0.04);
  const mMatitaColors = ['#d84038', '#3c78b8', '#e6b83c', '#3c8c58', '#d87c2c'];

  // ==========================================================
  // 4. PARETE DI FONDO: MAPPA URSS, LIBRERIE, MODELLINI, PENDOLO, RITRATTO, GAGLIARDETTO, APPLIQUES
  // ==========================================================
  const mappaG = objG('mappa_urss', 0, 1.98, ZF + 0.11);
  boxG(mappaG, 2.68, 1.36, 0.07, mNoce, 0, 0, 0);
  boxG(mappaG, 2.58, 1.26, 0.03, mOro, 0, 0, 0.025);
  const texURSS = tela(1024, 512, (c, W, Hc) => {
    c.fillStyle = '#efe5ca'; c.fillRect(0, 0, W, Hc);
    c.strokeStyle = '#6c421e'; c.lineWidth = 4; c.strokeRect(14, 14, W - 28, Hc - 28);
    c.strokeStyle = 'rgba(130,98,58,0.22)'; c.lineWidth = 2;
    for (let x = 80; x < W; x += 100) { c.beginPath(); c.moveTo(x, 68); c.lineTo(x, Hc - 32); c.stroke(); }
    for (let y = 90; y < Hc - 20; y += 70) { c.beginPath(); c.moveTo(28, y); c.lineTo(W - 28, y); c.stroke(); }
    c.fillStyle = '#c8342a';
    c.strokeStyle = '#781410'; c.lineWidth = 4;
    c.beginPath();
    c.moveTo(132, 278); c.lineTo(148, 224); c.lineTo(136, 185); c.lineTo(170, 152);
    c.lineTo(196, 118); c.lineTo(240, 114); c.lineTo(256, 142); c.lineTo(298, 134);
    c.lineTo(342, 112); c.lineTo(418, 108); c.lineTo(465, 92);  c.lineTo(525, 86);
    c.lineTo(568, 98);  c.lineTo(628, 88);  c.lineTo(712, 92);  c.lineTo(806, 98);
    c.lineTo(892, 116); c.lineTo(952, 138); c.lineTo(924, 168); c.lineTo(892, 166);
    c.lineTo(898, 232); c.lineTo(870, 214); c.lineTo(836, 194); c.lineTo(808, 248);
    c.lineTo(790, 298); c.lineTo(758, 336); c.lineTo(710, 314); c.lineTo(654, 304);
    c.lineTo(596, 314); c.lineTo(548, 336); c.lineTo(498, 366); c.lineTo(436, 378);
    c.lineTo(382, 366); c.lineTo(334, 344); c.lineTo(296, 370); c.lineTo(252, 356);
    c.lineTo(222, 318); c.lineTo(186, 334); c.lineTo(154, 312); c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = '#9ec4d8';
    c.beginPath(); c.ellipse(278, 344, 15, 30, 0.25, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(342, 330, 12, 16, 0.1, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(602, 276, 26, 8, -0.55, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(72,18,14,0.42)'; c.lineWidth = 3;
    for (let u = 0; u < 6; u++) {
      const ux = 358 + u * 4, uy = 148 + u * 26;
      c.beginPath(); c.moveTo(ux - 8, uy + 8); c.lineTo(ux, uy); c.lineTo(ux + 8, uy + 8); c.stroke();
    }
    c.strokeStyle = '#ffd84e'; c.lineWidth = 4; c.setLineDash([12, 8]);
    c.beginPath(); c.moveTo(356, 318); c.quadraticCurveTo(610, 140, 886, 162); c.stroke();
    c.setLineDash([]);
    for (const [mx, my, lbl] of [[218, 224, 'МОСКВА'], [356, 318, 'БАЙКОНУР']]) {
      c.fillStyle = '#ffe14a';
      c.beginPath(); c.arc(mx, my, 10, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#4a120e'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#ffffff'; c.font = 'bold 20px sans-serif'; c.textAlign = 'left';
      c.fillText(lbl, mx + 15, my + 7);
    }
    c.fillStyle = '#6a1816'; c.fillRect(20, 20, W - 40, 52);
    c.fillStyle = '#fce89e'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 28px sans-serif';
    c.fillText('СОВЕТСКИЙ СОЮЗ  —  КОСМИЧЕСКАЯ ПРОГРАММА', W / 2, 47);
  });
  const mapPlane = into(mappaG, new T.Mesh(new T.PlaneGeometry(2.50, 1.18), dip(texURSS, 0.16, 0.84)));
  mapPlane.position.z = 0.044;
  mapPlane.userData.noRick = 1;
  mapPlane.userData.scritta = 1;
  str(mappaG); // Grande cornice murale: struttura fissa, non oggetto mobile

  // Segnale orbitale animato Soyuz sulla mappa dell'URSS
  const blipSoyuz = objG('segnale_soyuz', 0, 1.98, ZF + 0.162);
  blipSoyuz.userData.vivo = 1; blipSoyuz.userData.noRick = 1;
  const blipCore = into(blipSoyuz, new T.Mesh(new T.SphereGeometry(0.026, 10, 8), M.emi('#ffe45c', 0.85)));
  blipCore.userData.vivo = 1; blipCore.userData.noRick = 1;

  // Ritratto incorniciato sopra la mappa (come nelle foto reali dello studio di Korolev)
  const quadroG = objG('quadro_capo', 0, 2.77, ZF + 0.10);
  boxG(quadroG, 0.34, 0.34, 0.03, mNoce, 0, 0, 0);
  const texRitratto = tela(192, 224, (c, W, Hc) => {
    c.fillStyle = '#dcd4be'; c.fillRect(0, 0, W, Hc);
    c.strokeStyle = '#6c421e'; c.lineWidth = 6; c.strokeRect(8, 8, W - 16, Hc - 16);
    c.fillStyle = '#2d2926';
    c.beginPath(); c.arc(W / 2, Hc * 0.40, 34, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(W / 2, Hc * 0.84, 52, 42, 0, Math.PI, 0, false); c.fill();
    c.fillStyle = '#c8aa68'; c.fillRect(W / 2 - 22, Hc * 0.80, 44, 8);
  });
  const ritPlane = into(quadroG, new T.Mesh(new T.PlaneGeometry(0.27, 0.28), dip(texRitratto, 0.12, 0.86)));
  ritPlane.position.z = 0.02;

  // Gagliardetto sovietico rosso con frange dorate a destra della mappa (visto in foto Korolev)
  const gagl = objG('gagliardetto_urss', 1.54, 1.84, ZF + 0.11);
  boxG(gagl, 0.34, 0.022, 0.022, mOro, 0, 0.22, 0.01);
  const texGagl = tela(256, 360, (c, W, Hc) => {
    c.fillStyle = '#efe5ca'; c.fillRect(0, 0, W, Hc);
    c.fillStyle = '#b4201c';
    c.beginPath();
    c.moveTo(16, 16); c.lineTo(W - 16, 16); c.lineTo(W - 16, Hc * 0.72);
    c.lineTo(W / 2, Hc - 18); c.lineTo(16, Hc * 0.72); c.closePath();
    c.fill();
    c.strokeStyle = '#e8c454'; c.lineWidth = 8; c.stroke();
    c.fillStyle = '#ffd84e';
    c.beginPath(); c.arc(W / 2, 108, 34, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fce89e'; c.textAlign = 'center'; c.font = 'bold 26px sans-serif';
    c.fillText('КОЛЛЕКТИВ', W / 2, 194);
    c.fillText('ТРУДА', W / 2, 232);
  });
  const gaglP = into(gagl, new T.Mesh(new T.PlaneGeometry(0.28, 0.40), dip(texGagl, 0.14, 0.84)));
  gaglP.position.z = 0.02;
  gaglP.userData.scritta = 1;
  gagGInit(gagl);
  function gagGInit(g) { g.userData.vivo = 1; M.vita?.aggiungi(g, 'ondeggia', { amp: 0.02, freq: 0.45, asse: 'x' }); }

  // Due appliques da parete con luce calda sopra ai pannelli laterali (come foto Bunker)
  const creaApplique = (name, ax) => {
    const ap = objG(name, ax, 2.34, ZF + 0.13);
    ap.userData.vivo = 1;
    cilG(ap, 0.055, 0.055, 0.025, mOro, 0, 0, -0.02, Math.PI / 2);
    boxG(ap, 0.03, 0.03, 0.11, mOttone, 0, 0, 0.03);
    const coppa = cilG(ap, 0.095, 0.035, 0.09, M.emi('#fff0bc', 0.80), 0, 0.03, 0.09);
    coppa.userData.vivo = 1;
    M.vita?.aggiungi(coppa, 'lampeggia', { min: 0.82, freq: 0.7, modo: 'respiro' });
    return ap;
  };
  creaApplique('applique_sx', -1.54);
  creaApplique('applique_dx', 1.54);
  M.luce('#ffe5b4', 1.2, -1.54, 2.34, ZF + 0.35, 3.8);
  M.luce('#ffe5b4', 1.2, 1.54, 2.34, ZF + 0.35, 3.8);

  // Orologio a pendolo alto da pavimento nell'angolo fra libreria sinistra e mappa (foto Korolev)
  const pendoloG = objG('pendolo_angolo', -1.54, 0, -2.72);
  pendoloG.userData.vivo = 1;
  boxG(pendoloG, 0.36, 0.38, 0.28, mNoce, 0, 0.19, 0);
  boxG(pendoloG, 0.30, 1.08, 0.24, mMogano, 0, 0.92, 0);
  boxG(pendoloG, 0.20, 0.72, 0.02, mScuro, 0, 0.92, 0.118); // nicchia vetro
  const astaPendolo = grp(0, 1.34, 0.146);
  into(pendoloG, astaPendolo);
  cilG(astaPendolo, 0.008, 0.008, 0.42, mOro, 0, -0.21, 0);
  cilG(astaPendolo, 0.068, 0.068, 0.022, mOro, 0, -0.42, 0, Math.PI / 2);
  boxG(pendoloG, 0.36, 0.44, 0.28, mNoce, 0, 1.68, 0);
  boxG(pendoloG, 0.40, 0.07, 0.32, mMogano, 0, 1.92, 0);
  orologio(M, { x: -1.54, y: 1.68, z: -2.56, ry: 0, r: 0.125, ora: '22:15', cornice: '#7a5220' });

  // Due grandi librerie aperte a parete in mogano (struttura fissa; i modellini sopra restano oggetti indipendenti)
  const mLibroBlu = mat('#365e88', 0.14, 0.72, 0.04);
  const creaLibreria = (name, lx, conRazzo = false) => {
    const lib = objG(name, lx, 0, -2.68);
    boxG(lib, 1.44, 2.24, 0.04, mNoce, 0, 1.12, -0.20);
    boxG(lib, 0.06, 2.24, 0.44, mNoce, -0.71, 1.12, 0);
    boxG(lib, 0.06, 2.24, 0.44, mNoce, 0.71, 1.12, 0);
    boxG(lib, 1.48, 0.08, 0.46, mNoce, 0, 0.04, 0);
    boxG(lib, 1.56, 0.08, 0.50, mMogano, 0, 2.26, 0);
    const spineCols = [mRosso, mCarta, mPelleVerde, mOro, mLibroBlu];
    for (let r = 0; r < 4; r++) {
      const y = 0.28 + r * 0.48;
      boxG(lib, 1.38, 0.036, 0.40, mMogano, 0, y, 0.0);
      let curX = -0.58;
      for (let b = 0; b < 11; b++) {
        if (conRazzo && r === 2 && b >= 4 && b <= 6) { curX += 0.10; continue; }
        const bh = 0.26 + ((b * 3 + r * 7) % 5) * 0.028;
        const bw = 0.065 + ((b + r) % 2) * 0.025;
        boxG(lib, bw, bh, 0.24, spineCols[(b + r) % spineCols.length], curX, y + 0.02 + bh / 2, 0.04);
        curX += bw + 0.026;
      }
    }
    return str(lib);
  };
  creaLibreria('libreria_sx', -2.45, false);
  creaLibreria('libreria_dx', 2.45, true);

  // Modellini spaziali sopra e dentro le librerie (come studio Korolev)
  const vostokG = objG('razzo_vostok', 2.45, 1.26, -2.62);
  boxG(vostokG, 0.16, 0.03, 0.14, mNoce, 0, 0.015, 0);
  cilG(vostokG, 0.022, 0.042, 0.28, mAcciaio, 0, 0.17, 0);
  cilG(vostokG, 0.004, 0.022, 0.09, mRosso, 0, 0.35, 0);
  for (const bx of [-0.035, 0.035]) cilG(vostokG, 0.010, 0.022, 0.14, mAcciaio, bx, 0.10, 0);

  const sputnikG = objG('modello_sputnik', -2.72, 2.30, -2.62);
  boxG(sputnikG, 0.14, 0.03, 0.14, mNoce, 0, 0.015, 0);
  cilG(sputnikG, 0.012, 0.016, 0.14, mOttone, 0, 0.09, 0);
  into(sputnikG, new T.Mesh(new T.SphereGeometry(0.085, 16, 12), mAcciaio)).position.set(0, 0.22, 0);
  for (const [ax, az, rz, rx] of [[-0.04, -0.04, 0.45, 0.35], [0.04, -0.04, -0.45, 0.35], [-0.04, 0.04, 0.45, -0.35], [0.04, 0.04, -0.45, -0.35]]) {
    cilG(sputnikG, 0.005, 0.005, 0.28, mAcciaio, ax * 1.4, 0.22, az * 1.4, rx, 0, rz);
  }

  const globoLibG = objG('mappamondo_libreria', -2.14, 2.30, -2.64);
  cilG(globoLibG, 0.055, 0.075, 0.03, mNoce, 0, 0.015, 0);
  cilG(globoLibG, 0.010, 0.010, 0.10, mOttone, 0, 0.07, 0);
  into(globoLibG, new T.Mesh(new T.SphereGeometry(0.11, 16, 12), mLibroBlu)).position.set(0, 0.20, 0);

  // Portarotoli verticale in noce e ottone con disegni tecnici arrotolati sotto il gagliardetto destro (1.34 m)
  const portaprogettiG = objG('portaprogetti', 1.50, 0, -2.34);
  boxG(portaprogettiG, 0.34, 0.04, 0.30, mNoce, 0, 0.02, 0);
  cilG(portaprogettiG, 0.12, 0.14, 0.66, mMogano, 0, 0.36, 0);
  boxG(portaprogettiG, 0.29, 0.024, 0.29, mOttone, 0, 0.68, 0);
  for (const [rx, rz, rh, tiltX, tiltZ] of [[-0.04, -0.02, 0.94, 0.06, 0.08], [0.04, 0.02, 1.06, -0.05, -0.06], [0.0, -0.04, 0.88, 0.08, -0.04], [-0.03, 0.04, 0.98, -0.07, 0.05]]) {
    cilG(portaprogettiG, 0.032, 0.032, rh, mCarta, rx, 0.28 + rh * 0.5, rz, tiltX, 0, tiltZ);
  }

  // ==========================================================
  // 4B. LATO SINISTRO E QUINTE DI PROFONDITÀ (da foto Korolev & uffici anni 60)
  // ==========================================================
  // Cassaforte verde militare nell'angolo sinistro con maniglia d'ottone e faldoni sopra
  const cassaforteG = objG('cassaforte_kgb', -3.06, 0, -1.98, 0.25);
  boxG(cassaforteG, 0.62, 0.96, 0.56, mVerdeAcciaio, 0, 0.48, 0);
  boxG(cassaforteG, 0.54, 0.84, 0.03, mat('#344a3c', 0.12, 0.72, 0.12), 0, 0.48, 0.28);
  cilG(cassaforteG, 0.055, 0.055, 0.03, mOro, 0.12, 0.52, 0.30, Math.PI / 2);
  boxG(cassaforteG, 0.16, 0.025, 0.03, mOttone, 0.12, 0.52, 0.32);
  boxG(cassaforteG, 0.32, 0.06, 0.24, mRossoScuro, -0.05, 0.99, 0, 0, 0.12);
  boxG(cassaforteG, 0.28, 0.05, 0.22, mCarta, -0.04, 1.045, 0.02, 0, -0.15);

  // Bacheca rossa con disegni tecnici spaziali su muro sinistro (foto Korolev)
  const bachG = objG('bacheca_progetti', -3.40, 1.72, -1.92, Math.PI / 2);
  boxG(bachG, 0.94, 0.68, 0.03, mRossoScuro, 0, 0, 0);
  const texProgetti = tela(384, 256, (c, W, Hc) => {
    c.fillStyle = '#7c2418'; c.fillRect(0, 0, W, Hc);
    c.fillStyle = '#f4efe2'; c.fillRect(20, 26, 152, 130); c.fillRect(194, 20, 168, 214);
    c.strokeStyle = '#2c3d52'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(40, 118); c.quadraticCurveTo(96, 56, 154, 72); c.stroke();
    c.strokeRect(236, 62, 82, 118);
    c.beginPath(); c.arc(277, 118, 28, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#222834'; c.font = 'bold 16px sans-serif';
    c.fillText('ОБЪЕКТ Е-6', 228, 46);
    c.font = 'bold 13px sans-serif';
    c.fillText('ЛУНА - ОРБИТА', 34, 48);
  });
  const bachP = into(bachG, new T.Mesh(new T.PlaneGeometry(0.86, 0.60), dip(texProgetti, 0.14, 0.85)));
  bachP.position.z = 0.02;
  bachP.userData.scritta = 1;

  // Appendiabiti alto in legno con cappotto e colbacco accanto alla finestra (foto Korolev)
  const appendG = objG('appendiabiti_cappotto', -2.98, 0, -1.36);
  cilG(appendG, 0.035, 0.055, 1.82, mNoce, 0, 0.91, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    boxG(appendG, 0.34, 0.035, 0.035, mNoce, Math.cos(a) * 0.16, 0.08, Math.sin(a) * 0.16, 0, -a, 0.35);
    boxG(appendG, 0.22, 0.024, 0.024, mNoce, Math.cos(a) * 0.10, 1.72, Math.sin(a) * 0.10, 0, -a, -0.55);
  }
  // Cappotto appeso e colbacco in cima
  boxG(appendG, 0.38, 0.72, 0.20, mCappotto, 0.06, 1.32, 0.02, 0.04, 0.3, 0.05);
  cilG(appendG, 0.11, 0.125, 0.13, mPelo, 0, 1.87, 0);

  // Tavolino laterale con interfono «Vertushka» e lucine LED (tra scrivania e finestra)
  const tavVert = objG('tavolino_vertushka', -1.82, 0, -1.52);
  boxG(tavVert, 0.66, 0.045, 0.50, mMogano, 0, 0.66, 0);
  for (const [lx, lz] of [[-0.26, -0.18], [0.26, -0.18], [-0.26, 0.18], [0.26, 0.18]]) {
    boxG(tavVert, 0.055, 0.64, 0.055, mNoce, lx, 0.32, lz);
  }
  boxG(tavVert, 0.58, 0.03, 0.42, mNoce, 0, 0.22, 0);
  boxG(tavVert, 0.34, 0.08, 0.24, mRossoScuro, -0.06, 0.275, 0.02, 0, 0.14);

  const vertG = objG('interfono_vertushka', -1.80, 0.685, -1.52, 0.28);
  vertG.userData.vivo = 1;
  boxG(vertG, 0.34, 0.11, 0.24, mLegnoChiaro, 0, 0.055, 0);
  boxG(vertG, 0.30, 0.045, 0.14, mCarta, 0, 0.11, 0.03, 0.22);
  for (let b = 0; b < 5; b++) {
    boxG(vertG, 0.036, 0.022, 0.032, b === 0 ? mRosso : mCarta, -0.10 + b * 0.05, 0.132, 0.04, 0.22);
  }
  const ledVert = [];
  for (const [lx, col] of [[-0.08, '#44ff66'], [0, '#ff4838'], [0.08, '#ffd448']]) {
    const led = into(vertG, new T.Mesh(new T.SphereGeometry(0.013, 8, 6), M.emi(col, 0.82)));
    led.position.set(lx, 0.135, -0.04);
    led.userData.vivo = 1;
    ledVert.push(led);
  }

  // Poltrona ospite in legno e pelle marrone in primo piano sinistro (crea profondità senza coprire!)
  const poltronaG = objG('poltrona_ospiti', -2.55, 0, 0.28, 0.55);
  boxG(poltronaG, 0.58, 0.10, 0.56, mPelleMarrone, 0, 0.42, 0);
  boxG(poltronaG, 0.58, 0.48, 0.11, mPelleMarrone, 0, 0.68, -0.23, -0.10);
  boxG(poltronaG, 0.07, 0.06, 0.52, mNoce, -0.28, 0.62, 0);
  boxG(poltronaG, 0.07, 0.06, 0.52, mNoce, 0.28, 0.62, 0);
  for (const [gx, gz] of [[-0.25, -0.22], [0.25, -0.22], [-0.25, 0.22], [0.25, 0.22]]) {
    boxG(poltronaG, 0.055, 0.40, 0.055, mNoce, gx, 0.20, gz);
  }

  // Cestino carte con fogli accartocciati accanto al fianco sinistro della scrivania
  const cestG = objG('cestino_ufficio', -1.34, 0, -1.16);
  cilG(cestG, 0.125, 0.10, 0.28, mVerdeAcciaio, 0, 0.14, 0);
  for (const [cx, cy, cz] of [[-0.025, 0.23, 0.018], [0.03, 0.245, -0.018], [0.0, 0.27, 0.01]]) {
    into(cestG, new T.Mesh(new T.DodecahedronGeometry(0.040, 0), mCarta)).position.set(cx, cy, cz);
  }

  // Orologio ministeriale, doppie porte vetrate, credenza destra & samovar d'ottone
  const portaMosca = await vivo(M, 'porta_doppia', { x: X - 0.10, y: 0, z: 0.48, ry: -Math.PI / 2, s: 1.0 });
  portaMosca.name = 'porta_doppia';
  smorza(portaMosca);
  str(portaMosca);
  orologio(M, { x: X - 0.11, y: 2.25, z: -1.65, ry: -Math.PI / 2, r: 0.24, ora: '22:15', cornice: '#7a5220' });
  const cred = objG('credenza_dx', X - 0.36, 0, -1.65, -Math.PI / 2);
  boxG(cred, 1.25, 0.92, 0.48, mNoce, 0, 0.46, 0);
  boxG(cred, 1.29, 0.04, 0.52, mMogano, 0, 0.93, 0);
  str(cred);
  const samovarG = objG('samovar', X - 0.36, 0.95, -1.40, -Math.PI / 2);
  cilG(samovarG, 0.09, 0.11, 0.26, mOttone, 0, 0.13, 0);
  cilG(samovarG, 0.055, 0.055, 0.065, mOro, 0, 0.28, 0);

  // ==========================================================
  // 5. PESANTE SCRIVANIA + PICCOLI OGGETTI REALI INDIPENDENTI
  // ==========================================================
  const scriv = objG('scrivania', 0, 0, -0.86);
  boxG(scriv, 2.54, 0.06, 0.80, mMogano, 0, 0.73, 0);
  boxG(scriv, 0.62, 0.68, 0.72, mNoce, -0.86, 0.35, 0);
  boxG(scriv, 0.62, 0.68, 0.72, mNoce, 0.86, 0.35, 0);
  boxG(scriv, 1.10, 0.56, 0.06, mNoce, 0, 0.40, 0.28);
  boxG(scriv, 0.92, 0.40, 0.03, mMogano, 0, 0.42, 0.31);
  for (let d = 0; d < 3; d++) {
    boxG(scriv, 0.16, 0.025, 0.03, mOro, -0.86, 0.54 - d * 0.18, 0.375);
    boxG(scriv, 0.16, 0.025, 0.03, mOro, 0.86, 0.54 - d * 0.18, 0.375);
  }
  boxG(scriv, 1.02, 0.012, 0.54, mPelleVerde, 0, 0.766, 0.04);
  str(scriv);

  // Dossier rosso segreto + fogli stropicciati + occhiali posati
  const dossierG = objG('dossier_segreto', -0.34, 0.766, -0.82, 0.15);
  boxG(dossierG, 0.26, 0.022, 0.32, mRossoScuro, 0, 0.012, 0);
  boxG(dossierG, 0.24, 0.008, 0.30, mCarta, 0, 0.026, 0, 0, 0.04);

  const occhialiG = objG('occhiali_scrivania', -0.34, 0.80, -0.79, -0.35);
  cilG(occhialiG, 0.022, 0.022, 0.008, mScuro, -0.028, 0.004, 0);
  cilG(occhialiG, 0.022, 0.022, 0.008, mScuro, 0.028, 0.004, 0);
  boxG(occhialiG, 0.02, 0.006, 0.006, mOro, 0, 0.005, 0);
  boxG(occhialiG, 0.005, 0.005, 0.08, mScuro, -0.048, 0.005, -0.04);
  boxG(occhialiG, 0.005, 0.005, 0.08, mScuro, 0.048, 0.005, -0.04);

  // Calamaio doppio e tampone assorbente basculante (foto Korolev)
  const calamaioG = objG('calamaio', -0.20, 0.766, -0.64);
  boxG(calamaioG, 0.12, 0.016, 0.08, mNoce, 0, 0.008, 0);
  cilG(calamaioG, 0.020, 0.024, 0.042, mOttone, -0.028, 0.032, 0);
  cilG(calamaioG, 0.020, 0.024, 0.042, mAcciaio, 0.028, 0.032, 0);

  const tampG = objG('tamponatore', -0.24, 0.766, -0.54, 0.25);
  boxG(tampG, 0.095, 0.022, 0.048, mLegnoChiaro, 0, 0.011, 0);
  cilG(tampG, 0.015, 0.015, 0.03, mOttone, 0, 0.034, 0);

  // Bicchiere portamatite con 5 matite colorate inclinate (foto Korolev)
  const matiteG = objG('portamatite', -0.58, 0.766, -0.68);
  cilG(matiteG, 0.038, 0.034, 0.095, mAcciaio, 0, 0.048, 0);
  for (let i = 0; i < 5; i++) {
    const ang = i * 1.25;
    cilG(matiteG, 0.007, 0.007, 0.145, mat(mMatitaColors[i], 0.14, 0.75, 0.04),
      Math.cos(ang) * 0.014, 0.095, Math.sin(ang) * 0.014, Math.sin(ang) * 0.16, 0, -Math.cos(ang) * 0.16);
  }

  // Sveglia / orologino da scrivania d'ottone (foto Korolev)
  const svegliaG = objG('sveglia_tavolo', -0.08, 0.766, -1.06, 0.12);
  cilG(svegliaG, 0.055, 0.055, 0.034, mOttone, 0, 0.065, 0, Math.PI / 2);
  cilG(svegliaG, 0.045, 0.045, 0.038, mCarta, 0, 0.065, 0.002, Math.PI / 2);
  boxG(svegliaG, 0.07, 0.018, 0.045, mOro, 0, 0.009, 0);

  // Timbro dell'ufficio + posacenere + pila faldoni attorno alla scatola sovietica (dettagli pieni in S9!)
  const timbroG = objG('timbro_gomma', 0.36, 0.766, -0.65, -0.2);
  cilG(timbroG, 0.026, 0.030, 0.025, mNoce, 0, 0.014, 0);
  cilG(timbroG, 0.012, 0.018, 0.055, mNoce, 0, 0.052, 0);
  boxG(timbroG, 0.085, 0.018, 0.055, mRossoScuro, 0.075, 0.009, 0.01, 0, 0.18);

  const posacenereG = objG('posacenere', -0.04, 0.766, -0.58);
  cilG(posacenereG, 0.055, 0.045, 0.024, mAcciaio, 0, 0.012, 0, 0, 0, 0, 8);

  const faldoniG = objG('pila_dossier', 0.52, 0.766, -0.64, -0.30);
  boxG(faldoniG, 0.22, 0.024, 0.28, mLegnoChiaro, 0, 0.012, 0);
  boxG(faldoniG, 0.21, 0.024, 0.27, mRossoScuro, 0.01, 0.036, 0.01, 0, 0.08);
  boxG(faldoniG, 0.20, 0.012, 0.26, mCarta, -0.01, 0.054, -0.01, 0, -0.05);

  // Telefono rosso del Cremlino a disco rotante (oggetto indipendente!)
  const telMos = objG('telefono_cremlino', 0.76, 0.766, -0.82, -0.32);
  boxG(telMos, 0.20, 0.085, 0.22, mRosso, 0, 0.042, 0);
  boxG(telMos, 0.08, 0.055, 0.12, mRosso, 0, 0.09, -0.05);
  cilG(telMos, 0.045, 0.052, 0.02, mCarta, 0, 0.085, 0.055, 0.45);
  cilG(telMos, 0.015, 0.015, 0.024, mOttone, 0, 0.088, 0.055, 0.45);
  boxG(telMos, 0.24, 0.036, 0.048, mRosso, 0, 0.125, -0.05);
  cilG(telMos, 0.032, 0.026, 0.04, mRosso, -0.10, 0.11, -0.05);
  cilG(telMos, 0.032, 0.026, 0.04, mRosso, 0.10, 0.11, -0.05);

  // Lampada da Banchiere smeraldo con respiro luminoso
  const lampB = objG('lampada_banchiere', -0.84, 0.766, -0.92, 0.32);
  lampB.userData.vivo = 1;
  cilG(lampB, 0.11, 0.13, 0.035, mOttone, 0, 0.018, 0);
  cilG(lampB, 0.018, 0.022, 0.34, mOttone, 0, 0.19, -0.04);
  cilG(lampB, 0.016, 0.016, 0.12, mOttone, 0, 0.35, 0.01, 0.9);
  const paralume = cilG(lampB, 0.075, 0.075, 0.28, mVetroVerde, 0, 0.34, 0.06, 0, 0, Math.PI / 2, 16);
  paralume.scale.set(0.8, 1.0, 1.15);
  const bulboL = into(lampB, new T.Mesh(new T.SphereGeometry(0.035, 10, 8), M.emi('#fff0ba', 0.82)));
  bulboL.position.set(0, 0.30, 0.06);
  bulboL.userData.vivo = 1;
  M.vita?.aggiungi(bulboL, 'lampeggia', { min: 0.76, freq: 1.1, modo: 'respiro' });
  M.luce('#ffe6ac', 2.4, -0.82, 1.06, -0.82, 3.0);

  // HERO PROP: OBJ.scatola_sovietica
  const scatSov = objG('scatola_sovietica', 0.10, 0.77, -0.78, -0.18);
  scatSov.scale.setScalar(1.12);
  boxG(scatSov, 0.36, 0.095, 0.24, mat('#be9664', 0.12, 0.82, 0.02), 0, 0.048, 0);
  boxG(scatSov, 0.38, 0.026, 0.26, mat('#ccaa74', 0.12, 0.80, 0.02), 0, 0.098, 0);
  boxG(scatSov, 0.045, 0.032, 0.264, mRosso, -0.10, 0.098, 0);
  boxG(scatSov, 0.045, 0.032, 0.264, mRosso, 0.10, 0.098, 0);
  const targhettaSov = cartello('ЗАКАЗ № 74  •  AG-7 USA\n100 ШТУК   ($ 2.95)', 0.34, 0.18, 0, 0.114, 0, 0, {
    fondo: '#f4ecd4', colore: '#941818', bordo: '#701818', px: 280, righe: 2
  });
  targhettaSov.rotation.x = -Math.PI / 2;
  into(scatSov, targhettaSov);
  OBJ.scatola_sovietica = scatSov;

  // Bicchiere da tè russo nel podstakannik + vapore animato
  const teG = objG('bicchiere_te', 0.56, 0.766, -1.04);
  teG.userData.vivo = 1;
  cilG(teG, 0.038, 0.042, 0.065, mAcciaio, 0, 0.033, 0);
  cilG(teG, 0.033, 0.030, 0.095, mat('#b85820', 0.12, 0.35, 0.02), 0, 0.065, 0);
  const puffTe = [];
  const mVapTe = new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.34, depthWrite: false });
  for (let i = 0; i < 3; i++) {
    const p = into(teG, new T.Mesh(new T.SphereGeometry(0.018 + i * 0.006, 8, 8), mVapTe.clone()));
    p.position.y = 0.13 + i * 0.03;
    p.userData.noInk = 1; p.userData.noRick = 1; p.userData.vivo = 1;
    puffTe.push(p);
  }

  // ==========================================================
  // 6. VITA CONTINUA (vapore tè + neve su Mosca + Soyuz + pendolo + LED Vertushka)
  // ==========================================================
  const mapX = (px) => ((px / 1024) - 0.5) * 2.50;
  const mapY = (py) => (0.5 - (py / 512)) * 1.18;
  (M.tick = M.tick || []).push(t => {
    for (let i = 0; i < puffTe.length; i++) {
      const p = puffTe[i];
      const u = ((t * 0.45 + i * 0.33) % 1);
      p.position.y = 0.12 + u * 0.18;
      p.position.x = Math.sin(t * 2.1 + i) * 0.012;
      p.scale.setScalar(0.75 + u * 0.75);
      p.material.opacity = 0.34 * (1 - u);
    }
    for (let i = 0; i < fiocchi.length; i++) {
      const f = fiocchi[i];
      const u = (t * 0.18 + f.fase) % 1;
      f.m.position.y = 0.72 - u * 1.44;
      f.m.position.z = f.z0 + Math.sin(t * 1.4 + i) * 0.04;
    }
    const uOrb = (t * 0.12) % 1;
    const inv = 1 - uOrb;
    const px = inv * inv * 356 + 2 * inv * uOrb * 610 + uOrb * uOrb * 886;
    const py = inv * inv * 318 + 2 * inv * uOrb * 140 + uOrb * uOrb * 162;
    blipCore.position.set(mapX(px), mapY(py), 0);
    blipCore.scale.setScalar(0.85 + 0.35 * Math.sin(t * 5.0));
    astaPendolo.rotation.z = Math.sin(t * 2.4) * 0.14;
    for (let i = 0; i < ledVert.length; i++) {
      ledVert[i].material.emissiveIntensity = 0.48 + 0.34 * Math.sin(t * (2.6 + i * 1.3) + i * 1.7);
    }
  });
}
