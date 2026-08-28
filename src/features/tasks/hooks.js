import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTasks,
  getPendingTasks,
  getTasksBySubject,
  getTaskById,
  createTask,
  updateTask,
  toggleTaskDone,
  deleteTask,
  deleteCompletedTasks,
  countTasksBySubject,
  incrementTaskLogUnit,
  tasksQueryKeys,
} from './api.js'

export function useTasks(semesterId) {
  return useQuery({
    queryKey: tasksQueryKeys.bySemester(semesterId),
    queryFn: () => getTasks(semesterId),
    enabled: !!semesterId,
  })
}

export function usePendingTasks(semesterId) {
  return useQuery({
    queryKey: tasksQueryKeys.pending(semesterId),
    queryFn: () => getPendingTasks(semesterId),
    enabled: !!semesterId,
  })
}

export function useTasksBySubject(subjectId) {
  return useQuery({
    queryKey: tasksQueryKeys.bySubject(subjectId),
    queryFn: () => getTasksBySubject(subjectId),
    enabled: !!subjectId,
  })
}

export function useTask(id) {
  return useQuery({
    queryKey: tasksQueryKeys.byId(id),
    queryFn: () => getTaskById(id),
    enabled: !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.bySemester(data.semester_id) })
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.pending(data.semester_id) })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }) => updateTask(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.byId(data.id) })
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.bySemester(data.semester_id) })
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.pending(data.semester_id) })
    },
  })
}

export function useToggleTaskDone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, done }) => toggleTaskDone(id, done),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.byId(data.id) })
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.bySemester(data.semester_id) })
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.pending(data.semester_id) })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.all })
    },
  })
}

export function useDeleteCompletedTasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCompletedTasks,
    onSuccess: (_, semesterId) => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.bySemester(semesterId) })
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.pending(semesterId) })
    },
  })
}

export function useCountTasksBySubject(subjectId) {
  return useQuery({
    queryKey: ['tasks', 'count', 'subject', subjectId],
    queryFn: () => countTasksBySubject(subjectId),
    enabled: !!subjectId,
  })
}

export function useIncrementTaskLogUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, dateStr, delta }) => incrementTaskLogUnit(taskId, dateStr, delta),
    onMutate: async ({ taskId, dateStr, delta }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tasksQueryKeys.byId(taskId) })

      // Snapshot previous value
      const previousTask = queryClient.getQueryData(tasksQueryKeys.byId(taskId))

      // Optimistically update cache
      queryClient.setQueryData(tasksQueryKeys.byId(taskId), (old) => {
        if (!old) return old

        const log = old.log || {}
        const currentValue = Number(log[dateStr]) || 0
        const newValue = currentValue + delta

        // Capping: prevent negative values
        const cappedValue = Math.max(0, newValue)

        // Calculate totalDone for capping against total_units
        const totalDone = Object.keys(log).reduce((sum, k) => sum + (Number(log[k]) || 0), 0)
        const totalUnits = Number(old.total_units) || 0

        // Capping: prevent exceeding total_units (if defined)
        const totalDoneWithNewValue = totalDone - currentValue + cappedValue
        const finalValue = totalUnits > 0 && totalDoneWithNewValue > totalUnits
          ? cappedValue - (totalDoneWithNewValue - totalUnits)
          : cappedValue

        // Update log with new value
        const updatedLog = { ...log }
        if (finalValue === 0) {
          delete updatedLog[dateStr]
        } else {
          updatedLog[dateStr] = finalValue
        }

        return {
          ...old,
          log: updatedLog,
          updated_at: new Date().toISOString()
        }
      })

      // Return context with previous task for rollback
      return { previousTask, taskId }
    },
    onError: (error, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousTask) {
        queryClient.setQueryData(tasksQueryKeys.byId(context.taskId), context.previousTask)
      }
    },
    onSuccess: (data) => {
      // Update cache with server-confirmed data
      queryClient.setQueryData(tasksQueryKeys.byId(data.id), data)
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.bySemester(data.semester_id) })
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.pending(data.semester_id) })
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success to ensure consistency
      if (data) {
        queryClient.invalidateQueries({ queryKey: tasksQueryKeys.byId(data.id) })
      }
    },
  })
}
