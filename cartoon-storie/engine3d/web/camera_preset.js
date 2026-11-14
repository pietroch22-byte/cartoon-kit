// PRESET DI CAMERA stile Rick (12/11). Numeri da references/reports/motion.md (mromidev, 20 video, 32.337 fotogrammi):
// - la camera quasi mai ferma: 65% dei fotogrammi si muove, nelle pause spinge in avanti ~0,14 %/fotogramma (≈4 %/s);
// - ogni movimento è una planata simmetrica: ~10 f di accelerazione e ~10 f di frenata (~23 f, 0,8 s), picco ~15 px/f a 720p;
// - spinte d'enfasi: +22% in ~35 f (≈19 %/s per 1,2 s); snap zoom +38% in 14 f; gru indietro fino a -4,6 %/f, lenta all'inizio;
// - rollio: 3,6° in 18 f (fino a 8° sulle enfasi); impatto: scossa che cambia verso a ogni fotogramma, ~3 px, finita in 7 f;
// - frusta: 45-93 px/f per 7-25 f con mosso forte (rara: 0,45 al minuto); i grandi cambi di inquadratura sono STACCHI, non voli.
// Uso nel JSON della scena:  "camera": [{ "t": "@parola", "preset": "spinta", "su": "banchiere" }, …]
// Ogni preset diventa una o più tappe normali del motore (su/testa/angolo/zoom/pan/planata/taglio) + effetti (rollio, scossa).
// Qualsiasi voce scritta nella tappa vince sul preset (es. { "preset": "primo_piano", "su": "a", "angolo": 30 }).
// Con un preset la scena passa da sola allo stile di camera «rick».

// testa = larghezza della testa nel quadro (Rick: primo piano ≥18%, mezza figura 11-18%, figura intera 7-11%, campo largo <7%)
export const PRESET = {
  // INQUADRATURE BASE
  stabilisci:   { d: 'campo largo che mostra dove siamo, sale appena e spinge piano', testa: 0.06, fov: 80, alt: 2.6, zoom: 4, pan: [0, -12] },
  figura:       { d: 'figura intera, spinta lenta', testa: 0.09, fov: 72, zoom: 4 },
  mezza:        { d: 'mezza figura, spinta lenta', testa: 0.13, fov: 62, zoom: 4 },
  primo_piano:  { d: 'primo piano, testa al 20%, spinta lenta', testa: 0.2, zoom: 3 },
  dettaglio:    { d: 'primissimo / oggetto: serve pos e guarda (o su + guardaAlt), fov stretto', testa: 0.32, zoom: 3, fov: 45 },
  fermo:        { d: 'quasi ferma (pausa, battuta secca): solo la spinta minima', zoom: 1.5, pan: [0, 0] },
  // MOVIMENTI
  spinta:       { d: 'spinta d\'enfasi: +22% in ~1,2 s sulla parola forte, poi rallenta', testa: 0.13, fov: 62, zoom: 19, arrivo: 0.2, dur: 1.2 },
  snap_zoom:    { d: 'zoom veloce di Rick sul soggetto (+42% in ~0,72 s, poi spinta lenta: sorpresa, rivelazione)', testa: 0.12, zoom: 4, zoom_veloce: { fattore: 1.42, dur: 0.72 } },
  zoom_soggetto:{ d: 'zoom veloce sul soggetto della scena (+42% in ~0,72 s centrato su "su" o "punto")', testa: 0.12, zoom: 4, zoom_veloce: { fattore: 1.42, dur: 0.72 } },
  allontana:    { d: 'si allontana dal soggetto (solitudine, fine di un pensiero)', testa: 0.2, zoom: -10 },
  gru_indietro: { d: 'gru che indietreggia e sale: parte lenta, accelera, frena (rivela il luogo)', testa: 0.15, zoom: -22, pan: [0, -30], glide: 'dolly', arrivo: -0.4 },
  sali:         { d: 'la camera sale guardando il soggetto (gru in su)', testa: 0.1, alt: 0.6, salita: 2.2, pan: [0, 0] },
  scendi:       { d: 'la camera scende sul soggetto (gru in giù, entrata in scena)', testa: 0.1, alt: 3.4, salita: -2.4, pan: [0, 0] },
  laterale:     { d: 'carrello di lato lungo la scena (passaggio, folla)', testa: 0.08, pan: [140, 0], zoom: 2, glide: 'dolly' },
  orbita:       { d: 'gira attorno al soggetto di ~40° (tensione, confronto)', testa: 0.13, orbita: 40, zoom: 3 },
  segui:        { d: 'segue chi cammina, di tre quarti davanti', testa: 0.1, segue: true, angolo: 35, zoom: 2 },
  segui_dietro: { d: 'segue chi cammina da dietro (verso una porta, un luogo)', testa: 0.08, segue: true, angolo: 180, alt: 1.9, zoom: 2 },
  frusta:       { d: 'panoramica a frusta verso il soggetto dopo (rara: 1 ogni 2 minuti)', testa: 0.13, planata: 0.35, frusta: true },
  // RELAZIONI TRA PERSONAGGI (servono "su" e "con")
  due:          { d: 'due personaggi nello stesso quadro, camera sull\'asse tra i due', due: true, zoom: 3 },
  spalla:       { d: 'sopra la spalla di «su» verso «con» (dialogo)', spalla: true, zoom: 2 },
  controcampo:  { d: 'come spalla ma dall\'altra parte (risposta nel dialogo): stacco netto', spalla: true, inverti: true, taglio: true, zoom: 2 },
  // STACCHI ED EFFETTI
  stacco:       { d: 'stacco netto su un primo piano (reazione, battuta)', testa: 0.2, taglio: true, zoom: 3 },
  reazione:     { d: 'stacco netto sul primo piano + piccolo colpo (sorpresa)', testa: 0.22, taglio: true, zoom: 5, scossa: 0.7 },
  impatto:      { d: 'colpo: la camera si ferma e trema 7 fotogrammi (caduta, porta che sbatte)', zoom: 0, scossa: 1.4 },
  inclina:      { d: 'camera inclinata ~6° (qualcosa non va, follia)', testa: 0.14, rollio: 6, zoom: 4 },
  soggettiva:   { d: 'dagli occhi di «su» (appena dietro la sua testa) verso «con» o verso guarda', soggettiva: true, fov: 88, zoom: 2 },
  dall_alto:    { d: 'dall\'alto in giù (piccolo, schiacciato)', testa: 0.08, alt: 4.2, guardaAlt: 0.6, zoom: 3 },
  dal_basso:    { d: 'dal basso in su (potente, minaccioso)', testa: 0.14, alt: 0.35, zoom: 3 },
};

