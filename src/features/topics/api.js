import { supabase } from '../../lib/supabase.js'

export const topicsQueryKeys = {
  all: ['topics'],
  bySubject: (subjectId) => ['topics', 'subject', subjectId],
  byPartial: (subjectId, parcial) => ['topics', 'subject', subjectId, 'partial', parcial],
  byId: (id) => ['topics', id],
}

export async function getTopicsBySubject(subjectId) {
  const { data, error } = await supabase
    .from('topics')
    .select('id, subject_id, user_id, parcial, nombre, subtemas, dificultad, tiempo_dedicado_min, fecha_examen, comprension, visto')
    .eq('subject_id', subjectId)
    .order('parcial', { ascending: true })

  if (error) throw error
  return data
}

export async function getTopicsByPartial(subjectId, parcial) {
  const { data, error } = await supabase
    .from('topics')
    .select('id, subject_id, user_id, parcial, nombre, subtemas, dificultad, tiempo_dedicado_min, fecha_examen, comprension, visto')
    .eq('subject_id', subjectId)
    .eq('parcial', parcial)
    .order('nombre')

  if (error) throw error
  return data
}

export async function getTopicById(id) {
  const { data, error } = await supabase
    .from('topics')
    .select('id, subject_id, user_id, parcial, nombre, subtemas, dificultad, tiempo_dedicado_min, fecha_examen, comprension, visto')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createTopic(topic) {
  const { data, error } = await supabase
    .from('topics')
    .insert({
      subject_id: topic.subject_id,
      parcial: topic.parcial,
      nombre: topic.nombre,
      subtemas: topic.subtemas || [],
      dificultad: topic.dificultad,
      tiempo_dedicado_min: topic.tiempo_dedicado_min,
      fecha_examen: topic.fecha_examen,
    })
    .select('id, subject_id, user_id, parcial, nombre, subtemas, dificultad, tiempo_dedicado_min, fecha_examen, comprension, visto')
    .single()

  if (error) throw error
  return data
}

export async function updateTopic(id, updates) {
  const { data, error } = await supabase
    .from('topics')
    .update({
      parcial: updates.parcial,
      nombre: updates.nombre,
      subtemas: updates.subtemas,
      dificultad: updates.dificultad,
      tiempo_dedicado_min: updates.tiempo_dedicado_min,
      fecha_examen: updates.fecha_examen,
      comprension: updates.comprension,
      visto: updates.visto,
    })
    .eq('id', id)
    .select('id, subject_id, user_id, parcial, nombre, subtemas, dificultad, tiempo_dedicado_min, fecha_examen, comprension, visto')
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
