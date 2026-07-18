import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from '../features/subjects/hooks.js'
import { countTasksBySubject } from '../features/tasks/api.js'
import { useUIStore } from '../stores/ui.store.js'
import SubjectCard from '../components/SubjectCard.jsx'
import SubjectForm from '../components/SubjectForm.jsx'

export default function Subjects() {
  const { semesterId } = useParams()
  const { data: subjects, isLoading } = useSubjects(semesterId)
  const createSubject = useCreateSubject()
  const updateSubject = useUpdateSubject()
  const deleteSubject = useDeleteSubject()
  const { isModalOpen, modalContent, openModal, closeModal, openConfirmDialog, showUndoToast, addPendingDelete, removePendingDelete, pendingDeletes } = useUIStore()
  const [editingSubject, setEditingSubject] = useState(null)

  const handleCreateSubject = async (subjectData) => {
    try {
      await createSubject.mutateAsync(subjectData)
      closeModal()
    } catch (error) {
      console.error('Error creating subject:', error)
    }
  }

  const handleUpdateSubject = async (id, updates) => {
    try {
      await updateSubject.mutateAsync({ id, updates })
      closeModal()
      setEditingSubject(null)
    } catch (error) {
      console.error('Error updating subject:', error)
    }
  }

  const handleDeleteSubject = async (subject) => {
    try {
      const taskCount = await countTasksBySubject(subject.id)

      if (taskCount > 0) {
        openConfirmDialog({
          title: 'No se puede eliminar',
          message: `Esta materia tiene ${taskCount} tarea(s) asociada(s). Elimínalas primero o edítalas para quitarles la materia.`,
          confirmText: 'Entendido',
          infoOnly: true,
        })
        return
      }

      openConfirmDialog({
        title: 'Eliminar materia',
        message: `¿Estás seguro de eliminar "${subject.nombre}"?`,
        confirmText: 'Eliminar',
        onConfirm: () => {
          const pendingDeleteId = Date.now()
          addPendingDelete({ type: 'subject', itemId: subject.id, pendingId: pendingDeleteId })
          showUndoToast({
            message: `Materia "${subject.nombre}" eliminada`,
            onTimeout: async () => {
              try {
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

  if (isLoading) return <div>Cargando...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Materias</h1>
        <button
          onClick={() => { setEditingSubject(null); openModal('subject') }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
        >
          + Nueva materia
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects?.filter(subject => !pendingDeletes.some(pd => pd.type === 'subject' && pd.itemId === subject.id)).map(subject => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            onEdit={(subject) => { setEditingSubject(subject); openModal('subject') }}
            onDelete={handleDeleteSubject}
          />
        ))}
      </div>

      {!subjects || subjects.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No hay materias. Crea tu primera materia.</p>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && modalContent === 'subject' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">
                {editingSubject ? 'Editar materia' : 'Nueva materia'}
              </h3>
              <SubjectForm
                semesterId={semesterId}
                initialData={editingSubject}
                onSubmit={editingSubject
                  ? (data) => handleUpdateSubject(editingSubject.id, data)
                  : handleCreateSubject
                }
                onCancel={() => { setEditingSubject(null); closeModal() }}
                isPending={editingSubject ? updateSubject.isPending : createSubject.isPending}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
