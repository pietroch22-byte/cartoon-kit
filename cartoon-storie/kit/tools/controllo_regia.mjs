// ---- controllo di REGIA (11/11, aggiornato 12/11): varietà, stacchi sulle parole e uso dosato dello zoom veloce.
// Grandezza di ogni tappa dalla testa nel quadro (`testa`, o 0,9 m alla distanza e fov della tappa): primo piano ≥ 18%, mezza figura ≥ 11%, campo largo il resto.
// Avvisa se: un'inquadratura dura più di 4 s (o sotto 0,65 s); tre inquadrature di fila della stessa grandezza (anche tra scene vicine);
// il primo passaggio in un luogo non ha un campo largo; stacchi lontani dalle parole (> 0,14 s); zoom veloci consecutivi o troppo frequenti (> 30%);
// meno di una tappa ogni 3 s. Nessun numero obbligatorio di tagli o durata massima del luogo.
// Tappe consecutive della stessa ripresa non sono nuovi tagli: varietà e mosse si valutano sulle viste/riprese effettive.
export function regia(S, W = []) {
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
  const visti = new Set(), seq = []; let tappe = 0; const dur = sc.length ? sc[sc.length - 1].a - sc[0].da : 0;
  sc.forEach((s, i) => {
    const C = [...(s.camera || [])].sort((a, b) => a.t - b.t); tappe += C.length;
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
  // Cambiare posizione durante una planata non crea tre inquadrature uguali.
  // Un taglio, un altro soggetto esplicito o una diversa grandezza sono invece una nuova vista.
  const soggetto = q => q.k.su || q.k.guarda_ogg || null;
  const viste = seq.filter((q, i) => !i || q.sc !== seq[i-1].sc || q.k.taglio ||
    q.g !== seq[i-1].g || soggetto(q) !== soggetto(seq[i-1]) || q.zv || seq[i-1].zv);
  const riprese = seq.filter((q, i) => !i || q.sc !== seq[i-1].sc || q.k.taglio);
  viste.forEach((q, idx) => {
    if (idx >= 2 && q.g !== 'dettaglio' && q.g === viste[idx - 1].g && q.g === viste[idx - 2].g) R.push(`scena ${q.sc}: tre inquadrature di fila tutte «${q.g}» (alterna le grandezze per dare senso ai tagli)`);
    // una catena di dettagli (causa → effetto su un oggetto) va bene fino a 4; alla quinta serve qualcuno che guarda o reagisce, o il luogo
    if (idx >= 4 && q.g === 'dettaglio' && [1, 2, 3, 4].every(n => viste[idx - n].g === 'dettaglio') && !(idx >= 5 && viste[idx - 5].g === 'dettaglio')) R.push(`scena ${q.sc}: cinque dettagli di fila senza un personaggio (dopo 3-4 oggetti mostra chi guarda o reagisce, o torna sul luogo)`);
    if (idx >= 1 && q.zv && viste[idx - 1].zv) R.push(`scena ${q.sc}: due zoom veloci di fila (usalo ogni tanto sui momenti chiave, non uno dietro l'altro)`);
  });
  // [utente 13/11] varietà delle MOSSE (references/movimenti-camera.md): ogni inquadratura sceglie il suo movimento, mai «spinta + laterale» su tutte
  const FAM = {
    spinta: 'avanti', allontana: 'indietro', gru_indietro: 'indietro', sali: 'gru', scendi: 'gru', laterale: 'carrello', orbita: 'arco', segui_dietro: 'segui', snap_zoom: 'zoom_veloce', zoom_soggetto: 'zoom_veloce', impatto: 'fermo', reazione: 'fermo', stacco: 'fermo',
    avanti_lenta: 'avanti', avanti_forte: 'avanti', risucchio: 'avanti', tilt_su: 'tilt', tilt_giu: 'tilt', gru_su: 'gru', gru_giu: 'gru'
  };
  const mossa = k => { const m = k.mossa || (k.zoom_veloce ? 'zoom_veloce' : ['spinta', 'allontana', 'gru_indietro', 'sali', 'scendi', 'laterale', 'orbita', 'segui', 'segui_dietro', 'frusta', 'impatto', 'inclina', 'fermo', 'snap_zoom', 'zoom_soggetto', 'reazione', 'stacco'].includes(k.preset) ? k.preset : (k.zoom !== undefined || k.pan ? 'a mano' : 'automatica')); return FAM[m] || m; };
  if ((S.stile_camera === 'rick' || riprese.some(q => q.k.preset || q.k.mossa)) && riprese.length >= 6) {
    const ms = riprese.map(q => mossa(q.k)), cnt = {}; ms.forEach(m => cnt[m] = (cnt[m] || 0) + 1);
    if ((cnt.automatica || 0) / ms.length > 0.4) R.push(`${cnt.automatica} inquadrature su ${ms.length} senza una mossa scelta (fanno tutte «spinta + scorrimento di lato»): scegli la "mossa" di ognuna dal vocabolario (references/movimenti-camera.md)`);
    ms.forEach((m, i) => { if (i >= 2 && m === ms[i - 1] && m === ms[i - 2] && m !== 'automatica') R.push(`scena ${riprese[i].sc}: tre inquadrature di fila con la stessa mossa «${m}» (cambia movimento quando cambia l'idea)`); });
    for (const m in cnt) if (m !== 'automatica' && ms.length >= 8 && cnt[m] / ms.length > 0.45) R.push(`la mossa «${m}» è su ${cnt[m]} inquadrature su ${ms.length} (massimo ~45%: Rick spinge spesso in avanti ma alterna panoramiche, allontanamenti, gru, inclinazioni e fermi)`);
    if (ms.length >= 12 && Object.keys(cnt).filter(m => m !== 'automatica').length < 5 && !(cnt.automatica / ms.length > 0.4)) R.push(`solo ${Object.keys(cnt).length} mosse diverse in ${ms.length} inquadrature (almeno 5 in un video intero)`);
    for (const m of ['arco', 'vertigine', 'frusta']) if (cnt[m] > 1) R.push(`la mossa «${m}» c'è ${cnt[m]} volte (una per video: usata due volte perde forza)`);
    if (cnt.inclina > 2) R.push(`${cnt.inclina} inquadrature inclinate (al massimo 2 per video)`);
  }
  const nZv = viste.filter(q => q.zv).length;
  if (viste.length >= 4 && nZv / viste.length > 0.31) R.push(`${nZv} zoom veloci su ${viste.length} inquadrature (usalo ogni tanto sulle svolte, non ovunque)`);
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
  if (dur > 0 && tappe < dur / 3) R.push(`${tappe} inquadrature in ${dur.toFixed(0)} s: servono almeno ${Math.ceil(dur / 3)} (una ogni 3 s)`);
  return R;
}
