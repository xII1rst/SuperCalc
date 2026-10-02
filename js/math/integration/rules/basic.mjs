import { add, astEqual, constOf, div, flattenFactors, fn, linearOf, lnAbs, mul, neg, num, pow, scaleAst, squareOfLinear, sub } from '../ast-tools.mjs';
import { pretty } from '../format.mjs';
import { simplify } from '../../calculus/ast.mjs';

// ── Tabla básica + sustitución lineal + formas cuadráticas ──
export function tryBasic(node, v) {
  const step = (txt) => ['Tabla: ' + txt];
  if (node.type === 'fn') {
    if(node.fn==='exp'&&node.arg.type==='fn'&&node.arg.fn==='sqrt') {
      const linear=linearOf(node.arg.arg,v);
      if(linear&&linear.a!==0)return {ast:mul(num(2/linear.a),mul(sub(node.arg,num(1)),node)),technique:'sustitución y partes',
        steps:[`u = ${pretty(node.arg,v)}, dx = 2u/${linear.a} du`, '∫ 2u e^u du = 2(u−1)e^u; regresar a x']};
    }
    const lin = linearOf(node.arg, v);
    if (lin && lin.a !== 0) {
      const u = node.arg, a = lin.a;
      switch (node.fn) {
        case 'sin': return { ast: div(neg(fn('cos', u)), num(a)), technique: 'tabla', steps: step('∫ sin(u) du = −cos(u)') };
        case 'cos': return { ast: div(fn('sin', u), num(a)), technique: 'tabla', steps: step('∫ cos(u) du = sin(u)') };
        case 'tan': return { ast: div(neg(lnAbs(fn('cos', u))), num(a)), technique: 'tabla', steps: step('∫ tan(u) du = −ln|cos(u)|') };
        case 'sec': return { ast: div(lnAbs(add(fn('sec', u), fn('tan', u))), num(a)), technique: 'tabla', steps: step('∫ sec(u) du = ln|sec(u)+tan(u)|') };
        case 'csc': return { ast: div(neg(lnAbs(add(fn('csc', u), fn('cot', u)))), num(a)), technique: 'tabla', steps: step('∫ csc(u) du = −ln|csc(u)+cot(u)|') };
        case 'cot': return { ast: div(lnAbs(fn('sin', u)), num(a)), technique: 'tabla', steps: step('∫ cot(u) du = ln|sin(u)|') };
        case 'sinh': return { ast: div(fn('cosh', u), num(a)), technique: 'tabla', steps: step('∫ sinh(u) du = cosh(u)') };
        case 'cosh': return { ast: div(fn('sinh', u), num(a)), technique: 'tabla', steps: step('∫ cosh(u) du = sinh(u)') };
        case 'tanh': return { ast: div(lnAbs(fn('cosh', u)), num(a)), technique: 'tabla', steps: step('∫ tanh(u) du = ln|cosh(u)|') };
        case 'exp': return { ast: div(fn('exp', u), num(a)), technique: 'tabla', steps: step('∫ e^u du = e^u') };
        case 'ln': return { ast: div(sub(mul(u, fn('ln', u)), u), num(a)), technique: 'tabla', steps: step('∫ ln(u) du = u·ln(u) − u') };
        case 'sqrt': return { ast: mul(num(2 / (3 * a)), pow(u, num(1.5))), technique: 'regla de la potencia', steps: step('∫ √u du = (2/3)u^(3/2)') };
      }
    }
    return null;
  }
  if (node.type === '^') {
    const lin = linearOf(node.left, v);
    const e = node.right;
    if(node.left.type==='fn'&&node.left.fn==='sec'&&e.type==='num'&&e.val===3) {
      const linear=linearOf(node.left.arg,v),u=node.left.arg;
      if(linear&&linear.a!==0)return {ast:div(add(mul(fn('sec',u),fn('tan',u)),lnAbs(add(fn('sec',u),fn('tan',u)))),num(2*linear.a)),
        technique:'integración por partes',steps:['I=∫sec³u du; por partes: I=sec u tan u−∫sec u tan²u du', 'tan²u=sec²u−1; 2I=sec u tan u+ln|sec u+tan u|']};
    }
    if (lin && lin.a !== 0 && e.type === 'num' && Number.isFinite(e.val)) {
      const n = e.val, u = node.left;
      if (Math.abs(n + 1) < 1e-12) return { ast: div(lnAbs(u), num(lin.a)), technique: 'tabla', steps: step('∫ u⁻¹ du = ln|u|') };
      return { ast: div(div(pow(u, num(n + 1)), num(n + 1)), num(lin.a)), technique: 'regla de la potencia', steps: step('∫ uⁿ du = uⁿ⁺¹/(n+1)') };
    }
    // base constante a^u
    if (node.left.type === 'num' && node.left.val > 0 && Math.abs(node.left.val - Math.E) > 1e-9) {
      const lin2 = linearOf(node.right, v);
      if (lin2 && lin2.a !== 0) {
        const u = node.right, base = node.left.val;
        return { ast: div(div(pow(num(base), u), num(Math.log(base))), num(lin2.a)), technique: 'tabla', steps: step('∫ a^u du = a^u/ln(a)') };
      }
    }
    // sec², csc²
    if (node.left.type === 'fn' && e.type === 'num' && Math.abs(e.val - 2) < 1e-12) {
      const lin = linearOf(node.left.arg, v);
      if (lin && lin.a !== 0) {
        if (node.left.fn === 'sec') return { ast: div(fn('tan', node.left.arg), num(lin.a)), technique: 'tabla', steps: step('∫ sec²(u) du = tan(u)') };
        if (node.left.fn === 'csc') return { ast: div(neg(fn('cot', node.left.arg)), num(lin.a)), technique: 'tabla', steps: step('∫ csc²(u) du = −cot(u)') };
      }
    }
    return null;
  }
  if (node.type === '*') {
    const factors = flattenFactors(node);
    const fns = factors.filter(f => f.type === 'fn');
    if (factors.length === 2 && fns.length === 2) {
      const names = fns.map(f => f.fn).sort().join(',');
      const lin = linearOf(fns[0].arg, v);
      if (lin && lin.a !== 0 && astEqual(fns[0].arg,fns[1].arg)) {
        if (names === 'sec,tan') return { ast: div(fn('sec', fns[0].arg), num(lin.a)), technique: 'tabla', steps: step('∫ sec(u)tan(u) du = sec(u)') };
        if (names === 'csc,cot') return { ast: div(neg(fn('csc', fns[0].arg)), num(lin.a)), technique: 'tabla', steps: step('∫ csc(u)cot(u) du = −csc(u)') };
      }
    }
    return null;
  }
  if (node.type === '/') {
    // Familia c/[u²√(u²+a²)], u lineal, a²>0.
    const factors=flattenFactors(node.right),square=factors.find(f=>squareOfLinear(f,v));
    const radical=factors.find(f=>f.type==='fn'&&f.fn==='sqrt');
    if(factors.length===2&&square&&radical&&constOf(node.left)!==null) {
      const q=matchQuadratic(radical,v),s=squareOfLinear(square,v);
      if(q?.kind==='sqrt_u2_plus_a2'&&s.m!==0&&astEqual(q.uAst,s.uAst))return {
        ast:div(neg(mul(node.left,radical)),mul(num(q.a*q.a*s.m),s.uAst)),technique:'sustitución trigonométrica',
        steps:[`u = ${pretty(s.uAst,v)}; u = ${q.a} tan θ`, '∫ du/[u²√(u²+a²)] = −√(u²+a²)/(a²u); u≠0']};
    }
    // 1/u, c/u
    const lin = linearOf(node.right, v);
    if (lin && lin.a !== 0) {
      const numc = constOf(node.left);
      if (numc !== null) {
        return { ast: div(mul(num(numc), lnAbs(node.right)), num(lin.a)), technique: 'tabla', steps: step('∫ du/u = ln|u|') };
      }
    }
    // formas cuadráticas (sustitución trigonométrica), sólo con numerador constante
    const q = matchQuadratic(node.right, v);
    if (q) {
      const nc = constOf(node.left);
      if (nc === null) return null;
      const u = q.uAst, m = q.m, a = q.a;
      let res;
      switch (q.kind) {
        case 'u2_plus_a2': res = div(mul(num(1 / a), fn('atan', div(u, num(a)))), num(m)); break;
        case 'sqrt_a2_minus_u2': res = div(fn('asin', div(u, num(a))), num(m)); break;
        case 'sqrt_u2_plus_a2': res = div(lnAbs(add(u, fn('sqrt', add(pow(u, num(2)), num(a * a))))), num(m)); break;
        case 'sqrt_u2_minus_a2': res = div(lnAbs(add(u, fn('sqrt', sub(pow(u, num(2)), num(a * a))))), num(m)); break;
        case 'u2_minus_a2': res = div(mul(num(1 / (2 * a)), lnAbs(div(sub(u, num(a)), add(u, num(a))))), num(m)); break;
        default: return null;
      }
      return { ast: scaleAst(res, nc), technique: 'sustitución trigonométrica', steps: step('∫ du/(u²±a²) o √…') };
    }
  }
  return null;
}

