import { useState, useEffect } from 'react'
import '../styles/forms.css'

export default function SubjectForm({ semesterId, initialData, onSubmit, onCancel, isPending }) {
  const defaultEmptyState = {
    nombre: '',
    codigo: '',
    catedratico: '',
    seccion: '',
    creditos: '',
    color: '#3b82f6',
    icono: '📚',
    horario: null,
  }

  const [formData, setFormData] = useState(defaultEmptyState)

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData(defaultEmptyState)
    }
  }, [initialData])

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
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-gray-900 dark:text-[var(--dm-text)]">
      <div className="field">
        <label htmlFor="nombre" className="field-label required">Nombre</label>
        <input
          id="nombre"
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          className="field-input"
          required
          disabled={isPending}
          autoComplete="off"
        />
      </div>

      <div className="field-row two-cols">
        <div className="min-w-0">
          <label htmlFor="codigo" className="field-label">Código</label>
          <input
            id="codigo"
            type="text"
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            className="field-input"
            disabled={isPending}
            autoComplete="off"
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="creditos" className="field-label">Créditos</label>
          <input
            id="creditos"
            type="number"
            name="creditos"
            value={formData.creditos}
            onChange={handleChange}
            className="field-input"
            disabled={isPending}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="field-row two-cols">
        <div className="min-w-0">
          <label htmlFor="catedratico" className="field-label">Catedrático</label>
          <input
            id="catedratico"
            type="text"
            name="catedratico"
            value={formData.catedratico}
            onChange={handleChange}
            className="field-input"
            disabled={isPending}
            autoComplete="off"
          />
        </div>

        <div className="min-w-0">
          <label className="field-label">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.color}
              onChange={handleChange}
              className="w-10 h-8 border border-gray-300 rounded cursor-pointer dark:border-[var(--dm-border)]"
              disabled={isPending}
            />
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              className="flex-1 field-input text-sm"
              disabled={isPending}
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      <div className="field-row two-cols">
        <div className="min-w-0">
          <label htmlFor="seccion" className="field-label">Sección</label>
          <input
            id="seccion"
            type="text"
            name="seccion"
            value={formData.seccion}
            onChange={handleChange}
            className="field-input"
            disabled={isPending}
            autoComplete="off"
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="icono" className="field-label">Ícono</label>
          <input
            id="icono"
            type="text"
            name="icono"
            value={formData.icono}
            onChange={handleChange}
            className="field-input"
            maxLength={2}
            disabled={isPending}
            autoComplete="off"
          />
        </div>
      </div>


      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-[var(--color-primary)] text-white py-2 px-4 rounded-lg hover:bg-[color-mix(in_srgb,var(--color-primary)_85%,black)] disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isPending ? 'Guardando...' : (initialData ? 'Guardar cambios' : 'Crear')}
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
