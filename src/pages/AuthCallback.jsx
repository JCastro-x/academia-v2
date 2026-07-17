import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { getSemesters } from '../features/semesters/api.js'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        try {
          const semesters = await getSemesters()
          
          if (semesters && semesters.length > 0) {
            // Redirect to active semester or first one
            const activeSemester = semesters.find(s => s.activo) || semesters[0]
            navigate(`/s/${activeSemester.id}`)
          } else {
            // No semesters, redirect to create first semester
            navigate('/create-first-semester')
          }
        } catch (error) {
          console.error('Error fetching semesters:', error)
          // On error, still try to redirect to create page
          navigate('/create-first-semester')
        }
      } else {
        navigate('/auth')
      }
      setLoading(false)
    }

    handleAuth()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Autenticando...</p>
        </div>
      </div>
    )
  }

  return null
}
