// Builds each place of the story from JSON: room or outdoor shell, realistic models, objects built from shapes,
// painted facades, boards, practical lights, flames and steam. Every object with an "id" can react to words.
import * as THREE from 'three';
import { scene, paint, brush } from './engine.js';
import { mat, glow, loadModel } from './look.js';

export const BYID = {};   // id -> { obj, kind, it, base }
export const SPIN = [];
export const FLAMES = []; // { group, on }
export const STEAM = [];

const D2R = Math.PI / 180;
function place3(parent, o, it) {
  o.position.set(...(it.at || [0, 0, 0])); o.rotation.y = (it.ry || 0) * D2R;
  if (it.rot) o.rotation.set(...it.rot.map(a => a * D2R));
  parent.add(o);
  if (it.id) BYID[it.id] = { obj: o, it, base: o.position.clone(), kind: it.kind || 'object' };
  if (it.hidden) o.visible = false;
  return o;
}
function plane(w, h, m, pos, rot) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(...pos); p.rotation.set(...rot); p.receiveShadow = true; return p; }

async function putModel(G, KIT, it) {
  let o;
  if (it.parts) { // object built from simple shapes (library/oggetti3d)
    o = new THREE.Group();
    const hinges = {};                                   // doors, lids, drawers: parts with "gruppo" turn on a hinge
    for (const [name, h] of Object.entries(it.cerniere || {})) { const g = new THREE.Group(); g.position.set(...h.at); g.userData.axis = h.asse || 'y'; o.add(g); hinges[name] = g; }
    for (const p of it.parts) {
      const geo = p.shape === 'box' ? new THREE.BoxGeometry(...p.size) : p.shape === 'cyl' ? new THREE.CylinderGeometry(p.r_top ?? p.r, p.r, p.h, 28)
        : p.shape === 'cone' ? new THREE.ConeGeometry(p.r, p.h, 28) : p.shape === 'torus' ? new THREE.TorusGeometry(p.r, p.tube || 0.05, 12, 32) : new THREE.SphereGeometry(p.r || 0.5, 28, 18);
      const m = new THREE.Mesh(geo, p.glow ? glow(p.color, p.glow) : mat(KIT, { color: p.color, rough: p.rough ?? 0.55, metal: p.metal }));
      m.position.set(...(p.at || [0, 0, 0])); if (p.rot) m.rotation.set(...p.rot.map(a => a * D2R)); if (p.scale) m.scale.set(...p.scale);
      m.castShadow = true; m.receiveShadow = true;
      if (p.spin) SPIN.push({ m, axis: p.spin[0], speed: p.spin[1], base: m.rotation[p.spin[0]] });
      const hg = p.gruppo && hinges[p.gruppo];
      if (hg) { m.position.sub(hg.position); hg.add(m); } else o.add(m);
    }
    if (it.scale) o.scale.setScalar(it.scale);
    o.userData.hinges = hinges;
  } else {
    const src = await loadModel(it.url); if (!src) return;
    src.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; if (m.material) m.material.envMapIntensity = 1; if (it.color && m.material) m.material.color.set(it.color);
      if (it.colori && m.material && it.colori[m.material.name]) { m.material = m.material.clone(); m.material.color.set(it.colori[m.material.name]); } } });  // recolour single materials (e.g. tomato sauce -> carbonara)
    const b = new THREE.Box3().setFromObject(src), d = b.getSize(new THREE.Vector3());
    const k = it.w ? it.w / Math.max(d.x, d.z) : (it.size || d.y) / d.y;
    src.scale.setScalar(k); src.position.set(-(b.min.x + d.x / 2) * k, -b.min.y * k, -(b.min.z + d.z / 2) * k);
    o = new THREE.Group(); o.add(src);
  }
  place3(G, o, it);
}

