// Engine: renderer, toon materials, painted textures, ink + grade + DOF post chain.
import * as THREE from 'three';
export { THREE };

export const W = 1080, H = 1920;
export const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 400);
const FAR = 400;

// ---------- toon materials ----------
const grad = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 235, 235, 235, 255, 255, 255, 255, 255]), 4, 1);
grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;

export function toon(color, map = null, extra = {}) {
  const m = new THREE.MeshToonMaterial({ color, gradientMap: grad, map, ...extra });
  if (map) map.colorSpace = THREE.SRGBColorSpace;
  return m;
}

// ---------- painted canvas textures ----------
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
export function paint(w, h, fn, { repeat = [1, 1], seed = 1 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); fn(g, w, h, rng(seed));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 8;
  return t;
}
// brushy noise over a flat colour
export function brush(g, w, h, r, base, var_ = 18, n = 900, size = 14) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const c = new THREE.Color(base);
  for (let i = 0; i < n; i++) {
    const k = (r() - 0.5) * var_ / 255;
    g.fillStyle = `rgba(${(c.r + k) * 255 | 0},${(c.g + k) * 255 | 0},${(c.b + k * 0.8) * 255 | 0},0.35)`;
    const x = r() * w, y = r() * h, s = size * (0.5 + r());
    g.beginPath(); g.ellipse(x, y, s * 1.8, s * 0.7, r() * 3, 0, 7); g.fill();
  }
}

// ---------- scene helpers ----------
export function add(geom, mat, pos = [0, 0, 0], rot = [0, 0, 0], { cast = true, recv = true, parent = scene, scale } = {}) {
  const m = new THREE.Mesh(geom, mat);
  m.position.set(...pos); m.rotation.set(...rot);
  if (scale) m.scale.set(...scale);
  m.castShadow = cast; m.receiveShadow = recv;
  parent.add(m); return m;
}
export function tbox(w, h, d, mat, pos, opts = {}) {
  // pos = bottom centre
  const m = add(new THREE.BoxGeometry(w, h, d), mat, [pos[0], pos[1] + h / 2, pos[2]], opts.rot || [0, 0, 0], opts);
  return m;
}
export function cyl(rt, rb, h, mat, pos, opts = {}) {
  return add(new THREE.CylinderGeometry(rt, rb, h, opts.seg || 28), mat, [pos[0], pos[1] + h / 2, pos[2]], opts.rot || [0, 0, 0], opts);
}
export function sph(r, mat, pos, opts = {}) {
  return add(new THREE.SphereGeometry(r, 28, 18), mat, pos, opts.rot || [0, 0, 0], opts);
}
// emissive / unlit
export function basic(color, extra = {}) { return new THREE.MeshBasicMaterial({ color, ...extra }); }
export function noInk(o) { o.traverse(m => { m.userData.noInk = true; }); return o; }
export function noND(o) { o.traverse(m => { m.userData.hideND = true; }); return o; }

// ---------- live text boards ----------
const boards = {};
export function makeBoard(name, w, h, px = 900, pos, rot = [0, 0, 0], parent = scene) {
  const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * h / w);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.02, toneMapped: false });
  const m = add(new THREE.PlaneGeometry(w, h), mat, pos, rot, { cast: false, recv: false, parent });
  m.userData.board = true;
  boards[name] = { c, g: c.getContext('2d'), t, key: null, mesh: m };
  return m;
}
export function drawBoard(name, key, fn) {
  const b = boards[name]; if (!b || b.key === key) return;
  b.key = key; b.g.clearRect(0, 0, b.c.width, b.c.height); fn(b.g, b.c.width, b.c.height); b.t.needsUpdate = true;
}
// fit a line of text to max width
export function fitText(g, text, x, y, maxW, size, font = 'bold', family = 'Georgia, serif') {
  let s = size;
  do { g.font = `${font} ${s}px ${family}`; s -= 2; } while (g.measureText(text).width > maxW && s > 8);
  g.fillText(text, x, y);
}

