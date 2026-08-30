import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
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

export const signInWithGoogle = async () => {
  const redirectTo = `${window.location.origin}/auth/callback`
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) throw error
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

export const savePushSubscription = async (subscription) => {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    throw new Error('No authenticated user available to save push subscription')
  }

  const p256dh = subscription.getKey('p256dh')
  const auth = subscription.getKey('auth')

  const payload = {
    user_id: user.id,
    endpoint: subscription.endpoint,
    p256dh: p256dh ? btoa(String.fromCharCode(...new Uint8Array(p256dh))) : null,
    auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : null,
    user_agent: navigator.userAgent,
    is_active: true,
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(payload, { onConflict: 'endpoint' })

  if (error) throw error
}

export const deletePushSubscription = async (endpoint) => {
  if (!endpoint) return

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)

  if (error) throw error
}
