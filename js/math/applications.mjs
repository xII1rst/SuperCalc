// Cálculos de las aplicaciones de cálculo; no dependen del DOM ni del canvas.
export function optimizeFunction(fn,a,b){
  const h=1e-6, n=2000, dx=(b-a)/n;
  let maxX=a, minX=a, maxV=fn(a,0), minV=fn(a,0);
  const crits=[];
  let prevFp=(fn(a+h,0)-fn(a-h,0))/(2*h);
  for(let i=1;i<=n;i++){
    const x=a+i*dx, fv=fn(x,0);
    if(!isFinite(fv)) continue;
    const fp=(fn(x+h,0)-fn(x-h,0))/(2*h);
    if(prevFp*fp<0) crits.push({x:parseFloat(x.toFixed(5)),y:fv,type:prevFp>0?'MAX':'MIN'});
    if(fv>maxV){maxV=fv;maxX=x;}
    if(fv<minV){minV=fv;minX=x;}
    prevFp=fp;
  }
  return {crits,maxX,minX,maxV,minV};
}

export function populationGrowth(p0,k,t){
  const Pt=p0*Math.exp(k*t);
  return {Pt,dPdt:k*Pt,t2x:k!==0?Math.log(2)/k:Infinity};
}

export function motionAt(fn,t0){
  const h=1e-6;
  const s0=fn(t0,0);
  const vel=(fn(t0+h,0)-fn(t0-h,0))/(2*h);
  const acel=(fn(t0+h,0)-2*fn(t0,0)+fn(t0-h,0))/(h*h);
  return {s0,vel,acel};
}

export function tangentAt(fn,x0){
  const h=1e-6;
  const fx0=fn(x0,0);
  const fpx0=(fn(x0+h,0)-fn(x0-h,0))/(2*h);
  return {fx0,fpx0,b:fx0-fpx0*x0};
}

export function relatedRates(type,r,drdt){
  if(type.includes('Esfera')) return {V:(4/3)*Math.PI*r**3,dVdt:4*Math.PI*r**2*drdt};
  if(type.includes('Cono')) return {V:(1/3)*Math.PI*r**3,dVdt:Math.PI*r**2*drdt};
  return null;
}

export function characteristicRoots(a,b,c){
  const disc=b*b-4*a*c;
  if(disc>1e-10) return {disc,type:'distinct',r1:(-b+Math.sqrt(disc))/(2*a),r2:(-b-Math.sqrt(disc))/(2*a)};
  if(Math.abs(disc)<1e-10) return {disc,type:'repeated',r:-b/(2*a)};
  return {disc,type:'complex',alpha:-b/(2*a),beta:Math.sqrt(-disc)/(2*a)};
}

// ---- Métodos numéricos, teoremas y funciones del Cálculo 1 ----

function derivNum(fn, x, h = 1e-6) {
  return (fn(x + h, 0) - fn(x - h, 0)) / (2 * h);
}

function requireFn(fn) {
  if (typeof fn !== 'function') throw new TypeError('Ingresa una función válida');
}

// Método de Newton-Raphson: x_{n+1} = x_n − f(x_n)/f'(x_n).
export function newtonMethod(fn, x0, { tol = 1e-10, maxIter = 100 } = {}) {
  requireFn(fn);
  let x = x0;
  const iterations = [];
  for (let i = 0; i < maxIter; i++) {
    const f = fn(x, 0);
    const fp = derivNum(fn, x);
    if (!Number.isFinite(fp) || Math.abs(fp) < 1e-15) break;
    const xNext = x - f / fp;
    iterations.push({ i, x, f, fp, xNext });
    if (Math.abs(xNext - x) < tol) { x = xNext; break; }
    x = xNext;
  }
  const fFinal = fn(x, 0);
  return { root: x, iterations, converged: Number.isFinite(fFinal) && Math.abs(fFinal) < 1e-7 };
}

// Aproximación lineal L(x) = f(a) + f'(a)(x−a).
export function linearApproximation(fn, a, x) {
  requireFn(fn);
  const fa = fn(a, 0);
  const fpa = derivNum(fn, a);
  return { fa, fpa, approx: fa + fpa * (x - a), exact: fn(x, 0) };
}

