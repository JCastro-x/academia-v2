import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TaskDetailsModal({ task, subject, onClose, onToggleSubtask, onUpdateTask, onToggleDone }) {
  const [newSubtask, setNewSubtask] = useState('')
  const [currentTask, setCurrentTask] = useState(task)

  // Update local state when task prop changes
  useEffect(() => {
    setCurrentTask(task)
  }, [task])

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return
    const updatedSubtasks = [...(currentTask.subtasks || []), { id: Date.now().toString(), titulo: newSubtask, done: false }]
    setCurrentTask({ ...currentTask, subtasks: updatedSubtasks })
    onUpdateTask(currentTask.id, { subtasks: updatedSubtasks })
    setNewSubtask('')
  }

  const handleToggleSubtask = (subtaskId) => {
    const updatedSubtasks = (currentTask.subtasks || []).map(st => {
      const id = typeof st === 'string' ? st : st.id
      if (id === subtaskId) {
        if (typeof st === 'string') {
          return { id: st, titulo: st, done: true }
        }
        return { ...st, done: !st.done }
      }
      return st
    })
    setCurrentTask({ ...currentTask, subtasks: updatedSubtasks })
    onUpdateTask(currentTask.id, { subtasks: updatedSubtasks })
  }

  const handleDeleteSubtask = (subtaskId) => {
    const updatedSubtasks = (currentTask.subtasks || []).filter(st => {
      const id = typeof st === 'string' ? st : st.id
      return id !== subtaskId
    })
    setCurrentTask({ ...currentTask, subtasks: updatedSubtasks })
    onUpdateTask(currentTask.id, { subtasks: updatedSubtasks })
  }

  const completedSubtasks = (currentTask.subtasks || []).filter(st => st.done).length
  const totalSubtasks = (currentTask.subtasks || []).length
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  const allSubtasksCompleted = totalSubtasks > 0 && completedSubtasks === totalSubtasks

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] sm:max-h-[80vh] overflow-hidden dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] mx-4 sm:mx-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-[var(--dm-border)]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-[var(--dm-text)] truncate">{task.titulo}</h2>
                {subject && (
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-[var(--dm-text-muted)] mt-1 truncate">{subject.nombre}</p>
                )}
                {task.due && (
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-[var(--dm-text-muted)] mt-1">
                    📅 Vence: {formatDate(task.due)}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)] flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {totalSubtasks > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">
                  <span>Progreso</span>
                  <span>{completedSubtasks}/{totalSubtasks} ({Math.round(progress)}%)</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-[var(--dm-border)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-[var(--color-primary)] transition-all duration-300"
                  />
                </div>
                {allSubtasksCompleted && !task.done && onToggleDone && (
                  <button
                    onClick={() => onToggleDone(task.id, true)}
                    className="mt-3 w-full px-3 py-2 sm:px-4 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base"
                  >
                    ✓ Marcar tarea como completada
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto max-h-[50vh] sm:max-h-[60vh]">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-[var(--dm-text)] mb-4">Subtareas</h3>

            <div className="space-y-2 mb-4">
              {currentTask.subtasks && currentTask.subtasks.length > 0 ? (
                currentTask.subtasks.map((subtask, index) => {
                  const id = typeof subtask === 'string' ? subtask : subtask.id
                  const titulo = typeof subtask === 'string' ? subtask : (subtask.titulo || subtask.text || '')
                  const done = typeof subtask === 'string' ? false : subtask.done

                  return (
                    <div
                      key={id || index}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg dark:bg-[var(--dm-bg)] dark:border dark:border-[var(--dm-border)]"
                    >
                      <button
                        onClick={() => handleToggleSubtask(id)}
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                          done
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-500 dark:border-[var(--dm-border)] dark:hover:border-green-500'
                        }`}
                      >
                        {done && (
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <span className={`flex-1 text-xs sm:text-sm ${done ? 'line-through text-gray-400' : 'text-gray-900 dark:text-[var(--dm-text)]'}`}>
                        {titulo}
                      </span>
                      <button
                        onClick={() => handleDeleteSubtask(id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:text-[var(--dm-text-muted)] dark:hover:text-red-400 flex-shrink-0"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })
              ) : (
                <p className="text-gray-500 dark:text-[var(--dm-text-muted)] text-center py-4 text-sm sm:text-base">
                  No hay subtareas. Agrega una para comenzar.
                </p>
              )}
            </div>

            <div className="flex gap-2 flex-col sm:flex-row">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Nueva subtarea..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:placeholder:text-[var(--dm-text-muted)] text-sm sm:text-base"
              />
              <button
                onClick={handleAddSubtask}
                className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-fg)] rounded-lg hover:opacity-90 transition-colors text-sm sm:text-base"
              >
                Agregar
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
