const CACHE_NAME = 'budget-app-v5';

// File locali dell'applicazione
const LOCAL_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

// Librerie esterne su CDN
const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js'
];

// Intercettazione richieste di rete
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Esclude le chiamate dirette al database/autenticazione Firebase
  if (
    url.hostname.includes('firebaseio.com') || 
    url.hostname.includes('identitytoolkit') || 
    url.hostname.includes('firestore.googleapis.com')
  ) {
    return;
  }

  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        // Verifica risposta valida (inclusi gli asset no-cors di tipo 'opaque')
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          // CLONA LA RISPOSTA PRIMA DI USARLA
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Attivazione: rimozione vecchie cache
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Intercettazione richieste di rete
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Esclude le chiamate dirette al database/autenticazione Firebase (gestite dall'SDK)
  if (
    url.hostname.includes('firebaseio.com') || 
    url.hostname.includes('identitytoolkit') || 
    url.hostname.includes('firestore.googleapis.com')
  ) {
    return;
  }

  if (e.request.method !== 'GET') return;

  // Strategia Stale-While-Revalidate (restituisce cache e aggiorna in background)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
