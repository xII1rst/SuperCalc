import test from 'node:test';
import assert from 'node:assert/strict';
import { binomialProbability, binomialSummary, combinations, diceSumDistribution, diceSumSummary } from '../js/math/probability.mjs';

test('combinaciones y binomial coinciden con casos conocidos', () => {
  assert.equal(combinations(5, 2), 10n);
  assert.equal(combinations(100, 0), 1n);
  assert.equal(binomialProbability(4, 2, 0.5), 0.375);
  const summary = binomialSummary(4, 2, 0.5);
  assert.equal(summary.combinations, 6n);
  assert.ok(Math.abs(summary.atMost - 11 / 16) < 1e-12);
  assert.ok(Math.abs(summary.atLeast - 11 / 16) < 1e-12);
  assert.equal(summary.expected, 2);
  assert.equal(summary.variance, 1);
  assert.equal(binomialProbability(10, 0, 0), 1);
  assert.equal(binomialProbability(10, 10, 1), 1);
  const large = binomialSummary(1000, 500, 0.5);
  assert.ok(Math.abs(large.atMost + large.atLeast - large.exact - 1) < 1e-10);
  assert.throws(() => combinations(5, 6), RangeError);
  assert.throws(() => binomialProbability(2, 1, 1.1), RangeError);
});

test('la distribución de dados cuenta todos los resultados y sus extremos', () => {
  const distribution = diceSumDistribution(2);
  assert.equal(distribution.length, 11);
  assert.equal(distribution.reduce((total, row) => total + row.ways, 0), 36);
  assert.ok(Math.abs(distribution.reduce((total, row) => total + row.probability, 0) - 1) < 1e-12);
  const seven = diceSumSummary(2, 7);
  assert.equal(seven.ways, 6);
  assert.equal(seven.probability, 1 / 6);
  assert.equal(seven.expected, 7);
  assert.equal(diceSumSummary(1, 6).ways, 1);
  assert.throws(() => diceSumSummary(2, 13), RangeError);
  assert.throws(() => diceSumDistribution(13), RangeError);
});
