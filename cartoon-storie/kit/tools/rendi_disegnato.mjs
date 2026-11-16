// Rende il look «disegnato» (references/look-disegnato.md). Due modi:
//  A) STORIA (JSON, references/storia-disegnato.md) — il modo normale per i video nuovi:
//     node kit/tools/rendi_disegnato.mjs kit/stories/<nome>.json --anteprima     → out/<nome>/contact.jpg (pochi fotogrammi chiave)
//     node kit/tools/rendi_disegnato.mjs kit/stories/<nome>.json                 → out/<nome>/<nome>_muto.mp4 (+ voce se c'è)
//     opzioni: --scena N (solo quella scena)  --out cartella  --solo-fotogrammi  --passo K (un fotogramma ogni K, per prove veloci)
//     --controlli: solo i controlli dell'anteprima, SENZA salvare immagini né contact sheet, e solo per le scene cambiate dall'ultima volta
//                  (--tutte le rifà tutte). Scrive out/<nome>/avvisi.json, che il cancello di `run.py video` legge (references/controlli.md §0).
//     Karaoke e musica: python kit/run.py video kit/stories/<nome>.json (usa questo script per i fotogrammi).
//  B) SCENA LIBERA (.js che espone window.ready e window.renderFrame): node kit/tools/rendi_disegnato.mjs <scena.js> <fotogrammi> <fps> <uscita.mp4> [querystring]
// Serve Playwright (cd engine3d && npm install && npx playwright install chromium) e ffmpeg.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { execSync } from 'node:child_process';
import { apriStage, risolviTempi } from './storia_io.mjs';
const FF = process.env.FFMPEG || 'ffmpeg';
const argv = process.argv.slice(2), flag = k => argv.includes(k), val = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const src = path.resolve(argv[0] || ''), isStoria = src.endsWith('.json');
if (!fs.existsSync(src)) { console.error('uso: node kit/tools/rendi_disegnato.mjs <storia.json> [--anteprima]'); process.exit(1); }
// ---- controllo di REGIA (11/11, aggiornato 12/11): varietà, stacchi sulle parole e uso dosato dello zoom veloce.
// Grandezza di ogni tappa dalla testa nel quadro (`testa`, o 0,9 m alla distanza e fov della tappa): primo piano ≥ 18%, mezza figura ≥ 11%, campo largo il resto.
// Avvisa se: un'inquadratura dura più di 4 s (o sotto 0,65 s); tre inquadrature di fila della stessa grandezza (anche tra scene vicine);
// il primo passaggio in un luogo non ha un campo largo; stacchi lontani dalle parole (> 0,14 s); zoom veloci consecutivi o troppo frequenti (> 30%);
// troppi pochi stacchi per la durata: almeno 1 ogni 12 s; meno di una tappa ogni 3 s.
function regia(S, W = []) {
  const R = [], sc = S.scene || [], testaM = S.personaggi === 'rick' ? 0.53 : 0.9, taglia = f => f >= 0.18 ? 'primo piano' : f >= 0.11 ? 'mezza figura' : 'campo largo';
  // [utente 13/11] DETTAGLIO ≠ PRIMO PIANO: primo piano = un VISO grande nel quadro; dettaglio = un OGGETTO, nessun personaggio nel quadro.
  // Camera a mano (pos+guarda): si guarda se qualche attore della scena cade davvero nel quadro (posizione al tempo della tappa).
  // Nessun personaggio nel quadro (o solo figurine sotto il 3,5%): «dettaglio» se l'obiettivo è stretto (fov < 66), altrimenti «campo largo». "grandezza": "…" nella tappa decide a mano.
  const dove = (a, t) => { let x = a.x ?? 0, z = a.z ?? 0; for (const q of a.azioni || []) if (q.a && typeof q.t === 'number' && q.t <= t) { x = q.a[0]; z = q.a[1]; } return [x, z]; };
  const gr = (k, s) => {
    if (k.grandezza) return k.grandezza; if (k.preset === 'dettaglio' || k.dettaglio) return 'dettaglio'; if (k.testa) return taglia(k.testa);
    if (k.su || !(k.pos && k.guarda)) {
      const tp = { primo_piano: 0.2, stacco: 0.2, reazione: 0.22, mezza: 0.13, spinta: 0.13, figura: 0.09, stabilisci: 0.06 }[k.preset]; if (tp) return taglia(tp);
      return taglia(testaM / ((k.dist ?? 3) * 2 * Math.tan((k.fov || 85) * Math.PI / 360) * 0.5625));
    }
    const P = k.pos, G = k.guarda, tf = Math.tan((k.fov || 85) * Math.PI / 360), f = [G[0] - P[0], G[1] - P[1], G[2] - P[2]], Lf = Math.hypot(...f) || 1; f.forEach((v, i) => f[i] = v / Lf);
    const r = [-f[2], 0, f[0]], Lr = Math.hypot(...r) || 1; r.forEach((v, i) => r[i] = v / Lr); const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]]; let best = 0;
    for (const a of (s && s.attori) || []) {
      if (a.visibile === false) continue; const [x, z] = dove(a, k.t), v = [x - P[0], 1.35 * (a.s ?? a.scala ?? 1) - P[1], z - P[2]], zc = v[0] * f[0] + v[1] * f[1] + v[2] * f[2]; if (zc < 0.3) continue;
      const xn = (v[0] * r[0] + v[1] * r[1] + v[2] * r[2]) / (zc * tf * 0.5625), yn = (v[0] * u[0] + v[1] * u[1] + v[2] * u[2]) / (zc * tf); if (Math.abs(xn) > 1.05 || Math.abs(yn) > 1.05) continue;
      best = Math.max(best, testaM / (zc * 2 * tf * 0.5625));
    }
    if (best < 0.035) return (k.fov || 85) < 66 ? 'dettaglio' : 'campo largo';
    return taglia(testaM / (Lf * 2 * tf * 0.5625));
  };   // con un personaggio nel quadro la grandezza resta quella di prima (distanza dal punto guardato): i campi larghi con la figura intera restano campi larghi
  const haZv = k => !!(k.zoom_veloce || k.preset === 'snap_zoom' || k.preset === 'zoom_soggetto');
  const visti = new Set(), seq = []; let stacchi = 0, tappe = 0; const dur = sc.length ? sc[sc.length - 1].a - sc[0].da : 0;
  sc.forEach((s, i) => {
    const C = [...(s.camera || [])].sort((a, b) => a.t - b.t); tappe += C.length; if (i > 0) stacchi++; stacchi += C.filter(k => k.taglio).length;
    C.forEach((k, j) => {
      const fine = j + 1 < C.length ? C[j + 1].t : s.a, dInq = fine - k.t;
      if (dInq > 4.05) R.push(`scena ${i}: inquadratura ${j} dura ${dInq.toFixed(1)} s (massimo 4: aggiungi una tappa o uno stacco)`);
      if (dInq > 0 && dInq < 0.65) R.push(`scena ${i}: inquadratura ${j} dura ${dInq.toFixed(2)} s (sotto 0,65 s: quasi lampo, assicurati che si legga)`);
      if (W.length && k.t > 0.1) {
        const md = Math.min(...W.map(w => Math.abs(w[0] - k.t)));
        if (md > 0.14 && md < 0.7) R.push(`scena ${i}: inquadratura ${j} a ${k.t.toFixed(2)} s cade a ${md.toFixed(2)} s dalla parola più vicina (Rick cambia all'inizio di una parola, entro 0,1 s)`);
      }
      seq.push({ sc: i, j, k, g: gr(k, s), zv: haZv(k) });
    });
    if (!visti.has(s.luogo)) { visti.add(s.luogo); if (C.length && !C.some(k => gr(k, s) === 'campo largo')) R.push(`scena ${i}: primo passaggio nel luogo «${s.luogo}» senza un campo largo (mostra dove siamo e quanto è grande)`); }
  });
  seq.forEach((q, idx) => {
    if (idx >= 2 && q.g !== 'dettaglio' && q.g === seq[idx - 1].g && q.g === seq[idx - 2].g) R.push(`scena ${q.sc}: tre inquadrature di fila tutte «${q.g}» (alterna le grandezze per dare senso ai tagli)`);
    // una catena di dettagli (causa → effetto su un oggetto) va bene fino a 4; alla quinta serve qualcuno che guarda o reagisce, o il luogo
    if (idx >= 4 && q.g === 'dettaglio' && [1, 2, 3, 4].every(n => seq[idx - n].g === 'dettaglio') && !(idx >= 5 && seq[idx - 5].g === 'dettaglio')) R.push(`scena ${q.sc}: cinque dettagli di fila senza un personaggio (dopo 3-4 oggetti mostra chi guarda o reagisce, o torna sul luogo)`);
    if (idx >= 1 && q.zv && seq[idx - 1].zv) R.push(`scena ${q.sc}: due zoom veloci di fila (usalo ogni tanto sui momenti chiave, non uno dietro l'altro)`);
  });
  // [utente 13/11] varietà delle MOSSE (references/movimenti-camera.md): ogni inquadratura sceglie il suo movimento, mai «spinta + laterale» su tutte
  const FAM = {
    spinta: 'avanti', allontana: 'indietro', gru_indietro: 'indietro', sali: 'gru', scendi: 'gru', laterale: 'carrello', orbita: 'arco', segui_dietro: 'segui', snap_zoom: 'zoom_veloce', zoom_soggetto: 'zoom_veloce', impatto: 'fermo', reazione: 'fermo', stacco: 'fermo',
    avanti_lenta: 'avanti', avanti_forte: 'avanti', risucchio: 'avanti', tilt_su: 'tilt', tilt_giu: 'tilt', gru_su: 'gru', gru_giu: 'gru'
  };
  const mossa = k => { const m = k.mossa || (k.zoom_veloce ? 'zoom_veloce' : ['spinta', 'allontana', 'gru_indietro', 'sali', 'scendi', 'laterale', 'orbita', 'segui', 'segui_dietro', 'frusta', 'impatto', 'inclina', 'fermo', 'snap_zoom', 'zoom_soggetto', 'reazione', 'stacco'].includes(k.preset) ? k.preset : (k.zoom !== undefined || k.pan ? 'a mano' : 'automatica')); return FAM[m] || m; };
  if ((S.stile_camera === 'rick' || seq.some(q => q.k.preset || q.k.mossa)) && seq.length >= 6) {
    const ms = seq.map(q => mossa(q.k)), cnt = {}; ms.forEach(m => cnt[m] = (cnt[m] || 0) + 1);
    if ((cnt.automatica || 0) / ms.length > 0.4) R.push(`${cnt.automatica} inquadrature su ${ms.length} senza una mossa scelta (fanno tutte «spinta + scorrimento di lato»): scegli la "mossa" di ognuna dal vocabolario (references/movimenti-camera.md)`);
    ms.forEach((m, i) => { if (i >= 2 && m === ms[i - 1] && m === ms[i - 2] && m !== 'automatica' && !(seq[i].sc === seq[i - 1].sc && seq[i].sc === seq[i - 2].sc)) R.push(`scena ${seq[i].sc}: tre inquadrature di fila con la stessa mossa «${m}» (cambia movimento quando cambia l'idea)`); });
    for (const m in cnt) if (m !== 'automatica' && ms.length >= 8 && cnt[m] / ms.length > 0.45) R.push(`la mossa «${m}» è su ${cnt[m]} inquadrature su ${ms.length} (massimo ~45%: Rick spinge spesso in avanti ma alterna panoramiche, allontanamenti, gru, inclinazioni e fermi)`);
    if (ms.length >= 12 && Object.keys(cnt).filter(m => m !== 'automatica').length < 5 && !(cnt.automatica / ms.length > 0.4)) R.push(`solo ${Object.keys(cnt).length} mosse diverse in ${ms.length} inquadrature (almeno 5 in un video intero)`);
    for (const m of ['arco', 'vertigine', 'frusta']) if (cnt[m] > 1) R.push(`la mossa «${m}» c'è ${cnt[m]} volte (una per video: usata due volte perde forza)`);
    if (cnt.inclina > 2) R.push(`${cnt.inclina} inquadrature inclinate (al massimo 2 per video)`);
  }
  const nZv = seq.filter(q => q.zv).length;
  if (seq.length >= 4 && nZv / seq.length > 0.31) R.push(`${nZv} zoom veloci su ${seq.length} inquadrature (usalo ogni tanto sulle svolte, non ovunque)`);
  // [utente] mai troppo tempo nello stesso luogo: scene di fila nello stesso luogo sommate, massimo 8 s (riferimento: un luogo nuovo ogni 5-8 s)
  for (let i = 0, j; i < sc.length; i = j) {
    const z = x => x.luogo + '|' + (x.zona || ''); for (j = i + 1; j < sc.length && z(sc[j]) === z(sc[i]); j++); const tl = sc[j - 1].a - sc[i].da;   // "zona": un altro punto dello stesso luogo, con uno stacco, conta come cambio
    if (tl > (j - i === 1 ? 15.05 : 8.05)) R.push(`scene ${i}-${j - 1}: ${tl.toFixed(1)} s di fila nel luogo «${sc[i].luogo}»${sc[i].zona ? ' (zona ' + sc[i].zona + ')' : ''} (massimo ${j - i === 1 ? 15 : 8}: cambia luogo, o mostra un altro punto del luogo con uno stacco netto e un'inquadratura opposta)`);
  }
  // [utente 13/11] UN SOGGETTO = UNA RIPRESA: tre o più scene di fila (cioè con un taglio o una dissolvenza in mezzo) che guardano la stessa cosa nello stesso luogo
  // sono tagli senza motivo: si uniscono in una scena sola con più tappe (la camera si avvicina, segue l'oggetto o vola, non taglia).
  {
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const ptRay = (pt, r) => { const v = sub3(pt, r.p), u = dot(v, r.d); if (u < 0.3) return 9; return Math.hypot(...[0, 1, 2].map(n => v[n] - r.d[n] * u)); };
    // soggetto di una tappa: un PERSONAGGIO (quello della tappa, o il più vicino all'asse di una camera a mano) oppure un OGGETTO (dettaglio: il punto guardato, se vicino; se no il raggio)
    const punto = (k, s) => {
      if (k.su) return { id: k.su }; if (!(k.pos && k.guarda)) return null; const d = sub3(k.guarda, k.pos), L = Math.hypot(...d) || 1, ray = { p: k.pos, d: d.map(v => v / L) };
      if (gr(k, s) === 'dettaglio') return { ogg: k.guarda_ogg, pt: L < 3.5 ? k.guarda : null, ...ray };
      let best = null, bd = 0.9; for (const a of s.attori || []) { const [x, z] = dove(a, k.t), q = ptRay([x, 1.35, z], ray); if (q < bd) { bd = q; best = a.id; } } return best ? { id: best } : null;
    };
    const stesso = (A, B) => {
      if (!A || !B) return false; if (A.id || B.id) return !!A.id && A.id === B.id; if (A.ogg && A.ogg === B.ogg) return true;
      if (A.pt && B.pt) return Math.hypot(...sub3(A.pt, B.pt)) < 0.8; if (A.pt) return ptRay(A.pt, B) < 0.6; if (B.pt) return ptRay(B.pt, A) < 0.6;   // stesso banco, stessa consolle: per chi guarda è «la stessa cosa»
      const w = sub3(A.p, B.p), bb = dot(A.d, B.d), dd = dot(A.d, w), e = dot(B.d, w), den = 1 - bb * bb;
      if (den < 0.03) { const u = -dd, c = [0, 1, 2].map(n => -w[n] - A.d[n] * u); return bb > 0 && Math.hypot(...c) < 0.6 && Math.abs(u) < 2.5; }   // raggi quasi paralleli: camere vicine che guardano nello stesso verso
      const ta = (bb * e - dd) / den, tb = (e - bb * dd) / den; if (ta < 0.3 || tb < 0.3 || ta > 8 || tb > 8) return false; return Math.hypot(...[0, 1, 2].map(n => A.p[n] + A.d[n] * ta - B.p[n] - B.d[n] * tb)) < 0.6;
    };
    for (let i = 0, j; i < sc.length - 1; i = Math.max(j, i + 1)) {
      for (j = i; j < sc.length - 1; j++) {
        const a = sc[j], b = sc[j + 1], Ca = [...(a.camera || [])].sort((x, y) => x.t - y.t), Cb = [...(b.camera || [])].sort((x, y) => x.t - y.t);
        if (a.luogo !== b.luogo || !Ca.length || !Cb.length || !stesso(punto(Ca[Ca.length - 1], a), punto(Cb[0], b))) break;
      }
      if (j - i >= 2) R.push(`scene ${i}-${j}: ${j - i + 1} scene di fila sullo stesso soggetto, con un taglio ogni volta (${sc[i].da.toFixed(1)}-${sc[j].a.toFixed(1)} s): fanne UNA ripresa sola — una scena con più tappe, la camera si avvicina, segue l'oggetto ("guarda_ogg") o vola ("volo"), non taglia`);
    }
  }
  if (dur > 0 && stacchi < Math.ceil(dur / 12)) R.push(`solo ${stacchi} stacchi in ${dur.toFixed(0)} s: ne servono almeno ${Math.ceil(dur / 12)} (cambi di scena o "taglio": true)`);
  if (dur > 0 && tappe < dur / 3) R.push(`${tappe} inquadrature in ${dur.toFixed(0)} s: servono almeno ${Math.ceil(dur / 3)} (una ogni 3 s)`);
  return R;
}

