import { useState, useEffect, useRef } from 'react'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/flatpickr.css'
import '../styles/forms.css'

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

export default function TaskForm({ semesterId, subjects, initialData, onSubmit, onCancel, isPending }) {
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
  const dueOptionsRef = useRef(null)
  const reminderOptionsRef = useRef(null)
  useEffect(() => {
    dueOptionsRef.current = null
    reminderOptionsRef.current = null
  }, [initialData?.id])

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

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-gray-900 dark:text-[var(--dm-text)]">
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

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-[var(--color-primary)] text-[var(--color-primary-fg)] py-2 px-4 rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-[var(--dm-border)] transition-colors"
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
