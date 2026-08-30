export function buildDailySummaryContent(tasks, period, nowIso) {
  const pending = Array.isArray(tasks) ? tasks.filter((task) => !task.done) : []
  const count = pending.length
  const now = new Date(nowIso)
  const isMorning = period === 'morning'

  if (count === 0) {
    const timeLabel = isMorning ? 'mañana' : 'noche'
    return {
      title: `Felicidades, no tienes tareas para esta ${timeLabel} 🎉`,
      body: `No tienes tareas para esta ${timeLabel}. ¡Felicidades! 🎉`,
      url: '/tasks',
      count: 0,
      period,
      now,
    }
  }

  const title = isMorning
    ? `Tienes ${count} tarea${count === 1 ? '' : 's'} pendiente${count === 1 ? '' : 's'} para hoy`
    : `Tienes ${count} tarea${count === 1 ? '' : 's'} pendiente${count === 1 ? '' : 's'} de hoy`

  return {
    title,
    body: isMorning
      ? `Tienes ${count} tarea${count === 1 ? '' : 's'} pendientes para hoy. Revisá tus tareas.`
      : `Quedan ${count} tarea${count === 1 ? '' : 's'} pendientes hoy. Volvé a revisarlas.`,
    url: '/tasks',
    count,
    period,
    now,
  }
}

export function getTaskRemindersForNow(tasks, nowIso) {
  const now = new Date(nowIso)
  const results = []

  for (const task of tasks || []) {
    if (!task || task.done) continue
    if (!task.due) continue

    const dueDate = new Date(`${task.due}T23:59:59`)
    const diffMs = dueDate.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    const startOfDueDate = new Date(dueDate)
    startOfDueDate.setHours(0, 0, 0, 0)

    const calendarDayDiff = Math.round((startOfDueDate - startOfToday) / (1000 * 60 * 60 * 24))

    const isThreeHoursBefore = diffHours > 0 && diffHours <= 3
    const isOneDayBefore = calendarDayDiff === 1 && diffHours > 3 && diffHours <= 48

    if (isThreeHoursBefore) {
      results.push({
        taskId: task.id,
        type: 'three_hours_before',
        title: `Recordatorio: ${task.titulo}`,
        body: `Vence en menos de 3 horas. Revisá la tarea antes de que se te pase.`,
        url: '/tasks',
      })
    }

    if (isOneDayBefore) {
      results.push({
        taskId: task.id,
        type: 'day_before',
        title: `Mañana vence: ${task.titulo}`,
        body: `Falta 1 día para que venza esta tarea. Organizate para completarla.`,
        url: '/tasks',
      })
    }
  }

  return results
}
