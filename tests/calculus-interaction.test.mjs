import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAppHarness } from './helpers/app-harness.mjs';

// Interaction contracts of the calculus screen that the DOM-free suites cannot
// see: one listener per input across reopenings, and a cancelling 250 ms
// preview debounce. Uses the manual clock and the real .calc-inp ids.
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const calcInputs = [...html.matchAll(/<input\b[^>]*>/g)].map(match => match[0])
  .filter(tag => /\bclass="[^"]*\bcalc-inp\b/.test(tag))
  .map(tag => /\bid="([^"]+)"/.exec(tag)?.[1]).filter(Boolean);

async function calculus() {
  const harness = await createAppHarness({ timers: 'manual', selectors: { '.calc-inp': calcInputs } });
  harness.open = id => {
    harness.actions.openSubmod('math');
    harness.advance(1000);
    harness.actions.openSubmod('ca');
    harness.advance(1000);
    harness.actions.launchSubmod(id);
    harness.advance(1000);
  };
  return harness;
}

test('cálculo registra cada oyente una sola vez al reabrir y cambiar de pestaña', async () => {
  const harness = await calculus();
  const focusCounts = () => calcInputs.map(id => harness.listenerCount(id, 'focus'));
  assert.ok(calcInputs.length > 50);
  harness.open('calc-dif');
  assert.deepEqual(focusCounts(), calcInputs.map(() => 1));
  assert.equal(harness.listenerCount('calc-app', 'input'), 1);
  assert.equal(harness.listenerCount('calc-app', 'change'), 1);
  harness.actions.closeModule('calc');
  harness.advance(1000);
  harness.open('calc-int');
  harness.actions.closeModule('calc');
  harness.advance(1000);
  harness.open('calc-dif');
  assert.deepEqual(focusCounts(), calcInputs.map(() => 1));
  assert.equal(harness.listenerCount('calc-app', 'input'), 1);
  assert.equal(harness.listenerCount('calc-app', 'change'), 1);
});

test('el teclado inserta en el último campo enfocado', async () => {
  const harness = await calculus();
  harness.open('calc-dif');
  const field = harness.getElementById('dif-lim-fx');
  field.value = 'x';
  harness.dispatch('dif-lim-fx', 'focus');
  harness.actions.kbInsert({ preventDefault() {} }, 'sin(');
  assert.equal(field.value, 'xsin(');
});

test('la vista previa espera 250 ms y cancela las entradas anteriores', async () => {
  const harness = await calculus();
  harness.open('calc-dif');
  const canvas = harness.getElementById('preview-probe');
  Object.assign(canvas.dataset, { gmode: 'fn', src: 'dif-lim-fx' });
  harness.getElementById('dif-lim-fx').value = 'x^2';
  const target = { closest: () => ({ id: 'body-lim', querySelector: () => canvas }) };
  harness.timerLog.length = 0;
  for (let i = 0; i < 3; i++) harness.dispatch('calc-app', 'input', { target });
  assert.deepEqual(harness.timerLog, ['clear:null', 'clear:live', 'clear:live']);
  assert.equal(harness.pendingTimers().length, 1);
  harness.advance(249);
  assert.equal(harness.pendingTimers().length, 1);
  harness.advance(1);
  assert.equal(harness.pendingTimers().length, 0);
  assert.equal(harness.timerLog.filter(entry => entry.startsWith('fire:')).length, 1);
});
