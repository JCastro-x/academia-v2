import { useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useSubjects } from '../features/subjects/hooks.js'
import { useTasks } from '../features/tasks/hooks.js'
import { useEvents } from '../features/events/hooks.js'
import { useSemester } from '../features/semesters/hooks.js'
import { getSemesterStats, getWeekStartDateForWeek, getWeekNumberForDate } from '../domain/semester-weeks.js'
import { parseDate, formatDate, diffDays } from '../domain/task-stats.js'
import SemesterProgressBar from '../components/SemesterProgressBar.jsx'

export default function ScheduleTable() {
  const { semesterId } = useParams()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects(semesterId)
  const { data: tasks } = useTasks(semesterId)
  const { data: events } = useEvents(semesterId)
  const { data: semester } = useSemester(semesterId)

  // Calculate semester context
  const semesterContext = useMemo(() => {
    if (!semester?.start_date || !semester?.end_date) return null
    const stats = getSemesterStats(semester.start_date, semester.end_date)
    if (!stats.totalWeeks) return null
    return stats
  }, [semester])

  // Generate week rows
  const weeks = useMemo(() => {
    if (!semesterContext) return []
    const weeks = []
    for (let i = 1; i <= semesterContext.totalWeeks; i++) {
      const weekStart = getWeekStartDateForWeek(semester.start_date, i)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const today = new Date()
      const isPast = weekEnd < today
      const isCurrent = weekStart <= today && weekEnd >= today
      const isFuture = weekStart > today

      weeks.push({
        number: i,
        start: weekStart,
        end: weekEnd,
        isPast,
        isCurrent,
        isFuture,
      })
    }
    return weeks
  }, [semesterContext, semester?.start_date])

  // Get tasks/events for a specific week and subject
  const getItemsForWeekAndSubject = (week, subjectId) => {
    if (!tasks && !events) return []

    const weekStartStr = formatDate(week.start)
    const weekEndStr = formatDate(week.end)

    const weekTasks = tasks?.filter(task => {
      if (!task.due || task.subject_id !== subjectId) return false
      const taskDate = parseDate(task.due)
      const taskDateStr = formatDate(taskDate)
      return taskDateStr >= weekStartStr && taskDateStr <= weekEndStr
    }) || []

    const weekEvents = events?.filter(event => {
      if (!event.start_at || event.subject_id !== subjectId) return false
      const eventDate = parseDate(event.start_at)
      const eventDateStr = formatDate(eventDate)
      return eventDateStr >= weekStartStr && eventDateStr <= weekEndStr
    }) || []

    return [...weekTasks, ...weekEvents]
  }

  if (subjectsLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-gray-500 dark:text-[var(--dm-text-muted)]">Cargando...</div>
  }

  // Handle missing semester dates
  if (!semesterContext) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-[var(--dm-text)] mb-2">
            Configura las fechas del semestre
          </h2>
          <p className="text-gray-600 dark:text-[var(--dm-text-muted)]">
            Para usar esta vista, primero configura las fechas de inicio y fin del semestre.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--dm-text)]">Plan Semestral</h1>
        {semesterContext && (
          <SemesterProgressBar
            currentWeek={semesterContext.currentWeek}
            totalWeeks={semesterContext.totalWeeks}
            pct={semesterContext.pct}
          />
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-y-auto dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-[var(--dm-bg)]">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[var(--dm-text-muted)] uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-[var(--dm-bg)] z-10">
                  Semana
                </th>
                {subjects?.map(subject => (
                  <th key={subject.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[var(--dm-text-muted)] uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{subject.icono}</span>
                      <span className="truncate max-w-[150px]">{subject.nombre}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[var(--dm-border)]">
              {weeks.map(week => (
                <tr
                  key={week.number}
                  className={`
                    ${week.isPast ? 'bg-gray-50 dark:bg-[var(--dm-bg)]' : ''}
                    ${week.isCurrent ? 'bg-blue-50 dark:bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--dm-surface))]' : ''}
                    ${week.isFuture ? 'bg-white dark:bg-[var(--dm-surface)]' : ''}
                  `}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-[var(--dm-text)] sticky left-0 z-10">
                    <div className="flex items-center gap-2">
                      {week.isPast && <span className="text-green-500">✓</span>}
                      {week.isCurrent && <span className="text-blue-500">●</span>}
                      <span>Semana {week.number}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)]">
                      {formatDate(week.start)} - {formatDate(week.end)}
                    </div>
                  </td>
                  {subjects?.map(subject => {
                    const items = getItemsForWeekAndSubject(week, subject.id)
                    return (
                      <td key={subject.id} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-[var(--dm-text)]">
                        {items.length > 0 ? (
                          <div className="space-y-1">
                            {items.map(item => (
                              <div
                                key={item.id}
                                className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] truncate"
                              >
                                {item.titulo || item.nombre}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-[var(--dm-text-muted)]">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
