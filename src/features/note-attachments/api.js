import { supabase } from '../../lib/supabase.js'

export const noteAttachmentsQueryKeys = {
  all: ['note_attachments'],
  byNote: (noteId) => ['note_attachments', 'note', noteId],
  byId: (id) => ['note_attachments', id],
}

export async function getAttachmentsByNote(noteId) {
  const { data, error } = await supabase
    .from('note_attachments')
    .select('id, note_id, user_id, tipo, nombre, storage_path, metadata, created_at')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getAttachmentById(id) {
  const { data, error } = await supabase
    .from('note_attachments')
    .select('id, note_id, user_id, tipo, nombre, storage_path, metadata, created_at')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createAttachment(attachment) {
  const { data, error } = await supabase
    .from('note_attachments')
    .insert({
      note_id: attachment.note_id,
      tipo: attachment.tipo,
      nombre: attachment.nombre,
      storage_path: attachment.storage_path,
      metadata: attachment.metadata || {},
    })
    .select('id, note_id, user_id, tipo, nombre, storage_path, metadata, created_at')
    .single()

  if (error) throw error
  return data
}

export async function deleteAttachment(id) {
  const { error } = await supabase
    .from('note_attachments')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Storage operations
export async function uploadAttachment(userId, noteId, file, tipo) {
  const fileName = `${Date.now()}-${file.name}`
  const storagePath = `notes/${userId}/${noteId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('note-attachments')
    .upload(storagePath, file)

  if (error) throw error
  return { path: data.path, storagePath }
}

export async function deleteAttachmentFile(storagePath) {
  const { error } = await supabase.storage
    .from('note-attachments')
    .remove([storagePath])

  if (error) throw error
}

export async function getSignedUrl(storagePath, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from('note-attachments')
    .createSignedUrl(storagePath, expiresIn)

  if (error) throw error
  return data.signedUrl
}

export async function getPublicUrl(storagePath) {
  const { data } = await supabase.storage
    .from('note-attachments')
    .getPublicUrl(storagePath)

  return data.publicUrl
}
