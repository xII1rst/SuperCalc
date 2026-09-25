// Motor de integración simbólica sobre el AST compartido de calculus.mjs.
// Sin DOM ni navegador. Cubre: regla de la potencia, tabla básica, sustitución u,
// por partes, integrales trigonométricas, fracciones parciales y formas cuadráticas
// (sustitución trigonométrica). Devuelve la antiderivada como cadena legible.

import {
  tokenize, parseExpr, simplify, collectTerms, astToStr, diffAST,
} from './calculus.mjs';

// ── Constructores de AST ──
const num   = n => ({ type: 'num', val: n });
const vari  = v => ({ type: 'var', val: v });
const fn    = (name, arg) => ({ type: 'fn', fn: name, arg });
const add   = (a, b) => ({ type: '+', left: a, right: b });
const sub   = (a, b) => ({ type: '-', left: a, right: b });
const mul   = (a, b) => ({ type: '*', left: a, right: b });
const div   = (a, b) => ({ type: '/', left: a, right: b });
const pow   = (a, b) => ({ type: '^', left: a, right: b });
const neg   = a => ({ type: 'neg', arg: a });
const lnAbs = a => fn('ln', fn('abs', a));

// ── Impresión con coeficientes fraccionarios ──
function prettyCoeff(c) {
  if (Math.abs(c) < 1e-12) return '0';
  if (Number.isInteger(c)) return String(c);
  const negative = c < 0;
  const a = Math.abs(c);
  for (let d = 2; d <= 32; d++) {
    const n = Math.round(a * d);
    if (Math.abs(n / d - a) < 1e-9) return (negative ? '-' : '') + n + '/' + d;
  }
  return String(parseFloat(c.toFixed(6)));
}

function pretty(node, v) {
  if (!node) return '0';
  const P = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3, neg: 4 };
  function s(node, pp) {
    switch (node.type) {
      case 'num': {
        const x = node.val;
        if (Math.abs(x - Math.PI) < 1e-9) return 'π';
        if (Math.abs(x - Math.E) < 1e-9) return 'e';
        return prettyCoeff(x);
      }
      case 'var': return node.val;
      case 'neg': {
        const inner = s(node.arg, P.neg);
        const needsParens = ['+', '-', '*', '/', 'neg'].includes(node.arg.type);
        return needsParens ? `-(${inner})` : `-${inner}`;
      }
      case 'fn': {
        const inner = s(node.arg, 0);
        if (node.fn === 'exp') return `e^(${inner})`;
        if (node.fn === 'ln') return node.arg.type === 'fn' && node.arg.fn === 'abs'
          ? `ln|${s(node.arg.arg, 0)}|` : `ln(${inner})`;
        if (node.fn === 'abs') return `|${inner}|`;
        return `${node.fn}(${inner})`;
      }
      case '+': {
        const l = s(node.left, 1), r = s(node.right, 1);
        return r.startsWith('-') ? `${l} ${r}` : `${l} + ${r}`;
      }
      case '-': {
        const l = s(node.left, 1), r = s(node.right, 1);
        if (r.startsWith('-')) return `${l} + ${r.slice(1)}`;
        const rStr = (node.right.type === '+' || node.right.type === '-') ? `(${r})` : r;
        return `${l} - ${rStr}`;
      }
      case '*': {
        const fs = flattenFactors(node);
        let coef = 1;
        const rest = [];
        for (const f of fs) {
          if (f.type === 'num') coef *= f.val;
          else if (f.type === 'neg' && f.arg.type === 'num') coef *= -f.arg.val;
          else if (f.type === 'neg') { coef *= -1; rest.push(f.arg); }
          else rest.push(f);
        }
        if (rest.length === 0) return prettyCoeff(coef);
        const body = rest.map(f => {
          const inner = s(f, 2);
          return (f.type === '+' || f.type === '-') ? `(${inner})` : inner;
        }).join('*');
        const sign = coef < 0 ? -1 : 1;
        const mag = Math.abs(coef);
        if (mag === 1) return (sign < 0 ? '-' : '') + body;
        return (sign < 0 ? '-' : '') + prettyCoeff(mag) + '*' + body;
      }
      case '/': {
        const l = s(node.left, 2), r = s(node.right, 2);
        const lStr = (node.left.type === '+' || node.left.type === '-') ? `(${l})` : l;
        const needsParens = ['+', '-', '*', '/'].includes(node.right.type) || /[+\-/]/.test(r);
        const rStr = needsParens ? `(${r})` : r;
        return `${lStr}/${rStr}`;
      }
      case '^': {
        const l = s(node.left, 3), r = s(node.right, 3);
        const lStr = (node.left.type !== 'num' && node.left.type !== 'var') ? `(${l})` : l;
        const rStr = /[+\-/]/.test(r) ? `(${r})` : r;
        return `${lStr}^${rStr}`;
      }
      default: return '?';
    }
  }
  return s(node, 0);
}

