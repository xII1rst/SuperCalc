import test from 'node:test';
import assert from 'node:assert/strict';
import {affineParameterSystem,similarityMatrix} from '../js/math/algebra/parameter-systems.mjs';
import {matMul} from '../js/math/algebra/matrix.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('Álgebra 24: sistema con parámetros a y b se divide en tres casos',()=>{
  const result=affineParameterSystem([[1,1,1],[1,2,3],[1,3,0]],[[0,0,0],[0,0,0],[0,0,1]],
    [1,2,0],[0,0,1]);
  assert.equal(result.status,'classified');assert.equal(result.critical.length,1);
  near(result.critical[0].t,5);near(result.critical[0].compatibleU,3);
  assert.equal(result.critical[0].compatibility,'only_at_u');
  assert.equal(result.critical[0].rankA,2);
  assert.equal(result.critical[0].nullspace.length,1);
  assert.equal(result.generic.status,'unique');
});

test('Álgebra 47: semejanza produce P verificable',()=>{
  const A=[[1,2],[0,3]],B=[[3,0],[0,1]];
  const result=similarityMatrix(A,B);
  assert.equal(result.status,'similar');near(result.residual,0);
  const transformed=matMul(matMul(result.inverseP,A),result.P);
  transformed.forEach((row,i)=>row.forEach((value,j)=>near(value,B[i][j])));
  assert.equal(similarityMatrix(A,[[2,0],[0,4]]).status,'not_similar');
});
