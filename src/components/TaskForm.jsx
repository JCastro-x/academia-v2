import { useState, useEffect, useRef } from 'react'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/flatpickr.css'
import '../styles/forms.css'
import { getTaskStats, countWorkDays, todayStr, parseDate } from '../domain/task-stats.js'

// Convierte un string local "YYYY-MM-DDTHH:mm" al ISO UTC real usando el TZ del navegador
const localToUtcIso = (localStr) => {
  if (!localStr) return ''
  const d = new Date(localStr) // sin offset → se interpreta en el TZ local del usuario
  return isNaN(d.getTime()) ? '' : d.toISOString()
}
// Convierte un ISO UTC de la DB a string local "YYYY-MM-DDTHH:mm" para el picker
const utcIsoToLocal = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function TaskForm({ semesterId, subjects, initialData, onSubmit, onAutoSave, onCancel, isPending }) {
  const [formData, setFormData] = useState({
    titulo: initialData?.titulo || '',
    prioridad: initialData?.prioridad || 'media',
    subject_id: initialData?.subject_id || '',
    due: initialData?.due ? initialData.due.slice(0, 16) : '',
    reminder_at: utcIsoToLocal(initialData?.reminder_at),
    tipo: initialData?.tipo || 'cantidad',
    total_units: initialData?.total_units || '',
    work_days: initialData?.work_days || [1, 2, 3, 4, 5],
    subtasks: initialData?.subtasks || [],
  })
  const [saveState, setSaveState] = useState('saved')
  const dueOptionsRef = useRef(null)
  const reminderOptionsRef = useRef(null)
  useEffect(() => {
    dueOptionsRef.current = null
    reminderOptionsRef.current = null
  }, [initialData?.id])

  const lastSavedRef = useRef(initialData ? JSON.stringify({
    titulo: initialData.titulo || '',
    prioridad: initialData.prioridad || 'media',
    subject_id: initialData.subject_id || '',
    due: initialData.due ? initialData.due.slice(0, 10) : '',
    reminder_at: localToUtcIso(utcIsoToLocal(initialData.reminder_at)) || null,
    tipo: initialData.tipo || 'cantidad',
    total_units: initialData.tipo === 'cantidad' ? Number(initialData.total_units) || null : null,
    subtasks: initialData.tipo === 'checklist' ? (initialData.subtasks || []) : null,
    work_days: initialData.work_days || [1, 2, 3, 4, 5],
  }) : '')

  if (!dueOptionsRef.current) {
    dueOptionsRef.current = {
      enableTime: true,
      dateFormat: 'Y-m-d H:i',
      altInput: true,
      altFormat: 'd/m/Y H:i',
      appendTo: document.body,
      closeOnSelect: false,
      defaultDate: formData.due || 'today',
      onOpen: (selectedDates, dateStr, instance) => {
        if (instance.calendarContainer) {
          instance.calendarContainer.classList.add('calendario-centrado')
        }
      },
    }
  }

  if (!reminderOptionsRef.current) {
    reminderOptionsRef.current = {
      enableTime: true,
      dateFormat: 'Y-m-d H:i',
      altInput: true,
      altFormat: 'd/m/Y H:i',
      appendTo: document.body,
      minDate: 'today',
      closeOnSelect: false,
      defaultDate: formData.reminder_at || 'today',
      onOpen: (selectedDates, dateStr, instance) => {
        if (instance.calendarContainer) {
          instance.calendarContainer.classList.add('calendario-centrado')
        }
      },
    }
  }

  useEffect(() => {
    if (!initialData?.id || !onAutoSave) return

    const payload = {
      titulo: formData.titulo,
      prioridad: formData.prioridad,
      subject_id: formData.subject_id || null,
      due: formData.due ? formData.due.slice(0, 10) : null,
      reminder_at: localToUtcIso(formData.reminder_at) || null,
      tipo: formData.tipo,
      total_units: formData.tipo === 'cantidad' ? Number(formData.total_units) || null : null,
      subtasks: formData.tipo === 'checklist' ? formData.subtasks : null,
      work_days: formData.work_days,
    }

    const snapshot = JSON.stringify(payload)
    if (snapshot === lastSavedRef.current) return

    setSaveState('pending')

    const timeoutId = setTimeout(async () => {
      try {
        setSaveState('saving')
        await onAutoSave(payload)
        lastSavedRef.current = snapshot
        setSaveState('saved')
      } catch (error) {
        console.error('Error auto-saving task:', error)
        setSaveState('error')
      }
    }, 700)

    return () => clearTimeout(timeoutId)
  }, [formData, initialData, onAutoSave])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      semester_id: semesterId,
      ...formData,
      subject_id: formData.subject_id || null,
      due: formData.due ? formData.due.slice(0, 10) : null,
      reminder_at: localToUtcIso(formData.reminder_at) || null,
      total_units: formData.tipo === 'cantidad' ? Number(formData.total_units) || null : null,
      subtasks: formData.tipo === 'checklist' ? formData.subtasks : null,
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (initialData?.id) setSaveState('pending')
  }

  const handleWorkDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      work_days: prev.work_days.includes(day)
        ? prev.work_days.filter(d => d !== day)
        : [...prev.work_days, day].sort()
    }))
    if (initialData?.id) setSaveState('pending')
  }

  const handleSubtaskAdd = () => {
    setFormData(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { id: Date.now(), titulo: '', done: false }]
    }))
    if (initialData?.id) setSaveState('pending')
  }

  const handleSubtaskChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map((st, i) => i === index ? { ...st, [field]: value } : st)
    }))
    if (initialData?.id) setSaveState('pending')
  }

  const handleSubtaskRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index)
    }))
    if (initialData?.id) setSaveState('pending')
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
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-gray-900 dark:text-[var(--dm-text)]">
      {initialData?.id && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 dark:border-[var(--dm-border)] dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text-muted)]">
          <span>Estado de guardado</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
            saveState === 'saved' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' :
            saveState === 'saving' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' :
            saveState === 'pending' ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300' :
            'bg-red-500/10 text-red-700 dark:text-red-300'
          }`}>
            {saveState === 'saved' ? 'Guardado' : saveState === 'saving' ? 'Guardando...' : saveState === 'pending' ? 'Pendiente' : 'Error'}
          </span>
        </div>
      )}

      {/* Título */}
      <div className="field">
        <label htmlFor="titulo" className="field-label required">Título</label>
        <input
          id="titulo"
          type="text"
          name="titulo"
          value={formData.titulo}
          onChange={handleChange}
          className="field-input"
          required
          disabled={isPending}
          autoComplete="off"
        />
      </div>

      {/* Materia + Prioridad */}
      <div className="field-row two-cols">
        <div className="min-w-0">
          <label htmlFor="subject_id" className="field-label">Materia</label>
          <select
            id="subject_id"
            name="subject_id"
            value={formData.subject_id}
            onChange={handleChange}
            className="field-select"
            disabled={isPending}
          >
            <option value="">Sin materia</option>
            {subjects?.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.nombre}</option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor="prioridad" className="field-label">Prioridad</label>
          <select
            id="prioridad"
            name="prioridad"
            value={formData.prioridad}
            onChange={handleChange}
            className="field-select"
            disabled={isPending}
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>
      </div>

      {/* Fecha de entrega + Recordatorio */}
      <div className="field-row two-cols">
        <div className="min-w-0">
          <label htmlFor="due" className="field-label">Fecha de entrega</label>
          <Flatpickr
            id="due"
            value={formData.due || ''}
            onChange={(dates) => {
              const selectedDate = dates[0]
              const dateStr = selectedDate
                ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}T${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}`
                : ''
              setFormData(prev => ({ ...prev, due: dateStr }))
            }}
            options={dueOptionsRef.current}
            className="field-input"
            disabled={isPending}
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="reminder_at" className="field-label">Recordatorio (opcional)</label>
          <Flatpickr
            id="reminder_at"
            value={formData.reminder_at || ''}
            onChange={(dates) => {
              const selectedDate = dates[0]
              const dateStr = selectedDate
                ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}T${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}`
                : ''
              setFormData(prev => ({ ...prev, reminder_at: dateStr }))
            }}
            options={reminderOptionsRef.current}
            className="field-input"
            disabled={isPending}
            placeholder="Selecciona fecha y hora..."
          />
        </div>
      </div>

      {/* Tipo de tarea + Total de unidades */}
      <div className="field-row two-cols">
        <div className="min-w-0">
          <label htmlFor="tipo" className="field-label">Tipo de tarea</label>
          <select
            id="tipo"
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            className="field-select"
            disabled={isPending}
          >
            <option value="cantidad">Por cantidad (unidades)</option>
            <option value="checklist">Checklist (subtareas)</option>
          </select>
        </div>

        {formData.tipo === 'cantidad' && (
          <div className="min-w-0">
            <label htmlFor="total_units" className="field-label">Total de unidades</label>
            <input
              id="total_units"
              type="number"
              name="total_units"
              value={formData.total_units}
              onChange={handleChange}
              min="1"
              className="field-input"
              disabled={isPending}
            />
          </div>
        )}
      </div>

      {/* Días de trabajo */}
      <div className="field">
        <label className="field-label">Días de trabajo</label>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
            <button
              key={day}
              type="button"
              onClick={() => handleWorkDayToggle(day)}
              className={`w-10 h-10 rounded-lg border-2 font-semibold text-sm transition-all ${
                formData.work_days.includes(day)
                  ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-primary-fg)]'
                  : 'border-gray-300 hover:border-[var(--color-primary)] dark:border-[var(--dm-border)] dark:hover:border-[var(--color-primary)] dark:text-[var(--dm-text)]'
              }`}
              disabled={isPending}
            >
              {day === 1 ? 'L' : day === 2 ? 'M' : day === 3 ? 'X' : day === 4 ? 'J' : day === 5 ? 'V' : day === 6 ? 'S' : 'D'}
            </button>
          ))}
        </div>
      </div>

      {/* Subtareas (solo si tipo === checklist) */}
      {formData.tipo === 'checklist' && (
        <div className="field">
          <label className="field-label">Subtareas</label>
          <div className="space-y-2">
            {formData.subtasks.map((subtask, index) => (
              <div key={subtask.id} className="subtask-row">
                <input
                  type="text"
                  value={subtask.titulo}
                  onChange={(e) => handleSubtaskChange(index, 'titulo', e.target.value)}
                  className="field-input"
                  disabled={isPending}
                  placeholder="Subtarea..."
                />
                <button
                  type="button"
                  onClick={() => handleSubtaskRemove(index)}
                  className="subtask-remove-btn"
                  disabled={isPending}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleSubtaskAdd}
              className="add-row-btn"
              disabled={isPending}
            >
              + Agregar subtarea
            </button>
          </div>
        </div>
      )}

      {/* Preview para nuevas tareas */}
      {isNewTask && previewStats && (
        <div className="bg-blue-50 dark:bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--dm-surface))] rounded-lg p-4 border border-blue-200 dark:border-[var(--dm-border)]">
          <h4 className="font-medium text-blue-900 dark:text-[var(--color-primary)] mb-2">📊 Preview de ritmo</h4>
          <div className="text-sm text-blue-800 dark:text-[var(--dm-text)] space-y-1">
            <p>Meta diaria estimada: <strong>{previewStats.metaDiariaEstimada}</strong> unidades/día</p>
            <p>Días de trabajo: <strong>{previewStats.workDaysTotal}</strong> días</p>
            <p>Total: <strong>{previewStats.totalUnits}</strong> unidades</p>
          </div>
        </div>
      )}

      {/* Estadísticas para tareas existentes */}
      {!isNewTask && fullStats && (
        <div className="bg-gray-50 dark:bg-[var(--dm-bg)] rounded-lg p-4 border border-gray-200 dark:border-[var(--dm-border)]">
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

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-[var(--dm-border)] transition-colors"
        >
          {isPending ? 'Guardando...' : (initialData ? 'Guardar' : 'Crear')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:bg-gray-300 disabled:cursor-not-allowed dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)] dark:disabled:bg-[var(--dm-border)] transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
