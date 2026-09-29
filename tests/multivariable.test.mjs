import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mixedPartial, partial3D, multivariableLimit, directionalDerivative,
  criticalPoints2D, lagrangeMultipliers, doubleIntegralPolar, tripleIntegral,
  jacobian2D, centerOfMass2D,
} from '../js/math/multivariable.mjs';

const close = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);

test('derivada parcial mixta ∂²/∂y∂x de x²y es 2x', () => {
  assert.equal(mixedPartial('x^2*y', 1, 1), '2x');
});

test('derivada parcial 3D respecto de y', () => {
  assert.equal(partial3D('x^2*y', 'y'), 'x^2');
});

test('límite multivariable que no existe: (x²−y²)/(x²+y²) en (0,0)', () => {
  const r = multivariableLimit('(x^2-y^2)/(x^2+y^2)', 0, 0);
  assert.equal(r.exists, false);
  assert.equal(r.status, 'disproved');
});

test('caminos coincidentes no prueban el límite multivariable', () => {
  const r = multivariableLimit('x^2*y/(x^2+y^2)', 0, 0);
  assert.equal(r.exists, null);
  assert.equal(r.status, 'undetermined');
  assert.ok(r.paths.every(path => path.formalValue === 0));
});

test('caminos con límites analíticos distintos refutan xy/(x²+y²)', () => {
  const r = multivariableLimit('x*y/(x^2+y^2)', 0, 0);
  assert.equal(r.status, 'disproved');
  assert.equal(r.paths[0].formalValue, 0);
  assert.equal(r.paths[2].formalValue, 0.5);
});

test('sustitución directa prueba un cociente continuo en el punto', () => {
  const r = multivariableLimit('(x^2+y)/(x+y)', 1, 2);
  assert.equal(r.status, 'proved');
  assert.equal(r.value, 1);
});

test('no infiere continuidad de una potencia con exponente variable en el origen', () => {
  const r = multivariableLimit('x^y', 0, 0);
  assert.equal(r.status, 'undetermined');
});

test('derivada direccional de x²+y² en dirección (1,0)', () => {
  close(directionalDerivative('x^2+y^2', 1, 0, { x: 1, y: 0 }), 2);
});

test('punto crítico mínimo de x²+y²', () => {
  const pts = criticalPoints2D('x^2+y^2', -2, 2, -2, 2);
  assert.equal(pts.length, 1);
  close(pts[0].x, 0); close(pts[0].y, 0);
  assert.equal(pts[0].type, 'mínimo');
});

test('punto crítico silla de x²−y²', () => {
  const pts = criticalPoints2D('x^2-y^2', -2, 2, -2, 2);
  assert.equal(pts.length, 1);
  assert.equal(pts[0].type, 'silla');
});

test('multiplicadores de Lagrange: mín de x²+y² sujeto a x+y=1', () => {
  const sol = lagrangeMultipliers('x^2+y^2', 'x+y', 1, -2, 2, -2, 2);
  assert.equal(sol.length, 1);
  close(sol[0].x, 0.5); close(sol[0].y, 0.5);
  close(sol[0].lambda, 1);
});

test('integral doble polar de f=1 sobre el disco unitario = π', () => {
  close(doubleIntegralPolar('1', 0, 1, 0, 2 * Math.PI), Math.PI, 1e-3);
});

test('integral triple de f=1 sobre el cubo unitario = 1', () => {
  close(tripleIntegral('1', 0, 1, 0, 1, 0, 1), 1);
});

test('jacobiano de coordenadas polares (u=r, v=θ) es r', () => {
  close(jacobian2D('u*cos(v)', 'u*sin(v)', 2, 0.5), 2);
});

test('centro de masa de lámina uniforme sobre [0,1]²', () => {
  const c = centerOfMass2D('1', 0, 1, 0, 1);
  close(c.mass, 1);
  close(c.x, 0.5); close(c.y, 0.5);
});

test('rechaza expresiones inválidas', () => {
  assert.equal(mixedPartial('x^', 1, 1) === null || typeof mixedPartial('x^', 1, 1) === 'string', true);
  assert.throws(() => tripleIntegral('x^', 0, 1, 0, 1, 0, 1), TypeError);
});
