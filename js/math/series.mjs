// Series infinitas: polinomio de Taylor/Maclaurin simbólico y pruebas de
// convergencia (geométrica, p-serie, razón, raíz, integral, término n-ésimo y
// series alternantes con cota de Leibniz). Sin DOM ni navegador.

import { tokenize, parseExpr } from './calculus/parser.mjs';
import { diffAST } from './calculus/derivatives.mjs';
import { simplify, evalAST } from './calculus/ast.mjs';
import { collectTerms, astToStr } from './calculus/printer.mjs';
import { collectVariables, calcParse } from './expression.mjs';
import { integrate } from './integration.mjs';
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

// ── Criterios guiados: raíz, integral y series alternantes ──
// Igual que la prueba de la razón: solo se concluye con una familia analítica;
// lo muestreado se informa como estimación, nunca como demostración.

const isN = node => node?.type === 'var' && node.val === 'n';

// c·nᵃ·(ln n)ᵇ: la familia de las pruebas de la integral y de comparación habituales.
function logPowerFactors(node) {
  if (!node) return null;
  if (node.type === 'num') return { c: node.val, a: 0, b: 0 };
  if (isN(node)) return { c: 1, a: 1, b: 0 };
  if (node.type === 'neg') { const f = logPowerFactors(node.arg); return f && { ...f, c: -f.c }; }
  if (node.type === 'fn' && node.fn === 'ln' && isN(node.arg)) return { c: 1, a: 0, b: 1 };
  if (node.type === 'fn' && node.fn === 'sqrt') {
    const f = logPowerFactors(node.arg);
    return f && f.c > 0 ? { c: Math.sqrt(f.c), a: f.a / 2, b: f.b / 2 } : null;
  }
  if (node.type === '*' || node.type === '/') {
    const l = logPowerFactors(node.left), r = logPowerFactors(node.right);
    if (!l || !r) return null;
    if (node.type === '*') return { c: l.c * r.c, a: l.a + r.a, b: l.b + r.b };
    return r.c === 0 ? null : { c: l.c / r.c, a: l.a - r.a, b: l.b - r.b };
  }
  if (node.type === '^' && node.right?.type === 'num') {
    const k = node.right.val, f = logPowerFactors(node.left);
    if (!f || (f.c < 0 && !Number.isInteger(k))) return null;
    return { c: f.c ** k, a: f.a * k, b: f.b * k };
  }
  return null;
}

const round = x => Math.abs(x - Math.round(x)) < 1e-12 ? Math.round(x) : x;
const powText = (base, k) => k === 1 ? base : `${base}^${Number.isInteger(k) ? k : `(${frac(k)})`}`;
// Texto de c·nᵃ(ln n)ᵇ como fracción: exponentes negativos al denominador.
function logPowerText({ c, a, b }, v = 'n') {
  const top = [], bottom = [];
  for (const [base, k] of [[v, round(a)], [`ln(${v})`, round(b)]]) {
    if (k > 0) top.push(powText(base, k));
    if (k < 0) bottom.push(powText(base, -k));
  }
  const coef = round(c), numerator = top.length ? `${coef === 1 ? '' : frac(coef) + '·'}${top.join('·')}` : frac(coef);
  if (!bottom.length) return numerator;
  return `${numerator}/${bottom.length > 1 ? `(${bottom.join('·')})` : bottom[0]}`;
}
// c/k·base^k como texto legible: 2·x^(1/2), −1/ln(x), x^(−1) → −1/x…
function scaledPower(c, base, k) {
  const coef = c / k, sign = coef < 0 ? '−' : '', mag = frac(Math.abs(coef)), absK = Math.abs(k);
  const powered = absK === 1 ? base : `${base}^${Number.isInteger(absK) ? absK : `(${frac(absK)})`}`;
  if (k > 0) return `${sign}${mag === '1' ? '' : mag + '·'}${powered}`;
  if (mag.includes('/')) { const [p, q] = mag.split('/'); return `${sign}${p}/(${q}·${powered})`; }
  return `${sign}${mag}/${powered}`;
}
// Decide la convergencia de Σ c·nᵃ(ln n)ᵇ con c > 0.
function logPowerVerdict({ a, b }) {
  if (a < -1) return { converges: true, reason: `a = ${round(a)} < −1: domina nᵃ y la integral ∫ xᵃ(ln x)ᵇ dx converge.` };
  if (a > -1) return { converges: false, reason: `a = ${round(a)} > −1: la integral ∫ xᵃ(ln x)ᵇ dx diverge.` };
  return b < -1
    ? { converges: true, reason: `a = −1 y b = ${round(b)} < −1: con u = ln x, ∫ du/u^${round(-b)} converge.` }
    : { converges: false, reason: `a = −1 y b = ${round(b)} ≥ −1: con u = ln x, la integral diverge.` };
}

