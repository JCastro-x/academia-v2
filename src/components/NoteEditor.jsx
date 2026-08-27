import { useState, useEffect, useRef } from 'react'
import { useNote, useUpdateNote } from '../features/notes/hooks.js'
import { useAttachmentsByNote, useCreateAttachment, useDeleteAttachment, useSignedUrls } from '../features/note-attachments/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import { extractTextFromPDF } from '../lib/pdf-extract.js'
import { supabase } from '../lib/supabase.js'
import { motion, AnimatePresence } from 'framer-motion'
import DrawingCanvas from './DrawingCanvas.jsx'

export default function NoteEditor({ noteId, onClose }) {
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false)
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)
  
  const { data: note, isLoading } = useNote(noteId)
  const updateNote = useUpdateNote()
  const { data: attachments } = useAttachmentsByNote(noteId)
  const createAttachment = useCreateAttachment()
  const deleteAttachment = useDeleteAttachment()
  const { openConfirmDialog, showUndoToast, addToast, addPendingDelete, removePendingDelete, pendingDeletes, openLightbox } = useUIStore()
  
  // Get all storage paths for signed URLs
  const storagePaths = attachments?.map(a => a.storage_path) || []
  const signedUrlsResults = useSignedUrls(storagePaths)
  const signedUrlsMap = Object.fromEntries(
    storagePaths.map((path, index) => [path, signedUrlsResults[index]?.data])
  )

  useEffect(() => {
    if (note) {
      setTitulo(note.titulo || '')
      setContenido(note.contenido || '')
      if (editorRef.current) {
        editorRef.current.innerHTML = note.contenido || ''
      }
    }
  }, [note])

  const handleFormat = (command) => {
    document.execCommand(command, false, null)
    editorRef.current?.focus()
  }

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        await handleImageUpload(file)
        break
      }
    }
  }

  const handleImageUpload = async (file) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) {
        addToast({ type: 'error', message: 'Debes estar autenticado para subir imágenes' })
        return
      }

      await createAttachment.mutateAsync({
        attachment: {
          note_id: noteId,
          tipo: 'imagen',
          nombre: file.name,
          metadata: { size: file.size, type: file.type },
        },
        file,
        userId,
        noteId,
      })

      addToast({ type: 'success', message: 'Imagen subida correctamente' })
    } catch (error) {
      console.error('Error uploading image:', error)
      addToast({ type: 'error', message: 'Error al subir la imagen' })
    }
  }

  const handleFileInputChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type === 'application/pdf') {
      await handlePDFUpload(file)
    } else if (file.type.startsWith('image/')) {
      await handleImageUpload(file)
    } else {
      addToast({ type: 'error', message: 'Formato no soportado' })
    }

    e.target.value = ''
  }

  const handlePDFUpload = async (file) => {
    try {
      addToast({ type: 'info', message: 'Extrayendo texto del PDF...' })
      const text = await extractTextFromPDF(file)
      
      setContenido((prev) => prev + (prev ? '\n\n' : '') + text)
      if (editorRef.current) {
        editorRef.current.innerHTML = contenido + (contenido ? '\n\n' : '') + text
      }

      addToast({ type: 'success', message: 'Texto extraído del PDF' })
    } catch (error) {
      console.error('Error extracting PDF text:', error)
      addToast({ type: 'error', message: 'Error al extraer texto del PDF' })
    }
  }

  const handleDrawingSave = async (blob) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) {
        addToast({ type: 'error', message: 'Debes estar autenticado para guardar dibujos' })
        return
      }

      const file = new File([blob], `dibujo-${Date.now()}.png`, { type: 'image/png' })
      
      await createAttachment.mutateAsync({
        attachment: {
          note_id: noteId,
          tipo: 'dibujo',
          nombre: file.name,
          metadata: { size: file.size, type: file.type },
        },
        file,
        userId,
        noteId,
      })

      setShowDrawingCanvas(false)
      addToast({ type: 'success', message: 'Dibujo guardado' })
    } catch (error) {
      console.error('Error saving drawing:', error)
      addToast({ type: 'error', message: 'Error al guardar el dibujo' })
    }
  }

  const handleDeleteAttachment = (attachment) => {
    openConfirmDialog({
      title: 'Eliminar adjunto',
      message: `¿Estás seguro de eliminar ${attachment.nombre}?`,
      onConfirm: async () => {
        addPendingDelete({ type: 'attachment', id: attachment.id, noteId })
        showUndoToast({
          message: 'Adjunto eliminado',
          onUndo: () => {
            removePendingDelete(attachment.id)
          },
          onTimeout: async () => {
            try {
              await deleteAttachment.mutateAsync(attachment.id)
              removePendingDelete(attachment.id)
            } catch (error) {
              console.error('Error deleting attachment:', error)
              addToast({ type: 'error', message: 'Error al eliminar el adjunto' })
            }
          },
        })
      },
    })
  }

  const handleContenidoChange = () => {
    setContenido(editorRef.current?.innerHTML || '')
  }

  const handleSave = async () => {
    try {
      await updateNote.mutateAsync({
        id: noteId,
        updates: { titulo, contenido },
      })
    } catch (error) {
      console.error('Error saving note:', error)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  if (isLoading) return <div>Cargando nota...</div>

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6' : ''}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="text-xl font-semibold flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Título de la nota"
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={updateNote.isPending}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {updateNote.isPending ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 text-sm"
            >
              {isFullscreen ? '↙️' : '⛶'}
            </button>
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 text-sm dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4 pb-2 border-b flex-wrap">
          <button
            onClick={() => handleFormat('bold')}
            className="px-3 py-1 border rounded hover:bg-gray-100 font-bold"
            title="Negrita (Ctrl+B)"
          >
            B
          </button>
          <button
            onClick={() => handleFormat('italic')}
            className="px-3 py-1 border rounded hover:bg-gray-100 italic"
            title="Cursiva (Ctrl+I)"
          >
            I
          </button>
          <button
            onClick={() => handleFormat('underline')}
            className="px-3 py-1 border rounded hover:bg-gray-100 underline"
            title="Subrayado (Ctrl+U)"
          >
            U
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2" />
          <button
            onClick={() => setShowDrawingCanvas(!showDrawingCanvas)}
            className={`px-3 py-1 border rounded hover:bg-gray-100 dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)] ${showDrawingCanvas ? 'bg-blue-100 border-blue-500' : ''}`}
            title="Dibujar"
          >
            ✏️
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 border rounded hover:bg-gray-100"
            title="Subir imagen o PDF"
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Drawing Canvas */}
        <AnimatePresence>
          {showDrawingCanvas && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <DrawingCanvas
                onSave={handleDrawingSave}
                onCancel={() => setShowDrawingCanvas(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {attachments
              .filter((attachment) => !pendingDeletes.some((pd) => pd.id === attachment.id))
              .map((attachment) => {
                const signedUrl = signedUrlsMap[attachment.storage_path]
                return (
                  <div
                    key={attachment.id}
                    className="relative group inline-block"
                  >
                    <img
                      src={signedUrl}
                      alt={attachment.nombre}
                      className="max-w-[200px] max-h-[200px] rounded border cursor-pointer hover:opacity-90"
                      onClick={() => openLightbox({ src: signedUrl, alt: attachment.nombre, caption: attachment.nombre })}
                    />
                    <button
                      onClick={() => handleDeleteAttachment(attachment)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
          </div>
        )}

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContenidoChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          className="flex-1 overflow-y-auto p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
        />

        {/* Footer hint */}
        <div className="text-xs text-gray-400 mt-2">
          Ctrl+S para guardar • Ctrl+B/I/U para formato • Ctrl+V para pegar imagen
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
