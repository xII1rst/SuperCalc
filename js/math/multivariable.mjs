// Cálculo multivariable numérico y simbólico (sin DOM): derivadas parciales
// mixtas y 3D, límites por trayectorias, puntos críticos con clasificación por
// Hessiano, multiplicadores de Lagrange, derivada direccional, integrales dobles
// (polares) y triples, jacobiano 2D y centro de masa.

import {
  calcParse, collectVariables, symbolicDeriv,
  tokenize, parseExpr, diffAST, simplify, collectTerms, astToStr,
  gradient2D, midpointIntegral2D, simpsonIntegral,
} from './calculus.mjs';

// ── Parsers de aridad fija (x,y), (x,y,z), (u,v) y (t) ──
function f2(expr) {
  const fn = calcParse(expr, 'x');
  if (!fn) return null;
  const order = ['x', ...collectVariables(expr).filter(v => v !== 'x')];
  return (x, y) => fn(...order.map(v => (v === 'x' ? x : v === 'y' ? y : 0)));
}

function f3(expr) {
  const fn = calcParse(expr, 'x');
  if (!fn) return null;
  const order = ['x', ...collectVariables(expr).filter(v => v !== 'x')];
  return (x, y, z) => fn(...order.map(v => (v === 'x' ? x : v === 'y' ? y : v === 'z' ? z : 0)));
}

function fuv(expr) {
  const fn = calcParse(expr, 'u');
  if (!fn) return null;
  const order = ['u', ...collectVariables(expr).filter(v => v !== 'u')];
  return (u, v) => fn(...order.map(w => (w === 'u' ? u : w === 'v' ? v : 0)));
}

function pt(expr) {
  const fn = calcParse(expr, 't');
  if (!fn) return null;
  const order = ['t', ...collectVariables(expr).filter(v => v !== 't')];
  return t => fn(...order.map(w => (w === 't' ? t : 0)));
}

function requireFn(...fns) {
  if (fns.some(f => typeof f !== 'function')) throw new TypeError('Expresión inválida');
}

// ── Derivadas parciales simbólicas ──

// Derivada parcial mixta ∂^(ordX+ordY) f / ∂x^ordX ∂y^ordY como cadena.
// Se deriva sobre un único AST para evitar reparsear la cadena intermedia.
export function mixedPartial(fxyStr, ordX, ordY) {
  try {
    let ast = parseExpr(tokenize(fxyStr));
    for (let i = 0; i < ordX; i++) ast = simplify(collectTerms(simplify(diffAST(ast, 'x'))));
    for (let i = 0; i < ordY; i++) ast = simplify(collectTerms(simplify(diffAST(ast, 'y'))));
    return astToStr(ast);
  } catch (e) {
    return null;
  }
}

// Derivada parcial (primer orden) de f(x,y,z) respecto de varName.
export function partial3D(fxyzStr, varName) {
  return symbolicDeriv(fxyzStr, 1, varName);
}

// ── Límite multivariable por trayectorias ──

function pathLimit(f, path) {
  const hs = [1e-2, 1e-3, 1e-4, 1e-5];
  let last = null;
  for (const h of hs) {
    const [x, y] = path(h);
    const v = f(x, y);
    if (Number.isFinite(v)) last = v;
  }
  return last;
}

export function multivariableLimit(fxyStr, x0, y0) {
  const f = f2(fxyStr);
  requireFn(f);
  const paths = [
    [`y = ${y0}`, t => [x0 + t, y0]],
    [`x = ${x0}`, t => [x0, y0 + t]],
    ['recta y = x', t => [x0 + t, y0 + t]],
    ['parábola y = x²', t => [x0 + t, y0 + t * t]],
    ['recta y = 2x', t => [x0 + t, y0 + 2 * t]],
  ].map(([name, path]) => ({ name, value: pathLimit(f, path) }));

  const finite = paths.filter(p => p.value !== null && Number.isFinite(p.value));
  let exists = false, value = null;
  if (finite.length) {
    const first = finite[0].value;
    exists = finite.every(p => Math.abs(p.value - first) < 1e-3 * Math.max(1, Math.abs(first)));
    if (exists) value = first;
  }
  return { exists, value, paths };
}

