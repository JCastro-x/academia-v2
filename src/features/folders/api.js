import { supabase } from '../../lib/supabase.js'

export const foldersQueryKeys = {
  all: ['folders'],
  byParent: (parentId) => ['folders', 'parent', parentId],
  bySubject: (subjectId) => ['folders', 'subject', subjectId],
  byId: (id) => ['folders', id],
}

export async function getFolders(parentId = null) {
  const query = supabase
    .from('folders')
    .select('id, user_id, subject_id, parent_id, nombre')
  
  if (parentId === null) {
    query.is('parent_id', null)
  } else {
    query.eq('parent_id', parentId)
  }
  
  const { data, error } = await query.order('nombre')

  if (error) throw error
  return data
}

export async function getFolderById(id) {
  const { data, error } = await supabase
    .from('folders')
    .select('id, user_id, subject_id, parent_id, nombre')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createFolder(folder) {
  const { data, error } = await supabase
    .from('folders')
    .insert({
      subject_id: folder.subject_id,
      parent_id: folder.parent_id,
      nombre: folder.nombre,
    })
    .select('id, user_id, subject_id, parent_id, nombre')
    .single()

  if (error) throw error
  return data
}

export async function updateFolder(id, updates) {
  const { data, error } = await supabase
    .from('folders')
    .update({
      nombre: updates.nombre,
      subject_id: updates.subject_id,
    })
    .eq('id', id)
    .select('id, user_id, subject_id, parent_id, nombre')
    .single()

  if (error) throw error
  return data
}

export async function deleteFolder(id) {
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)

  if (error) throw error
}
