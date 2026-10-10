import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getHabits,
  getHabitById,
  getProgramaciones,
  getHabitLogs,
  getPauseDays,
  getAppConfig,
  createHabit,
  updateHabit,
  deleteHabit,
  createProgramacion,
  updateHabitLog,
  deleteHabitLog,
  createPauseDay,
  deletePauseDay,
  upsertAppConfig,
  habitsQueryKeys,
} from './api.js'

// CONSTANT: Usar localStorage por defecto (Supabase desactivado por ahora)
const USAR_SUPABASE_HABITOS = false

const isGuestMode = () => USAR_SUPABASE_HABITOS === false

// Para guest mode, mantenemos localStorage temporal
const getGuestHabits = () => {
  const data = localStorage.getItem('guest-habits-v2')
  return data ? JSON.parse(data) : []
}

const saveGuestHabits = (habits) => {
  localStorage.setItem('guest-habits-v2', JSON.stringify(habits))
}

let guestIdCounter = 0
const generateGuestId = () => {
  guestIdCounter++
  return `guest-${guestIdCounter}-${Date.now()}`
}

const getGuestProgramaciones = () => {
  const data = localStorage.getItem('guest-programaciones')
  return data ? JSON.parse(data) : []
}

const saveGuestProgramaciones = (programaciones) => {
  localStorage.setItem('guest-programaciones', JSON.stringify(programaciones))
}

export function useHabits() {
  return useQuery({
    queryKey: habitsQueryKeys.all,
    queryFn: () => {
      if (isGuestMode()) {
        return getGuestHabits()
      }
      return getHabits()
    },
  })
}

export function useHabit(id) {
  return useQuery({
    queryKey: habitsQueryKeys.byId(id),
    queryFn: () => {
      if (isGuestMode()) {
        const habits = getGuestHabits()
        return habits.find(h => h.id === id) || null
      }
      return getHabitById(id)
    },
    enabled: !!id,
  })
}

export function useProgramaciones(habitId = null) {
  return useQuery({
    queryKey: [...habitsQueryKeys.programaciones, habitId],
    queryFn: () => {
      if (isGuestMode()) {
        const programaciones = getGuestProgramaciones()
        if (habitId) {
          return programaciones.filter(p => p.habit_id === habitId)
        }
        return programaciones
      }
      return getProgramaciones(habitId)
    },
  })
}

export function useHabitLogs(habitId = null, startDate = null, endDate = null) {
  return useQuery({
    queryKey: [...habitsQueryKeys.logs, habitId, startDate, endDate],
    queryFn: () => {
      if (isGuestMode()) {
        const logsKey = 'guest-habit-logs'
        const logs = JSON.parse(localStorage.getItem(logsKey) || '[]')
        if (habitId) {
          return logs.filter(l => l.habit_id === habitId)
        }
        return logs
      }
      return getHabitLogs(habitId, startDate, endDate)
    },
  })
}

export function usePauseDays(userId = null, startDate = null, endDate = null) {
  return useQuery({
    queryKey: [...habitsQueryKeys.pauseDays, userId, startDate, endDate],
    queryFn: () => getPauseDays(userId, startDate, endDate),
    enabled: !isGuestMode() && !!userId,
  })
}

export function useAppConfig(userId) {
  return useQuery({
    queryKey: [...habitsQueryKeys.config, userId],
    queryFn: () => {
      if (isGuestMode()) {
        const configKey = 'guest-app-config'
        const config = JSON.parse(localStorage.getItem(configKey) || '{}')
        return config || { ventana_edicion_dias: 7 }
      }
      return getAppConfig(userId)
    },
  })
}

