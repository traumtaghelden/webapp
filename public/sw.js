const CACHE_NAME = 'wedding-planner-v1';
const RUNTIME_CACHE = 'wedding-planner-runtime-v1';
const IMAGE_CACHE = 'wedding-planner-images-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const IMAGE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name !== CACHE_NAME &&
                   name !== RUNTIME_CACHE &&
                   name !== IMAGE_CACHE;
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  if (url.href.includes('/rest/v1/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  if (request.destination === 'document') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  event.respondWith(handleStaticRequest(request));
});

async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);

  const cached = await cache.match(request);
  if (cached) {
    const cachedDate = new Date(cached.headers.get('date'));
    const now = new Date();

    if (now - cachedDate < IMAGE_CACHE_DURATION) {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function handleApiRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);

    if (response.ok && request.method === 'GET') {
      const clonedResponse = response.clone();
      const responseToCache = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: new Headers(clonedResponse.headers),
      });
      responseToCache.headers.set('sw-cache-date', new Date().toISOString());

      cache.put(request, responseToCache);
    }

    return response;
  } catch (error) {
    const cached = await cache.match(request);

    if (cached) {
      const cacheDate = cached.headers.get('sw-cache-date');
      if (cacheDate) {
        const cachedTime = new Date(cacheDate);
        const now = new Date();

        if (now - cachedTime < API_CACHE_DURATION) {
          const offlineResponse = new Response(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers: new Headers(cached.headers),
          });
          offlineResponse.headers.set('X-Offline-Response', 'true');
          return offlineResponse;
        }
      }
    }

    throw error;
  }
}

async function handleNavigationRequest(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    const fallback = await cache.match('/index.html');
    if (fallback) {
      return fallback;
    }

    throw error;
  }
}

async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);

  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('Background sync triggered');
}
