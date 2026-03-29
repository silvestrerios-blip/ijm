/* ── Inner Journey Method™ — Service Worker ── */
const CACHE_NAME = 'ijm-v1';

/* Recursos que se cachean al instalar */
const PRECACHE = [
  './IJM-APP.html',
  './manifest.json'
];

/* Instalación: pre-caché de recursos esenciales */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

/* Activación: limpia cachés antiguas */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* Fetch: estrategia Network-First con fallback a caché */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* Recursos externos (Supabase, Google Fonts, CDN): siempre red */
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('jsdelivr.net') ||
    url.hostname.includes('ovh.net')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  /* Resto: Network-First, fallback a caché */
  event.respondWith(
    fetch(event.request)
      .then(response => {
        /* Guarda en caché si es válido */
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
