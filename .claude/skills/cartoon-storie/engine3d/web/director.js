// Automatic director: chooses every camera by looking at the built 3D world, like a director on set.
// For each shot it tries many camera positions around the subject and scores them:
// subject visible and not covered, right size for the shot type, rule of thirds and headroom,
// depth (foreground and rich background), no walls in the lens, continuity with the previous shot
// (180° rule, no near-identical cuts). The winner gets a small motivated move.
import * as THREE from 'three';
import { camera } from './engine.js';

const D2R = Math.PI / 180;
// shot grammar: how much of the frame height the subject fills, eye height factor, allowed angles, move
export const SHOTS = {
  establish: { fill: 0.22, eye: 1.25, el: [8, 22], az: [-35, 35], move: 'push', fov: 50, whole: true },
  wide:      { fill: 0.38, eye: 1.0,  el: [4, 12], az: [-40, 40], move: 'drift', fov: 48, whole: true },
  two_shot:  { fill: 0.62, eye: 0.95, el: [0, 8],  az: [-35, 35], move: 'push', fov: 46, whole: true },
  drift:     { fill: 0.5,  eye: 0.95, el: [2, 8],  az: [-40, 40], move: 'drift', fov: 46, whole: true },
  rise:      { fill: 0.45, eye: 0.9,  el: [0, 6],  az: [-30, 30], move: 'rise', fov: 46, whole: true },
  closeup:   { fill: 0.5, eye: 1.0,  el: [-2, 6], az: [-40, 40], move: 'push', fov: 40, head: true },
  ecu:       { fill: 0.6,  eye: 1.0,  el: [-2, 4], az: [-25, 25], move: 'push', fov: 38, head: true },
  push:      { fill: 0.45, eye: 1.0,  el: [0, 6],  az: [-35, 35], move: 'pushlong', fov: 42, head: true },
  pull:      { fill: 0.6,  eye: 1.0,  el: [4, 14], az: [-30, 30], move: 'pull', fov: 44 },
  insert:    { fill: 0.55, eye: 1.0,  el: [15, 40], az: [-40, 40], move: 'push', fov: 42, object: true },
  top:       { fill: 0.6,  eye: 1.0,  el: [55, 75], az: [-30, 30], move: 'push', fov: 44, object: true },
  low:       { fill: 0.5,  eye: 0.35, el: [-25, -10], az: [-35, 35], move: 'push', fov: 46 },
  punch:     { fill: 0.5,  eye: 1.0,  el: [0, 4],  az: [-20, 20], move: 'punch', fov: 42, head: true },
  over_shoulder: { fill: 0.45, eye: 1.0, el: [2, 6], az: [0, 0], move: 'push', fov: 42, head: true },
};

const ray = new THREE.Raycaster();
function blockers(G) { const m = []; G.traverse(o => { if (o.isMesh && o.visible && !o.material.transparent) m.push(o); }); return m; }
function visibleFrac(from, pts, meshes) {
  let ok = 0;
  for (const p of pts) {
    const dir = p.clone().sub(from), dist = dir.length(); ray.set(from, dir.normalize()); ray.far = dist - 0.08;
    if (!ray.intersectObjects(meshes, false).length) ok++;
  }
  return ok / pts.length;
}
function project(cam, p) { const v = p.clone().project(cam); return { x: (v.x + 1) / 2, y: (1 - v.y) / 2, z: v.z }; }

// subject description: points to keep visible, height in metres, look point
export function subjectOf(seg, beat, place, BYID, specs) {
  const ox = place.ox, on = seg.on, cast = beat.cast || [];
  const actor = a => { const h = (a.outfit?.h || specs[a.type]?.h || 1.6) * (a.s || 1); const x = ox + a.x, z = a.z || 0;
    return { pts: [new THREE.Vector3(x, h * 0.9, z), new THREE.Vector3(x, h * 0.55, z), new THREE.Vector3(x, h * 0.2, z)], h, head: new THREE.Vector3(x, h - 0.28, z), base: new THREE.Vector3(x, 0, z) }; };
  if (seg.target) { // object: its declared position and size (independent of hidden/off state at planning time)
    const c = new THREE.Vector3(ox + seg.target[0], seg.target[1], seg.target[2]), sz = Math.max(seg.tsize || 0.6, 0.3);
    return { pts: [c, c.clone().add(new THREE.Vector3(0, sz * 0.3, 0)), c.clone().add(new THREE.Vector3(sz * 0.25, 0, 0))], h: sz, head: c, base: c, object: true, id: on };
  }
  const who = on ? cast.filter(a => a.id === on) : cast;
  const subs = (who.length ? who : cast).map(actor);
  if (!subs.length) return { pts: [new THREE.Vector3(ox, 1.2, -1)], h: 1.6, head: new THREE.Vector3(ox, 1.2, -1), base: new THREE.Vector3(ox, 0, -1) };
  if (subs.length === 1) return subs[0];
  const box = new THREE.Box3(); subs.forEach(s => s.pts.forEach(p => box.expandByPoint(p)));
  const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  return { pts: subs.flatMap(s => s.pts.slice(0, 2)), h: Math.max(size.y, size.x * 1.1), head: new THREE.Vector3(c.x, size.y * 0.62, c.z), base: new THREE.Vector3(c.x, 0, c.z), group: subs };
}

