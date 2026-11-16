// MOTORE «MONDO VIVO» del look disegnato: tutto ciò che è inquadrato si muove, come nel reference (paxinko_the_window.mp4):
// porte automatiche che scorrono quando arriva qualcuno (e la luce si allarga sul pavimento), lampeggianti che girano,
// ventole, ruote e palloni che ruotano, lanterne e insegne che oscillano, piante mosse dall'aria, schermi che scorrono,
// palline che cadono, auto che passano, comparse che respirano. Regole: references/mondo-vivo.md.
//
// Ogni comportamento è una funzione PURA del tempo t (stesso fotogramma = stessa immagine, anche in anteprima e a salti):
// niente stato accumulato, niente Math.random. La fase di ogni oggetto viene dal suo ordine di registrazione (seme fisso).
// Niente sfarfallio: le luci pulsano in modo morbido e solo SOTTO il valore di partenza (mai sopra la soglia del bagliore).
//
// Uso:  const V = creaVita(M);  V.aggiungi(oggetto, 'gira', { asse: 'y', vel: 0.5 });  ogni fotogramma: V.tick(t, { attori })
// Nei GLB di Blender basta il nome del nodo: VIVO_gira_y_0.5, VIVO_pendola, PORTA_L / PORTA_R, ventola, ruota, lanterna… (V.auto)
import { THREE } from '/web/look_disegnato.js';

const TAU = Math.PI * 2, cl = x => Math.min(1, Math.max(0, x)), ss = x => x * x * (3 - 2 * x), ss5 = x => x * x * x * (x * (x * 6 - 15) + 10);
const ASSE = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
// rumore morbido deterministico (somma di seni incommensurabili): per vento, respiro, piccoli tremolii
const morbido = (t, f, s) => (Math.sin(t * f * TAU + s) * 0.6 + Math.sin(t * f * 2.31 * TAU + s * 1.7) * 0.28 + Math.sin(t * f * 4.13 * TAU + s * 2.9) * 0.12);

