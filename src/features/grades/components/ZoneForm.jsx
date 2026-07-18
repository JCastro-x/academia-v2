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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de la zona
        </label>
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Ej. Parcial 1, Tareas, Final"
          disabled={isPending}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Peso (puntos)
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.peso_pts}
          onChange={(e) => setFormData({ ...formData, peso_pts: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Ej. 25"
          disabled={isPending}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Umbral para ganar (%)
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.ganada_pct}
          onChange={(e) => setFormData({ ...formData, ganada_pct: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Ej. 60"
          disabled={isPending}
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
          disabled={isPending}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          disabled={isPending}
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