// Grados de un cociente de polinomios ya demostrado por polynomialQuotientLimit.
function rationalDegrees(termExpr) {
  const result = polynomialQuotientLimit(termExpr, 'n');
  if (result.status !== 'demostrado') return null;
  const match = /numerador (-?\d+); denominador (-?\d+)/.exec(result.steps?.[0] || '');
  return match ? { p: Number(match[1]), q: Number(match[2]), limit: result.value } : null;
}

function termAst(termExpr) {
  if (!termExpr || !termExpr.trim() || termExpr.length > 300) return null;
  try {
    if (collectVariables(termExpr).some(name => name !== 'n')) return null;
    return simplify(parseExpr(tokenize(termExpr)));
  } catch { return null; }
}

// Límite de la raíz n-ésima |aₙ|^(1/n) en familias analíticas.
function analyticRoot(node) {
  if (!node) return null;
  if (node.type === 'num') return node.val === 0 ? 0 : 1;
  if (node.type === 'neg') return analyticRoot(node.arg);
  if (logPowerFactors(node)) return 1;
  if (polynomialQuotientLimit(astToStr(node), 'n').status === 'demostrado') return 1;
  if (node.type === '^') {
    const l = linearN(node.right);
    if (l && l[0] > 0) {
      if (node.left.type === 'num') return Math.abs(node.left.val) ** l[0];
      const base = polynomialQuotientLimit(astToStr(node.left), 'n');
      if (base.status === 'demostrado' && Number.isFinite(base.value)) return Math.abs(base.value) ** l[0];
      if (base.status === 'demostrado') return Infinity;
    }
  }
  if (node.type === 'fn' && node.fn === 'exp') { const l = linearN(node.arg); if (l) return Math.exp(l[0]); }
  if (node.type === '*' || node.type === '/') {
    const a = analyticRoot(node.left), b = analyticRoot(node.right);
    if (a === null || b === null) return null;
    if (node.type === '*') return a * b;
    return b === 0 ? null : a / b;
  }
  return null;
}

// Criterio de la raíz: L = lím |aₙ|^(1/n); L < 1 converge, L > 1 diverge, L = 1 no decide.
export function rootTest(termExpr) {
  const result = { L: NaN, conclusion: 'inconcluso', proof: 'undetermined', sampleRoot: NaN };
  const ast = termAst(termExpr);
  if (!ast) return result;
  const L = analyticRoot(ast);
  if (L !== null && !Number.isNaN(L)) {
    result.L = L; result.proof = 'analytic';
    result.conclusion = L < 1 ? 'converge' : L > 1 ? 'diverge' : 'inconcluso';
    return result;
  }
  for (const n of [1000, 500, 100, 50]) {
    const value = evalTermN(termExpr, n);
    if (Number.isFinite(value) && value !== 0) { result.sampleRoot = Math.abs(value) ** (1 / n); break; }
  }
  return result;
}

