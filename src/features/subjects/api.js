import { supabase } from '../../lib/supabase.js'

export const subjectsQueryKeys = {
  all: ['subjects'],
  bySemester: (semesterId) => ['subjects', 'semester', semesterId],
  byId: (id) => ['subjects', id],
}

export async function getSubjects(semesterId) {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, semester_id, nombre, codigo, catedratico, seccion, creditos, color, icono, horario, linked_lab_id, updated_at')
    .eq('semester_id', semesterId)
    .order('nombre')

  if (error) throw error
  return data
}

export async function getSubjectById(id) {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, semester_id, nombre, codigo, catedratico, seccion, creditos, color, icono, horario, linked_lab_id, updated_at')
    .eq('id', id)
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export async function createSubject(subject) {
  const { data, error } = await supabase
    .from('subjects')
    .insert({
      semester_id: subject.semester_id,
      nombre: subject.nombre,
      codigo: subject.codigo,
      catedratico: subject.catedratico,
      seccion: subject.seccion,
      creditos: subject.creditos,
      color: subject.color,
      icono: subject.icono,
      horario: subject.horario,
      linked_lab_id: subject.linked_lab_id,
    })
    .select('id, semester_id, nombre, codigo, catedratico, seccion, creditos, color, icono, horario, linked_lab_id, updated_at')
    .single()

  if (error) throw error
  return data
}

export async function updateSubject(id, updates) {
  const { data, error } = await supabase
    .from('subjects')
    .update({
      nombre: updates.nombre,
      codigo: updates.codigo,
      catedratico: updates.catedratico,
      seccion: updates.seccion,
      creditos: updates.creditos,
      color: updates.color,
      icono: updates.icono,
      horario: updates.horario,
      linked_lab_id: updates.linked_lab_id,
    })
    .eq('id', id)
    .select('id, semester_id, nombre, codigo, catedratico, seccion, creditos, color, icono, horario, linked_lab_id, updated_at')
    .single()

  if (error) throw error
  return data
}

export async function deleteSubject(id) {
  const optionalDelete = async (table) => {
    const { error } = await supabase.from(table).delete().eq('subject_id', id)
    if (error && error.code !== 'PGRST205') throw error
  }

  await optionalDelete('schedule_notes')
  await optionalDelete('pomodoro_sessions')
  await optionalDelete('events')
  await optionalDelete('topics')
  await optionalDelete('tasks')

  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select('id')
    .eq('subject_id', id)
  if (notesError && notesError.code !== 'PGRST205') throw notesError
  for (const note of notes || []) {
    const { error } = await supabase.from('note_attachments').delete().eq('note_id', note.id)
    if (error && error.code !== 'PGRST205') throw error
  }
  await optionalDelete('notes')

  const { data: zones, error: zonesError } = await supabase
    .from('grade_zones')
    .select('id')
    .eq('subject_id', id)
  if (zonesError && zonesError.code !== 'PGRST205') throw zonesError
  for (const zone of zones || []) {
    const { error } = await supabase.from('grade_items').delete().eq('zone_id', zone.id)
    if (error && error.code !== 'PGRST205') throw error
  }
  await optionalDelete('grade_zones')
  await optionalDelete('folders')

  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id)

  if (error) throw error
}
