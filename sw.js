/* WealthModel service worker.
 *
 * Strategy:
 *  - Navigations: network-first, falling back to the cached shell offline.
 *    (Deploys are always picked up when online — nothing goes stale.)
 *  - Same-origin static assets (icons, manifest): stale-while-revalidate.
 *  - Cross-origin (API on Render, Firebase, CDNs) is never intercepted —
 *    model runs and auth always hit the network directly.
 */
const CACHE = 'wm-shell-v1';

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