// ---- controllo di RECITAZIONE (livello 3): niente comparse/attori «statua», braccia "dritto", dialoghi o reazioni mancanti
function recitazione(S) {
  const R = [], CH = new Set(['a', 'faccia', 'bocca', 'posa', 'andatura', 'corsa', 'gesto', 'verso', 'yaw', 'testa', 'chino', 'torsoPiega', 'sguardo', 'parla', 'fai', 'vfx', 'goccia', 'oggetto']);
  const dove = (a, t) => { let x = a.x ?? 0, z = a.z ?? 0; for (const q of a.azioni || []) if (q.a && typeof q.t === 'number' && q.t <= t) { x = q.a[0]; z = q.a[1]; } return [x, z]; };
  const inQuadro = (a, k, s) => {
    if (k.su) return k.su === a.id || (k.zoom_veloce?.su === a.id);
    if (!(k.pos && k.guarda)) return (s.attori || []).length <= 3;   // preset multi-soggetto senza pos+guarda: considera presente se la scena è breve/media
    const P = k.pos, G = k.guarda, tf = Math.tan((k.fov || 85) * Math.PI / 360);
    const f = [G[0] - P[0], G[1] - P[1], G[2] - P[2]], Lf = Math.hypot(...f) || 1; f.forEach((v, i) => f[i] /= Lf);
    const r = [-f[2], 0, f[0]], Lr = Math.hypot(...r) || 1; r.forEach((v, i) => r[i] /= Lr);
    const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    const [ax, az] = dove(a, k.t), v = [ax - P[0], 1.3 * (a.scala ?? a.s ?? 1) - P[1], az - P[2]], zc = v[0] * f[0] + v[1] * f[1] + v[2] * f[2];
    if (zc < 0.35) return false;
    const xn = (v[0] * r[0] + v[1] * r[1] + v[2] * r[2]) / (zc * tf * 0.5625), yn = (v[0] * u[0] + v[1] * u[1] + v[2] * u[2]) / (zc * tf);
    return Math.abs(xn) <= 1.05 && Math.abs(yn) <= 1.05;
  };
  (S.scene || []).forEach((s, i) => {
    const att = s.attori || [], C = [...(s.camera || [])].sort((a, b) => a.t - b.t);
    const attoriAttivi = new Set();
    att.forEach(a => { if (a.parla || (a.azioni || []).some(z => z.parla || z.fai)) attoriAttivi.add(a.id); });
    att.forEach(a => {
      const az = [...(a.azioni || [])].sort((x, y) => (x.t ?? 0) - (y.t ?? 0));
      if (a.posa === 'dritto' || az.some(z => z.posa === 'dritto')) R.push(`scena ${i}: «${a.id}» usa "posa": "dritto" (usa "auto" o una posa asimmetrica per evitare l'effetto statua)`);
      const parlaAny = !!a.parla || az.some(z => z.parla);
      const hasBeat = az.some(z => Object.keys(z).some(k => CH.has(k) && k !== 'parla')) || !!a.gesto || !!a.chino;
      if (parlaAny && !hasBeat) R.push(`scena ${i}: «${a.id}» parla ("parla": true) ma non ha gesti, cambi di faccia o accenni di testa`);
      // Tempo inquadrato visibile (somma intervalli camera dove l'attore cade nel quadro e visibile !== false)
      let tVisInq = 0; const intervalli = [];
      C.forEach((k, j) => {
        const fine = j + 1 < C.length ? C[j + 1].t : s.a;
        let vis = a.visibile !== false;
        for (const z of az) if (typeof z.t === 'number' && z.t <= k.t + 0.05 && 'visibile' in z) vis = z.visibile;
        if (vis && inQuadro(a, k, s)) { tVisInq += Math.max(0, fine - k.t); intervalli.push([k.t, fine]); }
      });
      const hitAltri = att.some(b => b.id !== a.id && (b.azioni || []).some(z => (z.chi === a.id || z.per === a.id)));
      const eventT = [s.da];
      for (const z of az) if (typeof z.t === 'number' && Object.keys(z).some(k => CH.has(k))) eventT.push(z.t);
      for (const b of att) if (b.id !== a.id) for (const z of (b.azioni || [])) if (typeof z.t === 'number' && (z.chi === a.id || z.per === a.id)) eventT.push(z.t);
      eventT.push(s.a); eventT.sort((x, y) => x - y);
      let maxGap = 0;
      for (const [ta, tb] of intervalli) {
        const sub = [ta, ...eventT.filter(t => t > ta + 0.05 && t < tb - 0.05), tb];
        for (let m = 1; m < sub.length; m++) maxGap = Math.max(maxGap, sub[m] - sub[m - 1]);
      }
      if (tVisInq > 2.5 && maxGap > 2.5 && !a.gesto && !parlaAny && !hitAltri) {
        R.push(`scena ${i}: «${a.id}» è inquadrato ${maxGap.toFixed(1)} s senza cambiare faccia, posa, sguardo o gesto (effetto statua)`);
      } else if (tVisInq > 2.0 && !az.length && !hitAltri && attoriAttivi.size > 0 && !attoriAttivi.has(a.id) && !a.sguardo) {
        R.push(`scena ${i}: «${a.id}» resta passivo mentre un altro personaggio parla/agisce (aggiungi una reazione, "sguardo" o cambio espressione)`);
      }
    });
  });
  return R;
}

