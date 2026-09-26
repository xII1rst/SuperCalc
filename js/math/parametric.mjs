// Curvas paramétricas: pendiente dy/dx, longitud de arco, área bajo la curva y
// área de superficie de revolución. Sin DOM; el parámetro es 't'.

import { calcParse, collectVariables, simpsonIntegral } from './calculus.mjs';

function parse(expr) {
  if (collectVariables(expr).some(v => v !== 't')) return null;
  return calcParse(expr, 't');
}

function requireFn(fn) {
  if (typeof fn !== 'function') throw new TypeError('Ingresa una función válida');
}

// Derivada numérica centrada respecto del parámetro t.
function deriv(fn, t, h = 1e-6) {
  return (fn(t + h, 0) - fn(t - h, 0)) / (2 * h);
}

// dy/dx = (dy/dt) / (dx/dt) en t0. Devuelve también las derivadas por separado.
export function parametricSlope(xExpr, yExpr, t0, h = 1e-6) {
  const x = parse(xExpr), y = parse(yExpr);
  requireFn(x); requireFn(y);
  const dx = deriv(x, t0, h);
  const dy = deriv(y, t0, h);
  const slope = Math.abs(dx) < 1e-12
    ? (dy === 0 ? NaN : (dy > 0 ? Infinity : -Infinity))
    : dy / dx;
  return { dxdt: dx, dydt: dy, slope };
}

// Longitud de arco: L = ∫ √( (dx/dt)² + (dy/dt)² ) dt.
export function parametricArcLength(xExpr, yExpr, a, b, n = 1000) {
  const x = parse(xExpr), y = parse(yExpr);
  requireFn(x); requireFn(y);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b)
    throw new RangeError('Se requieren límites finitos con a < b');
  const g = t => Math.sqrt(deriv(x, t) ** 2 + deriv(y, t) ** 2);
  return simpsonIntegral(g, a, b, n);
}

// Área bajo la curva paramétrica: A = ∫ y(t)·x'(t) dt.
export function parametricArea(xExpr, yExpr, a, b, n = 1000) {
  const x = parse(xExpr), y = parse(yExpr);
  requireFn(x); requireFn(y);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b)
    throw new RangeError('Se requieren límites finitos con a < b');
  const g = t => y(t, 0) * deriv(x, t);
  return simpsonIntegral(g, a, b, n);
}

// Área de superficie al rotar alrededor del eje X:
// S = 2π ∫ |y(t)| √( (dx/dt)² + (dy/dt)² ) dt.
export function parametricSurfaceArea(xExpr, yExpr, a, b, n = 1000) {
  const x = parse(xExpr), y = parse(yExpr);
  requireFn(x); requireFn(y);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b)
    throw new RangeError('Se requieren límites finitos con a < b');
  const g = t => 2 * Math.PI * Math.abs(y(t, 0)) * Math.sqrt(deriv(x, t) ** 2 + deriv(y, t) ** 2);
  return simpsonIntegral(g, a, b, n);
}
