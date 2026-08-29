import { useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useSubjects } from '../features/subjects/hooks.js'
import { useTasks } from '../features/tasks/hooks.js'
import { useEvents } from '../features/events/hooks.js'
import { useScheduleNotes, useScheduleFlags } from '../features/schedule-table/hooks.js'
import { useSemester } from '../features/semesters/hooks.js'
import { getSemesterStats, getWeekStartDateForWeek, getWeekNumberForDate } from '../domain/semester-weeks.js'
import { parseDate, formatDate, todayStr } from '../domain/task-stats.js'
import SemesterProgressBar from '../components/SemesterProgressBar.jsx'

export default function ScheduleTable() {
  const { semesterId } = useParams()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects(semesterId)
  const { data: tasks } = useTasks(semesterId)
  const { data: events } = useEvents(semesterId)
  const { data: scheduleNotes } = useScheduleNotes(semesterId)
  const { data: scheduleFlags } = useScheduleFlags(semesterId)
  const { data: semester } = useSemester(semesterId)
  const [expandedWeeks, setExpandedWeeks] = useState(new Set())

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
      
      const today = parseDate(todayStr())
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

  useEffect(() => {
    setExpandedWeeks(new Set(weeks.filter((week) => !week.isPast).map((week) => week.number)))
  }, [weeks])

  const toggleWeek = (weekNumber) => {
    setExpandedWeeks((current) => {
      const next = new Set(current)
      if (next.has(weekNumber)) {
        next.delete(weekNumber)
      } else {
        next.add(weekNumber)
      }
      return next
    })
  }

  // Get tasks/events for a specific week and subject
  const getItemsForWeekAndSubject = (week, subjectId) => {
    if (!tasks && !events && !scheduleNotes) return []

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

    const notes = scheduleNotes?.filter(note => note.week_number === week.number && note.subject_id === subjectId) || []

    return [...weekTasks, ...weekEvents, ...notes]
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
    <div className="space-y-6 pb-16">
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

      <div className="bg-white rounded-lg shadow-md overflow-y-visible pb-16 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none">
        <div className="overflow-x-auto pb-16">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-[var(--dm-bg)]">
                <th className="sticky top-0 left-0 z-30 bg-gray-50 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text-muted)]">
                  Semana
                </th>
                {subjects?.map(subject => (
                  <th key={subject.id} className="sticky top-0 z-20 bg-gray-50 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text-muted)]">
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
                  <td
                    colSpan={expandedWeeks.has(week.number) ? undefined : subjects?.length + 1}
                    className="sticky left-0 z-10 whitespace-nowrap bg-inherit px-4 py-2 text-sm font-medium text-gray-900 dark:text-[var(--dm-text)]"
                    onClick={() => toggleWeek(week.number)}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 text-left"
                      aria-expanded={expandedWeeks.has(week.number)}
                      aria-label={`${expandedWeeks.has(week.number) ? 'Colapsar' : 'Expandir'} semana ${week.number}`}
                    >
                      <span className="inline-block w-4 text-center text-gray-500 dark:text-[var(--dm-text-muted)]">
                        {expandedWeeks.has(week.number) ? '−' : '+'}
                      </span>
                      {scheduleFlags?.find(flag => flag.week_number === week.number)?.flag_type && (
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            {
                              red: 'bg-red-500', yellow: 'bg-yellow-400', green: 'bg-green-500', blue: 'bg-blue-500',
                            }[scheduleFlags.find(flag => flag.week_number === week.number).flag_type] || 'bg-gray-400'
                          }`}
                          aria-label="Estado de la semana"
                        />
                      )}
                      {week.isPast && <span className="text-green-500">✓</span>}
                      {week.isCurrent && <span className="text-blue-500">●</span>}
                      <span>Semana {week.number}</span>
                    </button>
                    <div className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)]">
                      {formatDate(week.start)} - {formatDate(week.end)}
                    </div>
                  </td>
                  {expandedWeeks.has(week.number) && subjects?.map(subject => {
                    const items = getItemsForWeekAndSubject(week, subject.id)
                    return (
                      <td key={subject.id} className="min-w-0 px-4 py-2 text-sm text-gray-900 dark:text-[var(--dm-text)]">
                        {items.length > 0 ? (
                          <div className="space-y-1">
                            {items.map(item => (
                              <div
                                key={item.id}
                                className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded min-w-0 max-w-full overflow-hidden text-ellipsis break-words dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)]"
                              >
                                {item.note_text || item.titulo || item.nombre}
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
