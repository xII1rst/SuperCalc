import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import vm from 'node:vm';

// Static module graph of the application, read with the engine's own parser.
const root = new URL('../', import.meta.url);
const files = ['app.js', ...(await readdir(new URL('js/', root), { recursive: true }))
  .filter(file => file.endsWith('.mjs')).map(file => `js/${file}`)].sort();
// Graph key of an import: its path inside the repository, or a marker that
// can never match an application module when it resolves outside.
const resolveImport = (specifier, file) => {
  const href = new URL(specifier, new URL(file, root)).href;
  return href.startsWith(root.href) ? href.slice(root.href.length) : `fuera del repositorio: ${href}`;
};
const graph = new Map();
for (const file of files) {
  const module = new vm.SourceTextModule(await readFile(new URL(file, root), 'utf8'), { identifier: file });
  graph.set(file, module.dependencySpecifiers.map(specifier => resolveImport(specifier, file)));
}
const layer = file => file === 'app.js' ? 'app' : file.split('/')[1];

// Which layers each layer may import. Calculations stay free of the DOM and
// of the interface; content is pure data.
const ALLOWED = {
  app: ['app', 'ui', 'graphics', 'math', 'utils', 'state', 'content', 'offline.mjs'],
  ui: ['ui', 'graphics', 'math', 'utils', 'state', 'content'],
  graphics: ['graphics', 'math', 'utils', 'state'],
  state: ['state', 'utils'],
  math: ['math', 'utils'],
  utils: ['utils'],
  content: ['content'],
  'offline.mjs': [],
};

test('toda importación relativa apunta a un módulo existente de la aplicación', () => {
  for (const [file, deps] of graph) for (const dep of deps) {
    assert.ok(existsSync(new URL(dep, root)), `${file} importa ${dep}, que no existe`);
    assert.ok(graph.has(dep), `${file} importa ${dep}, fuera de app.js y js/**/*.mjs`);
  }
});

test('una importación que sale del repositorio no se confunde con un módulo local', () => {
  const outside = resolveImport('../../../OtherCalc/js/math/expression.mjs', 'js/math/applications.mjs');
  assert.match(outside, /^fuera del repositorio:/);
  assert.equal(graph.has(outside), false);
  assert.equal(resolveImport('../expression.mjs', 'js/math/calculus/parser.mjs'), 'js/math/expression.mjs');
});

test('el grafo de módulos no tiene ciclos', () => {
  const state = new Map();
  const visit = (file, path) => {
    if (state.get(file) === 'done') return;
    assert.notEqual(state.get(file), 'open', `ciclo: ${[...path, file].join(' → ')}`);
    state.set(file, 'open');
    for (const dep of graph.get(file)) visit(dep, [...path, file]);
    state.set(file, 'done');
  };
  for (const file of graph.keys()) visit(file, []);
});

test('cada capa importa solo las capas permitidas', () => {
  for (const [file, deps] of graph) for (const dep of deps) {
    assert.ok(ALLOWED[layer(file)]?.includes(layer(dep)), `${file} (${layer(file)}) no debe importar ${dep} (${layer(dep)})`);
  }
});
