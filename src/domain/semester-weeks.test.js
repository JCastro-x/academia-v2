import { describe, it, expect } from 'vitest'
import {
  getSemesterStats,
  getWeekStartDateForWeek,
  getWeekNumberForDate
} from './semester-weeks.js'

describe('semester-weeks', () => {
  describe('getSemesterStats', () => {
    it('calculates stats for a normal semester', () => {
      const stats = getSemesterStats('2024-01-01', '2024-04-29') // 18 weeks (119 days)
      expect(stats.totalWeeks).toBe(18)
      expect(stats.currentWeek).toBeGreaterThan(0)
      expect(stats.pct).toBeGreaterThanOrEqual(0)
      expect(stats.pct).toBeLessThanOrEqual(100)
    })

    it('handles null dates', () => {
      const stats = getSemesterStats(null, null)
      expect(stats.totalWeeks).toBeNull()
      expect(stats.currentWeek).toBeNull()
      expect(stats.pct).toBeNull()
      expect(stats.start).toBeNull()
      expect(stats.end).toBeNull()
    })

    it('handles start > end (invalid semester)', () => {
      const stats = getSemesterStats('2024-04-29', '2024-01-01')
      expect(stats.totalWeeks).toBeNull()
      expect(stats.currentWeek).toBeNull()
      expect(stats.pct).toBeNull()
    })

    it('handles single day semester', () => {
      const stats = getSemesterStats('2024-01-01', '2024-01-01')
      expect(stats.totalWeeks).toBe(1)
      expect(stats.currentWeek).toBe(1)
    })

    it('clamps currentWeek to valid range', () => {
      const stats = getSemesterStats('2024-01-01', '2024-01-07') // 1 week
      expect(stats.totalWeeks).toBe(1)
      expect(stats.currentWeek).toBe(1)
    })
  })

  describe('getWeekStartDateForWeek', () => {
    it('returns Monday of week 1 for semester starting on Monday', () => {
      const date = getWeekStartDateForWeek('2024-01-01', 1) // Monday
      expect(date).not.toBeNull()
      expect(date.getDay()).toBe(1) // Monday
      expect(formatDate(date)).toBe('2024-01-01')
    })

    it('returns Monday of week 1 for semester starting on Wednesday', () => {
      const date = getWeekStartDateForWeek('2024-01-03', 1) // Wednesday
      expect(date).not.toBeNull()
      expect(date.getDay()).toBe(1) // Monday
      expect(formatDate(date)).toBe('2024-01-01')
    })

    it('returns Monday of week 2', () => {
      const date = getWeekStartDateForWeek('2024-01-01', 2)
      expect(date).not.toBeNull()
      expect(date.getDay()).toBe(1) // Monday
      expect(formatDate(date)).toBe('2024-01-08')
    })

    it('handles invalid week number (< 1)', () => {
      const date = getWeekStartDateForWeek('2024-01-01', 0)
      expect(date).toBeNull()
    })

    it('handles null start date', () => {
      const date = getWeekStartDateForWeek(null, 1)
      expect(date).toBeNull()
    })
  })

  describe('getWeekNumberForDate', () => {
    it('returns week 1 for date in first week', () => {
      const week = getWeekNumberForDate('2024-01-01', '2024-01-03')
      expect(week).toBe(1)
    })

    it('returns week 2 for date in second week', () => {
      const week = getWeekNumberForDate('2024-01-01', '2024-01-10')
      expect(week).toBe(2)
    })

    it('handles date before semester start', () => {
      const week = getWeekNumberForDate('2024-01-01', '2023-12-31')
      expect(week).toBe(1) // Clamped to minimum
    })

    it('handles null start date', () => {
      const week = getWeekNumberForDate(null, '2024-01-10')
      expect(week).toBeNull()
    })

    it('handles null target date', () => {
      const week = getWeekNumberForDate('2024-01-01', null)
      expect(week).toBeNull()
    })
  })
})

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
