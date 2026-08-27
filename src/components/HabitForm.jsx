import { useState } from 'react'

export default function HabitForm({ onSubmit, onCancel, isPending }) {
  const [nombre, setNombre] = useState('')
  const [frecuencia, setFrecuencia] = useState('diario')
  const [diasSemana, setDiasSemana] = useState([])

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre del hábito</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej. Leer 30 minutos"
          autoFocus
          autoComplete="off"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Frecuencia</label>
        <select
          value={frecuencia}
          onChange={(e) => setFrecuencia(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="diario">Diario</option>
          <option value="semanal">Semanal</option>
        </select>
      </div>

      {frecuencia === 'semanal' && (
        <div>
          <label className="block text-sm font-medium mb-1">Días de la semana</label>
          <div className="flex gap-2 flex-wrap">
            {dias.map((dia) => (
              <button
                key={dia.value}
                type="button"
                onClick={() => toggleDia(dia.value)}
                className={`px-3 py-2 rounded-lg border ${
                  diasSemana.includes(dia.value)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
          {isPending ? 'Guardando...' : 'Crear'}
        </button>
      </div>
    </form>
  )
}
