// Flat 2D bean-head characters and effect cards, drawn on canvas with plum outlines.
export const CW = 1024, CH = 1536, PPM = 640;     // card = 1.6 m x 2.4 m
const PLUM = '#4a2346', LW = 9;

export const OUTFITS = {
  nonna: { h: 1.42, w: 0.56, skin: '#f3c9a8', dress: '#7d4c9e', dot: '#f4e9ff', apron: false, hair: 'bun', hairC: '#d9d6dc', glasses: true, shoes: '#6b4a3a', nose: 1.3, blush: 1 },
  marco: { h: 1.74, w: 0.40, skin: '#e9b892', top: '#3f9b6c', pants: '#3a5a9a', hair: 'tuft', hairC: '#5a3524', shoes: '#f2f2f2', nose: 1, blush: 0.6 },
  vicina: { h: 1.5, w: 0.5, skin: '#f0c4a0', dress: '#f08fb5', dot: null, hair: 'curlers', hairC: '#8a5a3c', shoes: '#c25a8a', nose: 1.1, blush: 1 },
  zia1: { h: 1.55, w: 0.5, skin: '#e8b48c', dress: '#d6453d', dot: '#ffd9c9', hair: 'curly', hairC: '#2b1d1a', shoes: '#3a2a2a', nose: 1.1, blush: 0.8, pearls: true },
  zia2: { h: 1.6, w: 0.46, skin: '#f3cdb0', dress: '#2f7fa8', dot: null, hair: 'bob', hairC: '#c4472b', shoes: '#22334a', nose: 1, blush: 0.8 },
  zia3: { h: 1.48, w: 0.54, skin: '#d9a27a', dress: '#e0a92c', dot: '#fff2c4', hair: 'perm', hairC: '#efd27a', shoes: '#6a4a20', nose: 1.2, blush: 0.9 },
  zia4: { h: 1.52, w: 0.52, skin: '#f0c8a8', dress: '#3c8a5a', dot: '#d8f5e0', hair: 'bun', hairC: '#9a9aa4', shoes: '#333', nose: 1.2, blush: 0.9, glasses: true },
  zia5: { h: 1.58, w: 0.48, skin: '#c98e66', dress: '#a33a78', dot: null, hair: 'scarf', hairC: '#f2c14a', shoes: '#442', nose: 1.1, blush: 0.8 },
};

// arm poses: [upper, lower] degrees from straight down, + = outward. [left, right] in screen space
export const POSES = {
  hang: [[12, 4], [12, 4]],
  hip: [[45, -95], [45, -95]],
  up: [[160, 12], [160, 12]],
  wave: [[12, 4], [150, 25]],
  point: [[12, 4], [95, 0]],
  stop: [[12, 4], [115, 45]],
  belly: [[28, -118], [28, -118]],
  cheek: [[22, -158], [22, -158]],
  tray: [[30, -105], [30, -105]],
  phone: [[12, 4], [32, -165]],
  defend: [[42, 118], [42, 118]],
  spoon: [[45, -95], [75, 75]],
  eat: [[30, -108], [26, -158]],
  apron: [[35, -150], [35, -150]],
  shrug: [[55, 95], [55, 95]],
};

export const FACES = {
  neutral: { brow: [0, 0], eye: 'dot', mouth: 'smile', m: 0.3 },
  smile: { brow: [-4, 2], eye: 'dot', mouth: 'smile', m: 0.7 },
  grin: { brow: [-6, 4], eye: 'happy', mouth: 'grin', m: 1 },
  sly: { brow: [14, 0], eye: 'squint', mouth: 'smirk', m: 0.8 },
  worried: { brow: [-22, 6], eye: 'big', mouth: 'worried', m: 0.6 },
  teary: { brow: [-24, 8], eye: 'teary', mouth: 'worried', m: 0.8 },
  shock: { brow: [-10, 14], eye: 'wide', mouth: 'o', m: 1 },
  stuffed: { brow: [-12, 4], eye: 'squint', mouth: 'stuffed', m: 1 },
  chew: { brow: [0, 2], eye: 'happy', mouth: 'chew', m: 1 },
  determined: { brow: [18, -2], eye: 'dot', mouth: 'grin', m: 0.8 },
  nervous: { brow: [-16, 4], eye: 'dot', mouth: 'flat', m: 0.6 },
  blissful: { brow: [-4, 6], eye: 'happy', mouth: 'smile', m: 1 },
};

