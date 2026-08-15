const CACHE_NAME = 'budget-app-v7';

// Risorse locali essenziali
const LOCAL_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

// Dipendenze esterne
const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js'
];

// Installazione: forza l'attivazione immediata senza attendere
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([...LOCAL_ASSETS, ...CDN_ASSETS]);
    })
  );
});

// Attivazione: elimina subito tutte le vecchie cache (v5, v6, ecc.) e prende il controllo dei client
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercettazione e Gestione Richieste
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Ignora protocolli non-HTTP (es. chrome-extension://, file://)
  if (!url.protocol.startsWith('http')) return;

  // 2. Ignora le chiamate backend di Firebase, Google APIs e WebSocket
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('gstatic.com/recaptcha')
  ) {
    return;
  }

  // 3. Ignora metodi diversi da GET
  if (event.request.method !== 'GET') return;

  // 4. Strategia Network-First con fallback su Cache (Zero conflitti di stream clone)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se la risposta non è valida o non è status 200, la restituisce subito
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // CLONAZIONE SICURA PRIMA DI LEGGERE LO STREAM
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      })
      .catch(() => {
        // Se la rete fallisce (es. offline), recupera dalla cache
        return caches.match(event.request);
      })
  );
});
