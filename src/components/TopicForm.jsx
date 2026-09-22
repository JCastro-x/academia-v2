import { useState, useEffect } from 'react'
import { useSubjects } from '../features/subjects/hooks.js'
import { useEvaluationPeriodsBySubject } from '../features/evaluation-periods/hooks.js'
import '../styles/forms.css'

export default function TopicForm({ semesterId, initialData, onSubmit, onCancel, isPending }) {
  const { data: subjects } = useSubjects(semesterId)
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialData?.subject_id || '')
  const [selectedPeriodId, setSelectedPeriodId] = useState(initialData?.evaluation_period_id || '')
  const [titulo, setTitulo] = useState(initialData?.nombre || '')
  const [subtema, setSubtema] = useState(initialData?.subtema || '')
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || '')
  const isEditing = !!initialData?.id

  const { data: periods } = useEvaluationPeriodsBySubject(selectedSubjectId)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedSubjectId || !titulo.trim()) {
      alert('Por favor completa los campos obligatorios')
      return
    }
    onSubmit({
      subject_id: selectedSubjectId,
      evaluation_period_id: selectedPeriodId || null, // null si no se selecciona periodo
      nombre: titulo.trim(),
      subtema: subtema.trim(),
      descripcion: descripcion.trim(),
    })
  }

  const handleSubjectChange = (e) => {
    if (isEditing) return // Don't allow subject change when editing
    setSelectedSubjectId(e.target.value)
    setSelectedPeriodId('') // Reset period when subject changes
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-gray-900 dark:text-[var(--dm-text)]">
      <div className="field">
        <label htmlFor="materia" className="field-label required">Materia</label>
        <select
          id="materia"
          value={selectedSubjectId}
          onChange={handleSubjectChange}
          className="field-input form-field"
          required
          disabled={isPending || isEditing}
        >
          <option value="">Selecciona una materia</option>
          {subjects?.map(subject => (
            <option key={subject.id} value={subject.id}>{subject.nombre}</option>
          ))}
        </select>
        {isEditing && (
          <p className="text-xs text-gray-500 mt-1 dark:text-[var(--dm-text-muted)]">La materia no se puede cambiar al editar</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="periodo" className="field-label">Periodo de evaluación (opcional)</label>
        {selectedSubjectId ? (
          <>
            <select
              id="periodo"
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="field-input form-field"
              disabled={isPending}
            >
              <option value="">Sin periodo (General)</option>
              {periods && periods.length > 0 && periods.map(period => (
                <option key={period.id} value={period.id}>{period.nombre}</option>
              ))}
            </select>
            {!isEditing && (!periods || periods.length === 0) && (
              <p className="text-xs text-gray-500 mt-1 dark:text-[var(--dm-text-muted)]">
                Esta materia no tiene periodos configurados. El tema se guardará en la sección "General".
              </p>
            )}
          </>
        ) : (
          <select
            id="periodo"
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="field-input form-field"
            disabled
          >
            <option value="">Primero selecciona una materia</option>
          </select>
        )}
        {isEditing && (
          <p className="text-xs text-gray-500 mt-1 dark:text-[var(--dm-text-muted)]">Puedes asignar o quitar el periodo al editar</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="titulo" className="field-label required">Título del tema</label>
        <input
          id="titulo"
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="field-input form-field"
          required
          disabled={isPending}
          autoComplete="off"
          placeholder="Ej: Ecuaciones diferenciales"
        />
      </div>

      <div className="field">
        <label htmlFor="subtema" className="field-label">Subtema (opcional)</label>
        <input
          id="subtema"
          type="text"
          value={subtema}
          onChange={(e) => setSubtema(e.target.value)}
          className="field-input form-field"
          disabled={isPending}
          autoComplete="off"
          placeholder="Ej: Separación de variables"
        />
      </div>

      <div className="field">
        <label htmlFor="descripcion" className="field-label">Descripción</label>
        <textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="field-input form-field min-h-[100px] resize-y"
          disabled={isPending}
          placeholder="Anota qué se vio en clase..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending || !selectedSubjectId || !titulo.trim()}
          className="flex-1 interactive bg-[var(--color-primary)] text-[var(--color-primary-fg)] py-2 px-4 rounded-lg hover:bg-[color-mix(in_srgb,var(--color-primary)_85%,black)] disabled:bg-gray-400 disabled:cursor-not-allowed"
          style={{ color: '#000000' }}
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 interactive bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:bg-gray-300 disabled:cursor-not-allowed dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)] dark:disabled:bg-[var(--dm-border)]"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