function ol(g, fill, w = LW) { g.fillStyle = fill; g.fill(); g.lineWidth = w; g.strokeStyle = PLUM; g.stroke(); }
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function ell(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(rx, 0.5), Math.max(ry, 0.5), rot, 0, Math.PI * 2); }
const D = Math.PI / 180;

function limb(g, x, y, a1, a2, l1, l2, th, color, side) {
  // side: -1 left, +1 right (screen). angles from down, + outward
  const A1 = a1 * D * side, A2 = (a1 + a2) * D * side;
  const ex = x + Math.sin(A1) * l1, ey = y + Math.cos(A1) * l1;
  const hx = ex + Math.sin(A2) * l2, hy = ey + Math.cos(A2) * l2;
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.lineTo(hx, hy);
  g.strokeStyle = PLUM; g.lineWidth = th + LW * 2; g.stroke();
  g.strokeStyle = color; g.lineWidth = th; g.stroke();
  return [hx, hy];
}

function hair(g, o, cx, cy, hw, hh, back) {
  const c = o.hairC;
  if (o.hair === 'bun') {
    if (back) { ell(g, cx, cy - hh * 0.98, hw * 0.42, hh * 0.24); ol(g, c); }
    else {
      g.beginPath(); g.ellipse(cx, cy - hh * 0.12, hw * 1.04, hh * 0.86, 0, Math.PI * 1.02, Math.PI * 1.98); g.closePath(); ol(g, c);
      ell(g, cx - hw * 0.95, cy - hh * 0.05, hw * 0.22, hh * 0.3); ol(g, c);
      ell(g, cx + hw * 0.95, cy - hh * 0.05, hw * 0.22, hh * 0.3); ol(g, c);
    }
  } else if (o.hair === 'tuft') {
    if (back) return;
    // tuft first (behind the cap outline), then the cap
    g.beginPath(); g.moveTo(cx - hw * 0.45, cy - hh * 0.55); g.quadraticCurveTo(cx - hw * 0.35, cy - hh * 0.95, cx - hw * 0.05, cy - hh * 0.78);
    g.quadraticCurveTo(cx + hw * 0.15, cy - hh * 1.05, cx + hw * 0.5, cy - hh * 0.85); g.quadraticCurveTo(cx + hw * 0.3, cy - hh * 0.6, cx + hw * 0.4, cy - hh * 0.5); g.closePath(); ol(g, c);
    g.beginPath(); g.ellipse(cx, cy - hh * 0.12, hw * 1.03, hh * 0.5, 0, Math.PI, Math.PI * 2);
    g.quadraticCurveTo(cx + hw * 0.4, cy - hh * 0.25, cx, cy - hh * 0.3); g.quadraticCurveTo(cx - hw * 0.5, cy - hh * 0.22, cx - hw * 1.03, cy - hh * 0.12); g.closePath(); ol(g, c);
  } else if (o.hair === 'curlers') {
    if (back) return;
    g.beginPath(); g.ellipse(cx, cy - hh * 0.15, hw * 1.02, hh * 0.82, 0, Math.PI * 1.03, Math.PI * 1.97); g.closePath(); ol(g, c);
    for (let i = -2; i <= 2; i++) { rr(g, cx + i * hw * 0.38 - hw * 0.15, cy - hh * 0.98 + Math.abs(i) * hh * 0.12, hw * 0.3, hh * 0.2, 12); ol(g, ['#ff9ad1', '#9ad7ff', '#fff07a'][(i + 2) % 3]); }
  } else if (o.hair === 'curly') {
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (1.0 + i / (n - 1));
      ell(g, cx + Math.cos(a) * hw * 0.98, cy - hh * 0.1 + Math.sin(a) * hh * 0.82, hw * 0.28, hh * 0.22); ol(g, c);
    }
  } else if (o.hair === 'bob') {
    if (back) { rr(g, cx - hw * 1.1, cy - hh * 0.5, hw * 2.2, hh * 1.0, hw * 0.5); ol(g, c); }
    else { g.beginPath(); g.ellipse(cx, cy - hh * 0.15, hw * 1.08, hh * 0.85, 0, Math.PI * 1.0, Math.PI * 2.0); g.lineTo(cx + hw * 0.2, cy - hh * 0.55); g.closePath(); ol(g, c); }
  } else if (o.hair === 'perm') {
    ell(g, cx, cy - hh * 0.35, hw * 1.25, hh * 0.75); if (back) ol(g, c);
    else { g.beginPath(); g.ellipse(cx, cy - hh * 0.2, hw * 1.12, hh * 0.85, 0, Math.PI * 1.02, Math.PI * 1.98); g.closePath(); ol(g, c); }
  } else if (o.hair === 'scarf') {
    if (back) { ell(g, cx, cy - hh * 0.05, hw * 1.2, hh * 1.08); ol(g, c); }
    else {
      g.beginPath(); g.ellipse(cx, cy - hh * 0.1, hw * 1.1, hh * 0.92, 0, Math.PI * 0.98, Math.PI * 2.02); g.closePath(); ol(g, c);
      g.fillStyle = '#fff6'; for (let i = 0; i < 6; i++) { ell(g, cx - hw * 0.7 + i * hw * 0.28, cy - hh * 0.6 + (i % 2) * hh * 0.15, 7, 7); g.fill(); }
    }
  }
}

