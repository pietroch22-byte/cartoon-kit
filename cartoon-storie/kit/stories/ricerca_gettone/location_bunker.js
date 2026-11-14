// Location 3: bunker_bottino — Bunker & Caveau Sotterraneo Fortnite (Scene 3, 4, 7, 8)
import { animato } from '/web/animati.js';
import { vivo } from '/web/vivi.js';
import { cartello, orologio } from '/web/buon_senso.js';
import { creaToolkit, cl, inv, ss, ss5 } from './arredi_fortnite.js';

export async function costruisciBunkerBottino(M, D, OBJ, sc, sharedState) {
  const K = creaToolkit(M);
  const {
    T, sm, rbox, setStr, addGrp, live, noInkTree, mat, smorza, emi, dipinto, tex, luce,
    creaStanzaTattica, creaGettone3D, creaForziereFortnite, creaVendingMachine,
    creaTavoloOlogramma, creaBarileSlurp, creaPozioneScudo, creaVBuck3D,
    creaSupplyDrop, creaRastrellieraPicconi, creaCassaMunizioni,
    creaPilaLingotti, creaCono3D, creaInsegnaNeon, creaMinuteriaFortnite
  } = K;

  const zona = sc.zona || 'progresso';

  // Caveau del Bottino con palette calda del nostro motore (pietra ocra/sabbia, pavimento cotto/bordeaux caldo)
  creaStanzaTattica(16.0, 6.2, 16.0, -1.6, {
    wallBg: '#c4b49a', wallTrim: '#6e5a48', stripe: '#c89238',
    floorBg: '#785a4e', floorAlt: '#684c42', floorAcc: '#bfa06a',
    ceilBg: '#b8a68c', zocCol: '#544234', texRep: [2, 2]
  });

  // 3 luci calde da soffitto stabili (nei chiusi il motore usa fino a 3 PointLight: zero SALTO_DI_LUCE!)
  luce('#ffe2b0', 3.4, 0, 5.2, -2.5, 26);
  luce('#ffd89a', 3.0, 0, 4.9, -5.8, 24);
  luce('#ffe6b8', 2.6, 0, 4.5, 1.4, 22);

  // Luci a soffitto hangar (emissione calda uniforme, nessun lampeggio per evitare salti di luce)
  for (const cz of [-6.0, -2.0, 2.0]) {
    sm(5.2, 0.10, 0.9, emi('#ffe8bf', 0.36), 0, 6.12, cz, `barra_luce_caveau_${cz}`, true);
  }

  // Grande Porta Circolare Blindata del Caveau sulla parete di fondo sinistra + Volantino rotante!
  const vaultDoor = addGrp(-3.8, 2.35, -9.38, 'porta_blindata_caveau');
  const ringOuter = new T.Mesh(new T.CylinderGeometry(2.15, 2.15, 0.28, 32), mat('#334155', 0.45, 0.55, '#1e293b', 0.22));
  ringOuter.rotation.x = Math.PI / 2;
  const ringInner = new T.Mesh(new T.CylinderGeometry(1.75, 1.75, 0.34, 28), mat('#475569', 0.40, 0.60, '#334155', 0.22));
  ringInner.rotation.x = Math.PI / 2;
  const wheel = new T.Group();
  wheel.position.z = 0.24;
  wheel.name = 'volantino_caveau';
  const rim = new T.Mesh(new T.TorusGeometry(0.68, 0.08, 10, 24), mat('#facc15', 0.32, 0.65, '#d97706', 0.32));
  wheel.add(rim);
  for (let k = 0; k < 3; k++) {
    const sp = new T.Mesh(new T.BoxGeometry(1.30, 0.09, 0.07), mat('#facc15', 0.32, 0.65, '#d97706', 0.30));
    sp.rotation.z = (k * Math.PI) / 3;
    wheel.add(sp);
  }
  vaultDoor.add(ringOuter, ringInner, wheel);
  noInkTree(vaultDoor);
  live(wheel, 'gira', { asse: 'z', vel: 0.16 });
  live(vaultDoor, 'respira', { amp: 0.006, freq: 0.32 });

  // Trave carro ponte alta + cartelli lato sx/alto (emissione morbida anti-sfarfallio)
  setStr(sm(14.8, 0.32, 0.42, mat('#334155', 0.6, 0.5, '#1e293b', 0.2), 0, 5.45, -4.6, 'trave_carroponte', true));
  creaInsegnaNeon(-2.8, 4.25, -4.45, 2.2, 0.56, 0, 'VAULT BAY • OPEN', {
    bg: '#1b2b52', col: '#93c5fd', bordo: '#d97706', em: 0.24, nome: 'cartello_gru_sx'
  });
  creaInsegnaNeon(2.6, 3.8, -9.42, 3.6, 0.72, 0, 'VAULT SECTOR • 14', {
    bg: '#1f2937', col: '#fde68a', bordo: '#d97706', em: 0.28, nome: 'insegna_vault'
  });
  orologio(M, { x: 5.8, y: 4.15, z: -9.42, ry: 0, r: 0.48, ora: '04:20', cornice: '#f59e0b' });
  cartello(M, { testo: 'LOOT HANGAR', w: 2.0, h: 0.50, x: 0.2, y: 4.5, z: -9.42, fondo: '#0f172a', colore: '#facc15', bordo: '#38bdf8' });

  // Arredi fissi del Bunker lungo tutte le zone (>= 18 prop indipendenti!)
  creaSupplyDrop(-5.2, 0, -5.4, 0.92, 'supply_bunker_sx', { conPallone: true });
  creaSupplyDrop(5.2, 0, -5.2, 0.92, 'supply_bunker_dx', { conPallone: true });
  creaRastrellieraPicconi(-5.6, 0, -1.6, 0.72, 'rastrelliera_bunker');
  creaVendingMachine(5.5, 0, -1.6, -0.72, 0.95, 'vending_bunker');
  creaBarileSlurp(-4.3, 0, 0.6, 0.95, 'slurp_bunker_sx');
  creaBarileSlurp(4.3, 0, 0.6, 0.95, 'slurp_bunker_dx');
  creaPilaLingotti(-3.1, 0, 1.4, 1.05, 0.22, 'lingotti_bunker_sx');
  creaPilaLingotti(3.1, 0, 1.4, 1.05, -0.22, 'lingotti_bunker_dx');
  creaCassaMunizioni(-2.6, 0, -6.2, 1.05, 0.35, 'munizioni_bunker_sx');
  creaCassaMunizioni(2.6, 0, -6.2, 1.05, -0.35, 'munizioni_bunker_dx');
  creaPozioneScudo(-2.1, 0, 1.6, 1.0, 'pozione_bunker_sx');
  creaPozioneScudo(2.1, 0, 1.6, 1.0, 'pozione_bunker_dx');
  creaForziereFortnite(3.8, 0, -6.4, 0.92, { tipo: 'oro', aperto: true, ry: -0.45, nome: 'forziere_scorta_dx' });
  creaForziereFortnite(-3.8, 0, -6.4, 0.92, { tipo: 'blu', aperto: false, ry: 0.45, nome: 'forziere_scorta_sx' });
  creaVBuck3D(-3.25, 1.55, -4.6, 0.22, 'vbuck_bunker_sx');
  creaVBuck3D(3.35, 1.55, -4.6, 0.22, 'vbuck_bunker_dx');

  // Minuteria Fortnite in primo piano su tutte le fasce basse del caveau (>= 5 piccoli!)
  creaMinuteriaFortnite(-1.65, 0, 0.8, 'mini_scudo', 'bunker_mini_scudo_sx');
  creaMinuteriaFortnite(-0.85, 0, 0.5, 'lingotto_singolo', 'bunker_lingotto_sx');
  creaMinuteriaFortnite(0.0, 0, 0.4, 'scatola_colpi', 'bunker_colpi_centro');
  creaMinuteriaFortnite(0.85, 0, 0.5, 'lattina_slurp', 'bunker_slurp_dx');
  creaMinuteriaFortnite(1.65, 0, 0.8, 'mini_vbuck', 'bunker_vbuck_dx');
  creaMinuteriaFortnite(-2.25, 0, -0.5, 'scatola_colpi', 'bunker_colpi_lat_sx');
  creaMinuteriaFortnite(2.25, 0, -0.5, 'mini_scudo', 'bunker_mini_scudo_lat_dx');

  try {
    smorza(await vivo(M, 'ventilatore_soffitto', { x: -3.6, y: 6.08, z: -2.4, s: 0.95 }));
    smorza(await vivo(M, 'ventilatore_soffitto', { x: 3.6, y: 6.08, z: -2.4, s: 0.95 }));
    smorza(await animato(M, 'Llama', { x: 2.65, y: 0, z: -3.4, ry: -0.75, s: 0.17, anim: 'Idle', vel: 0.65 }));
  } catch (e) { /* opzionale */ }

  // Configurazione specifica per ZONA (progresso, gradini, altare, mappa)
  let tokenHero = null;

  if (zona === 'progresso') {
    rbox(0.94, 0.036, 3.0, 0.01, 1, mat('#b91c1c', 0.90, 0.04, '#991b1b', 0.16), -1.05, 0.018, -2.0, 'pista_rossa_inizio', M.root, true);
    rbox(0.94, 0.040, 3.0, 0.01, 1, mat('#b45309', 0.90, 0.05, '#92400e', 0.16), 0.0, 0.020, -2.1, 'pista_ambra_mezzo', M.root, true);
    rbox(0.94, 0.044, 3.2, 0.01, 1, mat('#ca8a04', 0.88, 0.08, '#a16207', 0.18), 1.05, 0.022, -2.0, 'pista_oro_arrivo', M.root, true);
    creaForziereFortnite(-1.15, 0, -3.2, 0.85, { tipo: 'blu', aperto: true, ry: 0.22, nome: 'forziere_inizio_vuoto' });
    creaCono3D(1.05, 2.7, -2.0, 1.5, 5.4, '#ffe58f', 0.07, 0, 0, 'fascio_progresso_dx');
    tokenHero = creaGettone3D(1.05, 2.05, -1.85, 0.36, 'gettone_trofeo_progresso', { rot: 0.10, floatAmp: 0 });
    tokenHero.visible = false;
    sharedState.apexPos = new T.Vector3(1.05, 2.05, -1.85);
  } else if (zona === 'gradini') {
    const steps = [
      [-2.15, 0.00], [-1.30, 0.44], [-0.45, 0.88], [0.40, 1.32], [1.25, 1.76]
    ];
    steps.forEach(([sx, sy], i) => {
      if (sy > 0.05) {
        rbox(0.80, sy, 0.82, 0.03, 2, mat('#786858', 0.85, 0.06, '#5c4e40', 0.16), sx, sy * 0.5, -2.8, `basamento_gradino_${i}`, M.root, true);
      }
      creaForziereFortnite(sx, sy, -2.8, 0.84, { tipo: 'blu', aperto: false, ry: 0.12, nome: `forziere_gradino_${i}` });
    });
    rbox(1.35, 2.25, 1.35, 0.05, 2, mat('#6b5b4b', 0.84, 0.08, '#4e4135', 0.16), 2.35, 1.125, -2.8, 'pedana_arrivo_gradini', M.root, true);
    creaCono3D(2.35, 3.6, -2.8, 1.65, 4.8, '#ffe27a', 0.08, 0, 0, 'cono_gradini');
    tokenHero = creaGettone3D(2.35, 3.05, -2.8, 0.48, 'gettone_cima_gradini', { rot: 0.22, floatAmp: 0.05 });
    sharedState.apexPos = new T.Vector3(2.35, 3.05, -2.8);
  } else if (zona === 'altare') {
    rbox(1.9, 0.62, 1.7, 0.06, 2, mat('#786858', 0.84, 0.08, '#5c4e40', 0.16), 0, 0.31, -3.0, 'altare_pietra', M.root, true);
    creaForziereFortnite(0, 0.62, -3.0, 1.18, { tipo: 'pirata', aperto: true, ry: 0, nome: 'forziere_pirata_altare' });
    creaCono3D(0, 2.8, -3.0, 1.85, 5.2, '#ffe082', 0.08, 0, 0, 'fascio_altare');
    tokenHero = creaGettone3D(0, 1.25, -2.95, 0.44, 'gettone_nasce_altare', { rot: 0.20, floatAmp: 0 });
    sharedState.apexPos = new T.Vector3(0, 1.85, -2.95);
  } else if (zona === 'mappa') {
    const mapTex = tex(640, 400, (c, W, H) => {
      c.fillStyle = '#1b3154'; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#38bdf8'; c.lineWidth = 8; c.strokeRect(8, 8, W - 16, H - 16);
      c.fillStyle = '#295747';
      c.beginPath(); c.ellipse(W * 0.52, H * 0.54, 185, 118, -0.15, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#60a5fa'; c.lineWidth = 4; c.stroke();
      c.strokeStyle = 'rgba(148, 163, 184, 0.26)'; c.lineWidth = 2;
      for (let gx = 80; gx < W; gx += 80) { c.beginPath(); c.moveTo(gx, 20); c.lineTo(gx, H - 20); c.stroke(); }
      for (let gy = 80; gy < H; gy += 80) { c.beginPath(); c.moveTo(20, gy); c.lineTo(W - 20, gy); c.stroke(); }
      c.save();
      c.setLineDash([12, 10]); c.strokeStyle = '#93c5fd'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(75, 320); c.lineTo(540, 88); c.stroke();
      c.restore();
      c.strokeStyle = '#facc15'; c.lineWidth = 5;
      c.beginPath(); c.arc(385, 195, 42, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#fde047';
      c.beginPath(); c.arc(385, 195, 13, 0, Math.PI * 2); c.fill();
      c.font = '900 22px sans-serif'; c.fillStyle = '#fde047';
      c.fillText('TARGET: TOKEN DROP', 225, 46);
    });
    const mapBoard = addGrp(0.25, 1.95, -4.4, 'lavagna_mappa_drop');
    mapBoard.add(
      new T.Mesh(new T.BoxGeometry(3.4, 2.05, 0.14), mat('#334155', 0.78, 0.08, '#1e293b', 0.18)),
      (() => {
        const p = new T.Mesh(new T.PlaneGeometry(3.22, 1.88), dipinto(mapTex, 0.30, 0.88));
        p.position.z = 0.08;
        return p;
      })()
    );
    noInkTree(mapBoard);
    live(mapBoard, 'respira', { amp: 0.006, freq: 0.28 });
    creaTavoloOlogramma(-1.45, 0, -2.5, 1.55, 1.15, 0.30, 'tavolo_mappa_sx');
    creaTavoloOlogramma(1.65, 0, -2.6, 1.55, 1.15, -0.30, 'tavolo_mappa_dx');
  }

  // Posizionamento altitudini pre-frame + tick per gradini (Scena 4) e Gettone altare (Scena 7)
  const findHero = () => M.root.children.find(c => c.userData && c.userData.vivo === 'attore');
  const syncBunker = t => {
    const tl = Math.max(0, t - (sc.da || 0));
    const hero = findHero();

    if (zona === 'progresso') {
      sharedState.apexPos.set(1.05, 2.05, -2.0);
    } else if (zona === 'gradini') {
      const uStep = ss(inv(0.05, 1.45, tl));
      const idxF = cl(uStep * 4, 0, 4);
      const yClimb = idxF * 0.44 + 0.68;
      if (hero) hero.position.y = yClimb;
    } else if (zona === 'altare') {
      const uRise = ss5(inv(1.25, 2.15, tl));
      if (tokenHero) {
        tokenHero.position.set(0, 1.15 + uRise * 1.38, -2.95);
        tokenHero.scale.setScalar(0.35 + 0.75 * uRise);
        tokenHero.visible = tl >= 1.15;
        sharedState.apexPos.copy(tokenHero.position);
      }
    }
  };
  sharedState.preFrame = syncBunker;
  M.tick.push(syncBunker);
}
