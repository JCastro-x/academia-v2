import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useHabits, useProgramaciones, useHabitLogs, usePauseDays, useAppConfig, useCreateHabit, useUpdateHabit, useDeleteHabit } from '../features/habits/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import { playSound } from '../lib/sound.js'
import { getCurrentUser } from '../lib/supabase.js'
import { supabase } from '../lib/supabase.js'
import { getTodayDate, getMondayOfCurrentWeek } from '../lib/date-utils.js'
import HabitForm from '../components/HabitForm.jsx'
import ModalWrapper from '../components/ModalWrapper.jsx'
import WeeklyTracker from '../features/habits/components/WeeklyTracker.jsx'

const initialHabits = [
  {
    nombre: 'Despertar a las 7',
    momento_dia: 'manana',
    programacion: {
      tipo: 'dias_fijos',
      dias_semana: [1, 2, 3, 4, 5],
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
  {
    nombre: 'Celular lejos al levantarme y desayuno',
    momento_dia: 'manana',
    programacion: {
      tipo: 'dias_fijos',
      dias_semana: [1, 2, 3, 4, 5],
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
  {
    nombre: 'Lectura',
    momento_dia: 'manana',
    programacion: {
      tipo: 'dias_fijos',
      dias_semana: [1, 2, 3, 4, 5],
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
  {
    nombre: 'Bloque de estudio',
    momento_dia: 'tarde',
    programacion: {
      tipo: 'dias_fijos',
      dias_semana: [1, 2, 3, 4, 5],
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
  {
    nombre: 'Python',
    momento_dia: 'tarde',
    programacion: {
      tipo: 'dias_fijos',
      dias_semana: [1, 2, 3, 4, 5],
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
  {
    nombre: 'Ejercicio',
    momento_dia: 'tarde',
    version_minima: '10-15 min',
    programacion: {
      tipo: 'dias_fijos',
      dias_semana: [1, 2, 3, 4, 5],
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
  {
    nombre: 'Journaling corto',
    momento_dia: 'noche',
    programacion: {
      tipo: 'dias_fijos',
      dias_semana: [1, 2, 3, 4, 5, 6, 7],
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
  {
    nombre: 'Dormir 10:05 con celular fuera de la cama',
    momento_dia: 'noche',
    programacion: {
      tipo: 'dias_fijos',
      dias_semana: [1, 2, 3, 4, 5, 6, 7],
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
]

export default function Habits() {
  const [isCreating, setIsCreating] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [user, setUser] = useState(null)
  const [isSeeding, setIsSeeding] = useState(false)

  const { data: habits, isLoading } = useHabits()
  const { data: programaciones } = useProgramaciones()
  const { data: logs } = useHabitLogs()
  const { data: pauseDays } = usePauseDays(user?.id)
  const { data: config } = useAppConfig(user?.id)

  const createHabit = useCreateHabit()

  // Cargar usuario al montar
  useEffect(() => {
    getCurrentUser().then(setUser).catch(console.error)
  }, [])

  const handleSeedInitialHabits = async () => {
    if (!user) return
    setIsSeeding(true)

    try {
      // Obtener hábitos activos existentes
      const { data: existingActiveHabits } = await supabase
        .from('habits')
        .select('id, nombre')
        .eq('user_id', user.id)
        .eq('archivado', false)

      const existingNames = new Set(existingActiveHabits?.map(h => h.nombre) || [])

      let createdCount = 0
      let skippedCount = 0

      for (const habit of initialHabits) {
        if (existingNames.has(habit.nombre)) {
          skippedCount++
          continue
        }

        await createHabitMutation.mutateAsync({
          ...habit,
          user_id: user.id,
          programacion: {
            ...habit.programacion,
            vigente_desde: getMondayOfCurrentWeek(), // Lunes de la semana actual
          },
        })
        createdCount++
      }

      // Crear config por defecto
      await supabase
        .from('app_config')
        .upsert({
          user_id: user.id,
          ventana_edicion_dias: 7,
        })

      playSound('save')
      alert(`Semilla completada: ${createdCount} creados, ${skippedCount} saltados`)
    } catch (error) {
      console.error('Error seeding habits:', error)
      alert('Error al sembrar hábitos')
    } finally {
      setIsSeeding(false)
    }
  }

  const createHabitMutation = useCreateHabit()
  const updateHabit = useUpdateHabit()
  const deleteHabit = useDeleteHabit()

  const { openConfirmDialog, showUndoToast, addPendingDelete, removePendingDelete, pendingDeletes } = useUIStore()

  const handleCreate = async (habitData) => {
    try {
      await createHabitMutation.mutateAsync(habitData)
      playSound('save')
      setIsCreating(false)
    } catch (error) {
      console.error('Error creating habit:', error)
    }
  }

  const handleEdit = async (habitData) => {
    try {
      await updateHabit.mutateAsync({ id: editingHabit.id, updates: habitData })
      playSound('save')
      setEditingHabit(null)
    } catch (error) {
      console.error('Error updating habit:', error)
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

  if (isLoading) return <div>Cargando...</div>

  const filteredHabits = habits?.filter(habit => !pendingDeletes.some(pd => pd.type === 'habit' && pd.itemId === habit.id)) || []

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-[var(--dm-text)]">Hábitos</h1>
        <div className="flex gap-2">
          {habits && habits.filter(h => !h.archivado).length === 0 && (
            <button
              onClick={handleSeedInitialHabits}
              disabled={isSeeding}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {isSeeding ? 'Sembrando...' : 'Crear hábitos iniciales'}
            </button>
          )}
          <button
            onClick={() => setIsCreating(true)}
            className="bg-[var(--color-primary)] text-[var(--color-primary-fg)] px-4 py-2 rounded-lg hover:opacity-90"
          >
            + Hábito
          </button>
        </div>
      </div>

      {/* Weekly Tracker */}
      <WeeklyTracker
        habits={filteredHabits}
        programaciones={programaciones || []}
        logs={logs || []}
        pauseDays={pauseDays || []}
        config={config || { ventana_edicion_dias: 7 }}
      />

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
          isPending={createHabitMutation.isPending}
        />
      </ModalWrapper>

      {/* Edit Habit Modal */}
      <ModalWrapper
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        className="p-6 w-full max-w-md max-h-[90vh] overflow-y-auto mx-4"
      >
        <h3 className="text-lg font-semibold mb-4">Editar hábito</h3>
        <HabitForm
          onSubmit={handleEdit}
          onCancel={() => setEditingHabit(null)}
          isPending={updateHabit.isPending}
          editingHabit={editingHabit}
        />
      </ModalWrapper>
    </div>
  )
}
