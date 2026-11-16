// node --test kit/tests/test_collocazione.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
const root = process.env.CARTOON_TEST_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const threeURL = pathToFileURL(path.join(root, 'engine3d/lib/three.module.js')).href;
const THREE = await import(threeURL);
// Usa il codice reale; il renderer browser non serve alle prove geometriche.
const source = fs.readFileSync(path.join(root, 'engine3d/web/vita.js'), 'utf8')
  .replace("import { THREE } from '/web/look_disegnato.js';", `import * as THREE from '${threeURL}';`);
const sourceCompleto = source.replace("'/web/collocazione_incastri.js'", JSON.stringify(pathToFileURL(path.join(root,'engine3d/web/collocazione_incastri.js')).href));
const { creaVita } = await import('data:text/javascript;base64,' + Buffer.from(sourceCompleto).toString('base64'));
function setup() {
  const root = new THREE.Group(), V = creaVita({root});
  const camera = new THREE.PerspectiveCamera(80, 1, .1, 100);
  camera.position.set(0, 3, 8); camera.lookAt(0, 1, 0); camera.updateMatrixWorld(true);
  const box = (name, size, pos, parent = root) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshBasicMaterial());
    o.name = name; o.position.set(...pos); parent.add(o); return o;
  };
  return {root, V, camera, box, check: opt => V.collocazione(camera, opt)};
}
test('cassa nel distributore; appoggio di 5 mm ignorato', () => {
  const s = setup();
  s.box('distributore', [.9,1.85,.7], [0,.925,0]);
  s.box('cassa', [.6,.6,.6], [.35,.5,0]);
  s.box('scatola_sopra', [.3,.3,.3], [0,1.995,0]);
  const a = s.check();
  assert.equal(a.length,1); assert.equal(a[0].codice,'COMPENETRATI');
  assert.match(a[0].testo,/«cassa».*61%.*«distributore»/);
});
test('mela nella ciotola aperta e oggetto nello scaffale: nessun errore', () => {
  const s = setup();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.4,.3,.5,16,1,true), new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
  b.name='ciotola'; b.position.y=.25; s.root.add(b);
  const m = new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),new THREE.MeshBasicMaterial());
  m.name='mela'; m.position.y=.2; s.root.add(m);
  const shelf = new THREE.Group(); shelf.name='scaffale'; shelf.position.x=2; s.root.add(shelf);
  s.box('',[1,.1,1],[0,0,0],shelf); s.box('',[.1,1,1],[-.5,.5,0],shelf); s.box('',[.1,1,1],[.5,.5,0],shelf);
  s.box('libro',[.3,.4,.4],[2,.25,0]);
  assert.deepEqual(s.check(),[]);
});
test('i pezzi incastrati dello stesso modello non sono oggetti distinti', () => {
  const s=setup(), g=new THREE.Group(); g.name='porta_montata'; s.root.add(g);
  s.box('facciata',[2,2,.4],[0,1,0],g); s.box('montante',[.2,1.8,.4],[.9,1,.1],g);
  assert.deepEqual(s.check(),[]);
});
test('lampione sui binari segnalato; treno senza nome e modello GLB riconosciuti', () => {
  const s=setup();
  const rail=s.box('letto',[3,.1,8],[0,-.1,0]); rail.userData.passaggio={nome:'binario',per:['treno']};
  s.box('lampione',[.1,3,.1],[0,1.5,1]);
  const train = new THREE.Group(); train.userData.vivo='treno'; s.root.add(train);
  s.box('corpo',[1,1,2],[0,.5,-1],train);
  const wrapper = new THREE.Group(), model = new THREE.Group(); model.name='treno_regionale'; wrapper.add(model); s.root.add(wrapper);
  s.box('corpo',[1,1,1],[0,.5,-3],model);
  const a=s.check().filter(x=>x.codice==='FUORI_POSTO');
  assert.equal(a.length,1); assert.match(a[0].testo,/lampione/);
});
test('zona stretta alle rotaie: la banchina resta libera', () => {
  const s=setup(); s.box('binari',[2,.1,8],[0,-1,0]);
  s.box('capotreno',[.4,1.7,.4],[1.4,.85,0]);
  assert.deepEqual(s.check(),[]);
});
test('controlli ripetuti seguono movimento, visibilità e soglia', () => {
  const s=setup(); s.box('distributore',[.9,1.85,.7],[0,.925,0]);
  const c=s.box('cassa',[.6,.6,.6],[.35,.5,0]);
  assert.equal(s.check().length,1);
  assert.equal(s.check({quota:.9}).length,0);
  assert.equal(s.check().length,1);
  c.position.x=3; assert.deepEqual(s.check(),[]);
  c.position.x=.35; assert.equal(s.check().length,1);
  c.visible=false; assert.deepEqual(s.check(),[]);
  c.visible=true; assert.equal(s.check().length,1);
});
test('un controllo fallito si ritenta; riassemblare un modello invalida il risultato', () => {
  const s=setup(), b=s.box('distributore',[.9,1.85,.7],[0,.925,0]);
  const c=s.box('cassa',[.6,.6,.6],[.35,.5,0]);
  const getX=b.geometry.index.getX;
  b.geometry.index.getX=()=>{throw new Error('indice non leggibile');};
  assert.throws(()=>s.check(),/indice non leggibile/);
  b.geometry.index.getX=getX;
  assert.equal(s.check().length,1);
  const g=new THREE.Group(); s.root.add(g); g.add(b,c);
  assert.deepEqual(s.check(),[]);
});

