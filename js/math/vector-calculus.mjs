// Cálculo vectorial numérico (sin DOM): divergencia, rotacional, gradiente 3D,
// campos conservativos, integrales de línea, teoremas de Green/Gauss/Stokes y
// geometría diferencial de curvas (curvatura, tangente y normal unitarias).
// Convención de variables: los campos se escriben con 'x', 'y', 'z'; las curvas
// paramétricas con el parámetro 't'.

import { calcParse, collectVariables, simpsonIntegral, midpointIntegral2D } from './calculus.mjs';

// ── Parsers por aridad ──
// Devuelven clausuras de aridad fija (2 para campos planos, 3 para espaciales, 1
// para curvas paramétricas) aunque la expresión no use todas las variables.

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

function p1(expr) {
  const fn = calcParse(expr, 't');
  if (!fn) return null;
  const order = ['t', ...collectVariables(expr).filter(v => v !== 't')];
  return t => fn(...order.map(v => (v === 't' ? t : 0)));
}

function requireFn(...fns) {
  if (fns.some(f => typeof f !== 'function')) throw new TypeError('Expresión inválida');
}

// Derivadas numéricas centrales para funciones de una variable.
function d1(fn, t, h = 1e-6) { return (fn(t + h) - fn(t - h)) / (2 * h); }
function d2(fn, t, h = 1e-5) { return (fn(t + h) - 2 * fn(t) + fn(t - h)) / (h * h); }

// ── Operadores diferenciales ──

export function divergence(Fx, Fy, Fz, x, y, z, h = 1e-6) {
  const P = f3(Fx), Q = f3(Fy), R = f3(Fz);
  requireFn(P, Q, R);
  const dPdx = (P(x + h, y, z) - P(x - h, y, z)) / (2 * h);
  const dQdy = (Q(x, y + h, z) - Q(x, y - h, z)) / (2 * h);
  const dRdz = (R(x, y, z + h) - R(x, y, z - h)) / (2 * h);
  return dPdx + dQdy + dRdz;
}

export function curl(Fx, Fy, Fz, x, y, z, h = 1e-6) {
  const P = f3(Fx), Q = f3(Fy), R = f3(Fz);
  requireFn(P, Q, R);
  const dPdy = (P(x, y + h, z) - P(x, y - h, z)) / (2 * h);
  const dPdz = (P(x, y, z + h) - P(x, y, z - h)) / (2 * h);
  const dQdx = (Q(x + h, y, z) - Q(x - h, y, z)) / (2 * h);
  const dQdz = (Q(x, y, z + h) - Q(x, y, z - h)) / (2 * h);
  const dRdx = (R(x + h, y, z) - R(x - h, y, z)) / (2 * h);
  const dRdy = (R(x, y + h, z) - R(x, y - h, z)) / (2 * h);
  return { x: dRdy - dQdz, y: dPdz - dRdx, z: dQdx - dPdy };
}

export function gradient3D(f, x, y, z, h = 1e-6) {
  const F = f3(f);
  requireFn(F);
  return {
    x: (F(x + h, y, z) - F(x - h, y, z)) / (2 * h),
    y: (F(x, y + h, z) - F(x, y - h, z)) / (2 * h),
    z: (F(x, y, z + h) - F(x, y, z - h)) / (2 * h),
  };
}

// ── Campos conservativos y potencial escalar ──

// Campo (P,Q) conservativo ⇔ ∂P/∂y = ∂Q/∂x (dominio simplemente conexo).
// Se comprueba en el punto (x,y) de prueba.
export function isConservative2D(Fx, Fy, x = 0, y = 0, h = 1e-6) {
  const P = f2(Fx), Q = f2(Fy);
  requireFn(P, Q);
  const dPdy = (P(x, y + h) - P(x, y - h)) / (2 * h);
  const dQdx = (Q(x + h, y) - Q(x - h, y)) / (2 * h);
  return Math.abs(dPdy - dQdx) < 1e-6;
}

// Potencial escalar φ con ∇φ = (Fx,Fy), vía integral de línea por el camino
// (0,0)→(x,0)→(x,y): φ = ∫₀ˣ Fx(t,0) dt + ∫₀ʸ Fy(x,t) dt.
export function potentialFunction2D(Fx, Fy) {
  const P = f2(Fx), Q = f2(Fy);
  requireFn(P, Q);
  return (x, y) =>
    simpsonIntegral(t => P(t, 0), 0, x) + simpsonIntegral(t => Q(x, t), 0, y);
}

// ── Integrales de línea ──

