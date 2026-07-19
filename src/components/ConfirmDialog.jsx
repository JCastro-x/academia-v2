import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../stores/ui.store.js'

export default function ConfirmDialog() {
  const { confirmDialog, closeConfirmDialog } = useUIStore()

  if (!confirmDialog) return null

  const isInfoOnly = confirmDialog.infoOnly

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={closeConfirmDialog}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg p-6 w-full max-w-md mx-4 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)]"
          onClick={e => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold mb-2 text-[var(--dm-text)] dark:text-[var(--dm-text)]">{confirmDialog.title}</h3>
          <p className="text-gray-600 mb-6 dark:text-[var(--dm-text-muted)]">{confirmDialog.message}</p>
          <div className="flex gap-3">
            {!isInfoOnly && (
              <button
                onClick={closeConfirmDialog}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={() => {
                if (!isInfoOnly && confirmDialog.onConfirm) {
                  confirmDialog.onConfirm()
                }
                closeConfirmDialog()
              }}
              className={`flex-1 py-2 px-4 rounded-lg ${isInfoOnly ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
            >
              {confirmDialog.confirmText || (isInfoOnly ? 'Entendido' : 'Eliminar')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
