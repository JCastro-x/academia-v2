import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { queryClient } from './lib/queryClient.js'
import { getSession, onAuthStateChange, getStoredSessionUser } from './lib/supabase.js'
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
import './styles/index.css'

function ProtectedRoute({ children }) {
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (localStorage.getItem('academia-guest-mode') === 'true') {
      localStorage.removeItem('academia-guest-mode')
    }

    let isActive = true

    const syncSession = async () => {
      const cachedSessionUser = getStoredSessionUser()

      try {
        const session = await getSession()
        if (!isActive) return
        setUser(session?.user ?? cachedSessionUser ?? null)
      } catch (error) {
        console.warn('No active Supabase session', error)
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
      setUser(session?.user ?? getStoredSessionUser() ?? null)
      setLoading(false)
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-[var(--dm-text-muted)]">Cargando sesión...</div>
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return children
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error)
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Landing / entry */}
          <Route path="/" element={<Navigate to="/auth" replace />} />
          
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
