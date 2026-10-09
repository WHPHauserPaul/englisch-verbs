// Installierbar auf dem Startbildschirm (LH 1.1). Netz zuerst, damit neue Programmstände sofort
// wirken; der Zwischenspeicher springt nur bei Netzausfall ein.
const CACHE = 'englisch-verbs-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const antwort = await fetch(e.request, { cache: 'no-cache' });
      if (antwort.ok) cache.put(e.request, antwort.clone());
      return antwort;
    } catch {
      return (await cache.match(e.request)) ?? Response.error();
    }
  })());
});
