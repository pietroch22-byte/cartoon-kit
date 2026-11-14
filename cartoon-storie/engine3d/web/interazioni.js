import { CORPI } from './omino_rick.js';

// INTERAZIONI stilizzate tra personaggi Rick e con gli oggetti (12/11). Si scrivono come azioni dell'attore:
//   { "t": "@parola", "fai": "spinge",    "chi": "b" }              mani sul petto di b, b vola indietro ~0,5 m e si piega
//   { "t": …,         "fai": "tira",      "chi": "b" }              prende b per il braccio e lo trascina verso di sé ~0,35 m
//   { "t": …,         "fai": "strattona", "chi": "b" }              tre strattoni avanti-indietro (b resta dov'è)
//   { "t": …,         "fai": "abbraccia", "chi": "b" }              braccia attorno alle spalle di b (b ricambia con una mano)
//   { "t": …,         "fai": "schiaffo",  "chi": "b" }              mano veloce sulla guancia di b, testa di b che gira di colpo
//   { "t": …,         "fai": "prende",    "ogg": "grattugia" }      va con la mano all'oggetto e da lì in poi lo縫iene in mano
//   { "t": …,         "fai": "lascia" }                             appoggia l'oggetto dove si trova (resta lì)
//   { "t": …,         "fai": "porge",     "ogg": "x", "per": "b" }  passa l'oggetto in mano a b ("a" no: nel motore vuol dire «cammina fino a»)
//   { "t": …,         "fai": "saluta" }  /  { "fai": "indica", "chi": "b" | "punto": [x, y, z] }
//   { "t": …,         "fai": "batte",     "punto": [x, y, z], "colpi": [t1, t2…] }    colpi secchi (uno, o uno per tempo di "colpi") con la mano (e l'oggetto in mano) sul punto VERO del mondo (martelletto, timbro, bussare)
// "dur" (s) cambia la durata; "mano": "destra"|"sinistra" sceglie la mano. Tutto è funzione del tempo: va avanti e indietro senza errori.
// Contatti con gli oggetti (Passo 3):
//   { "t": …, "fai": "gira"|"preme"|"tocca", "ogg": "manopola_0" | ["manopola_0", ...], "rot": [rx, ry, rz], "attiva": { "ogg": "fuoco0", "fai": "mostra" } | [...] }
//   { "t": …, "fai": "apri"|"chiudi", "ogg": "porta_frigo" }
//   { "t": …, "fai": "appoggia", "su_ogg": "tavolo", "ogg": "tazza" }
// Ritmo come Rick: l'azione colpisce 0-3 fotogrammi prima della parola, quindi il colpo arriva al 35% della durata.
const DUR = { batte: 0.45, spinge: 0.7, tira: 0.9, strattona: 1.1, abbraccia: 1.6, schiaffo: 0.45, prende: 0.6, lascia: 0.5, appoggia: 0.6, porge: 0.9, saluta: 1.2, indica: 1.2, tocca: 0.55, preme: 0.55, gira: 0.65, apri: 0.85, chiudi: 0.85 };
const cl = x => Math.max(0, Math.min(1, x));
const ss = x => { x = cl(x); return x * x * (3 - 2 * x); };
const env = u => u <= 0 || u >= 1 ? 0 : u < 0.3 ? ss(u / 0.3) : u < 0.7 ? 1 : 1 - ss((u - 0.7) / 0.3);   // arriva, tiene, torna
const antCurve = (u, peak = 0.22) => (u > 0 && u < peak) ? Math.sin((u / peak) * Math.PI) : 0;   // carico d'anticipo prima del colpo (al 35%)

const getBustoHalfW = (actor) => {
  if (!actor || !actor.opt) return 0.21;
  const ro = actor.opt, sc = (actor.m && actor.m.scale ? actor.m.scale.y : 1);
  const W = 270 * (ro.W || 1);
  const CS = (typeof CORPI !== 'undefined' && CORPI[ro.corpo]) || { largo: 1 };
  const Bw = W * 0.8 * (ro.largo ?? CS.largo ?? 1);
  return (Bw / 512 * sc) / 2;
};

