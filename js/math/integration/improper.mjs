import { astToPoly, polyRealRoots } from './polynomials.mjs';
import { buildProduct, flattenFactors, fn, linearOf, num, splitConst } from './ast-tools.mjs';
import { simpsonIntegral } from '../calculus/numeric.mjs';

// Regla del punto medio sobre [0,1]; evita el extremo singular t=1.
function midpointTransform(g, n) {
  const h = 1 / n;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const v = g((i + 0.5) * h);
    if (!isFinite(v)) return null;
    s += v;
  }
  return s * h;
}

// Integral impropia numérica por transformación x = a + t/(1−t).
// Devuelve una estimación o null si no es finita; no demuestra convergencia.
export function improperIntegral(fn, a, b, opts = {}) {
  const n = opts.n || 10000;
  if (!isFinite(a) && !isFinite(b)) {
    const l = improperIntegral(fn, -Infinity, 0, opts);
    const r = improperIntegral(fn, 0, Infinity, opts);
    if (l === null || r === null) return null;
    return l + r;
  }
  if (b === Infinity) {
    return midpointTransform(t => fn(a + t / (1 - t), 0) / ((1 - t) * (1 - t)), n);
  }
  if (a === -Infinity) {
    return midpointTransform(t => fn(b - t / (1 - t), 0) / ((1 - t) * (1 - t)), n);
  }
  return simpsonIntegral(fn, a, b, n);
}

// Integral definida: antiderivada simbólica F(b)−F(a); impropia si algún límite es ∞;
// en último caso, Simpson numérico.
function monomial(node,v) {
  if(node.type==='num')return {c:node.val,p:0};
  if(node.type==='var'&&node.val===v)return {c:1,p:1};
  if(node.type==='neg'){const r=monomial(node.arg,v);return r?{c:-r.c,p:r.p}:null;}
  if(node.type==='fn'&&node.fn==='sqrt'){const r=monomial(node.arg,v);return r&&r.c>0?{c:Math.sqrt(r.c),p:r.p/2}:null;}
  if(node.type==='^'&&node.right.type==='num'){const r=monomial(node.left,v);return r&&r.c>0?{c:r.c**node.right.val,p:r.p*node.right.val}:null;}
  if(node.type==='*'||node.type==='/'){
    const l=monomial(node.left,v),r=monomial(node.right,v);if(!l||!r||r.c===0)return null;
    return node.type==='*'?{c:l.c*r.c,p:l.p+r.p}:{c:l.c/r.c,p:l.p-r.p};
  }
  return null;
}
// Demostraciones de familias, no inferidas de muestras de la cola.
export function analyticImproper(source,a,b,v) {
  const m=monomial(source,v);
  if(m&&a>=0&&(b===Infinity||a===0&&m.p<0)) {
    const converges=b===Infinity?a>0&&m.p<-1:m.p>-1;
    if(m.c===0)return {value:0,steps:['Integrando nulo en el intervalo abierto.']};
    if(!converges)return {diverges:true,steps:[`Criterio potencia: p=${m.p}; infinito exige p<−1 y origen exige p>−1.`]};
    return {value:b===Infinity?-m.c*a**(m.p+1)/(m.p+1):m.c*b**(m.p+1)/(m.p+1),
      steps:[`Criterio potencia: p=${m.p}; evaluar C·x^(p+1)/(p+1) mediante el límite lateral.`]};
  }
  if(b===Infinity&&a>=0) {
    const {c,core}=splitConst(source),factors=flattenFactors(core);
    const exponential=factors.find(f=>f.type==='fn'&&f.fn==='exp');
    if(exponential) {
      const linear=linearOf(exponential.arg,v),others=factors.filter(f=>f!==exponential);
      const power=monomial(others.length?buildProduct(others):num(1),v);
      if(linear&&linear.a<0&&power&&(power.p===0||power.p===1)) {
        const rate=-linear.a,scale=c*power.c*Math.exp(linear.b),value=scale*Math.exp(-rate*a)*(power.p===0?1/rate:a/rate+1/rate**2);
        return {value,steps:[`Integración por partes: e^(−${rate}x) y x·e^(−${rate}x) tienden a 0 en +∞; evaluar la primitiva desde x=${a}.`]};
      }
    }
    if(a>0&&core.type==='/'&&core.left.type==='fn'&&core.left.fn==='ln'&&core.left.arg.type==='var'&&core.left.arg.val===v) {
      const denominator=monomial(core.right,v);
      if(denominator&&denominator.p>1)return {value:c/denominator.c*a**(1-denominator.p)*(Math.log(a)/(denominator.p-1)+1/(denominator.p-1)**2),
        steps:[`Por partes: u=ln x, dv=x^(−${denominator.p})dx; ln(x)/x^(${denominator.p-1})→0 en +∞.`]};
    }
  }
  return null;
}
// Conserva singularidades de la expresión original aunque su primitiva cancele factores.
export function interiorSingularities(source,a,b,v) {
  const points=[];
  const addRoots=node=>{
    if(node.type==='*'){addRoots(node.left);addRoots(node.right);return;}
    if(node.type==='^'){addRoots(node.left);return;}
    const p=astToPoly(node,v);
    if(p&&p.length<=3)for(const x of polyRealRoots(p))if(x>a&&x<b)points.push(x);
  };
  const walk=node=>{
    if(node.type==='/')addRoots(node.right);
    if(node.type==='^'&&node.right.type==='num'&&node.right.val<0)addRoots(node.left);
    if(node.type==='fn'&&['ln','sqrt'].includes(node.fn))addRoots(node.arg);
    if(node.type==='fn'&&['tan','sec','cot','csc'].includes(node.fn)) {
      const l=linearOf(node.arg,v);
      if(l&&l.a!==0) {
        const lo=Math.min(l.a*a+l.b,l.a*b+l.b),hi=Math.max(l.a*a+l.b,l.a*b+l.b);
        const offset=['tan','sec'].includes(node.fn)?Math.PI/2:0;
        const first=Math.ceil((lo-offset)/Math.PI),last=Math.floor((hi-offset)/Math.PI);
        if(last-first>1000)throw new RangeError('Demasiados polos trigonométricos en el intervalo.');
        for(let k=first;k<=last;k++){const x=(offset+k*Math.PI-l.b)/l.a;if(x>a&&x<b)points.push(x);}
      }
    }
    for(const key of ['left','right','arg'])if(node[key])walk(node[key]);
  };walk(source);return [...new Set(points)];
}
