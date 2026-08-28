import { useState } from 'react'
import '../styles/forms.css'

export default function SemesterForm({ initialData, onSubmit, onCancel, isPending, isCreate = false }) {
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-gray-900 dark:text-[var(--dm-text)]">
      <div className="field">
        <label htmlFor="nombre" className="field-label required">Nombre del semestre</label>
        <input
          id="nombre"
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder={isCreate ? "Ej: Primer Semestre 2024" : ""}
          className="field-input"
          required
          disabled={isPending}
          autoComplete="off"
        />
      </div>

      <div className="field-row two-cols">
        <div className="min-w-0">
          <label htmlFor="start_date" className="field-label">Fecha de inicio</label>
          <input
            id="start_date"
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="field-input"
            disabled={isPending}
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="end_date" className="field-label">Fecha de fin</label>
          <input
            id="end_date"
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="field-input"
            disabled={isPending}
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)]">
        Opcional: Define las fechas del semestre para ver tu progreso por semanas en el horario.
      </p>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-[var(--dm-border)]"
        >
          {isPending ? 'Guardando...' : (isCreate ? 'Crear semestre' : 'Guardar')}
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
