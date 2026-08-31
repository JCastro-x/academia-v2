import { supabase } from '../../lib/supabase.js'

export const gradesQueryKeys = {
  all: ['grades'],
  zonesBySubject: (subjectId) => ['grades', 'zones', 'subject', subjectId],
  zoneById: (id) => ['grades', 'zones', id],
  itemsByZone: (zoneId) => ['grades', 'items', 'zone', zoneId],
  itemById: (id) => ['grades', 'items', id],
  subjectsTotalPoints: (semesterId) => ['grades', 'subjects-total', semesterId],
}

/**
 * Get all grade zones for a subject with their items
 */
export async function getZonesBySubject(subjectId) {
  const { data: zones, error: zonesError } = await supabase
    .from('grade_zones')
    .select('id, subject_id, user_id, nombre, peso_pts, ganada_pct')
    .eq('subject_id', subjectId)
    .order('nombre')

  if (zonesError) throw zonesError

  // Fetch items for each zone
  const zonesWithItems = await Promise.all(
    zones.map(async (zone) => {
      const { data: items, error: itemsError } = await supabase
        .from('grade_items')
        .select('id, zone_id, user_id, nombre, porcentaje_ingresado, puntos_netos, peso_pts')
        .eq('zone_id', zone.id)
        .order('nombre')

      if (itemsError) throw itemsError

      return {
        ...zone,
        items: items || [],
      }
    })
  )

  return zonesWithItems
}

/**
 * Get all grade zones for many subjects with their items (for semester-wide totals).
 */
export async function getZonesForSubjects(subjectIds) {
  if (!subjectIds || subjectIds.length === 0) return []

  const { data: zones, error: zonesError } = await supabase
    .from('grade_zones')
    .select('id, subject_id, user_id, nombre, peso_pts, ganada_pct')
    .in('subject_id', subjectIds)
    .order('nombre')

  if (zonesError) throw zonesError

  const zonesWithItems = await Promise.all(
    zones.map(async (zone) => {
      const { data: items, error: itemsError } = await supabase
        .from('grade_items')
        .select('id, zone_id, user_id, nombre, porcentaje_ingresado, puntos_netos, peso_pts')
        .eq('zone_id', zone.id)
        .order('nombre')

      if (itemsError) throw itemsError

      return {
        ...zone,
        items: items || [],
      }
    })
  )

  return zonesWithItems
}

/**
 * Get a single grade zone by ID
 */
export async function getZoneById(id) {
  const { data, error } = await supabase
    .from('grade_zones')
    .select('id, subject_id, user_id, nombre, peso_pts, ganada_pct')
    .eq('id', id)
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

/**
 * Get all items for a zone
 */
export async function getItemsByZone(zoneId) {
  const { data, error } = await supabase
    .from('grade_items')
    .select('id, zone_id, user_id, nombre, porcentaje_ingresado, puntos_netos, peso_pts')
    .eq('zone_id', zoneId)
    .order('nombre')

  if (error) throw error
  return data
}

/**
 * Get a single grade item by ID
 */
export async function getItemById(id) {
  const { data, error } = await supabase
    .from('grade_items')
    .select('id, zone_id, user_id, nombre, porcentaje_ingresado, puntos_netos, peso_pts')
    .eq('id', id)
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

/**
 * Create a new grade zone
 */
export async function createZone(zone) {
  const { data, error } = await supabase
    .from('grade_zones')
    .insert({
      subject_id: zone.subject_id,
      nombre: zone.nombre,
      peso_pts: zone.peso_pts,
      ganada_pct: zone.ganada_pct || 60,
    })
    .select('id, subject_id, user_id, nombre, peso_pts, ganada_pct')
    .single()

  if (error) throw error
  return data
}

/**
 * Update a grade zone
 */
export async function updateZone(id, updates) {
  const { data, error } = await supabase
    .from('grade_zones')
    .update({
      nombre: updates.nombre,
      peso_pts: updates.peso_pts,
      ganada_pct: updates.ganada_pct,
    })
    .eq('id', id)
    .select('id, subject_id, user_id, nombre, peso_pts, ganada_pct')
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a grade zone
 */
export async function deleteZone(id) {
  const { error } = await supabase
    .from('grade_zones')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Create a new grade item
 */
export async function createItem(item) {
  const { data, error } = await supabase
    .from('grade_items')
    .insert({
      zone_id: item.zone_id,
      nombre: item.nombre,
      porcentaje_ingresado: item.porcentaje_ingresado || null,
      puntos_netos: item.puntos_netos || null,
      peso_pts: item.peso_pts || null,
    })
    .select('id, zone_id, user_id, nombre, porcentaje_ingresado, puntos_netos, peso_pts')
    .single()

  if (error) throw error
  return data
}

/**
 * Update a grade item
 */
export async function updateItem(id, updates) {
  const { data, error } = await supabase
    .from('grade_items')
    .update({
      nombre: updates.nombre,
      porcentaje_ingresado: updates.porcentaje_ingresado,
      puntos_netos: updates.puntos_netos,
      peso_pts: updates.peso_pts,
    })
    .eq('id', id)
    .select('id, zone_id, user_id, nombre, porcentaje_ingresado, puntos_netos, peso_pts')
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a grade item
 */
export async function deleteItem(id) {
  const { error } = await supabase
    .from('grade_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Count items by zone (for validation before zone deletion)
 */
export async function countItemsByZone(zoneId) {
  const { count, error } = await supabase
    .from('grade_items')
    .select('*', { count: 'exact', head: true })
    .eq('zone_id', zoneId)

  if (error) throw error
  return count || 0
}
