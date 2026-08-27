import DOMPurify from 'dompurify'

// Configuración de DOMPurify para sanitización XSS en notas
// NoteEditor.jsx usa contentEditable con document.execCommand, no genera estilos inline
const sanitizeConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'blockquote', 'code', 'pre',
    'div', 'span'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'img'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  SANITIZE_DOM: true
}

// Hook para forzar rel="noopener noreferrer" en links con target="_blank"
// Previene reverse tabnabbing
DOMPurify.addHook('afterSanitizeAttributes', function (node) {
  if (node.tagName === 'A' && node.hasAttribute('target') && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export function sanitizeContenido(html) {
  return DOMPurify.sanitize(html, sanitizeConfig)
}
