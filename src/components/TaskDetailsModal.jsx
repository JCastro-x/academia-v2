import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getTaskStats, todayStr } from '../domain/task-stats.js'
import { useIncrementTaskLogUnit } from '../features/tasks/hooks.js'
import { useUIStore } from '../stores/ui.store.js'

export default function TaskDetailsModal({ task, subject, onClose, onToggleSubtask, onUpdateTask, onToggleDone }) {
  const [newSubtask, setNewSubtask] = useState('')
  const [currentTask, setCurrentTask] = useState(task)
  const [currentLog, setCurrentLog] = useState(task.log || {})
  
  const incrementLog = useIncrementTaskLogUnit()
  const { workingDays } = useUIStore()
  const today = todayStr()
  const log = currentLog
  const currentValue = Number(log[today]) || 0
  const totalDone = Object.keys(log).reduce((sum, key) => sum + (Number(log[key]) || 0), 0)
  const totalUnits = Number(currentTask.total_units) || 0
  const showLogControls = currentTask.tipo === 'cantidad' && !currentTask.done && totalUnits > 0
  
  // Recalculate stats based on current log
  const stats = getTaskStats({ ...currentTask, log: currentLog })
  const remaining = Math.max(0, totalUnits - totalDone)
  const metaHoy = stats.metaHoy || 0
  const recomendadoRestante = stats.recomendadoRestante || 0

  // Update local state when task prop changes
  useEffect(() => {
    setCurrentTask(task)
    setCurrentLog(task.log || {})
  }, [task, task.log])

  // Update local log state when incrementLog mutation succeeds
  useEffect(() => {
    if (incrementLog.isSuccess && incrementLog.data) {
      setCurrentLog(incrementLog.data.log || {})
      setCurrentTask(prev => ({ ...prev, log: incrementLog.data.log || {} }))
    }
  }, [incrementLog.isSuccess, incrementLog.data])

  // Update stats when log changes
  useEffect(() => {
    if (currentTask.tipo === 'cantidad') {
      const newStats = getTaskStats({ ...currentTask, log: currentLog })
      // We'll recalculate derived values when needed
    }
  }, [currentLog, currentTask])

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

  const calculateDaysRemaining = (dateString) => {
    if (!dateString) return null
    const dueDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    
    const diffTime = dueDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // No contar la fecha de entrega
    return diffDays > 0 ? diffDays - 1 : diffDays
  }

  const calculateWorkingDaysRemaining = (dateString) => {
    if (!dateString) return null
    const dueDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    
    let workingDaysCount = 0
    let currentDate = new Date(today)
    
    // Iterar desde hoy hasta la fecha de entrega (sin incluir la fecha de entrega)
    while (currentDate < dueDate) {
      const dayOfWeek = currentDate.getDay()
      if (workingDays.includes(dayOfWeek)) {
        workingDaysCount++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return workingDaysCount
  }

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return
    const updatedSubtasks = [...(currentTask.subtasks || []), { id: Date.now().toString(), titulo: newSubtask, done: false }]
    setCurrentTask({ ...currentTask, subtasks: updatedSubtasks })
    onUpdateTask(currentTask.id, { subtasks: updatedSubtasks })
    setNewSubtask('')
  }

  const handleIncrementLog = (delta) => {
    // Optimistic update - update local state immediately
    const newLog = { ...currentLog }
    const currentValue = Number(newLog[today]) || 0
    const newValue = currentValue + delta
    
    // Prevent negative values
    if (newValue < 0) return
    
    // Prevent exceeding total_units
    const totalDone = Object.keys(newLog).reduce((sum, key) => sum + (Number(newLog[key]) || 0), 0)
    const totalDoneWithNewValue = totalDone - currentValue + newValue
    if (totalUnits > 0 && totalDoneWithNewValue > totalUnits) return
    
    if (newValue === 0) {
      delete newLog[today]
    } else {
      newLog[today] = newValue
    }
    
    setCurrentLog(newLog)
    setCurrentTask(prev => ({ ...prev, log: newLog }))
    
    // Then call the mutation
    incrementLog.mutate({ taskId: task.id, dateStr: today, delta })
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
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="modal-panel bg-white rounded-xl shadow-xl w-full max-w-md sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] mx-2 sm:mx-4"
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
                    {(() => {
                      const daysRemaining = calculateDaysRemaining(task.due)
                      const workingDaysRemaining = calculateWorkingDaysRemaining(task.due)
                      if (daysRemaining !== null) {
                        if (daysRemaining > 0) {
                          return ` (${daysRemaining} días restantes, ${workingDaysRemaining} días de trabajo)`
                        } else if (daysRemaining === 0) {
                          return ` (¡Vence hoy!)`
                        } else {
                          return ` (${Math.abs(daysRemaining)} días de retraso)`
                        }
                      }
                      return ''
                    })()}
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

          <div className="p-3 sm:p-6 overflow-y-auto max-h-[35vh] sm:max-h-[55vh]">
            {showLogControls && (
              <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-[var(--dm-text)] mb-2 sm:mb-3">Control de Progreso</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="bg-white dark:bg-[var(--dm-surface)] p-2 sm:p-3 rounded shadow-sm">
                    <p className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">Llevas</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-[var(--dm-text)]">{totalDone}</p>
                  </div>
                  <div className="bg-white dark:bg-[var(--dm-surface)] p-2 sm:p-3 rounded shadow-sm">
                    <p className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">Faltan</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-[var(--dm-text)]">{remaining}</p>
                  </div>
                  <div className="bg-white dark:bg-[var(--dm-surface)] p-2 sm:p-3 rounded shadow-sm">
                    <p className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">Meta hoy</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-[var(--dm-text)]">{metaHoy === 0 ? '✅' : metaHoy}</p>
                  </div>
                  <div className="bg-white dark:bg-[var(--dm-surface)] p-2 sm:p-3 rounded shadow-sm">
                    <p className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">Recomendado</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-[var(--dm-text)]">{recomendadoRestante === 0 ? '🔥' : recomendadoRestante}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <button
                    onClick={() => handleIncrementLog(-1)}
                    disabled={currentValue <= 0 || incrementLog.isPending}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ripple ${
                      currentValue <= 0 || incrementLog.isPending 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-[color-mix(in_srgb,var(--color-primary)_20%,var(--dm-surface))] dark:text-[var(--color-primary)] dark:hover:bg-[color-mix(in_srgb,var(--color-primary)_30%,var(--dm-surface))] hover:scale-105 active:scale-95 shadow-lg'
                    }`}
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                    </svg>
                  </button>
                  <div className="text-center min-w-[50px] sm:min-w-[60px]">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">Hoy</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[var(--dm-text)]">{currentValue}</p>
                  </div>
                  <button
                    onClick={() => handleIncrementLog(1)}
                    disabled={totalDone >= totalUnits || incrementLog.isPending}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ripple ${
                      totalDone >= totalUnits || incrementLog.isPending 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-[color-mix(in_srgb,var(--color-primary)_20%,var(--dm-surface))] dark:text-[var(--color-primary)] dark:hover:bg-[color-mix(in_srgb,var(--color-primary)_30%,var(--dm-surface))] hover:scale-105 active:scale-95 shadow-lg'
                    }`}
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
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

            <div className="flex gap-2 flex-col sm:flex-row bg-white dark:bg-[var(--dm-surface)] pt-3 sm:pt-4 pb-0 sm:pb-0">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Nueva subtarea..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:placeholder:text-[var(--dm-text-muted)] text-sm sm:text-base w-full"
              />
              <button
                onClick={handleAddSubtask}
                className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-fg)] rounded-lg hover:opacity-90 transition-colors text-sm sm:text-base whitespace-nowrap w-full sm:w-auto"
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
