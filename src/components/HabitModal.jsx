import { useEffect } from 'react'
import HabitForm from './HabitForm.jsx'

export default function HabitModal({ isOpen, onClose, isPending, editingHabit, onSubmit }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md bg-white dark:bg-[var(--dm-surface)] rounded-2xl border border-gray-200 dark:border-[var(--dm-border)] p-5 max-h-[90dvh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-[var(--dm-text)]">
          {editingHabit ? 'Editar hábito' : 'Nuevo hábito'}
        </h2>
        <HabitForm
          onSubmit={onSubmit}
          onCancel={onClose}
          isPending={isPending}
          editingHabit={editingHabit}
        />
      </div>
    </div>
  )
}
