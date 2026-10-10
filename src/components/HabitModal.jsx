import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import HabitForm from './HabitForm.jsx'

export default function HabitModal({ isOpen, onClose, isPending, editingHabit, onSubmit, programaciones }) {
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

  // Obtener programación vigente del hábito que se está editando
  const editingProgramacion = editingHabit && programaciones
    ? programaciones.find(p => p.habit_id === editingHabit.id)
    : null

  return createPortal((
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 backdrop-blur-sm p-0 sm:items-center sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)] sm:h-auto sm:max-h-[90dvh] sm:max-w-md sm:rounded-2xl sm:p-5">
        <h2 className="mb-0 flex-none px-5 pb-3 pt-5 text-xl font-bold text-gray-900 dark:text-[var(--dm-text)] sm:mb-4 sm:p-0">
          {editingHabit ? 'Editar hábito' : 'Nuevo hábito'}
        </h2>
        <HabitForm
          onSubmit={onSubmit}
          onCancel={onClose}
          isPending={isPending}
          editingHabit={editingHabit ? { ...editingHabit, programacion: editingProgramacion } : null}
        />
      </div>
    </div>
  ), document.body)
}
