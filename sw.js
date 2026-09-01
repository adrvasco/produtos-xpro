// Service worker do Estoque Produtos XPRO33
// Estratégia: network-first. Sempre tenta buscar a versão mais nova na
// internet primeiro; só usa a cópia salva localmente se estiver sem conexão.
// Isso evita o app "prender" numa versão antiga depois de uma atualização.
const CACHE_NAME = 'xpro33-produtos-v2';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Nunca intercepta Firebase (dados sempre em tempo real, nunca do cache)
  if (url.indexOf('firebaseio.com') !== -1 || url.indexOf('googleapis.com') !== -1) {
    return;
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
