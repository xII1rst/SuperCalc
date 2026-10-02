import test from 'node:test';
import assert from 'node:assert/strict';
import { scanInterval, requireFiniteOn, requireDifferentiableAt } from '../js/math/domain-guard.mjs';
import { calcParse, computeLimit } from '../js/math/calculus.mjs';
import { arcLength, areaBetweenCurves, surfaceAreaOfRevolution, workVariable, centroidRegion } from '../js/math/integral-applications.mjs';
import { optimizeFunction, tangentAt, motionAt, newtonMethod, linearApproximation } from '../js/math/applications.mjs';

const f = calcParse;

test('el escáner distingue puntos fuera del dominio, polos y funciones solo grandes', () => {
  assert.equal(scanInterval(f('1/x'), -1, 1).kind, 'undefined');
  assert.equal(scanInterval(f('1/(x-1/3)'), 0, 1).kind, 'pole');
  assert.equal(scanInterval(f('tan(x)'), 0, 2).kind, 'pole');
  assert.equal(scanInterval(f('exp(20*x)'), 0, 1), null, 'e^(20x) crece pero está acotada en [0,1]');
  assert.equal(scanInterval(f('x^2'), -3, 3), null);
  assert.throws(() => requireFiniteOn(f('sqrt(x)'), -1, 1), /no está definida en x ≈ -1/);
  assert.throws(() => requireFiniteOn(f('tan(x)'), 0, 2, 'f', 'extremos'), /Weierstrass/);
  assert.throws(() => requireDifferentiableAt(f('abs(x)'), 0), /derivadas laterales/);
  assert.throws(() => requireDifferentiableAt(f('sqrt(x)'), 0), /un lado/);
  requireDifferentiableAt(f('sin(x)'), 1);
});

test('las aplicaciones de la integral rechazan singularidades y aceptan las integrables en los extremos', () => {
  assert.throws(() => arcLength(f('sqrt(x)'), -1, 1), /no está definida/);
  assert.throws(() => areaBetweenCurves(f('1/x'), f('0'), -1, 1), /no está definida/);
  assert.throws(() => workVariable(f('tan(x)'), 0, 2), /singularidad/);
  assert.throws(() => centroidRegion(f('ln(x)'), -1, 1), /no está definida/);
  assert.ok(Math.abs(arcLength(f('sqrt(x)'), 0, 1) - 1.4789428575445975) < 1e-5, 'f′ infinita en el extremo: integral impropia convergente');
  assert.ok(Math.abs(surfaceAreaOfRevolution(f('sqrt(x)'), 0, 1) - Math.PI / 6 * (5 ** 1.5 - 1)) < 1e-6);
  assert.ok(Math.abs(arcLength(f('cosh(x)'), 0, 1) - Math.sinh(1)) < 1e-9);
  assert.ok(Math.abs(workVariable(f('tan(x)'), 0, 1.5) + Math.log(Math.cos(1.5))) < 1e-7);
});

test('las aplicaciones de la derivada exigen dominio y derivabilidad', () => {
  assert.throws(() => optimizeFunction(f('1/x'), -1, 1), /no está definida/);
  assert.throws(() => optimizeFunction(f('tan(x)'), 0, 2), /Weierstrass/);
  assert.throws(() => tangentAt(f('abs(x)'), 0), /no es derivable en x = 0/);
  assert.throws(() => tangentAt(f('ln(x)'), -1), /no está definida/);
  assert.throws(() => motionAt(f('1/x'), 0), /t = 0/);
  assert.throws(() => newtonMethod(f('sqrt(x)'), -1), /punto inicial/);
  assert.throws(() => linearApproximation(f('sqrt(x)'), -4, -3.9), /no está definida/);
  assert.ok(Math.abs(tangentAt(f('x^2'), 1).fpx0 - 2) < 1e-6);
  assert.equal(optimizeFunction(f('x^2'), -1, 2).maxX, 2);
});

test('límites en polos racionales y fuera del dominio', () => {
  const both = computeLimit('1/x', '0', 'both');
  assert.equal(both.value, 'No existe'); assert.equal(both.vr, Infinity); assert.equal(both.vl, -Infinity);
  assert.equal(computeLimit('1/x', '0', 'right').value, '+∞');
  assert.equal(computeLimit('1/x^2', '0', 'both').value, '+∞');
  assert.equal(computeLimit('(x+1)/(x-2)', '2', 'left').value, '−∞');
  assert.equal(computeLimit('(x^2+1)/(x-1)^2', '1', 'both').value, '+∞');
  assert.equal(computeLimit('(x^2-4)/(x-2)', '2', 'both').value, '4', 'la cancelación 0/0 sigue funcionando');
  const outside = computeLimit('sqrt(x)', '-1', 'both');
  assert.equal(outside.value, 'No existe'); assert.match(outside.domainError, /fuera del dominio/);
});
