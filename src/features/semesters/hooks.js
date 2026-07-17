import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSemesters,
  getActiveSemester,
  getSemesterById,
  createSemester,
  updateSemester,
  deleteSemester,
  setActiveSemester,
  semestersQueryKeys,
} from './api.js'

export const useSemesters = () => {
  return useQuery({
    queryKey: semestersQueryKeys.all,
    queryFn: getSemesters,
  })
}

export const useActiveSemester = () => {
  return useQuery({
    queryKey: semestersQueryKeys.active(),
    queryFn: getActiveSemester,
  })
}

export const useSemester = (id) => {
  return useQuery({
    queryKey: semestersQueryKeys.byId(id),
    queryFn: () => getSemesterById(id),
    enabled: !!id,
  })
}

export const useCreateSemester = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createSemester,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: semestersQueryKeys.all })
      queryClient.setQueryData(semestersQueryKeys.byId(data.id), data)
    },
  })
}

export const useUpdateSemester = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }) => updateSemester(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: semestersQueryKeys.all })
      queryClient.setQueryData(semestersQueryKeys.byId(data.id), data)
    },
  })
}

export const useDeleteSemester = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteSemester,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: semestersQueryKeys.all })
      queryClient.removeQueries({ queryKey: semestersQueryKeys.byId(id) })
    },
  })
}

export const useSetActiveSemester = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: setActiveSemester,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: semestersQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: semestersQueryKeys.active() })
    },
  })
}
