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
import { getMondayOfCurrentWeek, compareDates, getTodayDate } from '../../lib/date-utils.js'

// CONSTANT: Usar localStorage por defecto (Supabase desactivado por ahora)
const USAR_SUPABASE_HABITOS = false

const isGuestMode = () => USAR_SUPABASE_HABITOS === false

const generateGuestId = () => {
  return crypto.randomUUID()
}

// Versionado de esquema para localStorage
const HABITS_SCHEMA_VERSION = 6
const HABITS_SCHEMA_KEY = 'guest-habits-schema-version'

// Para guest mode, mantenemos localStorage temporal
const getGuestHabits = () => {
  const data = localStorage.getItem('guest-habits-v2')
  return data ? JSON.parse(data) : []
}

const saveGuestHabits = (habits) => {
  localStorage.setItem('guest-habits-v2', JSON.stringify(habits))
}

const getGuestProgramaciones = () => {
  const data = localStorage.getItem('guest-programaciones')
  return data ? JSON.parse(data) : []
}

const saveGuestProgramaciones = (programaciones) => {
  localStorage.setItem('guest-programaciones', JSON.stringify(programaciones))
}

const migrateGuestSchema = () => {
  const currentVersion = parseInt(localStorage.getItem(HABITS_SCHEMA_KEY) || '0')
  
  if (currentVersion >= HABITS_SCHEMA_VERSION) return
  
  // Migración de versión 0 a 1: fix ids duplicados
  if (currentVersion < 1) {
    const habits = getGuestHabits()
    const programaciones = getGuestProgramaciones()
    
    const idSet = new Set()
    let hasDuplicates = false
    
    habits.forEach(h => {
      if (idSet.has(h.id)) {
        hasDuplicates = true
      }
      idSet.add(h.id)
    })
    
    if (hasDuplicates) {
      const newHabits = habits.map(h => ({
        ...h,
        id: idSet.has(h.id) ? generateGuestId() : h.id,
      }))
      saveGuestHabits(newHabits)
      
      const newProgramaciones = programaciones.map(p => {
        const newHabit = newHabits.find(h => h.nombre === habits.find(old => old.id === p.habit_id)?.nombre)
        return newHabit ? { ...p, habit_id: newHabit.id } : p
      })
      saveGuestProgramaciones(newProgramaciones)
    }
    
    localStorage.setItem(HABITS_SCHEMA_KEY, '1')
  }
  
  // Migración de versión 1 a 2: limpiar logs con fechas incorrectas (desfase de columnas)
  if (currentVersion < 2) {
    localStorage.removeItem('guest-habit-logs')
    localStorage.setItem(HABITS_SCHEMA_KEY, '2')
  }
  
  // Migración de versión 2 a 3: asegurar programaciones con vigente_desde correcto
  if (currentVersion < 3) {
    const programaciones = getGuestProgramaciones()
    const mondayOfCurrentWeek = getMondayOfCurrentWeek()
    
    const fixedProgramaciones = programaciones.map(p => ({
      ...p,
      vigente_desde: mondayOfCurrentWeek,
    }))
    
    saveGuestProgramaciones(fixedProgramaciones)
    localStorage.setItem(HABITS_SCHEMA_KEY, '3')
  }

  // Migración de versión 3 a 4: eliminar duplicados por nombre, conservar el con más logs
  if (currentVersion < 4) {
    const habits = getGuestHabits()
    const logs = JSON.parse(localStorage.getItem('guest-habit-logs') || '[]')
    
    // Agrupar por nombre
    const byName = {}
    habits.forEach(h => {
      if (!byName[h.nombre]) {
        byName[h.nombre] = []
      }
      byName[h.nombre].push(h)
    })
    
    // Para cada nombre con duplicados, conservar el que tenga más logs
    const habitsToKeep = []
    const idsToDelete = []
    
    Object.entries(byName).forEach(([nombre, habitList]) => {
      if (habitList.length > 1) {
        // Contar logs para cada duplicado
        const logCounts = habitList.map(h => logs.filter(l => l.habit_id === h.id).length)
        const maxLogs = Math.max(...logCounts)
        const indexToKeep = logCounts.indexOf(maxLogs)
        
        habitList.forEach((h, i) => {
          if (i === indexToKeep) {
            habitsToKeep.push(h)
          } else {
            idsToDelete.push(h.id)
          }
        })
      } else {
        habitsToKeep.push(habitList[0])
      }
    })
    
    // Eliminar logs de hábitos duplicados
    const filteredLogs = logs.filter(l => !idsToDelete.includes(l.habit_id))
    localStorage.setItem('guest-habit-logs', JSON.stringify(filteredLogs))
    
    // Guardar hábitos limpios
    saveGuestHabits(habitsToKeep)
    
    // Eliminar programaciones de hábitos duplicados
    const programaciones = getGuestProgramaciones()
    const filteredProgramaciones = programaciones.filter(p => !idsToDelete.includes(p.habit_id))
    saveGuestProgramaciones(filteredProgramaciones)
    
    localStorage.setItem(HABITS_SCHEMA_KEY, '4')
  }

  // Migración de versión 4 a 5: reparar hábitos sin programación y limpiar duplicados
  if (currentVersion < 5) {
    const habits = getGuestHabits()
    const programaciones = getGuestProgramaciones()
    const logs = JSON.parse(localStorage.getItem('guest-habit-logs') || '[]')
    const mondayOfCurrentWeek = getMondayOfCurrentWeek()
    
    // Limpiar duplicados por nombre
    const byName = {}
    habits.forEach(h => {
      if (!byName[h.nombre]) {
        byName[h.nombre] = []
      }
      byName[h.nombre].push(h)
    })
    
    const habitsToKeep = []
    const idsToDelete = []
    
    Object.entries(byName).forEach(([nombre, habitList]) => {
      if (habitList.length > 1) {
        const logCounts = habitList.map(h => logs.filter(l => l.habit_id === h.id).length)
        const maxLogs = Math.max(...logCounts)
        const indexToKeep = logCounts.indexOf(maxLogs)
        
        habitList.forEach((h, i) => {
          if (i === indexToKeep) {
            habitsToKeep.push(h)
          } else {
            idsToDelete.push(h.id)
          }
        })
      } else {
        habitsToKeep.push(habitList[0])
      }
    })
    
    // Reparar hábitos sin programación
    const habitsWithoutProg = habitsToKeep.filter(h => !programaciones.some(p => p.habit_id === h.id))
    
    if (habitsWithoutProg.length > 0) {
      const newProgramaciones = habitsWithoutProg.map(h => ({
        id: crypto.randomUUID(),
        habit_id: h.id,
        tipo: 'dias_fijos',
        dias_semana: [1, 2, 3, 4, 5],
        permitir_finde_plus: false,
        tolerar_rojo_aislado: false,
        vigente_desde: mondayOfCurrentWeek,
      }))
      
      saveGuestProgramaciones([...programaciones, ...newProgramaciones])
    }
    
    // Guardar estado limpio
    const filteredLogs = logs.filter(l => !idsToDelete.includes(l.habit_id))
    localStorage.setItem('guest-habit-logs', JSON.stringify(filteredLogs))
    saveGuestHabits(habitsToKeep)
    
    const filteredProgramaciones = programaciones.filter(p => !idsToDelete.includes(p.habit_id))
    saveGuestProgramaciones(filteredProgramaciones)
    
    localStorage.setItem(HABITS_SCHEMA_KEY, '5')
  }

  // Migración de versión 5 a 6: repetir limpieza para datos que ya pasaron por v5
  if (currentVersion < 6) {
    const habits = getGuestHabits()
    const programaciones = getGuestProgramaciones()
    const logs = JSON.parse(localStorage.getItem('guest-habit-logs') || '[]')
    const mondayOfCurrentWeek = getMondayOfCurrentWeek()
    
    // Limpiar duplicados por nombre
    const byName = {}
    habits.forEach(h => {
      if (!byName[h.nombre]) {
        byName[h.nombre] = []
      }
      byName[h.nombre].push(h)
    })
    
    const habitsToKeep = []
    const idsToDelete = []
    
    Object.entries(byName).forEach(([nombre, habitList]) => {
      if (habitList.length > 1) {
        const logCounts = habitList.map(h => logs.filter(l => l.habit_id === h.id).length)
        const maxLogs = Math.max(...logCounts)
        const indexToKeep = logCounts.indexOf(maxLogs)
        
        habitList.forEach((h, i) => {
          if (i === indexToKeep) {
            habitsToKeep.push(h)
          } else {
            idsToDelete.push(h.id)
          }
        })
      } else {
        habitsToKeep.push(habitList[0])
      }
    })
    
    // Reparar hábitos sin programación
    const habitsWithoutProg = habitsToKeep.filter(h => !programaciones.some(p => p.habit_id === h.id))
    
    if (habitsWithoutProg.length > 0) {
      const newProgramaciones = habitsWithoutProg.map(h => ({
        id: crypto.randomUUID(),
        habit_id: h.id,
        tipo: 'dias_fijos',
        dias_semana: [1, 2, 3, 4, 5],
        permitir_finde_plus: false,
        tolerar_rojo_aislado: false,
        vigente_desde: mondayOfCurrentWeek,
      }))
      
      saveGuestProgramaciones([...programaciones, ...newProgramaciones])
    }
    
    // Guardar estado limpio
    const filteredLogs = logs.filter(l => !idsToDelete.includes(l.habit_id))
    localStorage.setItem('guest-habit-logs', JSON.stringify(filteredLogs))
    saveGuestHabits(habitsToKeep)
    
    const filteredProgramaciones = programaciones.filter(p => !idsToDelete.includes(p.habit_id))
    saveGuestProgramaciones(filteredProgramaciones)
    
    localStorage.setItem(HABITS_SCHEMA_KEY, '6')
  }
}

