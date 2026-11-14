// Oggetti riusabili in stile cartone «disegnato» per "Ho già mangiato" (derivati da oggetti_zero.js + buon_senso.js).
import { RoundedBoxGeometry } from '/lib/jsm/geometries/RoundedBoxGeometry.js';
import { adattaTesto } from '/web/buon_senso.js';

export function attrezzi(M) {
  const T = M.THREE;
  // Materiali opachi/smorzati per evitare bagliori speculari bianchi sotto le luci (problemi-noti.md §1)
  const mat = (c, e = 0.18, r = 0.78, m = 0) => {
    const x = M.std(c, Math.max(r, 0.58), Math.min(m, 0.15));
    x.emissive.set(c);
    x.emissiveIntensity = e;
    return x;
  };
  const tela = (w, h, fn) => M.tex(w, h, fn);
  const dip = (t, e = 0.22, r = 0.85) => M.dipinto(t, e, r);
  const sm = (w, h, d, m, x, y, z, rad = Math.min(w, h, d) * 0.16, nome = null) => {
    const rr = Math.max(0.004, Math.min(rad, Math.min(w, h, d) / 2 - 0.001));
    const o = new T.Mesh(new RoundedBoxGeometry(w, h, d, 3, rr), m);
    o.position.set(x, y, z);
    o.castShadow = Math.max(w, h, d) >= 0.16;
    o.receiveShadow = true;
    if (nome) o.name = nome;
    M.root.add(o);
    return o;
  };
  const cil = (rt, rb, h, m, x, y, z, seg = 24, nome = null) => {
    const o = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), m);
    o.position.set(x, y, z);
    o.castShadow = Math.max(rt * 2, rb * 2, h) >= 0.16;
    o.receiveShadow = true;
    if (nome) o.name = nome;
    M.root.add(o);
    return o;
  };
  const grp = (x = 0, y = 0, z = 0, ry = 0, nome = null) => {
    const g = new T.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    if (nome) g.name = nome;
    M.root.add(g);
    return g;
  };
  const into = (g, o) => { g.add(o); return o; };
  const scritta = (testo, w, h, { fondo = '#233b2e', colore = '#f2d27a', bordo = '#3a2a2e', px = 512, righe = 2, font = '900' } = {}) =>
    tela(px, Math.max(48, Math.round(px * h / w)), (g, W, H) => {
      g.fillStyle = fondo; g.fillRect(0, 0, W, H);
      g.strokeStyle = bordo; g.lineWidth = Math.max(4, H * 0.07);
      g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, H - g.lineWidth);
      adattaTesto(g, testo, W, H, { colore, righe, font, margine: 0.13 });
    });
  const insegna = (testo, w, h, x, y, z, ry = 0, opt = {}) => {
    const g = grp(x, y, z, ry, 'insegna_' + testo);
    into(g, sm(w + 0.08, h + 0.08, 0.08, mat(opt.bordo || '#3a2a2e', 0.12), 0, 0, 0, 0.03));
    const f = new T.Mesh(new T.PlaneGeometry(w, h), dip(scritta(testo, w, h, opt), opt.luce ?? 0.30));
    f.position.z = 0.045;
    f.userData.scritta = 1;
    g.add(f);
    return g;
  };
  return { T, mat, tela, dip, sm, cil, grp, into, scritta, insegna };
}