export function chooseCamera(seg, beat, place, BYID, specs, prev) {
  const S = SHOTS[seg.preset] || SHOTS.two_shot, sub = subjectOf(seg, beat, place, BYID, specs);
  const own = sub.id && BYID[sub.id] ? new Set((() => { const a = []; BYID[sub.id].obj.traverse(o => a.push(o)); return a; })()) : new Set();
  const meshes = blockers(place.G).filter(m => !own.has(m)), room = place.P.type !== 'outdoor', W = place.P.w || 8, Dd = place.P.d || 7, Hh = place.P.h || 3;
  const fov = seg.fov || S.fov, vfov = fov * D2R;
  const span = S.head ? (seg.preset === 'ecu' ? 0.75 : 0.95) : sub.h;   // closeups: head and chest; ecu: face
  const look = (S.head ? sub.head : sub.object ? sub.head : new THREE.Vector3(sub.base.x, sub.h * 0.55, sub.base.z)).clone();
  const dist = Math.max(0.6, span / S.fill / (2 * Math.tan(vfov / 2)));
  let best = null;
  const cam = camera.clone(); cam.fov = fov; cam.aspect = 1080 / 1920; cam.updateProjectionMatrix();
  const azs = []; for (let a = S.az[0]; a <= S.az[1]; a += 7) azs.push(a);
  for (const az0 of azs) for (const el of [S.el[0], (S.el[0] + S.el[1]) / 2, S.el[1]]) for (const dk of [0.9, 1, 1.15]) {
    const az = az0 * D2R, e = el * D2R, d = dist * dk;
    const pos = new THREE.Vector3(look.x + Math.sin(az) * Math.cos(e) * d, (S.eye < 0.6 ? 0.35 : look.y) + Math.sin(e) * d, look.z + Math.cos(az) * Math.cos(e) * d);
    if (room && (Math.abs(pos.x - place.ox) > W / 2 - 0.25 || pos.y > Hh - 0.25 || pos.z < -Dd / 2 + 0.3)) continue;
    if (pos.y < 0.2) continue;
    cam.position.copy(pos); cam.lookAt(look); cam.updateMatrixWorld();
    let score = 0;
    const vis = visibleFrac(pos, sub.pts, meshes); if (vis < 0.67) continue; score += vis * 3;
    // framing: subject inside frame with margins, head on the upper third
    const pr = sub.pts.map(p => project(cam, p));
    if (pr.some(p => p.x < 0.04 || p.x > 0.96 || p.y < 0.03 || p.y > 0.99)) score -= 2;
    const hp = project(cam, sub.head); score -= Math.abs(hp.y - (S.head ? 0.38 : 0.42)) * 2 + Math.abs(hp.x - 0.5) * 0.8;
    // wall right behind the lens or object filling the foreground
    ray.set(pos, look.clone().sub(pos).normalize()); ray.far = 0.5; if (ray.intersectObjects(meshes, false).length) score -= 3;
    // depth: something in the near foreground at the frame edge, and a rich background
    let fg = 0, bg = 0;
    for (const [sx, sy] of [[-0.85, -0.7], [0.85, -0.7], [-0.9, 0.2], [0.9, 0.2]]) { ray.setFromCamera(new THREE.Vector2(sx, sy), cam); ray.far = 60; const h = ray.intersectObjects(meshes, false)[0]; if (h && h.distance < d * 0.55) fg++; }
    for (let i = 0; i < 9; i++) { ray.setFromCamera(new THREE.Vector2((i % 3 - 1) * 0.6, (Math.floor(i / 3) - 1) * 0.6), cam); ray.far = 60; const h = ray.intersectObjects(meshes, false)[0]; if (h && h.object.parent && h.object.parent !== place.G) bg++; }
    score += Math.min(fg, 1) * 0.6 + bg * 0.12;
    // a big object in the lower middle of the frame, close to the lens, hides the subject's body: penalise
    for (const [sx, sy] of [[0, -0.55], [0, -0.85], [-0.4, -0.7], [0.4, -0.7]]) { ray.setFromCamera(new THREE.Vector2(sx, sy), cam); ray.far = 60; const h = ray.intersectObjects(meshes, false)[0]; if (h && h.distance < d * 0.6) score -= 0.9; }
    score -= Math.abs(az0) * 0.004;                       // slight preference for readable 3/4 views over profiles
    // continuity with the previous shot in the same place
    if (prev && prev.place === beat.place) {
      const da = Math.abs(Math.atan2(pos.x - look.x, pos.z - look.z) - prev.az) / D2R, ds = Math.abs(Math.log(d / prev.dist));
      if (da < 20 && ds < 0.35) score -= 2.5;              // near-identical cut (jump cut)
      if (prev.line && Math.sign(prev.side) !== Math.sign(sideOf(prev.line, pos))) score -= 3; // crossed the 180° line
    }
    if (!best || score > best.score) best = { score, pos: pos.clone(), look: look.clone(), d, az: Math.atan2(pos.x - look.x, pos.z - look.z) };
  }
  if (!best) { const pos = look.clone().add(new THREE.Vector3(0, 0.3, dist)); best = { pos, look, d: dist, az: 0, score: -99 }; }
  // motivated small move from the chosen position
  const dir = best.look.clone().sub(best.pos).normalize(), side = new THREE.Vector3(dir.z, 0, -dir.x);
  const k = { push: 0.12, pushlong: 0.3, pull: -0.45, punch: 0.25 }[S.move];
  const end = best.pos.clone();
  if (k !== undefined) end.addScaledVector(dir, best.d * k);
  if (S.move === 'drift') end.addScaledVector(side, best.d * 0.12);
  if (S.move === 'rise') end.y += best.d * 0.18;
  const line = sub.group && sub.group.length > 1 ? [sub.group[0].base, sub.group[sub.group.length - 1].base] : (prev && prev.place === beat.place ? prev.line : null);
  return { start: best.pos, end, look: best.look, fov, az: best.az, dist: best.d, line, side: line ? sideOf(line, best.pos) : 0, score: best.score };
}
function sideOf(line, p) { const [a, b] = line; return (b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x); }
