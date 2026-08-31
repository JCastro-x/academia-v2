import { useParams } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { useSubjects } from '../features/subjects/hooks.js'
import { useTasks } from '../features/tasks/hooks.js'
import { useEvents } from '../features/events/hooks.js'
import { useSemester } from '../features/semesters/hooks.js'
import { getSemesterStats, getWeekStartDateForWeek } from '../domain/semester-weeks.js'
import { parseDate, formatDate, diffDays } from '../domain/task-stats.js'
import { getContrastTextColor } from '../lib/contrast.js'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DAY_NAMES_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export default function Schedule() {
  const { semesterId } = useParams()
  const { data: subjects, isLoading } = useSubjects(semesterId)
  const { data: tasks } = useTasks(semesterId)
  const { data: events } = useEvents(semesterId)
  const { data: semester } = useSemester(semesterId)

  // Week navigation state (Monday of selected week)
  const [selectedWeekMonday, setSelectedWeekMonday] = useState(() => {
    const today = new Date()
    const day = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
    return monday
  })

  // Calculate week range (Monday to Sunday)
  const weekRange = useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(selectedWeekMonday)
      date.setDate(selectedWeekMonday.getDate() + i)
      days.push(date)
    }
    return days
  }, [selectedWeekMonday])

  // Format week range label
  const weekRangeLabel = useMemo(() => {
    const start = weekRange[0]
    const end = weekRange[6]
    const startStr = start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    const endStr = end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${startStr} - ${endStr}`
  }, [weekRange])

  // Calculate semester context if dates are available
  const semesterContext = useMemo(() => {
    if (!semester?.start_date || !semester?.end_date) return null
    const stats = getSemesterStats(semester.start_date, semester.end_date)
    if (!stats.totalWeeks) return null
    return stats
  }, [semester])

  // Navigation handlers
  const goToPreviousWeek = () => {
    const prevWeek = new Date(selectedWeekMonday)
    prevWeek.setDate(prevWeek.getDate() - 7)
    setSelectedWeekMonday(prevWeek)
  }

  const goToNextWeek = () => {
    const nextWeek = new Date(selectedWeekMonday)
    nextWeek.setDate(nextWeek.getDate() + 7)
    setSelectedWeekMonday(nextWeek)
  }

  const goToCurrentWeek = () => {
    const today = new Date()
    const day = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
    setSelectedWeekMonday(monday)
  }

  if (isLoading) return <div className="flex min-h-[40vh] items-center justify-center text-gray-500 dark:text-[var(--dm-text-muted)]">Cargando...</div>

  // Get schedule for a specific day
  const getScheduleForDay = (dayName) => {
    if (!subjects) return []

    return subjects
      .filter(subject => Array.isArray(subject.horario) && subject.horario.length > 0)
      .map(subject => ({
        subject,
        schedules: subject.horario.filter(h => h.dia?.toLowerCase() === dayName.toLowerCase())
      }))
      .filter(item => item.schedules.length > 0)
  }

  // Get tasks for a specific day
  const getTasksForDay = (date) => {
    if (!tasks) return []
    const dateStr = formatDate(date)
    return tasks.filter(task => {
      if (!task.due) return false
      const taskDate = parseDate(task.due)
      return formatDate(taskDate) === dateStr
    })
  }

  // Get events for a specific day
  const getEventsForDay = (date) => {
    if (!events) return []
    const dateStr = formatDate(date)
    return events.filter(event => {
      if (!event.start_at) return false
      const eventDate = parseDate(event.start_at)
      return formatDate(eventDate) === dateStr
    })
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--dm-text)]">Mi Horario</h1>
          <p className="text-gray-600 dark:text-[var(--dm-text-muted)]">Vista semanal</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousWeek}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
          >
            ←
          </button>
          <button
            onClick={goToCurrentWeek}
            className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded-lg dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)] text-sm"
          >
            Hoy
          </button>
          <button
            onClick={goToNextWeek}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
          >
            →
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[var(--dm-text)]">{weekRangeLabel}</h2>
            {semesterContext && (
              <p className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">
                Semana {semesterContext.currentWeek} de {semesterContext.totalWeeks} del semestre
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {weekRange.map((date, index) => {
            const dayName = DAYS[index]
            const daySchedule = getScheduleForDay(dayName)
            const dayTasks = getTasksForDay(date)
            const dayEvents = getEventsForDay(date)
            const isToday = formatDate(date) === formatDate(new Date())

            return (
              <div
                key={index}
                className={`border rounded-lg p-2 min-h-[200px] ${
                  isToday
                    ? 'border-blue-500 bg-blue-50 dark:border-[var(--color-primary)] dark:bg-[color-mix(in_srgb,var(--color-primary)_20%,var(--dm-surface))]'
                    : 'border-gray-200 dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)]'
                }`}
              >
                <div className="text-center mb-2">
                  <div className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)]">{dayName}</div>
                  <div className={`text-sm font-semibold ${isToday ? 'text-blue-600 dark:text-[var(--color-primary)]' : 'dark:text-[var(--dm-text)]'}`}>
                    {date.getDate()}
                  </div>
                </div>

                {/* Schedule section */}
                {daySchedule.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {daySchedule.map((item, idx) => (
                      <div key={idx}>
                        {item.schedules.map((schedule, sIdx) => (
                          <div
                            key={sIdx}
                            className="text-xs p-1 rounded mb-1"
                            style={{ backgroundColor: item.subject.color, color: getContrastTextColor(item.subject.color) }}
                          >
                            <div className="font-semibold truncate">{item.subject.nombre}</div>
                            <div className="opacity-90 truncate">{schedule.hora_inicio} - {schedule.hora_fin}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tasks/Events section */}
                {(dayTasks.length > 0 || dayEvents.length > 0) && (
                  <div className="border-t pt-2 mt-2 dark:border-[var(--dm-border)]">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        className="text-xs bg-orange-100 text-orange-800 px-1 py-0.5 rounded mb-1 truncate dark:bg-orange-900/30 dark:text-orange-300"
                      >
                        {task.titulo}
                      </div>
                    ))}
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className="text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded mb-1 truncate dark:bg-purple-900/30 dark:text-purple-300"
                      >
                        {event.nombre}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Subject details section */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none">
        <h2 className="text-lg font-semibold mb-4 dark:text-[var(--dm-text)]">Detalle de Materias</h2>
        <div className="space-y-4">
          {subjects?.map(subject => (
            <div key={subject.id} className="border-l-4 pl-4" style={{ borderLeftColor: subject.color }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{subject.icono}</span>
                <div>
                  <h3 className="font-semibold dark:text-[var(--dm-text)]">{subject.nombre}</h3>
                  {subject.codigo && <p className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">{subject.codigo}</p>}
                </div>
              </div>
              {subject.horario && subject.horario.length > 0 && (
                <div className="text-sm text-gray-600 space-y-1 dark:text-[var(--dm-text-muted)]">
                  {subject.horario.map((h, idx) => (
                    <div key={idx}>
                      {h.dia} {h.hora_inicio} - {h.hora_fin}
                      {h.tipo && ` (${h.tipo})`}
                    </div>
                  ))}
                </div>
              )}
              {subject.catedratico && <p className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">Catedrático: {subject.catedratico}</p>}
              {subject.seccion && <p className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">Sección: {subject.seccion}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
