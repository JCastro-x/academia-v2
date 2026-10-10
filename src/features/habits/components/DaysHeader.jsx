import { getDayOfWeek, isToday } from '../../../lib/date-utils.js'

const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// Plantilla de grilla compartida con HabitRow
export const GRID_TEMPLATE = 'minmax(140px, 1.5fr) repeat(7, minmax(0, 1fr)) minmax(90px, auto)'

export default function DaysHeader({ days }) {
  return (
    <div className="hidden md:block grid gap-2 mb-2" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
      <div className="text-xs font-semibold text-gray-600 dark:text-[var(--dm-text-muted)] flex items-center">
        Hábito
      </div>
      {days.map(day => (
        <div
          key={day}
          className={`text-center text-xs font-semibold w-10 flex-shrink-0 ${
            isToday(day)
              ? 'text-[var(--color-primary)] font-bold'
              : 'text-gray-600 dark:text-[var(--dm-text-muted)]'
          }`}
        >
          {dayLabels[getDayOfWeek(day) - 1]}
        </div>
      ))}
      <div className="text-xs font-semibold text-gray-600 dark:text-[var(--dm-text-muted)] flex items-center">
        Stats
      </div>
    </div>
  )
}
