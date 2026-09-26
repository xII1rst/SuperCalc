import test from 'node:test';
import assert from 'node:assert/strict';

import {
  genRevolutionSolid, computeSolidExtent, recenterSolid,
} from '../js/graphics/revolution.mjs';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('el sólido en eje X genera quads laterales y tapas', () => {
  const S = 12, R = 8;
  const polys = genRevolutionSolid(() => 2, 1, 2, 'x', { segments: S, rings: R });
  assert.equal(polys.length, R * S + 2 * S);
});

test('un cono (f(x)=x en [0,1]) cumple y²+z² = f(x)² en la superficie', () => {
  const S = 12, R = 8;
  const polys = genRevolutionSolid(x => x, 0, 1, 'x', { segments: S, rings: R });
  // lado R*S + una tapa (la base, x=1; la punta x=0 tiene radio 0)
  assert.equal(polys.length, R * S + S);
  for (let k = 0; k < R * S; k++) {
    for (const p of polys[k]) {
      near(p.y * p.y + p.z * p.z, p.x * p.x, 1e-8);
    }
  }
});

test('el sólido en eje Y genera cúpula, base y paredes', () => {
  const S = 12, R = 8;
  const polys = genRevolutionSolid(x => x, 0, 1, 'y', { segments: S, rings: R });
  // cúpula R*S + base R*S + pared exterior S (interior radio 0 se omite)
  assert.equal(polys.length, 2 * R * S + S);
  for (const poly of polys) for (const p of poly) {
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
  }
});

test('computeSolidExtent y recenterSolid centran la malla en el origen', () => {
  const polys = genRevolutionSolid(() => 2, 1, 2, 'x', { segments: 8, rings: 4 });
  const ext = computeSolidExtent(polys);
  assert.ok(Number.isFinite(ext.maxR) && ext.maxR > 0);
  const centered = recenterSolid(polys);
  const c = computeSolidExtent(centered);
  near(c.cx, 0, 1e-9);
  near(c.cy, 0, 1e-9);
  near(c.cz, 0, 1e-9);
});

test('una función degenerada f(x)=0 no lanza y devuelve una malla finita', () => {
  const polys = genRevolutionSolid(() => 0, 0, 1, 'x', { segments: 6, rings: 4 });
  assert.equal(polys.length, 4 * 6); // sin tapas (radio 0)
  const ext = computeSolidExtent(polys);
  assert.ok(Number.isFinite(ext.maxR));
});
