import { useState } from 'react'
import '../styles/forms.css'

export default function FolderForm({ subjects, onSubmit, onCancel, isPending }) {
  const [nombre, setNombre] = useState('')
  const [subjectId, setSubjectId] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      nombre,
      subject_id: subjectId || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-gray-900 dark:text-[var(--dm-text)]">
      <div className="field">
        <label htmlFor="nombre" className="field-label required">Nombre de carpeta</label>
        <input
          id="nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="field-input"
          required
          autoComplete="off"
        />
      </div>

      <div className="field">
        <label htmlFor="subject" className="field-label">Materia (opcional)</label>
        <select
          id="subject"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="field-select"
        >
          <option value="">Sin materia</option>
          {subjects.map(subject => (
            <option key={subject.id} value={subject.id}>
              {subject.nombre}
            </option>
          ))}
        </select>
      </div>

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
          disabled={isPending || !nombre}
          className="flex-1 bg-[var(--color-primary)] text-[var(--color-primary-fg)] py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Creando...' : 'Crear'}
        </button>
      </div>
    </form>
  )
}
