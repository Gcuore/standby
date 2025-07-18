const CACHE_NAME = 'clock-pwa-v1';
const toCache = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/Fortnite - Hungry For The Chase - Piper Pace (Official Music Video).mp3',
  '/READY OR NOT - c00lkidd Chase Theme  Forsaken OST.mp3',
  '/SpotiDownloader.com - Nope your too late i already died - wifiskeleton.mp3',
  '/ventura.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(toCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
}); 