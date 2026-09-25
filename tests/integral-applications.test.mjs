import test from 'node:test';
import assert from 'node:assert/strict';
import {
  areaBetweenCurves, arcLength, surfaceAreaOfRevolution, workConstantForce,
  workSpring, workVariable, fluidForce, centroidRegion, pappusVolume, pappusSurfaceArea,
} from '../js/math/integral-applications.mjs';

const close = (a, b, tol = 1e-4) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);

test('área entre curvas', () => {
  close(areaBetweenCurves(x => x, x => 0, 0, 1), 0.5);
  close(areaBetweenCurves(x => 2, x => 1, 0, 3), 3);
});

test('longitud de arco de una recta', () => {
  close(arcLength(x => x, 0, 1), Math.sqrt(2));
});

test('superficie de revolución: cilindro y cono', () => {
  close(surfaceAreaOfRevolution(x => 1, 0, 1), 2 * Math.PI, 1e-3);
  close(surfaceAreaOfRevolution(x => x, 0, 1), Math.PI * Math.sqrt(2), 1e-3);
});

test('trabajo: constante, resorte y fuerza variable', () => {
  assert.equal(workConstantForce(10, 3), 30);
  close(workSpring(2, 0, 1), 1);
  close(workVariable(x => x, 0, 1), 0.5);
});

test('fuerza hidrostática', () => {
  close(fluidForce(1, x => x, x => 1, 0, 2), 2);
});

test('centroide de la región bajo una curva', () => {
  const rect = centroidRegion(x => 1, 0, 2);
  close(rect.area, 2);
  close(rect.xbar, 1);
  close(rect.ybar, 0.5);

  const tri = centroidRegion(x => x, 0, 1);
  close(tri.xbar, 2 / 3);
  close(tri.ybar, 1 / 3);
});

test('teoremas de Pappus', () => {
  close(pappusVolume(Math.PI, 1), 2 * Math.PI * Math.PI);
  close(pappusSurfaceArea(2 * Math.PI, 1), 4 * Math.PI * Math.PI);
});

test('rechaza entradas inválidas', () => {
  assert.throws(() => arcLength(x => x, 1, 0), RangeError);
  assert.throws(() => areaBetweenCurves('nope', x => 0, 0, 1), TypeError);
});
