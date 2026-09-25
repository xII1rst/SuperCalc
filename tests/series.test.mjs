import test from 'node:test';
import assert from 'node:assert/strict';
import {
  taylorSeries, geometricSeries, pSeries, ratioTest, nthTermTest,
} from '../js/math/series.mjs';

test('polinomio de Taylor/Maclaurin', () => {
  assert.equal(taylorSeries('sin(x)', 0, 5).polynomial, 'x - 1/6*x^3 + 1/120*x^5');
  assert.equal(taylorSeries('cos(x)', 0, 6).polynomial, '1 - 1/2*x^2 + 1/24*x^4 - 1/720*x^6');
  assert.equal(taylorSeries('e^x', 0, 4).polynomial, '1 + x + 1/2*x^2 + 1/6*x^3 + 1/24*x^4');
  assert.equal(taylorSeries('1/(1-x)', 0, 4).polynomial, '1 + x + x^2 + x^3 + x^4');
  assert.equal(taylorSeries('sqrt(1+x)', 0, 3).polynomial, '1 + 1/2*x - 1/8*x^2 + 1/16*x^3');
});

test('Taylor alrededor de un punto distinto de cero', () => {
  assert.equal(
    taylorSeries('ln(x)', 1, 4).polynomial,
    '(x - 1) - 1/2*(x - 1)^2 + 1/3*(x - 1)^3 - 1/4*(x - 1)^4'
  );
});

test('serie geométrica', () => {
  assert.deepEqual(geometricSeries(1, 0.5), { converges: true, sum: 2 });
  assert.deepEqual(geometricSeries(2, 0.5), { converges: true, sum: 4 });
  assert.equal(geometricSeries(1, 2).converges, false);
  assert.equal(geometricSeries(1, 2).sum, null);
  assert.equal(geometricSeries(1, -1).converges, false);
});

test('p-serie', () => {
  assert.equal(pSeries(2).converges, true);
  assert.equal(pSeries(1).converges, false);
  assert.equal(pSeries(0.5).converges, false);
});

test('prueba de la razón', () => {
  assert.equal(ratioTest('1/2^n').conclusion, 'converge');
  assert.equal(ratioTest('1/n^2').conclusion, 'inconcluso');
  assert.equal(ratioTest('1/n').conclusion, 'inconcluso');
});

test('prueba del término n-ésimo', () => {
  assert.equal(nthTermTest('n/(n+1)').conclusion, 'diverge');
  assert.equal(nthTermTest('n').conclusion, 'diverge');
  assert.equal(nthTermTest('1/n').conclusion, 'posible convergencia');
  assert.equal(nthTermTest('1/n^2').conclusion, 'posible convergencia');
});
