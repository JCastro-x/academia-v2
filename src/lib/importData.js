import { supabase, getCurrentUser } from './supabase.js'
import { BACKUP_TABLES } from './exportData.js'

const IMPORT_GROUPS = [
  ['profiles', 'semesters', 'habits'],
  ['subjects'],
  ['folders', 'grade_zones', 'topics', 'tasks', 'notes', 'events'],
  ['grade_items'],
  ['note_attachments'],
  ['pomodoro_sessions'],
]

const DELETE_ORDER = [
  'note_attachments',
  'pomodoro_sessions',
  'events',
  'topics',
  'notes',
  'tasks',
  'grade_items',
  'grade_zones',
  'folders',
  'subjects',
  'semesters',
  'profiles',
  'habits',
]

const CONFLICT_COLUMNS = {
  profiles: ['user_id'],
}

function normalizeBackupTables(backup) {
  if (!backup.data || typeof backup.data !== 'object') return {}
  return BACKUP_TABLES.reduce((acc, table) => {
    const rows = backup.data[table]
    acc[table] = Array.isArray(rows) ? rows : []
    return acc
  }, {})
}

export function validateBackupPayload(backup, currentUserId) {
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
    return { valid: false, error: 'El archivo no tiene el formato esperado.' }
  }

  if (backup.version !== 1) {
    return { valid: false, error: `Versión no soportada: ${backup.version}. Solo se acepta version 1.` }
  }

  if (!backup.userId || typeof backup.userId !== 'string') {
    return { valid: false, error: 'Falta el campo userId del respaldo.' }
  }

  if (currentUserId && backup.userId !== currentUserId) {
    return { valid: false, error: 'El respaldo pertenece a un usuario distinto del autenticado.' }
  }

  if (!backup.data || typeof backup.data !== 'object' || Array.isArray(backup.data)) {
    return { valid: false, error: 'La propiedad data debe ser un objeto con las tablas del respaldo.' }
  }

  const tables = []
  let totalRows = 0

  for (const table of BACKUP_TABLES) {
    const rows = backup.data[table]
    if (rows == null) continue
    if (!Array.isArray(rows)) {
      return { valid: false, error: `La tabla ${table} debe ser un arreglo.` }
    }

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index]
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        return { valid: false, error: `Fila ${index + 1} de la tabla ${table} no es un objeto válido.` }
      }
      if (row.user_id !== backup.userId) {
        return {
          valid: false,
          error: `La fila ${index + 1} de la tabla ${table} tiene un user_id distinto al respaldo.`,
        }
      }
    }

    if (rows.length > 0) {
      tables.push(table)
      totalRows += rows.length
    }
  }

  return { valid: true, tables, totalRows }
}

function rewriteUserId(rows, userId) {
  return rows.map((row) => ({
    ...row,
    user_id: userId,
  }))
}

async function upsertTableRows(table, rows, userId) {
  const normalizedRows = rewriteUserId(rows, userId)
  const conflictTarget = CONFLICT_COLUMNS[table] || ['id']
  const { error } = await supabase
    .from(table)
    .upsert(normalizedRows, { onConflict: conflictTarget })

  if (error) {
    throw new Error(`Error al importar datos en ${table}: ${error.message}`)
  }
}

export async function deleteAllUserData(userId) {
  for (const table of DELETE_ORDER) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Error al eliminar datos de ${table}: ${error.message}`)
    }
  }
}

export async function importUserBackup(backup, options = { replaceAll: false }) {
  if (!backup || typeof backup !== 'object') {
    throw new Error('El archivo de respaldo no es válido.')
  }

  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Usuario no autenticado.')
  }

  // Permitimos importar un respaldo de otra cuenta hacia la cuenta actual.
  // El user_id real se reescribirá a la sesión activa antes de cada UPSERT.

  if (options.replaceAll) {
    await deleteAllUserData(user.id)
  }

  const normalizedData = normalizeBackupTables(backup)

  for (const group of IMPORT_GROUPS) {
    await Promise.all(group.map(async (table) => {
      const rows = normalizedData[table]
      if (!rows || rows.length === 0) return
      await upsertTableRows(table, rows, user.id)
    }))
  }
}
