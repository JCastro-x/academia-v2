import { useParams } from 'react-router-dom'
import { useSubjects, useDeleteSubject } from '../features/subjects/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import { playSound } from '../lib/sound.js'
import SubjectCard from '../components/SubjectCard.jsx'

export default function Subjects() {
  const { semesterId } = useParams()
  const { data: subjects, isLoading } = useSubjects(semesterId)
  const deleteSubject = useDeleteSubject()
  const { openModal, openConfirmDialog, showUndoToast, addPendingDelete, removePendingDelete, pendingDeletes } = useUIStore()

  const handleDeleteSubject = async (subject) => {
    try {
      openConfirmDialog({
        title: 'Eliminar materia',
        message: `¿Estás seguro de eliminar "${subject.nombre}"? También se eliminarán sus tareas, eventos y calificaciones asociadas.`,
        confirmText: 'Eliminar',
        onConfirm: () => {
          const pendingDeleteId = Date.now()
          addPendingDelete({ type: 'subject', itemId: subject.id, pendingId: pendingDeleteId })
          showUndoToast({
            message: `Materia "${subject.nombre}" eliminada`,
            onTimeout: async () => {
              try {
                playSound('delete')
                await deleteSubject.mutateAsync(subject.id)
                removePendingDelete(pendingDeleteId)
              } catch (error) {
                console.error('Error deleting subject:', error)
                removePendingDelete(pendingDeleteId)
              }
            },
            onUndo: () => {
              removePendingDelete(pendingDeleteId)
            }
          })
        }
      })
    } catch (error) {
      console.error('Error checking task count:', error)
    }
  }

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-gray-500 dark:text-[var(--dm-text-muted)]">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--dm-text)]">Materias</h1>
        <button
          onClick={() => openModal('subject', { editingSubject: null })}
          className="bg-[var(--color-primary)] text-black px-4 py-2 rounded-lg hover:bg-[color-mix(in_srgb,var(--color-primary)_85%,black)] w-full sm:w-auto"
          style={{ color: '#000000' }}
        >
          + Nueva materia
        </button>
      </div>

      <div
        className="subjects-grid grid gap-5 min-w-0 w-full max-w-full px-1"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}
      >
        {subjects?.filter(subject => !pendingDeletes.some(pd => pd.type === 'subject' && pd.itemId === subject.id)).map(subject => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            onEdit={(subject) => openModal('subject', { editingSubject: subject })}
            onDelete={handleDeleteSubject}
          />
        ))}
      </div>

      {!subjects || subjects.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-[var(--dm-text-muted)]">
          <p>No hay materias. Crea tu primera materia.</p>
        </div>
      )}
    </div>
  )
}
