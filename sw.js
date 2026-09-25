// SuperCalc Service Worker: recursos de los módulos ES
const CACHE = 'supercalc-v1.0.0';
const APP_PRECACHE = [
  './',
  './index.html',
  './theme.css',
  './style.css',
  './app.js',
  './js/math/algebra/matrix.mjs',
  './js/math/algebra/vector.mjs',
  './js/math/algebra/triangle.mjs',
  './js/graphics/figures.mjs',
  './js/graphics/vector-canvas.mjs',
  './js/graphics/em-canvas.mjs',
  './js/graphics/colors.mjs',
  './js/graphics/formula-background.mjs',
  './js/utils/format.mjs',
  './js/ui/algebra/matrix.mjs',
  './js/ui/algebra/inequalities.mjs',
  './js/ui/branding.mjs',
  './js/offline.mjs',
  './js/ui/navigation.mjs',
  './js/ui/events.mjs',
  './js/ui/canvas-size.mjs',
  './js/ui/theme.mjs',
  './js/ui/toast.mjs',
  './js/math/calculus.mjs',
  './js/math/integration.mjs',
  './js/math/numeric.mjs',
  './js/math/series.mjs',
  './js/math/parametric.mjs',
  './js/math/polar.mjs',
  './js/math/conics.mjs',
  './js/math/integral-applications.mjs',
  './js/math/expression.mjs',
  './js/math/graph-types.mjs',
  './js/math/applications.mjs',
  './js/ui/algebra/functions.mjs',
  './js/ui/algebra/sequences.mjs',
  './js/math/algebra/polynomial.mjs',
  './js/ui/plotter.mjs',
  './js/graphics/graph-canvas.mjs',
  './js/ui/calculus.mjs',
  './js/state/figures.mjs',
  './js/ui/figure-controls.mjs',
  './js/graphics/axes.mjs',
  './js/ui/electromagnetism.mjs',
  './js/ui/electromagnetism-extra.mjs',
  './js/ui/algebra/vectors.mjs',
  './js/math/electromagnetism.mjs',
  './js/math/algebra/sequences.mjs',
  './js/math/algebra/inequalities.mjs',
  './js/math/algebra/functions.mjs',
  './js/graphics/analysis.mjs',
  './js/math/algebra/vector-equations.mjs'
];
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(APP_PRECACHE.map(url => new Request(url, {cache: 'reload'})))
        .then(() => c.add(FONT_URL).catch(() => {})))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('supercalc-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const APP_FILES = APP_PRECACHE.map(path => new URL(path, self.registration.scope).pathname);
const APP_ORIGIN = new URL(self.registration.scope).origin;

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isApp = url.origin === APP_ORIGIN && APP_FILES.includes(url.pathname);

  if (isApp) {
    // Network-first para los archivos principales — siempre intenta actualizar
    e.respondWith(
      fetch(e.request, {cache: 'no-store'})
        .then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first para fuentes y recursos externos
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => caches.match(e.request));
    })
  );
});
