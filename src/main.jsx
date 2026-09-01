import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { queryClient } from './lib/queryClient.js'
import { getSession, onAuthStateChange, getStoredSessionUser, ensurePushSubscriptionForCurrentUser } from './lib/supabase.js'
import { getSemesters } from './features/semesters/api.js'
import AppLayout from './layouts/AppLayout.jsx'
import Auth from './pages/Auth.jsx'
import AuthCallback from './pages/AuthCallback.jsx'
import Terms from './pages/Terms.jsx'
import Privacy from './pages/Privacy.jsx'
import Overview from './pages/Overview.jsx'
import Semesters from './pages/Semesters.jsx'
import CreateFirstSemester from './pages/CreateFirstSemester.jsx'
import Subjects from './pages/Subjects.jsx'
import Tasks from './pages/Tasks.jsx'
import ScheduleTable from './pages/ScheduleTable.jsx'
import Grades from './pages/Grades.jsx'
import Calendar from './pages/Calendar.jsx'
import Notes from './pages/Notes.jsx'
import Habits from './pages/Habits.jsx'
import Clock from './pages/Clock.jsx'
import Profile from './pages/Profile.jsx'
import Exam from './pages/Exam.jsx'
// NOTA: El scheduler local de notificaciones (src/lib/notificationScheduler.js) está DESACTIVADO
// a propósito. Fue reemplazado por el cron server-side de Supabase (Push Notifications) que
// cubre la misma funcionalidad: resumen matutino/nocturno, recordatorios de 1 día y 3 horas
// antes, y reminder_at manual. Reactivar este scheduler generaría notificaciones duplicadas.
// El archivo se conserva por si hay que revertir — basta con descomentar el import y la
// llamada a startTaskNotificationScheduler() en el listener de 'load' más abajo.
// import { startTaskNotificationScheduler } from './lib/notificationScheduler.js'
import './styles/index.css'

function SessionRedirect() {
  const [loading, setLoading] = React.useState(true)
  const navigate = useNavigate()

  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const cachedSessionUser = getStoredSessionUser()
        const { data: { session } } = await getSession()
        
        if (session?.user) {
          const semesters = await getSemesters()
          if (semesters && semesters.length > 0) {
            const activeSemester = semesters.find((s) => s.activo) || semesters[0]
            navigate(`/s/${activeSemester.id}`, { replace: true })
          } else {
            navigate('/create-first-semester', { replace: true })
          }
        } else if (cachedSessionUser) {
          // Offline fallback: usar sesión cacheada si getSession falla
          const semesters = await getSemesters()
          if (semesters && semesters.length > 0) {
            const activeSemester = semesters.find((s) => s.activo) || semesters[0]
            navigate(`/s/${activeSemester.id}`, { replace: true })
          } else {
            navigate('/create-first-semester', { replace: true })
          }
        } else {
          navigate('/auth', { replace: true })
        }
      } catch (error) {
        console.warn('Error checking session:', error)
        // Intentar fallback con sesión cacheada
        const cachedSessionUser = getStoredSessionUser()
        if (cachedSessionUser) {
          try {
            const semesters = await getSemesters()
            if (semesters && semesters.length > 0) {
              const activeSemester = semesters.find((s) => s.activo) || semesters[0]
              navigate(`/s/${activeSemester.id}`, { replace: true })
            } else {
              navigate('/create-first-semester', { replace: true })
            }
          } catch (fallbackError) {
            console.warn('Fallback also failed:', fallbackError)
            navigate('/auth', { replace: true })
          }
        } else {
          navigate('/auth', { replace: true })
        }
      } finally {
        setLoading(false)
      }
    }
    
    checkSession()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-[var(--dm-text-muted)]">
        Cargando...
      </div>
    )
  }

  return null
}

const SESSION_DEBUG_STORAGE_KEY = 'academia-debug-session'

function isSessionDebugEnabled() {
  if (typeof window === 'undefined') return false

  try {
    const searchParams = new URLSearchParams(window.location.search)
    const queryDebug = searchParams.get('debug') === 'session'

    if (queryDebug) {
      localStorage.setItem(SESSION_DEBUG_STORAGE_KEY, '1')
    }

    const storageDebug = localStorage.getItem(SESSION_DEBUG_STORAGE_KEY) === '1'
    return queryDebug || storageDebug
  } catch (error) {
    console.warn('[DEBUG session] Failed to read debug flag', error)
    return false
  }
}

function logSessionDebug(message, payload) {
  if (!isSessionDebugEnabled()) return
  console.info(`[DEBUG session] ${message}`, payload)
}