// Ejecutar migración al cargar
migrateGuestSchema()

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
        const programaciones = getGuestProgramaciones()
        
        const newHabitId = generateGuestId()
        const newProgramacionId = crypto.randomUUID()
        
        const newHabit = {
          ...habit,
          id: newHabitId,
          user_id: 'guest',
          archivado: false,
          fecha_archivado: null,
        }
        
        const newProgramacion = habit.programacion ? {
          id: newProgramacionId,
          habit_id: newHabitId,
          ...habit.programacion,
        } : null
        
        // Armar en memoria, guardar todo al final (todo o nada)
        const newHabits = [...habits, newHabit]
        const newProgramaciones = newProgramacion 
          ? [...programaciones, newProgramacion]
          : programaciones
        
        saveGuestHabits(newHabits)
        saveGuestProgramaciones(newProgramaciones)
        
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
        const programaciones = getGuestProgramaciones()
        const currentHabit = habits.find(h => h.id === id)
        if (!currentHabit) throw new Error('Habit not found')

        const updatedHabits = habits.map(h =>
          h.id === id ? { ...h, ...updates } : h
        )
        saveGuestHabits(updatedHabits)

        // Manejar programación si se proporciona
        if (updates.programacion) {
          const today = getTodayDate()
          const existingToday = programaciones.find(
            p => p.habit_id === id && p.vigente_desde === today
          )

          if (existingToday) {
            // Reemplazar programación de hoy
            const updatedProgramaciones = programaciones.map(p =>
              p.id === existingToday.id
                ? { ...p, ...updates.programacion }
                : p
            )
            saveGuestProgramaciones(updatedProgramaciones)
          } else {
            // Crear nueva programación
            const newProgramacion = {
              id: crypto.randomUUID(),
              habit_id: id,
              ...updates.programacion,
              vigente_desde: today,
            }
            saveGuestProgramaciones([...programaciones, newProgramacion])
          }
        }

        return updatedHabits.find(h => h.id === id)
      }
      return updateHabit(id, updates)
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