export function formaFormaggio(M, { x = 0, y = 0, z = 0, ry = 0, s = 1, aperta = false, scritta = true, nome = 'forma_parmigiano' } = {}) {
  const { T, dip, tela } = attrezzi(M), R = 0.22 * s, H = 0.12 * s, g = new T.Group();
  g.position.set(x, y, z); g.rotation.y = ry; g.name = nome; g.userData.forma = true; M.root.add(g);
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const a = i / 12, yy = (a - 0.5) * H, bomb = Math.sin(a * Math.PI) * R * 0.06, sm = 1 - Math.pow(Math.abs(a - 0.5) * 2, 6) * 0.06;
    pts.push(new T.Vector2(R * sm + bomb, yy));
  }
  const crosta = tela(512, 128, (c, W, Hh) => {
    const q = c.createLinearGradient(0, 0, 0, Hh);
    q.addColorStop(0, '#e6c27e'); q.addColorStop(0.5, '#eecf8c'); q.addColorStop(1, '#d8b06a');
    c.fillStyle = q; c.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 40; i++) {
      c.fillStyle = `rgba(150,90,30,${0.05 + (i % 4) * 0.015})`;
      c.beginPath(); c.ellipse((i * 97) % W, (i * 41) % Hh, 12 + (i % 6) * 4, 4 + (i % 3), 0, 0, 7); c.fill();
    }
    if (scritta) {
      c.fillStyle = 'rgba(110,55,18,0.82)';
      const txt = 'PARMIGIANO  •  REGGIANO  •  ';
      c.font = `900 ${Hh * 0.34}px sans-serif`; c.textBaseline = 'middle';
      c.fillText(txt, 14, Hh * 0.5);
      c.fillText(txt, 14 + c.measureText(txt).width, Hh * 0.5);
    }
    c.strokeStyle = 'rgba(110,60,20,0.35)'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(0, 6); c.lineTo(W, 6); c.moveTo(0, Hh - 6); c.lineTo(W, Hh - 6); c.stroke();
  });
  crosta.wrapS = T.RepeatWrapping;
  const fianco = new T.Mesh(new T.LatheGeometry(pts, 40), dip(crosta, 0.22, 0.8));
  fianco.castShadow = fianco.receiveShadow = true;
  g.add(fianco);
  const faccia = tela(256, 256, (c, W, Hh) => {
    c.fillStyle = '#f0d89e'; c.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 24; i++) {
      c.fillStyle = `rgba(170,110,40,${0.05 + (i % 4) * 0.015})`;
      c.beginPath(); c.arc((i * 71) % W, (i * 113) % Hh, 8 + (i % 5) * 5, 0, 7); c.fill();
    }
    c.strokeStyle = 'rgba(150,90,30,0.4)'; c.lineWidth = 6;
    c.beginPath(); c.arc(W / 2, Hh / 2, W * 0.45, 0, 7); c.stroke();
  });
  for (const sg of [1, -1]) {
    const f = new T.Mesh(aperta ? new T.CircleGeometry(pts[sg > 0 ? 12 : 0].x * 0.999, 40, -Math.PI / 2, Math.PI * 1.5) : new T.CircleGeometry(pts[sg > 0 ? 12 : 0].x * 0.999, 40), dip(faccia, 0.22));
    if (sg < 0) f.material.side = T.DoubleSide;
    f.rotation.x = -sg * Math.PI / 2; f.position.y = sg * H / 2; f.receiveShadow = true;
    g.add(f);
  }
  if (aperta) {
    g.remove(fianco);
    const q = new T.Mesh(new T.LatheGeometry(pts, 40, 0, Math.PI * 1.5), fianco.material);
    q.castShadow = true; g.add(q);
    const pasta = tela(256, 256, (c, W, Hh) => {
      c.fillStyle = '#f2d68e'; c.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 90; i++) {
        const a = (i * 0.618) % 1, b = (i * 0.377) % 1;
        c.fillStyle = i % 7 ? 'rgba(200,140,60,0.12)' : 'rgba(246,240,220,0.85)';
        c.beginPath(); c.arc(a * W, b * Hh, 4 + (i % 3), 0, 7); c.fill();
      }
    });
    for (const [px, pz, ryy] of [[0, R / 2, Math.PI / 2], [-R / 2, 0, 0]]) {
      const p = new T.Mesh(new T.PlaneGeometry(R, H), dip(pasta, 0.24));
      p.position.set(px, 0, pz); p.rotation.y = ryy; p.material.side = T.DoubleSide; g.add(p);
    }
  }
  return g;
}

