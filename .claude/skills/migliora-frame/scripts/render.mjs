// Renderizza una pagina three.js in Chromium headless e salva lo screenshot.
// La pagina deve impostare window.DONE = true a render finito. Uso: node render.mjs cartella pagina.html out.png [selettore=#wrap]
import http from 'http'; import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [root, page, out, sel = '#wrap'] = [path.resolve(process.argv[2]), process.argv[3], path.resolve(process.argv[4]), process.argv[5]];
const T = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
await new Promise(ok => srv.listen(0, ok)); const port = srv.address().port;
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
p.on('pageerror', e => console.log('ERRORE PAGINA', e.message));
await p.goto(`http://localhost:${port}/${page}`); await p.waitForFunction('window.DONE', null, { timeout: 600000 });
const el = await p.$(sel); await (el || p).screenshot({ path: out }); await b.close(); srv.close(); console.log('ok', out);
