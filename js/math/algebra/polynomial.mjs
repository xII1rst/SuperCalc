// Álgebra: polinomios compartidos por Funciones e Inecuaciones.
export function quadRoots(a,b,c){
  if(Math.abs(a)<1e-12) return Math.abs(b)<1e-12?[]:[-c/b];
  const d=b*b-4*a*c; if(d<0) return [];
  if(Math.abs(d)<1e-12) return [-b/(2*a)];
  const sq=Math.sqrt(d);
  return [(-b-sq)/(2*a),(-b+sq)/(2*a)].sort((x,y)=>x-y);
}

export function parseSimplePoly(s){
  s=s.trim().replace(/\s+/g,'').replace(/\^/g,'**');
  let a=0,b=0,c=0;
  const ma=s.match(/([+-]?\d*\.?\d*)\*?x\*\*2|([+-]?\d*\.?\d*)\*?x²/);
  if(ma){ const v=(ma[1]||ma[2]||'').replace('**',''); a=(v===''||v==='+')?1:(v==='-'?-1:parseFloat(v)||0); }
  const noX2=s.replace(/[+-]?\d*\.?\d*\*?x\*\*2/g,'').replace(/[+-]?\d*\.?\d*\*?x²/g,'');
  const mb=noX2.match(/([+-]?\d*\.?\d*)\*?x(?!\*\*)(?!\d)/);
  if(mb){ const v=(mb[1]||''); b=(v===''||v==='+')?1:(v==='-'?-1:parseFloat(v)||0); }
  const noX=noX2.replace(/[+-]?\d*\.?\d*\*?x(?!\*\*)(?!\d)/g,'').trim();
  if(noX) c=parseFloat(noX)||0;
  return {a,b,c};
}

// Aislamiento numérico de raíces reales para polinomios acotados.
const rootFinite=(x,label)=>{if(!Number.isFinite(x))throw new RangeError(`${label}: valor finito requerido`);return x;};
const rootTrim=p=>{p=p.slice();while(p.length>1&&p.at(-1)===0)p.pop();return p;};
const rootEvaluate=(p,x)=>p.reduceRight((sum,c)=>sum*x+c,0);
const rootDerivative=p=>p.length===1?[0]:rootTrim(p.slice(1).map((c,i)=>c*(i+1)));
const unique=values=>values.sort((a,b)=>a-b).filter((x,i,a)=>i===0||Math.abs(x-a[i-1])>1e-8*Math.max(1,Math.abs(x),Math.abs(a[i-1])));
function nearZero(p,x) {const weight=p.reduceRight((sum,c)=>sum*Math.abs(x)+Math.abs(c),0);return Math.abs(rootEvaluate(p,x))<=1e-12*Math.max(Number.MIN_VALUE,weight);}
// Raíces reales por intervalos de monotonicidad, incluyendo raíces repetidas.
export function realPolynomialRoots(coefficients,{onIteration}={}) {
  if(!Array.isArray(coefficients)||!coefficients.length||coefficients.length>13||coefficients.some(x=>!Number.isFinite(x)))throw new RangeError('Coeficientes finitos de grado hasta 12.');
  let p=rootTrim(coefficients);const magnitude=Math.max(...p.map(Math.abs));if(magnitude===0)return [];
  p=p.map(x=>x/magnitude);const degree=p.length-1;
  if(degree===0)return [];
  if(degree===1)return [rootFinite(-p[0]/p[1],'Raíz')];
  const bound=1+Math.max(...p.slice(0,-1).map(c=>Math.abs(c/p.at(-1))));rootFinite(bound,'Cota de raíces');
  const stationary=realPolynomialRoots(rootDerivative(p),{onIteration}).filter(x=>Math.abs(x)<=bound),cuts=[-bound,...stationary,bound];
  const roots=stationary.filter(x=>nearZero(p,x));
  for(let i=1;i<cuts.length;i++) {
    let a=cuts[i-1],b=cuts[i],fa=rootEvaluate(p,a),fb=rootEvaluate(p,b);
    if(nearZero(p,a)){roots.push(a);continue;}if(nearZero(p,b)){roots.push(b);continue;}
    if(Math.sign(fa)===Math.sign(fb))continue;
    for(let j=0;j<160;j++) {
      onIteration?.();
      const mid=a+(b-a)/2,value=rootEvaluate(p,mid);
      if(value===0){a=b=mid;break;}
      if(Math.sign(value)===Math.sign(fa)){a=mid;fa=value;}else b=mid;
      if(b-a<=1e-13*Math.max(1,Math.abs(a),Math.abs(b)))break;
    }
    roots.push(a+(b-a)/2);
  }
  return unique(roots);
}
