import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { appUrl, createAppHarness, listAppSources, resolveAppModule } from './helpers/app-harness.mjs';

const fromApp = specifier => resolveAppModule(specifier, appUrl.href);

test('el resolvedor solo admite módulos de la aplicación', () => {
  assert.equal(fromApp('./js/ui/events.mjs').href, new URL('../js/ui/events.mjs', import.meta.url).href);
  const fromUi = new URL('../js/ui/waves.mjs', import.meta.url).href;
  assert.equal(resolveAppModule('../math/waves.mjs', fromUi).href, new URL('../js/math/waves.mjs', import.meta.url).href);
  for (const specifier of ['./sw.js', './style.css', './tests/app-ui.test.mjs', './noCommit/x.mjs',
    '../outside.mjs', 'node:fs', 'https://example.com/a.mjs', './js/ui/events.js']) {
    assert.throws(() => fromApp(specifier), /Import desconocido/, specifier);
  }
});

test('las fuentes auditadas son app.js y todo js/**/*.mjs', async () => {
  const sources = (await listAppSources()).map(url => url.href);
  const onDisk = (await readdir(new URL('../js/', import.meta.url), { recursive: true }))
    .filter(file => file.endsWith('.mjs'));
  assert.equal(sources[0], appUrl.href);
  assert.equal(sources.length, onDisk.length + 1);
  assert.equal(new Set(sources).size, sources.length);
});

test('un arnés comparte cada módulo; arneses distintos no comparten estado', async () => {
  const first = await createAppHarness();
  const href = path => new URL(path, appUrl).href;
  const shared = await first.linked.get(href('js/ui/physics-output.mjs'));
  const waves = await first.linked.get(href('js/ui/waves.mjs'));
  assert.equal(waves.namespace.physicsOutputUnitChanged, shared.namespace.physicsOutputUnitChanged);
  assert.equal(first.actions.physicsOutputUnitChanged, shared.namespace.physicsOutputUnitChanged);

  const second = await createAppHarness();
  assert.notEqual(await second.linked.get(href('js/ui/physics-output.mjs')), shared);
  first.actions.toggleTheme();
  assert.equal(first.savedTheme.get('sc-theme'), 'light');
  assert.equal(second.savedTheme.get('sc-theme'), undefined);
  assert.equal(second.sandbox.document.documentElement.dataset.theme, 'dark');
});
