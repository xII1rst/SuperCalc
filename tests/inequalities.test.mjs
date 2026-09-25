import test from 'node:test';
import assert from 'node:assert/strict';
import {
  flipSym, checkIneq, ineqLinearBound, ineqIntersect, ineqEval, signTableSolve,
  solveFreeInequality, solveQuadraticInequality, solveRationalInequality,
  solveSystemInequality, solveAbsoluteInequality,
} from '../js/math/algebra/inequalities.mjs';

test('operaciones puras para inecuaciones', () => {
  assert.equal(flipSym('<'), '>');
  assert.equal(checkIneq(2,'≥',2), true);
  assert.deepEqual(ineqLinearBound(-2,1,5,'<'), {val:-2,sym:'>'});
  assert.equal(ineqIntersect({val:1,sym:'>'},{val:3,sym:'<'}), '(1, 3)');
  assert.equal(ineqIntersect({val:0,sym:'≥'},{val:1,sym:'>'}), '(1, +∞)');
  assert.equal(ineqIntersect({val:1,sym:'≥'},{val:1,sym:'<'}), null);
  assert.equal(ineqIntersect({val:1,sym:'≥'},{val:1,sym:'≤'}), '[1, 1]');
  assert.equal(ineqEval('x^2+3x',2), 10);
  assert.equal(signTableSolve([1],[2],1,1,'>'), '(-∞, 1) ∪ (2, +∞)');
});

test('los cinco solvers se ejecutan sin DOM', () => {
  assert.match(solveFreeInequality('x-1','0','<').sol,/\(-∞, 1\)/);
  assert.equal(solveQuadraticInequality(1,-3,2,'<').sol,'(1, 2)');
  assert.equal(solveQuadraticInequality(1,-2,1,'≥').sol,'x ∈ ℝ');
  assert.equal(solveQuadraticInequality(-1,2,-1,'≤').sol,'x ∈ ℝ');
  assert.equal(solveQuadraticInequality(-1,2,-1,'≥').sol,'x = 1');
  assert.match(solveRationalInequality('x-1','x-2','>').sol,/\(2, \+∞\)/);
  assert.equal(solveSystemInequality(
    {a:1,b:0,c:1,sym:'>'},{a:1,b:0,c:3,sym:'<'},
  ).sol,'(1, 3)');
  assert.equal(solveAbsoluteInequality(2,-1,5,'<').sol,'(-2, 3)');
});
