export type EventReminderType = 'three_days_before' | 'day_before' | 'three_hours_before'

interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  const parts: Record<string, number> = {}
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value)
  }

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  }
}

export function getZonedOffsetMs(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone)
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  return asUtc - date.getTime()
}

export function wallTimeToInstant(dateKey: string, timeKey: string, timeZone: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  const [hour, minute, second] = timeKey.split(':').map(Number)
  const naive = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0)
  const offset1 = getZonedOffsetMs(new Date(naive), timeZone)
  const offset2 = getZonedOffsetMs(new Date(naive - offset1), timeZone)
  return new Date(naive - offset2)
}

export function zonedDayKey(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone)
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

export function dayKeyDiff(a: string, b: string) {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / (1000 * 60 * 60 * 24))
}

export function resolveEventReminderType(
  startAt: string | null,
  now: Date,
  timeZone: string,
): EventReminderType | null {
  if (!startAt) return null

  const startDate = new Date(startAt)
  if (Number.isNaN(startDate.getTime())) return null

  const diffHours = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  const calendarDayDiff = dayKeyDiff(zonedDayKey(startDate, timeZone), zonedDayKey(now, timeZone))

  if (calendarDayDiff === 3 && diffHours > 0 && diffHours <= 72.033) return 'three_days_before'
  if (calendarDayDiff === 1 && diffHours > 3 && diffHours <= 48.033) return 'day_before'
  if (diffHours > 0 && diffHours <= 3.033) return 'three_hours_before'

  return null
}
