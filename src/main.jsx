import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { queryClient } from './lib/queryClient.js'
import { getSession, onAuthStateChange, getStoredSessionUser } from './lib/supabase.js'
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
import { startTaskNotificationScheduler } from './lib/notificationScheduler.js'
import './styles/index.css'

function SessionRedirect() {
  const [loading, setLoading] = React.useState(true)
  const navigate = useNavigate()

  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await getSession()
        if (session?.user) {
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
        navigate('/auth', { replace: true })
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

  React.useEffect(() => {
    if (localStorage.getItem('academia-guest-mode') === 'true') {
      localStorage.removeItem('academia-guest-mode')
    }

    const debugInfo = {
      enabled: sessionDebugEnabled,
      hasSupabaseStorageKeys: false,
      supabaseStorageKeyCount: 0,
      displayModeStandalone: window.matchMedia('(display-mode: standalone)').matches,
      isPwaInstalled: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
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
        setUser(session?.user ?? cachedSessionUser ?? null)
      } catch (error) {
        logSessionDebug('No active Supabase session', {
          errorName: error?.name ?? 'UnknownError',
          hasCachedSessionUser: Boolean(cachedSessionUser),
        })
        console.warn('[DEBUG session] No active Supabase session', error)
        if (!isActive) return

        if (navigator.onLine && cachedSessionUser) {
          setUser(cachedSessionUser)
        } else {
          setUser(cachedSessionUser ?? null)
        }
      } finally {
        if (isActive) setLoading(false)
      }
    }

    syncSession()

    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      if (!isActive) return
      logSessionDebug('auth state changed', {
        event: _event,
        hasSession: Boolean(session),
        hasUser: Boolean(session?.user),
      })
      setUser(session?.user ?? getStoredSessionUser() ?? null)
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
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error)
    })
  })
}

window.addEventListener('load', () => {
  startTaskNotificationScheduler()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
