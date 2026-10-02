import test from 'node:test';
import assert from 'node:assert/strict';
import { composeActions } from '../js/ui/action-registry.mjs';
import { appUrl, createAppHarness } from './helpers/app-harness.mjs';

const one = () => 1, two = () => 2;

test('un reexporte de la misma función se registra una vez', () => {
  const actions = composeActions({ a: { shared: one, x: two }, b: { shared: one } });
  assert.deepEqual(Object.keys(actions), ['shared', 'x']);
  assert.equal(actions.shared, one);
});

test('dos funciones distintas con el mismo nombre son un error', () => {
  assert.throws(() => composeActions({ a: { name: one }, b: { name: two } }), /Acción duplicada con otra función: name \(b\)/);
});

test('el módulo dueño de una acción compartida no puede ser sustituido', () => {
  assert.throws(() => composeActions({ a: { shared: two } }, { shared: one }), /a no reexporta/);
  assert.equal(composeActions({ a: { shared: one } }, { shared: one }).shared, one);
});

// Existing actions retain the same keys, order and function objects as the
// former namespace spread; the new search actions are checked separately.
test('la tabla de acciones coincide con la composición anterior por propagación', async () => {
  const harness = await createAppHarness();
  const namespace = async path => (await harness.linked.get(new URL(path, appUrl).href)).namespace;
  const modules = ['algebra/matrix', 'algebra/geometry', 'algebra/linear-spaces', 'numerical-analysis', 'logic', 'waves',
    'algebra/inequalities', 'algebra/functions', 'algebra/sequences', 'calculus', 'study-calculus', 'electromagnetism',
    'electromagnetism-advanced', 'algebra/vectors', 'statistics', 'probability', 'experiments', 'mechanics',
    'mechanics-advanced', 'theory', 'plotter'];
  const namespaces = await Promise.all(modules.map(name => namespace(`js/ui/${name}.mjs`)));
  const navigationKeys = ['openSubmod', 'launchSubmod', 'closeSubmod', 'closeModule', 'goHome', 'exitStay', 'exitLeave', 'theoryGo', 'routeCatalog'];
  const figureKeys = ['figInitPanel', 'figSetType', 'figDraw', 'figClear', 'emFigToggle', 'emFigSetType', 'emFigDraw', 'emFigClear'];
  const pick = keys => Object.fromEntries(keys.map(key => [key, harness.actions[key]]));
  const spread = { ...pick(navigationKeys), ...Object.assign({}, ...namespaces), ...pick(figureKeys),
    ...pick(['installApp', 'dismissInstall', 'reloadApp', 'toggleTheme']) };
  const searchKeys = ['searchGo', 'searchOpen', 'searchClose', 'searchUpdate', 'searchChoose'];
  assert.deepEqual(Object.keys(harness.actions).filter(key => !searchKeys.includes(key)), Object.keys(spread));
  for (const key of Object.keys(spread)) assert.equal(harness.actions[key], spread[key], key);
  for (const key of searchKeys) assert.equal(typeof harness.actions[key], 'function', key);
  assert.equal(Object.keys(harness.actions).length, 243 + searchKeys.length);
});
