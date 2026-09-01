import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../stores/ui.store.js'

export default function QuickAdd({ semesterId, subjects, onAddTask, onAddSubject }) {
  const { isModalOpen, modalContent, openModal, closeModal } = useUIStore()
  const navigate = useNavigate()

  const options = [
    { id: 'task', label: 'Nueva Tarea', icon: '📝', enabled: true, action: () => openModal('task', { editingTask: null }) },
    { id: 'event', label: 'Nuevo Evento', icon: '📅', enabled: true, action: () => navigate(`/s/${semesterId}/calendar`, { state: { quickAdd: 'event' } }) },
    { id: 'topic', label: 'Nuevo Tema', icon: '📖', enabled: (subjects?.length || 0) > 0, action: () => navigate(`/s/${semesterId}/grades`, { state: { quickAdd: 'topic' } }) },
    { id: 'class', label: 'Nueva Clase', icon: '🎓', enabled: true, action: () => openModal('subject', { editingSubject: null }) },
  ]

  return (
    <>
      <button
        onClick={() => openModal('quickadd')}
        className="fixed bottom-20 right-6 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-2xl text-black shadow-lg hover:bg-[color-mix(in_srgb,var(--color-primary)_85%,black)] md:bottom-6 md:z-40"
        style={{ color: '#000000' }}
      >
        +
      </button>

      <AnimatePresence>
        {isModalOpen && modalContent === 'quickadd' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end justify-center z-[70]"
            onClick={closeModal}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="modal-panel bg-white rounded-t-2xl p-6 w-full max-w-md dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)]"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-[var(--dm-text)]">Agregar rápido</h3>
              <div className="grid grid-cols-2 gap-3">
                {options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => {
                      closeModal()
                      option.action()
                    }}
                    disabled={!option.enabled}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors ${
                      option.enabled
                        ? 'border-gray-200 hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] dark:border-[var(--dm-border)] dark:hover:border-[var(--color-primary)] dark:hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]'
                        : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed dark:border-[var(--dm-border)] dark:bg-[var(--dm-bg)]'
                    }`}
                  >
                    <span className="text-3xl">{option.icon}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-[var(--dm-text)]">{option.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={closeModal}
                className="w-full mt-4 py-3 text-gray-600 hover:text-gray-800 dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)]"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
