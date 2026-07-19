import { supabase, getCurrentUser } from './supabase.js'

export const BACKUP_TABLES = [
  'profiles',
  'semesters',
  'subjects',
  'grade_zones',
  'grade_items',
  'tasks',
  'notes',
  'folders',
  'topics',
  'flashcards',
  'habits',
  'events',
  'pomodoro_sessions',
  'note_attachments',
]

const TABLES_BY_USER = BACKUP_TABLES

// Excepción: export necesita TODOS los campos del usuario.
// No aplica la regla de "columnas explícitas" porque el propósito
// es respaldar la totalidad de los datos, no optimizar una vista.
// Se usa select('*') intencionalmente para capturar cualquier
// columna nueva que se agregue al schema en el futuro.
async function fetchAllFromTable(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')

  if (error) {
    console.warn(`[exportData] Error fetching ${tableName}:`, error)
    return []
  }
  return data || []
}

export async function exportAllUserData() {
  const user = await getCurrentUser()
  const userId = user.id

  const data = {}

  for (const table of TABLES_BY_USER) {
    const rows = await fetchAllFromTable(table)
    // Filtrar solo las filas del usuario (por si alguna tabla no
    // tiene RLS configurada, aunque debería)
    data[table] = rows.filter(row => row.user_id === userId)
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    userId,
    data,
  }
}

export function downloadJSON(data, filename = `academia-backup-${new Date().toISOString().split('T')[0]}.json`) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}