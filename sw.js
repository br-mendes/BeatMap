const CACHE_NAME = 'beatmap-v3.0.0';
const STATIC_CACHE = 'beatmap-static-v3.0.0';
const API_CACHE = 'beatmap-api-v3.0.0';

// Assets estáticos para cache
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
  // NOT calling skipWaiting() here to allow user to control update
});

// Ativar service worker e limpar caches antigos
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

// Listener para mensagem de atualização manual
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Estratégia de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. API do Spotify: Network First (Dados Dinâmicos)
  // Tenta rede primeiro, salva no cache, fallback para cache se offline
  if (url.hostname === 'api.spotify.com') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clona a resposta pois ela só pode ser consumida uma vez
          const clonedResponse = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // Fallback para cache se rede falhar
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

  // 2. Assets Estáticos: Cache First
  // Tenta cache primeiro, fallback para rede
  if (STATIC_ASSETS.includes(url.pathname) || STATIC_ASSETS.includes(request.url) || request.destination === 'image' || request.destination === 'style' || request.destination === 'script') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
           return cachedResponse;
        }
        return fetch(request).then(response => {
           if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
           }
           const responseToCache = response.clone();
           caches.open(STATIC_CACHE).then(cache => {
              cache.put(request, responseToCache);
           });
           return response;
        });
      })
    );
    return;
  }

  // 3. Navegação (HTML): Network First (com fallback para index.html/root)
  if (request.mode === 'navigate') {
     event.respondWith(
        fetch(request).catch(() => {
           return caches.match('/');
        })
     );
     return;
  }

  // 4. Default: Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});