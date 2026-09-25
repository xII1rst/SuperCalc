import test from 'node:test';
import assert from 'node:assert/strict';
import { riemannSum, trapezoidalRule, improperIntegral } from '../js/math/numeric.mjs';

const close = (a, b, tol = 1e-4) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);

test('suma de Riemann (izquierda, derecha y punto medio)', () => {
  const id = (x) => x;
  assert.equal(riemannSum(id, 0, 1, 1000, 'midpoint'), 0.5);
  assert.equal(riemannSum(id, 0, 1, 4, 'left'), 0.375);
  assert.equal(riemannSum(id, 0, 1, 4, 'right'), 0.625);
  close(riemannSum(id, 0, 1, 1000, 'left'), 0.4995);
  close(riemannSum(id, 0, 1, 1000, 'right'), 0.5005);
});

test('suma de Riemann rechaza entradas inválidas', () => {
  assert.throws(() => riemannSum((x) => x, 1, 0, 10), RangeError);
  assert.throws(() => riemannSum('nope', 0, 1, 10), TypeError);
  assert.throws(() => riemannSum((x) => x, 0, 1, 0), RangeError);
});

test('regla del trapecio', () => {
  const sq = (x) => x * x;
  close(trapezoidalRule(sq, 0, 1, 1000), 1 / 3);
  const id = (x) => x;
  close(trapezoidalRule(id, 0, 1, 1000), 0.5);
});

test('integral impropia tipo I (intervalo infinito)', () => {
  const invSq = (x) => 1 / (x * x);
  const expNeg = (x) => Math.exp(-x);
  const gauss = (x) => Math.exp(-x * x);

  const a = improperIntegral(invSq, 1, Infinity);
  assert.equal(a.type, 'I');
  assert.equal(a.converged, true);
  close(a.value, 1);

  const b = improperIntegral(expNeg, 0, Infinity);
  assert.equal(b.converged, true);
  close(b.value, 1);

  const c = improperIntegral(gauss, -Infinity, Infinity);
  assert.equal(c.converged, true);
  close(c.value, Math.sqrt(Math.PI));

  const d = improperIntegral(invSq, -Infinity, -1);
  assert.equal(d.converged, true);
  close(d.value, 1);
});

test('integral impropia tipo II (integrando no acotado)', () => {
  const invSqrt = (x) => 1 / Math.sqrt(x);
  const ln = (x) => Math.log(x);

  const a = improperIntegral(invSqrt, 0, 1);
  assert.equal(a.type, 'II');
  assert.equal(a.converged, true);
  close(a.value, 2);

  const b = improperIntegral(ln, 0, 1);
  assert.equal(b.converged, true);
  close(b.value, -1);
});

test('detecta integrales impropias divergentes', () => {
  const invX = (x) => 1 / x;
  assert.equal(improperIntegral(invX, 1, Infinity).converged, false);
  assert.equal(improperIntegral(invX, 0, 1).converged, false);
});
