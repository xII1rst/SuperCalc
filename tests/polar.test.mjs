import test from 'node:test';
import assert from 'node:assert/strict';
import {
  polarToCartesian, cartesianToPolar, polarArea, polarArcLength, polarSlope,
} from '../js/math/polar.mjs';

const close = (a, b, tol = 1e-4) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);

test('conversión polar → cartesiana', () => {
  close(polarToCartesian(1, 0).x, 1);
  close(polarToCartesian(1, 0).y, 0);
  close(polarToCartesian(1, Math.PI / 2).x, 0);
  close(polarToCartesian(1, Math.PI / 2).y, 1);
});

test('conversión cartesiana → polar', () => {
  close(cartesianToPolar(1, 0).r, 1);
  close(cartesianToPolar(1, 0).theta, 0);
  close(cartesianToPolar(0, 1).r, 1);
  close(cartesianToPolar(0, 1).theta, Math.PI / 2);
});

test('área del círculo unitario en polares', () => {
  close(polarArea('1', 0, 2 * Math.PI), Math.PI, 1e-3);
});

test('longitud de arco de la circunferencia r=1', () => {
  close(polarArcLength('1', 0, 2 * Math.PI), 2 * Math.PI, 1e-3);
});

test('pendiente de la tangente en polares', () => {
  // r=1 es la circunferencia unitaria; en θ=π/4 la tangente tiene pendiente −1.
  const s = polarSlope('1', Math.PI / 4);
  close(s.r, 1);
  close(s.slope, -1);
});

test('rechaza entradas inválidas', () => {
  assert.throws(() => polarArea('1', 1, 0), RangeError);
  assert.throws(() => polarArcLength('nope', 0, 1), TypeError);
});
