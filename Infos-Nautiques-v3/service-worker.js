const CACHE = "infos-nautiques-v4";

const FILES = [
    "./",
    "./index.html",
    "./css/style.css",
    "./data/villes.json",
    "./js/utils.js",
    "./js/meteo.js",
    "./js/marine.js",
    "./js/marees.js",
    "./js/app.js",
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(FILES))
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    // Ne pas intercepter ni mettre en cache les requêtes vers les API météo en ligne
    if (event.request.url.includes("api.open-meteo.com") ||
        event.request.url.includes("marine-api.open-meteo.com")) {
        return;
    }
    // Stratégie Réseau d'abord, Cache en secours pour voir ses modifications instantanément
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (event.request.method === "GET" && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE).then(cache => cache.put(event.request, responseClone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});