// ── Derivada direccional ──

export function directionalDerivative(fxyStr, x0, y0, dir) {
  const f = f2(fxyStr);
  requireFn(f);
  const grad = gradient2D(f, x0, y0);
  const m = Math.hypot(dir.x, dir.y) || 1;
  return grad.fx * (dir.x / m) + grad.fy * (dir.y / m);
}

// ── Resolución numérica de sistemas 2×2 (Newton) ──

function newton2(F, x0, y0, iters = 60) {
  let x = x0, y = y0;
  const h = 1e-6;
  for (let i = 0; i < iters; i++) {
    const [f1, f2] = F(x, y);
    const f1x = (F(x + h, y)[0] - F(x - h, y)[0]) / (2 * h);
    const f1y = (F(x, y + h)[0] - F(x, y - h)[0]) / (2 * h);
    const f2x = (F(x + h, y)[1] - F(x - h, y)[1]) / (2 * h);
    const f2y = (F(x, y + h)[1] - F(x, y - h)[1]) / (2 * h);
    const det = f1x * f2y - f1y * f2x;
    if (Math.abs(det) < 1e-14) break;
    const dx = (f1y * f2 - f1 * f2y) / det;
    const dy = (f1 * f2x - f1x * f2) / det;
    x += dx; y += dy;
    if (Math.hypot(dx, dy) < 1e-12) break;
  }
  return [x, y];
}

// ── Puntos críticos y clasificación por Hessiano ──

export function criticalPoints2D(fxyStr, x1, x2, y1, y2, grid = 24) {
  const f = f2(fxyStr);
  requireFn(f);
  const mag = (x, y) => {
    const g = gradient2D(f, x, y);
    return g.fx * g.fx + g.fy * g.fy;
  };
  const dx = (x2 - x1) / grid, dy = (y2 - y1) / grid;
  const seeds = [];
  for (let i = 1; i < grid; i++) {
    for (let j = 1; j < grid; j++) {
      const x = x1 + i * dx, y = y1 + j * dy;
      const c = mag(x, y);
      if (c <= mag(x - dx, y) && c <= mag(x + dx, y) &&
          c <= mag(x, y - dy) && c <= mag(x, y + dy)) seeds.push([x, y]);
    }
  }
  const pts = [];
  for (const [cx, cy] of seeds) {
    const [x, y] = newton2((px, py) => {
      const g = gradient2D(f, px, py);
      return [g.fx, g.fy];
    }, cx, cy);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (pts.some(([px, py]) => Math.hypot(px - x, py - y) < 1e-3)) continue;
    const h = 1e-4;
    const fxx = (gradient2D(f, x + h, y).fx - gradient2D(f, x - h, y).fx) / (2 * h);
    const fyy = (gradient2D(f, x, y + h).fy - gradient2D(f, x, y - h).fy) / (2 * h);
    const fxy = (gradient2D(f, x, y + h).fx - gradient2D(f, x, y - h).fx) / (2 * h);
    const D = fxx * fyy - fxy * fxy;
    let type;
    if (D > 1e-6) type = fxx > 0 ? 'mínimo' : 'máximo';
    else if (D < -1e-6) type = 'silla';
    else type = 'inconcluso';
    pts.push({ x, y, D, type });
  }
  return pts;
}

// ── Multiplicadores de Lagrange (∇f = λ∇g, g = c) ──

