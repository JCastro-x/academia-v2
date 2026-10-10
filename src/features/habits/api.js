import { supabase } from '../../lib/supabase.js'
import {
  parseLocalDate,
  toLocalDateString,
  getDayOfWeek,
  addDays,
  daysBetween,
  isToday,
  isFuture,
  compareDates,
  getWeekRange,
  getMonthRange,
  getTodayDate,
  getMondayOfCurrentWeek,
} from '../../lib/date-utils.js'

async function getAuthenticatedUserId() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('Se requiere una sesión autenticada para sincronizar hábitos')
  return user.id
}

function toStableUuid(value) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then((hash) => {
    const bytes = Array.from(new Uint8Array(hash).slice(0, 16))
    bytes[6] = (bytes[6] & 0x0f) | 0x50
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = bytes.map(byte => byte.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  })
}

export const habitsQueryKeys = {
  all: ['habits'],
  byId: (id) => ['habits', id],
  programaciones: ['programaciones_habito'],
  logs: ['habit_logs'],
  pauseDays: ['dias_pausa'],
  config: ['app_config'],
}

// =====================================================
// OBTENER PROGRAMACIÓN VIGENTE
// =====================================================

export function getProgramacionVigente(habit, fecha, programaciones) {
  // Buscar la programación más reciente con vigente_desde <= fecha
  const prog = programaciones
    .filter(p => p.habit_id === habit.id && p.vigente_desde <= fecha)
    .sort((a, b) => compareDates(b.vigente_desde, a.vigente_desde))[0]

  return prog || null
}

// =====================================================
// ESTADO DE UN DÍA
// =====================================================

export function getEstado(habit, fecha, logs, programaciones, pauseDays, config) {
  // Verificar si es futuro
  if (isFuture(fecha)) {
    return 'futuro'
  }

  // Buscar log explícito
  const log = logs.find(l => l.habit_id === habit.id && l.fecha === fecha)

  if (log) {
    return log.estado // cumplido, fallado, parcial
  }

  // Si no hay log, verificar si es hábito de evitar
  const prog = getProgramacionVigente(habit, fecha, programaciones)
  if (prog?.tipo === 'evitar') {
    // Cumplido por defecto en días cerrados (no depende de ventana)
    return 'cumplido' // Derivado
  }

  // Sin log: pendiente dentro de ventana, sin_registro fuera
  const diasDesdeHoy = daysBetween(fecha, getTodayDate())
  const ventanaEdicion = config?.ventana_edicion_dias || 7

  if (diasDesdeHoy >= 0 && diasDesdeHoy <= ventanaEdicion) {
    return 'pendiente'
  }

  return 'sin_registro'
}

// =====================================================
// DÍA APLICA PARA EL HÁBITO
// =====================================================

export function isDayApplicable(habit, fecha, programaciones, pauseDays) {
  // Pausa: no aplica
  if (pauseDays.some(p => p.fecha === fecha)) {
    return false
  }

  const prog = getProgramacionVigente(habit, fecha, programaciones)
  if (!prog) return false

  const dayOfWeek = getDayOfWeek(fecha)

  switch (prog.tipo) {
    case 'dias_fijos':
      // Si está en días programados, aplica
      if (prog.dias_semana.includes(dayOfWeek)) {
        return true
      }
      // Si es weekend plus y es sábado/domingo, también aplica
      if (prog.permitir_finde_plus && (dayOfWeek === 6 || dayOfWeek === 7)) {
        return true
      }
      return false

    case 'meta_semanal':
    case 'evitar':
      return true

    case 'periodico':
      const vigencia = prog.vigente_desde
      const semanasDesdeVigencia = Math.floor(daysBetween(vigencia, fecha) / 7)
      const esSemanaActiva = semanasDesdeVigencia % prog.periodo_semanas === 0
      // Solo marcable en el día sugerido de la semana activa
      if (!esSemanaActiva) return false
      if (prog.dias_sugeridos && prog.dias_sugeridos.length > 0) {
        return prog.dias_sugeridos.includes(dayOfWeek)
      }
      return true
  }
}

