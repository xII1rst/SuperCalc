import test from 'node:test';
import assert from 'node:assert/strict';

import {
  sampleFn, sampleParametric, samplePolar, autoRange, renderPreview,
} from '../js/graphics/preview-canvas.mjs';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('sampleFn filtra valores no finitos', () => {
  const pts = sampleFn(x => 1 / x, -1, 1, 100);
  assert.ok(pts.length > 0);
  assert.ok(pts.every(p => Number.isFinite(p.y)));
});

test('sampleParametric muestrea puntos del plano', () => {
  const pts = sampleParametric(t => Math.cos(t), t => Math.sin(t), 0, 2 * Math.PI, 100);
  assert.equal(pts.length, 101);
  assert.ok(pts.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
});

test('samplePolar convierte r=1 a un círculo de radio 1', () => {
  const pts = samplePolar(() => 1, 0, 2 * Math.PI, 100);
  assert.equal(pts.length, 101);
  for (const p of pts) near(Math.hypot(p.x, p.y), 1, 1e-9);
});

test('autoRange rellena y vuelve a un cuadrado por defecto si está vacío', () => {
  assert.deepEqual(autoRange([]), { xMin: -1, xMax: 1, yMin: -1, yMax: 1 });
  const r = autoRange([{ x: 0, y: 0 }, { x: 10, y: 10 }]);
  near(r.xMin, -1.2);
  near(r.xMax, 11.2);
  near(r.yMin, -1.2);
  near(r.yMax, 11.2);
});

test('renderPreview no lanza y omite los ejes cuando el 0 está fuera de rango', () => {
  const previous = { document: globalThis.document, getComputedStyle: globalThis.getComputedStyle };
  const COLORS = {
    '--graph-bg': '#ffffff', '--graph-grid': '#eeeeee',
    '--graph-axis': '#000000', '--graph-text': '#333333', '--graph-curve': '#2563eb',
  };
  globalThis.document = { documentElement: {} };
  globalThis.getComputedStyle = () => ({ getPropertyValue: n => COLORS[n] || '' });

  function recordingCtx() {
    let strokeStyle = null;
    const strokes = [];
    const ctx = new Proxy({}, {
      get(_t, key) {
        if (key === 'stroke') return () => { strokes.push(strokeStyle); };
        return () => {};
      },
      set(_t, key, value) {
        if (key === 'strokeStyle') strokeStyle = value;
        return true;
      },
    });
    return { ctx, strokes };
  }

  try {
    const make = (ctx) => ({ clientWidth: 300, clientHeight: 220, width: 0, height: 0, getContext: () => ctx });

    // 0 dentro del rango → ambos ejes
    const a = recordingCtx();
    renderPreview(make(a.ctx), [{ x: -1, y: -1 }, { x: 1, y: 1 }], { dpr: 1 });
    assert.equal(a.strokes.filter(s => s === '#000000').length, 2);

    // 0 fuera del rango → sin ejes
    const b = recordingCtx();
    renderPreview(make(b.ctx), [{ x: 5, y: 5 }, { x: 6, y: 6 }], { dpr: 1 });
    assert.equal(b.strokes.filter(s => s === '#000000').length, 0);

    // paramétricas y polares no lanzan
    const c = recordingCtx();
    renderPreview(make(c.ctx), sampleParametric(t => Math.cos(t), t => Math.sin(t), 0, 2 * Math.PI), { dpr: 1 });
    const d = recordingCtx();
    renderPreview(make(d.ctx), samplePolar(() => 1, 0, 2 * Math.PI), { dpr: 1 });
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    }
  }
});