function ProtectedRoute({ children }) {
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [sessionDebug, setSessionDebug] = React.useState(null)
  const sessionDebugEnabled = isSessionDebugEnabled()
  const pushSyncUserRef = React.useRef(null)

  React.useEffect(() => {
    const isGuestMode = localStorage.getItem('academia-guest-mode') === 'true'
    
    if (isGuestMode) {
      setUser({ id: 'guest', email: 'guest@academia.local' })
      setLoading(false)
      return
    }

    const debugInfo = {
      enabled: sessionDebugEnabled,
      hasSupabaseStorageKeys: false,
      supabaseStorageKeyCount: 0,
      displayModeStandalone: window.matchMedia('(display-mode: standalone)').matches,
      isPwaInstalled: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
    }

    const syncPushSubscription = async (nextUser) => {
      if (!nextUser || nextUser.id === 'guest') {
        pushSyncUserRef.current = null
        return
      }

      if (pushSyncUserRef.current === nextUser.id) {
        return
      }

      pushSyncUserRef.current = nextUser.id

      try {
        await ensurePushSubscriptionForCurrentUser({ silent: true })
      } catch (error) {
        console.warn('[push] auto-sync check failed', error)
      }
    }

    const localStorageKeys = Object.keys(localStorage)
    const supabaseKeys = localStorageKeys.filter((key) => key.startsWith('sb-'))
    debugInfo.hasSupabaseStorageKeys = supabaseKeys.length > 0
    debugInfo.supabaseStorageKeyCount = supabaseKeys.length

    logSessionDebug('bootstrap', debugInfo)
    setSessionDebug(debugInfo)

    let isActive = true

    const syncSession = async () => {
      const cachedSessionUser = getStoredSessionUser()

      try {
        const session = await getSession()
        if (!isActive) return
        logSessionDebug('getSession result', {
          hasSession: Boolean(session),
          hasUser: Boolean(session?.user),
          sessionStorageFallback: Boolean(cachedSessionUser),
        })
        const nextUser = session?.user ?? cachedSessionUser ?? null
        setUser(nextUser)
        if (nextUser) {
          await syncPushSubscription(nextUser)
        }
      } catch (error) {
        logSessionDebug('No active Supabase session', {
          errorName: error?.name ?? 'UnknownError',
          hasCachedSessionUser: Boolean(cachedSessionUser),
        })
        console.warn('[DEBUG session] No active Supabase session', error)
        if (!isActive) return

        if (navigator.onLine && cachedSessionUser) {
          setUser(cachedSessionUser)
          await syncPushSubscription(cachedSessionUser)
        } else {
          const nextUser = cachedSessionUser ?? null
          setUser(nextUser)
          if (nextUser) {
            await syncPushSubscription(nextUser)
          }
        }
      } finally {
        if (isActive) setLoading(false)
      }
    }

    syncSession()

    const { data: { subscription } } = onAuthStateChange(async (_event, session) => {
      if (!isActive) return
      logSessionDebug('auth state changed', {
        event: _event,
        hasSession: Boolean(session),
        hasUser: Boolean(session?.user),
      })
      const nextUser = session?.user ?? getStoredSessionUser() ?? null
      setUser(nextUser)
      if (nextUser) {
        try {
          await syncPushSubscription(nextUser)
        } catch (error) {
          console.warn('[push] auth-state sync failed', error)
        }
      }
      setLoading(false)
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [sessionDebugEnabled])

  if (loading) {
    return (
      <>
        {sessionDebugEnabled && sessionDebug && (
          <div className="fixed right-3 top-3 z-[100] rounded-full border border-amber-300/60 bg-amber-100/90 px-2 py-1 text-[10px] font-medium text-amber-900 shadow-sm backdrop-blur-sm">
            DEBUG: {sessionDebug.hasSupabaseStorageKeys ? 'storage: yes' : 'storage: no'} · PWA: {sessionDebug.displayModeStandalone ? 'standalone' : 'browser'}
          </div>
        )}
        <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-[var(--dm-text-muted)]">Cargando sesión...</div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        {sessionDebugEnabled && sessionDebug && (
          <div className="fixed right-3 top-3 z-[100] rounded-full border border-amber-300/60 bg-amber-100/90 px-2 py-1 text-[10px] font-medium text-amber-900 shadow-sm backdrop-blur-sm">
            DEBUG: {sessionDebug.hasSupabaseStorageKeys ? 'storage: yes' : 'storage: no'} · PWA: {sessionDebug.displayModeStandalone ? 'standalone' : 'browser'}
          </div>
        )}
        <Navigate to="/auth" replace />
      </>
    )
  }

  return (
    <>
      {sessionDebugEnabled && sessionDebug && (
        <div className="fixed right-3 top-3 z-[100] rounded-full border border-emerald-300/60 bg-emerald-100/90 px-2 py-1 text-[10px] font-medium text-emerald-900 shadow-sm backdrop-blur-sm">
          DEBUG: {sessionDebug.hasSupabaseStorageKeys ? 'storage: yes' : 'storage: no'} · PWA: {sessionDebug.displayModeStandalone ? 'standalone' : 'browser'}
        </div>
      )}
      {children}
    </>
  )
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('[SW] Service Worker registered successfully:', registration)

        // Detectar actualizaciones del service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New service worker available, reloading...')
                // Forzar recarga para activar la nueva versión
                window.location.reload()
              }
            })
          }
        })

        // Verificar si hay una actualización pendiente al cargar
        if (registration.waiting) {
          console.log('[SW] Service worker waiting, activating...')
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          window.location.reload()
        }
      }).catch((error) => {
        console.error('[SW] Service Worker registration failed:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        })
      })
    } catch (error) {
      console.error('[SW] Unexpected error during Service Worker registration:', error)
    }
  })
}

