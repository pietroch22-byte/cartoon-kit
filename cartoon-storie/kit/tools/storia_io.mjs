// Aiuti condivisi tra gli script CLI delle storie «disegnato» (risoluzione @parola, server locale, browser Playwright).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ENG = path.resolve(here, '../../engine3d');
export const KIT = path.resolve(here, '..');
export const TYPES = {
  '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream',
};

export async function playwright() {
  const c = [path.join(ENG, 'node_modules/playwright/index.mjs'), process.env.PLAYWRIGHT_MJS];
  try { c.push(path.join(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(), 'playwright/index.mjs')); } catch { }
  for (const p of c) if (p && fs.existsSync(p)) return (await import(pathToFileURL(p).href)).chromium;
  throw new Error('Playwright non trovato: cd engine3d && npm install && npx playwright install chromium');
}

// Tempi sulle parole: "@parola", "@parola+0.3", "@parola#2" -> secondi da words.json
export function risolviTempi(S, dir) {
  let W = [];
  const wf = S.voce && S.voce.parole && path.resolve(dir, S.voce.parole);
  if (wf && fs.existsSync(wf)) W = JSON.parse(fs.readFileSync(wf, 'utf8')).map(w => Array.isArray(w) ? w : [w.start, w.end, w.word]);
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
  const tempo = v => {
    if (typeof v !== 'string' || v[0] !== '@') return v;
    const m = v.slice(1).match(/^([^#+\-\d][^#+]*?)(?:#(\d+))?([+-][\d.]+)?$/);
    if (!m) throw new Error('tempo non valido: ' + v);
    const hit = W.filter(w => norm(w[2]) === norm(m[1]))[(+m[2] || 1) - 1];
    if (!hit) throw new Error(`la parola «${m[1]}» non è nella voce (${v}): controlla il testo o usa i secondi`);
    return Math.round((hit[0] + (+m[3] || 0)) * 1000) / 1000;
  };
  const giro = o => {
    if (Array.isArray(o)) o.forEach(giro);
    else if (o && typeof o === 'object') for (const k in o) {
      if (k === 't' || k === 'da' || k === 'a') { if (typeof o[k] === 'string') o[k] = tempo(o[k]); } else giro(o[k]);
    }
  };
  giro(S.scene); giro(S.effetti || []); giro(S.silenzi || []); giro(S.ambienti || []); giro(S.musica || {});
  return { S, parole: W };
}

export async function apriStage({ storia = null, parole = [], base = process.cwd(), scenaJs = null, width = 1080, height = 1920 } = {}) {
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    if (storia && u === '/scena/storia.json') { r.writeHead(200, { 'Content-Type': 'application/json' }); return r.end(JSON.stringify({ ...storia, _parole: parole })); }
    const p = u.startsWith('/kit/') ? path.join(ENG, '..', '..', 'asset-kit', path.normalize(u.slice(5)).replace(/^(\.\.[\/\\])+/, ''))
      : u.startsWith('/animati/') ? path.join(ENG, '..', 'library', 'animati', path.basename(u))
      : u.startsWith('/vivi/') ? path.join(ENG, '..', 'library', 'vivi', path.basename(u))
      : u === '/scena/scena.js' ? scenaJs
      : u.startsWith('/scena/') ? path.join(base, path.normalize(u.slice(7)).replace(/^(\.\.[\/\\])+/, ''))
      : path.join(ENG, u);
    fs.readFile(p, (e, d) => {
      if (e) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); r.end(d);
    });
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const flags = process.platform === 'darwin'
    ? ['--use-angle=metal', '--ignore-gpu-blocklist']
    : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  const browser = await (await playwright()).launch({ args: flags });
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exit(3); });
  page.on('console', m => { if (m.text().startsWith('[d]')) console.error(m.text()); });
  const url = p => `http://127.0.0.1:${srv.address().port}${p}`;
  const apri = async p => {
    await page.goto(url(p));
    await page.waitForFunction('window.ready === true', null, { timeout: 300000 });
    const e = await page.evaluate('window.errore || null');
    if (e) { console.error('ERRORE nella scena:', e); await browser.close(); srv.close(); process.exit(3); }
  };
  return { srv, browser, page, apri };
}
