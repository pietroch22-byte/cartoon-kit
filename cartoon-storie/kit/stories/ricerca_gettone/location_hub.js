// Location 2: sala_tattica — Base Comando Tattica Fortnite × Rick (Scene 1, 2, 5, 6, 9)
import { animato } from '/web/animati.js';
import { vivo } from '/web/vivi.js';
import { cartello, orologio } from '/web/buon_senso.js';
import { creaToolkit, cl, inv, ss, ss5 } from './arredi_fortnite.js';

export async function costruisciSalaTattica(M, D, OBJ, sc, sharedState) {
  const K = creaToolkit(M);
  const {
    T, sm, rbox, setStr, addGrp, live, noInkTree, mat, smorza, emi, dipinto, tex, luce,
    creaStanzaTattica, creaGettone3D, creaForziereFortnite, creaVendingMachine,
    creaTavoloOlogramma, creaBarileSlurp, creaPozioneScudo, creaVBuck3D,
    creaSupplyDrop, creaRastrellieraPicconi, creaCassaMunizioni,
    creaPilaLingotti, creaScrivaniaTattica, creaCono3D, creaInsegnaNeon, creaMinuteriaFortnite
  } = K;

  const zona = sc.zona || 'scelta';

  // Stanza chiusa con palette calda del nostro motore (sabbia/crema, boiserie noce, pavimento pietra calda)
  creaStanzaTattica(16.0, 5.4, 15.0, -1.8, {
    wallBg: '#cfc2ad', wallTrim: '#7a5c44', stripe: '#b8893e',
    floorBg: '#7a6c5e', floorAlt: '#6b5e52', floorAcc: '#9c8264',
    ceilBg: '#dfd3be', zocCol: '#5c4330', texRep: [4, 4]
  });

  // 3 luci calde da soffitto stabili (nei chiusi il motore usa fino a 3 PointLight: zero salti di luce!)
  luce('#ffe2b0', 3.2, 0, 4.7, -2.5, 24);
  luce('#ffd89a', 2.8, 0, 4.5, -5.8, 24);
  luce('#ffe8bf', 2.5, 0, 4.3, 1.4, 20);

  // Pannelli luminosi caldi incassati nel soffitto
  for (const cz of [-6.4, -2.4, 1.4]) {
    const pan = sm(4.4, 0.08, 1.35, emi('#ffe8bf', 0.44), 0, 5.34, cz, `plafoniera_${cz}`, true);
    live(pan, 'lampeggia', { min: 0.96, freq: 0.24 });
  }

  // Parete di fondo (z = -9.15): Porta scorrevole automatica hangar + Insegna & Orologio
  try {
    smorza(await vivo(M, 'porta_scorrevole', { x: 0, y: 0, z: -9.02, s: 1.05 }));
    smorza(await vivo(M, 'ventilatore_soffitto', { x: -3.2, y: 5.25, z: -3.8, s: 0.95 }));
    smorza(await vivo(M, 'ventilatore_soffitto', { x: 3.2, y: 5.25, z: -3.8, s: 0.95 }));
  } catch (e) { /* fallback silenzioso */ }

  creaInsegnaNeon(0, 3.45, -9.05, 3.8, 0.72, 0, 'BASE COMANDO • 14 GIORNI', {
    bg: '#172554', col: '#fde047', bordo: '#38bdf8', em: 0.42, nome: 'insegna_fondo_hub'
  });
  orologio(M, { x: -3.2, y: 3.2, z: -9.08, ry: 0, r: 0.46, ora: '14:00', cornice: '#facc15' });
  cartello(M, { testo: 'STORM TRACKER', w: 2.0, h: 0.52, x: 3.2, y: 3.2, z: -9.08, ry: 0, fondo: '#0f172a', colore: '#67e8f9', bordo: '#a855f7' });

  // Maxischermo tattico radar sinistro/destro sulle pareti
  const radTex = tex(512, 256, (c, W, H) => {
    c.fillStyle = '#0c1c38'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#38bdf8'; c.lineWidth = 6; c.strokeRect(8, 8, W - 16, H - 16);
    c.strokeStyle = 'rgba(56, 189, 248, 0.25)'; c.lineWidth = 2;
    for (let x = 64; x < W; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (let y = 64; y < H; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    // Cerchi storm & tracciato rotta
    c.strokeStyle = '#a855f7'; c.lineWidth = 5;
    c.beginPath(); c.arc(170, 128, 78, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = '#facc15'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(60, 200); c.lineTo(170, 128); c.lineTo(390, 92); c.stroke();
    c.fillStyle = '#fde047';
    c.font = '900 28px sans-serif';
    c.fillText('TOKEN SIGNAL: ACTIVE', 235, 195);
  });
  const radarWall = addGrp(-5.8, 2.55, -7.2, 'schermo_radar_hub');
  radarWall.rotation.y = 0.52;
  radarWall.add(
    new T.Mesh(new T.BoxGeometry(2.8, 1.48, 0.12), mat('#0f172a', 0.6, 0.3)),
    (() => {
      const p = new T.Mesh(new T.PlaneGeometry(2.64, 1.32), dipinto(radTex, 0.28, 0.45));
      p.position.z = 0.068;
      return p;
    })()
  );
  noInkTree(radarWall);
  live(radarWall, 'lampeggia', { min: 0.90, freq: 0.30, modo: 'respiro' });

  // Arredi fissi della Base Comando su tutte le celle (>= 20 prop nominati!)
  creaVendingMachine(-4.6, 0, -5.0, 0.55, 0.95, 'vending_hub_sx');
  creaRastrellieraPicconi(4.6, 0, -5.0, -0.55, 'rastrelliera_hub_dx');
  creaScrivaniaTattica(-4.5, 0, -1.8, 0.65, 'scrivania_hub_sx');
  creaScrivaniaTattica(4.5, 0, -1.8, -0.65, 'scrivania_hub_dx');

  creaBarileSlurp(-3.4, 0, -7.1, 0.95, 'slurp_fondo_sx');
  creaBarileSlurp(3.4, 0, -7.1, 0.95, 'slurp_fondo_dx');
  creaSupplyDrop(-5.4, 0, -3.3, 0.85, 'supply_hub_sx', { conPallone: false });
  creaForziereFortnite(5.2, 0, -3.4, 0.88, { tipo: 'oro', aperto: true, ry: -0.45, nome: 'forziere_hub_dx' });
  creaForziereFortnite(-2.8, 0, 0.4, 0.85, { tipo: 'blu', aperto: false, ry: 0.42, nome: 'forziere_primo_sx' });
  creaForziereFortnite(2.8, 0, 0.4, 0.85, { tipo: 'oro', aperto: true, ry: -0.42, nome: 'forziere_primo_dx' });
  creaPozioneScudo(-2.1, 0, 1.5, 1.0, 'pozione_hub_sx');
  creaPozioneScudo(2.1, 0, 1.5, 1.0, 'pozione_hub_dx');
  creaCassaMunizioni(-3.1, 0, 1.7, 1.0, 0.30, 'munizioni_hub_sx');
  creaPilaLingotti(3.1, 0, 1.7, 1.0, -0.30, 'lingotti_hub_dx');
  creaVBuck3D(-1.75, 1.15, -0.6, 0.22, 'vbuck_hub_sx');
  creaVBuck3D(1.75, 1.15, -0.6, 0.22, 'vbuck_hub_dx');

  // Minuteria Fortnite ben dentro l'inquadratura fin da 1.53 s (ricchezza >= 5 piccoli su tutte le scene!)
  creaMinuteriaFortnite(-1.85, 0, -1.0, 'mini_scudo', 'hub_mini_scudo_sx');
  creaMinuteriaFortnite(-0.95, 0, -1.2, 'scatola_colpi', 'hub_colpi_sx');
  creaMinuteriaFortnite(0.0, 0, -1.1, 'lingotto_singolo', 'hub_lingotto_centro');
  creaMinuteriaFortnite(0.95, 0, -1.2, 'lattina_slurp', 'hub_slurp_dx');
  creaMinuteriaFortnite(1.85, 0, -1.0, 'mini_vbuck', 'hub_vbuck_dx');
  creaMinuteriaFortnite(-2.25, 0, -2.1, 'lingotto_singolo', 'hub_lingotto_lat_sx');
  creaMinuteriaFortnite(2.25, 0, -2.1, 'mini_scudo', 'hub_mini_scudo_lat_dx');
  creaMinuteriaFortnite(-1.55, 0, -3.1, 'mini_vbuck', 'hub_vbuck_mid_sx');
  creaMinuteriaFortnite(1.55, 0, -3.1, 'scatola_colpi', 'hub_colpi_mid_dx');

  // Cane mascotte a scala reale (~0.68 m) accanto al tavolo tattico
  try {
    smorza(await animato(M, 'Dog', { x: 1.95, y: 0, z: -2.0, ry: -0.65, s: 0.16, anim: 'Idle', vel: 0.8 }));
  } catch (e) { /* opzionale */ }

  // Configurazione specifica per ZONA (scelta, portale, errore, azione, notte)
  let tokenCenter = null;

  if (zona === 'scelta') {
    // Tavolo ologramma centrale tra cacciatore e compagno
    creaTavoloOlogramma(0.15, 0, -4.3, 2.2, 1.5, 0, 'tavolo_isola_comando');
    creaBarileSlurp(-1.6, 0, -4.8, 0.90, 'slurp_centro_sx');
    creaPilaLingotti(1.7, 0, -4.8, 1.0, -0.25, 'lingotti_centro_dx');
  } else if (zona === 'portale') {
    // Piedistallo Portale centrale con Gettone pronto allo zoom 'NOW.'
    const pedP = rbox(1.5, 0.95, 1.5, 0.06, 2, mat('#1e293b', 0.48, 0.42, '#0ea5e9', 0.30), 0, 0.475, -4.6, 'piedistallo_portale', M.root, true);
    const arc = new T.Mesh(new T.TorusGeometry(1.42, 0.11, 14, 40), mat('#38bdf8', 0.32, 0.45, '#0284c7', 0.48));
    arc.position.set(0, 2.05, -4.9);
    arc.name = 'anello_portale';
    arc.userData.noInk = true;
    M.root.add(arc);
    live(arc, 'galleggia', { amp: 0.03, freq: 0.36, gira: 0.10 });
    creaCono3D(0, 2.8, -4.6, 1.65, 5.4, '#ffe27a', 0.11, 0, 0, 'cono_portale');
    tokenCenter = creaGettone3D(0, 1.75, -4.6, 0.56, 'gettone_portale', { rot: 0.28, floatAmp: 0.04 });
    sharedState.apexPos = new T.Vector3(0, 1.75, -4.6);
  } else if (zona === 'errore') {
    // Wing Analisi Fallimenti: 2 forzieri aperti vuoti + lavagna tattica "FAILED LOG"
    creaForziereFortnite(-0.95, 0, -4.4, 1.05, { tipo: 'blu', aperto: true, ry: 0.25, nome: 'forziere_vuoto_sx' });
    creaForziereFortnite(0.95, 0, -4.4, 1.05, { tipo: 'blu', aperto: true, ry: -0.25, nome: 'forziere_vuoto_dx' });
    creaInsegnaNeon(0, 2.75, -5.6, 3.0, 0.95, 0, 'EMPTY CHEST LOG: 99%', {
      bg: '#1e293b', col: '#fca5a5', bordo: '#ef4444', em: 0.40, nome: 'lavagna_analisi_errore'
    });
  } else if (zona === 'azione') {
    // Piedistallo Focus centrale + piste a pavimento azzurro -> oro
    rbox(1.2, 0.72, 1.2, 0.05, 2, mat('#1e293b', 0.55, 0.35, '#0f172a', 0.24), 0, 0.36, -4.7, 'piedistallo_azione', M.root, true);
    tokenCenter = creaGettone3D(0, 1.55, -4.7, 0.48, 'gettone_azione', { rot: 0.24, floatAmp: 0.03 });
    tokenCenter.visible = false; // appare esattamente su "focus." a 12.45 s!
    sharedState.apexPos = new T.Vector3(0, 1.55, -4.7);
  } else {
    // 'notte': Riflettore notturno caldo su terminale della perseveranza
    creaCono3D(0, 2.9, -4.4, 1.85, 5.6, '#fde68a', 0.13, 0, 0, 'riflettore_notte');
    creaTavoloOlogramma(1.35, 0, -4.8, 1.8, 1.3, -0.25, 'console_notte_dx');
    creaForziereFortnite(-1.45, 0, -4.5, 0.95, { tipo: 'oro', aperto: true, ry: 0.32, nome: 'forziere_notte_sx' });
  }

  // Tick visivo degli oggetti 3D (la recitazione degli attori è in ricerca_gettone.json)
  M.tick.push(t => {
    const tl = Math.max(0, t - (sc.da || 0));
    if (zona === 'azione' && tokenCenter) {
      tokenCenter.visible = tl >= 1.85; // ~12.42 s: si illumina su "focus."
      const uPop = ss5(inv(1.85, 2.25, tl));
      tokenCenter.scale.setScalar(0.4 + 0.65 * uPop);
    }
  });
}
