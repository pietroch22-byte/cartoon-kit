import http from 'http'; import fs from 'fs'; import path from 'path';
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const root = process.cwd(), models = process.argv[2];
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); r.end(d); }); }).listen(8766);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => console.log(m.text()));
await p.goto('http://localhost:8766/bake.html?m=' + models); await p.waitForFunction('window.DONE', null, { timeout: 600000 });
const out = await p.evaluate('window.OUT'); fs.mkdirSync('assets/impostori', { recursive: true });
const meta = {};
for (const [k, v] of Object.entries(out)) { fs.writeFileSync(`assets/impostori/${k}.png`, Buffer.from(v.png.split(',')[1], 'base64')); meta[k] = { w: v.w, h: v.h }; }
fs.writeFileSync('assets/impostori/meta.json', JSON.stringify(meta, null, 1)); console.log(Object.keys(meta));
await b.close(); srv.close();
