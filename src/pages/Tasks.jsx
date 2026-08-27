import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useTasks, useCreateTask, useUpdateTask, useToggleTaskDone, useDeleteTask, useDeleteCompletedTasks } from '../features/tasks/hooks.js'
import { useSubjects } from '../features/subjects/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import TaskList from '../components/TaskList.jsx'
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
  const { isModalOpen, modalContent, openModal, closeModal, openConfirmDialog, showUndoToast, addPendingDelete, removePendingDelete, pendingDeletes } = useUIStore()
  const [editingTask, setEditingTask] = useState(null)
  const [filterSubject, setFilterSubject] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const handleCreateTask = async (taskData) => {
    try {
      await createTask.mutateAsync(taskData)
      closeModal()
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleUpdateTask = async (id, updates) => {
    try {
      await updateTask.mutateAsync({ id, updates })
      closeModal()
      setEditingTask(null)
    } catch (error) {
      console.error('Error updating task:', error)
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

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-gray-500 dark:text-[var(--dm-text-muted)]">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--dm-text)]">Tareas</h1>
        <button
          onClick={() => { setEditingTask(null); openModal('task') }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
        >
          + Nueva tarea
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 space-y-4 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:placeholder:text-[var(--dm-text-muted)]"
          />

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
          >
            <option value="">Todas las materias</option>
            {subjects?.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.nombre}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
          >
            <option value="">Todas las prioridades</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="completed">Completadas</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleDeleteCompleted}
            className="text-red-600 hover:text-red-800 text-sm dark:text-red-400 dark:hover:text-red-300"
          >
            Borrar completadas
          </button>
        </div>
      </div>

      <TaskList
        tasks={filteredTasks}
        subjects={subjects}
        onToggleDone={handleToggleDone}
        onEdit={(task) => { setEditingTask(task); openModal('task') }}
        onDelete={handleDeleteTask}
      />

      <ModalWrapper
        isOpen={isModalOpen && modalContent === 'task'}
        onClose={() => { setEditingTask(null); closeModal() }}
        className="p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-[var(--dm-text)]">{editingTask ? 'Editar tarea' : 'Nueva tarea'}</h3>
        <TaskForm
          semesterId={semesterId}
          subjects={subjects}
          initialData={editingTask}
          onSubmit={editingTask
            ? (data) => handleUpdateTask(editingTask.id, data)
            : handleCreateTask
          }
          onCancel={() => { setEditingTask(null); closeModal() }}
          isPending={editingTask ? updateTask.isPending : createTask.isPending}
        />
      </ModalWrapper>
    </div>
  )
}
