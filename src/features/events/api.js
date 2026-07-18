import { supabase } from '../../lib/supabase.js'

export const eventsQueryKeys = {
  all: ['events'],
  bySemester: (semesterId) => ['events', 'semester', semesterId],
  byMonth: (semesterId, year, month) => ['events', 'semester', semesterId, 'month', year, month],
  bySubject: (subjectId) => ['events', 'subject', subjectId],
  byId: (id) => ['events', id],
}

export async function getEvents(semesterId) {
  const { data, error } = await supabase
    .from('events')
    .select('id, subject_id, semester_id, user_id, nombre, tipo, start_at, end_at, descripcion')
    .eq('semester_id', semesterId)
    .order('start_at', { ascending: true })

  if (error) throw error
  return data
}

export async function getEventsByMonth(semesterId, year, month) {
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)

  const { data, error } = await supabase
    .from('events')
    .select('id, subject_id, semester_id, user_id, nombre, tipo, start_at, end_at, descripcion')
    .eq('semester_id', semesterId)
    .gte('start_at', startOfMonth.toISOString())
    .lte('start_at', endOfMonth.toISOString())
    .order('start_at', { ascending: true })

  if (error) throw error
  return data
}

export async function getEventsBySubject(subjectId) {
  const { data, error } = await supabase
    .from('events')
    .select('id, subject_id, semester_id, user_id, nombre, tipo, start_at, end_at, descripcion')
    .eq('subject_id', subjectId)
    .order('start_at', { ascending: true })

  if (error) throw error
  return data
}

export async function getEventById(id) {
  const { data, error } = await supabase
    .from('events')
    .select('id, subject_id, semester_id, user_id, nombre, tipo, start_at, end_at, descripcion')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createEvent(event) {
  const { data, error } = await supabase
    .from('events')
    .insert({
      subject_id: event.subject_id,
      semester_id: event.semester_id,
      nombre: event.nombre,
      tipo: event.tipo,
      start_at: event.start_at,
      end_at: event.end_at,
      descripcion: event.descripcion,
    })
    .select('id, subject_id, semester_id, user_id, nombre, tipo, start_at, end_at, descripcion')
    .single()

  if (error) throw error
  return data
}

export async function updateEvent(id, updates) {
  const { data, error } = await supabase
    .from('events')
    .update({
      subject_id: updates.subject_id,
      nombre: updates.nombre,
      tipo: updates.tipo,
      start_at: updates.start_at,
      end_at: updates.end_at,
      descripcion: updates.descripcion,
    })
    .eq('id', id)
    .select('id, subject_id, semester_id, user_id, nombre, tipo, start_at, end_at, descripcion')
    .single()

  if (error) throw error
  return data
}

export async function deleteEvent(id) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) throw error
}
