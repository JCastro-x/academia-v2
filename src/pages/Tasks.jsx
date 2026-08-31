import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useTasks, useCreateTask, useUpdateTask, useToggleTaskDone, useDeleteTask, useDeleteCompletedTasks } from '../features/tasks/hooks.js'
import { useSubjects } from '../features/subjects/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import { playSound } from '../lib/sound.js'
import TaskCard from '../components/TaskCard.jsx'
import TaskForm from '../components/TaskForm.jsx'
import ModalWrapper from '../components/ModalWrapper.jsx'

export default function Tasks() {
  const { semesterId } = useParams()
  const { data: tasks, isLoading } = useTasks(semesterId)
  const { data: subjects } = useSubjects(semesterId)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const toggleTaskDone = useToggleTaskDone()
  const deleteTask = useDeleteTask()
  const deleteCompletedTasks = useDeleteCompletedTasks()
  const { openModal, closeModal, openConfirmDialog, showUndoToast, addPendingDelete, removePendingDelete, pendingDeletes } = useUIStore()
  const [filterSubject, setFilterSubject] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

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

  const filteredTasks = tasks?.filter(task => {
    const isPendingDelete = pendingDeletes.some(pd => pd.type === 'task' && pd.itemId === task.id)
    if (isPendingDelete) return false
    if (filterSubject && task.subject_id !== filterSubject) return false
    if (filterPriority && task.prioridad !== filterPriority) return false
    if (filterStatus === 'pending' && task.done) return false
    if (filterStatus === 'completed' && !task.done) return false
    if (searchTerm && !task.titulo.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  }) || []

  // Sort: completed tasks go to the end (legacy behavior)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.done !== b.done) {
      return a.done ? 1 : -1
    }
    return 0
  })

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-gray-500 dark:text-[var(--dm-text-muted)]">Cargando...</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-[var(--dm-text)] sm:text-2xl whitespace-nowrap">Tareas</h1>
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:placeholder:text-[var(--dm-text-muted)] sm:px-3 sm:py-2"
          />
        </div>
        <button
          onClick={() => openModal('task', { editingTask: null })}
          className="bg-[var(--color-primary)] text-[var(--color-primary-fg)] px-4 py-2 rounded-lg hover:opacity-90 w-full transition-colors sm:w-auto"
        >
          + Nueva tarea
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-2 space-y-2 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none sm:p-3 sm:space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
          >
            <option value="">Todas las materias</option>
            {subjects?.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.nombre}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
          >
            <option value="">Todas las prioridades</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="completed">Completadas</option>
          </select>

          <button
            onClick={handleDeleteCompleted}
            className="text-red-600 hover:text-red-800 text-sm px-2 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:border-red-900/30 dark:hover:bg-red-900/20"
          >
            Borrar completadas
          </button>
        </div>
      </div>

      <div className="min-w-0 pb-16">
        <AnimatePresence mode="popLayout">
          {sortedTasks.map(task => (
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
  )
}
