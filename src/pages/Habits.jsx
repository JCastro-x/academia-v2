import { useState } from 'react'
import { useHabits, useCreateHabit, useDeleteHabit, useToggleHabitCompletion } from '../features/habits/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import { playSound } from '../lib/sound.js'
import HabitForm from '../components/HabitForm.jsx'
import ModalWrapper from '../components/ModalWrapper.jsx'

// Helper: get today's date in YYYY-MM-DD format
function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

// Helper: get day of week (1=lunes, 7=domingo) from date string
function getDayOfWeek(dateStr) {
  const date = new Date(dateStr)
  const day = date.getDay()
  return day === 0 ? 7 : day
}

export default function Habits() {
  const [isCreating, setIsCreating] = useState(false)
  const today = getTodayDate()
  const todayDayOfWeek = getDayOfWeek(today)

  const { data: habits, isLoading } = useHabits()
  const createHabit = useCreateHabit()
  const deleteHabit = useDeleteHabit()
  const toggleCompletion = useToggleHabitCompletion()
  
  const { openConfirmDialog, showUndoToast, addPendingDelete, removePendingDelete, pendingDeletes } = useUIStore()

  const handleCreate = async (habitData) => {
    try {
      await createHabit.mutateAsync(habitData)
      playSound('save')
      setIsCreating(false)
    } catch (error) {
      console.error('Error creating habit:', error)
    }
  }

  const handleDelete = (habit) => {
    openConfirmDialog({
      title: 'Eliminar hábito',
      message: `¿Estás seguro de eliminar "${habit.nombre}"? Se perderá todo el historial.`,
      confirmText: 'Eliminar',
      onConfirm: () => {
        const pendingDeleteId = Date.now()
        addPendingDelete({ type: 'habit', itemId: habit.id, pendingId: pendingDeleteId })
        showUndoToast({
          message: `Hábito "${habit.nombre}" eliminado`,
          onTimeout: async () => {
            try {
              playSound('delete')
              await deleteHabit.mutateAsync(habit.id)
              removePendingDelete(pendingDeleteId)
            } catch (error) {
              console.error('Error deleting habit:', error)
              removePendingDelete(pendingDeleteId)
            }
          },
          onUndo: () => {
            removePendingDelete(pendingDeleteId)
          }
        })
      }
    })
  }

  const handleToggle = async (habit) => {
    try {
      await toggleCompletion.mutateAsync({ id: habit.id, date: today })
      playSound(isCompletedToday(habit) ? 'task-undone' : 'task-done')
    } catch (error) {
      console.error('Error toggling habit:', error)
    }
  }

  const isCompletedToday = (habit) => {
    return (habit.historial || []).includes(today)
  }

  const shouldShowToday = (habit) => {
    if (habit.frecuencia === 'diario') return true
    if (habit.frecuencia === 'semanal') {
      return (habit.dias_semana || []).includes(todayDayOfWeek)
    }
    return false
  }

  if (isLoading) return <div>Cargando...</div>

  const filteredHabits = habits?.filter(habit => !pendingDeletes.some(pd => pd.type === 'habit' && pd.itemId === habit.id)) || []

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-[var(--dm-text)]">Hábitos</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Hábito
        </button>
      </div>

      {/* Habits List */}
      <div className="flex-1 overflow-y-auto">
        {filteredHabits.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-[var(--dm-text-muted)]">
            <p>No hay hábitos aún. Crea el primero para empezar.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredHabits.map((habit) => {
              const completed = isCompletedToday(habit)
              const showToday = shouldShowToday(habit)
              
              return (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow dark:bg-[var(--dm-surface)] dark:border-[var(--dm-border)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg dark:text-[var(--dm-text)]">{habit.nombre}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">
                        <span>
                          {habit.frecuencia === 'diario' ? 'Diario' : 
                           habit.dias_semana?.map(d => ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][d - 1]).join(', ')}
                        </span>
                        <span className="text-orange-600 font-medium">
                          🔥 {habit.racha} días
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {showToday && (
                        <button
                          onClick={() => handleToggle(habit)}
                          disabled={toggleCompletion.isPending}
                          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
                            completed 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 hover:border-green-500 dark:border-[var(--dm-border)]'
                          }`}
                        >
                          {completed && <span>✓</span>}
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(habit)}
                        className="text-red-500 hover:text-red-700 p-2 dark:text-red-400 dark:hover:text-red-300"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Habit Modal */}
      <ModalWrapper
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        className="p-6 w-full max-w-md max-h-[90vh] overflow-y-auto mx-4"
      >
        <h3 className="text-lg font-semibold mb-4">Nuevo hábito</h3>
        <HabitForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreating(false)}
          isPending={createHabit.isPending}
        />
      </ModalWrapper>
    </div>
  )
}