export function pianta(M, { x = 0, y = 0, z = 0, s = 1, vaso = '#c0603a', foglie = '#4f9a3c', nome = 'pianta_vaso' } = {}) {
  const { T, mat, cil } = attrezzi(M), g = new T.Group();
  g.position.set(x, y, z); g.name = nome; M.root.add(g);
  g.add(cil(0.2 * s, 0.15 * s, 0.38 * s, mat(vaso, 0.16, 0.8), 0, 0.19 * s, 0, 18));
  const f = new T.Group(); f.position.y = 0.38 * s; g.add(f);
  const fm = mat(foglie, 0.2, 0.9), fm2 = mat('#6fb84a', 0.2, 0.9);
  for (let i = 0; i < 7; i++) {
    const b = new T.Mesh(new T.SphereGeometry((0.15 + (i % 3) * 0.035) * s, 12, 9), i % 2 ? fm : fm2);
    b.position.set(Math.sin(i * 2.4) * 0.12 * s, (0.14 + (i % 4) * 0.11) * s, Math.cos(i * 2.4) * 0.12 * s);
    b.scale.y = 1.3; b.castShadow = s >= 0.8; f.add(b);
  }
  g.userData.vivo = 'pianta';
  M.vita?.aggiungi(f, 'ondeggia', { amp: 0.04, freq: 0.35, seme: x + z });
  return g;
}

export function geraniVaso(M, { x = 0, y = 0, z = 0, ry = 0, w = 0.55, s = 1, nome = 'fioriera_gerani' } = {}) {
  const { T, mat, sm } = attrezzi(M), g = new T.Group();
  g.position.set(x, y, z); g.rotation.y = ry; g.name = nome; M.root.add(g);
  const box = sm(w * s, 0.18 * s, 0.22 * s, mat('#b85d3c', 0.16, 0.85), 0, 0.09 * s, 0, 0.02);
  g.add(box);
  const f = new T.Group(); f.position.y = 0.19 * s; g.add(f);
  const fog = mat('#3e7e3e', 0.2, 0.9), fior = mat('#d63842', 0.26, 0.82), fior2 = mat('#e85a68', 0.26, 0.82);
  for (let i = 0; i < 6; i++) {
    const lx = ((i / 5) - 0.5) * w * 0.78 * s;
    const lv = new T.Mesh(new T.SphereGeometry(0.09 * s, 10, 8), fog);
    lv.position.set(lx, 0.04 * s, (i % 2 ? 0.03 : -0.03) * s); lv.castShadow = false; f.add(lv);
    const fl = new T.Mesh(new T.SphereGeometry(0.055 * s, 8, 6), i % 2 ? fior : fior2);
    fl.position.set(lx + 0.02 * s, 0.11 * s + (i % 2) * 0.03 * s, (i % 2 ? -0.02 : 0.03) * s); fl.castShadow = false; f.add(fl);
  }
  g.userData.vivo = 'gerani';
  M.vita?.aggiungi(f, 'ondeggia', { amp: 0.035, freq: 0.38, seme: x + y });
  return g;
}

