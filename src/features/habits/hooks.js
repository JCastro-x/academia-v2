import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitCompletion,
  calculateStreak,
  habitsQueryKeys,
} from './api.js'

const isGuestMode = () => localStorage.getItem('academia-guest-mode') === 'true'

const getGuestHabits = () => {
  const data = localStorage.getItem('guest-habits')
  return data ? JSON.parse(data) : []
}

const saveGuestHabits = (habits) => {
  localStorage.setItem('guest-habits', JSON.stringify(habits))
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

export function useCreateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (habit) => {
      if (isGuestMode()) {
        const habits = getGuestHabits()
        const newHabit = {
          ...habit,
          id: `guest-${Date.now()}`,
          user_id: 'guest',
          racha: 0,
          historial: [],
        }
        saveGuestHabits([...habits, newHabit])
        return newHabit
      }
      return createHabit(habit)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: habitsQueryKeys.all,
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

        // Recalculate streak if dias_semana or frecuencia changes
        let newStreak = currentHabit.racha
        if (updates.dias_semana !== undefined || updates.frecuencia !== undefined) {
          const updatedHabit = {
            ...currentHabit,
            dias_semana: updates.dias_semana !== undefined ? updates.dias_semana : currentHabit.dias_semana,
            frecuencia: updates.frecuencia !== undefined ? updates.frecuencia : currentHabit.frecuencia,
          }
          newStreak = calculateStreak(updatedHabit)
        }

        const updatedHabits = habits.map(h =>
          h.id === id ? { ...h, ...updates, racha: newStreak } : h
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

export function useToggleHabitCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, date }) => {
      if (isGuestMode()) {
        const habits = getGuestHabits()
        const habit = habits.find(h => h.id === id)
        if (!habit) throw new Error('Habit not found')

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

        const updatedHabits = habits.map(h =>
          h.id === id ? { ...h, historial: newHistory, racha: newStreak } : h
        )
        saveGuestHabits(updatedHabits)
        return updatedHabits.find(h => h.id === id)
      }
      return toggleHabitCompletion(id, date)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: habitsQueryKeys.all,
      })
    },
  })
}
