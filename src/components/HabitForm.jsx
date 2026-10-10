import { useState, useEffect } from 'react'
import '../styles/forms.css'

export default function HabitForm({ onSubmit, onCancel, isPending, editingHabit }) {
  const [nombre, setNombre] = useState('')
  const [momentoDia, setMomentoDia] = useState('manana')
  const [versionMinima, setVersionMinima] = useState('')

  useEffect(() => {
    if (editingHabit) {
      setNombre(editingHabit.nombre)
      setMomentoDia(editingHabit.momento_dia || 'manana')
      setVersionMinima(editingHabit.version_minima || '')
    }
  }, [editingHabit])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    onSubmit({
      nombre: nombre.trim(),
      momento_dia: momentoDia,
      version_minima: versionMinima.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-gray-900 dark:text-[var(--dm-text)]">
      <div className="field">
        <label htmlFor="nombre" className="field-label required">Nombre del hábito</label>
        <input
          id="nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="field-input"
          placeholder="Ej. Leer 30 minutos"
          autoFocus
          autoComplete="off"
        />
      </div>

      <div className="field">
        <label htmlFor="momento_dia" className="field-label">Momento del día</label>
        <select
          id="momento_dia"
          value={momentoDia}
          onChange={(e) => setMomentoDia(e.target.value)}
          className="field-select"
        >
          <option value="manana">Mañana</option>
          <option value="tarde">Tarde</option>
          <option value="noche">Noche</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="version_minima" className="field-label">Versión mínima (opcional)</label>
        <input
          id="version_minima"
          type="text"
          value={versionMinima}
          onChange={(e) => setVersionMinima(e.target.value)}
          className="field-input"
          placeholder="Ej. 10 min de ejercicio"
          autoComplete="off"
        />
        <p className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)] mt-1">
          Se muestra al mantener presionado el cuadrito naranja
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 dark:border-[var(--dm-border)] text-gray-700 dark:text-[var(--dm-text)] py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-[var(--dm-surface)]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!nombre.trim() || isPending}
          className="flex-1 bg-[var(--color-primary)] text-[var(--color-primary-fg)] py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Guardando...' : (editingHabit ? 'Guardar' : 'Crear')}
        </button>
      </div>
    </form>
  )
}
