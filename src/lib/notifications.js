function pickVariant(seed, variants) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return variants[hash % variants.length]
}

function clip(text, max = 45) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`
}

export function buildDailySummaryContent(tasks, period, nowIso) {
  const pending = Array.isArray(tasks) ? tasks.filter((task) => !task.done) : []
  const count = pending.length
  const now = new Date(nowIso)
  const isMorning = period === 'morning'

  if (count === 0) {
    return {
      title: isMorning ? 'Felicidades, día libre 🎉' : 'Felicidades, día cerrado 🎉',
      body: 'No tienes tareas pendientes 🎉',
      url: '/tasks',
      count: 0,
      period,
      now,
    }
  }

  const plural = count === 1 ? 'tarea' : 'tareas'
  const title = isMorning
    ? `Tienes ${count} ${plural} para hoy`
    : `Quedan ${count} ${plural} de hoy`

  return {
    title,
    body: isMorning
      ? `Vencen hoy: ${count} ${plural} ✅`
      : `Día de cierre: ${count} ${plural} sin terminar 📝`,
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
        title: '⏰ Vence en 3 horas',
        body: pickVariant(task.id, [
          `Últimas 3h para: ${clip(task.titulo)}`,
          `¡Corrí! Vence hoy: ${clip(task.titulo)}`,
          `Por vencer: ${clip(task.titulo)}`,
        ]),
        url: '/tasks',
      })
    }

    if (isOneDayBefore) {
      results.push({
        taskId: task.id,
        type: 'day_before',
        title: 'Vence mañana 🗓️',
        body: pickVariant(task.id, [
          `Mañana vence: ${clip(task.titulo)}`,
          `Te queda 1 día: ${clip(task.titulo)}`,
          `Se acerca el plazo: ${clip(task.titulo)}`,
        ]),
        url: '/tasks',
      })
    }
  }

  return results
}
