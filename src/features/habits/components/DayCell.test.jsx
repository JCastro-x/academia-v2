import { describe, it, expect } from 'vitest'
import { getEstado, isDayApplicable, getProgramacionVigente } from '../api.js'

describe('DayCell Logic Tests - Oct 9, 2026 (Friday)', () => {
  const mockHabit = {
    id: 'habit-1',
    nombre: 'Test Habit',
    momento_dia: 'manana',
    archivado: false,
  }

  const mockProgramacion = {
    id: 'prog-1',
    habit_id: 'habit-1',
    tipo: 'dias_fijos',
    dias_semana: [1, 2, 3, 4, 5],
    permitir_finde_plus: false,
    tolerar_rojo_aislado: false,
    vigente_desde: '2026-10-05', // Lunes de la semana
  }

  const mockConfig = {
    ventana_edicion_dias: 7,
  }

  it('getProgramacionVigente devuelve programación para lunes 5 de oct', () => {
    const prog = getProgramacionVigente(mockHabit, '2026-10-05', [mockProgramacion])
    expect(prog).not.toBeNull()
    expect(prog.id).toBe('prog-1')
    expect(prog.vigente_desde).toBe('2026-10-05')
  })

  it('isDayApplicable devuelve true para lunes 5 (día programado)', () => {
    const applicable = isDayApplicable(mockHabit, '2026-10-05', [mockProgramacion], [])
    expect(applicable).toBe(true)
  })

  it('isDayApplicable devuelve false para sábado 10 (no programado)', () => {
    const applicable = isDayApplicable(mockHabit, '2026-10-10', [mockProgramacion], [])
    expect(applicable).toBe(false)
  })

  it('isDayApplicable devuelve false para domingo 11 (no programado)', () => {
    const applicable = isDayApplicable(mockHabit, '2026-10-11', [mockProgramacion], [])
    expect(applicable).toBe(false)
  })

  it('getEstado para hoy (vie 9) sin log devuelve pendiente', () => {
    const estado = getEstado(mockHabit, '2026-10-09', [], [mockProgramacion], [], mockConfig)
    expect(estado).toBe('pendiente')
  })

  it('getEstado para mañana (sáb 10) devuelve futuro', () => {
    const estado = getEstado(mockHabit, '2026-10-10', [], [mockProgramacion], [], mockConfig)
    expect(estado).toBe('futuro')
  })

  it('getEstado para hace 8 días (dom 1) devuelve sin_registro (fuera de ventana)', () => {
    const estado = getEstado(mockHabit, '2026-10-01', [], [mockProgramacion], [], mockConfig)
    expect(estado).toBe('sin_registro')
  })

  it('getEstado con log cumplido devuelve cumplido', () => {
    const logs = [{ habit_id: 'habit-1', fecha: '2026-10-09', estado: 'cumplido' }]
    const estado = getEstado(mockHabit, '2026-10-09', logs, [mockProgramacion], [], mockConfig)
    expect(estado).toBe('cumplido')
  })

  it('getEstado con log fallado devuelve fallado', () => {
    const logs = [{ habit_id: 'habit-1', fecha: '2026-10-09', estado: 'fallado' }]
    const estado = getEstado(mockHabit, '2026-10-09', logs, [mockProgramacion], [], mockConfig)
    expect(estado).toBe('fallado')
  })

  it('getEstado con log parcial devuelve parcial', () => {
    const logs = [{ habit_id: 'habit-1', fecha: '2026-10-09', estado: 'parcial' }]
    const estado = getEstado(mockHabit, '2026-10-09', logs, [mockProgramacion], [], mockConfig)
    expect(estado).toBe('parcial')
  })
})
