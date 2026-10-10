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
      return semanasDesdeVigencia % prog.periodo_semanas === 0
  }
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
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: habit.user_id,
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
      // Rollback: borrar el hábito si la programación falló
      await supabase.from('habits').delete().eq('id', data.id)
      throw progError
    }
  }

  return data
}

export async function updateHabit(id, updates) {
  const { data, error } = await supabase
    .from('habits')
    .update({
      nombre: updates.nombre,
      momento_dia: updates.momento_dia,
      version_minima: updates.version_minima,
      archivado: updates.archivado,
      fecha_archivado: updates.archivado ? getTodayDate() : null,
    })
    .eq('id', id)
    .select('id, user_id, nombre, momento_dia, version_minima, archivado, fecha_archivado')
    .single()

  if (error) throw error

  // Si hay cambios en programación, crear nueva versión (empieza hoy)
  if (updates.programacion) {
    try {
      await createProgramacion({
        habit_id: id,
        ...updates.programacion,
        vigente_desde: getTodayDate(), // Hoy al editar
      })
    } catch (progError) {
      // Rollback: revertir cambios al hábito si la programación falló
      // Nota: esto es simplificado, idealmente se debería guardar el estado anterior
      throw progError
    }
  }

  return data
}

export async function deleteHabit(id) {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)

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
  const { data, error } = await supabase
    .from('habit_logs')
    .upsert({
      habit_id: habitId,
      fecha,
      estado,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteHabitLog(habitId, fecha) {
  const { error } = await supabase
    .from('habit_logs')
    .delete()
    .eq('habit_id', habitId)
    .eq('fecha', fecha)

  if (error) throw error
}

export async function createPauseDay(userId, fecha, motivo = null) {
  const { data, error } = await supabase
    .from('dias_pausa')
    .insert({
      user_id: userId,
      fecha,
      motivo,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deletePauseDay(userId, fecha) {
  const { error } = await supabase
    .from('dias_pausa')
    .delete()
    .eq('user_id', userId)
    .eq('fecha', fecha)

  if (error) throw error
}

export async function upsertAppConfig(userId, config) {
  const { data, error } = await supabase
    .from('app_config')
    .upsert({
      user_id: userId,
      ventana_edicion_dias: config.ventana_edicion_dias || 7,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}
