import { motion, AnimatePresence } from 'framer-motion'
import { calculateOverallPercent, compareWithPreviousWeek, countActiveStreaks } from '../stats.js'
import { getTodayDate, getDayOfWeek, addDays } from '../../../lib/date-utils.js'

export default function TodayCard({ habits, logs, programaciones, pauseDays, config, isWeekComplete }) {
  const overallPercent = calculateOverallPercent(habits, logs, programaciones, pauseDays, config)
  const comparison = compareWithPreviousWeek(habits, logs, programaciones, pauseDays, config)
  const activeStreaks = countActiveStreaks(habits, logs, programaciones, pauseDays, config)
  const totalHabits = habits.filter(h => !h.archivado).length
  const today = getTodayDate()

  // Contar solo cumplidos (verde) como hábitos completos hoy
  const completedHabits = habits.filter(h => {
    if (h.archivado) return false
    const log = logs.find(l => l.habit_id === h.id && l.fecha === today)
    return log?.estado === 'cumplido'
  }).length

  return (
    <div className="bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg p-4 mb-4 relative overflow-hidden">
      <AnimatePresence>
        {isWeekComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 bg-[var(--color-primary)] flex items-center justify-center z-10"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-2xl font-bold text-[var(--color-primary-fg)]">¡Semana completa!</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold dark:text-[var(--dm-text)]">Hoy</h3>
        <span className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">{comparison.message}</span>
      </div>
      
      {/* Anillo de progreso */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200 dark:text-[var(--dm-border)]"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallPercent / 100)}`}
              className="text-[var(--color-primary)]"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold dark:text-[var(--dm-text)]">
              {completedHabits}/{totalHabits}
            </span>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div>
          <div className="text-2xl font-bold text-[var(--color-primary)]">{overallPercent}%</div>
          <div className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">Cumplimiento</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-500">🔥 {activeStreaks}</div>
          <div className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">Rachas activas</div>
        </div>
      </div>
    </div>
  )
}
