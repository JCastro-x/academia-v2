/**
 * Pure functions for semester week calculations.
 * No React, no Supabase, just math and date utilities.
 * Ported from Ritmo (js/semesterUtils.js)
 * Adapted to Academia v2 data model and conventions.
 */

import { parseDate, formatDate, todayStr, diffDays, clamp } from './task-stats.js'

/**
 * Calculate semester statistics based on start and end dates.
 * @param {string} startStr - Start date in YYYY-MM-DD format
 * @param {string} endStr - End date in YYYY-MM-DD format
 * @returns {Object} Semester statistics: { totalWeeks, currentWeek, pct, start, end, today }
 *          Returns null values if dates are invalid or start > end
 */
export function getSemesterStats(startStr, endStr) {
  const start = parseDate(startStr)
  const end = parseDate(endStr)
  const today = parseDate(todayStr())

  // Handle invalid dates or start > end
  if (!start || !end || start > end) {
    return {
      totalWeeks: null,
      currentWeek: null,
      pct: null,
      start: null,
      end: null,
      today: null
    }
  }

  const totalWeeks = Math.max(1, Math.ceil((diffDays(start, end) + 1) / 7))
  const rawWeek = Math.floor(diffDays(start, today) / 7) + 1
  const currentWeek = clamp(rawWeek, 1, totalWeeks)
  const pct = clamp(((diffDays(start, today) + 1) / (diffDays(start, end) + 1)) * 100, 0, 100)

  return {
    totalWeeks,
    currentWeek,
    pct,
    start,
    end,
    today
  }
}

/**
 * Calculate the start date (Monday) for a given week number.
 * @param {string} startStr - Semester start date in YYYY-MM-DD format
 * @param {number} week - Week number (1-based)
 * @returns {Date|null} Start date of the week (Monday), or null if invalid
 */
export function getWeekStartDateForWeek(startStr, week) {
  const start = parseDate(startStr)
  if (!start || week < 1) return null

  const weekStart = new Date(start)
  const day = weekStart.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday

  // Adjust to Monday (day 1)
  weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1))

  // Add (week - 1) weeks
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7)

  return weekStart
}

/**
 * Get the week number for a given date within a semester.
 * @param {string} startStr - Semester start date in YYYY-MM-DD format
 * @param {string} dateStr - Date to calculate week number for (YYYY-MM-DD format)
 * @returns {number|null} Week number (1-based), or null if invalid
 */
export function getWeekNumberForDate(startStr, dateStr) {
  const start = parseDate(startStr)
  const targetDate = parseDate(dateStr)

  if (!start || !targetDate) return null

  const week1Start = getWeekStartDateForWeek(startStr, 1)
  if (!week1Start) return null

  const diffDaysCount = Math.floor((targetDate - week1Start) / 86400000)
  const weekNumber = Math.floor(diffDaysCount / 7) + 1

  // Clamp to valid range (minimum 1)
  return Math.max(1, weekNumber)
}
