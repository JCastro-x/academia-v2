import { supabase } from '../../lib/supabase.js'

export const semestersQueryKeys = {
  all: ['semesters'],
  active: () => ['semesters', 'active'],
  byId: (id) => ['semesters', id],
}

export const getSemesters = async () => {
  const { data, error } = await supabase
    .from('semesters')
    .select('id, nombre, activo, promedio_objetivo, nota_minima, promedio_previo, creditos_previos, start_date, end_date, updated_at')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export const getActiveSemester = async () => {
  const { data, error } = await supabase
    .from('semesters')
    .select('id, nombre, activo, promedio_objetivo, nota_minima, promedio_previo, creditos_previos, start_date, end_date, updated_at')
    .eq('activo', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export const getSemesterById = async (id) => {
  const { data, error } = await supabase
    .from('semesters')
    .select('id, nombre, activo, promedio_objetivo, nota_minima, promedio_previo, creditos_previos, start_date, end_date, updated_at')
    .eq('id', id)
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export const createSemester = async (semester) => {
  const { data, error } = await supabase
    .from('semesters')
    .insert({
      nombre: semester.nombre,
      promedio_objetivo: semester.promedio_objetivo,
      nota_minima: semester.nota_minima,
      promedio_previo: semester.promedio_previo,
      creditos_previos: semester.creditos_previos,
      start_date: semester.start_date,
      end_date: semester.end_date,
    })
    .select('id, nombre, activo, promedio_objetivo, nota_minima, promedio_previo, creditos_previos, start_date, end_date, updated_at')
    .single()

  if (error) throw error
  return data
}

export const updateSemester = async (id, updates) => {
  const { data, error } = await supabase
    .from('semesters')
    .update(updates)
    .eq('id', id)
    .select('id, nombre, activo, promedio_objetivo, nota_minima, promedio_previo, creditos_previos, start_date, end_date, updated_at')
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export const deleteSemester = async (id) => {
  const { error } = await supabase
    .from('semesters')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Fetch the Storage paths of every note attachment in the semester,
// BEFORE calling the RPC, so the client can clean the bucket.
export const getSemesterAttachmentPaths = async (semesterId) => {
  const { data, error } = await supabase
    .from('note_attachments')
    .select('storage_path, notes!inner(subjects!inner(semester_id))')
    .eq('notes.subjects.semester_id', semesterId)

  if (error) throw error
  return (data || []).map((row) => row.storage_path).filter(Boolean)
}

// Atomic cascade delete via RPC. Returns the storage_path list (as a safety
// net, merged with the pre-fetched ones) for client-side Storage cleanup.
export const deleteSemesterCascade = async (id) => {
  const { data, error } = await supabase.rpc('delete_semester_cascade', {
    p_semester_id: id,
  })

  if (error) throw error
  return Array.isArray(data) ? data : []
}

export const setActiveSemester = async (id) => {
  // First, deactivate all semesters
  const { error: deactivateError } = await supabase
    .from('semesters')
    .update({ activo: false })
    .neq('id', id)
  
  if (deactivateError) throw deactivateError
  
  // Then activate the selected one
  const { data, error } = await supabase
    .from('semesters')
    .update({ activo: true })
    .eq('id', id)
    .select('id, nombre, activo, promedio_objetivo, nota_minima, promedio_previo, creditos_previos, start_date, end_date, updated_at')
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}
