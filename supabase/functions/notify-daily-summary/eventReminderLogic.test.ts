import { describe, expect, it } from 'vitest'
import { resolveEventReminderType } from './eventReminderLogic.ts'

const timeZone = 'America/Guatemala'

function at(hoursFromNow: number) {
  return new Date(Date.UTC(2026, 8, 10, 18, 0, 0) + hoursFromNow * 60 * 60 * 1000)
}

describe('event reminder windows', () => {
  it('resolves the three-day reminder', () => {
    const now = at(0)
    const startAt = new Date(now.getTime() + 71 * 60 * 60 * 1000).toISOString()

    expect(resolveEventReminderType(startAt, now, timeZone)).toBe('three_days_before')
  })

  it('resolves the one-day reminder', () => {
    const now = at(24)
    const startAt = at(48).toISOString()

    expect(resolveEventReminderType(startAt, now, timeZone)).toBe('day_before')
  })

  it('resolves the three-hour reminder independently from the one-day reminder', () => {
    const eventStart = at(0)
    const oneDayNow = new Date(eventStart.getTime() - 24 * 60 * 60 * 1000)
    const threeHoursNow = new Date(eventStart.getTime() - 3 * 60 * 60 * 1000)

    expect(resolveEventReminderType(eventStart.toISOString(), oneDayNow, timeZone)).toBe('day_before')
    expect(resolveEventReminderType(eventStart.toISOString(), threeHoursNow, timeZone)).toBe('three_hours_before')
    expect(resolveEventReminderType(eventStart.toISOString(), threeHoursNow, timeZone)).not.toBe('day_before')
  })
})
