"""Controlli reali in Chromium, nessun video. Storie originali in sola lettura.

python3 kit/tests/regressione_collocazione.py --out /percorso/prove
"""
from pathlib import Path
import argparse
import json
import os
import subprocess
import shutil
import hashlib

ROOT = Path(os.environ.get('CARTOON_TEST_ROOT', Path(__file__).resolve().parents[2]))
parser=argparse.ArgumentParser()
parser.add_argument('--out', type=Path, required=True)
args=parser.parse_args()
out=args.out.resolve(); out.mkdir(parents=True,exist_ok=True)
stories=['matita_spazio/matita_spazio_v9','ho_gia_mangiato/ho_gia_mangiato','treno_venti_secondi/treno_venti_secondi','affitto_faccia/affitto_faccia','pachinko/pachinko']
if not (ROOT/'kit/stories/matita_spazio/matita_spazio_v9.json').exists():
    stories[0]='matita_spazio/matita_spazio'
snap={p:hashlib.sha256(p.read_bytes()).hexdigest() for rel in stories for p in (ROOT/'kit/stories'/rel).parent.glob('*') if p.suffix in ('.js','.json')}
fixture=out/'treno_errori'; fixture.mkdir(exist_ok=True)
for name in ['binario.js','ufficio.js','words.json','treno_venti_secondi.json']:
    shutil.copy2(ROOT/'kit/stories/treno_venti_secondi'/name,fixture/name)
p=fixture/'binario.js'
injection='''
  // Solo nella copia di prova. La zona copre le rotaie, non la banchina.
  const zona = M.box(2.6, .02, 30, mat('#5a5048', .12), 5.6, -1.14, -6);
  zona.name = 'binari_prova'; zona.userData.passaggio = {nome:'binario', per:['treno']};
  const prova = (nome, geo, x, y, z) => { const o = new T.Mesh(geo,mat('#9a6540')); o.name=nome; o.position.set(x,y,z); M.root.add(o); return o; };
  prova('lampione_prova',new T.CylinderGeometry(.06,.08,3.2,12),5.6,.5,-3);
  prova('distributore_prova',new T.BoxGeometry(.9,1.85,.7),-1.5,.925,-3);
  prova('cassa_prova',new T.BoxGeometry(.6,.6,.6),-1.15,.5,-3);
  prova('scatola_sopra_prova',new T.BoxGeometry(.3,.3,.3),-1.5,1.995,-3);
  const ciotola=prova('ciotola_prova',new T.CylinderGeometry(.3,.2,.25,16,1,true),-1.5,.125,-1.5);
  ciotola.material.side=T.DoubleSide;
  prova('mela_prova',new T.SphereGeometry(.08,10,8),-1.5,.1,-1.5);
'''
s=p.read_text(); marker="  ST.banchina(M,"; assert marker in s
s=s.replace(marker,injection+'\n'+marker,1); p.write_text(s)
results={}
for src in [ROOT/'kit/stories'/f'{rel}.json' for rel in stories]+[fixture/'treno_venti_secondi.json']:
    name='treno_errori' if src.parent==fixture else src.stem
    dst=out/(name+'_controlli'); log=out/(name+'.log')
    with log.open('w') as f:
        result=subprocess.run(['node',str(ROOT/'kit/tools/rendi_disegnato.mjs'),str(src),'--controlli','--tutte','--out',str(dst)],stdout=f,stderr=subprocess.STDOUT)
    if result.returncode: raise RuntimeError(f'{name}: errore, leggi {log}')
    d=json.loads((dst/'avvisi.json').read_text())
    warnings=[a for sc in d['scene'].values() for a in sc['avvisi'] if a['codice'] in ('COMPENETRATI','FUORI_POSTO','COLLOCAZIONE_ERRORE')]
    results[name]={'avvisi':warnings,'unici':sorted(set(a['testo'] for a in warnings))}
    print(name, len(warnings), 'avvisi,',len(results[name]['unici']),'distinti',flush=True)
    assert not any(a['codice']=='COLLOCAZIONE_ERRORE' for a in warnings), name
assert all(hashlib.sha256(p.read_bytes()).hexdigest()==h for p,h in snap.items()), 'Una storia originale è cambiata'
f=results['treno_errori']['unici']
assert any('lampione_prova' in t for t in f), f
assert any('cassa_prova' in t and '61%' in t for t in f), f
assert not any(any(n in t for n in ['corpo','scatola_sopra_prova','mela_prova']) for t in f), f
(out/'risultati.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('Prova con errori intenzionali riuscita; storie originali invariate.',flush=True)
