import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gramSchmidt, coordinatesInBasis, changeOfBasis, projectOntoSpan,
  linearTransformation, representationInBases, diagonalizeReal, matrixPowerByDiagonalization,
} from '../js/math/algebra/linear-spaces.mjs';
import {matMul} from '../js/math/algebra/matrix.mjs';

const close = (actual,expected) => assert.ok(Math.abs(actual-expected)<1e-8,`${actual} ≠ ${expected}`);
const closeMatrix = (actual,expected) => actual.forEach((row,i)=>row.forEach((value,j)=>close(value,expected[i][j])));

test('Álgebra 29 y 30: coordenadas en una base y Gram-Schmidt',()=>{
  assert.deepEqual(coordinatesInBasis([[1,1],[1,-1]],[3,1]).coordinates,[2,1]);
  const orthogonal=gramSchmidt([[1,1,0],[1,0,1]]);
  assert.equal(orthogonal.rank,2);
  close(orthogonal.orthogonal[0].reduce((sum,value,i)=>sum+value*orthogonal.orthogonal[1][i],0),0);
  orthogonal.orthonormal.forEach(vector=>close(Math.hypot(...vector),1));
  assert.deepEqual(gramSchmidt([[1,2],[2,4]]).dependent,[1]);
});

test('Álgebra 38 y 45: matriz de cambio de base y proyección',()=>{
  const first=[[1,2],[0,1]], second=[[1,1],[2,3]];
  const change=changeOfBasis(first,second);
  closeMatrix(matMul(change.to,change.matrix),change.from);
  close(change.residual,0);
  const projection=projectOntoSpan([1,2,3],[[1,0,1],[0,1,1]]);
  projection.projection.forEach((value,i)=>close(value,[1,2,3][i]));
  close(projection.distance,0);
});

test('Álgebra 32 y 48: imagen de T, núcleo y matriz entre bases',()=>{
  const A=[[1,0,3],[2,1,-1]];
  const transformed=linearTransformation(A,[2,-1,4]);
  assert.deepEqual(transformed.output,[14,-1]);
  assert.equal(transformed.spaces.rank,2);
  assert.equal(transformed.spaces.nullity,1);
  const other=representationInBases([[2,1],[1,-1]],[[1,1],[0,1]],[[1,0],[0,1]]);
  closeMatrix(other.matrix,[[3,1],[0,-1]]);
});

test('Álgebra 34 y 37: diagonalización verifica AP=PD y calcula A⁵',()=>{
  const symmetric=diagonalizeReal([[1,2],[2,1]]);
  assert.equal(symmetric.status,'diagonalized');
  closeMatrix(matMul([[1,2],[2,1]],symmetric.P),matMul(symmetric.P,symmetric.D));
  close(symmetric.residual,0);
  const power=matrixPowerByDiagonalization([[3,1],[0,2]],5);
  assert.equal(power.status,'diagonalized');
  closeMatrix(power.value,[[243,211],[0,32]]);
  closeMatrix(matrixPowerByDiagonalization([[3,1],[0,2]],0).value,[[1,0],[0,1]]);
});

test('bases singulares y matrices no diagonalizables dan un estado explícito',()=>{
  assert.throws(()=>coordinatesInBasis([[1,1],[2,2]],[3,3]),RangeError);
  assert.throws(()=>changeOfBasis([[1,0],[2,0]],[[1,0],[0,1]]),RangeError);
  assert.equal(diagonalizeReal([[1,1],[0,1]]).status,'unsupported');
  assert.throws(()=>matrixPowerByDiagonalization([[1,0],[0,1]],-1),RangeError);
});
