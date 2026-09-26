import test from 'node:test';
import assert from 'node:assert/strict';

import { project3D } from '../js/graphics/projection.mjs';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('la proyección identidad traslada al centro de pantalla', () => {
  const p = project3D(0, 0, 0, { rotX: 0, rotY: 0, scale: 1, cx: 10, cy: 20 });
  assert.equal(p.sx, 10);
  assert.equal(p.sy, 20);
  assert.equal(p.z2, 0);
});

test('rotación de 90° en X mueve (0,1,0) a profundidad z=1', () => {
  const p = project3D(0, 1, 0, { rotX: 90, rotY: 0, scale: 1, cx: 0, cy: 0 });
  near(p.sx, 0);
  near(p.sy, 0);
  near(p.z2, 1);
});

test('rotación de 90° en Y mueve (1,0,0) a profundidad z=-1', () => {
  const p = project3D(1, 0, 0, { rotX: 0, rotY: 90, scale: 1, cx: 0, cy: 0 });
  near(p.sx, 0);
  near(p.sy, 0);
  near(p.z2, -1);
});

test('el factor de escala multiplica el desplazamiento', () => {
  const p = project3D(1, 0, 0, { rotX: 0, rotY: 0, scale: 2, cx: 0, cy: 0 });
  near(p.sx, 2);
  near(p.sy, 0);
  near(p.z2, 0);
});

test('aplica RX antes que RY (orden de Euler fijo)', () => {
  // Punto (0,1,0): tras RX(90°) queda (0,0,1); luego RY(90°) → x2=z1=1, z2=0.
  const p = project3D(0, 1, 0, { rotX: 90, rotY: 90, scale: 1, cx: 0, cy: 0 });
  near(p.sx, 1);
  near(p.sy, 0);
  near(p.z2, 0);
});
