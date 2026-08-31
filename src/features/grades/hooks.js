import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getZonesBySubject,
  getZoneById,
  getItemsByZone,
  getItemById,
  getZonesForSubjects,
  createZone,
  updateZone,
  deleteZone,
  createItem,
  updateItem,
  deleteItem,
  countItemsByZone,
  gradesQueryKeys,
} from './api.js'
import { getSubjects } from '../subjects/api.js'
import { calculateSubjectTotalPoints, calculateSubjectMaxPoints } from '../../domain/grades-calc.js'

export function useZonesBySubject(subjectId) {
  return useQuery({
    queryKey: gradesQueryKeys.zonesBySubject(subjectId),
    queryFn: () => getZonesBySubject(subjectId),
    enabled: !!subjectId,
  })
}

export function useZone(id) {
  return useQuery({
    queryKey: gradesQueryKeys.zoneById(id),
    queryFn: () => getZoneById(id),
    enabled: !!id,
  })
}

export function useItemsByZone(zoneId) {
  return useQuery({
    queryKey: gradesQueryKeys.itemsByZone(zoneId),
    queryFn: () => getItemsByZone(zoneId),
    enabled: !!zoneId,
  })
}

export function useItem(id) {
  return useQuery({
    queryKey: gradesQueryKeys.itemById(id),
    queryFn: () => getItemById(id),
    enabled: !!id,
  })
}

export function useCreateZone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createZone,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gradesQueryKeys.zonesBySubject(data.subject_id) })
    },
  })
}

export function useUpdateZone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }) => updateZone(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gradesQueryKeys.zoneById(data.id) })
      queryClient.invalidateQueries({ queryKey: gradesQueryKeys.zonesBySubject(data.subject_id) })
    },
  })
}

export function useDeleteZone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteZone,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: gradesQueryKeys.all })
    },
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createItem,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gradesQueryKeys.itemsByZone(data.zone_id) })
      queryClient.invalidateQueries({ queryKey: gradesQueryKeys.all })
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }) => updateItem(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gradesQueryKeys.itemById(data.id) })
      queryClient.invalidateQueries({ queryKey: gradesQueryKeys.itemsByZone(data.zone_id) })
      queryClient.invalidateQueries({ queryKey: gradesQueryKeys.all })
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradesQueryKeys.all })
    },
  })
}

export function useCountItemsByZone(zoneId) {
  return useQuery({
    queryKey: ['grades', 'items', 'count', 'zone', zoneId],
    queryFn: () => countItemsByZone(zoneId),
    enabled: !!zoneId,
  })
}

/**
 * Fetch total points (obtained vs max) for EVERY subject in a semester,
 * grouping all grade zones by subject in one pass.
 * Returns: { [subjectId]: { totalPoints, maxPoints } }
 */
export function useSubjectsTotalPoints(semesterId) {
  return useQuery({
    queryKey: gradesQueryKeys.subjectsTotalPoints(semesterId),
    queryFn: async () => {
      const subjects = await getSubjects(semesterId)
      const subjectIds = (subjects || []).map((s) => s.id)
      if (subjectIds.length === 0) return {}

      const zones = await getZonesForSubjects(subjectIds)

      // Group zones by subject_id
      const grouped = {}
      for (const zone of zones) {
        ;(grouped[zone.subject_id] ||= []).push(zone)
      }

      const result = {}
      for (const [subjectId, subjectZones] of Object.entries(grouped)) {
        result[subjectId] = {
          totalPoints: calculateSubjectTotalPoints(subjectZones),
          maxPoints: calculateSubjectMaxPoints(subjectZones),
        }
      }

      return result
    },
    enabled: !!semesterId,
  })
}
