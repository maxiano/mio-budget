Nel tuo file sw.js ci sono tre errori critici che generano le eccezioni che stai riscontrando:

Importazione di Firestore: Nel CDN_ASSETS stai caricando firebase-firestore.js. Poiché utilizzi Realtime Database e non hai creato il database Firestore su Console, la SDK prova a connettersi in background fallendo.

Doppio listener fetch: Nel file hai registrato due volte self.addEventListener('fetch', ...). Il secondo sovrascrive/interferisce con il primo e manca dei filtri di sicurezza per schemi non-HTTP (come le estensioni Chrome).

Consumo della Response nello stream e clone tardivo: Nelle promesse async del fetchPromise, la gestione della response provoca la doppia lettura dello stream (body is already used).

Codice sw.js Corretto
Sostituisci l'intero contenuto del tuo file sw.js con questo codice pulito ed ottimizzato:

JavaScript
const CACHE_NAME = 'budget-app-v7';

// File locali dell'applicazione
const LOCAL_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

// Librerie esterne su CDN (Rimosso Firestore)
const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js'
];

// Installazione: caching iniziale delle risorse
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([...LOCAL_ASSETS, ...CDN_ASSETS]);
    }).then(() => self.skipWaiting())
  );
});

// Attivazione: pulizia vecchie cache e presa in carico immediata dei client
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Intercettazione richieste di rete (Singolo Listener unificato)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 1. Ignora protocolli non-HTTP (es. estensioni chrome-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 2. Escludi chiamate backend Firebase / Auth / Realtime DB (gestite internamente dall'SDK)
  if (
    url.hostname.includes('firebaseio.com') || 
    url.hostname.includes('identitytoolkit') || 
    url.hostname.includes('googleapis.com')
  ) {
    return;
  }

  // 3. Gestisci solo richieste GET
  if (e.request.method !== 'GET') return;

  // 4. Strategia Stale-While-Revalidate senza errori di stream clone
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
  if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
    
    // 1. CLONA SUBITO IL RISULTATO IN UNA VARIABILE DEDICATA
    const responseToCache = networkResponse.clone();

    // 2. SALVA LA COPIA IN CACHE
    caches.open(CACHE_NAME).then((cache) => {
      cache.put(e.request, responseToCache);
    });
  }
  
  // 3. RESTITUISCI L'ORIGINALE
  return networkResponse;
}).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
