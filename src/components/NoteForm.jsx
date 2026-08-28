import { useState } from 'react'

export default function NoteForm({ subjects, folderId, onSubmit, onCancel, isPending }) {
  const [titulo, setTitulo] = useState('')
  const [subjectId, setSubjectId] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      titulo,
      subject_id: subjectId || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">
          Título *
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
          required
          autoComplete="off"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">
          Materia (opcional)
        </label>
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
        >
          <option value="">Sin materia</option>
          {subjects.map(subject => (
            <option key={subject.id} value={subject.id}>
              {subject.nombre}
            </option>
          ))}
        </select>
      </div>

      {folderId && (
        <div className="text-sm text-gray-500">
          La nota se creará en la carpeta seleccionada
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending || !titulo}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Creando...' : 'Crear'}
        </button>
      </div>
    </form>
  )
}
