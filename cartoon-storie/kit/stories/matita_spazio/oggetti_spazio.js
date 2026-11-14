// Oggetti dedicati alla storia della Space Pen (scritti da zero, 12/11):
// Matita da disegno in microgravita, scheggia di grafite fluttuante con scintille,
// penna spaziale Fisher AG7 in spaccato tecnico e assemblata, consolle comandi a levette e CRT.
// Regole: look-disegnato (forme smussate, dettagli dipinti), buon-senso (scritte centrate e proporzionate).
import { RoundedBoxGeometry } from '/lib/jsm/geometries/RoundedBoxGeometry.js';
import { adattaTesto } from '/web/buon_senso.js';

export function attrezziSpazio(M) {
  const T = M.THREE;
  const mat = (c, e = 0.14, r = 0.72, m = 0.08) => {
    const x = M.std(c, r, m);
    x.emissive.set(c);
    x.emissiveIntensity = e;
    return x;
  };
  const tela = (w, h, fn) => M.tex(w, h, fn);
  const dip = (t, e = 0.18, r = 0.85) => M.dipinto(t, e, r);

  const sm = (w, h, d, m, x, y, z, r = Math.min(w, h, d) * 0.18) => {
    const o = new T.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.max(0.005, Math.min(r, Math.min(w, h, d) / 2 - 0.001))), m);
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = true;
    M.root.add(o);
    return o;
  };

  const cil = (rt, rb, h, m, x, y, z, seg = 24) => {
    const o = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), m);
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = true;
    M.root.add(o);
    return o;
  };

  const grp = (x = 0, y = 0, z = 0, ry = 0) => {
    const g = new T.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    M.root.add(g);
    return g;
  };

  const into = (g, o) => {
    g.add(o);
    return o;
  };

  const scritta = (testo, w, h, { fondo = '#1c2836', colore = '#e2edf6', bordo = '#3a5068', px = 768, righe = 2, font = '900' } = {}) =>
    tela(px, Math.max(48, Math.round(px * h / w)), (g, W, H) => {
      g.fillStyle = fondo;
      g.fillRect(0, 0, W, H);
      g.strokeStyle = bordo;
      g.lineWidth = Math.max(4, H * 0.06);
      g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, H - g.lineWidth);
      adattaTesto(g, testo, W, H, { colore, righe, font, margine: 0.12 });
    });

  const cartello = (testo, w, h, x, y, z, ry = 0, opt = {}) => {
    const g = grp(x, y, z, ry);
    const b = sm(w + 0.04, h + 0.04, 0.04, mat(opt.bordo || '#243242', 0.1), 0, 0, 0, 0.015);
    into(g, b);
    const f = new T.Mesh(new T.PlaneGeometry(w, h), dip(scritta(testo, w, h, opt), opt.luce ?? 0.28));
    f.position.z = 0.022;
    g.add(f);
    f.userData.scritta = 1;
    g.name = 'cartello_' + testo;
    return g;
  };

  return { T, mat, tela, dip, sm, cil, grp, into, scritta, cartello };
}

// Matita spaziale classica esagonale gialla HB
export function matitaSpaziale(M, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, spezzata = false } = {}) {
  const { T, mat, cil, grp, into } = attrezziSpazio(M);
  const g = grp(x, y, z);
  g.rotation.set(rx, ry, rz);
  g.scale.setScalar(s);

  // Corpo esagonale in legno dipinto giallo ocra
  const corpoMat = mat('#e8a628', 0.12, 0.75, 0.05);
  const fusto = cil(0.012, 0.012, 0.22, corpoMat, 0, 0, 0, 6);
  into(g, fusto);

  // Ghiera in metallo zigrinato
  const ghieraMat = mat('#bfa054', 0.15, 0.65, 0.12);
  const ghiera = cil(0.0125, 0.0125, 0.025, ghieraMat, 0, 0.12, 0, 16);
  into(g, ghiera);

  // Gommino rosso/rosa
  const gommaMat = mat('#d45d62', 0.12, 0.88, 0);
  const gomma = cil(0.0115, 0.0115, 0.025, gommaMat, 0, 0.145, 0, 16);
  into(g, gomma);

  // Cono di legno temperato
  const legnoMat = mat('#dfbe92', 0.14, 0.8, 0.02);
  const puntaLegno = new T.Mesh(new T.ConeGeometry(0.012, 0.045, 18), legnoMat);
  puntaLegno.position.set(0, -0.13, 0);
  puntaLegno.rotation.x = Math.PI;
  into(g, puntaLegno);

  // Mina di grafite
  const grafiteMat = mat('#25282c', 0.18, 0.5, 0.14);
  const mina = new T.Mesh(new T.ConeGeometry(0.004, 0.018, 12), grafiteMat);
  mina.position.set(0, -0.155, 0);
  mina.rotation.x = Math.PI;
  into(g, mina);
  g.userData.mina = mina;

  if (spezzata) {
    mina.visible = false;
  }

  g.name = 'matita';
  return g;
}

