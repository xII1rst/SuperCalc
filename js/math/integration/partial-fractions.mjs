import { add, div, fn, lnAbs, mul, num, pow, sub, vari } from './ast-tools.mjs';
import { astToPoly, integratePolyAST, polyDegree, polyDiv, polyMul, polyRealRoots, polyScale, trimPoly } from './polynomials.mjs';

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
export function partialFractions(numP, denP, v) {
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

export function tryPartialFractions(node, v) {
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