function face(g, o, cx, cy, hw, hh, a) {
  const cinema = a.design === 'story-cinema';
  const F = FACES[a.expr] || FACES.neutral;
  const lx = (a.look || 0) * hw * 0.12;
  const ex = hw * 0.36, ey = cy - hh * 0.02;
  // blush
  if (o.blush) { g.fillStyle = cinema ? `rgba(193,101,79,${0.12 * o.blush})` : `rgba(255,110,120,${0.35 * o.blush})`; ell(g, cx - hw * 0.62, cy + hh * 0.2, hw * 0.18, hh * 0.09); g.fill(); ell(g, cx + hw * 0.62, cy + hh * 0.2, hw * 0.18, hh * 0.09); g.fill(); }
  // eyes
  const er = hw * 0.1;
  for (const s of [-1, 1]) {
    const x = cx + s * ex + lx, y = ey;
    g.fillStyle = PLUM; g.strokeStyle = PLUM; g.lineCap = 'round';
    if (a.blink || F.eye === 'happy') { g.lineWidth = cinema ? 7 : 11; g.beginPath(); g.arc(x, y + er * 0.6, er * 1.1, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    else if (F.eye === 'squint') { g.lineWidth = cinema ? 7 : 11; g.beginPath(); g.moveTo(x - er * 1.1, y); g.lineTo(x + er * 1.1, y - er * 0.1); g.stroke(); }
    else {
      const k = F.eye === 'wide' ? (cinema ? 1.35 : 1.55) : F.eye === 'big' || F.eye === 'teary' ? (cinema ? 1.15 : 1.3) : 1;
      ell(g, x, y, er * (cinema ? 0.55 : 0.8) * k, er * (cinema ? 0.78 : 1.15) * k); g.fill();
      if (!cinema) { g.fillStyle = '#fff'; ell(g, x + er * 0.28 * k, y - er * 0.4 * k, er * 0.28 * k, er * 0.3 * k); g.fill(); }
      if (F.eye === 'teary') { g.fillStyle = 'rgba(140,200,255,0.9)'; ell(g, x, y + er * 1.3, er * 0.9, er * 0.35); g.fill(); }
    }
    // brows
    const [ang, raise] = F.brow;
    g.lineWidth = cinema ? 6 : 10; g.beginPath();
    const by = y - er * 2.0 - raise;
    const t = ang * D * s;
    if (cinema) {
      const slope = Math.tan(t) * er;
      g.moveTo(x - er * 1.05, by + slope); g.quadraticCurveTo(x, by - er * 0.3, x + er * 1.05, by - slope);
    } else {
      g.moveTo(x - Math.cos(t) * er * 1.2, by + Math.sin(t) * er * 1.2 * -1 * -1);
      g.moveTo(x - er * 1.2, by - Math.tan(t) * er * 1.2 * -1);
      g.lineTo(x + er * 1.2, by + Math.tan(t) * er * 1.2 * -1);
    }
    g.stroke();
  }
  // glasses
  if (o.glasses) {
    g.lineWidth = 7; g.strokeStyle = '#5a3a2a';
    for (const s of [-1, 1]) { ell(g, cx + s * ex + lx * 0.3, ey, er * 2.3, er * 2.1); g.stroke(); }
    g.beginPath(); g.moveTo(cx - ex + er * 2.3, ey); g.lineTo(cx + ex - er * 2.3, ey); g.stroke();
    if (a.glint) {
      g.fillStyle = `rgba(255,255,255,${a.glint})`;
      for (const s of [-1, 1]) { ell(g, cx + s * ex, ey, er * 2.1, er * 1.9); g.fill(); }
      star(g, cx + ex + er * 1.6, ey - er * 1.6, er * 2.4 * a.glint, '#fff');
    }
  }
  // nose
  if (cinema) {
    const nx = cx + lx * 0.5, ny = cy + hh * 0.12;
    g.strokeStyle = 'rgba(139,77,58,0.55)'; g.lineWidth = 3.5; g.beginPath();
    g.moveTo(nx - hw * 0.025, ny); g.quadraticCurveTo(nx + hw * 0.065, ny + hh * 0.022, nx + hw * 0.043, ny + hh * 0.008); g.stroke();
  } else { ell(g, cx + lx * 0.5, cy + hh * 0.12, hw * 0.09 * o.nose, hh * 0.06 * o.nose); ol(g, shade(o.skin, -18), 6); }
  // mouth
  const mx = cx + lx * 0.4, my = cy + hh * 0.3, mw = hw * (cinema ? 0.22 : 0.28) * (0.7 + F.m * 0.4);
  g.lineWidth = cinema ? 6 : 9; g.strokeStyle = PLUM;
  const talk = a.talk || 0;
  if (talk > 0.08) {
    ell(g, mx, my, mw * 0.75, hh * (cinema ? 0.022 : 0.035) + hh * (cinema ? 0.075 : 0.11) * talk); ol(g, cinema ? '#713f3a' : '#8a2a3a', cinema ? 5 : 8);
    g.fillStyle = cinema ? '#c77c70' : '#ff7b8a'; ell(g, mx, my + hh * (cinema ? 0.04 : 0.06) * talk, mw * 0.4, hh * (cinema ? 0.02 : 0.035) * talk); g.fill();
    return;
  }
  switch (F.mouth) {
    case 'smile': g.beginPath(); g.arc(mx, my - mw * 0.5, mw, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); break;
    case 'grin': g.beginPath(); g.moveTo(mx - mw, my - 6); g.quadraticCurveTo(mx, my + mw * (cinema ? 0.85 : 1.3), mx + mw, my - 6); g.closePath(); ol(g, cinema ? '#713f3a' : '#8a2a3a', cinema ? 5 : 8);
      g.fillStyle = cinema ? '#fff4e3' : '#fff'; g.fillRect(mx - mw * 0.7, my - 4, mw * 1.4, cinema ? 7 : 10); break;
    case 'smirk': g.beginPath(); g.moveTo(mx - mw * 0.8, my + 2); g.quadraticCurveTo(mx + mw * 0.2, my + mw * 0.5, mx + mw, my - mw * 0.4); g.stroke(); break;
    case 'o': ell(g, mx, my + 6, mw * 0.45, mw * 0.6); ol(g, cinema ? '#713f3a' : '#8a2a3a', cinema ? 5 : 8); break;
    case 'worried': g.beginPath(); g.moveTo(mx - mw * 0.7, my + 8); g.quadraticCurveTo(mx, my - mw * 0.5, mx + mw * 0.7, my + 8); g.stroke(); break;
    case 'flat': g.beginPath(); g.moveTo(mx - mw * 0.6, my); g.lineTo(mx + mw * 0.6, my + 3); g.stroke(); break;
    case 'stuffed':
      if (!cinema) { g.fillStyle = shade(o.skin, -8); ell(g, cx - hw * 0.6, cy + hh * 0.2, hw * 0.3, hh * 0.16); ol(g, o.skin, 6); ell(g, cx + hw * 0.6, cy + hh * 0.2, hw * 0.3, hh * 0.16); ol(g, o.skin, 6); }
      g.beginPath(); g.moveTo(mx - mw * 0.4, my); g.lineTo(mx + mw * 0.4, my); g.stroke(); break;
    case 'chew': {
      const p = (a.chew || 0);
      g.beginPath(); g.moveTo(mx - mw * 0.7, my);
      for (let i = 1; i <= 4; i++) g.lineTo(mx - mw * 0.7 + i * mw * 0.35, my + (i % 2 ? -1 : 1) * (6 + 8 * p));
      g.stroke();
      if (!cinema) {
        ell(g, cx - hw * 0.55, cy + hh * 0.22, hw * (0.16 + 0.1 * p), hh * (0.09 + 0.05 * p)); ol(g, o.skin, 6);
        ell(g, cx + hw * 0.55, cy + hh * 0.22, hw * (0.16 + 0.1 * (1 - p)), hh * (0.09 + 0.05 * (1 - p))); ol(g, o.skin, 6);
      }
      break;
    }
  }
}

export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, v + k));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
export function star(g, x, y, r, c) {
  g.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr_ = i % 2 ? r * 0.25 : r; g.lineTo(x + Math.cos(a) * rr_, y + Math.sin(a) * rr_); }
  g.closePath(); g.fillStyle = c; g.fill();
}