export function sedia(M, { x = 0, z = 0, ry = 0, legno = '#7a4e2d', paglia = '#d4b878', nome = 'sedia' } = {}) {
  const { T, mat, sm, cil } = attrezzi(M), g = new T.Group();
  g.position.set(x, 0, z); g.rotation.y = ry; g.name = nome; M.root.add(g);
  const mL = mat(legno, 0.14, 0.8), mP = mat(paglia, 0.16, 0.88);
  g.add(sm(0.42, 0.05, 0.42, mP, 0, 0.45, 0, 0.015));
  for (const [sx, sz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) {
    const gm = cil(0.024, 0.02, 0.44, mL, sx, 0.22, sz, 8); gm.castShadow = false; g.add(gm);
  }
  for (const sx of [-0.17, 0.17]) {
    const sp = cil(0.024, 0.024, 0.48, mL, sx, 0.70, -0.17, 8); sp.castShadow = false; g.add(sp);
  }
  g.add(sm(0.38, 0.11, 0.035, mL, 0, 0.86, -0.17, 0.01));
  g.add(sm(0.34, 0.06, 0.03, mL, 0, 0.66, -0.17, 0.01));
  return g;
}

export function quadroDipinto(M, { x = 0, y = 1.65, z = 0, ry = 0, w = 0.62, h = 0.48, cornice = '#6e4628', fondo = '#e8dcc0', motivo = 'paesaggio', nome = 'quadro' } = {}) {
  const { T, mat, tela, dip, sm } = attrezzi(M), g = new T.Group();
  g.position.set(x, y, z); g.rotation.y = ry; g.name = nome; M.root.add(g);
  g.add(sm(w + 0.07, h + 0.07, 0.04, mat(cornice, 0.14, 0.78), 0, 0, 0, 0.015));
  const tx = tela(256, 200, (c, W, H) => {
    c.fillStyle = fondo; c.fillRect(0, 0, W, H);
    if (motivo === 'paesaggio') {
      c.fillStyle = '#92b4d8'; c.fillRect(10, 10, W - 20, H * 0.52);
      c.fillStyle = '#7ea45c'; c.beginPath(); c.ellipse(W * 0.35, H * 0.78, W * 0.5, H * 0.28, 0, 0, 7); c.fill();
      c.fillStyle = '#5c8442'; c.beginPath(); c.ellipse(W * 0.75, H * 0.82, W * 0.4, H * 0.25, 0, 0, 7); c.fill();
      c.fillStyle = '#d87a4a'; c.fillRect(W * 0.42, H * 0.48, W * 0.16, H * 0.18);
    } else if (motivo === 'famiglia') {
      c.fillStyle = '#c9a67a'; c.fillRect(14, 14, W - 28, H - 28);
      for (const [px, pr, col] of [[W * 0.36, 26, '#e8c4a4'], [W * 0.64, 24, '#e4bc9c']]) {
        c.fillStyle = '#3a4a6a'; c.beginPath(); c.ellipse(px, H * 0.84, 34, 42, 0, 0, 7); c.fill();
        c.fillStyle = col; c.beginPath(); c.arc(px, H * 0.42, pr, 0, 7); c.fill();
      }
    } else {
      c.fillStyle = '#d4aa62'; c.beginPath(); c.arc(W / 2, H / 2, Math.min(W, H) * 0.28, 0, 7); c.fill();
      c.fillStyle = '#b4483a'; c.beginPath(); c.arc(W / 2, H / 2, Math.min(W, H) * 0.16, 0, 7); c.fill();
    }
  });
  const p = new T.Mesh(new T.PlaneGeometry(w, h), dip(tx, 0.24, 0.88));
  p.position.z = 0.022; g.add(p);
  return g;
}

export function lampadaPendente(M, { x = 0, y = 2.55, z = 0, corda = 0.55, paralume = '#4a7a5c', luceCol = '#ffe2b0', intensita = 5.5, raggio = 10, oscilla = true, nome = 'lampada_sospesa' } = {}) {
  const { T, mat, cil } = attrezzi(M), g = new T.Group();
  g.position.set(x, y + corda, z); g.name = nome; M.root.add(g);
  const filo = cil(0.012, 0.012, corda, mat('#2c2832', 0.1, 0.8), 0, -corda / 2, 0, 8);
  filo.castShadow = false; g.add(filo);
  const dome = new T.Mesh(new T.ConeGeometry(0.28, 0.16, 18, 1, false), mat(paralume, 0.24, 0.72));
  dome.position.y = -corda; dome.castShadow = false; g.add(dome);
  const bulb = new T.Mesh(new T.SphereGeometry(0.085, 12, 10), M.emi('#fff0c8', 0.92));
  bulb.position.y = -corda - 0.06; bulb.castShadow = false; g.add(bulb);
  /* Luce vera SOTTO il paralume (problemi-noti.md §1) */
  M.luce(luceCol, intensita, x, y - 0.16, z, raggio);
  if (oscilla) {
    g.userData.vivo = 'lampada';
    M.vita?.aggiungi(g, 'pendola', { amp: 0.016, freq: 0.32, seme: x + z });
  }
  return g;
}

export function lampioneStrada(M, { x = 0, z = 0, h = 4.2, lato = 1, luceCol = '#ffd488', intensita = 4.8, raggio = 9.5, braccio = 0.45, nome = 'lampione' } = {}) {
  const { T, mat, cil, sm } = attrezzi(M), g = new T.Group();
  g.position.set(x, 0, z); g.name = nome; M.root.add(g);
  const ferro = mat('#2a2e38', 0.12, 0.65);
  const palo = cil(0.055, 0.085, h, ferro, 0, h / 2, 0, 10); palo.castShadow = false; g.add(palo);
  g.add(sm(0.24, 0.05, 0.24, ferro, 0, 0.15, 0, 0.02));
  const arm = sm(braccio, 0.05, 0.05, ferro, lato * braccio / 2, h - 0.05, 0, 0.015); arm.castShadow = false; g.add(arm);
  const capp = cil(0.06, 0.22, 0.14, ferro, lato * braccio, h + 0.04, 0, 8); capp.castShadow = false; g.add(capp);
  const vetro = new T.Mesh(new T.CylinderGeometry(0.14, 0.10, 0.24, 8), M.emi(luceCol, 0.88));
  vetro.position.set(lato * braccio, h - 0.14, 0); vetro.castShadow = false; g.add(vetro);
  g.userData.vivo = 'lampione';
  M.vita?.aggiungi(vetro, 'lampeggia', { min: 0.86, freq: 0.28, modo: 'respiro', seme: z });
  M.luce(luceCol, intensita, x + lato * braccio, h - 0.32, z, raggio);
  return g;
}

export function bici(M, { x = 0, y = 0, z = 0, ry = 0, incline = 0.08, colore = '#c8343a', nome = 'bici' } = {}) {
  const { T, mat, sm } = attrezzi(M), b = new T.Group();
  b.position.set(x, y, z); b.rotation.y = ry; b.rotation.z = incline; b.name = nome; M.root.add(b);
  const tel = mat(colore, 0.22, 0.62), gom = mat('#2a2630', 0.12, 0.85);
  for (const sz of [-0.46, 0.46]) {
    const r = new T.Mesh(new T.TorusGeometry(0.30, 0.028, 8, 20), gom);
    r.position.set(0, 0.32, sz); r.rotation.y = Math.PI / 2; r.castShadow = false; b.add(r);
  }
  const asta = (a, c) => {
    const A = new T.Vector3(...a), C = new T.Vector3(...c);
    const m = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, A.distanceTo(C), 6), tel);
    m.position.copy(A).add(C).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), C.clone().sub(A).normalize());
    m.castShadow = false; b.add(m);
  };
  asta([0, 0.32, -0.46], [0, 0.62, -0.05]);
  asta([0, 0.62, -0.05], [0, 0.32, 0.46]);
  asta([0, 0.32, -0.46], [0, 0.76, 0.36]);
  asta([0, 0.62, -0.05], [0, 0.90, -0.10]);
  asta([0, 0.32, 0.46], [0, 0.90, 0.40]);
  b.add(sm(0.12, 0.05, 0.24, gom, 0, 0.92, -0.10, 0.02));
  b.add(sm(0.46, 0.04, 0.04, gom, 0, 0.91, 0.40, 0.015));
  b.add(sm(0.30, 0.18, 0.24, mat('#c9a06a', 0.20), 0, 0.82, 0.56, 0.03));
  return b;
}

