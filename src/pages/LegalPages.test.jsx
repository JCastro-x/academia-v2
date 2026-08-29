import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Terms from './Terms.jsx'
import Privacy from './Privacy.jsx'

describe('Legal pages', () => {
  it('renders the terms page', () => {
    render(
      <MemoryRouter initialEntries={['/terms']}>
        <Routes>
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /Términos y condiciones/i })).toBeInTheDocument()
  })

  it('renders the privacy page', () => {
    render(
      <MemoryRouter initialEntries={['/privacy']}>
        <Routes>
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText(/Política de privacidad/i)).toBeInTheDocument()
  })
})
