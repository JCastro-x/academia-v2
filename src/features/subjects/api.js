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
    .single()

  if (error) throw error
  return data
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
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id)

  if (error) throw error
}