// Límite en +∞ de una primitiva: reglas de dominancia (exponencial > potencia > logaritmo).
function limitAtInfinity(node, v = 'x') {
  const lim = (value, cls = 'const') => ({ value, cls });
  if (!node) return null;
  if (node.type === 'num') return lim(node.val);
  if (node.type === 'var') return node.val === v ? lim(Infinity, 'poly') : null;
  if (node.type === 'neg') { const r = limitAtInfinity(node.arg, v); return r && lim(-r.value, r.cls); }
  if (node.type === 'fn') {
    const r = limitAtInfinity(node.arg, v);
    if (!r) return null;
    if (node.fn === 'exp') return r.value === -Infinity ? lim(0, 'expdecay') : r.value === Infinity ? lim(Infinity, 'exp') : lim(Math.exp(r.value));
    if (node.fn === 'atan') return r.value === Infinity ? lim(Math.PI / 2) : r.value === -Infinity ? lim(-Math.PI / 2) : lim(Math.atan(r.value));
    if (node.fn === 'ln') return r.value === Infinity ? lim(Infinity, 'log') : r.value > 0 ? lim(Math.log(r.value)) : null;
    if (node.fn === 'sqrt') return r.value === Infinity ? lim(Infinity, r.cls) : r.value >= 0 ? lim(Math.sqrt(r.value)) : null;
    return null;
  }
  if (node.type === '^') {
    if (node.left.type === 'var' && node.left.val === 'e') return limitAtInfinity({ type: 'fn', fn: 'exp', arg: node.right }, v);
    const base = limitAtInfinity(node.left, v), k = node.right.type === 'num' ? node.right.val : null;
    if (!base || k === null) return null;
    if (base.value === Infinity) return k > 0 ? lim(Infinity, base.cls) : k < 0 ? lim(0, base.cls === 'exp' ? 'expdecay' : 'polydecay') : lim(1);
    return Number.isFinite(base.value) ? lim(base.value ** k) : null;
  }
  if (node.type === '+' || node.type === '-') {
    const a = limitAtInfinity(node.left, v), b = limitAtInfinity(node.right, v);
    if (!a || !b) return null;
    const bv = node.type === '-' ? -b.value : b.value;
    if (Number.isFinite(a.value) && Number.isFinite(bv)) return lim(a.value + bv);
    if (!Number.isFinite(a.value) && !Number.isFinite(bv) && Math.sign(a.value) !== Math.sign(bv)) return null;
    return lim(Number.isFinite(a.value) ? bv : a.value, 'mixed');
  }
  if (node.type === '*' || node.type === '/') {
    const a = limitAtInfinity(node.left, v), b0 = limitAtInfinity(node.right, v);
    if (!a || !b0) return null;
    const b = node.type === '*' ? b0 : (b0.value === 0 ? null : b0.value === Infinity || b0.value === -Infinity ? lim(0, b0.cls === 'exp' ? 'expdecay' : 'polydecay') : lim(1 / b0.value));
    if (!b) return null;
    if (Number.isFinite(a.value) && Number.isFinite(b.value)) return lim(a.value * b.value, a.cls === 'expdecay' || b.cls === 'expdecay' ? 'expdecay' : 'const');
    // 0·∞: el decaimiento exponencial vence a potencias y logaritmos.
    const zero = a.value === 0 ? a : b.value === 0 ? b : null, inf = zero === a ? b : zero === b ? a : null;
    if (zero && inf) return zero.cls === 'expdecay' && inf.cls !== 'exp' ? lim(0, 'expdecay') : null;
    return lim(a.value * b.value, 'mixed');
  }
  return null;
}

function safeLimit(text) {
  try { return limitAtInfinity(simplify(parseExpr(tokenize(text)))); } catch { return null; }
}