function facade(it) { // painted house front: plaster, windows (lit at night), door, roof edge
  const w = it.w || 6, h = it.h || 8, g = new THREE.Group();
  const tex = paint(512, 512, (c, W, H, r) => {
    brush(c, W, H, r, it.color || '#e8c9a0', 22, 500, 16);
    const cols = Math.max(2, Math.round(w / 1.6)), rows = Math.max(2, Math.round(h / 2.6));
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows - 1; j++) {
      const x = (i + 0.3) / cols * W, y = (j + 0.25) / rows * H, ww = W / cols * 0.4, hh = H / rows * 0.45;
      c.fillStyle = it.shutters || '#3f7a4a'; c.fillRect(x - ww * 0.35, y, ww * 0.3, hh); c.fillRect(x + ww, y, ww * 0.3, hh);
      c.fillStyle = it.lit && (i * 7 + j * 3) % 3 ? '#ffd27a' : '#2a3a5a'; c.fillRect(x, y, ww, hh);
      c.strokeStyle = '#f4efe2'; c.lineWidth = 6; c.strokeRect(x, y, ww, hh);
    }
    c.fillStyle = '#5a3a20'; c.fillRect(W * 0.42, H * 0.78, W * 0.16, H * 0.22);
  });
  const front = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.4), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, envMapIntensity: 0.7 }));
  front.position.y = h / 2; front.castShadow = front.receiveShadow = true; g.add(front);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.3, 1.2), new THREE.MeshStandardMaterial({ color: it.roof || '#a8452e', roughness: 0.8 }));
  roof.position.set(0, h + 0.15, 0.2); g.add(roof);
  if (it.lit) for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.08, h * 0.06), glow('#ffd27a', 2.2)); l.position.set((i - 1) * w * 0.3, h * 0.55, 0.21); g.add(l); }
  return g;
}

function flames(it) { // cartoon fire: red shell, orange body, yellow core; scaled to 0 when off
  const g = new THREE.Group();
  const shape = (r, h) => { const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16, w = t < 0.3 ? Math.sin(t / 0.3 * Math.PI / 2) * r : r * Math.pow(1 - (t - 0.3) / 0.7, 1.6); pts.push(new THREE.Vector2(Math.max(w, 0.001), t * h)); } return new THREE.LatheGeometry(pts, 14); };
  const n = it.burners || 1, gap = it.gap || 0.24;
  for (let b = 0; b < n; b++) {
    const f = new THREE.Group(); f.position.set((b % 2 - 0.5) * gap * (n > 1 ? 1 : 0), 0, (Math.floor(b / 2) - 0.5) * gap * (n > 2 ? 1 : 0));
    [[0.16, 0.55, '#e8402a'], [0.12, 0.44, '#ff8a2a'], [0.07, 0.3, '#ffe14a']].forEach(([r, h, c], i) => { const m = new THREE.Mesh(shape(r, h), glow(c, i === 2 ? 2.4 : 1.6)); m.position.z = i * 0.02; f.add(m); });
    g.add(f);
  }
  g.scale.setScalar(it.scale || 1);
  FLAMES.push({ g, it, on: !!it.on, flick: Math.random() * 10 });
  return g;
}

function board(it) { // painted sign / cross-stitch / note: text drawn on canvas, always readable (unlit)
  const w = it.w || 0.6, h = it.h || 0.8;
  const tex = paint(512, Math.round(512 * h / w), (c, W, H) => {
    c.fillStyle = it.bg || '#fbf4e2'; c.fillRect(0, 0, W, H);
    c.strokeStyle = it.border || '#c8303c'; c.lineWidth = 14; c.strokeRect(12, 12, W - 24, H - 24);
    c.fillStyle = it.ink || '#c8303c'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const lines = String(it.text || '').split('\n'); let size = 90;
    c.font = `bold ${size}px Georgia`; while (Math.max(...lines.map(l => c.measureText(l).width)) > W * 0.84 && size > 20) { size -= 4; c.font = `bold ${size}px Georgia`; }
    lines.forEach((l, i) => c.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * size * 1.2));
  });
  const g = new THREE.Group();
  const fr = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.04), new THREE.MeshStandardMaterial({ color: it.frame || '#6a4022', roughness: 0.6 }));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: true }));
  face.position.z = 0.025; g.add(fr, face); return g;
}