// ---- controlli prima di rendere (errori che costano un render)
function controlla(S, W = []) {
  const E = [], A = [];
  if (!S.scene || !S.scene.length) E.push('nessuna scena'); let prev = 0;
  (S.scene || []).forEach((sc, i) => {
    const n = `scena ${i}`; if (!S.luoghi || !S.luoghi[sc.luogo]) E.push(`${n}: luogo «${sc.luogo}» non definito`);
    if (!(sc.a > sc.da)) E.push(`${n}: "a" deve essere dopo "da"`); if (Math.abs(sc.da - prev) > 0.05) A.push(`${n}: comincia a ${sc.da} s ma la scena prima finisce a ${prev} s (buco o sovrapposizione)`); prev = sc.a;
    if (!sc.camera || !sc.camera.length) E.push(`${n}: manca la camera`);
    (sc.camera || []).forEach((k, j) => {
      if (!k.su && !(k.pos && k.guarda)) E.push(`${n} camera ${j}: serve "pos"+"guarda" oppure "su"`); if (k.fov && (k.fov < 30 || k.fov > 100)) A.push(`${n} camera ${j}: fov ${k.fov} insolito (look: 80-95)`);
      const y = k.pos ? k.pos[1] : k.alt; if (y !== undefined && (y < 0.6 || y > 12)) A.push(`${n} camera ${j}: altezza ${y} m insolita (occhi: 1,6-2,6)`);
    });
    const tagli = (sc.camera || []).filter(k => k.taglio).length; if (tagli > 1) A.push(`${n}: ${tagli} stacchi netti nello stesso luogo — l'utente preferisce riprese continue`);
    const ids = new Set(); (sc.attori || []).forEach(a => { if (ids.has(a.id)) E.push(`${n}: attore «${a.id}» due volte`); ids.add(a.id); (a.azioni || []).forEach(z => { if (z.t < sc.da - 0.01 || z.t > sc.a) A.push(`${n}: azione di «${a.id}» a ${z.t} s fuori dalla scena`); }); });
    (sc.camera || []).forEach(k => {
      if (k.su && !ids.has(k.su)) E.push(`${n}: la camera segue «${k.su}» che non è in scena`);
      if (k.zoom_veloce?.su && !ids.has(k.zoom_veloce.su)) E.push(`${n}: zoom_veloce segue «${k.zoom_veloce.su}» che non è in scena`);
    });
  });
  regia(S, W).forEach(x => A.push('REGIA ' + x));
  recitazione(S).forEach(x => A.push('RECITAZIONE ' + x));
  A.forEach(x => console.log('  avviso:', x)); if (E.length) { E.forEach(x => console.error('  ERRORE:', x)); process.exit(2); }
  return A;
}