// Teorema del valor medio: existe c en (a,b) con f'(c) = (f(b)−f(a))/(b−a).
export function meanValueTheorem(fn, a, b, { n = 2000 } = {}) {
  requireFn(fn);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b)
    throw new RangeError('Se requiere a < b');
  const slope = (fn(b, 0) - fn(a, 0)) / (b - a);
  const c = findRoot(g => derivNum(fn, g) - slope, a, b, n);
  return { slope, c };
}

// Teorema de Rolle: si f(a)=f(b), existe c en (a,b) con f'(c)=0.
export function rollesTheorem(fn, a, b, { n = 2000 } = {}) {
  requireFn(fn);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b)
    throw new RangeError('Se requiere a < b');
  const c = findRoot(g => derivNum(fn, g), a, b, n);
  return { c, fa: fn(a, 0), fb: fn(b, 0) };
}

// Barrido + bisección para localizar una raíz de g en [a,b].
function findRoot(g, a, b, n = 2000) {
  const dx = (b - a) / n;
  let prevX = a, prevG = g(a);
  for (let i = 1; i <= n; i++) {
    const x = a + i * dx, gx = g(x);
    if (!Number.isFinite(gx)) { prevX = x; prevG = gx; continue; }
    if (prevG * gx < 0) return bisect(g, prevX, x);
    prevX = x; prevG = gx;
  }
  return null;
}

function bisect(g, lo, hi) {
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (g(lo) * g(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

// Análisis de continuidad en x=a: compara límites laterales con el valor.
export function checkContinuity(fn, a, { tol = 1e-5 } = {}) {
  requireFn(fn);
  const h = 1e-6;
  const value = fn(a, 0);
  const left = fn(a - h, 0);
  const right = fn(a + h, 0);
  const leftFinite = Number.isFinite(left);
  const rightFinite = Number.isFinite(right);
  const valueFinite = Number.isFinite(value);
  let continuous = false, discontinuityType = null;
  if (!valueFinite && (value === Infinity || value === -Infinity)) {
    discontinuityType = 'infinita'; // polo: la función tiende a ±∞
  } else if (!leftFinite || !rightFinite) {
    discontinuityType = 'infinita';
  } else if (Math.abs(left - right) < tol) {
    // Límites laterales finitos e iguales: continua o hueco removible.
    if (valueFinite && Math.abs(left - value) < tol) continuous = true;
    else discontinuityType = 'removible';
  } else {
    discontinuityType = 'salto';
  }
  return { value, leftLimit: left, rightLimit: right, continuous, discontinuityType };
}

// Funciones hiperbólicas y su identidad fundamental cosh² − sinh² = 1.
export function hyperbolicValues(x) {
  const sinh = Math.sinh(x), cosh = Math.cosh(x), tanh = Math.tanh(x);
  return {
    sinh, cosh, tanh,
    coth: 1 / tanh, sech: 1 / cosh, csch: 1 / sinh,
    identity: cosh * cosh - sinh * sinh,
  };
}

// Funciones hiperbólicas inversas (dominios restringidos).
export function inverseHyperbolic(x) {
  return {
    asinh: Math.asinh(x),
    acosh: x >= 1 ? Math.acosh(x) : NaN,
    atanh: Math.abs(x) < 1 ? Math.atanh(x) : NaN,
  };
}

// Derivada de la función inversa: (f⁻¹)'(y) = 1 / f'(x) con y = f(x).
export function inverseFunctionDerivative(fn, x) {
  requireFn(fn);
  const y = fn(x, 0);
  const fp = derivNum(fn, x);
  return { x, y, fprime: fp, inverseDerivative: fp !== 0 ? 1 / fp : NaN };
}

// Diferenciación logarítmica: f'(x) = f(x)·(d/dx)ln(f(x)), válida si f(x)>0.
export function logarithmicDerivative(fn, x) {
  requireFn(fn);
  const f = fn(x, 0);
  if (!(f > 0)) return { f, derivative: NaN, valid: false };
  const h = 1e-6;
  const dln = (Math.log(fn(x + h, 0)) - Math.log(fn(x - h, 0))) / (2 * h);
  return { f, lnf: Math.log(f), dln, derivative: f * dln, valid: true };
}
