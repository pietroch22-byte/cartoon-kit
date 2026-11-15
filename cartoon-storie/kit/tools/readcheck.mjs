// Controllo leggibilita e tempi di lettura (Punto 2, ispirato a lemo-opuscar/core/render/readcheck.mjs):
//   node kit/tools/readcheck.mjs <storia.json> [--scena N] [--step 0.08] [--latin-cps 15] [--cjk-cps 4.5]
//                                             [--pad 1.5] [--min 1.5] [--min-px 22] [--out dir] [--json file.json] [--no-sottotitoli]
// Controlla:
//   1) Testi/cartelli 3D in scena (window.controlloTesti): mai tagliati ai bordi, mai troppo piccoli su schermo 1080x1920,
//      e visibili ininterrottamente e leggibili per >= max(min, CJK/cjk-cps + altri/latin-cps + pad) secondi.
//      Usa `"passa": true` (su cartello/pannello) o `"testi_passa": ["..."]` nel JSON per scritte di sfondo non da leggere.
//   2) Sottotitoli a karaoke (`words.json`), se presenti: durata blocco, velocita car/s, scala font, taglio finale.
// Codici di uscita: 0 tutti passati; 1 qualche testo o sottotitolo illeggibile/troppo breve; 2 input non valido.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { apriStage, KIT, risolviTempi } from './storia_io.mjs';

const argv = process.argv.slice(2), flag = k => argv.includes(k), val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const src = path.resolve(argv[0] || '');
if (!fs.existsSync(src) || !src.endsWith('.json')) {
  console.error('uso: node kit/tools/readcheck.mjs <storia.json> [--scena N] [--step 0.08] [--min-px 22]');
  process.exit(2);
}

const STEP = Math.max(0.02, +val('--step', 0.08));
const LATIN_CPS = +val('--latin-cps', 15);
const CJK_CPS = +val('--cjk-cps', 4.5);
const PAD = +val('--pad', 1.5);
const MIN_S = +val('--min', 1.5);
const MIN_PX = +val('--min-px', 22);
const SOLO = val('--scena', null);
const JSON_OUT = val('--json', null);
const OUT = val('--out', null);

function needTime(text) {
  const cjk = (text.match(/[\u3000-\u9fff\uac00-\ud7af]/g) || []).length;
  const non = text.replace(/\s/g, '').length - cjk;
  return Math.max(MIN_S, cjk / CJK_CPS + non / LATIN_CPS + PAD);
}

const { S: storia, parole } = risolviTempi(JSON.parse(fs.readFileSync(src, 'utf8')), path.dirname(src));
const base = path.dirname(src), nome = path.basename(src, '.json'), fps = storia.fps || 30;
const scene = (storia.scene || []).map((sc, i) => ({ sc, i })).filter(x => SOLO === null || x.i === +SOLO);
if (!scene.length) { console.error('nessuna scena trovata'); process.exit(2); }

const { srv, browser, page, apri } = await apriStage({ storia, parole, base });

const runs = [];
const open = new Map();
const avvisiCostruzione = new Set();

const chiudiRun = (k, tEnd) => {
  const cur = open.get(k);
  if (cur) { cur.end = tEnd; open.delete(k); }
};

