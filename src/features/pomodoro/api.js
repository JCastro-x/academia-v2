import { supabase } from '../../lib/supabase';

export const pomodoroQueryKeys = {
  all: ['pomodoro_sessions'],
  byDate: (startDate, endDate) => ['pomodoro_sessions', 'date', startDate, endDate],
  byTask: (taskId) => ['pomodoro_sessions', 'task', taskId],
  bySubject: (subjectId) => ['pomodoro_sessions', 'subject', subjectId],
  byId: (id) => ['pomodoro_sessions', id],
};

/**
 * Calcula estadísticas de racha de Pomodoro en cliente
 * @param {Array} sessions - Array de sesiones de pomodoro
 * @returns {Object} { streakDays, todaySessions, weekMinutes, todayMinutes }
 */
export function calculatePomodoroStats(sessions) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  // Filtrar sesiones de los últimos 7 días
  const recentSessions = sessions.filter(s => new Date(s.started_at) >= weekAgo);
  
  // Calcular minutos de esta semana
  const weekMinutes = recentSessions.reduce((sum, s) => sum + (s.duration_min || 0), 0);
  
  // Calcular minutos de hoy
  const todaySessions = sessions.filter(s => {
    const sessionDate = new Date(s.started_at);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === today.getTime();
  });
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.duration_min || 0), 0);
  
  // Calcular racha de días (días consecutivos con al menos una sesión de trabajo)
  const workSessions = sessions.filter(s => s.tipo === 'trabajo');
  const uniqueDays = new Set(workSessions.map(s => {
    const date = new Date(s.started_at);
    return date.toISOString().split('T')[0];
  }));
  
  let streakDays = 0;
  const checkDate = new Date(today);
  
  while (uniqueDays.has(checkDate.toISOString().split('T')[0])) {
    streakDays++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  return {
    streakDays,
    todaySessions: todaySessions.length,
    weekMinutes,
    todayMinutes,
  };
}

/**
 * Obtiene sesiones de pomodoro por rango de fechas
 */
export async function getPomodoroSessionsByDate(startDate, endDate) {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('id, user_id, started_at, ended_at, duration_min, tipo, task_id, subject_id')
    .gte('started_at', startDate)
    .lte('started_at', endDate)
    .order('started_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

/**
 * Obtiene sesiones de pomodoro por tarea
 */
export async function getPomodoroSessionsByTask(taskId) {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('id, user_id, started_at, ended_at, duration_min, tipo, task_id, subject_id')
    .eq('task_id', taskId)
    .order('started_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

/**
 * Obtiene sesiones de pomodoro por materia
 */
export async function getPomodoroSessionsBySubject(subjectId) {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('id, user_id, started_at, ended_at, duration_min, tipo, task_id, subject_id')
    .eq('subject_id', subjectId)
    .order('started_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

/**
 * Obtiene una sesión de pomodoro por ID
 */
export async function getPomodoroSessionById(id) {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('id, user_id, started_at, ended_at, duration_min, tipo, task_id, subject_id')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Crea una sesión de pomodoro
 */
export async function createPomodoroSession(session) {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .insert({
      id: session.id,
      started_at: session.started_at,
      ended_at: session.ended_at,
      duration_min: session.duration_min,
      tipo: session.tipo,
      task_id: session.task_id || null,
      subject_id: session.subject_id || null,
    })
    .select('id, user_id, started_at, ended_at, duration_min, tipo, task_id, subject_id')
    .single();
  
  if (error) throw error;
  return data;
}

export async function schedulePomodoroNotification(sessionId, phase, scheduledAtISO) {
  const { data, error } = await supabase.functions.invoke('pomodoro-schedule', {
    body: {
      action: 'schedule',
      session_id: sessionId,
      phase,
      scheduled_at: scheduledAtISO,
    },
  });

  if (error) throw error;
  return data;
}

export async function cancelPomodoroNotification(sessionId) {
  const { data, error } = await supabase.functions.invoke('pomodoro-schedule', {
    body: {
      action: 'cancel',
      session_id: sessionId,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Elimina una sesión de pomodoro
 */
export async function deletePomodoroSession(id) {
  const { error } = await supabase
    .from('pomodoro_sessions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
