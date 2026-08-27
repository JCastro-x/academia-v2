import { describe, it, expect, beforeEach } from 'vitest'
import { sanitizeContenido } from './sanitize.js'

describe('sanitizeContenido - XSS Protection', () => {
  beforeEach(() => {
    // Reset DOMPurify hooks before each test to avoid accumulation
    // This is handled by the module being re-imported, but we ensure clean state
  })

  it('elimina script tags básicos', () => {
    const input = '<script>alert("xss")</script>'
    const result = sanitizeContenido(input)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
  })

  it('neutraliza href con javascript:', () => {
    const input = '<a href="javascript:alert(1)">click</a>'
    const result = sanitizeContenido(input)
    expect(result).not.toContain('javascript:')
    // El link puede mantenerse pero con href neutralizado o eliminado
    expect(result).not.toMatch(/href\s*=\s*["']javascript:/i)
  })

  it('elimina img tags por completo (no está en ALLOWED_TAGS)', () => {
    const input = '<img src=x onerror="alert(1)">'
    const result = sanitizeContenido(input)
    expect(result).not.toContain('<img')
    expect(result).not.toContain('onerror')
  })

  it('elimina style attribute (no está en ALLOWED_ATTR)', () => {
    const input = '<div style="background:url(javascript:alert(1))">texto</div>'
    const result = sanitizeContenido(input)
    expect(result).not.toContain('style=')
    expect(result).not.toContain('javascript:')
  })

  it('fuerza rel="noopener noreferrer" en links con target="_blank"', () => {
    const input = '<a href="https://example.com" target="_blank">click</a>'
    const result = sanitizeContenido(input)
    expect(result).toContain('rel="noopener noreferrer"')
    expect(result).toContain('target="_blank"')
  })

  it('preserva formato válido (negrita)', () => {
    const input = '<b>texto en negrita</b>'
    const result = sanitizeContenido(input)
    expect(result).toBe('<b>texto en negrita</b>')
  })

  it('preserva formato válido (link sin target)', () => {
    const input = '<a href="https://example.com">link válido</a>'
    const result = sanitizeContenido(input)
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('link válido')
  })
})
