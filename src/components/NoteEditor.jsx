import { useState, useEffect, useRef } from 'react'
import { useNote, useUpdateNote } from '../features/notes/hooks.js'
import { motion, AnimatePresence } from 'framer-motion'

export default function NoteEditor({ noteId, onClose }) {
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const editorRef = useRef(null)
  
  const { data: note, isLoading } = useNote(noteId)
  const updateNote = useUpdateNote()

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
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4 pb-2 border-b">
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
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContenidoChange}
          onKeyDown={handleKeyDown}
          className="flex-1 overflow-y-auto p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
        />

        {/* Footer hint */}
        <div className="text-xs text-gray-400 mt-2">
          Ctrl+S para guardar • Ctrl+B/I/U para formato
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