export function piccioni(M, { x = 0, z = 0, n = 6, volo = false, y = 0, r = 2, nome = 'piccioni' } = {}) {
  const { T, mat } = attrezzi(M), out = [];
  const grigio = mat('#7c7e96', 0.2, 0.8), collo = mat('#5c6c80', 0.2, 0.8), zampe = mat('#d0603a', 0.2);
  for (let i = 0; i < n; i++) {
    const g = new T.Group();
    const a = i * 2.39, d = r * (0.3 + ((i * 0.61) % 1) * 0.7);
    g.position.set(x + Math.cos(a) * d, y, z + Math.sin(a) * d);
    g.rotation.y = a * 1.7; g.name = `${nome}_${i}`; M.root.add(g);
    const corpo = new T.Mesh(new T.SphereGeometry(0.09, 10, 8), grigio);
    corpo.scale.set(1, 0.8, 1.5); corpo.position.y = 0.12; corpo.castShadow = false; g.add(corpo);
    const testa = new T.Mesh(new T.SphereGeometry(0.05, 8, 8), collo);
    testa.position.set(0, 0.2, 0.11); g.add(testa);
    const becco = new T.Mesh(new T.ConeGeometry(0.015, 0.04, 6), zampe);
    becco.rotation.x = Math.PI / 2; becco.position.set(0, 0.2, 0.17); g.add(becco);
    if (volo) {
      for (const sx of [-1, 1]) {
        const ala = new T.Mesh(new T.BoxGeometry(0.2, 0.01, 0.1), grigio);
        ala.geometry.translate(sx * 0.1, 0, 0); ala.position.set(sx * 0.05, 0.14, 0); ala.castShadow = false; g.add(ala);
        M.vita?.aggiungi(ala, 'pendola', { asse: 'z', amp: 0.7, freq: 3 + (i % 3) * 0.4, seme: i, vento: 0 });
      }
      M.vita?.aggiungi(g, 'passa', { da: [g.position.x - 18, y + (i % 3), g.position.z], a: [g.position.x + 18, y + 2 + (i % 2), g.position.z - 6], dur: 18 + i, pausa: 0, seme: i });
    } else {
      M.vita?.aggiungi(testa, 'pendola', { asse: 'x', amp: 0.35, freq: 1.1 + (i % 4) * 0.3, seme: i, vento: 0 });
      M.vita?.aggiungi(g, 'galleggia', { amp: 0.004, freq: 0.6, seme: i, gira: 0.6 });
    }
    out.push(g);
  }
  return out;
}

