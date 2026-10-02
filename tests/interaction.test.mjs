import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { bindActions } from '../js/ui/events.mjs';
import { parseRoute, routeHash } from '../js/ui/routes.mjs';

function harness(actions) {
  const listeners = new Map();
  bindActions({ addEventListener(type, handler) { listeners.set(type, handler); } }, actions);
  return listeners;
}

test('Enter y Espacio activan controles role="button"; otras teclas y elementos no', () => {
  let clicks = 0, prevented = 0;
  const listeners = harness({});
  const control = { dataset: { action: 'toggleCard' }, getAttribute: name => name === 'role' ? 'button' : null, click: () => clicks++ };
  const press = (key, target = control) => listeners.get('keydown')({ key, target, preventDefault: () => prevented++ });
  press('Enter');
  press(' ');
  press('a');
  press('Enter', { dataset: { action: 'x' }, getAttribute: () => null, click: () => clicks++ });
  press('Enter', { dataset: {}, getAttribute: () => 'button', click: () => clicks++ });
  assert.equal(clicks, 2);
  assert.equal(prevented, 2);
});

test('el teclado matemático también responde a un clic de teclado (detail 0)', () => {
  const calls = [];
  const listeners = harness({ kbInsert: (event, text) => calls.push(text) });
  const element = { dataset: { action: 'kbInsert', event: 'pointerdown', insert: 'π' } };
  element.closest = () => element;
  listeners.get('click')({ type: 'click', detail: 0, target: element, preventDefault() {} });
  listeners.get('click')({ type: 'click', detail: 1, target: element, preventDefault() {} });
  listeners.get('pointerdown')({ type: 'pointerdown', target: element, preventDefault() {} });
  assert.deepEqual(calls, ['π', 'π']);
});

test('las rutas codifican menú y herramienta, y rechazan fragmentos ajenos', () => {
  assert.equal(routeHash({ sc: 'launcher' }), '');
  assert.equal(routeHash({ sc: 'submod', parent: 'ca' }), '#/ca');
  assert.equal(routeHash({ sc: 'module', parent: 'ca', id: 'calc-dif' }), '#/ca/calc-dif');
  assert.equal(routeHash({ sc: 'module', parent: null, id: 'stats' }), '#/-/stats');
  assert.deepEqual(parseRoute('#/ca'), { parent: 'ca' });
  assert.deepEqual(parseRoute('#/ca/calc-dif'), { parent: 'ca', id: 'calc-dif' });
  assert.deepEqual(parseRoute('#/-/stats'), { parent: null, id: 'stats' });
  for (const bad of ['', '#', '#/', '#/-', '#/a/b/c', '#/<script>', '#/Ca', '#/ca/x y', undefined]) {
    assert.equal(parseRoute(bad), null, String(bad));
  }
});

test('los controles no nativos del HTML son enfocables y declaran su estado', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const divControls = [...html.matchAll(/<div\b[^>]*data-action="[a-zA-Z]+"[^>]*>/g)].map(match => match[0])
    .filter(tag => !/data-event="input"/.test(tag));
  assert.ok(divControls.length > 50);
  for (const tag of divControls) {
    assert.match(tag, /role="button"/, tag);
    assert.match(tag, /tabindex="0"/, tag);
  }
  for (const tag of divControls.filter(tag => tag.includes('calc-card-header'))) {
    assert.match(tag, /aria-expanded="false" aria-controls="body-[\w-]+"/, tag);
  }
  assert.doesNotMatch(html, /user-scalable=no|maximum-scale=1/);
});

test('las fuentes son propias, con licencia y precargadas para uso sin conexión', async () => {
  const { readdir } = await import('node:fs/promises');
  const [html, worker, css] = await Promise.all(['../index.html', '../sw.js', '../fonts/fonts.css'].map(file => readFile(new URL(file, import.meta.url), 'utf8')));
  assert.doesNotMatch(html + worker, /fonts\.googleapis|fonts\.gstatic/);
  assert.match(html, /href="fonts\/fonts\.css"/);
  const files = await readdir(new URL('../fonts/', import.meta.url));
  const woff2 = files.filter(name => name.endsWith('.woff2'));
  assert.ok(woff2.length >= 12);
  for (const name of woff2) {
    assert.match(worker, new RegExp(`'\\./fonts/${name.replace(/\./g, '\\.')}'`), `sin precarga: ${name}`);
    assert.match(css, new RegExp(`url\\(${name.replace(/\./g, '\\.')}\\)`), `sin @font-face: ${name}`);
  }
  assert.match(worker, /'\.\/fonts\/fonts\.css'/);
  assert.ok(files.includes('OFL-IBM-Plex-Sans.txt') && files.includes('OFL-JetBrains-Mono.txt'));
});
