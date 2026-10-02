// SuperCalc Service Worker: recursos de los módulos ES
const CACHE = 'supercalc-v1.0-rework-9';
const APP_PRECACHE = [
  './',
  './index.html',
  './theme.css',
  './style.css',
  './fonts/fonts.css',
  './fonts/ibm-plex-sans-400-greek.woff2',
  './fonts/ibm-plex-sans-400-italic-greek.woff2',
  './fonts/ibm-plex-sans-400-italic-latin-ext.woff2',
  './fonts/ibm-plex-sans-400-italic-latin.woff2',
  './fonts/ibm-plex-sans-400-latin-ext.woff2',
  './fonts/ibm-plex-sans-400-latin.woff2',
  './fonts/ibm-plex-sans-500-greek.woff2',
  './fonts/ibm-plex-sans-500-latin-ext.woff2',
  './fonts/ibm-plex-sans-500-latin.woff2',
  './fonts/ibm-plex-sans-600-greek.woff2',
  './fonts/ibm-plex-sans-600-latin-ext.woff2',
  './fonts/ibm-plex-sans-600-latin.woff2',
  './fonts/ibm-plex-sans-700-greek.woff2',
  './fonts/ibm-plex-sans-700-latin-ext.woff2',
  './fonts/ibm-plex-sans-700-latin.woff2',
  './fonts/jetbrains-mono-400-greek.woff2',
  './fonts/jetbrains-mono-400-latin-ext.woff2',
  './fonts/jetbrains-mono-400-latin.woff2',
  './fonts/jetbrains-mono-600-greek.woff2',
  './fonts/jetbrains-mono-600-latin-ext.woff2',
  './fonts/jetbrains-mono-600-latin.woff2',
  './app.js',
  './js/math/algebra/matrix.mjs',
  './js/math/algebra/geometry.mjs',
  './js/math/algebra/linear-spaces.mjs',
  './js/math/algebra/parameter-systems.mjs',
  './js/math/numerical-analysis.mjs',
  './js/math/numerical-study.mjs',
  './js/math/numerical-systems.mjs',
  './js/math/physics-output.mjs',
  './js/math/poisson-rectangle.mjs',
  './js/state/physics-output.mjs',
  './js/ui/physics-output.mjs',
  './js/graphics/study-plot.mjs',
  './js/graphics/physics-diagrams.mjs',
  './js/math/logic.mjs',
  './js/math/logic-advanced.mjs',
  './js/math/graphs.mjs',
  './js/math/waves.mjs',
  './js/math/mechanics-advanced.mjs',
  './js/math/electromagnetism-advanced.mjs',
  './js/math/numerical-advanced.mjs',
  './js/math/differential-applications.mjs',
  './js/graphics/function-analysis.mjs',
  './js/math/study-calculus.mjs',
  './js/math/study-ode.mjs',
  './js/math/ode-study.mjs',
  './js/math/algebra/vector.mjs',
  './js/math/algebra/triangle.mjs',
  './js/graphics/figures.mjs',
  './js/graphics/vector-canvas.mjs',
  './js/graphics/em-canvas.mjs',
  './js/graphics/colors.mjs',
  './js/graphics/wave-plot.mjs',
  './js/graphics/logic-graph.mjs',
  './js/graphics/formula-background.mjs',
  './js/utils/format.mjs',
  './js/ui/algebra/matrix.mjs',
  './js/ui/algebra/geometry.mjs',
  './js/ui/algebra/linear-spaces.mjs',
  './js/ui/numerical-analysis.mjs',
  './js/ui/logic.mjs',
  './js/ui/waves.mjs',
  './js/ui/mechanics-advanced.mjs',
  './js/ui/electromagnetism-advanced.mjs',
  './js/ui/study-calculus.mjs',
  './js/ui/study/inputs.mjs',
  './js/ui/algebra/inequalities.mjs',
  './js/ui/branding.mjs',
  './js/offline.mjs',
  './js/ui/navigation.mjs',
  './js/ui/routes.mjs',
  './js/math/domain-guard.mjs',
  './js/content/theory.mjs',
  './js/ui/theory.mjs',
  './js/ui/events.mjs',
  './js/ui/canvas-size.mjs',
  './js/ui/theme.mjs',
  './js/ui/toast.mjs',
  './js/math/calculus.mjs',
  './js/math/calculus/parser.mjs',
  './js/math/calculus/ast.mjs',
  './js/math/calculus/printer.mjs',
  './js/math/calculus/format.mjs',
  './js/math/calculus/derivatives.mjs',
  './js/math/calculus/limit-forms.mjs',
  './js/math/calculus/limits.mjs',
  './js/math/calculus/numeric.mjs',
  './js/math/calculus/revolution.mjs',
  './js/math/calculus/antiderivative.mjs',
  './js/math/integration.mjs',
  './js/math/integration/ast-tools.mjs',
  './js/math/integration/format.mjs',
  './js/math/integration/polynomials.mjs',
  './js/math/integration/partial-fractions.mjs',
  './js/math/integration/rules/basic.mjs',
  './js/math/integration/rules/substitution.mjs',
  './js/math/integration/rules/by-parts.mjs',
  './js/math/integration/rules/trigonometric.mjs',
  './js/math/integration/engine.mjs',
  './js/math/integration/improper.mjs',
  './js/math/integration/definite.mjs',
  './js/math/integration/revolution.mjs',
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
  './js/ui/calculus/keyboard.mjs',
  './js/ui/calculus/cards.mjs',
  './js/ui/calculus/results.mjs',
  './js/ui/calculus/differential.mjs',
  './js/ui/calculus/applications.mjs',
  './js/ui/calculus/integral.mjs',
  './js/ui/calculus/series.mjs',
  './js/ui/calculus/multivariable.mjs',
  './js/ui/calculus/ode.mjs',
  './js/ui/calculus/curves.mjs',
  './js/ui/calculus/preview-renderer.mjs',
  './js/ui/calculus/previews.mjs',
  './js/ui/calculus/revolution.mjs',
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
  './js/math/algebra/vector-equations.mjs',
  './js/graphics/projection.mjs',
  './js/graphics/revolution.mjs',
  './js/graphics/preview-canvas.mjs',
  './js/math/vector-calculus.mjs',
  './js/math/multivariable.mjs',
  './js/math/multivariable-study.mjs',
  './js/math/statistics.mjs',
  './js/graphics/statistics-charts.mjs',
  './js/math/probability.mjs',
  './js/math/mechanics.mjs',
  './js/math/mechanics-units.mjs',
  './js/math/mechanics-solver.mjs',
  './js/math/experiments.mjs',
  './js/ui/statistics.mjs',
  './js/ui/probability.mjs',
  './js/ui/mechanics.mjs',
  './js/graphics/mechanics-trajectory.mjs',
  './js/ui/experiments.mjs'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(APP_PRECACHE.map(url => new Request(url, {cache: 'reload'}))))
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

  // Cache-first para recursos externos
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