// Scheggia di grafite che fluttua con eventuale bagliore/scintilla
export function scheggiaGrafite(M, { x = 0, y = 0, z = 0, s = 1 } = {}) {
  const { T, mat, grp, into } = attrezziSpazio(M);
  const g = grp(x, y, z);
  g.scale.setScalar(s);

  // Forma irregolare sfaccettata
  const geom = new T.DodecahedronGeometry(0.014 * s, 0);
  const matG = mat('#1c2024', 0.22, 0.45, 0.15);
  const mesh = new T.Mesh(geom, matG);
  mesh.castShadow = true;
  into(g, mesh);
  g.userData.frammento = mesh;

  // Scintilla / bagliore elettrico (acceso a comando o durante il cortocircuito)
  const scinMat = new T.MeshBasicMaterial({ color: new T.Color('#78b4ff') });
  const scintilla = new T.Group();
  for (let i = 0; i < 6; i++) {
    const raggio = new T.Mesh(new T.BoxGeometry(0.003, 0.04, 0.003), scinMat);
    raggio.rotation.z = (i * Math.PI) / 3;
    scintilla.add(raggio);
  }
  scintilla.visible = false;
  into(g, scintilla);
  g.userData.scintilla = scintilla;

  g.name = 'scheggia';
  return g;
}

// Penna Fisher Space Pen AG7 cromata
export function pennaFisher(M, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, spaccato = false } = {}) {
  const { T, mat, cil, sm, grp, into, tela, dip } = attrezziSpazio(M);
  const g = grp(x, y, z);
  g.rotation.set(rx, ry, rz);
  g.scale.setScalar(s);

  // Corpo principale in argento satinato (metallo controllato: roughness 0.68, metalness 0.14 per evitare flash)
  const corpoMat = mat('#d8dfe8', 0.16, 0.68, 0.14);
  const corpo = cil(0.01, 0.01, 0.20, corpoMat, 0, 0, 0, 24);
  into(g, corpo);

  // Impugnatura con zigrinatura dipinta
  const zigrinatura = tela(256, 128, (c, W, H) => {
    c.fillStyle = '#cfd7e2';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = '#8a99aa';
    c.lineWidth = 3;
    for (let i = 0; i < W; i += 8) {
      c.beginPath();
      c.moveTo(i, 0);
      c.lineTo(i, H);
      c.stroke();
    }
  });
  zigrinatura.wrapS = T.RepeatWrapping;
  const grip = cil(0.0105, 0.0105, 0.06, dip(zigrinatura, 0.18, 0.7), 0, -0.05, 0, 24);
  into(g, grip);

  // Cono anteriore e sfera al carburo di tungsteno
  const cono = new T.Mesh(new T.ConeGeometry(0.01, 0.035, 24), corpoMat);
  cono.position.set(0, -0.115, 0);
  cono.rotation.x = Math.PI;
  into(g, cono);

  const sferaMat = mat('#44505c', 0.25, 0.5, 0.15);
  const sfera = new T.Mesh(new T.SphereGeometry(0.003, 16, 16), sferaMat);
  sfera.position.set(0, -0.134, 0);
  into(g, sfera);

  // Pulsante a scatto posteriore
  const clicker = cil(0.0075, 0.0075, 0.025, corpoMat, 0, 0.11, 0, 16);
  into(g, clicker);

  // Clip da taschino con incisione
  const clip = sm(0.005, 0.09, 0.008, corpoMat, 0.012, 0.04, 0, 0.002);
  into(g, clip);

  if (spaccato) {
    // Cartuccia trasparente interna visibile (sezione didattica)
    const cartucciaMat = mat('#38a4d8', 0.28, 0.6, 0.05);
    const cartuccia = cil(0.007, 0.007, 0.12, cartucciaMat, 0, 0, 0.006, 16);
    into(g, cartuccia);

    // Pistone scorrevole e azoto pressurizzato
    const pistoneMat = mat('#e84838', 0.22, 0.6, 0.08);
    const pistone = cil(0.0065, 0.0065, 0.015, pistoneMat, 0, 0.03, 0.006, 16);
    into(g, pistone);
  }

  g.name = 'penna_fisher';
  return g;
}

