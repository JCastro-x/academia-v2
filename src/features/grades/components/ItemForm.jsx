import { useState } from 'react'
import '../../../styles/forms.css'

export default function ItemForm({ initialData, onSubmit, onCancel, isPending }) {
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    porcentaje_ingresado: initialData?.porcentaje_ingresado || '',
    peso_pts: initialData?.peso_pts || '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      porcentaje_ingresado: formData.porcentaje_ingresado ? parseFloat(formData.porcentaje_ingresado) : null,
      peso_pts: formData.peso_pts ? parseFloat(formData.peso_pts) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-gray-900 dark:text-[var(--dm-text)]">
      <div className="field">
        <label htmlFor="nombre" className="field-label">Nombre del ítem</label>
        <input
          id="nombre"
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="field-input"
          placeholder="Ej. Examen, Quiz 1, Tarea 1"
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
          min="0"
          value={formData.peso_pts}
          onChange={(e) => setFormData({ ...formData, peso_pts: e.target.value })}
          className="field-input"
          placeholder="Ej. 1.5"
          disabled={isPending}
          required
          autoComplete="off"
        />
        <p className="text-xs text-gray-500 mt-1 dark:text-[var(--dm-text-muted)]">Puntos máximos que vale este ítem dentro de la zona</p>
      </div>

      <div className="field">
        <label htmlFor="porcentaje" className="field-label">Porcentaje obtenido (%)</label>
        <input
          id="porcentaje"
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={formData.porcentaje_ingresado}
          onChange={(e) => setFormData({ ...formData, porcentaje_ingresado: e.target.value })}
          className="field-input"
          placeholder="Ej. 85"
          disabled={isPending}
          autoComplete="off"
        />
        <p className="text-xs text-gray-500 mt-1 dark:text-[var(--dm-text-muted)]">Dejar vacío si aún no tienes nota</p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)] dark:disabled:bg-[var(--dm-border)]"
          disabled={isPending}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 bg-[var(--color-primary)] text-white py-2 px-4 rounded-lg hover:bg-[color-mix(in_srgb,var(--color-primary)_85%,black)] disabled:bg-[color-mix(in_srgb,var(--color-primary)_70%,white)] dark:disabled:bg-[var(--dm-border)]"
          disabled={isPending}
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
