import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProfile,
  upsertProfile,
  profilesQueryKeys,
} from './api.js'

export function useProfile() {
  return useQuery({
    queryKey: profilesQueryKeys.current,
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutos - datos de perfil cambian poco
    retry: false, // No reintentar agresivamente si falla
  })
}

export function useUpsertProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: upsertProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(profilesQueryKeys.current, data)
    },
  })
}
