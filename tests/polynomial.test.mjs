import test from 'node:test';
import assert from 'node:assert/strict';

import { quadRoots, parseSimplePoly } from '../js/math/algebra/polynomial.mjs';

test('raíces y lectura de polinomios compartidas', () => {
  assert.deepEqual(quadRoots(1, -3, 2), [1, 2]);
  assert.deepEqual(quadRoots(0, 2, -4), [2]);
  assert.deepEqual(quadRoots(1, 0, 1), []);
  assert.deepEqual(parseSimplePoly('x^2-3x+2'), { a: 1, b: -3, c: 2 });
});
