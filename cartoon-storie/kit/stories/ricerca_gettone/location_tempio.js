// Location 1: tempio_scalinata — Victory Plaza Notturna Fortnite (Scena 0 & Scena 10)
import { animato } from '/web/animati.js';
import { vivo } from '/web/vivi.js';
import { cartello, orologio } from '/web/buon_senso.js';
import { creaToolkit, cl, inv, ss, ss5 } from './arredi_fortnite.js';

export async function costruisciTempioScalinata(M, D, OBJ, sc, sharedState) {
  const K = creaToolkit(M);
  const {
    T, sm, rbox, setStr, addGrp, live, noInkTree, mat, smorza, emi, dipinto, tex, luce,
    creaGettone3D, creaForziereFortnite, creaVendingMachine, creaRebootVan,
    creaBattleBus, creaBarileSlurp, creaPozioneScudo, creaVBuck3D,
    creaSupplyDrop, creaRastrellieraPicconi, creaCassaMunizioni,
    creaPilaLingotti, creaCono3D, creaLanterna, creaInsegnaNeon, creaMinuteriaFortnite
  } = K;

  const isFinale = sc.zona === 'vittoria';
  const N = 22;
  const stepH = 0.21;
  const stepD = 0.43;
  const stepStartZ = 2.4;
  const totalH = N * stepH; // 4.62 m
  const zTop = stepStartZ - (N - 1) * stepD; // -6.63 m

  // Materiali pietra calcarea dipinta matte ben leggibili (zero riflessi specular, zero TROPPO_SCURO)
  const stoneTex = tex(512, 256, (c, W, H) => {
    c.fillStyle = '#c4b69e';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#b4a58c';
    for (let x = 0; x < W; x += 64) c.fillRect(x, 0, 30, H);
    c.strokeStyle = 'rgba(64, 56, 50, 0.22)';
    c.lineWidth = 3;
    c.strokeRect(0, 2, W, H - 4);
  });
  const mTread = dipinto(stoneTex, 0.28, 0.92);
  const mCheek = mat('#545c8a', 0.88, 0.05, '#424973', 0.18);
  const mBrickL = mat('#725066', 0.90, 0.04, '#54394b', 0.18);
  const mBrickR = mat('#4f5888', 0.90, 0.04, '#3a4168', 0.18);
  const mWinWarm = emi('#ffce73', 0.52);
  const mWinCyan = emi('#7dd3fc', 0.46);
  const mTrimGold = mat('#c88a2e', 0.76, 0.08, '#8f5f18', 0.18);

  // Negli esterni il motore usa 2 PointLight principali: usiamo 2 luci calde ad ampio raggio (36 m) che coprono tutta la scalinata e l'arco senza buchi!
  luce('#ffe2a8', 3.4, 0, 7.8, 2.2, 36);
  luce('#ffe6b0', 3.6, 0, totalH + 3.6, zTop - 2.2, 36);

  // 1. Pavimentazione piazza frontale e dorsale anti-vuoto
  const piazzaTex = tex(512, 512, (c, W, H) => {
    c.fillStyle = '#444e7a';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = '#566296';
    c.lineWidth = 6;
    for (let i = 0; i <= W; i += 64) {
      c.beginPath(); c.moveTo(i, 0); c.lineTo(i, H); c.stroke();
      c.beginPath(); c.moveTo(0, i); c.lineTo(W, i); c.stroke();
    }
  });
  piazzaTex.wrapS = piazzaTex.wrapT = T.RepeatWrapping;
  piazzaTex.repeat.set(8, 8);
  setStr(sm(28, 0.2, 18, dipinto(piazzaTex, 0.28, 0.90), 0, -0.09, 6.0, 'pavimento_piazza', true));

  // 2. Scalinata monumentale Fortnite (smussata e senza linee spigolose fitte per 0 tremolio)
  for (let i = 0; i < N; i++) {
    const w = 5.4 - i * 0.045;
    const hTot = (i + 1) * stepH;
    const zi = stepStartZ - i * stepD;
    setStr(sm(w, hTot, stepD + 0.02, mTread, 0, hTot * 0.5, zi, `gradino_${i}`, true));
  }

  // Terrazza superiore + fondale santuario architetturale dipinto (zero VUOTO_DIETRO_IL_SET e zero TROPPO_SCURO in Scena 10!)
  const cityBgTex = tex(512, 256, (c, W, H) => {
    c.fillStyle = '#424d7a';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#363f66';
    for (let x = 0; x < W; x += 64) {
      const bh = 110 + ((x * 37) % 80);
      c.fillRect(x + 4, H - bh, 54, bh);
      c.fillStyle = '#ffd480';
      for (let wy = H - bh + 18; wy < H - 20; wy += 28) {
        c.fillRect(x + 14, wy, 12, 14);
        c.fillRect(x + 34, wy, 12, 14);
      }
      c.fillStyle = '#363f66';
    }
  });
  setStr(sm(18, totalH, 10.5, mTread, 0, totalH * 0.5, zTop - stepD * 0.5 - 5.25, 'terrazza_santuario', true));
  const bgWall = setStr(sm(22, 9.5, 0.8, dipinto(cityBgTex, 0.36, 0.90), 0, totalH + 3.2, zTop - 10.2, 'muro_sfondo_citta', true));
  bgWall.castShadow = false;

  // Arco di Trionfo Item Shop in cima alla scalinata
  const pSx = setStr(sm(0.95, 5.2, 0.95, mCheek, -2.55, totalH + 2.6, zTop - 2.6, 'pilastro_arco_sx', true));
  const pDx = setStr(sm(0.95, 5.2, 0.95, mCheek, 2.55, totalH + 2.6, zTop - 2.6, 'pilastro_arco_dx', true));
  const archTop = setStr(sm(6.4, 0.92, 1.15, mCheek, 0, totalH + 5.1, zTop - 2.6, 'architrave_arco', true));
  pSx.castShadow = pDx.castShadow = archTop.castShadow = false;
  setStr(sm(5.6, 0.14, 1.20, mTrimGold, 0, totalH + 4.62, zTop - 2.6, 'fregio_oro_arco', true));

  creaInsegnaNeon(0, totalH + 5.15, zTop - 1.98, 4.4, 0.85, 0, 'ITEM SHOP • 14 DAYS', {
    bg: '#1e1b4b', col: '#fde047', bordo: '#38bdf8', em: 0.48, nome: 'insegna_arco_shop'
  });

  // Balze laterali ai fianchi della scalinata + colonne con lanterne pendenti
  for (const sx of [-1, 1]) {
    const sp = setStr(sm(1.6, totalH + 0.5, 11.5, mCheek, sx * 3.45, (totalH + 0.5) * 0.5, -2.2, `spalla_scala_${sx > 0 ? 'dx' : 'sx'}`, true));
    sp.castShadow = false;
    // Facciate edifici Tilted / Item Shop sinistra & destra
    const bx = sx * 6.8;
    const bMat = sx < 0 ? mBrickL : mBrickR;
    const ed = setStr(sm(4.2, 9.2, 18.0, bMat, bx, 4.6, -2.8, `edificio_piazza_${sx > 0 ? 'dx' : 'sx'}`, true));
    ed.castShadow = false;
    setStr(sm(4.5, 0.45, 18.2, mTrimGold, bx - sx * 0.1, 4.35, -2.8, `cornicione_${sx > 0 ? 'dx' : 'sx'}`, true));

    // Finestre accese sugli edifici laterali (senza flickering)
    for (let f = 0; f < 3; f++) {
      const fz = 2.6 - f * 3.8;
      const win = sm(0.14, 1.25, 1.65, f % 2 === 0 ? mWinWarm : mWinCyan, bx - sx * 2.12, 2.25, fz, `vetrina_${sx > 0 ? 'dx' : 'sx'}_${f}`, true);
      win.userData.vivo = 'lampeggia';
      M.vita.aggiungi(win, 'lampeggia', { min: 0.88, freq: 0.25 + f * 0.05 });
      const winUp = sm(0.14, 1.15, 1.45, mWinWarm, bx - sx * 2.12, 6.2, fz, `finestra_alto_${sx > 0 ? 'dx' : 'sx'}_${f}`, true);
      live(winUp, 'lampeggia', { min: 0.86, freq: 0.22 + f * 0.04 });
    }

    // Pilastri scalinata con lanterne calde (intens=0 così non rubano slot alle 2 PointLight esterne)
    for (let k = 0; k < 3; k++) {
      const pz = 2.4 - k * 3.6;
      const py = k * 1.45;
      rbox(0.55, 2.1, 0.55, 0.04, 2, mCheek, sx * 2.95, py + 1.05, pz, `pilastro_lanterna_${sx > 0 ? 'dx' : 'sx'}_${k}`, M.root, true);
      creaLanterna(sx * 2.68, py + 2.45, pz, '#ffd07a', 0, 8, `lanterna_scala_${sx > 0 ? 'dx' : 'sx'}_${k}`);
    }
  }

  // Insegne Shop sulle facciate laterali & orologio pubblico
  creaInsegnaNeon(-4.58, 4.9, 1.8, 2.4, 0.68, Math.PI / 2, 'FREE TOKEN', {
    bg: '#172554', col: '#facc15', bordo: '#38bdf8', em: 0.45, nome: 'insegna_negozio_sx'
  });
  creaInsegnaNeon(4.58, 4.9, 1.8, 2.4, 0.68, -Math.PI / 2, 'LOOT PLAZA', {
    bg: '#3b0764', col: '#fde047', bordo: '#a855f7', em: 0.45, nome: 'insegna_negozio_dx'
  });
  cartello(M, { testo: 'VICTORY STAIRS', w: 2.2, h: 0.54, x: 0, y: totalH + 3.6, z: zTop - 2.02, ry: 0, fondo: '#0f172a', colore: '#fde047', bordo: '#f59e0b' });
  orologio(M, { x: -4.58, y: 6.2, z: -1.8, ry: Math.PI / 2, r: 0.55, ora: '23:14', cornice: '#38bdf8' });

  // Condizionatori murali vivi sui muri laterali + unità animati
  try {
    smorza(await vivo(M, 'condizionatore', { x: -4.45, y: 3.1, z: -3.2, ry: Math.PI / 2, s: 1.0 }));
    smorza(await vivo(M, 'condizionatore', { x: 4.45, y: 3.1, z: -3.2, ry: -Math.PI / 2, s: 1.0 }));
  } catch (e) { /* fallback silenzioso */ }

  // 3. Arredi & Prop Fortnite su Primo Piano, Secondo Piano e Sfondo (>= 24 oggetti nominati!)
  // Primo Piano Piazza (visibilissimi in campo largo Scena 0!)
  creaRebootVan(-3.3, 0, 4.2, 0.72, 0.45, 'reboot_van_piazza');
  creaVendingMachine(3.45, 0, 3.6, -0.55, 0.92, 'vending_piazza_dx');
  creaForziereFortnite(-2.55, 0, 5.6, 0.95, { tipo: 'oro', aperto: false, ry: 0.35, nome: 'forziere_piazza_sx' });
  creaForziereFortnite(2.45, 0, 5.4, 0.95, { tipo: 'blu', aperto: true, ry: -0.35, nome: 'forziere_piazza_dx' });
  creaBarileSlurp(-1.75, 0, 5.9, 0.95, 'barile_slurp_sx');
  creaBarileSlurp(1.85, 0, 6.0, 0.95, 'barile_slurp_dx');
  creaPozioneScudo(-1.15, 0, 5.3, 1.0, 'pozione_piazza_sx');
  creaPozioneScudo(1.20, 0, 5.3, 1.0, 'pozione_piazza_dx');
  creaCassaMunizioni(-2.15, 0, 4.3, 1.0, 0.25, 'munizioni_piazza_sx');
  creaPilaLingotti(2.05, 0, 4.3, 1.0, -0.20, 'lingotti_piazza_dx');
  creaVBuck3D(-1.35, 1.05, 4.2, 0.24, 'vbuck_piazza_sx');
  creaVBuck3D(1.35, 1.05, 4.2, 0.24, 'vbuck_piazza_dx');
  creaRastrellieraPicconi(3.75, 0, 1.1, -0.65, 'rastrelliera_piazza');
  creaSupplyDrop(-3.55, 0, 1.2, 0.85, 'supply_drop_piazza', { conPallone: true });

  // Cima della scalinata: Piedistallo, Forzieri Oro aperti, Pozioni e Trophy Tokens!
  const pedCima = rbox(1.75, 0.56, 1.75, 0.05, 2, mat('#1e293b', 0.60, 0.30, '#38bdf8', 0.24), 0, totalH + 0.28, zTop - 1.35, 'piedistallo_cima', M.root, true);
  creaForziereFortnite(-1.65, totalH, zTop - 1.05, 0.92, { tipo: 'oro', aperto: true, ry: 0.30, nome: 'forziere_cima_sx' });
  creaForziereFortnite(1.65, totalH, zTop - 1.05, 0.92, { tipo: 'oro', aperto: true, ry: -0.30, nome: 'forziere_cima_dx' });
  creaBarileSlurp(-2.25, totalH, zTop - 0.1, 0.85, 'slurp_cima_sx');
  creaBarileSlurp(2.25, totalH, zTop - 0.1, 0.85, 'slurp_cima_dx');
  creaPilaLingotti(-1.05, totalH, zTop - 0.35, 1.05, 0.18, 'lingotti_cima_sx');
  creaPilaLingotti(1.05, totalH, zTop - 0.35, 1.05, -0.18, 'lingotti_cima_dx');

  // Cono di luce sacra sopra il gettone finale (nella Scena 10 il gettone è reso a schermo ancorato alle mani 'trofeo')
  const yTokBase = isFinale ? totalH + 2.55 : totalH + 1.35;
  const tok = creaGettone3D(0, yTokBase, zTop - 1.15, isFinale ? 0.38 : 0.56, 'gettone_supremo', {
    rot: isFinale ? 0.10 : 0.22,
    floatAmp: isFinale ? 0 : 0.05
  });
  if (isFinale) {
    tok.visible = false;
  }
  creaCono3D(0, totalH + 3.2, zTop - 1.15, 2.55, 6.5, '#ffe28a', isFinale ? 0.08 : 0.07, 0, 0, 'raggio_vittoria');

  // Minuteria Fortnite visibile sui primi gradini della scalinata (0.00 s!) e sulla terrazza alta (Scena 10)
  creaMinuteriaFortnite(-1.85, stepH * 1, stepStartZ - stepD * 0, 'mini_scudo', 'mini_scudo_sx');
  creaMinuteriaFortnite(-0.95, stepH * 2, stepStartZ - stepD * 1, 'lingotto_singolo', 'lingotto_piazza_sx');
  creaMinuteriaFortnite(0.95, stepH * 2, stepStartZ - stepD * 1, 'lattina_slurp', 'slurp_can_piazza');
  creaMinuteriaFortnite(1.85, stepH * 1, stepStartZ - stepD * 0, 'mini_vbuck', 'mini_vbuck_piazza');
  creaMinuteriaFortnite(-1.45, stepH * 4, stepStartZ - stepD * 3, 'scatola_colpi', 'colpi_centro_piazza');
  creaMinuteriaFortnite(1.45, stepH * 4, stepStartZ - stepD * 3, 'mini_scudo', 'mini_scudo_dx');
  creaMinuteriaFortnite(-1.95, stepH * 6, stepStartZ - stepD * 5, 'scatola_colpi', 'colpi_piazza_sx');
  creaMinuteriaFortnite(1.95, stepH * 6, stepStartZ - stepD * 5, 'lingotto_singolo', 'lingotto_piazza_dx');
  // Minuteria alta in cima alla scalinata (visibile anche in Scena 10)
  creaMinuteriaFortnite(-0.95, totalH, zTop - 0.15, 'mini_vbuck', 'mini_vbuck_cima_sx');
  creaMinuteriaFortnite(0.95, totalH, zTop - 0.15, 'mini_scudo', 'mini_scudo_cima_dx');

  // Battle Bus volante sullo skyline alto & Animali GLB a misura reale (Llama 0.17 = ~1 m, Eagle 0.24)
  creaBattleBus(-2.6, totalH + 5.6, zTop - 6.8, 0.85, 0.38, 'battle_bus_notte');
  try {
    smorza(await animato(M, 'Llama', { x: 2.35, y: 0, z: 2.3, ry: -0.8, s: 0.17, anim: 'Idle', vel: 0.7 }));
    const eag = smorza(await animato(M, 'Eagle', { x: -3.2, y: totalH + 3.8, z: -2.0, alt: 0, s: 0.24, anim: 'Fly', percorso: [[-4.8, -4.5], [4.8, -1.5], [-4.8, -4.5]], vel: 0.42 }));
    if (eag && eag.traverse) eag.traverse(c => { if (c.isMesh) c.castShadow = false; });
  } catch (e) { /* animato opzionale se glb lento */ }

  // 4. Posizionamento verticale reale degli attori (eseguito ANCHE pre-render su f=0 in anteprima!)
  const findHero = () => M.root.children.find(c => c.userData && c.userData.vivo === 'attore');
  sharedState.apexPos = new T.Vector3(0, yTokBase, zTop - 1.15);

  const syncTempio = t => {
    const tLocal = cl(t - (sc.da || 0), 0, 3);
    const hero = findHero();

    if (!isFinale) {
      const uClimb = ss(inv(0.05, 1.48, tLocal));
      const zNow = 3.55 - uClimb * 2.55;
      const stepIdx = cl((stepStartZ - zNow) / stepD, 0, N - 1);
      const yNow = stepIdx * stepH;
      if (hero) hero.position.y = yNow;
      sharedState.apexPos.set(0, yTokBase, zTop - 1.15);
      return;
    }

    // Scena 10: VITTORIA finale — Eroe saldamente in cima al piedistallo (yPed = 5.18) a due mani 'trofeo'
    const yPed = totalH + 0.56;
    const zPed = zTop - 1.25;
    if (hero) {
      hero.position.set(0, yPed, zPed);
    }
    const tokY = yPed + 2.02 + Math.sin(t * 2.2) * 0.02;
    tok.position.set(0, tokY, zPed + 0.12);
    sharedState.apexPos.set(0, tokY, zPed + 0.12);
  };

  sharedState.preFrame = syncTempio;
  M.tick.push(syncTempio);
}
