import { useState } from 'react'
import '../../../styles/forms.css'

export default function ZoneForm({ initialData, onSubmit, onCancel, isPending }) {
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    peso_pts: initialData?.peso_pts || '',
    ganada_pct: initialData?.ganada_pct || 60,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      peso_pts: parseFloat(formData.peso_pts),
      ganada_pct: parseFloat(formData.ganada_pct),
    })
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-gray-900 dark:text-[var(--dm-text)]">
      <div className="field">
        <label htmlFor="nombre" className="field-label">Nombre de la zona</label>
        <input
          id="nombre"
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="field-input"
          placeholder="Ej. Parcial 1, Tareas, Final"
          disabled={isPending}
          required
          autoComplete="off"
        />
      </div>

      <div className="field">
        <label htmlFor="peso_pts" className="field-label">Peso (puntos)</label>
        <input
          id="peso_pts"
          type="number"
          step="0.01"
          value={formData.peso_pts}
          onChange={(e) => setFormData({ ...formData, peso_pts: e.target.value })}
          className="field-input"
          placeholder="Ej. 25"
          disabled={isPending}
          required
          autoComplete="off"
        />
      </div>

      <div className="field">
        <label htmlFor="ganada_pct" className="field-label">Umbral para ganar (%)</label>
        <input
          id="ganada_pct"
          type="number"
          step="0.01"
          value={formData.ganada_pct}
          onChange={(e) => setFormData({ ...formData, ganada_pct: e.target.value })}
          className="field-input"
          placeholder="Ej. 60"
          disabled={isPending}
          required
          autoComplete="off"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
          disabled={isPending}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 bg-[var(--color-primary)] text-white py-2 px-4 rounded-lg hover:bg-[color-mix(in_srgb,var(--color-primary)_85%,black)] disabled:bg-[color-mix(in_srgb,var(--color-primary)_70%,white)]"
          disabled={isPending}
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
