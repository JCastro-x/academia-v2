import {
  getEstado,
  isDayApplicable,
  isWeekendPlus,
  getEstadoValor,
} from './api.js'
import {
  addDays,
  getTodayDate,
  daysBetween,
  getDayOfWeek,
} from '../../lib/date-utils.js'

/**
 * Calcula la racha actual de un hábito (solo dias_fijos y diario por ahora)
 */
export function calculateStreak(habit, logs, programaciones, pauseDays, config) {
  let streak = 0
  let consecutiveReds = 0
  const today = getTodayDate()

  for (let i = 0; i < 365; i++) {
    const fecha = addDays(today, -i)

    if (!isDayApplicable(habit, fecha, programaciones, pauseDays)) continue

    // Weekend plus: suma si está marcado, pero no entra al cálculo de racha
    if (isWeekendPlus(habit, fecha, programaciones)) {
      const estado = getEstado(habit, fecha, logs, programaciones, pauseDays, config)
      if (estado === 'cumplido' || estado === 'parcial') {
        if (estado === 'cumplido') streak++
        consecutiveReds = 0
      }
      continue
    }

    const estado = getEstado(habit, fecha, logs, programaciones, pauseDays, config)
    const valor = getEstadoValor(estado)

    // pendiente, sin_registro, futuro: se saltan (continue)
    if (valor === null) continue

    if (estado === 'cumplido') {
      streak++
      consecutiveReds = 0
    } else if (estado === 'parcial') {
      // Mantiene racha sin sumar
      consecutiveReds = 0
    } else if (estado === 'fallado') {
      const prog = programaciones.find(p => p.habit_id === habit.id)
      if (prog?.tolerar_rojo_aislado) {
        consecutiveReds++
        if (consecutiveReds >= 2) break
      } else {
        break
      }
    }
  }

  return streak
}

/**
 * Calcula la mejor racha histórica de un hábito
 */
export function calculateBestStreak(habit, logs, programaciones, pauseDays, config) {
  let bestStreak = 0
  let currentStreak = 0
  let consecutiveReds = 0

  const primeraProg = programaciones
    .filter(p => p.habit_id === habit.id)
    .sort((a, b) => a.vigente_desde.localeCompare(b.vigente_desde))[0]

  if (!primeraProg) return 0

  const startDate = primeraProg.vigente_desde
  const today = getTodayDate()

  for (let date = startDate; date <= today; date = addDays(date, 1)) {
    if (!isDayApplicable(habit, date, programaciones, pauseDays)) continue

    if (isWeekendPlus(habit, date, programaciones)) {
      const estado = getEstado(habit, date, logs, programaciones, pauseDays, config)
      if (estado === 'cumplido' || estado === 'parcial') {
        if (estado === 'cumplido') currentStreak++
        consecutiveReds = 0
      }
      continue
    }

    const estado = getEstado(habit, date, logs, programaciones, pauseDays, config)
    const valor = getEstadoValor(estado)

    if (valor === null) continue

    if (estado === 'cumplido') {
      currentStreak++
      consecutiveReds = 0
    } else if (estado === 'parcial') {
      consecutiveReds = 0
    } else if (estado === 'fallado') {
      const prog = programaciones.find(p => p.habit_id === habit.id)
      if (prog?.tolerar_rojo_aislado) {
        consecutiveReds++
        if (consecutiveReds >= 2) {
          bestStreak = Math.max(bestStreak, currentStreak)
          currentStreak = 0
          consecutiveReds = 0
        }
      } else {
        bestStreak = Math.max(bestStreak, currentStreak)
        currentStreak = 0
        consecutiveReds = 0
      }
    }
  }

  return Math.max(bestStreak, currentStreak)
}

/**
 * Calcula el % de cumplimiento semanal de un hábito
 */
export function calculateWeeklyPercent(habit, logs, programaciones, pauseDays, config) {
  const today = getTodayDate()
  const dayOfWeek = getDayOfWeek(today)
  const monday = addDays(today, -(dayOfWeek - 1))

  let totalDias = 0
  let totalValor = 0

  for (let i = 0; i < 7; i++) {
    const fecha = addDays(monday, i)

    if (!isDayApplicable(habit, fecha, programaciones, pauseDays)) continue

    // Weekend plus: no entra al denominador
    if (isWeekendPlus(habit, fecha, programaciones)) {
      const estado = getEstado(habit, fecha, logs, programaciones, pauseDays, config)
      if (estado === 'cumplido') totalValor++
      continue
    }

    const estado = getEstado(habit, fecha, logs, programaciones, pauseDays, config)
    const valor = getEstadoValor(estado)

    // Excluir pendiente, sin_registro, futuro
    if (valor === null) continue

    totalDias++
    totalValor += valor
  }

  if (totalDias === 0) return 0
  return Math.round((totalValor / totalDias) * 100)
}

/**
 * Calcula el % de cumplimiento global (promedio de % de cada hábito)
 */
export function calculateOverallPercent(habits, logs, programaciones, pauseDays, config) {
  const activeHabits = habits.filter(h => !h.archivado)

  if (activeHabits.length === 0) return 0

  const percents = activeHabits.map(habit =>
    calculateWeeklyPercent(habit, logs, programaciones, pauseDays, config)
  )

  const sum = percents.reduce((a, b) => a + b, 0)
  return Math.round(sum / percents.length)
}

/**
 * Compara con la semana anterior
 */
export function compareWithPreviousWeek(habits, logs, programaciones, pauseDays, config) {
  const today = getTodayDate()
  const lastMonday = addDays(today, -7 - (getDayOfWeek(today) - 1))

  const thisWeekPercent = calculateOverallPercent(habits, logs, programaciones, pauseDays, config)

  // Verificar si hay logs de la semana anterior
  const hasLastWeekData = logs.some(log => {
    const logDate = log.fecha
    return logDate >= lastMonday && logDate < addDays(lastMonday, 7)
  })

  if (!hasLastWeekData) {
    return {
      thisWeek: thisWeekPercent,
      lastWeek: null,
      diff: null,
      message: 'Primera semana',
    }
  }

  // Calcular de la semana anterior (mock por ahora, se necesita logs históricos)
  const lastWeekPercent = 0 // TODO: Implementar con logs históricos

  const diff = thisWeekPercent - lastWeekPercent
  const sign = diff > 0 ? '+' : ''

  return {
    thisWeek: thisWeekPercent,
    lastWeek: lastWeekPercent,
    diff: diff,
    message: `${sign}${diff} pts`,
  }
}

/**
 * Cuenta hábitos con racha activa (> 0)
 */
export function countActiveStreaks(habits, logs, programaciones, pauseDays, config) {
  const activeHabits = habits.filter(h => !h.archivado)

  return activeHabits.filter(habit => {
    const streak = calculateStreak(habit, logs, programaciones, pauseDays, config)
    return streak > 0
  }).length
}
