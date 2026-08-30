import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProfile,
  upsertProfile,
  profilesQueryKeys,
} from './api.js'
import { supabase } from '../../lib/supabase.js'

export function useProfile() {
  return useQuery({
    queryKey: profilesQueryKeys.current,
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutos - datos de perfil cambian poco
    retry: false, // No reintentar agresivamente si falla
  })
}

export function useProfileRealtimeSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let channel = null
    let isMounted = true

    const subscribeToProfileChanges = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user || !isMounted) return

      channel = supabase
        .channel(`profiles:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const nextProfile = payload.new
            if (!nextProfile) return

            queryClient.setQueryData(profilesQueryKeys.current, (previousProfile) => (
              previousProfile ? { ...previousProfile, ...nextProfile } : nextProfile
            ))
            queryClient.invalidateQueries({ queryKey: profilesQueryKeys.current })
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            queryClient.invalidateQueries({ queryKey: profilesQueryKeys.current })
          }
        })
    }

    subscribeToProfileChanges()

    return () => {
      isMounted = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [queryClient])
}

export function useUpsertProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: upsertProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(profilesQueryKeys.current, data)
      queryClient.invalidateQueries({ queryKey: profilesQueryKeys.current })
    },
  })
}
