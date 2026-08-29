import { supabase } from '../../lib/supabase.js'

export const habitsQueryKeys = {
  all: ['habits'],
  byId: (id) => ['habits', id],
}

// Helper: get today's date in YYYY-MM-DD format (local timezone)
function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

// Helper: get day of week (1=lunes, 7=domingo) from date string
function getDayOfWeek(dateStr) {
  const date = new Date(dateStr)
  const day = date.getDay()
  // Convert JS day (0=Sunday, 6=Saturday) to our format (1=Monday, 7=Sunday)
  return day === 0 ? 7 : day
}

// Calculate streak from history (client-side calculation)
export function calculateStreak(habit) {
  const today = getTodayDate()
  const history = habit.historial || []
  const historySet = new Set(history)
  
  let streak = 0
  let currentDate = new Date(today)
  
  // Check if today is completed
  const todayCompleted = historySet.has(today)
  
  // If today is not completed, start checking from yesterday
  if (!todayCompleted) {
    currentDate.setDate(currentDate.getDate() - 1)
  }
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayOfWeek = getDayOfWeek(dateStr)
    
    if (habit.frecuencia === 'diario') {
      // Any unmarked day breaks the streak
      if (historySet.has(dateStr)) {
        streak++
      } else {
        break
      }
    } else if (habit.frecuencia === 'semanal') {
      const scheduledDays = habit.dias_semana || []
      // Check if this day is scheduled
      if (scheduledDays.includes(dayOfWeek)) {
        // Scheduled day without completion breaks the streak
        if (historySet.has(dateStr)) {
          streak++
        } else {
          break
        }
      }
      // Non-scheduled day: skip (doesn't count or break streak)
    }
    
    currentDate.setDate(currentDate.getDate() - 1)
    
    // Safety: don't loop forever (max 365 days)
    if (streak > 365) break
  }
  
  return streak
}

export async function getHabits() {
  const { data, error } = await supabase
    .from('habits')
    .select('id, user_id, nombre, frecuencia, dias_semana, racha, historial')
    .order('nombre', { ascending: true })

  if (error) throw error
  return data
}

export async function getHabitById(id) {
  const { data, error } = await supabase
    .from('habits')
    .select('id, user_id, nombre, frecuencia, dias_semana, racha, historial')
    .eq('id', id)
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export async function createHabit(habit) {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      nombre: habit.nombre,
      frecuencia: habit.frecuencia,
      dias_semana: habit.dias_semana || [],
      racha: 0,
      historial: [],
    })
    .select('id, user_id, nombre, frecuencia, dias_semana, racha, historial')
    .single()

  if (error) throw error
  return data
}

export async function updateHabit(id, updates) {
  const { data, error } = await supabase
    .from('habits')
    .update({
      nombre: updates.nombre,
      frecuencia: updates.frecuencia,
      dias_semana: updates.dias_semana,
    })
    .eq('id', id)
    .select('id, user_id, nombre, frecuencia, dias_semana, racha, historial')
    .single()

  if (error) throw error
  return data
}

export async function deleteHabit(id) {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function toggleHabitCompletion(id, date) {
  // First get current habit
  const habit = await getHabitById(id)
  const history = habit.historial || []
  const historySet = new Set(history)
  
  let newHistory
  if (historySet.has(date)) {
    // Remove date from history (unmark)
    newHistory = history.filter(d => d !== date)
  } else {
    // Add date to history (mark)
    newHistory = [...history, date].sort()
  }
  
  // Calculate new streak
  const newStreak = calculateStreak({ ...habit, historial: newHistory })
  
  // Update habit
  const { data, error } = await supabase
    .from('habits')
    .update({
      historial: newHistory,
      racha: newStreak,
    })
    .eq('id', id)
    .select('id, user_id, nombre, frecuencia, dias_semana, racha, historial')
    .single()

  if (error) throw error
  return data
}
