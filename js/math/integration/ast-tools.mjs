import { astToStr } from '../calculus/printer.mjs';
import { parseExpr, tokenize } from '../calculus/parser.mjs';
import { simplify } from '../calculus/ast.mjs';

// ── Constructores de AST ──
export const num   = n => ({ type: 'num', val: n });
export const vari  = v => ({ type: 'var', val: v });
export const fn    = (name, arg) => ({ type: 'fn', fn: name, arg });
export const add   = (a, b) => ({ type: '+', left: a, right: b });
export const sub   = (a, b) => ({ type: '-', left: a, right: b });
export const mul   = (a, b) => ({ type: '*', left: a, right: b });
export const div   = (a, b) => ({ type: '/', left: a, right: b });
export const pow   = (a, b) => ({ type: '^', left: a, right: b });
export const neg   = a => ({ type: 'neg', arg: a });
export const lnAbs = a => fn('ln', fn('abs', a));

// ── Utilidades del integrador ──
export function linearOf(node, v) {
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
export function flattenFactors(node) {
  if (node.type === '*') return [...flattenFactors(node.left), ...flattenFactors(node.right)];
  return [node];
}
export function buildProduct(list) {
  return list.reduce((a, b) => mul(a, b));
}
export function astEqual(a, b) {
  if (!a || !b) return a === b;
  if (a.type !== b.type) return false;
  if (a.type === 'num') return Math.abs(a.val - b.val) < 1e-12;
  if (a.type === 'var') return a.val === b.val;
  if (a.type === 'fn') return a.fn === b.fn && astEqual(a.arg, b.arg);
  if (a.type === 'neg') return astEqual(a.arg,b.arg);
  return astEqual(a.left, b.left) && astEqual(a.right, b.right);
}
export function replaceSubtree(ast, target, repl) {
  if (astEqual(ast, target)) return repl;
  const out = { ...ast };
  if (out.left) out.left = replaceSubtree(out.left, target, repl);
  if (out.right) out.right = replaceSubtree(out.right, target, repl);
  if (out.arg) out.arg = replaceSubtree(out.arg, target, repl);
  return out;
}
export function splitConst(node) {
  node = simplify(node);
  if (node.type === '*' && node.left.type === 'num') return { c: node.left.val, core: simplify(node.right) };
  if (node.type === '*' && node.right.type === 'num') return { c: node.right.val, core: simplify(node.left) };
  if (node.type === 'neg') { const s = splitConst(node.arg); return { c: -s.c, core: s.core }; }
  return { c: 1, core: node };
}
export function ratioAsConstant(rest, du, v) {
  rest = simplify(rest); du = simplify(du);
  const a = splitConst(rest), b = splitConst(du);
  if (astToStr(a.core) === astToStr(b.core)) return a.c / b.c;
  return null;
}
export function scaleAst(node, k) {
  if (Math.abs(k - 1) < 1e-12) return node;
  if (Math.abs(k + 1) < 1e-12) return neg(node);
  return mul(num(k), node);
}
export function astFromString(s, v) {
  return parseExpr(tokenize(s.replace(/x/g, v)));
}
export function squareOfLinear(node, v) {
  if (node.type === '^' && node.right.type === 'num' && Math.abs(node.right.val - 2) < 1e-12) {
    const lin = linearOf(node.left, v);
    if (lin) return { m: lin.a, b: lin.b, uAst: node.left };
  }
  return null;
}
export function constOf(node) {
  if (node.type === 'num') return node.val;
  if (node.type === 'neg' && node.arg.type === 'num') return -node.arg.val;
  return null;
}

// ── Por partes ──
export function isFn(node, name) { return node.type === 'fn' && node.fn === name; }
export function constantMultiple(node) {
  if (node.type !== '*') return null;
  if (node.left.type === 'num') return { c: node.left.val, rest: node.right };
  if (node.right.type === 'num') return { c: node.right.val, rest: node.left };
  return null;
}
// Cancela factores comunes entre numerador y denominador dentro de un producto
// (p. ej. x²·(1/x) → x), y pliega los coeficientes numéricos.
export function cancelProduct(node) {
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
