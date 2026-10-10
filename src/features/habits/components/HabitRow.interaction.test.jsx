import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HabitRow from './HabitRow.jsx'
import { getDayOfWeek } from '../../../lib/date-utils.js'

describe('HabitRow interaction and structure tests', () => {
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

  const weekDays = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']

  it('la fila tiene 7 celdas (botones)', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <HabitRow
          habit={mockHabit}
          days={weekDays}
          programaciones={[mockProgramacion]}
          logs={[]}
          pauseDays={[]}
          config={{ ventana_edicion_dias: 7 }}
        />
      </QueryClientProvider>
    )

    expect(screen.getByText('Despertar a las 7')).toBeInTheDocument()

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(7)
  })

  it('cada celda tiene aria-label', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <HabitRow
          habit={mockHabit}
          days={weekDays}
          programaciones={[mockProgramacion]}
          logs={[]}
          pauseDays={[]}
          config={{ ventana_edicion_dias: 7 }}
        />
      </QueryClientProvider>
    )

    const buttons = screen.getAllByRole('button')
    buttons.forEach(btn => {
      expect(btn.getAttribute('aria-label')).toBeTruthy()
    })
  })

  it('la primera celda corresponde a 2026-10-05', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <HabitRow
          habit={mockHabit}
          days={weekDays}
          programaciones={[mockProgramacion]}
          logs={[]}
          pauseDays={[]}
          config={{ ventana_edicion_dias: 7 }}
        />
      </QueryClientProvider>
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons[0].getAttribute('aria-label')).toBeTruthy()
  })
})