export function useCreateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (habit) => {
      if (isGuestMode()) {
        const habits = getGuestHabits()
        const newHabit = {
          ...habit,
          id: generateGuestId(),
          user_id: 'guest',
          archivado: false,
          fecha_archivado: null,
        }
        saveGuestHabits([...habits, newHabit])
        
        // Guardar programación en guest mode
        if (habit.programacion) {
          const programaciones = getGuestProgramaciones()
          const newProgramacion = {
            id: `prog-${guestIdCounter}-${Date.now()}`,
            habit_id: newHabit.id,
            ...habit.programacion,
          }
          saveGuestProgramaciones([...programaciones, newProgramacion])
        }
        
        return newHabit
      }
      return createHabit(habit)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: habitsQueryKeys.all,
      })
      queryClient.invalidateQueries({
        queryKey: habitsQueryKeys.programaciones,
      })
    },
  })
}

export function useUpdateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      if (isGuestMode()) {
        const habits = getGuestHabits()
        const currentHabit = habits.find(h => h.id === id)
        if (!currentHabit) throw new Error('Habit not found')

        const updatedHabits = habits.map(h =>
          h.id === id ? { ...h, ...updates } : h
        )
        saveGuestHabits(updatedHabits)
        return updatedHabits.find(h => h.id === id)
      }
      return updateHabit(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: habitsQueryKeys.all,
      })
    },
  })
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      if (isGuestMode()) {
        const habits = getGuestHabits()
        const updatedHabits = habits.filter(h => h.id !== id)
        saveGuestHabits(updatedHabits)
        return id
      }
      return deleteHabit(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: habitsQueryKeys.all,
      })
    },
  })
}

export function useUpdateHabitLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ habitId, fecha, estado }) => {
      if (isGuestMode()) {
        // Guest mode: mantener logs en localStorage
        const logsKey = 'guest-habit-logs'
        const logs = JSON.parse(localStorage.getItem(logsKey) || '[]')
        
        const existingIndex = logs.findIndex(l => l.habit_id === habitId && l.fecha === fecha)
        
        if (estado === null) {
          // Borrar
          const newLogs = logs.filter(l => !(l.habit_id === habitId && l.fecha === fecha))
          localStorage.setItem(logsKey, JSON.stringify(newLogs))
          return null
        }
        
        const log = {
          id: `log-${Date.now()}`,
          habit_id: habitId,
          fecha,
          estado,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        
        if (existingIndex >= 0) {
          logs[existingIndex] = log
        } else {
          logs.push(log)
        }
        
        localStorage.setItem(logsKey, JSON.stringify(logs))
        return log
      }
      
      if (estado === null) {
        return deleteHabitLog(habitId, fecha)
      }
      return updateHabitLog(habitId, fecha, estado)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: habitsQueryKeys.logs,
      })
    },
  })
}

export function useCreatePauseDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, fecha, motivo }) => {
      if (isGuestMode()) {
        const pauseDaysKey = 'guest-pause-days'
        const pauseDays = JSON.parse(localStorage.getItem(pauseDaysKey) || '[]')
        
        const pauseDay = {
          id: `pause-${Date.now()}`,
          user_id: userId,
          fecha,
          motivo,
        }
        
        pauseDays.push(pauseDay)
        localStorage.setItem(pauseDaysKey, JSON.stringify(pauseDays))
        return pauseDay
      }
      return createPauseDay(userId, fecha, motivo)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: habitsQueryKeys.pauseDays,
      })
    },
  })
}

export function useDeletePauseDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, fecha }) => {
      if (isGuestMode()) {
        const pauseDaysKey = 'guest-pause-days'
        const pauseDays = JSON.parse(localStorage.getItem(pauseDaysKey) || '[]')
        const newPauseDays = pauseDays.filter(p => !(p.user_id === userId && p.fecha === fecha))
        localStorage.setItem(pauseDaysKey, JSON.stringify(newPauseDays))
        return fecha
      }
      return deletePauseDay(userId, fecha)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: habitsQueryKeys.pauseDays,
      })
    },
  })
}

export function useUpsertAppConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, config }) => {
      if (isGuestMode()) {
        const configKey = 'guest-app-config'
        localStorage.setItem(configKey, JSON.stringify(config))
        return config
      }
      return upsertAppConfig(userId, config)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: habitsQueryKeys.config,
      })
    },
  })
}
