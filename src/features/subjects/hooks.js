import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  subjectsQueryKeys,
} from './api.js'
import { scheduleTableQueryKeys } from '../schedule-table/api.js'

export function useSubjects(semesterId) {
  return useQuery({
    queryKey: subjectsQueryKeys.bySemester(semesterId),
    queryFn: () => getSubjects(semesterId),
    enabled: !!semesterId,
  })
}

export function useSubject(id) {
  return useQuery({
    queryKey: subjectsQueryKeys.byId(id),
    queryFn: () => getSubjectById(id),
    enabled: !!id,
  })
}

export function useCreateSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSubject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: subjectsQueryKeys.bySemester(data.semester_id) })
    },
  })
}

export function useUpdateSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }) => updateSubject(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: subjectsQueryKeys.byId(data.id) })
      queryClient.invalidateQueries({ queryKey: subjectsQueryKeys.bySemester(data.semester_id) })
    },
  })
}

export function useDeleteSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteSubject,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: subjectsQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: scheduleTableQueryKeys.all })
    },
  })
}
