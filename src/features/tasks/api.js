import { supabase } from '../../lib/supabase.js'

export const tasksQueryKeys = {
  all: ['tasks'],
  bySemester: (semesterId) => ['tasks', 'semester', semesterId],
  bySubject: (subjectId) => ['tasks', 'subject', subjectId],
  byId: (id) => ['tasks', id],
  pending: (semesterId) => ['tasks', 'pending', semesterId],
  incrementLog: (taskId) => ['tasks', 'increment-log', taskId],
}

export async function getTasks(semesterId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, subject_id, semester_id, titulo, prioridad, due, done, subtasks, attachments, reminder_at, tipo, total_units, work_days, log, updated_at')
    .eq('semester_id', semesterId)
    .order('due', { ascending: true, nullsFirst: false })

  if (error) throw error
  return data
}

export async function getPendingTasks(semesterId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, subject_id, semester_id, titulo, prioridad, due, done, subtasks, attachments, reminder_at, tipo, total_units, work_days, log, updated_at')
    .eq('semester_id', semesterId)
    .eq('done', false)
    .order('due', { ascending: true, nullsFirst: false })

  if (error) throw error
  return data
}

export async function getTasksBySubject(subjectId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, subject_id, semester_id, titulo, prioridad, due, done, subtasks, attachments, reminder_at, tipo, total_units, work_days, log, updated_at')
    .eq('subject_id', subjectId)
    .order('due', { ascending: true, nullsFirst: false })

  if (error) throw error
  return data
}

export async function getTaskById(id) {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, subject_id, semester_id, titulo, prioridad, due, done, subtasks, attachments, reminder_at, tipo, total_units, work_days, log, updated_at')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createTask(task) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      subject_id: task.subject_id,
      semester_id: task.semester_id,
      titulo: task.titulo,
      prioridad: task.prioridad,
      due: task.due,
      done: false,
      subtasks: task.subtasks || [],
      attachments: task.attachments || [],
      reminder_at: task.reminder_at,
      tipo: task.tipo || 'checklist',
      total_units: task.total_units,
      work_days: task.work_days,
      log: task.log || [],
    })
    .select('id, subject_id, semester_id, titulo, prioridad, due, done, subtasks, attachments, reminder_at, tipo, total_units, work_days, log, updated_at')
    .single()

  if (error) throw error
  return data
}

export async function updateTask(id, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      titulo: updates.titulo,
      prioridad: updates.prioridad,
      due: updates.due,
      done: updates.done,
      subtasks: updates.subtasks,
      attachments: updates.attachments,
      reminder_at: updates.reminder_at,
      tipo: updates.tipo,
      total_units: updates.total_units,
      work_days: updates.work_days,
      log: updates.log,
    })
    .eq('id', id)
    .select('id, subject_id, semester_id, titulo, prioridad, due, done, subtasks, attachments, reminder_at, tipo, total_units, work_days, log, updated_at')
    .single()

  if (error) throw error
  return data
}

export async function toggleTaskDone(id, done) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ done })
    .eq('id', id)
    .select('id, subject_id, semester_id, titulo, prioridad, due, done, subtasks, attachments, reminder_at, tipo, total_units, work_days, log, updated_at')
    .single()

  if (error) throw error
  return data
}

export async function deleteTask(id) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function deleteCompletedTasks(semesterId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('semester_id', semesterId)
    .eq('done', true)

  if (error) throw error
}

export async function countTasksBySubject(subjectId) {
  const { count, error } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('subject_id', subjectId)

  if (error) throw error
  return count || 0
}

export async function incrementTaskLogUnit(taskId, dateStr, delta) {
  // SELECT current task state
  const { data: task, error: selectError } = await supabase
    .from('tasks')
    .select('id, log, total_units')
    .eq('id', taskId)
    .single()

  if (selectError) throw selectError

  // Calculate new log value in JS
  const log = task.log || {}
  const currentValue = Number(log[dateStr]) || 0
  const newValue = currentValue + delta

  // Capping: prevent negative values
  const cappedValue = Math.max(0, newValue)

  // Calculate totalDone for capping against total_units
  const totalDone = Object.keys(log).reduce((sum, k) => sum + (Number(log[k]) || 0), 0)
  const totalUnits = Number(task.total_units) || 0

  // Capping: prevent exceeding total_units (if defined)
  const totalDoneWithNewValue = totalDone - currentValue + cappedValue
  const finalValue = totalUnits > 0 && totalDoneWithNewValue > totalUnits 
    ? cappedValue - (totalDoneWithNewValue - totalUnits) 
    : cappedValue

  // Update log with new value
  const updatedLog = { ...log }
  if (finalValue === 0) {
    delete updatedLog[dateStr]
  } else {
    updatedLog[dateStr] = finalValue
  }

  // UPDATE task with new log
  const { data, error: updateError } = await supabase
    .from('tasks')
    .update({ log: updatedLog })
    .eq('id', taskId)
    .select('id, subject_id, semester_id, titulo, prioridad, due, done, subtasks, attachments, reminder_at, tipo, total_units, work_days, log, updated_at')
    .single()

  if (updateError) throw updateError
  return data
}
