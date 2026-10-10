import { getDayOfWeek, isToday, addDays } from '../../../lib/date-utils.js'

const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function DaysHeader({ days }) {
  return (
    <div className="grid grid-cols-9 gap-2 mb-2">
      <div className="text-xs font-semibold text-gray-600 dark:text-[var(--dm-text-muted)] flex items-center">
        Hábito
      </div>
      {days.map(day => (
        <div
          key={day}
          className={`text-center text-xs font-semibold w-8 flex-shrink-0 ${
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
