import { motion } from 'framer-motion'
import { getTaskStats, daysRemainingLabel, todayStr } from '../domain/task-stats.js'
import { useIncrementTaskLogUnit } from '../features/tasks/hooks.js'

export default function TaskCard({ task, subject, onToggleDone, onEdit, onDelete }) {
  const priorityColors = {
    baja: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    media: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    alta: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
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

  // Status badge configuration (static classes for Tailwind detection)
  const statusBadgeConfig = {
    done: {
      label: 'Excelente',
      className: 'bg-green-600 text-white dark:bg-green-700 dark:text-white'
    },
    ongreen: {
      label: 'Excelente',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    },
    onyellow: {
      label: 'Bien',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    },
    onattention: {
      label: 'Atención',
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    },
    critical: {
      label: 'Crítico',
      className: 'bg-red-600 text-white dark:bg-red-700 dark:text-white'
    },
    overdue: {
      label: 'Crítico',
      className: 'bg-red-700 text-white dark:bg-red-800 dark:text-white'
    },
    notstarted: {
      label: 'Bien',
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const badgeConfig = statusBadgeConfig[stats.status] || statusBadgeConfig.notstarted

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
      whileHover={{ y: -2, boxShadow: '0 8px 20px rgba(15, 23, 42, 0.1)' }}
      whileTap={{ scale: 0.995 }}
      className={`task-card bg-white rounded-xl border border-gray-200 shadow-[var(--shadow-sm)] p-4 transition-shadow dark:bg-[var(--dm-surface)] dark:border-[var(--dm-border)] ${task.done ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleDone(task.id, !task.done)}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${task.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-blue-500 dark:border-[var(--dm-border)] dark:hover:border-[var(--color-primary)]'}`}
        >
          {task.done && '✓'}
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium ${task.done ? 'line-through text-gray-500 dark:text-[var(--dm-text-muted)]' : 'text-gray-900 dark:text-[var(--dm-text)]'}`}>
              {task.titulo}
            </h4>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeConfig.className}`}>
              {badgeConfig.label}
            </span>
          </div>

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
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded dark:bg-purple-900/30 dark:text-purple-400">
                {stats.exigencia.toFixed(1)}x
              </span>
            )}
          </div>

          <div className="mt-2 text-xs text-gray-500 dark:text-[var(--dm-text-muted)]">
            {(stats.type !== 'checklist' || (task.subtasks && task.subtasks.length > 0)) && (
              <span>{stats.progressLabel}</span>
            )}
            {!task.done && stats.remaining > 0 && (
              <span className="ml-2">• Ritmo: {stats.ritmoActual.toFixed(1)}/día</span>
            )}
            {showLogControls && (
              <div className="mt-1">
                <span>Meta hoy: <strong>{stats.metaHoyRestante}</strong> • Recomendado: <strong>{stats.recomendado}</strong></span>
              </div>
            )}
            {showLogControls && (
              <div className="mt-1">
                <span>Falta total: <strong>{stats.remaining}</strong></span>
              </div>
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
            aria-label={`Editar tarea ${task.titulo}`}
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
