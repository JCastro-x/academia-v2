import { useState } from 'react'

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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">
          Nombre de la zona
        </label>
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:placeholder:text-[var(--dm-text-muted)]"
          placeholder="Ej. Parcial 1, Tareas, Final"
          disabled={isPending}
          required
          autoComplete="off"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">
          Peso (puntos)
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.peso_pts}
          onChange={(e) => setFormData({ ...formData, peso_pts: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
          placeholder="Ej. 25"
          disabled={isPending}
          required
          autoComplete="off"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">
          Umbral para ganar (%)
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.ganada_pct}
          onChange={(e) => setFormData({ ...formData, ganada_pct: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
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
