import { useState } from 'react'
import ModalWrapper from './ModalWrapper.jsx'

// Helper: get day of week (1=lunes, 7=domingo) from date string
function getDayOfWeek(dateStr) {
  const [year, month, dayOfMonth] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, dayOfMonth)
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 ? 7 : dayOfWeek
}

// Helper: format date as "DD MMM"
function formatShortDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const monthLabel = date.toLocaleDateString('es-ES', { month: 'short' })
  return `${day} ${monthLabel}`
}

export default function HabitHistoryModal({ habit, onClose }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  
  const historySet = new Set(habit.historial || [])
  const scheduledDays = habit.dias_semana || []
  const isDaily = habit.frecuencia === 'diario'

  // Get calendar days for the selected month
  const getCalendarDays = () => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const startDayOfWeek = getDayOfWeek(firstDay.toISOString().split('T')[0])
    const daysInMonth = lastDay.getDate()
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 1; i < startDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayOfWeek = getDayOfWeek(dateStr)
      
      days.push({
        date: dateStr,
        day,
        dayOfWeek,
        isCompleted: historySet.has(dateStr),
        isScheduled: isDaily || scheduledDays.includes(dayOfWeek),
      })
    }
    
    return days
  }

  const calendarDays = getCalendarDays()
  const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const goToPreviousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))
  }

  const goToToday = () => {
    setSelectedMonth(new Date())
  }

  return (
    <ModalWrapper
      isOpen={true}
      onClose={onClose}
      className="p-6 w-full max-w-md max-h-[90vh] overflow-y-auto mx-4"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold dark:text-[var(--dm-text)]">Historial: {habit.nombre}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousMonth}
            className="px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-[var(--dm-border)] dark:text-[var(--dm-text)]"
          >
            ←
          </button>
          <span className="font-medium dark:text-[var(--dm-text)]">
            {selectedMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={goToNextMonth}
            className="px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-[var(--dm-border)] dark:text-[var(--dm-text)]"
          >
            →
          </button>
        </div>

        <button
          onClick={goToToday}
          className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Ir a hoy
        </button>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Day headers */}
          {dayLabels.map((label) => (
            <div key={label} className="text-xs font-medium text-gray-500 dark:text-[var(--dm-text-muted)] py-1">
              {label}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="py-2" />
            }

            const { date, day: dayNum, isCompleted, isScheduled } = day

            return (
              <div
                key={date}
                className="flex items-center justify-center py-1"
                title={formatShortDate(date)}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    isCompleted && isScheduled
                      ? 'bg-green-500 text-white'
                      : !isCompleted && isScheduled
                        ? 'bg-red-500 text-white'
                        : 'text-gray-300 dark:text-gray-700'
                  }`}
                >
                  {dayNum}
                </span>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-[var(--dm-text-muted)]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Completado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>No completado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-700" />
            <span>No programado</span>
          </div>
        </div>
      </div>
    </ModalWrapper>
  )
}
