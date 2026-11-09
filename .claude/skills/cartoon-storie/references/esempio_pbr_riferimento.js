// Realistic look on the reference engine: PBR materials, HDR skies chosen by the script's time of day,
// ACES, ambient occlusion, bloom, and CC0 Poly Haven models to enrich every set.
import { THREE, scene, renderer, camera, sky } from './engine.js';
import { W, T } from './world.js';
import { shotAt, LIGHTS } from './story.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from '../node_modules/three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from '../node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from '../node_modules/three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from '../node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../node_modules/three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from '../node_modules/three/examples/jsm/postprocessing/ShaderPass.js';
// final grade in display space: saturation (ACES washes colour out), contrast around mid-grey, warm/cool tint
const Grade = { uniforms: { tDiffuse: { value: null }, sat: { value: 1.3 }, con: { value: 1.08 }, tint: { value: new THREE.Vector3(1, 1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float sat, con; uniform vec3 tint; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 g = mix(vec3(l), c.rgb, sat); g = (g - 0.5) * con + 0.5; g *= tint;
      float L2 = dot(g, vec3(0.2126, 0.7152, 0.0722)), m = max(max(g.r, g.g), g.b);
      if (m > 0.97) g *= 0.97 / m; // keep the hue and its saturation: scale the colour down instead of greying it
      g = max(g, vec3(0.025)); // never pure black
      gl_FragColor = vec4(clamp(g, 0.0, 1.0), c.a); }` };

const tl = new THREE.TextureLoader();
const tx = (p, srgb, rep) => { const t = tl.load(p); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) t.repeat.set(...rep); return t; };
const set = (name, rep, tint) => {
  const d = tx(`./ph/tex/${name}_diff.jpg`, true, rep), n = tx(`./ph/tex/${name}_nor.jpg`, false, rep), a = tx(`./ph/tex/${name}_arm.jpg`, false, rep);
  return { map: d, normalMap: n, roughnessMap: a, aoMap: a, roughness: 1, metalness: 0, color: new THREE.Color(tint || '#ffffff') };
};
const gl = new GLTFLoader(), cache = {};
async function put(P, name, size, pos, ry = 0) {
  if (!cache[name]) cache[name] = gl.loadAsync(`./ph/models/${name}/${name}.gltf`).catch(() => gl.loadAsync(`./kit/modelli/${name}/${name}.gltf`)).catch(e => { console.error('model ' + name); return null; });
  const src = await cache[name]; if (!src) return;
  const g = src.scene.clone(true);
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.material.envMapIntensity = 1; } });
  const b = new THREE.Box3().setFromObject(g), d = b.getSize(new THREE.Vector3());
  const k = typeof size === 'number' ? size / d.y : size.w / Math.max(d.x, d.z);
  g.scale.setScalar(k); g.position.set(-(b.min.x + d.x / 2) * k, -b.min.y * k, -(b.min.z + d.z / 2) * k);
  const G = new THREE.Group(); G.add(g); G.position.set(...pos); G.rotation.y = ry; P.add(G);
}
function convert(group, rules, glowBoost = 1, paintedGlow = false) {
  group.traverse(m => {
    if (!m.isMesh || !m.material.isMeshToonMaterial) return;
    const o = m.material, glow = o.emissive && o.emissive.getHex() && o.emissiveIntensity > 0.2;
    if (glow) { // light sources: pure emitted colour (not lit by the scene, or every channel saturates to white), bright enough to bloom
      // flames keep their painted layers (red shell, orange body, yellow core): vivid, slightly over 1 so the core glows
      const c = paintedGlow ? o.color.clone().multiplyScalar(2.1) : o.emissive.clone().multiplyScalar(3.2 * glowBoost);
      m.material = new THREE.MeshBasicMaterial({ color: c, transparent: o.transparent, opacity: o.opacity }); return; }
    const r = rules.get(o.map);
    m.material = new THREE.MeshStandardMaterial(r ? { ...r } : { color: o.color, map: o.map, roughness: 0.78, metalness: 0, envMapIntensity: 0.8, transparent: o.transparent, opacity: o.opacity, emissive: o.emissive, emissiveIntensity: o.emissiveIntensity });
  });
}

// time of day comes from the script: each shot's light preset picks sky, exposure and environment
const LOOK = {
  hallWarm: { env: 'kit', exp: 1.1, card: 0.8, sat: 1.3, con: 1.06, tint: [1.03, 1.0, 0.95] },
  kitWarm: { env: 'kit', exp: 1.15, card: 0.86, sat: 1.28, con: 1.06, tint: [1.03, 1.0, 0.95] },
  hallNight: { env: 'kit', exp: 0.85, card: 0.92, sat: 1.22, con: 1.03, tint: [0.97, 0.98, 1.05] },
  golden: { env: 'sunset', bg: true, exp: 0.34, card: 1.0, sat: 1.22, con: 1.04, tint: [1.04, 0.99, 0.94] },
  night: { env: 'night', bg: true, exp: 0.95, card: 1.0, sat: 1.2, con: 0.98, tint: [0.95, 0.98, 1.06] },
};
let composer, grade, bloom; const ENV = {}, BG = {};
export function renderPBR(f) {
  const s = shotAt(f), lk = LOOK[s.light] || { env: 'kit', exp: 1.4 };
  scene.environment = ENV[lk.env];
  scene.background = lk.bg ? BG[lk.env] : null;
  sky.visible = !lk.bg;
  renderer.toneMappingExposure = lk.exp;
  grade.uniforms.sat.value = lk.sat ?? 1.3; grade.uniforms.con.value = lk.con ?? 1.08; grade.uniforms.tint.value.set(...(lk.tint || [1, 1, 1]));
  // cards are unlit: keep characters at the same brightness whatever the room exposure
  scene.traverse(o => { if (o.isMesh && o.userData.id?.startsWith?.('actor:') && o.material.color) o.material.color.setScalar(lk.card ?? 0.9); });
  composer.render();
}
export async function pbr() {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  Object.assign(LIGHTS.golden, { sunI: 0.8, hemi: 0.45, fogN: 60, fogF: 300 });
  const pm = new THREE.PMREMGenerator(renderer), rl = new RGBELoader();
  for (const [k, file] of [['kit', 'kiara_interior'], ['sunset', 'sunset_sky'], ['night', 'night_sky']]) {
    const h = await rl.loadAsync(`./ph/hdri/${file}.hdr`); ENV[k] = pm.fromEquirectangular(h).texture; h.mapping = THREE.EquirectangularReflectionMapping; BG[k] = h;
  }
  const FLOOR = set('terracotta_floor_tiles', [4, 4], '#ffd2bc'), WALL = set('yellow_plaster', [3, 1.3], '#ffc95a'), TILE = set('square_tiled_wall', [6, 1.4], '#d8efe8');
  const COB = set('cobblestone_floor_01', [14, 14], '#f2e6d8'), WOOD = set('wood_floor', [1, 1], '#c89060');
  const PAPER = { map: T.wallpaper, color: new THREE.Color('#d2c09c'), roughness: 0.85, metalness: 0, envMapIntensity: 0.7 };
  // swap primitive set pieces for realistic models: kitchen chairs (6-part groups of wood boxes)
  const chairs = [];
  W.kitchen.traverse(g => { if (g.isGroup && g.children.length === 6 && g.children.every(c => c.isMesh && c.material.map === T.wood)) chairs.push(g); });
  const swaps = chairs.map(g => { g.visible = false; return put(W.kitchen, 'painted_wooden_chair_01', 0.95, [g.position.x, 0, g.position.z], g.rotation.y); });
  const rules = new Map([[T.wallpaper, PAPER], [T.terracotta, FLOOR], [T.plaster, WALL], [T.kitTiles, TILE], [T.cobble, COB], [T.wood, WOOD]]);
  convert(W.hall, rules); convert(W.kitchen, rules, 1.2, true); convert(W.roof, rules, 1.0); convert(W.piazza, rules, 2.4);
  const H = W.hall, K = W.kitchen, Z = W.piazza;
  await Promise.all([
    // hall: a lived-in entrance
    put(H, 'vintage_grandfather_clock_01', 2.0, [-3.45, 0, -2.65], 0), put(H, 'ArmChair_01', 0.95, [-3.2, 0, 0.6], Math.PI / 2),
    put(H, 'mantel_clock_01', 0.24, [-1.25, 0.83, -2.75]), put(H, 'brass_candleholders', 0.22, [-1.95, 0.83, -2.72]),
    put(H, 'potted_plant_02', 1.1, [3.35, 0, -2.6]), put(H, 'Shelf_01', 1.6, [3.62, 0, 0.9], -Math.PI / 2),
    put(H, 'ornate_mirror_01', 0.9, [3.85, 1.05, -1.0], -Math.PI / 2), put(H, 'hanging_picture_frame_02', 0.55, [2.9, 1.35, -2.98]),
    // kitchen: more of what a nonna's kitchen holds
    put(K, 'wine_bottles_01', 0.34, [1.55, 0.92, -2.8]), put(K, 'CheeseBox_01', { w: 0.32 }, [3.15, 0.92, -2.7], 0.3),
    put(K, 'antique_ceramic_vase_01', 0.34, [3.55, 0.92, -2.85]), put(K, 'brass_pot_01', { w: 0.46 }, [2.55, 0.92, -2.75]),
    put(K, 'brass_pan_01', { w: 0.4 }, [2.05, 0.92, -2.7], 0.6), put(K, 'yellow_onion', 0.08, [1.9, 0.92, -2.55]), put(K, 'yellow_onion', 0.08, [1.98, 0.92, -2.48], 1),
    put(K, 'wicker_basket_01', { w: 0.34 }, [-0.45, 0.78, 0.15]), put(K, 'food_apple_01', 0.08, [-0.42, 0.88, 0.12]), put(K, 'lemon', 0.07, [0.25, 0.78, 0.0]),
    put(K, 'potted_plant_01', 1.0, [-3.45, 0, -0.7]), put(K, 'pot_enamel_01', { w: 0.3 }, [-3.2, 0.92, -2.75]), put(K, 'wicker_basket_02', { w: 0.45 }, [2.7, 0, -1.0]),
    put(K, 'ceramic_pot', 0.3, [-3.55, 0, 0.6]),
    // piazza at night: real lamps, barrels, crates, planters, a tree, a coffee cart
    put(Z, 'street_lamp_01', 3.6, [-5.5, 0, -3.6]), put(Z, 'street_lamp_01', 3.6, [5.5, 0, -3.6]),
    put(Z, 'wine_barrel_01', 0.95, [6.6, 0, -0.4]), put(Z, 'wooden_crate_01', 0.5, [7.4, 0, -0.1], 0.4), put(Z, 'wooden_crate_01', 0.5, [7.35, 0.5, -0.15], 1.1),
    put(Z, 'planter_pot_clay', 0.7, [-3.0, 0, -7.2]), put(Z, 'flower_gazania', 0.4, [-3.0, 0.62, -7.2]),
    put(Z, 'planter_pot_clay', 0.7, [3.0, 0, -7.2]), put(Z, 'flower_gazania', 0.4, [3.0, 0.62, -7.2], 2),
    put(Z, 'jacaranda_tree', 6.5, [-8.5, 0, -11]), put(Z, 'CoffeeCart_01', 1.6, [-7.6, 0, -6.5], Math.PI / 2),
    put(Z, 'painted_wooden_bench', 0.85, [4.4, 0, -11.2]),
    put(Z, 'outdoor_table_chair_set_01', 0.95, [5.6, 0, 3.4], -0.4), put(Z, 'planter_box_02', 0.8, [-6.8, 0, -3.6], Math.PI / 2),
    put(Z, 'wooden_crate_02', 0.55, [7.9, 0, 0.7], 0.3), put(Z, 'modular_street_seating', 0.5, [-3.6, 0, -10.2]), put(Z, 'street_lamp_02', 3.4, [0.5, 0, -13]),
    put(K, 'painted_wooden_cabinet', 1.8, [-3.55, 0, 1.6], Math.PI / 2), put(K, 'standing_picture_frame_01', 0.25, [3.0, 0.92, -2.9]), put(K, 'brass_vase_01', 0.28, [-2.75, 0.92, -2.85]),
    put(H, 'side_table_tall_01', 0.8, [3.4, 0, -0.5], -Math.PI / 2), put(H, 'fancy_picture_frame_02', 0.6, [-3.88, 1.3, -1.2], Math.PI / 2), put(H, 'wooden_bucket_02', 0.35, [-2.6, 0, 1.4]),
    ...swaps, put(Z, 'wooden_bucket_01', 0.35, [6.2, 0, 0.5]), put(Z, 'potted_plant_04', 1.1, [-6.2, 0, -1.2]),
  ]);
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, 1080, 1920);
  ao.updateGtaoMaterial({ radius: 0.18, distanceExponent: 2, thickness: 0.5, scale: 1, distanceFallOff: 1 }); // small radius: contact shadows only, no screen-edge halos
  // screen-space AO removed: it leaves dark seams on far objects behind near edges (door frame over Marco) and bands at frame edges
  void ao;
  bloom = new UnrealBloomPass(new THREE.Vector2(1080, 1920), 0.45, 0.35, 1.15); // threshold above any lit surface: only light sources glow composer.addPass(bloom);
  composer.addPass(new OutputPass());
  grade = new ShaderPass(Grade); composer.addPass(grade);
}
