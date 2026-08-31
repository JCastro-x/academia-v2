/**
 * Utilidades de contraste WCAG para elegir color de texto legible
 * sobre fondos de color dinámico (color de materia, color de zona, etc.).
 */

function parseHexColor(hex) {
  if (typeof hex !== 'string') return null
  let h = hex.trim().replace('#', '')
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('')
  }
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function channelLuminance(channel) {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/**
 * Luminancia relativa (WCAG 2.x). Devuelve 0..1.
 */
export function relativeLuminance(hexColor) {
  const rgb = parseHexColor(hexColor)
  if (!rgb) return 0
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  )
}

/**
 * Devuelve '#000000' o '#FFFFFF' (el que tenga mejor contraste)
 * contra el color hex recibido. Si el color es inválido/devuelve '#000000'.
 */
export function getContrastTextColor(hexColor) {
  const lum = relativeLuminance(hexColor)
  // Umbral estándar: si luminancia > 0.179, el fondo es claro → texto negro
  return lum > 0.179 ? '#000000' : '#FFFFFF'
}