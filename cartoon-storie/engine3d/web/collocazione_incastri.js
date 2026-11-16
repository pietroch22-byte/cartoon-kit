// Riconoscimento conservativo di telai montati in un vano, anche tra GLB separati.
// Nessuna modifica alla scena: un nome plausibile è solo un candidato; serve il bordo geometrico.
export function incastroNelVano(THREE, A, B, TA, TB, mondo) {
  if (!/(?:^|_)(?:montante|stipite|architrave|jamb|lintel)(?:\d|_|$)/i.test(A.nome)) return false;
  let serramento = false;
  for (let p = A.k.parent; p && p !== mondo; p = p.parent) {
    if (/(?:^|[_\s])(?:porta|door|finestra|window)(?:[_\s]|$)/i.test(p.name)) serramento = true;
  }
  if (!serramento || !TA || !TB) return false;

  // Assi del supporto, senza scala: tolleranze in metri anche con GLB ruotati/scalati.
  const inv = new THREE.Matrix4().extractRotation(B.k.matrixWorld).invert(), v = new THREE.Vector3();
  const locale = T => {
    const out = [], min = [Infinity,Infinity,Infinity], max = [-Infinity,-Infinity,-Infinity];
    for (let i=0; i<T.length; i+=3) {
      v.set(T[i],T[i+1],T[i+2]).applyMatrix4(inv);
      const p=v.toArray(); out.push(...p);
      for (let a=0;a<3;a++) {min[a]=Math.min(min[a],p[a]);max[a]=Math.max(max[a],p[a]);}
    }
    return {T:out,min,max,size:max.map((x,a)=>x-min[a])};
  };
  const a=locale(TA), b=locale(TB);
  const n=b.size.indexOf(Math.min(...b.size)); // normale della parete
  const piano=[0,1,2].filter(x=>x!==n);
  if (b.size[n]>.6 || piano.some(x=>b.size[x]<Math.max(.8,b.size[n]*3))) return false;
  const lungo=piano[a.size[piano[0]]>=a.size[piano[1]]?0:1], lato=piano.find(x=>x!==lungo);
  if (a.size[lungo]<.6 || a.size[lato]>.35 || a.size[n]>.4 || a.size[lungo]<a.size[lato]*4) return false;
  if (a.min[n]<b.min[n]-.12 || a.max[n]>b.max[n]+.12) return false;

  // Proiezione dei triangoli opachi lungo la normale: c'è materiale o un'apertura vera?
  const pieno = (u,w) => {
    const T=b.T;
    for(let i=0;i<T.length;i+=9) {
      const ax=T[i+lungo]-u, ay=T[i+lato]-w;
      const bx=T[i+3+lungo]-u, by=T[i+3+lato]-w;
      const cx=T[i+6+lungo]-u, cy=T[i+6+lato]-w;
      const d0=ax*by-ay*bx, d1=bx*cy-by*cx, d2=cx*ay-cy*ax;
      if(Math.abs(d0+d1+d2)<1e-10) continue;
      if((d0>=-1e-9 && d1>=-1e-9 && d2>=-1e-9)||(d0<=1e-9 && d1<=1e-9 && d2<=1e-9)) return true;
    }
    return false;
  };
  // Un architrave può essere fissato alle due estremità e attraversare il vano,
  // senza toccare la parete sopra. Verifica entrambi gli appoggi e il vuoto centrale.
  if (/(?:^|_)(?:architrave|lintel)(?:\d|_|$)/i.test(A.nome)) {
    const trasversali=[.2,.5,.8].map(t=>a.min[lato]+a.size[lato]*t);
    const sin=a.min[lungo]-.06, des=a.max[lungo]+.06;
    if(sin>b.min[lungo] && des<b.max[lungo] && trasversali.every(w=>
      pieno(sin,w) && pieno(des,w) && [.15,.325,.5,.675,.85].every(t=>!pieno(a.min[lungo]+a.size[lungo]*t,w)))) return true;
  }
  for (const verso of [-1,1]) {
    const bordo=verso>0?a.max[lato]:a.min[lato];
    const vuoto=bordo+verso*.06, fondo=bordo+verso*.46;
    const supporto=(verso>0?a.min[lato]:a.max[lato])-verso*.06;
    // Il vuoto deve essere dentro la facciata, non oltre il suo bordo esterno.
    if(Math.min(vuoto,fondo)<=b.min[lato] || Math.max(vuoto,fondo)>=b.max[lato]) continue;
    if([.15,.325,.5,.675,.85].every(t=>{
      const u=a.min[lungo]+a.size[lungo]*t;
      return pieno(u,supporto) && !pieno(u,vuoto) && !pieno(u,fondo);
    })) return true;
  }
  return false;
}
