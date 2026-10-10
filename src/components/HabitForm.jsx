import { useState, useEffect } from 'react'
import { getMondayOfCurrentWeek, getTodayDate } from '../lib/date-utils.js'

const TIPO_OPTIONS = [
  { value: 'dias_fijos', label: 'Días fijos' },
  { value: 'meta_semanal', label: 'Meta semanal' },
  { value: 'periodico', label: 'Periódico' },
  { value: 'evitar', label: 'Evitar' },
]

const DAYS_OF_WEEK = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'X' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 7, label: 'D' },
]

export default function HabitForm({ onSubmit, onCancel, isPending, editingHabit }) {
  const [nombre, setNombre] = useState('')
  const [momentoDia, setMomentoDia] = useState('manana')
  const [versionMinima, setVersionMinima] = useState('')
  const [tipo, setTipo] = useState('dias_fijos')
  const [diasSemana, setDiasSemana] = useState([1, 2, 3, 4, 5])
  const [metaSemanal, setMetaSemanal] = useState(1)
  const [diasSugeridos, setDiasSugeridos] = useState([])
  const [periodoSemanas, setPeriodoSemanas] = useState(1)
  const [diaSugerido, setDiaSugerido] = useState(1)
  const [permitirFindePlus, setPermitirFindePlus] = useState(false)
  const [tolerarRojoAislado, setTolerarRojoAislado] = useState(false)

  useEffect(() => {
    if (editingHabit) {
      setNombre(editingHabit.nombre)
      setMomentoDia(editingHabit.momento_dia || 'manana')
      setVersionMinima(editingHabit.version_minima || '')
      
      // Cargar programación si se proporciona
      if (editingHabit.programacion) {
        setTipo(editingHabit.programacion.tipo || 'dias_fijos')
        setDiasSemana(editingHabit.programacion.dias_semana || [1, 2, 3, 4, 5])
        setMetaSemanal(editingHabit.programacion.meta_semanal || 1)
        setDiasSugeridos(editingHabit.programacion.dias_sugeridos || [])
        setPeriodoSemanas(editingHabit.programacion.periodo_semanas || 1)
        setDiaSugerido(editingHabit.programacion.dias_sugeridos?.[0] || 1)
        setPermitirFindePlus(editingHabit.programacion.permitir_finde_plus || false)
        setTolerarRojoAislado(editingHabit.programacion.tolerar_rojo_aislado || false)
      }
    }
  }, [editingHabit])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nombre.trim()) return

    const programacion = {
      tipo,
      vigente_desde: editingHabit ? getTodayDate() : getMondayOfCurrentWeek(),
      permitir_finde_plus: permitirFindePlus,
      tolerar_rojo_aislado: tolerarRojoAislado,
    }

    if (tipo === 'dias_fijos') {
      programacion.dias_semana = diasSemana
    } else if (tipo === 'meta_semanal') {
      programacion.meta_semanal = metaSemanal
      programacion.dias_sugeridos = diasSugeridos
    } else if (tipo === 'periodico') {
      programacion.periodo_semanas = periodoSemanas
      programacion.dias_sugeridos = [diaSugerido]
    }

    onSubmit({
      nombre: nombre.trim(),
      momento_dia: momentoDia,
      version_minima: versionMinima.trim() || null,
      programacion,
    })
  }

  const toggleDia = (dia) => {
    setDiasSemana(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    )
  }

  const toggleDiaSugerido = (dia) => {
    setDiasSugeridos(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    )
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="flex min-h-0 flex-1 flex-col text-gray-900 dark:text-[var(--dm-text)]">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 sm:p-0">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium mb-1">Nombre del hábito</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-3 py-2 text-base sm:text-[inherit] rounded-lg border border-gray-300 dark:border-[var(--dm-border)] bg-white dark:bg-[var(--dm-surface)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            placeholder="Ej. Leer 30 minutos"
            autoFocus
            autoComplete="off"
          />
        </div>

      <div>
        <label htmlFor="momento_dia" className="block text-sm font-medium mb-1">Momento del día</label>
        <select
          id="momento_dia"
          value={momentoDia}
          onChange={(e) => setMomentoDia(e.target.value)}
          className="w-full px-3 py-2 text-base sm:text-[inherit] rounded-lg border border-gray-300 dark:border-[var(--dm-border)] bg-white dark:bg-[var(--dm-surface)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
        >
          <option value="manana">Mañana</option>
          <option value="tarde">Tarde</option>
          <option value="noche">Noche</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tipo de programación</label>
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[var(--dm-border)] rounded-lg">
          {TIPO_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTipo(option.value)}
              className={`min-h-[44px] sm:min-h-0 flex-1 px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                tipo === option.value
                  ? 'bg-white dark:bg-[var(--dm-surface)] shadow-sm text-[var(--color-primary)]'
                  : 'text-gray-600 dark:text-[var(--dm-text-muted)] hover:text-gray-900 dark:hover:text-[var(--dm-text)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {tipo === 'dias_fijos' && (
        <div>
          <label className="block text-sm font-medium mb-2">Días de la semana</label>
          <div className="flex gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDia(day.value)}
                className={`min-h-[44px] sm:min-h-0 flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  diasSemana.includes(day.value)
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
                    : 'bg-gray-100 dark:bg-[var(--dm-border)] text-gray-600 dark:text-[var(--dm-text-muted)]'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tipo === 'meta_semanal' && (
        <>
          <div>
            <label htmlFor="meta_semanal" className="block text-sm font-medium mb-1">Veces por semana</label>
            <input
              id="meta_semanal"
              type="number"
              min="1"
              max="7"
              value={metaSemanal}
              onChange={(e) => setMetaSemanal(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 text-base sm:text-[inherit] rounded-lg border border-gray-300 dark:border-[var(--dm-border)] bg-white dark:bg-[var(--dm-surface)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Días sugeridos (opcional)</label>
            <div className="flex gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDiaSugerido(day.value)}
                  className={`min-h-[44px] sm:min-h-0 flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    diasSugeridos.includes(day.value)
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
                      : 'bg-gray-100 dark:bg-[var(--dm-border)] text-gray-600 dark:text-[var(--dm-text-muted)]'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {tipo === 'periodico' && (
        <>
          <div>
            <label htmlFor="periodo_semanas" className="block text-sm font-medium mb-1">Cada N semanas</label>
            <input
              id="periodo_semanas"
              type="number"
              min="1"
              value={periodoSemanas}
              onChange={(e) => setPeriodoSemanas(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 text-base sm:text-[inherit] rounded-lg border border-gray-300 dark:border-[var(--dm-border)] bg-white dark:bg-[var(--dm-surface)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="dia_sugerido" className="block text-sm font-medium mb-1">Día sugerido</label>
            <select
              id="dia_sugerido"
              value={diaSugerido}
              onChange={(e) => setDiaSugerido(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-base sm:text-[inherit] rounded-lg border border-gray-300 dark:border-[var(--dm-border)] bg-white dark:bg-[var(--dm-surface)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {tipo === 'evitar' && (
        <p className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">
          Este hábito estará cumplido por defecto. Solo marca los días que falles.
        </p>
      )}

      <div>
        <label htmlFor="version_minima" className="block text-sm font-medium mb-1">Versión mínima (opcional)</label>
        <input
          id="version_minima"
          type="text"
          value={versionMinima}
          onChange={(e) => setVersionMinima(e.target.value)}
          className="w-full px-3 py-2 text-base sm:text-[inherit] rounded-lg border border-gray-300 dark:border-[var(--dm-border)] bg-white dark:bg-[var(--dm-surface)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          placeholder="Ej. 10 min de ejercicio"
          autoComplete="off"
        />
        <p className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)] mt-1">
          Se muestra al mantener presionado el cuadrito naranja
        </p>
      </div>

      {tipo !== 'evitar' && (
        <div className="space-y-2">
          <label className="flex min-h-[44px] sm:min-h-0 w-full items-center gap-3 sm:gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={permitirFindePlus}
                onChange={(e) => setPermitirFindePlus(e.target.checked)}
                className="sr-only"
              />
              <div className={`h-6 w-6 sm:h-5 sm:w-5 rounded border-2 flex items-center justify-center transition-colors ${
                permitirFindePlus
                  ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                  : 'border-gray-300 dark:border-[var(--dm-border)] bg-white dark:bg-[var(--dm-surface)]'
              }`}>
                {permitirFindePlus && <span className="text-white text-xs">✓</span>}
              </div>
            </div>
            <span className="text-sm dark:text-[var(--dm-text)]">Sábado y domingo son plus</span>
          </label>
          <label className="flex min-h-[44px] sm:min-h-0 w-full items-center gap-3 sm:gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={tolerarRojoAislado}
                onChange={(e) => setTolerarRojoAislado(e.target.checked)}
                className="sr-only"
              />
              <div className={`h-6 w-6 sm:h-5 sm:w-5 rounded border-2 flex items-center justify-center transition-colors ${
                tolerarRojoAislado
                  ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                  : 'border-gray-300 dark:border-[var(--dm-border)] bg-white dark:bg-[var(--dm-surface)]'
              }`}>
                {tolerarRojoAislado && <span className="text-white text-xs">✓</span>}
              </div>
            </div>
            <span className="text-sm dark:text-[var(--dm-text)]">Tolerar un rojo aislado</span>
          </label>
        </div>
      )}

      </div>
      <div className="sticky bottom-0 flex flex-none gap-3 border-t border-gray-200 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)] sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] sm:min-h-0 flex-1 border border-gray-300 dark:border-[var(--dm-border)] text-gray-700 dark:text-[var(--dm-text)] py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-[var(--dm-surface)]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!nombre.trim() || isPending}
          className="min-h-[44px] sm:min-h-0 flex-1 bg-[var(--color-primary)] text-[var(--color-primary-fg)] py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Guardando...' : (editingHabit ? 'Guardar' : 'Crear')}
        </button>
      </div>
    </form>
  )
}
