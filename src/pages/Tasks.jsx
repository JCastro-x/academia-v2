import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTasks, useCreateTask, useUpdateTask, useToggleTaskDone, useDeleteTask, useDeleteCompletedTasks } from '../features/tasks/hooks.js'
import { useSubjects } from '../features/subjects/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import TaskList from '../components/TaskList.jsx'
import TaskForm from '../components/TaskForm.jsx'

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

  if (isLoading) return <div>Cargando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tareas</h1>
        <button
          onClick={() => { setEditingTask(null); openModal('task') }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nueva tarea
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las materias</option>
            {subjects?.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.nombre}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las prioridades</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="completed">Completadas</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleDeleteCompleted}
            className="text-red-600 hover:text-red-800 text-sm"
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

      <AnimatePresence>
        {isModalOpen && modalContent === 'task' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">{editingTask ? 'Editar tarea' : 'Nueva tarea'}</h3>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