// MOSSE (13/11): il MOVIMENTO, separato dall'inquadratura. Regole e fonti: references/movimenti-camera.md.
// Uso:  { "t": "@parola", "preset": "primo_piano", "su": "a", "mossa": "avanti" }   oppure   { "t", "pos", "guarda", "fov", "mossa": "pan", "verso_a": "b" }
// Ogni mossa è UN SOLO movimento dominante (niente laterale di contorno) e percorre un tratto fisso come Rick: corta = veloce, lunga = lenta.
// tratto = ingrandimento totale in % (negativo = allarga); panTratto = [px orizz., px vert.] totali a 1080x1920 (+x = la camera guarda a destra, +y = in su).
// "verso": 1 | -1 gira il verso orizzontale; "verso_a": "<attore>" | [x, y, z] punta la mossa verso quel soggetto (la direzione la decide il racconto).
// [utente 13/11] tutti gli ZOOM (avanti, indietro…) usano "curva": "frena": partono veloci e rallentano alla fine.
// "volo": true | secondi sulla tappa d'arrivo = la camera VOLA di scatto dall'inquadratura prima a questa (da un viso a un oggetto): parte sulla parola, veloce subito, morbida all'arrivo.
// "ancora": "mezzo" (di base: l'inquadratura scritta è il punto di mezzo) | "inizio" | "fine" (la mossa ARRIVA sull'inquadratura scritta: rivelazioni).
export const MOSSE = {
  fermo:        { d: 'quasi ferma: lascia recitare il quadro (battuta secca, imbarazzo, attesa prima del colpo)', zoom: 1.5, pan: [0, 0] },
  avanti:       { d: 'spinta dritta sul soggetto: pressione, capire, la verità che esce', tratto: 18, curva: 'frena', panTratto: [0, 0] },
  avanti_lenta: { d: 'spinta appena percepibile: ascolto, spiegazione, cosa densa o lenta', tratto: 8, curva: 'frena', panTratto: [0, 0] },
  avanti_forte: { d: 'spinta d\'enfasi che arriva forte e frena: la parola più importante della frase', tratto: 28, curva: 'frena', panTratto: [0, 0] },
  risucchio:    { d: 'spinta lunga e di scatto: qualcosa tira dentro (risucchiato, cade, precipita)', tratto: 34, curva: 'frena', panTratto: [0, 0] },
  indietro:     { d: 'si allontana piano: conseguenza, solitudine, «tutta la nave», fine di un pensiero', tratto: -16, curva: 'frena', panTratto: [0, 0] },
  pan:          { d: 'panoramica (la camera gira): lega due cose, scorre un oggetto lungo, segue uno sguardo; vuole "verso" o "verso_a"', tratto: 0, panTratto: [240, 0], glide: 'lens' },
  tilt_su:      { d: 'panoramica in su: altezza, autorità, dall\'oggetto al viso, qualcosa che sale', tratto: 0, panTratto: [0, 200], glide: 'lens' },
  tilt_giu:     { d: 'panoramica in giù: dal titolo alla prova, dal viso alle mani, qualcosa che cade', tratto: 0, panTratto: [0, -200], glide: 'lens' },
  carrello:     { d: 'carrello di lato con parallasse (la camera si sposta davvero): percorrere un luogo, una fila, un viaggio (vuole "verso"; i px si contano sul punto guardato: ciò che è più vicino scorre di più)', tratto: 0, panTratto: [140, 0], glide: 'dolly' },
  gru_su:       { d: 'la camera sale: liberazione, finale, il luogo che si apre', salita: 1.2, pan: [0, 0] },
  gru_giu:      { d: 'la camera scende e arriva sull\'inquadratura scritta: entrare in un luogo nuovo', salita: -1.2, pan: [0, 0] },
  arco:         { d: 'arco di ~30° attorno al soggetto fermo: minaccia che gira attorno, confronto, cambiamento (vuole "su"; 1 per video)', orbita: 30, pan: [0, 0] },
  segui:        { d: 'accompagna chi cammina: la camera ha la sua stessa velocità', segue: true, tratto: 0, panTratto: [0, 0] },
  fluttua:      { d: 'rollio lento e continuo: assenza di peso, sogno, nave, ubriachezza', rollioTratto: 5, tratto: 6, panTratto: [0, 0] },
  inclina:      { d: 'la camera si inclina ed è storta: qualcosa non va, bugia, follia (al massimo 2 per video)', rollio: 6, tratto: 8, panTratto: [0, 0] },
  vertigine:    { d: 'carrello avanti + obiettivo che si allarga: il soggetto resta uguale e il fondo scappa («oh no»; 1 per video)', vertigine: true, tratto: 30, ancora: 'inizio', glide: 'dolly', panTratto: [0, 0] },
};
// voci di movimento: una mossa le toglie dal preset d'inquadratura, così il movimento è uno solo
const MOV = ['zoom', 'pan', 'tratto', 'panTratto', 'arrivo', 'glide', 'dur', 'zoom_veloce', 'orbita', 'salita', 'rollio', 'rollioTratto', 'scossa', 'vertigine', 'ancora', 'frusta', 'planata', 'curva'];

