/**
 * Pure functions for task statistics and rhythm calculations.
 * No React, no Supabase, just math and date utilities.
 * Testable with Vitest without mounting anything.
 * 
 * Ported from Ritmo (js/taskStats.js + js/dateUtils.js)
 * Adapted to Academia v2 data model and conventions.
 */

// ============================================================
// DATE UTILITIES (ported from dateUtils.js)
// ============================================================

/**
 * Clamp a number between min and max values.
 * @param {number} n - Number to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

/**
 * Parse a date string or Date object to a Date.
 * @param {string|Date} str - Date string in YYYY-MM-DD format or Date object
 * @returns {Date|null} Parsed Date or null if invalid
 */
export function parseDate(str) {
  if (!str) return null
  if (str instanceof Date) {
    return new Date(str.getFullYear(), str.getMonth(), str.getDate())
  }
  const value = String(str).trim()
  if (/^-?\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value + 'T00:00:00')
  }
  const parsed = new Date(value)
  return isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Format a Date to YYYY-MM-DD string.
 * @param {Date} d - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Get today's date as YYYY-MM-DD string.
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export function todayStr() {
  return formatDate(new Date())
}

/**
 * Calculate the difference in days between two dates.
 * @param {Date|string} a - First date
 * @param {Date|string} b - Second date
 * @returns {number} Difference in days (b - a)
 */
export function diffDays(a, b) {
  const dateA = parseDate(a)
  const dateB = parseDate(b)
  if (!dateA || !dateB) return 0
  return Math.round((dateB - dateA) / 86400000)
}

/**
 * Truncate a timestamp to date only (YYYY-MM-DD).
 * Used to convert timestamptz to pure date for calculations.
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Date in YYYY-MM-DD format
 */
export function truncateToDate(timestamp) {
  if (!timestamp) return todayStr()
  const date = new Date(timestamp)
  return formatDate(date)
}

// ============================================================
// WORK DAY UTILITIES (adapted to Academia v2 convention)
// ============================================================

/**
 * Convert JavaScript Date.getDay() to Academia v2 convention.
 * 
 * CONVENTION MAPPING:
 * - JavaScript Date.getDay(): 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
 * - Academia v2 work_days: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
 * 
 * Example: Monday -> JS returns 1, Academia v2 expects 1 (no change)
 *          Sunday -> JS returns 0, Academia v2 expects 7 (conversion needed)
 * 
 * @param {number} jsDay - Day from Date.getDay() (0-6)
 * @returns {number} Day in Academia v2 convention (1-7)
 */
function jsDayToAcademiaDay(jsDay) {
  return jsDay === 0 ? 7 : jsDay
}

/**
 * Count work days between two dates based on work_days array.
 * @param {string} startStr - Start date in YYYY-MM-DD format
 * @param {string} endStr - End date in YYYY-MM-DD format
 * @param {number[]} workDays - Array of work days in Academia v2 convention (1=Monday...7=Sunday)
 * @returns {number} Count of work days (minimum 1)
 */
