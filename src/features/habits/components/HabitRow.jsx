import { motion } from 'framer-motion'
import DayCell from './DayCell.jsx'
import { isToday } from '../../../lib/date-utils.js'
import { calculateStreak, calculateWeeklyPercent } from '../stats.js'

export default function HabitRow({ habit, days, programaciones, logs, pauseDays, config }) {
  const streak = calculateStreak(habit, logs, programaciones, pauseDays, config)
  const weeklyPercent = calculateWeeklyPercent(habit, logs, programaciones, pauseDays, config)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-9 gap-2 items-center h-11"
    >
      <div className="text-xs font-medium dark:text-[var(--dm-text)] truncate pr-2" title={habit.nombre}>
        {habit.nombre}
      </div>
      {days.map(day => (
        <DayCell
          key={day}
          habit={habit}
          fecha={day}
          programaciones={programaciones}
          logs={logs}
          pauseDays={pauseDays}
          config={config}
          isToday={isToday(day)}
        />
      ))}
      <div className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)] flex items-center gap-1">
        <span title="Racha actual">🔥 {streak}</span>
        <span title="Esta semana">{weeklyPercent}%</span>
      </div>
    </motion.div>
  )
}
