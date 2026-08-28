import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useSemester, useUpdateSemester } from '../features/semesters/hooks.js'
import { useSubjects, useCreateSubject } from '../features/subjects/hooks.js'
import { usePendingTasks, useCreateTask, useToggleTaskDone, useDeleteTask } from '../features/tasks/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import { playSound } from '../lib/sound.js'
import TaskList from '../components/TaskList.jsx'
import SubjectForm from '../components/SubjectForm.jsx'
import SemesterForm from '../components/SemesterForm.jsx'
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
  const updateSemester = useUpdateSemester()
  const { openModal, closeModal, openConfirmDialog, showUndoToast, addPendingDelete, removePendingDelete, pendingDeletes } = useUIStore()
  const [showEvents, setShowEvents] = useState(false)

  const handleCreateTask = async (taskData) => {
    try {
      await createTask.mutateAsync(taskData)
      playSound('save')
      closeModal()
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleCreateSubject = async (subjectData) => {
    try {
      await createSubject.mutateAsync(subjectData)
      playSound('save')
      closeModal()
    } catch (error) {
      console.error('Error creating subject:', error)
    }
  }

  const handleUpdateSemester = async (semesterData) => {
    try {
      await updateSemester.mutateAsync({ id: semesterId, updates: semesterData })
      playSound('save')
      closeModal()
    } catch (error) {
      console.error('Error updating semester:', error)
    }
  }

  const handleToggleDone = async (id, done) => {
    try {
      await toggleTaskDone.mutateAsync({ id, done })
      playSound(done ? 'task-done' : 'task-undone')
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
              playSound('delete')
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
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-[var(--dm-text)]">{semester?.nombre || 'Semestre'}</h1>
          <p className="text-gray-600 dark:text-[var(--dm-text-muted)]">Resumen del semestre</p>
        </div>
        <button
          onClick={() => openModal('semester')}
          className="text-gray-500 hover:text-blue-600 text-sm dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)]"
        >
          ✏️ Editar semestre
        </button>
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
        <div className="min-w-0 pb-16">
          <TaskList
            tasks={pendingTasks?.filter(t => !t.done && !pendingDeletes.some(pd => pd.type === 'task' && pd.itemId === t.id)) || []}
            subjects={subjects}
            onToggleDone={handleToggleDone}
            onEdit={(task) => openModal('task', { editingTask: task })}
            onDelete={handleDeleteTask}
          />
        </div>
      </div>

      <QuickAdd semesterId={semesterId} subjects={subjects} />
    </div>
  )
}