function prop(g, kind, hx, hy, Hm, side) {
  const u = Hm * PPM;
  if (kind === 'phone') {
    g.save(); g.translate(hx, hy); g.rotate(-0.5 * side);
    rr(g, -u * 0.03, -u * 0.09, u * 0.06, u * 0.18, 18); ol(g, '#d94040');
    g.restore();
    g.strokeStyle = '#d94040'; g.lineWidth = 5; g.beginPath(); g.moveTo(hx, hy + u * 0.08);
    for (let i = 0; i < 10; i++) g.arc(hx + Math.sin(i) * 6, hy + u * 0.1 + i * 14, 9, 0, Math.PI * 2);
    g.stroke();
  } else if (kind === 'spoon') {
    g.save(); g.translate(hx, hy); g.rotate(0.3 * side);
    rr(g, -9, -u * 0.25, 18, u * 0.28, 9); ol(g, '#c8935a', 7);
    ell(g, 0, -u * 0.28, u * 0.045, u * 0.06); ol(g, '#c8935a', 7);
    g.restore();
  } else if (kind === 'fork') {
    g.save(); g.translate(hx, hy); g.rotate(0.2 * side);
    rr(g, -6, -u * 0.12, 12, u * 0.14, 6); ol(g, '#d8dce4', 6);
    ell(g, 0, -u * 0.15, 22, 16); ol(g, '#e8b54a', 6);
    g.restore();
  }
}

