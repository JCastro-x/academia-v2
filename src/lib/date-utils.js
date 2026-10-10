// Utilidades de fecha para el sistema de hábitos
// Todas las fechas en formato YYYY-MM-DD (zona local)
// PROHIBIDO usar new Date('YYYY-MM-DD') (se interpreta como UTC)

/**
 * Parsea una fecha YYYY-MM-DD a Date local (sin UTC)
 */
export function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Convierte un Date a string YYYY-MM-DD local
 */
export function toLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Obtiene el día de la semana (1=lunes, 7=domingo) desde YYYY-MM-DD
 */
export function getDayOfWeek(dateStr) {
  const date = parseLocalDate(dateStr)
  const day = date.getDay() // 0=domingo, 1=lunes
  return day === 0 ? 7 : day
}

/**
 * Suma N días a una fecha YYYY-MM-DD (aritmética segura sin milisegundos)
 */
export function addDays(dateStr, n) {
  const date = parseLocalDate(dateStr)
  date.setDate(date.getDate() + n)
  return toLocalDateString(date)
}

/**
 * Calcula la diferencia en días entre dos fechas YYYY-MM-DD
 * Usa Math.round para manejar casos edge
 */
export function daysBetween(dateStr1, dateStr2) {
  const d1 = parseLocalDate(dateStr1)
  const d2 = parseLocalDate(dateStr2)
  const diffTime = d2 - d1
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Verifica si una fecha es hoy
 */
export function isToday(dateStr) {
  return toLocalDateString(new Date()) === dateStr
}

/**
 * Verifica si una fecha es futura (fecha > hoy)
 */
export function isFuture(dateStr) {
  const today = toLocalDateString(new Date())
  // Comparar strings YYYY-MM-DD (localeCompare o <, >)
  return dateStr > today
}

/**
 * Compara dos fechas YYYY-MM-DD
 * Retorna: -1 si date1 < date2, 0 si igual, 1 si date1 > date2
 */
export function compareDates(dateStr1, dateStr2) {
  if (dateStr1 < dateStr2) return -1
  if (dateStr1 > dateStr2) return 1
  return 0
}

/**
 * Obtiene el rango de una semana (lunes a domingo) desde una fecha
 */
export function getWeekRange(dateStr) {
  const date = parseLocalDate(dateStr)
  const dayOfWeek = getDayOfWeek(dateStr)
  const monday = addDays(dateStr, -(dayOfWeek - 1))
  const sunday = addDays(dateStr, (7 - dayOfWeek))
  return { start: monday, end: sunday }
}

/**
 * Obtiene el rango de un mes (primer y último día)
 */
export function getMonthRange(dateStr) {
  const date = parseLocalDate(dateStr)
  const firstDay = toLocalDateString(new Date(date.getFullYear(), date.getMonth(), 1))
  const lastDay = toLocalDateString(new Date(date.getFullYear(), date.getMonth() + 1, 0))
  return { start: firstDay, end: lastDay }
}

/**
 * Obtiene la fecha de hoy en YYYY-MM-DD
 */
export function getTodayDate() {
  return toLocalDateString(new Date())
}

/**
 * Obtiene el lunes de la semana actual
 */
export function getMondayOfCurrentWeek() {
  const today = getTodayDate()
  const dayOfWeek = getDayOfWeek(today)
  return addDays(today, -(dayOfWeek - 1))
}