let storia = null, parole = [], scenaJs = null, base = path.dirname(src);
let AVV_STORIA = [];
if (isStoria) { const R = risolviTempi(JSON.parse(fs.readFileSync(src, 'utf8')), base); storia = R.S; parole = R.parole; AVV_STORIA = controlla(storia, parole); } else scenaJs = src;

// ---- CANCELLO (16/11): out/<nome>/avvisi.json raccoglie TUTTI gli avvisi dei controlli, scena per scena, con l'«impronta» di ciò che la scena mostra
// (la scena, il suo luogo, lo script del luogo e i file che importa, le impostazioni generali che si vedono). Scena con la stessa impronta = controlli ancora validi:
// non si rifanno. Chi decide che cosa ferma il video è kit/engine/film_disegnato.py (cancello): qui si scrivono solo i fatti.
// Limite noto: l'impronta non guarda il codice del motore (engine3d/web): dopo una modifica al motore usa --tutte.
const OUT_STORIA = isStoria ? path.resolve(val('--out', path.join(process.cwd(), 'out', path.basename(src, '.json')))) : null;
const NON_SI_VEDE = ['scene', 'luoghi', 'titolo', 'voce', 'musica', 'effetti', 'silenzi', 'ambienti', 'regia_audio', 'j_cut', 'l_cut', 'karaoke', 'karaoke_leggibile', 'mix'];
const CONTROLLI_V = 4;   // collocazione: telai nel vano e zone ruotate; rifare le impronte vecchie
const impronta = sc => {
  const h = crypto.createHash('sha1'), LG = (storia.luoghi || {})[sc.luogo] || {}, { mood, bpm, intensita, ...vis } = sc;
  h.update(JSON.stringify([CONTROLLI_V, vis, LG, Object.fromEntries(Object.entries(storia).filter(([k]) => !NON_SI_VEDE.includes(k)))]));
  for (const f of [LG.script || []].flat()) {
    const p = path.resolve(base, f); if (!fs.existsSync(p)) continue; const txt = fs.readFileSync(p, 'utf8'); h.update(txt);
    for (const m of txt.matchAll(/from\s+['"](?:\.\/|\/scena\/)([^'"]+\.js)['"]/g)) { const q = path.resolve(base, m[1]); if (fs.existsSync(q)) h.update(fs.readFileSync(q)); }
  }
  return h.digest('hex').slice(0, 16);
};
const leggiAvvisi = () => { try { const d = JSON.parse(fs.readFileSync(path.join(OUT_STORIA, 'avvisi.json'), 'utf8')); if (d.versione === 1 && d.scene) return d; } catch { } return { versione: 1, scene: {} }; };
const senzaScena = x => x.replace(/^scena \d+(?: a [\d.]+ s)?(?: \(«[^»]*»\))?:? */, '');
const scriviAvvisi = d => {
  d.storia = src; d.quando = new Date().toISOString(); d.n_scene = storia.scene.length; for (const k of Object.keys(d.scene)) if (+k >= d.n_scene) delete d.scene[k];
  // avvisi «a tavolino» (REGIA, RECITAZIONE, formato): si ricalcolano sempre, non costano niente
  d.statici = AVV_STORIA.map(x => { const m = x.match(/^(REGIA|RECITAZIONE) ([\s\S]*)$/), testo = m ? m[2] : x, sn = testo.match(/^scen[ae] (\d+)/); return { cat: m ? m[1] : 'STORIA', codice: m ? m[1] : 'STORIA', scena: sn ? +sn[1] : null, t: null, testo }; });
  fs.mkdirSync(OUT_STORIA, { recursive: true }); fs.writeFileSync(path.join(OUT_STORIA, 'avvisi.json'), JSON.stringify(d, null, 1));
};
let DA_FARE = null;   // --controlli: le scene da ricontrollare (le altre hanno ancora la stessa impronta)
if (isStoria && flag('--controlli')) {
  const d = leggiAvvisi(), solo = val('--scena', null);
  DA_FARE = storia.scene.map((sc, i) => i).filter(i => (solo === null || i === +solo) && (flag('--tutte') || (d.scene[i] || {}).impronta !== impronta(storia.scene[i])));
  const buone = storia.scene.length - DA_FARE.length;
  if (!DA_FARE.length) { scriviAvvisi(d); console.log(`CANCELLO controlli: ${solo === null ? 'tutte le ' + storia.scene.length + ' scene' : 'la scena ' + solo} già controllat${solo === null ? 'e' : 'a'} e non cambiat${solo === null ? 'e' : 'a'}: nessun fotogramma da rifare`); process.exit(0); }
  console.log(`CANCELLO controlli: da rifare ${DA_FARE.length === 1 ? 'la scena' : 'le scene'} ${DA_FARE.join(', ')}${solo === null ? ' (' + buone + ' già a posto)' : ''}; nessuna immagine salvata`);
}
const { srv, browser: b, page: pg, apri } = await apriStage({ storia, parole, base, scenaJs });
const scalda = async (f, fps) => { await pg.evaluate(async ([f, fps]) => { for (let i = 0; i < 4; i++) { await window.renderFrame(f, 0, fps); await new Promise(r => requestAnimationFrame(r)); } }, [f, fps]); };
const scatta = async (f, N, fps, file) => {
  const d = await pg.evaluate(async ([f, N, fps]) => {
    await window.renderFrame(f, N, fps); const cv = window.mossoCanvas || document.querySelector('canvas');   /* mossoCanvas: fotogramma col mosso (movimenti veloci di camera) */ if (cv.width === 1080) return cv.toDataURL('image/jpeg', 0.93);
    const o = document.createElement('canvas'); o.width = 1080; o.height = 1920; const g = o.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(cv, 0, 0, 1080, 1920); return o.toDataURL('image/jpeg', 0.93);
  }   /* antialiasing "ss": rimpicciolisce a 1080x1920 */, [f, N, fps]); fs.writeFileSync(file, Buffer.from(d.split(',')[1], 'base64'));
};
const t0 = Date.now(); let fatti = 0; const tick = () => { fatti++; if (fatti % 15 === 1) console.log(`fotogramma ${fatti}  ${((Date.now() - t0) / fatti / 1000).toFixed(2)} s/fotogramma`); };

