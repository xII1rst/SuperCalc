import test from 'node:test';
import assert from 'node:assert/strict';
import {matGauss, matSpace} from '../js/math/algebra/matrix.mjs';

const close = (actual, expected) => assert.ok(Math.abs(actual-expected)<1e-8, `${actual} ≠ ${expected}`);

test('Álgebra 40: rango, nulidad, bases de imagen y núcleo de 3×4', () => {
  const A=[[1,2,0,1],[0,1,1,2],[1,3,1,3]];
  const result=matSpace(A);
  assert.equal(result.rank,2);
  assert.equal(result.nullity,2);
  assert.deepEqual(result.pivots,[0,1]);
  assert.deepEqual(result.columnBasis,[[1,0,1],[2,1,3]]);
  assert.equal(result.kernelBasis.length,2);
  for (const vector of result.kernelBasis) {
    A.forEach(row=>close(row.reduce((sum,value,i)=>sum+value*vector[i],0),0));
  }
  assert.equal(matGauss(result.columnBasis[0].map((v,i)=>[v,result.columnBasis[1][i]]),[0,0,0]).rankA,2);
});

test('espacios nulos, bases completas y sistema incompatible conservan el núcleo', () => {
  const zero=matSpace([[0,0,0],[0,0,0]]);
  assert.equal(zero.rank,0);
  assert.equal(zero.nullity,3);
  assert.deepEqual(zero.columnBasis,[]);
  assert.deepEqual(zero.kernelBasis,[[1,0,0],[0,1,0],[0,0,1]]);
  const identity=matSpace([[1,0],[0,1]]);
  assert.equal(identity.rank,2);
  assert.deepEqual(identity.kernelBasis,[]);
  const incompatible=matGauss([[1,1],[2,2]],[1,3]);
  assert.equal(incompatible.status,'inconsistent');
  assert.deepEqual(incompatible.nullspace,[[-1,1]]);
});
