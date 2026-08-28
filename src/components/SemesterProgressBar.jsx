import { useMemo } from 'react'

/**
 * Helper function to adjust brightness of a hex color
 * @param {string} hexColor - Hex color (e.g., '#22c55e')
 * @param {number} factor - Brightness factor (0-1, where 1 is original, 0.4 is darker)
 * @returns {string} Adjusted hex color
 */
function adjustBrightness(hexColor, factor) {
  // Remove hash and convert to RGB
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Adjust brightness
  const newR = Math.round(r * factor)
  const newG = Math.round(g * factor)
  const newB = Math.round(b * factor)

  // Convert back to hex
  const toHex = (n) => {
    const hex = n.toString(16)
    return hex.length === 1 ? `0${hex}` : hex
  }

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
}

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
        1: '#22c55e', // verde
        2: '#eab308', // amarillo
        3: '#f97316', // naranja
        4: '#ef4444'  // rojo
      }[quarter]

      const isPast = i < currentWeek
      const isFuture = i > currentWeek
      const isCurrent = i === currentWeek

      const brightness = isPast ? 1 : isFuture ? 0.4 : 1
      const finalColor = isPast || isCurrent
        ? baseColor
        : adjustBrightness(baseColor, 0.4)

      segments.push({
        week: i,
        color: finalColor,
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