if (!isStoria) {   // ---- modo B: scena libera
  const [N, fps, out, qs = '?step=18'] = [+argv[1], +argv[2], path.resolve(argv[3]), argv[4]];
  await apri(`/web/disegnato.html${qs}`); const dir = out.replace(/\.mp4$/, '') + '_fotogrammi'; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (let f = 0; f < N; f++) { await scatta(f, N, fps, `${dir}/f${String(f).padStart(5, '0')}.jpg`); tick(); }
  await b.close(); srv.close(); execSync(`"${FF}" -v error -y -framerate ${fps} -i "${dir}/f%05d.jpg" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p "${out}"`); console.log('fatto:', out);
} else {           // ---- modo A: storia
  const nome = path.basename(src, '.json'), out = OUT_STORIA, fps = storia.fps || 30, passo = +val('--passo', 1), solo = val('--scena', null);
  fs.mkdirSync(out, { recursive: true }); if (!flag('--controlli')) fs.writeFileSync(path.join(out, 'storia_risolta.json'), JSON.stringify(storia, null, 1));   // --controlli scrive solo avvisi.json
  const scene = storia.scene.map((sc, i) => ({ sc, i })).filter(x => (solo === null || x.i === +solo) && (!DA_FARE || DA_FARE.includes(x.i)));
  // [utente 13/11] FLUIDITÀ: la camera non deve mai scattare. Dal profilo di velocità della scena (window.profiloCamera, nessun render) si cercano i cambi bruschi:
  // accelerazione oltre 6 px/f² fuori dai voli (numero di Rick: le sue mosse salgono in ~10 fotogrammi), oltre 18 px/f² dentro un volo, e partenze di scena già oltre 20 px/f.
  const fluidita = async (i, sc) => {
    const pr = await pg.evaluate('window.profiloCamera ? window.profiloCamera() : null'); if (!pr || pr.v.length < 3) return { avvisi: [], riga: '' };
    const { v, fps, da } = pr, T = f => da + f / fps, inVolo = t => pr.voli.some(([a, b]) => t >= a - 0.05 && t <= b + 0.05), suTaglio = t => pr.tagli.some(c => Math.abs(c - t) <= 1.5 / fps); const A = []; let peggio = 0, tp = 0, vmax = 0, cur = null;
    for (let f = 1; f < v.length; f++) {
      const t = T(f), acc = Math.abs(v[f] - v[f - 1]); vmax = Math.max(vmax, v[f]); if (suTaglio(t)) continue; const lim = inVolo(t) ? 18 : 6; if (acc / lim > peggio) { peggio = acc / lim; tp = t; }
      if (acc > lim) { if (cur && t - cur.b < 0.2) { cur.b = t; cur.m = Math.max(cur.m, acc); } else { cur = { a: t, b: t, m: acc, volo: inVolo(t) }; A.push(cur); } }
    }
    const av = A.map(x => `scena ${i}: la camera SCATTA a ${x.a.toFixed(2)} s (${x.volo ? 'dentro un volo' : 'fuori dai voli'}: la velocità cambia di ${x.m.toFixed(0)} px/f in un fotogramma, massimo ${x.volo ? 18 : 6}): allunga il movimento o ammorbidisci partenza e arrivo`);
    if (v[1] > 20 && !inVolo(T(1))) av.push(`scena ${i}: l'inquadratura parte già a ${v[1].toFixed(0)} px/f (massimo 20): una partenza così veloce sembra uno strappo`);
    return { avvisi: av, riga: `scena ${i}  ${sc.da.toFixed(2)}-${sc.a.toFixed(2)} s  velocità massima ${vmax.toFixed(0)} px/f, cambio più brusco ${(peggio * 100).toFixed(0)}% del limite a ${tp.toFixed(2)} s${pr.voli.length ? ', voli ' + pr.voli.length : ''}`, v };
  };
  const FLU = [], RIC = [];
  if (flag('--profilo')) {
    const R = []; for (const { sc, i } of scene) { await apri(`/web/storia.html?scena=${i}`); const F = await fluidita(i, sc); console.log(F.riga); F.avvisi.forEach(a => console.log('  avviso: FLUIDITÀ ' + a)); if (flag('--numeri')) console.log('   ', F.v.map(x => Math.round(x)).join(' ')); R.push(F); }
    fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'fluidita.txt'), R.map(F => F.riga + '\n' + F.avvisi.map(a => '  ' + a + '\n').join('')).join('')); await b.close(); srv.close(); process.exit(0);
  }
  const soloCtrl = flag('--controlli');   // i controlli dell'anteprima senza salvare immagini, file di testo o contact sheet: scrive solo avvisi.json
  if (flag('--anteprima') || soloCtrl) {   // pochi fotogrammi: inizio e fine di ogni scena, ogni tappa di camera, metà di ogni azione
    const dir = path.join(out, 'anteprima'); if (!soloCtrl) { fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); } let n = 0;
    const PER = new Map(), KF = new Map(), visto = new Set(), scrivi = (file, txt) => { if (!soloCtrl) fs.writeFileSync(path.join(out, file), txt); };
    const nota = (i, cat, codice, testo, t = null) => { const k = [i, cat, codice, testo, t].join('|'); if (visto.has(k)) return; visto.add(k); PER.get(i).push({ cat, codice, scena: i, t: t === null ? null : +t.toFixed(2), testo: senzaScena(String(testo)).replace(/\s+/g, ' ') }); };
    const CTRL = [], VITA = [], RECIT = [], TESTI = [], SOGLIA_VITA = +(storia.vita_soglia ?? 60);
    for (const { sc, i } of scene) {
      await apri(`/web/storia.html?scena=${i}`); PER.set(i, []); KF.set(i, 0);
      { const F = await fluidita(i, sc); FLU.push(F); F.avvisi.forEach(a => { console.log('  avviso: FLUIDITÀ ' + a); nota(i, 'FLUIDITA', 'CAMERA_SCATTA', a); }); }   // la camera non deve mai scattare (references/movimenti-camera.md §0c)
      const T = new Set([sc.da + 0.05, sc.a - 0.05]); (sc.camera || []).forEach(k => T.add(k.t)); (sc.attori || []).forEach(a => (a.azioni || []).forEach(z => T.add(z.t + (z.dur || 0.6) / 2))); (sc.oggetti || []).forEach(e => T.add(e.t + 0.4));
      const tt = [...T].filter(t => t >= sc.da && t <= sc.a).sort((x, y) => x - y).filter((t, j, a) => j === 0 || t - a[j - 1] > 0.25);
      for (const t of tt) {
        await scalda(Math.round((t - sc.da) * fps), fps); KF.set(i, KF.get(i) + 1);
        if (soloCtrl) { n++; await pg.evaluate(([f, fps]) => window.renderFrame(f, 0, fps), [Math.round((t - sc.da) * fps), fps]); }   // stesso fotogramma dell'anteprima, ma non si salva
        else await scatta(Math.round((t - sc.da) * fps), 0, fps, path.join(dir, `a${String(n++).padStart(3, '0')}_s${i}_${t.toFixed(2)}s.jpg`));
        const ci = await pg.evaluate('window.controlloInquadratura ? window.controlloInquadratura() : null');   // controllo dell'inquadratura (references/ricksclips/style-rules.md)
        if (ci) { CTRL.push({ scena: i, t, ...ci }); for (const [k, c] of ci.flags) { console.log(`  CONTROLLO scena ${i} a ${t.toFixed(2)} s: ${k} (${c})`); nota(i, 'INQUADRATURA', k, c, t); } }
        { const cr = await pg.evaluate('window.controlloRicchezza ? window.controlloRicchezza() : null'); if (cr) RIC.push({ scena: i, t, luogo: sc.luogo, primo: storia.scene.findIndex(x => x.luogo === sc.luogo) === i && !RIC.some(x => x.luogo === sc.luogo), ...cr });
            for (const q of (cr && cr.posti) || []) { const k = `${i}|posto|${q.codice}|${q.oggetti ? q.oggetti.join('|') : q.testo}`; if (visto.has(k)) continue; visto.add(k); console.log(`  avviso: ${q.codice} scena ${i} a ${t.toFixed(2)} s: ${q.testo}`); nota(i, 'MONDO', q.codice, q.testo, t); } }   // MONDO RICCO (references/mondo-da-riferimento.md) + COLLOCAZIONE (vita.js)
        { const r2 = await pg.evaluate('window.controlloRecitazione ? window.controlloRecitazione() : null'); if (r2) RECIT.push({ scena: i, t, ...r2 }); }   // RECITAZIONE LIVELLO 3
        { const lt = await pg.evaluate('window.controlloTesti ? window.controlloTesti() : null'); if (lt) TESTI.push({ scena: i, t, ...lt, tk: t }); }   // LEGGIBILITA TESTI 3D (Punto 2)
        const cv = await pg.evaluate('window.controlloVita ? window.controlloVita() : null');   // MONDO VIVO: quanta parte di ciò che si vede si muove
        if (cv) { VITA.push({ scena: i, t, ...cv }); const q = Math.round(cv.quota * 100); console.log(`  scena ${i}  ${t.toFixed(2)} s   vivo ${q}% (${cv.vivi} vivi, ${cv.fermi} fermi)`); if (q < SOGLIA_VITA) { console.log(`  avviso: scena ${i} a ${t.toFixed(2)} s solo ${q}% dell'inquadratura si muove: anima ${cv.elenco.slice(0, 3).join(', ')} (references/mondo-vivo.md)`); nota(i, 'MONDO', 'VITA_BASSA', `solo ${q}% dell'inquadratura si muove (soglia ${SOGLIA_VITA}%): anima ${cv.elenco.slice(0, 3).join(', ')}`, t); } }
        else console.log(`  scena ${i}  ${t.toFixed(2)} s`);
      }
    }
    await b.close(); srv.close(); const cols = Math.min(6, n), rows = Math.ceil(n / cols);
    if (RECIT.length) {
      const righe = [], avvR = [], stat = new Map();
      for (const x of RECIT) {
        for (const a of x.attori || []) {
          const k = `${x.scena}|${a.id}`, cur = stat.get(k) || { scena: x.scena, id: a.id, tMin: x.t, tMax: x.t, stati: new Set(), attivo: false, n: 0 };
          cur.tMin = Math.min(cur.tMin, x.t); cur.tMax = Math.max(cur.tMax, x.t); cur.n++;
          cur.stati.add(JSON.stringify([a.posa, a.gesto, a.faccia, a.bocca, a.sguardo, a.oggetto, a.vfx, a.chino]));
          if (a.parla || a.gesto || a.interazione || /^(cammina|passeggiata|fretta|corsa|soppiatto|marcia|zoppia)$/.test(a.posa)) cur.attivo = true;
          stat.set(k, cur);
        }
        (x.avvisi || []).forEach(w => { avvR.push(`scena ${x.scena} a ${x.t.toFixed(2)} s: ${w}`); nota(x.scena, 'RECITAZIONE', 'RECITAZIONE', w, x.t); });
        const desc = (x.attori || []).map(a => `${a.id}(${a.testaPct}%,posa=${a.posa}${a.gesto ? ',gesto=' + a.gesto : ''},faccia=${a.faccia}${a.parla ? ',parla' : ''}${a.bocca ? ':' + a.bocca : ''}${a.oggetto ? ',ogg=' + a.oggetto : ''}${a.sguardo ? ',sguardo=' + JSON.stringify(a.sguardo) : ''}${a.vfx ? ',vfx=' + a.vfx : ''})`).join(' | ') || 'nessun attore inquadrato';
        righe.push(`scena ${x.scena}  ${x.t.toFixed(2)} s  ${desc}${(x.avvisi || []).length ? '  AVVISI: ' + x.avvisi.join('; ') : ''}`);
      }
      for (const c of stat.values()) {
        if ((c.tMax - c.tMin) >= 2.2 && c.stati.size <= 1 && !c.attivo) { avvR.push(`scena ${c.scena}: «${c.id}» inquadrato per ${(c.tMax - c.tMin).toFixed(1)} s (${c.n} fotogrammi chiave) con stato identico (STATUA)`); nota(c.scena, 'RECITAZIONE', 'STATUA', `«${c.id}» inquadrato per ${(c.tMax - c.tMin).toFixed(1)} s con stato identico`); }
      }
      const hdr = avvR.length ? ['PROBLEMI RECITAZIONE:', ...avvR.map(w => '  ' + w), ''] : ['RECITAZIONE: nessun problema rilevato', ''];
      scrivi('recitazione.txt', [...hdr, ...righe].join('\n') + '\n');
      avvR.forEach(w => console.log('  avviso: RECITAZIONE ' + w));
      console.log(`recitazione: ${avvR.length ? avvR.length + ' avvisi' : 'nessun problema'}; dettagli in ${path.join(out, 'recitazione.txt')}`);
    }
    if (RIC.length) {
      const righe = [], avv = []; for (const r of RIC) {
        const P = [];   // prima inquadratura di ogni luogo = quella che deve far vedere il mondo: soglie piene; le altre: soglie minime
        if (r.primo) { if (r.oggetti < 15) P.push(`solo ${r.oggetti} oggetti (servono almeno 15)`); if (r.grandi < 2) P.push(`${r.grandi} oggetti grandi (almeno 2)`); if (r.medi < 4) P.push(`${r.medi} medi (almeno 4)`); if (r.piccoli < 5) P.push(`${r.piccoli} piccoli (almeno 5)`); if (r.celle < 8) P.push(`${r.celle} caselle piene su 12 (almeno 8)`); if (r.tinte < 3) P.push(`${r.tinte} tinte (almeno 3)`); }
        else { if (r.oggetti < 4) P.push(`solo ${r.oggetti} oggetti (almeno 4)`); if (r.celle < 4) P.push(`${r.celle} caselle piene su 12 (almeno 4)`); }
        righe.push(`scena ${r.scena}  ${r.t.toFixed(2)} s  ${r.luogo}${r.primo ? ' (prima vista del luogo)' : ''}  oggetti ${r.oggetti} (grandi ${r.grandi}, medi ${r.medi}, piccoli ${r.piccoli})  caselle ${r.celle}/12  profondità ${r.piani}/3  tinte ${r.tinte}${r.vuote.length ? '  vuoto: ' + r.vuote.join(', ') : ''}${P.length ? '  MONDO_POVERO: ' + P.join('; ') : ''}`);
        if (P.length) { avv.push(`scena ${r.scena} a ${r.t.toFixed(2)} s («${r.luogo}»): ${P.join('; ')}${r.vuote.length ? ' — vuoto ' + r.vuote.slice(0, 4).join(', ') : ''}`); nota(r.scena, 'MONDO', 'MONDO_POVERO', `«${r.luogo}»${r.primo ? ' (prima vista)' : ''}: ${P.join('; ')}${r.vuote.length ? ' — vuoto ' + r.vuote.slice(0, 4).join(', ') : ''}`, r.t); }
      }
      scrivi('ricchezza.txt', righe.join('\n') + '\n'); avv.forEach(a => console.log('  avviso: MONDO_POVERO ' + a)); console.log(`mondo ricco: ${avv.length ? avv.length + ' inquadrature povere' : 'nessun problema'}; dettagli in ${path.join(out, 'ricchezza.txt')}`);
    }
    if (FLU.length) { scrivi('fluidita.txt', FLU.map(F => F.riga + '\n' + F.avvisi.map(a => '  ' + a + '\n').join('')).join('')); const nf = FLU.reduce((s, F) => s + F.avvisi.length, 0); console.log(`fluidità della camera: ${nf ? nf + ' scatti' : 'nessuno scatto'}; dettagli in ${path.join(out, 'fluidita.txt')}`); }
    if (CTRL.length) {
      scrivi('controlli.txt', CTRL.map(c => `scena ${c.scena}  ${c.t.toFixed(2)} s  luce ${c.media}  testa ${c.testa ? Math.round(c.testa * 100) + '%' : '-'} (${c.soggetto || '-'})  ${c.flags.map(f => f.join(': ')).join('; ') || 'ok'}`).join('\n') + '\n');
      const nf = CTRL.reduce((s, c) => s + c.flags.length, 0), te = CTRL.filter(c => c.testa).map(c => c.testa).sort((a, b) => a - b), med = te.length ? Math.round(te[te.length >> 1] * 100) : 0;
      console.log(`controllo inquadrature: ${nf ? nf + ' problemi' : 'nessun problema'}; testa del soggetto mediana ${med}% del quadro (stile Rick 20%, 12-30%); dettagli in ${path.join(out, 'controlli.txt')}`);
    }
    if (VITA.length) {
      scrivi('vita.txt', VITA.map(v => `scena ${v.scena}  ${v.t.toFixed(2)} s  vivo ${Math.round(v.quota * 100)}%  (${v.vivi} vivi / ${v.fermi} fermi)${v.elenco.length ? '  fermi: ' + v.elenco.join('; ') : ''}`).join('\n') + '\n');
      const med = VITA.reduce((s, v) => s + v.quota, 0) / VITA.length; console.log(`mondo vivo: media ${Math.round(med * 100)}% (soglia ${SOGLIA_VITA}%), dettagli in ${path.join(out, 'vita.txt')}`);
    }
    if (TESTI.length) {
      const avvT = new Set(), righeT = []; let nP = 0, nTag = 0, nPic = 0;
      for (const x of TESTI) {
        (x.avvisi || []).forEach(a => { avvT.add(`adattaTesto: ${a}`); nota(x.scena, 'LETTURA', 'ADATTA_TESTO', a); });
        for (const b of x.testi || []) {
          if (b.pass) continue; nP++;
          if (b.clipped) nTag++;
          if (b.linePx < 22) nPic++;
          if (b.clipped || b.linePx < 22) nota(x.scena, 'LETTURA', b.clipped ? 'TESTO_TAGLIATO' : 'TESTO_PICCOLO', `"${b.text}" riga ${b.linePx} px`, x.tk);   // tk = tempo del fotogramma chiave (x.t qui è il tempo dentro la scena)
          if (b.clipped || b.linePx < 22) righeT.push(`scena ${x.scena}  ${x.t.toFixed(2)} s  "${b.text}"  box=[${b.x0},${b.y0},${b.x1},${b.y1}]  riga=${b.linePx}px${b.clipped ? '  TAGLIATO' : ''}${b.linePx < 22 ? '  TROPPO_PICCOLO' : ''}`);
        }
      }
      scrivi('lettura.txt', [...avvT, ...righeT].join('\n') + (avvT.size || righeT.length ? '\n' : 'TESTI 3D: nessun taglio/testo troppo piccolo sui fotogrammi chiave\n'));
      console.log(`lettura testi 3D: ${nP} campionamenti, ${nTag} tagliati, ${nPic} troppo piccoli (<22 px); per tempo continuo: node kit/tools/readcheck.mjs "${src}"`);
    }
    { const d = leggiAvvisi(); for (const { sc, i } of scene) d.scene[i] = { impronta: impronta(sc), fotogrammi: KF.get(i), avvisi: PER.get(i) }; scriviAvvisi(d); console.log(`CANCELLO controlli: ${n} fotogrammi chiave controllati in ${scene.length} scen${scene.length === 1 ? 'a' : 'e'}; avvisi in ${path.join(out, 'avvisi.json')}`); }
    if (!soloCtrl) try { execSync(`"${FF}" -v error -y -pattern_type glob -i "${dir}/a*.jpg" -vf "scale=360:640,tile=${cols}x${rows}:padding=6:color=white" -frames:v 1 -q:v 3 "${path.join(out, 'contact.jpg')}"`); console.log('anteprima:', path.join(out, 'contact.jpg'), `(${n} fotogrammi, in ordine di tempo; singoli in ${dir})`); }
    catch { console.log('fotogrammi di anteprima in', dir, '(ffmpeg non trovato: niente contact sheet)'); }
  } else {
    const dir = path.join(out, 'fotogrammi'); if (solo === null && !process.env.RESUME) fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    for (const { sc, i } of scene) {
      await apri(`/web/storia.html?scena=${i}`); const f0 = Math.round(sc.da * fps), f1 = Math.round(sc.a * fps);
      await scalda(0, fps);
      for (let f = f0; f < f1; f += passo) { const file = `${dir}/f${String(f / passo | 0).padStart(5, '0')}.jpg`; if (process.env.RESUME && fs.existsSync(file)) continue; await scatta(f - f0, f1 - f0, fps, file); tick(); }
    }
    await b.close(); srv.close();
    if (!flag('--solo-fotogrammi')) {
      const mp4 = path.join(out, `${nome}_muto.mp4`), voce = storia.voce && storia.voce.file && path.resolve(base, storia.voce.file), hav = voce && fs.existsSync(voce);
      execSync(`"${FF}" -v error -y -framerate ${fps / passo} -i "${dir}/f%05d.jpg" ${hav ? `-i "${voce}" -c:a aac -b:a 192k -shortest` : ''} -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -movflags +faststart "${mp4}"`);
      console.log('fatto:', mp4, hav ? '(con la voce, senza karaoke e musica: python kit/run.py video …)' : '(senza audio)');
    }
    else console.log('fotogrammi in', dir);
  }
}