export function bandiera(M, { x = 0, y = 4, z = 0, ry = 0, colori = ['#2f8f4e', '#e8e2d2', '#c8343a'], l = 1.2, h = 0.8, asta = 2.0, nome = 'bandiera' } = {}) {
  const { T, mat, cil } = attrezzi(M), g = new T.Group();
  g.position.set(x, y, z); g.rotation.y = ry; g.name = nome; M.root.add(g);
  const a = cil(0.025, 0.025, asta, mat('#c8c0b0', 0.2, 0.6), 0, 0, 0, 8);
  a.castShadow = false; a.rotation.z = -0.5; a.position.set(asta * 0.24, asta * 0.43, 0); g.add(a);
  const t = M.tex(256, 170, (c, W, H) => {
    colori.forEach((k, i) => { c.fillStyle = k; c.fillRect(i * W / colori.length, 0, W / colori.length + 1, H); });
    c.strokeStyle = 'rgba(40,30,40,.25)'; c.lineWidth = 3; c.strokeRect(1, 1, W - 2, H - 2);
  });
  const geo = new T.PlaneGeometry(l, h, 10, 4); geo.translate(l / 2, -h / 2, 0);
  const telo = new T.Mesh(geo, M.dipinto(t, 0.28, 0.9));
  telo.material.side = T.DoubleSide; telo.position.set(asta * 0.48, asta * 0.86, 0); telo.castShadow = false; g.add(telo);
  const p = geo.attributes.position, p0 = p.array.slice(), fase = (x * 13 + z * 7) % 6;
  M.tick = M.tick || [];
  M.tick.push(tt => {
    for (let i = 0; i < p.count; i++) {
      const px = p0[i * 3];
      p.array[i * 3 + 2] = Math.sin(px * 4 - tt * 4 + fase) * 0.07 * px / l;
      p.array[i * 3 + 1] = p0[i * 3 + 1] + Math.sin(px * 3 - tt * 3.2 + fase) * 0.025 * px / l;
    }
    p.needsUpdate = true; geo.computeVertexNormals();
  });
  g.userData.vivo = 'bandiera';
  return g;
}

