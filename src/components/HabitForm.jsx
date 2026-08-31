import { useState, useEffect } from 'react'
import '../styles/forms.css'

export default function HabitForm({ onSubmit, onCancel, isPending, editingHabit }) {
  const [nombre, setNombre] = useState('')
  const [frecuencia, setFrecuencia] = useState('diario')
  const [diasSemana, setDiasSemana] = useState([])

  useEffect(() => {
    if (editingHabit) {
      setNombre(editingHabit.nombre)
      setFrecuencia(editingHabit.frecuencia)
      setDiasSemana(editingHabit.dias_semana || [])
    }
  }, [editingHabit])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    onSubmit({
      nombre: nombre.trim(),
      frecuencia,
      dias_semana: frecuencia === 'semanal' ? diasSemana : [],
    })
  }

  const toggleDia = (dia) => {
    if (diasSemana.includes(dia)) {
      setDiasSemana(diasSemana.filter(d => d !== dia))
    } else {
      setDiasSemana([...diasSemana, dia].sort())
    }
  }

  const dias = [
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mié' },
    { value: 4, label: 'Jue' },
    { value: 5, label: 'Vie' },
    { value: 6, label: 'Sáb' },
    { value: 7, label: 'Dom' },
  ]

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
        <label htmlFor="frecuencia" className="field-label">Frecuencia</label>
        <select
          id="frecuencia"
          value={frecuencia}
          onChange={(e) => setFrecuencia(e.target.value)}
          className="field-select"
        >
          <option value="diario">Diario</option>
          <option value="semanal">Semanal</option>
        </select>
      </div>

      {frecuencia === 'semanal' && (
        <div className="field">
          <label className="field-label">Días de la semana</label>
          <div className="flex gap-2 flex-wrap">
            {dias.map((dia) => (
              <button
                key={dia.value}
                type="button"
                onClick={() => toggleDia(dia.value)}
                className={`px-3 py-2 rounded-lg border transition-all ${
                  diasSemana.includes(dia.value)
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:border-[var(--dm-border)] dark:hover:bg-[var(--dm-surface)]'
                }`}
              >
                {dia.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!nombre.trim() || isPending}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Guardando...' : (editingHabit ? 'Guardar' : 'Crear')}
        </button>
      </div>
    </form>
  )
}
