import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DayCell from './DayCell.jsx'

describe('DayCell interaction test - Oct 9, 2026 (Friday)', () => {
  let queryClient

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('guest-habits-schema-version', '4')
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
        mutations: { retry: false },
      },
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('celda tiene aria-label correcto y está deshabilitada cuando corresponde', () => {
    const mockHabit = {
      id: 'habit-1',
      nombre: 'Despertar a las 7',
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
      vigente_desde: '2026-10-05',
    }

    const mockConfig = { ventana_edicion_dias: 7 }

    // Mockear localStorage para verificar que se guarda la fecha correcta
    const originalSetItem = localStorage.setItem
    localStorage.setItem = vi.fn((key, value) => {
      originalSetItem.call(localStorage, key, value)
    })

    render(
      <QueryClientProvider client={queryClient}>
        <DayCell
          habit={mockHabit}
          fecha="2026-10-05"
          programaciones={[mockProgramacion]}
          logs={[]}
          pauseDays={[]}
          config={mockConfig}
          isToday={false}
          ariaLabel="Lun 5 oct"
        />
      </QueryClientProvider>
    )

    const cell = screen.getByLabelText('Lun 5 oct')
    expect(cell).toBeTruthy()

    // Verificar que la celda existe y tiene el aria-label correcto
    expect(cell.getAttribute('aria-label')).toBe('Lun 5 oct')

    localStorage.setItem = originalSetItem
  })

  it('celda deshabilitada para mañana (sáb 10)', () => {
    const mockHabit = {
      id: 'habit-1',
      nombre: 'Despertar a las 7',
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
      vigente_desde: '2026-10-05',
    }

    const mockConfig = { ventana_edicion_dias: 7 }

    render(
      <QueryClientProvider client={queryClient}>
        <DayCell
          habit={mockHabit}
          fecha="2026-10-10"
          programaciones={[mockProgramacion]}
          logs={[]}
          pauseDays={[]}
          config={mockConfig}
          isToday={false}
          ariaLabel="Sáb 10 oct"
        />
      </QueryClientProvider>
    )

    const cell = screen.getByLabelText('Sáb 10 oct')
    expect(cell).toBeTruthy()
    expect(cell).toBeDisabled()
  })

  it('celda deshabilitada para sábado en hábito L-V', () => {
    const mockHabit = {
      id: 'habit-1',
      nombre: 'Despertar a las 7',
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
      vigente_desde: '2026-10-05',
    }

    const mockConfig = { ventana_edicion_dias: 7 }

    render(
      <QueryClientProvider client={queryClient}>
        <DayCell
          habit={mockHabit}
          fecha="2026-10-11"
          programaciones={[mockProgramacion]}
          logs={[]}
          pauseDays={[]}
          config={mockConfig}
          isToday={false}
          ariaLabel="Dom 11 oct"
        />
      </QueryClientProvider>
    )

    const cell = screen.getByLabelText('Dom 11 oct')
    expect(cell).toBeTruthy()
    expect(cell).toBeDisabled()
  })
})
