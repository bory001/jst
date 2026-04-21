const CACHE_NAME = 'br-siksa-v1';

const STATIC_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './login.mp4'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('firebase') ||
      url.includes('googleapis') ||
      url.includes('gstatic') ||
      url.includes('fonts.') ||
      url.includes('cdnjs')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(networkRes => {
        if (networkRes && networkRes.status === 200 && e.request.method === 'GET') {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        }
        return networkRes;
      })
      .catch(() => caches.match(e.request))
  );
});
