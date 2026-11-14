// Ingresso di casa italiana (scheda luogo: mondo_ingresso.md). Stanza chiusa 5.6 x 8.0 x 3.1 m.
import { orologio, cartello } from '/web/buon_senso.js';
import { vivo } from '/web/vivi.js';
import { animato } from '/web/animati.js';
import { attrezzi, pianta, quadroDipinto, lampadaPendente, smorza } from '/scena/oggetti_storia.js';

export async function costruisci(M, D, S, OBJ) {
  const { T, mat, tela, dip, sm, cil, grp, into } = attrezzi(M);
  const W = 5.6, X = W / 2, ZF = -3.8, ZB = 4.0, H = 3.1;
  const ZLEN = ZB - ZF + 0.2, ZMID = (ZB + ZF) / 2;
  const str = m => {
    if (m.traverse) m.traverse(c => { c.userData.struttura = 1; });
    m.userData.struttura = 1;
    return m;
  };

  /* 1. STRUTTURE ARCHITETTONICHE (piani sfalsati > +0.015 m: zero z-fighting con D.road) */
  const texGraniglia = tela(256, 256, (g, Ww, Hh) => {
    g.fillStyle = '#c2ad90';
    g.fillRect(0, 0, Ww, Hh);
    const cols = ['#a89276', '#d4c0a4', '#9e7c62', '#8f8474'];
    for (let i = 0; i < 65; i++) {
      g.fillStyle = cols[i % cols.length];
      g.fillRect((i * 53) % (Ww - 10), (i * 89) % (Hh - 10), 8 + (i % 3) * 4, 8 + ((i + 1) % 3) * 4);
    }
  });
  texGraniglia.wrapS = texGraniglia.wrapT = T.RepeatWrapping;
  texGraniglia.repeat.set(3, 4);
  const mPav = dip(texGraniglia, 0.16, 0.88);
  const mMuro = mat('#e4d5ba', 0.18, 0.88);
  const mBoiserie = mat('#8a5e3c', 0.14, 0.82);
  const mBattiscopa = mat('#633e24', 0.12, 0.80);

  str(M.box(W + 0.4, 0.14, ZLEN, mPav, 0, -0.055, ZMID));
  str(M.box(W + 0.4, 0.14, ZLEN, mat('#ebdfc7', 0.18, 0.9), 0, H + 0.07, ZMID));
  str(M.box(0.18, H, ZLEN, mMuro, -X, H / 2, ZMID));
  str(M.box(0.18, H, ZLEN, mMuro, X, H / 2, ZMID));
  str(M.box(1.9, H, 0.18, mMuro, -1.85, H / 2, ZB + 0.06));
  str(M.box(1.9, H, 0.18, mMuro, 1.85, H / 2, ZB + 0.06));
  str(M.box(1.9, H - 2.2, 0.18, mMuro, 0, 2.2 + (H - 2.2) / 2, ZB + 0.06));

  /* Fascia boiserie legno e battiscopa lungo le pareti laterali */
  str(M.box(0.05, 0.92, ZLEN - 0.3, mBoiserie, -X + 0.10, 0.46, ZMID));
  str(M.box(0.05, 0.92, ZLEN - 0.3, mBoiserie, X - 0.10, 0.46, ZMID));
  str(M.box(0.07, 0.12, ZLEN - 0.3, mBattiscopa, -X + 0.12, 0.07, ZMID));
  str(M.box(0.07, 0.12, ZLEN - 0.3, mBattiscopa, X - 0.12, 0.07, ZMID));

  /* Parete fondo z = -3.8 con arco aperto sulla cucina + alcova cucina chiusa (zero vuoto dietro) */
  str(M.box(1.85, H, 0.18, mMuro, -1.88, H / 2, ZF));
  str(M.box(1.85, H, 0.18, mMuro, 1.88, H / 2, ZF));
  str(M.box(2.0, H - 2.28, 0.18, mMuro, 0, 2.28 + (H - 2.28) / 2, ZF));
  str(M.box(0.12, 2.28, 0.24, mBattiscopa, -0.96, 1.14, ZF));
  str(M.box(0.12, 2.28, 0.24, mBattiscopa, 0.96, 1.14, ZF));
  str(M.box(2.04, 0.14, 0.24, mBattiscopa, 0, 2.30, ZF));
  str(M.box(3.6, H, 0.18, mat('#dfbfa0', 0.20, 0.86), 0, H / 2, ZF - 1.65));
  str(M.box(0.18, H, 1.85, mat('#dfbfa0', 0.20, 0.86), -1.7, H / 2, ZF - 0.82));
  str(M.box(0.18, H, 1.85, mat('#dfbfa0', 0.20, 0.86), 1.7, H / 2, ZF - 0.82));
  str(M.box(3.6, 0.16, 1.85, mMuro, 0, H + 0.07, ZF - 0.82));
  str(M.box(3.6, 0.14, 1.85, mat('#a85d44', 0.18, 0.85), 0, -0.055, ZF - 0.82));
  /* Credenza dipinta visibile sullo sfondo attraverso l'arco cucina */
  const mobArc = grp(0, 0, ZF - 1.25, 0, 'credenza_sfondo_cucina');
  into(mobArc, sm(1.4, 0.88, 0.45, mat('#7a4e2d', 0.16), 0, 0.44, 0, 0.02));
  into(mobArc, sm(1.46, 0.05, 0.5, mat('#e4d4ba', 0.18), 0, 0.90, 0, 0.01));
  into(mobArc, new T.Mesh(new T.CylinderGeometry(0.14, 0.11, 0.16, 14), mat('#b85c44', 0.22))).position.set(-0.32, 0.99, 0);
  into(mobArc, new T.Mesh(new T.CylinderGeometry(0.12, 0.10, 0.14, 14), mat('#e8c474', 0.22))).position.set(0.28, 0.98, 0.05);

  /* Atrio esterno chiuso dietro la porta d'ingresso z > +4.0 così l'anta ruotando verso l'esterno non mostra mai il vuoto */
  str(M.box(3.0, H, 0.18, mat('#c9b89e', 0.18), 0, H / 2, ZB + 1.45));
  str(M.box(0.18, H, 1.5, mat('#c9b89e', 0.18), -1.45, H / 2, ZB + 0.72));
  str(M.box(0.18, H, 1.5, mat('#c9b89e', 0.18), 1.45, H / 2, ZB + 0.72));
  str(M.box(3.0, 0.16, 1.5, mat('#d8c8ae', 0.18), 0, H + 0.07, ZB + 0.72));
  str(M.box(3.0, 0.14, 1.5, mat('#8c8276', 0.16), 0, -0.055, ZB + 0.72));

  /* Passatoia rossa con bordi crema e frange (roughness alto e colore bordeaux così resta calda sotto Luce Rick) */
  const texTapp = tela(256, 512, (g, Ww, Hh) => {
    g.fillStyle = '#8e282b'; g.fillRect(0, 0, Ww, Hh);
    g.fillStyle = '#d6be96'; g.fillRect(14, 0, 12, Hh); g.fillRect(Ww - 26, 0, 12, Hh);
    g.fillStyle = '#d6be96'; g.fillRect(0, 10, Ww, 10); g.fillRect(0, Hh - 20, Ww, 10);
  });
  const mTapp = dip(texTapp, 0.18, 0.92);
  str(M.box(1.25, 0.018, 6.7, mTapp, 0, 0.025, 0.0));

  /* 2. PORTA D'INGRESSO VIVA (ry = Math.PI così l'anta si apre verso l'atrio esterno z > 4.0) */
  try {
    OBJ.porta_ingresso = smorza(await vivo(M, 'porta_battente', { x: 0, z: ZB - 0.02, ry: Math.PI, s: 1.0, colori: { corpo: '#6b4226', legno: '#58341c', metallo: '#cfa03c' } }));
  } catch {
    OBJ.porta_ingresso = sm(1.0, 2.15, 0.08, mat('#6b4226', 0.16), 0, 1.08, ZB - 0.02, 0.02);
  }
  OBJ.porta_ingresso.name = 'porta_ingresso';
  cartello(M, { testo: 'BENVENUTI', x: 0, y: 0.032, z: 3.32, w: 0.68, h: 0.36, ry: Math.PI, fondo: '#a87d4e', colore: '#2a1a16', bordo: '#634326', righe: 1 }).rotation.x = -Math.PI / 2;

  /* 3. MOBILI GRANDI E MEDI (nomi individuali per ricchezza.txt; lascia libera la corsia centrale [-0.95..+0.95]) */
  /* Consolle a sinistra (x = -2.36, z = -1.2) */
  const mLegno = mat('#6e4628', 0.15, 0.78);
  const mLegnoCh = mat('#94623c', 0.16, 0.78);
  const cons = grp(-2.36, 0, -1.2, 0, 'consolle');
  into(cons, sm(0.46, 0.06, 1.32, mLegno, 0, 0.82, 0, 0.015));
  into(cons, sm(0.42, 0.14, 1.24, mLegnoCh, 0, 0.72, 0, 0.012));
  for (const [sx, sz] of [[-0.18, -0.56], [0.18, -0.56], [-0.18, 0.56], [0.18, 0.56]]) {
    const gm = cil(0.026, 0.018, 0.68, mLegno, sx, 0.34, sz, 8); gm.castShadow = false; cons.add(gm);
  }

  /* Oggetti PICCOLI separati sopra la consolle */
  sm(0.32, 0.012, 0.58, mat('#ebdcb8', 0.20, 0.9), -2.36, 0.858, -1.2, 0.005, 'centrino_consolle');
  const tel = grp(-2.35, 0.865, -0.82, 0.35, 'telefono_disco');
  into(tel, sm(0.20, 0.08, 0.22, mat('#346858', 0.20), 0, 0.04, 0, 0.02));
  into(tel, sm(0.24, 0.045, 0.06, mat('#2c584a', 0.20), 0, 0.10, -0.02, 0.015));
  into(tel, cil(0.055, 0.055, 0.015, mat('#e8dcc0', 0.24), 0, 0.065, 0.05, 14)).rotation.x = 0.45;

  const ciotola = grp(-2.32, 0.865, -1.24, 0, 'ciotola_chiavi');
  into(ciotola, cil(0.12, 0.07, 0.06, mat('#3a6a98', 0.22), 0, 0.03, 0, 14));
  into(ciotola, sm(0.09, 0.015, 0.04, mat('#d8a83e', 0.24), 0.01, 0.055, 0.01, 0.005));

  sm(0.22, 0.025, 0.15, mat('#f0e6cc', 0.24), -2.34, 0.87, -1.55, 0.005, 'buste_posta').rotation.y = 0.18;
  sm(0.16, 0.21, 0.03, mat('#a87240', 0.18), -2.50, 0.96, -1.62, 0.008, 'cornice_foto_piccola').rotation.y = 0.4;

  /* Lampada da tavolo sopra consolle con luce vera */
  const lCons = grp(-2.40, 0.865, -0.64, 0, 'lampada_consolle');
  into(lCons, cil(0.06, 0.085, 0.18, mat('#c86a3a', 0.20), 0, 0.09, 0, 12));
  const cCons = new T.Mesh(new T.CylinderGeometry(0.09, 0.16, 0.16, 16), mat('#f2dfb0', 0.55));
  cCons.position.y = 0.24; cCons.castShadow = false; lCons.add(cCons);
  lCons.userData.vivo = 'lampada_consolle';
  M.vita.aggiungi(cCons, 'lampeggia', { min: 0.88, freq: 0.35, modo: 'respiro' });
  M.luce('#ffd89a', 2.4, -2.28, 1.05, -0.64, 6.0);

  /* Specchio d'ingresso intagliato sopra la consolle (senza riflesso bianco speculare) */
  const specchio = grp(-2.68, 1.66, -1.2, Math.PI / 2, 'specchio_ingresso');
  into(specchio, sm(0.95, 1.18, 0.05, mLegno, 0, 0, 0, 0.02));
  into(specchio, sm(0.78, 1.02, 0.02, mat('#8ea6ba', 0.26, 0.65), 0, 0, 0.025, 0.01));

  /* Scarpiera a destra (x = +2.36, z = 0.6) con pantofole storte (usura) + spazzola + borsa */
  const scarp = grp(2.36, 0, 0.6, 0, 'scarpiera');
  into(scarp, sm(0.42, 0.72, 1.08, mLegnoCh, 0, 0.36, 0, 0.02));
  into(scarp, sm(0.38, 0.26, 0.96, mat('#e6d2b4', 0.16), -0.04, 0.52, 0, 0.01));
  into(scarp, sm(0.38, 0.26, 0.96, mat('#e6d2b4', 0.16), -0.04, 0.22, 0, 0.01));
  sm(0.11, 0.06, 0.24, mat('#7a3238', 0.18), 1.98, 0.045, 0.42, 0.015, 'pantofola_sx').rotation.y = 0.32;
  sm(0.11, 0.06, 0.24, mat('#7a3238', 0.18), 1.92, 0.045, 0.72, 0.015, 'pantofola_dx').rotation.y = -0.18;
  sm(0.20, 0.05, 0.09, mat('#b48652', 0.18), 2.34, 0.75, 0.38, 0.012, 'spazzola_abiti').rotation.y = 0.45;
  sm(0.24, 0.22, 0.14, mat('#48688c', 0.18), 2.34, 0.83, 0.85, 0.025, 'borsa_scarpiera');

  /* Termosifone in ghisa sulla parete sinistra verso l'ingresso */
  const termo = grp(-2.62, 0.44, 1.45, Math.PI / 2, 'termosifone_ghisa');
  for (let i = 0; i < 8; i++) into(termo, sm(0.08, 0.62, 0.16, mat('#dcd4c4', 0.18, 0.72), -0.35 + i * 0.10, 0, 0, 0.02));

  /* Appendiabiti a destra (x = +2.25, z = -1.3) con cappotto e sciarpa che oscillano */
  const app = grp(2.25, 0, -1.3, 0, 'appendiabiti');
  into(app, cil(0.08, 0.24, 0.08, mLegno, 0, 0.04, 0, 14));
  into(app, cil(0.035, 0.045, 1.82, mLegno, 0, 0.92, 0, 10)).castShadow = false;
  for (let i = 0; i < 4; i++) {
    const g = new T.Mesh(new T.BoxGeometry(0.03, 0.03, 0.22), mLegno);
    g.position.set(0, 1.78, 0); g.rotation.y = i * Math.PI / 2 + 0.4; g.translateZ(0.10); g.castShadow = false; app.add(g);
  }
  const capp = grp(2.16, 1.72, -1.3, 0, 'cappotto_appeso');
  into(capp, sm(0.24, 0.72, 0.36, mat('#384e68', 0.18), 0, -0.36, 0, 0.05));
  into(capp, sm(0.14, 0.56, 0.12, mat('#c8443e', 0.22), -0.06, -0.28, 0.16, 0.02));
  capp.userData.vivo = 'cappotto_appeso';
  M.vita.aggiungi(capp, 'ondeggia', { amp: 0.025, freq: 0.35, seme: 1.2 });

  /* Portaombrelli ceramico vicino alla porta + 2 ombrelli */
  const po = grp(2.22, 0, 2.55, 0, 'portaombrelli');
  into(po, cil(0.17, 0.14, 0.54, mat('#3a6e7c', 0.22), 0, 0.27, 0, 14));
  into(po, cil(0.03, 0.02, 0.72, mat('#a8343a', 0.22), -0.05, 0.44, 0.04, 8)).rotation.z = 0.15;
  into(po, cil(0.03, 0.02, 0.70, mat('#345898', 0.22), 0.06, 0.42, -0.03, 8)).rotation.z = -0.14;

  /* 4. QUADRI, SCRITTE E OROLOGIO VIVO CON PENDOLO */
  cartello(M, { testo: 'MAI DIRE:\nHO GIA MANGIATO', x: 1.78, y: 1.68, z: ZF + 0.13, w: 1.02, h: 0.66, fondo: '#f2e6cc', colore: '#8a2622', bordo: '#6e4628' }).name = 'quadro_mai_dire_arco';
  cartello(M, { testo: 'MAI DIRE:\nHO GIA MANGIATO', x: -1.55, y: 1.68, z: ZB - 0.10, ry: Math.PI, w: 0.96, h: 0.64, fondo: '#f2e6cc', colore: '#8a2622', bordo: '#6e4628' }).name = 'quadro_mai_dire_porta';
  cartello(M, { testo: 'CASA PINA', x: 1.45, y: 1.48, z: ZB - 0.10, ry: Math.PI, w: 0.56, h: 0.22, fondo: '#e8d8b4', colore: '#4a2a18', bordo: '#6e4628', righe: 1 }).name = 'targhetta_casa';
  quadroDipinto(M, { x: -2.68, y: 1.75, z: -2.65, ry: Math.PI / 2, w: 0.62, h: 0.48, motivo: 'famiglia', nome: 'quadro_famiglia_1' });
  quadroDipinto(M, { x: 2.68, y: 1.78, z: -2.45, ry: -Math.PI / 2, w: 0.68, h: 0.50, motivo: 'paesaggio', nome: 'quadro_paesaggio_1' });
  quadroDipinto(M, { x: 2.68, y: 1.78, z: 1.95, ry: -Math.PI / 2, w: 0.56, h: 0.46, motivo: 'famiglia', nome: 'quadro_famiglia_2' });

  orologio(M, { x: -1.72, y: 2.05, z: ZF + 0.13, r: 0.27, ora: '20:00', romani: true, cornice: '#7a3c28' });
  const pend = grp(-1.72, 1.75, ZF + 0.15, 0, 'pendolo_orologio');
  into(pend, cil(0.015, 0.015, 0.34, mat('#c89c3c', 0.24), 0, -0.17, 0, 8)).castShadow = false;
  into(pend, cil(0.065, 0.065, 0.03, mat('#d8aa42', 0.24), 0, -0.35, 0, 14)).rotation.x = Math.PI / 2;
  pend.userData.vivo = 'pendolo_orologio';
  M.vita.aggiungi(pend, 'pendola', { asse: 'z', amp: 0.14, freq: 1.0, vento: 0 });

  /* Tenda raccolta a destra dell'arco cucina (parte medio/alta che ondeggia) */
  const tendaArc = grp(0.72, 1.32, ZF + 0.15, 0, 'tenda_arco');
  into(tendaArc, sm(0.38, 1.85, 0.08, mat('#d8c49e', 0.20, 0.9), 0, 0, 0, 0.03));
  tendaArc.userData.vivo = 'tenda_arco';
  M.vita.aggiungi(tendaArc, 'ondeggia', { amp: 0.03, freq: 0.36 });

  /* Piante e piccoli oggetti d'ingresso sui bordi laterali (lascia corsia centrale [-0.95..+0.95] libera) */
  pianta(M, { x: -2.25, z: 2.65, s: 1.25, vaso: '#c2603c', foglie: '#4a9440', nome: 'pianta_ingresso_1' });
  pianta(M, { x: -2.25, z: -3.25, s: 1.05, vaso: '#b46240', foglie: '#5ca446', nome: 'pianta_ingresso_2' });
  sm(0.11, 0.16, 0.04, mat('#e6d8b8', 0.22), 1.15, 1.25, ZF + 0.11, 0.01, 'interruttore_arco');
  sm(0.11, 0.16, 0.04, mat('#e6d8b8', 0.22), 0.72, 1.25, ZB - 0.06, 0.01, 'interruttore_porta');

  /* Mensola in alto sopra l'arco con 3 ceramiche emiliane + piattini (riempie le caselle in alto!) */
  sm(2.45, 0.07, 0.28, mLegno, 0, 2.48, ZF + 0.18, 0.015, 'mensola_arco');
  cil(0.10, 0.07, 0.24, mat('#3a6e8c', 0.22), -0.78, 2.63, ZF + 0.18, 12, 'vaso_ceramica_sx');
  cil(0.12, 0.10, 0.18, mat('#c85a38', 0.22), 0.0, 2.60, ZF + 0.18, 12, 'zuppiera_arco');
  cil(0.09, 0.065, 0.22, mat('#e0a846', 0.22), 0.78, 2.62, ZF + 0.18, 12, 'vaso_ceramica_dx');

  /* Portariviste & giornali + lanterne e ciotola gatto in basso ai lati (riempie in basso sx/dx + piccoli >= 5) */
  sm(0.42, 0.36, 0.24, mLegnoCh, -1.92, 0.18, 0.45, 0.02, 'portariviste').rotation.y = 0.2;
  sm(0.24, 0.30, 0.04, mat('#d84a3c', 0.22), -1.86, 0.26, 0.48, 0.01, 'rivista_1').rotation.z = 0.18;
  sm(0.22, 0.28, 0.04, mat('#44789c', 0.22), -1.94, 0.25, 0.40, 0.01, 'rivista_2').rotation.z = -0.14;
  sm(0.24, 0.34, 0.24, mat('#c89248', 0.22), 1.88, 0.17, -0.35, 0.02, 'lanterna_terra_dx');
  cil(0.12, 0.14, 0.07, mat('#b8443c', 0.22), 1.28, 0.035, -1.55, 14, 'ciotola_gatto');
  const gom = new T.Mesh(new T.SphereGeometry(0.08, 10, 8), mat('#e0b044', 0.24));
  gom.position.set(1.18, 0.08, -1.25); gom.name = 'gomitolo_gatto'; M.root.add(gom);
  const piantePic = plantaMini(M, -1.55, 0.01, 0.85, 'piantina_soglia_sx');
  const campP = sm(0.18, 0.24, 0.05, mat('#d8a642', 0.22), -2.52, 1.45, 2.5, 0.01, 'citofono_ingresso');
  const fiora = cil(0.14, 0.11, 0.22, mat('#447c64', 0.22), -2.30, 0.98, -1.0, 12, 'vaso_fiori_consolle');
  const fiori = new T.Mesh(new T.SphereGeometry(0.13, 10, 8), mat('#d84a54', 0.26));
  fiori.position.set(-2.30, 1.15, -1.0); fiori.name = 'fiori_consolle'; M.root.add(fiori);
  M.vita.aggiungi(fiori, 'ondeggia', { amp: 0.05, freq: 0.45, seme: 2.1 });
  fiori.userData.vivo = 'fiori_consolle';
  /* Piccoli dettagli in basso a destra (visibili in 0.00 s) + piccola decorazione alta a destra */
  sm(0.11, 0.05, 0.24, mat('#7c3a34', 0.22), 1.02, 0.025, 0.34, 0.015, 'pantofola_dx_1').rotation.y = 0.22;
  sm(0.11, 0.05, 0.24, mat('#7c3a34', 0.22), 1.18, 0.025, 0.22, 0.015, 'pantofola_dx_2').rotation.y = -0.10;
  cil(0.10, 0.08, 0.16, mat('#c85a38', 0.22), 1.24, 0.08, -0.35, 12, 'vasetto_soglia_dx');
  cil(0.015, 0.015, 0.28, mat('#443830', 0.18), 1.72, 2.96, -2.20, 8, 'catena_pensile_dx');
  cil(0.14, 0.10, 0.20, mat('#b85c38', 0.22), 1.72, 2.78, -2.20, 12, 'vaso_pensile_dx');
  void piantePic; void campP;

  function plantaMini(Mm, px, py, pz, nm) {
    return pianta(Mm, { x: px, y: py, z: pz, s: 0.48, vaso: '#c2603c', foglie: '#5aa648', nome: nm });
  }

  /* Gatto vivo sul tappeto vicino all'arco destro */
  try {
    await animato(M, 'Cat', { x: 1.55, z: -2.75, ry: -0.6, alt: 0.30, anim: 'Idle', nome: 'gatto_ingresso' });
  } catch {}

  /* 5. LUCI VISIBILI INQUADRABILI (regola utente: solo dalle lampade visibili nei chiusi!) */
  lampadaPendente(M, { x: 0, y: 2.48, z: 0.25, corda: 0.62, paralume: '#e8c474', luceCol: '#ffe2b4', intensita: 5.5, raggio: 11, nome: 'plafoniera_ingresso' });
  lampadaPendente(M, { x: 0, y: 2.38, z: ZF + 0.45, corda: 0.72, paralume: '#b85c3a', luceCol: '#ffd89e', intensita: 3.8, raggio: 8.5, nome: 'lanterna_arco' });
  lampadaPendente(M, { x: 1.15, y: 2.36, z: ZB - 0.55, corda: 0.74, paralume: '#d89a4a', luceCol: '#ffdc9e', intensita: 3.6, raggio: 8.5, nome: 'applique_porta' });
}
