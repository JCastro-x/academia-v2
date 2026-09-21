import { useState, useEffect } from 'react'
import { useEvaluationPeriodsBySubject, useCreateEvaluationPeriod, useUpdateEvaluationPeriod, useDeleteEvaluationPeriod } from '../features/evaluation-periods/hooks.js'
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
  const [newPeriodName, setNewPeriodName] = useState('')
  const [newPeriodDate, setNewPeriodDate] = useState('')
  const [editingPeriodId, setEditingPeriodId] = useState(null)
  const [editPeriodName, setEditPeriodName] = useState('')
  const [editPeriodDate, setEditPeriodDate] = useState('')

  const { data: periods } = useEvaluationPeriodsBySubject(initialData?.id)
  const createPeriod = useCreateEvaluationPeriod()
  const updatePeriod = useUpdateEvaluationPeriod()
  const deletePeriod = useDeleteEvaluationPeriod()

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        codigo: initialData.codigo || '',
        catedratico: initialData.catedratico || '',
        seccion: initialData.seccion || '',
        creditos: initialData.creditos || '',
        color: initialData.color || '#3b82f6',
        icono: initialData.icono || '📚',
        horario: initialData.horario || null,
      })
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

  const handleAddPeriod = async () => {
    if (!newPeriodName.trim() || !initialData?.id) return

    try {
      await createPeriod.mutateAsync({
        subject_id: initialData.id,
        nombre: newPeriodName.trim(),
        fecha: newPeriodDate || null,
      })
      setNewPeriodName('')
      setNewPeriodDate('')
    } catch (error) {
      console.error('Error creating period:', error)
    }
  }

  const handleDeletePeriod = async (periodId) => {
    try {
      await deletePeriod.mutateAsync(periodId)
    } catch (error) {
      console.error('Error deleting period:', error)
    }
  }

  const handleStartEditPeriod = (period) => {
    setEditingPeriodId(period.id)
    setEditPeriodName(period.nombre)
    setEditPeriodDate(period.fecha || '')
  }

  const handleCancelEditPeriod = () => {
    setEditingPeriodId(null)
    setEditPeriodName('')
    setEditPeriodDate('')
  }

  const handleSaveEditPeriod = async () => {
    if (!editingPeriodId || !editPeriodName.trim()) return

    try {
      await updatePeriod.mutateAsync({
        id: editingPeriodId,
        updates: {
          nombre: editPeriodName.trim(),
          fecha: editPeriodDate || null,
        }
      })
      handleCancelEditPeriod()
    } catch (error) {
      console.error('Error updating period:', error)
    }
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
          className="field-input form-field"
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
            value={formData.codigo || ''}
            onChange={handleChange}
            className="field-input form-field"
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
            value={formData.creditos || ''}
            onChange={handleChange}
            className="field-input form-field"
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
            value={formData.catedratico || ''}
            onChange={handleChange}
            className="field-input form-field"
            disabled={isPending}
            autoComplete="off"
          />
        </div>

        <div className="min-w-0">
          <label className="field-label">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-10 h-8 border border-gray-300 rounded cursor-pointer dark:border-[var(--dm-border)] form-field"
              disabled={isPending}
            />
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              className="flex-1 field-input text-sm form-field"
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
            value={formData.seccion || ''}
            onChange={handleChange}
            className="field-input form-field"
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
            value={formData.icono || ''}
            onChange={handleChange}
            className="field-input form-field"
            maxLength={2}
            disabled={isPending}
            autoComplete="off"
          />
        </div>
      </div>

      {initialData && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[var(--dm-border)]">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-[var(--dm-text)] mb-3">Periodos de evaluación</h4>
          
          <div className="space-y-2 mb-4">
            {periods && periods.length > 0 ? (
              periods.map(period => (
                <div key={period.id} className="bg-gray-50 dark:bg-[var(--dm-bg)] rounded-lg p-2">
                  {editingPeriodId === period.id ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={editPeriodName}
                        onChange={(e) => setEditPeriodName(e.target.value)}
                        placeholder="Nombre del periodo"
                        className="flex-1 field-input text-sm form-field min-w-[150px]"
                        disabled={updatePeriod.isPending}
                        autoComplete="off"
                      />
                      <input
                        type="date"
                        value={editPeriodDate}
                        onChange={(e) => setEditPeriodDate(e.target.value)}
                        className="field-input text-sm form-field w-[130px]"
                        disabled={updatePeriod.isPending}
                      />
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={handleSaveEditPeriod}
                          disabled={!editPeriodName.trim() || updatePeriod.isPending}
                          className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditPeriod}
                          disabled={updatePeriod.isPending}
                          className="bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500 disabled:opacity-50 text-sm"
                        >
                          ✗
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-[var(--dm-text)]">{period.nombre}</p>
                        {period.fecha && <p className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)]">{period.fecha}</p>}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          type="button"
                          onClick={() => handleStartEditPeriod(period)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          disabled={deletePeriod.isPending}
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePeriod(period.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          disabled={deletePeriod.isPending}
                          title="Eliminar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-[var(--dm-text-muted)]">No hay periodos configurados</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newPeriodName || ''}
              onChange={(e) => setNewPeriodName(e.target.value)}
              placeholder="Nombre del periodo (ej: 1er Parcial)"
              className="flex-1 field-input text-sm form-field min-w-[150px]"
              disabled={createPeriod.isPending}
              autoComplete="off"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={newPeriodDate || ''}
                onChange={(e) => setNewPeriodDate(e.target.value)}
                className="field-input text-sm form-field w-[130px]"
                disabled={createPeriod.isPending}
              />
              <button
                type="button"
                onClick={handleAddPeriod}
                disabled={!newPeriodName.trim() || createPeriod.isPending}
                className="bg-[var(--color-primary)] text-[var(--color-primary-fg)] px-3 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 flex-shrink-0"
                style={{ color: '#000000' }}
                title="Agregar periodo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 interactive bg-[var(--color-primary)] text-[var(--color-primary-fg)] py-2 px-4 rounded-lg hover:bg-[color-mix(in_srgb,var(--color-primary)_85%,black)] disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isPending ? 'Guardando...' : (initialData ? 'Guardar cambios' : 'Crear')}
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
