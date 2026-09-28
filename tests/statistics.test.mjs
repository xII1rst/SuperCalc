import test from 'node:test';
import assert from 'node:assert/strict';
import { histogram, parseDataset, percentile, summarizeDataset } from '../js/math/statistics.mjs';

test('resume una lista con medidas poblacionales y muestrales', () => {
  const summary = summarizeDataset(parseDataset('2, 4; 4 6\n9'));
  assert.equal(summary.count, 5);
  assert.equal(summary.sum, 25);
  assert.equal(summary.mean, 5);
  assert.equal(summary.median, 4);
  assert.deepEqual(summary.modes, [4]);
  assert.equal(summary.min, 2);
  assert.equal(summary.max, 9);
  assert.equal(summary.range, 7);
  assert.equal(summary.q1, 4);
  assert.equal(summary.q3, 6);
  assert.equal(summary.iqr, 2);
  assert.equal(summary.populationVariance, 5.6);
  assert.equal(summary.sampleVariance, 7);
});

test('trata un solo dato y rechaza listas inválidas', () => {
  const summary = summarizeDataset([3]);
  assert.equal(summary.median, 3);
  assert.deepEqual(summary.modes, []);
  assert.equal(summary.sampleVariance, null);
  for (const source of ['', '1, dos', '1, Infinity']) assert.throws(() => parseDataset(source));
  assert.throws(() => summarizeDataset([]), RangeError);
  assert.throws(() => summarizeDataset([1e308, 1e308]), RangeError);
});

test('interpola percentiles y agrupa extremos en el histograma', () => {
  assert.equal(percentile([4, 1, 3, 2], 25), 1.75);
  assert.equal(percentile([4, 1, 3, 2], 100), 4);
  assert.equal(percentile([7], 90), 7);
  assert.deepEqual(histogram([1, 1, 2, 2], 2).map(bin => bin.count), [2, 2]);
  assert.deepEqual(histogram([5, 5, 5]).map(bin => bin.count), [3]);
  assert.throws(() => histogram([5, 5, 5], 0), RangeError);
  assert.throws(() => percentile([1, 2], 101), RangeError);
  assert.throws(() => histogram([-1e308, 1e308]), RangeError);
});
