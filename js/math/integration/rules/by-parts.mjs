import { add, buildProduct, div, flattenFactors, fn, isFn, linearOf, mul, num, sub } from '../ast-tools.mjs';
import { astToPoly, polyDegree } from '../polynomials.mjs';
import { diffAST } from '../../calculus/derivatives.mjs';
import { pretty } from '../format.mjs';
import { simplify } from '../../calculus/ast.mjs';

export function tryByParts(node, v, depth, integrateNode) {
  if (depth > 10) return null;
  const factors = flattenFactors(node);
  // Caso cíclico: e^(ax)·sin(bx) o e^(ax)·cos(bx)
  if (factors.length === 2) {
    const expF = factors.find(f => isFn(f, 'exp') && linearOf(f.arg, v));
    const trigF = factors.find(f => (isFn(f, 'sin') || isFn(f, 'cos')) && linearOf(f.arg, v));
    if (expF && trigF) {
      const ea = linearOf(expF.arg, v), tb = linearOf(trigF.arg, v);
      if (ea && tb && ea.b === 0 && tb.b === 0) {
        const a = ea.a, b = tb.a, den = a * a + b * b;
        if (trigF.fn === 'sin') {
          const inner = sub(mul(num(a), fn('sin', trigF.arg)), mul(num(b), fn('cos', trigF.arg)));
          return { ast: div(mul(fn('exp', expF.arg), inner), num(den)), technique: 'por partes (cíclico)', steps: ['∫ e^(ax)sin(bx) dx = e^(ax)(a·sin(bx)−b·cos(bx))/(a²+b²)'] };
        } else {
          const inner = add(mul(num(a), fn('cos', trigF.arg)), mul(num(b), fn('sin', trigF.arg)));
          return { ast: div(mul(fn('exp', expF.arg), inner), num(den)), technique: 'por partes (cíclico)', steps: ['∫ e^(ax)cos(bx) dx = e^(ax)(a·cos(bx)+b·sin(bx))/(a²+b²)'] };
        }
      }
    }
  }
  let uIndex = -1;
  for (let i = 0; i < factors.length; i++) {
    const f = factors[i];
    if (f.type === 'fn' && ['ln', 'atan', 'asin', 'acos'].includes(f.fn)) { uIndex = i; break; }
  }
  if (uIndex === -1) {
    for (let i = 0; i < factors.length; i++) {
      const p = astToPoly(factors[i], v);
      if (p && polyDegree(p) >= 1) { uIndex = i; break; }
    }
  }
  if (uIndex === -1) return null;
  const u = factors[uIndex];
  const rest = factors.filter((_, j) => j !== uIndex);
  const dv = rest.length === 0 ? num(1) : (rest.length === 1 ? rest[0] : buildProduct(rest));
  const vres = integrateNode(dv, v, depth + 1);
  if (!vres) return null;
  const du = simplify(diffAST(u, v));
  const uv = mul(u, vres.ast);
  const vdu = mul(vres.ast, du);
  const tail = integrateNode(vdu, v, depth + 1);
  if (!tail) return null;
  return {
    ast: sub(uv, tail.ast),
    technique: 'integración por partes',
    steps: [`u = ${pretty(u, v)}, dv = ${pretty(dv, v)} dx`],
  };
}
