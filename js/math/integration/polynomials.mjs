import { add, fn, mul, neg, num, pow, vari } from './ast-tools.mjs';

// ── Utilidades de polinomios (coeficientes ascendentes) ──
export function trimPoly(p) {
  p = p.slice();
  while (p.length > 1 && Math.abs(p[p.length - 1]) < 1e-12) p.pop();
  return p;
}
export function polyDegree(p) { p = trimPoly(p); return p.length - 1; }
export function polyAdd(a, b) {
  const n = Math.max(a.length, b.length), out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) out[i] = (a[i] || 0) + (b[i] || 0);
  return trimPoly(out);
}
export function polyScale(p, c) { return trimPoly(p.map(x => x * c)); }
export function polySub(a, b) { return polyAdd(a, polyScale(b, -1)); }
export function polyMul(a, b) {
  const out = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j];
  return trimPoly(out);
}
export function polyDiv(num, den) {
  num = trimPoly(num.slice()); den = trimPoly(den.slice());
  const dn = den.length - 1;
  if (dn < 0) throw new Error('división por polinomio nulo');
  const q = new Array(Math.max(num.length - dn, 0)).fill(0);
  while (num.length - 1 >= dn) {
    const d = num.length - 1 - dn;
    const coef = num[num.length - 1] / den[dn];
    q[d] = coef;
    for (let i = 0; i <= dn; i++) num[num.length - 1 - i] -= coef * den[dn - i];
    while (num.length > 1 && Math.abs(num[num.length - 1]) < 1e-12) num.pop();
  }
  return { q: trimPoly(q), r: trimPoly(num) };
}
function polyDeriv(p) {
  p = trimPoly(p);
  const out = [];
  for (let i = 1; i < p.length; i++) out.push(p[i] * i);
  return trimPoly(out.length ? out : [0]);
}
export function polyEval(p, x) { let r = 0; for (let i = p.length - 1; i >= 0; i--) r = r * x + p[i]; return r; }

export function astToPoly(node, v) {
  if (!node) return null;
  switch (node.type) {
    case 'num': return [node.val];
    case 'var': return node.val === v ? [0, 1] : null;
    case 'neg': { const p = astToPoly(node.arg, v); return p ? polyScale(p, -1) : null; }
    case '+': { const a = astToPoly(node.left, v), b = astToPoly(node.right, v); return (a && b) ? polyAdd(a, b) : null; }
    case '-': { const a = astToPoly(node.left, v), b = astToPoly(node.right, v); return (a && b) ? polySub(a, b) : null; }
    case '*': {
      const a = astToPoly(node.left, v), b = astToPoly(node.right, v);
      if (a && b && a.length+b.length-1<=33) return polyMul(a, b);
      return null;
    }
    case '^': {
      const a = astToPoly(node.left, v);
      if (a && node.right.type === 'num' && Number.isInteger(node.right.val) && node.right.val >= 0 && node.right.val<=32) {
        let out = [1];
        for (let i = 0; i < node.right.val; i++) {
          if(out.length+a.length-1>33)return null;
          out = polyMul(out, a);
        }
        return out;
      }
      return null;
    }
    default: return null;
  }
}

export function polyToAst(p, v) {
  p = trimPoly(p);
  let ast = null;
  for (let i = p.length - 1; i >= 0; i--) {
    const c = p[i];
    if (Math.abs(c) < 1e-12) continue;
    let term;
    if (i === 0) term = num(c);
    else if (i === 1) term = (c === 1) ? vari(v) : (c === -1 ? neg(vari(v)) : mul(num(c), vari(v)));
    else {
      const p = pow(vari(v), num(i));
      term = (c === 1) ? p : (c === -1 ? neg(p) : mul(num(c), p));
    }
    ast = ast ? add(term, ast) : term;
  }
  return ast || num(0);
}

// ── Raíces reales (con multiplicidad por deflación) ──
function findOneRealRoot(p) {
  const dp = polyDeriv(p);
  const M = Math.max(1, ...p.map(Math.abs));
  const R = Math.max(6, 1 + 2 * M);
  const seeds = [];
  for (let s = -R; s <= R; s += 0.5) seeds.push(s);
  for (const x0 of seeds) {
    let x = x0;
    for (let k = 0; k < 300; k++) {
      const fv = polyEval(p, x);
      if (Math.abs(fv) < 1e-7) return x;
      const fp = polyEval(dp, x);
      if (Math.abs(fp) < 1e-12) break;
      const nx = x - fv / fp;
      if (!isFinite(nx) || Math.abs(nx - x) < 1e-13) break;
      x = nx;
    }
    if (Math.abs(polyEval(p, x)) < 1e-7) return x;
  }
  return null;
}

export function polyRealRoots(p) {
  p = trimPoly(p.slice());
  const roots = [];
  for (let iter = 0; iter < 60; iter++) {
    const d = polyDegree(p);
    if (d < 1) break;
    if (d === 1) { roots.push(-p[0] / p[1]); break; }
    if (d === 2) {
      const a = p[2], b = p[1], c = p[0];
      const disc = b * b - 4 * a * c;
      if (disc < -1e-9) break;
      const sq = Math.sqrt(Math.max(disc, 0));
      if (disc > 1e-9) { roots.push((-b - sq) / (2 * a)); roots.push((-b + sq) / (2 * a)); }
      else { const r = (-b) / (2 * a); roots.push(r); roots.push(r); }
      break;
    }
    const r = findOneRealRoot(p);
    if (r === null) break;
    roots.push(r);
    p = polyDiv(p, [-r, 1]).q;
  }
  return roots;
}

export function polyPow(k) { const a = new Array(k + 1).fill(0); a[k] = 1; return a; }
export function polyInU(poly, fnName, v, sign = 1) {
  let ast = null;
  for (let j = 0; j < poly.length; j++) {
    const c = poly[j] / (j + 1);
    if (Math.abs(c) < 1e-12) continue;
    const term = (j + 1 === 1)
      ? mul(num(sign * c), fn(fnName, vari(v)))
      : mul(num(sign * c), pow(fn(fnName, vari(v)), num(j + 1)));
    ast = ast ? add(ast, term) : term;
  }
  return ast;
}
// ── Fracciones parciales (integral de racional) ──
export function integratePolyAST(p, v) {
  const out = new Array(p.length + 1).fill(0);
  for (let i = 0; i < p.length; i++) out[i + 1] = p[i] / (i + 1);
  return polyToAst(trimPoly(out), v);
}
// ── Integrador principal ──
export function integratePolyNode(p, v) {
  const out = new Array(p.length + 1).fill(0);
  for (let i = 0; i < p.length; i++) out[i + 1] = p[i] / (i + 1);
  return { ast: polyToAst(trimPoly(out), v), technique: 'regla de la potencia', steps: ['Regla de la potencia término a término'] };
}
