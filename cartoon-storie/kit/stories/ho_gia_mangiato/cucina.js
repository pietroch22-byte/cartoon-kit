// Cucina tradizionale di Nonna Pina (scheda luogo: mondo_cucina.md). Stanza chiusa 9.0 x 8.0 x 3.2 m.
import { orologio, cartello } from '/web/buon_senso.js';
import { vapore } from '/web/vivo.js';
import { animato } from '/web/animati.js';
import { attrezzi, formaFormaggio, pianta, sedia, quadroDipinto, lampadaPendente, geraniVaso } from '/scena/oggetti_storia.js';

export async function costruisci(M, D, S, OBJ) {
  const { T, mat, tela, dip, sm, cil, grp, into } = attrezzi(M);
  const X = 4.5, ZF = -4.0, ZB = 4.0, H = 3.2;
  const ZLEN = ZB - ZF + 0.2, ZMID = (ZB + ZF) / 2;
  const str = m => {
    if (m.traverse) m.traverse(c => { c.userData.struttura = 1; });
    m.userData.struttura = 1;
    return m;
  };

  /* 1. STRUTTURE: pavimento cotto opaco caldo a riquadri larghi, pareti crema + fascia salvia su tutti e 4 i muri, travi soffitto */
  const texCotto = tela(256, 256, (g, Ww, Hh) => {
    g.fillStyle = '#8b5e49'; g.fillRect(0, 0, Ww, Hh);
    const cols = ['#986a54', '#a4755e', '#8e624c', '#9e7058'];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      g.fillStyle = cols[(r * 2 + c) % 4];
      g.fillRect(c * 128 + 5, r * 128 + 5, 118, 118);
    }
  });
  texCotto.wrapS = texCotto.wrapT = T.RepeatWrapping; texCotto.repeat.set(6, 6);
  const mCotto = dip(texCotto, 0.14, 0.90);
  const mMuro = mat('#e4d4b6', 0.18, 0.88);
  const mSalvia = mat('#8da48c', 0.18, 0.86);
  const mLegno = mat('#6e4428', 0.15, 0.80);

  str(M.box(9.2, 0.14, ZLEN, mCotto, 0, -0.055, ZMID));
  str(M.box(9.2, 0.14, ZLEN, mat('#ebdfc7', 0.18, 0.90), 0, H + 0.07, ZMID));
  str(M.box(9.2, H, 0.18, mMuro, 0, H / 2, ZF));
  str(M.box(9.2, H, 0.18, mMuro, 0, H / 2, ZB));
  str(M.box(0.18, H, ZLEN, mMuro, -X, H / 2, ZMID));
  str(M.box(0.18, H, ZLEN, mMuro, X, H / 2, ZMID));
  str(M.box(8.8, 1.02, 0.04, mSalvia, 0, 0.51, ZF + 0.10));
  str(M.box(8.8, 1.02, 0.04, mSalvia, 0, 0.51, ZB - 0.10));
  str(M.box(0.04, 1.02, ZLEN - 0.3, mSalvia, -X + 0.10, 0.51, ZMID));
  str(M.box(0.04, 1.02, ZLEN - 0.3, mSalvia, X - 0.10, 0.51, ZMID));
  for (const tz of [-2.4, -0.3, 1.8]) str(M.box(8.8, 0.18, 0.22, mLegno, 0, H - 0.09, tz));
  /* Mensola con ceramiche sulla parete posteriore ZB + 2 quadretti così nessuna parete appare spoglia */
  sm(2.4, 0.06, 0.26, mLegno, -1.6, 1.75, ZB - 0.20, 0.015, 'mensola_parete_sud');
  for (let i = 0; i < 4; i++) cil(0.11, 0.09, 0.18, mat(i % 2 ? '#c86a42' : '#4a7a98', 0.20), -2.35 + i * 0.5, 1.87, ZB - 0.20, 12, `vaso_sud_${i}`);
  quadroDipinto(M, { x: 1.85, y: 1.85, z: ZB - 0.12, ry: Math.PI, w: 0.72, h: 0.52, motivo: 'paesaggio', nome: 'quadro_sud_cucina' });

  /* Finestra notturna sul retro sinistro (x = -1.75, z = -3.9) con sfondo notturno vero dietro i vetri */
  const fin = grp(-1.75, 1.72, ZF + 0.11, 0, 'finestra_cucina');
  into(fin, sm(1.45, 1.15, 0.08, mLegno, 0, 0, 0, 0.02));
  into(fin, new T.Mesh(new T.PlaneGeometry(1.26, 0.96), M.emi('#202c48', 0.55))).position.z = 0.045;
  str(fin);
  for (const [sx, nm] of [[-0.56, 'tenda_finestra_sx'], [0.56, 'tenda_finestra_dx']]) {
    const td = sm(0.36, 1.14, 0.06, mat('#c8443a', 0.22, 0.9), -1.75 + sx, 1.72, ZF + 0.18, 0.02, nm);
    td.userData.vivo = nm; M.vita.aggiungi(td, 'ondeggia', { amp: 0.035, freq: 0.38, seme: sx });
  }
  geraniVaso(M, { x: -1.75, y: 1.06, z: ZF + 0.24, w: 0.95, s: 0.72, nome: 'gerani_finestra_cucina' });

  /* 2. BLOCCO FORNELLI A SINISTRA (x = -3.75, z = -2.3..+0.3) CON 4 FUOCHI E VAPORE */
  const forn = grp(-3.75, 0, -1.0, 0, 'blocco_fornelli');
  into(forn, sm(0.95, 0.90, 2.55, mat('#e6d9be', 0.18, 0.8), 0, 0.45, 0, 0.02));
  into(forn, sm(1.02, 0.06, 2.60, mat('#9e9a92', 0.18, 0.72), 0, 0.91, 0, 0.015));
  into(forn, sm(0.05, 0.56, 0.72, mat('#2c2e38', 0.14), 0.48, 0.44, -0.35, 0.01));
  str(forn);
  /* Canovaccio che dondola appeso al forno */
  const cano = grp(-3.20, 0.68, -1.35, 0, 'canovaccio_forno');
  into(cano, sm(0.04, 0.42, 0.28, mat('#c8443a', 0.22, 0.9), 0, -0.21, 0, 0.01));
  cano.userData.vivo = 'canovaccio_forno'; M.vita.aggiungi(cano, 'ondeggia', { amp: 0.06, freq: 0.45, seme: 1.3 });
  /* 4 manopole rosse + 4 grandi pentole con fiammelle blu e vapore */
  for (let i = 0; i < 4; i++) {
    const fz = -1.75 + i * 0.48;
    const man = grp(-3.25, 0.80, fz, 0, `manopola_${i}`);
    into(man, sm(0.06, 0.06, 0.06, mat('#c8342e', 0.22), 0, 0, 0, 0.015));
    into(man, sm(0.016, 0.022, 0.012, mat('#f4efe4', 0.20), 0.028, 0.018, 0, 0.004));
    man.userData.vivo = `manopola_${i}`; OBJ[`manopola_${i}`] = man;
    const pent = grp(-3.70, 0.94, fz, 0, `pentola_${i}`);
    const r = i % 2 ? 0.17 : 0.19, hP = i % 2 ? 0.18 : 0.22;
    into(pent, cil(r, r * 0.92, hP, mat(i === 2 ? '#b86a3c' : '#787e8a', 0.20, 0.68), 0, hP / 2, 0, 18));
    into(pent, cil(r * 0.86, r * 0.86, 0.02, mat('#c43b2a', 0.24), 0, hP - 0.01, 0, 14));
    for (const sz of [-r - 0.03, r + 0.03]) {
      const m = sm(0.04, 0.025, 0.05, mat('#343038', 0.14), 0, hP * 0.78, sz, 0.008); m.castShadow = false; pent.add(m);
    }
    pent.userData.vivo = `pentola_${i}`; M.vita.aggiungi(pent, 'vibra', { amp: 0.004, freq: 6 + i });
    const fiamma = new T.Mesh(new T.TorusGeometry(0.14, 0.026, 8, 18), M.emi('#45b8ff', 1.15));
    fiamma.rotation.x = Math.PI / 2; fiamma.position.set(-3.70, 0.95, fz); fiamma.name = `fuoco${i}`; fiamma.userData.vivo = `fuoco${i}`; M.root.add(fiamma);
    M.vita.aggiungi(fiamma, 'lampeggia', { min: 0.75, freq: 1.4 + i * 0.2, modo: 'respiro', seme: i });
    OBJ[`fuoco${i}`] = fiamma;
    vapore(M, { x: -3.70, y: 1.18, z: fz, n: 5, alt: 0.95, r: 0.09, vel: 0.44, op: 0.24, legato: fiamma });
  }
  const cappa = grp(-3.72, 2.38, -1.0, 0, 'cappa_cucina');
  into(cappa, sm(1.12, 0.56, 2.55, mat('#b66a46', 0.20, 0.78), 0, 0, 0, 0.04));
  into(cappa, sm(0.55, 0.55, 1.1, mat('#dcd0b8', 0.18), -0.25, 0.52, 0, 0.02));
  str(cappa);
  const lampCappa = new T.Mesh(new T.PlaneGeometry(0.18, 1.4), M.emi('#fff0c8', 0.9));
  lampCappa.rotation.x = Math.PI / 2; lampCappa.position.set(0.1, -0.29, 0); cappa.add(lampCappa);
  M.luce('#ffd498', 3.8, -3.15, 2.05, -1.0, 7.5);

  /* Frigorifero bomba anni '60 nell'angolo sinistro (vibra automaticamente in vita.js) */
  const frigo = grp(-3.82, 0, -3.15, 0.12, 'frigorifero');
  into(frigo, sm(0.86, 1.72, 0.82, mat('#dfd2b4', 0.18, 0.72), 0, 0.86, 0, 0.14));
  into(frigo, sm(0.05, 0.26, 0.05, mat('#9a9ea8', 0.18), 0.45, 1.15, 0.28, 0.01));
  frigo.userData.vivo = 'frigorifero';

  /* Mensola sopra piano lavoro + barattoli con scritte + tagliere/mattarello */
  str(sm(0.32, 0.06, 1.65, mLegno, -4.18, 1.68, 0.95, 0.015, 'mensola_barattoli'));
  cartello(M, { testo: 'FARINA', x: -4.15, y: 1.84, z: 0.45, ry: Math.PI / 2, w: 0.26, h: 0.22, fondo: '#f0e6cc', colore: '#3a2216', bordo: '#b83c2c', righe: 1 }).name = 'barattolo_farina';
  cartello(M, { testo: 'PASSATA', x: -4.15, y: 1.84, z: 0.95, ry: Math.PI / 2, w: 0.26, h: 0.24, fondo: '#c83c2e', colore: '#f2e6cc', bordo: '#6e221a', righe: 1 }).name = 'barattolo_passata';
  cartello(M, { testo: 'SALE', x: -4.15, y: 1.82, z: 1.42, ry: Math.PI / 2, w: 0.22, h: 0.18, fondo: '#d8e4ec', colore: '#26344a', bordo: '#54728a', righe: 1 }).name = 'barattolo_sale';
  str(sm(0.45, 0.86, 1.45, mat('#e6d9be', 0.18), -3.95, 0.43, 1.15, 0.02, 'banco_lavoro'));
  sm(0.32, 0.04, 0.46, mat('#c89c62', 0.18), -3.88, 0.88, 0.95, 0.01, 'tagliere');
  cil(0.032, 0.032, 0.42, mat('#b4824a', 0.18), -3.86, 0.92, 0.95, 10, 'mattarello').rotation.x = Math.PI / 2;
  cil(0.055, 0.065, 0.26, mat('#4f7e38', 0.22), -3.90, 0.99, 1.42, 12, 'bottiglia_olio');

  /* 3. TAVOLO CENTRALE CON TOVAGLIA A QUADRETTI (stessa scala su piano e bordo), 4 SEDIE E PIATTI */
  const texTovaglia = tela(256, 256, (g, Ww, Hh) => {
    g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, Ww, Hh);
    g.fillStyle = 'rgba(186, 48, 42, 0.82)';
    for (let x = 0; x < Ww; x += 64) g.fillRect(x, 0, 32, Hh);
    g.fillStyle = 'rgba(186, 48, 42, 0.48)';
    for (let y = 0; y < Hh; y += 64) g.fillRect(0, y, Ww, 32);
  });
  texTovaglia.wrapS = texTovaglia.wrapT = T.RepeatWrapping; texTovaglia.repeat.set(3, 2);
  const tav = grp(0, 0, -0.25, 0, 'tavolo');
  const piano = new T.Mesh(new T.BoxGeometry(2.05, 0.12, 1.24), dip(texTovaglia, 0.22, 0.88));
  piano.position.y = 0.76; piano.castShadow = piano.receiveShadow = true; tav.add(piano);
  for (const [sx, sz] of [[-0.88, -0.50], [0.88, -0.50], [-0.88, 0.50], [0.88, 0.50]]) {
    const g = cil(0.042, 0.035, 0.72, mLegno, sx, 0.36, sz, 10); g.castShadow = false; tav.add(g);
  }
  sedia(M, { x: 0.35, z: -1.18, ry: 0.08, nome: 'sedia_marco' });
  sedia(M, { x: -0.62, z: -1.16, ry: -0.18, nome: 'sedia_sx' });
  sedia(M, { x: 1.26, z: -0.25, ry: -1.42, nome: 'sedia_capotavola' });
  sedia(M, { x: -0.25, z: 0.68, ry: Math.PI - 0.12, nome: 'sedia_fronte' });

  /* Stoviglie piccole sul tavolo (nomi separati, visibili in campo largo e medio) */
  cil(0.14, 0.10, 0.025, mat('#efe6d2', 0.24), 0.35, 0.83, -0.62, 16, 'piattino_marco');
  sm(0.18, 0.02, 0.04, mat('#a8acb4', 0.20), 0.55, 0.83, -0.62, 0.005, 'posate_marco');
  cil(0.075, 0.095, 0.28, mat('#4e7e3e', 0.22), 0.78, 0.96, 0.14, 12, 'fiasco_vino');
  cil(0.08, 0.06, 0.22, mat('#8eb8cc', 0.24), -0.78, 0.93, 0.18, 12, 'brocca_acqua');
  cil(0.16, 0.13, 0.11, mat('#c89c5e', 0.20), -0.45, 0.88, 0.24, 14, 'cestino_pane');
  cil(0.04, 0.045, 0.16, mat('#6e4428', 0.18), 0.74, 0.90, -0.58, 10, 'macinapepe');

  /* MEGA LASAGNA GIGANTE (larga come una porta 1.9 m ma bassa top 1.06 m così Marco si vede sopra!) */
  const texLas = tela(256, 128, (g, Ww, Hh) => {
    g.fillStyle = '#c83a28'; g.fillRect(0, 0, Ww, Hh);
    g.fillStyle = '#e6aa48';
    for (let i = 0; i < 16; i++) g.fillRect((i * 47) % (Ww - 28), (i * 29) % (Hh - 18), 26, 14);
    g.fillStyle = '#84241a';
    for (let i = 0; i < 10; i++) { g.beginPath(); g.arc((i * 61) % Ww, (i * 43) % Hh, 7, 0, 7); g.fill(); }
  });
  const las = grp(0, 0.82, -0.15, 0, 'lasagna_gigante');
  into(las, sm(1.90, 0.08, 0.92, mat('#aeb2bc', 0.20, 0.65), 0, 0.04, 0, 0.02));
  into(las, sm(1.80, 0.14, 0.84, mat('#e4a848', 0.22), 0, 0.15, 0, 0.02));
  into(las, sm(1.76, 0.055, 0.82, dip(texLas, 0.26, 0.78), 0, 0.245, 0, 0.015));
  las.userData.vivo = 'lasagna_gigante';
  OBJ.lasagna = las;
  for (const lx of [-0.5, 0, 0.5]) vapore(M, { x: lx, y: 1.12, z: -0.15, n: 5, alt: 0.75, r: 0.11, vel: 0.36, op: 0.24 });

  /* Pendolo vivo sotto l'orologio da cucina + mazzetto d'erbe + calendario oscillante */
  pianta(M, { x: 3.45, z: -3.25, s: 1.05, vaso: '#c2603c', foglie: '#4a9440', nome: 'pianta_cucina_angolo' });

  /* Pila di teglie vuote + crosta di Parmigiano per Scena 4 (a sinistra x = -0.55 così lascia Marco scoperto) */
  const pile = grp(-0.55, 0.83, -0.25, 0, 'pile_teglie');
  for (let i = 0; i < 6; i++) {
    const t = sm(0.92 - i * 0.06, 0.10, 0.68 - i * 0.04, mat('#9aa0ac', 0.20, 0.65), (i % 2 ? 0.03 : -0.03), 0.05 + i * 0.105, 0, 0.015);
    t.rotation.y = (i % 2 ? 0.07 : -0.06); pile.add(t);
  }
  const fP = formaFormaggio(M, { x: 0.68, y: 0.09, z: 0.18, ry: 0.6, s: 1.25, aperta: true, nome: 'crosta_parmigiano' });
  fP.removeFromParent(); pile.add(fP);
  pile.visible = false; OBJ.pile_teglie = pile;

  /* 4. SFONDO DESTRO, CREDENZA, PORTA CUCINA E LAVELLO */
  const cred = grp(0.25, 0, -3.55, 0, 'credenza_cucina');
  into(cred, sm(1.65, 1.95, 0.48, mLegno, 0, 0.98, 0, 0.03));
  for (let i = 0; i < 4; i++) into(cred, cil(0.14, 0.12, 0.03, mat(i % 2 ? '#e8dcc0' : '#4a7a98', 0.24), -0.52 + i * 0.34, 1.38, 0.22, 14)).rotation.x = 1.25;

  const porta = grp(2.45, 0, ZF + 0.12, 0, 'porta_cucina');
  into(porta, sm(1.06, 2.15, 0.08, mLegno, 0, 1.08, 0, 0.02));
  into(porta, sm(0.12, 0.04, 0.06, mat('#d4a63c', 0.22), 0.38, 1.05, 0.06, 0.01));
  str(porta);
  cartello(M, { testo: 'CUCINA', x: 2.45, y: 2.38, z: ZF + 0.18, w: 0.72, h: 0.22, fondo: '#f0e4c8', colore: '#5a2d1b', bordo: '#6e4428', righe: 1 }).name = 'insegna_porta_cucina';

  const lav = grp(4.02, 0, -0.5, 0, 'lavello_cucina');
  into(lav, sm(0.75, 0.88, 1.45, mat('#e6d9be', 0.18), 0, 0.44, 0, 0.02));
  into(lav, sm(0.55, 0.14, 0.85, mat('#ebe2cc', 0.20), -0.05, 0.88, 0, 0.02));
  into(lav, sm(0.32, 0.28, 0.42, mat('#8694a4', 0.18), -0.05, 1.06, 0.45, 0.015));
  str(lav);

  orologio(M, { x: 1.5, y: 2.35, z: ZF + 0.13, r: 0.24, ora: '20:10', cornice: '#b83c2c' });
  const pendC = grp(1.5, 2.08, ZF + 0.15, 0, 'pendolo_cucina');
  into(pendC, cil(0.012, 0.012, 0.24, mat('#c89c3c', 0.24), 0, -0.12, 0, 8)).castShadow = false;
  into(pendC, cil(0.05, 0.05, 0.025, mat('#d8aa42', 0.24), 0, -0.25, 0, 12)).rotation.x = Math.PI / 2;
  M.vita.aggiungi(pendC, 'pendola', { asse: 'z', amp: 0.14, freq: 1.0, vento: 0 });
  cartello(M, { testo: 'NOVEMBRE', x: 1.5, y: 1.55, z: ZF + 0.12, w: 0.56, h: 0.42, fondo: '#f0e4c8', colore: '#262430', bordo: '#a8342e', righe: 1 }).name = 'calendario_muro';
  quadroDipinto(M, { x: 4.35, y: 1.85, z: -2.2, ry: -Math.PI / 2, w: 0.58, h: 0.46, motivo: 'paesaggio', nome: 'quadro_cucina' });

  /* Candela viva accesa sul tavolo + mestoli/mazzetti d'erbe che ondeggiano */
  const candT = grp(-0.88, 0.82, -0.52, 0, 'candela_tavolo');
  into(candT, cil(0.045, 0.05, 0.14, mat('#efe2c2', 0.24), 0, 0.07, 0, 12));
  const fCand = new T.Mesh(new T.SphereGeometry(0.032, 8, 8), M.emi('#ffcf68', 1.1));
  fCand.position.y = 0.16; candT.add(fCand);
  M.vita.aggiungi(fCand, 'lampeggia', { min: 0.72, freq: 1.8, modo: 'respiro' });
  candT.userData.vivo = 'candela_tavolo';

  /* 5. IN ALTO SUL SOFFITTO: salami, trecce d'aglio e padellini appesi alle travi (riempiono le caselle in alto + oscillano!) */
  for (const [hx, hz, tipo, nm] of [[-1.6, -0.4, 'salame', 'salame_1'], [-1.15, -2.35, 'aglio', 'treccia_aglio_1'], [1.35, -0.35, 'padella', 'padella_rame_1'], [1.75, -2.35, 'salame', 'salame_2']]) {
    const g = grp(hx, H - 0.14, hz, 0, nm);
    if (tipo === 'salame') {
      into(g, cil(0.065, 0.055, 0.42, mat('#8a3a2e', 0.20), 0, -0.32, 0, 10));
    } else if (tipo === 'aglio') {
      for (let i = 0; i < 4; i++) into(g, new T.Mesh(new T.SphereGeometry(0.06, 8, 8), mat('#ebe2cc', 0.22))).position.set(0, -0.14 - i * 0.09, 0);
    } else {
      into(g, cil(0.14, 0.12, 0.05, mat('#b8683c', 0.22, 0.65), 0, -0.32, 0, 14)).rotation.x = Math.PI / 2;
    }
    g.userData.vivo = nm; M.vita.aggiungi(g, 'pendola', { amp: 0.025, freq: 0.42, seme: hx + hz });
  }

  /* Gatto vivo sul lato destro vicino credenza/porta */
  try {
    await animato(M, 'Cat', { x: 3.15, z: -2.35, ry: -0.65, alt: 0.30, anim: 'Idle', nome: 'gatto_cucina' });
  } catch {}

  /* 6. LUCI VISIBILI INQUADRABILI */
  lampadaPendente(M, { x: 0, y: 2.38, z: -0.25, corda: 0.82, paralume: '#4a7a5c', luceCol: '#ffe2b0', intensita: 5.8, raggio: 12, nome: 'lampada_tavolo' });
  lampadaPendente(M, { x: 2.45, y: 2.55, z: ZF + 0.65, corda: 0.65, paralume: '#d49a4a', luceCol: '#ffd89a', intensita: 3.6, raggio: 9.0, nome: 'lampada_porta_cucina' });
}
