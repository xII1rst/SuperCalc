import { add, cancelProduct, constantMultiple, neg, scaleAst, sub } from './ast-tools.mjs';
import { astToPoly, integratePolyNode } from './polynomials.mjs';
import { collectTerms } from '../calculus/printer.mjs';
import { collectVariables } from '../expression.mjs';
import { derivativeDetails } from '../calculus/derivatives.mjs';
import { parseExpr, tokenize } from '../calculus/parser.mjs';
import { pretty } from './format.mjs';
import { simplify } from '../calculus/ast.mjs';
import { tryBasic } from './rules/basic.mjs';
import { tryByParts } from './rules/by-parts.mjs';
import { tryPartialFractions } from './partial-fractions.mjs';
import { trySubstitution } from './rules/substitution.mjs';
import { tryTrigIntegral } from './rules/trigonometric.mjs';

export function integrateNode(node, v, depth) {
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
  const substitution = trySubstitution(node, v, depth, integrateNode);
  if (substitution) return substitution;
  const trig = tryTrigIntegral(node, v, depth);
  if (trig) return trig;
  const parts = tryByParts(node, v, depth, integrateNode);
  if (parts) return parts;
  const pf = tryPartialFractions(node, v);
  if (pf) return pf;
  return null;
}

export function integrate(exprStr, varName = 'x') {
  const out = { result: null, ast: null, technique: 'ninguna', steps: [], domain: [] };
  if (!exprStr || !exprStr.trim()) return out;
  try {
    if(exprStr.length>500||collectVariables(exprStr).some(name=>name!==varName))throw new RangeError('Usa una expresión de hasta 500 caracteres y una sola variable.');
    const ast = parseExpr(tokenize(exprStr));
    out.domain=derivativeDetails(exprStr,1,varName)?.conditions||[];
    const res = integrateNode(ast, varName, 0);
    if (res && res.ast) {
      let o = simplify(res.ast);
      o = collectTerms(o);
      o = simplify(o);
      const stack=[o];let nodes=0;
      while(stack.length) {
        const node=stack.pop();
        if(++nodes>5000||node.type==='num'&&!Number.isFinite(node.val))throw new RangeError('Primitiva fuera del rango numérico o del límite de complejidad.');
        for(const key of ['left','right','arg'])if(node[key])stack.push(node[key]);
      }
      out.result = pretty(o, varName);
      out.ast = o;
      out.technique = res.technique;
      out.steps = res.steps;
    }
  } catch (e) {
    out.steps.push('Error: ' + e.message);
  }
  return out;
}


// ── INTEGRAL DEFINIDA E IMPROPIA ──