export function isDayGrayed(habit, fecha, programaciones, pauseDays) {
  const prog = getProgramacionVigente(habit, fecha, programaciones)
  if (!prog) return false

  if (prog.tipo === 'dias_fijos') {
    const dayOfWeek = getDayOfWeek(fecha)
    return !prog.dias_semana.includes(dayOfWeek) && 
           !(prog.permitir_finde_plus && (dayOfWeek === 6 || dayOfWeek === 7))
  }

  return false
}

// =====================================================
// WEEKEND PLUS
// =====================================================

export function isWeekendPlus(habit, fecha, programaciones) {
  const prog = getProgramacionVigente(habit, fecha, programaciones)
  if (!prog || !prog.permitir_finde_plus) return false

  const dayOfWeek = getDayOfWeek(fecha)
  return dayOfWeek === 6 || dayOfWeek === 7 // Sábado o domingo
}

// =====================================================
// DÍA SUGERIDO (META SEMANAL / PERIÓDICO)
// =====================================================

export function isDaySugerido(habit, fecha, programaciones) {
  const prog = getProgramacionVigente(habit, fecha, programaciones)
  if (!prog || !prog.dias_sugeridos) return false

  const dayOfWeek = getDayOfWeek(fecha)
  return prog.dias_sugeridos.includes(dayOfWeek)
}

// =====================================================
// VALOR NUMÉRICO DEL ESTADO
// =====================================================

export function getEstadoValor(estado) {
  switch (estado) {
    case 'cumplido': return 1
    case 'parcial': return 0.5
    case 'fallado': return 0
    case 'pendiente': return null // No cuenta
    case 'sin_registro': return null // No cuenta
    case 'futuro': return null // No cuenta
  }
}

// =====================================================
// API CALLS
// =====================================================

export async function getHabits() {
  const { data, error } = await supabase
    .from('habits')
    .select('id, user_id, nombre, momento_dia, version_minima, archivado, fecha_archivado')
    .order('nombre', { ascending: true })

  if (error) throw error
  return data
}