// Scatola NASA Apollo con cartellino prezzo
export function scatolaNasa(M, { x = 0, y = 0, z = 0, ry = 0, s = 1 } = {}) {
  const { T, mat, sm, grp, into, tela, dip, cartello } = attrezziSpazio(M);
  const g = grp(x, y, z, ry);
  g.scale.setScalar(s);

  // Astuccio blu cobalto
  const astuccioMat = mat('#1e3256', 0.14, 0.78, 0.04);
  const base = sm(0.24, 0.035, 0.09, astuccioMat, 0, 0.018, 0, 0.008);
  into(g, base);

  // Interno velluto sagomato
  const vellutoMat = mat('#14223d', 0.1, 0.92, 0);
  const velluto = sm(0.22, 0.01, 0.075, vellutoMat, 0, 0.036, 0, 0.004);
  into(g, velluto);

  // Coperchio aperto inclinato
  const coperchio = sm(0.24, 0.012, 0.09, astuccioMat, 0, 0.065, -0.05, 0.006);
  coperchio.rotation.x = -Math.PI * 0.35;
  into(g, coperchio);

  // Logo NASA dorato interno
  const logoTex = tela(512, 256, (c, W, H) => {
    c.fillStyle = '#1e3256';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = '#d4af37';
    c.lineWidth = 6;
    c.strokeRect(10, 10, W - 20, H - 20);
    c.fillStyle = '#e8c85a';
    c.font = '900 48px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('NASA - AG7 SPACE PEN', W / 2, H / 2 - 18);
    c.font = '700 32px sans-serif';
    c.fillText('APOLLO MISSION CERTIFIED', W / 2, H / 2 + 32);
  });
  const targa = new T.Mesh(new T.PlaneGeometry(0.20, 0.065), dip(logoTex, 0.28));
  targa.position.set(0, 0.066, -0.049);
  targa.rotation.x = -Math.PI * 0.35;
  targa.userData.scritta = 1;
  into(g, targa);

  // Penna posata nel velluto
  const p = pennaFisher(M, { x: 0, y: 0.045, z: 0, rz: Math.PI / 2, s: 0.85 });
  into(g, p);

  // Cartellino prezzo "$ 2.95"
  const c = cartello('NASA CONTRACT\n$ 2.95', 0.14, 0.09, 0.16, 0.05, 0.06, -0.3, {
    fondo: '#f6ecd4',
    colore: '#94221c',
    bordo: '#8a201a',
    px: 512,
  });
  into(g, c);
  g.userData.cartellinoPrezzo = c;

  g.name = 'scatola_nasa';
  return g;
}