export function countWorkDays(startStr, endStr, workDays) {
  const start = parseDate(startStr)
  const end = parseDate(endStr)
  if (!start || !end || !workDays || workDays.length === 0) return 0
  
  let count = 0
  const current = new Date(start)
  
  while (current <= end) {
    const academiaDay = jsDayToAcademiaDay(current.getDay())
    if (workDays.includes(academiaDay)) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return Math.max(1, count)
}

// ============================================================
// BASE TIME STATISTICS
// ============================================================

/**
 * Calculate base time statistics for a task.
 * @param {string} startStr - Start date in YYYY-MM-DD format (created_at truncated)
 * @param {string} endStr - End date in YYYY-MM-DD format (due truncated)
 * @returns {Object} Time statistics including daysTotal, timePercent, notStarted, isOverdue, etc.
 */
export function baseTimeStats(startStr, endStr) {
  const start = parseDate(startStr)
  const end = parseDate(endStr)
  const today = parseDate(todayStr())
  
  if (!start || !end) {
    return {
      daysTotal: 0,
      timePercent: 0,
      notStarted: true,
      isOverdue: false,
      daysRemainingRaw: 0,
      daysRemainingDisplay: 0
    }
  }
  
  const daysTotal = Math.max(1, diffDays(start, end) + 1)
  const daysElapsedRaw = diffDays(start, today) + 1
  const timePercent = clamp((daysElapsedRaw / daysTotal) * 100, 0, 100)
  const notStarted = today < start
  const isOverdue = today > end
  const daysRemainingInclusive = diffDays(today, end) + 1
  
  return {
    daysTotal,
    timePercent,
    notStarted,
    isOverdue,
    daysRemainingRaw: daysRemainingInclusive,
    daysRemainingDisplay: Math.max(0, daysRemainingInclusive)
  }
}

// ============================================================
// STATUS CALCULATION
// ============================================================

/**
 * Determine task status based on progress statistics.
 * @param {Object} stats - Progress statistics from computeCantidadStats or computeChecklistStats
 * @returns {string} Status: 'done', 'notstarted', 'overdue', 'critical', 'ongreen', 'onyellow', 'onattention'
 */
export function statusFromProgress(stats) {
  if (stats.isDone) return 'done'
  if (stats.notStarted) return 'notstarted'
  if (stats.isOverdue) return 'overdue'
  if (stats.daysRemainingDisplay <= 2 && stats.remaining > 0) return 'critical'
  
  if (stats.remaining > 0 && stats.ritmoActual === 0 && stats.daysRemainingDisplay > 2) return 'notstarted'
  
  const diasDeAtraso = stats.diasDeAtraso || 0
  const buffer = stats.ritmoOriginal > 0 ? 0.5 / stats.ritmoOriginal : 0.3
  const extraTolerance = Math.max(0, buffer - 0.3)
  
  if (diasDeAtraso >= -0.3 - extraTolerance) return 'ongreen'
  if (diasDeAtraso >= -1.0 - extraTolerance) return 'onyellow'
  if (diasDeAtraso >= -2.0 - extraTolerance) return 'onattention'
  return 'critical'
}

// ============================================================
// CANTIDAD (QUANTITY) TASK STATISTICS
// ============================================================

/**
 * Calculate statistics for a task of type 'cantidad' (quantity-based).
 * @param {Object} task - Task object with tipo='cantidad', total_units, work_days, log, created_at, due
 * @returns {Object} Comprehensive statistics for cantidad tasks
 */
export function computeCantidadStats(task) {
  // Handle null/undefined values defensively
  const startStr = task.created_at ? truncateToDate(task.created_at) : todayStr()
  const endStr = task.due ? truncateToDate(task.due) : todayStr()
  const bt = baseTimeStats(startStr, endStr)
  
  const log = task.log || {}
  const totalUnits = Number(task.total_units) || 0
  const totalDone = Object.keys(log).reduce((sum, k) => sum + (Number(log[k]) || 0), 0)
  
  // If total_units is null or 0, return safe defaults
  if (totalUnits === 0) {
    return {
      type: 'cantidad',
      status: 'notstarted',
      progressPercent: 0,
      timePercent: bt.timePercent,
      daysTotal: 0,
      daysRemainingDisplay: bt.daysRemainingDisplay,
      notStarted: bt.notStarted,
      isOverdue: bt.isOverdue,
      isDone: false,
      totalUnits: 0,
      totalDone: 0,
      remaining: 0,
      doneToday: 0,
      metaHoy: 0,
      necesitasHoy: 0,
      recomendado: 0,
      ritmoActual: 0,
      ritmoNecesario: 0,
      ritmoOriginal: 0,
      diasDeAtraso: 0,
      exigencia: 1,
      unitLabel: 'unidades',
      progressLabel: '0/0 unidades'
    }
  }
  
  const progressPercent = clamp((totalDone / totalUnits) * 100, 0, 100)
  const isDone = totalDone >= totalUnits
  const remaining = Math.max(0, totalUnits - totalDone)
  
  const tKey = todayStr()
  const doneToday = Number(log[tKey]) || 0
  const doneBeforeToday = totalDone - doneToday
  const remainingBeforeToday = Math.max(0, totalUnits - doneBeforeToday)
  
  const workDays = task.work_days && task.work_days.length > 0 ? task.work_days : [1, 2, 3, 4, 5]
  const workDaysTotal = countWorkDays(startStr, endStr, workDays)
  const workDaysRemaining = countWorkDays(tKey, endStr, workDays)
  const workDaysElapsed = countWorkDays(startStr, tKey, workDays)
  
  const metaDiariaOriginal = Math.ceil(totalUnits / Math.max(1, workDaysTotal))
  const necesitasHoy = Math.ceil(remaining / Math.max(1, workDaysRemaining))
  const recomendado = Math.ceil(necesitasHoy * 1.15)
  const exigencia = metaDiariaOriginal > 0 ? necesitasHoy / metaDiariaOriginal : 1
  
  let metaHoy
  if (isDone) {
    metaHoy = 0
  } else if (bt.isOverdue) {
    metaHoy = remainingBeforeToday
  } else {
    metaHoy = Math.ceil(remaining / Math.max(1, workDaysRemaining))
  }
  
  const daysElapsedForPace = workDaysElapsed > 0 ? workDaysElapsed : 1
  const ritmoActual = workDaysElapsed > 0 ? totalDone / workDaysElapsed : totalDone
  
  let ritmoNecesario
  if (isDone) {
    ritmoNecesario = 0
  } else if (bt.isOverdue) {
    ritmoNecesario = remaining
  } else {
    ritmoNecesario = remaining / Math.max(1, workDaysRemaining)
  }
  
  const ritmoOriginal = totalUnits / Math.max(1, workDaysTotal)
  const esperadoHoy = ritmoOriginal * workDaysElapsed
  const diferencia = totalDone - esperadoHoy
  const diasDeAtraso = ritmoOriginal > 0 ? diferencia / ritmoOriginal : 0
  
  const statsForStatus = {
    isDone,
    notStarted: bt.notStarted,
    isOverdue: bt.isOverdue,
    daysRemainingDisplay: Math.max(0, workDaysRemaining),
    remaining,
    ritmoActual,
    ritmoNecesario,
    ritmoOriginal,
    diasDeAtraso,
    exigencia
  }
  const status = statusFromProgress(statsForStatus)
  
  return {
    type: 'cantidad',
    status,
    progressPercent,
    timePercent: bt.timePercent,
    daysTotal: workDaysTotal,
    daysRemainingDisplay: Math.max(0, workDaysRemaining),
    notStarted: bt.notStarted,
    isOverdue: bt.isOverdue,
    isDone,
    totalUnits,
    totalDone,
    remaining,
    doneToday,
    metaHoy,
    necesitasHoy,
    recomendado,
    ritmoActual,
    ritmoNecesario,
    ritmoOriginal,
    diasDeAtraso,
    exigencia,
    unitLabel: 'unidades',
    progressLabel: `${totalDone}/${totalUnits} unidades`
  }
}

// ============================================================
// CHECKLIST TASK STATISTICS
// ============================================================

/**
 * Calculate statistics for a task of type 'checklist' (subtask-based).
 * @param {Object} task - Task object with tipo='checklist', subtasks, work_days, created_at, due
 * @returns {Object} Comprehensive statistics for checklist tasks
 */
export function computeChecklistStats(task) {
  const startStr = task.created_at ? truncateToDate(task.created_at) : todayStr()
  const endStr = task.due ? truncateToDate(task.due) : todayStr()
  const bt = baseTimeStats(startStr, endStr)
  
  const subtasks = task.subtasks || []
  const totalSub = subtasks.length
  const doneSub = subtasks.filter(s => s.done).length
  const progressPercent = totalSub > 0 ? (doneSub / totalSub) * 100 : 0
  const isDone = totalSub > 0 && doneSub === totalSub
  const remaining = Math.max(0, totalSub - doneSub)
  
  const workDays = task.work_days && task.work_days.length > 0 ? task.work_days : [1, 2, 3, 4, 5]
  const workDaysTotal = countWorkDays(startStr, endStr, workDays)
  const workDaysRemaining = countWorkDays(todayStr(), endStr, workDays)
  const workDaysElapsed = workDaysTotal - workDaysRemaining
  
  const ritmoActual = workDaysElapsed > 0 ? doneSub / Math.max(1, workDaysElapsed) : 0
  
  let ritmoNecesario
  if (isDone) {
    ritmoNecesario = 0
  } else if (bt.isOverdue) {
    ritmoNecesario = remaining
  } else {
    ritmoNecesario = remaining / Math.max(1, workDaysRemaining)
  }
  
  const ritmoOriginal = totalSub / Math.max(1, workDaysTotal)
  const esperadoHoy = ritmoOriginal * workDaysElapsed
  const diferencia = doneSub - esperadoHoy
  const diasDeAtraso = ritmoOriginal > 0 ? diferencia / ritmoOriginal : 0
  
  const statsForStatus = {
    isDone,
    notStarted: bt.notStarted,
    isOverdue: bt.isOverdue,
    daysRemainingDisplay: Math.max(0, workDaysRemaining),
    remaining,
    ritmoActual,
    ritmoNecesario,
    ritmoOriginal,
    diasDeAtraso
  }
  const status = statusFromProgress(statsForStatus)
  
  return {
    type: 'checklist',
    status,
    progressPercent,
    timePercent: bt.timePercent,
    daysTotal: workDaysTotal,
    daysRemainingDisplay: Math.max(0, workDaysRemaining),
    notStarted: bt.notStarted,
    isOverdue: bt.isOverdue,
    isDone,
    totalSub,
    doneSub,
    remaining,
    ritmoActual,
    ritmoNecesario,
    ritmoOriginal,
    diasDeAtraso,
    progressLabel: `${doneSub}/${totalSub} subtareas`
  }
}

// ============================================================
// DISPATCHER
// ============================================================

/**
 * Get task statistics based on task type.
 * @param {Object} task - Task object with tipo field ('cantidad' or 'checklist')
 * @returns {Object} Task statistics
 */
export function getTaskStats(task) {
  if (task.tipo === 'cantidad') {
    return computeCantidadStats(task)
  }
  return computeChecklistStats(task)
}

// ============================================================
// LABEL UTILITIES
// ============================================================

/**
 * Generate a human-readable label for days remaining.
 * @param {Object} stats - Task statistics
 * @returns {string} Human-readable days remaining label
 */
export function daysRemainingLabel(stats) {
  if (stats.isDone) return 'Completada'
  if (stats.notStarted) return 'Aún no inicia'
  if (stats.isOverdue) return 'Venció'
  if (stats.daysRemainingDisplay === 0) return 'Vence hoy'
  return `${stats.daysRemainingDisplay} ${pluralDias(stats.daysRemainingDisplay)} restantes`
}

/**
 * Get plural form of "día".
 * @param {number} n - Number
 * @returns {string} "día" or "días"
 */
function pluralDias(n) {
  return Math.abs(n) === 1 ? 'día' : 'días'
}
