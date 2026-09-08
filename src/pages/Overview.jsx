import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSemester, useUpdateSemester } from '../features/semesters/hooks.js'
import { useSubjects, useCreateSubject } from '../features/subjects/hooks.js'
import { usePendingTasks, useCreateTask, useToggleTaskDone, useDeleteTask } from '../features/tasks/hooks.js'
import { useEvents } from '../features/events/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import { playSound } from '../lib/sound.js'
import TaskCard from '../components/TaskCard.jsx'
import SubjectForm from '../components/SubjectForm.jsx'
import SemesterForm from '../components/SemesterForm.jsx'
import QuickAdd from '../components/QuickAdd.jsx'

export default function Overview() {
  const { semesterId } = useParams()
  const { data: semester, isLoading: semesterLoading, error } = useSemester(semesterId)
  const { data: subjects, isLoading: subjectsLoading } = useSubjects(semesterId)
  const { data: pendingTasks, isLoading: tasksLoading } = usePendingTasks(semesterId)
  const { data: events } = useEvents(semesterId)
  const createTask = useCreateTask()
  const toggleTaskDone = useToggleTaskDone()
  const deleteTask = useDeleteTask()
  const createSubject = useCreateSubject()
  const updateSemester = useUpdateSemester()
  const { openModal, closeModal, openConfirmDialog, showUndoToast, addPendingDelete, removePendingDelete, pendingDeletes } = useUIStore()
  const [showEvents, setShowEvents] = useState(false)
  const isLoading = semesterLoading || subjectsLoading || tasksLoading

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

  if (isLoading) {
    return (
      <div className="space-y-6 pb-16 animate-pulse">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded bg-gray-200 dark:bg-[var(--dm-border)]" />
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-[var(--dm-border)]" />
          </div>
          <div className="h-8 w-28 rounded bg-gray-200 dark:bg-[var(--dm-border)]" />
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)]">
          <div className="mb-4 h-6 w-40 rounded bg-gray-200 dark:bg-[var(--dm-border)]" />
          <div className="space-y-3">
            <div className="h-16 rounded bg-gray-100 dark:bg-[var(--dm-border)]" />
            <div className="h-16 rounded bg-gray-100 dark:bg-[var(--dm-border)]" />
            <div className="h-16 rounded bg-gray-100 dark:bg-[var(--dm-border)]" />
          </div>
        </div>
      </div>
    )
  }
  if (error) return <div className="flex min-h-[40vh] items-center justify-center text-red-600 dark:text-red-400">Error: {error.message}</div>
  if (!semester) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-center px-4">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-[var(--dm-text)]">Semestre no disponible</h1>
          <p className="text-gray-600 dark:text-[var(--dm-text-muted)]">
            El semestre actual no existe o ya no está asociado a tu usuario.
          </p>
        </div>
      </div>
    )
  }

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
          <AnimatePresence mode="popLayout">
            {showEvents && events?.length > 0 && (
              <div className="mb-4 space-y-2">
                {events.filter(e => !pendingDeletes.some(pd => pd.type === 'event' && pd.itemId === e.id)).map(event => {
                  const eventDate = new Date(event.start_at)
                  const formattedDate = eventDate.toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  
                  const eventColorClasses = {
                    parcial: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
                    tarea: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
                    otro: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
                    proyecto: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
                  }
                  
                  const getEventColorClass = (eventType) => eventColorClasses[eventType] || eventColorClasses.otro
                  
                  return (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border border-transparent ${getEventColorClass(event.tipo)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-white/50">
                              Evento
                            </span>
                            <span className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)] truncate">{formattedDate}</span>
                          </div>
                          <h3 className="font-semibold mt-1 dark:text-[var(--dm-text)]">{event.nombre}</h3>
                          {event.descripcion && (
                            <p className="text-sm text-gray-600 mt-1 dark:text-[var(--dm-text-muted)]">{event.descripcion}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {pendingTasks?.filter(t => !pendingDeletes.some(pd => pd.type === 'task' && pd.itemId === t.id)).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                subject={subjects?.find(s => s.id === task.subject_id)}
                onToggleDone={handleToggleDone}
                onEdit={(t) => openModal('task', { editingTask: t })}
                onDelete={handleDeleteTask}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <QuickAdd semesterId={semesterId} subjects={subjects} />
    </div>
  )
}
