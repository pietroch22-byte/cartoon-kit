import {test} from 'node:test';
import assert from 'node:assert/strict';
import {regia} from '../tools/controllo_regia.mjs';

const scena = (da=0,a=24,id='persona') => ({luogo:'stazione',da,a,attori:[{id,x:0,z:0}],
  camera:Array.from({length:Math.floor((a-da)/3)+1},(_,i)=>({t:da+i*3,su:id,testa:.06,dist:8-i*.1}))});
const storia = scene => ({personaggi:'rick',scene});

test('ripresa continua di 24 secondi: nessun obbligo di taglio o cambio luogo',()=>{
  const s=storia([scena()]);
  assert.deepEqual(regia(s),[]);
});
test('tappe sullo stesso soggetto non contano come riprese ripetute',()=>{
  const sc=scena();sc.camera.forEach(k=>k.mossa='spinta');
  assert.deepEqual(regia({...storia([sc]),stile_camera:'rick'}),[]);
});
test('riprese su soggetti diversi nello stesso luogo non hanno un limite cumulativo di 8 secondi',()=>{
  const a=scena(0,6,'a'),b=scena(6,12,'b');b.camera.forEach(k=>k.testa=.2);
  const c=scena(12,18,'c');c.camera.forEach(k=>k.testa=.13);
  assert.deepEqual(regia(storia([a,b,c])),[]);
});
test('tre vere riprese uguali restano segnalate',()=>{
  const av=regia(storia([scena(0,6,'a'),scena(6,12,'b'),scena(12,18,'c')]));
  assert.ok(av.some(x=>x.includes('tre inquadrature di fila tutte')));
});
test('i tagli interni alla stessa scena restano inquadrature nuove',()=>{
  const sc=scena(0,9);sc.camera[1].taglio=true;sc.camera[2].taglio=true;
  assert.ok(regia(storia([sc])).some(x=>x.includes('tre inquadrature di fila tutte')));
});
test('cambio soggetto esplicito conserva il controllo di varietà',()=>{
  const sc=scena(0,9);sc.camera.forEach((k,i)=>k.su='persona'+i);
  assert.ok(regia(storia([sc])).some(x=>x.includes('tre inquadrature di fila tutte')));
});
test('tre scene tagliate sullo stesso soggetto restano segnalate',()=>{
  assert.ok(regia(storia([scena(0,6),scena(6,12),scena(12,18)]))
    .some(x=>x.includes('scene di fila sullo stesso soggetto')));
});
test('tappa troppo lunga, lampo, mancato campo largo e taglio lontano dalla parola restano segnalati',()=>{
  const sc=scena(0,9);sc.camera=[{t:0,su:'persona',testa:.2},{t:.4,su:'persona',testa:.2}];
  const a=regia(storia([sc]),[[0,.2,'uno'],[1,2,'due']]);
  assert.ok(a.some(x=>x.includes('massimo 4')));
  assert.ok(a.some(x=>x.includes('sotto 0,65')));
  assert.ok(a.some(x=>x.includes('senza un campo largo')));
  assert.ok(a.some(x=>x.includes('parola più vicina')));
});
test('tappe manuali della stessa grandezza non moltiplicano le riprese',()=>{
  const sc=scena();sc.camera.forEach((k,i)=>{delete k.su;k.pos=[0,1.6,8-i*.2];k.guarda=[0,1.3,0];});
  assert.deepEqual(regia(storia([sc])),[]);
});
