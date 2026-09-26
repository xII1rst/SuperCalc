import test from 'node:test';
import assert from 'node:assert/strict';
import {
  divergence, curl, gradient3D,
  isConservative2D, potentialFunction2D,
  lineIntegralScalar, lineIntegralVector,
  greenLineIntegral, fluxDivergenceTheorem, stokesLineIntegral,
  curvature, unitTangent, unitNormal,
} from '../js/math/vector-calculus.mjs';

const close = (a, b, tol = 1e-4) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);
const close3 = (v, x, y, z, tol = 1e-4) => {
  close(v.x, x, tol); close(v.y, y, tol); close(v.z, z, tol);
};

test('divergencia de (x, y, z) es 3', () => {
  close(divergence('x', 'y', 'z', 1, 2, 3), 3);
});

test('rotacional de (-y, x, 0) es (0, 0, 2)', () => {
  close3(curl('-y', 'x', '0', 1, 2, 3), 0, 0, 2);
});

test('gradiente 3D de x²+y²+z² es (2x, 2y, 2z)', () => {
  close3(gradient3D('x^2+y^2+z^2', 1, 1, 1), 2, 2, 2);
});

test('campo (y, x) es conservativo; (y, -x) no lo es', () => {
  assert.equal(isConservative2D('y', 'x'), true);
  assert.equal(isConservative2D('y', '-x'), false);
});

test('potencial de (y, x) es φ = xy', () => {
  const phi = potentialFunction2D('y', 'x');
  close(phi(2, 3), 6);
});

test('potencial de (2x, 2y) es φ = x²+y²', () => {
  const phi = potentialFunction2D('2x', '2y');
  close(phi(1, 1), 2);
});

test('integral de línea escalar f=1 sobre la circunferencia unidad = 2π', () => {
  close(lineIntegralScalar('1', 'cos(t)', 'sin(t)', 0, 2 * Math.PI), 2 * Math.PI, 1e-3);
});

test('integral de línea vectorial de (x, y) a lo largo de y=0, x∈[0,1] = 1/2', () => {
  close(lineIntegralVector('x', 'y', 't', '0', 0, 1), 0.5);
});

test('teorema de Green: ∮ x dy sobre el cuadrado unidad = 1', () => {
  close(greenLineIntegral('0', 'x', 0, 1, 0, 1), 1);
});

test('teorema de la divergencia 2D: flujo de (x, y) sobre el cuadrado unidad = 2', () => {
  close(fluxDivergenceTheorem('x', 'y', 0, 1, 0, 1), 2);
});

test('teorema de Stokes: (-y, x, 0) sobre disco unitario = 2π', () => {
  close(stokesLineIntegral('-y', 'x', '0', 1), 2 * Math.PI, 1e-3);
});

test('curvatura de la circunferencia unidad es 1', () => {
  close(curvature('cos(t)', 'sin(t)', 0), 1);
});

test('tangente y normal unitarias de la circunferencia', () => {
  const T = unitTangent('cos(t)', 'sin(t)', 0);
  close(T.x, 0, 1e-3); close(T.y, 1, 1e-3);
  const N = unitNormal('cos(t)', 'sin(t)', 0);
  close(N.x, -1, 1e-3); close(N.y, 0, 1e-3);
});

test('rechaza expresiones inválidas', () => {
  assert.throws(() => divergence('x', 'y', 'nope^', 0, 0, 0), TypeError);
  assert.throws(() => lineIntegralScalar('1', 'cos(t)', 'sin(t)', 2, 1), RangeError);
});
