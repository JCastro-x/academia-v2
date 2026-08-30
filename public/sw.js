const CACHE_NAME = 'academia-v2-cache-v1'
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request).then((response) => {
        const cloned = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned))
        return response
      }).catch(() => {
        if (request.destination === 'document') {
          return caches.match('/index.html')
        }

        return caches.match('/favicon.svg')
      })
    })
  )
})

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : null
  const title = payload?.title || 'Academia'
  const options = {
    body: payload?.body || 'Tenés una actualización importante.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload?.tag || 'academia-task-reminder',
    data: {
      url: payload?.url || '/tasks',
    },
    vibrate: [200, 100, 200],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.preventDefault()

  const url = event.notification?.data?.url || '/tasks'
  const targetUrl = new URL(url, self.location.origin).toString()

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => client.navigate(targetUrl))
        }
      }

      return clients.openWindow(targetUrl)
    })
  )
})
