import { motion } from 'framer-motion'
import { getTaskStats, daysRemainingLabel, todayStr } from '../domain/task-stats.js'
import { useIncrementTaskLogUnit } from '../features/tasks/hooks.js'

export default function TaskCard({ task, subject, onToggleDone, onEdit, onDelete }) {
  const priorityColors = {
    baja: 'bg-green-100 text-green-800',
    media: 'bg-yellow-100 text-yellow-800',
    alta: 'bg-red-100 text-red-800',
  }

  // Get task statistics
  const stats = getTaskStats(task)

  // Increment log mutation
  const incrementLog = useIncrementTaskLogUnit()

  // Calculate current log value for today
  const today = todayStr()
  const log = task.log || {}
  const currentValue = Number(log[today]) || 0
  const totalDone = Object.keys(log).reduce((sum, k) => sum + (Number(log[k]) || 0), 0)
  const totalUnits = Number(task.total_units) || 0

  // Determine if +/- controls should be shown
  const showLogControls = task.tipo === 'cantidad' && !task.done && totalUnits > 0

  // Map status to colors
  const getStatusColor = (status) => {
    if (status === 'critical' || status === 'overdue') return 'red'
    if (status === 'onyellow' || status === 'onattention') return 'orange'
    if (status === 'ongreen' || status === 'done') return 'green'
    return 'gray' // notstarted
  }

  const statusColor = getStatusColor(stats.status)
  const statusColorClasses = {
    red: 'border-red-500',
    orange: 'border-orange-500',
    green: 'border-green-500',
    gray: 'border-gray-300'
  }

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

  const isOverdue = task.due && new Date(task.due) < new Date() && !task.done

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-white rounded-lg shadow-sm p-4 border-l-4 dark:bg-[var(--dm-surface)] dark:border-[var(--dm-border)] ${task.done ? 'border-gray-300 opacity-60 dark:border-[var(--dm-border)]' : statusColorClasses[statusColor]}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleDone(task.id, !task.done)}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${task.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-blue-500 dark:border-[var(--dm-border)] dark:hover:border-[var(--color-primary)]'}`}
        >
          {task.done && '✓'}
        </button>

        <div className="flex-1">
          <h4 className={`font-medium ${task.done ? 'line-through text-gray-500 dark:text-[var(--dm-text-muted)]' : 'text-gray-900 dark:text-[var(--dm-text)]'}`}>
            {task.titulo}
          </h4>

          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            {subject && (
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text-muted)]">
                {subject.nombre}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded ${priorityColors[task.prioridad]}`}>
              {task.prioridad}
            </span>
            <span className={`text-gray-600 dark:text-[var(--dm-text-muted)] ${isOverdue ? 'text-red-600 font-medium dark:text-red-400' : ''}`}>
              {daysRemainingLabel(stats)}
            </span>
            {stats.type === 'cantidad' && stats.exigencia && (
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded dark:bg-[color-mix(in_srgb,var(--color-primary)_20%,var(--dm-surface))] dark:text-[var(--color-primary)]">
                {stats.exigencia.toFixed(1)}x
              </span>
            )}
          </div>

          <div className="mt-2 text-xs text-gray-500 dark:text-[var(--dm-text-muted)]">
            <span>{stats.progressLabel}</span>
            {!task.done && stats.remaining > 0 && (
              <span className="ml-2">• Ritmo: {stats.ritmoActual.toFixed(1)}/día</span>
            )}
            {showLogControls && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => incrementLog.mutate({ taskId: task.id, dateStr: today, delta: -1 })}
                  disabled={currentValue <= 0 || incrementLog.isPending}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium
                    ${currentValue <= 0 || incrementLog.isPending
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text-muted)]'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-[color-mix(in_srgb,var(--color-primary)_20%,var(--dm-surface))] dark:text-[var(--color-primary)] dark:hover:bg-[color-mix(in_srgb,var(--color-primary)_30%,var(--dm-surface))]'
                    }`}
                >
                  -
                </button>
                <span className="text-xs font-medium dark:text-[var(--dm-text)]">{currentValue}</span>
                <button
                  onClick={() => incrementLog.mutate({ taskId: task.id, dateStr: today, delta: 1 })}
                  disabled={totalDone >= totalUnits || incrementLog.isPending}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium
                    ${totalDone >= totalUnits || incrementLog.isPending
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text-muted)]'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-[color-mix(in_srgb,var(--color-primary)_20%,var(--dm-surface))] dark:text-[var(--color-primary)] dark:hover:bg-[color-mix(in_srgb,var(--color-primary)_30%,var(--dm-surface))]'
                    }`}
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)] dark:hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded dark:text-[var(--dm-text-muted)] dark:hover:text-red-300 dark:hover:bg-[color-mix(in_srgb,red_12%,transparent)]"
          >
            🗑️
          </button>
        </div>
      </div>
    </motion.div>
  )
}