// Criterio de la integral para Σ f(n), n ≥ start, con f positiva y decreciente.
export function integralTest(termExpr, start = 1) {
  const out = { conclusion: 'inconcluso', proof: 'undetermined', family: null, antiderivative: null, integral: null, from: start, decreasingFrom: null, steps: [], hypothesis: '' };
  const ast = termAst(termExpr);
  if (!ast || !Number.isInteger(start) || start < 1) return out;
  const f = logPowerFactors(ast);
  if (f && f.c > 0) {
    const { a, b } = f;
    out.family = `c·nᵃ·(ln n)ᵇ con c = ${round(f.c)}, a = ${round(a)}, b = ${round(b)}`;
    if (a > 0 || (a === 0 && b >= 0)) {
      out.conclusion = 'diverge'; out.proof = 'analytic';
      out.steps.push(`f(n) = ${logPowerText(f)} no tiende a 0, así que la serie diverge (término n-ésimo); la integral no hace falta.`);
      return out;
    }
    // f′(x) = c·x^(a−1)(ln x)^(b−1)(a ln x + b): negativa cuando ln x > −b/a.
    const threshold = a < 0 ? Math.max(b !== 0 ? 2 : 1, Math.exp(Math.max(0, -b / a))) : 2;
    out.decreasingFrom = Math.ceil(threshold - 1e-9);
    out.from = Math.max(start, out.decreasingFrom, b !== 0 ? 2 : 1);
    const edge = a !== 0 && -b / a > 0 ? `e^(${frac(round(-b / a))})` : '1';
    out.hypothesis = `f(x) = ${logPowerText(f, 'x')} es continua y positiva para x ≥ ${out.from}; f′(x) = c·x^(a−1)(ln x)^(b−1)(a·ln x + b) < 0 para todo x > ${edge}.`;
    const verdict = logPowerVerdict(f);
    out.conclusion = verdict.converges ? 'converge' : 'diverge'; out.proof = 'analytic';
    out.steps.push(verdict.reason);
    const c = round(f.c), x0 = out.from;
    if (a === -1) {
      out.antiderivative = b === -1 ? `${c === 1 ? '' : frac(c) + '·'}ln(ln(x))` : scaledPower(f.c, 'ln(x)', round(b + 1));
      if (verdict.converges) out.integral = f.c * Math.log(x0) ** (b + 1) / -(b + 1);
    } else if (b === 0) {
      out.antiderivative = scaledPower(f.c, 'x', round(a + 1));
      if (verdict.converges) out.integral = f.c * x0 ** (a + 1) / -(a + 1);
    }
    if (out.integral !== null) out.steps.push(`∫ desde ${x0} hasta ∞ de f(x) dx = ${Number(out.integral.toPrecision(10))}.`);
    return out;
  }
  const rational = rationalDegrees(termExpr);
  if (rational) {
    const d = rational.q - rational.p;
    out.family = `cociente de polinomios, grados ${rational.p} / ${rational.q}`;
    out.proof = 'analytic';
    out.conclusion = d > 1 ? 'converge' : 'diverge';
    out.steps.push(d > 1
      ? `f(n) se comporta como 1/n^${d} (grado del denominador − grado del numerador = ${d} > 1): la integral converge.`
      : d === 1 ? 'f(n) se comporta como 1/n: ∫ dx/x diverge.' : 'f(n) no tiende a 0: la serie diverge.');
    out.hypothesis = 'Un cociente de polinomios es eventualmente positivo (o negativo) y monótono; el criterio se aplica desde ese punto.';
    const primitive = integrate(termExpr.replace(/\bn\b/g, 'x'));
    if (primitive.result) {
      out.antiderivative = primitive.result;
      const limit = d > 1 ? safeLimit(primitive.result) : null, Fn = calcParse(primitive.result, 'x');
      if (limit && Number.isFinite(limit.value) && Fn) {
        out.integral = limit.value - Fn(start);
        out.steps.push(`∫ desde ${start} hasta ∞ de f(x) dx = lím F − F(${start}) = ${Number(out.integral.toPrecision(10))}.`);
      }
    }
    return out;
  }
  // Primitiva simbólica + límite en el infinito por dominancia.
  const primitive = integrate(termExpr.replace(/\bn\b/g, 'x'));
  if (!primitive.result) { out.steps.push('No hay primitiva simbólica para esta f; el criterio no puede aplicarse aquí.'); return out; }
  out.antiderivative = primitive.result;
  const limit = safeLimit(primitive.result);
  const Fn = calcParse(primitive.result, 'x'), F = x => Fn(x);
  // Hipótesis comprobadas por muestreo: se declara como tal.
  const fx = x => evalTermN(termExpr, x);
  const grid = Array.from({ length: 60 }, (_, i) => start * 10 ** (i / 7));
  // Un valor 0 lejos del origen es subdesbordamiento numérico, no un cambio de signo.
  const positive = fx(start) > 0 && grid.every(x => fx(x) >= 0), decreasing = grid.every((x, i) => i === 0 || fx(x) <= fx(grid[i - 1]) + 1e-15);
  out.hypothesis = `Positividad y decrecimiento comprobados por muestreo en [${start}, ${Number(grid.at(-1).toPrecision(3))}]: ${positive && decreasing ? 'se cumplen en la muestra' : 'NO se cumplen'} (la muestra no es una demostración).`;
  if (!positive || !decreasing) { out.steps.push('La muestra contradice las hipótesis del criterio de la integral.'); return out; }
  if (!limit) { out.steps.push(`Primitiva F(x) = ${primitive.result}; no se pudo demostrar su límite en ∞.`); return out; }
  out.proof = 'analytic-sampled-hypotheses';
  out.conclusion = Number.isFinite(limit.value) ? 'converge' : 'diverge';
  if (Number.isFinite(limit.value)) out.integral = limit.value - F(start);
  out.steps.push(`F(x) = ${primitive.result}; lím F(x) cuando x → ∞ = ${Number.isFinite(limit.value) ? Number(limit.value.toPrecision(10)) : limit.value > 0 ? '+∞' : '−∞'}.`);
  return out;
}