for (const { sc, i } of scene) {
  await apri(`/web/storia.html?scena=${i}`);
  // Raccoglie tagli interni alla scena per interrompere la continuità su "taglio": true
  const tagliInterni = (sc.camera || []).filter((k, j) => j > 0 && k.taglio).map(k => k.t);
  let prevCut = -1;
  for (let t = sc.da; t <= sc.a + 1e-6; t = +(t + STEP).toFixed(4)) {
    const tc = Math.min(t, sc.a);
    const segIdx = tagliInterni.filter(ct => ct <= tc + 1e-4).length;
    if (segIdx !== prevCut && prevCut !== -1) {
      for (const k of [...open.keys()]) chiudiRun(k, tc);
    }
    prevCut = segIdx;
    const f = Math.max(0, Math.round((tc - sc.da) * fps));
    await page.evaluate(async ([f, fps]) => { await window.renderFrame(f, 0, fps); }, [f, fps]);
    const res = await page.evaluate('window.controlloTesti ? window.controlloTesti() : null');
    if (!res) continue;
    (res.avvisi || []).forEach(a => avvisiCostruzione.add(a));
    const visibiliOra = new Set();
    for (const b of res.testi || []) {
      const k = `s${i}:${b.id}:${b.text}`;
      visibiliOra.add(k);
      let r = open.get(k);
      const readable = !b.clipped && b.linePx >= MIN_PX;
      if (!r) {
        r = {
          scena: i, id: b.id, text: b.text, pass: !!b.pass,
          start: tc, end: tc,
          okStart: readable ? tc : null, okEnd: readable ? tc : null,
          maxOkDur: 0, anySeen: true, everUnclipped: !b.clipped, everLegiblePx: b.linePx >= MIN_PX,
          minLinePx: b.linePx, maxLinePx: b.linePx, clips: b.clipped ? 1 : 0, smalls: b.linePx < MIN_PX ? 1 : 0,
        };
        open.set(k, r);
        runs.push(r);
      } else {
        r.end = tc;
        r.everUnclipped = r.everUnclipped || !b.clipped;
        r.everLegiblePx = r.everLegiblePx || (b.linePx >= MIN_PX);
        r.minLinePx = Math.min(r.minLinePx, b.linePx);
        r.maxLinePx = Math.max(r.maxLinePx, b.linePx);
        if (b.clipped) r.clips++;
        if (b.linePx < MIN_PX) r.smalls++;
        if (readable) {
          if (r.okStart === null) { r.okStart = tc; r.okEnd = tc; }
          else r.okEnd = tc;
          r.maxOkDur = Math.max(r.maxOkDur, r.okEnd - r.okStart);
        } else {
          if (r.okStart !== null) r.maxOkDur = Math.max(r.maxOkDur, (r.okEnd ?? r.okStart) - r.okStart);
          r.okStart = null; r.okEnd = null;
        }
      }
    }
    for (const k of [...open.keys()]) if (!visibiliOra.has(k)) chiudiRun(k, tc);
    if (tc >= sc.a - 1e-6) break;
  }
  for (const k of [...open.keys()]) chiudiRun(k, sc.a);
}
await browser.close();
srv.close();

// Unifica per (scena, id, text) così se un cartello esce e rientra prendiamo il blocco più lungo e tutte le criticità
const best = new Map();
for (const r of runs) {
  const k = `${r.scena}|${r.id}|${r.text}`;
  const cur = best.get(k);
  const durOk = Math.max(r.maxOkDur, r.okStart !== null ? (r.okEnd - r.okStart) : 0);
  const totalDur = Math.max(0, r.end - r.start);
  if (!cur) {
    best.set(k, { ...r, held: durOk, totalDur });
  } else {
    cur.held = Math.max(cur.held, durOk);
    cur.totalDur += totalDur;
    cur.everUnclipped = cur.everUnclipped || r.everUnclipped;
    cur.everLegiblePx = cur.everLegiblePx || r.everLegiblePx;
    cur.minLinePx = Math.min(cur.minLinePx, r.minLinePx);
    cur.maxLinePx = Math.max(cur.maxLinePx, r.maxLinePx);
    cur.clips += r.clips;
    cur.smalls += r.smalls;
    cur.end = Math.max(cur.end, r.end);
  }
}

const report3d = [];
let bad3d = 0;
for (const x of best.values()) {
  const need = needTime(x.text);
  const motivo = [];
  if (!x.pass) {
    if (!x.everUnclipped) motivo.push('TAGLIATO_BORDI');
    else if (x.clips > 0 && x.held < need) motivo.push(`TAGLIATO_PARZIALE(${x.clips} camp.)`);
    if (!x.everLegiblePx) motivo.push(`TROPPO_PICCOLO(${x.maxLinePx}px<${MIN_PX}px)`);
    if (x.held + 1e-4 < need) motivo.push(`TROPPO_BREVE(${x.held.toFixed(2)}s<${need.toFixed(2)}s)`);
  }
  const ok = x.pass || motivo.length === 0;
  if (!ok) bad3d++;
  report3d.push({ scena: x.scena, id: x.id, text: x.text, pass: x.pass, ok, held: +x.held.toFixed(2), need: +need.toFixed(2), start: +x.start.toFixed(2), end: +x.end.toFixed(2), maxLinePx: x.maxLinePx, minLinePx: x.minLinePx, motivo });
}

