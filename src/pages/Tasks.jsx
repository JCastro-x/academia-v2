import { useParams, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTasks, useCreateTask, useUpdateTask, useToggleTaskDone, useToggleTaskPin, useDeleteTask, useDeleteCompletedTasks } from '../features/tasks/hooks.js'
import { useSubjects } from '../features/subjects/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import { playSound } from '../lib/sound.js'
import TaskList from '../components/TaskList.jsx'
import TaskForm from '../components/TaskForm.jsx'
import TaskDetailsModal from '../components/TaskDetailsModal.jsx'
import ModalWrapper from '../components/ModalWrapper.jsx'

export default function Tasks() {
  const { semesterId } = useParams()
  const { data: tasks, isLoading } = useTasks(semesterId)
  const { data: subjects } = useSubjects(semesterId)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const toggleTaskDone = useToggleTaskDone()
  const toggleTaskPin = useToggleTaskPin()
  const deleteTask = useDeleteTask()
  const deleteCompletedTasks = useDeleteCompletedTasks()
  const { openModal, closeModal, openConfirmDialog, showUndoToast, addPendingDelete, removePendingDelete, pendingDeletes } = useUIStore()
  const [filterSubject, setFilterSubject] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPinned, setFilterPinned] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchParams] = useSearchParams()
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState(null)
  const highlightTaskId = searchParams.get('task')

  useEffect(() => {
    if (!highlightTaskId) return
    const el = document.getElementById(`task-${highlightTaskId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightTaskId, tasks])

  const handleCreateTask = async (taskData) => {
    try {
      await createTask.mutateAsync(taskData)
      playSound('save')
      closeModal()
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleUpdateTask = async (id, updates) => {
    try {
      await updateTask.mutateAsync({ id, updates })
      playSound('save')
      closeModal()
      setEditingTask(null)
    } catch (error) {
      console.error('Error updating task:', error)
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

  const handleDeleteCompleted = () => {
    const completedCount = tasks?.filter(t => t.done).length || 0
    if (completedCount === 0) return
    openConfirmDialog({
      title: 'Borrar tareas completadas',
      message: `¿Borrar ${completedCount} tareas completadas?`,
      confirmText: 'Borrar',
      onConfirm: async () => {
        try {
          await deleteCompletedTasks.mutateAsync(semesterId)
          playSound('delete')
        } catch (error) {
          console.error('Error deleting completed tasks:', error)
        }
      }
    })
  }

  const filteredTasks = [...(tasks?.filter(task => {
    const isPendingDelete = pendingDeletes.some(pd => pd.type === 'task' && pd.itemId === task.id)
    if (isPendingDelete) return false
    if (filterSubject && task.subject_id !== filterSubject) return false
    if (filterPriority && task.prioridad !== filterPriority) return false
    if (filterStatus === 'pending' && task.done) return false
    if (filterStatus === 'completed' && !task.done) return false
    if (filterPinned && !task.pinned) return false
    if (searchTerm && !task.titulo.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  }) || [])].sort((firstTask, secondTask) => Number(firstTask.done) - Number(secondTask.done))

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-gray-500 dark:text-[var(--dm-text-muted)]">Cargando...</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[var(--dm-text)]">Tareas</h1>
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:placeholder:text-[var(--dm-text-muted)] sm:hidden"
          />
        </div>
        <button
          onClick={() => openModal('task', { editingTask: null })}
          className="bg-[var(--color-primary)] text-[var(--color-primary-fg)] px-4 py-2 rounded-lg hover:opacity-90 w-full sm:w-auto transition-colors"
        >
          + Nueva tarea
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-2 sm:p-4 space-y-2 sm:space-y-4 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-2 lg:grid-cols-5 sm:gap-4">
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            className="hidden sm:block px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:placeholder:text-[var(--dm-text-muted)]"
          />

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full px-2 py-1 text-xs sm:px-3 sm:py-2 sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
          >
            <option value="">Todas las materias</option>
            {subjects?.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.nombre}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full px-2 py-1 text-xs sm:px-3 sm:py-2 sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
          >
            <option value="">Todas las prioridades</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-2 py-1 text-xs sm:px-3 sm:py-2 sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="completed">Completadas</option>
          </select>

          <button
            onClick={() => setFilterPinned(!filterPinned)}
            className={`w-full px-2 py-1 text-xs sm:px-3 sm:py-2 sm:text-sm lg:text-base border rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-2 ${filterPinned ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-bg)]'}`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="hidden sm:inline">{filterPinned ? 'Solo fijadas' : 'Ver fijadas'}</span>
            <span className="sm:hidden">{filterPinned ? '📌' : '📍'}</span>
          </button>

          <button
            onClick={handleDeleteCompleted}
            className="w-full px-2 py-1 text-xs border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 sm:hidden"
          >
            Borrar completadas
          </button>
        </div>

        <div className="hidden justify-end sm:flex">
          <button
            onClick={handleDeleteCompleted}
            className="text-red-600 hover:text-red-800 text-sm dark:text-red-400 dark:hover:text-red-300"
          >
            Borrar completadas
          </button>
        </div>
      </div>

      <div className="min-w-0 pb-16">
        <TaskList
          tasks={filteredTasks}
          subjects={subjects}
          highlightTaskId={highlightTaskId}
          onToggleDone={handleToggleDone}
          onTogglePin={handleTogglePin}
          onViewDetails={handleViewDetails}
          onEdit={(task) => openModal('task', { editingTask: task })}
          onDelete={handleDeleteTask}
        />
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