// Series alternantes Σ (−1)^(n+1)·bₙ, n ≥ 1: criterio de Leibniz, tipo de convergencia y cota del error.
export function alternatingSeries(bExpr, terms = 10) {
  const out = { conclusion: 'inconcluso', proof: 'undetermined', limitZero: null, decreasing: null, decreasingFrom: null, absolute: null, partialSum: null, bound: null, terms, steps: [] };
  const ast = termAst(bExpr);
  if (!ast || !Number.isInteger(terms) || terms < 1 || terms > 100000) return out;
  const f = logPowerFactors(ast), rational = f ? null : rationalDegrees(bExpr);
  if (f) {
    if (f.c <= 0) { out.steps.push('bₙ debe ser positivo: escribe la serie como Σ(−1)^(n+1)·bₙ con bₙ > 0.'); return out; }
    out.limitZero = f.a < 0 || (f.a === 0 && f.b < 0);
    out.decreasingFrom = f.a < 0 ? Math.ceil(Math.max(f.b !== 0 ? 2 : 1, Math.exp(Math.max(0, -f.b / f.a))) - 1e-9) : f.a === 0 && f.b < 0 ? 2 : null;
    out.decreasing = out.decreasingFrom !== null;
    out.absolute = logPowerVerdict(f).converges;
    out.proof = 'analytic';
  } else if (rational) {
    out.limitZero = rational.q > rational.p;
    out.decreasing = out.limitZero; // cociente positivo que tiende a 0: eventualmente decreciente
    out.absolute = rational.q - rational.p > 1;
    out.proof = 'analytic';
  } else {
    const limit = sequenceLimit(bExpr);
    if (limit.status === 'demostrado') { out.limitZero = limit.value === 0; out.proof = 'analytic'; }
    const ratio = ratioTest(bExpr), root = rootTest(bExpr);
    if (ratio.proof === 'analytic' && ratio.conclusion !== 'inconcluso') out.absolute = ratio.conclusion === 'converge';
    else if (root.proof === 'analytic' && root.conclusion !== 'inconcluso') out.absolute = root.conclusion === 'converge';
    // Razón o raíz con L > 1: |bₙ| crece sin cota, así que bₙ no tiende a 0.
    if ((ratio.proof === 'analytic' && ratio.L > 1) || (root.proof === 'analytic' && root.L > 1)) { out.limitZero = false; out.proof = 'analytic'; }
    const values = Array.from({ length: 400 }, (_, i) => evalTermN(bExpr, i + 1));
    out.decreasing = values.every((v, i) => i === 0 || v <= values[i - 1] + 1e-15);
    if (out.decreasing) out.steps.push('Decrecimiento comprobado por muestreo en n = 1…400 (no es demostración).');
  }
  // Suma parcial y cota de Leibniz |S − S_N| ≤ b_{N+1}.
  let sum = 0;
  for (let n = 1; n <= terms; n++) { const b = evalTermN(bExpr, n); if (!Number.isFinite(b)) return { ...out, steps: [...out.steps, `bₙ no está definido en n = ${n}.`] }; sum += (n % 2 ? 1 : -1) * b; }
  out.partialSum = sum; out.bound = Math.abs(evalTermN(bExpr, terms + 1));
  if (out.limitZero === false) { out.conclusion = 'diverge'; out.steps.unshift('bₙ no tiende a 0: la serie diverge (término n-ésimo).'); return out; }
  if (out.absolute === true) { out.conclusion = 'converge absolutamente'; out.steps.unshift('Σ|aₙ| = Σ bₙ converge: convergencia absoluta.'); }
  else if (out.limitZero && out.decreasing) {
    out.conclusion = out.absolute === false ? 'converge condicionalmente' : 'converge';
    out.steps.unshift(`Leibniz: bₙ → 0 y bₙ decrece${out.decreasingFrom > 1 ? ` desde n = ${out.decreasingFrom}` : ''}, así que la serie converge.`);
    if (out.absolute === false) out.steps.push('Σ bₙ diverge: la convergencia es condicional.');
  }
  if (out.conclusion !== 'inconcluso' && out.conclusion !== 'diverge') out.steps.push(`Con N = ${terms} términos: S_N = ${Number(sum.toPrecision(10))} y |S − S_N| ≤ b_(N+1) = ${Number(out.bound.toPrecision(6))}.`);
  if (out.proof === 'undetermined' && out.conclusion !== 'inconcluso') out.proof = 'sampled';
  return out;
}
