/* WealthModel service worker.
 *
 * Strategy:
 *  - Navigations AND app code (js/css): network-first, falling back to cache
 *    offline. Deploys are always picked up when online — nothing goes stale.
 *  - Other same-origin static assets (icons, manifest): stale-while-revalidate.
 *  - Cross-origin (API on Render, Firebase, CDNs) is never intercepted —
 *    model runs and auth always hit the network directly.
 */
const CACHE = 'wm-shell-v2';

// App code that must never be served stale after a deploy.
const NETWORK_FIRST = /\.(?:js|css)$/;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // leave API/CDN/Firebase alone

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('shell', copy));
          return res;
        })
        .catch(() => caches.match('shell'))
    );
    return;
  }

  // App code (js/css): network-first so a deploy is picked up immediately,
  // falling back to the cached copy only when offline.
  if (NETWORK_FIRST.test(url.pathname)) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Static assets: serve cache immediately, refresh it in the background
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
