// node bake.mjs nome1,nome2 [--sole x,y,z] [--hdri nome]   env KIT=<asset kit>  -> $KIT/impostori/<nome>_<vista>.png + meta.json
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), kit = path.resolve(process.env.KIT || '.');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const models = process.argv[2], sole = arg('--sole', '1,0.9,-0.32'), hdri = arg('--hdri', 'kloofendal_48d_partly_cloudy_puresky');
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = u.startsWith('/kit/') ? path.join(kit, u.slice(5)) : path.join(here, u);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); r.end(d); }); });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const flags = process.platform === 'darwin' ? ['--use-angle=metal'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const b = await chromium.launch({ args: flags }); const p = await b.newPage(); p.on('pageerror', e => console.error('[pageerror]', e.message));
await p.goto(`http://127.0.0.1:${srv.address().port}/web/bake.html?m=${models}&sole=${sole}&hdri=${hdri}`);
await p.waitForFunction('window.DONE', null, { timeout: 900000 });
const out = await p.evaluate('window.OUT'), dir = path.join(kit, 'impostori'); fs.mkdirSync(dir, { recursive: true });
const metaF = path.join(dir, 'meta.json'), meta = fs.existsSync(metaF) ? JSON.parse(fs.readFileSync(metaF)) : {};
for (const [k, v] of Object.entries(out)) { fs.writeFileSync(path.join(dir, `${k}.png`), Buffer.from(v.png.split(',')[1], 'base64')); meta[k] = { lato_m: v.lato_m, altezza_m: v.altezza_m }; }
fs.writeFileSync(metaF, JSON.stringify(meta, null, 1)); console.log('impostori:', Object.keys(out).join(' '), '->', dir);
await b.close(); srv.close();
