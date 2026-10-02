import { buildProduct, div, flattenFactors, num, ratioAsConstant, replaceSubtree, scaleAst, vari } from '../ast-tools.mjs';
import { diffAST } from '../../calculus/derivatives.mjs';
import { pretty } from '../format.mjs';

// ── Sustitución u ──
export function trySubstitution(node, v, depth, integrateNode) {
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
