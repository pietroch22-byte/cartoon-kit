// Piazza italiana di paese di notte (scheda luogo: mondo_piazza.md). Esterno 360 gradi con Municipio, torre orologio, portici, fontana ed elicottero + Parmigiano gigante.
import { orologio, cartello } from '/web/buon_senso.js';
import { animato } from '/web/animati.js';
import { attrezzi, formaFormaggio, pianta, sedia, lampioneStrada, bici, piccioni, bandiera, comparsa, tegliaLasagna } from '/scena/oggetti_storia.js';

export async function costruisci(M, D, S, OBJ) {
  const { T, mat, tela, dip, sm, cil, grp, into, insegna } = attrezzi(M);
  const str = m => {
    if (m.traverse) m.traverse(c => { c.userData.struttura = 1; });
    m.userData.struttura = 1;
    return m;
  };

  /* 1. PAVIMENTAZIONE PIAZZA IN PORFIDO E TRAVERTINO (motivo largo anti-tremolio + zero z-fighting) */
  const texPiazza = tela(512, 512, (g, W, H) => {
    g.fillStyle = '#4e5466'; g.fillRect(0, 0, W, H);
    const cols = ['#5a6074', '#636a7e', '#52586b', '#5e5a6a'];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        g.fillStyle = cols[(r * 5 + c * 3) % cols.length];
        g.fillRect(c * (W / 6) + 5, r * (H / 6) + 5, W / 6 - 10, H / 6 - 10);
      }
    }
    g.strokeStyle = '#9c927e';
    g.lineWidth = 14;
    g.strokeRect(7, 7, W - 14, H - 14);
  });
  texPiazza.wrapS = texPiazza.wrapT = T.RepeatWrapping;
  texPiazza.repeat.set(5, 6);
  str(M.box(38, 0.06, 40, dip(texPiazza, 0.14, 0.90), 0, -0.015, -3));

  /* Medaglione centrale sotto la calata del Parmigiano */
  const med = cil(3.6, 3.6, 0.025, mat('#7c766c', 0.14, 0.88), 0, 0.012, -4.5, 28);
  str(med);
  const anelloMed = cil(2.5, 2.5, 0.030, mat('#b4a488', 0.16, 0.88), 0, 0.014, -4.5, 28);
  str(anelloMed);

  /* 2. PALAZZO MUNICIPIO SUL FONDO (z = -15.5), TORRE OROLOGIO (x = -9.5) E FACCIATA SUD ALLE SPALLE */
  const mPietra = mat('#c8bba2', 0.16, 0.86);
  const mMuni = mat('#d6b88c', 0.16, 0.88);
  const mTetto = mat('#a64b36', 0.16, 0.85);
  const mVetro = M.emi('#ffe098', 0.72);
  const mScur = mat('#3f6b46', 0.14, 0.80);

  const muni = grp(0, 0, -17.5, 0);
  into(muni, M.box(21, 11.4, 5.2, mMuni, 0, 5.7, 0));
  into(muni, M.box(21.4, 2.8, 5.4, mPietra, 0, 1.4, 0));
  into(muni, M.box(21.8, 0.35, 5.6, mPietra, 0, 11.4, 0));
  into(muni, M.box(9.6, 1.45, 5.4, mPietra, 0, 12.1, 0));
  into(muni, M.box(9.8, 0.42, 5.6, mTetto, 0, 12.95, 0));
  /* Loggiato d'ingresso + balcone centrale */
  for (const ax of [-4.2, 0, 4.2]) {
    into(muni, M.box(2.2, 2.6, 0.25, mat('#342a28', 0.12, 0.9), ax, 1.3, 2.65));
  }
  into(muni, M.box(4.8, 0.28, 1.1, mPietra, 0, 4.3, 2.9));
  into(muni, M.box(4.8, 0.72, 0.14, mPietra, 0, 4.8, 3.4));
  for (const fx of [-7.5, -4.5, -1.6, 1.6, 4.5, 7.5]) {
    for (const fy of [5.8, 9.0]) {
      const vet = new T.Mesh(new T.PlaneGeometry(0.95, 1.45), mVetro);
      vet.position.set(fx, fy, 2.65);
      muni.add(vet);
      into(muni, M.box(1.16, 0.12, 0.14, mPietra, fx, fy - 0.78, 2.66));
    }
  }
  str(muni);
  cartello(M, { testo: 'MUNICIPIO', x: 0, y: 10.65, z: -14.72, w: 5.2, h: 1.0, fondo: '#243c2e', colore: '#f2d47c', bordo: '#b8823c', righe: 1 }).name = 'insegna_municipio';
  bandiera(M, { x: -1.8, y: 4.7, z: -14.1, ry: 0.2, l: 1.15, h: 0.76, asta: 1.8, nome: 'bandiera_municipio_sx' });
  bandiera(M, { x: 1.8, y: 4.7, z: -14.1, ry: -0.2, l: 1.15, h: 0.76, asta: 1.8, nome: 'bandiera_municipio_dx' });

  /* Torre civica dell'orologio (x = -9.5, z = -14.5) alta 24 m con orologio 21:00 */
  const torre = grp(-9.5, 0, -14.8, 0, 'torre_orologio');
  const mMatt = mat('#b0523c', 0.16, 0.86);
  into(torre, M.box(4.2, 20.5, 4.2, mMatt, 0, 10.25, 0));
  into(torre, M.box(4.6, 0.35, 4.6, mPietra, 0, 12.8, 0));
  into(torre, M.box(4.6, 0.35, 4.6, mPietra, 0, 18.2, 0));
  const cellaT = new T.Mesh(new T.BoxGeometry(2.1, 2.5, 4.35), M.emi('#ffd084', 0.65));
  cellaT.position.y = 19.6; torre.add(cellaT);
  const campT = new T.Mesh(new T.CylinderGeometry(0.35, 0.65, 0.9, 14), mat('#987236', 0.18, 0.65));
  campT.position.y = 19.8; torre.add(campT);
  const cuspT = new T.Mesh(new T.ConeGeometry(3.2, 4.2, 4), mat('#8e3c2c', 0.16, 0.85));
  cuspT.rotation.y = Math.PI / 4; cuspT.position.y = 22.8; torre.add(cuspT);
  str(torre);
  orologio(M, { x: -9.5, y: 15.6, z: -12.62, r: 1.18, ora: '21:00', romani: true, cornice: '#6e4226' });

  /* 3. PORTICI EMILIANI SINISTRA E DESTRA (6 campate ciascuno x = ±10.5) */
  for (const [side, wallCol] of [[-1, '#c8724e'], [1, '#d69858']]) {
    const px = side * 12.2;
    const ed = grp(px, 0, -2.5, 0);
    into(ed, M.box(3.8, 10.6, 24.5, mat(wallCol, 0.16, 0.88), side * 1.4, 5.3, 0));
    into(ed, M.box(6.4, 7.2, 24.5, mat(wallCol, 0.16, 0.88), 0, 7.2, 0));
    into(ed, M.box(6.8, 0.28, 24.8, mPietra, -side * 0.1, 10.8, 0));
    const tet = new T.Mesh(new T.BoxGeometry(7.2, 0.85, 25.0), mTetto);
    tet.position.set(-side * 0.1, 11.2, 0); tet.rotation.z = side * 0.14;
    ed.add(tet);
    /* Pilastri del portico lungo x = ±9.4 */
    for (let k = 0; k < 7; k++) {
      const pz = -13.8 + k * 3.8;
      into(ed, M.box(0.64, 3.6, 0.64, mPietra, -side * 2.8, 1.8, pz));
      into(ed, M.box(0.84, 0.24, 0.84, mPietra, -side * 2.8, 0.12, pz));
    }
    str(ed);
    /* Finestre illuminate ai piani superiori lungo il portico */
    for (let k = 0; k < 6; k++) {
      const wz = -11.9 + k * 3.8;
      for (const wy of [5.4, 8.2]) {
        const fg = grp(side * 8.95, wy, wz, side > 0 ? -Math.PI / 2 : Math.PI / 2);
        into(fg, sm(0.95, 1.28, 0.06, mPietra, 0, 0, 0, 0.01));
        const vt = new T.Mesh(new T.PlaneGeometry(0.76, 1.08), (k + wy) % 2 ? mVetro : mat('#323c52', 0.14, 0.7));
        vt.position.z = 0.036; fg.add(vt);
        for (const sx of [-0.54, 0.54]) {
          const ps = sm(0.28, 1.12, 0.04, mScur, sx, 0, 0.04, 0.01);
          ps.castShadow = false; fg.add(ps);
        }
        str(fg);
      }
    }
  }

  /* Vetrine botteghe sotto i portici */
  insegna('FORNO ANTICO', 2.4, 0.45, -9.85, 3.15, -6.4, Math.PI / 2, { fondo: '#5e3422', colore: '#f2d478', bordo: '#2e1a12', righe: 1 });
  const vetForno = new T.Mesh(new T.PlaneGeometry(2.2, 1.8), M.emi('#ffe0a0', 0.68));
  vetForno.rotation.y = Math.PI / 2; vetForno.position.set(-10.15, 1.4, -6.4); str(vetForno); M.root.add(vetForno);

  insegna('BAR PIAZZA', 2.2, 0.45, 9.85, 3.15, -1.8, -Math.PI / 2, { fondo: '#284434', colore: '#f2d478', bordo: '#b8823c', righe: 1 });
  const vetBar = new T.Mesh(new T.PlaneGeometry(2.2, 1.8), M.emi('#ffe2a8', 0.72));
  vetBar.rotation.y = -Math.PI / 2; vetBar.position.set(10.15, 1.4, -1.8); str(vetBar); M.root.add(vetBar);

  insegna('SALUMERIA', 2.2, 0.45, 9.85, 3.15, -7.8, -Math.PI / 2, { fondo: '#7a2826', colore: '#f2dec0', bordo: '#b8823c', righe: 1 });

  /* Facciata Sud dettagliata alle spalle (z = +11.5) con arco vicolo, finestre, tetti e cornicioni */
  const sud = grp(0, 0, 12.2, 0);
  into(sud, M.box(9.5, 9.4, 3.2, mat('#cfa06c', 0.16, 0.88), -6.8, 4.7, 0));
  into(sud, M.box(9.5, 9.4, 3.2, mat('#c47452', 0.16, 0.88), 6.8, 4.7, 0));
  into(sud, M.box(5.2, 4.8, 3.2, mat('#d8ba92', 0.16, 0.88), 0, 7.0, 0));
  into(sud, M.box(22.4, 0.34, 3.6, mPietra, 0, 9.4, 0));
  into(sud, M.box(22.8, 0.75, 3.8, mTetto, 0, 9.9, 0));
  into(sud, M.box(22.4, 1.8, 3.4, mPietra, -7.2, 0.9, 0));
  into(sud, M.box(22.4, 1.8, 3.4, mPietra, 7.2, 0.9, 0));
  into(sud, M.box(4.6, 0.45, 3.5, mPietra, 0, 4.5, 0));
  into(sud, M.box(24, 6.2, 1.2, mat('#785e4e', 0.14, 0.9), 0, 3.1, 5.2));
  into(sud, M.box(6.2, 3.8, 1.4, mat('#a85840', 0.16, 0.88), 0, 6.2, 5.2));
  for (const fx of [-7.5, -4.5, -1.6, 1.6, 4.5, 7.5]) {
    for (const fy of [6.4]) {
      const fSud = grp(fx, fy, 10.55, Math.PI);
      into(fSud, sm(1.12, 1.48, 0.06, mPietra, 0, 0, 0, 0.01));
      const v = new T.Mesh(new T.PlaneGeometry(0.92, 1.28), mVetro);
      v.position.z = 0.036; fSud.add(v);
      for (const sx of [-0.62, 0.62]) {
        const sc = sm(0.30, 1.28, 0.04, mScur, sx, 0, 0.04, 0.01); sc.castShadow = false; fSud.add(sc);
      }
      sud.add(fSud);
    }
  }
  str(sud);
  cartello(M, { testo: 'VIA DEL BORGO', x: 0, y: 4.55, z: 10.38, ry: Math.PI, w: 2.8, h: 0.46, fondo: '#283c2e', colore: '#f2d478', bordo: '#b8823c', righe: 1 }).name = 'targa_vicolo_sud';
  bandiera(M, { x: -1.6, y: 5.2, z: 10.3, ry: Math.PI + 0.1, l: 1.0, h: 0.68, asta: 1.6, nome: 'bandiera_sud_sx' });
  bandiera(M, { x: 1.6, y: 5.2, z: 10.3, ry: Math.PI - 0.1, l: 1.0, h: 0.68, asta: 1.6, nome: 'bandiera_sud_dx' });

  /* 4. FONTANA OTTAGONALE CON ZAMPILLO VIVO (x = 5.4, z = -6.5) */
  const font = grp(5.4, 0, -6.5, 0, 'fontana_piazza');
  into(font, cil(2.0, 2.15, 0.62, mPietra, 0, 0.31, 0, 8));
  into(font, cil(1.85, 1.85, 0.08, mat('#447c9c', 0.28, 0.48), 0, 0.56, 0, 16));
  into(font, cil(0.32, 0.42, 1.55, mPietra, 0, 0.92, 0, 8));
  into(font, cil(0.85, 0.32, 0.28, mPietra, 0, 1.58, 0, 8));
  const zamp = new T.Mesh(new T.CylinderGeometry(0.08, 0.22, 0.72, 10), M.emi('#9ad2ec', 0.55));
  zamp.position.y = 2.02; zamp.castShadow = false; font.add(zamp);
  font.userData.vivo = 'fontana_piazza';
  M.vita.aggiungi(zamp, 'ondeggia', { amp: 0.08, freq: 1.6, asse: 'y' });

  /* 5. BANCARELLA "FORMAGGI" (sinistra x = -6.4, z = -2.2) E DEHORS BAR (destra x = 7.4) */
  const banc = grp(-6.4, 0, -2.2, 0.25, 'bancarella_formaggi');
  into(banc, sm(1.9, 0.92, 1.05, mat('#7a4e2c', 0.16), 0, 0.46, 0, 0.02));
  into(banc, sm(2.0, 0.06, 1.15, mat('#e6d9be', 0.18), 0, 0.94, 0, 0.01));
  for (const [px, pz] of [[-0.86, -0.44], [0.86, -0.44], [-0.86, 0.44], [0.86, 0.44]]) {
    const p = cil(0.035, 0.035, 1.45, mat('#5c3c24', 0.14), px, 1.64, pz, 8);
    p.castShadow = false; banc.add(p);
  }
  const texTendB = tela(256, 128, (g, W, H) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#ede0c4' : '#b83c34';
      g.fillRect(i * (W / 8), 0, W / 8, H);
    }
  });
  const tettB = new T.Mesh(new T.BoxGeometry(2.35, 0.08, 1.55), dip(texTendB, 0.20, 0.88));
  tettB.position.set(0, 2.38, 0); tettB.rotation.x = 0.12; tettB.castShadow = false; banc.add(tettB);
  cartello(M, { testo: 'FORMAGGI', x: -6.32, y: 2.18, z: -1.62, ry: 0.25, w: 1.45, h: 0.34, fondo: '#283e30', colore: '#f2d478', bordo: '#b8823c', righe: 1 }).name = 'insegna_formaggi';
  formaFormaggio(M, { x: -6.8, y: 1.04, z: -2.15, s: 1.05, aperta: true, nome: 'forma_banco_1' });
  formaFormaggio(M, { x: -6.35, y: 1.04, z: -2.28, s: 0.98, aperta: false, nome: 'forma_banco_2' });
  formaFormaggio(M, { x: -5.9, y: 1.04, z: -2.4, s: 0.72, aperta: false, nome: 'forma_banco_3' });
  sm(0.24, 0.16, 0.22, mat('#9ea4b2', 0.22), -5.65, 1.05, -1.95, 0.015, 'bilancia_formaggi');
  cil(0.14, 0.12, 0.12, mat('#c89c5e', 0.20), -6.55, 1.03, -1.85, 12, 'cestino_formaggi');

  /* Tavolini dehors bar a destra (x = 7.4, z = -0.6 e -3.2) + primo piano laterale (fuori [-3.5..3.5, -6..0]) */
  for (const [tx, tz, idx] of [[7.3, -0.6, 1], [7.5, -3.2, 2], [5.2, 3.8, 3]]) {
    const tavB = grp(tx, 0, tz, 0, `tavolino_bar_${idx}`);
    into(tavB, cil(0.42, 0.42, 0.04, mat('#e6d9be', 0.20), 0, 0.74, 0, 16));
    into(tavB, cil(0.04, 0.16, 0.72, mat('#343844', 0.14), 0, 0.36, 0, 10));
    cil(0.05, 0.04, 0.08, mat('#efe8d6', 0.24), tx + 0.12, 0.80, tz + 0.06, 10, `tazzina_bar_${idx}`);
    cil(0.07, 0.05, 0.16, mat('#7aa8c8', 0.24), tx - 0.14, 0.84, tz - 0.08, 10, `caraffa_bar_${idx}`);
    sedia(M, { x: tx - 0.65, z: tz, ry: Math.PI / 2, legno: '#4a5a4e', paglia: '#d8c088', nome: `sedia_bar_${idx}a` });
    sedia(M, { x: tx + 0.65, z: tz, ry: -Math.PI / 2, legno: '#4a5a4e', paglia: '#d8c088', nome: `sedia_bar_${idx}b` });
  }
  /* Primo piano e medio piano coerente sui bordi laterali (dz ~ 3.2-4.2 m davanti camera, fuori zona centrale [-1.8..+1.8] & [-6..0]) */
  cil(0.18, 0.22, 0.65, mat('#8e8678', 0.18), -3.5, 0.32, 3.9, 12, 'paracarro_sx');
  cil(0.18, 0.22, 0.65, mat('#8e8678', 0.18), 3.5, 0.32, 3.9, 12, 'paracarro_dx');
  sm(0.56, 0.38, 0.44, mat('#c8b08a', 0.20), -2.75, 0.19, 3.5, 0.05, 'sacco_farina_1').rotation.y = 0.22;
  sm(0.54, 0.36, 0.42, mat('#c8b08a', 0.20), -2.25, 0.18, 3.85, 0.05, 'sacco_farina_2').rotation.y = -0.3;
  sm(0.62, 0.42, 0.48, mat('#9e7448', 0.20), -1.70, 0.21, 3.40, 0.02, 'cassetta_mercato_1');
  sm(0.62, 0.42, 0.48, mat('#a87e52', 0.20), 1.60, 0.21, 3.55, 0.02, 'cassetta_bar_2');
  /* Piccoli oggetti chiaramente leggibili (< 0.35 m) appoggiati sopra le casse e sui lati */
  cil(0.14, 0.12, 0.32, mat('#4e7e3e', 0.24), -1.85, 0.58, 3.35, 10, 'damigiana_1');
  cil(0.14, 0.12, 0.30, mat('#9a362e', 0.24), -1.55, 0.57, 3.45, 10, 'damigiana_2');
  cil(0.16, 0.13, 0.26, mat('#c85a38', 0.24), -1.15, 0.13, 3.85, 12, 'vaso_laterale_1');
  cil(0.16, 0.13, 0.26, mat('#d8a044', 0.24), 1.48, 0.55, 3.50, 12, 'cesto_brioche');
  cil(0.13, 0.11, 0.30, mat('#efe8d6', 0.24), 1.75, 0.57, 3.62, 10, 'bricco_latte');
  cil(0.15, 0.12, 0.28, mat('#3a6e8c', 0.24), 0.95, 0.14, 3.85, 12, 'vaso_laterale_2');
  sm(0.32, 0.26, 0.28, mat('#d8a84a', 0.24), -1.70, 0.13, 3.95, 0.03, 'cassetta_pane_sx');
  cartello(M, { testo: 'MENU:\nPARMIGIANO', x: 3.35, y: 0.95, z: 3.1, ry: -0.45, w: 0.62, h: 0.78, fondo: '#2c303a', colore: '#e8d8b0', bordo: '#7a4e2c', righe: 2 }).name = 'leggio_menu';
  cil(0.24, 0.20, 0.66, mat('#3c6248', 0.18), 4.1, 0.33, 3.6, 12, 'cestino_piazza');
  pianta(M, { x: -3.9, z: 3.4, s: 0.98, vaso: '#b45e3c', foglie: '#529a44', nome: 'pianta_primo_piano_sx' });
  pianta(M, { x: 3.8, z: 2.5, s: 0.94, vaso: '#b45e3c', foglie: '#529a44', nome: 'pianta_primo_piano_dx' });
  /* Panchine, bici e piante lungo i bordi (lontane dalla zona centrale [-3.5..3.5, -6..0]) */
  for (const [bx, bz, bry, nm] of [[-7.6, -8.5, Math.PI / 2, 'panchina_sx'], [7.6, -9.4, -Math.PI / 2, 'panchina_dx']]) {
    const pn = grp(bx, 0, bz, bry, nm);
    into(pn, sm(1.65, 0.08, 0.52, mat('#784c2c', 0.16), 0, 0.44, 0, 0.02));
    into(pn, sm(1.65, 0.38, 0.07, mat('#784c2c', 0.16), 0, 0.72, -0.22, 0.02));
    for (const sx of [-0.68, 0.68]) into(pn, sm(0.10, 0.44, 0.48, mat('#2c303a', 0.14), sx, 0.22, 0, 0.01));
  }
  bici(M, { x: -8.3, z: 2.2, ry: 0.45, incline: 0.10, colore: '#c83c38', nome: 'bici_piazza_1' });
  bici(M, { x: 8.3, z: -10.8, ry: -0.35, incline: -0.10, colore: '#3a729c', nome: 'bici_piazza_2' });
  pianta(M, { x: -4.4, z: -13.0, s: 1.35, vaso: '#c2603c', foglie: '#4a9440', nome: 'pianta_muni_sx' });
  pianta(M, { x: 4.4, z: -13.0, s: 1.35, vaso: '#c2603c', foglie: '#4a9440', nome: 'pianta_muni_dx' });
  pianta(M, { x: 8.4, z: 1.4, s: 1.15, vaso: '#b45e3c', foglie: '#529a44', nome: 'pianta_bar' });
  pianta(M, { x: -8.4, z: -4.8, s: 1.15, vaso: '#b45e3c', foglie: '#529a44', nome: 'pianta_forno' });

  /* 6. LAMPIONI PIAZZA */
  for (const [lx, lz, lato, idx] of [
    [-7.8, 1.5, 1, 1], [7.8, 1.5, -1, 2],
    [-7.8, -5.8, 1, 3], [7.8, -5.8, -1, 4],
    [-7.8, -11.8, 1, 5], [7.8, -11.8, -1, 6]
  ]) {
    lampioneStrada(M, { x: lx, z: lz, h: 4.35, lato, intensita: 5.8, raggio: 13.5, nome: `lampione_piazza_${idx}` });
  }

  /* 7. VITA ANIMALE E COMPARSE FUORI DALLA CORSIA CENTRALE [-3.5..+3.5, -6..0] */
  piccioni(M, { x: 3.9, z: -4.2, n: 5, volo: false, r: 1.4, nome: 'piccioni_fontana' });
  piccioni(M, { x: 0.5, z: -8.5, n: 5, volo: true, y: 7.4, r: 3.2, nome: 'piccioni_volo' });
  try {
    await animato(M, 'Cat', { x: -4.9, z: -3.6, ry: 0.75, alt: 0.30, anim: 'Idle', nome: 'gatto_formaggi' });
    await animato(M, 'Pug', { x: 6.3, z: -1.6, ry: -1.1, alt: 0.34, anim: 'Idle', nome: 'cane_bar' });
  } catch {}
  comparsa(M, -6.2, -3.7, 0.35, ['signora', 'ragazza'], { nome: 'cliente_formaggi' });
  comparsa(M, 6.9, -2.0, -0.85, ['barista', 'ragazzo'], { nome: 'barista_dehors' });
  comparsa(M, -4.6, -10.8, 0.45, ['nonno'], { nome: 'spettatore_piazza_sx' });
  comparsa(M, 5.8, -11.4, -0.55, ['ragazzina'], { nome: 'spettatrice_piazza_dx' });

  /* 8. ELICOTTERO DA CONSEGNA E FORMA GIGANTE DI PARMIGIANO (OBJ.elicottero e OBJ.parmigiano) */
  const eli = grp(0, 8.8, -4.5, 0, 'elicottero');
  const eliBody = new T.Group(); eli.add(eliBody);
  const fus = sm(1.65, 1.12, 3.0, mat('#b83438', 0.22, 0.72), 0, 0, 0, 0.28);
  eliBody.add(fus);
  const fasciaE = sm(1.68, 0.22, 2.75, mat('#e6d6b4', 0.22, 0.75), 0, 0.04, -0.05, 0.05);
  eliBody.add(fasciaE);
  const cabina = sm(1.42, 0.74, 1.05, mat('#4e7694', 0.24, 0.62), 0, 0.14, 1.05, 0.22);
  eliBody.add(cabina);
  const coda = sm(0.32, 0.34, 2.4, mat('#b83438', 0.22, 0.72), 0, 0.16, -2.4, 0.06);
  eliBody.add(coda);
  for (const sx of [-0.62, 0.62]) {
    const pat = sm(0.10, 0.08, 2.4, mat('#343844', 0.14), sx, -0.78, 0.1, 0.02);
    pat.castShadow = false; eliBody.add(pat);
    for (const sz of [-0.55, 0.65]) {
      const mnt = cil(0.035, 0.035, 0.48, mat('#343844', 0.14), sx, -0.56, sz, 8);
      mnt.castShadow = false; eliBody.add(mnt);
    }
  }
  const faretto = new T.Mesh(new T.ConeGeometry(0.26, 0.32, 12), M.emi('#fff0bc', 1.15));
  faretto.position.set(0, -0.62, 0.75); eliBody.add(faretto);
  M.luce('#ffe6a8', 4.5, 0, 6.8, -4.5, 11);

  const rotore = new T.Group(); rotore.position.set(0, 0.74, 0); eliBody.add(rotore);
  rotore.add(cil(0.14, 0.16, 0.26, mat('#343844', 0.14), 0, -0.08, 0, 10));
  for (const ry of [0, Math.PI / 2]) {
    const pala = sm(4.8, 0.04, 0.20, mat('#2c303a', 0.14), 0, 0.04, 0, 0.01);
    pala.rotation.y = ry; pala.castShadow = false; rotore.add(pala);
  }
  const rotCoda = new T.Group(); rotCoda.position.set(0.22, 0.20, -3.55); eliBody.add(rotCoda);
  const rc1 = sm(0.03, 0.85, 0.10, mat('#2c303a', 0.14), 0, 0, 0, 0.01); rc1.castShadow = false; rotCoda.add(rc1);
  eli.userData.vivo = 'elicottero';
  OBJ.elicottero = eli;

  /* Forma gigante di Parmigiano appesa sotto l'elicottero: fascia scritta sui 4 lati + targa sospesa sul cavo senza tagli */
  const parma = grp(0, 4.8, -4.5, 0, 'parmigiano');
  const cavo = cil(0.035, 0.035, 3.6, mat('#343844', 0.14), 0, 2.0, 0, 8);
  cavo.castShadow = false; parma.add(cavo);
  const ruota = formaFormaggio(M, { x: 0, y: 0, z: 0, s: 4.1, aperta: false, scritta: false, nome: 'ruota_parmigiano' });
  ruota.removeFromParent(); parma.add(ruota);
  const texFascia = tela(1024, 160, (g, W, H) => {
    g.fillStyle = '#ead086'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#5a2b14'; g.fillRect(0, 8, W, 10); g.fillRect(0, H - 18, W, 10);
    g.font = '900 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const q of [0.125, 0.375, 0.625, 0.875]) g.fillText('PARMIGIANO', W * q, H * 0.52);
  });
  const fasciaP = new T.Mesh(new T.CylinderGeometry(0.972, 0.972, 0.28, 36, 1, true), dip(texFascia, 0.28, 0.78));
  fasciaP.material.side = T.DoubleSide; fasciaP.castShadow = false; parma.add(fasciaP);
  for (const bry of [0, Math.PI]) {
    const etic = cartello(M, { testo: 'PARMIGIANO', x: 0, y: 0.64, z: bry === 0 ? 0.045 : -0.045, ry: bry, w: 1.56, h: 0.36, fondo: '#ead086', colore: '#522814', bordo: '#8c4c22', righe: 1 });
    etic.removeFromParent(); parma.add(etic);
  }
  parma.userData.vivo = 'parmigiano';
  OBJ.parmigiano = parma;

  // Teglie di lasagna portate a due mani dalle zie in piazza (visibili via attore.porta)
  for (let i = 1; i <= 3; i++) {
    const t = tegliaLasagna(M, { nome: 'teglia_zia' + i, seme: 10 + i });
    t.visible = false;
    OBJ['teglia_zia' + i] = t;
  }

  M.tick = M.tick || [];
  M.tick.push(t => {
    rotore.rotation.y = t * 18;
    rotCoda.rotation.x = t * 24;
    eliBody.position.y = Math.sin(t * 2.1) * 0.14;
    parma.rotation.y = Math.sin(t * 1.3) * 0.18;
  });
}
