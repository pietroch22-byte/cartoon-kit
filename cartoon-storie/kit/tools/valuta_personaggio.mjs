// Mini-motore automatico di valutazione e iterazione dei personaggi stile Rick.
// Uso:
//   node kit/tools/valuta_personaggio.mjs --tipo <nome> [--out <scheda.png>]
//   node kit/tools/valuta_personaggio.mjs --tutti [--out-catalogo <file.png>] [--out-angoli <file.png>] [--prima <json> --out-confronto <file.png>]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const eng = path.resolve(here, '../../engine3d');
const assetKit = path.resolve(eng, '..', '..', 'asset-kit');

async function loadPlaywright() {
  const candidates = [path.join(eng, 'node_modules/playwright/index.mjs'), process.env.PLAYWRIGHT_MJS];
  try {
    candidates.push(path.join(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(), 'playwright/index.mjs'));
  } catch {}
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return (await import(pathToFileURL(p).href)).chromium;
  }
  throw new Error('Playwright non trovato: cd engine3d && npm install && npx playwright install chromium');
}

const argv = process.argv.slice(2);
const flag = k => argv.includes(k);
const val = (k, d = null) => {
  const i = argv.indexOf(k);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d;
};

const tipoArg = val('--tipo');
const tuttiFlag = flag('--tutti') || !tipoArg;
const outTipo = val('--out');
const outCatalogo = val('--out-catalogo');
const outAngoli = val('--out-angoli');
const primaPath = val('--prima');
const outConfronto = val('--out-confronto');

const primaCast = primaPath ? JSON.parse(fs.readFileSync(path.resolve(primaPath), 'utf8')) : null;