function vano(s, {aperto=true, angolo=0, nome='porta_scorrevole'}={}) {
  const pezzi=aperto ? [[.35,4.525,.3,-1.975,2.2625,0],[.35,4.525,.3,1.975,2.2625,0],[3.6,2.225,.3,0,3.4125,0]] : [[4.3,4.525,.3,0,2.2625,0]];
  const pos=[];
  for(const [w,h,d,x,y,z] of pezzi) {
    const g=new THREE.BoxGeometry(w,h,d).toNonIndexed(); g.translate(x,y,z);
    pos.push(...g.attributes.position.array); g.dispose();
  }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  const parete=new THREE.Mesh(geo,new THREE.MeshBasicMaterial()); parete.name='facciata'; parete.rotation.y=angolo; s.root.add(parete);
  const porta=new THREE.Group(); porta.name=nome; porta.rotation.y=angolo; s.root.add(porta);
  s.box('montante',[.092,2.208,.22],[-1.886,1.104,.14],porta);
  s.box('montante001',[.092,2.208,.22],[1.886,1.104,.14],porta);
  s.box('architrave',[3.864,.2392,.22],[0,2.3276,.14],porta);
  return {porta,parete};
}
test('telai di GLB separati montati nel vano: riconosciuti anche ruotati',()=>{
  for(const angolo of [0,Math.PI/4,Math.PI/2]) {
    const s=setup(); const {porta}=vano(s,{angolo});
    assert.deepEqual(s.check(),[]);
    porta.name='altro_modello';
    assert.ok(s.check().some(a=>a.codice==='COMPENETRATI'),'il caso geometrico deve davvero compenetrarsi');
  }
});
test('nomi da serramento non nascondono pezzi affondati in una parete senza vano',()=>{
  const s=setup(); vano(s,{aperto:false});
  assert.ok(s.check().some(a=>a.codice==='COMPENETRATI'));
});
test('una cassa al bordo del vano non diventa un incastro',()=>{
  const s=setup(); const {porta}=vano(s);
  s.box('cassa',[.3,.6,.3],[1.85,1,.05],porta);
  assert.ok(s.check().some(a=>a.codice==='COMPENETRATI' && /cassa/.test(a.testo)));
});

test('architrave tra due montanti: riconosciuti entrambi gli appoggi',()=>{
  const s=setup(); const {parete}=vano(s);
  // Alza la parete superiore: il traverso resta agganciato soltanto ai due lati del vano.
  const p=parete.geometry.attributes.position;
  for(let i=0;i<p.count;i++) if(i>=72 && p.getY(i)<2.31) p.setY(i,2.65);
  p.needsUpdate=true; parete.geometry.computeBoundingBox();
  assert.deepEqual(s.check(),[]);
});
test('binari diagonali: lampione nel passaggio segnalato, oggetto laterale ignorato',()=>{
  const s=setup(); const zona=s.box('binari',[1,.1,8],[0,-.1,0]); zona.rotation.y=Math.PI/4;
  s.box('lampione_nel_passaggio',[.1,2,.1],[1,1,1]);
  s.box('lampione_laterale',[.1,2,.1],[2,1,-2]);
  const a=s.check().filter(x=>x.codice==='FUORI_POSTO');
  assert.equal(a.length,1); assert.match(a[0].testo,/lampione_nel_passaggio/);
});

test('il nome del mondo non basta a dichiarare tutti i componenti come serramenti',()=>{
  const s=setup(); s.root.name='porta'; vano(s,{nome:'altro_modello'});
  assert.ok(s.check().some(a=>a.codice==='COMPENETRATI'));
});
