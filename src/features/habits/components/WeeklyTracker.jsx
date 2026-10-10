import { useState } from 'react'
import { motion } from 'framer-motion'
import { getTodayDate, addDays, getDayOfWeek } from '../../../lib/date-utils.js'
import DaysHeader from './DaysHeader.jsx'
import HabitRow from './HabitRow.jsx'

export default function WeeklyTracker({ habits, programaciones, logs, pauseDays, config, onEditHabit, onArchiveHabit, onTogglePause, onDeleteHabit, userId, showArchived, onToggleShowArchived }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = getTodayDate()
    const dayOfWeek = getDayOfWeek(today)
    return addDays(today, -(dayOfWeek - 1)) // Lunes de esta semana
  })

  const goToPrevWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7))
  }

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7))
  }

  const goToToday = () => {
    const today = getTodayDate()
    const dayOfWeek = getDayOfWeek(today)
    setCurrentWeekStart(addDays(today, -(dayOfWeek - 1)))
  }

  // Generar días de la semana
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  // Formato de rango de semana
  const formatDate = (dateStr) => {
    const date = new Date(dateStr.split('-').map(Number))
    const day = date.getDate()
    const month = date.toLocaleDateString('es-ES', { month: 'short' })
    return `${day} ${month}`
  }
  const weekRange = `Semana del ${formatDate(weekDays[0])} al ${formatDate(weekDays[6])}`

  // Agrupar hábitos por momento del día
  const groupedHabits = {
    manana: habits.filter(h => h.momento_dia === 'manana' && (showArchived ? true : !h.archivado)),
    tarde: habits.filter(h => h.momento_dia === 'tarde' && (showArchived ? true : !h.archivado)),
    noche: habits.filter(h => h.momento_dia === 'noche' && (showArchived ? true : !h.archivado)),
  }

  const momentLabels = {
    manana: 'Mañana',
    tarde: 'Tarde',
    noche: 'Noche',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header de navegación */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <button
          onClick={goToPrevWeek}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[var(--dm-surface)] dark:text-[var(--dm-text)]"
        >
          ←
        </button>
        <div className="flex items-center gap-2">
          <span className="font-semibold dark:text-[var(--dm-text)] text-sm">
            {weekRange}
          </span>
          <button
            onClick={goToToday}
            className="text-sm bg-[var(--color-primary)] text-[var(--color-primary-fg)] px-3 py-1 rounded-lg hover:opacity-90"
          >
            Hoy
          </button>
        </div>
        <button
          onClick={goToNextWeek}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[var(--dm-surface)] dark:text-[var(--dm-text)]"
        >
          →
        </button>
      </div>

      {/* Filtro de archivados */}
      <div className="mb-4">
        <button
          onClick={onToggleShowArchived}
          className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)] hover:text-gray-900 dark:hover:text-[var(--dm-text)]"
        >
          {showArchived ? 'Ocultar archivados' : 'Ver archivados'}
        </button>
      </div>

      {/* Header de días */}
      <div className="w-full">
        <DaysHeader days={weekDays} />
      </div>

      {/* Lista de hábitos agrupados */}
      <div className="space-y-4 w-full">
        {Object.entries(groupedHabits).map(([momento, habitList]) => {
          if (habitList.length === 0) return null

          return (
            <div key={momento}>
              <h3 className="text-xs font-semibold text-gray-600 dark:text-[var(--dm-text-muted)] mb-2">
                {momentLabels[momento]}
              </h3>
              <div className="space-y-1">
                {habitList.map(habit => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    days={weekDays}
                    programaciones={programaciones}
                    logs={logs}
                    pauseDays={pauseDays}
                    config={config}
                    onEdit={onEditHabit}
                    onArchive={onArchiveHabit}
                    onTogglePause={onTogglePause}
                    onDelete={onDeleteHabit}
                    userId={userId}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {habits.filter(h => !h.archivado).length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-[var(--dm-text-muted)]">
            <p>No hay hábitos aún. Crea el primero para empezar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
