import test from 'node:test';
import assert from 'node:assert/strict';
import {
  solveVectorEquation, parseVectorComponent, solveUnknownComponents,
} from '../js/math/algebra/vector-equations.mjs';

test('ecuación vectorial sin estado global ni DOM', () => {
  const vectors=[{nm:'A',vx:1,vy:2,vz:3},{nm:'B',vx:4,vy:5,vz:6}];
  assert.deepEqual(solveVectorEquation('A+B=x','x',vectors,3).res,{vx:5,vy:7,vz:9});
  assert.match(solveVectorEquation('A+B','x',vectors,3).err,/exactamente un/);
  assert.match(solveVectorEquation('A=x','A',vectors,3).err,/ya es un vector conocido/);
});

test('incógnita en componentes y errores de entrada', () => {
  const names=new Set();
  assert.deepEqual(parseVectorComponent('2x',names),{coef:2,const:0,varName:'x'});
  assert.deepEqual([...names],['x']);
  const vectors=[{nm:'A',comps:['3','5','0']},{nm:'B',comps:['5','x','0']}];
  assert.deepEqual(solveUnknownComponents(vectors,'·','0',3).vars,{x:-3});
  assert.match(solveUnknownComponents(vectors,'·','no',3).err,/numérico válido/);
  assert.match(solveUnknownComponents([
    {nm:'A',comps:['x','y','0']},{nm:'B',comps:['1','1','0']},
  ],'·','0',3).err,/varias incógnitas/);
});