export const TIPI_PAESE = ['nonna', 'nonno', 'signora', 'ragazza', 'ragazzo', 'barista', 'impiegato', 'ragazzina'];
export function comparsa(M, x, z, ry = 0, tipi = TIPI_PAESE, extra = {}) {
  const k = Math.abs(Math.round(x * 37 + z * 91 + (extra.seme || 0) * 13));
  const tipo = [].concat(tipi)[k % [].concat(tipi).length];
  const m = M.omino({ ...M.personalita(k), faccia: ['neutro', 'felice', 'contento', 'pensieroso'][k % 4], posa: 'auto', ...extra, tipoRick: tipo }, x, z, ry);
  m.name = extra.nome || `comparsa_${Math.round(x)}_${Math.round(z)}`;
  if (!m.userData.cammina) {
    m.userData.vivo = 'comparsa';
    M.vita?.aggiungi(m, 'respira', { amp: 0.012, freq: 0.28 + (k % 5) * 0.03, seme: k });
  }
  return m;
}

export function smorza(o, max = 0.85) {
  o?.traverse(m => {
    if (m.isPointLight || m.isSpotLight) m.intensity = Math.min(m.intensity, 2.5);
    if (!m.isMesh) return;
    for (const x of [].concat(m.material)) {
      if (!x) continue;
      if ('roughness' in x) x.roughness = Math.max(x.roughness, 0.62);
      if ('metalness' in x) x.metalness = Math.min(x.metalness, 0.14);
      if ('specularIntensity' in x) x.specularIntensity = 0.25;
      if (x.emissive && x.emissiveIntensity > max) x.emissiveIntensity = max;
      if (x.isMeshBasicMaterial && x.color) {
        const k = Math.max(x.color.r, x.color.g, x.color.b);
        if (k > max) x.color.multiplyScalar(max / k);
      }
    }
  });
  return o;
}

/**
 * Teglia rettangolare da forno con lasagna gratinata, manici laterali e vapore morbido.
 * Progettata per essere portata a due mani dai personaggi (manici a x = ±0.34 * s, davanti verso +Z).
 */
