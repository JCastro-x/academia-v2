import { supabase, getCurrentUser } from '../../lib/supabase.js'

export const profilesQueryKeys = {
  all: ['profiles'],
  current: ['profiles', 'current']
}

export async function getProfile() {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, nombre, registro_academico, carrera, institucion, cursos_ganados, tipografia, tema_color, sonidos_interaccion, modo_oscuro, hora_formato, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    // Si no existe perfil, retornar null (el cliente decidirá si crear uno)
    if (error.code === 'PGRST116') {
      return null
    }
    throw error
  }

  return data
}

export async function upsertProfile(profileData) {
  const user = await getCurrentUser()
  const profile = {
    ...profileData,
    user_id: user.id  // user_id explícito para INSERT y UPDATE
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'user_id' })
    .select('user_id, nombre, registro_academico, carrera, institucion, cursos_ganados, tipografia, tema_color, sonidos_interaccion, modo_oscuro, hora_formato, updated_at')
    .maybeSingle()
  
  if (error) throw error
  return data
}
