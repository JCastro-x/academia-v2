import { useState } from 'react'

export default function ItemForm({ initialData, onSubmit, onCancel, isPending }) {
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    porcentaje_ingresado: initialData?.porcentaje_ingresado || '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      porcentaje_ingresado: formData.porcentaje_ingresado ? parseFloat(formData.porcentaje_ingresado) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del ítem
        </label>
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Ej. Examen, Quiz 1, Tarea 1"
          disabled={isPending}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Porcentaje obtenido (%)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={formData.porcentaje_ingresado}
          onChange={(e) => setFormData({ ...formData, porcentaje_ingresado: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Ej. 85"
          disabled={isPending}
        />
        <p className="text-xs text-gray-500 mt-1">Dejar vacío si aún no tienes nota</p>
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
