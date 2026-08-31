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

const isGuestMode = () => localStorage.getItem('academia-guest-mode') === 'true'

const getGuestSemesters = () => {
  const data = localStorage.getItem('guest-semesters')
  return data ? JSON.parse(data) : []
}

const saveGuestSemesters = (semesters) => {
  localStorage.setItem('guest-semesters', JSON.stringify(semesters))
}

export const useSemesters = () => {
  return useQuery({
    queryKey: semestersQueryKeys.all,
    queryFn: () => {
      if (isGuestMode()) {
        return getGuestSemesters()
      }
      return getSemesters()
    },
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
    queryFn: () => {
      if (isGuestMode()) {
        const semesters = getGuestSemesters()
        return semesters.find(s => s.id === id) || null
      }
      return getSemesterById(id)
    },
    enabled: !!id,
  })
}

export const useCreateSemester = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (semesterData) => {
      if (isGuestMode()) {
        const semesters = getGuestSemesters()
        const newSemester = {
          ...semesterData,
          id: `guest-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        saveGuestSemesters([...semesters, newSemester])
        return newSemester
      }
      return createSemester(semesterData)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: semestersQueryKeys.all })
      queryClient.setQueryData(semestersQueryKeys.byId(data.id), data)
    },
  })
}

export const useUpdateSemester = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      if (isGuestMode()) {
        const semesters = getGuestSemesters()
        const updatedSemesters = semesters.map(s => 
          s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
        )
        saveGuestSemesters(updatedSemesters)
        return updatedSemesters.find(s => s.id === id)
      }
      return updateSemester(id, updates)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: semestersQueryKeys.all })
      queryClient.setQueryData(semestersQueryKeys.byId(data.id), data)
    },
  })
}

export const useDeleteSemester = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      if (isGuestMode()) {
        const semesters = getGuestSemesters()
        const updatedSemesters = semesters.filter(s => s.id !== id)
        saveGuestSemesters(updatedSemesters)
        return id
      }
      return deleteSemester(id)
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: semestersQueryKeys.all })
      queryClient.removeQueries({ queryKey: semestersQueryKeys.byId(id) })
    },
  })
}

export const useSetActiveSemester = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      if (isGuestMode()) {
        const semesters = getGuestSemesters()
        const updatedSemesters = semesters.map(s => ({
          ...s,
          activo: s.id === id
        }))
        saveGuestSemesters(updatedSemesters)
        return id
      }
      return setActiveSemester(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: semestersQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: semestersQueryKeys.active() })
    },
  })
}
