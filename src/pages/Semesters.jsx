import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SemesterForm from '../components/SemesterForm.jsx'
import { useUIStore } from '../stores/ui.store.js'
import {
  useCreateSemester,
  useSemesters,
  useSetActiveSemester,
  useUpdateSemester,
  useDeleteSemester,
} from '../features/semesters/hooks.js'

const emptyForm = {
  nombre: '',
  start_date: '',
  end_date: '',
}

export default function Semesters() {
  const navigate = useNavigate()
  const { data: semesters = [], isLoading, error } = useSemesters()
  const createSemester = useCreateSemester()
  const updateSemester = useUpdateSemester()
  const setActiveSemester = useSetActiveSemester()
  const deleteSemester = useDeleteSemester()
  const { openConfirmDialog } = useUIStore()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formValue, setFormValue] = useState(emptyForm)

  const activeSemester = useMemo(
    () => semesters.find((semester) => semester.activo) ?? null,
    [semesters],
  )

  const openCreateForm = () => {
    setEditingId(null)
    setFormValue(emptyForm)
    setShowForm(true)
  }

  const openEditForm = (semester) => {
    setEditingId(semester.id)
    setFormValue({
      nombre: semester.nombre || '',
      start_date: semester.start_date || '',
      end_date: semester.end_date || '',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormValue(emptyForm)
  }

  const handleSubmit = async (values) => {
    try {
      if (editingId) {
        await updateSemester.mutateAsync({
          id: editingId,
          updates: values,
        })
        closeForm()
        return
      }

      const created = await createSemester.mutateAsync(values)
      if (created?.id) {
        await setActiveSemester.mutateAsync(created.id)
        navigate(`/s/${created.id}`, { replace: true })
      }
      closeForm()
    } catch (error) {
      console.error('Error saving semester:', error)
    }
  }

  const handleActivate = async (semesterId) => {
    try {
      const activated = await setActiveSemester.mutateAsync(semesterId)
      if (activated?.id) {
        navigate(`/s/${activated.id}`, { replace: true })
      }
    } catch (error) {
      console.error('Error activating semester:', error)
    }
  }

  const handleArchive = async (semesterId) => {
    try {
      await updateSemester.mutateAsync({
        id: semesterId,
        updates: { activo: false },
      })
    } catch (error) {
      console.error('Error archiving semester:', error)
    }
  }

  const handleDelete = (semester) => {
    const isActive = semester.activo
    openConfirmDialog({
      title: 'Eliminar semestre',
      message: `Esto eliminará permanentemente el semestre '${semester.nombre}' y TODO su contenido: materias, calificaciones, tareas, notas y eventos. Esta acción no se puede deshacer.${
        isActive
          ? '\n\n⚠️ ATENCIÓN: este es tu semestre ACTUAL. Se te quitará el contexto de trabajo activo.'
          : ''
      }`,
      confirmText: 'Eliminar permanentemente',
      onConfirm: async () => {
        try {
          await deleteSemester.mutateAsync(semester.id)
          if (isActive) {
            navigate('/semesters', { replace: true })
          }
        } catch (error) {
          console.error('Error deleting semester:', error)
        }
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-500 dark:text-[var(--dm-text-muted)]">
        Cargando semestres...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-red-600 dark:text-red-400">
        Error al cargar los semestres: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--dm-text)]">Semestres</h1>
          <p className="text-gray-600 dark:text-[var(--dm-text-muted)]">
            Gestiona el semestre activo y tus períodos cerrados.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-900"
          disabled={createSemester.isPending || updateSemester.isPending || setActiveSemester.isPending}
        >
          + Nuevo semestre
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[var(--dm-text)]">
              {editingId ? 'Editar semestre' : 'Crear semestre'}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)]"
            >
              Cancelar
            </button>
          </div>

          <SemesterForm
            key={editingId || 'new-semester'}
            initialData={editingId ? semesters.find((semester) => semester.id === editingId) : undefined}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            isPending={createSemester.isPending || updateSemester.isPending}
            isCreate={!editingId}
          />
        </div>
      )}

      {semesters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600 dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)] dark:text-[var(--dm-text-muted)]">
          Todavía no hay semestres cargados.
        </div>
      ) : (
        <div className="grid gap-4">
          {semesters.map((semester) => (
            <div
              key={semester.id}
              className={`rounded-2xl border p-4 shadow-sm transition ${
                semester.activo
                  ? 'border-[var(--color-primary)]/40 bg-[color-mix(in_srgb,var(--color-primary)_8%,white)] dark:border-[var(--color-primary)]/60 dark:bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--dm-surface))]'
                  : 'border-gray-200 bg-white dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)]'
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-[var(--dm-text)]">
                      {semester.nombre}
                    </h2>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        semester.activo
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-200 text-gray-700 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text-muted)]'
                      }`}
                    >
                      {semester.activo ? 'Activo' : 'Archivado'}
                    </span>
                    {activeSemester?.id === semester.id && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        Actual
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">
                    {semester.start_date && <span>Inicio: {semester.start_date}</span>}
                    {semester.end_date && <span>Fin: {semester.end_date}</span>}
                    {!semester.start_date && !semester.end_date && <span>Sin fechas definidas</span>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/s/${semester.id}`)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-[var(--dm-border)] dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
                  >
                    Ver
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditForm(semester)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-[var(--dm-border)] dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
                  >
                    Editar
                  </button>

                  {!semester.activo ? (
                    <button
                      type="button"
                      onClick={() => handleActivate(semester.id)}
                      className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-slate-900 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-900"
                      disabled={setActiveSemester.isPending}
                    >
                      Activar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleArchive(semester.id)}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-200"
                      disabled={updateSemester.isPending}
                    >
                      Archivar
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(semester)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-300"
                    disabled={deleteSemester.isPending}
                  >
                    {deleteSemester.isPending ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