// ---------- sky ----------
export const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, stars: { value: 0 } },
  vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top,bot; uniform float stars; varying vec3 vP;
    float h(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
    void main(){ float t=clamp(vP.y*1.6+0.1,0.,1.); vec3 c=mix(bot,top,t);
      vec3 q=floor(vP*260.); float s=step(0.9965,h(q))*stars*smoothstep(0.05,0.3,vP.y); c+=vec3(s);
      gl_FragColor=vec4(c,1.); }`,
}));
sky.userData.hideND = true; sky.frustumCulled = false;
scene.add(sky);

// ---------- lights ----------
export const L = {
  hemi: new THREE.HemisphereLight(0xffffff, 0x886655, 1.0),
  sun: new THREE.DirectionalLight(0xffffff, 2.0),
  amb: new THREE.AmbientLight(0xffffff, 0.3),
  lamp: new THREE.PointLight(0xffc477, 0, 14, 1.6),
  lamp2: new THREE.PointLight(0xffc477, 0, 14, 1.6),
};
L.sun.castShadow = true; L.sun.shadow.mapSize.set(2048, 2048);
Object.assign(L.sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 60 });
L.sun.shadow.bias = -0.0006; L.sun.shadow.normalBias = 0.02;
for (const k in L) scene.add(L[k]);
scene.add(L.sun.target);
scene.fog = new THREE.Fog(0xffffff, 30, 140);

export function applyLight(P, look) {
  L.hemi.color.set(P.sky); L.hemi.groundColor.set(P.ground); L.hemi.intensity = P.hemi;
  L.sun.color.set(P.sun); L.sun.intensity = P.sunI;
  L.sun.position.set(look.x + P.sunDir[0] * 20, look.y + P.sunDir[1] * 20, look.z + P.sunDir[2] * 20);
  L.sun.target.position.copy(look);
  L.amb.color.set(P.amb || 0xffffff); L.amb.intensity = P.ambI ?? 0.3;
  scene.fog.color.set(P.fog); scene.fog.near = P.fogN; scene.fog.far = P.fogF;
  sky.material.uniforms.top.value.set(P.top); sky.material.uniforms.bot.value.set(P.bot);
  sky.material.uniforms.stars.value = P.stars || 0;
  sky.position.copy(camera.position);
}

// ---------- render targets + post ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const rtND = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });

const ndVS = `varying vec3 vN; varying float vZ; varying vec2 vUv;
  void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vZ=-mv.z; gl_Position=projectionMatrix*mv; }`;
const ndWorld = new THREE.ShaderMaterial({
  vertexShader: ndVS,
  fragmentShader: `varying vec3 vN; varying float vZ; void main(){ gl_FragColor=vec4(normalize(vN)*0.5+0.5, vZ/${FAR}.); }`,
});
const ndNoInk = new THREE.ShaderMaterial({
  vertexShader: ndVS,
  fragmentShader: `varying vec3 vN; varying float vZ; void main(){ gl_FragColor=vec4(0.5,0.5,0.5, vZ/${FAR}.); }`,
});
const ndCardFS = `uniform sampler2D map; varying vec2 vUv; varying float vZ;
  void main(){ if(texture2D(map,vUv).a<0.5) discard; gl_FragColor=vec4(0.5,0.5,0.5, vZ/${FAR}.); }`;
export function ndCardMat(map) {
  return new THREE.ShaderMaterial({ vertexShader: ndVS, fragmentShader: ndCardFS, uniforms: { map: { value: map } }, side: THREE.DoubleSide });
}

const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quadScene = new THREE.Scene();
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
quadScene.add(quad);

const inkMat = new THREE.ShaderMaterial({
  uniforms: { col: { value: rtColor.texture }, nd: { value: rtND.texture }, res: { value: new THREE.Vector2(W, H) },
    ink: { value: new THREE.Color(0x1a1016) }, grade: { value: new THREE.Vector4(1, 1, 1, 0) }, flash: { value: 0 },
    vign: { value: 0.35 }, sat: { value: 1.08 }, time: { value: 0 }, grain: { value: .025 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform vec3 ink; uniform vec4 grade; uniform float flash, vign, sat, time, grain;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    void main(){
      vec3 c = texture2D(col, vUv).rgb;
      vec4 me = texture2D(nd, vUv);
      float d = me.a; vec3 n = me.rgb*2.-1.; bool card = length(n) < 0.2;
      float e = 0.;
      if(!card && d < 0.999){
        vec2 px = 1./res;
        float rad = mix(4.6, 2.4, clamp(d*${FAR}./25.,0.,1.));
        for(int i=0;i<16;i++){
          float a = float(i)*0.785398 + (i>7 ? 0.3927 : 0.);
          vec2 o = vec2(cos(a),sin(a))*rad*(i>7 ? 0.5 : 1.)*px;
          vec4 nb = texture2D(nd, vUv+o);
          float dz = (nb.a - d)*${FAR}.;
          float th = 0.04 + d*${FAR}.*0.025;
          if(dz > th) e = 1.;
          vec3 nn = nb.rgb*2.-1.;
          if(length(nn)>0.2 && abs(dz) < th && dot(nn,n) < 0.78) e = max(e, 0.9);
        }
      }
      c = mix(c, ink, e*0.97);
      c *= grade.rgb;
      float l = dot(c, vec3(0.299,0.587,0.114));
      c = mix(vec3(l), c, sat);
      vec2 q = vUv-0.5; q.x*=0.5625; c *= 1. - vign*dot(q,q)*2.2;
      c += (hash(vUv*res + time)-0.5)*grain;
      c = mix(c, vec3(1.), flash);
      gl_FragColor = vec4(c, d);
    }`,
});
const dofMat = new THREE.ShaderMaterial({
  uniforms: { col: { value: rtInk.texture }, nd: { value: rtND.texture }, res: { value: new THREE.Vector2(W, H) },
    focus: { value: 5 }, range: { value: 2 }, maxR: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float focus, range, maxR; varying vec2 vUv;
    float coc(float d){ float z=d*${FAR}.; return clamp(abs(z-focus)/(range*max(z,0.1))*focus, 0., 1.)*maxR; }
    void main(){
      vec4 c0 = texture2D(col, vUv);
      if(maxR < 0.5){ gl_FragColor=vec4(c0.rgb,1.);
        #include <colorspace_fragment>
        return; }
      float r0 = coc(texture2D(nd,vUv).a);
      vec3 acc = c0.rgb; float wsum = 1.;
      for(int i=0;i<48;i++){
        float fi = float(i);
        float rr = sqrt((fi+0.5)/48.)*maxR;
        float a = fi*2.39996;
        vec2 o = vec2(cos(a),sin(a))*rr/res;
        float rs = coc(texture2D(nd, vUv+o).a);
        float w = step(rr, max(min(rs, r0+2.), 0.)+0.5) ;
        w = max(w, step(rr, r0)*0.6);
        acc += texture2D(col, vUv+o).rgb*w; wsum += w;
      }
      gl_FragColor = vec4(acc/wsum, 1.);
      #include <colorspace_fragment>
    }`,
});

export const post = { grade: [1, 1, 1], flash: 0, vign: 0.35, sat: 1.08, focus: 5, range: 2, maxR: 0, grain: .025 };

export function renderAll(frame) {
  // colour
  renderer.setRenderTarget(rtColor);
  renderer.render(scene, camera);
  // normal + depth: swap materials
  const swaps = [];
  const fog = scene.fog; scene.fog = null;
  const sh = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false;
  scene.traverse(o => {
    if (o.isLight) return;
    if (o.userData.hideND && o.visible) { swaps.push([o, 'vis']); o.visible = false; return; }
    if (o.isMesh || o.isPoints) {
      swaps.push([o, o.material]);
      o.material = o.userData.ndMat || (o.userData.noInk ? ndNoInk : ndWorld);
    }
  });
  renderer.setClearColor(0x808080, 1);
  renderer.setRenderTarget(rtND); renderer.clear(); renderer.render(scene, camera);
  for (const [o, m] of swaps) { if (m === 'vis') o.visible = true; else o.material = m; }
  scene.fog = fog; renderer.shadowMap.enabled = sh;
  renderer.setClearColor(0x000000, 1);
  // ink + grade
  const u = inkMat.uniforms;
  u.grade.value.set(...post.grade, 0); u.flash.value = post.flash; u.vign.value = post.vign; u.sat.value = post.sat; u.time.value = frame % 7; u.grain.value=post.grain;
  quad.material = inkMat; renderer.setRenderTarget(rtInk); renderer.render(quadScene, quadCam);
  // dof -> screen
  const d = dofMat.uniforms; d.focus.value = post.focus; d.range.value = post.range; d.maxR.value = post.maxR;
  quad.material = dofMat; renderer.setRenderTarget(null); renderer.render(quadScene, quadCam);
}

// ---------- maths ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };
export const ease = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const back = (a, b, x, s = 1.7) => { const t = clamp((x - a) / (b - a)) - 1; return 1 + t * t * ((s + 1) * t + s); };
export const q = (x, s = 0.02) => Math.round(x / s) * s;
