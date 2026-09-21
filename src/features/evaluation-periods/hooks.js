import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getEvaluationPeriodsBySubject,
  getEvaluationPeriodById,
  createEvaluationPeriod,
  updateEvaluationPeriod,
  deleteEvaluationPeriod,
  evaluationPeriodsQueryKeys,
} from './api.js'

export function useEvaluationPeriodsBySubject(subjectId) {
  return useQuery({
    queryKey: evaluationPeriodsQueryKeys.bySubject(subjectId),
    queryFn: () => getEvaluationPeriodsBySubject(subjectId),
    enabled: !!subjectId,
  })
}

export function useEvaluationPeriod(id) {
  return useQuery({
    queryKey: evaluationPeriodsQueryKeys.byId(id),
    queryFn: () => getEvaluationPeriodById(id),
    enabled: !!id,
  })
}

export function useCreateEvaluationPeriod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createEvaluationPeriod,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: evaluationPeriodsQueryKeys.bySubject(data.subject_id) })
      queryClient.invalidateQueries({ queryKey: evaluationPeriodsQueryKeys.all })
    },
  })
}

export function useUpdateEvaluationPeriod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }) => updateEvaluationPeriod(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: evaluationPeriodsQueryKeys.byId(data.id) })
      queryClient.invalidateQueries({ queryKey: evaluationPeriodsQueryKeys.bySubject(data.subject_id) })
      queryClient.invalidateQueries({ queryKey: evaluationPeriodsQueryKeys.all })
    },
  })
}

export function useDeleteEvaluationPeriod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteEvaluationPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationPeriodsQueryKeys.all })
    },
  })
}
