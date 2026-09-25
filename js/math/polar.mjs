// Coordenadas polares: conversión cartesiana, área, longitud de arco y pendiente
// de la tangente. Sin DOM; el ángulo se expresa con la variable 't'.

import { calcParse, simpsonIntegral } from './calculus.mjs';

function parse(rExpr) {
  return calcParse(rExpr, 't');
}

function requireFn(fn) {
  if (typeof fn !== 'function') throw new TypeError('Ingresa una función válida');
}

function deriv(fn, t, h = 1e-6) {
  return (fn(t + h, 0) - fn(t - h, 0)) / (2 * h);
}

export function polarToCartesian(r, theta) {
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
}

export function cartesianToPolar(x, y) {
  return { r: Math.hypot(x, y), theta: Math.atan2(y, x) };
}

// Área polar: A = (1/2) ∫ r(θ)² dθ.
export function polarArea(rExpr, a, b, n = 1000) {
  const r = parse(rExpr);
  requireFn(r);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b)
    throw new RangeError('Se requieren límites finitos con a < b');
  const g = t => 0.5 * r(t, 0) ** 2;
  return simpsonIntegral(g, a, b, n);
}

// Longitud de arco polar: L = ∫ √( r² + (dr/dθ)² ) dθ.
export function polarArcLength(rExpr, a, b, n = 1000) {
  const r = parse(rExpr);
  requireFn(r);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b)
    throw new RangeError('Se requieren límites finitos con a < b');
  const g = t => Math.sqrt(r(t, 0) ** 2 + deriv(r, t) ** 2);
  return simpsonIntegral(g, a, b, n);
}

// Pendiente de la tangente en polares:
// dy/dx = (r' sin θ + r cos θ) / (r' cos θ − r sin θ).
export function polarSlope(rExpr, theta, h = 1e-6) {
  const r = parse(rExpr);
  requireFn(r);
  const rv = r(theta, 0);
  const rp = deriv(r, theta, h);
  const num = rp * Math.sin(theta) + rv * Math.cos(theta);
  const den = rp * Math.cos(theta) - rv * Math.sin(theta);
  const slope = Math.abs(den) < 1e-12
    ? (num === 0 ? NaN : (num > 0 ? Infinity : -Infinity))
    : num / den;
  return { r: rv, drdt: rp, slope };
}
