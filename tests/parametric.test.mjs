import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parametricSlope, parametricArcLength, parametricArea, parametricSurfaceArea,
} from '../js/math/parametric.mjs';

const close = (a, b, tol = 1e-4) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);

test('pendiente paramétrica dy/dx = (dy/dt)/(dx/dt)', () => {
  // x=t, y=t² → dy/dx = 2t.
  const s = parametricSlope('t', 't^2', 1);
  close(s.dxdt, 1);
  close(s.dydt, 2);
  close(s.slope, 2);
});

test('pendiente vertical cuando dx/dt = 0', () => {
  // x = cos t, y = sin t en t=0: dx/dt=0, dy/dt=1 → tangente vertical.
  const s = parametricSlope('cos(t)', 'sin(t)', 0);
  assert.equal(s.slope, Infinity);
});

test('longitud de arco de la circunferencia unidad', () => {
  const L = parametricArcLength('cos(t)', 'sin(t)', 0, 2 * Math.PI);
  close(L, 2 * Math.PI, 1e-3);
});

test('área bajo la curva paramétrica', () => {
  // x=t, y=t en [0,1] → ∫ t·1 dt = 1/2.
  close(parametricArea('t', 't', 0, 1), 0.5);
});

test('área de superficie de una esfera (rotación de la semicircunferencia)', () => {
  const S = parametricSurfaceArea('cos(t)', 'sin(t)', 0, Math.PI);
  close(S, 4 * Math.PI, 1e-3);
});

test('rechaza entradas inválidas', () => {
  assert.throws(() => parametricArcLength('t', 't', 1, 0), RangeError);
  assert.throws(() => parametricSlope('nope', 't', 0), TypeError);
});
