const CACHE_NAME = 'balance-app-v2';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './icon.svg'
];

// Instalar y cachear assets iniciales
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting(); // Fuerza a que el nuevo SW se active inmediatamente
});

// Limpiar cachés antiguas
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Estrategia "Stale-While-Revalidate" para los assets estáticos
self.addEventListener('fetch', event => {
    // Excluir llamadas a APIs o archivos de datos CSV
    if (event.request.url.includes('api.github.com') || event.request.url.includes('.csv')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                // Si la red devuelve algo válido, actualizamos la caché por detrás
                if (networkResponse && networkResponse.status === 200) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Si falla la red, no hacemos nada extra, ya devolveremos la caché
            });

            // Devolvemos la caché si existe (super rápido), o esperamos a la red si no
            return cachedResponse || fetchPromise;
        })
    );
});
