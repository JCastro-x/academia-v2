import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { queryClient } from './lib/queryClient.js'
import { getCurrentUser } from './lib/supabase.js'
import AppLayout from './layouts/AppLayout.jsx'
import Auth from './pages/Auth.jsx'
import AuthCallback from './pages/AuthCallback.jsx'
import Overview from './pages/Overview.jsx'
import CreateFirstSemester from './pages/CreateFirstSemester.jsx'
import Subjects from './pages/Subjects.jsx'
import Tasks from './pages/Tasks.jsx'
import Schedule from './pages/Schedule.jsx'
import Grades from './pages/Grades.jsx'
import Calendar from './pages/Calendar.jsx'
import Notes from './pages/Notes.jsx'
import Habits from './pages/Habits.jsx'
import './styles/index.css'

function ProtectedRoute({ children }) {
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const isGuest = localStorage.getItem('academia-guest-mode') === 'true'

  React.useEffect(() => {
    if (isGuest) {
      setLoading(false)
      return
    }

    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [isGuest])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  if (!user && !isGuest) {
    return <Navigate to="/auth" replace />
  }

  return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Static pages - served directly from public/ */}
          <Route path="/" element={<Navigate to="/landing.html" replace />} />
          
          {/* Auth routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
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
            <Route path="subjects" element={<Subjects />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="grades" element={<Grades />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="notes" element={<Notes />} />
            <Route path="habits" element={<Habits />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
