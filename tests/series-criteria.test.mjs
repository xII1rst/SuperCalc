import test from 'node:test';
import assert from 'node:assert/strict';
import { rootTest, integralTest, alternatingSeries } from '../js/math/series.mjs';

const close = (actual, expected, tol = 1e-9) => assert.ok(Math.abs(actual - expected) <= tol * Math.max(1, Math.abs(expected)), `${actual} ≠ ${expected}`);

test('criterio de la raíz en familias analíticas', () => {
  for (const [term, L, conclusion] of [['(n/(2n+1))^n', 0.5, 'converge'], ['3^n/n^2', 3, 'diverge'], ['1/n^n', 0, 'converge'], ['n^2/2^n', 0.5, 'converge'], ['((n+1)/n)^n', 1, 'inconcluso']]) {
    const r = rootTest(term);
    assert.equal(r.proof, 'analytic', term);
    close(r.L, L);
    assert.equal(r.conclusion, conclusion, term);
  }
  const sampled = rootTest('sin(n)^2/n');
  assert.equal(sampled.conclusion, 'inconcluso');
  assert.notEqual(sampled.proof, 'analytic');
  assert.equal(rootTest('x^n').conclusion, 'inconcluso');
});

test('criterio de la integral: familia c·nᵃ(ln n)ᵇ, cocientes y primitivas', () => {
  const cases = [
    ['1/(n*ln(n))', 'diverge', 'ln(ln(x))', null],
    ['1/(n*ln(n)^2)', 'converge', '−1/ln(x)', 1 / Math.log(2)],
    ['1/(n*ln(n)^3)', 'converge', null, 1 / (2 * Math.log(2) ** 2)],
    ['ln(n)/n^2', 'converge', null, null],
    ['1/sqrt(n)', 'diverge', '2·x^(1/2)', null],
    ['1/n^2', 'converge', '−1/x', 1],
    ['3/n^3', 'converge', '−3/(2·x^2)', 1.5],
    ['1/(n^2+1)', 'converge', 'atan(x)', Math.PI / 4],
    ['n/(n^2+1)', 'diverge', null, null],
    ['n', 'diverge', null, null],
  ];
  for (const [term, conclusion, antiderivative, integral] of cases) {
    const r = integralTest(term, 1);
    assert.equal(r.conclusion, conclusion, term);
    assert.equal(r.proof, 'analytic', term);
    if (antiderivative) assert.equal(r.antiderivative, antiderivative, term);
    if (integral !== null) close(r.integral, integral);
  }
  const lnTwo = integralTest('1/(n*ln(n)^2)', 1);
  assert.equal(lnTwo.from, 2, 'ln n exige n ≥ 2');
  assert.match(lnTwo.hypothesis, /f′\(x\)/);
  // Primitiva simbólica con hipótesis muestreadas: se declara así.
  const gauss = integralTest('n*exp(-n^2)', 1);
  assert.equal(gauss.conclusion, 'converge');
  assert.equal(gauss.proof, 'analytic-sampled-hypotheses');
  close(gauss.integral, Math.exp(-1) / 2);
  assert.match(gauss.hypothesis, /muestreo/);
  assert.equal(integralTest('sin(n)^2/n^2', 1).conclusion, 'inconcluso');
  assert.equal(integralTest('1/n^2', 0).conclusion, 'inconcluso');
});

test('series alternantes: Leibniz, tipo de convergencia y cota del error', () => {
  const harmonic = alternatingSeries('1/n', 10);
  assert.equal(harmonic.conclusion, 'converge condicionalmente');
  close(harmonic.partialSum, 1627 / 2520);
  close(harmonic.bound, 1 / 11);
  assert.ok(Math.abs(Math.log(2) - harmonic.partialSum) <= harmonic.bound);
  assert.equal(alternatingSeries('1/n^2', 10).conclusion, 'converge absolutamente');
  assert.equal(alternatingSeries('1/sqrt(n)', 5).conclusion, 'converge condicionalmente');
  const log = alternatingSeries('ln(n)/n', 10);
  assert.equal(log.conclusion, 'converge condicionalmente');
  assert.equal(log.decreasingFrom, 3, 'ln n/n decrece desde n = 3 > e');
  assert.equal(alternatingSeries('n/(n+1)', 10).conclusion, 'diverge');
  assert.equal(alternatingSeries('2^n/n^2', 10).conclusion, 'diverge');
  const unknown = alternatingSeries('1/ln(n+1)', 10);
  assert.equal(unknown.conclusion, 'inconcluso', 'fuera de familia: no se afirma convergencia');
  assert.match(alternatingSeries('-1/n', 3).steps.join(' '), /positivo/);
});
