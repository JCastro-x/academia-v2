// Test rápido de la lógica tz (mismas funciones que index.ts, en JS plano)
function getZonedParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  })
  const parts = {}
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value)
  }
  return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour, minute: parts.minute, second: parts.second }
}
function getZonedOffsetMs(date, timeZone) {
  const p = getZonedParts(date, timeZone)
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - date.getTime()
}
function wallTimeToInstant(dateKey, timeKey, timeZone) {
  const [y, mo, d] = dateKey.split('-').map(Number)
  const [h, mi, s] = timeKey.split(':').map(Number)
  const naive = Date.UTC(y, mo - 1, d, h || 0, mi || 0, s || 0)
  const o1 = getZonedOffsetMs(new Date(naive), timeZone)
  const o2 = getZonedOffsetMs(new Date(naive - o1), timeZone)
  return new Date(naive - o2)
}
function zonedDayKey(date, timeZone) {
  const p = getZonedParts(date, timeZone)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}
function isInLocalWindow(date, timeZone, hour) {
  const p = getZonedParts(date, timeZone)
  return p.hour === hour && p.minute < 15
}

const tz = 'America/Guatemala'
let ok = true
function check(name, got, want) {
  const pass = got === want
  if (!pass) ok = false
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}: got=${got} want=${want}`)
}

// Caso 1: due 2026-09-01 sin due_time -> 23:59:59 local = 05:59:59 UTC del día siguiente
const due = wallTimeToInstant('2026-09-01', '23:59:59', tz)
check('due fin de dia -> instante UTC', due.toISOString(), '2026-09-02T05:59:59.000Z')

// Caso 2: due 2026-09-01 con due_time 14:30 -> 20:30 UTC
const due2 = wallTimeToInstant('2026-09-01', '14:30:00', tz)
check('due 14:30 local -> instante UTC', due2.toISOString(), '2026-09-01T20:30:00.000Z')

// Caso 3: "3 horas antes" de un due a fin de día local: 20:59:59-23:59:59 local = 02:59:59-05:59:59 UTC
const now3 = new Date('2026-09-02T03:00:00.000Z') // 21:00 local del 01-sep
const diffH = (due.getTime() - now3.getTime()) / 36e5
check('diffHours a las 21:00 local', diffH.toFixed(2), '3.00')
check('three_hours_before activo', diffH > 0 && diffH <= 3, true)

// Caso 4: day_before: ahora 21:00 local del 31-ago, due 01-sep
const due4 = wallTimeToInstant('2026-09-01', '23:59:59', tz)
const now4 = new Date('2026-08-31T20:00:00.000Z') // 14:00 local 31-ago
const [dy, dm, dd] = zonedDayKey(due4, tz).split('-').map(Number)
const [ny, nm, nd] = zonedDayKey(now4, tz).split('-').map(Number)
const cd = Math.round((Date.UTC(dy, dm - 1, dd) - Date.UTC(ny, nm - 1, nd)) / 864e5)
check('calendarDayDiff day_before', cd, 1)

// Caso 5: ventana de resumen: 13:05 UTC = 07:05 local -> morning activo
check('07:05 local morning window', isInLocalWindow(new Date('2026-09-01T13:05:00.000Z'), tz, 7), true)
check('07:20 local morning window', isInLocalWindow(new Date('2026-09-01T13:20:00.000Z'), tz, 7), false)
check('01:05 local morning window', isInLocalWindow(new Date('2026-09-01T07:05:00.000Z'), tz, 7), false)

// Caso 6: evening 19:05 local
check('19:05 local evening window', isInLocalWindow(new Date('2026-09-01T01:05:00.000Z'), tz, 19), true)

// Caso 7: dedup por día local (last_sent 2026-08-31T03:10Z = 21:10 local 30-ago; hoy local 31-ago)
check('dedup dia local distinto', zonedDayKey(new Date('2026-08-31T03:10:00.000Z'), tz) === zonedDayKey(new Date('2026-08-31T14:00:00.000Z'), tz), false)

console.log(ok ? '\nTODOS LOS TESTS OK' : '\nHAY FALLOS')
process.exit(ok ? 0 : 1)
