import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getZonesBySubject,
  getZoneById,
  getItemsByZone,
  getItemById,
  createZone,
  updateZone,
  deleteZone,
  createItem,
  updateItem,
  deleteItem,
  countItemsByZone,
  gradesQueryKeys,
} from './api.js'

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
