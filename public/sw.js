const CACHE_NAME = 'academia-v2-cache-v4'
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

// Escuchar mensaje para forzar activación del nuevo service worker
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const requestUrl = new URL(request.url)
  const isSameOrigin = requestUrl.origin === self.location.origin
  const isSupabaseRequest = requestUrl.hostname.includes('supabase')

  if (!isSameOrigin || isSupabaseRequest) {
    return
  }

  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned))
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(fetch(request))
    return
  }

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
  console.log('[SW] Push event received:', payload)

  const title = payload?.title || 'Academia'
  const options = {
    body: payload?.body || 'Tenés una actualización importante.',
    // Sin `icon`: en la PWA instalada Chrome ya muestra el ícono del manifest
    // y pasarlo aparte generaba el logo duplicado/superpuesto.
    // El `badge` es un checkmark monocromático (public/badge-96.png) que
    // Android siluetea en la barra de estado.
    badge: '/badge-96.png',
    tag: payload?.tag || 'academia-task-reminder',
    // Con el mismo `tag`, Android REEMPLAZA la notificación previa no leída en
    // vez de apilarla (protección extra si vuelven a duplicarse suscripciones).
    // `renotify` hace que al reemplazar sí vuelva a vibrar/sonar.
    renotify: true,
    data: {
      task_id: payload?.task_id || null,
      url: payload?.url || '/tasks',
    },
    vibrate: [200, 100, 200],
    silent: false, // usa el sonido de notificación del sistema (Android)
  }

  const shouldShowNotification = payload?.type !== 'pomodoro-complete'
    ? Promise.resolve(true)
    : clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) =>
      !windowClients.some((client) => client.visibilityState === 'visible')
    )

  event.waitUntil(shouldShowNotification.then((shouldShow) => {
    if (!shouldShow) return undefined
    return self.registration.showNotification(title, options)
  }))
})

// Último path conocido de la app (lo reporta PushNavigationHandler en main.jsx).
// Sirve para armar la URL correcta (bajo /s/:semesterId) en el fallback openWindow.
let lastAppPath = null

self.addEventListener('message', (event) => {
  if (event.data?.type === 'academia:path' && typeof event.data.path === 'string') {
    lastAppPath = event.data.path
  }
})

self.addEventListener('notificationclick', (event) => {
  event.preventDefault()
  event.notification.close()
  console.log('[SW] Notification click event:', event.notification.data)

  const { task_id: taskId, url } = event.notification?.data || {}
  // Tarea específica → /tasks?task=<id> (el cliente resuelve el semestre y
  // Tasks.jsx hace scroll + highlight). Resumen → lista de tareas del día.
  const tasksBase = lastAppPath ? lastAppPath.split('?')[0].replace(/\/tasks.*$/, '') : ''
  const targetUrl = taskId ? `${tasksBase}/tasks?task=${taskId}` : (url || `${tasksBase}/tasks`)
  const absoluteUrl = new URL(targetUrl, self.location.origin).toString()

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin)) {
          // Ya hay una ventana abierta: enfocarla y navegar sin recargar (SPA).
          return client.focus().then((focused) => {
            if ('postMessage' in focused) {
              focused.postMessage({ type: 'academia:navigate', url: targetUrl })
            }
            return focused
          })
        }
      }
      return clients.openWindow(absoluteUrl)
    })
  )
})
