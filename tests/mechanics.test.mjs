import test from 'node:test';
import assert from 'node:assert/strict';
import { forceAndEnergy, linearMotion, projectileMotion } from '../js/math/mechanics.mjs';
import { drawProjectileTrajectory } from '../js/graphics/mechanics-trajectory.mjs';

test('movimiento rectilíneo y energía conservan unidades y signos', () => {
  assert.deepEqual(linearMotion(0, 10, 2, 5), {
    displacement: 75, finalPosition: 75, finalVelocity: 20,
  });
  assert.deepEqual(forceAndEnergy(2, 3, 4, 5, 10), {
    force: 6, kinetic: 16, potential: 100, total: 116,
  });
  assert.throws(() => linearMotion(0, 1, 1, -1), RangeError);
  assert.throws(() => forceAndEnergy(-1, 3, 4, 5), RangeError);
});

test('trayectoria parabólica coincide con un tiro de 45 grados', () => {
  const result = projectileMotion(10, 45, 0, 10);
  assert.ok(Math.abs(result.flightTime - Math.SQRT2) < 1e-12);
  assert.ok(Math.abs(result.range - 10) < 1e-12);
  assert.ok(Math.abs(result.maxHeight - 2.5) < 1e-12);
  assert.equal(result.points.length, 81);
  assert.equal(result.points.at(-1).y, 0);
  assert.equal(projectileMotion(0, 0, 5, 10).flightTime, 1);
  assert.throws(() => projectileMotion(10, 45, 0, 0), RangeError);
  assert.throws(() => projectileMotion(10, 100), RangeError);
});

test('el gráfico de trayectoria recorre puntos y respeta la paleta recibida', () => {
  const calls = {lines: 0, strokes: []};
  const ctx = new Proxy({}, {
    get(target, key) {
      if (key === 'lineTo') return () => { calls.lines++; };
      if (key === 'stroke') return () => { calls.strokes.push(target.strokeStyle); };
      return target[key] ?? (() => {});
    },
    set(target, key, value) { target[key] = value; return true; },
  });
  const canvas = {clientWidth: 320, getContext: () => ctx};
  const palette = name => ({fi:'cyan','surface-result':'black','line-medium':'gray','text-muted':'white'})[name];
  drawProjectileTrajectory(canvas, projectileMotion(10, 45, 0, 10), palette);
  assert.ok(calls.lines >= 80);
  assert.deepEqual(calls.strokes, ['gray', 'cyan']);
  assert.equal(canvas.height, 220);
});
