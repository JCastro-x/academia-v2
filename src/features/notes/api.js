import { supabase } from '../../lib/supabase.js'
import { sanitizeContenido } from './sanitize.js'

export const notesQueryKeys = {
  all: ['notes'],
  byFolder: (folderId) => ['notes', 'folder', folderId],
  bySubject: (subjectId) => ['notes', 'subject', subjectId],
  byId: (id) => ['notes', id],
  search: (query) => ['notes', 'search', query],
}

export async function getNotes(folderId = null) {
  const query = supabase
    .from('notes')
    .select('id, subject_id, folder_id, titulo, contenido, updated_at')
  
  if (folderId === null) {
    query.is('folder_id', null)
  } else {
    query.eq('folder_id', folderId)
  }
  
  const { data, error } = await query.order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getNoteById(id) {
  const { data, error } = await supabase
    .from('notes')
    .select('id, subject_id, folder_id, titulo, contenido, updated_at')
    .eq('id', id)
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export async function searchNotes(query) {
  const { data, error } = await supabase
    .from('notes')
    .select('id, subject_id, folder_id, titulo, contenido, updated_at')
    .or(`titulo.ilike.%${query}%,contenido.ilike.%${query}%`)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createNote(note) {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      subject_id: note.subject_id,
      folder_id: note.folder_id,
      titulo: note.titulo,
      contenido: sanitizeContenido(note.contenido || ''),
    })
    .select('id, subject_id, folder_id, titulo, contenido, updated_at')
    .single()

  if (error) throw error
  return data
}

export async function updateNote(id, updates) {
  const { data, error } = await supabase
    .from('notes')
    .update({
      titulo: updates.titulo,
      contenido: sanitizeContenido(updates.contenido),
      subject_id: updates.subject_id,
      folder_id: updates.folder_id,
    })
    .eq('id', id)
    .select('id, subject_id, folder_id, titulo, contenido, updated_at')
    .single()

  if (error) throw error
  return data
}

export async function deleteNote(id) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)

  if (error) throw error
}