// Taccuino di volo con fogli a quadretti e spirale metallica
export function taccuinoVolo(M, { x = 0, y = 0, z = 0, ry = 0, s = 1 } = {}) {
  const { T, mat, sm, cil, grp, into, tela, dip } = attrezziSpazio(M);
  const g = grp(x, y, z, ry);
  g.scale.setScalar(s);

  // Copertina rigida blu aeronautico
  const copMat = mat('#233852', 0.12, 0.82, 0.02);
  const cop = sm(0.18, 0.015, 0.24, copMat, 0, 0.008, 0, 0.005);
  into(g, cop);

  // Pagina superiore aperta con diagrammi di volo
  const foglioTex = tela(512, 512, (c, W, H) => {
    c.fillStyle = '#f4eedc';
    c.fillRect(0, 0, W, H);
    // Righe azzurre e margine rosso
    c.strokeStyle = 'rgba(70,120,180,0.25)';
    c.lineWidth = 2;
    for (let y = 30; y < H; y += 22) {
      c.beginPath();
      c.moveTo(20, y);
      c.lineTo(W - 20, y);
      c.stroke();
    }
    c.strokeStyle = 'rgba(200,60,60,0.4)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(60, 0);
    c.lineTo(60, H);
    c.stroke();
    // Calcoli scritti a penna
    c.fillStyle = '#1e2838';
    c.font = '700 24px monospace';
    c.fillText('CHECKLIST GEMINI-7', 75, 45);
    c.font = '500 18px monospace';
    c.fillText('ORBIT VELOCITY: 27,800 km/h', 75, 85);
    c.fillText('O2 PRESSURE: 5.2 PSI [OK]', 75, 115);
    c.fillText('LOG ENTRY: T+04:12:00', 75, 145);
  });
  const foglio = new T.Mesh(new T.PlaneGeometry(0.165, 0.22), dip(foglioTex, 0.22));
  foglio.rotation.x = -Math.PI / 2;
  foglio.position.set(0, 0.016, 0);
  foglio.userData.scritta = 1;
  into(g, foglio);

  // Spirale ad anelli metallici
  const anelloMat = mat('#9fa8b4', 0.18, 0.6, 0.15);
  for (let i = -0.09; i <= 0.09; i += 0.02) {
    const anello = cil(0.007, 0.007, 0.004, anelloMat, -0.088, 0.016, i, 12);
    anello.rotation.z = Math.PI / 2;
    into(g, anello);
  }

  g.name = 'taccuino_volo';
  return g;
}

// Monitor CRT retro con forma d'onda animata
export function monitorCRT(M, { x = 0, y = 0, z = 0, ry = 0, w = 0.5, h = 0.4, d = 0.45, coloreFosforo = '#3df278' } = {}) {
  const { T, mat, sm, grp, into, tela, dip } = attrezziSpazio(M);
  const g = grp(x, y, z, ry);
  g.userData.struttura = 1;

  // Telaio esterno metallico beige industriale
  const caseMat = mat('#cfc7b4', 0.12, 0.78, 0.05);
  const telaio = sm(w, h, d, caseMat, 0, h / 2, 0, 0.025);
  into(g, telaio);

  // Schermo CRT convesso scuro
  const screenTex = tela(512, 384, (c, W, H) => {
    c.fillStyle = '#0a160c';
    c.fillRect(0, 0, W, H);
    // Linee di scansione
    c.fillStyle = 'rgba(20,50,25,0.4)';
    for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 2);
    // Griglia oscilloscopio
    c.strokeStyle = 'rgba(40,120,60,0.35)';
    c.lineWidth = 1.5;
    for (let x = 0; x <= W; x += 40) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, H);
      c.stroke();
    }
    for (let y = 0; y <= H; y += 35) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(W, y);
      c.stroke();
    }
    // Traccia sinusoidale verde fosfori
    c.strokeStyle = coloreFosforo;
    c.lineWidth = 4;
    c.shadowColor = coloreFosforo;
    c.shadowBlur = 10;
    c.beginPath();
    for (let x = 0; x <= W; x += 6) {
      const yy = H / 2 + Math.sin(x * 0.03) * 65 + Math.cos(x * 0.07) * 20;
      if (x === 0) c.moveTo(x, yy);
      else c.lineTo(x, yy);
    }
    c.stroke();
  });

  const schermo = new T.Mesh(new T.PlaneGeometry(w * 0.78, h * 0.72), dip(screenTex, 0.42));
  schermo.position.set(0, h / 2, d / 2 + 0.002);
  into(g, schermo);
  g.userData.schermo = schermo;

  // Manopole inferiori
  const knobMat = mat('#383c44', 0.15, 0.6, 0.1);
  for (const kx of [-w * 0.28, -w * 0.12, w * 0.12, w * 0.28]) {
    const k = new T.Mesh(new T.CylinderGeometry(0.016, 0.016, 0.015, 16), knobMat);
    k.rotation.x = Math.PI / 2;
    k.position.set(kx, h * 0.12, d / 2 + 0.008);
    into(g, k);
  }

  g.name = 'monitor_crt';
  return g;
}

