import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
  foldersQueryKeys,
} from './api.js'

export function useFolders(parentId = null) {
  return useQuery({
    queryKey: foldersQueryKeys.byParent(parentId),
    queryFn: () => getFolders(parentId),
  })
}

export function useFolder(id) {
  return useQuery({
    queryKey: foldersQueryKeys.byId(id),
    queryFn: () => getFolderById(id),
    enabled: !!id,
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFolder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: foldersQueryKeys.byParent(data.parent_id) })
      queryClient.invalidateQueries({ queryKey: foldersQueryKeys.all })
    },
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }) => updateFolder(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: foldersQueryKeys.byId(data.id) })
      queryClient.invalidateQueries({ queryKey: foldersQueryKeys.byParent(data.parent_id) })
      queryClient.invalidateQueries({ queryKey: foldersQueryKeys.all })
    },
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foldersQueryKeys.all })
    },
  })
}