// held tray with lasagna in front of the torso
function trayFront(g, cx, y, Hm, kind) {
  const u = Hm * PPM;
  const w = u * 0.5, h = u * 0.09;
  rr(g, cx - w / 2, y, w, h, 10); ol(g, '#b9bfc8');
  if (kind === 'lasagna') { rr(g, cx - w * 0.44, y - h * 0.7, w * 0.88, h * 0.85, 12); ol(g, '#e2a43c'); g.fillStyle = '#c8402e'; rr(g, cx - w * 0.4, y - h * 0.6, w * 0.8, h * 0.3, 8); g.fill(); }
  else if (kind === 'pie') { ell(g, cx, y - h * 0.15, w * 0.42, h * 0.55); ol(g, '#d98c3a'); g.strokeStyle = '#a95c20'; g.lineWidth = 5; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(cx + i * w * 0.12 - 20, y - h * 0.5); g.lineTo(cx + i * w * 0.12 + 20, y + h * 0.2); g.stroke(); } }
  else if (kind === 'cake') { rr(g, cx - w * 0.35, y - h * 1.3, w * 0.7, h * 1.4, 14); ol(g, '#fbe7ef'); g.fillStyle = '#e8467c'; for (let i = 0; i < 4; i++) { ell(g, cx - w * 0.24 + i * w * 0.16, y - h * 1.3, 12, 12); g.fill(); } }
  else if (kind === 'arancini') { for (let i = 0; i < 5; i++) { ell(g, cx - w * 0.3 + i * w * 0.15, y - h * 0.3 - (i % 2) * h * 0.4, w * 0.09, h * 0.55); ol(g, '#e39a36', 6); } }
}

