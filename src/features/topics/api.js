import { supabase } from '../../lib/supabase.js'

export const topicsQueryKeys = {
  all: ['topics'],
  bySubject: (subjectId) => ['topics', 'subject', subjectId],
  byPartial: (subjectId, parcial) => ['topics', 'subject', subjectId, 'partial', parcial],
  byEvaluationPeriod: (evaluationPeriodId) => ['topics', 'evaluation_period', evaluationPeriodId],
  byId: (id) => ['topics', id],
}

export async function getTopicsBySubject(subjectId) {
  const { data, error } = await supabase
    .from('topics')
    .select('id, subject_id, user_id, evaluation_period_id, nombre, subtema, descripcion, parcial, subtemas, dificultad, tiempo_dedicado_min, fecha_examen, comprension, visto, repasado, subtemas_repasados, created_at')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function getTopicsByPartial(subjectId, parcial) {
  const { data, error } = await supabase
    .from('topics')
    .select('id, subject_id, user_id, evaluation_period_id, nombre, subtema, descripcion, parcial, subtemas, dificultad, tiempo_dedicado_min, fecha_examen, comprension, visto, repasado, subtemas_repasados, created_at')
    .eq('subject_id', subjectId)
    .eq('parcial', parcial)
    .order('nombre')

  if (error) throw error
  return data
}

export async function getTopicsByEvaluationPeriod(evaluationPeriodId) {
  const { data, error } = await supabase
    .from('topics')
    .select('id, subject_id, user_id, evaluation_period_id, nombre, subtema, descripcion, parcial, subtemas, dificultad, tiempo_dedicado_min, fecha_examen, comprension, visto, repasado, subtemas_repasados, created_at')
    .eq('evaluation_period_id', evaluationPeriodId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function getTopicById(id) {
  const { data, error } = await supabase
    .from('topics')
    .select('id, subject_id, user_id, evaluation_period_id, nombre, subtema, descripcion, parcial, subtemas, dificultad, tiempo_dedicado_min, fecha_examen, comprension, visto, repasado, subtemas_repasados, created_at')
    .eq('id', id)
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export async function createTopic(topic) {
  const { data, error } = await supabase
    .from('topics')
    .insert({
      subject_id: topic.subject_id,
      evaluation_period_id: topic.evaluation_period_id || null, // Allow null for general topics
      nombre: topic.nombre,
      subtema: topic.subtema,
      descripcion: topic.descripcion,
      parcial: topic.parcial,
      subtemas: topic.subtemas || [],
      dificultad: topic.dificultad,
      tiempo_dedicado_min: topic.tiempo_dedicado_min,
      fecha_examen: topic.fecha_examen,
      repasado: false,
      subtemas_repasados: [],
    })
    .select('id, subject_id, user_id, evaluation_period_id, nombre, subtema, descripcion, parcial, subtemas, dificultad, tiempo_dedicado_min, fecha_examen, comprension, visto, repasado, subtemas_repasados, created_at')
    .single()

  if (error) throw error
  return data
}

export async function updateTopic(id, updates) {
  const { data, error } = await supabase
    .from('topics')
    .update({
      evaluation_period_id: updates.evaluation_period_id !== undefined ? updates.evaluation_period_id : undefined,
      nombre: updates.nombre,
      subtema: updates.subtema,
      descripcion: updates.descripcion,
      parcial: updates.parcial,
      subtemas: updates.subtemas,
      dificultad: updates.dificultad,
      tiempo_dedicado_min: updates.tiempo_dedicado_min,
      fecha_examen: updates.fecha_examen,
      comprension: updates.comprension,
      visto: updates.visto,
      repasado: updates.repasado,
      subtemas_repasados: updates.subtemas_repasados,
    })
    .eq('id', id)
    .select('id, subject_id, user_id, evaluation_period_id, nombre, subtema, descripcion, parcial, subtemas, dificultad, tiempo_dedicado_min, fecha_examen, comprension, visto, repasado, subtemas_repasados, created_at')
    .single()

  if (error) throw error
  return data
}

export async function deleteTopic(id) {
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', id)

  if (error) throw error
}
