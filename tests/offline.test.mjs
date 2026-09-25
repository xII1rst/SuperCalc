import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import vm from 'node:vm';

const workerSource = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
const scope = 'https://example.test/SuperCalc/';

function workerHarness(missingResource = '', cacheNames = []) {
  const handlers = {};
  const stored = new Map();
  const fetched = [];
  const deleted = [];
  let activated = false;
  let claimed = false;
  class ScopedRequest extends Request {
    constructor(input, options) {
      super(new URL(input, scope), options);
    }
  }
  const cache = {
    async addAll(requests) {
      for (const request of requests) {
        if (request.url.endsWith(missingResource) && missingResource) {
          throw new Error(`Recurso ausente: ${request.url}`);
        }
        stored.set(request.url, new Response(request.url));
      }
    },
    async add() { throw new Error('Fuente externa no disponible'); },
    async put(request, response) { stored.set(request.url, response); },
  };
  const caches = {
    async open() { return cache; },
    async keys() { return cacheNames; },
    async delete(key) { deleted.push(key); return true; },
    async match(request) { return stored.get(request.url); },
  };
  const self = {
    registration: { scope },
    addEventListener(type, listener) { handlers[type] = listener; },
    async skipWaiting() { activated = true; },
    clients: { async claim() { claimed = true; } },
  };
  const context = vm.createContext({
    self, caches, Request: ScopedRequest, Response, URL,
    fetch: async (request, options) => {
      fetched.push({ request, options });
      throw new Error('Sin conexión');
    },
  });
  vm.runInContext(workerSource, context);
  return {
    handlers, stored, fetched, deleted,
    precache: vm.runInContext('APP_PRECACHE', context),
    cacheName: vm.runInContext('CACHE', context),
    get activated() { return activated; },
    get claimed() { return claimed; },
  };
}

test('instala el módulo matemático y lo sirve desde caché sin conexión', async () => {
  const worker = workerHarness();
  let installation;
  worker.handlers.install({ waitUntil(promise) { installation = promise; } });
  await installation;

  const moduleUrl = `${scope}js/math/algebra/matrix.mjs`;
  for (const path of worker.precache) {
    await access(new URL(`../${path}`, import.meta.url));
  }
  assert.equal(worker.activated, true);
  assert.equal(worker.stored.has(moduleUrl), true);
  assert.equal(worker.stored.has(`${scope}theme.css`), true);
  assert.equal(worker.stored.has(`${scope}js/math/algebra/vector.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/graphics/figures.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/utils/format.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/ui/algebra/matrix.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/ui/algebra/inequalities.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/ui/branding.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/offline.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/ui/navigation.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/math/calculus.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/ui/algebra/functions.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/ui/algebra/sequences.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/math/algebra/polynomial.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/ui/plotter.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/ui/calculus.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/state/figures.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/ui/figure-controls.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/graphics/axes.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/ui/electromagnetism.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/ui/algebra/vectors.mjs`), true);
  assert.equal(worker.stored.has(`${scope}js/math/electromagnetism.mjs`), true);
  const jsFiles = await readdir(new URL('../js/', import.meta.url), { recursive: true });
  for (const file of jsFiles.filter(name => name.endsWith('.mjs'))) {
    assert.equal(worker.stored.has(`${scope}js/${file}`), true, `Sin precarga: ${file}`);
  }

  let responsePromise;
  worker.handlers.fetch({
    request: new Request(moduleUrl),
    respondWith(promise) { responsePromise = promise; },
  });
  const response = await responsePromise;
  assert.equal(await response.text(), moduleUrl);
  assert.equal(worker.fetched.length, 1);
  assert.equal(worker.fetched[0].options.cache, 'no-store');

  worker.handlers.fetch({
    request: new Request('https://other.example/SuperCalc/js/math/algebra/matrix.mjs'),
    respondWith(promise) { responsePromise = promise; },
  });
  await responsePromise;
  assert.equal(worker.fetched[1].options, undefined);
});

test('no activa una caché incompleta si falta el módulo', async () => {
  const worker = workerHarness('js/math/algebra/matrix.mjs');
  let installation;
  worker.handlers.install({ waitUntil(promise) { installation = promise; } });
  await assert.rejects(installation, /Recurso ausente/);
  assert.equal(worker.activated, false);
});

test('activate conserva las cachés ajenas a SuperCalc', async () => {
  const cacheName=workerHarness().cacheName;
  const worker=workerHarness('', ['supercalc-2.0.0',cacheName,'otra-app-v1']);
  let activation;
  worker.handlers.activate({waitUntil(promise){activation=promise;}});
  await activation;
  assert.deepEqual(worker.deleted,['supercalc-2.0.0']);
  assert.equal(worker.claimed,true);
});
