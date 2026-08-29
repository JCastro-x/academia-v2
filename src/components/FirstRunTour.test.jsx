import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import FirstRunTour from './FirstRunTour.jsx'

describe('FirstRunTour', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('muestra el tour la primera vez y marca que ya se vio', () => {
    render(<FirstRunTour />)

    expect(screen.getByText(/primera vez aquí/i)).toBeInTheDocument()
    expect(localStorage.getItem('academia-first-run-tour-done')).toBe('true')
  })

  it('no muestra el tour si ya se vio antes', () => {
    localStorage.setItem('academia-first-run-tour-done', 'true')

    render(<FirstRunTour />)

    expect(screen.queryByText(/primera vez aquí/i)).not.toBeInTheDocument()
  })
})
