/* ============================================================
   SERVICE WORKER — offline, and always current when online.

   Network-first with a cache fallback. Online you always get the
   file you just edited (no stale-asset confusion); offline, on a
   ride or with no signal, the whole app still opens and every
   write still lands in IndexedDB.

   Nothing about your data goes through here — the record lives in
   IndexedDB, not in this cache. Clearing the cache costs you
   nothing but a reload.
   ============================================================ */
const CACHE = 'life-organizer-202609100109';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/core.css',
  './assets/css/app.css',
  './assets/css/companion.css',
  './assets/js/adaptive.js',
  './assets/js/companion.js',
  './assets/icons/lumen-ball-192.png',
  './assets/icons/lumen-ball-512.png',
  './assets/icons/lumen-ball-apple.png',
  './assets/icons/lumen-ball-maskable-192.png',
  './assets/icons/lumen-ball-maskable-512.png',
  './assets/js/store.js',
  './assets/js/level.js',
  './assets/js/library.js',
  './assets/js/ui.js',
  './assets/js/quotes.js',
  './assets/js/actions.js',
  './assets/js/classify.js',
  './assets/js/aims.js',
  './assets/js/insight.js',
  './assets/js/advice.js',
  './assets/js/sync.js',
  './assets/js/shell.js',
  './assets/js/surfaces/do.js',
  './assets/js/surfaces/write.js',
  './assets/js/surfaces/advice.js',
  './assets/js/surfaces/me.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        // keep a fresh copy for the next time there is no signal
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true })
          .then(hit => hit || caches.match('./index.html', { ignoreSearch: true }))
      )
  );
});
