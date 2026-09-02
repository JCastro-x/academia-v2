import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act, screen } from '@testing-library/react'
import GlobalModalHost from './GlobalModalHost.jsx'
import { useUIStore } from '../stores/ui.store.js'

const mockUpdateTaskMutateAsync = vi.fn()

vi.mock('react-router-dom', () => ({
  useParams: () => ({ semesterId: 'semester-1' }),
  useNavigate: () => vi.fn(),
}))

vi.mock('../features/subjects/hooks.js', () => ({
  useSubjects: () => ({ data: [{ id: 'subject-1', nombre: 'Matemáticas' }] }),
  useCreateSubject: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateSubject: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('../features/semesters/hooks.js', () => ({
  useSemester: () => ({ data: { id: 'semester-1' } }),
  useUpdateSemester: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('../features/tasks/hooks.js', () => ({
  useCreateTask: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateTask: () => ({ mutateAsync: mockUpdateTaskMutateAsync, isPending: false }),
}))

describe('GlobalModalHost task editing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useUIStore.setState({
      isModalOpen: true,
      modalContent: 'task',
      modalPayload: {
        editingTask: {
          id: 'task-1',
          titulo: 'Tarea vieja',
          prioridad: 'media',
          subject_id: 'subject-1',
          due: '',
          tipo: 'cantidad',
          total_units: 10,
          work_days: [1, 2, 3, 4, 5],
          subtasks: [],
        },
      },
    })
    mockUpdateTaskMutateAsync.mockReset()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('solo guarda cambios al pulsar Guardar', async () => {
    const { unmount } = render(<GlobalModalHost />)

    const secondInput = screen.getByLabelText(/Título/i)
    fireEvent.change(secondInput, { target: { value: 'Tarea nueva' } })

    await act(async () => {
      vi.advanceTimersByTime(800)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(mockUpdateTaskMutateAsync).not.toHaveBeenCalled()
    unmount()

    useUIStore.setState({
      isModalOpen: true,
      modalContent: 'task',
      modalPayload: {
        editingTask: {
          id: 'task-1',
          titulo: 'Tarea vieja',
          prioridad: 'media',
          subject_id: 'subject-1',
          due: '',
          tipo: 'cantidad',
          total_units: 10,
          work_days: [1, 2, 3, 4, 5],
          subtasks: [],
        },
      },
    })
    render(<GlobalModalHost />)

    const input = screen.getByLabelText(/Título/i)
    fireEvent.change(input, { target: { value: 'Tarea nueva' } })

    await act(async () => {
      vi.advanceTimersByTime(800)
    })

    expect(mockUpdateTaskMutateAsync).not.toHaveBeenCalled()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    })

    expect(mockUpdateTaskMutateAsync).toHaveBeenCalledTimes(1)
    expect(mockUpdateTaskMutateAsync).toHaveBeenCalledWith({
      id: 'task-1',
      updates: expect.objectContaining({ titulo: 'Tarea nueva' }),
    })
  })
})
