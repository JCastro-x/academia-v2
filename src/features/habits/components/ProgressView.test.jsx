import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ProgressView from './ProgressView.jsx'

describe('ProgressView month navigation', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in the local current month, highlights today, and rolls across years', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 20, 12))

    render(
      <ProgressView
        habits={[{ id: 'habit-1', nombre: 'Lectura', archivado: false }]}
        logs={[{ habit_id: 'habit-1', fecha: '2026-01-20', estado: 'cumplido' }]}
        programaciones={[]}
        pauseDays={[]}
        config={{}}
      />
    )

    expect(screen.getByText(/enero de 2026/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Mes siguiente/ }).disabled).toBe(true)
    expect(screen.getByTitle('20: 100%').className).toContain('ring-2')

    fireEvent.click(screen.getByRole('button', { name: /Mes anterior/ }))
    expect(screen.getByText(/diciembre de 2025/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Mes siguiente/ }))
    expect(screen.getByText(/enero de 2026/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Mes siguiente/ }).disabled).toBe(true)
  })
})
