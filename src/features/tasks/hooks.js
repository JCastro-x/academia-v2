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
    onSuccess: (data) => {
      // Update cache with server-confirmed data (NOT optimistic update)
      queryClient.setQueryData(tasksQueryKeys.byId(data.id), data)
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.bySemester(data.semester_id) })
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.pending(data.semester_id) })
    },
  })
}