export function lagrangeMultipliers(fxyStr, gxyStr, c, x1, x2, y1, y2, grid = 16) {
  const f = f2(fxyStr), g = f2(gxyStr);
  requireFn(f, g);
  const fx = (x, y) => gradient2D(f, x, y).fx;
  const fy = (x, y) => gradient2D(f, x, y).fy;
  const gx = (x, y) => gradient2D(g, x, y).fx;
  const gy = (x, y) => gradient2D(g, x, y).fy;
  const F = (x, y) => [g(x, y) - c, fx(x, y) * gy(x, y) - fy(x, y) * gx(x, y)];

  const seeds = [];
  const dx = (x2 - x1) / grid, dy = (y2 - y1) / grid;
  for (let i = 1; i < grid; i++) {
    for (let j = 1; j < grid; j++) {
      const x = x1 + i * dx, y = y1 + j * dy;
      const [r1, r2] = F(x, y);
      const m = r1 * r1 + r2 * r2;
      const nb = (xx, yy) => { const r = F(xx, yy); return r[0] * r[0] + r[1] * r[1]; };
      if (m <= nb(x - dx, y) && m <= nb(x + dx, y) && m <= nb(x, y - dy) && m <= nb(x, y + dy))
        seeds.push([x, y]);
    }
  }

  const out = [];
  for (const [cx, cy] of seeds) {
    const [x, y] = newton2(F, cx, cy);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (out.some(p => Math.hypot(p.x - x, p.y - y) < 1e-3)) continue;
    const gxv = gx(x, y);
    const lambda = Math.abs(gxv) > 1e-9 ? fx(x, y) / gxv : (Math.abs(gy(x, y)) > 1e-9 ? fy(x, y) / gy(x, y) : NaN);
    out.push({ x, y, lambda, f: f(x, y), g: g(x, y) });
  }
  return out;
}

// ── Integrales múltiples ──

// Integral doble en polares: ∬ f(x,y) dA = ∫∫ f(r cosθ, r sinθ)·r dr dθ.
// r1Expr y r2Expr son números o expresiones en 't' (θ).
export function doubleIntegralPolar(fxyStr, r1Expr, r2Expr, theta1, theta2, nr = 120, nt = 120) {
  const f = f2(fxyStr);
  requireFn(f);
  const r1 = typeof r1Expr === 'number' ? () => r1Expr : pt(r1Expr);
  const r2 = typeof r2Expr === 'number' ? () => r2Expr : pt(r2Expr);
  requireFn(r1, r2);
  const dt = (theta2 - theta1) / nt;
  let s = 0;
  for (let j = 0; j < nt; j++) {
    const th = theta1 + (j + 0.5) * dt;
    const lo = r1(th), hi = r2(th);
    const dr = (hi - lo) / nr;
    for (let i = 0; i < nr; i++) {
      const r = lo + (i + 0.5) * dr;
      s += f(r * Math.cos(th), r * Math.sin(th)) * r * dr * dt;
    }
  }
  return s;
}

// Integral triple por punto medio sobre una caja [x1,x2]×[y1,y2]×[z1,z2].
export function tripleIntegral(fxyzStr, x1, x2, y1, y2, z1, z2, nx = 40, ny = 40, nz = 40) {
  const f = f3(fxyzStr);
  requireFn(f);
  const hx = (x2 - x1) / nx, hy = (y2 - y1) / ny, hz = (z2 - z1) / nz;
  let s = 0;
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++)
      for (let k = 0; k < nz; k++)
        s += f(x1 + (i + 0.5) * hx, y1 + (j + 0.5) * hy, z1 + (k + 0.5) * hz);
  return s * hx * hy * hz;
}

// Jacobiano ∂(x,y)/∂(u,v) = x_u·y_v − x_v·y_u.
export function jacobian2D(xExpr, yExpr, u, v, h = 1e-6) {
  const x = fuv(xExpr), y = fuv(yExpr);
  requireFn(x, y);
  const xu = (x(u + h, v) - x(u - h, v)) / (2 * h);
  const xv = (x(u, v + h) - x(u, v - h)) / (2 * h);
  const yu = (y(u + h, v) - y(u - h, v)) / (2 * h);
  const yv = (y(u, v + h) - y(u, v - h)) / (2 * h);
  return xu * yv - xv * yu;
}

// Centro de masa de una lámina con densidad f(x,y) sobre [x1,x2]×[y1,y2].
export function centerOfMass2D(fxyStr, x1, x2, y1, y2, nx = 100, ny = 100) {
  const f = f2(fxyStr);
  requireFn(f);
  const mass = midpointIntegral2D(f, x1, x2, y1, y2, nx, ny);
  const mx = midpointIntegral2D((x, y) => x * f(x, y), x1, x2, y1, y2, nx, ny);
  const my = midpointIntegral2D((x, y) => y * f(x, y), x1, x2, y1, y2, nx, ny);
  return { mass, x: mx / mass, y: my / mass };
}
