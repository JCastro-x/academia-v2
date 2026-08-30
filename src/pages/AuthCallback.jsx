import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { getSemesters } from '../features/semesters/api.js'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isActive = true
    let retryCount = 0

    const redirectToAuth = () => {
      if (!isActive) return
      setLoading(false)
      navigate('/auth', { replace: true })
    }

    const resolveAndNavigate = async (sessionOverride) => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error

        const activeSession = sessionOverride ?? session

        if (!activeSession?.user) {
          if (retryCount < 5) {
            retryCount += 1
            setTimeout(() => {
              if (isActive) {
                void resolveAndNavigate(activeSession)
              }
            }, 250 * retryCount)
            return
          }

          redirectToAuth()
          return
        }

        const semesters = await getSemesters()
        if (!isActive) return

        setLoading(false)

        if (semesters && semesters.length > 0) {
          const activeSemester = semesters.find((s) => s.activo) || semesters[0]
          navigate(`/s/${activeSemester.id}`, { replace: true })
        } else {
          navigate('/create-first-semester', { replace: true })
        }
      } catch (error) {
        console.error('Error handling auth callback:', error)
        redirectToAuth()
      }
    }

    const authSubscription = supabase.auth.onAuthStateChange((event, session) => {
      if (!isActive) return

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setLoading(true)
        void resolveAndNavigate(session)
      }

      if (event === 'SIGNED_OUT') {
        redirectToAuth()
      }
    })

    void resolveAndNavigate()

    return () => {
      isActive = false
      authSubscription.data.subscription.unsubscribe()
    }
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[var(--dm-bg)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-[var(--dm-text-muted)]">Autenticando...</p>
        </div>
      </div>
    )
  }

  return null
}