const objNode = (OBJ, id) => (OBJ && id && OBJ[id]) ? [].concat(OBJ[id])[0] : null;
const objWorldPos = (o, anchor = 'center', THREE = null) => {
  if (!o) return { x: 0, y: 0, z: 0 };
  if (o.updateWorldMatrix) o.updateWorldMatrix(true, true);
  if (THREE) {
    let target = o;
    if (anchor === 'handle') {
      o.traverse?.(c => { if (target === o && c !== o && /manigl|pomell|handle|leva/i.test(c.name || '')) target = c; });
    }
    const bb = new THREE.Box3().setFromObject(target);
    if (!bb.isEmpty() && isFinite(bb.min.x)) {
      const c = bb.getCenter(new THREE.Vector3());
      if (anchor === 'top') return { x: c.x, y: bb.max.y, z: c.z };
      if (anchor === 'bottom') return { x: c.x, y: bb.min.y, z: c.z };
      return { x: c.x, y: c.y, z: c.z };
    }
  }
  const e = o.matrixWorld?.elements;
  return e ? { x: e[12], y: e[13], z: e[14] } : { x: o.position.x, y: o.position.y, z: o.position.z };
};
const objBottomOff = (o, THREE = null) => {
  if (!o || !THREE) return 0;
  if (o.updateWorldMatrix) o.updateWorldMatrix(true, true);
  const bb = new THREE.Box3().setFromObject(o);
  if (bb.isEmpty() || !isFinite(bb.min.y)) return 0;
  const e = o.matrixWorld?.elements;
  const wy = e ? e[13] : o.position.y;
  return Math.max(0, wy - bb.min.y);
};

