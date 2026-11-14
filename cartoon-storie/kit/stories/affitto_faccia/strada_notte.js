// Strada urbana di notte con Bar Notte, saracinesca chiusa della clinica, vetrina TV TG e specchio finale.
// Basata sulle foto reali di library/luoghi/strada_negozi_notte.md («esterno»: true, luce «notte» già approvata).
// Include anche il mascheramento non invasivo della faccia per l'attore con opt.vuota (davide_vuoto) senza toccare engine3d/.
import { RoundedBoxGeometry } from '/lib/jsm/geometries/RoundedBoxGeometry.js';
import { adattaTesto, cartello } from '/web/buon_senso.js';
import { vivo } from '/web/vivi.js';
import { animato } from '/web/animati.js';

export async function costruisci(M, D, S, OBJ) {
  const T = M.THREE;
  const mat = (c, e = 0.22, r = 0.72, m = 0.06) => {
    const x = M.std(c, r, m);
    x.emissive.set(c);
    x.emissiveIntensity = e;
    return x;
  };
  const dip = (t, e = 0.28, r = 0.78) => M.dipinto(t, e, r);
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

  // ---- 1. STRADA NOTTURNA COMPLETA, MARCIAPIEDI, PALAZZI E STRISCE RIFLETTENTI
  str(M.box(2.5, 0.14, 76, mat('#434a80', 0.32, 0.72), -4.15, 0.07, -22));   // marciapiede sinistro (x: -2.9..-5.4)
  str(M.box(2.5, 0.14, 76, mat('#434a80', 0.32, 0.72), 4.15, 0.07, -22));    // marciapiede destro
  M.strisce({ z: 3.4, x0: -2.2, x1: 2.2, lungo: 2.4 });
  M.strisce({ z: -15.0, x0: -2.2, x1: 2.2, lungo: 2.4 });
  M.cavi({ n: 10, z0: 4, passo: 6.2 });
  M.lampioni({ z0: 4, z1: -56, passo: 12, colore: '#ffd48a' });

  // Palazzi lungo la via (destra e oltre i negozi a sinistra)
  M.filaPalazzi({ lato: 1, z0: 8, colori: ['#40477a', '#4f558e', '#38406e'] });
  M.filaPalazzi({ lato: -1, z0: -20.5, colori: ['#43497d', '#545b92', '#3c4372'] });
  M.filaPalazzi({ lato: -1, z0: 14, z1: 4.5, colori: ['#3e4578', '#4d5488'] });
  M.insegneAppese({ parole: ['CAFFÈ', 'HOTEL', 'APERTO', 'TABACCHI', 'DISCO'] });

  // Facciata di supporto sinistra continua per i tre negozi chiave (z: +3.7..-20.5, x: -3.2)
  const mMuroSx = mat('#4e5694', 0.30, 0.78);
  const mCornice = mat('#3a406e', 0.24, 0.75);
  str(M.box(1.4, 9.5, 24.4, mMuroSx, -3.7, 4.75, -8.5));
  for (let fl = 1; fl <= 2; fl++) {
    for (let wz = 2.0; wz >= -13.0; wz -= 2.4) {
      const fin = M.boxLuce(0.08, 1.1, 0.75, (fl + Math.round(wz)) % 2 ? '#a88254' : '#6c92c8', 0.32, -2.98, 2.2 + fl * 2.5, wz, 2);
      fin.userData.struttura = 1;
    }
  }

  // ---- 2. NEGOZIO 1: «BAR NOTTE» (z = +2.2 .. -2.0, x = -2.95) — Scena 3
  const insBar = cartello(M, {
    testo: 'BAR NOTTE', w: 2.5, h: 0.62,
    x: -2.92, y: 2.75, z: -0.2, ry: Math.PI / 2,
    fondo: '#36133e', colore: '#ff8cd8', bordo: '#ffaa44',
  });
  insBar.name = 'insegna_bar';
  M.vita.aggiungi(insBar, 'lampeggia', { min: 0.84, freq: 0.45, modo: 'respiro' });

  // Interno caldo + porta automatica del Bar che si apre all'uscita del socio
  const vetrinaBar = M.boxLuce(0.08, 2.25, 3.0, '#ffc978', 1.25, -3.02, 1.22, -0.2, 2);
  vetrinaBar.name = 'vetrina_bar';
  M.vita.aggiungi(vetrinaBar, 'lampeggia', { min: 0.9, freq: 0.3, modo: 'respiro' });
  OBJ.porta_bar = M.vita.portaAutomatica({ x: -2.86, z: -0.2, ry: Math.PI / 2, w: 1.45, h: 2.18, colore: '#d8b48a', fuori: '#ffb35c', luce: '#ffcf88', sensore: 2.1, id: 'porta_bar' });
  OBJ.porta_bar.name = 'porta_bar';
  M.luce('#ffcf8c', 8.5, -0.9, 2.55, 0.35, 13.0);
  M.luce('#9bb4ff', 5.4, 0.5, 2.65, -0.1, 13.0);
  sm(0.45, 0.10, 0.14, M.emi('#ffe0a8', 1.65), -2.86, 2.38, -0.20, 0.02, 0, 'lampada_bar_est');
  // Piccoli oggetti indipendenti a livello root fuori dal Bar e sul marciapiede dx/sx (visibili gia' in campo largo Scena 3!)
  sm(0.11, 0.09, 0.11, mat('#f4efe4', 0.30), -2.28, 0.90, 1.38, 0.02, 0, 'tazzina_bar_1');
  sm(0.14, 0.04, 0.14, mat('#343c4a', 0.26), -2.18, 0.88, 1.46, 0.01, 0, 'posacenere_bar_1');
  sm(0.08, 0.24, 0.08, mat('#2c8c58', 0.32), -2.24, 0.98, -1.72, 0.02, 0, 'bottiglia_bar_2');
  sm(0.14, 0.08, 0.14, mat('#e8dfc8', 0.30), -2.36, 0.90, -1.68, 0.015, 0, 'piattino_bar_2');
  sm(0.18, 0.04, 0.24, mat('#e6dec8', 0.28), 2.88, 0.65, 1.75, 0.01, 0.25, 'giornale_panchina');
  sm(0.08, 0.16, 0.08, mat('#d83838', 0.32), 2.18, 1.07, -0.78, 0.02, 0, 'lattina_cassetta_dx');
  sm(0.16, 0.18, 0.16, mat('#f2a832', 0.34), -1.85, 0.22, 0.85, 0.02, 0.1, 'lanterna_terra_sx');
  sm(0.14, 0.22, 0.14, mat('#e05638', 0.34), -2.55, 0.24, 0.55, 0.02, 0, 'birillo_bar_sx_1');
  sm(0.14, 0.22, 0.14, mat('#e05638', 0.34), -2.52, 0.24, -1.15, 0.02, 0, 'birillo_bar_sx_2');
  sm(0.20, 0.14, 0.14, mat('#9e5838', 0.30), -2.35, 0.21, -0.85, 0.02, 0.3, 'borsa_marciapiede_sx');
  sm(0.14, 0.18, 0.14, mat('#489c68', 0.30), -2.35, 0.23, 1.95, 0.02, 0, 'vaso_basso_sx');
  sm(0.16, 0.16, 0.22, mat('#38629c', 0.28), 1.65, 0.22, 1.15, 0.02, 0.2, 'casco_strada_dx');
  sm(0.10, 0.14, 0.16, mat('#f0c848', 0.32), -2.55, 0.21, 1.45, 0.02, 0.1, 'lucchetto_cassetta_sx');
  // Oggetti piccoli in primo piano lungo strisce/marciapiede (z = +2.15 .. +3.75) visibili gia' a 14.6s
  sm(0.18, 0.28, 0.18, mat('#e85432', 0.36), 2.45, 0.28, 2.85, 0.02, 0, 'birillo_strisce_dx');
  sm(0.08, 0.14, 0.08, mat('#d83232', 0.34), 0.45, 0.08, 2.25, 0.02, 0.4, 'lattina_strisce_cx');
  sm(0.22, 0.04, 0.26, mat('#ece4d0', 0.32), -0.95, 0.04, 2.55, 0.01, 0.2, 'giornale_strisce_sx');
  sm(0.18, 0.12, 0.18, mat('#f0b63a', 0.36), 1.85, 0.08, 3.55, 0.02, 0.1, 'catarifrangente_dx');
  sm(0.09, 0.25, 0.09, mat('#2c945c', 0.34), -2.35, 0.26, 2.75, 0.02, 0, 'bottiglia_strisce_sx');
  sm(0.20, 0.16, 0.20, mat('#b5663c', 0.32), 2.75, 0.22, 2.25, 0.02, 0.15, 'pacco_marciapiede_dx');

  // Valigetta rigida da trasferire tra socio e davide_finto nella Scena 3
  const valSocio = new T.Group();
  valSocio.name = 'valigetta_socio';
  valSocio.position.set(-2.22, 0.55, 0.15);
  valSocio.add(
    (() => { const b = new T.Mesh(new RoundedBoxGeometry(0.46, 0.32, 0.14, 2, 0.02), mat('#242b38', 0.25, 0.5, 0.25)); b.castShadow = true; return b; })(),
    (() => { const m = new T.Mesh(new RoundedBoxGeometry(0.16, 0.06, 0.05, 2, 0.01), mat('#c8a23e', 0.28, 0.45, 0.35)); m.position.y = 0.18; return m; })(),
    (() => { const f1 = new T.Mesh(new T.BoxGeometry(0.05, 0.07, 0.15), mat('#d8dde6', 0.25)); f1.position.set(-0.14, 0.12, 0); return f1; })(),
    (() => { const f2 = new T.Mesh(new T.BoxGeometry(0.05, 0.07, 0.15), mat('#d8dde6', 0.25)); f2.position.set(0.14, 0.12, 0); return f2; })()
  );
  M.root.add(valSocio);
  OBJ.valigetta_socio = valSocio;

  // Tendone, tavolini esterni del bar con sgabelli e lampade (ricchezza e profondità ai bordi)
  const tendaBar = sm(0.75, 0.24, 3.1, mat('#a8324e', 0.25, 0.8), -2.62, 2.42, -0.2, 0.04, 0, 'tenda_bar');
  tendaBar.rotation.z = -0.28;
  for (const [tz, nameT] of [[1.4, 'tavolino_bar_1'], [-1.75, 'tavolino_bar_2']]) {
    const tv = new T.Group();
    tv.name = nameT;
    tv.position.set(-2.25, 0.14, tz);
    M.root.add(tv);
    const pTop = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.045, 18), mat('#d8cfc2', 0.22));
    pTop.position.y = 0.72;
    const gambaT = new T.Mesh(new T.CylinderGeometry(0.04, 0.06, 0.7, 10), mCornice);
    gambaT.position.y = 0.35;
    const lume = new T.Mesh(new T.CylinderGeometry(0.045, 0.04, 0.11, 10), M.emi('#ffcc66', 1.1));
    lume.position.set(0.08, 0.79, 0.04);
    const bicchiere = new T.Mesh(new T.CylinderGeometry(0.032, 0.025, 0.1, 10), mat('#78d4e8', 0.25));
    bicchiere.position.set(-0.08, 0.79, -0.05);
    tv.add(pTop, gambaT, lume, bicchiere);
    M.vita.aggiungi(lume, 'lampeggia', { min: 0.82, freq: 0.8 });
    const sg = new T.Group();
    sg.name = 'sgabello_' + tz;
    sg.position.set(-1.72, 0.14, tz + 0.28);
    sg.add(
      (() => { const a = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.06, 14), mat('#7a4838', 0.2)); a.position.y = 0.46; return a; })(),
      (() => { const b = new T.Mesh(new T.CylinderGeometry(0.035, 0.04, 0.44, 10), mCornice); b.position.y = 0.22; return b; })()
    );
    M.root.add(sg);
  }
  // Pianta in vaso fuori dal bar
  const piantaBar = new T.Group();
  piantaBar.name = 'pianta_bar';
  piantaBar.position.set(-2.45, 0.14, 2.25);
  M.root.add(piantaBar);
  piantaBar.add((() => { const v = new T.Mesh(new T.CylinderGeometry(0.2, 0.15, 0.36, 12), mat('#985a42', 0.2)); v.position.y = 0.18; return v; })());
  for (let i = 0; i < 6; i++) {
    const f = new T.Mesh(new T.SphereGeometry(0.15, 8, 6), mat(i % 2 ? '#3f7e52' : '#509662', 0.24));
    f.scale.set(0.5, 2.0, 0.45);
    f.rotation.z = (i - 2.5) * 0.25;
    f.position.set((i - 2.5) * 0.04, 0.62, Math.sin(i) * 0.06);
    piantaBar.add(f);
  }
  M.vita.aggiungi(piantaBar, 'ondeggia', { amp: 0.05, freq: 0.35 });

  // ---- 3. NEGOZIO 2: «CLINICA 24H» CON SARACINESCA CHIUSA (z = -5.2, x = -2.94) — Scena 4
  const insClinica = cartello(M, {
    testo: 'CLINICA 24H', w: 2.3, h: 0.56,
    x: -2.92, y: 2.68, z: -5.2, ry: Math.PI / 2,
    fondo: '#1c2438', colore: '#94b8e6', bordo: '#495a7e',
  });
  insClinica.name = 'insegna_clinica';
  M.vita.aggiungi(insClinica, 'lampeggia', { min: 0.45, freq: 0.65, modo: 'onda' });

  // Interno nero dietro alla serranda (visibile se appena socchiusa) + saracinesca.glb da library/vivi/
  str(M.box(0.2, 2.2, 2.3, mat('#2a3b68', 0.32), -3.05, 1.2, -5.2));
  OBJ.saracinesca = await vivo(M, 'saracinesca', {
    x: -2.94, y: 0.14, z: -5.2, ry: Math.PI / 2, s: 1.0,
    colori: { serranda: '#7686ac', telaio: '#343c58', maniglia: '#d4b24c' },
  });
  OBJ.saracinesca.name = 'saracinesca_clinica';
  // Tienila sempre chiusa (la clinica è serrata a doppia mandata con lucchetto e cartello CHIUSO)
  OBJ.saracinesca.traverse(c => {
    if (c.userData && c.userData.vivo_modo) {
      c.userData.vivo_periodo = 1000;
      c.userData.vivo_durata = 0;
      c.userData.vivo_fase = 100;
    }
  });
  // Foglietto «CHIUSO» attaccato a metà serranda (da strada_1.jpg)
  const foglioChiuso = cartello(M, {
    testo: 'CHIUSO', w: 0.44, h: 0.30,
    x: -2.86, y: 1.38, z: -5.18, ry: Math.PI / 2,
    fondo: '#eee6d6', colore: '#b82828', bordo: '#322c38', spessore: 0.015,
  });
  foglioChiuso.name = 'avviso_chiuso';
  M.vita.aggiungi(foglioChiuso, 'pendola', { amp: 0.04, freq: 0.55, asse: 'z' });
  // Applique luminosa sopra la saracinesca della clinica chiusa (illumina la zona senza schiarire nero)
  sm(0.45, 0.10, 0.14, M.emi('#cfe2ff', 1.25), -2.86, 2.36, -5.20, 0.02, 0, 'lampada_clinica_est');
  M.luce('#b8d6ff', 7.2, -1.55, 2.45, -5.20, 12.0);

  // Lucchetto basso + condizionatore a muro che vibra + colonna adesivi
  sm(0.12, 0.16, 0.08, mat('#c8a23e', 0.25, 0.55, 0.14), -2.84, 0.26, -5.2, 0.015, 0, 'lucchetto_saracinesca');
  await vivo(M, 'condizionatore', { x: -2.88, y: 2.8, z: -3.2, ry: Math.PI / 2, s: 0.9 });
  const cestinoStrada = sm(0.42, 0.72, 0.42, mat('#2c6a54', 0.22), -2.42, 0.50, -3.55, 0.04, 0, 'cestino_strada');
  void cestinoStrada;
  const colonnina = sm(0.14, 0.85, 0.14, mat('#34394c', 0.2), -2.15, 0.56, -7.2, 0.03, 0, 'paletto_marciapiede');
  void colonnina;

  // ---- 4. NEGOZIO 3: «TV ELETTRONICA» CON MONITOR TG RICERCATO + SPECCHIO (z = -8.4 .. -13.4) — Scene 5 e 6
  const insTv = cartello(M, {
    testo: 'TV ELETTRONICA', w: 2.9, h: 0.58,
    x: -2.92, y: 2.75, z: -10.8, ry: Math.PI / 2,
    fondo: '#102448', colore: '#52e6ff', bordo: '#3290cc',
  });
  insTv.name = 'insegna_tv';
  M.vita.aggiungi(insTv, 'lampeggia', { min: 0.85, freq: 0.4, modo: 'respiro' });

  // Nicchia illuminata della vetrina con ripiani espositivi
  str(M.box(0.45, 2.25, 3.8, mat('#4464b2', 0.72), -3.12, 1.25, -10.3));
  M.luce('#8ee2ff', 8.2, -1.5, 2.15, -9.8, 10.5);

  // Canvas del TG: ritratto cartoon inconfondibile di DAVIDE VERO (felpa blu #3b6ea5 + ricci castani) con «ULTIM'ORA - RAPINA - RICERCATO»
  const drawTgFrame = (c, W, Hc, headline, sub) => {
    c.fillStyle = '#2a458a';
    c.fillRect(0, 0, W, Hc);
    // Striscia TG rossa in alto
    c.fillStyle = '#d62832';
    c.fillRect(0, 0, W, Hc * 0.22);
    adattaTesto(c, headline, W, Hc * 0.22, { colore: '#ffffff', righe: 1, max: 0.72, margine: 0.08 });
    // Sfondo foto segnaletica + felpa blu di Davide vero
    c.fillStyle = '#38579c';
    c.fillRect(W * 0.08, Hc * 0.25, W * 0.44, Hc * 0.56);
    const cx = W * 0.30, cy = Hc * 0.52;
    c.fillStyle = '#3b6ea5';
    c.beginPath(); c.ellipse(cx, cy + Hc * 0.22, W * 0.16, Hc * 0.16, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#1f1624'; c.lineWidth = 4; c.stroke();
    // Testa e ricci castani scuri (davide vero!)
    c.fillStyle = '#f2d4b8';
    c.beginPath(); c.ellipse(cx, cy, W * 0.125, Hc * 0.15, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#362620';
    for (let k = -2; k <= 2; k++) {
      c.beginPath(); c.arc(cx + k * W * 0.042, cy - Hc * 0.125 + Math.abs(k) * 4, W * 0.042, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    // Occhi spaventati e bocca sulla foto TG
    c.fillStyle = '#1f1624';
    c.beginPath(); c.arc(cx - W * 0.042, cy - Hc * 0.01, 4.5, 0, Math.PI * 2); c.arc(cx + W * 0.042, cy - Hc * 0.01, 4.5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(cx - W * 0.04, cy + Hc * 0.06); c.lineTo(cx + W * 0.04, cy + Hc * 0.05); c.stroke();
    // Box rosso «RICERCATO» accanto alla foto
    c.fillStyle = '#fff5ea';
    c.fillRect(W * 0.55, Hc * 0.26, W * 0.39, Hc * 0.53);
    adattaTesto(c, sub, W * 0.39, Hc * 0.53, { x0: W * 0.55, y0: Hc * 0.26, colore: '#c21824', righe: 2, max: 0.68, margine: 0.08 });
    // Barra scorrevole notizie in basso
    c.fillStyle = '#e8b92e';
    c.fillRect(0, Hc * 0.84, W, Hc * 0.16);
    adattaTesto(c, 'RAPINA IN BANCA • VOLTO IDENTIFICATO • ALLERTA MASSIMA', W, Hc * 0.16, { x0: 0, y0: Hc * 0.84, colore: '#1b1620', righe: 1, max: 0.72, margine: 0.06 });
  };
  const texTgMain = tela(512, 340, (c, W, Hc) => drawTgFrame(c, W, Hc, "ULTIM'ORA TG 24", 'RICERCATO\nRAPINA'));
  const texTgTicker = tela(512, 128, (c, W, Hc) => {
    c.fillStyle = '#e4b329'; c.fillRect(0, 0, W, Hc);
    adattaTesto(c, 'RAPINA IN BANCA • RICERCATO • ', W, Hc, { colore: '#1a141c', righe: 1, max: 0.7 });
  });

  const makeTv = (w, h, y, z, name, main = false) => {
    const g = new T.Group();
    g.name = name;
    g.position.set(-2.90, y, z);
    g.rotation.y = Math.PI / 2;
    M.root.add(g);
    const frame = new T.Mesh(new RoundedBoxGeometry(w + 0.08, h + 0.08, 0.12, 2, 0.018), mat('#242938', 0.18));
    const screen = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: texTgMain }));
    screen.position.z = 0.065;
    g.add(frame, screen);
    if (main) OBJ.tv_tg = g;
    M.vita.aggiungi(screen, 'lampeggia', { min: 0.86, freq: 0.55 });
    const bar = new T.Mesh(new T.PlaneGeometry(w, h * 0.14), new T.MeshBasicMaterial({ map: texTgTicker }));
    bar.position.set(0, -h * 0.43, 0.068);
    g.add(bar);
    M.vita.aggiungi(bar, 'scorri', { vel: [0.35, 0] });
    return g;
  };
  makeTv(1.12, 0.74, 1.48, -9.6, 'tv_principale_tg', true);
  makeTv(0.68, 0.46, 0.72, -9.2, 'tv_vetrina_2');
  makeTv(0.68, 0.46, 0.72, -10.1, 'tv_vetrina_3');
  makeTv(0.68, 0.46, 1.85, -10.8, 'tv_vetrina_4');
  makeTv(0.68, 0.46, 1.15, -10.8, 'tv_vetrina_5');

  // Specchio/Vetrina riflettente verticale accanto ai TV (z = -12.6, Scena 6 reveal finale!)
  const vetroSpecchio = new T.Group();
  vetroSpecchio.name = 'vetrina_specchio';
  vetroSpecchio.position.set(-2.88, 1.38, -12.65);
  vetroSpecchio.rotation.y = Math.PI / 2;
  M.root.add(vetroSpecchio);
  const corVS = new T.Mesh(new RoundedBoxGeometry(1.75, 2.38, 0.1, 3, 0.02), mat('#262d42', 0.22));
  const texRefl = tela(384, 512, (c, W, Hc) => {
    const gr = c.createLinearGradient(0, 0, W, Hc);
    gr.addColorStop(0, '#5a78a4');
    gr.addColorStop(0.5, '#9abae0');
    gr.addColorStop(1, '#3d5882');
    c.fillStyle = gr;
    c.fillRect(0, 0, W, Hc);
    c.fillStyle = 'rgba(255,255,255,0.22)';
    c.beginPath();
    c.moveTo(W * 0.12, 0); c.lineTo(W * 0.34, 0);
    c.lineTo(W * 0.08, Hc); c.lineTo(0, Hc);
    c.closePath(); c.fill();
  });
  const glassVS = new T.Mesh(new T.PlaneGeometry(1.58, 2.2), dip(texRefl, 0.42, 0.55));
  glassVS.position.z = 0.055;
  vetroSpecchio.add(corVS, glassVS);
  M.vita.aggiungi(glassVS, 'lampeggia', { min: 0.92, freq: 0.4, modo: 'respiro' });

  // Luce dedicata specchio + arredi ricchi attorno a vetrina TG e specchio finale (Scene 6-9 zero MONDO_POVERO)
  M.luce('#92bfff', 3.4, -0.7, 2.45, -12.2, 9.5);
  const insegnaOfferte = cartello(M, {
    testo: 'ALTA FEDELTÀ', w: 0.72, h: 0.24,
    x: -2.92, y: 2.75, z: -12.65, ry: Math.PI / 2,
    fondo: '#17294a', colore: '#6be6ff', bordo: '#3a7cb8',
  });
  insegnaOfferte.name = 'insegna_alta_fedelta';
  M.vita.aggiungi(insegnaOfferte, 'lampeggia', { min: 0.85, freq: 0.55 });
  const avvOrari = cartello(M, {
    testo: '24H VIDEO', w: 0.42, h: 0.24,
    x: -2.84, y: 1.05, z: -11.65, ry: Math.PI / 2,
    fondo: '#f2ece0', colore: '#1b2b4a', bordo: '#2e5894',
  });
  avvOrari.name = 'avviso_orari_vetrina';
  sm(0.38, 0.76, 0.38, mat('#222836', 0.25), -2.55, 0.52, -11.45, 0.025, 0.15, 'cassa_audio_1');
  sm(0.38, 0.58, 0.38, mat('#2a3244', 0.25), -2.55, 0.43, -13.75, 0.025, -0.1, 'cassa_audio_2');
  sm(0.14, 0.14, 0.22, mat('#343d4d', 0.26), -2.76, 2.38, -11.35, 0.02, 0.35, 'telecamera_vetrina');
  sm(0.46, 0.96, 0.44, mat('#b82832', 0.26), -2.62, 0.62, -14.25, 0.03, 0.08, 'edicola_rossa_vetrina');
  sm(0.16, 0.26, 0.16, mat('#2c7d5a', 0.28), -2.55, 1.02, -11.45, 0.02, 0, 'altoparlante_piccolo_1');
  sm(0.26, 0.78, 0.26, mat('#30384c', 0.24), -2.05, 0.53, -14.05, 0.03, 0, 'paletto_specchio_1');
  sm(0.26, 0.78, 0.26, mat('#30384c', 0.24), -2.05, 0.53, -11.15, 0.03, 0, 'paletto_specchio_2');
  const fiorieraV = sm(0.68, 0.42, 0.46, mat('#6e4834', 0.24), 2.35, 0.35, -12.6, 0.025, 0.2, 'fioriera_opposta_dx');
  void fiorieraV;
  sm(0.24, 0.65, 0.24, mat('#2e7d54', 0.28), 2.35, 0.85, -12.6, 0.06, 0, 'cespuglio_opposto_dx');

  // ---- 5. CARTELLO STRADALE, CASSETTE, GATTO ANIMATO, FURGONE E LAMPEGGIANTI POLIZIA ALL'ANGOLO
  const sensoUnico = cartello(M, {
    testo: 'SENSO UNICO', w: 0.65, h: 0.26,
    x: 2.75, y: 2.15, z: -2.2, ry: -0.3,
    fondo: '#1d4a8e', colore: '#f0eee8', bordo: '#e6e2d8',
  });
  sensoUnico.name = 'cartello_senso_unico';
  sm(0.06, 2.2, 0.06, mat('#666d82', 0.2), 2.75, 1.1, -2.2, 0.01, 0, 'palo_cartello');

  // Cassetta, panchina, idrante e moto parcheggiata (ricchezza e profondità campo largo)
  sm(0.62, 0.42, 0.44, mat('#c89c36', 0.22), 2.25, 0.35, -0.8, 0.025, 0.2, 'cassetta_gialla_dx');
  sm(0.62, 0.42, 0.44, mat('#c89c36', 0.22), 2.22, 0.77, -0.82, 0.025, -0.1, 'cassetta_gialla_dx_2');
  sm(0.24, 0.68, 0.24, mat('#b83232', 0.25), -2.55, 0.48, 2.85, 0.06, 0, 'idrante_strada');
  const panchina = new T.Group();
  panchina.name = 'panchina_notte';
  panchina.position.set(2.95, 0.14, 1.8);
  panchina.rotation.y = -Math.PI / 2;
  panchina.add(
    (() => { const a = new T.Mesh(new RoundedBoxGeometry(1.5, 0.08, 0.48, 2, 0.02), mat('#6c4832', 0.22)); a.position.y = 0.45; return a; })(),
    (() => { const b = new T.Mesh(new RoundedBoxGeometry(1.5, 0.36, 0.07, 2, 0.02), mat('#6c4832', 0.22)); b.position.set(0, 0.72, -0.21); return b; })(),
    (() => { const g1 = new T.Mesh(new T.BoxGeometry(0.08, 0.45, 0.42), mCornice); g1.position.set(-0.62, 0.22, 0); return g1; })(),
    (() => { const g2 = new T.Mesh(new T.BoxGeometry(0.08, 0.45, 0.42), mCornice); g2.position.set(0.62, 0.22, 0); return g2; })()
  );
  M.root.add(panchina);

  // Gatto vero da library/animati/ e furgone che passa lontano
  await animato(M, 'Cat', {
    x: -1.9, y: 0.14, z: -3.2, alt: 0.34, anim: 'Walking', vel: 1.0,
    percorso: [[-2.05, -2.6], [-2.05, -6.5]], passo: 0.55,
  });
  M.furgone({ x: 1.65, z: -42, colore: '#c8cede', moto: { a: [1.65, 0, -17], dur: 12, pausa: 2 } });

  // Lampeggianti polizia blu + rosso all'angolo (z = -17.5, girano e proiettano luci blu/rosse!)
  const autoPol = sm(1.8, 1.35, 3.6, mat('#1d2746', 0.25), 0.9, 0.68, -17.8, 0.08, -0.55, 'auto_polizia_angolo');
  void autoPol;
  M.vita.girofaro({ x: 0.55, y: 1.52, z: -16.8, colore: '#2b7fff', vel: 1.35, forza: 5.5, luceVera: true });
  M.vita.girofaro({ x: 1.05, y: 1.52, z: -17.0, colore: '#ff2b3a', vel: -1.25, forza: 5.5, luceVera: true });

  // ---- 6. EFFETTO «TESTA BIANCA SENZA FACCIA» PER DAVIDE_VUOTO (isolato qui, senza toccare engine3d/)
  // Scan per riga rigorosamente DENTRO il contorno scuro #2a1a26 della testa: azzera occhi, sopracciglia, bocca e riflesso pelato
  // lasciando intatto il contorno a spessore variabile anche con testa inclinata/voltata!
  M.tick = M.tick || [];
  M.tick.push(() => {
    D.root.traverse(m => {
      if (!m.userData.card || !m.userData.opt?.vuota) return;
      const u = m.userData;
      if (!u.ctx || !u.cv) return;
      const mark = u.ctx.getImageData(2, 2, 1, 1).data;
      if (mark[3] > 0) return;
      const Wcv = u.cv.width, Hcv = u.cv.height;
      const g = u.ctx;
      const img = g.getImageData(0, 0, Wcv, Hcv);
      const d = img.data;
      const isOpaque = (x, y) => d[(y * Wcv + x) * 4 + 3] > 140;
      const isInk = (x, y) => {
        const i = (y * Wcv + x) * 4;
        return d[i + 3] > 140 && d[i] < 78 && d[i + 1] < 60 && d[i + 2] < 72;
      };
      // Trova la fascia verticale della testa esplorando dal centro x=256 verso i bordi esterni della sagoma (ignora VFX staccati!)
      const skullBounds = y => {
        if (!isOpaque(256, y)) return null;
        let l = 256, r = 256;
        while (l > 60 && isOpaque(l - 1, y)) l--;
        while (r < 452 && isOpaque(r + 1, y)) r++;
        return [l, r];
      };
      let topHeadY = -1;
      for (let y = 135; y < 390; y++) {
        const b = skullBounds(y);
        if (b && b[1] - b[0] > 95) { topHeadY = y; break; }
      }
      if (topHeadY >= 0) {
        const endHeadY = Math.min(395, topHeadY + 236);
        const cx = 256, cy = topHeadY + 122;
        for (let y = topHeadY + 10; y < endHeadY; y++) {
          const b = skullBounds(y);
          if (!b) continue;
          const [l, r] = b;
          if (r - l < 90 || r - l > 305) continue;
          let inL = l;
          while (inL < r && inL - l < 26 && (isInk(inL, y) || !isOpaque(inL, y))) inL++;
          let inR = r;
          while (inR > inL && r - inR < 30 && (isInk(inR, y) || !isOpaque(inR, y))) inR--;
          if (inR - inL < 55) continue;
          let inkCount = 0;
          for (let x = inL + 10; x < inR - 10; x++) if (isInk(x, y)) inkCount++;
          if (y > topHeadY + 195 && inkCount > (inR - inL) * 0.52) break;
          for (let x = inL; x <= inR; x++) {
            const dx = (x - (cx - 28)) / 145;
            const dy = (y - (cy - 34)) / 135;
            const t = Math.min(1, Math.hypot(dx, dy));
            const k = Math.max(0, t - 0.55) / 0.45;
            const idx = (y * Wcv + x) * 4;
            d[idx]     = Math.round(245 - k * 24);
            d[idx + 1] = Math.round(241 - k * 26);
            d[idx + 2] = Math.round(234 - k * 14);
            d[idx + 3] = 255;
          }
        }
        g.putImageData(img, 0, 0);
      }
      g.save();
      g.fillStyle = 'rgba(255,255,255,0.02)';
      g.fillRect(2, 2, 1, 1);
      g.restore();
      u.tex.needsUpdate = true;
      D.mappaBordi(u.cv, u.ec);
      u.et.needsUpdate = true;
    });
  });
}
