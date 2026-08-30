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

  it('ignores legacy localStorage theme prefs and keeps the store defaulted to profile-driven state', async () => {
    localStorage.setItem('academia-theme-dark', 'true')
    localStorage.setItem('academia-theme-color', '#ef4444')
    localStorage.setItem('academia-theme-font', 'Roboto')

    vi.resetModules()
    const { useUIStore: freshStore } = await import('./ui.store.js')

    expect(freshStore.getState().modoOscuro).toBe(false)
    expect(freshStore.getState().temaColor).toBe('#84cc16')
    expect(freshStore.getState().tipografia).toBe('Inter')
    expect(localStorage.getItem('academia-theme-dark')).toBe('true')
    expect(localStorage.getItem('academia-theme-color')).toBe('#ef4444')
    expect(localStorage.getItem('academia-theme-font')).toBe('Roboto')
  })
})
