import { useParams } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSemester, useUpdateSemester } from '../features/semesters/hooks.js'
import { useSubjects, useCreateSubject } from '../features/subjects/hooks.js'
import { usePendingTasks, useCreateTask, useUpdateTask, useToggleTaskDone, useToggleTaskPin, useDeleteTask } from '../features/tasks/hooks.js'
import { useFutureEvents } from '../features/events/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import { playSound } from '../lib/sound.js'
import { getTaskStats, todayStr, diffDays } from '../domain/task-stats.js'
import TaskCard from '../components/TaskCard.jsx'
import TaskDetailsModal from '../components/TaskDetailsModal.jsx'
import SubjectForm from '../components/SubjectForm.jsx'
import SemesterForm from '../components/SemesterForm.jsx'

export default function Overview() {
  const { semesterId } = useParams()
  const { data: semester, isLoading: semesterLoading, error } = useSemester(semesterId)
  const { data: subjects, isLoading: subjectsLoading } = useSubjects(semesterId)
  const { data: pendingTasks, isLoading: tasksLoading } = usePendingTasks(semesterId)
  const { data: events } = useFutureEvents(semesterId)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const toggleTaskDone = useToggleTaskDone()
  const toggleTaskPin = useToggleTaskPin()
  const deleteTask = useDeleteTask()
  const createSubject = useCreateSubject()
  const updateSemester = useUpdateSemester()
  const { openModal, closeModal, openConfirmDialog, showUndoToast, addPendingDelete, removePendingDelete, pendingDeletes } = useUIStore()
  const [showEvents, setShowEvents] = useState(false)
  const [showPinnedOnly, setShowPinnedOnly] = useState(false)
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState(null)
  const [showThisWeekTasks, setShowThisWeekTasks] = useState(true)
  const [showLaterTasks, setShowLaterTasks] = useState(false)
  const isLoading = semesterLoading || subjectsLoading || tasksLoading

  // Categorize tasks into 2 sections using useMemo to prevent recalculation
  const { thisWeek: thisWeekTasks, later: laterTasks } = useMemo(() => {
    const filteredTasks = pendingTasks?.filter(t => 
      !pendingDeletes.some(pd => pd.type === 'task' && pd.itemId === t.id) && 
      (!showPinnedOnly || t.pinned)
    ) || []

    if (!filteredTasks || filteredTasks.length === 0) {
      return { thisWeek: [], later: [] }
    }

    const today = todayStr()
    const thisWeekTasks = []
    const laterTasks = []

    filteredTasks.forEach(task => {
      // Section: determined EXCLUSIVELY by due date (daysUntilDue <= 10 = Esta semana, > 10 = Más adelante)
      let isThisWeek = false

      if (task.due) {
        const daysUntilDue = diffDays(today, task.due)
        isThisWeek = daysUntilDue <= 10
      }

      if (isThisWeek) {
        thisWeekTasks.push(task)
      } else {
        laterTasks.push(task)
      }
    })

    // Sort "this week" tasks by due date ascending (tasks without due date go last)
    thisWeekTasks.sort((a, b) => {
      if (!a.due) return 1
      if (!b.due) return -1
      return new Date(a.due) - new Date(b.due)
    })

    // Sort "later" tasks by due date ascending
    laterTasks.sort((a, b) => {
      if (!a.due) return 1
      if (!b.due) return -1
      return new Date(a.due) - new Date(b.due)
    })

    return { thisWeek: thisWeekTasks, later: laterTasks }
  }, [pendingTasks, pendingDeletes, showPinnedOnly])

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

  const handleTogglePin = async (id, pinned) => {
    try {
      await toggleTaskPin.mutateAsync({ id, pinned })
      playSound('save')
    } catch (error) {
      console.error('Error toggling task pin:', error)
    }
  }

  const handleViewDetails = (task) => {
    setSelectedTaskForDetails(task)
  }

  const handleCloseDetails = () => {
    setSelectedTaskForDetails(null)
  }

  const handleUpdateSubtasks = async (taskId, updates) => {
    try {
      await updateTask.mutateAsync({ id: taskId, updates })
      playSound('save')
    } catch (error) {
      console.error('Error updating subtasks:', error)
    }
  }

  const handleToggleDoneFromDetails = async (id, done) => {
    try {
      await toggleTaskDone.mutateAsync({ id, done })
      playSound(done ? 'task-done' : 'task-undone')
      setSelectedTaskForDetails(null)
    } catch (error) {
      console.error('Error toggling task done:', error)
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
          className="text-gray-500 hover:text-blue-600 text-sm dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)] flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar semestre
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[var(--dm-text)]">Tareas pendientes</h2>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
              className={`p-2 rounded-lg transition-colors ${showPinnedOnly ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:text-[var(--dm-text-muted)] dark:hover:bg-[var(--dm-bg)]'}`}
              title={showPinnedOnly ? 'Mostrar todas las tareas' : 'Mostrar solo tareas fijadas'}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">
              <input
                type="checkbox"
                checked={showEvents}
                onChange={(e) => setShowEvents(e.target.checked)}
                className="rounded border-gray-300 dark:border-[var(--dm-border)]"
              />
              <span className="hidden sm:inline">Mostrar eventos</span>
              <span className="sm:hidden">Eventos</span>
            </label>
          </div>
        </div>
        <div className="min-w-0 pb-16">
          <AnimatePresence mode="popLayout">
            {showEvents && events?.length > 0 && (
              <div key="events-section" className="mb-4 space-y-2">
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
                      key={event.id || `event-${event.start_at}-${event.nombre}`}
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

            {/* Section 1: Esta semana */}
            {thisWeekTasks.length > 0 && (
              <div key="this-week-section" className="mb-6">
                <button
                  onClick={() => setShowThisWeekTasks(!showThisWeekTasks)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-[var(--dm-text-muted)] mb-3 hover:text-gray-900 dark:hover:text-[var(--dm-text)] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Esta semana
                  </span>
                  <span className="text-xs bg-gray-100 dark:bg-[var(--dm-border)] px-2 py-1 rounded-full">
                    {showThisWeekTasks ? '-' : `+${thisWeekTasks.length}`}
                  </span>
                </button>
                <AnimatePresence>
                  {showThisWeekTasks && (
                    <div key="this-week-tasks" className="space-y-3">
                      {thisWeekTasks.map(task => (
                        <TaskCard
                          key={task.id || `task-${task.titulo}-${task.due}`}
                          task={task}
                          subject={subjects?.find(s => s.id === task.subject_id)}
                          onToggleDone={handleToggleDone}
                          onTogglePin={handleTogglePin}
                          onViewDetails={handleViewDetails}
                          onEdit={(t) => openModal('task', { editingTask: t })}
                          onDelete={handleDeleteTask}
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Section 2: Más adelante (collapsible) */}
            {laterTasks.length > 0 && (
              <div key="later-section">
                <button
                  onClick={() => setShowLaterTasks(!showLaterTasks)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-[var(--dm-text-muted)] mb-3 hover:text-gray-900 dark:hover:text-[var(--dm-text)] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Más adelante
                  </span>
                  <span className="text-xs bg-gray-100 dark:bg-[var(--dm-border)] px-2 py-1 rounded-full">
                    {showLaterTasks ? '-' : `+${laterTasks.length}`}
                  </span>
                </button>
                <AnimatePresence>
                  {showLaterTasks && (
                    <div key="later-tasks" className="space-y-3">
                      {laterTasks.map(task => (
                        <TaskCard
                          key={task.id || `task-${task.titulo}-${task.due}`}
                          task={task}
                          subject={subjects?.find(s => s.id === task.subject_id)}
                          onToggleDone={handleToggleDone}
                          onTogglePin={handleTogglePin}
                          onViewDetails={handleViewDetails}
                          onEdit={(t) => openModal('task', { editingTask: t })}
                          onDelete={handleDeleteTask}
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Empty state */}
            {thisWeekTasks.length === 0 && laterTasks.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-[var(--dm-text-muted)]">
                <p>No hay tareas pendientes</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {selectedTaskForDetails && (
        <TaskDetailsModal
          task={selectedTaskForDetails}
          subject={subjects?.find(s => s.id === selectedTaskForDetails.subject_id)}
          onClose={handleCloseDetails}
          onToggleSubtask={handleUpdateSubtasks}
          onUpdateTask={handleUpdateSubtasks}
          onToggleDone={handleToggleDoneFromDetails}
        />
      )}
    </div>
  )
}
