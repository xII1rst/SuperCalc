// Series infinitas: polinomio de Taylor/Maclaurin simbólico y pruebas de
// convergencia (serie geométrica, p-serie, prueba de la razón y del término
// n-ésimo). Sin DOM ni navegador.

import { tokenize, parseExpr, diffAST, simplify, collectTerms, evalAST, collectVariables, astToStr } from './calculus.mjs';
import { evalTermN, sequenceLimit, polynomialQuotientLimit } from './algebra/sequences.mjs';

const num = n => ({ type: 'num', val: n });

function fact(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }

// Formato de número como fracción sencilla cuando es posible.
// El límite alto cubre denominadores factoriales (1/120, 1/720, …).
function frac(c) {
  if (Math.abs(c) < 1e-12) return '0';
  if (Number.isInteger(c)) return String(c);
  const neg = c < 0;
  const a = Math.abs(c);
  for (let d = 2; d <= 100000; d++) {
    const n = Math.round(a * d);
    if (Math.abs(n / d - a) < 1e-9) return (neg ? '-' : '') + n + '/' + d;
  }
  return String(parseFloat(c.toFixed(6)));
}

function substituteVar(node, varName, value) {
  if (!node) return node;
  if (node.type === 'var') return node.val === varName ? num(value) : node;
  const out = { ...node };
  if (out.left) out.left = substituteVar(out.left, varName, value);
  if (out.right) out.right = substituteVar(out.right, varName, value);
  if (out.arg) out.arg = substituteVar(out.arg, varName, value);
  return out;
}

// Polinomio de Taylor de orden n alrededor de a. Devuelve { terms, polynomial }.
export function taylorSeries(expr, a, n, varName = 'x', {nonzeroTerms=Infinity}={}) {
  if (!expr || !expr.trim()||expr.length>500||!Number.isFinite(a)||!Number.isInteger(n)||n<0||n>16||collectVariables(expr).some(name=>name!==varName)) return null;
  let ast;
  try { ast = parseExpr(tokenize(expr)); } catch { return null; }
  if (!ast) return null;

  const terms = [];
  let d = simplify(ast);
  for (let k = 0; k <= n; k++) {
    const stack=[d];let nodes=0;
    while(stack.length) {
      const node=stack.pop();if(++nodes>500)return null;
      for(const key of ['left','right','arg'])if(node[key])stack.push(node[key]);
    }
    const val = evalAST(substituteVar(d, varName, a));
    if (!Number.isFinite(val)) break;
    const coef = val / fact(k);
    if (Math.abs(coef) >= 1e-12) terms.push({ k, coef });
    if(k===n||terms.length>=nonzeroTerms)break;
    try {d = simplify(collectTerms(simplify(diffAST(d, varName))));}catch{return null;}
  }

  let out = '';
  for (const { k, coef } of terms) {
    const sign = coef < 0 ? '-' : '+';
    const mag = Math.abs(coef);
    let body;
    if (k === 0) body = frac(mag);
    else {
      const base = a === 0
        ? (k === 1 ? varName : `${varName}^${k}`)
        : `(${varName} - ${frac(a)})${k === 1 ? '' : '^' + k}`;
      body = Math.abs(mag - 1) < 1e-12 ? base : `${frac(mag)}*${base}`;
    }
    if (out === '') out = (sign === '-' ? '-' : '') + body;
    else out += ` ${sign} ${body}`;
  }
  return { terms, polynomial: out };
}

// Serie geométrica Σ a1·r^(n−1): converge si |r| < 1, suma = a1/(1−r).
export function geometricSeries(a1, r) {
  const converges = Math.abs(r) < 1;
  return { converges, sum: converges ? a1 / (1 - r) : null };
}

// p-serie Σ 1/n^p: converge si p > 1.
export function pSeries(p) {
  return { converges: Number.isFinite(p) && p > 1 };
}

function linearN(node) {
  if(node.type==='num')return [0,node.val];
  if(node.type==='var'&&node.val==='n')return [1,0];
  if(node.type==='neg'){const a=linearN(node.arg);return a?.map(x=>-x);}
  if(['+','-','*','/'].includes(node.type)) {
    const a=linearN(node.left),b=linearN(node.right);if(!a||!b)return null;
    if(node.type==='+')return [a[0]+b[0],a[1]+b[1]];
    if(node.type==='-')return [a[0]-b[0],a[1]-b[1]];
    if(node.type==='/'&&b[0]===0&&b[1]!==0)return a.map(x=>x/b[1]);
    if(node.type==='*'&&(a[0]===0||b[0]===0))return a[0]===0?b.map(x=>x*a[1]):a.map(x=>x*b[1]);
  }
  return null;
}
function analyticRatio(node) {
  if(polynomialQuotientLimit(astToStr(node),'n').status==='demostrado')return 1;
  if(node.type==='^'&&node.left.type==='num'&&node.left.val>0) {
    const l=linearN(node.right);if(l)return node.left.val**l[0];
  }
  if(node.type==='fn'&&node.fn==='exp'){const l=linearN(node.arg);if(l)return Math.exp(l[0]);}
  if(node.type==='*'||node.type==='/'){
    const a=analyticRatio(node.left),b=analyticRatio(node.right);if(a!==null&&b!==null)return node.type==='*'?a*b:a/b;
  }
  return null;
}
// Solo una familia analítica puede convertir el cociente muestreado en criterio.
export function ratioTest(termExpr, varName = 'n') {
  const result = { L: NaN, conclusion: 'inconcluso',proof:'undetermined',sampleRatio:NaN };
  if (!termExpr || !termExpr.trim()) return result;
  if(varName!=='n')return result;
  try {
    if(collectVariables(termExpr).some(name=>name!=='n'))return result;
    const first=evalTermN(termExpr,10);if(!Number.isFinite(first)||first===0)return result;
    const L=analyticRatio(simplify(parseExpr(tokenize(termExpr))));
    if(L!==null&&Number.isFinite(L)){result.L=L;result.proof='analytic';result.conclusion=L<1?'converge':L>1?'diverge':'inconcluso';return result;}
  }catch{return result;}
  for (const n of [1e5, 1e4, 1e3, 1e2, 1e1]) {
    const a1 = evalTermN(termExpr, n);
    const a2 = evalTermN(termExpr, n + 1);
    if (!Number.isFinite(a1) || !Number.isFinite(a2) || a1 === 0) continue;
    const r = Math.abs(a2 / a1);
    if (!Number.isFinite(r)) return result;
    result.sampleRatio = r;
    return result;
  }
  return result;
}

// Prueba del término n-ésimo: si lim a(n) ≠ 0, la serie diverge.
export function nthTermTest(termExpr, varName = 'n') {
  const result = { limit: NaN, conclusion: 'inconcluso',proof:'undetermined',sampleTerm:NaN };
  if (!termExpr || !termExpr.trim()) return result;
  if(varName!=='n')return result;
  const analytic=sequenceLimit(termExpr);
  if(analytic.status==='demostrado') {
    result.limit=analytic.value;result.proof='analytic';
    result.conclusion=analytic.value===0?'posible convergencia':'diverge';return result;
  }
  for (const n of [1e6, 1e5, 1e4, 1e3, 1e2]) {
    const v = evalTermN(termExpr, n);
    if (!Number.isFinite(v)) return result;
    result.sampleTerm = v;
    break; // se estima el límite con el mayor n evaluable
  }
  return result;
}