export function creaVita(M) {
  const L = [], EV = [], pend = [];   // L: voci vive; EV: eventi della storia (apri/chiudi/avvia/ferma); pend: voci in attesa di un id
  let n = 0;
  const V = { voci: L };

  // ---- perno: rimette l'oggetto dentro un gruppo con l'origine nel punto giusto (alto per le lanterne, basso per le piante, cerniera per le porte)
  function perno(o, dove = 'centro') {
    if (dove === 'centro' || !o.parent) return o;
    o.updateWorldMatrix(true, true); const b = new THREE.Box3().setFromObject(o); if (b.isEmpty()) return o;
    const c = b.getCenter(new THREE.Vector3()), p = new THREE.Vector3(c.x, dove === 'alto' ? b.max.y : dove === 'basso' ? b.min.y : c.y, c.z);
    if (Array.isArray(dove)) p.set(...dove);
    const g = new THREE.Group(), par = o.parent; par.updateWorldMatrix(true, false); g.position.copy(par.worldToLocal(p.clone())); par.add(g); g.attach(o); g.name = 'perno_' + (o.name || ''); g.userData.vivoFiglio = o; return g; }

  // ---- materiali: lampeggiare senza toccare gli altri oggetti che condividono lo stesso materiale
  function materiali(o) { const out = []; o.traverse(m => { if (!m.isMesh) return;
      const cl1 = x => { const y = x.clone(); y.userData.base = { e: y.emissiveIntensity ?? 1, c: y.color ? y.color.clone() : null }; return y; };
      m.material = Array.isArray(m.material) ? m.material.map(cl1) : cl1(m.material); [].concat(m.material).forEach(x => out.push(x)); }); return out; }
  const forza = (mats, k) => { for (const m of mats) { const b = m.userData.base; if (m.emissive && b.e !== undefined && m.type !== 'MeshBasicMaterial') m.emissiveIntensity = b.e * k; else if (b.c) m.color.copy(b.c).multiplyScalar(k); } };

  // ---- catalogo dei comportamenti. Ognuno: prepara(o, opt) → fn(t, ctx) che mette l'oggetto nello stato del tempo t
  const C = {
    // gira su se stesso: ventole, ruote, palloni, insegne rotanti, rulli. vel in giri al secondo (negativo = verso opposto)
    gira: (o, { asse = 'y', vel = 0.5, fase }) => { const q0 = o.quaternion.clone(), ax = ASSE[asse] || new THREE.Vector3(...asse), q = new THREE.Quaternion();
      return t => o.quaternion.copy(q0).multiply(q.setFromAxisAngle(ax, (fase ?? 0) + t * vel * TAU)); },
    // oscilla appeso o piantato: lanterne, insegne appese, cartelli, code di gatto. amp in radianti, freq in Hz
    pendola: (o, { asse = 'z', amp = 0.07, freq = 0.4, seme = 0, vento = 0.35 }) => { const r0 = o.rotation[asse];
      return t => { o.rotation[asse] = r0 + amp * (Math.sin(t * freq * TAU + seme) * (1 - vento) + morbido(t, freq * 0.7, seme * 3) * vento); }; },
    // piante, erba, tende: si piegano dalla base con il vento (due assi, morbido)
    ondeggia: (o, { amp = 0.05, freq = 0.3, seme = 0 }) => { const rx = o.rotation.x, rz = o.rotation.z;
      return t => { o.rotation.z = rz + amp * morbido(t, freq, seme); o.rotation.x = rx + amp * 0.6 * morbido(t, freq * 0.8, seme + 5); }; },
    // respiro: comparse ferme, sacchi, cuscini. Si allunga di poco in altezza e torna (base ferma a terra)
    respira: (o, { amp = 0.012, freq = 0.28, seme = 0 }) => { const s = o.scale.clone();
      return t => { const k = Math.sin(t * freq * TAU + seme); o.scale.set(s.x * (1 - k * amp * 0.4), s.y * (1 + k * amp), s.z); }; },
    // galleggia: palloncini, insegne leggere, oggetti magici (su e giù con un filo di rotazione)
    galleggia: (o, { amp = 0.05, freq = 0.35, seme = 0, gira: g = 0.04 }) => { const y = o.position.y, ry = o.rotation.y;
      return t => { o.position.y = y + amp * Math.sin(t * freq * TAU + seme); o.rotation.y = ry + g * Math.sin(t * freq * 0.5 * TAU + seme); }; },
    // vibra: condizionatori, frigoriferi, motori accesi (piccolissimo, mai a scatti)
    vibra: (o, { amp = 0.004, freq = 7, seme = 0 }) => { const p = o.position.clone();
      return t => { o.position.set(p.x + amp * Math.sin(t * freq * TAU + seme), p.y + amp * 0.6 * Math.sin(t * freq * 1.37 * TAU + seme * 2), p.z); }; },
    // rimbalza: palloni, palline, oggetti comici. Si schiaccia quando tocca terra e si allunga in salita
    rimbalza: (o, { alt = 0.35, freq = 1.2, schiaccia = 0.18, seme = 0 }) => { const y = o.position.y, s = o.scale.clone();
      return t => { const u = ((t * freq + seme / TAU) % 1 + 1) % 1, h = 4 * u * (1 - u), sq = Math.max(0, 1 - h * 6) * schiaccia, st = h > 0.3 ? (1 - h) * schiaccia * 0.6 : 0;
        o.position.y = y + alt * h; o.scale.set(s.x * (1 + sq - st * 0.5), s.y * (1 - sq + st), s.z * (1 + sq - st * 0.5)); }; },
    // rotola lungo un percorso [[x, z], …] alla velocità vel (m/s), girando del giusto angolo (distanza / raggio). loop o una volta da `t0`
    rotola: (o, { percorso, vel = 1.2, r, loop = true, t0 = 0, salta = 0 }) => {
      const P = percorso.map(([x, z]) => new THREE.Vector2(x, z)), segs = []; let tot = 0; for (let i = 0; i < P.length - 1; i++) { const d = P[i].distanceTo(P[i + 1]); segs.push([tot, d, i]); tot += d; }
      if (!r) { const b = new THREE.Box3().setFromObject(o); r = Math.max(0.03, (b.max.y - b.min.y) / 2); }
      const y0 = o.position.y, q0 = o.quaternion.clone(), q = new THREE.Quaternion(), ax = new THREE.Vector3();
      return t => { let s = Math.max(0, (t - t0) * vel); s = loop ? s % tot : Math.min(s, tot); let sg = segs[segs.length - 1]; for (const x of segs) if (s <= x[0] + x[1]) { sg = x; break; }
        const u = (s - sg[0]) / sg[1], A = P[sg[2]], B = P[sg[2] + 1], dx = B.x - A.x, dz = B.y - A.y, d = Math.hypot(dx, dz) || 1;
        o.position.set(A.x + dx * u, y0 + (salta ? salta * Math.abs(Math.sin(s / (r * Math.PI) * 0.5 * Math.PI)) : 0), A.y + dz * u);
        ax.set(dz / d, 0, -dx / d); o.quaternion.copy(q.setFromAxisAngle(ax, s / r)).multiply(q0); }; },
    // va e viene / passa: auto, biciclette, carrelli. Da `da` ad `a` (x, y, z) in `dur` s, poi ricomincia dopo `pausa`. `ruote`: nomi o oggetti che girano
    passa: (o, { da, a, dur = 6, pausa = 2, seme = 0, ruote, r = 0.35, avantiEindietro = false }) => {
      const A = new THREE.Vector3(...(da || o.position.toArray())), B = new THREE.Vector3(...a), D = B.distanceTo(A), per = dur + pausa;
      const R = []; if (ruote !== false) o.traverse(m => { if (m !== o && /ruota|wheel|gomma|tyre|tire/i.test(m.name || '')) R.push([m, m.quaternion.clone()]); });
      const asseR = new THREE.Vector3(1, 0, 0), q = new THREE.Quaternion();
      return t => { const k = ((t + seme) % per + per) % per, u0 = cl(k / dur), back = avantiEindietro && Math.floor((t + seme) / per) % 2 === 1, u = back ? 1 - u0 : u0;
        o.position.lerpVectors(A, B, u); o.visible = k < dur + 0.001 || avantiEindietro; const sd = u * D; for (const [m, q0] of R) m.quaternion.copy(q0).multiply(q.setFromAxisAngle(asseR, -sd / r)); }; },
    // luce che pulsa (morbida, solo sotto il valore iniziale): insegne, schermi, vetrine. min 0..1 = quanto scende
    lampeggia: (o, { min = 0.7, freq = 0.8, seme = 0, modo = 'onda' }) => { const mats = materiali(o);
      return t => { const w = modo === 'respiro' ? 0.5 + 0.5 * Math.sin(t * freq * TAU + seme) : 0.5 + 0.5 * (0.7 * Math.sin(t * freq * TAU + seme) + 0.3 * Math.sin(t * freq * 2.7 * TAU + seme * 2));
        forza(mats, min + (1 - min) * w); }; },
    // lucine a rincorsa: una lista di oggetti (lampadine) che si accendono in sequenza. Morbido, mai on/off secco
    rincorsa: (o, { pezzi, vel = 3, coda = 3, min = 0.35 }) => { const P = (pezzi || o.children).map(materiali), N = P.length;
      return t => P.forEach((m, i) => { const d = ((t * vel - i) % N + N) % N, k = d < coda ? 1 - d / coda : 0; forza(m, min + (1 - min) * ss(k)); }); },
    // schermi, nastri, scritte LED, acqua: la texture scorre. vel = [u, v] per secondo
    scorri: (o, { vel = [0.1, 0] }) => { const T = []; o.traverse(m => { if (m.isMesh) for (const x of [].concat(m.material)) for (const k of ['map', 'emissiveMap']) if (x[k] && !T.includes(x[k])) { x[k].wrapS = x[k].wrapT = THREE.RepeatWrapping; x[k].needsUpdate = true; T.push(x[k]); } });
      return t => T.forEach(x => x.offset.set((t * vel[0]) % 1, (t * vel[1]) % 1)); },
    // lampeggiante che gira (come sopra le macchine pachinko): costruito da V.girofaro, qui solo la rotazione + luce che gira davvero
    girofaro: (o, { vel = 0.9, luce, raggio = 0.6, forza: f = 6 }) => { const y0 = o.rotation.y;
      return t => { const a = y0 + t * vel * TAU; o.rotation.y = a; if (luce) { luce.position.set(o.position.x + Math.sin(a) * raggio, o.position.y, o.position.z + Math.cos(a) * raggio); luce.intensity = f; } }; },
    // porta automatica o a battente. Si apre DA SOLA quando un attore entra nel raggio (sensore), oppure su un evento «apri»/«chiudi».
    // ante: oggetti (o figli con nome PORTA_L/PORTA_R/anta/door). scorrevole: le ante scivolano di `apertura` m; battente: girano di `angolo` gradi
    porta: (o, { tipo = 'scorrevole', ante, apertura, angolo = 95, sensore = 2.0, vicino = 0.9, dur = 0.7, luce, luceMax, id, aperta = 0 }) => {
      let A = ante || []; if (!A.length) o.traverse(m => { if (m !== o && /porta_[lr]|anta|door|leaf/i.test(m.name || '')) A.push(m); }); if (!A.length) A = [o];
      o.updateWorldMatrix(true, true); const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
      // le ante scorrono lungo l'asse x locale del loro genitore (come si modellano in Blender), ognuna verso il suo lato
      const mx = A.reduce((s, m) => s + m.position.x, 0) / A.length;
      const S = A.map(m => { const b = new THREE.Box3().setFromObject(m), w = b.getSize(new THREE.Vector3()), lato = A.length > 1 ? Math.sign(m.position.x - mx) || 1 : 1;
        return { m, p0: m.position.clone(), dirL: new THREE.Vector3(lato, 0, 0), largo: apertura ?? Math.max(w.x, w.z) * 0.95, r0: m.rotation.y, seg: lato }; });
      const L0 = luce ? luce.intensity : 0, LM = luceMax ?? L0 * 2.2;
      return (_, ctx, t) => { let u = aperta; // tempo assoluto (eventi della storia). sensore: si apre piano piano mentre l'attore si avvicina (funzione della distanza: deterministica)
        for (const p of ctx.attori || []) { const d = Math.hypot(p.x - c.x, p.z - c.z); u = Math.max(u, cl((sensore - d) / Math.max(0.01, sensore - vicino))); }
        for (const e of EV) if (e.id === id && t >= e.t) { const k = ss5(cl((t - e.t) / (e.dur || dur))); u = e.fai === 'apri' ? Math.max(u, k) : e.fai === 'chiudi' ? Math.min(u, 1 - k) : u; }
        const v = ss5(u);
        for (const s of S) { if (tipo === 'battente') s.m.rotation.y = s.r0 + s.seg * v * angolo * Math.PI / 180; else s.m.position.copy(s.p0).addScaledVector(s.dirL, v * s.largo); }
        if (luce) luce.intensity = L0 + (LM - L0) * v; }; },
    // palline che cadono a cascata (macchine pachinko, monete, coriandoli): istanze in una scatola, cadono e rientrano dall'alto
    cascata: (o, { n = 40, w = 0.4, h = 0.9, d = 0.05, r = 0.012, vel = 0.9, colore = '#e8e8f0', zigzag = 0.06 }) => {
      const im = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshStandardMaterial({ color: colore, metalness: 0.8, roughness: 0.25, emissive: colore, emissiveIntensity: 0.25 }), n);
      o.add(im); const m4 = new THREE.Matrix4(), P = []; for (let i = 0; i < n; i++) P.push([((i * 0.6180339) % 1) - 0.5, (i * 0.37) % 1, ((i * 0.913) % 1) - 0.5, 0.7 + (i % 5) * 0.12]);
      return t => { P.forEach(([x, f, z, k], i) => { const u = ((f + t * vel * k / h) % 1 + 1) % 1; m4.makeTranslation(x * w + Math.sin(u * 18 + i) * zigzag, h / 2 - u * h, z * d); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; }; },
    // chiavi libere che si ripetono: [[t, {x, y, z, rx, ry, rz, s}], …] con periodo. Per tutto ciò che il catalogo non ha
    ciclo: (o, { chiavi, periodo }) => { const p0 = o.position.clone(), r0 = o.rotation.clone(), s0 = o.scale.x, K = chiavi.map(([t, v]) => [t, v]), P = periodo || K[K.length - 1][0];
      const val = (k, t) => { let i = 0; while (i < K.length - 1 && t >= K[i + 1][0]) i++; const a = K[i], b = K[i + 1] || K[i], u = b === a ? 0 : ss((t - a[0]) / (b[0] - a[0])), va = a[1][k] ?? 0, vb = b[1][k] ?? va; return va + (vb - va) * u; };
      return t => { const x = ((t % P) + P) % P; o.position.set(p0.x + val('x', x), p0.y + val('y', x), p0.z + val('z', x)); o.rotation.set(r0.x + val('rx', x), r0.y + val('ry', x), r0.z + val('rz', x)); const s = s0 * (1 + val('s', x)); o.scale.setScalar(s); }; },
  };
  // dove mettere il perno per ogni comportamento (se non lo dice l'opzione `perno`)
  const PERNO = { pendola: 'alto', ondeggia: 'basso', respira: 'basso' };
  V.tipi = Object.keys(C);

  // ---- registra un oggetto vivo. opt.avvia / opt.ferma: tempi (s) tra cui il comportamento è attivo; fuori resta nella posa iniziale
  V.aggiungi = (o, tipo, opt = {}) => { if (!o) return null; const arr = [].concat(o); if (arr.length > 1) return arr.map(x => V.aggiungi(x, tipo, opt));
    o = arr[0]; if (!C[tipo]) throw new Error(`vita: comportamento sconosciuto «${tipo}» (esistono: ${V.tipi.join(', ')})`);
    const seme = opt.seme ?? (n * 2.399) % TAU; n++;   // angolo aureo: fasi tutte diverse ma fisse
    const bersaglio = (opt.perno ?? PERNO[tipo]) ? perno(o, opt.perno ?? PERNO[tipo]) : o;
    const fn = C[tipo](bersaglio, { ...opt, seme }); bersaglio.userData.vivo = tipo; o.userData.vivo = tipo;
    const voce = { o: bersaglio, tipo, fn, id: opt.id, attivo: opt.attivo ?? true, da: opt.avvia ?? -1e9, a: opt.ferma ?? 1e9 }; L.push(voce); return voce; };

  // ---- costruttori di oggetti vivi pronti (stile disegnato: volume, contorno dipinto, emissiva leggera)
  V.girofaro = ({ x = 0, y = 2.5, z = 0, colore = '#ff2a2a', r = 0.1, vel = 0.9, forza: f = 5, luceVera = true } = {}) => {
    const g = new THREE.Group(); g.position.set(x, y, z); M.root.add(g);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.2, r * 0.5, 16), M.std('#1a1420', 0.5)); base.position.y = -r * 0.45; g.add(base);
    const t = M.tex(128, 32, (c, W, H) => { const q = c.createLinearGradient(0, 0, W, 0); q.addColorStop(0, colore); q.addColorStop(0.18, '#ffffff'); q.addColorStop(0.36, colore); q.addColorStop(1, new THREE.Color(colore).multiplyScalar(0.35).getStyle()); c.fillStyle = q; c.fillRect(0, 0, W, H); });
    const cupola = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 10, 0, TAU, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(1.3, 1.3, 1.3) })); g.add(cupola);
    const l = luceVera ? M.luce(colore, f, x, y, z, 4) : null; V.aggiungi(g, 'girofaro', { vel, luce: l, forza: f }); return g; };
  // porta automatica a due ante scorrevoli (come «THANK YOU» del reference): telaio, vetri dipinti, tappetino che si illumina
  V.portaAutomatica = ({ x = 0, z = 0, ry = 0, w = 1.8, h = 2.3, colore = '#eeeae4', fuori = '#2a3a8a', luce: lc = '#ffd8a0', sensore = 2.2, id } = {}) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; M.root.add(g);
    const telaio = M.std('#8a8478', 0.6); for (const [a, b, c2, px, py] of [[0.1, h + 0.1, 0.18, -w / 2 - 0.05, h / 2], [0.1, h + 0.1, 0.18, w / 2 + 0.05, h / 2], [w + 0.2, 0.14, 0.18, 0, h + 0.05]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(a, b, c2), telaio); m.position.set(px, py, 0); m.castShadow = true; g.add(m); }
    const dietro = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(fuori).multiplyScalar(1.1) })); dietro.position.set(0, h / 2, -0.12); g.add(dietro);
    const ta = M.tex(128, 256, (c, W, H) => { c.fillStyle = colore; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,190,170,0.55)'; c.fillRect(W * 0.7, H * 0.25, W * 0.12, H * 0.5); c.strokeStyle = '#6a5a52'; c.lineWidth = 6; c.strokeRect(3, 3, W - 6, H - 6); c.fillStyle = 'rgba(0,0,0,0.06)'; c.fillRect(0, H * 0.9, W, H * 0.1); });
    const ante = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.BoxGeometry(w / 2, h, 0.05), M.dipinto(ta, 0.3)); m.name = s < 0 ? 'PORTA_L' : 'PORTA_R'; m.position.set(s * w / 4, h / 2, 0); m.castShadow = m.receiveShadow = true; if (s > 0) m.scale.x = -1; g.add(m); return m; });
    const tap = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, 0.7), new THREE.MeshStandardMaterial({ color: '#b02030', roughness: 0.9, emissive: '#b02030', emissiveIntensity: 0.25 })); tap.rotation.x = -Math.PI / 2; tap.position.set(0, 0.008, 0.45); g.add(tap);
    g.updateWorldMatrix(true, true); const lp = new THREE.Vector3(0, 1.2, -0.5).applyMatrix4(g.matrixWorld), l = M.luce(lc, 0.6, lp.x, lp.y, lp.z, 5);
    V.aggiungi(g, 'porta', { ante, sensore, luce: l, luceMax: 9, id, apertura: w / 2 * 0.95 }); return g; };
  // pallone a spicchi dipinti (si vede che gira): `vita` = 'gira' | 'rimbalza' | 'rotola' con le sue opzioni
  V.pallone = ({ x = 0, y, z = 0, r = 0.11, colori = ['#f4f1ea', '#2a2a36'], vita = 'gira', ...opt } = {}) => {
    const t = M.tex(256, 128, (c, W, H) => { for (let i = 0; i < 8; i++) { c.fillStyle = colori[i % 2]; c.fillRect(i * W / 8, 0, W / 8 + 1, H); } c.strokeStyle = '#3a2a2e'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, H / 2); c.lineTo(W, H / 2); c.stroke(); });
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), M.dipinto(t, 0.25, 0.6)); b.position.set(x, y ?? r, z); b.castShadow = true; M.root.add(b);
    V.aggiungi(b, vita, vita === 'gira' ? { asse: 'x', vel: 0.6, ...opt } : opt); return b; };

  // ---- riconoscimento automatico: nomi dei nodi (da Blender) e oggetti senza vita in campo
  // VIVO_<tipo>[_<asse>][_<vel>]  es. VIVO_gira_y_0.5, VIVO_pendola, VIVO_lampeggia ; oppure parole chiave nel nome
  const PAROLE = [
    [/ventola|fan\b|elica|propel|pala_|blade|mulino/i, 'gira', { asse: 'y', vel: 1.6 }],
    [/pallone|palla\b|ball\b|globo|mappamondo/i, 'gira', { asse: 'y', vel: 0.25 }],
    [/lanterna|lantern|lampadario|campanell|bell\b/i, 'pendola', { amp: 0.06, freq: 0.35 }],
    [/insegna_appesa|cartello_appeso|hanging/i, 'pendola', { amp: 0.035, freq: 0.3, asse: 'x' }],
    [/pianta|plant|foglia|leaf|erba|grass|felce|fern|palma/i, 'ondeggia', { amp: 0.05, freq: 0.25 }],
    [/coda|tail/i, 'pendola', { amp: 0.25, freq: 0.6, asse: 'z', perno: 'basso' }],
    [/schermo|screen|monitor|display|tv\b/i, 'lampeggia', { min: 0.8, freq: 0.6 }],
    [/neon|insegna|sign\b|led\b/i, 'lampeggia', { min: 0.82, freq: 0.35, modo: 'respiro' }],
    [/condizionatore|aircon|frigo|fridge|motore|compressor/i, 'vibra', {}],
    [/girofaro|beacon|lampeggiante/i, 'girofaro', { vel: 0.9 }],
    [/porta_auto|automatic_door|ingresso_auto/i, 'porta', {}],
  ];
  V.auto = (root = M.root, { salta = [] } = {}) => { const trovati = [];
    // un figlio può vivere anche se il genitore vive già (gatto che respira + coda che oscilla)
    root.traverse(o => { if (o.userData.vivo || o.userData.suolo || salta.includes(o)) return; const nm = o.name || ''; if (!nm) return;
      const m = nm.match(/^VIVO_([a-z]+)(?:_([xyz]))?(?:_(-?[\d.]+))?/i);
      if (m && C[m[1].toLowerCase()]) { trovati.push([o, m[1].toLowerCase(), { ...(m[2] ? { asse: m[2] } : {}), ...(m[3] ? { vel: +m[3], freq: +m[3] } : {}) }]); return; }
      if (/^PORTA_[LR]$/i.test(nm)) { if (o.parent && !o.parent.userData.vivo && !trovati.some(x => x[0] === o.parent)) trovati.push([o.parent, 'porta', {}]); return; }
      for (const [re, tipo, opt] of PAROLE) if (re.test(nm)) { trovati.push([o, tipo, opt]); break; } });
    for (const [o, tipo, opt] of trovati) if (!o.userData.vivo) V.aggiungi(o, tipo, opt); return trovati.length; };

  // ---- eventi della storia: { id, t, fai: 'apri' | 'chiudi' | 'avvia' | 'ferma' }
  V.eventi = list => { for (const e of list || []) if (['apri', 'chiudi', 'avvia', 'ferma'].includes(e.fai)) EV.push(e); EV.sort((a, b) => a.t - b.t);
    for (const v of L) if (v.id) for (const e of EV) if (e.id === v.id) { if (e.fai === 'avvia') v.da = e.t; if (e.fai === 'ferma') v.a = e.t; } };   // prima di «avvia» resta fermo nella posa iniziale; da «avvia» parte da fase 0
  V.collega = (id, o) => { for (const v of L) if (v.o === o || v.o.userData.vivoFiglio === o) v.id = v.id || id; };

  // ---- ogni fotogramma
  V.tick = (t, ctx = {}) => { for (const v of L) { if (!v.attivo) continue; const tt = Math.min(Math.max(t, v.da), v.a); v.fn(tt - (v.da > -1e8 ? v.da : 0), ctx, t); } };

  // ---- CONTROLLO «MONDO VIVO»: quanta parte di ciò che si vede si muove. Oggetti < `grande` m (le strutture — muri, palazzi, pavimenti — sono escluse).
  // Ritorna { quota (0..1 dell'area degli oggetti in campo), vivi, fermi, elenco dei fermi più grandi a schermo }
  V.controllo = (camera, { grande = 4.5, min = 0.0015 } = {}) => {
    const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    const b = new THREE.Box3(), v = new THREE.Vector3(), area = o => { b.setFromObject(o); if (b.isEmpty() || !fr.intersectsBox(b)) return 0; let x0 = 1, x1 = -1, y0 = 1, y1 = -1;
      for (let i = 0; i < 8; i++) { v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(camera); if (v.z > 1) continue; x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
      return Math.max(0, Math.min(1, x1) - Math.max(-1, x0)) * Math.max(0, Math.min(1, y1) - Math.max(-1, y0)) / 4; };
    const vivo = o => { for (let p = o; p; p = p.parent) if (p.userData.vivo) return true; return false; };
    const roba = []; M.root.traverse(o => { if (!o.isMesh || !o.visible || o.isInstancedMesh) return; for (let p = o.parent; p; p = p.parent) if (p.visible === false) return;
      b.setFromObject(o); const s = b.getSize(v); if (Math.max(s.x, s.y, s.z) > grande || o.userData.struttura) return; const a = area(o); if (a < min) return; roba.push([o, a, vivo(o)]); });
    // un pezzo di un oggetto vivo conta una volta sola: raggruppa per il primo antenato con nome
    const G = new Map(); for (const [o, a, vv] of roba) { let k = o; while (k.parent && k.parent !== M.root && !k.name) k = k.parent; const wp = k.getWorldPosition(new THREE.Vector3()), g = G.get(k) || { nome: k.name || `${(k.geometry && k.geometry.type.replace('Geometry', '')) || k.type} senza nome a x ${wp.x.toFixed(1)} y ${wp.y.toFixed(1)} z ${wp.z.toFixed(1)}`, a: 0, v: false }; g.a += a; g.v = g.v || vv; G.set(k, g); }
    const tutti = [...G.values()], tot = tutti.reduce((s, g) => s + g.a, 0) || 1, vivA = tutti.filter(g => g.v).reduce((s, g) => s + g.a, 0);
    const fermi = tutti.filter(g => !g.v).sort((x, y) => y.a - x.a).slice(0, 6).map(g => `${g.nome} (${(g.a * 100).toFixed(1)}% dello schermo)`);
    return { quota: vivA / tot, vivi: tutti.filter(g => g.v).length, fermi: tutti.filter(g => !g.v).length, elenco: fermi }; };
  // ---- CONTROLLO «MONDO RICCO» [utente 13/11]: quanto è pieno ciò che si vede, in numeri (references/mondo-da-riferimento.md).
  // Conta gli OGGETTI distinti nel quadro (strutture escluse: muri, pavimenti, cose oltre `grande` m), divisi per taglia (grandi ≥ 1,2 m, medi, piccoli < 0,35 m),
  // quante delle 12 caselle del quadro (3 colonne x 4 righe) hanno almeno un oggetto, quanti piani di profondità sono occupati (vicino < 2,5 m, mezzo, lontano > 7 m)
  // e quante tinte diverse ci sono. Ritorna anche le caselle vuote, per sapere DOVE aggiungere.
  V.ricchezza = (camera, { grande = 4.5, min = 0.0008 } = {}) => {
    const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)), b = new THREE.Box3(), v = new THREE.Vector3(), hsl = {};
    const rett = bb => { if (bb.isEmpty() || !fr.intersectsBox(bb)) return null; let x0 = 1, x1 = -1, y0 = 1, y1 = -1, n = 0; for (let i = 0; i < 8; i++) { v.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).project(camera); if (v.z > 1) continue; n++; x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
      if (!n) return null; x0 = Math.max(-1, x0); x1 = Math.min(1, x1); y0 = Math.max(-1, y0); y1 = Math.min(1, y1); return x1 > x0 && y1 > y0 ? [x0, x1, y0, y1] : null; };
    const G = new Map(); M.root.traverse(o => { if (!o.isMesh || !o.visible || o.isInstancedMesh) return; for (let p = o.parent; p; p = p.parent) if (p.visible === false) return;
      b.setFromObject(o); const s = b.getSize(v); if (Math.max(s.x, s.y, s.z) > grande || o.userData.struttura) return; let k = o; while (k.parent && k.parent !== M.root && !k.name) k = k.parent; if (!G.has(k)) G.set(k, []); G.get(k).push(o); });
    const celle = new Array(12).fill(0), piani = [0, 0, 0], tinte = new Set(); let grandi = 0, medi = 0, piccoli = 0, n = 0;
    for (const [k, ms] of G) { const bb = new THREE.Box3().setFromObject(k), sz = bb.getSize(new THREE.Vector3()), dim = Math.max(sz.x, sz.y, sz.z); if (dim > grande * 1.6) continue; const r = rett(bb); if (!r) continue; if ((r[1] - r[0]) * (r[3] - r[2]) / 4 < min) continue;
      n++; if (dim >= 1.2) grandi++; else if (dim >= 0.35) medi++; else piccoli++;
      const d = bb.getCenter(new THREE.Vector3()).distanceTo(camera.position); piani[d < 2.5 ? 0 : d < 7 ? 1 : 2]++;
      for (let c = 0; c < 3; c++) for (let rg = 0; rg < 4; rg++) { const cx0 = -1 + c * 2 / 3, cy1 = 1 - rg * 0.5; if (r[0] < cx0 + 2 / 3 && r[1] > cx0 && r[2] < cy1 && r[3] > cy1 - 0.5) celle[rg * 3 + c]++; }
      for (const o of ms) { const m = [].concat(o.material)[0]; if (m && m.color) { m.color.getHSL(hsl); if (hsl.s > 0.18 && hsl.l > 0.08 && hsl.l < 0.92) tinte.add(Math.floor(hsl.h * 12)); } } }
    const nomi = ['in alto', 'a metà alta', 'a metà bassa', 'in basso'], lati = ['a sinistra', 'al centro', 'a destra'];
    return { oggetti: n, grandi, medi, piccoli, celle: celle.filter(x => x).length, piani: piani.filter(x => x).length, tinte: tinte.size, vuote: celle.map((x, i) => x ? null : nomi[i / 3 | 0] + ' ' + lati[i % 3]).filter(Boolean),
      posti: (() => { try { return V.collocazione(camera); } catch (e) { return [{ codice: 'COLLOCAZIONE_ERRORE', testo: String(e && e.message || e) }]; } })() }; };

  // ---- CONTROLLO «COLLOCAZIONE» [utente 16/11]: oggetti che si compenetrano e oggetti dove non dovrebbero stare (un lampione in mezzo ai binari).
  // Il cancello di `run.py video` li tratta come il mondo povero: bloccano e si riscrive lo script del luogo (references/controlli.md §0).
  //  COMPENETRATI: due oggetti CON NOME di cui il più piccolo ha almeno il 30% della superficie affondato più di 3 cm dentro il solido dell'altro.
  //    Si misura sui triangoli veri, non sulle scatole: appoggi, incastri, cose affondate di pochi millimetri, oggetti dentro ciotole, vasi, scaffali
  //    e casse aperte non contano; un oggetto tutto dentro un altro è nascosto e non conta. Voluto? oggetto.userData.sovrapposto_ok = true
  //    Si confrontano solo oggetti che stanno in rami diversi del mondo (figli diretti diversi di M.root): i pezzi di uno stesso gruppo o modello GLB no.
  //    Quindi ogni oggetto va aggiunto al mondo per conto suo, non dentro un unico gruppo «stanza».
  //  FUORI_POSTO: un oggetto alto più di 25 cm col centro dentro una ZONA DI PASSAGGIO. È zona di passaggio la pianta di ogni oggetto marcato
  //    oggetto.userData.passaggio = { nome: 'binario', per: ['treno'] }   (per = pezzi di nome di ciò che lì può stare)
  //    e di ogni oggetto il cui nome contiene binari/rotaie (per i treni) o carreggiata/corsia (per i veicoli). Si marca SOLO dove si passa
  //    (il letto dei binari, la carreggiata, il varco di una porta), non il marciapiede. Ciò che si muove lungo un percorso (comportamento «passa»)
  //    può starci sempre; le cose appese più di 2,2 m sopra (cartelli, fili) non intralciano. Voluto? oggetto.userData.nel_passaggio = true
  // Guarda solo ciò che cade nel quadro. Limiti: non vede un palo sottile che buca un piano sottile (poca superficie in comune), né le zone non marcate.
  const ZONE_NOME = [[/binari|rotai/i, 'binario', ['treno', 'vagone', 'locomotiva', 'tram', 'metro', 'carrello']],
    [/carreggiata|corsia/i, 'carreggiata', ['auto', 'macchina', 'taxi', 'bus', 'camion', 'furgone', 'moto', 'scooter', 'bici', 'tram', 'ambulanza', 'polizia', 'carro']]];
  let _comp = null, _firmaComp = null;   // riusa solo se geometria, pose, visibilità e soglie non cambiano
  V.collocazione = (camera, { grande = 4.5, affondo = 0.03, quota = 0.3, alto = 0.25 } = {}) => {
    const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)), v3 = new THREE.Vector3();
    const su = (o, f) => { for (let p = o; p && p !== M.root; p = p.parent) if (f(p)) return p; return null; };
    const visibile = o => { for (let p = o; p; p = p.parent) if (p.visible === false) return false; return true; };
    const pieno = m => [].concat(m.material).every(x => x && !x.transparent && (x.opacity ?? 1) >= 0.99 && x.side !== THREE.BackSide && x.blending !== THREE.AdditiveBlending);
    M.root.updateMatrixWorld(true);
    const G = new Map(), zone = [];
    M.root.traverse(o => {
      const pz = o.userData.passaggio, zn = !pz && o.name ? ZONE_NOME.find(z => z[0].test(o.name)) : null;
      if ((pz || zn) && visibile(o)) { const bb = new THREE.Box3().setFromObject(o); if (!bb.isEmpty()) zone.push({ o, bb, nome: (pz && pz.nome) || (zn ? zn[1] : '') || o.name || 'passaggio', per: (pz && pz.per) || (zn ? zn[2] : []) }); }
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !visibile(o)) return;
      let k = o; while (k.parent && k.parent !== M.root && !k.name) k = k.parent; if (!G.has(k)) G.set(k, []); G.get(k).push(o);
    });
    const O = [...G].map(([k, ms]) => { const bb = new THREE.Box3().setFromObject(k), s = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3()), nome = (k.name || '').replace(/^perno_/, '');
      return { k, ms, bb, s, c, nome, come: nome ? `«${nome}»` : `un oggetto senza nome (x ${c.x.toFixed(1)}, z ${c.z.toFixed(1)})`, strutt: ms.every(m => m.userData.struttura) || Math.max(s.x, s.y, s.z) > grande * 1.6 }; }).filter(x => !x.bb.isEmpty());
    const out = [], inTransito = new Set(L.filter(vv => vv.tipo === 'passa').map(vv => vv.o)), passa = x => !!su(x.k, p => inTransito.has(p)) || x.ms.some(m => su(m, p => inTransito.has(p)));
    // -- FUORI_POSTO: si guarda l'oggetto INTERO (il figlio diretto del mondo), non i suoi pezzi: le porte di un treno non sono «fuori posto» sui binari
    const cima = x => { let p = x.k; while (p.parent && p.parent !== M.root) p = p.parent; return p; }, interi = new Map();
    for (const x of O) { const c = cima(x); if (!interi.has(c)) interi.set(c, []); interi.get(c).push(x); }
    for (const z of zone) for (const [c, parti] of interi) {
      if (c === z.o || su(z.o, p => p === c) || c.userData.nel_passaggio || parti.some(x => su(x.k, p => p.userData.nel_passaggio) || passa(x))) continue;   // la zona stessa, ciò che è dichiarato, ciò che passa
      const bb = new THREE.Box3().setFromObject(c), sz = bb.getSize(new THREE.Vector3()), ce = bb.getCenter(new THREE.Vector3()), nomi = [];
      // Identità del modello intero, anche nei nodi intermedi GLB o nei metadati di un treno senza nome.
      c.traverse(p => { for (const n of [p.name, p.userData.tipo, p.userData.vivo]) if (typeof n === 'string') nomi.push(n.toLowerCase()); });
      if (bb.isEmpty() || sz.y < alto || Math.max(sz.x, sz.y, sz.z) > grande * 1.6 || parti.every(x => x.ms.every(m => m.userData.struttura))) continue;   // cose basse (tombini, strisce), strutture e cose enormi
      if (z.per.some(p => nomi.some(n => n.includes(String(p).toLowerCase())))) continue;
      if (ce.x < z.bb.min.x || ce.x > z.bb.max.x || ce.z < z.bb.min.z || ce.z > z.bb.max.z) continue;
      if (bb.min.y > z.bb.max.y + 2.2 || bb.max.y < z.bb.min.y - 0.1 || !fr.intersectsBox(bb)) continue;
      const come = (c.name || '').replace(/^perno_/, '') ? `«${c.name.replace(/^perno_/, '')}»` : (parti.find(x => x.nome) ? `l'oggetto con «${parti.find(x => x.nome).nome}»` : `un oggetto senza nome (x ${ce.x.toFixed(1)}, z ${ce.z.toFixed(1)})`);
      out.push({ codice: 'FUORI_POSTO', oggetti: [c.uuid, z.o.uuid], testo: `${come} sta in mezzo a «${z.nome}», che è una zona di passaggio${z.per.length ? ' (lì possono stare solo: ' + z.per.join(', ') + ')' : ''}: spostalo fuori` });
    }
    // -- COMPENETRATI: una posa vecchia non può bloccare (o assolvere) il fotogramma corrente.
    const firma = JSON.stringify([grande, affondo, quota, O.map(x => [x.k.uuid, cima(x).uuid, x.nome,
      !!su(x.k, p => p.userData.sovrapposto_ok), x.strutt, x.ms.map(m => [m.uuid, m.geometry.uuid,
        m.geometry.attributes.position?.version, m.geometry.index?.version, pieno(m), ...m.matrixWorld.elements])])]);
    if (!_comp || firma !== _firmaComp) {
      _firmaComp = null;
      _comp = [];
      const tri = x => { if (x.T !== undefined) return x.T; const T = [];
        for (const m of x.ms) { const g = m.geometry, p = g && g.attributes && g.attributes.position; if (!p || !pieno(m)) continue; const ix = g.index, n = ix ? ix.count : p.count;
          for (let i = 0; i + 2 < n; i += 3) for (let j = 0; j < 3; j++) { v3.fromBufferAttribute(p, ix ? ix.getX(i + j) : i + j).applyMatrix4(m.matrixWorld); T.push(v3.x, v3.y, v3.z); } if (T.length > 540000) return x.T = null; }
        return x.T = T.length ? T : null; };
      // P è dentro il solido T se TUTTE e 6 le semirette (±x ±y ±z) attraversano un numero dispari di facce (un contenitore aperto ne lascia uscire una) e la faccia più vicina dista almeno `affondo`
      const dentro = (P, T) => { const cnt = [0, 0, 0, 0, 0, 0]; let dmin = Infinity;
        for (let i = 0; i < T.length; i += 9) for (let a = 0; a < 3; a++) { const u = (a + 1) % 3, w = (a + 2) % 3;
          const ax = T[i + u] - P[u], ay = T[i + w] - P[w], bx = T[i + 3 + u] - P[u], by = T[i + 3 + w] - P[w], cx = T[i + 6 + u] - P[u], cy = T[i + 6 + w] - P[w];
          const d0 = ax * by - ay * bx, d1 = bx * cy - by * cx, d2 = cx * ay - cy * ax; if (!((d0 > 0 && d1 > 0 && d2 > 0) || (d0 < 0 && d1 < 0 && d2 < 0))) continue;
          const h = (d1 * T[i + a] + d2 * T[i + 3 + a] + d0 * T[i + 6 + a]) / (d0 + d1 + d2) - P[a]; cnt[a * 2 + (h > 0 ? 0 : 1)]++; dmin = Math.min(dmin, Math.abs(h)); }
        return cnt.every(c => c % 2 === 1) && dmin >= affondo; };
      const campioni = x => { const T = tri(x); if (!T) return []; const nT = T.length / 9, passo = Math.max(1, Math.ceil(nT / 40)), S = [];
        for (let t = 0; t < nT; t += passo) for (const w of [[.6, .2, .2], [.2, .6, .2], [.2, .2, .6]]) { const i = t * 9; S.push([0, 1, 2].map(a => w[0] * T[i + a] + w[1] * T[i + 3 + a] + w[2] * T[i + 6 + a])); } return S; };
      const N = O.filter(x => x.nome && !su(x.k, p => p.userData.sovrapposto_ok)), vol = x => x.s.x * x.s.y * x.s.z;
      const parente = (a, b) => cima(a) === cima(b);   // pezzi dello stesso oggetto o dello stesso modello GLB (stesso figlio diretto del mondo): sono fatti per incastrarsi
      for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
        let A = N[i], B = N[j]; if (vol(A) > vol(B)) [A, B] = [B, A]; if (A.strutt || parente(A, B)) continue;
        const I = A.bb.clone().intersect(B.bb); if (I.isEmpty()) continue; const si = I.getSize(v3); if (Math.min(si.x, si.y, si.z) < affondo * 2) continue;
        if (B.strutt && B.bb.containsBox(A.bb)) continue;   // stanza fatta a guscio, cielo: contengono tutto per costruzione
        const TB = tri(B), S = campioni(A); if (!TB || S.length < 9) continue;
        const f = S.filter(P => B.bb.containsPoint(v3.set(P[0], P[1], P[2])) && dentro(P, TB)).length / S.length;
        if (f >= quota && f < 0.97) _comp.push({ A, B, f });
      }
      _firmaComp = firma;   // un errore non deve lasciare una cache parziale valida
    }
    for (const c of _comp) if (visibile(c.A.k) && visibile(c.B.k) && fr.intersectsBox(c.A.bb))
      out.push({ codice: 'COMPENETRATI', oggetti: [c.A.k.uuid, c.B.k.uuid].sort(), testo: `${c.A.come} è per il ${Math.round(c.f * 100)}% dentro ${c.B.come}: separali (accanto o appoggiato sopra, non uno dentro l'altro)` });
    return out.slice(0, 12);
  };
  return V;
}
