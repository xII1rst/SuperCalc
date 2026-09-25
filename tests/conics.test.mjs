import test from 'node:test';
import assert from 'node:assert/strict';
import { parabola, ellipse, hyperbola, circle, conicClassify } from '../js/math/conics.mjs';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);

test('parábola vertical x² = 4p y', () => {
  const p = parabola(0, 0, 1, true);
  assert.deepEqual(p.vertex, { x: 0, y: 0 });
  assert.deepEqual(p.focus, { x: 0, y: 1 });
  close(p.directrixY, -1);
  close(p.latusRectum, 4);
  assert.equal(p.opens, 'arriba');
});

test('parábola horizontal que abre a la izquierda', () => {
  const p = parabola(0, 0, -1, false);
  assert.deepEqual(p.focus, { x: -1, y: 0 });
  close(p.directrixX, 1);
  assert.equal(p.opens, 'izquierda');
});

test('elipse: focos, vértices y excentricidad', () => {
  const e = ellipse(0, 0, 5, 3);
  close(e.c, 4);
  assert.deepEqual(e.foci, [{ x: -4, y: 0 }, { x: 4, y: 0 }]);
  assert.deepEqual(e.vertices, [{ x: -5, y: 0 }, { x: 5, y: 0 }]);
  close(e.eccentricity, 0.8);
});

test('hipérbola: focos, asíntotas y excentricidad', () => {
  const h = hyperbola(0, 0, 3, 4);
  close(h.c, 5);
  assert.deepEqual(h.foci, [{ x: -5, y: 0 }, { x: 5, y: 0 }]);
  assert.deepEqual(h.vertices, [{ x: -3, y: 0 }, { x: 3, y: 0 }]);
  close(h.asymptotes[0].slope, 4 / 3);
  close(h.eccentricity, 5 / 3);
});

test('circunferencia', () => {
  const c = circle(1, -2, 3);
  assert.deepEqual(c.center, { x: 1, y: -2 });
  close(c.area, 9 * Math.PI);
  close(c.circumference, 6 * Math.PI);
});

test('clasificación por discriminante', () => {
  assert.equal(conicClassify(1, 0, 1, 0, 0, -1).type, 'circle');       // x²+y²=1
  assert.equal(conicClassify(1, 0, 4, 0, 0, -4).type, 'ellipse');     // x²/4+y²=1
  assert.equal(conicClassify(1, 0, -1, 0, 0, -1).type, 'hyperbola');  // x²−y²=1
  assert.equal(conicClassify(0, 0, 1, -4, 0, 0).type, 'parabola');    // y²=4x
});
