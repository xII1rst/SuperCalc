import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { assembleHtml } from '../scripts/assemble-html.mjs';

const html = new URL('../html/', import.meta.url);

test('index.html coincide con el ensamblado de html/', async () => {
  const committed = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(committed === assembleHtml(), 'index.html está desactualizado: ejecuta node scripts/assemble-html.mjs');
  assert.doesNotMatch(committed, /<!-- include:/);
});

test('cada fragmento se incluye exactamente una vez', async () => {
  const files = (await readdir(html, { recursive: true })).filter(file => file.endsWith('.html') && file !== 'shell.html');
  const included = [];
  const collect = async file => {
    for (const [, path] of (await readFile(new URL(file, html), 'utf8')).matchAll(/^<!-- include: ([\w./-]+) -->$/gm)) {
      included.push(path);
      await collect(path);
    }
  };
  await collect('shell.html');
  assert.deepEqual([...included].sort(), files.sort());
  assert.equal(new Set(included).size, included.length);
});

test('el ensamblador rechaza rutas fuera de html/', () => {
  assert.throws(() => assembleHtml('../index.html'), /fuera de html/);
});
