import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppHarness } from './helpers/app-harness.mjs';

async function searchHarness() {
  const h = await createAppHarness({ timers: 'manual' });
  const get = h.getElementById;
  const dialog = get('tool-search-dialog');
  const input = get('tool-search-input');
  input.value = '';
  input.select = () => {};
  dialog.open = false;
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; h.dispatch(dialog.id, 'close'); };
  for (const id of ['study-mode', 'emplus-mode', 'mechplus-mode', 'waves-mode']) get(id).querySelector = () => null;
  return { ...h, get, dialog, input };
}

function key(h, value, extras = {}) {
  let prevented = false;
  h.delegatedEvents.get('keydown')({ key: value, target: h.input, preventDefault() { prevented = true; }, ...extras });
  return prevented;
}

test('búsqueda abre con Ctrl/⌘ K, mantiene el formulario y restaura foco al cerrar', async () => {
  const h = await searchHarness();
  const previous = h.get('previous-input');
  let focused = 0;
  previous.focus = () => { focused++; };
  previous.isConnected = true;
  h.sandbox.document.activeElement = previous;
  previous.value = 'sin(x)/x';
  assert.equal(key(h, 'k', { ctrlKey: true }), true);
  assert.equal(h.dialog.open, true);
  assert.match(h.get('tool-search-results').innerHTML, /Matrices y ecuaciones lineales/);
  assert.equal(key(h, 'Escape'), true);
  assert.equal(h.dialog.open, false);
  assert.equal(focused, 1);
  assert.equal(previous.value, 'sin(x)/x');
  assert.equal(key(h, 'K', { metaKey: true }), true);
  h.actions.searchClose();
  assert.equal(h.listenerCount(h.dialog.id, 'cancel'), 1);
  assert.equal(h.listenerCount(h.dialog.id, 'click'), 1);
  assert.equal(h.listenerCount(h.dialog.id, 'close'), 1);
  assert.equal(key(h, 'k', { ctrlKey: true, isComposing: true }), false);
  assert.equal(key(h, 'k', { ctrlKey: true, altKey: true }), false);
});

test('Enter abre la operación después de inicializar el panel, y Atrás vuelve a su menú', async () => {
  const h = await searchHarness();
  h.actions.searchOpen();
  h.input.value = 'Laplace inversa de cuadrática';
  h.actions.searchUpdate();
  assert.match(h.get('tool-search-results').innerHTML, /data-arg="study:laplaceinversequadratic"/);
  assert.equal(key(h, 'Enter'), true);
  assert.equal(h.dialog.open, false);
  assert.equal(h.get('study-app').classList.contains('visible'), false);
  h.advance(299);
  assert.equal(h.get('study-app').classList.contains('visible'), false);
  h.advance(1);
  assert.equal(h.get('study-app').classList.contains('visible'), true);
  assert.equal(h.get('study-mode').value, 'laplaceinversequadratic');
  assert.match(h.get('study-fields').innerHTML, /study-numerator/);
  h.history.back();
  assert.equal(h.get('study-app').classList.contains('visible'), false);
  assert.equal(h.get('study-app').inert, true);
  assert.equal(h.get('submod-screen').classList.contains('visible'), true);
  assert.match(h.get('submod-title').innerHTML, /Cálculo/);
});

test('sin resultados Enter mantiene el diálogo; cancelar y pulsar el fondo lo cierran', async () => {
  const h = await searchHarness();
  h.actions.searchOpen();
  h.input.value = '<script>inexistente';
  h.actions.searchUpdate();
  assert.equal(h.get('tool-search-results').innerHTML, '');
  assert.match(h.get('tool-search-status').textContent, /Sin resultados/);
  key(h, 'Enter');
  assert.equal(h.dialog.open, true);
  h.actions.searchChoose('study:laplaceinversequadratic');
  assert.equal(h.dialog.open, true);
  let prevented = false;
  h.dispatch(h.dialog.id, 'cancel', { preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(h.dialog.open, false);
  h.actions.searchOpen();
  h.dispatch(h.dialog.id, 'click');
  assert.equal(h.dialog.open, false);
});

test('las flechas mueven el foco entre el campo y los botones de resultados', async () => {
  const h = await searchHarness();
  h.actions.searchOpen();
  const buttons = [h.get('search-result-1'), h.get('search-result-2')];
  h.get('tool-search-results').querySelectorAll = () => buttons;
  let focused = null;
  h.input.focus = () => { focused = h.input; };
  for (const button of buttons) button.focus = () => { focused = button; };
  assert.equal(key(h, 'ArrowDown'), true);
  assert.equal(focused, buttons[0]);
  key(h, 'ArrowDown', { target: buttons[0] });
  assert.equal(focused, buttons[1]);
  key(h, 'ArrowUp', { target: buttons[0] });
  assert.equal(focused, h.input);
  const close = h.get('search-close');
  close.focus = () => { focused = close; };
  h.dialog.querySelectorAll = () => [close, h.input, ...buttons];
  assert.equal(key(h, 'Tab', { target: buttons[1] }), true);
  assert.equal(focused, close);
  assert.equal(key(h, 'Tab', { target: close, shiftKey: true }), true);
  assert.equal(focused, buttons[1]);
});

test('saltar desde otra herramienta la cierra y cancela transiciones y selecciones anteriores', async () => {
  const h = await searchHarness();
  h.actions.openSubmod('math');
  let oldCallback = 0;
  h.actions.launchSubmod('study-ode', true, () => { oldCallback++; });
  h.actions.searchGo('#/mech/mechplus-forces', () => { h.get('mechplus-mode').value = 'atwood'; });
  h.advance(350);
  assert.equal(oldCallback, 0);
  assert.equal(h.get('submod-screen').classList.contains('visible'), false);
  assert.equal(h.get('study-app').classList.contains('visible'), false);
  assert.equal(h.get('mechplus-app').classList.contains('visible'), true);
  assert.equal(h.actions.searchGo('#/al/does-not-exist'), false);
  assert.equal(h.get('mechplus-app').classList.contains('visible'), true);
  h.actions.searchOpen();
  h.input.value = 'Coulomb';
  h.actions.searchUpdate();
  h.actions.searchChoose('emplus:coulomb');
  h.advance(300);
  assert.equal(h.get('mechplus-app').classList.contains('visible'), false);
  assert.equal(h.get('mechplus-app').inert, true);
  assert.equal(h.get('emplus-app').classList.contains('visible'), true);
  assert.equal(h.get('emplus-mode').value, 'coulomb');
});

test('Atrás durante el salto cancela la inicialización y la selección pendiente', async () => {
  const h = await searchHarness();
  let calls = 0;
  h.actions.searchGo('#/ca/study-ode', () => { calls++; });
  h.history.back();
  h.advance(350);
  assert.equal(calls, 0);
  assert.equal(h.get('study-app').classList.contains('visible'), false);
  assert.equal(h.get('submod-screen').classList.contains('visible'), true);
});
