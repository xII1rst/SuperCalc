import test from 'node:test';
import assert from 'node:assert/strict';
import { evalTermN, sequenceLimit, radicalRecurrence, seqClassify, detectProgression, arithmeticProgression, geometricProgression } from '../js/math/algebra/sequences.mjs';

test('evaluación y clasificación de sucesiones sin DOM', () => {
  assert.equal(evalTermN('2n+1', 3), 7);
  assert.equal(seqClassify([1,3,5]), 'Creciente');
  assert.deepEqual(detectProgression([2,5,8]), {kind:'pa',value:3});
  assert.deepEqual(detectProgression([2,6,18]), {kind:'pg',value:3});
});

test('progresiones aritmética y geométrica', () => {
  assert.deepEqual(arithmeticProgression(2,3,4), {an:11,sn:26,terms:[2,5,8,11]});
  assert.deepEqual(geometricProgression(3,2,4), {an:24,sn:45,sInf:NaN,terms:[3,6,12,24]});
  assert.deepEqual(geometricProgression(0,1e300,500), {an:0,sn:0,sInf:0,terms:Array(8).fill(0)});
});

test('límites de sucesiones racionales por grados y coeficientes principales', () => {
  assert.equal(sequenceLimit('(3n+1)/(n+5)').value,3);
  assert.equal(sequenceLimit('(2n²−n)/(n²+4)').value,2);
  assert.equal(sequenceLimit('(1+n)/(n²+4)').value,0);
  assert.equal(sequenceLimit('n²/(-2n)').value,-Infinity);
  assert.equal(sequenceLimit('(n-1)/(n-1)').value,1);
  assert.ok(Number.isNaN(evalTermN('(n-1)/(n-1)',1)));
  assert.equal(sequenceLimit('n/(n-n)').status,'invalido');
});

test('límite exponencial estándar usa un argumento analítico y conserva el dominio', () => {
  const first=sequenceLimit('(1+2/n)^n');
  assert.equal(first.status,'demostrado');
  assert.equal(first.exact,'e^(2)');
  assert.ok(Math.abs(first.value-Math.exp(2))<1e-12);
  assert.match(first.steps[1],/ln\(1\+u\)\/u/);
  assert.ok(Math.abs(sequenceLimit('(1+1/(2n))^(3n)').value-Math.exp(1.5))<1e-12);
  assert.equal(sequenceLimit('(1+1/(0n))^n').status,'no-soportado');
});

test('encaje demuestra el límite de un término trigonométrico acotado sobre uno lineal', () => {
  const result=sequenceLimit('(2n+cos(n))/(n+1)');
  assert.equal(result.status,'demostrado');
  assert.equal(result.method,'encaje');
  assert.equal(result.value,2);
  assert.match(result.steps[1],/≤ 1\/\|n\+1\| → 0/);
  assert.equal(sequenceLimit('(3n-2sin(n))/(2n-1)').value,1.5);
  assert.equal(sequenceLimit('(2n+cos(n))/n+1').status,'no-soportado');
});

test('recurrencia radical demuestra convergencia desde ambos lados del punto fijo', () => {
  const increasing=radicalRecurrence(2,1,5);
  assert.equal(increasing.status,'demostrado');
  assert.equal(increasing.limit,2);
  assert.equal(increasing.direction,'creciente');
  assert.ok(increasing.terms.every((term,i)=>i===0||term>=increasing.terms[i-1]));
  assert.ok(increasing.terms.every(term=>term<=2));
  assert.match(increasing.steps.at(-1),/convergencia monótona/);
  const decreasing=radicalRecurrence(2,5,5);
  assert.equal(decreasing.direction,'decreciente');
  assert.ok(decreasing.terms.every((term,i)=>i===0||term<=decreasing.terms[i-1]));
  assert.ok(decreasing.terms.every(term=>term>=2));
  assert.equal(radicalRecurrence(0,1).status,'invalido');
  assert.equal(radicalRecurrence(2,-1).status,'invalido');
});

test('un muestreo no se presenta como prueba y la entrada queda acotada a expresiones', () => {
  assert.equal(sequenceLimit('sin(n)/n').status,'no-soportado');
  assert.equal(sequenceLimit('3n+1/n+5').status,'no-soportado');
  assert.equal(sequenceLimit('n^x').status,'invalido');
  assert.ok(Number.isNaN(evalTermN('globalThis.pwned=1',3)));
  assert.equal(seqClassify([3,3,3]),'Constante');
  assert.match(seqClassify([NaN,1]),/No determinada/);
});