export function tegliaLasagna(M, { x = 0, y = 0, z = 0, ry = 0, s = 1, nome = 'teglia_lasagna', seme = 0 } = {}) {
  const { T, mat, tela, dip, sm, grp, into } = attrezzi(M);
  const g = grp(x, y, z, ry, nome);
  const w = 0.64 * s, h = 0.088 * s, d = 0.34 * s;
  const acciaio = mat('#aab4c0', 0.28, 0.58, 0.14);
  const acciaioScuro = mat('#5c6674', 0.20, 0.62, 0.12);

  // Vasca e bordo rialzato in acciaio
  into(g, sm(w, h, d, acciaio, 0, 0.022 * s, 0, 0.016 * s));
  into(g, sm(w + 0.028 * s, 0.020 * s, d + 0.028 * s, acciaioScuro, 0, 0.056 * s, 0, 0.008 * s));

  // Manici laterali sinistro/destro dove si agganciano le mani
  for (const sx of [-1, 1]) {
    const hx = sx * (w * 0.5 + 0.022 * s);
    const barra = sm(0.038 * s, 0.018 * s, 0.15 * s, acciaioScuro, hx, 0.052 * s, 0, 0.006 * s);
    barra.castShadow = false;
    into(g, barra);
    for (const sz of [-0.058 * s, 0.058 * s]) {
      const br = sm(0.028 * s, 0.016 * s, 0.018 * s, acciaioScuro, sx * (w * 0.5 + 0.006 * s), 0.052 * s, sz, 0.004 * s);
      br.castShadow = false;
      into(g, br);
    }
  }

  // Lasagna dipinta (ragù, besciamella e crosta dorata ben leggibile anche di sera)
  const texLasagna = tela(256, 256, (c, W, H) => {
    c.fillStyle = '#cf4824';
    c.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) {
      const a = (i * 73 + seme * 41) % 256;
      const b = (i * 137 + seme * 29) % 256;
      c.fillStyle = i % 3 === 0 ? '#f3dea8' : (i % 3 === 1 ? '#e6a546' : '#a83118');
      c.beginPath();
      c.ellipse(a, b, 24 + (i % 4) * 8, 16 + (i % 3) * 7, (i * 0.6) % Math.PI, 0, Math.PI * 2);
      c.fill();
    }
    for (let i = 0; i < 24; i++) {
      const cx = (i * 97 + seme * 53 + 17) % (W - 16) + 8;
      const cy = (i * 61 + seme * 37 + 11) % (H - 16) + 8;
      c.fillStyle = i % 4 === 0 ? '#326d2c' : '#6f2912';
      c.beginPath();
      c.ellipse(cx, cy, i % 4 === 0 ? 7 : 5, 4, i * 0.8, 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = '#6f2912';
    c.lineWidth = 14;
    c.strokeRect(7, 7, W - 14, H - 14);
  });
  const ripieno = sm(w - 0.044 * s, 0.024 * s, d - 0.044 * s, dip(texLasagna, 0.34, 0.78), 0, 0.062 * s, 0, 0.008 * s);
  ripieno.castShadow = false;
  into(g, ripieno);

  // Vapore caldo a sprite morbidi (niente sfere solide contornate davanti al busto)
  if (!M._vaporeTegliaTex) {
    M._vaporeTegliaTex = tela(64, 64, (c) => {
      const r = c.createRadialGradient(32, 32, 2, 32, 32, 31);
      r.addColorStop(0, 'rgba(255, 246, 228, 0.85)');
      r.addColorStop(1, 'rgba(255, 246, 228, 0)');
      c.fillStyle = r;
      c.fillRect(0, 0, 64, 64);
    });
  }
  const sbuffi = [];
  for (let i = 0; i < 4; i++) {
    const sp = new T.Sprite(new T.SpriteMaterial({
      map: M._vaporeTegliaTex, color: '#fff3dc', transparent: true, depthWrite: false, opacity: 0.18, fog: false,
    }));
    into(g, sp);
    sbuffi.push(sp);
  }
  M.tick = M.tick || [];
  M.tick.push(t => {
    if (!g.visible) return;
    for (let i = 0; i < sbuffi.length; i++) {
      const u = ((t * 0.48 + i / sbuffi.length + seme * 0.17) % 1 + 1) % 1;
      const sp = sbuffi[i];
      sp.position.set(((i - 1.5) * 0.09 + Math.sin(t * 1.4 + i) * 0.03) * s, (0.10 + u * 0.34) * s, Math.cos(t * 1.1 + i) * 0.025 * s);
      sp.scale.setScalar((0.09 + 0.17 * u) * s);
      sp.material.opacity = 0.22 * Math.sin(Math.PI * u) * (1 - 0.35 * u);
    }
  });

  g.userData.vivo = nome;
  smorza(g, 0.82);
  return g;
}
