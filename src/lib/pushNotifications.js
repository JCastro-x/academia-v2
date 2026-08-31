// Shared push-notification enable flow.
// Used by Profile.jsx and the PWA/notification suggestion banner in AppLayout.
import { savePushSubscription, urlBase64ToUint8Array } from './supabase.js'

export function isPushSupported() {
  return typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
}

export async function enablePushNotifications() {
  if (!isPushSupported()) {
    const error = new Error('Este navegador no soporta notificaciones push.')
    error.code = 'unsupported'
    throw error
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    const error = new Error('Las notificaciones fueron rechazadas. Podés activarlas desde la configuración del navegador.')
    error.code = 'denied'
    throw error
  }

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidKey) {
    const error = new Error('Falta VITE_VAPID_PUBLIC_KEY en el entorno.')
    error.code = 'missing_key'
    throw error
  }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  })

  await savePushSubscription(subscription)
  return subscription
}