function matchQuadratic(den, v) {
  den = simplify(den);
  let sqrtFlag = false, inner = den;
  if (den.type === 'fn' && den.fn === 'sqrt') { sqrtFlag = true; inner = simplify(den.arg); }
  if (inner.type !== '+' && inner.type !== '-') return null;
  const L = inner.left, R = inner.right;
  const sqL = squareOfLinear(L, v), sqR = squareOfLinear(R, v);
  const cL = constOf(L), cR = constOf(R);
  let m, b, uAst, a2, sign;
  if (sqL && cR !== null && inner.type === '+') { ({ m, b, uAst } = sqL); a2 = cR; sign = 1; }
  else if (sqR && cL !== null && inner.type === '+') { ({ m, b, uAst } = sqR); a2 = cL; sign = 1; }
  else if (sqL && cR !== null && inner.type === '-') { ({ m, b, uAst } = sqL); a2 = cR; sign = -1; }
  else if (sqR && cL !== null && inner.type === '-') { ({ m, b, uAst } = sqR); a2 = cL; sign = -1; }
  else return null;
  if (a2 <= 0) return null;
  const a = Math.sqrt(a2);
  if (sqrtFlag) {
    if (sign > 0 && inner.type === '+') return { kind: 'sqrt_u2_plus_a2', m, b, uAst, a };
    if (sign > 0 && inner.type === '-') return { kind: 'sqrt_u2_minus_a2', m, b, uAst, a };
    if (sign < 0 && inner.type === '-') return { kind: 'sqrt_a2_minus_u2', m, b, uAst, a };
    return null;
  }
  if (sign > 0 && inner.type === '+') return { kind: 'u2_plus_a2', m, b, uAst, a };
  if (sign > 0 && inner.type === '-') return { kind: 'u2_minus_a2', m, b, uAst, a };
  return null;
}
