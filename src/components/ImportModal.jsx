import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '../stores/ui.store.js'
import { importUserBackup, validateBackupPayload } from '../lib/importData.js'

export default function ImportModal() {
  const { isModalOpen, modalContent, closeModal, addToast } = useUIStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [backupData, setBackupData] = useState(null)
  const [backupSummary, setBackupSummary] = useState(null)
  const [replaceAll, setReplaceAll] = useState(false)
  const [replaceConfirm, setReplaceConfirm] = useState('')
  const [validationError, setValidationError] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const resetState = () => {
    setFileName('')
    setBackupData(null)
    setBackupSummary(null)
    setReplaceAll(false)
    setReplaceConfirm('')
    setValidationError('')
    setIsImporting(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const closeAndReset = () => {
    closeModal()
    resetState()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setFileName('')
      setBackupData(null)
      setBackupSummary(null)
      return
    }

    setFileName(file.name)
    setValidationError('')
    setBackupData(null)
    setBackupSummary(null)

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const validation = validateBackupPayload(parsed)

      if (!validation.valid) {
        throw new Error(validation.error)
      }

      setBackupData(parsed)
      setBackupSummary(validation)
    } catch (error) {
      setValidationError(error?.message || 'No se pudo leer el archivo JSON.')
      setBackupData(null)
      setBackupSummary(null)
    }
  }

  const handleImport = async () => {
    if (!backupData) {
      setValidationError('Selecciona un archivo JSON válido antes de importar.')
      return
    }

    if (replaceAll && replaceConfirm.trim().toUpperCase() !== 'REEMPLAZAR') {
      setValidationError('Escribe REEMPLAZAR para confirmar la importación destructiva.')
      return
    }

    setIsImporting(true)
    setValidationError('')

    try {
      await importUserBackup(backupData, { replaceAll })
      await queryClient.invalidateQueries()
      addToast({ type: 'success', message: `Importación ${replaceAll ? 'con reemplazo total' : 'fusionada'} completada.` })
      closeAndReset()
    } catch (error) {
      setValidationError(error?.message || 'Error al importar los datos.')
    } finally {
      setIsImporting(false)
    }
  }

  if (!isModalOpen || modalContent !== 'import') return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]"
        onClick={closeAndReset}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="modal-panel bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-[var(--dm-text)]">Importar JSON</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">
                Carga un archivo de respaldo generado por Academia v2. La importación se fusiona con los datos existentes de forma predeterminada.
              </p>
            </div>
            <button
              onClick={closeAndReset}
              className="text-gray-500 hover:text-gray-700 dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)]"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="mt-6 space-y-6">
            <div className="rounded-xl border border-gray-200 dark:border-[var(--dm-border)] bg-gray-50 dark:bg-[var(--dm-bg)] p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--dm-text-muted)] mb-2">
                Archivo JSON de respaldo
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-700 dark:text-[var(--dm-text)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-[var(--color-primary-fg)] hover:file:bg-[var(--color-primary)]"
              />
              {fileName && (
                <p className="mt-2 text-sm text-gray-500 dark:text-[var(--dm-text-muted)]">Archivo seleccionado: {fileName}</p>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-[var(--dm-border)] bg-white dark:bg-[var(--dm-surface)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-[var(--dm-text)]">Modo de importación</p>
                  <p className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)]">
                    Fusionar por defecto. El reemplazo total borra los datos actuales antes de importar.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceAll}
                  onChange={(e) => setReplaceAll(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <span className="text-sm text-gray-700 dark:text-[var(--dm-text)]">Reemplazar todos los datos existentes</span>
              </label>

              {replaceAll && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-[var(--dm-text-muted)] mb-2">
                    Escribe <span className="font-semibold">REEMPLAZAR</span> para confirmar
                  </label>
                  <input
                    type="text"
                    value={replaceConfirm}
                    onChange={(e) => setReplaceConfirm(e.target.value)}
                    placeholder="REEMPLAZAR"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--dm-border)] dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    autoComplete="off"
                  />
                </div>
              )}
            </div>

            {backupSummary && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-100">
                Respaldo válido con {backupSummary.totalRows} filas en {backupSummary.tables.length} tablas.
              </div>
            )}

            {validationError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-100">
                {validationError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={closeAndReset}
                className="w-full sm:w-auto px-4 py-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || !backupData || (replaceAll && replaceConfirm.trim().toUpperCase() !== 'REEMPLAZAR')}
                className="w-full sm:w-auto px-4 py-3 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-fg)] text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isImporting ? 'Importando...' : 'Importar respaldo'}
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)]">
              Nota: los metadatos de adjuntos se importan, pero los archivos físicos de Storage no se restauran automáticamente.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