// ── Utilidades de polinomios (coeficientes ascendentes) ──
function trimPoly(p) {
  p = p.slice();
  while (p.length > 1 && Math.abs(p[p.length - 1]) < 1e-12) p.pop();
  return p;
}
function polyDegree(p) { p = trimPoly(p); return p.length - 1; }
function polyAdd(a, b) {
  const n = Math.max(a.length, b.length), out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) out[i] = (a[i] || 0) + (b[i] || 0);
  return trimPoly(out);
}
function polyScale(p, c) { return trimPoly(p.map(x => x * c)); }
function polySub(a, b) { return polyAdd(a, polyScale(b, -1)); }
function polyMul(a, b) {
  const out = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j];
  return trimPoly(out);
}
function polyDiv(num, den) {
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
function polyEval(p, x) { let r = 0; for (let i = p.length - 1; i >= 0; i--) r = r * x + p[i]; return r; }

function astToPoly(node, v) {
  if (!node) return null;
  switch (node.type) {
    case 'num': return [node.val];
    case 'var': return node.val === v ? [0, 1] : null;
    case 'neg': { const p = astToPoly(node.arg, v); return p ? polyScale(p, -1) : null; }
    case '+': { const a = astToPoly(node.left, v), b = astToPoly(node.right, v); return (a && b) ? polyAdd(a, b) : null; }
    case '-': { const a = astToPoly(node.left, v), b = astToPoly(node.right, v); return (a && b) ? polySub(a, b) : null; }
    case '*': {
      const a = astToPoly(node.left, v), b = astToPoly(node.right, v);
      if (a && b) return polyMul(a, b);
      return null;
    }
    case '^': {
      const a = astToPoly(node.left, v);
      if (a && node.right.type === 'num' && Number.isInteger(node.right.val) && node.right.val >= 0) {
        let out = [1];
        for (let i = 0; i < node.right.val; i++) out = polyMul(out, a);
        return out;
      }
      return null;
    }
    default: return null;
  }
}

function polyToAst(p, v) {
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

function polyRealRoots(p) {
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

// ── Solución de sistemas lineales (eliminación de Gauss-Jordan) ──
function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => row.concat(b[i]));
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < 1e-12) return null;
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col];
    for (let j = col; j <= n; j++) M[col][j] /= d;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      for (let j = col; j <= n; j++) M[r][j] -= f * M[col][j];
    }
  }
  return M.map(row => row[n]);
}

// ── Fracciones parciales ──
function partialFractions(numP, denP, v) {
  numP = trimPoly(numP.slice()); denP = trimPoly(denP.slice());
  const lc = denP[denP.length - 1];
  if (!lc) return null;
  numP = polyScale(numP, 1 / lc);
  denP = polyScale(denP, 1 / lc);
  let polyPart = [0];
  if (polyDegree(numP) >= polyDegree(denP)) {
    const d = polyDiv(numP, denP);
    polyPart = d.q; numP = d.r;
  }
  const roots = polyRealRoots(denP);
  let rem = denP;
  const rootList = [];
  for (const r of roots) {
    rootList.push(r);
    rem = polyDiv(rem, [-r, 1]).q;
  }
  const rd = polyDegree(rem);
  if (rd > 2) return null;
  let quad = null;
  if (rd === 2) {
    const a = rem[2], b = rem[1], c = rem[0];
    if (b * b - 4 * a * c >= -1e-9) return null; // no irreducible
    quad = { p: b / a, q: c / a };
  }
  const rootMap = new Map();
  for (const r of rootList) {
    const key = r.toFixed(9);
    if (!rootMap.has(key)) rootMap.set(key, { r, mult: 0 });
    rootMap.get(key).mult++;
  }
  const unknowns = [];
  for (const { r, mult } of rootMap.values()) {
    for (let k = 1; k <= mult; k++) {
      let den_i = [1];
      const lin = [-r, 1];
      for (let j = 0; j < k; j++) den_i = polyMul(den_i, lin);
      unknowns.push({ label: 'A', r, pow: k, contrib: polyDiv(denP, den_i).q });
    }
  }
  if (quad) {
    const qpoly = [quad.q, quad.p, 1];
    const base = polyDiv(denP, qpoly).q;
    unknowns.push({ label: 'C', quad: true, contrib: base });
    unknowns.push({ label: 'B', quad: true, contrib: [0, ...base] });
  }
  const n = unknowns.length;
  const A = [], b = [];
  for (let d = 0; d < n; d++) {
    A.push(unknowns.map(u => u.contrib[d] || 0));
    b.push(numP[d] || 0);
  }
  const sol = solveLinear(A, b);
  if (!sol) return null;
  return {
    polyPart, quad,
    linTerms: unknowns.filter(u => !u.quad).map((u, i) => ({ r: u.r, pow: u.pow, A: sol[i] })),
    quadTerm: quad ? { p: quad.p, q: quad.q, B: sol[n - 1], C: sol[n - 2] } : null,
  };
}

