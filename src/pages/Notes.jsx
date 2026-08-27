import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useFolders, useCreateFolder, useDeleteFolder } from '../features/folders/hooks.js'
import { useNotes, useCreateNote, useDeleteNote, useSearchNotes } from '../features/notes/hooks.js'
import { useSubjects } from '../features/subjects/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import NoteEditor from '../components/NoteEditor.jsx'
import NoteForm from '../components/NoteForm.jsx'
import FolderForm from '../components/FolderForm.jsx'
import ModalWrapper from '../components/ModalWrapper.jsx'

export default function Notes() {
  const { semesterId } = useParams()
  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [selectedNoteId, setSelectedNoteId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  
  const { data: folders, isLoading: foldersLoading } = useFolders(currentFolderId)
  const { data: notes, isLoading: notesLoading } = useNotes(currentFolderId)
  const { data: searchResults, isLoading: searchLoading } = useSearchNotes(searchQuery)
  const { data: subjects } = useSubjects(semesterId)
  const createFolder = useCreateFolder()
  const deleteFolder = useDeleteFolder()
  const createNote = useCreateNote()
  const deleteNote = useDeleteNote()
  
  const { openConfirmDialog, showUndoToast, addPendingDelete, removePendingDelete, pendingDeletes } = useUIStore()

  const handleCreateFolder = async (folderData) => {
    try {
      await createFolder.mutateAsync({
        ...folderData,
        parent_id: currentFolderId,
      })
      setIsCreatingFolder(false)
    } catch (error) {
      console.error('Error creating folder:', error)
    }
  }

  const handleDeleteFolder = (folder) => {
    openConfirmDialog({
      title: 'Eliminar carpeta',
      message: `¿Estás seguro de eliminar "${folder.nombre}" y todo su contenido?`,
      confirmText: 'Eliminar',
      onConfirm: () => {
        const pendingDeleteId = Date.now()
        addPendingDelete({ type: 'folder', itemId: folder.id, pendingId: pendingDeleteId })
        showUndoToast({
          message: `Carpeta "${folder.nombre}" eliminada`,
          onTimeout: async () => {
            try {
              await deleteFolder.mutateAsync(folder.id)
              removePendingDelete(pendingDeleteId)
            } catch (error) {
              console.error('Error deleting folder:', error)
              removePendingDelete(pendingDeleteId)
            }
          },
          onUndo: () => {
            removePendingDelete(pendingDeleteId)
          }
        })
      }
    })
  }

  const handleCreateNote = async (noteData) => {
    try {
      await createNote.mutateAsync({
        ...noteData,
        folder_id: currentFolderId,
      })
      setIsCreatingNote(false)
    } catch (error) {
      console.error('Error creating note:', error)
    }
  }

  const handleDeleteNote = (note) => {
    openConfirmDialog({
      title: 'Eliminar nota',
      message: `¿Estás seguro de eliminar "${note.titulo}"?`,
      confirmText: 'Eliminar',
      onConfirm: () => {
        const pendingDeleteId = Date.now()
        addPendingDelete({ type: 'note', itemId: note.id, pendingId: pendingDeleteId })
        showUndoToast({
          message: `Nota "${note.titulo}" eliminada`,
          onTimeout: async () => {
            try {
              await deleteNote.mutateAsync(note.id)
              removePendingDelete(pendingDeleteId)
              if (selectedNoteId === note.id) setSelectedNoteId(null)
            } catch (error) {
              console.error('Error deleting note:', error)
              removePendingDelete(pendingDeleteId)
            }
          },
          onUndo: () => {
            removePendingDelete(pendingDeleteId)
          }
        })
      }
    })
  }

  const displayNotes = searchQuery ? searchResults : notes
  const displayFolders = searchQuery ? [] : folders

  if (foldersLoading || notesLoading) return <div>Cargando...</div>

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          {currentFolderId && (
            <button
              onClick={() => setCurrentFolderId(null)}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-1 dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)]"
            >
              ← Volver
            </button>
          )}
          <h1 className="text-2xl font-bold dark:text-[var(--dm-text)]">Notas</h1>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
          />
          {!searchQuery && (
            <>
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 text-sm dark:bg-[var(--dm-bg)] dark:hover:bg-[var(--dm-border)] dark:text-[var(--dm-text)]"
              >
                + Carpeta
              </button>
              <button
                onClick={() => setIsCreatingNote(true)}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                + Nota
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Folder/Note List */}
        <div className="w-full sm:w-80 flex-shrink-0 overflow-y-auto">
          <div className="space-y-2">
            {displayFolders?.filter(folder => !pendingDeletes.some(pd => pd.type === 'folder' && pd.itemId === folder.id)).map(folder => (
              <div
                key={folder.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer group dark:bg-[var(--dm-bg)] dark:hover:bg-[var(--dm-border)]"
              >
                <div
                  className="flex items-center gap-2 flex-1"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <span className="text-xl">📁</span>
                  <span className="font-medium dark:text-[var(--dm-text)]">{folder.nombre}</span>
                </div>
                <button
                  onClick={() => handleDeleteFolder(folder)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 dark:text-red-400 dark:hover:text-red-300"
                >
                  🗑️
                </button>
              </div>
            ))}
            
            {displayNotes?.filter(note => !pendingDeletes.some(pd => pd.type === 'note' && pd.itemId === note.id)).map(note => (
              <div
                key={note.id}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer group ${
                  selectedNoteId === note.id ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white border hover:bg-gray-50 dark:bg-[var(--dm-surface)] dark:border-[var(--dm-border)] dark:hover:bg-[var(--dm-border)]'
                }`}
                onClick={() => setSelectedNoteId(note.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xl">📝</span>
                  <span className="font-medium truncate dark:text-[var(--dm-text)]">{note.titulo || 'Sin título'}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteNote(note) }}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 flex-shrink-0 dark:text-red-400 dark:hover:text-red-300"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          {!searchQuery && !displayFolders?.length && !displayNotes?.length && (
            <div className="text-center py-8 text-gray-500 dark:text-[var(--dm-text-muted)]">
              <p>{currentFolderId ? 'Carpeta vacía' : 'No hay notas ni carpetas'}</p>
            </div>
          )}

          {searchQuery && !displayNotes?.length && !searchLoading && (
            <div className="text-center py-8 text-gray-500 dark:text-[var(--dm-text-muted)]">
              <p>No se encontraron notas</p>
            </div>
          )}
        </div>

        {/* Note Editor */}
        <div className="flex-1 overflow-hidden">
          {selectedNoteId ? (
            <NoteEditor
              noteId={selectedNoteId}
              onClose={() => setSelectedNoteId(null)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-[var(--dm-text-muted)]">
              <p>Selecciona una nota para editar</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      <ModalWrapper
        isOpen={isCreatingFolder}
        onClose={() => setIsCreatingFolder(false)}
        className="p-6 w-full max-w-md"
      >
        <h3 className="text-lg font-semibold mb-4">Nueva carpeta</h3>
        <FolderForm
          subjects={subjects || []}
          onSubmit={handleCreateFolder}
          onCancel={() => setIsCreatingFolder(false)}
          isPending={createFolder.isPending}
        />
      </ModalWrapper>

      {/* Create Note Modal */}
      <ModalWrapper
        isOpen={isCreatingNote}
        onClose={() => setIsCreatingNote(false)}
        className="p-6 w-full max-w-md"
      >
        <h3 className="text-lg font-semibold mb-4">Nueva nota</h3>
        <NoteForm
          subjects={subjects || []}
          folderId={currentFolderId}
          onSubmit={handleCreateNote}
          onCancel={() => setIsCreatingNote(false)}
          isPending={createNote.isPending}
        />
      </ModalWrapper>
    </div>
  )
}
