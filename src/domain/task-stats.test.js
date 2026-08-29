import { describe, it, expect } from 'vitest'
import {
  clamp,
  parseDate,
  formatDate,
  todayStr,
  diffDays,
  truncateToDate,
  countWorkDays,
  baseTimeStats,
  statusFromProgress,
  computeCantidadStats,
  computeChecklistStats,
  getTaskStats,
  daysRemainingLabel,
} from './task-stats.js'

describe('task-stats', () => {
  describe('clamp', () => {
    it('should clamp values between min and max', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
      expect(clamp(50, 0, 100)).toBe(50)
    })
  })

  describe('parseDate', () => {
    it('should parse YYYY-MM-DD strings', () => {
      const date = parseDate('2024-01-15')
      expect(date).toBeInstanceOf(Date)
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0) // January
      expect(date.getDate()).toBe(15)
    })

    it('should handle Date objects', () => {
      const input = new Date(2024, 0, 15)
      const result = parseDate(input)
      expect(result).toBeInstanceOf(Date)
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(0)
      expect(result.getDate()).toBe(15)
    })

    it('should return null for invalid strings', () => {
      expect(parseDate('invalid')).toBeNull()
      expect(parseDate('')).toBeNull()
      expect(parseDate(null)).toBeNull()
    })
  })

  describe('formatDate', () => {
    it('should format Date to YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15) // January 15, 2024
      expect(formatDate(date)).toBe('2024-01-15')
    })

    it('should pad months and days with zeros', () => {
      const date = new Date(2024, 0, 5) // January 5, 2024
      expect(formatDate(date)).toBe('2024-01-05')
    })
  })

  describe('todayStr', () => {
    it('should return today in YYYY-MM-DD format', () => {
      const today = todayStr()
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      
      const parsed = parseDate(today)
      expect(parsed).not.toBeNull()
    })
  })

  describe('diffDays', () => {
    it('should calculate difference in days', () => {
      expect(diffDays('2024-01-01', '2024-01-02')).toBe(1)
      expect(diffDays('2024-01-01', '2024-01-11')).toBe(10)
      expect(diffDays('2024-01-10', '2024-01-01')).toBe(-9)
    })

    it('should handle same day', () => {
      expect(diffDays('2024-01-01', '2024-01-01')).toBe(0)
    })

    it('should handle invalid dates', () => {
      expect(diffDays('invalid', '2024-01-01')).toBe(0)
      expect(diffDays('2024-01-01', null)).toBe(0)
    })
  })

  describe('truncateToDate', () => {
    it('should truncate timestamp to YYYY-MM-DD', () => {
      const timestamp = '2024-01-15T14:30:00.000Z'
      expect(truncateToDate(timestamp)).toBe('2024-01-15')
    })

    it('should handle null/undefined', () => {
      const result = truncateToDate(null)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/) // Should return today
    })

    it('should handle empty string', () => {
      const result = truncateToDate('')
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/) // Should return today
    })
  })

  describe('countWorkDays', () => {
    it('should count work days using Academia v2 convention (1=Monday...7=Sunday)', () => {
      // Monday Jan 1, 2024 to Friday Jan 5, 2024 = 5 weekdays
      const count = countWorkDays('2024-01-01', '2024-01-05', [1, 2, 3, 4, 5])
      expect(count).toBe(5)
    })

    it('should correctly map Sunday (JS 0) to Academia v2 (7)', () => {
      // Sunday Jan 7, 2024 is included when work_days includes 7
      const count = countWorkDays('2024-01-07', '2024-01-07', [7])
      expect(count).toBe(1)
    })

    it('should correctly map Monday (JS 1) to Academia v2 (1)', () => {
      // Monday Jan 1, 2024 is included when work_days includes 1
      const count = countWorkDays('2024-01-01', '2024-01-01', [1])
      expect(count).toBe(1)
    })

    it('should handle empty work_days array', () => {
      const count = countWorkDays('2024-01-01', '2024-01-05', [])
      expect(count).toBe(0)
    })

    it('should handle null work_days', () => {
      const count = countWorkDays('2024-01-01', '2024-01-05', null)
      expect(count).toBe(0)
    })

    it('should return minimum 1 for valid date range with matching work days', () => {
      const count = countWorkDays('2024-01-01', '2024-01-01', [1])
      expect(count).toBe(1)
    })

    it('should count only specified work days', () => {
      // Monday + Wednesday only from Jan 1-5, 2024
      const count = countWorkDays('2024-01-01', '2024-01-05', [1, 3])
      expect(count).toBe(2) // Monday Jan 1 + Wednesday Jan 3
    })
  })

  describe('baseTimeStats', () => {
    it('should calculate time statistics', () => {
      const stats = baseTimeStats('2024-01-01', '2024-01-10')
      expect(stats.daysTotal).toBe(10)
      expect(stats.timePercent).toBeGreaterThanOrEqual(0)
      expect(stats.timePercent).toBeLessThanOrEqual(100)
    })

    it('should handle not started tasks', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 10)
      const futureStr = formatDate(futureDate)
      
      const stats = baseTimeStats(futureStr, futureStr)
      expect(stats.notStarted).toBe(true)
      expect(stats.isOverdue).toBe(false)
    })

    it('should handle overdue tasks', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 10)
      const pastStr = formatDate(pastDate)
      
      const stats = baseTimeStats(pastStr, pastStr)
      expect(stats.notStarted).toBe(false)
      expect(stats.isOverdue).toBe(true)
    })

    it('should handle invalid dates', () => {
      const stats = baseTimeStats(null, null)
      expect(stats.daysTotal).toBe(0)
      expect(stats.timePercent).toBe(0)
      expect(stats.notStarted).toBe(true)
      expect(stats.isOverdue).toBe(false)
    })
  })

  describe('statusFromProgress', () => {
    it('should return "done" for completed tasks', () => {
      const stats = { isDone: true, notStarted: false, isOverdue: false, daysRemainingDisplay: 5, remaining: 0 }
      expect(statusFromProgress(stats)).toBe('done')
    })

    it('should return "notstarted" for not started tasks', () => {
      const stats = { isDone: false, notStarted: true, isOverdue: false, daysRemainingDisplay: 10, remaining: 100 }
      expect(statusFromProgress(stats)).toBe('notstarted')
    })

    it('should return "overdue" for overdue tasks', () => {
      const stats = { isDone: false, notStarted: false, isOverdue: true, daysRemainingDisplay: -5, remaining: 50 }
      expect(statusFromProgress(stats)).toBe('overdue')
    })

    it('should return "critical" for tasks with 2 or fewer days remaining and progress remaining', () => {
      const stats = { 
        isDone: false, 
        notStarted: false, 
        isOverdue: false, 
        daysRemainingDisplay: 2, 
        remaining: 10,
        ritmoActual: 2,
        ritmoOriginal: 2,
        diasDeAtraso: 0
      }
      expect(statusFromProgress(stats)).toBe('critical')
    })

    it('should return "notstarted" for tasks with no progress and more than 2 days remaining', () => {
      const stats = { 
        isDone: false, 
        notStarted: false, 
        isOverdue: false, 
        daysRemainingDisplay: 10, 
        remaining: 100,
        ritmoActual: 0,
        ritmoOriginal: 10,
        diasDeAtraso: 0
      }
      expect(statusFromProgress(stats)).toBe('notstarted')
    })

    it('should return "ongreen" for tasks on schedule', () => {
      const stats = { 
        isDone: false, 
        notStarted: false, 
        isOverdue: false, 
        daysRemainingDisplay: 10, 
        remaining: 50,
        ritmoActual: 5,
        ritmoOriginal: 5,
        ritmoNecesario: 5,
        diasDeAtraso: 0,
        exigencia: 1
      }
      expect(statusFromProgress(stats)).toBe('ongreen')
    })

    it('should return "onyellow" for tasks slightly behind', () => {
      const stats = { 
        isDone: false, 
        notStarted: false, 
        isOverdue: false, 
        daysRemainingDisplay: 10, 
        remaining: 60,
        ritmoActual: 4,
        ritmoOriginal: 5,
        ritmoNecesario: 6,
        diasDeAtraso: -0.5,
        exigencia: 1.2
      }
      expect(statusFromProgress(stats)).toBe('onyellow')
    })

    it('should return "onattention" for tasks significantly behind', () => {
      const stats = { 
        isDone: false, 
        notStarted: false, 
        isOverdue: false, 
        daysRemainingDisplay: 10, 
        remaining: 80,
        ritmoActual: 2,
        ritmoOriginal: 5,
        ritmoNecesario: 8,
        diasDeAtraso: -1.5,
        exigencia: 1.6
      }
      expect(statusFromProgress(stats)).toBe('onattention')
    })
  })

  describe('computeCantidadStats', () => {
    it('should calculate cantidad task statistics', () => {
      const task = {
        tipo: 'cantidad',
        total_units: 100,
        work_days: [1, 2, 3, 4, 5],
        log: { '2024-01-01': 10, '2024-01-02': 15 },
        created_at: '2024-01-01T00:00:00.000Z',
        due: '2024-01-10T00:00:00.000Z'
      }
      
      const stats = computeCantidadStats(task)
      
      expect(stats.type).toBe('cantidad')
      expect(stats.totalUnits).toBe(100)
      expect(stats.totalDone).toBe(25)
      expect(stats.remaining).toBe(75)
      expect(stats.progressPercent).toBe(25)
      expect(stats.doneToday).toBeGreaterThanOrEqual(0)
    })

    it('should handle null total_units defensively', () => {
      const task = {
        tipo: 'cantidad',
        total_units: null,
        work_days: null,
        log: {},
        created_at: '2024-01-01T00:00:00.000Z',
        due: '2024-01-10T00:00:00.000Z'
      }
      
      const stats = computeCantidadStats(task)
      
      expect(stats.type).toBe('cantidad')
      expect(stats.status).toBe('notstarted')
      expect(stats.totalUnits).toBe(0)
      expect(stats.totalDone).toBe(0)
      expect(stats.progressPercent).toBe(0)
      expect(stats.metaHoy).toBe(0)
      expect(stats.ritmoActual).toBe(0)
      expect(stats.ritmoNecesario).toBe(0)
    })

    it('should handle null work_days defensively', () => {
      const task = {
        tipo: 'cantidad',
        total_units: 100,
        work_days: null,
        log: { '2024-01-01': 20 },
        created_at: '2024-01-01T00:00:00.000Z',
        due: '2024-01-10T00:00:00.000Z'
      }
      
      const stats = computeCantidadStats(task)
      
      expect(stats.type).toBe('cantidad')
      expect(stats.totalUnits).toBe(100)
      expect(stats.totalDone).toBe(20)
      // Should use default work_days [1,2,3,4,5]
      expect(stats.daysTotal).toBeGreaterThan(0)
    })

    it('should handle zero total_units', () => {
      const task = {
        tipo: 'cantidad',
        total_units: 0,
        work_days: [1, 2, 3, 4, 5],
        log: {},
        created_at: '2024-01-01T00:00:00.000Z',
        due: '2024-01-10T00:00:00.000Z'
      }
      
      const stats = computeCantidadStats(task)
      
      expect(stats.type).toBe('cantidad')
      expect(stats.status).toBe('notstarted')
      expect(stats.totalUnits).toBe(0)
      expect(stats.progressPercent).toBe(0)
    })

    it('should mark as done when total is reached', () => {
      const task = {
        tipo: 'cantidad',
        total_units: 100,
        work_days: [1, 2, 3, 4, 5],
        log: { '2024-01-01': 50, '2024-01-02': 50 },
        created_at: '2024-01-01T00:00:00.000Z',
        due: '2024-01-10T00:00:00.000Z'
      }
      
      const stats = computeCantidadStats(task)
      
      expect(stats.isDone).toBe(true)
      expect(stats.status).toBe('done')
      expect(stats.remaining).toBe(0)
    })

    it('should truncate timestamps correctly for date calculations', () => {
      const task = {
        tipo: 'cantidad',
        total_units: 100,
        work_days: [1, 2, 3, 4, 5],
        log: {},
        created_at: '2024-01-01T14:30:00.000Z', // Time component should be ignored
        due: '2024-01-10T23:59:59.000Z' // Time component should be ignored
      }

      const stats = computeCantidadStats(task)

      // Should calculate 10 days total regardless of time components
      expect(stats.daysTotal).toBe(8) // 8 work days (Mon-Fri for 2 weeks)
    })

    it('calcula metaHoyRestante cuando no hay avance hoy', () => {
      const today = todayStr()
      const task = {
        tipo: 'cantidad',
        total_units: 100,
        work_days: [1, 2, 3, 4, 5],
        log: {},
        created_at: `${today}T00:00:00.000Z`,
        due: `${today}T23:59:59.000Z`,
      }

      const stats = computeCantidadStats(task)

      expect(stats.doneToday).toBe(0)
      expect(stats.metaHoyRestante).toBe(stats.necesitasHoy)
      expect(stats.metaHoyRestante).toBeGreaterThan(0)
    })

    it('devuelve cero cuando la meta de hoy ya fue completada', () => {
      const today = todayStr()
      const task = {
        tipo: 'cantidad',
        total_units: 100,
        work_days: [1, 2, 3, 4, 5],
        log: {},
        created_at: `${today}T00:00:00.000Z`,
        due: `${today}T23:59:59.000Z`,
      }

      const initialStats = computeCantidadStats(task)
      const completedTask = {
        ...task,
        log: { [today]: initialStats.necesitasHoy },
      }
      const stats = computeCantidadStats(completedTask)

      expect(stats.doneToday).toBe(initialStats.necesitasHoy)
      expect(stats.metaHoyRestante).toBe(0)
    })

    it('nunca devuelve una metaHoyRestante negativa', () => {
      const today = todayStr()
      const task = {
        tipo: 'cantidad',
        total_units: 100,
        work_days: [1, 2, 3, 4, 5],
        log: {},
        created_at: `${today}T00:00:00.000Z`,
        due: `${today}T23:59:59.000Z`,
      }

      const initialStats = computeCantidadStats(task)
      const completedTask = {
        ...task,
        log: { [today]: initialStats.necesitasHoy + 10 },
      }
      const stats = computeCantidadStats(completedTask)

      expect(stats.metaHoyRestante).toBe(0)
      expect(stats.metaHoyRestante).toBeGreaterThanOrEqual(0)
    })

    it('resta el avance de hoy de la meta necesaria', () => {
      const today = todayStr()
      const task = {
        tipo: 'cantidad',
        total_units: 100,
        work_days: [1, 2, 3, 4, 5],
        log: {},
        created_at: `${today}T00:00:00.000Z`,
        due: `${today}T23:59:59.000Z`,
      }

      const initialStats = computeCantidadStats(task)
      const doneToday = Math.max(0, initialStats.necesitasHoy - 3)
      const partialTask = {
        ...task,
        log: { [today]: doneToday },
      }
      const stats = computeCantidadStats(partialTask)

      expect(stats.metaHoyRestante).toBe(
        Math.max(0, stats.necesitasHoy - stats.doneToday)
      )
    })
  })

  describe('computeChecklistStats', () => {
    it('should calculate checklist task statistics', () => {
      const task = {
        tipo: 'checklist',
        subtasks: [
          { done: true },
          { done: true },
          { done: false },
          { done: false },
          { done: false }
        ],
        work_days: [1, 2, 3, 4, 5],
        created_at: '2024-01-01T00:00:00.000Z',
        due: '2024-01-10T00:00:00.000Z'
      }
      
      const stats = computeChecklistStats(task)
      
      expect(stats.type).toBe('checklist')
      expect(stats.totalSub).toBe(5)
      expect(stats.doneSub).toBe(2)
      expect(stats.progressPercent).toBe(40)
      expect(stats.remaining).toBe(3)
    })

    it('should handle empty subtasks', () => {
      const task = {
        tipo: 'checklist',
        subtasks: [],
        work_days: [1, 2, 3, 4, 5],
        created_at: '2024-01-01T00:00:00.000Z',
        due: '2024-01-10T00:00:00.000Z'
      }
      
      const stats = computeChecklistStats(task)
      
      expect(stats.totalSub).toBe(0)
      expect(stats.doneSub).toBe(0)
      expect(stats.progressPercent).toBe(0)
    })

    it('should handle null subtasks', () => {
      const task = {
        tipo: 'checklist',
        subtasks: null,
        work_days: [1, 2, 3, 4, 5],
        created_at: '2024-01-01T00:00:00.000Z',
        due: '2024-01-10T00:00:00.000Z'
      }
      
      const stats = computeChecklistStats(task)
      
      expect(stats.totalSub).toBe(0)
      expect(stats.doneSub).toBe(0)
    })

    it('should mark as done when all subtasks complete', () => {
      const task = {
        tipo: 'checklist',
        subtasks: [
          { done: true },
          { done: true },
          { done: true }
        ],
        work_days: [1, 2, 3, 4, 5],
        created_at: '2024-01-01T00:00:00.000Z',
        due: '2024-01-10T00:00:00.000Z'
      }
      
      const stats = computeChecklistStats(task)
      
      expect(stats.isDone).toBe(true)
      expect(stats.status).toBe('done')
      expect(stats.remaining).toBe(0)
    })

    it('should handle partial subtask completion', () => {
      const task = {
        tipo: 'checklist',
        subtasks: [
          { done: true },
          { done: false },
          { done: true },
          { done: false }
        ],
        work_days: [1, 2, 3, 4, 5],
        created_at: '2024-01-01T00:00:00.000Z',
        due: '2024-01-10T00:00:00.000Z'
      }
      
      const stats = computeChecklistStats(task)
      
      expect(stats.totalSub).toBe(4)
      expect(stats.doneSub).toBe(2)
      expect(stats.progressPercent).toBe(50)
      expect(stats.isDone).toBe(false)
    })
  })

  describe('getTaskStats', () => {
    it('should dispatch to computeCantidadStats for cantidad tasks', () => {
      const task = {
        tipo: 'cantidad',
        total_units: 100,
        work_days: [1, 2, 3, 4, 5],
        log: { '2024-01-01': 20 },
        created_at: '2024-01-01T00:00:00.000Z',
        due: '2024-01-10T00:00:00.000Z'
      }
      
      const stats = getTaskStats(task)
      
      expect(stats.type).toBe('cantidad')
      expect(stats.totalUnits).toBe(100)
    })

    it('should dispatch to computeChecklistStats for checklist tasks', () => {
      const task = {
        tipo: 'checklist',
        subtasks: [{ done: true }, { done: false }],
        work_days: [1, 2, 3, 4, 5],
        created_at: '2024-01-01T00:00:00.000Z',
        due: '2024-01-10T00:00:00.000Z'
      }
      
      const stats = getTaskStats(task)
      
      expect(stats.type).toBe('checklist')
      expect(stats.totalSub).toBe(2)
    })

    it('should default to checklist for unknown types', () => {
      const task = {
        tipo: 'unknown',
        subtasks: [{ done: true }],
        work_days: [1, 2, 3, 4, 5],
        created_at: '2024-01-01T00:00:00.000Z',
        due: '2024-01-10T00:00:00.000Z'
      }
      
      const stats = getTaskStats(task)
      
      expect(stats.type).toBe('checklist')
    })
  })

  describe('daysRemainingLabel', () => {
    it('should return "Completada" for done tasks', () => {
      const stats = { isDone: true, notStarted: false, isOverdue: false, daysRemainingDisplay: 0 }
      expect(daysRemainingLabel(stats)).toBe('Completada')
    })

    it('should return "Aún no inicia" for not started tasks', () => {
      const stats = { isDone: false, notStarted: true, isOverdue: false, daysRemainingDisplay: 10 }
      expect(daysRemainingLabel(stats)).toBe('Aún no inicia')
    })

    it('should return "Venció" for overdue tasks', () => {
      const stats = { isDone: false, notStarted: false, isOverdue: true, daysRemainingDisplay: -5 }
      expect(daysRemainingLabel(stats)).toBe('Venció')
    })

    it('should return "Vence hoy" for tasks due today', () => {
      const stats = { isDone: false, notStarted: false, isOverdue: false, daysRemainingDisplay: 0 }
      expect(daysRemainingLabel(stats)).toBe('Vence hoy')
    })

    it('should return "X días restantes" for active tasks', () => {
      const stats = { isDone: false, notStarted: false, isOverdue: false, daysRemainingDisplay: 5 }
      expect(daysRemainingLabel(stats)).toBe('5 días restantes')
    })

    it('should use singular "día" for 1 day', () => {
      const stats = { isDone: false, notStarted: false, isOverdue: false, daysRemainingDisplay: 1 }
      expect(daysRemainingLabel(stats)).toBe('1 día restantes')
    })
  })
})
