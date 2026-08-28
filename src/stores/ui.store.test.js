import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from './ui.store.js'

describe('ui.store modal payload', () => {
  beforeEach(() => {
    useUIStore.setState({
      isModalOpen: false,
      modalContent: null,
      modalPayload: null,
    })
  })

  it('stores the modal payload along with the selected content', () => {
    const task = { id: 'task-123', titulo: 'Tarea de prueba' }

    useUIStore.getState().openModal('task', { editingTask: task })

    expect(useUIStore.getState()).toMatchObject({
      isModalOpen: true,
      modalContent: 'task',
      modalPayload: { editingTask: task },
    })
  })
})