// Optional: design="story-cinema" changes only this card; poseFrom/poseMix blend
// arm angles toward pose (mix clamped to 0..1), before additive armSwing.
// Hair, glasses, outfit, expressions, props and rolling behavior keep their identity.
// a = { type, pose, expr, talk, blink, look, tilt, bob, fat, prop, tray, flip, roll, glint, chew, apron, back, design, poseFrom, poseMix, armSwing }
export function drawChar(g, a) {
  const o = { ...OUTFITS.marco, ...(a.outfit || OUTFITS[a.type] || {}) };
  const storyCinema = a.design === 'story-cinema';
  if (storyCinema) { o.skin = ({ nonna: '#efc2a6', marco: '#dfac87', vicina: '#eac0a2' })[a.type] || o.skin; o.blush *= 0.65; }
  if (a.apron !== undefined) o.apron = a.apron;
  g.clearRect(0, 0, CW, CH);
  g.save();
  if (a.flip) { g.translate(CW, 0); g.scale(-1, 1); }
  const Hm = o.h, u = Hm * PPM;
  const cx = CW / 2, foot = CH - 30;
  const fat = a.fat || 0;
  const bob = (a.bob || 0) * u;
  g.translate(0, -bob);
  if (a.squash) { g.translate(cx, foot); g.scale(1 + a.squash, 1 - a.squash); g.translate(-cx, -foot); }

  // ball mode (stuffed Marco rolling)
  if (fat > 0.85 && a.roll !== undefined) {
    const R = u * 0.36;
    const bx = cx, by = foot - R;
    g.save(); g.translate(bx, by); g.rotate(a.roll);
    ell(g, 0, 0, R, R); ol(g, o.top, LW + 2);
    g.strokeStyle = shade(o.top, -30); g.lineWidth = 8; g.beginPath(); g.arc(0, 0, R * 0.7, 0.4, 1.4); g.stroke();
    // little limbs
    for (const s of [-1, 1]) { ell(g, s * R * 0.95, R * 0.1, R * 0.12, R * 0.09); ol(g, o.skin, 6); ell(g, s * R * 0.4, R * 0.95, R * 0.14, R * 0.08); ol(g, o.shoes, 6); }
    // face on ball
    const hw = R * 0.55, hh = R * 0.6;
    ell(g, 0, -R * 0.35, hw, hh); ol(g, o.skin);
    hair(g, o, 0, -R * 0.35, hw, hh, false);
    face(g, o, 0, -R * 0.35, hw, hh, a);
    g.restore(); g.restore(); return;
  }

  const legL = u * 0.2 * (1 - fat * 0.5);
  const torsoH = u * 0.38 * (1 + fat * 0.35);
  const torsoW = u * o.w * 0.86 * (1 + fat * 1.6);
  const hipY = foot - legL, topY = hipY - torsoH;
  const hh = u * 0.4, hw = hh * 0.68;
  const tilt = (a.tilt || 0) * D;
  const headCY = topY - hh * 0.36 + fat * hh * 0.25;

  // back hair (behind body)
  g.save(); g.translate(cx, headCY + hh * 0.5); g.rotate(tilt); g.translate(-cx, -(headCY + hh * 0.5));
  hair(g, o, cx, headCY, hw, hh, true);
  g.restore();

  // legs + shoes
  const legC = o.pants || o.skin;
  for (const s of [-1, 1]) {
    const lx = cx + s * torsoW * 0.22;
    rr(g, lx - u * 0.045, hipY - 20, u * 0.09, legL + 4, 20); ol(g, legC);
    ell(g, lx + s * u * 0.03, foot - u * 0.025, u * 0.08, u * 0.04); ol(g, o.shoes);
  }
  // arms behind? (we draw arms after torso)
  // torso
  if (o.dress) {
    g.beginPath();
    g.moveTo(cx - torsoW * 0.36, topY + 10);
    g.quadraticCurveTo(cx - torsoW * 0.62, hipY, cx - torsoW * 0.58, hipY + legL * 0.35);
    g.lineTo(cx + torsoW * 0.58, hipY + legL * 0.35);
    g.quadraticCurveTo(cx + torsoW * 0.62, hipY, cx + torsoW * 0.36, topY + 10);
    g.quadraticCurveTo(cx, topY - 14, cx - torsoW * 0.36, topY + 10);
    ol(g, o.dress);
    if (o.dot) {
      g.save(); g.clip(); g.fillStyle = o.dot;
      for (let y = topY; y < hipY + legL; y += 34) for (let x = cx - torsoW; x < cx + torsoW; x += 34) { ell(g, x + ((y / 34) % 2) * 17, y, 6, 6); g.fill(); }
      g.restore();
    }
    if (o.apron) {
      rr(g, cx - torsoW * 0.3, topY + torsoH * 0.28, torsoW * 0.6, torsoH * 0.72 + legL * 0.2, 26); ol(g, '#fbfaf4');
      g.strokeStyle = '#d94a3a'; g.lineWidth = 6; rr(g, cx - torsoW * 0.26, topY + torsoH * 0.32, torsoW * 0.52, torsoH * 0.64 + legL * 0.16, 20); g.stroke();
      rr(g, cx - torsoW * 0.14, topY + torsoH * 0.55, torsoW * 0.28, torsoH * 0.18, 10); ol(g, '#fbfaf4', 6);
    }
  } else {
    // hoodie
    rr(g, cx - torsoW / 2, topY, torsoW, torsoH + 10, Math.min(torsoW, torsoH) * (0.3 + fat * 0.2)); ol(g, o.top);
    g.strokeStyle = shade(o.top, -35); g.lineWidth = 7;
    rr(g, cx - torsoW * 0.2, topY + torsoH * 0.55, torsoW * 0.4, torsoH * 0.25, 14); g.stroke();
    g.beginPath(); g.moveTo(cx - 16, topY + 10); g.lineTo(cx - 12, topY + torsoH * 0.3); g.moveTo(cx + 16, topY + 10); g.lineTo(cx + 12, topY + torsoH * 0.3); g.stroke();
  }
  if (o.pearls) { g.fillStyle = '#fff'; for (let i = -3; i <= 3; i++) { ell(g, cx + i * 22, topY + 18 + Math.abs(i) * -2 + 14, 9, 9); g.fill(); g.lineWidth = 3; g.strokeStyle = PLUM; g.stroke(); } }

  // arms
  const targetPose = POSES[a.pose] || POSES.hang;
  const fromPose = POSES[a.poseFrom];
  const mix = Number.isFinite(a.poseMix) ? Math.max(0, Math.min(1, a.poseMix)) : 1;
  const pose = fromPose ? targetPose.map((angles, i) => angles.map((angle, j) => fromPose[i][j] + (angle - fromPose[i][j]) * mix)) : targetPose;
  const sh = topY + torsoH * 0.14;
  const armC = o.top || o.dress;
  const hands = [];
  for (const [i, s] of [[0, -1], [1, 1]]) {
    const [a1, a2] = pose[i];
    const sx = cx + s * torsoW * (o.dress ? 0.36 : 0.44);
    const [hx, hy] = limb(g, sx, sh, a1 + (a.armSwing || 0) * s, a2, u * 0.16, u * 0.15, u * (storyCinema ? 0.062 : 0.075), armC, s);
    hands.push([hx, hy, s]);
  }
  if (a.tray) trayFront(g, cx, topY + torsoH * 0.5, Hm, a.tray);
  for (const [hx, hy, s] of hands) { const radius = u * (storyCinema ? 0.041 : 0.045); ell(g, hx, hy, radius, radius); ol(g, o.skin); }
  if (a.prop) { const [hx, hy, s] = hands[a.propHand ?? 1]; prop(g, a.prop, hx, hy, Hm, s); }

  // head
  g.save(); g.translate(cx, headCY + hh * 0.5); g.rotate(tilt); g.translate(-cx, -(headCY + hh * 0.5));
  // bean shape
  g.beginPath();
  g.moveTo(cx, headCY - hh * 0.5);
  g.bezierCurveTo(cx + hw * 1.05, headCY - hh * 0.52, cx + hw * 1.12, headCY + hh * 0.34, cx + hw * 0.1, headCY + hh * 0.5);
  g.bezierCurveTo(cx - hw * 0.9, headCY + hh * 0.56, cx - hw * 1.1, headCY + hh * 0.1, cx - hw * 0.92, headCY - hh * 0.2);
  g.bezierCurveTo(cx - hw * 0.8, headCY - hh * 0.48, cx - hw * 0.4, headCY - hh * 0.5, cx, headCY - hh * 0.5);
  ol(g, o.skin);
  // ears
  for (const s of [-1, 1]) { ell(g, cx + s * hw * 0.98, headCY + hh * 0.04, hw * 0.12, hh * 0.12); ol(g, o.skin, 6); }
  hair(g, o, cx, headCY, hw, hh, false);
  face(g, o, cx, headCY, hw, hh, a);
  g.restore();
  g.restore();
}

