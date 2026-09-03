import { useMemo } from 'react'

/**
 * Semester progress bar component
 * Displays a segmented bar with one segment per week, colored by quarter
 * @param {Object} props - Component props
 * @param {number} props.currentWeek - Current week number (1-based)
 * @param {number} props.totalWeeks - Total number of weeks in semester
 * @param {number} props.pct - Percentage of semester completed (0-100)
 */
export default function SemesterProgressBar({ currentWeek, totalWeeks, pct }) {
  // Generate segments
  const segments = useMemo(() => {
    const segments = []
    for (let i = 1; i <= totalWeeks; i++) {
      const quarter = Math.ceil(i / (totalWeeks / 4))
      const baseColor = {
        1: '#22c55e',
        2: '#eab308',
        3: '#f97316',
        4: '#ef4444'
      }[quarter]

      const isPast = i < currentWeek
      const isFuture = i > currentWeek
      const isCurrent = i === currentWeek

      segments.push({
        week: i,
        color: baseColor,
        isPast,
        isFuture,
        isCurrent,
        quarter
      })
    }
    return segments
  }, [currentWeek, totalWeeks])

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="flex gap-1">
        {segments.map((segment) => (
          <div
            key={segment.week}
            className="flex-1 h-3 rounded-sm transition-all duration-200"
            style={{
              backgroundColor: segment.color,
              opacity: segment.isFuture ? 0.65 : 1,
              ...(segment.isCurrent && {
                boxShadow: `0 0 0 2px white, 0 0 0 3px ${segment.color}`,
                transform: 'scaleY(1.2)'
              })
            }}
            title={`Semana ${segment.week} - Cuarto ${segment.quarter}`}
          />
        ))}
      </div>

      {/* Progress text */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-[var(--dm-text-muted)]">
          Semana {currentWeek} de {totalWeeks}
        </span>
        <span className="font-medium text-gray-900 dark:text-[var(--dm-text)]">
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  )
}
