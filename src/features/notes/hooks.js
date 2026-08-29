import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNotes,
  getNoteById,
  searchNotes,
  createNote,
  updateNote,
  deleteNote,
  notesQueryKeys,
} from './api.js'

export function useNotes(folderId = null) {
  return useQuery({
    queryKey: notesQueryKeys.byFolder(folderId),
    queryFn: () => getNotes(folderId),
  })
}

export function useNote(id) {
  return useQuery({
    queryKey: notesQueryKeys.byId(id),
    queryFn: () => getNoteById(id),
    enabled: !!id,
  })
}

export function useSearchNotes(query) {
  return useQuery({
    queryKey: notesQueryKeys.search(query),
    queryFn: () => searchNotes(query),
    enabled: !!query && query.length > 0,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createNote,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.byFolder(data.folder_id) })
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.all })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }) => updateNote(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.byId(data.id) })
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.byFolder(data.folder_id) })
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.all })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.all })
    },
  })
}