// effect cards (drawn on a 512x512 canvas)
export function drawFx(g, kind, t) {
  const S = 512; g.clearRect(0, 0, S, S);
  const c = S / 2;
  if (kind === 'ring') {
    const k = 1 + 0.08 * Math.sin(t * 2.2);
    star(g, c, c, 210 * k, '#ffe14a');
    g.save(); g.translate(c, c); g.rotate(Math.sin(t * 1.7) * 0.25);
    rr(g, -95, -30, 190, 70, 30); ol(g, '#d94040');
    rr(g, -60, 20, 120, 70, 16); ol(g, '#d94040');
    g.restore();
    g.strokeStyle = PLUM; g.lineWidth = 12; g.lineCap = 'round';
    for (let i = 0; i < 2; i++) for (const s of [-1, 1]) { g.beginPath(); g.arc(c, c, 150 + i * 40, Math.PI * (s > 0 ? -0.2 : 0.8), Math.PI * (s > 0 ? 0.2 : 1.2)); g.stroke(); }
  } else if (kind === 'sweat') {
    g.beginPath(); g.moveTo(c, c - 140); g.quadraticCurveTo(c + 90, c + 20, c, c + 90); g.quadraticCurveTo(c - 90, c + 20, c, c - 140); ol(g, '#8fd3ff', 12);
  } else if (kind === 'hearts') {
    for (let i = 0; i < 3; i++) {
      const x = c + (i - 1) * 140, y = c + Math.sin(t + i) * 30;
      g.beginPath(); g.moveTo(x, y + 50); g.bezierCurveTo(x - 90, y - 20, x - 40, y - 90, x, y - 40); g.bezierCurveTo(x + 40, y - 90, x + 90, y - 20, x, y + 50); ol(g, '#ff5a7a', 10);
    }
  } else if (kind === 'puff') {
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + t * 0.3; ell(g, c + Math.cos(a) * 120 * (0.6 + t * 0.2), c + Math.sin(a) * 90, 80, 70); ol(g, '#ffffff', 10); }
  } else if (kind === 'excl') {
    g.fillStyle = '#ff4a3a'; g.strokeStyle = PLUM; g.lineWidth = 12;
    rr(g, c - 40, c - 200, 80, 270, 40); ol(g, '#ff4a3a'); ell(g, c, c + 150, 48, 48); ol(g, '#ff4a3a');
  } else if (kind === 'stars') {
    for (let i = 0; i < 5; i++) { const a = t * 2 + i * 1.256; star(g, c + Math.cos(a) * 170, c + Math.sin(a) * 60, 50, '#ffe14a'); }
  }
}
