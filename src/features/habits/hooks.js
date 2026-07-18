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

export function useHabits() {
  return useQuery({
    queryKey: habitsQueryKeys.all,
    queryFn: getHabits,
  })
}

export function useHabit(id) {
  return useQuery({
    queryKey: habitsQueryKeys.byId(id),
    queryFn: () => getHabitById(id),
    enabled: !!id,
  })
}

export function useCreateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createHabit,
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
    mutationFn: ({ id, updates }) => updateHabit(id, updates),
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
    mutationFn: deleteHabit,
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
    mutationFn: ({ id, date }) => toggleHabitCompletion(id, date),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: habitsQueryKeys.all,
      })
    },
  })
}
