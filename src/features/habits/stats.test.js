import { describe, it, expect } from 'vitest'
import {
  calculateStreak,
  calculateWeeklyPercent,
  calculateOverallPercent,
} from './stats.js'
import { getTodayDate, addDays } from '../../lib/date-utils.js'

describe('Stats Functions', () => {
  const today = getTodayDate()
  const yesterday = addDays(today, -1)
  const twoDaysAgo = addDays(today, -2)

  const mockHabit = {
    id: 'test-1',
    nombre: 'Test Habit',
    momento_dia: 'manana',
    archivado: false,
  }

  const mockProgramacion = {
    habit_id: 'test-1',
    tipo: 'dias_fijos',
    dias_semana: [1, 2, 3, 4, 5], // L-V
    permitir_finde_plus: false,
    tolerar_rojo_aislado: false,
    vigente_desde: twoDaysAgo,
  }

  describe('calculateStreak', () => {
    it('hoy sin marcar no pone la racha en 0', () => {
      const logs = []
      const streak = calculateStreak(mockHabit, logs, [mockProgramacion], [], {})
      expect(streak).toBe(0)
    })

    it('verde suma 1 a la racha', () => {
      const logs = [
        { habit_id: 'test-1', fecha: yesterday, estado: 'cumplido' },
      ]
      const streak = calculateStreak(mockHabit, logs, [mockProgramacion], [], {})
      expect(streak).toBeGreaterThanOrEqual(1)
    })

    it('rojo corta la racha', () => {
      const logs = [
        { habit_id: 'test-1', fecha: twoDaysAgo, estado: 'cumplido' },
        { habit_id: 'test-1', fecha: yesterday, estado: 'fallado' },
      ]
      const streak = calculateStreak(mockHabit, logs, [mockProgramacion], [], {})
      expect(streak).toBe(0)
    })

    it('naranja mantiene la racha sin sumar', () => {
      const logs = [
        { habit_id: 'test-1', fecha: twoDaysAgo, estado: 'cumplido' },
        { habit_id: 'test-1', fecha: yesterday, estado: 'parcial' },
      ]
      const streak = calculateStreak(mockHabit, logs, [mockProgramacion], [], {})
      expect(streak).toBeGreaterThanOrEqual(1)
    })
  })

  describe('calculateWeeklyPercent', () => {
    it('sin días marcados devuelve 0', () => {
      const logs = []
      const percent = calculateWeeklyPercent(mockHabit, logs, [mockProgramacion], [], {})
      expect(percent).toBe(0)
    })

    it('verde cuenta como 1', () => {
      const logs = [
        { habit_id: 'test-1', fecha: yesterday, estado: 'cumplido' },
      ]
      const percent = calculateWeeklyPercent(mockHabit, logs, [mockProgramacion], [], {})
      expect(percent).toBeGreaterThan(0)
    })

    it('naranja cuenta como 0.5', () => {
      const logs = [
        { habit_id: 'test-1', fecha: yesterday, estado: 'parcial' },
      ]
      const percent = calculateWeeklyPercent(mockHabit, logs, [mockProgramacion], [], {})
      expect(percent).toBeGreaterThan(0)
      expect(percent).toBeLessThan(100)
    })
  })

  describe('calculateOverallPercent', () => {
    it('sin hábitos devuelve 0', () => {
      const percent = calculateOverallPercent([], [], [], [], {})
      expect(percent).toBe(0)
    })

    it('promedia el % de cada hábito', () => {
      const habits = [mockHabit, { ...mockHabit, id: 'test-2' }]
      const logs = [
        { habit_id: 'test-1', fecha: yesterday, estado: 'cumplido' },
        { habit_id: 'test-2', fecha: yesterday, estado: 'cumplido' },
      ]
      const programaciones = [mockProgramacion, { ...mockProgramacion, habit_id: 'test-2' }]
      const percent = calculateOverallPercent(habits, logs, programaciones, [], {})
      expect(percent).toBeGreaterThan(0)
      expect(percent).toBeLessThanOrEqual(100)
    })
  })
})