// ∫_C f ds = ∫ f(x(t),y(t)) · |r'(t)| dt.
export function lineIntegralScalar(f, xExpr, yExpr, t0, t1, n = 1000) {
  const F = f2(f), x = p1(xExpr), y = p1(yExpr);
  requireFn(F, x, y);
  if (!Number.isFinite(t0) || !Number.isFinite(t1) || t0 >= t1)
    throw new RangeError('Se requieren límites finitos con t0 < t1');
  const g = t => F(x(t), y(t)) * Math.hypot(d1(x, t), d1(y, t));
  return simpsonIntegral(g, t0, t1, n);
}

// ∫_C F·dr = ∫ [Fx(x,y)·x' + Fy(x,y)·y'] dt.
export function lineIntegralVector(Fx, Fy, xExpr, yExpr, t0, t1, n = 1000) {
  const P = f2(Fx), Q = f2(Fy), x = p1(xExpr), y = p1(yExpr);
  requireFn(P, Q, x, y);
  if (!Number.isFinite(t0) || !Number.isFinite(t1) || t0 >= t1)
    throw new RangeError('Se requieren límites finitos con t0 < t1');
  const g = t => P(x(t), y(t)) * d1(x, t) + Q(x(t), y(t)) * d1(y, t);
  return simpsonIntegral(g, t0, t1, n);
}

// ── Teoremas integrales (región rectangular [x1,x2]×[y1,y2]) ──

// Green: ∮ P dx + Q dy = ∬ (∂Q/∂x − ∂P/∂y) dA.
export function greenLineIntegral(P, Q, x1, x2, y1, y2, nx = 100, ny = 100) {
  const p = f2(P), q = f2(Q);
  requireFn(p, q);
  const integrand = (x, y) =>
    (q(x + 1e-6, y) - q(x - 1e-6, y)) / 2e-6 -
    (p(x, y + 1e-6) - p(x, y - 1e-6)) / 2e-6;
  return midpointIntegral2D(integrand, x1, x2, y1, y2, nx, ny);
}

// Gauss (flujo 2D): ∮ F·n ds = ∬ (∂Fx/∂x + ∂Fy/∂y) dA.
export function fluxDivergenceTheorem(Fx, Fy, x1, x2, y1, y2, nx = 100, ny = 100) {
  const p = f2(Fx), q = f2(Fy);
  requireFn(p, q);
  const integrand = (x, y) =>
    (p(x + 1e-6, y) - p(x - 1e-6, y)) / 2e-6 +
    (q(x, y + 1e-6) - q(x, y - 1e-6)) / 2e-6;
  return midpointIntegral2D(integrand, x1, x2, y1, y2, nx, ny);
}

// Integral doble sobre un disco de radio R en coordenadas polares.
function integrateDisk(g, R, nr = 120, nt = 120) {
  const dr = R / nr, dt = 2 * Math.PI / nt;
  let s = 0;
  for (let i = 0; i < nr; i++) {
    const r = (i + 0.5) * dr;
    for (let j = 0; j < nt; j++) {
      const th = (j + 0.5) * dt;
      s += g(r * Math.cos(th), r * Math.sin(th)) * r;
    }
  }
  return s * dr * dt;
}

// Stokes para un disco en el plano xy (normal k, radio R):
// ∮ F·dr = ∬ (∂Fy/∂x − ∂Fx/∂y) dA.
export function stokesLineIntegral(Fx, Fy, Fz, R, nr = 120, nt = 120) {
  const P = f3(Fx), Q = f3(Fy), S = f3(Fz);
  requireFn(P, Q, S);
  const curlZ = (x, y) =>
    (Q(x + 1e-6, y, 0) - Q(x - 1e-6, y, 0)) / 2e-6 -
    (P(x, y + 1e-6, 0) - P(x, y - 1e-6, 0)) / 2e-6;
  return integrateDisk(curlZ, R, nr, nt);
}

// ── Geometría diferencial de curvas planas r(t) = (x(t), y(t)) ──

// Curvatura κ = |x'y'' − y'x''| / (x'² + y'²)^(3/2).
export function curvature(xExpr, yExpr, t, h = 1e-6) {
  const x = p1(xExpr), y = p1(yExpr);
  requireFn(x, y);
  const xp = d1(x, t), yp = d1(y, t);
  const xpp = d2(x, t), ypp = d2(y, t);
  const den = Math.pow(xp * xp + yp * yp, 1.5);
  return den < 1e-12 ? NaN : Math.abs(xp * ypp - yp * xpp) / den;
}

export function unitTangent(xExpr, yExpr, t, h = 1e-6) {
  const x = p1(xExpr), y = p1(yExpr);
  requireFn(x, y);
  const xp = d1(x, t), yp = d1(y, t);
  const m = Math.hypot(xp, yp);
  return m < 1e-12 ? { x: NaN, y: NaN } : { x: xp / m, y: yp / m };
}

export function unitNormal(xExpr, yExpr, t, h = 1e-6) {
  const T = unitTangent(xExpr, yExpr, t, h);
  return { x: -T.y, y: T.x };
}
