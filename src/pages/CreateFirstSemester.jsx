import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateSemester } from '../features/semesters/hooks.js'

export default function CreateFirstSemester() {
  const [nombre, setNombre] = useState('')
  const createSemester = useCreateSemester()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return

    try {
      const result = await createSemester.mutateAsync({ nombre })
      navigate(`/s/${result.id}`)
    } catch (error) {
      console.error('Error creating semester:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Crear tu primer semestre</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del semestre
            </label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Primer Semestre 2024"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={createSemester.isPending || !nombre.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {createSemester.isPending ? 'Creando...' : 'Crear semestre'}
          </button>

          {createSemester.isError && (
            <p className="mt-4 text-red-600 text-center">
              Error al crear el semestre. Inténtalo de nuevo.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