// restituisce per ogni attore: mani (punti del mondo o null), piega, spostamento [dx, dz], testa, più objFx per trasformazioni/eventi sincronizzati col contatto
export function interazioni(ATT, OBJ, t, pos, opt = {}) {
  const THREE = opt.THREE || null;
  const R = {}, objFx = {}, get = id => (R[id] = R[id] || { mani: [null, null], maniPosa: [null, null], maniContact: [false, false], lookTarget: null, lookK: 0, piega: 0, dx: 0, dz: 0, testa: 0, dir: null, dirK: 0, inMovimento: false, passo: 0 });
  const fxFor = id => (id ? (objFx[id] = objFx[id] || {}) : null);
  const P = id => { const p = pos(id), r = R[id]; return r ? { x: p.x + r.dx, z: p.z + r.dz, h: p.h } : p; }, tenuto = {};   // posizione già spostata dalle azioni prima
  const setLook = (a, pt, k) => { if (pt && k > (a.lookK || 0)) { a.lookTarget = { x: pt.x, y: pt.y, z: pt.z }; a.lookK = Math.min(1, k); } };
  const applicaAttiva = (att, dtAct) => {
    if (!att) return;
    for (const item of [].concat(att)) {
      if (!item || !item.ogg) continue;
      const fx = fxFor(item.ogg), fai = item.fai || 'mostra', d = item.dur || 0.35, u = cl(dtAct / d);
      if (fai === 'nascondi') fx.visible = false;
      else if (fai === 'pop') { fx.visible = true; fx.popU = u; }
      else if (fai === 'apri') fx.apertura = ss(u);
      else if (fai === 'chiudi') fx.apertura = 1 - ss(u);
      else fx.visible = true;
    }
  };
  const tutte = []; for (const [id, A] of Object.entries(ATT)) for (const z of A.az || []) if (z.fai) tutte.push({ id, z });
  tutte.sort((a, b) => a.z.t - b.z.t);
  for (const { id, z } of tutte) {
    const a = get(id), pa = P(id), mi = z.mano === 'sinistra' ? 0 : 1;
    const scA = (ATT[id]?.m?.scale?.y) || 1;
    const cycleLen = 0.92 * scA;
    const verso = (q) => { const dx = q.x - pa.x, dz = q.z - pa.z, L = Math.hypot(dx, dz) || 1; return [dx / L, dz / L, L]; };

    // Contatto singolo o sequenza multi-oggetto ("gira" | "preme" | "tocca" su "ogg": id | [id1, id2...])
    if ((z.fai === 'gira' || z.fai === 'preme' || z.fai === 'tocca') && (z.ogg || z.punto)) {
      const ids = Array.isArray(z.ogg) ? z.ogg : (z.ogg ? [z.ogg] : [null]);
      const targets = ids.map((oid, idx) => {
        const node = oid ? objNode(OBJ, oid) : null;
        const p = node ? objWorldPos(node, z.ancora || 'center', THREE) : (z.punto ? { x: z.punto[0], y: z.punto[1], z: z.punto[2] } : null);
        const att = Array.isArray(z.attiva) ? z.attiva[idx] : (z.attiva && oid && z.attiva[oid]) || z.attiva;
        return p ? { ogg: oid, p, attiva: att } : null;
      }).filter(Boolean);
      if (!targets.length) continue;

      const rotTgt = z.rot || [Math.PI * 0.72, 0, 0];
      const reachDist = z.dist ?? 0.44;
      let standPts;
      if (targets.length === 1 && !z.avvicinati) {
        standPts = [{ x: pa.x, z: pa.z }];
      } else {
        let nx = 1, nz = 0;
        if (Array.isArray(z.lato)) { const L = Math.hypot(z.lato[0], z.lato[1]) || 1; nx = z.lato[0] / L; nz = z.lato[1] / L; }
        else if (targets.length > 1) {
          const rx = targets[targets.length - 1].p.x - targets[0].p.x, rz = targets[targets.length - 1].p.z - targets[0].p.z, rL = Math.hypot(rx, rz);
          const cx = (targets[0].p.x + targets[targets.length - 1].p.x) / 2, cz = (targets[0].p.z + targets[targets.length - 1].p.z) / 2;
          if (rL > 0.05) {
            nx = -rz / rL; nz = rx / rL;
            if ((pa.x - cx) * nx + (pa.z - cz) * nz < 0) { nx = -nx; nz = -nz; }
          } else {
            const dL = Math.hypot(pa.x - cx, pa.z - cz) || 1;
            nx = (pa.x - cx) / dL; nz = (pa.z - cz) / dL;
          }
        } else {
          const dL = Math.hypot(pa.x - targets[0].p.x, pa.z - targets[0].p.z) || 1;
          nx = (pa.x - targets[0].p.x) / dL; nz = (pa.z - targets[0].p.z) / dL;
        }
        standPts = targets.map(tg => ({ x: tg.p.x + nx * reachDist, z: tg.p.z + nz * reachDist }));
      }

      const segs = []; let curT = z.t, curPos = { x: pa.x, z: pa.z }, cumDist = 0;
      const stepDur = z.durPassoOgg ?? z.dur ?? DUR[z.fai] ?? 0.62, pauseDur = z.pausa ?? 0.04;
      for (let idx = 0; idx < targets.length; idx++) {
        const sp = standPts[idx], dW = Math.hypot(sp.x - curPos.x, sp.z - curPos.z);
        if (dW > 0.08) {
          const wDur = z.durPasso ?? Math.max(0.28, Math.min(1.6, dW / (z.vel ?? 1.05)));
          segs.push({ kind: 'walk', idx, t0: curT, t1: curT + wDur, tEnd: curT + wDur, from: { ...curPos }, to: { ...sp }, look: targets[idx].p, prevTgt: idx > 0 ? targets[idx - 1].p : null, d: dW, cumDist });
          cumDist += dW; curT += wDur; curPos = { ...sp };
        }
        segs.push({ kind: 'act', idx, t0: curT, t1: curT + stepDur, tEnd: curT + stepDur + pauseDur, stand: { ...sp }, tgt: targets[idx] });
        curT += stepDur + pauseDur;
      }
      if (t < z.t) continue;
      const lastSeg = segs[segs.length - 1];
      for (const s of segs) {
        if (s.kind !== 'act') continue;
        if (t >= s.t1 - stepDur * 0.28) {
          if (z.fai === 'gira' && s.tgt.ogg) fxFor(s.tgt.ogg).rot = [...rotTgt];
          const trigT = s.t0 + stepDur * (z.fai === 'tocca' ? 0.42 : 0.55);
          if (t >= trigT) applicaAttiva(s.tgt.attiva, t - trigT);
        }
      }
      if (t >= lastSeg.tEnd) {
        const nextW = (ATT[id].az || []).find(q => q.a && q.t >= z.t);
        if (nextW && t >= nextW.t) {
          const pW0 = pos(id, nextW.t), dW0 = Math.hypot(nextW.a[0] - pW0.x, nextW.a[1] - pW0.z);
          const wDur = nextW.dur || (dW0 > 1e-4 ? dW0 / 1.25 : 0.01);
          const uW = cl((t - nextW.t) / wDur);
          if (uW < 1) {
            a.dx += (curPos.x - pW0.x) * (1 - ss(uW));
            a.dz += (curPos.z - pW0.z) * (1 - ss(uW));
          }
        } else {
          a.dx += curPos.x - pa.x; a.dz += curPos.z - pa.z;
          const dtOut = t - lastSeg.tEnd;
          if (dtOut < 0.35 && lastSeg.tgt) {
            const dlx = lastSeg.tgt.p.x - curPos.x, dlz = lastSeg.tgt.p.z - curPos.z, ll = Math.hypot(dlx, dlz) || 1;
            a.dir = [dlx / ll, dlz / ll];
            a.dirK = 1 - ss(dtOut / 0.35);
          }
        }
        continue;
      }
      const curSi = segs.findIndex(s => t >= s.t0 && t < (s.tEnd ?? s.t1));
      const curSeg = curSi >= 0 ? segs[curSi] : null;
      const nextActSeg = curSi >= 0 ? segs.slice(curSi + 1).find(s => s.kind === 'act') : null;
      const handPose = z.posa || (z.fai === 'gira' ? 'presa' : z.fai === 'tocca' ? 'aperta' : 'indica');
      if (curSeg) {
        if (curSeg.kind === 'walk') {
          const uu = ss((t - curSeg.t0) / (curSeg.t1 - curSeg.t0));
          const pxN = curSeg.from.x + (curSeg.to.x - curSeg.from.x) * uu, pzN = curSeg.from.z + (curSeg.to.z - curSeg.from.z) * uu;
          a.dx += pxN - pa.x; a.dz += pzN - pa.z;
          a.inMovimento = true; a.passo = (curSeg.cumDist + curSeg.d * uu) / cycleLen;
          const dwx = curSeg.to.x - curSeg.from.x, dwz = curSeg.to.z - curSeg.from.z, lw = Math.hypot(dwx, dwz) || 1;
          const dlx = curSeg.look.x - curSeg.to.x, dlz = curSeg.look.z - curSeg.to.z, ll = Math.hypot(dlx, dlz) || 1;
          const kLook = curSeg.d <= 0.75 ? 0.96 : curSeg.d <= 1.2 ? 0.76 : 0.15;
          const mx = (dlx / ll) * kLook + (dwx / lw) * (1 - kLook), mz = (dlz / ll) * kLook + (dwz / lw) * (1 - kLook), lm = Math.hypot(mx, mz) || 1;
          a.dir = [mx / lm, mz / lm]; a.dirK = 1;
          setLook(a, curSeg.look, curSeg.d <= 0.8 ? 0.9 : 0.55);
          // Ponte fluido della mano tra un pomello/oggetto e il successivo se il passo è breve
          if (curSeg.prevTgt && curSeg.d <= 0.80) {
            const hop = Math.sin(uu * Math.PI) * 0.045;
            a.mani[mi] = {
              x: curSeg.prevTgt.x + (curSeg.look.x - curSeg.prevTgt.x) * uu,
              y: curSeg.prevTgt.y + (curSeg.look.y - curSeg.prevTgt.y) * uu + hop,
              z: curSeg.prevTgt.z + (curSeg.look.z - curSeg.prevTgt.z) * uu,
              k: 0.84,
            };
            a.maniContact[mi] = true;
            a.maniPosa[mi] = handPose;
            a.piega += 3.2; a.testa += 4.5;
          }
        } else {
          const s = curSeg, uu = cl((t - s.t0) / (s.t1 - s.t0));
          a.dx += s.stand.x - pa.x; a.dz += s.stand.z - pa.z;
          const dlx = s.tgt.p.x - s.stand.x, dlz = s.tgt.p.z - s.stand.z, ll = Math.hypot(dlx, dlz) || 1;
          const ux = dlx / ll, uz = dlz / ll;
          a.dir = [ux, uz]; a.dirK = 1;
          const prevBridge = s.idx > 0 && curSi > 0 && segs[curSi - 1].kind === 'walk' && segs[curSi - 1].d <= 0.80;
          const keepBridge = !!nextActSeg && (!segs[curSi + 1] || segs[curSi + 1].kind !== 'walk' || segs[curSi + 1].d <= 0.80);
          const ant = !prevBridge ? antCurve(uu, 0.16) : 0;
          const kIn = prevBridge ? (0.84 + 0.16 * ss(uu / 0.18)) : ss(uu / 0.24);
          const kOut = keepBridge ? (1 - 0.16 * ss((uu - 0.82) / 0.18)) : (1 - ss((uu - 0.78) / 0.22));
          const eReach = t >= s.t1 ? (keepBridge ? 0.84 : 0) : (uu < 0.24 ? kIn : uu > 0.78 ? kOut : 1);
          a.piega += 4.5 * eReach - 3 * ant; a.testa += 6.5 * eReach - 3 * ant;
          const hp = { x: s.tgt.p.x, y: s.tgt.p.y, z: s.tgt.p.z, k: eReach };
          if (z.fai === 'gira') {
            const tw = ss(cl((uu - 0.24) / 0.48));
            hp.y += Math.sin(tw * Math.PI) * 0.026;
            hp.x += (-uz) * Math.sin(tw * Math.PI) * 0.024 - ux * ant * 0.035;
            hp.z += ux * Math.sin(tw * Math.PI) * 0.024 - uz * ant * 0.035;
            if (tw > 0 && s.tgt.ogg) fxFor(s.tgt.ogg).rot = [rotTgt[0] * tw, rotTgt[1] * tw, rotTgt[2] * tw];
            if (uu >= 0.52) applicaAttiva(s.tgt.attiva, t - (s.t0 + (s.t1 - s.t0) * 0.52));
          } else if (z.fai === 'preme') {
            const pr = Math.sin(cl((uu - 0.24) / 0.44) * Math.PI);
            const aff = z.affonda ?? 0.028;
            hp.x += ux * (aff * pr - ant * 0.045); hp.z += uz * (aff * pr - ant * 0.045);
            if (s.tgt.ogg) fxFor(s.tgt.ogg).offset = [ux * aff * pr, 0, uz * aff * pr];
            if (uu >= 0.46) applicaAttiva(s.tgt.attiva, t - (s.t0 + (s.t1 - s.t0) * 0.46));
          } else {
            const liftArc = Math.sin(cl(uu / 0.42) * Math.PI) * 0.035;
            hp.y += liftArc;
            if (uu >= 0.42) applicaAttiva(s.tgt.attiva, t - (s.t0 + (s.t1 - s.t0) * 0.42));
          }
          setLook(a, hp, 0.95);
          a.mani[mi] = eReach > 0.01 ? hp : null;
          a.maniContact[mi] = eReach > 0.01;
          a.maniPosa[mi] = handPose;
        }
      }
      continue;
    }

    const dur = z.dur ?? DUR[z.fai] ?? 0.8, u = (t - z.t) / dur; if (u < 0) continue;
    const e = env(u), fine = u >= 1;
    if (z.chi && ATT[z.chi]) { const b = get(z.chi), pb = P(z.chi), [ux, uz] = verso(pb);
      const hwB = getBustoHalfW(ATT[z.chi]), hwA = getBustoHalfW(ATT[id]);
      if (z.fai === 'spinge') { const k = ss((u - 0.28) / 0.36), ant = antCurve(u, 0.24); const dist = 0.5 * k; b.dx += ux * dist; b.dz += uz * dist;
        if (u >= 0.26 && u < 0.76) { b.inMovimento = true; b.passo = dist / 0.44; }
        if (!fine) { const bTorso = { x: pb.x - ux * (hwB + 0.16 * ant), z: pb.z - uz * (hwB + 0.16 * ant) }, perpX = -uz * 0.08, perpZ = ux * 0.08, rk = Math.max(e, ant * 0.9);
          const h0 = { x: bTorso.x + perpX, y: pb.h * (0.60 - 0.04 * ant), z: bTorso.z + perpZ, k: rk }, h1 = { x: bTorso.x - perpX, y: pb.h * (0.60 - 0.04 * ant), z: bTorso.z - perpZ, k: rk };
          a.mani = [rk > 0.01 ? h0 : null, rk > 0.01 ? h1 : null]; a.maniContact = [true, true]; a.maniPosa = [z.posa || 'aperta', z.posa || 'aperta'];
          a.piega += 11 * e - 9 * ant; a.testa += 5 * e - 6 * ant; a.dir = [ux, uz]; a.dirK = 1;
          setLook(a, { x: pb.x, y: pb.h * 0.78, z: pb.z }, 0.9);
          const rec = u > 0.68 ? Math.sin(cl((u - 0.68) / 0.30) * Math.PI) * 5.5 : 0;
          b.piega += 18 * Math.max(0, Math.sin(Math.PI * cl((u - 0.28) / 0.52))) - rec;
          b.testa += -13 * Math.max(0, Math.sin(Math.PI * cl((u - 0.28) / 0.56))) + rec * 0.8;
          b.dir = [ux, uz]; b.dirK = 1; } }
      if (z.fai === 'tira') { const k = ss((u - 0.34) / 0.50), ant = antCurve(u, 0.22); const dist = 0.35 * k; b.dx -= ux * dist; b.dz -= uz * dist;
        if (u >= 0.32 && u < 0.88) { b.inMovimento = true; b.passo = dist / 0.42; }
        if (!fine) { const bBorder = { x: pb.x - ux * hwB, z: pb.z - uz * hwB };
          a.mani[mi] = e ? { x: bBorder.x, y: pb.h * 0.50, z: bBorder.z, k: e } : null; a.maniContact[mi] = true; a.maniPosa[mi] = z.posa || 'presa';
          a.piega += 6 * ant - 12 * Math.max(0, k); a.testa += 4 * ant - 5 * Math.max(0, k); a.dir = [ux, uz]; a.dirK = 1;
          b.piega -= 11 * e; b.dir = [ux, uz]; b.dirK = 1;
          setLook(a, { x: pb.x, y: pb.h * 0.72, z: pb.z }, 0.9);
          b.mani[1 - mi] = e ? { x: bBorder.x, y: pb.h * 0.50, z: bBorder.z, k: e } : null; b.maniContact[1 - mi] = true; } }
      if (z.fai === 'strattona' && !fine) { const j = Math.sin(u * Math.PI * 6) * e;
        b.dx -= ux * 0.1 * j; b.dz -= uz * 0.1 * j; b.piega -= 12 * j; b.dir = [ux, uz]; b.dirK = 1; a.piega -= 6 * j; a.dir = [ux, uz]; a.dirK = 1;
        if (Math.abs(j) > 0.04) { b.inMovimento = true; b.passo = Math.abs(j) * 0.35; }
        const bBorder = { x: pb.x - ux * hwB, z: pb.z - uz * hwB };
        a.mani[mi] = e ? { x: bBorder.x, y: pb.h * 0.50, z: bBorder.z, k: e } : null; a.maniContact[mi] = true; a.maniPosa[mi] = z.posa || 'presa';
        b.mani[1 - mi] = a.mani[mi]; b.maniContact[1 - mi] = true; }
      if (z.fai === 'abbraccia' && !fine) { const midChest = { x: pb.x - ux * (hwB * 0.2), z: pb.z - uz * (hwB * 0.2) };
        const ox = -uz * (hwB + 0.04), oz = ux * (hwB + 0.04);
        a.mani = [e ? { x: midChest.x + ox, y: pb.h * 0.68, z: midChest.z + oz, k: e } : null, e ? { x: midChest.x - ox, y: pb.h * 0.68, z: midChest.z - oz, k: e } : null]; a.maniPosa = ['aperta', 'aperta']; a.piega += 6 * e; a.dir = [ux, uz]; a.dirK = 1;
        const aBorder = { x: pa.x + ux * hwA, z: pa.z + uz * hwA };
        b.mani[0] = e ? { x: aBorder.x, y: pa.h * 0.68, z: aBorder.z, k: e } : null; b.piega -= 5 * e; b.dir = [ux, uz]; b.dirK = 1; }
      if (z.fai === 'schiaffo' && !fine) { const ant = antCurve(u, 0.24), perp = mi ? 1 : -1;
        a.mani[mi] = e ? { x: pb.x - ux * (0.05 + 0.26 * ant) - uz * perp * 0.22 * ant, y: pb.h * (0.88 + 0.06 * ant), z: pb.z - uz * (0.05 + 0.26 * ant) + ux * perp * 0.22 * ant, k: e } : null; a.maniContact[mi] = true; a.maniPosa[mi] = z.posa || 'aperta';
        a.piega += 6 * e - 9 * ant; a.dir = [ux, uz]; a.dirK = 1; setLook(a, { x: pb.x, y: pb.h * 0.88, z: pb.z }, 0.95);
        const k = Math.max(0, Math.sin(Math.PI * cl((u - 0.3) / 0.7))); b.testa += 22 * k * (ux >= 0 ? 1 : -1); b.piega += 6 * k; b.dir = [ux, uz]; b.dirK = 1; }
      if (z.fai === 'indica' && !fine) { a.mani[mi] = e ? { x: pa.x + ux * 0.55, y: pa.h * 0.8, z: pa.z + uz * 0.55, k: e } : null; a.maniContact[mi] = true; a.maniPosa[mi] = z.posa || 'indica'; } }
    if (z.fai === 'indica' && z.punto && !fine) { const [ux, uz] = verso({ x: z.punto[0], z: z.punto[2] }); a.mani[mi] = e ? { x: pa.x + ux * 0.55, y: pa.h * 0.8, z: pa.z + uz * 0.55, k: e } : null; a.maniContact[mi] = true; a.maniPosa[mi] = z.posa || 'indica'; }
    if (z.fai === 'batte' && z.punto && z.colpi) { const C = z.colpi, D2 = z.dur ?? (C[C.length - 1] - z.t + 0.35), u2 = (t - z.t) / D2;
      if (u2 >= 0 && u2 < 1) { const [ux, uz] = verso({ x: z.punto[0], z: z.punto[2] }), lead = Math.min(0.25, (C[0] - z.t) * 0.8), su = (t - z.t) < lead ? ss((t - z.t) / lead) : u2 > 1 - 0.25 / D2 ? 1 - ss((u2 - (1 - 0.25 / D2)) / (0.25 / D2)) : 1;
        let h = 0, pre = 0; for (const tc of C) { h = Math.max(h, 1 - Math.abs(t - tc) / 0.11); if (tc > t && tc - t < 0.14) pre = Math.max(pre, Math.sin(((0.14 - (tc - t)) / 0.14) * Math.PI)); } h = Math.max(0, h);
        a.piega += 7.5 * h - 5.0 * pre; a.testa += 5.0 * h - 3.5 * pre;
        a.mani[mi] = { x: z.punto[0] - ux * (0.16 * (1 - h) + 0.06 * pre), y: z.punto[1] + 0.09 * (1 - h) + 0.12 * pre, z: z.punto[2] - uz * (0.16 * (1 - h) + 0.06 * pre), k: su };
        a.maniContact[mi] = true; a.maniPosa[mi] = z.posa || 'pugno';
        setLook(a, { x: z.punto[0], y: z.punto[1], z: z.punto[2] }, 0.85 * su); } }
    else if (z.fai === 'batte' && z.punto && !fine) { const [ux, uz] = verso({ x: z.punto[0], z: z.punto[2] }), ant = antCurve(u, 0.22), h = Math.max(0, 1 - Math.abs(u - 0.35) / 0.2), su = u < 0.2 ? ss(u / 0.2) : u > 0.8 ? 1 - ss((u - 0.8) / 0.2) : 1;
      a.piega += 8.0 * h - 5.5 * ant; a.testa += 5.5 * h - 4.0 * ant;
      a.mani[mi] = { x: z.punto[0] - ux * (0.16 * (1 - h) + 0.07 * ant), y: z.punto[1] + 0.09 * (1 - h) + 0.14 * ant, z: z.punto[2] - uz * (0.16 * (1 - h) + 0.07 * ant), k: su };
      a.maniContact[mi] = true; a.maniPosa[mi] = z.posa || 'pugno';
      setLook(a, { x: z.punto[0], y: z.punto[1], z: z.punto[2] }, 0.85 * su); }
    if (z.fai === 'saluta' && !fine) { a.mani[mi] = e ? { x: pa.x + Math.sin(u * Math.PI * 8) * 0.08, y: pa.h * 1.15, z: pa.z, laterale: 0.32, k: e } : null; a.maniPosa[mi] = z.posa || 'aperta'; }
    if ((z.fai === 'apri' || z.fai === 'chiudi') && z.ogg && OBJ[z.ogg]) {
      const o = objNode(OBJ, z.ogg), targetAp = z.fai === 'apri' ? 1 : 0, fromAp = z.fai === 'apri' ? 0 : 1;
      const mv = cl((u - 0.28) / 0.54);
      fxFor(z.ogg).apertura = u < 0.28 ? fromAp : u >= 0.82 ? targetAp : (fromAp + (targetAp - fromAp) * ss(mv));
      if (!fine && o) {
        const hp = z.punto ? { x: z.punto[0], y: z.punto[1], z: z.punto[2] } : objWorldPos(o, 'handle', THREE);
        const ant = antCurve(u, 0.20);
        const reach = u < 0.28 ? ss(u / 0.28) : u > 0.82 ? 1 - ss((u - 0.82) / 0.18) : 1;
        const [ux, uz] = verso(hp); a.dir = [ux, uz]; a.dirK = 1;
        const pullLean = z.fai === 'apri' ? (6.5 * reach - 4.5 * ant) : (4 * reach - 7.5 * Math.sin(mv * Math.PI));
        a.piega += pullLean; a.testa += 5 * reach;
        setLook(a, hp, 0.9 * reach);
        a.mani[mi] = { x: hp.x, y: hp.y, z: hp.z, k: reach };
        a.maniContact[mi] = true;
        a.maniPosa[mi] = z.posa || 'presa';
      }
    }
    if (z.fai === 'prende' && z.ogg && OBJ[z.ogg]) { const o = objNode(OBJ, z.ogg), p = objWorldPos(o, z.ancora || 'center', THREE);
      if (u < 0.48) {
        const ant = antCurve(u, 0.16), reach = ss(cl((u - 0.08) / 0.36));
        const [ux, uz] = verso(p); a.dir = [ux, uz]; a.dirK = 1;
        a.piega += 4.5 * reach - 3 * ant; a.testa += 5.5 * reach;
        setLook(a, p, 0.92 * reach);
        a.mani[mi] = reach > 0.01 ? { x: p.x, y: p.y + Math.sin(reach * Math.PI) * 0.03, z: p.z, k: reach } : null;
        a.maniContact[mi] = true;
        a.maniPosa[mi] = z.posa || (u > 0.38 ? 'presa' : 'aperta');
      } else {
        tenuto[z.ogg] = { id, mano: mi };
        if (u < 1) {
          const ret = 1 - ss((u - 0.50) / 0.50), liftArc = Math.sin(cl((u - 0.48) / 0.52) * Math.PI) * 0.055;
          const [ux, uz] = verso(p); a.dir = [ux, uz]; a.dirK = ret;
          a.piega += 4 * ret; a.testa += 4.5 * ret;
          setLook(a, p, 0.7 * ret);
          if (ret > 0.01) {
            a.mani[mi] = { x: p.x, y: p.y + liftArc, z: p.z, k: ret };
            a.maniContact[mi] = true;
            a.maniPosa[mi] = z.posa || 'presa';
          }
        }
      }
    }
    if (z.fai === 'appoggia') {
      const key = z.ogg || Object.keys(tenuto).find(k => tenuto[k].id === id && !tenuto[k].lasciato);
      if (key && tenuto[key]) {
        const oHeld = objNode(OBJ, key), bOff = objBottomOff(oHeld, THREE);
        let dest = null;
        if (z.punto) dest = { x: z.punto[0], y: z.punto[1] + bOff, z: z.punto[2] };
        else if (z.su_ogg && OBJ[z.su_ogg]) { const su = objWorldPos(objNode(OBJ, z.su_ogg), 'top', THREE); dest = { x: su.x + (z.offX || 0), y: su.y + bOff, z: su.z + (z.offZ || 0) }; }
        if (dest) {
          const [ux, uz] = verso(dest);
          if (u < 0.62) {
            a.dir = [ux, uz]; a.dirK = 1; a.piega += 5 * env(u); a.testa += 5.5 * env(u);
            setLook(a, dest, 0.9 * env(u));
            const kR = u < 0.36 ? ss(u / 0.36) : 1;
            const arch = Math.sin(cl(u / 0.38) * Math.PI) * 0.045;
            a.mani[tenuto[key].mano ?? mi] = { x: dest.x, y: dest.y + arch, z: dest.z, k: kR };
            a.maniContact[tenuto[key].mano ?? mi] = true;
            a.maniPosa[tenuto[key].mano ?? mi] = z.posa || 'presa';
            tenuto[key].versoPonto = { p: dest, k: ss(cl((u - 0.24) / 0.36)) };
          } else {
            tenuto[key].lasciato = true; tenuto[key].lasciatoT = z.t + dur * 0.62; tenuto[key].dropAt = dest;
            if (!fine) {
              const ret = 1 - ss((u - 0.64) / 0.36);
              a.dir = [ux, uz]; a.dirK = ret; a.piega += 4 * ret; a.testa += 4 * ret;
              setLook(a, dest, 0.7 * ret);
              a.mani[tenuto[key].mano ?? mi] = ret > 0.01 ? { x: dest.x, y: dest.y + Math.sin(cl((u - 0.62) / 0.38) * Math.PI) * 0.03, z: dest.z, k: ret } : null;
              a.maniContact[tenuto[key].mano ?? mi] = true;
              a.maniPosa[tenuto[key].mano ?? mi] = 'aperta';
            }
          }
        }
      }
    }
    if (z.fai === 'lascia') for (const k in tenuto) if (tenuto[k].id === id) {
      const mRel = tenuto[k].mano ?? mi;
      if (u < 0.5) {
        a.testa += 4 * ss(u / 0.5); a.piega += 3 * ss(u / 0.5);
        a.maniPosa[mRel] = u > 0.35 ? 'aperta' : 'presa';
      } else {
        tenuto[k].lasciato = true; tenuto[k].lasciatoT = z.t + dur * 0.5;
        if (!fine) a.maniPosa[mRel] = 'aperta';
      }
    }
    if (z.fai === 'porge' && z.ogg && z.per && tenuto[z.ogg]) {
      const rx = ATT[z.per] ? P(z.per) : null;
      if (u < 0.62) {
        const reach = ss(u / 0.62);
        tenuto[z.ogg].verso = { a: z.per, k: reach };
        if (rx) {
          const [ux, uz] = verso(rx); a.dir = [ux, uz]; a.dirK = 1; a.piega += 4.5 * reach;
          setLook(a, { x: rx.x, y: pbCenterY(rx, pa), z: rx.z }, 0.85 * reach);
          const midPt = { x: pa.x + (rx.x - pa.x) * 0.55, y: 0.72 * scA, z: pa.z + (rx.z - pa.z) * 0.55, k: reach * 0.85 };
          a.mani[tenuto[z.ogg].mano ?? mi] = midPt; a.maniPosa[tenuto[z.ogg].mano ?? mi] = 'aperta';
          const b = get(z.per);
          if (u > 0.20) {
            const br = ss((u - 0.20) / 0.42);
            b.mani[0] = { x: pa.x + (rx.x - pa.x) * 0.55, y: 0.72 * scA, z: pa.z + (rx.z - pa.z) * 0.55, k: br * 0.90 };
            b.maniPosa[0] = br > 0.75 ? 'presa' : 'aperta';
            b.dir = [-ux, -uz]; b.dirK = 1; b.piega += 3.5 * br;
          }
        }
      } else {
        tenuto[z.ogg] = { id: z.per, mano: 0 };
        if (!fine && rx) {
          const ret = 1 - ss((u - 0.62) / 0.38);
          const b = get(z.per);
          if (ret > 0.01) {
            b.mani[0] = { x: pa.x + (rx.x - pa.x) * 0.55, y: 0.72 * scA, z: pa.z + (rx.z - pa.z) * 0.55, k: ret * 0.85 };
            b.maniPosa[0] = 'presa';
            b.piega += 3 * ret;
          }
        }
      }
    }
  }
  return { R, tenuto, objFx };
}
function pbCenterY(pb, pa) { return ((pb && pb.h) || (pa && pa.h) || 1.6) * 0.52; }
