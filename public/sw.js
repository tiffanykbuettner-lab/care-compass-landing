/* ─────────────────────────────────────────────────────────────────────────────
   CareCompass Service Worker
   Strategy:
     • App shell (JS/CSS/HTML) → Cache-first, network fallback
     • API / dynamic data      → Network-first, cache fallback
     • Images                  → Cache-first, long TTL
   ───────────────────────────────────────────────────────────────────────────── */

const CACHE_VERSION = 'v1';
const SHELL_CACHE   = `carecompass-shell-${CACHE_VERSION}`;
const IMAGE_CACHE   = `carecompass-images-${CACHE_VERSION}`;
const DATA_CACHE    = `carecompass-data-${CACHE_VERSION}`;

// App shell assets to precache on install
const SHELL_ASSETS = [
  '/',
  '/dashboard',
  '/tracker',
  '/pricing',
  '/login',
  '/signup',
  '/manifest.json',
  '/offline.html',
];

// ── Install: precache the app shell ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(SHELL_ASSETS);
    })
  );
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const validCaches = [SHELL_CACHE, IMAGE_CACHE, DATA_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !validCaches.includes(key))
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ── Fetch: route to the right strategy ───────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // 1. API / external requests → Network-first
  if (
    url.hostname !== self.location.hostname ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/')
  ) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  // 2. Images → Cache-first
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // 3. App shell / navigation → Cache-first with offline fallback
  event.respondWith(cacheFirst(request, SHELL_CACHE));
});

// ── Strategy: Cache-first ─────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      return offlinePage || new Response('Offline', { status: 503 });
    }
    return new Response('Network error', { status: 503 });
  }
}

// ── Strategy: Network-first ───────────────────────────────────────────────────
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('Network error', { status: 503 });
  }
}

// ── Background sync: queue failed log submissions ─────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-symptom-logs') {
    event.waitUntil(syncSymptomLogs());
  }
});

async function syncSymptomLogs() {
  // When backend is live, this will flush queued symptom logs from IndexedDB
  // to the server once connectivity is restored.
  console.log('[SW] Background sync: symptom logs (pending backend)');
}

// ── Push notifications (stub — activate when backend is ready) ────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'CareCompass', {
      body: data.body || "Time to log today's symptoms.",
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'carecompass-reminder',
      renotify: true,
      data: { url: data.url || '/tracker' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/tracker';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) return client.focus();
      }
      return clients.openWindow(targetUrl);
    })
  );
});
