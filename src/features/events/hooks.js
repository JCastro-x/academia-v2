import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getEvents,
  getEventsByMonth,
  getEventsBySubject,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  eventsQueryKeys,
} from './api.js'

export function useEvents(semesterId) {
  return useQuery({
    queryKey: eventsQueryKeys.bySemester(semesterId),
    queryFn: () => getEvents(semesterId),
    enabled: !!semesterId,
  })
}

export function useEventsByMonth(semesterId, year, month) {
  return useQuery({
    queryKey: eventsQueryKeys.byMonth(semesterId, year, month),
    queryFn: () => getEventsByMonth(semesterId, year, month),
    enabled: !!semesterId && !!year && !!month,
  })
}

export function useEventsBySubject(subjectId) {
  return useQuery({
    queryKey: eventsQueryKeys.bySubject(subjectId),
    queryFn: () => getEventsBySubject(subjectId),
    enabled: !!subjectId,
  })
}

export function useEvent(id) {
  return useQuery({
    queryKey: eventsQueryKeys.byId(id),
    queryFn: () => getEventById(id),
    enabled: !!id,
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createEvent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.bySemester(data.semester_id) })
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.all })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }) => updateEvent(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.byId(data.id) })
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.bySemester(data.semester_id) })
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.all })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.all })
    },
  })
}