let subRes = null;
if (!flag('--no-sottotitoli') && storia.voce?.parole) {
  const pw = path.resolve(base, storia.voce.parole);
  if (fs.existsSync(pw)) {
    const py = fs.existsSync(path.join(KIT, '.venv/bin/python')) ? path.join(KIT, '.venv/bin/python') : 'python3';
    const tot = Math.max(...(storia.scene || []).map(s => s.a));
    const da = SOLO === null ? '' : `--da ${Math.min(...scene.map(x => x.sc.da))}`;
    const a = SOLO === null ? '' : `--a ${Math.max(...scene.map(x => x.sc.a))}`;
    const useLeg = (storia.karaoke === 'leggibile') || !!storia.karaoke_leggibile;
    try {
      const outJson = execSync(`PYTHONPATH="${KIT}" "${py}" -m engine.karaoke "${pw}" --total ${tot} ${da} ${a} ${useLeg ? '--leggibile' : ''} --json`, { encoding: 'utf8' });
      subRes = JSON.parse(outJson);
    } catch (e) {
      if (e.stdout) {
        try { subRes = JSON.parse(e.stdout); } catch { }
      }
    }
  }
}

const lines = [];
lines.push(`READCHECK "${nome}" (passo ${STEP}s, ${LATIN_CPS} car/s lat, ${CJK_CPS} CJK/s, cuscinetto ${PAD}s, min ${MIN_S}s, font 3D min ${MIN_PX}px/riga)`);
for (const a of avvisiCostruzione) lines.push(`AVVISO adattaTesto: ${a}`);
lines.push('');
lines.push(`Testi 3D in scena: ${report3d.length} rilevati (${bad3d} problemi)`);
for (const r of report3d) {
  const tag = r.pass ? 'PASS' : (r.ok ? 'OK  ' : 'BAD ');
  lines.push(`  ${tag} s${r.scena} [${r.start.toFixed(2)}-${r.end.toFixed(2)}s] held=${r.held.toFixed(2)}s/${r.need.toFixed(2)}s line=${r.maxLinePx}px  ${r.id}  "${r.text}"${r.motivo.length ? '  -> ' + r.motivo.join(', ') : ''}`);
}
if (subRes) {
  lines.push('');
  lines.push(`Sottotitoli karaoke: ${subRes.chunks} blocchi (${subRes.bad} problemi, hold min ${subRes.min_hold.toFixed(2)}s, picco ${subRes.max_cps} car/s, font min ${subRes.min_font.toFixed(0)}px)`);
  for (const r of subRes.problemi || []) {
    lines.push(`  BAD  [${r.t0.toFixed(2)}->${r.t1.toFixed(2)}s ${r.hold.toFixed(2)}s ${r.cps}c/s ${r.font_px}px] "${r.text}" -> ${r.flags.join(', ')}`);
  }
}
const textReport = lines.join('\n') + '\n';
console.log(textReport.trimEnd());

const outDir = OUT ? path.resolve(OUT) : null;
if (outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'lettura.txt'), textReport);
}
if (JSON_OUT) {
  fs.mkdirSync(path.dirname(path.resolve(JSON_OUT)), { recursive: true });
  fs.writeFileSync(path.resolve(JSON_OUT), JSON.stringify({ testi3d: report3d, bad3d, avvisi_testo: [...avvisiCostruzione], sottotitoli: subRes }, null, 2));
}

const badSub = subRes ? (subRes.bad || 0) : 0;
process.exit((bad3d === 0 && badSub === 0 && avvisiCostruzione.size === 0) ? 0 : 1);
