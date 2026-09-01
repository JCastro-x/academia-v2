import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
export const AUTH_SESSION_FALLBACK_KEY = 'academia-session-user'

export const persistSessionSnapshot = (session) => {
  if (typeof window === 'undefined') return

  if (!session?.user) {
    localStorage.removeItem(AUTH_SESSION_FALLBACK_KEY)
    return
  }

  localStorage.setItem(AUTH_SESSION_FALLBACK_KEY, JSON.stringify({
    id: session.user.id,
    email: session.user.email,
    lastUpdatedAt: Date.now(),
  }))
}

export const getStoredSessionUser = () => {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(AUTH_SESSION_FALLBACK_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (error) {
    console.warn('Error reading cached session:', error)
    return null
  }
}

export const getAuthRedirectUrl = () => {
  if (typeof window === 'undefined') return '/auth/callback'

  const localHostnames = ['localhost', '127.0.0.1', '[::1]']
  const isLocalHost = localHostnames.includes(window.location.hostname)
  const explicitLocalRedirect = import.meta.env.VITE_LOCAL_AUTH_REDIRECT_URL

  if (isLocalHost && explicitLocalRedirect) {
    return `${explicitLocalRedirect.replace(/\/$/, '')}/auth/callback`
  }

  return `${window.location.origin}/auth/callback`
}

export const signInWithGoogle = async () => {
  const redirectTo = getAuthRedirectUrl()

  if (typeof window !== 'undefined') {
    const debugEnabled = window.localStorage.getItem('academia-debug-session') === '1' || new URLSearchParams(window.location.search).get('debug') === 'session'
    if (debugEnabled) {
      console.info('[DEBUG session] auth redirect', {
        hostname: window.location.hostname,
        origin: window.location.origin,
        redirectTo,
      })
    }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
      },
    },
  })

  if (error) throw error
  return data
}

export const signInLocalDev = async () => {
  const localHostnames = ['localhost', '127.0.0.1', '[::1]']
  const isLocalDev = import.meta.env.DEV && typeof window !== 'undefined' && localHostnames.includes(window.location.hostname)
  const devEmail = import.meta.env.VITE_DEV_EMAIL
  const devPassword = import.meta.env.VITE_DEV_PASSWORD

  if (!isLocalDev) {
    throw new Error('Local dev sign-in is only allowed in localhost development mode.')
  }

  if (!devEmail || !devPassword) {
    throw new Error('Missing VITE_DEV_EMAIL or VITE_DEV_PASSWORD in the local .env.local file.')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: devEmail,
    password: devPassword,
  })

  if (error) throw error
  persistSessionSnapshot(data.session)
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  persistSessionSnapshot(null)
}

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  persistSessionSnapshot(session)
  return session
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (user) persistSessionSnapshot({ user })
  return user
}

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    persistSessionSnapshot(session)
    callback(event, session)
  })
}

export const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const raw = window.atob(base64)
  const output = new Uint8Array(raw.length)

  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i)
  }

  return output
}

const arrayBufferToBase64 = (value) => {
  if (!value) return null

  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value)
  let binary = ''

  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }

  return btoa(binary)
}

const dispatchGlobalToast = (type, message) => {
  if (typeof window === 'undefined' || !message) return

  window.dispatchEvent(new CustomEvent('academia:toast', {
    detail: {
      type: type || 'error',
      message,
    },
  }))
}

export const getActivePushSubscription = async () => {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return null
  if (Notification.permission !== 'granted') return null

  try {
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  } catch (error) {
    console.error('[push] failed to read active browser subscription', error)
    return null
  }
}

export const serializePushSubscription = (subscription) => {
  const p256dh = subscription?.getKey ? subscription.getKey('p256dh') : subscription?.keys?.p256dh
  const auth = subscription?.getKey ? subscription.getKey('auth') : subscription?.keys?.auth

  return {
    endpoint: subscription?.endpoint,
    p256dh: p256dh ? arrayBufferToBase64(p256dh) : null,
    auth: auth ? arrayBufferToBase64(auth) : null,
  }
}

export const normalizeStoredPushSubscription = (subscription = {}) => {
  const endpoint = subscription.endpoint || subscription.end_point || null
  const p256dh = subscription.p256dh || subscription.p256dh_key || null
  const auth = subscription.auth || subscription.auth_key || null

  return {
    endpoint,
    p256dh: typeof p256dh === 'string' ? p256dh : p256dh ? arrayBufferToBase64(p256dh) : null,
    auth: typeof auth === 'string' ? auth : auth ? arrayBufferToBase64(auth) : null,
  }
}

export const hasPushSubscriptionMismatch = (activeSubscription, existingSubscriptions = []) => {
  if (!activeSubscription) return false

  const activeNormalized = normalizeStoredPushSubscription({
    endpoint: activeSubscription.endpoint,
    p256dh: activeSubscription.keys?.p256dh,
    auth: activeSubscription.keys?.auth,
  })

  if (!activeNormalized.endpoint) return false

  if (!existingSubscriptions.length) return true

  return !existingSubscriptions.some((row) => {
    const stored = normalizeStoredPushSubscription(row)
    return stored.endpoint === activeNormalized.endpoint &&
      stored.p256dh === activeNormalized.p256dh &&
      stored.auth === activeNormalized.auth
  })
}

export const savePushSubscription = async (subscription) => {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    throw new Error('No authenticated user available to save push subscription')
  }

  const payload = {
    user_id: user.id,
    endpoint: subscription.endpoint,
    p256dh: serializePushSubscription(subscription).p256dh,
    auth: serializePushSubscription(subscription).auth,
    user_agent: navigator.userAgent,
    is_active: true,
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(payload, { onConflict: 'endpoint' })

  if (error) {
    console.error('[push] failed to save subscription', error)
    dispatchGlobalToast('error', 'La suscripción push no pudo guardarse. Reintentá en unos segundos.')
    throw error
  }

  // Dedup: cada re-registro del SW (recargas, reinstalación de la PWA) genera
  // un endpoint nuevo; sin esto el mismo usuario acumula filas y el cron le
  // envía N notificaciones apiladas por cada envío. Dejamos solo la actual.
  const { error: cleanupError } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .neq('endpoint', subscription.endpoint)

  if (cleanupError) {
    console.warn('[push] failed to clean up stale subscriptions', cleanupError)
  }
}

export const ensurePushSubscriptionForCurrentUser = async ({ silent = false } = {}) => {
  const { data: { user } } = await supabase.auth.getUser()
  console.log('[push-sync] ensurePushSubscriptionForCurrentUser called for user:', user?.id)

  if (!user) {
    return false
  }

  const activeSubscription = await getActivePushSubscription()
  console.log('[push-sync] active browser subscription:', activeSubscription)
  if (!activeSubscription) {
    return false
  }

  const { data: stored, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, is_active')
    .eq('user_id', user.id)

  console.log('[push-sync] stored subscriptions:', stored)

  if (error) {
    console.error('[push] failed to read existing subscriptions', error)
    if (!silent) {
      dispatchGlobalToast('error', 'No se pudo verificar la suscripción push registrada.')
    }
    throw error
  }

  const mismatchDetected = hasPushSubscriptionMismatch(activeSubscription, stored ?? [])
  console.log('[push-sync] mismatch detected:', mismatchDetected)

  if (mismatchDetected) {
    await savePushSubscription(activeSubscription)
    return true
  }

  return true
}

export const deletePushSubscription = async (endpoint) => {
  if (!endpoint) return

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)

  if (error) throw error
}
