// Look «disegnato» come modulo riusabile. NON è una riscrittura: le passate (strada bagnata a specchio sfumato, contorni
// a inchiostro, nebbia luminosa, bagliori, sagome che reagiscono alla luce) sono copiate riga per riga dalla scena
// approvata `references/look-disegnato/scena_disegnato.js` allo step 18. Cambia solo il mondo, che si costruisce dopo
// dentro `D.root` (vedi mondo_disegnato.js e storia_disegnato.js). Regole e valori: references/look-disegnato.md.
// La catena finale è SENZA OutputPass (scelta dell'utente). Non «pulire» i rami STEP: garantiscono lo stesso risultato.
import * as THREE from 'three';
import { scene, camera, renderer, sky, L } from '/web/engine.js';
import { RGBELoader } from '/lib/jsm/loaders/RGBELoader.js';
import { EffectComposer } from '/lib/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/lib/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '/lib/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '/lib/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from '/lib/jsm/postprocessing/ShaderPass.js';
import { Pass, FullScreenQuad } from '/lib/jsm/postprocessing/Pass.js';
import { drawOmino, personalita, OW, OH } from '/web/omino.js';
export { THREE, scene, camera, renderer, sky, L, drawOmino, personalita, OW, OH };
const STEP = 18;
// Varianti di luce (look-disegnato.md §2 e §9). `p` = parametri delle passate (gli stessi nomi dei parametri URL della scena modello).
export const LUCI = {
  notte: { cielo: ['#14286a', '#3a5aa8'], nebbia: ['#2a3c80', 0.018], hemi: ['#4a5ab0', '#1a1430', 1.6], sole: ['#8aa0ff', 0.15], amb: 0.1, asfalto: '#3a4278', p: {} },   // approvata
  // giorno: sereno e ASCIUTTO di default (niente pozzanghere se la storia non parla di pioggia)
  giorno: {
    cielo: ['#3a86dc', '#cfe6ff'], nebbia: ['#cfe2f6', 0.0045], hemi: ['#bcd8ff', '#8a7a6a', 1.3], sole: ['#ffe2b0', 3.2, [-22, 13, -4]], amb: 0.15, asfalto: '#76706a', stelle: 0,
    p: { asciutto: 1, bs: 0.25, br: 0.4, bt: 1.1, gs: 0.12, nk: 0.18 }
  },
  mattina: {
    cielo: ['#4d96e2', '#dcedff'], nebbia: ['#d8e6f5', 0.0052], hemi: ['#d0e6ff', '#8e7c6a', 1.25], sole: ['#ffe8c4', 2.8, [-18, 12, -8]], amb: 0.15, asfalto: '#78726c', stelle: 0,
    p: { asciutto: 1, bs: 0.25, br: 0.4, bt: 1.1, gs: 0.14, nk: 0.2 }
  },
  // tramonto / golden: controluce basso, cielo viola/arancio
  tramonto: {
    cielo: ['#443876', '#ffd08a'], nebbia: ['#f4c68c', 0.004], hemi: ['#b9a4e0', '#7a5a6a', 0.8], sole: ['#ffab5e', 4.5], amb: 0.1, asfalto: '#5b5173', stelle: 0,
    p: { asciutto: 1, bs: 0.35, br: 0.4, bt: 1.0, gs: 0.2, nk: 0.22 }
  },
  golden: {
    cielo: ['#443876', '#ffd08a'], nebbia: ['#f4c68c', 0.004], hemi: ['#b9a4e0', '#7a5a6a', 0.8], sole: ['#ffab5e', 4.5], amb: 0.1, asfalto: '#5b5173', stelle: 0,
    p: { asciutto: 1, bs: 0.35, br: 0.4, bt: 1.0, gs: 0.2, nk: 0.22 }
  },
  crepuscolo: {
    cielo: ['#292954', '#c98890'], nebbia: ['#9c7b96', 0.0055], hemi: ['#9888c8', '#4e415c', 0.85], sole: ['#ffa870', 2.6], amb: 0.12, asfalto: '#4c4662', stelle: 0.3,
    p: { asciutto: 1, bs: 0.3, br: 0.4, bt: 1.0, gs: 0.18, nk: 0.24 }
  },
  // interno: pavimento lucido che riflette solo vicino al contatto. DA TARARE su rif_7.7.jpg / rif_18.0.jpg con l'utente.
  interno: {
    cielo: ['#2a2430', '#3a3040'], nebbia: null, hemi: ['#fff0dc', '#806a5a', 1.2], sole: ['#ffffff', 0], amb: 0.25, asfalto: '#8a5a4a',
    p: { wk: 0.4, fh: 1.5, mk: '#000000', pa: 0.05, pb: 0.12, pc: '#ffe8d0', nk: 0.25 }
  },
};
// Preset HDRI + atmosfera accoppiata (PureSky 2K + interni): quando attivi guidano cielo equirect, IBL, nebbia e luce
export const HDRI_PRESETS = {
  kloppenheim_06_puresky: { file: 'kloppenheim_06_puresky.hdr', fog: ['#bcd0e6', 0.0034], soleCol: '#fff3da', soleI: 2.5, hemiCol: '#cde3ff', groundCol: '#7f785c', hemiI: 0.95, exp: 0.68, env: 0.42, sat: 1.15, az: 135, el: 44 },
  kloppenheim_02_puresky: { file: 'kloppenheim_02_puresky.hdr', fog: ['#c9dceb', 0.0040], soleCol: '#fff4dc', soleI: 2.3, hemiCol: '#d9ecff', groundCol: '#888068', hemiI: 1.0, exp: 0.65, env: 0.40, sat: 1.12, az: 130, el: 40 },
  evening_road_01_puresky: { file: 'evening_road_01_puresky.hdr', fog: ['#dfb394', 0.0044], soleCol: '#ffc27e', soleI: 3.4, hemiCol: '#cec0ea', groundCol: '#7b6260', hemiI: 0.9, exp: 0.62, env: 0.44, sat: 1.12, az: 132, el: 22, shade: [0.34, 0.36, 0.68], lift: [0.032, 0.028, 0.056] },
  qwantani_dusk_2_puresky: { file: 'qwantani_dusk_2_puresky.hdr', fog: ['#a688a4', 0.0048], soleCol: '#ffa870', soleI: 2.8, hemiCol: '#ab9ed8', groundCol: '#584b66', hemiI: 0.88, exp: 0.68, env: 0.40, sat: 1.10, az: 132, el: 18, shade: [0.36, 0.35, 0.70], lift: [0.028, 0.025, 0.058] },
  rogland_clear_night: { file: 'rogland_clear_night.hdr', fog: ['#20305a', 0.011], soleCol: '#9ab0ff', soleI: 1.6, hemiCol: '#3f539c', groundCol: '#1f1830', hemiI: 0.85, exp: 1.10, env: 0.34, sat: 1.08, az: 145, el: 42 },
  kloofendal_48d_partly_cloudy_puresky: { file: 'kloofendal_48d_partly_cloudy_puresky.hdr', fog: ['#c3d6ea', 0.0042], soleCol: '#fff1d8', soleI: 2.4, hemiCol: '#d4e8ff', groundCol: '#807860', hemiI: 0.95, exp: 0.94, env: 0.40, sat: 1.06, az: 140, el: 45 },
  kloofendal_43d_clear_puresky: { file: 'kloofendal_43d_clear_puresky.hdr', fog: ['#c6dbf0', 0.0038], soleCol: '#fff4de', soleI: 2.5, hemiCol: '#d6ecff', groundCol: '#857c62', hemiI: 0.92, exp: 0.92, env: 0.40, sat: 1.06, az: 140, el: 48 },
  kloofendal_overcast_puresky: { file: 'kloofendal_overcast_puresky.hdr', fog: ['#c4ccd6', 0.0052], soleCol: '#f2f5ff', soleI: 1.7, hemiCol: '#dce4ef', groundCol: '#7b7872', hemiI: 1.1, exp: 0.90, env: 0.45, sat: 1.02, az: 140, el: 55 },
  belfast_sunset_puresky: { file: 'belfast_sunset_puresky.hdr', fog: ['#e0a782', 0.0046], soleCol: '#ffb56c', soleI: 3.3, hemiCol: '#bda6de', groundCol: '#6d5058', hemiI: 0.72, exp: 0.95, env: 0.44, sat: 1.12, az: 20, el: 12 },
  industrial_sunset_puresky: { file: 'industrial_sunset_puresky.hdr', fog: ['#d99d7a', 0.0046], soleCol: '#ffae66', soleI: 3.2, hemiCol: '#b49ed4', groundCol: '#644a50', hemiI: 0.74, exp: 0.95, env: 0.44, sat: 1.10, az: 22, el: 13 },
  kloofendal_misty_morning_puresky: { file: 'kloofendal_misty_morning_puresky.hdr', fog: ['#d2dce6', 0.0068], soleCol: '#ffeccf', soleI: 2.1, hemiCol: '#d8e6f5', groundCol: '#88806c', hemiI: 1.05, exp: 0.92, env: 0.38, sat: 1.04, az: 125, el: 34 },
  kiara_interior: { file: 'kiara_interior.hdr', fog: null, soleCol: '#ffe6be', soleI: 1.8, hemiCol: '#fff0dc', groundCol: '#7a5848', hemiI: 0.9, exp: 0.95, env: 0.32, sat: 1.0 },
  lythwood_room: { file: 'lythwood_room.hdr', fog: null, soleCol: '#ffebd0', soleI: 1.8, hemiCol: '#fff2e2', groundCol: '#7c5d4c', hemiI: 0.92, exp: 0.95, env: 0.34, sat: 1.0 },
  wooden_lounge: { file: 'wooden_lounge.hdr', fog: null, soleCol: '#ffe0b2', soleI: 1.7, hemiCol: '#ffe8cc', groundCol: '#74523e', hemiI: 0.88, exp: 0.95, env: 0.32, sat: 1.0 },
  palermo_square: { file: 'palermo_square.hdr', fog: ['#4d4a6e', 0.008], soleCol: '#ffdca8', soleI: 2.0, hemiCol: '#989ec8', groundCol: '#4c4452', hemiI: 0.85, exp: 0.98, env: 0.40, sat: 1.06 },
  piazza_bologni: { file: 'piazza_bologni.hdr', fog: ['#c9d6e4', 0.0044], soleCol: '#fff0d0', soleI: 2.4, hemiCol: '#cce0f6', groundCol: '#807664', hemiI: 0.92, exp: 0.94, env: 0.42, sat: 1.06 },
  moonlit_golf: { file: 'moonlit_golf.hdr', fog: ['#1e2b52', 0.012], soleCol: '#9cb2ff', soleI: 1.6, hemiCol: '#40549a', groundCol: '#1c162c', hemiI: 0.85, exp: 1.05, env: 0.34, sat: 1.05 },
  qwantani_night: { file: 'qwantani_night.hdr', fog: ['#1d284c', 0.012], soleCol: '#96acff', soleI: 1.6, hemiCol: '#3d5094', groundCol: '#1b152a', hemiI: 0.85, exp: 1.05, env: 0.34, sat: 1.05 },
  cobblestone_street_night: { file: 'cobblestone_street_night.hdr', fog: ['#232844', 0.012], soleCol: '#ffcf98', soleI: 1.7, hemiCol: '#4a568e', groundCol: '#241c30', hemiI: 0.85, exp: 1.0, env: 0.36, sat: 1.06 },
};
const HDRI_AUTO = {
  giorno: 'kloppenheim_06_puresky', day: 'kloppenheim_06_puresky',
  mattina: 'kloppenheim_02_puresky', alba: 'kloppenheim_02_puresky',
  tramonto: 'evening_road_01_puresky', golden: 'evening_road_01_puresky',
  crepuscolo: 'qwantani_dusk_2_puresky', dusk: 'qwantani_dusk_2_puresky',
  notte: 'rogland_clear_night',
  interno: 'kiara_interior',
};
const HDR_CACHE = new Map();
// P = { luce: 'notte'|'giorno'|'interno', strada: { w, l, x, z, colore }, parametri: { … } }
export function creaDisegnato(P = {}) {
  const LU = LUCI[P.luce || 'notte'] || LUCI.notte, par = { ...LU.p, ...(P.parametri || {}) };
  const rawLC = par.luce_cinema ?? P.luce_cinema;
  const LC = !!rawLC;
  const LC_OPT = (rawLC && typeof rawLC === 'object') ? rawLC : {};
  const Q = { get: k => (par[k] !== undefined && par[k] !== null && par[k] !== false ? String(par[k]) : null), has: k => !!par[k] };
  const LR = Q.has('luce_rick') || (LC && par.luce_rick !== 0 && par.luce_rick !== false);
  // [12/11] ANTIALIASING facoltativo ("ss": 2 nei parametri): la scena e le passate a schermo intero si rendono a 2160x3840 e il fotogramma
  // si rimpicciolisce a 1080x1920 prima di salvarlo (rendi_disegnato.mjs). Linee e bagliori tarati come prima (passi in UV, bagliore a 1080).
  // Toglie il tremolio dei dettagli fini lontani (griglie, scaffali, piastrelle). Senza "ss" non cambia nulla.
  const SS = Math.max(1, Math.min(2, +(Q.get('ss') || 1))), RW = Math.round(1080 * SS), RH = Math.round(1920 * SS);
  if (SS > 1) renderer.setSize(RW, RH, false);
  const RICK_LIGHTS = {
    day: {
      az: 140, el: 48,   // az misurato dalla direzione di vista: 140° = dietro a destra (i muri di fondo prendono luce)
      lit: [1.54, 1.47, 1.35], shade: [0.62, 0.64, 0.90], lift: [0.012, 0.016, 0.034],   // luce calda → ombra blu-violetta (complementare)
      lambert: 0.35, sideK: 0.82, term: 0.20,
      charTint: [1.0, 0.95, 0.93], charShade: 0.88, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.92, 0.90, 0.96],
      soleCol: '#fff3e0', soleI: 2.4, hemiCol: '#dcecff', groundCol: '#b49a78', hemiI: 0.9, ambI: 0.12
    },
    giorno: {
      az: 140, el: 48,   // az misurato dalla direzione di vista: 140° = dietro a destra (i muri di fondo prendono luce)
      lit: [1.54, 1.47, 1.35], shade: [0.62, 0.64, 0.90], lift: [0.012, 0.016, 0.034],   // luce calda → ombra blu-violetta (complementare)
      lambert: 0.35, sideK: 0.82, term: 0.20,
      charTint: [1.0, 0.95, 0.93], charShade: 0.88, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.92, 0.90, 0.96],
      soleCol: '#fff3e0', soleI: 2.4, hemiCol: '#dcecff', groundCol: '#b49a78', hemiI: 0.9, ambI: 0.12
    },
    tramonto: {
      az: 15, el: 9,
      lit: [1.42, 0.79, 0.48], shade: [0.176, 0.206, 0.72], lift: [0.035, 0.030, 0.075],
      lambert: 0.35, sideK: 0.82, term: 0.07,
      charTint: [1.0, 0.85, 0.68], charShade: 0.88, charGrad: 0.10, bodyGrad: 0.25, sideTint: [0.85, 0.80, 0.95],
      soleCol: '#ffab5e', soleI: 4.8, hemiCol: '#b9a4e0', groundCol: '#7a5a6a', hemiI: 0.6, ambI: 0.08
    },
    golden: {
      az: 15, el: 9,
      lit: [1.42, 0.79, 0.48], shade: [0.176, 0.206, 0.72], lift: [0.035, 0.030, 0.075],
      lambert: 0.35, sideK: 0.82, term: 0.07,
      charTint: [1.0, 0.85, 0.68], charShade: 0.88, charGrad: 0.10, bodyGrad: 0.25, sideTint: [0.85, 0.80, 0.95],
      soleCol: '#ffab5e', soleI: 4.8, hemiCol: '#b9a4e0', groundCol: '#7a5a6a', hemiI: 0.6, ambI: 0.08
    },
    mattina: {
      az: 130, el: 40,
      lit: [1.52, 1.48, 1.38], shade: [0.64, 0.68, 0.92], lift: [0.014, 0.018, 0.036],
      lambert: 0.35, sideK: 0.82, term: 0.20,
      charTint: [1.0, 0.96, 0.94], charShade: 0.88, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.92, 0.91, 0.97],
      soleCol: '#ffe8c4', soleI: 2.3, hemiCol: '#d6ebff', groundCol: '#9c8c74', hemiI: 0.95, ambI: 0.13
    },
    crepuscolo: {
      az: 35, el: 12,
      lit: [1.38, 0.96, 0.78], shade: [0.28, 0.28, 0.72], lift: [0.028, 0.025, 0.064],
      lambert: 0.35, sideK: 0.82, term: 0.10,
      charTint: [0.98, 0.88, 0.80], charShade: 0.88, charGrad: 0.09, bodyGrad: 0.24, sideTint: [0.88, 0.84, 0.96],
      soleCol: '#ffa468', soleI: 2.8, hemiCol: '#9888c8', groundCol: '#4d415a', hemiI: 0.78, ambI: 0.10
    },
    notte: {
      az: 145, el: 45,
      lit: [1.46, 1.31, 1.14], shade: [0.57, 0.50, 0.90], lift: [0.014, 0.016, 0.040],   // lampade calde, ombre blu come Rick di sera (.47,.51,.91)
      lambert: 0.35, sideK: 0.82, term: 0.15,
      charTint: [0.96, 0.96, 1.02], charShade: 0.88, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.90, 0.88, 0.96],
      soleCol: '#9ab0ff', soleI: 1.6, hemiCol: '#4a5ab0', groundCol: '#261e38', hemiI: 0.9, ambI: 0.10
    },
    interno: {
      az: 145, el: 45,
      lit: [1.48, 1.34, 1.14], shade: [0.60, 0.52, 0.88], lift: [0.016, 0.014, 0.036],   // luce calda → ombra violetta
      lambert: 0.35, sideK: 0.82, term: 0.18,
      charTint: [1.0, 0.97, 0.92], charShade: 0.88, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.92, 0.90, 0.96],
      soleCol: '#ffe4b8', soleI: 1.8, hemiCol: '#fff0dc', groundCol: '#7a5848', hemiI: 0.9, ambI: 0.14
    }
  };
  const RL_CONF = LR ? { ...(RICK_LIGHTS[P.luce] || RICK_LIGHTS.interno) } : null;
  const st = P.strada || {}, SW = st.w || 14, SL = st.l || 120, SX = st.x || 0, SZ = st.z !== undefined ? st.z : -50;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = +(Q.get('esp') || 1.0);
  scene.fog = LU.nebbia ? new THREE.FogExp2(LU.nebbia[0], LU.nebbia[1]) : null;
  // Upgrade materiale cielo (mantiene lo stesso Mesh `sky` per compatibilità totale con ndPass, wetPass e luceAt)
  if (!sky.userData.hdrReady) {
    sky.userData.hdrReady = true;
    const oldU = sky.material.uniforms;
    sky.material = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        top: oldU.top,
        bot: oldU.bot,
        stars: oldU.stars || { value: 0 },
        uUseHdr: { value: 0 },
        uHdrMap: { value: null },
        uHdrRot: { value: 0 },
        uHdrExp: { value: 0.95 },
        uHdrSat: { value: 1.08 },
        uHdrTint: { value: new THREE.Color('#ffffff') },
        uFogCol: { value: new THREE.Color(LU.nebbia ? LU.nebbia[0] : '#cfe2f6') },
      },
      vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform vec3 top, bot, uHdrTint, uFogCol; uniform float stars, uUseHdr, uHdrRot, uHdrExp, uHdrSat; uniform sampler2D uHdrMap; varying vec3 vP;
        float h(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
        vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
        void main(){
          vec3 d = normalize(vP);
          if (uUseHdr > 0.5) {
            float th = atan(d.z, d.x) + uHdrRot;
            float ph = asin(clamp(d.y, -0.9999, 0.9999));
            vec2 uvH = vec2(fract(th / 6.2831853 + 0.5), ph / 3.14159265 + 0.5);
            vec3 c = texture2D(uHdrMap, uvH).rgb * uHdrExp;
            c = aces(c);
            float l = dot(c, vec3(0.299, 0.587, 0.114));
            c = mix(vec3(l), c, uHdrSat) * uHdrTint;
            float hMix = smoothstep(-0.08, 0.03, d.y);
            c = mix(uFogCol, c, hMix);
            gl_FragColor = vec4(clamp(c, 0.0, 0.96), 1.0);
            return;
          }
          float t=clamp(d.y*1.6+0.1,0.,1.); vec3 c=mix(bot,top,t);
          vec3 q=floor(d*260.); float s=step(0.9965,h(q))*stars*smoothstep(0.05,0.3,d.y); c+=vec3(s);
          gl_FragColor=vec4(c,1.);
        }`
    });
  }
  sky.material.uniforms.top.value.set(LU.cielo[0]); sky.material.uniforms.bot.value.set(LU.cielo[1]); if (LU.stelle !== undefined && sky.material.uniforms.stars) sky.material.uniforms.stars.value = LU.stelle;
  sky.material.uniforms.uUseHdr.value = 0; sky.material.uniforms.uHdrMap.value = null;

  // Integrazione opzionale HDRI PureSky / ambiente ("hdri": "auto" | "<id>" | { id, rot, exp, env, ... })
  const rawHdr = P.hdri ?? par.hdri;
  let hdrEnvScale = 1.0, hasHdrEnv = false, hdrReady = Promise.resolve(null);
  if (rawHdr && rawHdr !== 'none' && rawHdr !== false) {
    const hdrObj = typeof rawHdr === 'string' ? { id: rawHdr } : rawHdr;
    const pickedId = (hdrObj.id === 'auto' || hdrObj.id === true) ? (HDRI_AUTO[P.luce || 'giorno'] || HDRI_AUTO.giorno) : hdrObj.id;
    const hConf = HDRI_PRESETS[pickedId] || { file: pickedId.endsWith('.hdr') ? pickedId : `${pickedId}.hdr`, exp: 0.95, env: 0.40, sat: 1.08 };
    const hdrRot = (hdrObj.rot ?? par.hdri_rot ?? hConf.rot ?? 0) * Math.PI / 180;
    const hdrExp = hdrObj.exp ?? par.hdri_exp ?? hConf.exp ?? 0.95;
    const hdrSat = hdrObj.sat ?? hConf.sat ?? 1.06;
    hdrEnvScale = hdrObj.env ?? par.hdri_env ?? hConf.env ?? 0.40;
    if (hConf.fog && hdrObj.nebbia !== false && !par.no_hdri_fog) {
      scene.fog = new THREE.FogExp2(hdrObj.fogCol || hConf.fog[0], hdrObj.fogDens ?? hConf.fog[1]);
    }
    if (RL_CONF) {
      if (hdrObj.soleCol || hConf.soleCol) RL_CONF.soleCol = hdrObj.soleCol || hConf.soleCol;
      if (hdrObj.soleI !== undefined || hConf.soleI !== undefined) RL_CONF.soleI = hdrObj.soleI ?? hConf.soleI;
      if (hdrObj.hemiCol || hConf.hemiCol) RL_CONF.hemiCol = hdrObj.hemiCol || hConf.hemiCol;
      if (hdrObj.groundCol || hConf.groundCol) RL_CONF.groundCol = hdrObj.groundCol || hConf.groundCol;
      if (hdrObj.hemiI !== undefined || hConf.hemiI !== undefined) RL_CONF.hemiI = hdrObj.hemiI ?? hConf.hemiI;
      if (hdrObj.shade || hConf.shade) RL_CONF.shade = hdrObj.shade || hConf.shade;
      if (hdrObj.lit || hConf.lit) RL_CONF.lit = hdrObj.lit || hConf.lit;
      if (hdrObj.lift || hConf.lift) RL_CONF.lift = hdrObj.lift || hConf.lift;
      if (hdrObj.az !== undefined || hConf.az !== undefined) RL_CONF.az = hdrObj.az ?? hConf.az;
      if (hdrObj.el !== undefined || hConf.el !== undefined) RL_CONF.el = hdrObj.el ?? hConf.el;
    }
    const urlHdr = `/kit/hdri/${hConf.file}`;
    hdrReady = (HDR_CACHE.get(urlHdr) || (() => {
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const pr = new Promise(res => {
        new RGBELoader().load(urlHdr, tex => {
          tex.mapping = THREE.EquirectangularReflectionMapping;
          const envRT = pmrem.fromEquirectangular(tex);
          pmrem.dispose();
          res({ tex, envRT });
        }, undefined, err => {
          console.error('[d] Errore HDRI', urlHdr, err);
          pmrem.dispose();
          res(null);
        });
      });
      HDR_CACHE.set(urlHdr, pr);
      return pr;
    })()).then(res => {
      if (!res) return null;
      hasHdrEnv = true;
      scene.environment = res.envRT.texture;
      const u = sky.material.uniforms;
      u.uHdrMap.value = res.tex;
      u.uHdrRot.value = hdrRot;
      u.uHdrExp.value = hdrExp;
      u.uHdrSat.value = hdrSat;
      u.uHdrTint.value.set(hdrObj.tinta || hConf.tint || '#ffffff');
      u.uFogCol.value.set(scene.fog ? scene.fog.color : '#cfe2f6');
      u.uUseHdr.value = (par.chiuso && !hdrObj.visibile) ? 0 : 1;
      return pickedId;
    });
  }
  if (LC && RL_CONF) {
    const kLuce = P.luce || 'interno';
    const expAz = (typeof rawHdr === 'object' && rawHdr?.az !== undefined) || par.sun_az !== undefined || LC_OPT.az !== undefined;
    const expEl = (typeof rawHdr === 'object' && rawHdr?.el !== undefined) || par.sun_el !== undefined || LC_OPT.el !== undefined;
    if (kLuce === 'day' || kLuce === 'giorno' || kLuce === 'mattina') {
      if (!expAz) RL_CONF.az = kLuce === 'mattina' ? 116 : 114;
      if (!expEl) RL_CONF.el = kLuce === 'mattina' ? 28 : 32;
      Object.assign(RL_CONF, {
        lit: [1.46, 1.39, 1.26], shade: [0.58, 0.62, 0.88], lift: [0.009, 0.013, 0.028],
        lambert: 0.40, sideK: 0.85, term: 0.22, hemiI: 1.0, groundCol: '#7b735a',
        sat: 1.46, cap: 0.92, shift: 0.36, indirectK: 0.34, directMul: 0.85,
      });
    } else if (kLuce === 'tramonto' || kLuce === 'golden' || kLuce === 'crepuscolo') {
      const isC = kLuce === 'crepuscolo';
      if (!expAz) RL_CONF.az = isC ? 106 : 102;
      if (!expEl) RL_CONF.el = isC ? 18 : 18;
      Object.assign(RL_CONF, {
        lit: isC ? [1.34, 0.96, 0.78] : [1.44, 0.88, 0.56],
        shade: [0.34, 0.36, 0.72], lift: [0.014, 0.014, 0.036],
        lambert: 0.38, sideK: 0.84, term: 0.16, hemiI: 0.90,
        sat: 1.44, cap: 0.92, shift: 0.35, indirectK: 0.32, directMul: 0.90,
      });
    } else if (kLuce === 'notte') {
      Object.assign(RL_CONF, {
        lit: [1.34, 1.22, 1.10], shade: [0.42, 0.44, 0.78], lift: [0.008, 0.010, 0.024],
        lambert: 0.42, sideK: 0.84, term: 0.22,
        sat: 1.36, cap: 0.92, shift: 0.36, indirectK: 0.24, directMul: 0.95,
      });
    } else {
      Object.assign(RL_CONF, {
        lit: [1.05, 0.97, 0.88], shade: [0.64, 0.62, 0.74], lift: [0.008, 0.009, 0.016],
        lambert: 0.42, sideK: 0.83, term: 0.24,
        soleCol: '#fff0d6', soleI: 1.55, hemiCol: '#fff3e2', groundCol: '#9a745a', hemiI: 0.92, ambI: 0.14,
        sat: 1.30, cap: 0.88, shift: 0.22, indirectK: 0.45, directMul: 0.85,
      });
    }
    if (LC_OPT.az !== undefined) RL_CONF.az = LC_OPT.az;
    if (par.sun_az !== undefined) RL_CONF.az = +par.sun_az;
    if (LC_OPT.el !== undefined) RL_CONF.el = LC_OPT.el;
    if (par.sun_el !== undefined) RL_CONF.el = +par.sun_el;
    if (LC_OPT.bounce === false) RL_CONF.indirectK = 0;
  }
  if (LR) {
    L.sun.color.set(RL_CONF.soleCol); L.sun.intensity = RL_CONF.soleI;
    L.hemi.color.set(RL_CONF.hemiCol); L.hemi.groundColor.set(RL_CONF.groundCol); L.hemi.intensity = RL_CONF.hemiI;
    L.amb.intensity = RL_CONF.ambI;
    L.sun.castShadow = true;
    L.sun.shadow.bias = -0.0003;
    L.sun.shadow.normalBias = 0.02;
  } else {
    L.hemi.color.set(LU.hemi[0]); L.hemi.groundColor.set(LU.hemi[1]); L.hemi.intensity = LU.hemi[2]; L.sun.color.set(LU.sole[0]); L.sun.intensity = LU.sole[1]; L.amb.intensity = LU.amb;
    if (LU.sole[2]) { L.sun.position.set(...LU.sole[2]); L.sun.target.position.set(0, 0, -8); Object.assign(L.sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, far: 80 }); L.sun.shadow.camera.updateProjectionMatrix(); }
  }
  // tutto il mondo (cielo e luci compresi) vive in `root`: per il riflesso si capovolge root, non la scena
  const root = new THREE.Group();[...scene.children].forEach(c => root.add(c)); scene.add(root);
  const road = new THREE.Mesh(new THREE.BoxGeometry(SW, 0.1, SL), new THREE.MeshStandardMaterial({ color: st.colore || LU.asfalto, roughness: 0.55 }));
  road.position.set(SX, -0.05, SZ); road.receiveShadow = true; road.userData.suolo = true; root.add(road);

  // Due toni per i materiali del mondo quando luce_rick è attiva
  const LFB_CHUNK = THREE.ShaderChunk.lights_fragment_begin
    .replace('directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ]',
      'sunVis = ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ]')
    .replace('vDirectionalShadowCoord[ i ] ) : 1.0;', 'vDirectionalShadowCoord[ i ] ) : 1.0;\n\t\tdirectLight.color *= sunVis;')
    .replace('#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )',
      'vec3 localDirectDiff = reflectedLight.directDiffuse;\n#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )');

  const TWO_TONE_DECL = `
uniform vec3 uLitCol;
uniform vec3 uShadeCol;
uniform vec3 uShadeLift;
uniform float uLambert;
uniform float uSideK;
uniform float uTerm;
uniform float uSat;
uniform float uCap;
uniform float uShift;
uniform float uShadowK;
uniform float uCinema;
uniform float uIndirectK;
uniform float uDirectMul;
uniform vec3 uLampV[6];
uniform float uLampW[6];
uniform float uLampN;
`;

  const TWO_TONE = `
#if NUM_DIR_LIGHTS > 0
{
  vec3 sunV = directionalLights[ 0 ].direction;
  vec3 upV = normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz );
  float ndl = max( dot( geometryNormal, sunV ), 0.0 );
  if ( uLampN > 0.001 ) { float best = 0.0; for ( int i = 0; i < 6; i++ ) { vec3 tl = normalize( uLampV[ i ] + vViewPosition ); best = max( best, max( dot( geometryNormal, tl ), 0.0 ) * uLampW[ i ] ); } ndl = mix( ndl, best, uLampN ); }   // luogo chiuso: luce dalle lampade vere inquadrate (posizione per ogni punto, non una direzione unica)
  float sunTerm = mix( 1.0, sunVis, uShadowK ) * smoothstep( 0.0, uTerm, ndl );   // uShadowK: nei luoghi chiusi le ombre portate esistono solo se la luce che le fa è nel quadro
  float skyK = mix( uSideK, 1.0, 0.5 + 0.5 * dot( geometryNormal, upV ) );
  vec3 lit = uLitCol * mix( 1.0, ndl, uLambert );
  vec3 dcol = diffuseColor.rgb; dcol = max( mix( vec3( dot( dcol, vec3( 0.299, 0.587, 0.114 ) ) ), dcol, uSat ), 0.0 );   // colori pieni come Rick (sat ~0,4)
#ifdef USE_AOMAP
  dcol *= mix( 1.0, ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0, 0.45 );
#endif
  vec3 shd = dcol * uShadeCol; float shl = dot( shd, vec3( 0.299, 0.587, 0.114 ) );
  shd = mix( shd, shl * normalize( uShadeCol ) * 1.732, uShift );   // in ombra la tinta gira verso il colore dell'ombra (rosso → prugna, come Rick), non solo più scura
  vec3 baseDiffuse = mix( shd, dcol * lit, sunTerm ) * skyK + uShadeLift * ( 1.0 - sunTerm );
  { float bl = dot( baseDiffuse, vec3( 0.299, 0.587, 0.114 ) ); baseDiffuse = mix( baseDiffuse, bl * normalize( uShadeCol ) * 1.732, uShift * 0.8 * ( 1.0 - smoothstep( 0.04, 0.22, bl ) ) ); }   // toni scuri verso il prugna (Rick: i neri non sono marroni)
  if ( uCinema > 0.5 ) {
    reflectedLight.directDiffuse = baseDiffuse + localDirectDiff * uDirectMul;
    float mxd = max( reflectedLight.directDiffuse.r, max( reflectedLight.directDiffuse.g, reflectedLight.directDiffuse.b ) );
    if ( mxd > uCap * 0.72 ) {
      float excess = mxd - uCap * 0.72;
      float soft = uCap * 0.72 + (uCap * 0.28) * (excess / (excess + uCap * 0.28));
      reflectedLight.directDiffuse *= soft / max( mxd, 1e-4 );
    }
    float mxs = max( reflectedLight.directSpecular.r, max( reflectedLight.directSpecular.g, reflectedLight.directSpecular.b ) );
    if ( mxs > 0.22 ) {
      float xs = mxs - 0.22;
      reflectedLight.directSpecular *= ( 0.22 + 0.14 * ( xs / ( xs + 0.30 ) ) ) / max( mxs, 1e-4 );
    }
    reflectedLight.indirectDiffuse *= uIndirectK;
  } else {
    #if NUM_POINT_LIGHTS > 0
      reflectedLight.directDiffuse = baseDiffuse + reflectedLight.directDiffuse * 0.25;
    #else
      reflectedLight.directDiffuse = baseDiffuse;
    #endif
    { float mxd = max( reflectedLight.directDiffuse.r, max( reflectedLight.directDiffuse.g, reflectedLight.directDiffuse.b ) ); if ( mxd > uCap ) reflectedLight.directDiffuse *= uCap / mxd; }   // tetto: superfici del mondo <= L* 85, niente alone
    reflectedLight.indirectDiffuse = vec3( 0.0 );
  }
  totalEmissiveRadiance = (totalEmissiveRadiance.r > 0.45 || totalEmissiveRadiance.g > 0.45 || totalEmissiveRadiance.b > 0.45)
    ? totalEmissiveRadiance : totalEmissiveRadiance * 0.15;
}
#endif
`;

  const TONE_UNIFORMS = LR ? {
    uLitCol: { value: new THREE.Vector3(...RL_CONF.lit) },
    uShadeCol: { value: new THREE.Vector3(...RL_CONF.shade) },
    uShadeLift: { value: new THREE.Vector3(...RL_CONF.lift) },
    uLambert: { value: RL_CONF.lambert },
    uSideK: { value: RL_CONF.sideK },
    uTerm: { value: RL_CONF.term },
    uSat: { value: +(Q.get('lr_sat') || RL_CONF.sat || 1.6) },
    uCap: { value: +(Q.get('lr_cap') || RL_CONF.cap || 0.78) },
    uShift: { value: +(Q.get('lr_shift') || RL_CONF.shift || 0.55) },
    uShadowK: { value: 1 },
    uCinema: { value: LC ? 1 : 0 },
    uIndirectK: { value: +(LC_OPT.indirectK ?? RL_CONF.indirectK ?? 0) },
    uDirectMul: { value: +(LC_OPT.directMul ?? RL_CONF.directMul ?? 1.0) },
    uLampV: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector3()) },
    uLampW: { value: [0, 0, 0, 0, 0, 0] },
    uLampN: { value: 0 }
  } : null;

  function applyTwoTone(m) {
    if (!LR || !m || !m.isMeshStandardMaterial || m.userData?.twoToneDone) return;
    m.userData.twoToneDone = true;
    const prevOBC = m.onBeforeCompile;
    m.onBeforeCompile = (sh, ren) => {
      if (prevOBC) prevOBC(sh, ren);
      Object.assign(sh.uniforms, TONE_UNIFORMS);
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", TWO_TONE_DECL + "\n#include <common>")
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB_CHUNK)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + TWO_TONE);
    };
    const subKey = m.userData?.obcKey || '';
    m.customProgramCacheKey = () => subKey + "twoToneLR8";
    m.needsUpdate = true;
  }

  // ===== sagome (copiate da scena_disegnato.js, valori dello step 18) =====
  const cardLitMat = (t, et) => {
    if (LR) {
      return new THREE.ShaderMaterial({
        side: THREE.DoubleSide, transparent: false,
        uniforms: {
          map: { value: t },
          edge: { value: et },
          uSunDir: { value: new THREE.Vector3(0.8, 0.4, 0.4) },
          uCharTint: { value: new THREE.Color(...RL_CONF.charTint) },
          uCharShade: { value: RL_CONF.charShade },
          uGrad: { value: RL_CONF.charGrad },
          uBodyGrad: { value: RL_CONF.bodyGrad },
          uSideTint: { value: new THREE.Color(...RL_CONF.sideTint) },
          uCinema: { value: LC ? 1 : 0 },
          uRimCol: { value: new THREE.Color(1, 0.95, 0.88) },
          uRimPow: { value: 0 },
          uRimBack: { value: 0 },
          uRimSide: { value: 1 },
          uSideKeyDir: { value: 1 },
          uKeyMix: { value: 0 },
          uFloorCol: { value: new THREE.Color(0, 0, 0) },
          uLightCol: { value: new THREE.Color(0, 0, 0) },
          uLightCol2: { value: new THREE.Color(0, 0, 0) },
          uLightDir: { value: new THREE.Vector3(0, 0.2, 1) },
          uLightPow: { value: 0 },
          uLightPow2: { value: 0 },
          hlk: { value: 0 }
        },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `uniform sampler2D map, edge;
        uniform vec3 uSunDir, uCharTint, uSideTint, uRimCol, uFloorCol, uLightCol, uLightCol2, uLightDir;
        uniform float uCharShade, uGrad, uBodyGrad, uCinema, uRimPow, uRimBack, uRimSide, uSideKeyDir, uKeyMix, uLightPow, uLightPow2;
        varying vec2 vUv;
        void main(){
          vec4 c = texture2D(map, vUv);
          if (c.a < 0.5) discard;
          float head = smoothstep(0.52, 0.65, vUv.y);
          float g = mix(uBodyGrad, uGrad, head);
          float baseSide = clamp(uSunDir.x * 1.4, -1.0, 1.0);
          float side = mix(baseSide, clamp(uSideKeyDir, -1.0, 1.0), uKeyMix);
          float u = clamp((vUv.x - 0.5) / 0.25, -1.0, 1.0);
          float t = u * side;
          float dark = smoothstep(0.1, 1.0, -t);
          vec3 sideK = mix(vec3(1.0), uSideTint, dark * (g / max(uGrad, 1e-3)) * 0.5);
          float top = 1.0 + 0.055 * clamp((vUv.y - 0.72) / 0.15, -1.0, 1.0) * head;
          float lift = 1.0 + 0.03 * max(t, 0.0);
          float l0 = dot(c.rgb, vec3(0.299, 0.587, 0.114));
          vec3 col = mix(c.rgb, c.rgb * uCharTint, 0.25 + 0.75 * smoothstep(0.15, 0.7, l0));
          float shadeFactor = (1.0 - g * dark) * top * lift;
          col *= shadeFactor * sideK;
          float inkMask = smoothstep(0.10, 0.24, l0);
          if (uLightPow > 0.001) {
            float lu = clamp((vUv.x - 0.5) / 0.28, -1.0, 1.0);
            float lv = clamp((vUv.y - 0.45) / 0.45, -1.0, 1.0);
            float dirX = lu * uLightDir.x;
            float dirY = lv * uLightDir.y * 0.45;
            float frontWrap = clamp(0.48 + 0.42 * uLightDir.z, 0.22, 0.92);
            float hitMask = smoothstep(-0.35, 0.65, dirX + dirY + frontWrap * 0.45);
            float oppMask = smoothstep(0.05, 0.85, -dirX - frontWrap * 0.25);
            float hitK = clamp(uLightPow, 0.0, 1.25) * hitMask * inkMask;
            vec3 litTgt = col * (vec3(0.55) + uLightCol * 1.35) + uLightCol * (0.24 + 0.10 * head);
            col = mix(col, litTgt, clamp(hitK * 0.68, 0.0, 0.78));
            col *= mix(1.0, 0.78, oppMask * clamp(uLightPow * 0.55, 0.0, 0.45) * inkMask);
            if (uLightPow2 > 0.001) {
              float fillMask = smoothstep(-0.2, 0.7, -dirX) * clamp(uLightPow2, 0.0, 0.7) * 0.35 * inkMask;
              vec3 litTgt2 = col * (vec3(0.65) + uLightCol2 * 1.15) + uLightCol2 * 0.18;
              col = mix(col, litTgt2, fillMask);
            }
          }
          if (uRimPow > 0.001) {
            vec3 ev = texture2D(edge, vUv).rgb;
            float sideLerp = clamp(uRimSide * 0.5 + 0.5, 0.0, 1.0);
            float edgeDir = mix(mix(ev.g, ev.r, sideLerp), max(ev.r, ev.g), uRimBack);
            float rimEdge = max(edgeDir, ev.b * (0.52 + 0.48 * uRimBack));
            float rimBand = smoothstep(0.46, 0.84, rimEdge) * inkMask;
            vec3 rimTgt = mix(uRimCol, vec3(1.0), 0.16);
            col = mix(col, max(col, rimTgt * 0.92), rimBand * clamp(uRimPow, 0.0, 0.92));
          }
          col += uFloorCol * (1.0 - smoothstep(0.0, 0.48, vUv.y)) * 0.28 * inkMask;
          float mx = max(col.r, max(col.g, col.b));
          float capC = mix(0.92, 0.88, uCinema);
          if (mx > capC) col *= capC / mx;   // tetto <= 0,92: le teste chiare non bruciano col bagliore
          gl_FragColor = vec4(col, 1.0);
        }`
      });
    }
    return new THREE.ShaderMaterial({
      side: THREE.DoubleSide, transparent: false,
      uniforms: { edge: { value: et }, rimBack: { value: 0 }, hlk: { value: Q.has('rimdbg') ? 2 : STEP >= 17 ? 1 : 0 }, map: { value: t }, tint: { value: new THREE.Color(1, 1, 1) }, rimC: { value: new THREE.Color(0, 0, 0) }, rimD: { value: 1 }, rimC2: { value: new THREE.Color(0, 0, 0) }, floorC: { value: new THREE.Color(0, 0, 0) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform sampler2D map, edge; uniform vec3 tint, rimC, rimC2, floorC; uniform float rimD, hlk, rimBack; varying vec2 vUv;
    float A(vec2 o){ return texture2D(map, vUv + o).a; }
    void main(){ vec4 c = texture2D(map, vUv); if (c.a < 0.5) discard;
      float thick = smoothstep(0.30, 0.36, vUv.y);   // solo testa e corpo, non gambe e braccia sottili
      float sx = rimD > 0. ? vUv.x : 1. - vUv.x;      // 0 lato lontano dalla luce, 1 lato verso la luce
      float l0 = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      vec3 col = mix(c.rgb, c.rgb * tint, 0.35 + 0.65 * smoothstep(0.25, 0.7, l0)); float l = dot(col, vec3(0.299, 0.587, 0.114)); col = mix(vec3(l), col, 1.15);   // colori pieni; i toni scuri (capelli, contorni) restano del loro colore
      col += (rimC * smoothstep(0.45, 0.95, sx) * 0.42 + rimC2 * smoothstep(0.55, 0.05, sx) * 0.25) * thick * smoothstep(0.2, 0.55, l0);   // luce morbida dal lato della sorgente (niente bordo tratteggiato)
      // [utente] riflesso bianco dinamico SUI BORDI (non un punto fisso in testa): luce di contorno continua lungo la sagoma
      // dal lato della luce più forte, colore della luce schiarito verso il bianco. Media di 10 campioni dell'alpha (non il massimo): bordo continuo, mai puntinato.
      // vicinanza al bordo: alpha sfocata (livello di mipmap alto) campionata spostata verso la luce
      vec3 E = texture2D(edge, vUv).rgb;   // vicinanza ai bordi destro, sinistro e alto (calcolata dalla sagoma)
      float rim = max(rimD > 0. ? E.r : E.g, (rimD > 0. ? E.g : E.r) * rimBack * 0.8) ; rim = max(rim, E.b * 0.6); rim = smoothstep(0.45, 0.82, rim);
      vec3 hl = mix(rimC, vec3(1.), 0.6) * clamp(length(rimC) * 2.5 + 0.35, 0., 1.2) * hlk;
      col += floorC * (1. - smoothstep(0.0, 0.12, vUv.y)) * 0.15;   // gambe e piedi prendono il colore del pavimento illuminato
      float mx = max(col.r, max(col.g, col.b)); if (mx > 0.9) col *= 0.9 / mx;   // mai sopra la soglia del bagliore: le facce bianche non devono «bruciare»
      col = mix(col, max(col, hl), rim * 0.95 * smoothstep(0.2, 0.32, l0) * mix(0.3, 1., thick));    // luce di bordo DOPO il tetto di luminosità (prima veniva annullata)
      gl_FragColor = vec4(col, 1.); }` });
  };
  const litCards = [];
  function avgTexCol(mesh, tex) {
    if (mesh.userData._texAvgCol) return mesh.userData._texAvgCol;
    const col = new THREE.Color(1, 1, 1);
    const img = tex?.image;
    if (img && (img.width || img.videoWidth)) {
      try {
        const cv = document.createElement('canvas'); cv.width = 8; cv.height = 8;
        const g = cv.getContext('2d'); g.drawImage(img, 0, 0, 8, 8);
        const d = g.getImageData(0, 0, 8, 8).data;
        let r = 0, gg = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 64) continue;
          r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++;
        }
        if (n > 0) col.setRGB(r / (255 * n), gg / (255 * n), b / (255 * n)).convertSRGBToLinear();
      } catch { }
    }
    mesh.userData._texAvgCol = col;
    return col;
  }
  function lightCards() {   // calcola per ogni sagoma tinta, luci dirette e luci di contorno dalle luci e neon della scena
    if (LR) {
      const sunV = L.sun.position.clone().sub(L.sun.target.position).normalize();
      sunV.transformDirection(camera.matrixWorldInverse);
      const emitters = [];
      const emiNameRe = /^(neon|insegna|insegna_appesa|vetrina|lanterna|lampione)$/;
      const tmpBox = new THREE.Box3(), tmpSz = new THREE.Vector3();
      scene.traverse(o => {
        let vis = o.visible;
        for (let pr = o.parent; pr && vis; pr = pr.parent) if (!pr.visible) vis = false;
        if (!vis) return;
        if ((o.isPointLight || o.isSpotLight) && o.intensity > 0) {
          const mc = Math.max(o.color.r, o.color.g, o.color.b, 1e-4);
          emitters.push({ kind: 'light', obj: o, col: o.color.clone().multiplyScalar(1 / mc), intensity: o.intensity, distance: o.distance || 0 });
          return;
        }
        if (!o.isMesh || !o.material || !o.geometry || o === sky || o.userData.card || o.userData.ombra || o.userData.suolo || o.userData.wet || o.userData.noLight) return;
        const isNamed = emiNameRe.test(o.name || '');
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        let bestE = 0, bestCol = null;
        for (const mt of mats) {
          if (!mt) continue;
          if (mt.isMeshBasicMaterial) {
            const mc = mt.color || new THREE.Color(1, 1, 1);
            const mxRaw = Math.max(mc.r, mc.g, mc.b);
            if (isNamed || (mt.map ? mxRaw > 1.22 : mxRaw > 1.08)) {
              const cOut = mt.map ? avgTexCol(o, mt.map).clone().multiply(mc) : mc.clone();
              const mxC = Math.max(cOut.r, cOut.g, cOut.b);
              if (mxC > 0.03) {
                const effI = Math.min(11, Math.max(2.6, Math.max(mxRaw, mxC) * 2.6));
                if (effI > bestE) { bestE = effI; bestCol = cOut.multiplyScalar(1 / mxC); }
              }
            }
          } else if (mt.isMeshStandardMaterial && (mt.emissiveIntensity ?? 0) >= (isNamed ? 0.45 : 0.75)) {
            const em = mt.emissive;
            if (!em) continue;
            const cOut = mt.emissiveMap ? avgTexCol(o, mt.emissiveMap).clone().multiply(em) : em.clone();
            const mxC = Math.max(cOut.r, cOut.g, cOut.b);
            if (mxC > 0.05) {
              const effI = Math.min(10, (mt.emissiveIntensity || 1) * mxC * 3.0);
              if (effI > bestE) { bestE = effI; bestCol = cOut.multiplyScalar(1 / mxC); }
            }
          }
        }
        if (bestE > 0 && bestCol) {
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          if (o.geometry.boundingBox) {
            const b = tmpBox.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
            b.getSize(tmpSz);
            if (Math.max(tmpSz.x, tmpSz.y, tmpSz.z) <= 14) {
              emitters.push({ kind: 'mesh', box: b.clone(), center: b.getCenter(new THREE.Vector3()), col: bestCol, intensity: bestE, distance: 10.5 });
            }
          }
        }
      });
      const camR = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize();
      const p = new THREE.Vector3(), lp = new THREE.Vector3(), lt = new THREE.Vector3();
      const toL = new THREE.Vector3(), spotFwd = new THREE.Vector3(), cardR = new THREE.Vector3();
      const sum = new THREE.Color(), sunBackK = THREE.MathUtils.smoothstep(-sunV.z, 0.08, 0.62);
      const rimOn = LC_OPT.rim !== false;
      const isClosed = !!closedK;
      const sunWeight = isClosed ? 0.14 : (0.55 + 0.35 * sunBackK);
      for (const m of litCards) {
        const U = m.material?.uniforms;
        if (!U?.uSunDir) continue;
        U.uSunDir.value.copy(sunV);
        m.getWorldPosition(p);
        p.y += 1.15;
        cardR.setFromMatrixColumn(m.matrixWorld, 0).normalize();
        const flip = cardR.dot(camR) >= 0 ? 1 : -1;
        sum.setRGB(0, 0, 0);
        let best = null, bw = 0, bestDirW = new THREE.Vector3(), bestDirC = new THREE.Vector3();
        const cands = [];
        for (const src of emitters) {
          if (src.kind === 'light') {
            src.obj.getWorldPosition(lp);
            toL.copy(lp).sub(p);
          } else {
            src.box.clampPoint(p, lp);
            toL.copy(lp).sub(p);
            if (toL.lengthSq() < 0.02) toL.copy(src.center).sub(p);
          }
          const dist = toL.length() || 1e-4;
          toL.divideScalar(dist);
          const maxD = src.kind === 'light' ? (src.distance > 0 ? src.distance * 1.35 : 0) : src.distance;
          const att = maxD > 0 ? Math.max(0, 1 - Math.pow(dist / maxD, 2)) : 1;
          let w = (src.intensity * att) / (1 + dist * dist * (src.kind === 'light' ? 0.28 : 0.25));
          if (src.kind === 'light' && src.obj.isSpotLight && src.obj.target) {
            src.obj.target.getWorldPosition(lt);
            spotFwd.copy(lt).sub(lp).normalize();
            const cosA = -toL.dot(spotFwd);
            const minCos = Math.cos(src.obj.angle);
            const penCos = Math.cos(src.obj.angle * (1 - (src.obj.penumbra ?? 0.35)));
            w *= THREE.MathUtils.smoothstep(cosA, minCos, Math.max(minCos + 1e-4, penCos));
          }
          if (w <= 1e-4) continue;
          sum.add(src.col.clone().multiplyScalar(Math.min(0.40, w * 0.055)));
          cands.push({ src, w, dirW: toL.clone() });
          if (w > bw) {
            bw = w;
            best = src;
            bestDirW.copy(toL);
          }
        }
        const sunSide = THREE.MathUtils.clamp(sunV.x * flip * 1.4, -1, 1);
        if (best && bw > 0.04) {
          bestDirC.copy(bestDirW).transformDirection(camera.matrixWorldInverse);
          let second = null, sw = 0;
          for (const c of cands) {
            if (c.src === best) continue;
            if (c.dirW.dot(bestDirW) < 0.65 && c.w > sw) { sw = c.w; second = c.src; }
          }
          const localBack = THREE.MathUtils.smoothstep(-bestDirC.z, -0.15, 0.55);
          const localSide = THREE.MathUtils.clamp(bestDirC.x * flip * 1.45, -1, 1);
          const kLoc = THREE.MathUtils.clamp(bw / (bw + sunWeight * 1.2), 0.25, 0.95);
          U.uSideKeyDir.value = THREE.MathUtils.lerp(sunSide, localSide, kLoc);
          U.uKeyMix.value = isClosed ? 0.85 : kLoc;
          U.uLightCol.value.copy(best.col);
          U.uLightDir.value.set(bestDirC.x * flip, bestDirC.y, bestDirC.z);
          U.uLightPow.value = Math.min(1.20, bw * 0.55);
          if (second && sw > 0.04) {
            U.uLightCol2.value.copy(second.col);
            U.uLightPow2.value = Math.min(0.75, sw * 0.40);
          } else {
            U.uLightCol2.value.setRGB(0, 0, 0);
            U.uLightPow2.value = 0;
          }
          U.uRimSide.value = localSide;
          U.uRimBack.value = isClosed ? localBack : Math.max(localBack, sunBackK * 0.6);
          U.uRimCol.value.copy(best.col).lerp(new THREE.Color(1, 0.98, 0.95), 0.14);
          U.uRimPow.value = rimOn ? Math.min(0.88, 0.24 + bw * 0.38 + U.uRimBack.value * 0.22) : 0;
          m.userData._luceDir = localSide >= 0 ? 1 : -1;
        } else {
          U.uSideKeyDir.value = sunSide;
          U.uKeyMix.value = isClosed ? 0.25 : 0.0;
          U.uLightCol.value.setRGB(0, 0, 0);
          U.uLightCol2.value.setRGB(0, 0, 0);
          U.uLightPow.value = 0;
          U.uLightPow2.value = 0;
          U.uRimSide.value = sunSide;
          U.uRimBack.value = isClosed ? 0.2 : sunBackK;
          U.uRimCol.value.copy(isClosed ? L.hemi.color : L.sun.color).lerp(new THREE.Color(1, 0.97, 0.90), 0.15);
          U.uRimPow.value = rimOn ? (isClosed ? 0.20 : (0.36 + 0.40 * sunBackK)) : 0;
          m.userData._luceDir = sunSide >= 0 ? 1 : -1;
        }
        const fmx = Math.max(sum.r, sum.g, sum.b);
        if (fmx > 0.35) sum.multiplyScalar(0.35 / fmx);
        U.uFloorCol.value.copy(sum);
      }
      return;
    }
    const lights = []; scene.traverse(o => { if (o.isPointLight && o.intensity > 0) lights.push(o); });
    const camR = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    for (const m of litCards) {
      const p = m.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1.0, 0));
      const sum = new THREE.Color(0, 0, 0); let best = null, bw = 0, second = null, sw = 0;
      for (const l of lights) {
        const lp = l.getWorldPosition(new THREE.Vector3()), d = lp.distanceTo(p), w = l.intensity / (1 + d * d) * (l.distance ? Math.max(0, 1 - d / (l.distance * 1.6)) : 1);
        sum.add(l.color.clone().multiplyScalar(w * 0.08)); if (w > bw) { second = best; sw = bw; best = l; bw = w; } else if (w > sw) { second = l; sw = w; }
      }
      const U = m.material.uniforms; U.tint.value.setRGB(1.0, 1.0, 1.02).add(sum.clone().multiplyScalar(STEP >= 15 ? 0.28 : 0.5));
      if (best) {
        U.rimC.value.copy(best.color).multiplyScalar(Math.min(1.3, bw * 0.6)); const dx = best.getWorldPosition(new THREE.Vector3()).sub(p).dot(camR); U.rimD.value = dx >= 0 ? 1 : -1;
        const fwd = camera.getWorldDirection(new THREE.Vector3()), dl = best.getWorldPosition(new THREE.Vector3()).sub(p).normalize(); U.rimBack.value = Math.max(0, Math.min(1, dl.dot(fwd) * 1.5 + 0.3));
      }   // luce dietro il personaggio = controluce: bordi accesi da entrambi i lati
      if (second) U.rimC2.value.copy(second.color).multiplyScalar(Math.min(0.8, sw * 0.3));
      U.floorC.value.copy(sum).multiplyScalar(1.5);
    }
  }
  let ovTex = null;
  const ombraOvale = () => {
    if (!ovTex) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
      const r = g.createRadialGradient(128, 64, 4, 128, 64, 64); r.addColorStop(0, 'rgba(30,14,50,0.85)'); r.addColorStop(0.5, 'rgba(30,14,50,0.6)'); r.addColorStop(1, 'rgba(40,20,70,0)');
      g.setTransform(2, 0, 0, 1, -128, 0);   // texture 2:1, piano 0,62×0,4 → ovale tondeggiante
      g.fillStyle = r; g.fillRect(0, 0, 256, 128); ovTex = new THREE.CanvasTexture(c);
    }
    const o = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.4), new THREE.MeshBasicMaterial({ map: ovTex, transparent: true, depthWrite: false, toneMapped: false }));
    o.rotation.x = -Math.PI / 2; o.position.set(0, 0.012, 0.02); o.renderOrder = 2; o.userData.ombra = true; return o;
  };
  const ANIMATI = [];
  // mappa dei bordi della sagoma (per la luce di bordo): per ogni riga, vicinanza al bordo destro (R) e sinistro (G), e alla cima (B)
  function mappaBordi(src, dst) {
    const W = src.width, H = src.height, sd = src.getContext('2d').getImageData(0, 0, W, H).data, g = dst.getContext('2d'), out = g.createImageData(W, H), o = out.data, R = 95;
    const top = new Int32Array(W).fill(H); for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (sd[(y * W + x) * 4 + 3] > 128) { top[x] = y; break; }
    for (let y = 0; y < H; y++) {
      let l = -1, r = -1; for (let x = 0; x < W; x++) if (sd[(y * W + x) * 4 + 3] > 128) { if (l < 0) l = x; r = x; }
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4; if (l < 0) { o[i + 3] = 255; continue; }
        o[i] = 255 * Math.max(0, 1 - (r - x) / R); o[i + 1] = 255 * Math.max(0, 1 - (x - l) / R); o[i + 2] = 255 * Math.max(0, 1 - (y - top[x]) / R); o[i + 3] = 255;
      }
    }
    g.putImageData(out, 0, 0);
  }   // personaggi che si muovono (per l'animazione)
  const card = (opt, x, z, ry = -0.5) => {
    const c = document.createElement('canvas'); c.width = OW; c.height = OH; drawOmino(c.getContext('2d'), opt);
    const ec = document.createElement('canvas'); ec.width = OW; ec.height = OH; mappaBordi(c, ec); const et = new THREE.CanvasTexture(ec);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; const geo = STEP >= 15 ? new THREE.PlaneGeometry(1.0, 2.0) : new THREE.PlaneGeometry(0.85, 1.7); geo.translate(0, STEP >= 15 ? 1.0 : 0.85, 0);   // dallo step 15 i personaggi sono più grandi (come nel riferimento: quasi alti come la porta)
    const m = new THREE.Mesh(geo, STEP >= 8
      ? cardLitMat(t, et)   // le sagome restano chiare e leggibili ma prendono colore e bordo di luce dalle sorgenti vicine
      : new THREE.MeshBasicMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide })); if (STEP < 8) m.material.color.setScalar(0.92);
    m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5 });
    m.position.set(x, STEP >= 3 ? 0 : 0.2, z); m.rotation.y = ry; m.userData.card = true; m.userData.opt = opt; m.userData.ctx = c.getContext('2d'); m.userData.tex = t; m.userData.ec = ec; m.userData.et = et; m.userData.cv = c; m.userData.x0 = x; root.add(m); if (STEP >= 8) litCards.push(m); if (opt.posa === 'cammina') ANIMATI.push(m);
    if (STEP >= 3) { m.add(ombraOvale()); }   // i personaggi non si specchiano: sotto i piedi un'ombra ovale morbida
    return m;
  };
  // ===== strada bagnata, contorni, nebbia, bagliori (copiati da scena_disegnato.js, step 18) =====
  const WET = (STEP >= 2 && !Q.has('asciutto')) ? { k: +(Q.get('wk') || (STEP >= 3 ? 1.0 : 0.9)), blurV: +(Q.get('wv') || (STEP >= 3 ? 0.03 : 0.07)), blurH: +(Q.get('wh') || (STEP >= 6 ? 0.012 : STEP >= 3 ? 0.007 : 0.004)) } : null;
  let wetPass = null;
  if (WET) {

    const rw = Math.round(540 * SS), rh = Math.round(960 * SS), mk = () => new THREE.WebGLRenderTarget(rw, rh, { type: THREE.HalfFloatType });
    const rtA = mk(), rtB = mk(), rtC = mk(), rtC2 = mk(), rtS = mk(), rtS2 = mk(), rtG = new THREE.WebGLRenderTarget(270, 480, { type: THREE.HalfFloatType }), rtG2 = new THREE.WebGLRenderTarget(270, 480, { type: THREE.HalfFloatType });
    const blur = new THREE.ShaderMaterial({
      uniforms: { t: { value: null }, dir: { value: new THREE.Vector2() }, jit: { value: 1 } }, depthTest: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: `uniform sampler2D t; uniform vec2 dir; uniform float jit; varying vec2 vUv;
      void main(){ vec4 c = vec4(0.); float w = 0.;
        for (int i = -40; i <= 40; i++) { float f = (float(i) + (fract(sin(dot(vUv, vec2(12.9, 78.2))) * 43758.5) - 0.5) * jit) / 40.; float g = exp(-f * f * 2.5); c += texture2D(t, vUv + dir * f) * g; w += g; }
        gl_FragColor = c / w; }` });
    const rtH = mk();   // altezza del punto riflesso sopra il piano: il riflesso svanisce allontanandosi dal contatto
    const hMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, vertexShader: 'varying float hy; void main(){ vec4 w = modelMatrix * vec4(position, 1.); hy = -w.y; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: 'varying float hy; void main(){ gl_FragColor = vec4(max(hy, 0.), 0., 0., 1.); }'
    });
    const fadeMat = new THREE.ShaderMaterial({
      uniforms: { t: { value: null }, h: { value: null }, fh: { value: +(Q.get('fh') || 5.5) } }, depthTest: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: 'uniform sampler2D t, h; uniform float fh; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(t, vUv).rgb * exp(-texture2D(h, vUv).r / fh), 1.); }'
    });
    const qs = new THREE.Scene(), qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), qm = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blur); qm.frustumCulled = false; qs.add(qm);
    // superficie bagnata sopra strada e marciapiedi (additiva)
    const wetMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      uniforms: { cb: { value: STEP >= 7 ? +(Q.get('cb') || 1.2) : 0 }, pre: { value: STEP >= 6 ? 1 : 0 }, refl: { value: rtB.texture }, glowT: { value: rtG2.texture }, hT: { value: rtH.texture }, heavy: { value: rtC2.texture }, real: { value: +(Q.get('real') || 0) }, fadeH: { value: +(Q.get('fh') || 5.5) }, res: { value: new THREE.Vector2(1080, 1920) }, k: { value: WET.k }, gk: { value: STEP >= 3 ? +(Q.get('gk') || 0.8) : 0 }, sk: { value: STEP >= 3 ? +(Q.get('sk') || (STEP >= 6 ? 1.3 : 1.0)) : 1 }, milk: { value: new THREE.Color(Q.get('mk') || '#1c2a5a') } },
      vertexShader: 'varying vec3 wp; void main(){ vec4 w = modelMatrix * vec4(position, 1.); wp = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform sampler2D refl, glowT, hT, heavy; uniform vec2 res; uniform float k, gk, sk, fadeH, real, pre, cb; uniform vec3 milk; varying vec3 wp;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main(){ vec2 uv = gl_FragCoord.xy / res;
        float m = n(wp.xz * 0.35) * 0.6 + n(wp.xz * 1.3) * 0.4; m = smoothstep(0.25, 0.75, m) * 0.65 + 0.35;   // pozzanghere: più lucido qui, meno là
        vec3 v = normalize(cameraPosition - wp); float fr = 0.35 + 0.65 * pow(1. - max(v.y, 0.), 3.);           // fresnel: lontano riflette di più
        vec2 rip = (vec2(n(wp.xz * 6.), n(wp.xz * 6. + 17.)) - 0.5) * vec2(0.004, 0.010) * real;   // increspature: rompono lo specchio perfetto
        uv += rip;
        float fd = pre > 0.5 ? 1. : exp(-texture2D(hT, uv).r / fadeH);   // 1 al contatto, → 0 lontano: lo specchio sfuma fino a sparire
        vec3 rs = mix(texture2D(heavy, uv).rgb, texture2D(refl, uv).rgb, mix(1., smoothstep(0.35, 0.95, fd), real));   // nitido al contatto, sempre più sfocato lontano
        vec3 r = rs * sk * mix(fd, 0.35 + 0.65 * fd, real) + texture2D(glowT, uv).rgb * gk * (0.25 + 0.75 * fd);   // riflesso semi-opaco + alone largo
        float mx = max(r.r, max(r.g, r.b)), sat = (mx - min(r.r, min(r.g, r.b))) / (mx + 1e-3);
        r *= 1. + cb * sat * smoothstep(0.05, 0.6, mx);   // più una luce è colorata e intensa, più bagliore lascia sulla strada
        gl_FragColor = vec4((r * k * m + milk * (0.6 + 0.4 * m)) * fr, 1.); }` });
    const wetS = wetMat.clone(); wetS.uniforms.refl = { value: rtS2.texture }; wetS.uniforms.k = { value: WET.k * 0.7 };
    if (STEP >= 5) {   // patina opaca sopra il pavimento bagnato: velo chiaro semi-opaco, più forte lontano e fuori dalle pozzanghere
      const patina = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, toneMapped: false,
        uniforms: { col: { value: new THREE.Color(Q.get('pc') || '#5866a8') }, a0: { value: +(Q.get('pa') || (STEP >= 6 ? 0.16 : 0.22)) }, a1: { value: +(Q.get('pb') || (STEP >= 6 ? 0.34 : 0.42)) } },
        vertexShader: 'varying vec3 wp; void main(){ vec4 w = modelMatrix * vec4(position, 1.); wp = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: `uniform vec3 col; uniform float a0, a1; varying vec3 wp;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
        void main(){ float m = smoothstep(0.25, 0.75, n(wp.xz * 0.35) * 0.6 + n(wp.xz * 1.3) * 0.4);
          vec3 v = normalize(cameraPosition - wp); float fr = pow(1. - max(v.y, 0.), 2.);
          gl_FragColor = vec4(col, mix(a0, a1, fr) * (1. - 0.45 * m)); }` });
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(SW, SL), patina); pm.rotation.x = -Math.PI / 2; pm.position.set(SX, 0.004, SZ); pm.renderOrder = 3; pm.userData.wet = true; scene.add(pm);
    }
    for (const [w, x, y] of (STEP >= 3 ? [[SW, SX, 0.002]] : [[8, 0, 0.002], [3, -5.5, 0.202], [3, 5.5, 0.202]])) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, SL), y > 0.1 ? wetS : wetMat); o.rotation.x = -Math.PI / 2; o.position.set(x, y, SZ); o.userData.wet = true; scene.add(o); }
    wetPass = () => {
      const hide = []; root.traverse(o => { if (o.userData.suolo || (o.isMesh && o.position.y < 0.2 && o.geometry.parameters?.height <= 0.25)) { hide.push(o); o.visible = false; } });
      scene.children.forEach(o => { if (o.userData.wet) o.visible = false; });
      root.traverse(o => { if (o.userData.card && STEP >= 3) { hide.push(o); o.visible = false; } });
      root.scale.y = -1; root.position.y = 0; root.updateMatrixWorld(true);
      renderer.setRenderTarget(rtA); renderer.clear(); renderer.render(scene, camera);
      if (STEP >= 3) {
        const sv = sky.visible; sky.visible = false; const cc = renderer.getClearColor(new THREE.Color()); renderer.setClearColor(0xffffff, 1); scene.overrideMaterial = hMat;
        renderer.setRenderTarget(rtH); renderer.clear(); renderer.render(scene, camera); scene.overrideMaterial = null; renderer.setClearColor(cc, 1); sky.visible = sv;
      }
      // marciapiedi: secondo specchio attorno al loro piano (y = 0,2), solo dove c'è il marciapiede
      root.position.y = 0.4; root.updateMatrixWorld(true); renderer.setRenderTarget(rtS); renderer.clear(); renderer.render(scene, camera); root.position.y = 0;
      root.scale.y = 1; root.updateMatrixWorld(true); hide.forEach(o => { o.visible = true; }); scene.children.forEach(o => { if (o.userData.wet) o.visible = true; });
      if (STEP >= 6) {   // la dissolvenza si applica PRIMA della sfocatura: niente segmenti dove l'altezza cambia di colpo
        fadeMat.uniforms.t.value = rtA.texture; fadeMat.uniforms.h.value = rtH.texture; qm.material = fadeMat; renderer.setRenderTarget(rtC); renderer.render(qs, qc); qm.material = blur;
        blur.uniforms.t.value = rtC.texture;
      } else blur.uniforms.t.value = rtA.texture;
      blur.uniforms.dir.value.set(0, WET.blurV); renderer.setRenderTarget(rtB); renderer.render(qs, qc);
      blur.uniforms.jit.value = STEP >= 6 ? 0 : 1; blur.uniforms.t.value = rtB.texture; blur.uniforms.dir.value.set(WET.blurH, 0); renderer.setRenderTarget(rtA); renderer.render(qs, qc); blur.uniforms.jit.value = 1;
      blur.uniforms.t.value = rtA.texture; blur.uniforms.dir.value.set(0, WET.blurV * 0.5); renderer.setRenderTarget(rtB); renderer.render(qs, qc);
      if (+(Q.get('real') || 0)) {   // seconda versione molto più sfocata: lontano dal contatto il riflesso si allarga (come l'asfalto vero)
        blur.uniforms.t.value = rtB.texture; blur.uniforms.dir.value.set(0, +(Q.get('hv') || 0.16)); renderer.setRenderTarget(rtC); renderer.render(qs, qc);
        blur.uniforms.t.value = rtC.texture; blur.uniforms.dir.value.set(+(Q.get('hh') || 0.03), 0); renderer.setRenderTarget(rtC2); renderer.render(qs, qc);
      }
      // alone largo: sfocatura molto ampia in entrambe le direzioni (bassa risoluzione)
      blur.uniforms.t.value = rtB.texture; blur.uniforms.dir.value.set(0.09, 0); renderer.setRenderTarget(rtG); renderer.render(qs, qc);
      blur.uniforms.t.value = rtG.texture; blur.uniforms.dir.value.set(0, 0.16); renderer.setRenderTarget(rtG2); renderer.render(qs, qc);
      blur.uniforms.t.value = rtG2.texture; blur.uniforms.dir.value.set(0.05, 0.05); renderer.setRenderTarget(rtG); renderer.render(qs, qc);
      blur.uniforms.t.value = rtG.texture; blur.uniforms.dir.value.set(-0.05, 0.05); renderer.setRenderTarget(rtG2); renderer.render(qs, qc);
      blur.uniforms.t.value = rtS.texture; blur.uniforms.dir.value.set(0, WET.blurV); renderer.setRenderTarget(rtS2); renderer.render(qs, qc);
      blur.uniforms.t.value = rtS2.texture; blur.uniforms.dir.value.set(WET.blurH, 0); renderer.setRenderTarget(rtS); renderer.render(qs, qc);
      blur.uniforms.t.value = rtS.texture; blur.uniforms.dir.value.set(0, WET.blurV * 0.5); renderer.setRenderTarget(rtS2); renderer.render(qs, qc);
      renderer.setRenderTarget(null);
    };
  }
  // ---------- step 4: contorni a inchiostro ----------
  // passata normali+profondità (sagome escluse: hanno già il loro contorno disegnato), poi Sobel su profondità e normali
  let inkPass = null, ndPass = null;
  // [11/11] con la profondità di campo accesa (`dof` nei parametri) la strada entra nella mappa di profondità con un segno (alfa 0,75): contorni e nebbia la trattano
  // come prima (vuoto lontano), la sfocatura invece usa la sua distanza vera. Spenta: nessun pixel cambia.
  const DOFON = Q.has('dof');
  if (STEP >= 4) {
    const rtND = new THREE.WebGLRenderTarget(RW, RH, { depthTexture: new THREE.DepthTexture(RW, RH), type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });   // Nearest: niente pixel «a metà» tra sagoma e mondo (davano un contorno tratteggiato attorno agli omini)
    const ndMat = new THREE.ShaderMaterial({
      vertexShader: 'varying vec3 vn; void main(){ vn = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'varying vec3 vn; void main(){ gl_FragColor = vec4(normalize(vn) * 0.5 + 0.5, 1.); }', side: THREE.DoubleSide
    });
    const cardND = new Map(), stradaND = new THREE.ShaderMaterial({ vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }', fragmentShader: 'void main(){ gl_FragColor = vec4(0.5, 0.5, 1., 0.75); }', side: THREE.DoubleSide });
    ndPass = () => {
      const swap = [];
      scene.traverse(o => {
        if (!o.isMesh || !o.visible) return;
        if (o.userData.noInk || o.userData.ombra || o === sky) {   /* noInk: sprite piatte (nuvole) / fasci senza contorno del rettangolo */ swap.push([o, 'visible', true]); o.visible = false; return; }
        if (DOFON && o.userData.wet) { swap.push([o, 'material', o.material]); o.material = stradaND; return; }
        if (o.userData.wet) { swap.push([o, 'visible', true]); o.visible = false; return; }
        let m = ndMat;
        if (o.userData.card) {
          if (!cardND.has(o)) cardND.set(o, new THREE.ShaderMaterial({
            uniforms: { map: { value: o.material.map || o.material.uniforms?.map?.value } }, side: THREE.DoubleSide,
            vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
            fragmentShader: 'uniform sampler2D map; varying vec2 vUv; void main(){ if (texture2D(map, vUv).a < 0.5) discard; gl_FragColor = vec4(0.5, 0.5, 1., 0.); }'
          })); m = cardND.get(o);
        }
        swap.push([o, 'material', o.material]); o.material = m;
      });
      const cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha(), fog = scene.fog; scene.fog = null;
      renderer.setClearColor(0x8080ff, 1); renderer.setRenderTarget(rtND); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null);
      renderer.setClearColor(cc, ca); scene.fog = fog; for (const [o, k, v] of swap.reverse()) o[k] = v;
    };
    const cinemaInk = (LC && LC_OPT.contorni !== false) || Q.has('cinema_ink');
    inkPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null }, tN: { value: rtND.texture }, tD: { value: rtND.depthTexture }, px: { value: new THREE.Vector2(1 / 1080, 1 / 1920) },
        clr: { value: new THREE.Color(0x8080ff) }, w: { value: +(Q.get('iw') || 2.4) }, ink: { value: new THREE.Color(Q.get('ic') || '#1c1430') }, kd: { value: +(Q.get('kd') || 0.06) }, kn: { value: +(Q.get('kn') || 0.5) }, dbg: { value: +(Q.get('dbg') || 0) }, wob: { value: STEP >= 18 ? +(Q.get('wb') || 0.0) : STEP >= 11 ? +(Q.get('wb') || 3.0) : 0 }, uCinemaInk: { value: cinemaInk ? 1 : 0 }
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform sampler2D tDiffuse, tN, tD; uniform vec2 px; uniform float w, kd, kn, uCinemaInk; uniform vec3 ink, clr; varying vec2 vUv;
      float lin(float d){ float n = 0.05, f = 400.; return 2. * n * f / (f + n - (d * 2. - 1.) * (f - n)); }
      bool strada(vec4 n){ return n.a > 0.6 && n.a < 0.9; }   // segno della strada (solo con la profondità di campo): per i contorni resta «vuoto»
      vec4 NN(vec2 u){ vec4 n = texture2D(tN, u); return strada(n) ? vec4(clr, 1.) : n; }
      float DD(vec2 u){ return strada(texture2D(tN, u)) ? lin(1.) : lin(texture2D(tD, u).r); }
      uniform float dbg, wob;
      float hsh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hsh(i), hsh(i + vec2(1, 0)), f.x), mix(hsh(i + vec2(0, 1)), hsh(i + vec2(1, 1)), f.x), f.y); }
      void main(){
        vec2 W = (vec2(vn(vUv * vec2(9., 16.)), vn(vUv * vec2(9., 16.) + 7.3)) - 0.5) * 2. * wob * px;   // tremolio a mano: le linee dritte non sono mai perfette
        vec2 vUv = vUv + W;
        vec4 c = texture2D(tDiffuse, vUv); vec4 n0 = NN(vUv); if (dbg > 1.5) { gl_FragColor = vec4(vec3(n0.a), 1.); return; } if (dbg > 0.5) { gl_FragColor = vec4(n0.rgb, 1.); return; } if (dbg < -0.5) { gl_FragColor = vec4(vec3(fract(lin(texture2D(tD, vUv).r) / 10.)), 1.); return; }
        if (n0.a < 0.5) { gl_FragColor = c; return; }                     // sagoma: niente contorno aggiunto
        float d0 = DD(vUv), e = 0.;
        float wEff = uCinemaInk > 0.5 ? w * mix(1.0, 0.45, smoothstep(3.5, 22.0, d0)) : w;
        float creaseK = uCinemaInk > 0.5 ? 0.54 * mix(1.0, 0.45, smoothstep(4.5, 20.0, d0)) : 1.0;
        for (int i = 0; i < 8; i++) { float a = float(i) * 0.7854; vec2 o = vec2(cos(a), sin(a)) * px * wEff;
          vec4 n1 = NN(vUv + o); float d1 = DD(vUv + o);
          if (n1.a < 0.5) continue;
          float eD = uCinemaInk > 0.5 ? smoothstep(kd * 0.85, kd * 1.25, abs(d1 - d0) / d0) : step(kd, abs(d1 - d0) / d0);
          float eN = smoothstep(kn, kn + 0.2, length(n1.xyz - n0.xyz)) * creaseK;
          e = max(e, max(eD, eN)); }
        float distFade = uCinemaInk > 0.5 ? mix(0.92, 0.34, smoothstep(8.0, 40.0, d0)) : mix(1., 0.35, smoothstep(15., 70., d0)) * 0.9;
        gl_FragColor = vec4(mix(c.rgb, ink, e * distFade), c.a); }` });
    inkPass.uniforms.tN.value = rtND.texture; inkPass.uniforms.tD.value = rtND.depthTexture;   // ShaderPass clona le texture: rimetti quelle vere
  }
  const comp = new EffectComposer(renderer); comp.addPass(new RenderPass(scene, camera));
  if (inkPass) comp.addPass(inkPass);
  // ---------- [11/11] profondità di campo (lente sottile, da mromidev/claude-animated-shorts lensblur.ts, MIT) ----------
  // raggio di sfocatura (px a 1080x1920) = cInf * |1 - fuoco / distanza|, ×1,2 davanti al fuoco; due passate a raccolta (16 + 64 campioni a spirale
  // aurea, più 32 per il primo piano sfocato che si allarga sopra il nitido). Niente rumore: stessa immagine a ogni fotogramma uguale, niente sfarfallio.
  // Prima dei bagliori: le linee si sfocano col fondo e le luci sfocate diventano dischi morbidi. Valori per inquadratura: `sfocatura` nelle tappe (storia_disegnato.js).
  const DOF = { focus: 10, cInf: 0, zona: 0, nearScale: 1.2 }, dofP = [];
  if (DOFON && inkPass) for (const [TAPS, SPREAD, NEAR, ROT] of [[16, 0.287, 0, 0.61], [64, 0.958, 32, 0]]) {
    const p = new ShaderPass({
      defines: { DBG: +(Q.get('dofdbg') || 0), TAPS, SPREAD: SPREAD.toFixed(4), NEAR_TAPS: NEAR, ROT: ROT.toFixed(4) },
      uniforms: { tDiffuse: { value: null }, tD: { value: null }, px: { value: new THREE.Vector2(1 / 1080, 1 / 1920) }, focus: { value: 10 }, fgeo: { value: 10 }, fuv: { value: new THREE.Vector2(-1, -1) }, cInf: { value: 0 }, bokeh: { value: 0 }, dofZona: { value: 0 }, nearScale: { value: 1.2 }, maxCoC: { value: +(Q.get('dofmax') || 24) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform sampler2D tDiffuse, tD; uniform vec2 px, fuv; uniform float cInf, dofZona, nearScale, maxCoC, bokeh; uniform float focus, fgeo; varying vec2 vUv; float F;
      #define GOLDEN 2.39996323
      float lin(float d){ float n = 0.05, f = 400.; return 2. * n * f / (f + n - (d * 2. - 1.) * (f - n)); }
      float coc(float d){ float raw = 1. - F / max(d, 1e-3), err = abs(raw); float eff = dofZona > 0. ? max(0., err - dofZona * 0.6) * smoothstep(0., dofZona * 1.4, err) : err; float c = cInf * eff * (raw < 0. ? -nearScale : 1.); return clamp(c, -maxCoC, maxCoC); }
      float dist(vec2 u){ return lin(texture2D(tD, u).r); }
      void main(){ vec4 c0 = texture2D(tDiffuse, vUv); if (cInf < 0.25) { gl_FragColor = c0; return; }
        // fuoco automatico: la distanza vera nel punto degli occhi sullo schermo (fuv), il campione più vicino alla stima geometrica (focus)
        F = focus; if (fuv.x >= 0.) { float bd = 1e9, best = fgeo; for (int j = 0; j < 9; j++) { vec2 o = vec2(float(j % 3) - 1., float(j / 3) - 1.) * 10. * px; float d = dist(fuv + o); if (abs(d - fgeo) < bd) { bd = abs(d - fgeo); best = d; } } F = max(0.3, focus + best - fgeo); }   // correzione dalla profondità vera, sul fuoco che insegue
        if (DBG > 0) { float cc = coc(dist(vUv)); gl_FragColor = vec4(max(cc, 0.) / 24., max(-cc, 0.) / 24., fract(dist(vUv)), 1.); return; }
        float d0 = dist(vUv), R = abs(coc(d0)) * SPREAD; vec3 acc = c0.rgb; float ws = 1.;
        if (R > 0.5) for (int i = 0; i < TAPS; i++) { float rr = sqrt((float(i) + .5) / float(TAPS)) * R, a = float(i) * GOLDEN + ROT;
          vec2 s = vUv + vec2(cos(a), sin(a)) * rr * px; float ds = dist(s), rs = abs(coc(ds)) * SPREAD;
          if (ds > d0) rs = min(rs, R);   // il fondo non sborda mai sopra una cosa più vicina: sagome nitide pulite
          float w = clamp(rs - rr + .5, 0., 1.); vec3 sc = texture2D(tDiffuse, s).rgb; w *= 1. + bokeh * smoothstep(0.55, 1.5, dot(sc, vec3(.2126, .7152, .0722)));   /* [13/11] bokeh: le luci fuori fuoco diventano dischi (da skybound) */ acc += sc * w; ws += w; }
        vec3 col = acc / ws;
        #if NEAR_TAPS > 0
        float fw = 0., cov = 0.; vec3 fg = vec3(0.);
        for (int i = 0; i < NEAR_TAPS; i++) { float rr = sqrt((float(i) + .5) / float(NEAR_TAPS)) * maxCoC; if (rr <= R) continue;
          float a = float(i) * GOLDEN + 1.; vec2 s = vUv + vec2(cos(a), sin(a)) * rr * px; float ds = dist(s); if (ds >= d0 * 0.97) continue;
          float rs = abs(coc(ds)), w = clamp(rs - rr + .5, 0., 1.); fg += texture2D(tDiffuse, s).rgb * w; fw += w; cov += w * (maxCoC * maxCoC) / max(rs * rs, 1.); }
        if (fw > 0.) col = mix(col, fg / fw, clamp(cov / float(NEAR_TAPS), 0., 1.));
        #endif
        gl_FragColor = vec4(col, c0.a); }` });
    p.uniforms.tD.value = inkPass.uniforms.tD.value; comp.addPass(p); dofP.push(p);
  }
  // ---------- step 16: nebbia luminosa dinamica ----------
  // l'immagine stessa, rimpicciolita e sfocata moltissimo, diventa una foschia colorata che si somma soprattutto in lontananza:
  // prende il colore delle luci e dei riflessi vicini (rosa sotto l'insegna, arancio davanti alla porta, blu nel cielo) e cambia da sola se cambiano le luci.
  class NebbiaPass extends Pass {
    constructor(depthTex) {
      super(); this.needsSwap = true; this.depthTex = depthTex;
      const mk = () => new THREE.WebGLRenderTarget(135, 240, { type: THREE.HalfFloatType }); this.a = mk(); this.b = mk();
      this.blurM = new THREE.ShaderMaterial({
        uniforms: { t: { value: null }, dir: { value: new THREE.Vector2() } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
        fragmentShader: 'uniform sampler2D t; uniform vec2 dir; varying vec2 vUv; void main(){ vec4 c = vec4(0.); float w = 0.; for (int i = -12; i <= 12; i++) { float f = float(i) / 12.; float g = exp(-f * f * 2.); c += texture2D(t, vUv + dir * f) * g; w += g; } gl_FragColor = c / w; }'
      });
      this.mixM = new THREE.ShaderMaterial({
        uniforms: { tDiffuse: { value: null }, haze: { value: null }, tD: { value: depthTex }, tN: { value: inkPass.uniforms.tN.value }, k: { value: +(Q.get('nk') || (STEP >= 17 ? 0.42 : 0.55)) }, near: { value: +(Q.get('nn') || 4) }, far: { value: +(Q.get('nf') || 45) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
        fragmentShader: `uniform sampler2D tDiffuse, haze, tD, tN; uniform float k, near, far; varying vec2 vUv;
        float lin(float d){ float n = 0.05, f = 400.; return 2. * n * f / (f + n - (d * 2. - 1.) * (f - n)); }
        void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 h = texture2D(haze, vUv).rgb;
          vec4 nn = texture2D(tN, vUv); float d = (nn.a > 0.6 && nn.a < 0.9) ? lin(1.) : lin(texture2D(tD, vUv).r), fz = smoothstep(near, far, d) * 0.75 + 0.25;   // anche vicino un velo leggero, più denso lontano
          float card = texture2D(tN, vUv).a < 0.5 ? 0.3 : 1.;   // sui personaggi la nebbia è leggera: le linee restano scure come nel riferimento
          gl_FragColor = vec4(c.rgb + h * k * fz * card, c.a); }` });
      this.q = new FullScreenQuad(this.blurM);
    }
    render(r, write, read) {
      const pass = (src, dst, dx, dy) => { this.blurM.uniforms.t.value = src; this.blurM.uniforms.dir.value.set(dx, dy); this.q.material = this.blurM; r.setRenderTarget(dst); this.q.render(r); };
      pass(read.texture, this.a, 0.12, 0); pass(this.a.texture, this.b, 0, 0.12); pass(this.b.texture, this.a, 0.08, 0.08); pass(this.a.texture, this.b, -0.08, 0.08);
      this.mixM.uniforms.tDiffuse.value = read.texture; this.mixM.uniforms.haze.value = this.b.texture; this.q.material = this.mixM;
      r.setRenderTarget(this.renderToScreen ? null : write); this.q.render(r);
    }
  }
  if (STEP >= 16 && inkPass) comp.addPass(new NebbiaPass(inkPass.uniforms.tD.value));
  // [utente] il bagliore generale tocca poco i personaggi: si salva l'immagine prima dei bagliori e sui personaggi la si rimette al 70 %
  const salvaRT = STEP >= 17 ? new THREE.WebGLRenderTarget(RW, RH, { type: THREE.HalfFloatType }) : null;
  class SalvaPass extends Pass {
    constructor() {
      super(); this.needsSwap = false; this.q = new FullScreenQuad(new THREE.ShaderMaterial({
        uniforms: { t: { value: null } }, depthTest: false, depthWrite: false,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: 'uniform sampler2D t; varying vec2 vUv; void main(){ gl_FragColor = texture2D(t, vUv); }'
      }));
    }   // copia grezza (niente tone mapping)
    render(r, w, read) { this.q.material.uniforms.t.value = read.texture; r.setRenderTarget(salvaRT); this.q.render(r); }
  }
  class RimettiPass extends Pass {
    constructor(tN) {
      super(); this.needsSwap = true; this.q = new FullScreenQuad(new THREE.ShaderMaterial({
        uniforms: { tDiffuse: { value: null }, saved: { value: salvaRT && salvaRT.texture }, tN: { value: tN }, k: { value: +(Q.get('pk') || 0.7) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
        fragmentShader: 'uniform sampler2D tDiffuse, saved, tN; uniform float k; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); float card = texture2D(tN, vUv).a < 0.5 ? 1. : 0.; gl_FragColor = vec4(mix(c.rgb, texture2D(saved, vUv).rgb, card * k), c.a); }'
      }));
    }
    render(r, w, read) { this.q.material.uniforms.tDiffuse.value = read.texture; r.setRenderTarget(this.renderToScreen ? null : w); this.q.render(r); }
  }
  if (STEP >= 17 && inkPass && !Q.has('nosalva')) { const i = comp.passes.findIndex(p => p instanceof NebbiaPass); comp.insertPass(new SalvaPass(), i < 0 ? comp.passes.length : i); }   // salvata PRIMA di nebbia e bagliori
  { const bp1 = new UnrealBloomPass(new THREE.Vector2(1080, 1920), +(Q.get('bs') || 0.6), +(Q.get('br') || 0.5), +(Q.get('bt') || 1.0)); comp.addPass(bp1); if (SS > 1) bp1.setSize(1080, 1920); }
  if (STEP >= 9) { const bp2 = new UnrealBloomPass(new THREE.Vector2(540, 960), +(Q.get('gs') || (STEP >= 16 ? 0.3 : STEP >= 10 ? 0.38 : 0.3)), +(Q.get('gr') || 1.0), +(Q.get('gt') || (LR ? 0.9 : STEP >= 10 ? 0.42 : 0.7))); comp.addPass(bp2); if (SS > 1) bp2.setSize(540, 960); }   /* bagliore generale: opaco, raggio ampio, soglia bassa (tutte le zone chiare respirano luce) */
  // [12/11] questa riga era finita DENTRO il commento qui sopra e non girava mai (il look approvato è senza). Riparata ma facoltativa finché
  // l'utente non approva il prima/dopo (confronti/rimetti_prima_dopo.jpg). APPROVATO dall'utente il 12/11: acceso di base con la luce Rick.
  if (STEP >= 17 && inkPass && !Q.has('norim') && (Q.has('rimetti') || (LR && Q.get('rimetti') !== '0'))) comp.addPass(new RimettiPass(inkPass.uniforms.tN.value));   /* [utente 12/11] approvato: acceso di base nelle storie Rick ("rimetti": 0 lo spegne), facoltativo nelle altre */
  const gradeOn = (LC && LC_OPT.grade !== false) || Q.has('grade');
  if (gradeOn) {
    const gOpt = (LC_OPT.grade && typeof LC_OPT.grade === 'object') ? LC_OPT.grade : {};
    const kL = P.luce || 'interno';
    const GRADE_PRESETS = {
      giorno: { contrast: 1.11, sat: 1.06, vigK: 0.18, vigR0: 0.42, vigR1: 0.98, lift: [0.005, 0.008, 0.017], shdTint: [0.94, 0.98, 1.07], midTint: [1.01, 1.00, 0.98], hiTint: [1.04, 1.00, 0.94] },
      day: { contrast: 1.11, sat: 1.06, vigK: 0.18, vigR0: 0.42, vigR1: 0.98, lift: [0.005, 0.008, 0.017], shdTint: [0.94, 0.98, 1.07], midTint: [1.01, 1.00, 0.98], hiTint: [1.04, 1.00, 0.94] },
      mattina: { contrast: 1.10, sat: 1.05, vigK: 0.17, vigR0: 0.42, vigR1: 0.98, lift: [0.006, 0.009, 0.018], shdTint: [0.94, 0.99, 1.07], midTint: [1.00, 1.00, 0.99], hiTint: [1.04, 1.01, 0.95] },
      tramonto: { contrast: 1.14, sat: 1.07, vigK: 0.24, vigR0: 0.38, vigR1: 0.96, lift: [0.010, 0.007, 0.023], shdTint: [0.93, 0.92, 1.12], midTint: [1.05, 0.98, 0.92], hiTint: [1.06, 0.97, 0.88] },
      golden: { contrast: 1.14, sat: 1.07, vigK: 0.24, vigR0: 0.38, vigR1: 0.96, lift: [0.010, 0.007, 0.023], shdTint: [0.93, 0.92, 1.12], midTint: [1.05, 0.98, 0.92], hiTint: [1.06, 0.97, 0.88] },
      crepuscolo: { contrast: 1.13, sat: 1.06, vigK: 0.24, vigR0: 0.38, vigR1: 0.96, lift: [0.009, 0.007, 0.025], shdTint: [0.92, 0.93, 1.12], midTint: [1.03, 0.97, 0.95], hiTint: [1.05, 0.96, 0.91] },
      notte: { contrast: 1.14, sat: 1.05, vigK: 0.27, vigR0: 0.36, vigR1: 0.94, lift: [0.004, 0.007, 0.019], shdTint: [0.91, 0.95, 1.12], midTint: [0.98, 0.99, 1.04], hiTint: [1.04, 1.00, 0.95] },
      interno: { contrast: 1.12, sat: 1.05, vigK: 0.26, vigR0: 0.38, vigR1: 0.96, lift: [0.007, 0.006, 0.012], shdTint: [0.96, 0.96, 1.05], midTint: [1.04, 1.00, 0.95], hiTint: [1.04, 1.00, 0.94] },
    };
    const gp = { ...(GRADE_PRESETS[kL] || GRADE_PRESETS.interno), ...gOpt };
    comp.addPass(new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uContrast: { value: +(Q.get('gr_con') || gp.contrast) },
        uSat: { value: +(Q.get('gr_sat') || gp.sat) },
        uVigK: { value: +(Q.get('gr_vig') || gp.vigK) },
        uVigR0: { value: gp.vigR0 },
        uVigR1: { value: gp.vigR1 },
        uLift: { value: new THREE.Vector3(...gp.lift) },
        uShdTint: { value: new THREE.Vector3(...gp.shdTint) },
        uMidTint: { value: new THREE.Vector3(...gp.midTint) },
        uHiTint: { value: new THREE.Vector3(...gp.hiTint) },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform sampler2D tDiffuse;
      uniform float uContrast, uSat, uVigK, uVigR0, uVigR1;
      uniform vec3 uLift, uShdTint, uMidTint, uHiTint;
      varying vec2 vUv;
      void main() {
        vec4 c = texture2D(tDiffuse, vUv);
        vec3 col = clamp(c.rgb, 0.0, 1.0);
        float l = dot(col, vec3(0.299, 0.587, 0.114));
        float inkKeep = smoothstep(0.05, 0.15, l);
        vec3 s = col * col * (3.0 - 2.0 * col);
        col = mix(col, s, clamp((uContrast - 1.0) * 1.45, 0.0, 0.45) * inkKeep);
        col += uLift * inkKeep * (1.0 - smoothstep(0.08, 0.55, l));
        float wShd = (1.0 - smoothstep(0.05, 0.46, l)) * inkKeep;
        float wMid = sin(clamp(l, 0.0, 1.0) * 3.14159265) * smoothstep(0.08, 0.25, l);
        float wHi = smoothstep(0.46, 0.92, l);
        col *= mix(vec3(1.0), uShdTint, wShd) * mix(vec3(1.0), uMidTint, wMid * 0.65) * mix(vec3(1.0), uHiTint, wHi * 0.75);
        float l2 = dot(col, vec3(0.299, 0.587, 0.114));
        float satMod = mix(uSat, 1.0, smoothstep(0.70, 0.96, l2)) * inkKeep + (1.0 - inkKeep);
        col = mix(vec3(l2), col, satMod);
        float vr = length((vUv - 0.5) * vec2(1.0, 0.85)) * 1.52;
        float vig = 1.0 - uVigK * smoothstep(uVigR0, uVigR1, vr);
        col = mix(col * vig, col * vig * vec3(0.95, 0.96, 1.03), (1.0 - vig) * 0.5);
        gl_FragColor = vec4(clamp(col, 0.0, 0.98), c.a);
      }`
    }));
  }
  if (STEP < 9) comp.addPass(new OutputPass());   // NB: dallo step 9 il look approvato è SENZA OutputPass (era rimasto escluso per errore e quel risultato è quello scelto): non riaggiungerlo
  // ===== fine delle passate copiate =====
  let closedK = null, PLUCI = null, OCCL = null;
  const render = () => {
    scene.updateMatrixWorld(true);
    sky.position.copy(camera.position);
    if (LR) {
      const fwd = new THREE.Vector3();
      camera.getWorldDirection(fwd);
      let fx = fwd.x, fz = fwd.z;
      const fn = Math.hypot(fx, fz) || 1e-4;
      fx /= fn; fz /= fn;
      const focus = camera.position.clone().addScaledVector(fwd, 4.0);
      focus.y = 0.8;
      // luogo chiuso: lo dice la storia ("esterno": true o no → parametro chiuso); se manca, raggio verso l'alto dalla camera
      if (closedK === null) { if (par.chiuso !== undefined) closedK = par.chiuso ? 1 : 0; else { const rc = new THREE.Raycaster(camera.position.clone(), new THREE.Vector3(0, 1, 0), 0, 12); closedK = rc.intersectObject(root, true).some(h => h.object.isMesh && !h.object.userData.card && h.object !== sky) ? 1 : 0; } }
      const azRad = (closedK ? 160 : (RL_CONF.az ?? 145)) * Math.PI / 180;
      const elRad = (closedK ? 70 : (RL_CONF.el || 45)) * Math.PI / 180;   // chiuso senza luci nel quadro: luce dall'alto, nessuna ombra portata
      const hx = fx * Math.cos(azRad) - fz * Math.sin(azRad);
      const hz = fz * Math.cos(azRad) + fx * Math.sin(azRad);
      let sunDir = new THREE.Vector3(hx * Math.cos(elRad), Math.sin(elRad), hz * Math.cos(elRad)).normalize(), shK = 1;
      if (closedK) {   // [utente 12/11] nei luoghi chiusi ombre SOLO dalle luci vere che si vedono nell'inquadratura (lampadari, lampade), mai da una luce nascosta
        if (!PLUCI) {
          PLUCI = []; OCCL = []; scene.traverse(o => {
            if (o.isPointLight || o.isSpotLight) PLUCI.push(o);
            if (o.isMesh && !o.userData.card && o.geometry?.attributes?.position && o.geometry.attributes.position.count < 6000) { const sz = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()); const d = [sz.x, sz.y, sz.z].sort((a, b) => a - b); if (d[2] > 3 && d[1] > 2 && d[0] < 0.8) OCCL.push(o); }
          });
        }   // muri, pavimenti, soffitti: tolgono le lampade che stanno dietro
        // [12/11] tutto CONTINUO (prima le lampade che entravano/uscivano dal quadro o passavano dietro un montante facevano saltare la luce):
        // bordo del quadro sfumato, «davanti alla camera» sfumato, coperture misurate con 5 raggi (frazione visibile), 6 lampade con peso relativo.
        camera.updateMatrixWorld(); const v = new THREE.Vector3(), acc = new THREE.Vector3(), lam = []; let ws = 0, vmax = 0;
        const cR = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), cU = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1), rc = new THREE.Raycaster(), hb = new THREE.Vector3();
        const coperta = (p, dl) => {
          rc.set(camera.position, p.clone().sub(camera.position).normalize()); rc.near = 0.05; rc.far = dl - 0.4;
          if (rc.intersectObjects(OCCL, false).length) return true; for (const b of (root.userData.occlusori || [])) if (rc.ray.intersectBox(b, hb) && hb.distanceTo(camera.position) < dl - 0.4) return true; return false;
        };
        for (const l of PLUCI) {
          if (!l.visible || !(l.intensity > 0)) continue; l.getWorldPosition(v);
          const dav = v.clone().sub(camera.position).normalize().dot(fwd), fr = Math.min(1, Math.max(0, (dav - 0.2) / 0.35)); if (fr <= 0) continue;
          const ndc = v.clone().project(camera), e = Math.max(Math.abs(ndc.x), Math.abs(ndc.y)), bordo = Math.min(1, Math.max(0, (1.15 - e) / 0.3)); if (bordo <= 0) continue;
          const dl = v.distanceTo(camera.position); let vistaK = 0; for (const [ox, oy] of [[0, 0], [0.25, 0], [-0.25, 0], [0, 0.25], [0, -0.25]]) if (!coperta(v.clone().addScaledVector(cR, ox).addScaledVector(cU, oy), dl)) vistaK += 0.2;
          const vis = fr * bordo * vistaK; if (vis <= 0.001) continue;
          const d = v.distanceTo(focus), w = vis * l.intensity / (1 + d * d * 0.15), dir = v.clone().sub(focus).normalize(); if (dir.y < 0.2) { dir.y = 0.2; dir.normalize(); }
          acc.addScaledVector(dir, w); ws += w; vmax = Math.max(vmax, vis); lam.push([w, vis, v.clone()]);
        }
        if (ws > 1e-5) { const k = Math.min(1, vmax); sunDir = sunDir.clone().lerp(acc.normalize(), k).normalize(); shK = vmax; } else shK = 0;   // si passa piano dalla luce dall'alto a quella delle lampade
        if (TONE_UNIFORMS) {
          lam.sort((a, b) => b[0] - a[0]); const U = TONE_UNIFORMS, wmax = lam.length ? lam[0][0] : 1; U.uLampN.value = Math.min(1, vmax);
          for (let i = 0; i < 6; i++) { const q = lam[i]; if (q) { U.uLampV.value[i].copy(q[2]).applyMatrix4(camera.matrixWorldInverse); U.uLampW.value[i] = q[0] / wmax; } else U.uLampW.value[i] = 0; }
        }
      }
      if (TONE_UNIFORMS) {
        TONE_UNIFORMS.uShadowK.value = shK;
        if (!closedK) TONE_UNIFORMS.uLampN.value = 0;
        else if (LC && LC_OPT.bounce !== false) TONE_UNIFORMS.uIndirectK.value = Math.max(TONE_UNIFORMS.uIndirectK.value, 0.45);
      }
      L.sun.position.copy(focus).addScaledVector(sunDir, 25);
      L.sun.target.position.copy(focus);
      L.sun.target.updateMatrixWorld();

      const Rr = (RL_CONF.el < 20 || RL_CONF.az === 15) ? 18 : 14;
      Object.assign(L.sun.shadow.camera, {
        left: -Rr, right: Rr, top: Rr, bottom: -Rr, near: 0.5, far: 60
      });
      L.sun.shadow.camera.updateProjectionMatrix();

      // luogo chiuso: muri, soffitto e travi non fanno ombra (la luce vera sta dentro la stanza)
      root.traverse(o => {
        if (closedK && o.isMesh && o.castShadow && !o.userData.card && !o.userData.lrBox) { o.userData.lrBox = 1; const bb = new THREE.Box3().setFromObject(o); if (bb.max.y > 2.4 || bb.max.y - bb.min.y > 2.2) o.castShadow = false; }
        if (o.isMesh && o.material && !o.userData.card && !o.userData.ombra && !o.userData.wet) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) {
            if (!m) continue;
            if (hasHdrEnv && m.isMeshStandardMaterial && !m.userData._envInit) {
              m.userData._envInit = true;
              m.envMapIntensity = (m.userData.envExplicit ?? (hdrEnvScale * (m.userData.envScale ?? 1)));
            }
            applyTwoTone(m);
          }
        }
      });
    } else if (hasHdrEnv) {
      root.traverse(o => {
        if (o.isMesh && o.material && !o.userData.card && !o.userData.ombra && !o.userData.wet) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) if (m && m.isMeshStandardMaterial && !m.userData._envInit) {
            m.userData._envInit = true;
            m.envMapIntensity = (m.userData.envExplicit ?? (hdrEnvScale * (m.userData.envScale ?? 1)));
          }
        }
      });
    }
    lightCards();
    if (wetPass) wetPass();
    if (ndPass) ndPass();
    for (const p of dofP) {
      p.uniforms.focus.value = DOF.focus;
      p.uniforms.fgeo.value = DOF.fgeo ?? DOF.focus;
      p.uniforms.cInf.value = DOF.cInf; p.uniforms.bokeh.value = DOF.bokeh || 0;
      p.uniforms.dofZona.value = DOF.zona ?? 0; p.uniforms.nearScale.value = DOF.nearScale ?? 1.2;
      p.uniforms.fuv.value.set(...(DOF.fuv || [-1, -1]));
    }
    comp.render();
  };
  return { dof: DOFON ? DOF : null, root, road, Q, card, lightCards, mappaBordi, render, pronto: () => hdrReady, luce: LU, strada: { w: SW, l: SL, x: SX, z: SZ } };
}
