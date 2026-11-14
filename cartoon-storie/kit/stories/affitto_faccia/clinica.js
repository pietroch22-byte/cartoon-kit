// Clinica privata clandestina chiusa sui 4 lati + soffitto (luce «interno», senza aperture sul vuoto).
// Basata sulle tre foto reali di library/luoghi/clinica_privata.md.
import { RoundedBoxGeometry } from '/lib/jsm/geometries/RoundedBoxGeometry.js';
import { adattaTesto, cartello, orologio } from '/web/buon_senso.js';
import { vivo } from '/web/vivi.js';

export async function costruisci(M, D, S, OBJ) {
  const T = M.THREE;
  const mat = (c, e = 0.28, r = 0.75, m = 0.05) => {
    const x = M.std(c, r, m);
    x.emissive.set(c);
    x.emissiveIntensity = e;
    return x;
  };
  const dip = (t, e = 0.32, r = 0.75) => M.dipinto(t, e, r);
  const tela = (w, h, fn) => M.tex(w, h, fn);
  const str = o => {
    if (o.traverse) o.traverse(c => { c.userData.struttura = 1; });
    o.userData.struttura = 1;
    return o;
  };
  const sm = (w, h, d, m, x, y, z, rad = 0.02, ry = 0, name = null) => {
    const r = Math.max(0.004, Math.min(rad, Math.min(w, h, d) * 0.45));
    const o = new T.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), m);
    o.position.set(x, y, z);
    if (ry) o.rotation.y = ry;
    o.castShadow = o.receiveShadow = true;
    if (name) o.name = name;
    M.root.add(o);
    return o;
  };

  // ---- 1. STANZA CHIUSISSIMA (X: ±3.6, Z: -3.4..+4.8, Y: 0..3.1) -> zero VUOTO_DIETRO_IL_SET
  const W = 7.2, Dp = 8.2, H = 3.1, zC = 0.7;
  const texPav = tela(512, 512, (c, Wp, Hp) => {
    c.fillStyle = '#4c5766';
    c.fillRect(0, 0, Wp, Hp);
    c.strokeStyle = '#3b4452';
    c.lineWidth = 4;
    for (let i = 0; i <= 8; i++) {
      const p = (i / 8) * Wp;
      c.beginPath(); c.moveTo(p, 0); c.lineTo(p, Hp); c.stroke();
      c.beginPath(); c.moveTo(0, p); c.lineTo(Wp, p); c.stroke();
    }
  });
  texPav.wrapS = texPav.wrapT = T.RepeatWrapping;
  texPav.repeat.set(3.5, 4);
  // Top a y = +0.006 per evitare z-fighting col piano terra di base del look mantenendosi sotto ombraOvale (y = 0.012)
  const pav = M.box(W + 0.6, 0.2, Dp + 0.6, dip(texPav, 0.28, 0.8), 0, -0.094, zC);
  str(pav); pav.name = 'pavimento_piastrelle';

  const mMuro = mat('#ded5c7', 0.28, 0.82);
  const mBoiserie = mat('#a6825c', 0.25, 0.75);
  const mBattiscopa = mat('#454e5c', 0.25, 0.72);
  const mSoffitto = mat('#ebe6dc', 0.30, 0.85);

  const muroFondo = M.box(W + 0.6, H + 0.4, 0.24, mMuro, 0, H / 2, -3.52);
  const muroDietro = M.box(W + 0.6, H + 0.4, 0.24, mMuro, 0, H / 2, 4.92);
  const muroSx = M.box(0.24, H + 0.4, Dp + 0.6, mMuro, -3.72, H / 2, zC);
  const muroDx = M.box(0.24, H + 0.4, Dp + 0.6, mMuro, 3.72, H / 2, zC);
  const soffitto = M.box(W + 0.8, 0.24, Dp + 0.8, mSoffitto, 0, H + 0.12, zC);
  for (const m of [muroFondo, muroDietro, muroSx, muroDx, soffitto]) str(m);
  muroFondo.name = 'muro_fondo'; muroDietro.name = 'muro_dietro';
  muroSx.name = 'muro_sx'; muroDx.name = 'muro_dx'; soffitto.name = 'soffitto_clinica';

  // Boiserie legno basso e battiscopa lungo i muri principali
  str(M.box(W + 0.1, 0.92, 0.05, mBoiserie, 0, 0.46, -3.38));
  str(M.box(0.05, 0.92, Dp, mBoiserie, -3.58, 0.46, zC));
  str(M.box(0.05, 0.92, Dp, mBoiserie, 3.58, 0.46, zC));
  str(M.box(W + 0.1, 0.12, 0.07, mBattiscopa, 0, 0.06, -3.36));
  str(M.box(0.07, 0.12, Dp, mBattiscopa, -3.56, 0.06, zC));
  str(M.box(0.07, 0.12, Dp, mBattiscopa, 3.56, 0.06, zC));

  // ---- 2. SOFFITTO CON PANNELLI LED LUMINOSI E FONTI DI LUCE REALI (zero lampade invisibili!)
  const makeLed = (x, z, name) => {
    const g = new T.Group();
    g.name = name;
    g.position.set(x, H - 0.02, z);
    const telaio = new T.Mesh(new T.BoxGeometry(1.36, 0.05, 0.72), mat('#b4bcc6', 0.24));
    const pannello = new T.Mesh(new T.PlaneGeometry(1.24, 0.6), M.emi('#fffcf2', 1.4));
    pannello.rotation.x = Math.PI / 2;
    pannello.position.y = -0.028;
    g.add(telaio, pannello);
    M.root.add(g);
    M.luce('#fff7e6', 2.4, x, H - 0.14, z, 9.5);
    M.vita.aggiungi(pannello, 'lampeggia', { min: 0.94, freq: 0.35, modo: 'respiro' });
    return g;
  };
  makeLed(0, -0.7, 'pannello_led_1');
  makeLed(0, 1.9, 'pannello_led_2');
  // Plafoniera dedicata vicino allo specchio sulla parete destra (intensita' equilibrata anti-bruciatura)
  const lampSpecchio = sm(0.08, 0.12, 1.3, M.emi('#fff6e4', 1.1), 3.46, 2.52, 0.45, 0.015, 0, 'plafoniera_specchio');
  void lampSpecchio;
  M.luce('#fff3dd', 1.35, 2.75, 2.4, 0.45, 7.5);

  // ---- 3. MURO DI FONDO (Z = -3.38): FINESTRA OSCURATA, INSEGNA «50.000 € / 24H», POSTER, OROLOGIO
  // Finestra schermata da tenda a rullo opaca (muro integro dietro)
  const fin = new T.Group();
  fin.name = 'finestra_tenda';
  fin.position.set(-1.35, 1.72, -3.36);
  str(fin);
  const fCorn = new T.Mesh(new RoundedBoxGeometry(1.18, 1.24, 0.06, 2, 0.015), mat('#6c7480', 0.25));
  const fTenda = new T.Mesh(new T.BoxGeometry(1.06, 1.10, 0.04), mat('#d6ccb8', 0.3));
  fTenda.position.z = 0.015;
  for (let i = 0; i < 6; i++) {
    const stecca = new T.Mesh(new T.BoxGeometry(1.04, 0.014, 0.05), mat('#bfb39e', 0.26));
    stecca.position.set(0, -0.4 + i * 0.18, 0.025);
    fin.add(stecca);
  }
  fin.add(fCorn, fTenda);
  M.root.add(fin);
  M.vita.aggiungi(fin, 'ondeggia', { amp: 0.008, freq: 0.35 });

  // Insegna luminosa ben leggibile di front al tavolo del contratto
  const insegnaAffitto = cartello(M, {
    testo: '50.000 € / 24H', w: 2.35, h: 0.56,
    x: 0.35, y: 2.08, z: -3.33,
    fondo: '#133d33', colore: '#ffe88c', bordo: '#2e9c6c',
  });
  insegnaAffitto.name = 'insegna_50000';
  M.vita.aggiungi(insegnaAffitto, 'lampeggia', { min: 0.90, freq: 0.45, modo: 'respiro' });

  // Poster anatomico «VOLTO ANONIMO»
  const texPoster = tela(384, 512, (c, Wp, Hp) => {
    c.fillStyle = '#f2ede2'; c.fillRect(0, 0, Wp, Hp);
    c.strokeStyle = '#2d4a66'; c.lineWidth = 8; c.strokeRect(12, 12, Wp - 24, Hp - 24);
    c.fillStyle = '#1f4f6b'; c.fillRect(24, 24, Wp - 48, 72);
    adattaTesto(c, 'VOLTO ANONIMO', Wp - 48, 72, { x0: 24, y0: 24, colore: '#f7f3ea', righe: 1, max: 0.72 });
    c.strokeStyle = '#335d78'; c.lineWidth = 4; c.setLineDash([8, 6]);
    c.beginPath(); c.ellipse(Wp / 2, Hp * 0.56, Wp * 0.25, Hp * 0.24, 0, 0, Math.PI * 2); c.stroke();
    c.setLineDash([]);
    adattaTesto(c, 'PROTOCOLLO B-24\nTRAPIANTO TEMPORANEO', Wp - 48, 96, { x0: 24, y0: Hp * 0.80, colore: '#2c3d4f', righe: 2, max: 0.65 });
  });
  const poster = new T.Mesh(new T.BoxGeometry(0.72, 0.96, 0.03), dip(texPoster, 0.32, 0.75));
  poster.position.set(2.15, 1.65, -3.36);
  poster.name = 'poster_anatomico';
  M.root.add(poster);

  // Orologio a parete vivo (lancetta dei secondi)
  const olog = orologio(M, { x: -2.42, y: 2.25, z: -3.35, r: 0.26, ora: 22.5, cornice: '#384250' });
  olog.name = 'orologio_parete';

  // ---- 4. LETTINO VISITA + LAMPADA SNODATA (LOCAL COORDS!) + CARRELLO ECOGRAFO (FIRME DEL LUOGO)
  const lettino = new T.Group();
  lettino.name = 'lettino_visita';
  lettino.position.set(-1.95, 0, -1.75);
  M.root.add(lettino);
  const baseL = new T.Mesh(new RoundedBoxGeometry(0.84, 0.56, 1.84, 2, 0.025), mat('#cfc8ba', 0.26));
  baseL.position.y = 0.28; baseL.castShadow = baseL.receiveShadow = true;
  const cuscinoL = new T.Mesh(new RoundedBoxGeometry(0.86, 0.14, 1.92, 3, 0.045), mat('#4b707a', 0.26));
  cuscinoL.position.y = 0.63; cuscinoL.castShadow = cuscinoL.receiveShadow = true;
  const testieraL = new T.Mesh(new RoundedBoxGeometry(0.84, 0.14, 0.54, 3, 0.04), mat('#4b707a', 0.26));
  testieraL.position.set(0, 0.74, -0.72); testieraL.rotation.x = 0.36;
  const strisciaCarta = new T.Mesh(new T.BoxGeometry(0.62, 0.015, 1.35), mat('#f8f6ef', 0.32));
  strisciaCarta.position.set(0, 0.708, 0.12);
  const rotoloCarta = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.64, 14), mat('#faf8f2', 0.32));
  rotoloCarta.rotation.z = Math.PI / 2;
  rotoloCarta.position.set(0, 0.80, -0.94);
  for (let d = 0; d < 2; d++) {
    const cass = new T.Mesh(new RoundedBoxGeometry(0.04, 0.36, 0.74, 2, 0.01), mat('#b8b0a2', 0.25));
    cass.position.set(0.43, 0.28, -0.45 + d * 0.90);
    lettino.add(cass);
  }
  lettino.add(baseL, cuscinoL, testieraL, strisciaCarta, rotoloCarta);

  // Lampada da visita snodata con coordinate rigorosamente LOCALI dentro lampVisita!
  const lampVisita = new T.Group();
  lampVisita.name = 'lampada_visita';
  lampVisita.position.set(-2.65, 0, -1.65);
  M.root.add(lampVisita);
  const baseLV = new T.Mesh(new T.CylinderGeometry(0.24, 0.26, 0.05, 16), mat('#3a4250', 0.25));
  baseLV.position.set(0, 0.025, 0);
  const astaLV = new T.Mesh(new T.CylinderGeometry(0.024, 0.032, 1.55, 10), mat('#adb5c2', 0.26, 0.4, 0.3));
  astaLV.position.set(0, 0.8, 0);
  const braccioLV = new T.Mesh(new RoundedBoxGeometry(0.56, 0.035, 0.035, 2, 0.01), mat('#adb5c2', 0.26, 0.4, 0.3));
  braccioLV.position.set(0.25, 1.64, 0);
  braccioLV.rotation.z = 0.22;
  const cupolaLV = new T.Mesh(new T.CylinderGeometry(0.06, 0.17, 0.14, 16), mat('#dce2eb', 0.28));
  cupolaLV.position.set(0.54, 1.69, 0);
  const lenteLV = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 0.02, 16), M.emi('#fffbe6', 1.35));
  lenteLV.position.set(0.54, 1.61, 0);
  lampVisita.add(baseLV, astaLV, braccioLV, cupolaLV, lenteLV);
  M.vita.aggiungi(lampVisita, 'pendola', { amp: 0.025, freq: 0.35, asse: 'z' });

  // Carrello ecografo con monitor vivo + cavi pendenti
  const carrello = new T.Group();
  carrello.name = 'carrello_ecografo';
  carrello.position.set(1.68, 0, -2.15);
  carrello.rotation.y = -0.35;
  M.root.add(carrello);
  carrello.add(
    (() => { const b = new T.Mesh(new RoundedBoxGeometry(0.58, 0.92, 0.50, 2, 0.02), mat('#434d5c', 0.25)); b.position.y = 0.48; b.castShadow = true; return b; })(),
    (() => { const t = new T.Mesh(new RoundedBoxGeometry(0.62, 0.08, 0.54, 2, 0.02), mat('#dcd7cb', 0.26)); t.position.y = 0.96; return t; })(),
    (() => { const p = new T.Mesh(new T.CylinderGeometry(0.028, 0.028, 0.35, 10), mat('#788492', 0.25)); p.position.set(0, 1.15, -0.08); return p; })(),
    (() => { const m = new T.Mesh(new RoundedBoxGeometry(0.54, 0.38, 0.06, 2, 0.015), mat('#242b36', 0.22)); m.position.set(0, 1.42, -0.04); return m; })()
  );
  const texEco = tela(256, 192, (c, Wp, Hp) => {
    c.fillStyle = '#0c242b'; c.fillRect(0, 0, Wp, Hp);
    c.strokeStyle = '#3ef5b8'; c.lineWidth = 4;
    c.beginPath();
    for (let px = 0; px <= Wp; px += 8) {
      const py = Hp * 0.55 + (px % 48 === 16 ? -34 : px % 48 === 24 ? 22 : Math.sin(px * 0.2) * 5);
      if (px === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.stroke();
    adattaTesto(c, 'SCAN 100%', Wp, 52, { x0: 0, y0: 10, colore: '#78ffd6', righe: 1, max: 0.72 });
  });
  const ecoScreen = new T.Mesh(new T.PlaneGeometry(0.46, 0.30), new T.MeshBasicMaterial({ map: texEco }));
  ecoScreen.position.set(0, 1.42, -0.005);
  carrello.add(ecoScreen);
  M.vita.aggiungi(ecoScreen, 'scorri', { vel: [0.18, 0] });
  M.vita.aggiungi(ecoScreen, 'lampeggia', { min: 0.88, freq: 0.75 });
  // Rotelle e cavi neri pendenti
  for (const [wx, wz] of [[-0.22, -0.18], [0.22, -0.18], [-0.22, 0.18], [0.22, 0.18]]) {
    const r = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 0.04, 10), mat('#1f232c', 0.2));
    r.rotation.z = Math.PI / 2; r.position.set(wx, 0.045, wz);
    carrello.add(r);
  }
  const cavo = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 0.7, 8), mat('#1c2028', 0.15));
  cavo.position.set(0.24, 0.62, 0.18); cavo.rotation.z = -0.18;
  carrello.add(cavo);

  // ---- 5. SCRIVANIA CLINICA CON CONTRATTO, PENNA, VALIGETTA APERTA DI SOLDI E VENTILATORE (Z = -0.55)
  const scrivania = new T.Group();
  scrivania.name = 'scrivania_clinica';
  scrivania.position.set(0.0, 0, -0.55);
  M.root.add(scrivania);
  scrivania.add(
    (() => { const t = new T.Mesh(new RoundedBoxGeometry(1.92, 0.07, 0.90, 3, 0.02), mat('#e3dcd0', 0.28)); t.position.y = 0.74; t.castShadow = t.receiveShadow = true; return t; })(),
    (() => { const g1 = new T.Mesh(new RoundedBoxGeometry(0.46, 0.72, 0.80, 2, 0.02), mat('#3a4554', 0.24)); g1.position.set(-0.68, 0.36, 0); g1.castShadow = true; return g1; })(),
    (() => { const g2 = new T.Mesh(new RoundedBoxGeometry(0.46, 0.72, 0.80, 2, 0.02), mat('#3a4554', 0.24)); g2.position.set(0.68, 0.36, 0); g2.castShadow = true; return g2; })(),
    (() => { const p = new T.Mesh(new T.BoxGeometry(1.1, 0.45, 0.04), mat('#323c4a', 0.24)); p.position.set(0, 0.46, -0.35); return p; })()
  );

  // Contratto nitido sul tavolo per il dettaglio (Scene 1!)
  const texContratto = tela(320, 420, (c, Wp, Hp) => {
    c.fillStyle = '#fcf9f0'; c.fillRect(0, 0, Wp, Hp);
    c.fillStyle = '#1b473a'; c.fillRect(0, 0, Wp, 68);
    adattaTesto(c, 'CONTRATTO', Wp, 68, { colore: '#ffffff', righe: 1, max: 0.75 });
    adattaTesto(c, '50.000 €\nAFFITTO VOLTO\n24 ORE ESATTE', Wp - 36, 150, { x0: 18, y0: 84, colore: '#1f2630', righe: 3, max: 0.68 });
    c.strokeStyle = '#384452'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(36, 355); c.lineTo(Wp - 36, 355); c.stroke();
    adattaTesto(c, 'FIRMA QUI X _____', Wp - 40, 48, { x0: 20, y0: 362, colore: '#b02424', righe: 1, max: 0.65 });
  });
  const foglioContratto = new T.Mesh(new T.BoxGeometry(0.30, 0.012, 0.40), dip(texContratto, 0.32, 0.7));
  foglioContratto.position.set(0.20, 0.785, -0.34);
  foglioContratto.rotation.y = 0.08;
  foglioContratto.name = 'contratto_fogli';
  M.root.add(foglioContratto);
  OBJ.contratto = foglioContratto;

  const penna = new T.Mesh(new T.CylinderGeometry(0.009, 0.009, 0.17, 8), mat('#1f2634', 0.25, 0.4, 0.3));
  penna.rotation.set(0, 0.4, Math.PI / 2);
  penna.position.set(0.34, 0.796, -0.30);
  penna.name = 'penna_contratto';
  M.root.add(penna);
  OBJ.penna = penna;

  // Valigetta aperta sul tavolo piena di mazzette verdi 50.000 €
  const valigetta = new T.Group();
  valigetta.name = 'valigetta_soldi';
  valigetta.position.set(-0.42, 0.78, -0.50);
  valigetta.rotation.y = 0.16;
  M.root.add(valigetta);
  const vasca = new T.Mesh(new RoundedBoxGeometry(0.46, 0.10, 0.32, 2, 0.015), mat('#2c3340', 0.25, 0.5, 0.3));
  vasca.position.y = 0.05;
  const internoV = new T.Mesh(new T.BoxGeometry(0.42, 0.02, 0.28), mat('#181d26', 0.2));
  internoV.position.y = 0.095;
  const coperchio = new T.Mesh(new RoundedBoxGeometry(0.46, 0.05, 0.32, 2, 0.012), mat('#2c3340', 0.25, 0.5, 0.3));
  coperchio.position.set(0, 0.22, -0.22); coperchio.rotation.x = -1.25;
  valigetta.add(vasca, internoV, coperchio);
  for (let ix = -1; ix <= 1; ix++) {
    for (let iz = -0.5; iz <= 0.5; iz += 1) {
      const mazz = new T.Mesh(new RoundedBoxGeometry(0.12, 0.045, 0.09, 2, 0.008), mat('#2e8d5c', 0.32));
      mazz.position.set(ix * 0.13, 0.12, iz * 0.11);
      const fascia = new T.Mesh(new T.BoxGeometry(0.036, 0.048, 0.092), mat('#f7eed6', 0.32));
      fascia.position.copy(mazz.position);
      valigetta.add(mazz, fascia);
    }
  }
  OBJ.valigetta_aperta = valigetta;

  // Mazzetta singola porge-prende per il dottore
  const mazzBanco = new T.Group();
  mazzBanco.name = 'mazzetta_banco';
  mazzBanco.position.set(0.48, 0.80, -0.58);
  mazzBanco.add(
    new T.Mesh(new RoundedBoxGeometry(0.15, 0.045, 0.08, 2, 0.008), mat('#2e9660', 0.32)),
    new T.Mesh(new T.BoxGeometry(0.042, 0.048, 0.082), mat('#faf0d2', 0.32))
  );
  M.root.add(mazzBanco);
  OBJ.mazzetta = mazzBanco;

  // Piccoli oggetti indipendenti a livello root per ricchezza visiva (sopra scrivania, tavolo sx, scaffale e parete alta sx)
  sm(0.08, 0.07, 0.08, mat('#d9b038', 0.34), 0.72, 0.81, -0.25, 0.012, 0, 'timbro_medico');
  sm(0.10, 0.05, 0.10, mat('#b43434', 0.32), -0.75, 0.80, -0.22, 0.015, 0, 'tampone_inchiostro');
  sm(0.16, 0.09, 0.11, mat('#f0eee6', 0.32), -0.62, 0.82, -0.78, 0.015, 0.2, 'tazza_dottore');
  sm(0.14, 0.18, 0.14, mat('#349878', 0.34), -0.15, 0.87, -0.18, 0.02, 0, 'flaconcino_scrivania');
  sm(0.18, 0.10, 0.12, mat('#e6b83e', 0.34), 0.10, 0.83, -0.16, 0.015, 0.15, 'campanello_banco');
  sm(0.16, 0.16, 0.24, mat('#4e82b4', 0.32), 0.92, 0.10, 0.25, 0.02, 0.25, 'valigetta_piccola_terra_dx');
  sm(0.46, 0.42, 0.46, mat('#dce2ea', 0.26), -2.45, 0.21, 1.35, 0.02, 0.15, 'tavolino_ausiliario_sx');
  sm(0.09, 0.16, 0.09, mat('#348c68', 0.32), -2.48, 0.50, 1.32, 0.02, 0, 'boccetta_disinfettante');
  sm(0.14, 0.06, 0.18, mat('#d84a48', 0.30), -2.36, 0.45, 1.42, 0.015, -0.2, 'scatola_pronto_soccorso');
  sm(0.12, 0.12, 0.12, mat('#f7f4ec', 0.32), -2.52, 0.48, 1.24, 0.02, 0, 'rotolo_garze');
  const cartelloCroce = cartello(M, {
    testo: '+ EMERGENZA', w: 0.72, h: 0.28,
    x: -3.48, y: 2.38, z: -1.65, ry: Math.PI / 2,
    fondo: '#f2ede4', colore: '#c82428', bordo: '#c82428',
  });
  cartelloCroce.name = 'cartello_emergenza_alto_sx';
  const insegnaUscita = cartello(M, {
    testo: 'USCITA', w: 0.56, h: 0.22,
    x: -3.52, y: 2.38, z: 1.55, ry: Math.PI / 2,
    fondo: '#17663e', colore: '#ffffff', bordo: '#b8f2d0',
  });
  insegnaUscita.name = 'insegna_uscita_sx';
  M.vita.aggiungi(insegnaUscita, 'lampeggia', { min: 0.88, freq: 0.4, modo: 'respiro' });
  const quadroSx = sm(0.04, 0.68, 0.52, mat('#3e6888', 0.30), -3.55, 1.95, -0.45, 0.015, 0, 'quadro_clinica_sx');
  void quadroSx;
  const telecameraInt = sm(0.12, 0.10, 0.18, mat('#2a303c', 0.25), -3.28, 2.55, -2.95, 0.02, 0.4, 'telecamera_clinica');
  M.vita.aggiungi(telecameraInt, 'pendola', { amp: 0.12, freq: 0.28, asse: 'y' });

  // Ventilatore da tavolo piccolo sulla scrivania (gira vivo!)
  const vent = new T.Group();
  vent.name = 'ventilatore_tavolo';
  vent.position.set(-0.82, 0.78, -0.78);
  vent.rotation.y = 0.45;
  M.root.add(vent);
  vent.add(
    (() => { const b = new T.Mesh(new T.CylinderGeometry(0.08, 0.09, 0.03, 12), mat('#556070', 0.25)); b.position.y = 0.015; return b; })(),
    (() => { const s = new T.Mesh(new T.CylinderGeometry(0.016, 0.02, 0.18, 8), mat('#788492', 0.25)); s.position.y = 0.10; return s; })()
  );
  const elica = new T.Group();
  elica.position.set(0, 0.22, 0.02);
  for (let i = 0; i < 3; i++) {
    const pala = new T.Mesh(new RoundedBoxGeometry(0.06, 0.12, 0.008, 2, 0.003), mat('#65ada2', 0.28));
    pala.rotation.z = (i * Math.PI * 2) / 3;
    pala.position.set(Math.sin(pala.rotation.z) * -0.05, Math.cos(pala.rotation.z) * 0.05, 0);
    elica.add(pala);
  }
  vent.add(elica);
  M.vita.aggiungi(elica, 'gira', { vel: 1.3, asse: 'z' });

  // Sgabello con rotelle del dottore dietro la scrivania
  const sgabello = new T.Group();
  sgabello.name = 'sgabello_rotelle';
  sgabello.position.set(0.68, 0, -1.25);
  M.root.add(sgabello);
  sgabello.add(
    (() => { const c = new T.Mesh(new T.CylinderGeometry(0.21, 0.21, 0.08, 16), mat('#3a4452', 0.25)); c.position.y = 0.48; return c; })(),
    (() => { const g = new T.Mesh(new T.CylinderGeometry(0.03, 0.04, 0.42, 10), mat('#adb5c2', 0.25)); g.position.y = 0.24; return g; })(),
    (() => { const r = new T.Mesh(new T.CylinderGeometry(0.24, 0.24, 0.03, 12), mat('#242b36', 0.22)); r.position.y = 0.04; return r; })()
  );

  // ---- 6. PARETE DESTRA (X = +3.55): SPECCHIO GRANDE (SCENA 2!), PANNELLO DIAGNOSTICO, PIANTA, POLTRONA, CESTINO
  const specchio = new T.Group();
  specchio.name = 'specchio_parete';
  specchio.position.set(3.52, 1.48, 0.45);
  specchio.rotation.y = -Math.PI / 2;
  M.root.add(specchio);
  const cornSp = new T.Mesh(new RoundedBoxGeometry(1.74, 1.76, 0.06, 3, 0.02), mat('#8a96a6', 0.26, 0.35, 0.4));
  const texSp = tela(384, 384, (c, Wp, Hp) => {
    const gr = c.createLinearGradient(0, 0, Wp, Hp);
    gr.addColorStop(0, '#6a8bad');
    gr.addColorStop(0.5, '#a8c8e2');
    gr.addColorStop(1, '#58789c');
    c.fillStyle = gr; c.fillRect(0, 0, Wp, Hp);
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.beginPath(); c.moveTo(Wp * 0.14, 0); c.lineTo(Wp * 0.36, 0); c.lineTo(Wp * 0.08, Hp); c.lineTo(0, Hp); c.closePath(); c.fill();
  });
  const vetroSp = new T.Mesh(new T.PlaneGeometry(1.58, 1.60), dip(texSp, 0.25, 0.52));
  vetroSp.position.z = 0.035;
  const mensolaSp = new T.Mesh(new RoundedBoxGeometry(1.68, 0.05, 0.24, 2, 0.015), mat('#b0bac8', 0.26));
  mensolaSp.position.set(0, -0.82, 0.12);
  specchio.add(cornSp, vetroSp, mensolaSp);
  M.vita.aggiungi(vetroSp, 'lampeggia', { min: 0.94, freq: 0.35, modo: 'respiro' });

  // Bicchieri sterili sulla mensola dello specchio
  sm(0.07, 0.10, 0.07, mat('#78c8b8', 0.28), 3.36, 0.72, 0.12, 0.02, 0, 'bicchieri_sterili');

  // Pannello diagnostico medico (sfigmomanometro + contenitore aghi giallo/rosso + dispenser gel/guanti)
  const pannelloDx = new T.Group();
  pannelloDx.name = 'pannello_diagnostico';
  pannelloDx.position.set(3.52, 1.40, -1.35);
  pannelloDx.rotation.y = -Math.PI / 2;
  M.root.add(pannelloDx);
  pannelloDx.add(
    (() => { const p = new T.Mesh(new RoundedBoxGeometry(0.95, 0.76, 0.04, 2, 0.015), mat('#f2eee4', 0.28)); return p; })(),
    (() => { const g = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.04, 16), mat('#ffffff', 0.32)); g.rotation.x = Math.PI / 2; g.position.set(-0.24, 0.14, 0.03); return g; })(),
    (() => { const c = new T.Mesh(new RoundedBoxGeometry(0.22, 0.24, 0.14, 2, 0.02), mat('#e0b82e', 0.3)); c.position.set(0.22, -0.14, 0.08); return c; })(),
    (() => { const l = new T.Mesh(new T.BoxGeometry(0.24, 0.06, 0.15), mat('#c83232', 0.3)); l.position.set(0.22, -0.01, 0.08); return l; })(),
    (() => { const dg = new T.Mesh(new RoundedBoxGeometry(0.16, 0.22, 0.10, 2, 0.02), mat('#4b9ad4', 0.28)); dg.position.set(-0.18, -0.14, 0.06); return dg; })()
  );

  // Condizionatore sulla parete destra alto (vivo!)
  await vivo(M, 'condizionatore', { x: 3.48, y: 2.55, z: -1.75, ry: -Math.PI / 2, s: 0.9 });

  // Pianta in vaso scuro che ondeggia vicino alla parete destra
  const pianta = new T.Group();
  pianta.name = 'pianta_vaso';
  pianta.position.set(3.05, 0, -2.75);
  M.root.add(pianta);
  pianta.add((() => { const v = new T.Mesh(new T.CylinderGeometry(0.22, 0.17, 0.42, 12), mat('#2a303a', 0.24)); v.position.y = 0.21; return v; })());
  for (let i = 0; i < 6; i++) {
    const f = new T.Mesh(new T.SphereGeometry(0.17, 8, 6), mat(i % 2 ? '#2e7d5b' : '#40966c', 0.28));
    f.scale.set(0.5, 2.1, 0.45);
    f.rotation.z = (i - 2.5) * 0.24;
    f.position.set((i - 2.5) * 0.05, 0.68, Math.sin(i) * 0.06);
    pianta.add(f);
  }
  M.vita.aggiungi(pianta, 'ondeggia', { amp: 0.045, freq: 0.38 });

  // Poltrona paziente e cestino rifiuti rossi (biohazard)
  const poltrona = new T.Group();
  poltrona.name = 'poltrona_paziente';
  poltrona.position.set(2.82, 0, 2.15);
  poltrona.rotation.y = -Math.PI * 0.65;
  M.root.add(poltrona);
  poltrona.add(
    (() => { const s = new T.Mesh(new RoundedBoxGeometry(0.66, 0.16, 0.62, 3, 0.04), mat('#626d7a', 0.25)); s.position.y = 0.44; return s; })(),
    (() => { const b = new T.Mesh(new RoundedBoxGeometry(0.64, 0.56, 0.16, 3, 0.04), mat('#626d7a', 0.25)); b.position.set(0, 0.72, -0.24); return b; })(),
    (() => { const bs = new T.Mesh(new T.BoxGeometry(0.58, 0.36, 0.54), mat('#3a4250', 0.24)); bs.position.y = 0.18; return bs; })()
  );
  sm(0.32, 0.46, 0.28, mat('#c43232', 0.28), 3.05, 0.23, -0.78, 0.03, 0, 'cestino_rifiuti_rosso');

  // ---- 7. PARETE SINISTRA (X = -3.55): ARMADIETTO FARMACI, PORTA CON CARTELLO, APPENDIABITI
  const armadio = new T.Group();
  armadio.name = 'armadietto_farmaci';
  armadio.position.set(-3.26, 0, 0.65);
  armadio.rotation.y = Math.PI / 2;
  M.root.add(armadio);
  armadio.add(
    (() => { const b = new T.Mesh(new RoundedBoxGeometry(1.15, 1.92, 0.46, 2, 0.02), mat('#e8e2d6', 0.28)); b.position.y = 0.96; b.castShadow = true; return b; })(),
    (() => { const v = new T.Mesh(new T.BoxGeometry(0.95, 0.92, 0.04), mat('#6aa6b8', 0.34)); v.position.set(0, 1.38, 0.22); return v; })(),
    (() => { const m1 = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.14, 8), mat('#2d8a64', 0.3)); m1.position.set(-0.22, 1.18, 0.16); return m1; })(),
    (() => { const m2 = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.16, 8), mat('#d98a32', 0.3)); m2.position.set(0.08, 1.19, 0.16); return m2; })()
  );
  const targaUso = cartello(M, {
    testo: 'USO CLINICO', w: 0.52, h: 0.16,
    x: -3.01, y: 0.72, z: 0.65, ry: Math.PI / 2,
    fondo: '#243c4d', colore: '#f0f4f8', bordo: '#5a829c',
  });
  targaUso.name = 'targa_uso_clinico';

  // Porta in legno chiusa su parete sinistra + cartello «VIETATO REGISTRARE» + allarme rosso
  const portaClinica = new T.Group();
  portaClinica.name = 'porta_clinica';
  portaClinica.position.set(-3.55, 1.08, 2.55);
  portaClinica.rotation.y = Math.PI / 2;
  str(portaClinica);
  portaClinica.add(
    (() => { const f = new T.Mesh(new RoundedBoxGeometry(1.04, 2.16, 0.08, 2, 0.015), mat('#5c422c', 0.24)); return f; })(),
    (() => { const p = new T.Mesh(new T.BoxGeometry(0.92, 2.08, 0.05), mat('#8a6444', 0.25)); return p; })(),
    (() => { const v = new T.Mesh(new T.BoxGeometry(0.32, 0.56, 0.07), mat('#9ec2d4', 0.32)); v.position.set(0, 0.42, 0); return v; })(),
    (() => { const m = new T.Mesh(new RoundedBoxGeometry(0.14, 0.03, 0.08, 2, 0.01), mat('#d4b45c', 0.28)); m.position.set(0.34, -0.04, 0.05); return m; })()
  );
  M.root.add(portaClinica);

  const avvPorta = cartello(M, {
    testo: 'VIETATO REGISTRARE', w: 0.46, h: 0.22,
    x: -3.49, y: 1.52, z: 2.55, ry: Math.PI / 2,
    fondo: '#b82428', colore: '#ffffff', bordo: '#f2e8da',
  });
  avvPorta.name = 'cartello_porta';

  sm(0.14, 0.18, 0.06, mat('#c82428', 0.32), -3.52, 1.42, 1.72, 0.015, 0, 'allarme_antincendio');
  sm(0.06, 1.65, 0.06, mat('#4e5866', 0.25), -3.05, 0.82, -2.85, 0.015, 0, 'appendiabiti_colonna');
}

