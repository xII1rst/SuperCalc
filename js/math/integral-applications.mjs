// Aplicaciones de la integral definida: área entre curvas, longitud de arco,
// superficie de revolución, trabajo, fuerza hidrostática, centroides y teoremas
// de Pappus. Sin DOM; las funciones siguen la convención fn(x, 0).

import { simpsonIntegral } from './calculus.mjs';

function requireFn(fn) {
  if (typeof fn !== 'function') throw new TypeError('Ingresa una función válida');
}

function deriv(fn, x, h = 1e-6) {
  return (fn(x + h, 0) - fn(x - h, 0)) / (2 * h);
}

function checkLimits(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b)
    throw new RangeError('Se requieren límites finitos con a < b');
}

// Área entre dos curvas: ∫ₐᵇ (f(x) − g(x)) dx.
export function areaBetweenCurves(fTop, fBottom, a, b, n = 1000) {
  requireFn(fTop); requireFn(fBottom); checkLimits(a, b);
  return simpsonIntegral(x => fTop(x, 0) - fBottom(x, 0), a, b, n);
}

// Longitud de arco: L = ∫ √(1 + f'(x)²) dx.
export function arcLength(fn, a, b, n = 1000) {
  requireFn(fn); checkLimits(a, b);
  return simpsonIntegral(x => Math.sqrt(1 + deriv(fn, x) ** 2), a, b, n);
}

// Área de superficie de revolución alrededor del eje X:
// S = 2π ∫ |f(x)| √(1 + f'(x)²) dx.
export function surfaceAreaOfRevolution(fn, a, b, n = 1000) {
  requireFn(fn); checkLimits(a, b);
  return simpsonIntegral(x => 2 * Math.PI * Math.abs(fn(x, 0)) * Math.sqrt(1 + deriv(fn, x) ** 2), a, b, n);
}

// Trabajo con fuerza constante: W = F·d.
export function workConstantForce(F, d) {
  return F * d;
}

// Trabajo de un resorte (ley de Hooke): W = ∫ₓ₁ˣ² kx dx.
export function workSpring(k, x1, x2) {
  if (!Number.isFinite(k) || !Number.isFinite(x1) || !Number.isFinite(x2))
    throw new RangeError('Se requieren valores finitos');
  return 0.5 * k * (x2 * x2 - x1 * x1);
}

// Trabajo con fuerza variable: W = ∫ₐᵇ F(x) dx.
export function workVariable(forceFn, a, b, n = 1000) {
  requireFn(forceFn); checkLimits(a, b);
  return simpsonIntegral(forceFn, a, b, n);
}

// Fuerza hidrostática sobre una placa vertical: F = ρ ∫ₐᵇ h(x)·w(x) dx,
// con h(x) la profundidad y w(x) el ancho de la placa a la altura x.
export function fluidForce(weightDensity, depthFn, widthFn, a, b, n = 1000) {
  requireFn(depthFn); requireFn(widthFn); checkLimits(a, b);
  if (!Number.isFinite(weightDensity))
    throw new RangeError('La densidad de peso debe ser finita');
  return simpsonIntegral(x => weightDensity * depthFn(x, 0) * widthFn(x, 0), a, b, n);
}

// Centroide de la región bajo y = f(x) en [a,b] (f ≥ 0).
export function centroidRegion(fn, a, b, n = 1000) {
  requireFn(fn); checkLimits(a, b);
  const area = simpsonIntegral(fn, a, b, n);
  const my = simpsonIntegral(x => x * fn(x, 0), a, b, n);        // momento respecto a y
  const mx = simpsonIntegral(x => 0.5 * fn(x, 0) ** 2, a, b, n); // momento respecto a x
  return { area, xbar: my / area, ybar: mx / area };
}

// Primer teorema de Pappus: volumen = 2π · distancia al eje · área.
export function pappusVolume(area, distanceToAxis) {
  return 2 * Math.PI * distanceToAxis * area;
}

// Segundo teorema de Pappus: superficie = 2π · distancia · longitud de arco.
export function pappusSurfaceArea(arcLength, distanceToAxis) {
  return 2 * Math.PI * distanceToAxis * arcLength;
}
