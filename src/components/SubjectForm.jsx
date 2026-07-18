import { useState } from 'react'

export default function SubjectForm({ semesterId, initialData, onSubmit, onCancel, isPending }) {
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    codigo: initialData?.codigo || '',
    catedratico: initialData?.catedratico || '',
    seccion: initialData?.seccion || '',
    creditos: initialData?.creditos || '',
    color: initialData?.color || '#3b82f6',
    icono: initialData?.icono || '📚',
    horario: initialData?.horario || null,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      semester_id: semesterId,
      ...formData,
      creditos: formData.creditos ? parseInt(formData.creditos) : null,
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
          <input
            type="text"
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isPending}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Créditos</label>
          <input
            type="number"
            name="creditos"
            value={formData.creditos}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Catedrático</label>
        <input
          type="text"
          name="catedratico"
          value={formData.catedratico}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sección</label>
          <input
            type="text"
            name="seccion"
            value={formData.seccion}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isPending}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ícono</label>
          <input
            type="text"
            name="icono"
            value={formData.icono}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            maxLength={2}
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            disabled={isPending}
          />
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isPending ? 'Guardando...' : (initialData ? 'Guardar' : 'Crear')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
