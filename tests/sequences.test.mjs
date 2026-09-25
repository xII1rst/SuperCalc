import test from 'node:test';
import assert from 'node:assert/strict';
import { evalTermN, seqClassify, detectProgression, arithmeticProgression, geometricProgression } from '../js/math/algebra/sequences.mjs';

test('evaluación y clasificación de sucesiones sin DOM', () => {
  assert.equal(evalTermN('2n+1', 3), 7);
  assert.equal(seqClassify([1,3,5]), 'Creciente');
  assert.deepEqual(detectProgression([2,5,8]), {kind:'pa',value:3});
  assert.deepEqual(detectProgression([2,6,18]), {kind:'pg',value:3});
});

test('progresiones aritmética y geométrica', () => {
  assert.deepEqual(arithmeticProgression(2,3,4), {an:11,sn:26,terms:[2,5,8,11]});
  assert.deepEqual(geometricProgression(3,2,4), {an:24,sn:45,sInf:NaN,terms:[3,6,12,24]});
});
