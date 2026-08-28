import { useState, useEffect } from 'react'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/flatpickr.css'
import { getTaskStats, countWorkDays, todayStr, parseDate } from '../domain/task-stats.js'

export default function TaskForm({ semesterId, subjects, initialData, onSubmit, onCancel, isPending }) {
  const [formData, setFormData] = useState({
    titulo: initialData?.titulo || '',
    prioridad: initialData?.prioridad || 'media',
    subject_id: initialData?.subject_id || '',
    due: initialData?.due ? initialData.due.slice(0, 16) : '',
    tipo: initialData?.tipo || 'cantidad',
    total_units: initialData?.total_units || '',
    work_days: initialData?.work_days || [1, 2, 3, 4, 5],
    subtasks: initialData?.subtasks || [],
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      semester_id: semesterId,
      ...formData,
      subject_id: formData.subject_id || null,
      due: formData.due || null,
      total_units: formData.tipo === 'cantidad' ? Number(formData.total_units) || null : null,
      subtasks: formData.tipo === 'checklist' ? formData.subtasks : null,
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleWorkDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      work_days: prev.work_days.includes(day)
        ? prev.work_days.filter(d => d !== day)
        : [...prev.work_days, day].sort()
    }))
  }

  const handleSubtaskAdd = () => {
    setFormData(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { id: Date.now(), titulo: '', done: false }]
    }))
  }

  const handleSubtaskChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map((st, i) => i === index ? { ...st, [field]: value } : st)
    }))
  }

  const handleSubtaskRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index)
    }))
  }

  // Calculate preview stats for new tasks
  const isNewTask = !initialData?.id
  const previewStats = isNewTask && formData.tipo === 'cantidad' && formData.total_units && formData.due ? (() => {
    const today = todayStr()
    const due = parseDate(formData.due)
    if (!due) return null
    
    const workDaysTotal = countWorkDays(today, formatDate(due), formData.work_days)
    const metaDiariaEstimada = workDaysTotal > 0 ? Math.ceil(Number(formData.total_units) / workDaysTotal) : 0
    
    return {
      metaDiariaEstimada,
      workDaysTotal,
      totalUnits: Number(formData.total_units)
    }
  })() : null

  // Get full stats for existing tasks
  const fullStats = !isNewTask && initialData ? getTaskStats(initialData) : null

  function formatDate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-gray-900 dark:text-[var(--dm-text)]">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">Título *</label>
        <input
          type="text"
          name="titulo"
          value={formData.titulo}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:placeholder:text-[var(--dm-text-muted)]"
          required
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">Materia</label>
          <select
            name="subject_id"
            value={formData.subject_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
            disabled={isPending}
          >
            <option value="">Sin materia</option>
            {subjects?.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.nombre}</option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">Prioridad</label>
          <select
            name="prioridad"
            value={formData.prioridad}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
            disabled={isPending}
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">Fecha de entrega</label>
        <Flatpickr
          value={formData.due}
          onChange={(dates) => {
            const dateStr = dates[0] ? dates[0].toISOString().slice(0, 16) : ''
            setFormData(prev => ({ ...prev, due: dateStr }))
          }}
          options={{
            enableTime: true,
            dateFormat: 'Y-m-d H:i',
            altInput: true,
            altFormat: 'd/m/Y H:i',
            theme: 'light',
            static: true
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
          disabled={isPending}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">Tipo de tarea</label>
        <select
          name="tipo"
          value={formData.tipo}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
          disabled={isPending}
        >
          <option value="cantidad">Por cantidad (unidades)</option>
          <option value="checklist">Checklist (subtareas)</option>
        </select>
      </div>

      {formData.tipo === 'cantidad' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">Total de unidades</label>
          <input
            type="number"
            name="total_units"
            value={formData.total_units}
            onChange={handleChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
            disabled={isPending}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">Días de trabajo</label>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
            <button
              key={day}
              type="button"
              onClick={() => handleWorkDayToggle(day)}
              className={`w-10 h-10 rounded-lg border-2 ${
                formData.work_days.includes(day)
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-gray-300 hover:border-blue-500 dark:border-[var(--dm-border)] dark:hover:border-[var(--color-primary)] dark:text-[var(--dm-text)]'
              }`}
              disabled={isPending}
            >
              {day === 1 ? 'L' : day === 2 ? 'M' : day === 3 ? 'X' : day === 4 ? 'J' : day === 5 ? 'V' : day === 6 ? 'S' : 'D'}
            </button>
          ))}
        </div>
      </div>

      {formData.tipo === 'checklist' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">Subtareas</label>
          <div className="space-y-2">
            {formData.subtasks.map((subtask, index) => (
              <div key={subtask.id} className="flex gap-2">
                <input
                  type="text"
                  value={subtask.titulo}
                  onChange={(e) => handleSubtaskChange(index, 'titulo', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
                  disabled={isPending}
                  placeholder="Subtarea..."
                />
                <button
                  type="button"
                  onClick={() => handleSubtaskRemove(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-[color-mix(in_srgb,red_12%,transparent)]"
                  disabled={isPending}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleSubtaskAdd}
              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 dark:border-[var(--dm-border)] dark:text-[var(--dm-text-muted)] dark:hover:border-[var(--color-primary)] dark:hover:text-[var(--color-primary)]"
              disabled={isPending}
            >
              + Agregar subtarea
            </button>
          </div>
        </div>
      )}

      {/* Preview for new tasks */}
      {isNewTask && previewStats && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 dark:bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--dm-surface))] dark:border-[var(--dm-border)]">
          <h4 className="font-medium text-blue-900 dark:text-[var(--color-primary)] mb-2">📊 Preview de ritmo</h4>
          <div className="text-sm text-blue-800 dark:text-[var(--dm-text)] space-y-1">
            <p>Meta diaria estimada: <strong>{previewStats.metaDiariaEstimada}</strong> unidades/día</p>
            <p>Días de trabajo: <strong>{previewStats.workDaysTotal}</strong> días</p>
            <p>Total: <strong>{previewStats.totalUnits}</strong> unidades</p>
          </div>
        </div>
      )}

      {/* Full stats for existing tasks */}
      {!isNewTask && fullStats && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)]">
          <h4 className="font-medium text-gray-900 dark:text-[var(--dm-text)] mb-2">📊 Estadísticas de ritmo</h4>
          <div className="text-sm text-gray-700 dark:text-[var(--dm-text-muted)] space-y-1">
            {fullStats.type === 'cantidad' && (
              <>
                <p>Meta hoy: <strong>{fullStats.metaHoy}</strong> unidades</p>
                <p>Necesitas hoy: <strong>{fullStats.necesitasHoy}</strong> unidades</p>
                <p>Recomendado: <strong>{fullStats.recomendado}</strong> unidades</p>
                <p>Exigencia: <strong>{fullStats.exigencia.toFixed(2)}x</strong></p>
              </>
            )}
            <p>Ritmo actual: <strong>{fullStats.ritmoActual.toFixed(2)}</strong></p>
            <p>Ritmo necesario: <strong>{fullStats.ritmoNecesario.toFixed(2)}</strong></p>
            <p>Días de atraso: <strong>{fullStats.diasDeAtraso.toFixed(2)}</strong></p>
            <p>Progreso: <strong>{fullStats.progressLabel}</strong></p>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-[var(--dm-border)]"
        >
          {isPending ? 'Guardando...' : (initialData ? 'Guardar' : 'Crear')}
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
