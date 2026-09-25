import test from 'node:test';
import assert from 'node:assert/strict';

import {
  matAdd,
  matDet,
  matInv,
  matMul,
  matScale,
  matTranspose,
  matGauss,
  matCramer,
  matEigenAll,
  toFrac2,
} from '../js/math/algebra/matrix.mjs';

test('multiplicación y dimensiones incompatibles', () => {
  assert.deepEqual(matMul([[1, 2, 3], [4, 5, 6]], [[7, 8], [9, 10], [11, 12]]),
    [[58, 64], [139, 154]]);
  assert.equal(matMul([[1, 2]], [[3, 4]]), null);
});

test('suma, resta y dimensiones incompatibles', () => {
  const A = [[1, 2], [3, 4]];
  const B = [[5, 6], [7, 8]];
  assert.deepEqual(matAdd(A, B), [[6, 8], [10, 12]]);
  assert.deepEqual(matAdd(A, B, -1), [[-4, -4], [-4, -4]]);
  assert.equal(matAdd(A, [[1, 2, 3]]), null);
});

test('escalar y transposición no modifican la entrada', () => {
  const A = [[1, 2, 3], [4, 5, 6]];
  assert.deepEqual(matScale(A, 2), [[2, 4, 6], [8, 10, 12]]);
  assert.deepEqual(matTranspose(A), [[1, 4], [2, 5], [3, 6]]);
  assert.deepEqual(A, [[1, 2, 3], [4, 5, 6]]);
});

test('determinante de matrices de orden 1, 2 y 3', () => {
  assert.equal(matDet([[7]]), 7);
  assert.equal(matDet([[1, 2], [3, 4]]), -2);
  assert.equal(matDet([[6, 1, 1], [4, -2, 5], [2, 8, 7]]), -306);
});

test('inversa, pivoteo y matriz singular', () => {
  const A = [[0, 2], [1, 3]];
  assert.deepEqual(matInv(A), [[-1.5, 1], [0.5, 0]]);
  assert.deepEqual(A, [[0, 2], [1, 3]]);
  assert.equal(matInv([[1, 2], [2, 4]]), null);
});

test('fracciones, Gauss-Jordan, Cramer y eigenvalor simple', () => {
  const A = [[2, 1], [1, -1]];
  const b = [5, 1];
  assert.deepEqual(toFrac2(0.5), [1, 2]);
  assert.deepEqual(matGauss(A, b).sol, [[2, 1], [1, 1]]);
  assert.deepEqual(matCramer(A, b), [2, 1]);
  assert.equal(matCramer([[1, 2], [2, 4]], [1, 2]), null);
  assert.equal(matEigenAll([[2]])[0].lam, 2);
  assert.deepEqual(A, [[2, 1], [1, -1]]);
});

test('la matriz nula no produce eigenvectores NaN', () => {
  const pairs=matEigenAll([[0,0],[0,0]]);
  assert.equal(pairs.length,2);
  for(const {lam,vec} of pairs){
    assert.equal(lam,0);
    assert.ok(vec.every(Number.isFinite));
  }
});
