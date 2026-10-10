import {
  getEstado,
  isDayApplicable,
  isWeekendPlus,
  getEstadoValor,
  getProgramacionVigente,
} from './api.js'
import {
  addDays,
  getTodayDate,
  daysBetween,
  getDayOfWeek,
} from '../../lib/date-utils.js'

/**
 * Calcula la racha actual de un hábito
 */
export function calculateStreak(habit, logs, programaciones, pauseDays, config) {
  const prog = getProgramacionVigente(habit, getTodayDate(), programaciones)
  if (!prog) return 0

  switch (prog.tipo) {
    case 'dias_fijos':
      return calculateStreakDiasFijos(habit, logs, programaciones, pauseDays, config, prog)
    case 'meta_semanal':
      return calculateStreakMetaSemanal(habit, logs, programaciones, pauseDays, config, prog)
    case 'periodico':
      return calculateStreakPeriodico(habit, logs, programaciones, pauseDays, config, prog)
    case 'evitar':
      return calculateStreakEvitar(habit, logs, programaciones, pauseDays, config, prog)
    default:
      return 0
  }
}

function calculateStreakDiasFijos(habit, logs, programaciones, pauseDays, config, prog) {
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
      if (prog.tolerar_rojo_aislado) {
        consecutiveReds++
        if (consecutiveReds >= 2) break
      } else {
        break
      }
    }
  }

  return streak
}

function calculateStreakMetaSemanal(habit, logs, programaciones, pauseDays, config, prog) {
  const meta = prog.meta_semanal || 1
  const today = getTodayDate()
  const dayOfWeek = getDayOfWeek(today)
  const monday = addDays(today, -(dayOfWeek - 1))
  
  let streak = 0
  
  // Revisar semanas hacia atrás
  for (let week = 0; week < 52; week++) {
    const weekStart = addDays(monday, -week * 7)
    const weekEnd = addDays(weekStart, 6)
    
    let cumplidos = 0
    for (let i = 0; i < 7; i++) {
      const fecha = addDays(weekStart, i)
      if (!isDayApplicable(habit, fecha, programaciones, pauseDays)) continue
      
      const estado = getEstado(habit, fecha, logs, programaciones, pauseDays, config)
      if (estado === 'cumplido') cumplidos++
    }
    
    if (cumplidos >= meta) {
      streak++
    } else if (week === 0) {
      // Semana en curso: si no llega a meta, no rompe pero no suma
      continue
    } else {
      break
    }
  }
  
  return streak
}

function calculateStreakPeriodico(habit, logs, programaciones, pauseDays, config, prog) {
  const periodo = prog.periodo_semanas || 1
  const today = getTodayDate()
  const vigencia = prog.vigente_desde
  const semanasDesdeVigencia = Math.floor(daysBetween(vigencia, today) / 7)
  
  let streak = 0
  
  for (let p = 0; p < Math.ceil(semanasDesdeVigencia / periodo); p++) {
    const periodoIndex = semanasDesdeVigencia - (p * periodo)
    if (periodoIndex < 0) break
    
    const periodoStart = addDays(vigencia, periodoIndex * 7)
    const periodoEnd = addDays(periodoStart, 6)
    
    let cumplido = false
    for (let i = 0; i < 7; i++) {
      const fecha = addDays(periodoStart, i)
      if (!isDayApplicable(habit, fecha, programaciones, pauseDays)) continue
      
      const estado = getEstado(habit, fecha, logs, programaciones, pauseDays, config)
      if (estado === 'cumplido') {
        cumplido = true
        break
      }
    }
    
    if (cumplido) {
      streak++
    } else if (p === 0) {
      continue
    } else {
      break
    }
  }
  
  return streak
}

function calculateStreakEvitar(habit, logs, programaciones, pauseDays, config, prog) {
  let streak = 0
  const today = getTodayDate()

  for (let i = 0; i < 365; i++) {
    const fecha = addDays(today, -i)

    if (!isDayApplicable(habit, fecha, programaciones, pauseDays)) continue

    const estado = getEstado(habit, fecha, logs, programaciones, pauseDays, config)
    
    // Para evitar, cumplido es el default, fallado rompe la racha
    if (estado === 'fallado') {
      break
    } else if (estado === 'cumplido' || estado === 'parcial') {
      streak++
    }
    // pendiente, sin_registro, futuro se saltan
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
  const prog = getProgramacionVigente(habit, getTodayDate(), programaciones)
  if (!prog) return 0

  const today = getTodayDate()
  const dayOfWeek = getDayOfWeek(today)
  const monday = addDays(today, -(dayOfWeek - 1))

  switch (prog.tipo) {
    case 'meta_semanal':
      const meta = prog.meta_semanal || 1
      let cumplidos = 0
      for (let i = 0; i < 7; i++) {
        const fecha = addDays(monday, i)
        if (!isDayApplicable(habit, fecha, programaciones, pauseDays)) continue
        const estado = getEstado(habit, fecha, logs, programaciones, pauseDays, config)
        if (estado === 'cumplido') cumplidos++
      }
      return Math.round(Math.min(cumplidos / meta, 1) * 100)

    case 'dias_fijos':
    case 'periodico':
    case 'evitar':
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

    default:
      return 0
  }
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
