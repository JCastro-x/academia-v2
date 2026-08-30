import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUIStore } from './ui.store.js'

describe('ui.store modal payload', () => {
  beforeEach(() => {
    localStorage.clear()
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

  it('reads saved theme preferences from localStorage on initialization', async () => {
    localStorage.setItem('academia-theme-dark', 'true')
    localStorage.setItem('academia-theme-color', '#ef4444')
    localStorage.setItem('academia-theme-font', 'Roboto')

    vi.resetModules()
    const { useUIStore: freshStore } = await import('./ui.store.js')

    expect(freshStore.getState().modoOscuro).toBe(true)
    expect(freshStore.getState().temaColor).toBe('#ef4444')
    expect(freshStore.getState().tipografia).toBe('Roboto')
  })
})
