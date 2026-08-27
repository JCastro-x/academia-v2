import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useSemester } from '../features/semesters/hooks.js'
import { useSubjects, useCreateSubject } from '../features/subjects/hooks.js'
import { usePendingTasks, useCreateTask, useToggleTaskDone, useDeleteTask } from '../features/tasks/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import TaskList from '../components/TaskList.jsx'
import TaskForm from '../components/TaskForm.jsx'
import SubjectForm from '../components/SubjectForm.jsx'
import ModalWrapper from '../components/ModalWrapper.jsx'
import QuickAdd from '../components/QuickAdd.jsx'

export default function Overview() {
  const { semesterId } = useParams()
  const { data: semester, isLoading, error } = useSemester(semesterId)
  const { data: subjects } = useSubjects(semesterId)
  const { data: pendingTasks } = usePendingTasks(semesterId)
  const createTask = useCreateTask()
  const toggleTaskDone = useToggleTaskDone()
  const deleteTask = useDeleteTask()
  const createSubject = useCreateSubject()
  const { isModalOpen, modalContent, openModal, closeModal, openConfirmDialog, showUndoToast, addPendingDelete, removePendingDelete, pendingDeletes } = useUIStore()
  const [editingTask, setEditingTask] = useState(null)
  const [showEvents, setShowEvents] = useState(false)

  const handleCreateTask = async (taskData) => {
    try {
      await createTask.mutateAsync(taskData)
      closeModal()
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleCreateSubject = async (subjectData) => {
    try {
      await createSubject.mutateAsync(subjectData)
      closeModal()
    } catch (error) {
      console.error('Error creating subject:', error)
    }
  }

  const handleToggleDone = async (id, done) => {
    try {
      await toggleTaskDone.mutateAsync({ id, done })
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const handleDeleteTask = (task) => {
    openConfirmDialog({
      title: 'Eliminar tarea',
      message: `¿Estás seguro de eliminar "${task.titulo}"?`,
      confirmText: 'Eliminar',
      onConfirm: () => {
        const pendingDeleteId = Date.now()
        addPendingDelete({ type: 'task', itemId: task.id, pendingId: pendingDeleteId })
        showUndoToast({
          message: `Tarea "${task.titulo}" eliminada`,
          onTimeout: async () => {
            try {
              await deleteTask.mutateAsync(task.id)
              removePendingDelete(pendingDeleteId)
            } catch (error) {
              console.error('Error deleting task:', error)
              removePendingDelete(pendingDeleteId)
            }
          },
          onUndo: () => {
            removePendingDelete(pendingDeleteId)
          }
        })
      }
    })
  }

  if (isLoading) return <div className="flex min-h-[40vh] items-center justify-center text-gray-500 dark:text-[var(--dm-text-muted)]">Cargando...</div>
  if (error) return <div className="flex min-h-[40vh] items-center justify-center text-red-600 dark:text-red-400">Error: {error.message}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-[var(--dm-text)]">{semester?.nombre || 'Semestre'}</h1>
        <p className="text-gray-600 dark:text-[var(--dm-text-muted)]">Resumen del semestre</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[var(--dm-text)]">Tareas pendientes</h2>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">
            <input
              type="checkbox"
              checked={showEvents}
              onChange={(e) => setShowEvents(e.target.checked)}
              className="rounded border-gray-300 dark:border-[var(--dm-border)]"
            />
            Mostrar eventos
          </label>
        </div>
        <TaskList
          tasks={pendingTasks?.filter(t => !t.done && !pendingDeletes.some(pd => pd.type === 'task' && pd.itemId === t.id)) || []}
          subjects={subjects}
          onToggleDone={handleToggleDone}
          onEdit={(task) => { setEditingTask(task); openModal('task') }}
          onDelete={handleDeleteTask}
        />
      </div>

      <QuickAdd semesterId={semesterId} subjects={subjects} />

      <ModalWrapper
        isOpen={isModalOpen && modalContent === 'task'}
        onClose={() => { setEditingTask(null); closeModal() }}
        className="p-6 w-full max-w-md"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-[var(--dm-text)]">{editingTask ? 'Editar tarea' : 'Nueva tarea'}</h3>
        <TaskForm
          semesterId={semesterId}
          subjects={subjects}
          initialData={editingTask}
          onSubmit={handleCreateTask}
          onCancel={() => { setEditingTask(null); closeModal() }}
          isPending={createTask.isPending}
        />
      </ModalWrapper>

      <ModalWrapper
        isOpen={isModalOpen && modalContent === 'subject'}
        onClose={closeModal}
        className="p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-[var(--dm-text)]">Nueva materia</h3>
        <SubjectForm
          semesterId={semesterId}
          onSubmit={handleCreateSubject}
          onCancel={closeModal}
          isPending={createSubject.isPending}
        />
      </ModalWrapper>
    </div>
  )
}
