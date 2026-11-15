// Esegue UNA scena di una storia «disegnato» (JSON): costruisce il luogo, mette gli attori, muove camera e personaggi nel tempo.
// Pagina: /web/storia.html?scena=<indice>. La storia (con i tempi già risolti) arriva da /scena/storia.json (kit/tools/rendi_disegnato.mjs).
// Formato del JSON: references/storia-disegnato.md. Il look non si tocca qui: sta in look_disegnato.js.
import { THREE, camera, renderer, scene, sky, L, creaDisegnato, personalita, drawOmino } from '/web/look_disegnato.js';
import { creaMondo } from '/web/mondo_disegnato.js';
import { creaPersonaggio3D } from '/web/personaggi3d.js';
import { drawRick, caricaTessuti, calcolaManoPx, sedutoDropPx, POSE_CORPO, ANDATURE, TESTE, CORPI } from '/web/omino_rick.js'; import { espandi as espandiPreset, effetti as effettiCamera } from '/web/camera_preset.js'; import { interazioni } from '/web/interazioni.js'; import { CAST as CAST_RICK } from '/web/cast_rick.js';
import { creaVita } from '/web/vita.js';
try {
  const q = new URLSearchParams(location.search), S = await (await fetch('/scena/storia.json')).json(), SC = S.scene[+(q.get('scena') || 0)], LG = S.luoghi[SC.luogo];
  if (!LG) throw new Error('luogo sconosciuto: ' + SC.luogo);
  const LUCE_RICK = !!(SC.luce_rick ?? S.luce_rick ?? (S.personaggi === 'rick'));   // approvata il 12/11: accesa di base nelle storie Rick; "luce_rick": false la spegne
  const LUCE_CINEMA = SC.parametri?.luce_cinema ?? SC.luce_cinema ?? LG.parametri?.luce_cinema ?? LG.luce_cinema ?? S.luce_cinema;
  const LC_ACT = !!LUCE_CINEMA, LC_OPT = (LUCE_CINEMA && typeof LUCE_CINEMA === 'object') ? LUCE_CINEMA : {};
  const LC_LENTE = LC_ACT && LC_OPT.lente !== false && LC_OPT.dof !== false, LC_RESPIRO = LC_ACT && LC_OPT.respiro !== false;
  const D = creaDisegnato({ luce: SC.luce || LG.luce, strada: LG.strada, hdri: SC.hdri ?? LG.hdri ?? S.hdri, parametri: { ...(S.personaggi === 'rick' ? { iw: 4.4, ic: '#0b0a0c', kn: 0.22, kd: 0.035 } : {}), ...(LUCE_RICK ? { luce_rick: 1, chiuso: LG.esterno ? 0 : 1, ss: 2 /* [utente 12/11] antialiasing di base con Rick: toglie il tremolio; "ss": 1 nei parametri lo spegne */ } : {}), ...(LG.parametri || {}), ...(SC.parametri || {}), ...(LUCE_CINEMA !== undefined ? { luce_cinema: LUCE_CINEMA } : {}), dof: ((S.sfocatura ?? SC.sfocatura ?? ((LUCE_RICK || LC_LENTE) ? 'intelligente' : 0)) || SC.sfocatura || (SC.camera || []).some(k => k.sfocatura)) ? 1 : 0 } }), M = creaMondo(D, LG.mondo || {});
  M.vita = creaVita(M);   // mondo vivo: i costruttori, gli script e i GLB registrano qui ciò che si muove (vita.js, references/mondo-vivo.md)
  const _VIVO = await import('/web/vivo.js');
  _VIVO.registraSuMondo(M, () => camera);
  const OBJ = {};
  for (const o of LG.oggetti || []) { if (!M[o.tipo]) throw new Error('oggetto sconosciuto: ' + o.tipo + ' (vedi mondo_disegnato.js)'); const r = M[o.tipo](o); if (o.id) { OBJ[o.id] = r; if (o.nascosto && r) [].concat(r).forEach(x => { x.visible = false; }); } }
  // Ombra di contatto morbida blu-grigia sotto carte Rick e oggetti
  let ombraTex = null;
  function getOmbraTex() {
    if (!ombraTex) {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const g = cv.getContext('2d');
      const r = g.createRadialGradient(128, 64, 4, 128, 64, 64);
      r.addColorStop(0, 'rgba(16, 22, 34, 0.78)');
      r.addColorStop(0.45, 'rgba(20, 26, 40, 0.48)');
      r.addColorStop(0.8, 'rgba(24, 32, 48, 0.16)');
      r.addColorStop(1, 'rgba(24, 32, 48, 0)');
      g.setTransform(2, 0, 0, 1, -128, 0);
      g.fillStyle = r; g.fillRect(0, 0, 256, 128);
      ombraTex = new THREE.CanvasTexture(cv);
      ombraTex.colorSpace = THREE.SRGBColorSpace;
    }
    return ombraTex;
  }
  function assicuraOmbraRick(m) {
    let s = m.children.find(c => c.userData && c.userData.ombra);
    if (!s) {
      const geo = new THREE.PlaneGeometry(0.62, 0.40);
      const mat = new THREE.MeshBasicMaterial({ map: getOmbraTex(), transparent: true, depthWrite: false, toneMapped: false });
      s = new THREE.Mesh(geo, mat); s.position.set(0, 0.008, 0.02); s.renderOrder = 2; s.userData.ombra = true; m.add(s);
    } else if (s.material.map !== getOmbraTex()) {
      s.material.map = getOmbraTex(); s.material.needsUpdate = true;
    }
    s.rotation.x = -Math.PI / 2 - (m.rotation.x || 0);
    return s;
  }

  const OBJ_OMBRE = new Map();
  function aggiornaOmbraOggetto(o) {
    if (!o || !o.visible) {
      const s = OBJ_OMBRE.get(o); if (s) s.visible = false;
      return;
    }
    let s = OBJ_OMBRE.get(o);
    if (!s) {
      const geo = new THREE.PlaneGeometry(0.22, 0.16);
      const mat = new THREE.MeshBasicMaterial({ map: getOmbraTex(), transparent: true, depthWrite: false, toneMapped: false });
      s = new THREE.Mesh(geo, mat); s.rotation.x = -Math.PI / 2; s.renderOrder = 2; s.userData.ombra = true;
      M.root.add(s);
      OBJ_OMBRE.set(o, s);
    }
    const rc = new THREE.Raycaster(new THREE.Vector3(o.position.x, o.position.y + 0.05, o.position.z), new THREE.Vector3(0, -1, 0), 0.001, 15);
    rc.camera = camera;
    M.root.updateMatrixWorld(true);
    const hits = rc.intersectObjects(M.root.children, true);
    let targetY = 0;
    for (const hit of hits) {
      let q = hit.object, skip = false;
      for (let p = q; p; p = p.parent) {
        if (p === o || (p.userData && (p.userData.card || p.userData.vivo === 'attore' || p.userData.ombra))) { skip = true; break; }
      }
      if (!skip && q.isMesh && q.visible && !(q.material && q.material.transparent && q.material.opacity < 0.2)) {
        targetY = hit.point.y;
        break;
      }
    }
    s.visible = true;
    s.position.set(o.position.x, targetY + 0.005, o.position.z);
    const hDiff = Math.max(0, o.position.y - targetY);
    s.material.opacity = Math.max(0.12, 0.65 / (1 + hDiff * 2.5));
    const sc = Math.min(1.5, 1 + hDiff * 0.35);
    s.scale.set(sc, sc, sc);
  }

  // Cadenza naturale dello sbatter d'occhi stile Rick (ogni ~1,3-2,2 s, durata 4 fotogrammi; anticipa cambi d'espressione e svolte rapide)
  function palpebraRick(t, seme = 0, nextFacciaT = null, extraBlinkT = null) {
    const BL = 4 / 30, seg = u => (u < 0.25 || u >= 0.75 ? 0.4 : 1);
    if (nextFacciaT != null) {
      const dt = nextFacciaT - t;
      if (dt > 0.005 && dt <= BL) return seg(1 - dt / BL);
    }
    if (extraBlinkT != null) {
      const dtB = t - extraBlinkT;
      if (dtB >= -BL * 0.35 && dtB <= BL * 0.65) return seg((dtB + BL * 0.35) / BL);
    }
    const per = 1.35 + (Math.abs(seme) % 7) * 0.14;
    const off = 0.65 + (Math.abs(seme) % 11) * 0.13;
    const ph = (((t + off) % per) + per) % per;
    if (ph < BL) return seg(ph / BL);
    return 0;
  }

  // Bocca e micro-cenni sincronizzati alle parole in S._parole (con anticipo di 2 fotogrammi e tenuta minima di 4 fotogrammi)
  const VOWEL_MOUTH = (w) => {
    const txt = String(w || '').toLowerCase();
    if (/[ouòù]/.test(txt) && !/[ae]/.test(txt.slice(0, 2))) return 'o_piccola';
    if (/[aeàè]/.test(txt)) return 'aperta';
    if (/[i]/.test(txt)) return 'stretta';
    return 'mezzo';
  };
  function boccaParla(s, t, seme = 0) {
    if (!s.parla) return { bocca: s.bocca || null, nod: 0 };
    const P = Array.isArray(S._parole) ? S._parole : [];
    const LEAD = 2 / 30, HOLD = 4 / 30;
    const tw = t + LEAD;
    let bocca = s.bocca || null, nod = 0;
    if (P.length) {
      const wi = P.findIndex(x => tw >= x[0] && tw <= x[1]);
      if (wi < 0) {
        if (!bocca) bocca = 'chiusa';
        const prevW = [...P].reverse().find(x => tw > x[1] && (tw - x[1]) < 0.14);
        if (prevW) nod = Math.sin((t - (s.parlaT || 0)) * 2.3 + seme * 1.1) * 1.8 * (1 - (tw - prevW[1]) / 0.14);
      } else {
        const w = P[wi], wd = Math.max(0.12, w[1] - w[0]);
        if (!bocca) {
          const slot = Math.floor((tw - w[0]) / HOLD);
          const seq = [VOWEL_MOUTH(w[2]), 'larga', 'o_piccola', 'stretta'];
          bocca = slot === 0 ? seq[0] : seq[(slot + (Math.abs(seme) % 2)) % seq.length];
        }
        const phraseSway = Math.sin((t - (s.parlaT || 0)) * 2.3 + seme * 1.1) * 2.0;
        const wordNod = (wd >= 0.24 && (tw - w[0]) < 0.24)
          ? Math.sin(((tw - w[0]) / 0.24) * Math.PI) * 2.2 * (wi % 2 ? 1 : -0.65) : 0;
        nod = phraseSway + wordNod;
      }
      return { bocca, nod: Math.round(nod * 2) / 2 };
    }
    if (!bocca) {
      const cyc = ['aperta', 'stretta', 'o_piccola', 'larga', 'chiusa'];
      const slot = Math.floor(tw / HOLD);
      bocca = cyc[(slot + Math.abs(seme)) % cyc.length];
    }
    nod = Math.sin((tw - (s.parlaT || 0)) * 3.5 + seme) * 2.5 + Math.sin(tw * 6.8 + seme * 0.5) * 0.9;
    return { bocca, nod: Math.round(nod * 2) / 2 };
  }

  // stile Rick: anche le comparse 3D dei luoghi (creaPersonaggio3D) diventano carte Rick, con un tipo del cast scelto dal nome
  if (S.personaggi === 'rick') globalThis.RICK_COMPARSA = (root, nome, opt = {}) => {
    const tipi = Object.keys(CAST_RICK), folla = tipi.filter(k => CAST_RICK[k].folla !== false), n = String(nome).toLowerCase();
    const sin = { commesso: 'barista', cameriere: 'barista', chef: 'cuoco', pizzaiolo: 'cuoco', dottore: 'medico', dottoressa: 'medico', infermiere: 'chirurgo', infermiera: 'chirurgo', avvocato: 'banchiere', imprenditore: 'banchiere', notaio: 'giudice', magistrato: 'giudice', muratore: 'operaio', vigile: 'poliziotto', carabiniere: 'poliziotto', guardia: 'poliziotto', soldato: 'ufficiale', generale: 'ufficiale', capitano: 'pilota', bandito: 'ladro', rapinatore: 'ladro', criminale: 'ladro', carcerato: 'detenuto', prigioniero: 'detenuto', maestro: 'professore', insegnante: 'professore', docente: 'professore', cronista: 'giornalista', reporter: 'giornalista', corriere: 'fattorino', postino: 'fattorino', rider: 'fattorino', milionario: 'ricco', miliardario: 'ricco', agricoltore: 'contadino', duro: 'palestrato' };
    const sinMatch = Object.keys(sin).find(k => n.includes(k));
    const tipo = tipi.find(k => n.includes(k)) || (sinMatch && CAST_RICK[sin[sinMatch]] ? sin[sinMatch] : null) || (folla.length ? folla : tipi)[(opt.seme || 0) % (folla.length || tipi.length)];
    const m = D.card({ posa: 'fermo' }, 0, 0, 0); m.userData.rickProprio = true; const g = new THREE.Group(); root.add(g); m.removeFromParent(); g.add(m); m.position.set(0, 0, 0); m.scale.setScalar(1 / 0.55);
    m.rotation.order = 'YXZ';
    const r = { ...CAST_RICK[tipo], posa: opt.posa || 'auto', x: 256, y: 1010, seme: opt.seme || 0 }; r.W = 270 * (r.W || 1); const FM = { sorriso: 'felice' }; let key = '';
    const P = {
      obj: g, stato: (st = {}) => {
        const gw = new THREE.Vector3(); g.getWorldPosition(gw);
        const dx = camera.position.x - gw.x, dz = camera.position.z - gw.z;
        let cy = Math.atan2(dx, dz); if (!isFinite(cy)) cy = 0;   // prima della prima inquadratura la camera non ha ancora posizione
        const dxz = Math.hypot(dx, dz) || 1e-4;
        const scY = (g.scale.y || 1) * (m.scale.y || 1);
        const pitch = Math.atan2(camera.position.y - (gw.y + 1.0 * scY), dxz);
        const maxAng = 35 * Math.PI / 180;
        const rx = -Math.max(-maxAng, Math.min(maxAng, pitch));
        const par = g.parent ? new THREE.Euler().setFromQuaternion(g.parent.getWorldQuaternion(new THREE.Quaternion())).y : 0;
        m.rotation.y = cy - par - g.rotation.y;
        m.rotation.x = rx;
        assicuraOmbraRick(m);
        const cam = st.posa === 'cammina', limV = cam ? 1 : 0.82, rel = g.rotation.y - cy, cosRel = Math.cos(rel);
        const spalle = st.posa === 'spalle' ? 1 : (cosRel < -0.10 ? Math.min(1, (-cosRel - 0.10) / 0.82) : 0);
        const verso = Math.max(-limV, Math.min(limV, Math.sin(rel) * (cosRel >= -0.1 ? 1.15 : 1.0))), t = st.t || 0, bl = palpebraRick(t, r.seme);
        const talk = st.parla ? boccaParla(st, t, r.seme) : { bocca: null, nod: 0 };
        const sg = st.sguardo || (Math.floor((t + r.seme * 0.7) / 2.2) % 3 === 1 ? [((r.seme % 2) ? 0.5 : -0.5), 0] : [0, 0]);
        const posaEff = cam ? 'cammina' : (st.posa && POSE_CORPO.has(st.posa) ? st.posa : r.posa);
        const o = { ...r, posa: posaEff, gesto: st.gesto || null, gestoT: t, t, faccia: FM[st.faccia] || st.faccia || 'neutro', bocca: talk.bocca, sguardo: sg, inclina: (st.testa || 0) + talk.nod, verso: Math.round(verso * 20) / 20, spalle: Math.round(spalle * 20) / 20, cammina: cam, passo: cam ? Math.round(((st.passo || 0) / 2 % 1) * 24) / 24 : 0, palpebra: bl }, k = JSON.stringify([o.faccia, o.bocca, o.posa, o.gesto, o.sguardo, o.inclina, o.verso, o.spalle, o.passo, bl, zoomFaccia(m)]);
        if (k !== key) { key = k; disegnaRick(m, o); }
      }
    };
    P.stato({}); return P;
  };
  if (LG.script) await (await import('/scena/' + LG.script)).costruisci(M, D, S, OBJ);   // mondo su misura: export function costruisci(M, D, storia, oggetti)
  await Promise.all([M.attendi?.(), D.pronto?.()]);
  // Risolvi automaticamente in OBJ eventuali oggetti nominati nel luogo (tavoli, stoviglie, maniglie...) usati in scena/azioni
  {
    const ids = new Set();
    for (const e of SC.oggetti || []) if (e.id) ids.add(e.id);
    for (const c of SC.camera || []) if (c.guarda_ogg) ids.add(c.guarda_ogg);
    for (const a of SC.attori || []) {
      if (a.porta?.id) ids.add(a.porta.id);
      for (const z of a.azioni || []) {
        for (const o of [].concat(z.ogg || [])) if (o) ids.add(o);
        if (z.su_ogg) ids.add(z.su_ogg);
        if (z.porta?.id) ids.add(z.porta.id);
        for (const at of [].concat(z.attiva || [])) if (at && at.ogg) ids.add(at.ogg);
      }
    }
    for (const id of ids) if (!(id in OBJ)) { const n = M.root.getObjectByName(id); if (n) OBJ[id] = n; }
  }
  // vita dal JSON: "vita": [{ "id": "porta1", "tipo": "porta", … }, { "nome": "ventola", "tipo": "gira", "vel": 2 }] nel luogo e/o nella scena; poi riconoscimento automatico dai nomi
  for (const v of [...(LG.vita || []), ...(SC.vita || [])]) {
    const { id, nome, tipo, ...opt } = v; let bers = id ? OBJ[id] : null;
    if (!bers && nome) { const re = new RegExp(nome, 'i'), tr = []; M.root.traverse(o => { if (o.name && re.test(o.name) && !o.userData.vivo) tr.push(o); }); bers = tr; }
    if (!bers || (Array.isArray(bers) && !bers.length)) throw new Error(`vita: niente da animare per ${JSON.stringify(v)} (id non registrato in oggetti, o nessun nodo col nome)`);
    M.vita.aggiungi(bers, tipo, { ...opt, id });
  }
  for (const [id, o] of Object.entries(OBJ)) for (const x of [].concat(o || [])) M.vita.collega(id, x);
  if (S.vivo !== false && LG.vivo !== false) _VIVO.vivifica(M, { camera, attori: () => VICINI(), ...(typeof LG.vivo === 'object' ? LG.vivo : {}) });   // meccanismi dei GLB di library/vivi (porte, ventole…), vapore, polvere: prima di M.vita.auto(), che salta ciò che è già vivo
  const _PP = SC.polvere_piedi ?? LG.polvere_piedi ?? S.polvere_piedi;
  if (_PP !== false) _VIVO.polverePiedi(M, t => {
    const out = [];
    for (const A of Object.values(ATT)) {
      if (!A.m.visible) continue;
      const s = stato(A, t);
      if (s.visibile === false) continue;
      const cammina = !!s.cammina;
      const andatura = s.cammina ? (s.cammina[3] || s.andatura || 'cammina') : (s.andatura || null);
      const passo = s.cammina ? Math.round((s.cammina[2] / 2) * 60) / 60 % 1 : 0;
      let frena = 0;
      if (!cammina && s.posa !== 'seduto' && s.posa !== 'sdraiato') {
        let hi = 0;
        for (let j = 1; j <= 4; j++) { const dt = j * .11; if (t - dt >= SC.da) { const sp = stato(A, t - dt); if (sp.visibile !== false && sp.cammina) { hi = dt; break; } } }
        if (hi > 0) {
          let lo = hi - .11;
          for (let b = 0; b < 4; b++) { const mid = (lo + hi) * .5, sp = stato(A, t - mid); if (sp.visibile !== false && sp.cammina) hi = mid; else lo = mid; }
          frena = Math.min(.99, (lo + hi) * .5 / .44);
        }
      }
      if (!cammina && !frena) continue;
      out.push({ x: A.m.position.x, y: A.m.position.y, z: A.m.position.z, rotY: A.m.rotation.y, scala: A.m.scale.y || 1, visibile: true, cammina, andatura, passo, frena });
    }
    return out;
  }, typeof _PP === 'object' ? _PP : {});
  if (SC.mondo_rick ?? LG.mondo_rick ?? S.mondo_rick) console.log('[d] mondo_rick: ' + JSON.stringify(M.dipingiRick(typeof (LG.mondo_rick) === 'object' ? LG.mondo_rick : {})));   // pezzo B1: superfici dipinte stile Rick (mondo_disegnato.js)
  if (LG.vita_auto !== false) M.vita.auto();
  M.vita.eventi(SC.oggetti);

  const ss = x => x * x * x * (x * (x * 6 - 15) + 10), cl = x => Math.min(1, Math.max(0, x)), hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7);
  // ---- attori
  const ATT = {}, RICK_P = S.personaggi === 'rick'; let RICK_TEX = null;
  for (const a of SC.attori || []) {
    const b = (S.cast || {})[a.id] || {}, { scala, ...bo } = b;
    const opt = { ...personalita(b.seme ?? hash(a.id), (RICK_P || b.stile === "rick") ? undefined : b.tipo), ...bo, posa: a.posa || 'fermo', verso: a.verso ?? 0, ...(a.faccia ? { faccia: a.faccia } : {}), ...('oggetto' in a ? { oggetto: a.oggetto } : {}) };
    if (b.modello3d) {
      const P3 = await creaPersonaggio3D(M.root, b.modello3d, { faccia: opt.faccia, seme: b.seme || hash(a.id), seduta: a.seduta });   // personaggio 3D da Blender (engine3d/personaggi3d)
      P3.obj.position.set(a.x, 0, a.z); P3.obj.scale.setScalar(a.scala ?? scala ?? 1); ATT[a.id] = { m: P3.obj, p3: P3, a, opt, key: '', v: null, az: [...(a.azioni || [])].sort((x, y) => x.t - y.t) }; continue;
    }
    if (RICK_P || b.stile === "rick") {
      if (!RICK_TEX) RICK_TEX = caricaTessuti('/kit/texture/'); await RICK_TEX;   // personaggi stile Rick (omino_rick.js + cast_rick.js): carta che guarda sempre la camera
      const { stile, ...br } = bo, ro = { ...(CAST_RICK[b.tipo] || CAST_RICK.impiegato), ...br, faccia: a.faccia || br.faccia || 'neutro' };
      const { testa: _t, corpo: _c, ...optSafe } = opt;
      const m = M.omino({ ...optSafe, posa: 'fermo' }, a.x, a.z, 0, a.scala ?? scala ?? 1); ATT[a.id] = { m, a, opt: ro, rick: true, seme: hash(a.id), key: '', v: null, az: [...(a.azioni || [])].sort((x, y) => x.t - y.t) }; continue;
    }
    const m = M.omino(opt, a.x, a.z, a.ry ?? -0.5, a.scala ?? scala ?? 1); ATT[a.id] = { m, a, opt, key: '', v: null, az: [...(a.azioni || [])].sort((x, y) => x.t - y.t) };
  }
  // Profilo di accelerazione/decelerazione morbida (trapezio C1 senza picchi doppi) per partenza e arresto pesati
  function curvaPasso(rawU, dur, rStart, rEnd) {
    if (dur <= 0.08 || (!rStart && !rEnd)) return rawU;
    let r0 = rStart ? Math.min(0.26, 0.22 / dur) : 0;
    let r1 = rEnd ? Math.min(0.30, 0.25 / dur) : 0;
    if (r0 + r1 >= 0.92) { const k = 0.92 / (r0 + r1); r0 *= k; r1 *= k; }
    const denom = Math.max(0.1, 1 - 0.5 * (r0 + r1));
    if (r0 > 0 && rawU < r0) return (0.5 * rawU * rawU / r0) / denom;
    if (r1 > 0 && rawU > 1 - r1) { const rem = 1 - rawU; return 1 - (0.5 * rem * rem / r1) / denom; }
    return (rawU - 0.5 * r0) / denom;
  }

  function parametriCammino(A, x0, z0, posa, andatura, z) {
    const dx = z.a[0] - x0, dz = z.a[1] - z0, d = Math.hypot(dx, dz);
    const sc = Math.max(0.5, A.m?.scale?.y || 1);
    const explicitGait = z.andatura || (z.corsa ? 'corsa' : null) || (ANDATURE[z.posa] && z.posa !== 'cammina' ? z.posa : null) || andatura;
    const velDef = (explicitGait && ANDATURE[explicitGait]) ? ANDATURE[explicitGait].vel : 1.25;
    const dur = z.dur || (d > 1e-4 ? d / velDef : 0.01);
    const speed = dur > 1e-4 ? (d / dur) / sc : 0;
    let gait = explicitGait || (ANDATURE[posa] ? posa : 'cammina');
    if (!explicitGait) {
      if (speed >= 2.15) gait = 'corsa';
      else if (speed >= 1.62) gait = 'fretta';
      else if (speed > 0 && speed <= 0.92 && gait === 'cammina') gait = 'passeggiata';
    }
    return { dx, dz, d, sc, dur, speed, gait };
  }

  const easeSnapOvr = u => {
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    if (u < 0.18) return -0.14 * Math.sin((u / 0.18) * Math.PI);
    if (u < 0.58) return Math.sin(((u - 0.18) / 0.40) * (Math.PI * 0.5)) * 1.12;
    const w = (u - 0.58) / 0.42;
    return 1 + 0.12 * Math.cos(w * Math.PI * 1.15) * (1 - ss(w));
  };

  function stato(A, t) {
    const a = A.a, s = {
      x: a.x, z: a.z, verso: a.verso ?? 0, yaw: a.yaw, spalle: a.spalle,
      posa: a.posa || A.opt.posa || 'auto', posaPrev: null, posaT: -99,
      andatura: a.andatura || (a.corsa ? 'corsa' : null), manoPosa: a.manoPosa, maniPosa: a.maniPosa,
      faccia: A.opt.faccia, facciaPrev: A.opt.faccia, bocca: a.bocca, facciaT: SC.da ?? 0, nextFacciaT: null,
      oggetto: 'oggetto' in a ? a.oggetto : A.opt.oggetto, oggettoMano: a.oggettoMano, porta: a.porta,
      ry: a.ry ?? -0.5, passo: a.passo || 0, visibile: a.visibile !== false,
      cammina: null, anticipo: null, assestamento: null,
      gesto: a.gesto ?? A.opt.gesto, gestoT: SC.da ?? 0, gestoFine: null,
      testa: a.testa || 0, testaPrev: a.testa || 0, testaT: -99,
      chino: a.chino ?? a.torsoPiega ?? A.opt.chino ?? 0, chinoPrev: a.chino ?? a.torsoPiega ?? A.opt.chino ?? 0, chinoT: -99,
      parla: a.parla, parlaT: SC.da ?? 0, sguardo: a.sguardo, sguardoPrev: a.sguardo, sguardoT: -99, nextSguardo: null, nextSguardoT: null, turnBlinkT: null,
      vfx: a.vfx, vfxT: SC.da ?? 0, goccia: a.goccia, clip: a.clip,
    };
    let cumSteps = 0, lastWalkEnd = -99, lastWalkInfo = null, stopZi = A.az.length;
    for (let zi = 0; zi < A.az.length; zi++) {
      const z = A.az[zi];
      if (t < z.t) {
        if (z.faccia && z.faccia !== s.faccia && s.nextFacciaT === null && (z.t - t) <= 0.14) s.nextFacciaT = z.t;
        if ('sguardo' in z && z.sguardo !== s.sguardo && s.nextSguardoT === null && (z.t - t) <= 0.12) { s.nextSguardo = z.sguardo; s.nextSguardoT = z.t; }
        stopZi = zi; break;
      }
      for (const k of ['verso', 'yaw', 'spalle', 'faccia', 'bocca', 'oggetto', 'oggettoMano', 'porta', 'ry', 'visibile', 'gesto', 'testa', 'chino', 'torsoPiega', 'parla', 'sguardo', 'vfx', 'goccia', 'manoPosa', 'maniPosa', 'clip']) if (k in z) {
        if (k === 'faccia' && z[k] !== s.faccia) { s.facciaPrev = s.faccia; s.facciaT = z.t; }
        if (k === 'sguardo' && JSON.stringify(z[k]) !== JSON.stringify(s.sguardo)) { s.sguardoPrev = s.sguardo; s.sguardoT = z.t; }
        if (k === 'gesto' && z[k] !== s.gesto) {
          if (z[k] == null && s.gesto) s.gestoFine = { gesto: s.gesto, startT: s.gestoT, endT: z.t };
          else if (z[k] != null) s.gestoFine = null;
          s.gestoT = z.t;
        }
        if (k === 'testa' && z[k] !== s.testa) { s.testaPrev = s.testa; s.testaT = z.t; }
        if ((k === 'chino' || k === 'torsoPiega') && z[k] !== s.chino) { s.chinoPrev = s.chino; s.chinoT = z.t; }
        if ((k === 'verso' && Math.abs((z.verso ?? 0) - (s.verso ?? 0)) >= 0.45) || (k === 'yaw' && s.yaw !== undefined && Math.abs((z.yaw ?? 0) - s.yaw) >= 35) || (k === 'sguardo' && z.sguardo !== s.sguardo)) {
          s.turnBlinkT = z.t;
        }
        if (k === 'parla' && z[k] && !s.parla) s.parlaT = z.t;
        if (k === 'vfx' && z[k] !== s.vfx) s.vfxT = z.t;
        s[k] = z[k];
        if (k === 'torsoPiega') s.chino = z[k];
      }
      if (!z.a) {
        if ('andatura' in z) s.andatura = z.andatura;
        else if ('corsa' in z) s.andatura = z.corsa ? 'corsa' : null;
      }
      if ('posa' in z) {
        if (POSE_CORPO.has(z.posa)) {
          if (z.posa !== s.posa) { s.posaPrev = s.posa; s.posaT = z.t; }
          s.posa = z.posa;
          if (!z.a) s.andatura = ANDATURE[z.posa] ? z.posa : (('andatura' in z) ? z.andatura : null);
        } else s.manoPosa = z.posa;
      }
      if (z.a) {
        const { dx, dz, d, sc, dur, speed, gait } = parametriCammino(A, s.x, s.z, s.posa, s.andatura, z);
        const nextZ = A.az.slice(zi + 1).find(q => q.a);
        const hasPrevCont = Math.abs(z.t - lastWalkEnd) <= 0.14;
        const hasNextCont = nextZ ? Math.abs(nextZ.t - (z.t + dur)) <= 0.14 : false;
        const uRaw = cl((t - z.t) / dur);
        const u = z.curva === 'lineare' ? uRaw : curvaPasso(uRaw, dur, !hasPrevCont, !hasNextCont);
        const strideM = ((ANDATURE[gait]?.passoM ?? 0.94) / 2) * sc;
        const distDone = d * u;
        const stepNow = d > 1e-4 ? Math.min(Math.max(distDone / strideM, (t - z.t) * 0.6), (t - z.t) * 6.4) : 0;
        const stepTot = d > 1e-4 ? Math.min(Math.max(d / strideM, dur * 0.6), dur * 6.4) : 0;
        s.x += dx * u; s.z += dz * u;
        if (uRaw < 1 && d > 1e-4) {
          s.cammina = [dx, dz, A.p3 ? d * u / (0.68 * sc) : (cumSteps + stepNow), gait, speed];
          s.andaturaGait = gait;
        } else {
          s.cammina = null;
          s.andaturaGait = null;
          cumSteps = (cumSteps + stepTot) % 2;
        }
        lastWalkEnd = z.t + dur;
        lastWalkInfo = d > 1e-4 ? { endT: lastWalkEnd, dx, dz, gait, hasNextCont, noSettle: z.assestamento === false } : null;
      }
    }
    // Transizioni morbide con leggero overshoot su inclinazioni testa/chino, cambio posa e uscita gesto
    if (t >= s.testaT && (t - s.testaT) < 0.22) s.testa = s.testaPrev + (s.testa - s.testaPrev) * easeSnapOvr((t - s.testaT) / 0.22);
    if (t >= s.chinoT && (t - s.chinoT) < 0.22) s.chino = s.chinoPrev + (s.chino - s.chinoPrev) * easeSnapOvr((t - s.chinoT) / 0.22);
    s.posaU = (s.posaPrev && t >= s.posaT && (t - s.posaT) < 0.26) ? Math.round(((t - s.posaT) / 0.26) * 30) / 30 : 1;
    if (s.posaU >= 1) s.posaPrev = null;
    if (s.gestoFine) {
      const dtF = t - s.gestoFine.endT;
      if (dtF >= 0 && dtF < 0.14) {
        s.gestoFineO = { gesto: s.gestoFine.gesto, t: Math.round((s.gestoFine.endT - s.gestoFine.startT) * 15) / 15, uOut: Math.round((dtF / 0.14) * 30) / 30 };
      }
    }
    const dtFac = t - (s.facciaT ?? -99);
    s.facciaDt = (dtFac >= 0 && dtFac < 0.24 && s.facciaT > (SC.da ?? 0) + 0.01) ? Math.round(dtFac * 30) / 30 : null;

    // Assestamento dopo la fermata (inerzia morbida + recupero su ginocchia e busto)
    if (!s.cammina && lastWalkInfo && !lastWalkInfo.hasNextCont && !lastWalkInfo.noSettle) {
      const settleDur = lastWalkInfo.gait === 'corsa' ? 0.30 : lastWalkInfo.gait === 'fretta' ? 0.24 : lastWalkInfo.gait === 'cammina' ? 0.20 : 0.14;
      const dtEnd = t - lastWalkInfo.endT;
      if (settleDur > 0 && dtEnd >= 0 && dtEnd < settleDur) {
        const uSet = dtEnd / settleDur;
        const kSet = Math.exp(-uSet * 3.8) * Math.cos(uSet * Math.PI * 1.45);
        s.assestamento = { k: Math.round(kSet * 20) / 20, u: Math.round(uSet * 20) / 20, dx: lastWalkInfo.dx, dz: lastWalkInfo.dz, gait: lastWalkInfo.gait };
      }
    }
    // Anticipo di slancio prima di tutte le camminate (caricamento leggero su passo normale, energico su fretta/corsa)
    if (!s.cammina) {
      const nextWalk = A.az.slice(stopZi).find(q => q.a);
      if (nextWalk && nextWalk.anticipo !== false && (nextWalk.t - lastWalkEnd) > 0.22) {
        const nw = parametriCammino(A, s.x, s.z, s.posa, s.andatura, nextWalk);
        const antDur = nw.gait === 'corsa' ? 0.22 : nw.gait === 'fretta' ? 0.19 : 0.16;
        const startAnt = Math.max((SC.da ?? 0) + 0.04, nextWalk.t - antDur);
        const effDur = nextWalk.t - startAnt;
        const ampScale = nextWalk.anticipo === true || nw.gait === 'corsa' ? 1.0 : nw.gait === 'fretta' ? 0.85 : nw.gait === 'cammina' ? 0.58 : 0.38;
        const rem = nextWalk.t - t;
        if (nw.d > 1e-4 && effDur >= 0.04 && t >= startAnt && rem > 0) {
          const pAnt = 1 - rem / effDur;
          const kAnt = Math.sin(pAnt * Math.PI * 0.85) * ampScale;
          s.anticipo = { k: Math.round(kAnt * 20) / 20, p: Math.round(pAnt * 20) / 20, dx: nw.dx, dz: nw.dz, gait: nw.gait };
        }
      }
    }
    return s;
  }
  // Rende la posizione occhi/sguardo e la lista delle azioni attive di un attore (con eye-lead prima della svolta e tracking oggetti)
  function calcolaSguardo(id, A, s, t, cy, eyeLeadX = 0, IR = null) {
    const Rx = [Math.cos(cy), -Math.sin(cy)];
    const mio = new THREE.Vector3(s.x, A.m.position.y + ALTT(A, s) * (A.m.scale.y || 1), s.z);
    const q20 = x => Math.round(Math.max(-1, Math.min(1, x)) * 20) / 20;
    const proj = (pt) => {
      const dx = pt.x - mio.x, dy = pt.y - mio.y, dz = pt.z - mio.z;
      const lat = dx * Rx[0] + dz * Rx[1], dist = Math.hypot(dx, dy, dz) || 1;
      return [q20((lat / dist) * 1.4), q20((-dy / dist) * 1.5)];
    };
    const resolveSg = (src) => {
      if (Array.isArray(src)) return [q20(+src[0] || 0), q20(+src[1] || 0)];
      if (typeof src === 'string') {
        const k = src.toLowerCase();
        if (k === 'camera' || k === 'cam') return [q20(-Math.max(-0.5, Math.min(0.5, A.v || 0))), 0];
        if (k === 'dx' || k === 'destra') return [0.8, 0];
        if (k === 'sx' || k === 'sinistra') return [-0.8, 0];
        if (k === 'su' || k === 'alto') return [0, -0.8];
        if (k === 'giu' || k === 'basso') return [0, 0.8];
        if (ATT[src]) return proj(occhiDi(ATT[src], t));
        if (OBJ[src]) { const ob = [].concat(OBJ[src])[0]; if (ob) return proj(ob.getWorldPosition(new THREE.Vector3())); }
      } else if (src && typeof src === 'object' && 'x' in src) return proj(src);
      return null;
    };
    const sgSrc = (s.nextSguardo !== null && s.nextSguardo !== undefined) ? s.nextSguardo : s.sguardo;
    let out = resolveSg(sgSrc);
    if (!out) {
      if (s.gesto === 'scrive' || s.gesto === 'legge') out = [q20(Math.sign(A.v || 1) * 0.25), 0.6];
      else {
        for (const [oid, O] of Object.entries(ATT)) {
          if (oid === id) continue;
          const os = stato(O, t);
          if (os.visibile === false) continue;
          const interagisce = (O.az || []).some(z => z.fai && t >= z.t && t <= z.t + (z.dur || 0.8) && (z.chi === id || z.per === id));
          if (os.parla || interagisce) { out = proj(occhiDi(O, t)); break; }
        }
      }
    } else if (t >= s.sguardoT && (t - s.sguardoT) < 0.14) {
      const pOut = resolveSg(s.sguardoPrev) || [0, 0], uSg = ss((t - s.sguardoT) / 0.14);
      out = [q20(pOut[0] + (out[0] - pOut[0]) * uSg), q20(pOut[1] + (out[1] - pOut[1]) * uSg)];
    }
    if (!out && t >= s.sguardoT && (t - s.sguardoT) < 0.14) {
      const pOut = resolveSg(s.sguardoPrev);
      if (pOut) { const uSg = ss((t - s.sguardoT) / 0.14); out = [q20(pOut[0] * (1 - uSg)), q20(pOut[1] * (1 - uSg))]; }
    }
    if (IR && IR.lookTarget && (IR.lookK || 0) > 0.05) {
      const isCam = typeof sgSrc === 'string' && /^(camera|cam)$/i.test(sgSrc);
      if (!isCam) {
        const lk = Math.min(1, IR.lookK);
        const pTgt = proj(IR.lookTarget);
        const base = out || [0, 0];
        out = [q20(base[0] * (1 - lk) + pTgt[0] * lk), q20(base[1] * (1 - lk) + pTgt[1] * lk)];
      }
    }
    if (Math.abs(eyeLeadX) > 0.08) {
      const base = out || [0, 0];
      return [q20(base[0] * 0.45 + eyeLeadX * 0.65), base[1]];
    }
    return out;
  }
  const LASCIATI = {}; let INMANO = [];   // oggetti tenuti in mano: si rimettono in mano anche DOPO le animazioni del luogo (M.tick)
  function aggiornaAttori(t, salto) {
    const R = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    // interazioni (interazioni.js): spinte, tirate, prese, contatti oggetti — calcolate prima di disegnare
    M.root.updateMatrixWorld(true);
    const IN = RICK_P ? interazioni(ATT, OBJ, t, (id, tOvr = t) => { const A = ATT[id], s = stato(A, tOvr); return { x: s.x, z: s.z, h: ALTT(A, s) * A.m.scale.y + 0.2 * A.m.scale.y }; }, { THREE }) : { R: {}, tenuto: {}, objFx: {} };
    const presa = (id, mano = 0) => {
      const A = ATT[id]; if (!A) return new THREE.Vector3();
      if (A.rick) {
        const m = A.m, u = m.userData;
        const pxPy = (u.maniPx && u.maniPx[mano]) || calcolaManoPx(A._ultimoO || A.opt, mano);
        const lx = (pxPy[0] - 256) / 512, ly = (1024 - pxPy[1]) / 512;
        const localPt = new THREE.Vector3(lx, ly, 0.03);
        m.updateMatrixWorld(true);
        return localPt.applyMatrix4(m.matrixWorld);
      }
      const s = stato(A, t), r = IN.R[id] || {}, cy = Math.atan2(camera.position.x - s.x, camera.position.z - s.z), sc = A.m.scale.y, sd = mano ? 1 : -1;
      return new THREE.Vector3(s.x + (r.dx || 0) + Math.cos(cy) * 0.3 * sc * sd + Math.sin(cy) * 0.12 * sc, 0.62 * sc, s.z + (r.dz || 0) - Math.sin(cy) * 0.3 * sc * sd + Math.cos(cy) * 0.12 * sc);
    };
    for (const [, h] of Object.entries(IN.tenuto)) {
      if (!h.lasciato && h.verso && ATT[h.verso.a]) {
        const sA = stato(ATT[h.id], t), sB = stato(ATT[h.verso.a], t);
        const pTarget = new THREE.Vector3(sA.x + (sB.x - sA.x) * h.verso.k, 0.72 * (ATT[h.id].m.scale.y || 1), sA.z + (sB.z - sA.z) * h.verso.k);
        const r = (IN.R[h.id] = IN.R[h.id] || { mani: [null, null], piega: 0, dx: 0, dz: 0, testa: 0 });
        r.mani[h.mano] = r.mani[h.mano] || { x: pTarget.x, y: pTarget.y, z: pTarget.z };
      }
    }
    for (const A of Object.values(ATT)) {
      const s = stato(A, t), m = A.m, a0 = A.a;
      if (A.p3) {
        m.position.x = s.x; m.position.z = s.z; m.visible = s.visibile;   // 3D: si gira davvero verso la camera (+ verso) o verso dove cammina
        const verso3 = s.verso ?? 0, verCam = Math.atan2(camera.position.x - s.x, camera.position.z - s.z);
        const yaw = s.cammina ? Math.atan2(s.cammina[0], s.cammina[1]) : (A.a.ry3 ?? verCam) + verso3 * 1.1;
        A.yaw = (A.yaw === undefined || salto) ? yaw : A.yaw + Math.atan2(Math.sin(yaw - A.yaw), Math.cos(yaw - A.yaw)) * Math.min(1, 8 / (S.fps || 30));
        m.rotation.y = A.yaw; let mani = null; const pt = a0.porta;   // "porta": l'oggetto sta davanti all'attore e le mani lo tengono davvero
        if (pt && OBJ[pt.id]) {
          const o = [].concat(OBJ[pt.id])[0], sc = m.scale.y, fx = Math.sin(A.yaw), fz = Math.cos(A.yaw), rx = fz, rz = -fx, av = (pt.avanti ?? 0.42) * sc, lt = (pt.lato || 0) * sc, hw = pt.largo ?? 0.2, hy = (pt.y ?? 0.02) + (pt.presa ?? 0.4), bk = pt.dietro || 0;
          o.position.set(s.x + fx * av + rx * lt, pt.y ?? 0.02, s.z + fz * av + rz * lt); o.rotation.y = A.yaw + (pt.ry || 0); o.visible = s.visibile;
          mani = [[o.position.x - rx * hw - fx * bk, hy, o.position.z - rz * hw - fz * bk], [o.position.x + rx * hw - fx * bk, hy, o.position.z + rz * hw - fz * bk]];
        }
        A.p3.stato({ faccia: s.faccia, posa: s.cammina ? 'cammina' : s.posa, passo: s.cammina ? s.cammina[2] : 0, t, guarda: verso3 * -0.6, gesto: s.gesto, testa: s.testa, parla: s.parla, sguardo: s.sguardo, clip: s.clip, mani }); continue;
      }
      if (A.rick) {
        const aid = Object.keys(ATT).find(k => ATT[k] === A); const IR = IN.R[aid] || null; if (IR) { s.x += IR.dx; s.z += IR.dz; }
        m.position.x = s.x; m.position.z = s.z; m.visible = s.visibile;
        m.rotation.order = 'YXZ';
        const dx = camera.position.x - s.x, dz = camera.position.z - s.z;
        const cy = Math.atan2(dx, dz);
        const dxz = Math.hypot(dx, dz) || 1e-4;
        const sc = m.scale.y || 1;
        const pitch = Math.atan2(camera.position.y - (m.position.y + 1.0 * sc), dxz);
        const maxAng = 35 * Math.PI / 180;
        const rx = -Math.max(-maxAng, Math.min(maxAng, pitch));
        m.rotation.y = cy;
        m.rotation.x = rx;
        m.updateMatrixWorld(true);
        assicuraOmbraRick(m);
        // dove guarda il personaggio nel mondo (0..360° rispetto alla camera): camminando = direzione del passo; interazione = verso oggetto/bersaglio; fermo = `yaw` o `spalle` o `verso`
        let baseAng;
        if (s.anticipo) baseAng = Math.atan2(s.anticipo.dx, s.anticipo.dz) - cy;
        else if (s.assestamento) baseAng = Math.atan2(s.assestamento.dx, s.assestamento.dz) - cy;
        else if (s.yaw !== undefined) baseAng = s.yaw * Math.PI / 180 - cy;
        else if (s.posa === 'spalle' || (s.spalle ?? 0) > 0) {
          const vSp = Math.max(-1, Math.min(1, s.verso ?? 0));
          baseAng = Math.atan2(vSp, -Math.sqrt(Math.max(0, 1 - vSp * vSp)));
        } else {
          baseAng = Math.asin(Math.max(-1, Math.min(1, (s.verso ?? 0) * 1.15)));
        }
        let targetAng = baseAng;
        if (s.cammina) targetAng = Math.atan2(s.cammina[0], s.cammina[1]) - cy;
        else if (IR && IR.dir && s.posa !== 'spalle' && (IR.inMovimento || s.yaw === undefined)) {
          const irAng = Math.atan2(IR.dir[0], IR.dir[1]) - cy;
          const dk = IR.dirK ?? 1;
          targetAng = dk >= 0.999 ? irAng : baseAng + Math.atan2(Math.sin(irAng - baseAng), Math.cos(irAng - baseAng)) * dk;
        }
        let dAngNow = 0, turnVel = 0;
        if (A.ang === undefined || salto) { A.ang = targetAng; A._turnBlinkT = -99; }
        else {
          dAngNow = Math.atan2(Math.sin(targetAng - A.ang), Math.cos(targetAng - A.ang));
          if (Math.abs(dAngNow) > 0.50 && (t - (A._turnBlinkT ?? -99)) > 0.35) A._turnBlinkT = t;
          const stepAng = Math.sign(dAngNow) * Math.min(Math.abs(dAngNow), 0.14 + Math.abs(dAngNow) * 0.36);
          A.ang += stepAng;
          turnVel = Math.round(Math.max(-1, Math.min(1, stepAng / 0.32)) * 20) / 20;
        }
        const cosRel = Math.cos(A.ang), sinRel = Math.sin(A.ang);
        A.v = Math.max(-1, Math.min(1, sinRel * (cosRel >= -0.1 ? 1.15 : 1.0)));
        const spalle = Math.round(cl(typeof s.spalle === 'number' ? s.spalle : (s.posa === 'spalle' ? 1 : (cosRel < -0.10 ? (-cosRel - 0.10) / 0.82 : 0))) * 20) / 20;
        const turnBlinkRef = !salto && A._turnBlinkT > -90 && Math.abs(t - A._turnBlinkT) <= 0.18 ? A._turnBlinkT : s.turnBlinkT;
        const bl = palpebraRick(t, A.seme, s.nextFacciaT, turnBlinkRef);
        const cammina = !!s.cammina || !!(IR && IR.inMovimento);
        const andatura = s.cammina ? (s.cammina[3] || s.andatura || 'cammina') : (IR && IR.inMovimento) ? 'cammina' : (ANDATURE[s.posa] ? s.posa : s.andatura || null);
        const passo = s.cammina ? Math.round((s.cammina[2] / 2) * 60) / 60 % 1 : (IR && IR.inMovimento) ? Math.round((IR.passo % 1) * 60) / 60 : 0;
        const talk = boccaParla(s, t, A.seme);
        const eyeLeadAng = Math.abs(dAngNow) > 0.14 ? Math.sin(dAngNow) * 1.35 : (s.anticipo ? Math.sin(Math.atan2(s.anticipo.dx, s.anticipo.dz) - cy - A.ang) * (s.anticipo.k || 0) : 0);
        const sguardo = calcolaSguardo(aid, A, s, t, cy, eyeLeadAng, IR);
        const sgTilt = sguardo ? Math.round((sguardo[0] * 3.4 + sguardo[1] * 2.0) * 2) / 2 : 0;
        const sgVerso = (!s.cammina && spalle < 0.35 && sguardo && Math.abs(sguardo[0]) > 0.25) ? sguardo[0] * 0.055 : 0;
        const gT = s.gesto ? Math.round(((t - (s.gestoT || 0))) * 30) / 30 : 0;
        const vT = (s.vfx || s.goccia) ? Math.floor((t - (s.vfxT || 0)) * 6) / 6 : 0;
        const respiro = 0;   // respiro disabilitato su richiesta dell'utente
        const pt = s.porta && OBJ[s.porta.id] && !s.porta.nascosto ? s.porta : null;
        const worldYaw = cy + A.ang;
        const o = { ...A.opt, seme: A.seme, x: 256, y: 1010, W: 270 * (A.opt.W || 1), verso: Math.round(Math.max(-1, Math.min(1, A.v + sgVerso)) * 40) / 40, spalle, turnVel, posa: s.posa || A.opt.posa || 'auto', posaPrev: s.posaPrev, posaU: s.posaU, andatura, anticipo: s.anticipo, assestamento: s.assestamento, respiro, gesto: s.gesto || null, gestoT: gT, gestoFine: s.gestoFineO || null, t: gT, faccia: s.faccia || A.opt.faccia, facciaPrev: s.facciaPrev, facciaDt: s.facciaDt, bocca: talk.bocca, sguardo, oggetto: s.oggetto, oggettoMano: s.oggettoMano, ...(pt ? { porta: true, portaAvanti: pt.avanti ?? 0.25, portaLargo: pt.largo ?? 0.30 } : {}), torsoPiega: Math.round((s.chino || 0) * 10) / 10, vfx: s.vfx, vfxT: vT, goccia: !!s.goccia, cammina, passo, palpebra: bl, inclina: Math.round(((s.testa || 0) + talk.nod + sgTilt) * 10) / 10, ...(s.manoPosa ? { manoPosa: s.manoPosa } : {}), ...(s.maniPosa ? { maniPosa: [...s.maniPosa] } : {}) };
        if (IR) {
          const Rx = [Math.cos(cy), -Math.sin(cy)];
          const cLoc = m.worldToLocal(camera.position.clone());
          const px = (p, i) => {
            if (!p) return null;
            if (p.laterale) return [256 + (i ? 1 : -1) * p.laterale * 512, 1024 - (p.y / sc) * 512];
            const pLoc = m.worldToLocal(new THREE.Vector3(p.x, p.y, p.z));
            const dzRay = cLoc.z - pLoc.z;
            const hitT = Math.abs(dzRay) > 0.15 ? (cLoc.z / dzRay) : 1;
            return [256 + (cLoc.x + (pLoc.x - cLoc.x) * hitT) * 512, 1024 - (cLoc.y + (pLoc.y - cLoc.y) * hitT) * 512];
          };
          let mp = IR.mani.map((p, i) => px(p, i));
          const ks = IR.mani.map(p => (p && typeof p.k === 'number') ? p.k : 1);
          const mPos = IR.maniPosa ? [...IR.maniPosa] : [null, null];
          const mCont = IR.maniContact ? [...IR.maniContact] : [false, false];
          if (mp[0] && mp[1] === null && mp[0][0] > 256) { mp = [null, mp[0]]; ks[1] = ks[0]; mPos[1] = mPos[0]; mPos[0] = null; mCont[1] = mCont[0]; mCont[0] = false; }
          if (mp[1] && mp[0] === null && mp[1][0] < 256) { mp = [mp[1], null]; ks[0] = ks[1]; mPos[0] = mPos[1]; mPos[1] = null; mCont[0] = mCont[1]; mCont[1] = false; }
          o.maniPx = mp.map((v, i) => {
            if (!v) return null;
            let tx = v[0], ty = v[1];
            if (ks[i] < 0.999) {
              const rest = calcolaManoPx(o, i);
              tx = rest[0] + (tx - rest[0]) * ks[i];
              ty = rest[1] + (ty - rest[1]) * ks[i];
            }
            return [Math.round(tx / 2) * 2, Math.round(ty / 2) * 2];
          });
          const mpOut = o.maniPosa ? [...o.maniPosa] : [null, null];
          if (mPos[0]) mpOut[0] = mPos[0];
          if (mPos[1]) mpOut[1] = mPos[1];
          if (mpOut[0] || mpOut[1]) o.maniPosa = mpOut;
          else if (IR.posa) o.manoPosa = IR.posa;
          if ((mp[0] && mCont[0]) || (mp[1] && mCont[1])) {
            o.maniContact = [Boolean(mp[0] && mCont[0]), Boolean(mp[1] && mCont[1])];
          }
          o.inclina += IR.testa;
          o.piega = IR.dir ? IR.piega * Math.sign((IR.dir[0] * Rx[0] + IR.dir[1] * Rx[1]) || 1) : 0; o.piega = Math.round(o.piega);
        }
        A._ultimoO = o; A._ultimoStato = { ...s, andatura, sguardo, bocca: talk.bocca, bl, inInterazione: !!IR };
        const key = JSON.stringify([o.verso, o.spalle, o.turnVel, o.posa, o.posaPrev, o.posaU, o.andatura, o.anticipo, o.assestamento, o.respiro, o.gesto, o.gestoT, o.gestoFine, o.faccia, o.facciaPrev, o.facciaDt, o.bocca, o.sguardo, o.oggetto, o.oggettoMano, o.porta, o.portaAvanti, o.portaLargo, o.torsoPiega, o.vfx, o.vfxT, o.goccia, o.cammina, o.passo, o.palpebra, o.inclina, zoomFaccia(m), o.maniPx, o.piega, o.manoPosa, o.maniPosa, o.maniContact]);
        if (key !== A.key) { A.key = key; const u = m.userData; u.ctx.clearRect(0, 0, u.cv.width, u.cv.height); disegnaRick(m, o); u.maniPx = o._maniPxEffettive; }
        if (s.porta && OBJ[s.porta.id]) {
          const o3 = [].concat(OBJ[s.porta.id])[0];
          if (o3) {
            const mp0 = m.userData.maniPx?.[0] || calcolaManoPx(o, 0), mp1 = m.userData.maniPx?.[1] || calcolaManoPx(o, 1);
            const lyMid = (1024 - (mp0[1] + mp1[1]) * 0.5) / 512;
            const waist = new THREE.Vector3(0, lyMid, 0).applyMatrix4(m.matrixWorld);
            const av = (s.porta.avanti ?? 0.25) * sc;
            const fx = Math.sin(worldYaw), fz = Math.cos(worldYaw);
            const carryBob = o.cammina ? Math.sin((o.passo || 0) * Math.PI * 2) * 0.008 * sc : 0;
            const carryRoll = o.cammina ? Math.cos((o.passo || 0) * Math.PI * 2) * 0.022 : 0;
            const handY = waist.y - (s.porta.yOff ?? 0.045) * sc + carryBob;
            const p3 = new THREE.Vector3(waist.x + fx * av, handY, waist.z + fz * av);
            const r3 = new THREE.Euler(0, worldYaw, carryRoll, 'YXZ');
            o3.visible = s.visibile && !s.porta.nascosto;
            o3.position.copy(p3);
            o3.rotation.copy(r3);
            if (o3.visible) { INMANO.push([o3, p3, r3]); aggiornaOmbraOggetto(o3); }
          }
        }
        continue;
      }
      m.position.x = s.x; m.position.z = s.z; m.rotation.y = s.ry; m.visible = s.visibile;
      let verso = s.verso, posa = s.posa, passo = s.passo;
      if (s.cammina) { const lat = (s.cammina[0] * R.x + s.cammina[1] * R.z) / Math.hypot(s.cammina[0], s.cammina[1]); verso = Math.abs(lat) > 0.35 ? Math.sign(lat) : 0; posa = 'cammina'; passo = s.cammina[2]; }   // chi cammina va di profilo nel verso in cui cammina (visto dalla camera)
      A.v = (A.v === null || salto) ? verso : A.v + Math.sign(verso - A.v) * Math.min(Math.abs(verso - A.v), 8 / (S.fps || 30));   // il verso gira in ~0,25 s, mai di colpo
      const o = { ...A.opt, verso: Math.round(A.v * 20) / 20, posa, faccia: s.faccia, oggetto: s.oggetto, passo: Math.round(passo * 50) / 50 }, key = JSON.stringify([o.verso, o.posa, o.faccia, o.oggetto, o.passo]);
      if (key !== A.key) { A.key = key; ridisegna(m, o); }
    }
    for (const [id, fx] of Object.entries(IN.objFx || {})) for (const x of [].concat(OBJ[id] || [])) {
      const o0 = O0[x.uuid];
      if ('visible' in fx) x.visible = fx.visible;
      if (fx.popU !== undefined && fx.popU < 1 && o0) { x.visible = true; x.scale.copy(o0.s).multiplyScalar(ss(fx.popU) * (1 + 0.25 * Math.sin(fx.popU * Math.PI))); }
      if (fx.rot && o0) x.rotation.set(o0.r.x + fx.rot[0], o0.r.y + fx.rot[1], o0.r.z + fx.rot[2]);
      if (fx.offset && o0) x.position.set(o0.p.x + fx.offset[0], o0.p.y + fx.offset[1], o0.p.z + fx.offset[2]);
      if ('apertura' in fx) x.userData.apertura = fx.apertura;
    }
    INMANO = []; for (const [ogg, h] of Object.entries(IN.tenuto)) {
      const o = [].concat(OBJ[ogg])[0]; if (!o) continue;
      if (h.lasciato) {
        if (h.dropAt) {
          const L = { p0: new THREE.Vector3(h.dropAt.x, h.dropAt.y, h.dropAt.z), targetY: h.dropAt.y, t0: t, dur: 0.01 };
          LASCIATI[ogg] = L;
          o.position.set(h.dropAt.x, h.dropAt.y, h.dropAt.z);
          aggiornaOmbraOggetto(o);
          continue;
        }
        if (!LASCIATI[ogg]) {
          const pInizio = (o.userData._ultimaPresa || presa(h.id, h.mano)).clone();
          const rc = new THREE.Raycaster(new THREE.Vector3(pInizio.x, pInizio.y + 0.05, pInizio.z), new THREE.Vector3(0, -1, 0), 0.001, 15);
          rc.camera = camera;
          M.root.updateMatrixWorld(true);
          const hits = rc.intersectObjects(M.root.children, true);
          let targetY = 0;
          for (const hit of hits) {
            let q = hit.object, skip = false;
            for (let p = q; p; p = p.parent) {
              if (p === o || (p.userData && (p.userData.card || p.userData.vivo === 'attore' || p.userData.ombra))) { skip = true; break; }
            }
            if (!skip && q.isMesh && q.visible && !(q.material && q.material.transparent && q.material.opacity < 0.2)) {
              const bb = new THREE.Box3().setFromObject(o);
              const bOff = isFinite(bb.min.y) ? Math.max(0, o.position.y - bb.min.y) : 0;
              targetY = hit.point.y + bOff;
              break;
            }
          }
          LASCIATI[ogg] = { p0: pInizio.clone(), targetY, t0: h.lasciatoT ?? t, dur: 0.3 };
        }
        const L = LASCIATI[ogg];
        const u = Math.min(1, Math.max(0, (t - L.t0) / L.dur));
        const fallU = u * u;
        o.position.set(L.p0.x, L.p0.y + (L.targetY - L.p0.y) * fallU, L.p0.z);
        aggiornaOmbraOggetto(o);
        continue;
      }
      delete LASCIATI[ogg];
      let p = presa(h.id, h.mano); if (h.verso) p = p.lerp(presa(h.verso.a, 0), h.verso.k); if (h.versoPonto) p = p.lerp(new THREE.Vector3(h.versoPonto.p.x, h.versoPonto.p.y, h.versoPonto.p.z), h.versoPonto.k); o.position.copy(p); o.userData._ultimaPresa = p.clone(); o.visible = true; INMANO.push([o, p.clone(), o.rotation.clone()]);
      aggiornaOmbraOggetto(o);
    }
  }
  // disegno Rick nella carta: un po' più scuro e saturo perché le carte prendono luce dalla scena (facce chiare che bruciavano: 12/11)
  // quanto è alto il personaggio sul fotogramma (0…1): sotto il 25% la faccia si ingrandisce fino a ×1,6 (a 8%)
  function zoomFaccia(m) {
    const a = new THREE.Vector3(), b = new THREE.Vector3(); m.getWorldPosition(a); b.copy(a); b.y += 1.7 * m.getWorldScale(new THREE.Vector3()).y;
    a.project(camera); b.project(camera); const h = Math.abs(b.y - a.y) / 2; return Math.round((1 + 0.6 * Math.min(1, Math.max(0, (0.25 - h) / 0.17))) * 10) / 10;
  }
  function disegnaRick(m, o) {
    o = { ...o, luce: o.luce ?? m.userData._luceDir ?? -1, zoomFaccia: o.zoomFaccia ?? zoomFaccia(m) }; const LR_ON = LUCE_RICK; const RL = { luminosita: LR_ON ? 0.98 : 0.74, saturazione: LR_ON ? 1.05 : 1.15, ...(S.rick_luce || {}) }; const U = m.material?.uniforms; if (U?.hlk) U.hlk.value = RL.bordo ?? 0; /* niente alone bianco sui bordi: Rick non ce l ha */ const u = m.userData; u.ctx.clearRect(0, 0, u.cv.width, u.cv.height); u.ctx.filter = `brightness(${RL.luminosita}) saturate(${RL.saturazione})`; u.ctx.save(); if (o.piega) { u.ctx.translate(256, 1010); u.ctx.rotate(o.piega * Math.PI / 180); u.ctx.translate(-256, -1010); } drawRick(u.ctx, o); u.ctx.restore(); u.ctx.filter = 'none';   // piega = tutto il corpo inclinato attorno ai piedi
    u.maniPx = o._maniPxEffettive;
    u.tex.needsUpdate = true; D.mappaBordi(u.cv, u.ec); u.et.needsUpdate = true;
  }
  function ridisegna(m, o) { if (m.userData.rick) { const p = Math.round((((o.passo || 0) / 2) % 1) * 30) / 30 % 1, v = m.userData.rick.versoCam ?? m.userData.rick.verso, sp = m.userData.rick.spalleCam ?? m.userData.rick.spalle ?? 0, g = o.andatura || 'cammina'; if (m.userData._fk === `${p}|${v.toFixed(2)}|${sp.toFixed(2)}|${g}`) return; m.userData._fk = `${p}|${v.toFixed(2)}|${sp.toFixed(2)}|${g}`; return disegnaRick(m, { ...m.userData.rick, cammina: true, andatura: g, passo: p, verso: v, spalle: Math.round(sp * 20) / 20 }); } const u = m.userData; u.ctx.clearRect(0, 0, u.cv.width, u.cv.height); drawOmino(u.ctx, o); u.tex.needsUpdate = true; D.mappaBordi(u.cv, u.ec); u.et.needsUpdate = true; }
  // ---- folla che cammina (M.follaAttraversa): avanza a 1,25 m/s e rientra dall'altro lato
  {
    const usati = new Set(); for (const a of SC.attori || []) { if (a.clip) usati.add(a.clip); for (const z of a.azioni || []) if (z.clip) usati.add(z.clip); }   // animazioni vere usate in questa scena
    if (usati.size) { const mancanti = await (await import('/web/animazioni.js')).preparaClip([...usati]); if (mancanti.length) console.error('[d] avviso: clip non trovati: ' + mancanti.join(', ')); }
  }
  const FOLLA = []; D.root.traverse(o => { if (o.userData.cammina) { FOLLA.push(o); o.userData.vivo = 'folla'; } });
  for (const A of Object.values(ATT)) A.m.userData.vivo = 'attore';
  // comparse (folla e personaggi messi dai luoghi) in stile Rick: posa asimmetrica fissa per comparsa, sguardo e cenni lenti a scatti lunghi (>=1,5 s) per non creare tremolio
  const COMPARSE = []; if (RICK_P) {
    const tipiAll = Object.keys(CAST_RICK), tipiFolla = tipiAll.filter(k => CAST_RICK[k].folla !== false), tipi = tipiFolla.length ? tipiFolla : tipiAll, FMAP = { sorriso: 'felice' }, att = new Set(Object.values(ATT).map(A => A.m));
    D.root.traverse(o => {
      if (!o.userData.card || att.has(o) || o.userData.rickProprio || o.userData.rick) return;   // ogni carta ha UN solo tipo, deciso una volta
      const op = o.userData.opt || {}, k = hash(o.uuid.slice(0, 8) + COMPARSE.length);
      const gestiComp = [null, null, 'spiega', 'pensa', null, 'legge'];
      o.userData.rick = { ...CAST_RICK[op.tipoRick && CAST_RICK[op.tipoRick] ? op.tipoRick : tipi[k % tipi.length]],   /* tipoRick: il luogo sceglie il tipo (cassiere = impiegato, non cuoco) */ posa: op.posa || 'auto', gesto: op.gesto ?? (op.posa && op.posa.startsWith('seduto') ? null : gestiComp[k % gestiComp.length]), faccia: FMAP[op.faccia] || op.faccia || 'neutro', verso: op.verso || 0, x: 256, y: 1010, seme: k };
      o.userData.rick.W = 270 * (o.userData.rick.W || 1); COMPARSE.push(o); disegnaRick(o, o.userData.rick);
    });
  }
  function aggiornaComparse(t) {
    for (const o of COMPARSE) {
      o.rotation.order = 'YXZ'; const w = new THREE.Vector3(); o.getWorldPosition(w);
      const dx = camera.position.x - w.x, dz = camera.position.z - w.z, cy = Math.atan2(dx, dz);
      const par = o.parent ? new THREE.Euler().setFromQuaternion(o.parent.getWorldQuaternion(new THREE.Quaternion())).y : 0;
      const dxz = Math.hypot(dx, dz) || 1e-4, sc = o.getWorldScale(new THREE.Vector3()).y || 1;
      const pitch = Math.atan2(camera.position.y - (w.y + 1.0 * sc), dxz), maxAng = 35 * Math.PI / 180;
      o.rotation.y = cy - par; o.rotation.x = -Math.max(-maxAng, Math.min(maxAng, pitch));
      assicuraOmbraRick(o);
      const r = o.userData.rick, c = o.userData.cammina;
      if (c) { const relC = (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2) - cy, cosC = Math.cos(relC); r.versoCam = Math.max(-1, Math.min(1, Math.sin(relC) * (cosC >= -0.1 ? 1.15 : 1.0))); r.spalleCam = cosC < -0.10 ? Math.min(1, (-cosC - 0.10) / 0.82) : 0; } else { r.versoCam = r.verso; r.spalleCam = r.spalle || 0; }
      if (!c) {
        const bl = palpebraRick(t, r.seme), z = zoomFaccia(o);
        const step = Math.floor((t + (r.seme % 9) * 0.41) / 2.4);
        const sg = step % 3 === 1 ? [((r.seme + step) % 2 ? 0.4 : -0.4), 0] : [0, 0];
        const gt = r.gesto ? Math.floor(t * 6) / 6 : 0;
        const ck = JSON.stringify([bl, z, sg, gt]);
        if (ck !== r.ck) { r.ck = ck; disegnaRick(o, { ...r, palpebra: bl, sguardo: sg, gestoT: gt, t: gt }); }
      }
    }
  }
  const VICINI = () => [...Object.values(ATT).filter(A => A.m.visible).map(A => A.m.position), ...FOLLA.map(m => m.position)];   // per i sensori delle porte
  function aggiornaFolla(t) { for (const m of FOLLA) { const c = m.userData.cammina, L = c.max - c.min, vel = Math.abs(c.vel || 1.25), ga = vel >= 2.15 ? 'corsa' : vel >= 1.62 ? 'fretta' : vel <= 0.92 ? 'passeggiata' : 'cammina', stepM = ((ANDATURE[ga]?.passoM ?? 0.94) / 2) * (m.scale?.y || 1); m.position.x = c.min + ((((c.x0 - c.min + c.dir * c.vel * t) % L) + L) % L); ridisegna(m, { ...m.userData.opt, andatura: ga, passo: (m.userData.opt.passo || 0) + (vel * t) / stepM }); } }
  // ---- oggetti che reagiscono alle parole: { id, t, fai: 'mostra' | 'nascondi' | 'pop', dur } e { id, t, a: [x, y, z], dur }
  const EV = [...(SC.oggetti || [])].sort((a, b) => a.t - b.t), O0 = {};
  function aggiornaOggetti(t) {
    for (const id in OBJ) for (const x of [].concat(OBJ[id] || [])) { const k = x.uuid; O0[k] = O0[k] || { v: x.visible, p: x.position.clone(), s: x.scale.clone(), r: x.rotation.clone() }; x.visible = O0[k].v; x.position.copy(O0[k].p); x.scale.copy(O0[k].s); x.rotation.copy(O0[k].r); }
    const visti = {}; for (const e of EV) { if (!(e.id in visti)) { visti[e.id] = 1; if ((e.fai === 'pop' || e.fai === 'mostra') && t < e.t) for (const x of [].concat(OBJ[e.id] || [])) x.visible = false; } }   // ciò che compare su una parola parte nascosto
    for (const e of EV) {
      if (t < e.t) break; for (const x of [].concat(OBJ[e.id] || [])) {
        const u = cl((t - e.t) / (e.dur || 0.35));
        if (e.fai === 'mostra') x.visible = true; if (e.fai === 'nascondi') x.visible = false;
        if (e.fai === 'pop') { x.visible = true; x.scale.copy(O0[x.uuid].s).multiplyScalar(u < 1 ? ss(u) * (1 + 0.25 * Math.sin(u * Math.PI)) : 1); }
        if (e.a) x.position.lerp(new THREE.Vector3(...e.a), ss(cl((t - e.t) / (e.dur || 1))));
      }
    }
    const ap = {}; for (const e of EV) { if (e.fai !== 'apri' && e.fai !== 'chiudi') continue; if (t < e.t) break; const to = e.fai === 'apri' ? 1 : 0, da = ap[e.id] ? ap[e.id].to : 0; ap[e.id] = { to, v: da + (to - da) * ss(cl((t - e.t) / (e.dur || 0.8))) }; }   // meccanismi di library/vivi: «apri»/«chiudi» sulla parola
    for (const id in OBJ) for (const x of [].concat(OBJ[id] || [])) { if (ap[id]) x.userData.apertura = ap[id].v; else delete x.userData.apertura; }
  }
  // ---- camera continua: tappe { t, pos, guarda, fov } oppure { t, su: 'attore', dist, angolo, alt, guardaAlt, fov }; `taglio: true` = stacco netto
  if (espandiPreset(SC, ATT, stato, THREE)) SC.stile_camera = SC.stile_camera || "rick";   // preset di camera (camera_preset.js) → tappe normali
  const CAM = [...(SC.camera || [])].sort((a, b) => a.t - b.t);
  // [utente 13/11] "guarda_ogg": "<id di OBJ>" — la camera a mano tiene d'occhio un OGGETTO del luogo mentre si muove (la scheggia che galleggia): resta nella stessa ripresa e lo segue,
  // invece di tagliare a ogni frase. La mira è ammorbidita (0,3 s) e aggiornata una volta per fotogramma; se l'oggetto non c'è o è nascosto vale "guarda".
  const MIRA = {};
  function aggiornaMira(t) {
    for (const k of CAM) {
      const id = k.guarda_ogg; if (!id) continue; const o = [].concat(OBJ[id])[0]; let vis = !!o; for (let q = o; q && vis; q = q.parent) if (!q.visible) vis = false;
      if (!vis) { delete MIRA[id]; continue; } const w = o.getWorldPosition(new THREE.Vector3()), m = MIRA[id], dt = m ? t - m.t : -1;
      if (!m || dt <= 0 || dt > 0.2) MIRA[id] = { t, v: w }; else { m.v.lerp(w, 1 - Math.exp(-dt / 0.3)); m.t = t; }
    }
  }
  function tappa(k, t) {
    const tM = k._mossaT0 ?? k.t, us = k.salita ? ss(cl((t - tM) / Math.max(0.5, k.salitaDur || 1.5))) : 0;
    if (!k.su) {
      const p = new THREE.Vector3(...k.pos); if (k.salita) p.y += k.salita * (k.salitaArriva ? us - 1 : us);
      return [p, k.guarda_ogg && MIRA[k.guarda_ogg] ? MIRA[k.guarda_ogg].v.clone() : new THREE.Vector3(...k.guarda), k.fov || 85];
    }
    const A = ATT[k.su]; if (!A) throw new Error('camera: attore sconosciuto ' + k.su); const s = stato(A, k.segue ? t : k.t), sc = A.m.scale.y, fov = k.fov || (k.testa ? 50 : 85);
    const hT = ALTT(A, s) * sc, g = new THREE.Vector3(s.x, (k.guardaAlt ?? (k.testa ? hT / sc : 1.25)) * sc, s.z);
    const uo = k.orbita ? ss(cl((t - tM) / Math.max(0.5, (k.orbitaDur || 1) - (tM - k.t)))) : 0, a = ((k.angolo || 0) + (k.orbita || 0) * uo) * Math.PI / 180;   /* [13/11] arco C2 con smootherstep: partenza e arrivo fluidi senza scatti */
    // "testa": 0.20 = la testa larga il 20% del quadro (primo piano dello stile di Rick; 0.08-0.12 campo largo): la distanza la calcola il motore
    const d = k.testa ? (TESTA(A) / (k.testa * 2 * Math.tan(fov * Math.PI / 360) * camera.aspect)) : (k.dist ?? 3);
    const alt = (k.alt ?? (k.testa ? g.y + .05 : 1.6)) + (k.salita ? k.salita * us : 0);
    const p0 = new THREE.Vector3(s.x + Math.sin(a) * d, alt, s.z + Math.cos(a) * d), p1 = limita(g, p0, k), r = p0.distanceTo(g) / Math.max(0.3, p1.distanceTo(g));
    // se il muro ha avvicinato la camera, allarga l'obiettivo per tenere la stessa inquadratura (fino a 100°)
    return [p1, g, r > 1.02 ? Math.min(100, 2 * Math.atan(Math.tan(fov * Math.PI / 360) * r) * 180 / Math.PI) : fov];
  }
  // [12/11] la camera non passa i muri: raggio dal soggetto verso la camera; se tocca un muro/soffitto/oggetto grande prima, la camera si ferma 0,3 m davanti.
  // (i muri guardano verso l'interno, quindi un raggio che esce dalla stanza li tocca). Calcolato una volta per tappa (o ogni 0,25 s se segue). "muri": false lo spegne.
  const RCm = new THREE.Raycaster(), LIM = new Map();
  function limita(g, p, k) {
    if (k.muri === false || SC.muri === false) return p; const dir = p.clone().sub(g), L = dir.length(); if (L < 0.5) return p; dir.divideScalar(L);
    const c = LIM.get(k); if (c && (!k.segue || Math.abs(c.t - g.x * 1000 - g.z) < 1e-6)) return g.clone().addScaledVector(dir, Math.min(L, c.d));
    M.root.updateMatrixWorld(true);   // le posizioni del mondo devono essere aggiornate (alla prima tappa non lo erano: camera troppo vicina)
    const att = new Set(Object.values(ATT).map(A => A.m));
    const dentro = o => { for (let q = o; q; q = q.parent) if (att.has(q) || q.userData.card || q.userData.vivo === 'attore' || /^comparsa/.test(q.name || '')) return true; return false; };
    const rayDist = (dv, maxL) => {
      RCm.camera = camera; RCm.set(g, dv); RCm.far = maxL; for (const h of RCm.intersectObjects(M.root.children, true)) {
        const o = h.object;
        if (!o.isMesh || !o.visible || (o.material && o.material.transparent) || dentro(o)) continue;
        const bb = new THREE.Box3().setFromObject(o), z = bb.getSize(new THREE.Vector3()); if (Math.max(z.x, z.y, z.z) < 1.2) continue;
        return Math.max(0.6, h.distance - 0.3);
      } return maxL;
    };
    let d = rayDist(dir, L);
    if (k.orbita && !k.segue) {
      const a0 = k.angolo || 0, yD = p.y - g.y, hL = Math.hypot(p.x - g.x, p.z - g.z);
      for (const q of [0.25, 0.5, 0.75, 1]) {
        const ar = (a0 + k.orbita * q) * Math.PI / 180, dv = new THREE.Vector3(Math.sin(ar) * hL, yD, Math.cos(ar) * hL).normalize();
        d = Math.min(d, rayDist(dv, L));
      }
    }
    LIM.set(k, { d, t: g.x * 1000 + g.z }); return g.clone().addScaledVector(dir, d);
  }
  // [11/11] profondità di campo per tappa: "sfocatura": px a 1080 (0 = nitido), oppure "auto" (valori misurati sui video di Rick, mromidev depth.md:
  // primo piano 13, mezza figura 11, figura intera 7, campo largo 0, decisi dalla testa nel quadro: ≥18%, ≥12%, ≥7%). Si mette nella tappa, nella scena o nella storia. Fuoco sul punto guardato (gli occhi nei primi piani).
  function SF(k) { const v = k.sfocatura ?? SC.sfocatura ?? S.sfocatura ?? ((LUCE_RICK || LC_LENTE) ? 'intelligente' : 0);   /* [utente 13/11] con Rick la "camera vera" ("intelligente") è accesa di base ("sfocatura": 0 la spegne, "vera" usa l'ottica classica) */ return v === 'auto' || v === 'vera' || v === 'intelligente' ? v : (+v || 0); }
  function TESTA(A) { return (A.rick ? 270 / 512 * (A.opt.W || 1) : A.p3 ? 0.9 : 0.8) * A.m.scale.y; }   // Rick: testa larga 270 px su una carta di 512 px = 1 m
  function ALTT(A, s = null) {
    if (!A.rick) return A.p3 ? 1.72 : 1.3;
    const o = A.opt, W = 270 * (o.W || 1), TS = TESTE[o.testa] || TESTE.tonda, CS = CORPI[o.corpo] || CORPI.fagiolo;
    const gambe = W * 0.93 * 1.4 * (o.gambe ?? CS.gambe ?? 1), busto = W * 0.93 * 1.1 * (o.alto ?? CS.alto ?? 1);
    const drop = sedutoDropPx({ ...o, W, posa: (s && s.posa) || o.posa });
    return (1024 - (1010 - gambe + drop - busto - W * TS.hw * 0.36)) / 512;
  }   // altezza centro testa/occhi esatta sul piano 512 px/m per ogni corporatura e posa (in piedi o seduto)
  // ---- STILE DI CAMERA «rick» (11/11, dalla skill ricksclips-short-style): "stile_camera": "rick" nella storia o nella scena.
  // Ogni tappa è un'inquadratura che parte sulla sua parola: la camera ARRIVA veloce e poi rallenta (ARRIVO), dentro l'inquadratura scivola
  // con spinta "zoom" (%/s) e panoramica "pan" ([px/s orizz., px/s vert.] a 1080x1920, misure di Rick), e passa alla tappa dopo con una
  // planata breve ("planata": s, 0,8 di default) invece di muoversi per tutto l'intervallo. "glide": "lens" (gira e zooma: camera ferma) o
  // "dolly" (la camera si sposta davvero). La camera viva in metri si spegne: la sostituisce questa deriva.
  const RICK = (SC.stile_camera ?? S.stile_camera) === 'rick', RC = { tratto: 18, zoomMin: 5, zoomMax: 20, panTratto: 110, panMin: 45, panMax: 115, planata: 0.8, arrivo: 0.7, rampa: 0.25, glide: 'lens', ...(S.camera_rick || {}), ...(SC.camera_rick || {}) };
  // [13/11] integrale normalizzato su [0, dur] (valore a dur == dur) con partenza morbida C2: elimina gli strappi al fotogramma 0 e al passaggio tl = 0
  function curvaTempo(tl, dur, fnRate, tailRate, rampSec) {
    if (rampSec > 0 && tl <= 0) return 0;
    const N = 32, r = rampSec > 0 ? Math.min(rampSec, dur * 0.38) : 0;
    const gate = x => (r > 0 && x < r) ? ss(cl(x / r)) : 1;
    let tot = 0; const hd = dur / N;
    for (let i = 0; i < N; i++) { const xm = (i + 0.5) * hd; tot += fnRate(xm / dur) * gate(xm) * hd; }
    const sc = dur / (tot || dur);
    if (tl <= 0) return tl * fnRate(0) * sc;
    const hi = Math.min(tl, dur), h = hi / N; let acc = 0;
    for (let i = 0; i < N; i++) { const xm = (i + 0.5) * h; acc += fnRate(xm / dur) * gate(xm) * sc * h; }
    return acc + Math.max(0, tl - dur) * tailRate * sc;
  }
  function zoomVelSpec(K) {
    const zv = K && K.zoom_veloce; if (!zv) return null;
    const o = zv === true ? {} : (typeof zv === 'number' ? { fattore: zv } : zv);
    return {
      t0: o.t ?? K.t, dur: Math.max(0.45, o.dur ?? 0.65), fattore: Math.max(1.05, o.fattore ?? 1.42),
      su: o.su !== undefined ? o.su : ((K.preset_nome === 'zoom_soggetto' || K.preset_nome === 'snap_zoom') ? K.su : null),
      punto: o.punto || null, segue: o.segue, glide: o.glide || 'lens'
    };
  }
  function zoomVelTarget(K, ZV, t) {
    if (ZV.punto) return new THREE.Vector3(...ZV.punto);
    if (ZV.su && ATT[ZV.su]) {
      const A = ATT[ZV.su], tm = (ZV.segue ?? K.segue) ? t : Math.max(K.t, ZV.t0), s = stato(A, tm), scA = A.m.scale.y;
      return new THREE.Vector3(s.x, A.m.position.y + (K.guardaAlt ?? (A.rick ? ALTT(A) / scA : A.p3 ? 1.45 : 1.1)) * scA, s.z);
    }
    return null;
  }
  function deriva(k, t, P) {
    const K = CAM[k], tM = K._mossaT0 ?? K.t, tl = t - tM, dur = Math.max(.5, (CAM[k + 1] ? CAM[k + 1].t : SC.a) - tM), ZV = zoomVelSpec(K);
    /* [utente 13/11] "curva": "frena" = partenza morbida poi picco veloce subito e rallenta alla fine (non si ferma mai del tutto) */
    const FR = !ZV && (K.curva ?? RC.curva) === 'frena', gA = K.arrivo ?? RC.arrivo, rmp = K.rampa ?? RC.rampa ?? 0.25;
    const fRate = FR ? u => 0.15 + 2.125 * Math.pow(Math.max(0, 1 - u), 1.5) : u => { const sm = cl((u - 0.15) / 0.25); return 1 + gA * (1 - sm * sm * (3 - 2 * sm)); };
    const tw0 = ZV ? tl : curvaTempo(tl, dur, fRate, FR ? 0.15 : 1, rmp), AUTO_TR = !ZV && K.zoom === undefined && RC.zoom === undefined;
    /* [13/11] "ancora": dove sta l'inquadratura scritta dentro la mossa: "mezzo" (di base col tratto fisso), "inizio", "fine" (la mossa ARRIVA lì: rivelazioni) */
    const anc = K.ancora ?? (AUTO_TR ? 'mezzo' : 'inizio'), tw = ZV || anc === 'inizio' ? tw0 : tw0 - (anc === 'fine' ? 1 : 0.5) * dur;   /* [utente: inquadrature ampie] col tratto fisso l'inquadratura scritta è il PUNTO DI MEZZO */
    /* [utente 12/11, misura su 4 Short di Rick, 75 inquadrature: camera_rick_analisi.py] la spinta non è fissa: ogni inquadratura percorre circa lo stesso TRATTO
       (+18% di ingrandimento, ~110 px di panoramica), quindi corta = veloce (fino a 20 %/s) e lunga = lenta (5 %/s). "camera_rick": { "zoom": 3, "pan": 40 } rimette i valori fissi di prima. */
    const [pos0, tgt0, fov0] = P, refPt = ZV ? zoomVelTarget(K, ZV, t) : null;
    const uZ = ZV ? cl((t - ZV.t0) / ZV.dur) : 0, hZ = uZ * uZ * uZ * (10 + uZ * (-15 + 6 * uZ));
    const scFast = ZV ? Math.exp(Math.log(ZV.fattore) * hZ) : 1;
    /* [13/11] mosse (camera_preset.js MOSSE): "tratto" (% totali, negativo = allarga) e "panTratto" ([px, px] totali) della tappa; "verso" gira l'orizzontale; "verso_a" punta la mossa verso un attore o un punto */
    const z = K.zoom ?? (K.tratto !== undefined ? Math.sign(K.tratto) * Math.min(RC.zoomMax, Math.abs(K.tratto) / dur) : (ZV ? (RC.zoom ?? 4) : (RC.zoom ?? Math.max(RC.zoomMin, Math.min(RC.zoomMax, RC.tratto / dur)))));
    const panDef = ZV ? (refPt ? 0 : PAN_SEGNO * 25) : (PAN_SEGNO * (RC.pan ?? Math.max(RC.panMin, Math.min(RC.panMax, RC.panTratto / dur))));
    let pn = K.pan ?? (K.panTratto ? K.panTratto.map((v, j) => Math.sign(v) * (j ? 1 : (K.verso ?? 1)) * Math.min(RC.panMossaMax ?? 200, Math.abs(v) / dur)) : [panDef, 0]);
    if (K.verso_a && !K.pan) {
      const Tp = Array.isArray(K.verso_a) ? new THREE.Vector3(...K.verso_a) : (ATT[K.verso_a] ? occhiDi(ATT[K.verso_a], K.t) : null);
      if (Tp) {
        const d0 = P[1].clone().sub(P[0]).normalize(), r0 = new THREE.Vector3().crossVectors(d0, new THREE.Vector3(0, 1, 0)).normalize(), u0 = new THREE.Vector3().crossVectors(r0, d0).normalize();
        const v = Tp.sub(P[1]), cx = v.dot(r0), cy = v.dot(u0), n = Math.hypot(cx, cy) || 1, m = Math.hypot(pn[0], pn[1]); pn = [cx / n * m, cy / n * m];
      }
    }
    const   /* [utente 12/11] niente destra-sinistra a caso: stessa direzione in tutta la scena */ scSlow = Math.exp(Math.log1p(z / 100) * tw), sc = scSlow * scFast, dx = pn[0] * tw, dy = pn[1] * tw;
    const tgt = refPt ? tgt0.clone().lerp(refPt, hZ) : tgt0.clone(), dir = tgt.clone().sub(pos0), Ld = dir.length() || 1; dir.divideScalar(Ld);
    const Lref = refPt ? pos0.distanceTo(refPt) : Ld;
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(right, dir).normalize();
    if (K.vertigine) { /* [13/11] vertigine: la camera avanza e l'obiettivo si allarga, il soggetto resta grande uguale e il fondo scappa */
      const d = Math.max(1.2, Lref / Math.max(1, sc)), fovV = Math.min(100, Math.max(22, 2 * Math.atan(Math.tan(fov0 * Math.PI / 360) * Lref / d) * 180 / Math.PI)), fp = pos0.clone().addScaledVector(dir, Lref);
      return [fp.clone().addScaledVector(dir, -d), fp, fovV];
    }
    if ((K.glide ?? RC.glide) === 'dolly') { /* [12/11] zoom_veloce usa focale (lens) di default così insegne/soffitti vicini non schizzano a 50+ px/f */
      const scPos = ZV && ZV.glide !== 'dolly' ? scSlow : sc, dRaw = Lref / Math.max(1, scPos), dMin = 1.2, d = Math.max(dMin, dRaw);
      const lensOver = dRaw < dMin ? dMin / dRaw : 1, lensFast = (ZV && ZV.glide !== 'dolly') ? scFast : 1, lensScale = (scPos < 1 ? scPos : 1) * lensOver * lensFast;
      const fovD = Math.min(100, Math.max(22, 2 * Math.atan(Math.tan(fov0 * Math.PI / 360) / lensScale) * 180 / Math.PI));
      const w = 2 * d * Math.tan(fovD * Math.PI / 360) / 1920, o = right.multiplyScalar(dx * w).addScaledVector(up, dy * w);
      const focusPt = pos0.clone().addScaledVector(dir, Lref).add(o); return [focusPt.clone().addScaledVector(dir, -d), focusPt, fovD];
    }
    const f2 = Math.min(100, Math.max(22, 2 * Math.atan(Math.tan(fov0 * Math.PI / 360) / sc) * 180 / Math.PI)), w = 2 * Ld * Math.tan(f2 * Math.PI / 360) / 1920;
    return [pos0.clone(), tgt.addScaledVector(right, dx * w).addScaledVector(up, dy * w), f2];
  }
  // [utente 12/11, misure Rick motion.md] le planate tra due tappe non durano sempre 0,8 s: la durata segue quanto si sposta l'immagine,
  // con curva simmetrica (salita = discesa, come Rick: ~10 f + 10 f) e picco ~20 px/f; se anche lunga resta sopra 36 px/f (p90 di Rick) diventa uno stacco.
  const PAN_SEGNO = (SC.camera_rick?.verso ?? S.camera_rick?.verso) ?? ((+(q.get('scena') || 0)) % 2 ? -1 : 1);
  const PLANATA = [];   // per tappa k (k ≥ 1): { dur, taglio }
  function spostamentoPx(a, b) {
    const fa = a[2], fb = b[2], asp = 1080 / 1920, hf = 2 * Math.atan(Math.tan(fa * Math.PI / 360) * asp);
    const da = a[1].clone().sub(a[0]), db = b[1].clone().sub(b[0]), La = da.length() || 1, Lb = db.length() || 1, ang = da.angleTo(db), rot = ang / hf * 1080;
    const cam = new THREE.PerspectiveCamera(fa, asp, 0.05, 500); cam.position.copy(a[0]); cam.lookAt(a[1]); cam.updateMatrixWorld(true);
    const nb = b[1].clone().project(cam), sh = (nb.z < 1 && ang < 1.05) ? Math.hypot(nb.x * 540, nb.y * 960) : 0;   // evita esplosione tan(~90°) nei voli ampi
    const tr = a[0].distanceTo(b[0]) / Math.max(1.2, Math.min(La, Lb)) * 540 / Math.tan(hf / 2);   // traslazione della camera rispetto alla distanza del soggetto
    const stessoSogg = a[1].distanceTo(b[1]) < 0.8;
    const zo = Math.abs(Math.log(Math.tan(fa * Math.PI / 360) / Math.tan(fb * Math.PI / 360))) * 734 + (stessoSogg ? Math.abs(Math.log(La / Lb)) * 734 : 0);
    return Math.max(rot, sh, tr * 0.6) + zo;
  }
  if (RICK) for (let k = 1; k < CAM.length; k++) {
    const K = CAM[k]; if (K.taglio) { PLANATA[k] = { dur: 0, taglio: true }; continue; }
    const a = deriva(k - 1, K.t, tappa(CAM[k - 1], K.t)), b = deriva(k, K.t, tappa(K, K.t)), px = spostamentoPx(a, b), fps = S.fps || 30;
    const La = a[1].distanceTo(a[0]), Lb = b[1].distanceTo(b[0]), slerp = a[1].distanceTo(b[1]) > 0.7 || Math.max(La / Math.max(0.2, Lb), Lb / Math.max(0.2, La)) > 1.35;
    /* [utente 13/11] "volo": true | secondi — la camera è un uccello: vola veloce dall'inquadratura prima a questa, partenza e atterraggio C2 fluidi */
    if (K.volo) {
      const lib = Math.max(0.3, ((CAM[k + 1] ? CAM[k + 1].t : SC.a) - K.t) * 0.8);
      const durAcc = Math.sqrt(6.8 * px / (RC.voloAccMax ?? 15)) / fps;
      const dur = Math.min(lib, typeof K.volo === 'number' ? K.volo : Math.max(RC.voloMin ?? 0.68, Math.min(RC.voloMax ?? 1.5, Math.max(px / (RC.voloVel ?? 42) / fps, durAcc))));
      PLANATA[k] = { dur, taglio: false, volo: true, slerp }; K._mossaT0 = K.t + dur * 0.52; console.log(`[d] camera: tappa ${k} a ${K.t.toFixed(2)} s, VOLO di ${px.toFixed(0)} px in ${dur.toFixed(2)} s (media ${(px / dur / fps).toFixed(0)} px/f, C2 fluido)`); continue;
    }
    if (K.planata !== undefined) { PLANATA[k] = { dur: K.planata, taglio: false, slerp }; continue; }
    const libero = Math.min(K.t - CAM[k - 1].t, (CAM[k + 1] ? CAM[k + 1].t : SC.a) - K.t) * 0.9 * 2;   // la planata è centrata sul cambio: metà prima, metà dopo
    const durAcc = Math.sqrt(5.774 * px / (RC.accMax ?? 5.0)) / fps;
    let dur = Math.max(RC.planataMin ?? 0.75, Math.min(RC.planataMax ?? 2.2, Math.max(1.875 * px / (RC.picco ?? 20) / fps, durAcc))); dur = Math.min(dur, libero);
    const picco = 1.875 * px / Math.max(1, dur * fps), taglio = picco > (RC.piccoMax ?? 36);
    PLANATA[k] = { dur: taglio ? 0 : dur, taglio, slerp };
    if (taglio || dur > 0.85) console.log(`[d] camera: tappa ${k} a ${K.t.toFixed(2)} s, spostamento ${px.toFixed(0)} px → ${taglio ? 'STACCO (planata troppo veloce: ' + picco.toFixed(0) + ' px/f; Rick qui fa una dissolvenza: metti la tappa in una scena nuova con "passaggio": "dissolvi")' : 'planata ' + dur.toFixed(2) + ' s, picco ' + picco.toFixed(0) + ' px/f'}`);
  }
  // [utente 13/11] FLUIDITÀ: ogni passaggio tra due tappe ha la sua finestra di tempo [inizio, fine] dentro [SC.da, SC.a], mai sovrapposta.
  const FIN = []; if (RICK) {
    for (let k = 1; k < CAM.length; k++) {
      const p = PLANATA[k]; if (CAM[k].taglio || p?.taglio) continue; const d = p?.dur ?? RC.planata; if (!(d > 0)) continue;
      FIN[k] = p?.volo ? [Math.max(SC.da, CAM[k].t), Math.min(SC.a, CAM[k].t + d)] : [Math.max(SC.da, CAM[k].t - d / 2), Math.min(SC.a, CAM[k].t + d / 2)];
    }
    for (let k = 1; k < CAM.length - 1; k++) {
      const A = FIN[k], B = FIN[k + 1]; if (!A || !B || B[0] >= A[1]) continue;
      if (PLANATA[k]?.volo) { const mx = Math.max(A[0] + 0.4, B[1] - 0.55); A[1] = Math.min(A[1], mx); B[0] = A[1]; CAM[k]._mossaT0 = CAM[k].t + (A[1] - A[0]) * 0.52; }
      else if (PLANATA[k + 1]?.volo) { A[1] = B[0]; }
      else { A[1] = B[0] = (A[1] + B[0]) / 2; }
    }
  }
  function idx(t) { let i = 0; while (i < CAM.length - 1 && t >= CAM[i + 1].t) i++; return i; }
  // posa della camera al tempo t, SENZA toccare la camera (serve anche per guardare indietro nel tempo: fuoco che insegue)
  // [utente 11/11] al CAMBIO DI SCENA la camera si FERMA: negli ultimi "fermo" s (0,6 di default; storia o scena) il movimento rallenta fino a zero,
  // così lo stacco arriva su un'inquadratura ferma. Il tempo della camera si «frena»; personaggi e mondo continuano normali.
  const FERMO = SC.fermo ?? S.fermo ?? 0.6;
  function fermaT(t) { const t0 = SC.a - FERMO; if (FERMO <= 0 || t <= t0) return t; const u = Math.min(1, (t - t0) / FERMO); return t0 + FERMO * (u - u * u / 2); }
  const _CV_GLOB = SC.camera_viva ?? S.camera_viva ?? {};
  function applicaRespiro(pos, tgt, fov, tau) {
    if (!LC_RESPIRO || _CV_GLOB === false) return;
    const ampK = LC_OPT.respiro === true || LC_OPT.respiro === undefined ? 1 : +LC_OPT.respiro;
    if (!(ampK > 0)) return;
    const dir = tgt.clone().sub(pos), L = dir.length() || 1; dir.divideScalar(L);
    const lat = new THREE.Vector3(dir.z, 0, -dir.x);
    if (lat.lengthSq() < 1e-6) return;
    lat.normalize();
    const fovK = Math.min(1.0, fov / 65), ph = (SC.da || 0) * 1.7 + +(q.get('scena') || 0) * 1.1;
    const ampP = 0.011 * ampK * fovK, ampA = 0.0020 * ampK * fovK;
    pos.addScaledVector(lat, ampP * (0.65 * Math.sin(tau * 0.85 + ph) + 0.35 * Math.sin(tau * 1.43 + ph * 2.1)));
    pos.y += ampP * 0.60 * (0.70 * Math.sin(tau * 1.15 + ph * 0.7) + 0.30 * Math.sin(tau * 1.92 + ph * 1.4));
    tgt.addScaledVector(lat, L * ampA * Math.sin(tau * 0.72 + ph * 1.3));
    tgt.y += L * ampA * 0.55 * Math.sin(tau * 1.05 + ph * 0.6);
  }
  function poseAt(t) {
    if (!CAM.length) return null; t = fermaT(t); let i = idx(t); const nx = CAM[i + 1]; let pos, tgt, fov, sfA = SF(CAM[i]), sfB = sfA, uu = 0, kS = CAM[i];
    if (RICK) {
      const P = k => deriva(k, t, tappa(CAM[k], t)), A = P(i);[pos, tgt, fov] = A;
      const pv = CAM[i - 1], wi = FIN[i], wn = nx ? FIN[i + 1] : null; let a = null, b = null, u = 0, volo = false, slerp = false;
      if (pv && wi && t < wi[1]) { a = P(i - 1); b = A; u = (t - wi[0]) / Math.max(0.05, wi[1] - wi[0]); volo = !!PLANATA[i]?.volo; slerp = !!PLANATA[i]?.slerp; sfA = SF(pv); sfB = SF(CAM[i]); kS = u > (volo ? .3 : .5) ? CAM[i] : pv; }
      else if (nx && wn && t > wn[0]) { a = A; b = P(i + 1); u = (t - wn[0]) / Math.max(0.05, wn[1] - wn[0]); volo = !!PLANATA[i + 1]?.volo; slerp = !!PLANATA[i + 1]?.slerp; sfB = SF(nx); if (u > .5) kS = nx; }
      if (a) {
        u = cl(u); u = volo ? ss(1 - Math.pow(1 - u, 1.15)) : ss(u);   /* volo C2: stacco morbido, picco al 44%, atterraggio vellutato */
        pos = a[0].clone().lerp(b[0], u);
        if (slerp) {
          const va = a[1].clone().sub(a[0]), vb = b[1].clone().sub(b[0]), La = va.length() || 1, Lb = vb.length() || 1;
          const da = va.divideScalar(La), db = vb.divideScalar(Lb), q = new THREE.Quaternion().setFromUnitVectors(da, db);
          const dir = da.applyQuaternion(new THREE.Quaternion().slerp(q, u)), dist = La * Math.exp(Math.log(Math.max(0.1, Lb) / Math.max(0.1, La)) * u);
          tgt = pos.clone().addScaledVector(dir, dist);
          const tA = Math.max(1e-3, Math.tan(a[2] * Math.PI / 360)), tB = Math.max(1e-3, Math.tan(b[2] * Math.PI / 360));
          fov = 2 * Math.atan(Math.exp(Math.log(tA) + (Math.log(tB) - Math.log(tA)) * u)) * 180 / Math.PI;
        } else { tgt = a[1].clone().lerp(b[1], u); fov = a[2] + (b[2] - a[2]) * u; }
        uu = u;
      }
      applicaRespiro(pos, tgt, fov, t - SC.da);
      return { pos, tgt, fov, sfA, sfB, uu, kS };
    }
    const A = tappa(CAM[i], t); pos = new THREE.Vector3(); tgt = new THREE.Vector3();
    if (!nx || nx.taglio || t <= CAM[i].t) { pos.copy(A[0]); tgt.copy(A[1]); fov = A[2]; }
    else { const B = tappa(nx, t), u = ss(cl((t - CAM[i].t) / (nx.t - CAM[i].t))); pos.lerpVectors(A[0], B[0], u); tgt.lerpVectors(A[1], B[1], u); fov = A[2] + (B[2] - A[2]) * u; sfB = SF(nx); uu = u; if (u > 0.5) kS = nx; }
    // CAMERA VIVA (misure del riferimento: la camera non sta mai ferma, spinge in avanti ~3-8 %/s e scorre ~30-45 px/s): spinta continua verso il soggetto
    // e una deriva laterale lenta, sommate alle tappe. Si regola con "camera_viva": { "spinta": m/s, "deriva": m } nella storia o nella scena, false la spegne.
    const CV = SC.camera_viva ?? S.camera_viva ?? {};
    if (CV !== false) {
      const tau = t - SC.da, dir = tgt.clone().sub(pos), L = dir.length() || 1; dir.divideScalar(L);
      pos.addScaledVector(dir, Math.max(0, Math.min((CV.spinta ?? 0.09) * tau, L * 0.3, L - (CV.minimo ?? 2.2))));   // mai più vicina di 2,2 m al punto guardato
      const lat = new THREE.Vector3(dir.z, 0, -dir.x).normalize(), dv = CV.deriva ?? 0.16, ph = (SC.da || 0) * 1.7;
      pos.addScaledVector(lat, dv * Math.sin(tau * 0.55 + ph)); pos.y += dv * 0.35 * Math.sin(tau * 0.4 + ph * 1.3);
      const ang = CV.panoramica ?? 0.05;   // anche lo sguardo scorre (rad): il movimento sullo schermo non dipende dalla distanza (misura: 30-45 px/s)
      tgt.addScaledVector(lat, L * ang * Math.sin(tau * 0.5 + ph * .7)); tgt.y += L * ang * 0.4 * Math.sin(tau * 0.37 + ph);
    }
    applicaRespiro(pos, tgt, fov, t - SC.da);
    return { pos, tgt, fov, sfA, sfB, uu, kS };
  }
  // soggetto a fuoco al tempo t: l'attore della tappa (`su` o `fuoco_su`) o l'oggetto `OBJ` o il personaggio visibile più vicino all'asse della camera
  function occhiDi(A, t) { const s = stato(A, t); return new THREE.Vector3(s.x, A.m.position.y + (A.rick ? ALTT(A, s) * 0.98 : A.p3 ? 1.45 : 1.1) * A.m.scale.y, s.z); }
  function puntoFuoco(P, t) {
    const fRef = P.kS.fuoco_su ?? P.kS.zoom_veloce?.su ?? P.kS.su ?? P.kS.guarda_ogg;
    if (Array.isArray(fRef)) return { pt: new THREE.Vector3(...fRef), A: null };
    if (fRef && ATT[fRef]) return { pt: occhiDi(ATT[fRef], t), A: ATT[fRef] };
    if (fRef && OBJ[fRef]) {
      const o = [].concat(OBJ[fRef])[0];
      if (o) {
        const bb = new THREE.Box3().setFromObject(o);
        return { pt: bb.isEmpty() ? o.getWorldPosition(new THREE.Vector3()) : bb.getCenter(new THREE.Vector3()), A: null, explicit: true };
      }
    }
    const ax = P.tgt.clone().sub(P.pos).normalize(); let best = null, bv = 0.6;
    for (const A of Object.values(ATT)) {
      if (stato(A, t).visibile === false || A.m.visible === false) continue; const v = occhiDi(A, t).sub(P.pos), al = v.dot(ax);
      if (al < 0.5 || al > 14) continue; const r = v.addScaledVector(ax, -al).length() / al; if (r < bv) { bv = r; best = A; }
    }
    return { pt: best ? occhiDi(best, t) : P.tgt.clone(), A: best };
  }
  function fuocoGeo(t) { const P = poseAt(t), F = puntoFuoco(P, t), ax = P.tgt.clone().sub(P.pos).normalize(), d = P.kS.fuoco ?? Math.max(0.3, F.pt.clone().sub(P.pos).dot(ax)); return { d, A: F.A, pt: F.pt, explicit: !!F.explicit || P.kS.fuoco_su !== undefined || P.kS.fuoco !== undefined, P }; }
  // ---- LUCE CHE SEGUE LA STORIA: "luce_tempo": [{ "t": "@parola", "dur": 1.5, "esp": 0.7, "cielo": ["#1a1040", "#5a3a80"], "nebbia": "#2a2060",
  //      "ambiente": ["#6a5ab0", 1.2], "sole": ["#ffb070", 1.5] }] nella scena: sfuma da com'è il luogo a ogni chiave, in ordine di tempo.
  const LT = [...(SC.luce_tempo || [])].sort((a, b) => a.t - b.t), C = x => (x && x.isColor) ? x : new THREE.Color(x);
  const LUCE0 = LT.length ? {
    esp: renderer.toneMappingExposure, cielo: [sky.material.uniforms.top.value.clone(), sky.material.uniforms.bot.value.clone()], nebbia: scene.fog ? scene.fog.color.clone() : null,
    ambiente: [L.hemi.color.clone(), L.hemi.intensity], sole: [L.sun.color.clone(), L.sun.intensity]
  } : null;
  function luceAt(t) {
    if (!LUCE0) return; let cur = { esp: LUCE0.esp, cielo: LUCE0.cielo.map(c => c.clone()), nebbia: LUCE0.nebbia && LUCE0.nebbia.clone(), ambiente: [LUCE0.ambiente[0].clone(), LUCE0.ambiente[1]], sole: [LUCE0.sole[0].clone(), LUCE0.sole[1]] };
    for (const k0 of LT) {
      if (t < k0.t) break; const u = ss(cl((t - k0.t) / Math.max(1e-3, k0.dur ?? 1.5)));   // "torna": true = ritorno alla luce del luogo
      const k = k0.torna ? { esp: LUCE0.esp, cielo: LUCE0.cielo, nebbia: LUCE0.nebbia, ambiente: LUCE0.ambiente, sole: LUCE0.sole } : k0;
      if (k.esp !== undefined) cur.esp += (k.esp - cur.esp) * u; if (k.cielo) { cur.cielo[0].lerp(C(k.cielo[0]), u); cur.cielo[1].lerp(C(k.cielo[1]), u); }
      if (k.nebbia && cur.nebbia) cur.nebbia.lerp(C(k.nebbia), u); for (const n of ['ambiente', 'sole']) if (k[n]) { cur[n][0].lerp(C(k[n][0]), u); cur[n][1] += (k[n][1] - cur[n][1]) * u; }
    }
    renderer.toneMappingExposure = cur.esp; sky.material.uniforms.top.value.copy(cur.cielo[0]); sky.material.uniforms.bot.value.copy(cur.cielo[1]); if (scene.fog && cur.nebbia) scene.fog.color.copy(cur.nebbia);
    L.hemi.color.copy(cur.ambiente[0]); L.hemi.intensity = cur.ambiente[1]; L.sun.color.copy(cur.sole[0]); L.sun.intensity = cur.sole[1];
  }
  // ---- PROFONDITÀ DI CAMPO «vera»: "sfocatura": "vera" (+ "diaframma": 2) = come un obiettivo: la sfocatura viene dalla focale (fov), dalla distanza
  // di messa a fuoco e dal diaframma (sensore verticale 24x36 mm): grandangolo e campi larghi quasi nitidi, primi piani stretti molto sfocati.
  // Il FUOCO INSEGUE il soggetto come un operatore: media pesata degli ultimi 0,6 s (ritardo ~0,2 s) → quando cambia soggetto c'è un cambio di fuoco morbido.
  /* [12/11] "auto" era rimasta senza funzione (errore al primo uso): testa nel quadro ≥18% → 13 px, ≥12% → 11, ≥7% → 7, sotto → 0 (misure di Rick) */
  function SFAUTO(A) { if (!A) return 0; const d = camera.position.distanceTo(A.m.position), q = TESTA(A) / (2 * d * Math.tan(camera.fov * Math.PI / 360) * 1080 / 1920); return q >= 0.18 ? 13 : q >= 0.12 ? 11 : q >= 0.07 ? 7 : 0; }
  const SF_BASE = LUCE_RICK && !LC_LENTE && SC.sfocatura === undefined && S.sfocatura === undefined;   /* sfocatura accesa da sola (Rick): più leggera (diaframma 4) e spenta nei dettagli senza personaggi */
  function sfVera(fuoco, fov) { const N = SC.diaframma ?? S.diaframma ?? (LC_LENTE ? (LC_OPT.diaframma ?? 2.2) : (SF_BASE ? 4 : 2)), f = 18 / Math.tan(fov * Math.PI / 360), c = f * f / (N * Math.max(1, fuoco * 1000 - f)); return Math.min(24, c / 24 * 1080); }
  /* [utente 13/11] sfocatura "intelligente" (camera vera, di base con Rick): leggera sui campi larghi (testa ≤16%), sale morbida sui primi piani (testa ≥24%), con zona a fuoco reale attorno al soggetto */
  function sfIntelligente(A, fuoco, fov, explicit) {
    if (!A) return (LC_LENTE && explicit) ? Math.min(24, sfVera(fuoco, fov) * 1.4) : 0;
    const base = sfVera(fuoco, fov), q = TESTA(A) / (2 * fuoco * Math.tan(fov * Math.PI / 360) * 1080 / 1920);
    const q0 = LC_LENTE ? 0.12 : 0.16, q1 = LC_LENTE ? 0.22 : 0.24;
    const t = cl((q - q0) / (q1 - q0));
    return base * (LC_LENTE ? 1.2 : 1.0) + (25 - base * (LC_LENTE ? 1.2 : 1.0)) * (t * t * (3 - 2 * t));
  }
  function camAt(t) {
    const P = poseAt(t); if (!P) return; const { pos, tgt, fov, sfA, sfB, uu } = P; luceAt(t);
    camera.position.copy(pos); camera.lookAt(tgt); camera.fov = fov;
    { const E = effettiCamera(CAM, t, S.fps || 30, SC.a); if (E.roll) camera.rotateZ(E.roll * Math.PI / 180); if (E.kick) { camera.rotateY(E.kick * 0.0035); camera.rotateX(E.kick * 0.002); camera.rotateZ(E.kick * 0.004); } } if (D.dof) {
      camera.updateProjectionMatrix(); camera.updateMatrixWorld(true); const G = fuocoGeo(t), sog = G.A;
      let cut0 = SC.da; for (let k = 1; k < CAM.length; k++) if ((CAM[k].taglio || PLANATA[k]?.taglio) && CAM[k].t <= t) cut0 = Math.max(cut0, CAM[k].t);
      let fw = 0, fs = 0; const tau = SC.fuoco_ritardo ?? S.fuoco_ritardo ?? (LC_LENTE ? 0.28 : 0.18), steps = LC_LENTE ? 20 : 12;
      for (let j = 0; j < steps; j++) { const tj = t - j * 0.05; if (tj < cut0 - 1e-6) break; const w = Math.exp(-j * 0.05 / Math.max(.01, tau)); fs += (j ? fuocoGeo(tj).d : G.d) * w; fw += w; }
      const fuoco = fw > 0 ? fs / fw : G.d, va = x => x === 'auto' ? SFAUTO(sog) : x === 'intelligente' ? sfIntelligente(sog, fuoco, fov, G.explicit) : x === 'vera' ? (SF_BASE && !sog ? 0 : sfVera(fuoco, fov)) : x;
      const camVera = sfA === 'intelligente' || sfB === 'intelligente';
      D.dof.bokeh = +(SC.bokeh ?? S.bokeh ?? (LC_LENTE ? (LC_OPT.bokeh ?? 1.6) : 0));   /* [13/11] "bokeh": 0-3, luci fuori fuoco a dischi (0 = come prima) */
      D.dof.zona = camVera ? (SC.dof_zona ?? S.dof_zona ?? (LC_LENTE ? 0.12 : 0.14)) : 0; D.dof.nearScale = camVera ? (SC.dof_davanti ?? S.dof_davanti ?? (LC_LENTE ? 0.90 : 0.55)) : 1.2;
      D.dof.focus = fuoco; D.dof.fgeo = G.d; D.dof.cInf = va(sfA) + (va(sfB) - va(sfA)) * uu;
      const lockOk = !LC_LENTE || Math.abs(fuoco - G.d) < 0.25;
      const sp = (lockOk && (sog || G.explicit)) ? G.pt.clone().project(camera) : null;
      D.dof.fuv = sp && Math.abs(sp.x) < 0.95 && Math.abs(sp.y) < 0.95 && sp.z < 1 ? [sp.x * 0.5 + 0.5, sp.y * 0.5 + 0.5] : null;
    }
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    for (const [id, A] of Object.entries(ATT)) { const d = Math.hypot(A.m.position.x - camera.position.x, A.m.position.z - camera.position.z); if (d < 1.0 && !A.avv) { A.avv = 1; console.error(`[d] avviso: a ${t.toFixed(2)} s la camera è a ${d.toFixed(2)} m da «${id}»: probabilmente copre l'inquadratura, sposta la tappa o l'attore`); } }
  }
  // [utente 13/11] MOSSO (sfocatura di movimento) sui movimenti VELOCI di camera: voli, panoramiche a frusta, planate rapide. Come Rick: mosso forte solo sugli scatti.
  // Sopra "soglia" px a fotogramma (a 1080x1920) si rende lo stesso fotogramma più volte con la sola camera spostata lungo il suo percorso e si fa la media:
  // il look non cambia, sotto la soglia nessun pixel cambia. "mosso": false lo spegne; { "otturatore": 0.6, "soglia": 24, "pieno": 60, "max": 16 } lo regola (storia o scena).
  const MOSSO_V = SC.mosso ?? S.mosso, MO = { otturatore: 0.6, soglia: 24, pieno: 60, max: 16, ...(MOSSO_V && typeof MOSSO_V === 'object' ? MOSSO_V : {}) }, MOSSO_ON = MOSSO_V !== false && MOSSO_V !== 0 && (RICK || !!MOSSO_V);
  const camM = [new THREE.PerspectiveCamera(), new THREE.PerspectiveCamera()]; let accM = null;
  function velCam(t, dt, prof = [1]) {
    const A = poseAt(t), B = poseAt(t + dt); if (!A || !B) return 0;   // quanti px si sposta l'immagine tra t e t + dt (centro e quattro punti attorno, alla distanza del punto guardato)
    [A, B].forEach((P, i) => { const c = camM[i]; c.fov = P.fov; c.aspect = camera.aspect; c.position.copy(P.pos); c.lookAt(P.tgt); c.updateProjectionMatrix(); c.updateMatrixWorld(true); c.matrixWorldInverse.copy(c.matrixWorld).invert(); });
    const dir = A.tgt.clone().sub(A.pos), Ld = dir.length() || 1; dir.divideScalar(Ld); const r = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize(), u = new THREE.Vector3().crossVectors(r, dir), h = Ld * Math.tan(A.fov * Math.PI / 360) * 0.6, w = h * camera.aspect; let mx = 0;
    for (const q of prof) for (const [a, b] of [[0, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]) { const p = A.pos.clone().addScaledVector(dir, Ld * q).addScaledVector(r, a * w * q).addScaledVector(u, b * h * q), pa = p.clone().project(camM[0]), pb = p.clone().project(camM[1]); if (pb.z > 1) { if (q < 1) continue; return 2000; } mx = Math.max(mx, Math.hypot((pb.x - pa.x) * 540, (pb.y - pa.y) * 960)); } return mx;
  }
  function mosso(t, fps) {
    window.mossoCanvas = null; if (!MOSSO_ON || !CAM.length) return;
    if (CAM.some((k, i) => i && (k.taglio || PLANATA[i]?.taglio) && Math.abs(k.t - t) <= 0.5 / fps + 1e-6)) return;   // mai mescolare due inquadrature a cavallo di uno stacco
    const v = velCam(t - 0.5 / fps, 1 / fps), sh = MO.otturatore * cl((v - MO.soglia) / Math.max(1, MO.pieno - MO.soglia)), lung = v * sh; if (lung < 2) return;
    const K = Math.max(3, Math.min(MO.max, Math.ceil(lung / 4))); if (!accM) { accM = document.createElement('canvas'); accM.width = 1080; accM.height = 1920; }
    const g = accM.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    for (let j = 0; j < K; j++) { camAt(t + ((j + 0.5) / K - 0.5) * sh / fps); D.render(); g.globalAlpha = 1 / (j + 1); g.drawImage(renderer.domElement, 0, 0, 1080, 1920); }
    g.globalAlpha = 1; camAt(t); window.mossoCanvas = accM; console.log(`[d] mosso a ${t.toFixed(2)} s: camera a ${v.toFixed(0)} px/f, scia ${lung.toFixed(0)} px, ${K} passate`);
  }
  // [utente 13/11] FLUIDITÀ: profilo di velocità della camera per tutta la scena (px a fotogramma a 1080x1920), calcolato dal percorso senza rendere nulla.
  // Lo legge rendi_disegnato.mjs (--profilo e anteprima) per trovare gli SCATTI: la velocità non deve mai cambiare di colpo, nemmeno nei movimenti veloci.
  window.profiloCamera = (fps = S.fps || 30) => {
    const n = Math.round((SC.a - SC.da) * fps), v = []; for (let f = 0; f < n; f++) v.push(+velCam(SC.da + (f - 0.5) / fps, 1 / fps, [0.6, 1, 3]).toFixed(2));
    return { da: SC.da, fps, v, tagli: CAM.filter((k, i) => i && (k.taglio || PLANATA[i]?.taglio)).map(k => k.t), voli: CAM.map((k, i) => PLANATA[i]?.volo ? [k.t, k.t + PLANATA[i].dur] : null).filter(Boolean) };
  };
  let ultimo = -99, _ultimoT = SC.da || 0;
  window.renderFrame = async (f, N, fps = S.fps || 30) => { const t = SC.da + f / fps; _ultimoT = t; camAt(t); aggiornaOggetti(t); aggiornaAttori(t, f !== ultimo + 1); aggiornaFolla(t); aggiornaComparse(t); M.vita.tick(t, { attori: VICINI() }); for (const fn of M.tick || []) fn(t); for (const [o, p, r] of INMANO) { o.position.copy(p); o.rotation.copy(r); } for (const [ogg, L] of Object.entries(LASCIATI)) { const o = [].concat(OBJ[ogg])[0]; if (o) { const u = Math.min(1, Math.max(0, (t - L.t0) / L.dur)); o.position.set(L.p0.x, L.p0.y + (L.targetY - L.p0.y) * (u * u), L.p0.z); } } for (const [o] of INMANO) aggiornaOmbraOggetto(o); for (const ogg of Object.keys(LASCIATI)) { const o = [].concat(OBJ[ogg])[0]; if (o) aggiornaOmbraOggetto(o); } ultimo = f; D.render(); window.mossoCanvas = null; if (N > 0) mosso(t, fps); aggiornaMira(t); return 0; };
  window.controlloVita = () => M.vita.controllo(camera);
  window.controlloRicchezza = () => M.vita.ricchezza ? M.vita.ricchezza(camera) : null;   // [utente 13/11] mondo ricco: oggetti, taglie, caselle piene, profondità, tinte
  window.controlloRecitazione = () => {
    const t = _ultimoT, out = [], avvisi = [];
    for (const [id, A] of Object.entries(ATT)) {
      const s = stato(A, t);
      if (s.visibile === false) continue;
      const sc = A.m.scale.y || 1;
      const oc = new THREE.Vector3(s.x, A.m.position.y + (A.rick ? ALTT(A, s) : 1.4) * sc, s.z);
      const pr = oc.clone().project(camera), dist = camera.position.distanceTo(oc);
      const inq = pr.z < 1 && Math.abs(pr.x) <= 1.05 && Math.abs(pr.y) <= 1.05 && dist < 14;
      if (!inq) continue;
      const hQ = TESTA(A) / (dist * 2 * Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
      const uS = A._ultimoStato || {};
      const posa = s.cammina ? (s.cammina[3] || 'cammina') : (s.posa || 'auto');
      const rec = {
        id,
        testaPct: Math.round(hQ * 100),
        posa,
        gesto: s.gesto || null,
        faccia: s.faccia || 'neutro',
        parla: !!s.parla,
        bocca: uS.bocca || null,
        sguardo: uS.sguardo || null,
        oggetto: s.oggetto || null,
        vfx: s.vfx || (s.goccia ? 'sudore' : null),
        chino: s.chino || 0,
        interazione: !!uS.inInterazione,
      };
      out.push(rec);
      if (posa === 'dritto' && !s.gesto && !uS.inInterazione) avvisi.push(`${id}: posa "dritto" forzata senza gesto`);
      if (rec.parla && !rec.gesto && !uS.inInterazione && rec.faccia === 'neutro' && !rec.chino) avvisi.push(`${id}: parla con faccia neutra e nessun gesto`);
    }
    return { t: +t.toFixed(2), attori: out, avvisi };
  };
  // CONTROLLO DELL'INQUADRATURA (dalla skill ricksclips: «stop-frame check»): camera dentro un oggetto, soggetto coperto/fuori/troppo vicino, quadro piatto, troppo scuro o chiaro, nero o bianco pieni
  window.controlloInquadratura = () => {
    const F = [], P = camera.position, b = new THREE.Box3(), v = new THREE.Vector3(), rc = new THREE.Raycaster(); rc.camera = camera;
    const vis = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; }, sotto = (o, r) => { for (let q = o; q; q = q.parent) if (q === r) return true; return false; };
    const nome = o => { for (let q = o; q; q = q.parent) if (q.name && !/^(Cubo|Cube|Mesh|Sfera|Plane)/.test(q.name)) return q.name; return (o.geometry && o.geometry.type) || 'oggetto'; };
    let dentro = null; M.root.traverse(o => { if (dentro || !o.isMesh || !vis(o) || (o.material && o.material.transparent)) return; b.setFromObject(o); b.getSize(v); if (!isFinite(v.x + v.y + v.z) || Math.max(v.x, v.y, v.z) > 6 || Math.min(v.x, v.y, v.z) < .03) return; if (b.containsPoint(P)) dentro = o; });
    if (dentro) { b.setFromObject(dentro); const c = b.getCenter(new THREE.Vector3()), z = b.getSize(new THREE.Vector3()); F.push(['CAMERA_DENTRO', nome(dentro) + ` (centro ${c.x.toFixed(1)} ${c.y.toFixed(1)} ${c.z.toFixed(1)}, misure ${z.x.toFixed(1)}x${z.y.toFixed(1)}x${z.z.toFixed(1)} m)`]); }
    camera.updateMatrixWorld();
    const camRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    let best = null; for (const [id, A] of Object.entries(ATT)) {
      const stNow = stato(A, _ultimoT); if (stNow.visibile === false) continue;   // (dopo il render il look può aver nascosto i personaggi per le sue passate)
      const hTop = (A.rick ? ALTT(A, stNow) : A.p3 ? 1.72 : 1.3) * A.m.scale.y;
      const tpRad = A.rick ? ((stNow.chino || 0) * Math.PI / 180) : 0;
      const hHip = hTop * 0.48, dHead = hTop - hHip;
      const leanX = dHead * Math.sin(tpRad), leanY = hHip + dHead * Math.cos(tpRad);
      const h = A.m.position.clone().addScaledVector(camRight, leanX); h.y += leanY;
      const n = h.clone().project(camera), d = P.distanceTo(h); if (n.z > 1 || n.z < -1 || d > 14) continue;
      const c = Math.hypot(n.x, n.y); if (!best || c < best.c) best = { id, A, h, n, c, d };
      const halfW = A.rick ? TESTA(A) * 0.54 : 0.34;
      const nL = h.clone().addScaledVector(camRight, -halfW).project(camera);
      const nR = h.clone().addScaledVector(camRight, halfW).project(camera);
      const chest = A.m.position.clone().addScaledVector(camRight, leanX * 0.55); chest.y += hHip + dHead * 0.45 * Math.cos(tpRad);
      const cL = chest.clone().addScaledVector(camRight, -halfW * 1.05).project(camera);
      const cR = chest.clone().addScaledVector(camRight, halfW * 1.05).project(camera);
      const piedeY = A.m.position.clone().project(camera).y;
      const xMin = Math.min(nL.x, cL.x), xMax = Math.max(nR.x, cR.x);
      const visY = Math.max(piedeY, n.y) > -0.96 && Math.min(piedeY, n.y) < 0.98;
      if (visY && xMax > -0.98 && xMin < 0.98) {
        const cutL = Math.max(0, -1 - xMin), cutR = Math.max(0, xMax - 1), span = Math.max(0.05, xMax - xMin);
        const cutPct = Math.round(Math.max(cutL, cutR) / span * 100);
        if (cutPct >= 20) F.push(['SOGGETTO_TAGLIATO', `${id} tagliato a ${cutL >= cutR ? 'sinistra' : 'destra'} (${cutPct}%)`]);
      }
      if (A.rick && tpRad) {
        const cardClip = Math.abs(leanX) * 512 / (A.m.scale.y || 1) + 270 * (A.opt.W || 1) * 0.46;
        if (cardClip > 258 && xMax > -0.98 && xMin < 0.98) F.push(['SOGGETTO_TAGLIATO', `${id} fuori bordo carta (chino ${Math.round(stNow.chino)}°)`]);
      }
    }
    let testa = null; if (best) {
      testa = TESTA(best.A) / (best.d * 2 * Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
      if (Math.abs(best.n.x) > 1.02 || Math.abs(best.n.y) > 1.02) F.push(['SOGGETTO_FUORI', best.id]);
      if (best.d < 1.0) F.push(['TROPPO_VICINO', best.id + ' a ' + best.d.toFixed(2) + ' m']);
      rc.set(P, best.h.clone().sub(P).normalize()); rc.far = Math.max(.1, best.d - .45);
      const hit = rc.intersectObjects(M.root.children, true).find(x => x.object.isMesh && vis(x.object) && !sotto(x.object, best.A.m) && !(x.object.material && x.object.material.transparent));
      if (hit) F.push(['SOGGETTO_COPERTO', best.id + ' da ' + nome(hit.object)]);
    }
    const vivi = Object.entries(ATT).filter(([, A]) => A.a.visibile !== false); for (let i = 0; i < vivi.length; i++) for (let j = i + 1; j < vivi.length; j++) {
      const [ia, A] = vivi[i], [ib, B2] = vivi[j], dd = Math.hypot(A.m.position.x - B2.m.position.x, A.m.position.z - B2.m.position.z);
      if (dd < 0.55 * Math.max(A.m.scale.y, B2.m.scale.y)) { const pa = A.m.position.clone().project(camera); if (pa.z < 1 && Math.abs(pa.x) < 1.1 && Math.abs(pa.y) < 1.1) F.push(['SOVRAPPOSTI', ia + ' e ' + ib + ' a ' + dd.toFixed(2) + ' m']); }
    }   // due personaggi uno dentro l'altro
    const carteViste = new Set();
    M.root.traverse(o => { if (o.isMesh && (o.userData.card || o.userData.rick || o.userData.rickProprio) && vis(o)) carteViste.add(o); });
    for (const [, A] of Object.entries(ATT)) { if (A.rick && A.m && vis(A.m)) carteViste.add(A.m); }
    for (const card of carteViste) {
      const cPos = new THREE.Vector3(); card.getWorldPosition(cPos);
      const sc = card.getWorldScale(new THREE.Vector3()).y || 1;
      const cCenter = cPos.clone(); cCenter.y += 1.0 * sc;
      const proj = cCenter.clone().project(camera);
      if (proj.z > 1 || Math.abs(proj.x) > 1.05 || Math.abs(proj.y) > 1.05) continue;
      if (P.distanceTo(cCenter) > 20) continue;
      const normal = new THREE.Vector3(0, 0, 1).transformDirection(card.matrixWorld);
      const toCam = P.clone().sub(cCenter).normalize();
      const angDeg = normal.angleTo(toCam) * 180 / Math.PI;
      if (angDeg > 60) {
        const nomeCarta = Object.keys(ATT).find(k => ATT[k].m === card) || card.name || 'carta';
        F.push(['CARTA_DI_TAGLIO', `${nomeCarta} (${Math.round(angDeg)}°)`]);
      }
    }
    const cv = document.querySelector('canvas'), q = document.createElement('canvas'); q.width = 54; q.height = 96; const g2 = q.getContext('2d'); g2.drawImage(cv, 0, 0, 54, 96); const px = g2.getImageData(0, 0, 54, 96).data;
    let s1 = 0, s2 = 0, nero = 0, bianco = 0; const N = px.length / 4; for (let i = 0; i < px.length; i += 4) { const l = .2126 * px[i] + .7152 * px[i + 1] + .0722 * px[i + 2]; s1 += l; s2 += l * l; if (l < 6) nero++; if (l > 248) bianco++; }
    const media = s1 / N, dev = Math.sqrt(Math.max(0, s2 / N - media * media));
    if (dev < 12) F.push(['QUADRO_PIATTO', 'deviazione ' + dev.toFixed(0)]); if (media < 40) F.push(['TROPPO_SCURO', 'media ' + media.toFixed(0)]); if (media > 190) F.push(['TROPPO_CHIARO', 'media ' + media.toFixed(0)]);
    if (nero / N > .08) F.push(['NERO_PIENO', Math.round(nero / N * 100) + '%']); if (bianco / N > .25) F.push(['BIANCO_BRUCIATO', Math.round(bianco / N * 100) + '%']);
    // [utente 12/11] VUOTO_DIETRO_IL_SET: ogni luogo è chiuso, tranne quelli con "esterno": true nei luoghi; nessun pixel deve mostrare cielo o sfondo.
    // Immagine piccola 54x96 di sola profondità del mondo (cielo, personaggi e ombre esclusi): dove la profondità resta al massimo non c'è geometria.
    if (LG.esterno !== true) { const vuoto = vuotoDietroIlSet(); if (vuoto > 0.01) F.push(['VUOTO_DIETRO_IL_SET', (vuoto * 100).toFixed(1) + '% del quadro senza set (chiudi il luogo: 4 muri + soffitto, o segnalo "esterno": true)']); }
    return { flags: F, testa, media: Math.round(media), soggetto: best && best.id };
  };
  let RT_VUOTO = null, MAT_VUOTO = null;
  function vuotoDietroIlSet() {
    const W = 54, H = 96;
    if (!RT_VUOTO) {
      RT_VUOTO = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
      MAT_VUOTO = new THREE.ShaderMaterial({ side: THREE.DoubleSide, vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }', fragmentShader: 'void main(){ gl_FragColor = vec4(gl_FragCoord.z, 0., 0., 1.); }' });
    }
    const nasc = []; scene.traverse(o => { if (o.visible && (o === sky || o.userData.card || o.userData.ombra || o.isPoints || o.isSprite || o.userData.particella)) { nasc.push(o); o.visible = false; } });
    const prima = { rt: renderer.getRenderTarget(), cc: renderer.getClearColor(new THREE.Color()), ca: renderer.getClearAlpha(), fog: scene.fog, ov: scene.overrideMaterial };
    scene.fog = null; scene.overrideMaterial = MAT_VUOTO; renderer.setRenderTarget(RT_VUOTO); renderer.setClearColor(0xffffff, 1); renderer.clear(); renderer.render(scene, camera);   // sfondo = profondità 1 (massima)
    const buf = new Float32Array(W * H * 4); renderer.readRenderTargetPixels(RT_VUOTO, 0, 0, W, H, buf);
    renderer.setRenderTarget(prima.rt); renderer.setClearColor(prima.cc, prima.ca); scene.fog = prima.fog; scene.overrideMaterial = prima.ov; for (const o of nasc) o.visible = true;
    let n = 0; for (let i = 0; i < W * H; i++) if (buf[i * 4] >= 0.999999) n++;
    return n / (W * H);
  }
  await Promise.all([M.attendi?.(), D.pronto?.()]);
  window.go = () => window.renderFrame(0); window.durata = SC.a - SC.da; window.ready = true;
} catch (e) { console.error('[d] ' + (e.stack || e)); window.errore = String(e); window.ready = true; }
