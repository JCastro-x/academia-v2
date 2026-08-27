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
  'habits',
  'events',
  'pomodoro_sessions',
  'note_attachments',
]

const TABLES_BY_USER = BACKUP_TABLES

const TABLE_COLUMNS = {
  profiles: [
    'user_id', 'nombre', 'registro_academico', 'carrera', 'institucion',
    'cursos_ganados', 'tipografia', 'tema_color', 'sonidos_interaccion',
    'modo_oscuro', 'updated_at',
  ],
  semesters: [
    'id', 'user_id', 'nombre', 'activo', 'promedio_objetivo', 'nota_minima',
    'promedio_previo', 'creditos_previos', 'updated_at',
  ],
  subjects: [
    'id', 'semester_id', 'user_id', 'nombre', 'codigo', 'catedratico',
    'seccion', 'creditos', 'color', 'icono', 'horario', 'linked_lab_id', 'updated_at',
  ],
  grade_zones: [
    'id', 'subject_id', 'user_id', 'nombre', 'peso_pts', 'ganada_pct',
  ],
  grade_items: [
    'id', 'zone_id', 'user_id', 'nombre', 'porcentaje_ingresado', 'puntos_netos', 'peso_pts',
  ],
  tasks: [
    'id', 'subject_id', 'semester_id', 'user_id', 'titulo', 'prioridad',
    'due', 'done', 'subtasks', 'attachments', 'reminder_at', 'tipo',
    'total_units', 'work_days', 'log', 'updated_at',
  ],
  notes: [
    'id', 'subject_id', 'user_id', 'folder_id', 'titulo', 'contenido', 'updated_at',
  ],
  folders: [
    'id', 'user_id', 'subject_id', 'parent_id', 'nombre',
  ],
  topics: [
    'id', 'subject_id', 'user_id', 'parcial', 'nombre', 'subtemas',
    'dificultad', 'tiempo_dedicado_min', 'fecha_examen', 'comprension', 'visto',
  ],
  habits: [
    'id', 'user_id', 'nombre', 'frecuencia', 'dias_semana', 'racha', 'historial',
  ],
  events: [
    'id', 'subject_id', 'semester_id', 'user_id', 'nombre', 'tipo',
    'start_at', 'end_at', 'descripcion',
  ],
  pomodoro_sessions: [
    'id', 'user_id', 'started_at', 'ended_at', 'duration_min', 'tipo',
    'task_id', 'subject_id',
  ],
  note_attachments: [
    'id', 'note_id', 'user_id', 'tipo', 'nombre', 'storage_path', 'metadata', 'created_at',
  ],
}

async function fetchAllFromTable(tableName) {
  const columns = TABLE_COLUMNS[tableName]?.join(', ')
  const { data, error } = await supabase
    .from(tableName)
    .select(columns)

  if (error) {
    console.warn(`[exportData] Error fetching ${tableName}:`, error)
    return []
  }
  return data || []
}

export async function exportAllUserData() {
  const user = await getCurrentUser()
  const userId = user.id

  const tablePromises = TABLES_BY_USER.map(async (table) => {
    const rows = await fetchAllFromTable(table)
    return [table, rows.filter(row => row.user_id === userId)]
  })

  const tableEntries = await Promise.all(tablePromises)
  const data = Object.fromEntries(tableEntries)

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