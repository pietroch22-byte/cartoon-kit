// node render.mjs <workdir> <outdir> [from-to | list]   env KIT=<asset kit dir>, RESUME=1 skips existing frames, PASSAGGI=N qualità a passaggi
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const work = path.resolve(process.argv[2]), out = path.resolve(process.argv[3]), kit = path.resolve(process.env.KIT || '.');
const tl = JSON.parse(fs.readFileSync(path.join(work, 'timeline.json')));
const todo = process.argv[4] === 'list' ? fs.readFileSync(path.join(work, 'frames.txt'), 'utf8').split(',').map(Number)
  : (() => { const [a, b] = (process.argv[4] || `0-${tl.frames - 1}`).split('-').map(Number); return Array.from({ length: b - a + 1 }, (_, i) => a + i); })();
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.hdr': 'application/octet-stream' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const p = u.startsWith('/work/') ? path.join(work, u.slice(6)) : u.startsWith('/kit/') ? path.join(kit, u.slice(5)) : path.join(here, u);
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); res.end(d); });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const flags = process.platform === 'darwin' ? ['--use-angle=metal', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ args: flags });
const page = await browser.newPage({ viewport: { width: tl.width, height: tl.height } });
page.on('pageerror', e => console.error('[pageerror]', e.message));
page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
await page.goto(`http://127.0.0.1:${server.address().port}/web/index.html` + (+process.env.PASSAGGI >= 1 ? `?passaggi=${+process.env.PASSAGGI}` + (process.env.CIELO !== undefined ? `&cielo=${+process.env.CIELO}` : '') : ''));   // rendering a passaggi
await page.waitForFunction('window.ready === true', null, { timeout: 300000 });
const t0 = Date.now(); let n = 0;
for (const f of todo) {
  const file = path.join(out, `f${String(f).padStart(5, '0')}.jpg`);
  if (process.env.RESUME && fs.existsSync(file)) continue;
  const data = await page.evaluate(f => { window.renderFrame(f); return document.querySelector('canvas').toDataURL('image/jpeg', 0.93); }, f);
  fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64')); n++;
  if (n % 150 === 0) console.log(`frame ${f}  ${((Date.now() - t0) / n / 1000).toFixed(2)} s/frame`);
}
console.log(`done ${n} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await browser.close(); server.close();
