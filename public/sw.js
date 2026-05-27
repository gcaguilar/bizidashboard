const CACHE_NAME = 'datosbizi-v2'
const urlsToCache = []

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', event => {
  const request = event.request
  const acceptsHtml = request.headers.get('accept')?.includes('text/html')
  const isDocumentNavigation =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    acceptsHtml

  if (isDocumentNavigation) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
    return
  }

  event.respondWith(
    caches.match(request).then(response => response || fetch(request))
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  )
})