const TYPES = {
  '.js': 'text/javascript',
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const HTML_PAGE = `<!doctype html>
<html>
<head><meta charset="utf-8"><style>body{margin:0;background:#f4f1ea}</style></head>
<body>
<script type="module">
import { drawRick, calcolaWAdattato, caricaTessuti, TESTE, CORPI, RUOLI } from '/web/omino_rick.js';
import { CAST } from '/web/cast_rick.js';

await caricaTessuti('/kit/texture/');

const CW = 512, CH = 1024;
const VISTE = [
  { id: 'V1', label: 'V1 Fronte',       opt: { verso: 0,     posa: 'auto',   faccia: 'neutro',     seme: 1 } },
  { id: 'V2', label: 'V2 3/4 Parla',    opt: { verso: 0.55,  posa: 'auto',   faccia: 'felice',     bocca: 'aperta', gesto: 'spiega', gestoT: 0.4, seme: 2 } },
  { id: 'V3', label: 'V3 Profilo Cam',  opt: { verso: 0.92,  cammina: true,  passo: 0.22,          faccia: 'deciso', seme: 3 } },
  { id: 'V4', label: 'V4 Spalle',       opt: { verso: 0.35,  spalle: 1,      posa: 'auto',         seme: 4 } },
  { id: 'V5', label: 'V5 Seduto',       opt: { verso: -0.45, posa: 'seduto', faccia: 'pensieroso', seme: 5 } },
];

const HAT_TYPES = new Set(['cappello', 'berretto', 'elmetto', 'zuccotto', 'paglia', 'cuffia_medica', 'cuoco', 'basco', 'fedora']);
const FULL_COVER_HATS = new Set(['cappello', 'berretto', 'elmetto', 'zuccotto', 'paglia', 'cuffia_medica', 'cuoco', 'basco', 'fedora']);
const HAT_DEFAULTS = {
  cuoco: '#ffffff', cappello: '#7a4a2a', berretto: '#7a4a2a', fedora: '#292530',
  basco: '#463a4d', elmetto: '#f2c230', zuccotto: '#24222c', paglia: '#ebd07a', cuffia_medica: '#52a8b8'
};
const STRUCTURED_LAYERS = new Set([
  'giacca_revers', 'camice', 'grembiule', 'salopette', 'gilet', 'gilet_alta_vis',
  'felpa_cappuccio', 'zaino', 'collare_tuta', 'bavero_giudice', 'collo_pelliccia',
  'doppiopetto', 'tracolla', 'spalline', 'medaglie', 'sceriffo'
]);

function hexRgb(h) {
  if (!h || typeof h !== 'string' || h[0] !== '#' || h.length < 7) return null;
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function colorDist(a, b) {
  const A = Array.isArray(a) ? a : hexRgb(a);
  const B = Array.isArray(b) ? b : hexRgb(b);
  if (!A || !B) return 999;
  const dr = A[0] - B[0], dg = A[1] - B[1], db = A[2] - B[2];
  return Math.sqrt(0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db);
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function renderCharCanvas(cfg, overrideOpt = {}) {
  const c = makeCanvas(CW, CH);
  const g = c.getContext('2d', { willReadFrequently: true });
  const W = 270 * (cfg.W || 1);
  drawRick(g, { ...cfg, ...overrideOpt, W, x: 256, y: 980 });
  return c;
}

function getBboxAndBorders(cv) {
  const g = cv.getContext('2d', { willReadFrequently: true });
  const D = g.getImageData(0, 0, CW, CH).data;
  let minX = CW, maxX = -1, minY = CH, maxY = -1;
  let clipL = false, clipR = false, clipT = false, clipB = false;
  for (let y = 0; y < CH; y++) {
    for (let x = 0; x < CW; x++) {
      if (D[(y * CW + x) * 4 + 3] > 32) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x <= 4) clipL = true;
        if (x >= CW - 5) clipR = true;
        if (y <= 4) clipT = true;
        if (y >= CH - 5) clipB = true;
      }
    }
  }
  const edges = [];
  if (clipL) edges.push('sx');
  if (clipR) edges.push('dx');
  if (clipT) edges.push('alto');
  if (clipB) edges.push('basso');
  return { minX, maxX, minY, maxY, clipped: edges.length > 0, edges };
}

function countMouthPixels(cv, cfg) {
  const g = cv.getContext('2d', { willReadFrequently: true });
  const D = g.getImageData(0, 0, CW, CH).data;
  const W = calcolaWAdattato({ ...cfg, x: 256, y: 980 }, 270 * (cfg.W || 1));
  const TS = TESTE[cfg.testa] || TESTE.tonda;
  const CS = CORPI[cfg.corpo] || CORPI.fagiolo;
  const HH = W * TS.hw;
  const gambe = W * 0.93 * 1.4 * (cfg.gambe ?? CS.gambe ?? 1);
  const busto = W * 0.93 * 1.1 * (cfg.alto ?? CS.alto ?? 1);
  const hipY = 980 - gambe;
  const chinY = hipY - busto;
  const hcy = chinY - HH * 0.38;
  const sa = Math.sin(0.55 * Math.PI / 2);
  const fx = 256 + sa * W * 0.04 + sa * W * 0.27;
  const my = hcy + HH * 0.20;
  const x0 = Math.max(0, Math.floor(fx - W * 0.28));
  const x1 = Math.min(CW - 1, Math.ceil(fx + W * 0.28));
  const y0 = Math.max(0, Math.floor(my - W * 0.18));
  const y1 = Math.min(CH - 1, Math.ceil(my + W * 0.24));
  let cnt = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * CW + x) * 4;
      if (D[i + 3] < 200) continue;
      const rgb = [D[i], D[i + 1], D[i + 2]];
      if (colorDist(rgb, [84, 33, 42]) < 28 || colorDist(rgb, [217, 102, 107]) < 28) cnt++;
    }
  }
  return cnt;
}

function checkBackIntegrity(cv, cfg) {
  const g = cv.getContext('2d', { willReadFrequently: true });
  const D = g.getImageData(0, 0, CW, CH).data;
  const W = calcolaWAdattato({ ...cfg, x: 256, y: 980 }, 270 * (cfg.W || 1));
  const TS = TESTE[cfg.testa] || TESTE.tonda;
  const CS = CORPI[cfg.corpo] || CORPI.fagiolo;
  const HH = W * TS.hw;
  const gambe = W * 0.93 * 1.4 * (cfg.gambe ?? CS.gambe ?? 1);
  const busto = W * 0.93 * 1.1 * (cfg.alto ?? CS.alto ?? 1);
  const chinY = 980 - gambe - busto;
  const hcy = chinY - HH * 0.38;
  const hcx = 256 + Math.sin(0.35 * Math.PI / 2) * W * 0.04;
  const pelleRgb = hexRgb(cfg.pelle || '#fbf6f2');
  const x0 = Math.max(0, Math.floor(hcx - W * 0.28));
  const x1 = Math.min(CW - 1, Math.ceil(hcx + W * 0.28));
  const y0 = Math.max(0, Math.floor(hcy - HH * 0.38));
  const y1 = Math.min(CH - 1, Math.ceil(hcy + HH * 0.02));
  let total = 0, pelleCnt = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * CW + x) * 4;
      if (D[i + 3] < 180) continue;
      const rgb = [D[i], D[i + 1], D[i + 2]];
      total++;
      if (pelleRgb && colorDist(rgb, pelleRgb) < 18) pelleCnt++;
    }
  }
  const skinRatio = total ? pelleCnt / total : 0;
  const issues = [];
  const cap = cfg.capelliTipo || 'corti';
  if (cap !== 'pelato' && cap !== 'calvo_lati' && skinRatio > 0.45) {
    issues.push('nuca scoperta (' + Math.round(skinRatio * 100) + '% pelle)');
  }
  const cvFaceA = renderCharCanvas(cfg, { verso: 0.35, spalle: 1, posa: 'auto', faccia: 'sorpreso', bocca: 'urlo', seme: 4 });
  const cvFaceB = renderCharCanvas(cfg, { verso: 0.35, spalle: 1, posa: 'auto', faccia: 'neutro', bocca: 'chiusa', seme: 4 });
  const Da = cvFaceA.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, CW, CH).data;
  const Db = cvFaceB.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, CW, CH).data;
  let diffPx = 0;
  for (let i = 0; i < Da.length; i += 4) {
    if (Math.abs(Da[i] - Db[i]) > 6 || Math.abs(Da[i + 1] - Db[i + 1]) > 6 || Math.abs(Da[i + 2] - Db[i + 2]) > 6) diffPx++;
  }
  if (diffPx > 0) issues.push('tratti facciali sul retro (' + diffPx + 'px)');
  return issues;
}

function checkThumbLegibility(cvThumb) {
  const g = cvThumb.getContext('2d', { willReadFrequently: true });
  const w = cvThumb.width, h = cvThumb.height;
  const D = g.getImageData(0, 0, w, h).data;
  const inkRgb = [42, 26, 38];
  let opaque = 0, inkCnt = 0;
  const clusters = [];
  for (let i = 0; i < D.length; i += 4) {
    if (D[i + 3] < 180) continue;
    opaque++;
    const rgb = [D[i], D[i + 1], D[i + 2]];
    if (colorDist(rgb, inkRgb) < 38) {
      inkCnt++;
      continue;
    }
    let found = false;
    for (let c = 0; c < clusters.length; c++) {
      if (colorDist(rgb, clusters[c].rgb) < 34) {
        clusters[c].n++;
        found = true;
        break;
      }
    }
    if (!found && clusters.length < 32) clusters.push({ rgb, n: 1 });
  }
  const bigClusters = clusters.filter(c => c.n >= 10).length;
  const area = opaque / (w * h);
  return { area, inkCnt, bigClusters, ok: area >= 0.04 && inkCnt >= 40 && bigClusters >= 3 };
}

function checkContrast(cfg) {
  const issues = [];
  const cap = cfg.capelliTipo || 'corti';
  const pelle = cfg.pelle || '#fbf6f2';
  const capelli = cfg.capelli || '#26222a';
  const maglia = cfg.maglia || '#4f8fdc';
  const V = new Set(cfg.vestito || []);
  const acc = new Set([...(cfg.accessori || []), ...(RUOLI[cfg.ruolo] || [])]);

  if (cap !== 'pelato' && !FULL_COVER_HATS.has(cap)) {
    const d = colorDist(pelle, capelli);
    if (d < 18) issues.push('CONTRASTO_BASSO (pelle/capelli dE=' + d.toFixed(1) + ')');
  }
  if (HAT_TYPES.has(cap)) {
    const hatCol = cfg.cappelloCol || HAT_DEFAULTS[cap];
    const d = colorDist(pelle, hatCol);
    if (d < 18) issues.push('CONTRASTO_BASSO (pelle/cappello dE=' + d.toFixed(1) + ')');
  }

  const layerChecks = [];
  if (V.has('grembiule')) layerChecks.push(['grembiule', cfg.grembiuleCol || '#ffffff', maglia]);
  if (V.has('camice')) layerChecks.push(['camice', '#f6f6fa', maglia]);
  if (V.has('giacca_revers')) layerChecks.push(['camicia_revers', cfg.camiciaCol || (V.has('dolcevita') ? (cfg.dolcevitaCol || '#23212a') : '#f4f1ea'), maglia]);
  if (V.has('dolcevita') && !V.has('giacca_revers') && cfg.dolcevitaCol) layerChecks.push(['dolcevita', cfg.dolcevitaCol, maglia]);
  if (acc.has('cravatta')) layerChecks.push(['cravatta', cfg.cravattaCol || '#2d4a9a', V.has('giacca_revers') ? (cfg.camiciaCol || '#f4f1ea') : maglia]);
  if (V.has('bretelle')) layerChecks.push(['bretelle', cfg.bretelleCol || '#7a3a2a', maglia]);
  if (V.has('gilet')) layerChecks.push(['gilet', cfg.giletCol || '#5a3842', maglia]);
  if (V.has('salopette')) layerChecks.push(['salopette', cfg.salopetteCol || '#36588a', maglia]);
  if (V.has('gilet_alta_vis')) layerChecks.push(['alta_vis', cfg.altaVisCol || '#d8f032', maglia]);
  if (V.has('colletto') && !V.has('camice') && !V.has('giacca_revers')) layerChecks.push(['colletto', cfg.collettoCol || '#ffffff', maglia]);

  for (const [label, c1, c2] of layerChecks) {
    const d = colorDist(c1, c2);
    if (d < 20) issues.push('CONTRASTO_BASSO (' + label + ' dE=' + d.toFixed(1) + ')');
  }
  return issues;
}

function scoreRichness(cfg) {
  const cap = cfg.capelliTipo || 'corti';
  const V = new Set(cfg.vestito || []);
  const acc = new Set([...(cfg.accessori || []), ...(RUOLI[cfg.ruolo] || [])]);

  // 1) Testa/Capelli/Copricapo (max 25)
  let z1 = 5;
  if ((cfg.testa && cfg.testa !== 'tonda') || (cfg.W && cfg.W !== 1)) z1 += 4;
  if (!['corti', 'riga', 'frangia', 'pelato'].includes(cap)) z1 += 13;
  else z1 += 8;
  if (cfg.cappelloCol || cfg.fasciaCol || cfg.elmettoStemma || (HAT_TYPES.has(cap) && acc.size > 0)) z1 += 4;
  z1 = Math.min(25, z1);

  // 2) Volto e Carattere (max 25)
  let z2 = 5;
  if (cfg.corpo === 'bambino') z2 = 12;
  else if (cfg.testa && cfg.testa !== 'tonda') z2 += 4;
  if (cfg.pelle && cfg.pelle.toLowerCase() !== '#fbf6f2') z2 += 3;
  z2 += acc.size * 8;
  if (cfg.occhialiTipo || cfg.baffiTipo || cfg.mascherinaCol) z2 += 3;
  z2 = Math.min(25, z2);

  // 3) Stratificazione Busto (max 30)
  let z3 = Math.min(18, V.size * 6);
  const hasStruct = [...V].some(x => STRUCTURED_LAYERS.has(x));
  if (hasStruct) z3 += 8;
  if (cfg.tessuto) z3 += 4;
  const hasCustomCols = Boolean(cfg.gonna || cfg.camiciaCol || cfg.grembiuleCol || cfg.collettoCol || cfg.salopetteCol || cfg.giletCol || cfg.cravattaCol || cfg.dolcevitaCol || cfg.sciarpaCol || cfg.fazzolettoCol || cfg.bandanaCol || cfg.zainoCol || cfg.altaVisCol || cfg.pellicciaCol || cfg.tracollaCol || cfg.spallineCol);
  if (hasCustomCols) z3 += 4;
  z3 = Math.min(30, z3);

  // 4) Proporzioni e Calzature/Accessorio di ruolo (max 20)
  let z4 = 0;
  const hasCustomProp = (cfg.corpo && cfg.corpo !== 'fagiolo') || cfg.gambe || cfg.largo || (cfg.W && cfg.W !== 1);
  z4 += hasCustomProp ? 8 : 4;
  if (cfg.scarpeTipo && cfg.scarpeTipo !== 'classiche') z4 += 6;
  if (cfg.scarpeBicolore) z4 += 2;
  if (cfg.ruolo || HAT_TYPES.has(cap) || acc.size >= 2 || V.size >= 3 || hasStruct) z4 += 6;
  z4 = Math.min(20, z4);

  return { total: z1 + z2 + z3 + z4, zones: [z1, z2, z3, z4] };
}

window.valutaPersonaggio = (nome, cfg) => {
  const avvisi = [];
  const canvases = {};
  const bboxes = {};

  for (const v of VISTE) {
    const cv = renderCharCanvas(cfg, v.opt);
    canvases[v.id] = cv;
    const bb = getBboxAndBorders(cv);
    bboxes[v.id] = bb;
    if (bb.clipped) avvisi.push('BORDO_TAGLIATO (' + v.label + ': ' + bb.edges.join(',') + ' [' + bb.minX + ',' + bb.minY + '..' + bb.maxX + ',' + bb.maxY + '])');
  }

  // V6 Miniatura Lontana 96x192
  const cvV6Full = renderCharCanvas(cfg, { verso: 0.2, posa: 'auto', faccia: 'neutro', zoomFaccia: 1.45, seme: 1 });
  const cvV6 = makeCanvas(96, 192);
  const g6 = cvV6.getContext('2d', { willReadFrequently: true });
  g6.imageSmoothingEnabled = true;
  g6.imageSmoothingQuality = 'high';
  g6.drawImage(cvV6Full, 0, 0, 96, 192);
  canvases.V6 = cvV6;

  // Check BOCCA_COPERTA
  const accList = [...(cfg.accessori || []), ...(RUOLI[cfg.ruolo] || [])];
  const vestList = [...(cfg.vestito || [])];
  const mouthCoverAcc = new Set(['baffi', 'barba', 'pizzetto', 'sciarpa', 'mascherina']);
  const hasMouthRisk = accList.some(a => mouthCoverAcc.has(a)) || vestList.includes('foulard');
  const hasMascherinaSu = Boolean(cfg.mascherinaSu);
  let mouthRatio = 1;
  if (hasMouthRisk && !hasMascherinaSu) {
    const withAcc = countMouthPixels(canvases.V2, cfg);
    const cleanCfg = {
      ...cfg,
      ruolo: undefined,
      accessori: accList.filter(a => !mouthCoverAcc.has(a)),
      vestito: vestList.filter(v => v !== 'foulard'),
    };
    const cvClean = renderCharCanvas(cleanCfg, VISTE[1].opt);
    const noAcc = countMouthPixels(cvClean, cleanCfg);
    mouthRatio = noAcc > 0 ? withAcc / noAcc : 1;
    if (noAcc >= 10 && mouthRatio < 0.70) {
      avvisi.push('BOCCA_COPERTA (visibile ' + Math.round(mouthRatio * 100) + '%)');
    }
  }

  // Check CONTRASTO_STRATI
  for (const cIssue of checkContrast(cfg)) avvisi.push(cIssue);

  // Check SPALLE_INTEGRE
  for (const sIssue of checkBackIntegrity(canvases.V4, cfg)) {
    avvisi.push('SPALLE_INTEGRE (' + sIssue + ')');
  }

  // Check LEGGIBILITA_LONTANO
  const thumb = checkThumbLegibility(cvV6);
  if (!thumb.ok) {
    avvisi.push('LEGGIBILITA_LONTANO (cluster=' + thumb.bigClusters + ', ink=' + thumb.inkCnt + ')');
  }

  // Check RICCHEZZA_RUOLO
  const rich = scoreRichness(cfg);
  if (rich.total < 75) {
    avvisi.push('PERSONAGGIO_POVERO (punteggio=' + rich.total + ')');
  }

  return {
    nome,
    score: rich.total,
    zones: rich.zones,
    thumb,
    mouthRatio,
    bboxes,
    avvisi,
    canvases
  };
};

window.renderSchedinaSingola = (nome, cfg) => {
  const res = window.valutaPersonaggio(nome, cfg);
  const cols = 6, cellW = 240, cellH = 480, pad = 16, hdrH = 92;
  const out = makeCanvas(cols * cellW + (cols + 1) * pad, hdrH + cellH + pad * 2);
  const g = out.getContext('2d');
  g.fillStyle = '#f4f1ea';
  g.fillRect(0, 0, out.width, out.height);

  g.fillStyle = '#2a1a26';
  g.fillRect(0, 0, out.width, hdrH);
  g.fillStyle = '#ffffff';
  g.font = 'bold 26px sans-serif';
  g.fillText(nome.toUpperCase() + '  —  Punteggio: ' + res.score + '/100  (Z=' + res.zones.join('/') + ')', 24, 36);
  g.font = '18px sans-serif';
  g.fillStyle = res.avvisi.length ? '#ff9d8f' : '#8ef0a8';
  g.fillText(res.avvisi.length ? 'AVVISI: ' + res.avvisi.join(' | ') : 'OK — 0 avvisi', 24, 68);

  const labels = ['V1 Fronte', 'V2 3/4 Parla', 'V3 Profilo Cam', 'V4 Spalle', 'V5 Seduto', 'V6 Lontano 10%'];
  const keys = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
  keys.forEach((k, idx) => {
    const x = pad + idx * (cellW + pad), y = hdrH + pad;
    g.fillStyle = '#ffffff';
    g.fillRect(x, y, cellW, cellH);
    g.strokeStyle = '#d4cec2';
    g.lineWidth = 2;
    g.strokeRect(x, y, cellW, cellH);
    const cv = res.canvases[k];
    if (k === 'V6') {
      g.imageSmoothingEnabled = false;
      g.drawImage(cv, x + (cellW - 96) / 2, y + (cellH - 192) / 2, 96, 192);
    } else {
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = 'high';
      g.drawImage(cv, x, y, cellW, cellH);
    }
    g.fillStyle = '#2a1a26';
    g.font = 'bold 16px sans-serif';
    g.fillText(labels[idx], x + 10, y + 24);
  });
  return { dataUrl: out.toDataURL('image/png'), res: { nome: res.nome, score: res.score, zones: res.zones, avvisi: res.avvisi, thumb: res.thumb } };
};

window.valutaCastCompleto = (primaMap = null) => {
  const names = Object.keys(CAST);
  const results = [];
  for (const name of names) {
    const r = window.valutaPersonaggio(name, CAST[name]);
    results.push({
      nome: name,
      cfg: CAST[name],
      score: r.score,
      zones: r.zones,
      avvisi: [...r.avvisi],
      thumb: r.thumb,
    });
  }

  // Check UNICITA_CAST
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const aName = names[i], bName = names[j];
      const A = CAST[aName], B = CAST[bName];
      const sameHead = (A.testa || 'tonda') === (B.testa || 'tonda');
      const sameBody = (A.corpo || 'fagiolo') === (B.corpo || 'fagiolo');
      const sameHair = (A.capelliTipo || 'corti') === (B.capelliTipo || 'corti');
      const dShirt = colorDist(A.maglia || '#4f8fdc', B.maglia || '#4f8fdc');
      if (sameHead && sameBody && sameHair) {
        results[i].avvisi.push('DOPPIO_SIMILE (con ' + bName + ': stessa testa+corpo+capelli)');
        results[j].avvisi.push('DOPPIO_SIMILE (con ' + aName + ': stessa testa+corpo+capelli)');
      } else if (sameHair && sameBody && dShirt < 22) {
        results[i].avvisi.push('DOPPIO_SIMILE (con ' + bName + ': stesso corpo+capelli+colore)');
        results[j].avvisi.push('DOPPIO_SIMILE (con ' + aName + ': stesso corpo+capelli+colore)');
      }
    }
  }
  return results;
};

window.renderCatalogo = (results) => {
  const cols = 8, rows = Math.ceil(results.length / cols);
  const cellW = 240, cellH = 440, pad = 16, hdrH = 74;
  const out = makeCanvas(cols * cellW + (cols + 1) * pad, hdrH + rows * (cellH + pad) + pad);
  const g = out.getContext('2d');
  g.fillStyle = '#f4f1ea';
  g.fillRect(0, 0, out.width, out.height);
  g.fillStyle = '#2a1a26';
  g.fillRect(0, 0, out.width, hdrH);
  g.fillStyle = '#ffffff';
  g.font = 'bold 28px sans-serif';
  const totOk = results.filter(r => r.avvisi.length === 0).length;
  g.fillText('CAST RICK COMPLETO (' + results.length + ' personaggi) — ' + totOk + '/' + results.length + ' senza avvisi', 24, 46);

  results.forEach((r, idx) => {
    const col = idx % cols, row = Math.floor(idx / cols);
    const x = pad + col * (cellW + pad), y = hdrH + pad + row * (cellH + pad);
    g.fillStyle = '#ffffff';
    g.fillRect(x, y, cellW, cellH);
    g.strokeStyle = r.avvisi.length ? '#d9483b' : '#d4cec2';
    g.lineWidth = r.avvisi.length ? 3 : 2;
    g.strokeRect(x, y, cellW, cellH);

    const cv = renderCharCanvas(r.cfg, { verso: 0.25, posa: 'auto', faccia: 'felice', seme: idx + 1 });
    g.drawImage(cv, x + 20, y + 34, 200, 400);

    g.fillStyle = r.avvisi.length ? '#c83228' : '#2a1a26';
    g.font = 'bold 18px sans-serif';
    g.fillText((idx + 1) + '. ' + r.nome, x + 10, y + 24);
    g.font = 'bold 15px sans-serif';
    g.fillStyle = r.score >= 80 ? '#2b7a4b' : '#b8621c';
    g.fillText(r.score + 'pt', x + cellW - 48, y + 24);
    if (r.cfg.folla === false) {
      g.fillStyle = '#7a6890';
      g.font = 'bold 12px sans-serif';
      g.fillText('SPECIALE', x + 10, y + 42);
    }
  });
  return out.toDataURL('image/png');
};

window.renderAngoli = (names) => {
  const cols = 5, cellW = 190, cellH = 380, pad = 10, lblW = 180, hdrH = 68;
  const rowH = cellH + pad;
  const out = makeCanvas(lblW + cols * (cellW + pad) + pad, hdrH + names.length * rowH + pad);
  const g = out.getContext('2d');
  g.fillStyle = '#f4f1ea';
  g.fillRect(0, 0, out.width, out.height);
  g.fillStyle = '#2a1a26';
  g.fillRect(0, 0, out.width, hdrH);
  g.fillStyle = '#ffffff';
  g.font = 'bold 26px sans-serif';
  g.fillText('MULTI-ANGOLO NUOVI ARCHETIPI (' + names.length + ' personaggi x 5 viste)', 20, 44);

  names.forEach((name, rIdx) => {
    const y = hdrH + pad + rIdx * rowH;
    g.fillStyle = '#ebe6dc';
    g.fillRect(pad, y, lblW - pad * 2, cellH);
    g.fillStyle = '#2a1a26';
    g.font = 'bold 20px sans-serif';
    g.fillText(name, pad + 12, y + 40);
    g.font = '14px sans-serif';
    const cfg = CAST[name];
    g.fillText('testa: ' + (cfg.testa || 'tonda'), pad + 12, y + 72);
    g.fillText('corpo: ' + (cfg.corpo || 'fagiolo'), pad + 12, y + 94);
    g.fillText('cap: ' + (cfg.capelliTipo || 'corti'), pad + 12, y + 116);
    if (cfg.folla === false) {
      g.fillStyle = '#7a3a6a';
      g.font = 'bold 14px sans-serif';
      g.fillText('folla: false', pad + 12, y + 144);
    }
    VISTE.forEach((v, cIdx) => {
      const x = lblW + pad + cIdx * (cellW + pad);
      g.fillStyle = '#ffffff';
      g.fillRect(x, y, cellW, cellH);
      g.strokeStyle = '#d4cec2';
      g.lineWidth = 1.5;
      g.strokeRect(x, y, cellW, cellH);
      const cv = renderCharCanvas(cfg, v.opt);
      g.drawImage(cv, x, y + 14, cellW, cellH - 14);
      g.fillStyle = '#2a1a26';
      g.font = 'bold 13px sans-serif';
      g.fillText(v.label, x + 8, y + 18);
    });
  });
  return out.toDataURL('image/png');
};

window.renderConfrontoPrimaDopo = (primaMap) => {
  const names = Object.keys(primaMap);
  const pairCols = 4, rows = Math.ceil(names.length / pairCols);
  const subW = 180, subH = 360, gapIn = 6, pad = 18, hdrH = 74;
  const pairW = subW * 2 + gapIn + 14, pairH = subH + 46;
  const out = makeCanvas(pairCols * pairW + (pairCols + 1) * pad, hdrH + rows * (pairH + pad) + pad);
  const g = out.getContext('2d');
  g.fillStyle = '#f4f1ea';
  g.fillRect(0, 0, out.width, out.height);
  g.fillStyle = '#2a1a26';
  g.fillRect(0, 0, out.width, hdrH);
  g.fillStyle = '#ffffff';
  g.font = 'bold 26px sans-serif';
  g.fillText('CONFRONTO PRIMA / DOPO — I 22 PERSONAGGI ESISTENTI (3/4 mentre parla)', 24, 46);

  const talkOpt = { verso: 0.45, posa: 'auto', faccia: 'felice', bocca: 'aperta', seme: 2 };
  names.forEach((name, idx) => {
    const col = idx % pairCols, row = Math.floor(idx / pairCols);
    const x = pad + col * (pairW + pad), y = hdrH + pad + row * (pairH + pad);
    g.fillStyle = '#ffffff';
    g.fillRect(x, y, pairW, pairH);
    g.strokeStyle = '#d4cec2';
    g.lineWidth = 2;
    g.strokeRect(x, y, pairW, pairH);

    const oldRes = window.valutaPersonaggio(name, primaMap[name]);
    const newRes = window.valutaPersonaggio(name, CAST[name]);

    g.fillStyle = '#2a1a26';
    g.font = 'bold 18px sans-serif';
    g.fillText(name + '  (' + oldRes.score + ' -> ' + newRes.score + ' pt)', x + 10, y + 24);

    const cvOld = renderCharCanvas(primaMap[name], talkOpt);
    const cvNew = renderCharCanvas(CAST[name], talkOpt);
    g.drawImage(cvOld, x + 7, y + 36, subW, subH);
    g.drawImage(cvNew, x + 7 + subW + gapIn, y + 36, subW, subH);

    g.fillStyle = '#7a6f68';
    g.font = 'bold 13px sans-serif';
    g.fillText('PRIMA', x + 14, y + 52);
    g.fillStyle = '#2b7a4b';
    g.fillText('DOPO', x + 14 + subW + gapIn, y + 52);
  });
  return out.toDataURL('image/png');
};

window.CAST_NAMES = Object.keys(CAST);
window.ready = true;
</script>
</body>
</html>`;

const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/valuta.html') {
    r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return r.end(HTML_PAGE);
  }
  const p = u.startsWith('/kit/')
    ? path.join(assetKit, path.normalize(u.slice(5)).replace(/^(\.\.[\/\\])+/, ''))
    : path.join(eng, path.normalize(u).replace(/^(\.\.[\/\\])+/, ''));
  fs.readFile(p, (e, d) => {
    if (e) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
    r.end(d);
  });
});

