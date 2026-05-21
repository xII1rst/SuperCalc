// SuperCalc Service Worker v2.0.0
const CACHE = 'supercalc-2.0.0';
const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(
        PRECACHE.map(url => c.add(new Request(url, {cache: 'reload'})).catch(() => {}))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const APP_FILES = ['/', '/index.html', '/style.css', '/app.js'];

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isApp = APP_FILES.some(f => url.pathname === f || url.pathname.endsWith(f)) 
                || url.pathname === '/SuperCalc/' 
                || url.pathname.endsWith('/SuperCalc/');

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
