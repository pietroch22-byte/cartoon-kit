// Main: reads timeline.json (written by kit/engine/film.py) and renders window.renderFrame(f).
// Characters are the reference 2D cards (cards.js) turned to the camera; cameras follow keyframes with
// smootherstep, small moves and cuts between shots, as in the reference video.
import * as THREE from 'three';
import { scene, camera, applyLight, L, sstep, lerp, ndCardMat, basic, noND } from './engine.js';
import { drawChar, CW, CH } from './cards.js';
import { initLook, renderLook, lightRig } from './look.js';
import { buildPlace, BYID, SPIN, FLAMES, STEAM } from './world.js';
import { chooseCamera } from './director.js';
import { OUTFITS } from './cards.js';

const Q = new URLSearchParams(location.search);
const WORK = Q.get('work') || '/work', KIT = Q.get('kit') || '/kit';
const TL = await fetch(`${WORK}/timeline.json`, { cache: 'no-store' }).then(r => r.json());

const PLACES = {}; let ox = 0;
for (const [name, P] of Object.entries(TL.places)) { PLACES[name] = await buildPlace(P, ox, KIT); ox += 300; }
await initLook(KIT, [...new Set(TL.beats.map(b => b.light))]);

// ---------- character cards ----------
const pool = {};
function card(id) {
  if (pool[id]) return pool[id];
  const c = document.createElement('canvas'); c.width = CW; c.height = CH;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const geo = new THREE.PlaneGeometry(1.6, 2.4); geo.translate(0, 1.2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5 }); m.castShadow = true;
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.4, 24), basic('#1a0f20', { transparent: true, opacity: 0.28, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; scene.add(m, sh);
  return (pool[id] = { m, sh, g: c.getContext('2d'), t, key: null });
}
const val = (tracks, f, base) => { let v = base; for (const [f0, f1, from, to] of tracks || []) { if (f >= f0) v = lerp(from, to, sstep(f0, Math.max(f0 + 1, f1), f)); } return v; };
function actorState(a, f, b) {
  const s = { type: a.type, outfit: a.outfit, pose: a.pose, expr: a.expr, flip: a.flip, prop: a.prop, tray: a.tray };
  for (const [ef, e] of a.events || []) if (f >= ef) Object.assign(s, e);
  const seed = a.seed || 0;
  s.blink = ((f + seed * 37) % 97) < 3;
  s.bob = Math.sin((f + seed * 13) * 0.12) * 0.006;
  // lip sync: open-close once per syllable inside each spoken word, closed between words
  const w = (a.talk || []).find(([w0, w1]) => f >= w0 && f < w1);
  s.talk = w ? Math.round(Math.abs(Math.sin(Math.PI * ((f - w[0]) / Math.max(1, w[1] - w[0])) * (w[2] || 1))) * 4) / 4 : 0;
  for (const p of ['fat', 'roll', 'squash', 'tilt', 'look', 'chew', 'glint']) { const v = val(a.anim?.[p], f, a[p]); if (v !== undefined) s[p] = v; }
  return s;
}
function drawActors(b, f, place) {
  for (const k in pool) { pool[k].m.visible = false; pool[k].sh.visible = false; }
  const shown = [];
  for (const a of b.cast || []) {
    if (a.from !== undefined && f < a.from) continue;
    const P = card(a.id), s = actorState(a, f, b);
    const key = JSON.stringify(s);
    if (P.key !== key) { drawChar(P.g, s); P.t.needsUpdate = true; P.key = key; }
    let x = a.x, z = a.z || 0;
    if (a.mv) { const u = sstep(a.mv[0], a.mv[0] + a.mv[3], f); x = lerp(x, a.mv[1], u); z = lerp(z, a.mv[2], u); }
    const X = place.ox + x;
    P.m.position.set(X, a.y || 0, z); P.m.scale.setScalar(a.s || 1);
    P.m.rotation.set(0, Math.atan2(camera.position.x - X, camera.position.z - z), 0);
    P.sh.position.set(X, 0.012, z); P.sh.scale.setScalar((a.s || 1) * (1 + (s.fat || 0) * 0.6));
    P.m.visible = P.sh.visible = true; shown.push(P.m);
  }
  return shown;
}

// ---------- objects that react to the words ----------
const backOut = x => { x = Math.min(1, Math.max(0, x)); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
function updateObjects(f) {
  for (const s of SPIN) s.m.rotation[s.axis] = s.base + f / TL.fps * s.speed * Math.PI * 2;
  for (const [id, evs] of Object.entries(TL.events || {})) {
    const o = BYID[id]; if (!o) continue;
    let vis = !o.it.hidden, pop = null, mv = null, on = o.it.on, from = o.base.toArray(), shake = null, hop = null, spin = null, opens = {};
    for (const [ef, e] of evs) {
      if (ef > f) break;
      if (e.show || e.pop) { vis = true; if (e.pop) pop = ef; if (e.from) { mv = [ef, e.from, o.base.toArray(), e.dur || 30]; } }
      if (e.hide) vis = false;
      if (e.move) { mv = [ef, from, e.move, e.dur || 20]; from = e.move; }
      if (e.open) opens[e.open] = [ef, e.dur || 18, e.angle ?? 100];                    // door / lid opens on the word
      if (e.close) opens[e.close] = [ef, e.dur || 18, 0, true];
      if (e.shake) shake = [ef, e.dur || 30, typeof e.shake === 'number' ? e.shake : 0.03];   // trembles on the word
      if (e.hop) hop = [ef, e.dur || 24, typeof e.hop === 'number' ? e.hop : 0.25];         // jumps / bounces
      if (e.spin) spin = [ef, e.dur || 30, typeof e.spin === 'number' ? e.spin : 1];        // turns on itself
      if (e.on !== undefined) on = e.on;
    }
    if (o.kind === 'light') { o.obj.intensity = on === false ? 0 : o.on; continue; }
    o.obj.visible = vis;
    o.obj.scale.setScalar((o.it.scale || 1) * (pop === null ? 1 : Math.max(0.001, backOut((f - pop) / 9))));
    if (mv) { const u = sstep(mv[0], mv[0] + mv[3], f); o.obj.position.set(...mv[1].map((v, i) => lerp(v, mv[2][i], u))); }
    else o.obj.position.copy(o.base);
    if (shake && f >= shake[0] && f < shake[0] + shake[1]) { const k = 1 - (f - shake[0]) / shake[1]; o.obj.position.x += Math.sin(f * 2.7) * shake[2] * k; o.obj.position.z += Math.cos(f * 3.1) * shake[2] * 0.6 * k; o.obj.rotation.z = Math.sin(f * 2.3) * shake[2] * 3 * k; }
    for (const [name, op] of Object.entries(opens)) { const hg = o.obj.userData.hinges?.[name]; if (!hg) continue;
      const u = sstep(op[0], op[0] + op[1], f), ang = (op[3] ? (1 - u) * 100 : u * op[2]) * Math.PI / 180; hg.rotation[hg.userData.axis] = -ang; }
    if (hop && f >= hop[0] && f < hop[0] + hop[1]) { const u = (f - hop[0]) / hop[1]; o.obj.position.y += Math.abs(Math.sin(u * Math.PI * 3)) * hop[2] * (1 - u); }
    if (spin && f >= spin[0]) o.obj.rotation.y = (o.it.ry || 0) * Math.PI / 180 + sstep(spin[0], spin[0] + spin[1], f) * spin[2] * Math.PI * 2;
    o.on = on;
  }
  for (const fl of FLAMES) { // ignite with a pop, then flicker
    const id = fl.it.id, ev = (TL.events || {})[id] || []; let on = !!fl.it.on, t0 = -99;
    for (const [ef, e] of ev) if (ef <= f && e.on !== undefined) { if (e.on && !on) t0 = ef; on = e.on; }
    const grow = on ? (t0 < 0 ? 1 : backOut((f - t0) / 8)) : 0;
    fl.g.children.forEach((c, i) => { const k = 1 + 0.12 * Math.sin(f * 0.9 + i * 2 + fl.flick); c.scale.set(grow, Math.max(0.001, grow * k), grow); });
    fl.g.visible = grow > 0.01;
  }
  for (const s of STEAM) s.g.children.forEach((m, i) => { const t = ((f / TL.fps) * 0.5 + i / 4 + s.k * 0.13) % 1; m.position.set(Math.sin(t * 6 + i) * 0.06, t * 0.9, 0); m.scale.setScalar(0.6 + t * 1.6); m.material.opacity = 0.5 * (1 - t); });
}

// ---------- camera: keyframes [frame, pos, look, fov] with smootherstep, cut between shots ----------
// keys may carry a 5th element: {lin: 1} = read linearly (dense tracking keys, no stop-and-go),
// {bend: [x,y,z]} on the arrival key of a glide = the path curves by that much in the middle (to go round furniture).
function camOf(c, f) {
  const k = c.keys;
  let i = 0; while (i < k.length - 1 && f > k[i + 1][0]) i++;
  const A = k[i], B = k[Math.min(i + 1, k.length - 1)], lin = A[4]?.lin && B[4]?.lin;
  const u = A === B ? 0 : lin ? Math.min(1, Math.max(0, (f - A[0]) / Math.max(1, B[0] - A[0]))) : sstep(A[0], B[0], f);
  const L3 = (p, q) => p.map((v, j) => lerp(v, q[j], u));
  const pos = L3(A[1], B[1]);
  if (B[4]?.bend && A !== B) { const s = Math.sin(Math.PI * u); for (let j = 0; j < 3; j++) pos[j] += B[4].bend[j] * s; }
  return { pos, look: L3(A[2], B[2]), fov: lerp(A[3], B[3], u), shake: c.shake && f - c.f0 < 10 ? (1 - (f - c.f0) / 10) : 0 };
}
function camAt(b, f) { return camOf(b.cams.find(c => f >= c.f0 && f < c.f1) || b.cams[b.cams.length - 1], f); }

let current = null;
window.renderFrame = f => {
  const b = TL.beats.find(x => f >= x.f0 && f < x.f1) || TL.beats[TL.beats.length - 1];
  const place = PLACES[b.place];
  if (current !== b.place) { for (const k in PLACES) PLACES[k].G.visible = k === b.place; current = b.place; }
  const c = camAt(b, f);
  camera.position.set(place.ox + c.pos[0], c.pos[1], c.pos[2]);
  if (c.shake) { camera.position.x += Math.sin(f * 2.3) * 0.05 * c.shake; camera.position.y += Math.cos(f * 1.9) * 0.04 * c.shake; }
  const look = new THREE.Vector3(place.ox + c.look[0], c.look[1], c.look[2]);
  camera.lookAt(look); camera.fov = c.fov; camera.updateProjectionMatrix();
  const rig = lightRig(b.light); applyLight(rig, look);
  L.lamp.intensity = 0; L.lamp2.intensity = 0;
  updateObjects(f);
  const cards = drawActors(b, f, place);
  renderLook(b.light, cards);
  return true;
};
// ---------- objects placed on top of each other by mistake are pushed apart ----------
// two small objects standing on the same surface whose footprints overlap (panna and pepe in the same spot)
// are separated along the shortest direction; an object inside another (food in a bowl) is left alone.
for (const place of Object.values(PLACES)) {
  const items = place.G.children.filter(o => o.isGroup && !o.userData.noSeparate).map(o => ({ o, b: new THREE.Box3().setFromObject(o) })).filter(x => !x.b.isEmpty());
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const A = items[i], B = items[j], sa = A.b.getSize(new THREE.Vector3()), sb = B.b.getSize(new THREE.Vector3());
    if (sa.y > 0.7 || sb.y > 0.7 || Math.abs(A.b.min.y - B.b.min.y) > 0.03) continue;
    const ox_ = Math.min(A.b.max.x, B.b.max.x) - Math.max(A.b.min.x, B.b.min.x), oz = Math.min(A.b.max.z, B.b.max.z) - Math.max(A.b.min.z, B.b.min.z);
    if (ox_ <= 0.005 || oz <= 0.005) continue;
    const inside = (P, Q) => P.min.x <= Q.min.x && P.max.x >= Q.max.x && P.min.z <= Q.min.z && P.max.z >= Q.max.z;
    // 'inside' only for something resting in a container (food in a bowl), not two objects side by side on the table
    if ((inside(A.b, B.b) && B.b.min.y > A.b.min.y + 0.004) || (inside(B.b, A.b) && A.b.min.y > B.b.min.y + 0.004)) continue;
    const d = ox_ < oz ? new THREE.Vector3(Math.sign(B.b.getCenter(new THREE.Vector3()).x - A.b.getCenter(new THREE.Vector3()).x) || 1, 0, 0).multiplyScalar(ox_ + 0.02)
                       : new THREE.Vector3(0, 0, Math.sign(B.b.getCenter(new THREE.Vector3()).z - A.b.getCenter(new THREE.Vector3()).z) || 1).multiplyScalar(oz + 0.02);
    B.o.position.add(d); B.b.translate(d);
    const reg = Object.values(BYID).find(r => r.obj === B.o); if (reg) reg.base.add(d);
    console.warn('separati oggetti sovrapposti', i, j);
  }
}

// ---------- object shots fitted to the object's real size and centre ----------
// the reference templates were shot on a wall clock (~0.45 m), a stove (~0.9 m), a giant lasagna (~1.2 m):
// a fork or an egg needs the same framing scaled down, a helicopter scaled up.
const REF_SIZE = { dettaglio_oggetto: 0.45, dall_alto_oggetto: 0.9, dal_basso_rivela: 1.2, insert: 0.45, top: 0.9, low: 1.2 };
function fitObjectShot(b, c) {
  if (c.manual || !c.target || !BYID[c.on]) return;
  const place = PLACES[b.place], box = new THREE.Box3().setFromObject(BYID[c.on].obj);
  const size = box.isEmpty() ? 0 : box.getSize(new THREE.Vector3()).length() * 0.75;
  if (size < 0.02) return;                                  // e.g. flames scaled to 0 before they ignite
  const C = box.getCenter(new THREE.Vector3()).sub(new THREE.Vector3(place.ox, 0, 0)), A = new THREE.Vector3(...c.target);
  const k = REF_SIZE[c.preset] ? Math.min(8, Math.max(0.3, size / REF_SIZE[c.preset])) : 1;
  const fit = v => { const p = new THREE.Vector3(...v).sub(A).multiplyScalar(k).add(C); return [p.x, Math.max(0.15, p.y), p.z]; };
  // if another object covers the subject from this side, swing around it until the view is clear
  const own = new Set(); BYID[c.on].obj.traverse(o => own.add(o));
  const blockers = []; place.G.traverse(o => { if (o.isMesh && !own.has(o) && !o.material.transparent) blockers.push(o); });
  const ray = new THREE.Raycaster(), Cw = C.clone().add(new THREE.Vector3(place.ox, 0, 0));
  const clear = (pos) => { const P = new THREE.Vector3(...pos).add(new THREE.Vector3(place.ox, 0, 0)), dir = Cw.clone().sub(P), dd = dir.length(); ray.set(P, dir.normalize()); ray.far = dd - 0.03; return !ray.intersectObjects(blockers, false).length; };
  let swing = 0;
  for (const a of [0, 25, -25, 50, -50, 75, -75]) { const P0 = fit(c.keys[0][1]); const v = new THREE.Vector3(...P0).sub(C).applyAxisAngle(new THREE.Vector3(0, 1, 0), a * Math.PI / 180).add(C); if (clear(v.toArray())) { swing = a; break; } }
  const fit0 = fit; const rot = v => swing ? new THREE.Vector3(...v).sub(C).applyAxisAngle(new THREE.Vector3(0, 1, 0), swing * Math.PI / 180).add(C).toArray() : v;
  c.keys = c.keys.map(([f, pos, look, fov]) => { const P = rot(fit0(pos)), Lk = fit0(look), d = new THREE.Vector3(...P).distanceTo(new THREE.Vector3(...Lk));
    if (d < 0.35) { const dir = new THREE.Vector3(...P).sub(new THREE.Vector3(...Lk)).normalize().multiplyScalar(0.35); return [f, Lk.map((v, i) => v + dir.toArray()[i]), Lk, fov]; }
    return [f, P, Lk, fov]; });
}
// ---------- clear line of sight for character shots: swing around the head if furniture covers the face ----------
function fitActorShot(b, c) {
  if (c.manual || c.target) return;
  const a = (b.cast || []).find(x => x.id === c.on); if (!a) return;
  const place = PLACES[b.place], h = ((a.outfit && a.outfit.h) || (OUTFITS[a.type] || {}).h || 1.6) * (a.s || 1);
  const pts = [h - 0.28, h - 0.6].map(y => new THREE.Vector3(place.ox + a.x, y + (a.y || 0), a.z || 0));
  const blockers = []; place.G.traverse(o => { if (o.isMesh && !o.material.transparent) blockers.push(o); });
  const ray = new THREE.Raycaster();
  const clear = P => pts.every(T => { const dir = T.clone().sub(P), dd = dir.length(); ray.set(P, dir.normalize()); ray.far = dd - 0.25; return !ray.intersectObjects(blockers, false).length; });
  const H = pts[0], P0 = new THREE.Vector3(...c.keys[0][1]).add(new THREE.Vector3(place.ox, 0, 0));
  let swing = null;
  for (const deg of [0, 15, -15, 30, -30, 45, -45]) { const v = P0.clone().sub(H).applyAxisAngle(new THREE.Vector3(0, 1, 0), deg * Math.PI / 180).add(H); if (clear(v)) { swing = deg; break; } }
  if (!swing) return;   // 0 = already clear; null = nothing better found
  const Hl = new THREE.Vector3(a.x, H.y, a.z || 0);
  c.keys = c.keys.map(([f, pos, look, fov]) => [f, new THREE.Vector3(...pos).sub(Hl).applyAxisAngle(new THREE.Vector3(0, 1, 0), swing * Math.PI / 180).add(Hl).toArray(), look, fov]);
}
// apply both fits to plain shots and to every stop of a continuous shot (each stop = its own framing)
for (const b of TL.beats) for (const c of b.cams) {
  if (!c.stops) { fitObjectShot(b, c); fitActorShot(b, c); continue; }
  for (const s of c.stops) {
    if (s.follow) continue;                               // tracking keys follow the walk; checked below
    const sub = { on: s.on, preset: s.preset, target: s.target, manual: false, keys: c.keys.slice(s.k0, s.k1) };
    fitObjectShot(b, sub); fitActorShot(b, sub);
    c.keys.splice(s.k0, s.k1 - s.k0, ...sub.keys);
  }
}
// ---------- whole-path check: nothing may cover the subject at ANY moment of a shot ----------
// every 3 frames: ray from the camera to the point it looks at, against the furniture visible at that moment
// (the subject's own meshes excluded). A blocked hold is swung around its subject (or brought closer);
// a blocked glide between two stops is curved sideways. What cannot be fixed is reported as a page error.
const camReport = [];
{
  const ray = new THREE.Raycaster(), cache = {};
  const shown = (o, G) => { for (; o && o !== G; o = o.parent) if (!o.visible) return false; return true; };
  const blockers = (place, id) => { const key = place.ox + '|' + id; if (cache[key]) return cache[key];
    const own = new Set(); if (id && BYID[id]) BYID[id].obj.traverse(o => own.add(o));
    const out = []; place.G.traverse(o => { if (o.isMesh && !own.has(o) && !o.material.transparent) out.push(o); }); return (cache[key] = out); };
  const subjectAt = (c, f) => { if (!c.stops) return c.on; let s = c.stops[0]; for (const t of c.stops) if (f >= t.f0) s = t; return s.on; };
  const keyIdx = (c, f) => { let i = 0; while (i < c.keys.length - 1 && f > c.keys[i + 1][0]) i++; return i; };
  const stopOfKey = (c, i) => c.stops ? c.stops.findIndex(s => i >= s.k0 && i < s.k1) : 0;
  const blockedAt = (place, c, f) => {
    updateObjects(f); place.G.updateMatrixWorld(true);
    const q = camOf(c, f), P = new THREE.Vector3(place.ox + q.pos[0], q.pos[1], q.pos[2]);
    let look = q.look, id = subjectAt(c, f);
    const i = keyIdx(c, f), j = Math.min(i + 1, c.keys.length - 1);
    if (c.stops && stopOfKey(c, i) !== stopOfKey(c, j)) {   // inside a glide: watch the subject we leave, then the one we reach
      const second = f - c.keys[i][0] > (c.keys[j][0] - c.keys[i][0]) / 2;
      look = c.keys[second ? j : i][2]; id = c.stops[stopOfKey(c, second ? j : i)].on;
    }
    const T = new THREE.Vector3(place.ox + look[0], look[1], look[2]);
    const dir = T.clone().sub(P), dd = dir.length(); if (dd < 0.4) return false;
    ray.set(P, dir.normalize()); ray.far = dd - 0.25;
    return ray.intersectObjects(blockers(place, id), false).some(h => shown(h.object, place.G));
  };
  const badIn = (place, c, a, z) => { const out = []; for (let f = Math.max(c.f0, a); f < Math.min(c.f1, z); f += 3) if (blockedAt(place, c, f)) out.push(f); return out; };
  for (const b of TL.beats) {
    const place = PLACES[b.place];
    b.cams.forEach((c, ci) => {
      if (c.manual) return;
      const groups = c.stops ? c.stops.map(s => [s.k0, s.k1]) : [[0, c.keys.length]];
      const groupOf = i => groups.findIndex(([a, z]) => i >= a && i < z);
      for (let pass = 0; pass < 4; pass++) {
        const bad = badIn(place, c, c.f0, c.f1); if (!bad.length) break;
        const i = keyIdx(c, bad[0]), j = Math.min(i + 1, c.keys.length - 1), gi = groupOf(i), gj = groupOf(j);
        const save = c.keys.map(k => [k[0], [...k[1]], [...k[2]], k[3], k[4] ? { ...k[4] } : undefined].filter(x => x !== undefined));
        let fixed = false;
        if (gi !== gj) {                                   // glide between two stops: curve it sideways, then a little up
          const A = c.keys[i][1], B = c.keys[j][1], dx = B[0] - A[0], dz = B[2] - A[2], L = Math.hypot(dx, dz) || 1, n = [-dz / L, 0, dx / L];
          for (const bend of [[n[0] * 0.5, 0, n[2] * 0.5], [-n[0] * 0.5, 0, -n[2] * 0.5], [n[0], 0, n[2]], [-n[0], 0, -n[2]], [0, 0.4, 0], [n[0] * 0.8, 0.3, n[2] * 0.8], [-n[0] * 0.8, 0.3, -n[2] * 0.8]]) {
            c.keys[j][4] = { ...(c.keys[j][4] || {}), bend };
            if (!badIn(place, c, c.keys[i][0], c.keys[j][0] + 1).length) { fixed = true; break; }
          }
        } else {                                           // a hold or a tracking stretch: swing round the subject, then come closer
          const [k0, k1] = groups[gi], a = c.keys[k0][0], z = c.keys[k1 - 1][0] + 1;
          const tries = [15, -15, 30, -30, 45, -45].map(d => ['rot', d]).concat([['near', 0.8], ['near', 0.62]]);
          for (const [kind, v] of tries) {
            for (let k = k0; k < k1; k++) {
              const P = new THREE.Vector3(...save[k][1]), Lk = new THREE.Vector3(...save[k][2]);
              const Q = kind === 'rot' ? P.sub(Lk).applyAxisAngle(new THREE.Vector3(0, 1, 0), v * Math.PI / 180).add(Lk) : P.sub(Lk).multiplyScalar(v).add(Lk);
              c.keys[k][1] = Q.toArray();
            }
            if (!badIn(place, c, a, z).length) { fixed = true; break; }
          }
        }
        if (!fixed) { c.keys = save; break; }
      }
      const left = badIn(place, c, c.f0, c.f1);
      if (left.length) { const msg = `camera coperta: battuta ${b.i + 1}, inquadratura ${ci + 1} (${c.preset}), ${(left[0] / TL.fps).toFixed(1)}-${(left[left.length - 1] / TL.fps).toFixed(1)} s: sposta l'oggetto che copre o cambia modello`;
        camReport.push(msg); console.error(msg); }
    });
  }
  window.camReport = camReport;
}
// ---------- the director: every automatic shot is chosen by looking at the 3D world ----------
if (TL.director || Q.get('director')) { // optional: the reference-style templates are the default
  let prev = null; const report = [];
  for (const b of TL.beats) {
    const place = PLACES[b.place];
    for (const k in PLACES) PLACES[k].G.visible = k === b.place;
    for (const c of b.cams) {
      updateObjects(c.f0 + 4);                            // the world as it is when the shot starts
      if (c.manual) { prev = null; continue; }
      const r = chooseCamera(c, b, place, BYID, OUTFITS, prev);
      const loc = v => [v.x - place.ox, v.y, v.z];
      c.keys = [[c.f0, loc(r.start), loc(r.look), r.fov], [c.f1, loc(r.end), loc(r.look), r.fov]];
      prev = { place: b.place, az: r.az, dist: r.dist, line: r.line, side: r.side };
      report.push([b.i, c.preset, c.on, Math.round(r.score * 10) / 10]);
    }
  }
  window.directorReport = report; current = null;
}
window.ready = true;
