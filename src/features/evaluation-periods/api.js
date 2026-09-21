import { supabase } from '../../lib/supabase.js'

export const evaluationPeriodsQueryKeys = {
  all: ['evaluation_periods'],
  bySubject: (subjectId) => ['evaluation_periods', 'subject', subjectId],
  byId: (id) => ['evaluation_periods', id],
}

export async function getEvaluationPeriodsBySubject(subjectId) {
  const { data, error } = await supabase
    .from('evaluation_periods')
    .select('id, subject_id, user_id, nombre, fecha, created_at')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function getEvaluationPeriodById(id) {
  const { data, error } = await supabase
    .from('evaluation_periods')
    .select('id, subject_id, user_id, nombre, fecha, created_at')
    .eq('id', id)
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export async function createEvaluationPeriod(period) {
  const { data, error } = await supabase
    .from('evaluation_periods')
    .insert({
      subject_id: period.subject_id,
      nombre: period.nombre,
      fecha: period.fecha,
    })
    .select('id, subject_id, user_id, nombre, fecha, created_at')
    .single()

  if (error) throw error
  return data
}

export async function updateEvaluationPeriod(id, updates) {
  const { data, error } = await supabase
    .from('evaluation_periods')
    .update({
      nombre: updates.nombre,
      fecha: updates.fecha,
    })
    .eq('id', id)
    .select('id, subject_id, user_id, nombre, fecha, created_at')
    .single()

  if (error) throw error
  return data
}

export async function deleteEvaluationPeriod(id) {
  const { error } = await supabase
    .from('evaluation_periods')
    .delete()
    .eq('id', id)

  if (error) throw error
}
