import { useParams } from 'react-router-dom'
import { useSemester } from '../features/semesters/hooks.js'

export default function Overview() {
  const { semesterId } = useParams()
  const { data: semester, isLoading, error } = useSemester(semesterId)

  if (isLoading) return <div>Cargando...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{semester?.nombre || 'Semestre'}</h1>
      <p className="text-gray-600">Vista de resumen del semestre</p>
    </div>
  )
}
