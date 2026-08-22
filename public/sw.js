/* 生活工作台 Service Worker —— 零依赖、缓存优先、仅缓存静态资源 */

const CACHE_NAME = 'life-dashboard-static-v2';

/* install 阶段预缓存的核心静态资源 */
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

/* install：预缓存核心资源，跳过等待立即激活 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

/* activate：清理旧版本缓存，立即接管页面 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* fetch：缓存优先 —— 仅拦截同源 GET 静态资源，API 请求一律直连网络 */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  /* 非 GET 请求（如云同步的 POST /api/save）不拦截，直接走网络 */
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  /* API 请求不做任何缓存（约束：不动态缓存 API 请求） */
  if (url.pathname.startsWith('/api/')) return;

  /* 仅处理同源请求 */
  if (url.origin !== self.location.origin) return;

/* 导航请求（HTML 页面）：网络优先 —— 每次部署后用户刷新即可看到最新内容，
   网络失败时才回退缓存（保证离线可用） */
if (request.mode === 'navigate') {
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        }
        return response;
      })
      .catch(() =>
        /* 离线兜底：回退到预缓存的首页 */
        caches.match('/').then((cached) => cached || caches.match(request))
      )
  );
  return;
}

/* 静态资源（含 hash 文件名）：缓存优先 */
event.respondWith(
  caches.match(request).then((cached) => {
    /* 缓存命中：直接返回 */
    if (cached) return cached;

    /* 缓存未命中：请求网络，成功后写入缓存 */
    return fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const cloned = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, cloned));
        }
        return response;
      })
      .catch(() => undefined);
  })
);
});
