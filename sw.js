const CACHE_NAME = 'jst-v2';

const STATIC_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './login.mp4'
];

// ── 설치: 정적 파일 캐시 ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())  // 즉시 활성화
  );
});

// ── 활성화: 구버전 캐시 삭제 ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())  // 즉시 모든 탭 제어
  );
});

// ── fetch: 네트워크 우선, 실패 시 캐시 ──
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Firebase / Google API / 폰트 → 항상 네트워크만
  if (url.includes('firebase') ||
      url.includes('googleapis') ||
      url.includes('gstatic') ||
      url.includes('fonts.') ||
      url.includes('cdnjs')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // 정적 파일(html, js, css, 이미지, mp4) → 네트워크 우선
  e.respondWith(
    fetch(e.request)
      .then(networkRes => {
        // 성공 시 캐시 갱신
        if (networkRes && networkRes.status === 200 && e.request.method === 'GET') {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        }
        return networkRes;
      })
      .catch(() => {
        // 오프라인 시 캐시 폴백
        return caches.match(e.request);
      })
  );
});
