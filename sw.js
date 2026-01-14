const CACHE_NAME = 'beatmap-v2.0.0';
const STATIC_CACHE = 'beatmap-static-v2.0.0';
const API_CACHE = 'beatmap-api-v2.0.0';

// Assets estáticos para cache
// Usando URLs do Unsplash para garantir funcionamento sem arquivos locais
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=192&h=192&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=512&h=512&fit=crop'
];

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Cache aberto');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API do Spotify - Network First
  if (url.hostname === 'api.spotify.com') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(
              JSON.stringify({ error: 'Offline - dados não disponíveis' }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Assets estáticos - Cache First
  if (STATIC_ASSETS.includes(url.pathname) || STATIC_ASSETS.includes(request.url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request);
      })
    );
    return;
  }

  // Outros recursos - Network First com fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-playlists') {
    event.waitUntil(syncPlaylists());
  }
});

async function syncPlaylists() {
  console.log('[Service Worker] Sincronizando playlists...');
  // Implementar lógica de sincronização futura
}

// Notificações push
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=192&h=192&fit=crop',
      badge: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=72&h=72&fit=crop',
      vibrate: [200, 100, 200],
      data: {
        url: data.url
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});