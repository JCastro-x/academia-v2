import { useState } from 'react'

export default function TaskForm({ semesterId, subjects, initialData, onSubmit, onCancel, isPending }) {
  const [formData, setFormData] = useState({
    titulo: initialData?.titulo || '',
    prioridad: initialData?.prioridad || 'media',
    subject_id: initialData?.subject_id || '',
    due: initialData?.due ? initialData.due.slice(0, 16) : '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      semester_id: semesterId,
      ...formData,
      subject_id: formData.subject_id || null,
      due: formData.due || null,
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-gray-900 dark:text-[var(--dm-text)]">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">Título *</label>
        <input
          type="text"
          name="titulo"
          value={formData.titulo}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:placeholder:text-[var(--dm-text-muted)]"
          required
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">Materia</label>
          <select
            name="subject_id"
            value={formData.subject_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
            disabled={isPending}
          >
            <option value="">Sin materia</option>
            {subjects?.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">Prioridad</label>
          <select
            name="prioridad"
            value={formData.prioridad}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
            disabled={isPending}
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">Fecha de entrega</label>
        <input
          type="datetime-local"
          name="due"
          value={formData.due}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
          disabled={isPending}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-[var(--dm-border)]"
        >
          {isPending ? 'Guardando...' : (initialData ? 'Guardar' : 'Crear')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:bg-gray-300 disabled:cursor-not-allowed dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)] dark:disabled:bg-[var(--dm-border)]"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
