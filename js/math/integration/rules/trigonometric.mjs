import { astFromString, flattenFactors, pow, scaleAst, splitConst } from '../ast-tools.mjs';
import { polyInU, polyMul, polyPow } from '../polynomials.mjs';

// ── Integrales trigonométricas (potencias de sin/cos) ──
function trigPower(f, v) {
  if (f.type === 'fn' && (f.fn === 'sin' || f.fn === 'cos') && f.arg.type === 'var' && f.arg.val === v) return { base: f.fn, pow: 1 };
  if (f.type === '^' && f.left.type === 'fn' && (f.left.fn === 'sin' || f.left.fn === 'cos') && f.left.arg.type === 'var' && f.left.arg.val === v && f.right.type === 'num' && Number.isInteger(f.right.val)) return { base: f.left.fn, pow: f.right.val };
  return null;
}
function parseTrigPowerProduct(node, v) {
  const s = splitConst(node);
  let m = 0, n = 0;
  const factors = flattenFactors(s.core);
  for (const f of factors) {
    const p = trigPower(f, v);
    if (!p) return null;
    if (p.base === 'sin') m += p.pow; else n += p.pow;
  }
  return { m, n, coef: s.c };
}
export function tryTrigIntegral(node, v, depth) {
  const p = parseTrigPowerProduct(node, v);
  if (!p || (p.m === 0 && p.n === 0)) return null;
  const { m, n, coef } = p;
  const PURE = {
    sin: { 1: '-cos(x)', 2: 'x/2 - sin(2x)/4', 3: '-cos(x) + cos(x)^3/3', 4: '3x/8 - sin(2x)/4 + sin(4x)/32' },
    cos: { 1: 'sin(x)', 2: 'x/2 + sin(2x)/4', 3: 'sin(x) - sin(x)^3/3', 4: '3x/8 + sin(2x)/4 + sin(4x)/32' },
  };
  let ast = null;
  if (n === 0 && PURE.sin[m]) ast = astFromString(PURE.sin[m], v);
  else if (m === 0 && PURE.cos[n]) ast = astFromString(PURE.cos[n], v);
  else if (m === 2 && n === 2) ast = astFromString('x/8 - sin(4x)/32', v);
  else if (n % 2 === 1 && n > 0) {
    let poly = polyPow(m);
    for (let i = 0; i < (n - 1) / 2; i++) poly = polyMul(poly, [1, 0, -1]);
    ast = polyInU(poly, 'sin', v, 1);
  } else if (m % 2 === 1 && m > 0) {
    let poly = polyPow(n);
    for (let i = 0; i < (m - 1) / 2; i++) poly = polyMul(poly, [1, 0, -1]);
    ast = polyInU(poly, 'cos', v, -1);
  } else return null;
  if (!ast) return null;
  return { ast: scaleAst(ast, coef), technique: 'integral trigonométrica', steps: [`Reducción de ∫ sin^${m}(x)cos^${n}(x) dx`] };
}