export async function buildPlace(P, ox, KIT) {
  const G = new THREE.Group(); G.position.x = ox; G.visible = false; scene.add(G);
  const w = P.w || 8, d = P.d || 7, h = P.h || 3;
  if ((P.type || 'room') === 'room') {
    G.add(plane(w, d + 10, mat(KIT, P.floor || { tex: 'terracotta_floor_tiles', tint: '#ffd2bc', rep: 4 }), [0, 0, 5 - 0], [-Math.PI / 2, 0, 0]));
    const wallM = mat(KIT, P.wall || { tex: 'yellow_plaster', tint: '#ffc95a', rep: [3, 1.3] });
    G.add(plane(w, h, wallM, [0, h / 2, -d / 2], [0, 0, 0]));
    G.add(plane(d + 10, h, wallM, [-w / 2, h / 2, 5], [0, Math.PI / 2, 0]));   // side walls face inward only:
    G.add(plane(d + 10, h, wallM, [w / 2, h / 2, 5], [0, -Math.PI / 2, 0]));   // the camera may stand outside them
    G.add(plane(w, d + 10, mat(KIT, P.ceiling || { color: '#f6efe0' }), [0, h, 5], [Math.PI / 2, 0, 0]));
    if (P.tiles) { const t = plane(w, P.tiles.h || 1.2, mat(KIT, P.tiles), [0, (P.tiles.h || 1.2) / 2, -d / 2 + 0.01], [0, 0, 0]); G.add(t); }
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 0.04), mat(KIT, { color: '#7a4a2a' })); base.position.set(0, 0.06, -d / 2 + 0.02); G.add(base);
    for (const win of P.windows || []) { // painted view outside + frame
      const view = paint(256, 256, (c, W, H, r) => { const day = win.view !== 'notte'; const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, day ? '#8fc8f0' : '#101a48'); gr.addColorStop(1, day ? '#e8f4ff' : '#2a2a62'); c.fillStyle = gr; c.fillRect(0, 0, W, H); c.fillStyle = day ? '#c0614a' : '#0c1028'; for (let i = 0; i < 5; i++) c.fillRect(i * 56, H * 0.6 - i % 2 * 30, 50, H); if (!day) { c.fillStyle = '#fff'; for (let i = 0; i < 30; i++) c.fillRect(r() * W, r() * H * 0.5, 2, 2); } });
      const p = plane(win.w || 1.2, win.h || 1.2, new THREE.MeshBasicMaterial({ map: view }), [win.x || 0, win.y || 1.7, -d / 2 + 0.02], [0, 0, 0]); G.add(p);
      const fm = mat(KIT, { color: '#f4f4ee' });
      for (const [sx, sy, px, py] of [[(win.w || 1.2) + 0.12, 0.08, 0, (win.h || 1.2) / 2], [(win.w || 1.2) + 0.12, 0.08, 0, -(win.h || 1.2) / 2], [0.08, win.h || 1.2, (win.w || 1.2) / 2, 0], [0.08, win.h || 1.2, -(win.w || 1.2) / 2, 0], [0.05, win.h || 1.2, 0, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, 0.08), fm); b.position.set((win.x || 0) + px, (win.y || 1.7) + py, -d / 2 + 0.05); G.add(b); }
    }
    if (P.beams) for (let z = -d / 2 + 0.6; z < d / 2; z += 1.3) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, 0.22), mat(KIT, { tex: 'wood_floor', tint: '#8a5a32', rep: [4, 0.3] })); b.position.set(0, h - 0.1, z); G.add(b); }
  } else {
    G.add(plane(140, 140, mat(KIT, P.floor || { tex: 'cobblestone_floor_01', tint: '#f2e6d8', rep: 28 }), [0, 0, 0], [-Math.PI / 2, 0, 0]));
    for (const f of P.facades || []) place3(G, facade(f), f);
  }
  for (const s of P.strings || []) { // strings of party bulbs
    const n = s.n || 16, cols = s.colors || ['#ff5a5a', '#ffd84a', '#5ad0ff', '#7aff8a', '#ff8ae0'];
    for (let i = 0; i < n; i++) { const t = i / (n - 1), x = s.from[0] + (s.to[0] - s.from[0]) * t, z = s.from[2] + (s.to[2] - s.from[2]) * t, y = s.from[1] + (s.to[1] - s.from[1]) * t - Math.sin(t * Math.PI) * (s.sag || 0.6); const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), glow(cols[i % cols.length], 3)); b.position.set(x, y, z); G.add(b); }
  }
  for (const L of P.lamps || []) { // practical lights (lamps, lanterns, street lamps)
    const l = new THREE.PointLight(L.color || '#ffc477', L.intensity ?? 3, L.range || 12, 1.6); l.position.set(...L.at); l.castShadow = !!L.shadow; G.add(l);
    if (L.bulb !== false) { const b = new THREE.Mesh(new THREE.SphereGeometry(L.r || 0.09, 14, 10), glow(L.color || '#ffd9a0', 3.2)); b.position.set(...L.at); G.add(b); }
    if (L.id) BYID[L.id] = { obj: l, it: L, base: l.position.clone(), kind: 'light', on: L.intensity ?? 3 };
  }
  for (const b of P.boards || []) place3(G, board(b), b);
  for (const f of P.fires || []) place3(G, flames(f), f);
  for (const s of P.steam || []) { const g = new THREE.Group(); for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, roughness: 1 })); g.add(m); } STEAM.push({ g, k: STEAM.length }); place3(G, g, s); }
  await Promise.all((P.models || []).map(it => putModel(G, KIT, it)));
  for (const it of P.models || []) if (it.parent && BYID[it.parent] && BYID[it.id]) { const o = BYID[it.id].obj; BYID[it.parent].obj.add(o); o.position.set(...it.at); BYID[it.id].base = o.position.clone(); }
  return { G, ox, P };
}
