import { motion } from 'framer-motion'
import DayCell from './DayCell.jsx'
import { isToday, getDayOfWeek } from '../../../lib/date-utils.js'
import { calculateStreak, calculateWeeklyPercent } from '../stats.js'
import { GRID_TEMPLATE } from './DaysHeader.jsx'

const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const monthLabels = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const formatAriaLabel = (date) => {
  const day = date.slice(8)
  const month = parseInt(date.slice(5, 7)) - 1
  return `${dayLabels[getDayOfWeek(date) - 1]} ${day} ${monthLabels[month]}`
}

export default function HabitRow({ habit, days, programaciones, logs, pauseDays, config, onEdit }) {
  const streak = calculateStreak(habit, logs, programaciones, pauseDays, config)
  const weeklyPercent = calculateWeeklyPercent(habit, logs, programaciones, pauseDays, config)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-2 items-center min-h-[44px]"
      style={{ gridTemplateColumns: GRID_TEMPLATE }}
    >
      <div className="text-xs font-medium dark:text-[var(--dm-text)] break-words leading-tight pr-2 flex items-center gap-2" title={habit.nombre}>
        <span className="flex-1">{habit.nombre}</span>
        {onEdit && (
          <button
            onClick={() => onEdit(habit)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-[var(--dm-text)] text-xs"
            title="Editar hábito"
          >
            ✏️
          </button>
        )}
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
          ariaLabel={formatAriaLabel(day)}
        />
      ))}
      <div className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)] flex items-center gap-1">
        <span title="Racha actual">🔥 {streak}</span>
        <span title="Esta semana">{weeklyPercent}%</span>
      </div>
    </motion.div>
  )
}
