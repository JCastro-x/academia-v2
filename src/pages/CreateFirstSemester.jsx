import { useNavigate } from 'react-router-dom'
import { useCreateSemester } from '../features/semesters/hooks.js'
import SemesterForm from '../components/SemesterForm.jsx'

export default function CreateFirstSemester() {
  const createSemester = useCreateSemester()
  const navigate = useNavigate()

  const handleSubmit = async (semesterData) => {
    try {
      const result = await createSemester.mutateAsync(semesterData)
      navigate(`/s/${result.id}`)
    } catch (error) {
      console.error('Error creating semester:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[var(--dm-bg)]">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-[var(--dm-text)]">Crear tu primer semestre</h1>

        <SemesterForm
          onSubmit={handleSubmit}
          isPending={createSemester.isPending}
          isCreate={true}
        />

        {createSemester.isError && (
          <p className="mt-4 text-red-600 text-center dark:text-red-400">
            Error al crear el semestre. Inténtalo de nuevo.
          </p>
        )}
      </div>
    </div>
  )
}