export async function getHabitById(id) {
  const { data, error } = await supabase
    .from('habits')
    .select('id, user_id, nombre, momento_dia, version_minima, archivado, fecha_archivado')
    .eq('id', id)
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export async function getProgramaciones(habitId = null) {
  let query = supabase
    .from('programaciones_habito')
    .select('*')
    .order('vigente_desde', { ascending: false })

  if (habitId) {
    query = query.eq('habit_id', habitId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getHabitLogs(habitId = null, startDate = null, endDate = null) {
  let query = supabase
    .from('habit_logs')
    .select('*')
    .order('fecha', { ascending: true })

  if (habitId) {
    query = query.eq('habit_id', habitId)
  }

  if (startDate) {
    query = query.gte('fecha', startDate)
  }

  if (endDate) {
    query = query.lte('fecha', endDate)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getPauseDays(userId = null, startDate = null, endDate = null) {
  let query = supabase
    .from('dias_pausa')
    .select('*')
    .order('fecha', { ascending: true })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  if (startDate) {
    query = query.gte('fecha', startDate)
  }

  if (endDate) {
    query = query.lte('fecha', endDate)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getAppConfig(userId) {
  const { data, error } = await supabase
    .from('app_config')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export async function createHabit(habit) {
  const userId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      nombre: habit.nombre,
      momento_dia: habit.momento_dia || 'manana',
      version_minima: habit.version_minima || null,
    })
    .select('id, user_id, nombre, momento_dia, version_minima, archivado, fecha_archivado')
    .single()

  if (error) throw error

  // Crear programación inicial (empieza el lunes de la semana actual)
  // Si falla, hacer rollback borrando el hábito
  if (habit.programacion) {
    try {
      await createProgramacion({
        habit_id: data.id,
        ...habit.programacion,
        vigente_desde: getMondayOfCurrentWeek(), // Lunes de la semana actual
      })
    } catch (progError) {
      const { error: rollbackError } = await supabase
        .from('habits')
        .delete()
        .eq('id', data.id)
        .eq('user_id', userId)
      if (rollbackError) {
        throw new AggregateError([progError, rollbackError], 'Falló la programación y también el rollback del hábito')
      }
      throw progError
    }
  }

  return data
}

export async function updateHabit(id, updates) {
  const userId = await getAuthenticatedUserId()
  const { data: previousHabit, error: previousHabitError } = await supabase
    .from('habits')
    .select('id, user_id, nombre, momento_dia, version_minima, archivado, fecha_archivado')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (previousHabitError) throw previousHabitError

  let changedTodayProgramacion = null
  let createdProgramacion = null
  if (updates.programacion) {
    const today = getTodayDate()
    const { data: existingToday, error: existingError } = await supabase
      .from('programaciones_habito')
      .select('*')
      .eq('habit_id', id)
      .eq('vigente_desde', today)
      .maybeSingle()

    if (existingError) throw existingError

    if (existingToday) {
      const { error } = await supabase
        .from('programaciones_habito')
        .update({
          tipo: updates.programacion.tipo,
          dias_semana: updates.programacion.dias_semana || [],
          meta_semanal: updates.programacion.meta_semanal || null,
          periodo_semanas: updates.programacion.periodo_semanas || null,
          dias_sugeridos: updates.programacion.dias_sugeridos || [],
          permitir_finde_plus: updates.programacion.permitir_finde_plus || false,
          tolerar_rojo_aislado: updates.programacion.tolerar_rojo_aislado || false,
        })
        .eq('id', existingToday.id)
        .select('id')
        .single()
      if (error) throw error
      changedTodayProgramacion = existingToday
    } else {
      createdProgramacion = await createProgramacion({
        habit_id: id,
        ...updates.programacion,
        vigente_desde: today,
      })
    }
  }

  const habitUpdates = {}
  for (const field of ['nombre', 'momento_dia', 'version_minima', 'archivado']) {
    if (Object.hasOwn(updates, field)) habitUpdates[field] = updates[field]
  }
  if (Object.hasOwn(updates, 'archivado')) {
    habitUpdates.fecha_archivado = updates.archivado ? getTodayDate() : null
  }

  try {
    if (Object.keys(habitUpdates).length === 0) return previousHabit
    const { data, error } = await supabase
      .from('habits')
      .update(habitUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, user_id, nombre, momento_dia, version_minima, archivado, fecha_archivado')
      .single()

    if (error) throw error
    return data
  } catch (updateError) {
    let rollbackError = null
    if (changedTodayProgramacion) {
      const { error } = await supabase
        .from('programaciones_habito')
        .update({
          tipo: changedTodayProgramacion.tipo,
          dias_semana: changedTodayProgramacion.dias_semana,
          meta_semanal: changedTodayProgramacion.meta_semanal,
          periodo_semanas: changedTodayProgramacion.periodo_semanas,
          dias_sugeridos: changedTodayProgramacion.dias_sugeridos,
          permitir_finde_plus: changedTodayProgramacion.permitir_finde_plus,
          tolerar_rojo_aislado: changedTodayProgramacion.tolerar_rojo_aislado,
        })
        .eq('id', changedTodayProgramacion.id)
      rollbackError = error
    } else if (createdProgramacion) {
      const { error } = await supabase
        .from('programaciones_habito')
        .delete()
        .eq('id', createdProgramacion.id)
      rollbackError = error
    }
    if (rollbackError) {
      throw new AggregateError([updateError, rollbackError], 'Falló la edición y también el rollback de la programación')
    }
    throw updateError
  }
}

export async function deleteHabit(id) {
  const userId = await getAuthenticatedUserId()
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  // Foreign keys in the habits schema cascade to schedules and logs.
  if (error) throw error
}

export async function createProgramacion(programacion) {
  const { data, error } = await supabase
    .from('programaciones_habito')
    .insert({
      habit_id: programacion.habit_id,
      tipo: programacion.tipo,
      dias_semana: programacion.dias_semana || [],
      meta_semanal: programacion.meta_semanal || null,
      periodo_semanas: programacion.periodo_semanas || null,
      dias_sugeridos: programacion.dias_sugeridos || [],
      permitir_finde_plus: programacion.permitir_finde_plus || false,
      tolerar_rojo_aislado: programacion.tolerar_rojo_aislado || false,
      vigente_desde: programacion.vigente_desde || getTodayDate(),
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateHabitLog(habitId, fecha, estado) {
  await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('habit_logs')
    .upsert({
      habit_id: habitId,
      fecha,
      estado,
    }, { onConflict: 'habit_id,fecha' })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteHabitLog(habitId, fecha) {
  await getAuthenticatedUserId()
  const { error } = await supabase
    .from('habit_logs')
    .delete()
    .eq('habit_id', habitId)
    .eq('fecha', fecha)

  if (error) throw error
}

export async function createPauseDay(userId, fecha, motivo = null) {
  const authenticatedUserId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('dias_pausa')
    .insert({
      user_id: authenticatedUserId,
      fecha,
      motivo,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deletePauseDay(userId, fecha) {
  const authenticatedUserId = await getAuthenticatedUserId()
  const { error } = await supabase
    .from('dias_pausa')
    .delete()
    .eq('user_id', authenticatedUserId)
    .eq('fecha', fecha)

  if (error) throw error
}

export async function upsertAppConfig(userId, config) {
  const authenticatedUserId = await getAuthenticatedUserId()
  const { data, error } = await supabase
    .from('app_config')
    .upsert({
      user_id: authenticatedUserId,
      ventana_edicion_dias: config.ventana_edicion_dias || 7,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function seedHabitsIfEmpty(initialHabits) {
  const userId = await getAuthenticatedUserId()
  const { data: existingHabits, error: existingError } = await supabase
    .from('habits')
    .select('id')
    .limit(1)

  if (existingError) throw existingError
  if (existingHabits.length > 0) return false

  const seedHabits = initialHabits.filter(habit => !habit.nombre.startsWith('Demo:'))
  const habitRows = await Promise.all(seedHabits.map(async (habit) => ({
    id: await toStableUuid(`${userId}:habit-seed:${habit.nombre}`),
    user_id: userId,
    nombre: habit.nombre,
    momento_dia: habit.momento_dia || 'manana',
    version_minima: habit.version_minima || null,
    archivado: false,
    fecha_archivado: null,
  })))
  const programacionRows = await Promise.all(seedHabits.map(async (habit, index) => ({
    id: await toStableUuid(`${userId}:habit-seed-programacion:${habit.nombre}`),
    habit_id: habitRows[index].id,
    tipo: habit.programacion.tipo,
    dias_semana: habit.programacion.dias_semana || [],
    meta_semanal: habit.programacion.meta_semanal || null,
    periodo_semanas: habit.programacion.periodo_semanas || null,
    dias_sugeridos: habit.programacion.dias_sugeridos || [],
    permitir_finde_plus: habit.programacion.permitir_finde_plus || false,
    tolerar_rojo_aislado: habit.programacion.tolerar_rojo_aislado || false,
    vigente_desde: getMondayOfCurrentWeek(),
  })))

  const { error: habitsError } = await supabase
    .from('habits')
    .upsert(habitRows, { onConflict: 'id' })
  if (habitsError) throw habitsError

  const { error: programacionesError } = await supabase
    .from('programaciones_habito')
    .upsert(programacionRows, { onConflict: 'id' })
  if (programacionesError) throw programacionesError

  return true
}
