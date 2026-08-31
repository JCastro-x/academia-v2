import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAttachmentsByNote,
  getAttachmentById,
  createAttachment,
  deleteAttachment,
  uploadAttachment,
  deleteAttachmentFile,
  getSignedUrl,
  noteAttachmentsQueryKeys,
} from './api.js'

export function useAttachmentsByNote(noteId) {
  return useQuery({
    queryKey: noteAttachmentsQueryKeys.byNote(noteId),
    queryFn: () => getAttachmentsByNote(noteId),
    enabled: !!noteId,
  })
}

export function useAttachment(id) {
  return useQuery({
    queryKey: noteAttachmentsQueryKeys.byId(id),
    queryFn: () => getAttachmentById(id),
    enabled: !!id,
  })
}

export function useCreateAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ attachment, file, userId, noteId }) => {
      const { storagePath } = await uploadAttachment(userId, noteId, file, attachment.tipo)
      attachment.storage_path = storagePath
      return createAttachment(attachment)
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: noteAttachmentsQueryKeys.byNote(variables.attachment.note_id),
      })
    },
  })
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const attachment = await getAttachmentById(id)
      await deleteAttachmentFile(attachment.storage_path)
      await deleteAttachment(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteAttachmentsQueryKeys.all })
    },
  })
}

export function useSignedUrl(storagePath, expiresIn = 3600) {
  return useQuery({
    queryKey: ['signedUrl', storagePath],
    queryFn: () => getSignedUrl(storagePath, expiresIn),
    enabled: !!storagePath,
    staleTime: expiresIn * 1000 - 60000, // Refresh 1 minute before expiry
  })
}

export function useSignedUrls(storagePaths, expiresIn = 3600) {
  return useQueries({
    queries: storagePaths.map((storagePath) => ({
      queryKey: ['signedUrl', storagePath],
      queryFn: () => getSignedUrl(storagePath, expiresIn),
      enabled: !!storagePath,
      staleTime: expiresIn * 1000 - 60000, // Refresh 1 minute before expiry
    })),
  })
}