// Espande i preset in tappe del motore. stato(A, t) dà la posizione dell'attore al tempo t.
export function espandi(SC, ATT, stato, THREE) {
  const C = SC.camera || []; if (!C.some(k => k.preset || k.mossa)) return false; const out = [];
  const pos = (id, t) => { const A = ATT[id]; if (!A) throw new Error('camera preset: attore sconosciuto ' + id); const s = stato(A, t); return { x: s.x, z: s.z, sc: A.m.scale.y, p3: !!A.p3, h: (A.rick ? 1.43 * (A.opt.W || 1) : A.p3 ? 1.45 : 1.2) * A.m.scale.y }; };
  C.forEach((k, i) => { if (!k.preset && !k.mossa) return out.push(k);
    const Pp = k.preset ? PRESET[k.preset] : {}, Pm = k.mossa ? MOSSE[k.mossa] : null; if (!Pp) throw new Error('camera: preset sconosciuto «' + k.preset + '» (vedi engine3d/web/camera_preset.js)');
    if (k.mossa && !Pm) throw new Error('camera: mossa sconosciuta «' + k.mossa + '» (vedi MOSSE in engine3d/web/camera_preset.js: ' + Object.keys(MOSSE).join(', ') + ')');
    const P = { ...Pp }; if (Pm) { for (const m of MOV) delete P[m]; Object.assign(P, Pm); }   // la mossa decide il movimento, il preset l'inquadratura
    const { d, dur, orbita, salita, due, spalla, inverti, soggettiva, ...base } = P, fine = C[i + 1] ? C[i + 1].t : SC.a, T = { ...base, ...k };
    delete T.preset; delete T.mossa; T.preset_nome = k.preset; T.mossa_nome = k.mossa;
    if (P.zoom_veloce) {
      if (k.zoom_veloce === false) delete T.zoom_veloce;
      else if (typeof k.zoom_veloce === 'number') T.zoom_veloce = { ...P.zoom_veloce, fattore: k.zoom_veloce };
      else T.zoom_veloce = { ...P.zoom_veloce, ...(typeof k.zoom_veloce === 'object' ? k.zoom_veloce : {}) };
    }
    if (due || spalla || soggettiva) { const A = pos(k.su, k.t), B = k.con ? pos(k.con, k.t) : null, hA = A.h;
      if (!B && !k.guarda) throw new Error(`camera: il preset «${k.preset}» vuole anche "con"`);
      const bx = B ? B.x : k.guarda[0], bz = B ? B.z : k.guarda[2], dx = bx - A.x, dz = bz - A.z, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
      delete T.su; delete T.con;
      if (due) { const mx = (A.x + bx) / 2, mz = (A.z + bz) / 2, dist = (k.dist ?? Math.max(2.6, L * 1.6)), lato = k.lato ?? 1;
        T.pos = [mx + nx * dist * lato, k.alt ?? hA * 1.05, mz + nz * dist * lato]; T.guarda = [mx, hA * 0.95, mz]; T.fov = k.fov ?? 60; }
      else if (spalla) { const s = inverti ? -1 : 1, ox = inverti ? bx : A.x, oz = inverti ? bz : A.z, tx = inverti ? A.x : bx, tz = inverti ? A.z : bz, fx = inverti ? -ux : ux, fz = inverti ? -uz : uz;
        T.pos = [ox - fx * 0.9 + nx * 0.45 * s, hA * 1.08, oz - fz * 0.9 + nz * 0.45 * s]; T.guarda = [tx, hA * 0.95, tz]; T.fov = k.fov ?? 55; }
      else { T.pos = [A.x + ux * 0.18, hA * 1.02, A.z + uz * 0.18];   /* davanti ai suoi occhi: la sua carta resta alle spalle della camera */ T.guarda = [bx, k.guarda ? k.guarda[1] : hA * 0.9, bz]; }
      out.push(T); return; }
    if (!T.su && !T.pos) throw new Error(`camera: il preset «${k.preset}» vuole "su" (attore) oppure "pos" e "guarda"`);
    if (dur) { out.push(T); if (k.t + dur < fine - 0.3) out.push({ ...T, t: k.t + dur, zoom: 3, planata: 0.75, _continua: true, volo: undefined }); return; }
    if (orbita) { const v = T.verso ?? 1; out.push({ ...T, angolo: T.angolo ?? (-orbita * v / 2), orbita: orbita * v, orbitaDur: fine - k.t, zoom: T.zoom ?? 1 }); return; }   // [13/11] arco continuo: una tappa sola, l'angolo scorre fluido nel motore
    // sali/scendi: un'unica tappa continua nel motore (nessuna seconda tappa artificiale a meta movimento)
    if (salita) { const sal = k.salita ?? salita; delete T.salita;
      out.push({ ...T, salita: sal, salitaDur: Math.min(2.2, Math.max(0.5, fine - k.t)), salitaArriva: !!(T.pos && !T.su), zoom: T.zoom ?? 1.5 }); return; }
    out.push(T); });
  SC.camera = out; return true;
}

