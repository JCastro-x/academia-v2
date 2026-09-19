import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 24 * 60 * 60 * 1000, // 24 hours (extended for offline support)
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Configure localStorage persister for offline support
// Using localStorage for better iOS Safari compatibility and simpler implementation
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'academia-query-cache',
  throttleTime: 1000, // Debounce persistence to avoid performance issues
})

persistQueryClient({
  queryClient,
  persister,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours - remove stale data after this time
  buster: 'v1', // Increment to clear cache on structure changes
})