// ── Utilidades del integrador ──
function linearOf(node, v) {
  if (!node) return null;
  switch (node.type) {
    case 'num': return { a: 0, b: node.val };
    case 'var': return node.val === v ? { a: 1, b: 0 } : null;
    case '+': { const l = linearOf(node.left, v), r = linearOf(node.right, v); return (l && r) ? { a: l.a + r.a, b: l.b + r.b } : null; }
    case '-': { const l = linearOf(node.left, v), r = linearOf(node.right, v); return (l && r) ? { a: l.a - r.a, b: l.b - r.b } : null; }
    case 'neg': { const l = linearOf(node.arg, v); return l ? { a: -l.a, b: -l.b } : null; }
    case '*': {
      const l = linearOf(node.left, v), r = linearOf(node.right, v);
      if (l && r) {
        if (l.a === 0) return { a: l.b * r.a, b: l.b * r.b };
        if (r.a === 0) return { a: l.a * r.b, b: l.b * r.b };
        return null;
      }
      return null;
    }
    default: return null;
  }
}
function flattenFactors(node) {
  if (node.type === '*') return [...flattenFactors(node.left), ...flattenFactors(node.right)];
  return [node];
}
function buildProduct(list) {
  return list.reduce((a, b) => mul(a, b));
}
function astEqual(a, b) {
  if (!a || !b) return a === b;
  if (a.type !== b.type) return false;
  if (a.type === 'num') return Math.abs(a.val - b.val) < 1e-12;
  if (a.type === 'var') return a.val === b.val;
  if (a.type === 'fn') return a.fn === b.fn && astEqual(a.arg, b.arg);
  return astEqual(a.left, b.left) && astEqual(a.right, b.right);
}
function replaceSubtree(ast, target, repl) {
  if (astEqual(ast, target)) return repl;
  const out = { ...ast };
  if (out.left) out.left = replaceSubtree(out.left, target, repl);
  if (out.right) out.right = replaceSubtree(out.right, target, repl);
  if (out.arg) out.arg = replaceSubtree(out.arg, target, repl);
  return out;
}
function splitConst(node) {
  node = simplify(node);
  if (node.type === '*' && node.left.type === 'num') return { c: node.left.val, core: simplify(node.right) };
  if (node.type === '*' && node.right.type === 'num') return { c: node.right.val, core: simplify(node.left) };
  if (node.type === 'neg') { const s = splitConst(node.arg); return { c: -s.c, core: s.core }; }
  return { c: 1, core: node };
}
function ratioAsConstant(rest, du, v) {
  rest = simplify(rest); du = simplify(du);
  const a = splitConst(rest), b = splitConst(du);
  if (astToStr(a.core) === astToStr(b.core)) return a.c / b.c;
  return null;
}
function scaleAst(node, k) {
  if (Math.abs(k - 1) < 1e-12) return node;
  if (Math.abs(k + 1) < 1e-12) return neg(node);
  return mul(num(k), node);
}
function astFromString(s, v) {
  return parseExpr(tokenize(s.replace(/x/g, v)));
}
function polyPow(k) { const a = new Array(k + 1).fill(0); a[k] = 1; return a; }
function polyInU(poly, fnName, v, sign = 1) {
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
function squareOfLinear(node, v) {
  if (node.type === '^' && node.right.type === 'num' && Math.abs(node.right.val - 2) < 1e-12) {
    const lin = linearOf(node.left, v);
    if (lin) return { m: lin.a, b: lin.b, uAst: node.left };
  }
  return null;
}
function constOf(node) {
  if (node.type === 'num') return node.val;
  if (node.type === 'neg' && node.arg.type === 'num') return -node.arg.val;
  return null;
}

// ── Tabla básica + sustitución lineal + formas cuadráticas ──
function tryBasic(node, v) {
  const step = (txt) => ['Tabla: ' + txt];
  if (node.type === 'fn') {
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
      if (lin && lin.a !== 0) {
        if (names === 'sec,tan') return { ast: div(fn('sec', fns[0].arg), num(lin.a)), technique: 'tabla', steps: step('∫ sec(u)tan(u) du = sec(u)') };
        if (names === 'csc,cot') return { ast: div(neg(fn('csc', fns[0].arg)), num(lin.a)), technique: 'tabla', steps: step('∫ csc(u)cot(u) du = −csc(u)') };
      }
    }
    return null;
  }
  if (node.type === '/') {
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

// ── Sustitución u ──
function trySubstitution(node, v, depth) {
  let factors;
  if (node.type === '*') factors = flattenFactors(node);
  else if (node.type === '/') factors = [node.left, div(num(1), node.right)];
  else factors = [node];
  for (let i = 0; i < factors.length; i++) {
    const f = factors[i];
    const candidates = [];
    if (f.type === 'fn') { candidates.push(f.arg); candidates.push(f); }
    else if (f.type === '^' && f.right.type === 'num' && Number.isFinite(f.right.val) && Math.abs(f.right.val - 1) > 1e-12) candidates.push(f.left);
    for (const u of candidates) {
      if (u.type === 'var') continue;
      let du;
      try { du = diffAST(u, v); } catch { continue; }
      const rest = factors.filter((_, j) => j !== i);
      const restAst = rest.length === 0 ? num(1) : (rest.length === 1 ? rest[0] : buildProduct(rest));
      const k = ratioAsConstant(restAst, du, v);
      if (k !== null) {
        const fU = replaceSubtree(f, u, vari('_u'));
        const integ = integrateNode(fU, '_u', depth + 1);
        if (integ && integ.ast) {
          const back = replaceSubtree(integ.ast, vari('_u'), u);
          return {
            ast: scaleAst(back, k),
            technique: 'sustitución u',
            steps: [`Sustitución: u = ${pretty(u, v)}, du = ${pretty(du, v)} dx`],
          };
        }
      }
    }
  }
  return null;
}

// ── Por partes ──
function isFn(node, name) { return node.type === 'fn' && node.fn === name; }
function tryByParts(node, v, depth) {
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
function tryTrigIntegral(node, v, depth) {
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

// ── Fracciones parciales (integral de racional) ──
function integratePolyAST(p, v) {
  const out = new Array(p.length + 1).fill(0);
  for (let i = 0; i < p.length; i++) out[i + 1] = p[i] / (i + 1);
  return polyToAst(trimPoly(out), v);
}
function tryPartialFractions(node, v) {
  if (node.type !== '/') return null;
  const numP = astToPoly(node.left, v);
  const denP = astToPoly(node.right, v);
  if (!numP || !denP || polyDegree(denP) < 1) return null;
  const pf = partialFractions(numP, denP, v);
  if (!pf) return null;
  let ast = null;
  if (polyDegree(pf.polyPart) >= 1 || Math.abs(pf.polyPart[0]) > 1e-12) ast = integratePolyAST(pf.polyPart, v);
  for (const t of pf.linTerms) {
    let termAst;
    if (t.pow === 1) {
      termAst = mul(num(t.A), lnAbs(sub(vari(v), num(t.r))));
    } else {
      termAst = mul(num(t.A / (1 - t.pow)), pow(sub(vari(v), num(t.r)), num(-(t.pow - 1))));
    }
    ast = ast ? add(ast, termAst) : termAst;
  }
  if (pf.quadTerm) {
    const { p, q, B, C } = pf.quadTerm;
    const a2 = q - p * p / 4;
    const a = Math.sqrt(Math.max(a2, 0));
    const logPart = mul(num(B / 2), lnAbs(add(pow(vari(v), num(2)), add(mul(num(p), vari(v)), num(q)))));
    const atanPart = mul(num((C - B * p / 2) / a), fn('atan', div(add(vari(v), num(p / 2)), num(a))));
    const quadAst = (Math.abs(B) > 1e-12) ? add(logPart, atanPart) : atanPart;
    ast = ast ? add(ast, quadAst) : quadAst;
  }
  return { ast: ast || num(0), technique: 'fracciones parciales', steps: ['Descomposición en fracciones parciales'] };
}

// ── Integrador principal ──
function integratePolyNode(p, v) {
  const out = new Array(p.length + 1).fill(0);
  for (let i = 0; i < p.length; i++) out[i + 1] = p[i] / (i + 1);
  return { ast: polyToAst(trimPoly(out), v), technique: 'regla de la potencia', steps: ['Regla de la potencia término a término'] };
}
function constantMultiple(node) {
  if (node.type !== '*') return null;
  if (node.left.type === 'num') return { c: node.left.val, rest: node.right };
  if (node.right.type === 'num') return { c: node.right.val, rest: node.left };
  return null;
}
// Cancela factores comunes entre numerador y denominador dentro de un producto
// (p. ej. x²·(1/x) → x), y pliega los coeficientes numéricos.
function cancelProduct(node) {
  node = simplify(node);
  const factors = flattenFactors(node);
  let coef = 1;
  const terms = new Map(); // clave (cadena) -> { base, exp }
  function decompose(f, sign) {
    f = simplify(f);
    if (f.type === 'num') { if (sign > 0) coef *= f.val; else coef /= f.val; return; }
    if (f.type === 'neg') { coef *= -1; decompose(f.arg, sign); return; }
    if (f.type === '/') { decompose(f.left, sign); decompose(f.right, -sign); return; }
    if (f.type === '*') { for (const g of flattenFactors(f)) decompose(g, sign); return; }
    let base = f, exp = 1;
    if (f.type === '^' && f.right.type === 'num') { base = simplify(f.left); exp = f.right.val; }
    const key = astToStr(base);
    const cur = terms.get(key);
    if (cur) cur.exp += sign * exp; else terms.set(key, { base, exp: sign * exp });
  }
  for (const f of factors) decompose(f, 1);
  const numParts = [], denParts = [];
  for (const { base, exp } of terms.values()) {
    if (Math.abs(exp) < 1e-12) continue;
    if (exp > 0) numParts.push(Math.abs(exp - 1) < 1e-12 ? base : pow(base, num(exp)));
    else { const e = -exp; denParts.push(Math.abs(e - 1) < 1e-12 ? base : pow(base, num(e))); }
  }
  let numAst = Math.abs(coef - 1) < 1e-12 ? null : num(coef);
  for (const p of numParts) numAst = numAst ? mul(numAst, p) : p;
  if (!numAst) numAst = num(1);
  if (denParts.length === 0) return numAst;
  let denAst = denParts[0];
  for (let i = 1; i < denParts.length; i++) denAst = mul(denAst, denParts[i]);
  return div(numAst, denAst);
}

function integrateNode(node, v, depth) {
  if (!node || depth > 15) return null;
  node = simplify(node);
  node = cancelProduct(node);
  node = simplify(node);
  if (node.type === '+') {
    const L = integrateNode(node.left, v, depth), R = integrateNode(node.right, v, depth);
    if (L && R) return { ast: add(L.ast, R.ast), technique: 'suma', steps: [...L.steps, ...R.steps] };
    return null;
  }
  if (node.type === '-') {
    const L = integrateNode(node.left, v, depth), R = integrateNode(node.right, v, depth);
    if (L && R) return { ast: sub(L.ast, R.ast), technique: 'suma', steps: [...L.steps, ...R.steps] };
    return null;
  }
  if (node.type === 'neg') {
    const R = integrateNode(node.arg, v, depth);
    if (R) return { ast: neg(R.ast), technique: R.technique, steps: R.steps };
    return null;
  }
  const poly = astToPoly(node, v);
  if (poly) return integratePolyNode(poly, v);
  const cm = constantMultiple(node);
  if (cm) {
    const R = integrateNode(cm.rest, v, depth);
    if (R) return { ast: scaleAst(R.ast, cm.c), technique: R.technique, steps: R.steps };
    return null;
  }
  const basic = tryBasic(node, v);
  if (basic) return basic;
  const sub = trySubstitution(node, v, depth);
  if (sub) return sub;
  const trig = tryTrigIntegral(node, v, depth);
  if (trig) return trig;
  const parts = tryByParts(node, v, depth);
  if (parts) return parts;
  const pf = tryPartialFractions(node, v);
  if (pf) return pf;
  return null;
}

export function integrate(exprStr, varName = 'x') {
  const out = { result: null, technique: 'ninguna', steps: [] };
  if (!exprStr || !exprStr.trim()) return out;
  try {
    const ast = parseExpr(tokenize(exprStr));
    const res = integrateNode(ast, varName, 0);
    if (res && res.ast) {
      let o = simplify(res.ast);
      o = collectTerms(o);
      o = simplify(o);
      out.result = pretty(o, varName);
      out.technique = res.technique;
      out.steps = res.steps;
    }
  } catch (e) {
    out.steps.push('Error: ' + e.message);
  }
  return out;
}

export { partialFractions, prettyCoeff };