await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const flags = process.platform === 'darwin'
  ? ['--use-angle=metal', '--ignore-gpu-blocklist']
  : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await (await loadPlaywright()).launch({ args: flags });
const page = await browser.newPage({ viewport: { width: 1280, height: 1024 } });
page.on('pageerror', e => {
  console.error('[pageerror]', e.message);
  process.exitCode = 3;
});

try {
  await page.goto(`http://127.0.0.1:${srv.address().port}/valuta.html`);
  await page.waitForFunction('window.ready === true', null, { timeout: 60000 });

  const savePng = (dataUrl, filePath) => {
    const abs = path.resolve(filePath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log('Salvato:', abs);
  };

  if (tipoArg) {
    const available = await page.evaluate(() => window.CAST_NAMES);
    if (!available.includes(tipoArg)) {
      console.error(`Tipo "${tipoArg}" non trovato in CAST. Disponibili: ${available.join(', ')}`);
      process.exitCode = 2;
    } else {
      const resData = await page.evaluate(async n => {
        const { CAST } = await import('/web/cast_rick.js');
        return window.renderSchedinaSingola(n, CAST[n]);
      }, tipoArg);
      const { res, dataUrl } = resData;
      console.log(`${res.nome.padEnd(14)}  score=${String(res.score).padStart(3)}/100  zone=[${res.zones.join(',')}]  thumb(blk=${res.thumb.bigClusters},ink=${res.thumb.inkCnt})`);
      if (res.avvisi.length) {
        for (const a of res.avvisi) console.log('  AVVISO:', a);
      } else {
        console.log('  OK: nessun avviso');
      }
      if (outTipo) savePng(dataUrl, outTipo);
    }
  }

  if (tuttiFlag) {
    const results = await page.evaluate(p => window.valutaCastCompleto(p), primaCast);
    let totAvvisi = 0;
    console.log(`=== VALUTAZIONE CAST (${results.length} personaggi) ===`);
    for (const r of results) {
      totAvvisi += r.avvisi.length;
      const tag = r.avvisi.length ? `AVVISI(${r.avvisi.length}): ${r.avvisi.join('; ')}` : 'OK';
      console.log(`${r.nome.padEnd(14)} | ${String(r.score).padStart(3)} pt [${r.zones.map(z => String(z).padStart(2)).join('/')}] | blk=${r.thumb.bigClusters} ink=${String(r.thumb.inkCnt).padStart(3)} | ${tag}`);
    }
    const okCount = results.filter(r => r.avvisi.length === 0).length;
    console.log(`TOTALE: ${okCount}/${results.length} senza avvisi, ${totAvvisi} avvisi complessivi`);

    if (outCatalogo) {
      const catUrl = await page.evaluate(p => {
        const res = window.valutaCastCompleto(p);
        return window.renderCatalogo(res);
      }, primaCast);
      savePng(catUrl, outCatalogo);
    }
    if (outAngoli) {
      const allNames = results.map(r => r.nome);
      const targetNames = primaCast ? allNames.filter(n => !primaCast[n]) : allNames;
      const angUrl = await page.evaluate(ns => window.renderAngoli(ns), targetNames);
      savePng(angUrl, outAngoli);
    }
    if (primaCast && outConfronto) {
      const confUrl = await page.evaluate(p => window.renderConfrontoPrimaDopo(p), primaCast);
      savePng(confUrl, outConfronto);
    }
  }
} finally {
  await browser.close();
  srv.close();
}
