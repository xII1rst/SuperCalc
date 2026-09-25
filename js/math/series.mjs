// Series infinitas: polinomio de Taylor/Maclaurin simbólico y pruebas de
// convergencia (serie geométrica, p-serie, prueba de la razón y del término
// n-ésimo). Sin DOM ni navegador.

import { tokenize, parseExpr, diffAST, simplify, evalAST } from './calculus.mjs';
import { evalTermN } from './algebra/sequences.mjs';

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
export function taylorSeries(expr, a, n, varName = 'x') {
  if (!expr || !expr.trim()) return null;
  let ast;
  try { ast = parseExpr(tokenize(expr)); } catch { return null; }
  if (!ast) return null;

  const terms = [];
  let d = simplify(ast);
  for (let k = 0; k <= n; k++) {
    const val = evalAST(substituteVar(d, varName, a));
    if (!Number.isFinite(val)) break;
    const coef = val / fact(k);
    if (Math.abs(coef) >= 1e-12) terms.push({ k, coef });
    d = simplify(diffAST(d, varName));
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

// Prueba de la razón (aproximación numérica): L = lim |a(n+1)/a(n)|.
// Un L próximo a 1 se reporta como inconcluso, como exige la prueba real.
export function ratioTest(termExpr, varName = 'n') {
  const result = { L: NaN, conclusion: 'inconcluso' };
  if (!termExpr || !termExpr.trim()) return result;
  for (const n of [1e5, 1e4, 1e3, 1e2, 1e1]) {
    const a1 = evalTermN(termExpr, n);
    const a2 = evalTermN(termExpr, n + 1);
    if (!Number.isFinite(a1) || !Number.isFinite(a2) || a1 === 0) continue;
    const r = Math.abs(a2 / a1);
    if (!Number.isFinite(r)) { result.L = Infinity; result.conclusion = 'diverge'; return result; }
    result.L = r;
    if (r < 0.98) result.conclusion = 'converge';
    else if (r > 1.02) result.conclusion = 'diverge';
    return result;
  }
  return result;
}

// Prueba del término n-ésimo: si lim a(n) ≠ 0, la serie diverge.
export function nthTermTest(termExpr, varName = 'n') {
  const result = { limit: NaN, conclusion: 'inconcluso' };
  if (!termExpr || !termExpr.trim()) return result;
  for (const n of [1e6, 1e5, 1e4, 1e3, 1e2]) {
    const v = evalTermN(termExpr, n);
    if (!Number.isFinite(v)) { result.conclusion = 'diverge'; return result; }
    result.limit = v;
    break; // se estima el límite con el mayor n evaluable
  }
  result.conclusion = Math.abs(result.limit) > 1e-3 ? 'diverge' : 'posible convergencia';
  return result;
}
