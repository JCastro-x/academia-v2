import { supabase } from '../../lib/supabase.js'

export const scheduleTableQueryKeys = {
  all: ['schedule-table'],
  notes: (semesterId) => ['schedule-table', 'notes', semesterId],
  flags: (semesterId) => ['schedule-table', 'flags', semesterId],
  note: (semesterId, subjectId, weekNumber) => ['schedule-table', 'note', semesterId, subjectId, weekNumber],
  flag: (semesterId, weekNumber) => ['schedule-table', 'flag', semesterId, weekNumber],
}

export async function getScheduleNotes(semesterId) {
  const { data, error } = await supabase
    .from('schedule_notes')
    .select('id, semester_id, subject_id, week_number, note_text, note_color, updated_at')
    .eq('semester_id', semesterId)

  if (error) throw error
  return data
}

export async function getScheduleNote(semesterId, subjectId, weekNumber) {
  const { data, error } = await supabase
    .from('schedule_notes')
    .select('id, semester_id, subject_id, week_number, note_text, note_color, updated_at')
    .eq('semester_id', semesterId)
    .eq('subject_id', subjectId)
    .eq('week_number', weekNumber)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
  return data
}

export async function upsertScheduleNote(semesterId, subjectId, weekNumber, noteText, noteColor) {
  const { data, error } = await supabase
    .from('schedule_notes')
    .upsert({
      semester_id: semesterId,
      subject_id: subjectId,
      week_number: weekNumber,
      note_text: noteText,
      note_color: noteColor,
    })
    .select('id, semester_id, subject_id, week_number, note_text, note_color, updated_at')
    .single()

  if (error) throw error
  return data
}

export async function deleteScheduleNote(semesterId, subjectId, weekNumber) {
  const { error } = await supabase
    .from('schedule_notes')
    .delete()
    .eq('semester_id', semesterId)
    .eq('subject_id', subjectId)
    .eq('week_number', weekNumber)

  if (error) throw error
}

export async function getScheduleFlags(semesterId) {
  const { data, error } = await supabase
    .from('schedule_flags')
    .select('id, semester_id, week_number, flag_type, updated_at')
    .eq('semester_id', semesterId)

  if (error) throw error
  return data
}

export async function getScheduleFlag(semesterId, weekNumber) {
  const { data, error } = await supabase
    .from('schedule_flags')
    .select('id, semester_id, week_number, flag_type, updated_at')
    .eq('semester_id', semesterId)
    .eq('week_number', weekNumber)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
  return data
}

export async function upsertScheduleFlag(semesterId, weekNumber, flagType) {
  const { data, error } = await supabase
    .from('schedule_flags')
    .upsert({
      semester_id: semesterId,
      week_number: weekNumber,
      flag_type: flagType,
    })
    .select('id, semester_id, week_number, flag_type, updated_at')
    .single()

  if (error) throw error
  return data
}

export async function deleteScheduleFlag(semesterId, weekNumber) {
  const { error } = await supabase
    .from('schedule_flags')
    .delete()
    .eq('semester_id', semesterId)
    .eq('week_number', weekNumber)

  if (error) throw error
}
