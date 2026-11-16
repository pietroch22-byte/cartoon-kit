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
const { creaVita } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
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
