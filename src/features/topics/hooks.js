import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTopicsBySubject,
  getTopicsByPartial,
  getTopicsByEvaluationPeriod,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
  topicsQueryKeys,
} from './api.js'

export function useTopicsBySubject(subjectId) {
  return useQuery({
    queryKey: topicsQueryKeys.bySubject(subjectId),
    queryFn: () => getTopicsBySubject(subjectId),
    enabled: !!subjectId,
  })
}

export function useTopicsByPartial(subjectId, parcial) {
  return useQuery({
    queryKey: topicsQueryKeys.byPartial(subjectId, parcial),
    queryFn: () => getTopicsByPartial(subjectId, parcial),
    enabled: !!subjectId && !!parcial,
  })
}

export function useTopicsByEvaluationPeriod(evaluationPeriodId) {
  return useQuery({
    queryKey: topicsQueryKeys.byEvaluationPeriod(evaluationPeriodId),
    queryFn: () => getTopicsByEvaluationPeriod(evaluationPeriodId),
    enabled: !!evaluationPeriodId,
  })
}

export function useTopic(id) {
  return useQuery({
    queryKey: topicsQueryKeys.byId(id),
    queryFn: () => getTopicById(id),
    enabled: !!id,
  })
}

export function useCreateTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTopic,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: topicsQueryKeys.bySubject(data.subject_id) })
      queryClient.invalidateQueries({ queryKey: topicsQueryKeys.all })
    },
  })
}

export function useUpdateTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }) => updateTopic(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: topicsQueryKeys.byId(data.id) })
      queryClient.invalidateQueries({ queryKey: topicsQueryKeys.bySubject(data.subject_id) })
      queryClient.invalidateQueries({ queryKey: topicsQueryKeys.all })
    },
  })
}

export function useDeleteTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topicsQueryKeys.all })
    },
  })
}

export function useToggleTopicReviewed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, repasado }) => updateTopic(id, { repasado }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: topicsQueryKeys.byId(data.id) })
      queryClient.invalidateQueries({ queryKey: topicsQueryKeys.bySubject(data.subject_id) })
      queryClient.invalidateQueries({ queryKey: topicsQueryKeys.all })
    },
  })
}

export function useToggleSubtemaReviewed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, subtema, reviewed }) => {
      const topic = queryClient.getQueryData(topicsQueryKeys.byId(id))
      const currentReviewed = topic?.subtemas_repasados || []
      
      let newReviewed
      if (reviewed) {
        newReviewed = [...currentReviewed, { subtema, reviewed: true }]
      } else {
        newReviewed = currentReviewed.filter(s => s.subtema !== subtema)
      }
      
      return updateTopic(id, { subtemas_repasados: newReviewed })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: topicsQueryKeys.byId(data.id) })
      queryClient.invalidateQueries({ queryKey: topicsQueryKeys.bySubject(data.subject_id) })
      queryClient.invalidateQueries({ queryKey: topicsQueryKeys.all })
    },
  })
}
