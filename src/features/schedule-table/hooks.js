import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getScheduleNotes,
  getScheduleNote,
  upsertScheduleNote,
  deleteScheduleNote,
  getScheduleFlags,
  getScheduleFlag,
  upsertScheduleFlag,
  deleteScheduleFlag,
  scheduleTableQueryKeys,
} from './api.js'

export function useScheduleNotes(semesterId) {
  return useQuery({
    queryKey: scheduleTableQueryKeys.notes(semesterId),
    queryFn: () => getScheduleNotes(semesterId),
    enabled: !!semesterId,
  })
}

export function useScheduleNote(semesterId, subjectId, weekNumber) {
  return useQuery({
    queryKey: scheduleTableQueryKeys.note(semesterId, subjectId, weekNumber),
    queryFn: () => getScheduleNote(semesterId, subjectId, weekNumber),
    enabled: !!semesterId && !!subjectId && weekNumber != null,
  })
}

export function useUpsertScheduleNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ semesterId, subjectId, weekNumber, noteText, noteColor }) =>
      upsertScheduleNote(semesterId, subjectId, weekNumber, noteText, noteColor),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleTableQueryKeys.notes(variables.semesterId) })
      queryClient.setQueryData(
        scheduleTableQueryKeys.note(variables.semesterId, variables.subjectId, variables.weekNumber),
        data
      )
    },
  })
}

export function useDeleteScheduleNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ semesterId, subjectId, weekNumber }) =>
      deleteScheduleNote(semesterId, subjectId, weekNumber),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleTableQueryKeys.notes(variables.semesterId) })
      queryClient.setQueryData(
        scheduleTableQueryKeys.note(variables.semesterId, variables.subjectId, variables.weekNumber),
        null
      )
    },
  })
}

export function useScheduleFlags(semesterId) {
  return useQuery({
    queryKey: scheduleTableQueryKeys.flags(semesterId),
    queryFn: () => getScheduleFlags(semesterId),
    enabled: !!semesterId,
  })
}

export function useScheduleFlag(semesterId, weekNumber) {
  return useQuery({
    queryKey: scheduleTableQueryKeys.flag(semesterId, weekNumber),
    queryFn: () => getScheduleFlag(semesterId, weekNumber),
    enabled: !!semesterId && weekNumber != null,
  })
}

export function useUpsertScheduleFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ semesterId, weekNumber, flagType }) =>
      upsertScheduleFlag(semesterId, weekNumber, flagType),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleTableQueryKeys.flags(variables.semesterId) })
      queryClient.setQueryData(
        scheduleTableQueryKeys.flag(variables.semesterId, variables.weekNumber),
        data
      )
    },
  })
}

export function useDeleteScheduleFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ semesterId, weekNumber }) =>
      deleteScheduleFlag(semesterId, weekNumber),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduleTableQueryKeys.flags(variables.semesterId) })
      queryClient.setQueryData(
        scheduleTableQueryKeys.flag(variables.semesterId, variables.weekNumber),
        null
      )
    },
  })
}