// Scheduler local desactivado: ver nota en los imports de arriba.
// window.addEventListener('load', () => {
//   startTaskNotificationScheduler()
// })

// Último semestre activo conocido — fallback para deep links de push
// notifications cuando la URL actual no vive bajo /s/:semesterId.
const LAST_SEMESTER_STORAGE_KEY = 'academia:lastSemesterId'

function getLastSemesterId() {
  try {
    return localStorage.getItem(LAST_SEMESTER_STORAGE_KEY)
  } catch {
    return null
  }
}

function getLastSemesterIdFromPath() {
  return window.location.pathname.match(/^\/s\/([^/]+)/)?.[1] ?? null
}

// Navegación disparada desde el service worker (click en push notification).
// El SW enfoca la ventana existente y manda un postMessage; acá resolvemos la
// URL dentro del contexto actual (las rutas de app viven bajo /s/:semesterId).
function PushNavigationHandler() {
  const navigate = useNavigate()
  const location = useLocation()

  // Persistir el semesterId activo y reportar el path al SW (para el fallback openWindow).
  useEffect(() => {
    const semesterId = getLastSemesterIdFromPath()
    if (semesterId) {
      try {
        localStorage.setItem(LAST_SEMESTER_STORAGE_KEY, semesterId)
      } catch {
        // localStorage lleno/bloqueado: el fallback simplemente no estará disponible
      }
    }
    navigator.serviceWorker?.controller?.postMessage({ type: 'academia:path', path: `${location.pathname}${location.search}` })
  }, [location])

  useEffect(() => {
    const handler = (event) => {
      if (event.data?.type !== 'academia:navigate' || !event.data.url) return
      let url = event.data.url
      const semesterId = getLastSemesterIdFromPath() ?? getLastSemesterId()
      if (semesterId && !url.startsWith(`/s/${semesterId}/`)) {
        url = `/s/${semesterId}${url}`
      }
      navigate(url)
    }
    navigator.serviceWorker?.addEventListener('message', handler)
    return () => navigator.serviceWorker?.removeEventListener('message', handler)
  }, [navigate])

  return null
}

// Fallback de arranque "en frío" (app cerrada, SW despertado por openWindow):
// el SW abre /tasks?task=X sin semestre; si hay un semestre guardado en
// localStorage, redirige conservando el query param. Si no, va a /auth.
function ColdStartRedirect() {
  const navigate = useNavigate()

  React.useEffect(() => {
    const semesterId = getLastSemesterId()
    if (semesterId && /^\/tasks\/?$/.test(window.location.pathname)) {
      navigate(`/s/${semesterId}${window.location.pathname}${window.location.search}`, { replace: true })
    } else {
      navigate('/auth', { replace: true })
    }
  }, [navigate])

  return null
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PushNavigationHandler />
        <Routes>
          {/* Landing / entry */}
          <Route path="/" element={<SessionRedirect />} />
          
          {/* Auth routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          
          {/* Create first semester (protected but doesn't need semesterId) */}
          <Route
            path="/create-first-semester"
            element={
              <ProtectedRoute>
                <CreateFirstSemester />
              </ProtectedRoute>
            }
          />
          
          {/* Protected routes */}
          <Route
            path="/s/:semesterId"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="semesters" element={<Semesters />} />
            <Route path="subjects" element={<Subjects />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="schedule" element={<ScheduleTable />} />
            <Route path="grades" element={<Grades />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="notes" element={<Notes />} />
            <Route path="habits" element={<Habits />} />
            <Route path="clock" element={<Clock />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Exam mode - fullscreen without sidebar */}
          <Route
            path="/s/:semesterId/exam"
            element={
              <ProtectedRoute>
                <Exam />
              </ProtectedRoute>
            }
          />
          
          {/* Fallback: deep links de push sin semestre → redirigir con el último semestre */}
          <Route path="*" element={<ColdStartRedirect />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
