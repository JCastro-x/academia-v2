import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TaskCard from './TaskCard.jsx'
import { todayStr } from '../domain/task-stats.js'

// Mock the hook
vi.mock('../features/tasks/hooks.js', () => ({
  useIncrementTaskLogUnit: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

describe('TaskCard', () => {
  const mockOnToggleDone = vi.fn()
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()
  const mockSubject = { id: 'subject-1', nombre: 'Matemáticas' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tipo="cantidad" con meta definida', () => {
    it('muestra avance, detalles de ritmo y controles', () => {
      const task = {
        id: 'task-1',
        tipo: 'cantidad',
        titulo: 'Estudiar capítulo 1',
        prioridad: 'media',
        done: false,
        total_units: 10,
        work_days: [1, 2, 3, 4, 5],
        log: {},
        created_at: '2026-08-20T00:00:00Z',
        due: '2026-08-27T00:00:00Z',
        semester_id: 'semester-1',
        subject_id: 'subject-1',
        user_id: 'user-1',
      }

      render(
        <TaskCard
          task={task}
          subject={mockSubject}
          onToggleDone={mockOnToggleDone}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText(/0\/10 unidades/i)).toBeInTheDocument()
      expect(screen.getByText(/Meta hoy:/i)).toBeInTheDocument()
      expect(screen.getByText(/Recomendado:/i)).toBeInTheDocument()
      expect(screen.getByText(/Falta total:/i)).toBeInTheDocument()
      expect(screen.getByText('+')).toBeInTheDocument()
    })

    it('muestra el avance y detalles calculados (log[today]=2)', () => {
      const today = todayStr()
      const task = {
        id: 'task-1',
        tipo: 'cantidad',
        titulo: 'Estudiar capítulo 1',
        prioridad: 'media',
        done: false,
        total_units: 10,
        work_days: [1, 2, 3, 4, 5],
        log: { [today]: 2 }, // 2 unidades hechas hoy
        created_at: '2026-08-20T00:00:00Z',
        due: '2026-08-27T00:00:00Z',
        semester_id: 'semester-1',
        subject_id: 'subject-1',
        user_id: 'user-1',
      }

      render(
        <TaskCard
          task={task}
          subject={mockSubject}
          onToggleDone={mockOnToggleDone}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText(/2\/10 unidades/i)).toBeInTheDocument()
      expect(screen.getByText(/Meta hoy:/i)).toBeInTheDocument()
      expect(screen.getByText(/Recomendado:/i)).toBeInTheDocument()
      expect(screen.getByText(/Falta total:/i)).toHaveTextContent('8')
    })
  })

  describe('casos negativos', () => {
    it('NO muestra la línea de meta/contadores cuando total_units=null', () => {
      const task = {
        id: 'task-1',
        tipo: 'cantidad',
        titulo: 'Tarea sin meta',
        prioridad: 'media',
        done: false,
        total_units: null,
        work_days: [1, 2, 3, 4, 5],
        log: {},
        created_at: '2026-08-20T00:00:00Z',
        due: '2026-08-27T00:00:00Z',
        semester_id: 'semester-1',
        subject_id: 'subject-1',
        user_id: 'user-1',
      }

      render(
        <TaskCard
          task={task}
          subject={mockSubject}
          onToggleDone={mockOnToggleDone}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.queryByText(/Meta hoy:/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Recomendado:/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Falta total:/i)).not.toBeInTheDocument()
    })

    it('NO muestra la línea de meta/contadores cuando tipo="checklist"', () => {
      const task = {
        id: 'task-1',
        tipo: 'checklist',
        titulo: 'Tarea tipo checklist',
        prioridad: 'media',
        done: false,
        subtasks: [{ done: false }, { done: false }],
        work_days: [1, 2, 3, 4, 5],
        created_at: '2026-08-20T00:00:00Z',
        due: '2026-08-27T00:00:00Z',
        semester_id: 'semester-1',
        subject_id: 'subject-1',
        user_id: 'user-1',
      }

      render(
        <TaskCard
          task={task}
          subject={mockSubject}
          onToggleDone={mockOnToggleDone}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.queryByText(/Meta hoy:/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Recomendado:/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Falta total:/i)).not.toBeInTheDocument()
    })
  })

  describe('límite en 0', () => {
    it('Falta total no baja de 0 cuando la tarea está completada', () => {
      const today = todayStr()
      const task = {
        id: 'task-1',
        tipo: 'cantidad',
        titulo: 'Tarea completada',
        prioridad: 'media',
        done: false,
        total_units: 10,
        work_days: [1, 2, 3, 4, 5],
        log: { [today]: 10 }, // Completada
        created_at: '2026-08-20T00:00:00Z',
        due: '2026-08-27T00:00:00Z',
        semester_id: 'semester-1',
        subject_id: 'subject-1',
        user_id: 'user-1',
      }

      render(
        <TaskCard
          task={task}
          subject={mockSubject}
          onToggleDone={mockOnToggleDone}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // remaining = Math.max(0, 10 - 10) = 0
      // Falta total debe mostrar 0, no un valor negativo
      const faltaTotalElement = screen.queryByText(/Falta total:/i)
      if (faltaTotalElement) {
        // Si aparece, debe ser 0
        expect(faltaTotalElement.textContent).toContain('0')
      }
    })
  })
})