// effetti sopra la posa: rollio (gradi, entra morbido C2) e scossa (colpi che cambiano verso ogni fotogramma, 7 f)
const ssE = x => x * x * x * (x * (x * 6 - 15) + 10), clE = x => Math.min(1, Math.max(0, x));
export function effetti(CAM, t, fps = 30, fineScena = Infinity) { let roll = 0, kick = 0;
  for (let i = 0; i < CAM.length; i++) { const k = CAM[i], nx = CAM[i + 1], fine = nx ? nx.t : Infinity;
    // fluttua: il rollio scorre con curva S da -metà a +metà per tutta l'inquadratura; se la tappa è un volo entra da k.t invece di anticipare
    const tIn = (i && !k.volo) ? k.t - 0.3 : k.t;
    if (k.rollioTratto && t >= tIn && t < fine + 0.3) { const f2 = nx ? nx.t : fineScena, u = f2 > k.t && isFinite(f2) ? clE((t - k.t) / (f2 - k.t)) : 0.5;
      const a = (i || k.volo) ? ssE(clE((t - tIn) / 0.6)) : 1, b = nx ? ssE(clE((fine + 0.3 - t) / 0.6)) : 1, e = Math.min(a, b); roll += k.rollioTratto * (ssE(u) - 0.5) * e; }
    if (k.rollio && t >= tIn && t < fine + 0.3) { const a = (i || k.volo) ? ssE(clE((t - tIn) / 0.6)) : 1, b = nx ? ssE(clE((fine + 0.3 - t) / 0.6)) : 1, u = Math.min(a, b); roll += k.rollio * u; }
    if (k.scossa) { const o = typeof k.scossa === 'object' ? k.scossa : { f: k.scossa }, n = Math.round((t - (o.t ?? k.t)) * fps);   /* "scossa": 1.2 (all'inizio della tappa) oppure { "f": 1.2, "t": "@parola" } */
      if (n >= 0 && n < 7) kick += (o.f ?? 1) * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5; } }
  return { roll, kick };
}
