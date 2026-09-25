import test from 'node:test';
import assert from 'node:assert/strict';

import {
  genSphere, genCylinder, genCone, genPlane, genTorus, renderFigure,
} from '../js/graphics/figures.mjs';
import { adaptiveStep, graphGridStep } from '../js/graphics/axes.mjs';

test('las mallas generan los polígonos previstos', () => {
  assert.equal(genSphere(0, 0, 0, 2, 4).length, 32);
  assert.equal(genCylinder(0, 0, 0, 2, 4, 6).length, 18);
  assert.equal(genCone(0, 0, 0, 2, 4, 6).length, 12);
  assert.equal(genTorus(0, 0, 0, 3, 1, 5).length, 25);

  const plane = genPlane(1, 2, 3, 0, 0, 1, 4);
  assert.equal(plane.length, 1);
  assert.equal(plane[0].length, 4);
  assert.ok(plane[0].every(point => point.z === 3));
});

test('el renderer usa una proyección inyectada y el contexto recibido', () => {
  let fills = 0;
  let strokes = 0;
  const ctx = {
    save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {},
    fill() { fills++; },
    stroke() { strokes++; },
  };
  renderFigure(ctx, (x, y, z) => ({ sx: x, sy: y, z2: z }), {
    type: 'cone', params: { r: 2, h: 3 }, cx: 0, cy: 0, cz: 0,
    color: '#fff', opacity: 50,
  });
  assert.equal(fills, 48);
  assert.equal(strokes, 48);
});

test('pasos de ejes y cuadrícula independientes del canvas', () => {
  assert.equal(adaptiveStep(8),2);
  assert.equal(graphGridStep(17,7),2);
});
