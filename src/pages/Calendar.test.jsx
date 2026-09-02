import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Calendar from './Calendar.jsx'

const eventId = 'event-42'
const event = {
  id: eventId,
  subject_id: null,
  semester_id: 'semester-1',
  nombre: 'Parcial de prueba',
  tipo: 'parcial',
  start_at: new Date().toISOString(),
  end_at: null,
  descripcion: 'Descripción del evento',
}

vi.mock('../features/events/hooks.js', () => ({
  useEventsByMonth: () => ({ data: [event] }),
  useCreateEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('../features/tasks/hooks.js', () => ({
  useTasks: () => ({ data: [] }),
}))

vi.mock('../features/subjects/hooks.js', () => ({
  useSubjects: () => ({ data: [] }),
}))

vi.mock('../stores/ui.store.js', () => ({
  useUIStore: () => ({
    isModalOpen: false,
    modalContent: null,
    openModal: vi.fn(),
    closeModal: vi.fn(),
    openConfirmDialog: vi.fn(),
    showUndoToast: vi.fn(),
    addPendingDelete: vi.fn(),
    removePendingDelete: vi.fn(),
    pendingDeletes: [],
  }),
}))

describe('Calendar event deep link', () => {
  it('highlights the event addressed by ?event=id', () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView

    render(
      <MemoryRouter initialEntries={[`/s/semester-1/calendar?event=${eventId}`]}>
        <Routes>
          <Route path="/s/:semesterId/calendar" element={<Calendar />} />
        </Routes>
      </MemoryRouter>,
    )

    const eventItem = screen.getAllByText(event.nombre)
      .map((element) => element.closest('[id="event-event-42"]'))
      .find(Boolean)
    expect(eventItem).not.toBeNull()
    expect(eventItem).toHaveClass('ring-2')
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
  })
})
