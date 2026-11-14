// Libreria condivisa di arredi, oggetti e iconografia Fortnite × Rick
// Costruita esclusivamente nella cartella della storia (nessuna modifica al motore).
import { adattaTesto } from '/web/buon_senso.js';
import { RoundedBoxGeometry } from '/lib/jsm/geometries/RoundedBoxGeometry.js';

export const TAU = Math.PI * 2;
export const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const inv = (a, b, x) => cl((x - a) / (b - a));
export const ss = x => { const u = cl(x); return u * u * (3 - 2 * u); };
export const ss5 = x => { const u = cl(x); return u * u * u * (u * (u * 6 - 15) + 10); };

/**
 * Disegna il corpo del Gettone Fortnite "Free Item Shop 14 Days":
 * corona dorata con intagli cardinali e tacche a ~8h e ~10h, 4 punte bussola,
 * disco oro con riflesso diagonale, incisione circolare opzionale ed emblema 'F'.
 */
export function disegnaCorpoGettoneFortnite(ctx, r, drawEmblem = true, showMicroEngraving = false) {
  const outerR = r * 1.00;
  const innerR = r * 0.77;
  const discR = r * 0.69;
  const ringMid = (outerR + innerR) * 0.5;
  const ringW = outerR - innerR;

  const rimGrad = ctx.createLinearGradient(-outerR, -outerR, outerR, outerR);
  rimGrad.addColorStop(0, '#fff7a8');
  rimGrad.addColorStop(0.28, '#ffda44');
  rimGrad.addColorStop(0.68, '#f0a619');
  rimGrad.addColorStop(1, '#c97d0b');

  const cardGap = 0.15;
  const notchHalf = 0.065;
  const notchNW = -Math.PI + 0.56;
  const notchSW = Math.PI - 0.56;
  const archi = [
    [cardGap, Math.PI * 0.5 - cardGap],
    [Math.PI * 0.5 + cardGap, notchSW - notchHalf],
    [notchSW + notchHalf, Math.PI - cardGap],
    [-Math.PI + cardGap, notchNW - notchHalf],
    [notchNW + notchHalf, -Math.PI * 0.5 - cardGap],
    [-Math.PI * 0.5 + cardGap, -cardGap]
  ];

  ctx.save();
  ctx.lineWidth = ringW;
  ctx.lineCap = 'butt';
  ctx.strokeStyle = rimGrad;
  for (const [a0, a1] of archi) {
    ctx.beginPath();
    ctx.arc(0, 0, ringMid, a0, a1);
    ctx.stroke();
  }

  ctx.lineWidth = Math.max(1.0, r * 0.032);
  ctx.strokeStyle = 'rgba(255, 252, 214, 0.74)';
  for (const [a0, a1] of archi) {
    ctx.beginPath();
    ctx.arc(0, 0, innerR + r * 0.015, a0, a1);
    ctx.stroke();
  }
  ctx.restore();

  // Quattro piccole tacche diagonali
  ctx.save();
  for (let k = 0; k < 4; k++) {
    const a = k * (Math.PI * 0.5) + Math.PI * 0.25;
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = '#ffd94c';
    ctx.beginPath();
    ctx.moveTo(discR * 0.94, -r * 0.032);
    ctx.lineTo(innerR * 1.02, 0);
    ctx.lineTo(discR * 0.94, r * 0.032);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Anello sottile dorato + disco oro centrale
  ctx.strokeStyle = '#ffef9c';
  ctx.lineWidth = Math.max(1.2, r * 0.045);
  ctx.beginPath();
  ctx.arc(0, 0, discR * 1.03, 0, TAU);
  ctx.stroke();

  const coreG = ctx.createRadialGradient(-r * 0.10, -r * 0.12, r * 0.04, 0, 0, discR);
  coreG.addColorStop(0, '#fffef0');
  coreG.addColorStop(0.28, '#fff79e');
  coreG.addColorStop(0.72, '#ffd93d');
  coreG.addColorStop(0.95, '#eda418');
  coreG.addColorStop(1, '#c87e0c');
  ctx.fillStyle = coreG;
  ctx.beginPath();
  ctx.arc(0, 0, discR, 0, TAU);
  ctx.fill();

  // Riflesso diagonale morbido
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, discR * 0.96, 0, TAU);
  ctx.clip();
  ctx.rotate(-0.32);
  const sheenG = ctx.createLinearGradient(0, -r * 0.22, 0, r * 0.22);
  sheenG.addColorStop(0, 'rgba(255,255,255,0)');
  sheenG.addColorStop(0.5, 'rgba(255,255,245,0.28)');
  sheenG.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheenG;
  ctx.fillRect(-r, -r * 0.22, r * 2, r * 0.44);
  ctx.restore();

  if (showMicroEngraving && r >= 86) {
    const engrAlpha = cl((r - 86) / 90) * 0.40;
    ctx.save();
    ctx.font = `700 ${Math.round(r * 0.088)}px -apple-system, BlinkMacSystemFont, "Arial Narrow", sans-serif`;
    ctx.fillStyle = `rgba(136, 78, 8, ${engrAlpha.toFixed(3)})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = 'ITEM SHOP • 14 DAYS •';
    const radTxt = discR * 0.80;
    for (let i = 0; i < label.length; i++) {
      const ang = -Math.PI * 0.82 + (i / (label.length - 1)) * (Math.PI * 0.64);
      ctx.save();
      ctx.rotate(ang + Math.PI * 0.5);
      ctx.fillText(label[i], 0, -radTxt);
      ctx.restore();
    }
    ctx.restore();
  }

  // Quattro punte cardinali sfaccettate 3D
  for (let k = 0; k < 4; k++) {
    const a = k * (Math.PI * 0.5);
    const baseR = discR * 0.96;
    const tipR = r * 1.15;
    const halfW = r * 0.095;
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = '#fffce0';
    ctx.beginPath();
    ctx.moveTo(baseR, 0);
    ctx.lineTo(tipR, 0);
    ctx.lineTo(baseR + (tipR - baseR) * 0.26, -halfW);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b97810';
    ctx.beginPath();
    ctx.moveTo(baseR, 0);
    ctx.lineTo(baseR + (tipR - baseR) * 0.26, halfW);
    ctx.lineTo(tipR, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Emblema centrale 'F' di Fortnite
  if (drawEmblem && r >= 10) {
    ctx.save();
    const sc = r * 0.38;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 250, 200, 0.72)';
    ctx.shadowBlur = Math.max(2, r * 0.14);
    ctx.strokeStyle = 'rgba(182, 114, 10, 0.50)';
    ctx.lineWidth = Math.max(1, r * 0.032);
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    ctx.moveTo(-0.52 * sc, -0.94 * sc);
    ctx.lineTo(0.62 * sc, -0.94 * sc);
    ctx.lineTo(0.56 * sc, -0.52 * sc);
    ctx.lineTo(-0.04 * sc, -0.52 * sc);
    ctx.lineTo(-0.04 * sc, -0.18 * sc);
    ctx.lineTo(0.42 * sc, -0.18 * sc);
    ctx.lineTo(0.36 * sc, 0.22 * sc);
    ctx.lineTo(-0.04 * sc, 0.22 * sc);
    ctx.lineTo(-0.04 * sc, 0.80 * sc);
    ctx.lineTo(-0.52 * sc, 0.94 * sc);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();
  }
}

export function creaToolkit(M) {
  const { THREE: T, box, luce, std, emi: rawEmi, dipinto, tex } = M;

  const emi = (col, intens = 0.45) => rawEmi(col, Math.min(intens, 0.65));

  const mat = (col, rough = 0.84, met = 0.05, emCol = null, emInt = 0.16) => {
    const m = std(col, Math.max(rough, 0.74), Math.min(met, 0.08));
    m.emissive.set(emCol || col);
    m.emissiveIntensity = Math.min(emInt, 0.18);
    return m;
  };

  const smorza = (o, max = 0.72) => {
    if (!o || !o.traverse) return o;
    o.traverse(c => {
      if (!c.isMesh || !c.material) return;
      const ms = Array.isArray(c.material) ? c.material : [c.material];
      for (const m of ms) {
        if (m.color) {
          const l = Math.max(m.color.r, m.color.g, m.color.b);
          if (l > max) m.color.multiplyScalar(max / l);
        }
        if ('roughness' in m) m.roughness = Math.max(m.roughness ?? 0.8, 0.82);
        if ('metalness' in m) m.metalness = Math.min(m.metalness ?? 0.1, 0.08);
        if (m.emissiveIntensity) m.emissiveIntensity = Math.min(m.emissiveIntensity, 0.22);
      }
    });
    return o;
  };

  const sm = (w, h, d, m, x, y, z, nome, noInk = false) => {
    const o = box(w, h, d, m, x, y, z);
    o.name = nome;
    if (noInk) o.userData.noInk = true;
    return o;
  };

  const rbox = (w, h, d, radius, seg, m, x, y, z, nome, parent = M.root, noInk = false) => {
    const mesh = new T.Mesh(new RoundedBoxGeometry(w, h, d, seg, radius), m);
    mesh.position.set(x, y, z);
    mesh.name = nome;
    if (noInk) mesh.userData.noInk = true;
    parent.add(mesh);
    return mesh;
  };

  const setStr = o => {
    o.userData.struttura = 1;
    if (o.traverse) o.traverse(c => { c.userData.struttura = 1; });
    return o;
  };

  const addGrp = (x, y, z, nome, parent = M.root) => {
    const g = new T.Group();
    g.position.set(x, y, z);
    g.name = nome;
    parent.add(g);
    return g;
  };

  const live = (o, tipo, opt = {}) => {
    o.userData.vivo = tipo;
    M.vita.aggiungi(o, tipo, opt);
    return o;
  };

  const noInkTree = o => {
    o.traverse(c => {
      if (!c.isMesh || !c.geometry) return;
      const gt = c.geometry.type || '';
      const p = c.geometry.parameters || {};
      if (gt.includes('Plane') || gt.includes('Circle') || gt.includes('Ring') || gt.includes('Torus') || gt.includes('Octahedron')) {
        c.userData.noInk = true;
        return;
      }
      const dims = [p.width, p.height, p.depth, p.radius ? p.radius * 2 : undefined, p.radiusTop ? p.radiusTop * 2 : undefined].filter(v => typeof v === 'number');
      if (dims.length && Math.min(...dims) < 0.15) {
        c.userData.noInk = true;
      }
    });
    return o;
  };

  // Texture pavimento parquet/piastrelle dipinte stile nostro motore (ampie e morbide: zero moire)
  const texPiastrelle = (bg = '#786858', line = '#665648', accent = '#9c8264', cols = 3, rows = 3) => tex(512, 512, (c, W, H) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);
    const cw = W / cols, ch = H / rows;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        c.fillStyle = ((i + j) % 2 === 0) ? bg : line;
        c.globalAlpha = 0.16;
        c.fillRect(i * cw + 6, j * ch + 6, cw - 12, ch - 12);
      }
    }
    c.globalAlpha = 0.14;
    c.strokeStyle = line;
    c.lineWidth = 12;
    for (let i = 0; i <= cols; i++) { c.beginPath(); c.moveTo(i * cw, 0); c.lineTo(i * cw, H); c.stroke(); }
    for (let j = 0; j <= rows; j++) { c.beginPath(); c.moveTo(0, j * ch); c.lineTo(W, j * ch); c.stroke(); }
    c.globalAlpha = 1;
  });

  // Texture parete dipinta con boiserie calda stile nostro motore
  const texPannelloMuro = (bg = '#cfc2ad', trim = '#7a5c44', stripe = '#b8893e') => tex(512, 512, (c, W, H) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);
    c.strokeStyle = trim;
    c.globalAlpha = 0.18;
    c.lineWidth = 14;
    for (let x = 0; x <= W; x += 170) {
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke();
    }
    c.globalAlpha = 1;
    c.fillStyle = trim;
    c.fillRect(0, H * 0.72, W, H * 0.28);
    c.fillStyle = stripe;
    c.globalAlpha = 0.34;
    c.fillRect(0, H * 0.70, W, 18);
    c.globalAlpha = 1;
  });

  // Stanza chiusa con texture dipinte ricche (dipinto: t, emissiveInt=0.22, roughness=0.92 -> look matte anti-glare!)
  function creaStanzaTattica(w, h, d, zMid, {
    wallBg = '#cfc2ad', wallTrim = '#7a5c44', stripe = '#b8893e',
    floorBg = '#786858', floorAlt = '#685848', floorAcc = '#9c8264',
    ceilBg = '#dfd3be', zocCol = '#5c4330', texRep = [2, 2]
  } = {}) {
    for (const c of M.root.children) {
      if (c.userData && c.userData.suolo) c.visible = false;
    }
    const tFl = texPiastrelle(floorBg, floorAlt, floorAcc, 3, 3);
    tFl.wrapS = tFl.wrapT = T.RepeatWrapping;
    tFl.repeat.set(texRep[0], texRep[1]);
    const mFl = dipinto(tFl, 0.22, 0.92);

    const tWa = texPannelloMuro(wallBg, wallTrim, stripe);
    tWa.wrapS = tWa.wrapT = T.RepeatWrapping;
    tWa.repeat.set(3, 1);
    const mWa = dipinto(tWa, 0.24, 0.90);

    const mCe = mat(ceilBg, 0.92, 0.02, ceilBg, 0.20);
    const mZo = mat(zocCol, 0.88, 0.05, zocCol, 0.18);

    setStr(sm(w + 0.4, 0.25, d + 0.4, mFl, 0, -0.125, zMid, 'pavimento_sala', true));
    setStr(sm(w + 0.4, 0.25, d + 0.4, mCe, 0, h + 0.125, zMid, 'soffitto_sala', true));
    setStr(sm(w + 0.4, h + 0.2, 0.25, mWa, 0, h / 2, zMid - d / 2, 'parete_fondo', true));
    setStr(sm(w + 0.4, h + 0.2, 0.25, mWa, 0, h / 2, zMid + d / 2, 'parete_dietro', true));
    setStr(sm(0.25, h + 0.2, d + 0.4, mWa, -w / 2, h / 2, zMid, 'parete_sinistra', true));
    setStr(sm(0.25, h + 0.2, d + 0.4, mWa, w / 2, h / 2, zMid, 'parete_destra', true));
    setStr(sm(w, 0.36, 0.10, mZo, 0, 0.18, zMid - d / 2 + 0.14, 'zoccolatura_fondo', true));
    setStr(sm(0.10, 0.36, d, mZo, -w / 2 + 0.14, 0.18, zMid, 'zoccolatura_sx', true));
    setStr(sm(0.10, 0.36, d, mZo, w / 2 - 0.14, 0.18, zMid, 'zoccolatura_dx', true));
  }

  // Gettone 3D Fortnite "14 Giorni Shop Gratis"
  function creaGettone3D(x, y, z, r = 0.42, nome = 'gettone_doro', { rot = 0.14, floatAmp = 0.025 } = {}) {
    const g = addGrp(x, y, z, nome);
    const tokTex = tex(512, 512, (c, W, H) => {
      c.fillStyle = '#4a3008';
      c.fillRect(0, 0, W, H);
      c.save();
      c.translate(W * 0.5, H * 0.5);
      disegnaCorpoGettoneFortnite(c, W * 0.40, true, false);
      c.restore();
    });
    const mFace = new T.MeshStandardMaterial({
      map: tokTex,
      emissiveMap: tokTex,
      emissive: '#ffdf66',
      emissiveIntensity: 0.32,
      roughness: 0.72,
      metalness: 0.12
    });
    const mGold = mat('#f5bd38', 0.32, 0.65, '#d98c14', 0.42);

    const core = new T.Mesh(new T.CylinderGeometry(r * 0.72, r * 0.72, 0.11, 28), mGold);
    core.rotation.x = Math.PI / 2;
    g.add(core);

    const faceF = new T.Mesh(new T.CircleGeometry(r * 0.71, 32), mFace);
    faceF.position.z = 0.058;
    const faceB = new T.Mesh(new T.CircleGeometry(r * 0.71, 32), mFace);
    faceB.position.z = -0.058;
    faceB.rotation.y = Math.PI;
    g.add(faceF, faceB);

    for (let k = 0; k < 4; k++) {
      const arc = new T.Mesh(new T.TorusGeometry(r * 0.90, r * 0.105, 10, 14, Math.PI * 0.37), mGold);
      arc.rotation.z = k * (Math.PI * 0.5) + 0.16;
      g.add(arc);
      const ang = k * (Math.PI * 0.5);
      const sp = new T.Mesh(new T.ConeGeometry(r * 0.10, r * 0.34, 4), emi('#ffd866', 0.55));
      sp.position.set(Math.cos(ang) * r * 1.03, Math.sin(ang) * r * 1.03, 0);
      sp.rotation.z = ang - Math.PI * 0.5;
      g.add(sp);
    }

    g.traverse(c => { if (c.isMesh) c.userData.noInk = true; });
    if (floatAmp > 0) live(g, 'galleggia', { amp: floatAmp, freq: 0.38, gira: rot });
    return g;
  }

  // Forziere stile Fortnite ('blu' | 'oro' | 'pirata')
  function creaForziereFortnite(x, y, z, s = 1, { tipo = 'oro', aperto = false, nome = 'forziere', ry = 0 } = {}) {
    const g = addGrp(x, y, z, nome);
    g.rotation.y = ry;
    const isPirate = tipo === 'pirata';
    const isGold = tipo === 'oro' || isPirate;
    const bodyHex = isPirate ? '#b87b1e' : (isGold ? '#8c531e' : '#3b5675');
    const bodyEm = isPirate ? '#7a4f10' : (isGold ? '#5e3510' : '#263a52');
    const trimHex = isGold ? '#e0b24c' : '#b89252';
    const trimEm = isGold ? '#a87c20' : '#7d6030';

    const mBody = mat(bodyHex, 0.80, 0.06, bodyEm, 0.16);
    const mTrim = mat(trimHex, 0.78, 0.08, trimEm, 0.16);

    const base = new T.Mesh(new RoundedBoxGeometry(0.95 * s, 0.48 * s, 0.62 * s, 3, 0.04 * s), mBody);
    base.position.y = 0.24 * s;
    g.add(base);

    for (const bx of [-0.36 * s, 0.36 * s]) {
      const band = new T.Mesh(new RoundedBoxGeometry(0.10 * s, 0.50 * s, 0.65 * s, 2, 0.02 * s), mTrim);
      band.position.set(bx, 0.25 * s, 0);
      band.userData.noInk = true;
      g.add(band);
    }

    const lockPlate = new T.Mesh(new RoundedBoxGeometry(0.18 * s, 0.20 * s, 0.06 * s, 2, 0.02 * s), mTrim);
    lockPlate.position.set(0, 0.44 * s, 0.32 * s);
    lockPlate.userData.noInk = true;
    const lockCore = new T.Mesh(
      new T.BoxGeometry(0.10 * s, 0.12 * s, 0.04 * s),
      emi(isPirate ? '#5ec8d8' : (isGold ? '#f5dca0' : '#d8b46a'), 0.36)
    );
    lockCore.position.set(0, 0.45 * s, 0.345 * s);
    lockCore.userData.noInk = true;
    g.add(lockPlate, lockCore);

    const lidGrp = new T.Group();
    const lidCyl = new T.Mesh(new T.CylinderGeometry(0.305 * s, 0.305 * s, 0.94 * s, 14, 1, false, 0, Math.PI), mBody);
    lidCyl.rotation.z = Math.PI / 2;
    const lidCap = new T.Mesh(new T.BoxGeometry(0.94 * s, 0.05 * s, 0.60 * s), mBody);
    lidCap.userData.noInk = true;
    lidGrp.add(lidCyl, lidCap);
    for (const bx of [-0.36 * s, 0.36 * s]) {
      const lb = new T.Mesh(new T.CylinderGeometry(0.32 * s, 0.32 * s, 0.105 * s, 14, 1, false, 0, Math.PI), mTrim);
      lb.rotation.z = Math.PI / 2;
      lb.position.x = bx;
      lb.userData.noInk = true;
      lidGrp.add(lb);
    }

    if (aperto) {
      lidGrp.position.set(0, 0.56 * s, -0.30 * s);
      lidGrp.rotation.x = -0.88;
      const innerCol = isGold ? '#ffd858' : '#38bdf8';
      const glow = new T.Mesh(new T.BoxGeometry(0.80 * s, 0.06 * s, 0.46 * s), emi(innerCol, 0.72));
      glow.position.set(0, 0.485 * s, 0);
      g.add(glow);
    } else {
      lidGrp.position.set(0, 0.49 * s, 0);
    }
    g.add(lidGrp);

    if (isPirate) {
      const skullTex = tex(128, 128, (c, W, H) => {
        c.fillStyle = '#c88d18'; c.fillRect(0, 0, W, H);
        c.strokeStyle = '#ffea78'; c.lineWidth = 8; c.strokeRect(4, 4, W - 8, H - 8);
        c.strokeStyle = '#ffffff'; c.lineWidth = 10; c.lineCap = 'round';
        c.beginPath(); c.moveTo(26, 28); c.lineTo(102, 100); c.moveTo(102, 28); c.lineTo(26, 100); c.stroke();
        c.fillStyle = '#ffffff';
        c.beginPath(); c.arc(64, 52, 24, 0, TAU); c.fill();
        c.fillRect(48, 66, 32, 22);
        c.fillStyle = '#241812';
        c.beginPath(); c.arc(54, 50, 6, 0, TAU); c.arc(74, 50, 6, 0, TAU); c.fill();
        c.fillRect(58, 74, 3, 10); c.fillRect(64, 74, 3, 10); c.fillRect(70, 74, 3, 10);
      });
      const plaque = new T.Mesh(new T.PlaneGeometry(0.56 * s, 0.42 * s), dipinto(skullTex, 0.28, 0.85));
      plaque.position.set(0, 0.25 * s, 0.318 * s);
      g.add(plaque);
      const gemPink = emi('#ff4da6', 0.90);
      for (const [gx, gy] of [[-0.41, 0.44], [0.41, 0.44], [-0.41, 0.08], [0.41, 0.08]]) {
        const gm = new T.Mesh(new T.OctahedronGeometry(0.055 * s, 0), gemPink);
        gm.position.set(gx * s, gy * s, 0.33 * s);
        g.add(gm);
      }
      const gemTop = new T.Mesh(new T.OctahedronGeometry(0.075 * s, 0), emi('#38f2ff', 0.95));
      gemTop.position.set(0, 0.72 * s, 0.26 * s);
      g.add(gemTop);
    }

    noInkTree(g);
    live(g, 'respira', { amp: 0.014, freq: 0.40 });
    return g;
  }

  // Distributore automatico Fortnite (Vending Machine) con icone oggetti dipinte
  function creaVendingMachine(x, y, z, ry = 0, s = 1, nome = 'vending_fortnite') {
    const g = addGrp(x, y, z, nome);
    g.rotation.y = ry;
    const mBody = mat('#1e3a8a', 0.45, 0.32, '#1d4ed8', 0.24);
    const mTrim = mat('#60a5fa', 0.35, 0.40, '#38bdf8', 0.32);

    const body = new T.Mesh(new RoundedBoxGeometry(1.15 * s, 2.25 * s, 0.85 * s, 3, 0.06 * s), mBody);
    body.position.y = 1.125 * s;
    g.add(body);

    const scrTex = tex(256, 384, (c, W, H) => {
      c.fillStyle = '#0f172a'; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#38bdf8'; c.lineWidth = 8; c.strokeRect(8, 8, W - 16, H - 16);
      // Titolo distributore
      c.fillStyle = '#facc15';
      adattaTesto(c, 'LOOT VENDING', W, 62, { colore: '#facc15', righe: 1, max: 0.7 });
      // 3 slot bottino
      const items = [
        { bg: '#f59e0b', tag: 'TOKEN', sub: 'FREE 14D' },
        { bg: '#06b6d4', tag: 'SHIELD', sub: '50 HP' },
        { bg: '#7c3aed', tag: 'SLURP', sub: '100%' }
      ];
      items.forEach((it, idx) => {
        const y0 = 76 + idx * 96;
        c.fillStyle = '#1e293b';
        c.fillRect(22, y0, W - 44, 82);
        c.strokeStyle = it.bg;
        c.lineWidth = 5;
        c.strokeRect(22, y0, W - 44, 82);
        c.fillStyle = it.bg;
        c.beginPath(); c.arc(64, y0 + 41, 22, 0, TAU); c.fill();
        c.fillStyle = '#ffffff';
        c.font = '900 24px sans-serif';
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(it.tag, 102, y0 + 29);
        c.fillStyle = '#fde047';
        c.font = '700 18px sans-serif';
        c.fillText(it.sub, 102, y0 + 57);
      });
    });
    const scr = new T.Mesh(new T.PlaneGeometry(0.86 * s, 1.32 * s), dipinto(scrTex, 0.30, 0.42));
    scr.position.set(0, 1.42 * s, 0.43 * s);
    g.add(scr);

    const flap = new T.Mesh(new RoundedBoxGeometry(0.76 * s, 0.38 * s, 0.12 * s, 2, 0.02 * s), mat('#0f172a', 0.6, 0.3));
    flap.position.set(0, 0.38 * s, 0.41 * s);
    const barL = new T.Mesh(new T.BoxGeometry(0.06 * s, 2.0 * s, 0.10 * s), emi('#38bdf8', 0.65));
    barL.position.set(-0.56 * s, 1.15 * s, 0.38 * s);
    const barR = barL.clone(); barR.position.x = 0.56 * s;
    const cap = new T.Mesh(new RoundedBoxGeometry(1.22 * s, 0.14 * s, 0.90 * s, 2, 0.03 * s), mTrim);
    cap.position.y = 2.26 * s;
    g.add(flap, barL, barR, cap);

    noInkTree(g);
    live(g, 'lampeggia', { min: 0.88, freq: 0.34, modo: 'respiro' });
    return g;
  }

  // Reboot Van iconico di Fortnite (furgone blu/bianco con pannello ologramma sul tetto)
  function creaRebootVan(x, y, z, s = 1, ry = 0, nome = 'reboot_van') {
    const g = addGrp(x, y, z, nome);
    g.rotation.y = ry;
    const mBlue = mat('#2563eb', 0.48, 0.25, '#1d4ed8', 0.25);
    const mWhite = mat('#e2e8f0', 0.65, 0.08, '#cbd5e1', 0.22);
    const mDark = mat('#1e293b', 0.65, 0.25, '#0f172a', 0.18);
    const mGlow = emi('#38bdf8', 0.85);

    const lower = new T.Mesh(new RoundedBoxGeometry(1.75 * s, 0.88 * s, 3.6 * s, 3, 0.08 * s), mBlue);
    lower.position.y = 0.68 * s;
    const upper = new T.Mesh(new RoundedBoxGeometry(1.62 * s, 0.72 * s, 2.85 * s, 3, 0.08 * s), mWhite);
    upper.position.set(0, 1.38 * s, -0.22 * s);
    const wind = new T.Mesh(new RoundedBoxGeometry(1.48 * s, 0.46 * s, 0.10 * s, 2, 0.02 * s), mDark);
    wind.position.set(0, 1.32 * s, 1.24 * s);
    wind.rotation.x = -0.35;

    // Strisce & card slot laterali
    const stripe = new T.Mesh(new T.BoxGeometry(1.79 * s, 0.16 * s, 3.2 * s), emi('#22d3ee', 0.62));
    stripe.position.y = 0.78 * s;
    const deck = new T.Mesh(new T.CylinderGeometry(0.55 * s, 0.62 * s, 0.14 * s, 18), mGlow);
    deck.position.set(0, 1.80 * s, -0.35 * s);
    const holoTower = new T.Mesh(new T.CylinderGeometry(0.32 * s, 0.42 * s, 0.55 * s, 16, 1, true), new T.MeshBasicMaterial({
      color: '#67e8f9', transparent: true, opacity: 0.34, depthWrite: false, side: T.DoubleSide
    }));
    holoTower.position.set(0, 2.15 * s, -0.35 * s);
    g.add(lower, upper, wind, stripe, deck, holoTower);

    // 4 ruote
    for (const [wx, wz] of [[-0.86, 1.05], [0.86, 1.05], [-0.86, -1.05], [0.86, -1.05]]) {
      const wheel = new T.Mesh(new T.CylinderGeometry(0.34 * s, 0.34 * s, 0.22 * s, 16), mDark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx * s, 0.34 * s, wz * s);
      g.add(wheel);
    }
    // Fari
    for (const fx of [-0.58, 0.58]) {
      const hl = new T.Mesh(new T.SphereGeometry(0.11 * s, 10, 8), emi('#fef08a', 0.88));
      hl.position.set(fx * s, 0.62 * s, 1.80 * s);
      g.add(hl);
    }

    noInkTree(g);
    live(g, 'vibra', { amp: 0.005, freq: 4.5 });
    return g;
  }

  // Battle Bus volante nello skyline notturno Fortnite
  function creaBattleBus(x, y, z, s = 1, ry = 0, nome = 'battle_bus') {
    const g = addGrp(x, y, z, nome);
    g.rotation.y = ry;
    const mBus = mat('#2563eb', 0.45, 0.28, '#1d4ed8', 0.28);
    const mGold = mat('#facc15', 0.42, 0.30, '#eab308', 0.32);

    const chassis = new T.Mesh(new RoundedBoxGeometry(1.1 * s, 0.95 * s, 3.0 * s, 3, 0.08 * s), mBus);
    const roof = new T.Mesh(new RoundedBoxGeometry(1.0 * s, 0.18 * s, 2.6 * s, 2, 0.03 * s), mGold);
    roof.position.y = 0.54 * s;
    const nose = new T.Mesh(new RoundedBoxGeometry(0.92 * s, 0.60 * s, 0.75 * s, 2, 0.06 * s), mBus);
    nose.position.set(0, -0.15 * s, 1.72 * s);
    const fl = new T.Mesh(new T.ConeGeometry(0.26 * s, 0.65 * s, 10), emi('#fb923c', 0.92));
    fl.position.set(0, 1.10 * s, 0);

    // Finestrini azzurro chiaro
    const wins = new T.Mesh(new T.BoxGeometry(1.14 * s, 0.34 * s, 2.15 * s), emi('#93c5fd', 0.45));
    wins.position.set(0, 0.16 * s, -0.15 * s);

    // Pallone blu Fortnite a spicchi oro
    const balTex = tex(256, 128, (c, W, H) => {
      c.fillStyle = '#1e3a8a'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 8; i++) {
        c.fillStyle = i % 2 === 0 ? '#2563eb' : '#facc15';
        c.fillRect(i * (W / 8), 0, W / 8, H);
      }
      c.fillStyle = '#0f172a';
      c.fillRect(0, 0, W, 16); c.fillRect(0, H - 16, W, 16);
    });
    const balloon = new T.Mesh(new T.SphereGeometry(1.45 * s, 20, 14), dipinto(balTex, 0.34, 0.85));
    balloon.scale.set(1.0, 1.15, 1.32);
    balloon.position.y = 2.85 * s;

    for (const [cx, cz] of [[-0.45, -0.9], [0.45, -0.9], [-0.45, 0.9], [0.45, 0.9]]) {
      const rope = new T.Mesh(new T.CylinderGeometry(0.018 * s, 0.018 * s, 1.65 * s, 6), mat('#e2e8f0', 0.7));
      rope.position.set(cx * s, 1.35 * s, cz * s);
      g.add(rope);
    }
    g.add(chassis, roof, nose, fl, wins, balloon);
    noInkTree(g);
    live(g, 'galleggia', { amp: 0.18, freq: 0.24, gira: 0.03 });
    return g;
  }

  // Tavolo Ologramma Tattico con mappa isola Battle Royale + cerchio storm rotante
  function creaTavoloOlogramma(x, y, z, w = 2.3, d = 1.6, ry = 0, nome = 'tavolo_ologramma') {
    const g = addGrp(x, y, z, nome);
    g.rotation.y = ry;
    const mBase = mat('#1e293b', 0.55, 0.45, '#0f172a', 0.22);
    const mTrim = mat('#38bdf8', 0.35, 0.40, '#0ea5e9', 0.36);

    const ped = new T.Mesh(new T.CylinderGeometry(0.65, 0.85, 0.72, 12), mBase);
    ped.position.y = 0.36;
    const rim = new T.Mesh(new RoundedBoxGeometry(w, 0.14, d, 3, 0.04), mTrim);
    rim.position.y = 0.79;

    const mapTex = tex(512, 384, (c, W, H) => {
      c.fillStyle = '#0c2340'; c.fillRect(0, 0, W, H);
      // Isola stilizzata
      c.fillStyle = '#1d4d38';
      c.beginPath();
      c.ellipse(W * 0.50, H * 0.52, W * 0.35, H * 0.34, -0.2, 0, TAU);
      c.fill();
      c.strokeStyle = '#67e8f9'; c.lineWidth = 5;
      c.stroke();
      // Reticolo tattico
      c.strokeStyle = 'rgba(103, 232, 249, 0.25)'; c.lineWidth = 2;
      for (let gx = 48; gx < W; gx += 48) { c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, H); c.stroke(); }
      for (let gy = 48; gy < H; gy += 48) { c.beginPath(); c.moveTo(0, gy); c.lineTo(W, gy); c.stroke(); }
      // Cerchio storm viola + bersaglio oro
      c.strokeStyle = '#a855f7'; c.lineWidth = 6;
      c.beginPath(); c.arc(W * 0.55, H * 0.48, 86, 0, TAU); c.stroke();
      c.fillStyle = '#facc15';
      c.beginPath(); c.arc(W * 0.55, H * 0.48, 12, 0, TAU); c.fill();
    });
    const screen = new T.Mesh(new T.PlaneGeometry(w * 0.88, d * 0.84), dipinto(mapTex, 0.44, 0.75));
    screen.rotation.x = -Math.PI / 2;
    screen.position.y = 0.865;

    const holoRing = new T.Mesh(
      new T.TorusGeometry(0.46, 0.025, 10, 32),
      emi('#a855f7', 0.65)
    );
    holoRing.rotation.x = Math.PI / 2;
    holoRing.position.y = 1.16;
    holoRing.name = 'gira';

    const dropMarker = new T.Mesh(new T.OctahedronGeometry(0.11, 0), emi('#facc15', 0.75));
    dropMarker.position.y = 1.24;
    dropMarker.name = 'gira_y';

    g.add(ped, rim, screen, holoRing, dropMarker);
    noInkTree(g);
    live(holoRing, 'gira', { asse: 'z', vel: 0.22 });
    live(dropMarker, 'galleggia', { amp: 0.04, freq: 0.5, gira: 0.28 });
    live(g, 'respira', { amp: 0.006, freq: 0.30 });
    return g;
  }

  // Barile Slurp Fortnite (tanica blu/azzurra "SLURP")
  function creaBarileSlurp(x, y, z, s = 1, nome = 'barile_slurp') {
    const g = addGrp(x, y, z, nome);
    const slurpTex = tex(256, 256, (c, W, H) => {
      c.fillStyle = '#0369a1'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#38bdf8'; c.fillRect(0, 48, W, H - 96);
      c.fillStyle = '#e0f2fe';
      c.font = '900 44px sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('SLURP', W / 2, H / 2);
    });
    const cyl = new T.Mesh(new T.CylinderGeometry(0.32 * s, 0.32 * s, 0.82 * s, 18), dipinto(slurpTex, 0.34, 0.82));
    cyl.position.y = 0.41 * s;
    const mHoop = mat('#1e293b', 0.5, 0.5, '#0f172a', 0.2);
    for (const hy of [0.06, 0.41, 0.76]) {
      const hoop = new T.Mesh(new T.TorusGeometry(0.325 * s, 0.03 * s, 8, 18), mHoop);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = hy * s;
      g.add(hoop);
    }
    const lidGlow = new T.Mesh(new T.CylinderGeometry(0.28 * s, 0.28 * s, 0.04 * s, 16), emi('#22d3ee', 0.65));
    lidGlow.position.y = 0.82 * s;
    g.add(cyl, lidGlow);
    noInkTree(g);
    live(g, 'respira', { amp: 0.015, freq: 0.35 });
    return g;
  }

  // Pozione Scudo grande
  function creaPozioneScudo(x, y, z, s = 1, nome = 'pozione_scudo') {
    const g = addGrp(x, y, z, nome);
    const liquid = new T.Mesh(new T.CylinderGeometry(0.17 * s, 0.19 * s, 0.34 * s, 14), emi('#1fb6db', 0.75));
    liquid.position.y = 0.19 * s;
    const glassRim = new T.Mesh(new T.CylinderGeometry(0.185 * s, 0.205 * s, 0.07 * s, 14), mat('#bae6fd', 0.28, 0.2, '#7dd3fc', 0.34));
    glassRim.position.y = 0.37 * s;
    const neck = new T.Mesh(new T.CylinderGeometry(0.08 * s, 0.11 * s, 0.14 * s, 12), mat('#93c5fd', 0.28, 0.2, '#60a5fa', 0.32));
    neck.position.y = 0.46 * s;
    const cork = new T.Mesh(new T.CylinderGeometry(0.068 * s, 0.058 * s, 0.09 * s, 10), mat('#9a6b3e', 0.85, 0.05, '#78522d', 0.22));
    cork.position.y = 0.56 * s;
    g.add(liquid, glassRim, neck, cork);
    noInkTree(g);
    live(g, 'galleggia', { amp: 0.02, freq: 0.44, gira: 0.12 });
    return g;
  }

  // V-Bucks 3D
  function creaVBuck3D(x, y, z, r = 0.22, nome = 'vbuck') {
    const g = addGrp(x, y, z, nome);
    const vTex = tex(256, 256, (c, W, H) => {
      c.fillStyle = '#38bdf8'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#dbeafe';
      c.beginPath(); c.arc(128, 128, 114, 0, TAU); c.fill();
      c.strokeStyle = '#1d4ed8'; c.lineWidth = 14;
      c.beginPath(); c.arc(128, 128, 102, 0, TAU); c.stroke();
      c.fillStyle = '#1e3a8a';
      c.font = '900 132px sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('V', 128, 134);
    });
    const mFace = new T.MeshStandardMaterial({
      map: vTex, emissiveMap: vTex, emissive: '#60a5fa', emissiveIntensity: 0.26, roughness: 0.35, metalness: 0.40
    });
    const edge = new T.Mesh(new T.CylinderGeometry(r, r, 0.055, 22), mat('#60a5fa', 0.35, 0.6, '#38bdf8', 0.30));
    edge.rotation.x = Math.PI / 2;
    const fF = new T.Mesh(new T.CircleGeometry(r * 0.96, 24), mFace); fF.position.z = 0.03;
    const fB = new T.Mesh(new T.CircleGeometry(r * 0.96, 24), mFace); fB.position.z = -0.03; fB.rotation.y = Math.PI;
    g.add(edge, fF, fB);
    noInkTree(g);
    live(g, 'galleggia', { amp: 0.025, freq: 0.46, gira: 0.14 });
    return g;
  }

  // Supply Drop (cassa rifornimenti + pallone a spicchi)
  function creaSupplyDrop(x, y, z, s = 1, nome = 'supply_drop', { conPallone = true } = {}) {
    const g = addGrp(x, y, z, nome);
    const crate = new T.Mesh(new RoundedBoxGeometry(0.68 * s, 0.64 * s, 0.68 * s, 2, 0.03 * s), mat('#1d4ed8', 0.52, 0.2, '#1e40af', 0.28));
    crate.position.y = 0.32 * s;
    const strap1 = new T.Mesh(new T.BoxGeometry(0.70 * s, 0.12 * s, 0.70 * s), mat('#facc15', 0.42, 0.3, '#eab308', 0.34));
    strap1.position.y = 0.32 * s;
    const strap2 = new T.Mesh(new T.BoxGeometry(0.14 * s, 0.66 * s, 0.70 * s), mat('#facc15', 0.42, 0.3, '#eab308', 0.34));
    strap2.position.y = 0.32 * s;
    const capYellow = new T.Mesh(new T.BoxGeometry(0.54 * s, 0.08 * s, 0.54 * s), emi('#fde047', 0.68));
    capYellow.position.y = 0.66 * s;
    g.add(crate, strap1, strap2, capYellow);

    if (conPallone) {
      const balTex = tex(128, 128, (c, W, H) => {
        const stripes = ['#ef4444', '#f8fafc', '#2563eb', '#facc15'];
        for (let i = 0; i < 8; i++) {
          c.fillStyle = stripes[i % 4];
          c.fillRect((i * W) / 8, 0, W / 8 + 1, H);
        }
      });
      const balloon = new T.Mesh(new T.SphereGeometry(0.38 * s, 14, 10), dipinto(balTex, 0.32, 0.86));
      balloon.scale.set(1.0, 1.18, 1.0);
      balloon.position.y = 1.38 * s;
      for (const [cx, cz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) {
        const rope = new T.Mesh(new T.CylinderGeometry(0.012 * s, 0.012 * s, 0.44 * s, 6), mat('#e2e8f0', 0.8));
        rope.position.set(cx * s, 0.86 * s, cz * s);
        g.add(rope);
      }
      g.add(balloon);
    }
    noInkTree(g);
    live(g, 'ondeggia', { amp: 0.03, freq: 0.32 });
    return g;
  }

  // Rastrelliera picconi Fortnite (Pickaxe Rack)
  function creaRastrellieraPicconi(x, y, z, ry = 0, nome = 'rastrelliera_picconi') {
    const g = addGrp(x, y, z, nome);
    g.rotation.y = ry;
    const mSteel = mat('#334155', 0.5, 0.55, '#1e293b', 0.2);
    const mCyan = emi('#38bdf8', 0.58);
    const mGold = emi('#facc15', 0.58);

    const base = new T.Mesh(new RoundedBoxGeometry(1.3, 0.12, 0.55, 2, 0.02), mSteel);
    base.position.y = 0.06;
    const bar = new T.Mesh(new RoundedBoxGeometry(1.24, 0.10, 0.14, 2, 0.02), mSteel);
    bar.position.y = 1.35;
    g.add(base, bar);
    for (const px of [-0.56, 0.56]) {
      const post = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 1.35, 10), mSteel);
      post.position.set(px, 0.70, 0);
      g.add(post);
    }
    // 2 Picconi (Azzurro e Oro)
    [-0.28, 0.28].forEach((px, idx) => {
      const shaft = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1.15, 8), mat('#475569', 0.6, 0.4));
      shaft.position.set(px, 0.76, 0.08);
      const blade = new T.Mesh(new RoundedBoxGeometry(0.46, 0.10, 0.08, 2, 0.02), idx === 0 ? mCyan : mGold);
      blade.position.set(px, 1.28, 0.08);
      g.add(shaft, blade);
    });
    noInkTree(g);
    live(g, 'respira', { amp: 0.01, freq: 0.35 });
    return g;
  }

  // Cassa munizioni verde oliva + pila di lingotti oro
  function creaCassaMunizioni(x, y, z, s = 1, ry = 0, nome = 'cassa_munizioni') {
    const g = addGrp(x, y, z, nome);
    g.rotation.y = ry;
    const body = new T.Mesh(new RoundedBoxGeometry(0.55 * s, 0.34 * s, 0.36 * s, 2, 0.02 * s), mat('#3f6212', 0.65, 0.2, '#365314', 0.22));
    body.position.y = 0.17 * s;
    const lid = new T.Mesh(new RoundedBoxGeometry(0.58 * s, 0.07 * s, 0.39 * s, 2, 0.02 * s), mat('#4d7c0f', 0.6, 0.22, '#3f6212', 0.24));
    lid.position.y = 0.36 * s;
    const latch = new T.Mesh(new T.BoxGeometry(0.14 * s, 0.10 * s, 0.05 * s), mat('#facc15', 0.35, 0.5, '#eab308', 0.32));
    latch.position.set(0, 0.30 * s, 0.18 * s);
    g.add(body, lid, latch);
    noInkTree(g);
    live(g, 'respira', { amp: 0.01, freq: 0.34 });
    return g;
  }

  function creaPilaLingotti(x, y, z, s = 1, ry = 0, nome = 'lingotti_oro') {
    const g = addGrp(x, y, z, nome);
    g.rotation.y = ry;
    const mGold = mat('#fbbf24', 0.65, 0.20, '#d97706', 0.28);
    const pos = [[-0.14, 0.05, 0], [0.14, 0.05, 0.02], [0, 0.14, 0.01]];
    for (const [bx, by, bz] of pos) {
      const bar = new T.Mesh(new RoundedBoxGeometry(0.24 * s, 0.09 * s, 0.42 * s, 2, 0.02 * s), mGold);
      bar.position.set(bx * s, by * s, bz * s);
      g.add(bar);
    }
    noInkTree(g);
    live(g, 'respira', { amp: 0.012, freq: 0.40 });
    return g;
  }

  // Scrivania tattica con laptop ologramma + tazza
  function creaScrivaniaTattica(x, y, z, ry = 0, nome = 'scrivania_tattica') {
    const g = addGrp(x, y, z, nome);
    g.rotation.y = ry;
    const mTop = mat('#334155', 0.55, 0.28, '#1e293b', 0.20);
    const mLeg = mat('#1e293b', 0.60, 0.40, '#0f172a', 0.18);
    const top = new T.Mesh(new RoundedBoxGeometry(1.55, 0.08, 0.78, 2, 0.02), mTop);
    top.position.y = 0.76;
    g.add(top);
    for (const [lx, lz] of [[-0.68, -0.32], [0.68, -0.32], [-0.68, 0.32], [0.68, 0.32]]) {
      const leg = new T.Mesh(new T.BoxGeometry(0.08, 0.74, 0.08), mLeg);
      leg.position.set(lx, 0.37, lz);
      g.add(leg);
    }
    // Laptop tattico acceso
    const lapBase = new T.Mesh(new RoundedBoxGeometry(0.42, 0.025, 0.28, 2, 0.01), mat('#475569', 0.5, 0.4));
    lapBase.position.set(-0.18, 0.81, 0.04);
    const lapScr = new T.Mesh(new RoundedBoxGeometry(0.42, 0.26, 0.02, 2, 0.008), emi('#38bdf8', 0.55));
    lapScr.position.set(-0.18, 0.94, -0.09);
    lapScr.rotation.x = -0.18;
    // Tazza
    const mug = new T.Mesh(new T.CylinderGeometry(0.055, 0.05, 0.12, 12), mat('#facc15', 0.55, 0.1, '#eab308', 0.25));
    mug.position.set(0.38, 0.86, 0.10);
    g.add(lapBase, lapScr, mug);
    noInkTree(g);
    live(lapScr, 'lampeggia', { min: 0.88, freq: 0.36, modo: 'respiro' });
    return g;
  }

  // Cono di luce 3D disattivato (il nostro motore usa PointLight vere, non coni finti)
  function creaCono3D(x, y, z, rBot = 2.4, h = 6.5, col = '#ffd98a', op = 0.12, rx = 0, rz = 0, nome = 'cono_luce') {
    const g = new T.Group();
    g.position.set(x, y, z);
    g.name = nome;
    g.visible = false;
    return g;
  }

  // Lanterna pendente animata con luce vera
  function creaLanterna(x, y, z, col = '#ffcf7a', intens = 2.8, dist = 7, nome = 'lanterna') {
    const g = addGrp(x, y, z, nome);
    const cord = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 0.55, 8), mat('#2d2520', 0.8));
    cord.position.y = -0.27;
    const cap = new T.Mesh(new T.ConeGeometry(0.22, 0.16, 10), mat('#3a302a', 0.6));
    cap.position.y = -0.52;
    const bulb = new T.Mesh(new T.SphereGeometry(0.11, 14, 10), emi(col, 1.3));
    bulb.position.y = -0.64;
    g.add(cord, cap, bulb);
    if (intens > 0) luce(col, intens, x, y - 0.8, z, dist);
    live(g, 'pendola', { amp: 0.048, freq: 0.34, perno: [x, y, z] });
    noInkTree(g);
    return g;
  }

  // Cartello neon Fortnite centrato (usa adattaTesto per buon-senso.md)
  function creaInsegnaNeon(x, y, z, w = 2.6, h = 0.72, ry = 0, testo = 'ITEM SHOP', {
    bg = '#172554', col = '#fde047', bordo = '#38bdf8', em = 0.42, nome = 'insegna_neon'
  } = {}) {
    const g = addGrp(x, y, z, nome);
    g.rotation.y = ry;
    const px = 512, hp = Math.max(64, Math.round(px * h / w));
    const tSign = tex(px, hp, (c, W, H) => {
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.strokeStyle = bordo; c.lineWidth = Math.max(8, Math.min(W, H) * 0.08);
      c.strokeRect(c.lineWidth * 0.5, c.lineWidth * 0.5, W - c.lineWidth, H - c.lineWidth);
      adattaTesto(c, testo, W, H, { colore: col, righe: 1, max: 0.58, margine: 0.16, maiuscolo: true });
    });
    const back = new T.Mesh(new RoundedBoxGeometry(w, h, 0.10, 2, 0.02), mat('#0f172a', 0.6, 0.3));
    const face = new T.Mesh(new T.PlaneGeometry(w * 0.96, h * 0.92), dipinto(tSign, em, 0.86));
    face.position.z = 0.054;
    g.add(back, face);
    noInkTree(g);
    live(g, 'respira', { amp: 0.008, freq: 0.22 });
    return g;
  }

  // Minuteria Fortnite reale e piccola (< 0.36 m) per riempire primo piano e soddisfare ricchezza (>= 5 piccoli!)
  function creaMinuteriaFortnite(x, y, z, tipo = 'mini_scudo', nome = 'piccolo_loot') {
    const g = addGrp(x, y, z, nome);
    if (tipo === 'mini_scudo') {
      const b = new T.Mesh(new T.CylinderGeometry(0.085, 0.095, 0.20, 12), emi('#22d3ee', 0.55));
      b.position.y = 0.10;
      const cap = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 0.06, 10), mat('#92400e', 0.85, 0.05));
      cap.position.y = 0.22;
      g.add(b, cap);
      live(g, 'galleggia', { amp: 0.015, freq: 0.45, gira: 0.14 });
    } else if (tipo === 'lingotto_singolo') {
      const bar = new T.Mesh(new RoundedBoxGeometry(0.18, 0.09, 0.30, 2, 0.02), mat('#fbbf24', 0.68, 0.18, '#d97706', 0.26));
      bar.position.y = 0.045;
      g.add(bar);
      live(g, 'respira', { amp: 0.015, freq: 0.38 });
    } else if (tipo === 'lattina_slurp') {
      const can = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 0.22, 12), mat('#0284c7', 0.45, 0.25, '#38bdf8', 0.35));
      can.position.y = 0.11;
      const band = new T.Mesh(new T.CylinderGeometry(0.083, 0.083, 0.08, 12), emi('#67e8f9', 0.62));
      band.position.y = 0.12;
      g.add(can, band);
      live(g, 'respira', { amp: 0.015, freq: 0.36 });
    } else if (tipo === 'scatola_colpi') {
      const bx = new T.Mesh(new RoundedBoxGeometry(0.26, 0.16, 0.18, 2, 0.02), mat('#4d7c0f', 0.72, 0.15, '#3f6212', 0.24));
      bx.position.y = 0.08;
      const strap = new T.Mesh(new T.BoxGeometry(0.06, 0.17, 0.19), mat('#facc15', 0.5, 0.2, '#eab308', 0.28));
      strap.position.y = 0.085;
      g.add(bx, strap);
      live(g, 'respira', { amp: 0.014, freq: 0.34 });
    } else {
      // 'mini_vbuck'
      const coin = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 0.04, 18), emi('#60a5fa', 0.65));
      coin.rotation.x = Math.PI / 2;
      coin.position.y = 0.16;
      g.add(coin);
      live(g, 'galleggia', { amp: 0.02, freq: 0.46, gira: 0.20 });
    }
    noInkTree(g);
    return g;
  }

  return {
    T, box, luce, std, emi, dipinto, tex,
    mat, smorza, sm, rbox, setStr, addGrp, live, noInkTree,
    texPiastrelle, texPannelloMuro, creaStanzaTattica,
    creaGettone3D, creaForziereFortnite, creaVendingMachine,
    creaRebootVan, creaBattleBus, creaTavoloOlogramma,
    creaBarileSlurp, creaPozioneScudo, creaVBuck3D,
    creaSupplyDrop, creaRastrellieraPicconi, creaCassaMunizioni,
    creaPilaLingotti, creaScrivaniaTattica, creaCono3D, creaLanterna, creaInsegnaNeon,
    creaMinuteriaFortnite
  };
}
