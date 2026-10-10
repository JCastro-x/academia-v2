import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useHabits, useProgramaciones, useHabitLogs, usePauseDays, useAppConfig, useCreateHabit, useUpdateHabit, useDeleteHabit } from '../features/habits/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import { playSound } from '../lib/sound.js'
import { getMondayOfCurrentWeek, addDays } from '../lib/date-utils.js'
import HabitForm from '../components/HabitForm.jsx'
import ModalWrapper from '../components/ModalWrapper.jsx'
import WeeklyTracker from '../features/habits/components/WeeklyTracker.jsx'
import HabitsTabs from '../features/habits/components/HabitsTabs.jsx'
import TodayCard from '../features/habits/components/TodayCard.jsx'
import ProgressView from '../features/habits/components/ProgressView.jsx'

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
  const [isSeeding, setIsSeeding] = useState(false)
  const [activeTab, setActiveTab] = useState('semana')
  const [showExampleData, setShowExampleData] = useState(false)

  const createHabitMutation = useCreateHabit()
  const updateHabitMutation = useUpdateHabit()
  const deleteHabitMutation = useDeleteHabit()

  const { data: habits, isLoading: habitsLoading } = useHabits()
  const { data: programaciones } = useProgramaciones()
  const { data: logs } = useHabitLogs()
  const { data: pauseDays } = usePauseDays()
  const { data: config } = useAppConfig()

  // Auto-seed: crear hábitos iniciales si no existen
  useEffect(() => {
    if (!habitsLoading && habits && habits.length === 0) {
      seedInitialHabits()
    }
  }, [habits, habitsLoading])

  // Config por defecto en guest mode
  useEffect(() => {
    if (!config) {
      localStorage.setItem('guest-app-config', JSON.stringify({ ventana_edicion_dias: 7 }))
    }
  }, [config])

  const seedInitialHabits = async () => {
    setIsSeeding(true)
    try {
      const existingNames = new Set(habits?.filter(h => !h.archivado).map(h => h.nombre) || [])

      for (const habit of initialHabits) {
        if (existingNames.has(habit.nombre)) {
          continue
        }

        await createHabitMutation.mutateAsync({
          ...habit,
          user_id: 'guest',
          programacion: {
            ...habit.programacion,
            vigente_desde: getMondayOfCurrentWeek(),
          },
        })
      }
    } catch (error) {
      console.error('Error seeding habits:', error)
    } finally {
      setIsSeeding(false)
    }
  }

  const createHabit = useCreateHabit()
  const updateHabit = useUpdateHabit()
  const deleteHabit = useDeleteHabit()

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
        deleteHabit.mutate(habit.id, {
          onSuccess: () => {
            playSound('delete')
            addPendingDelete(habit)
            showUndoToast({
              message: 'Hábito eliminado',
              onUndo: () => {
                removePendingDelete(habit.id)
                // TODO: Restore habit from backup
              },
            })
          },
        })
      },
    })
  }

  if (habitsLoading || isSeeding) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600 dark:text-[var(--dm-text-muted)]">
          {isSeeding ? 'Creando hábitos iniciales...' : 'Cargando...'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-2rem)] pb-8 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h1 className="text-2xl font-bold dark:text-[var(--dm-text)]">Hábitos</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-[var(--color-primary)] text-[var(--color-primary-fg)] px-4 py-2 rounded-lg hover:opacity-90"
        >
          + Hábito
        </button>
      </div>

      {/* Pestañas */}
      <HabitsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Contenido */}
      {activeTab === 'semana' ? (
        <div className="flex-1 overflow-y-auto pb-20">
          <TodayCard
            habits={habits || []}
            logs={logs || []}
            programaciones={programaciones || []}
            pauseDays={pauseDays || []}
            config={config || {}}
          />
          <WeeklyTracker
            habits={habits || []}
            programaciones={programaciones || []}
            logs={logs || []}
            pauseDays={pauseDays || []}
            config={config || {}}
          />
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">
            {showExampleData
              ? 'Datos de ejemplo cargados para demostración'
              : 'Cada día es una oportunidad. ¡Sigue así!'}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-20">
          <ProgressView
            habits={habits || []}
            logs={logs || []}
            programaciones={programaciones || []}
            pauseDays={pauseDays || []}
            config={config || {}}
            showExampleData={showExampleData}
            onToggleExampleData={() => setShowExampleData(!showExampleData)}
          />
        </div>
      )}

      {/* Modal para crear/editar */}
      <ModalWrapper
        isOpen={isCreating || editingHabit}
        onClose={() => {
          setIsCreating(false)
          setEditingHabit(null)
        }}
        title={editingHabit ? 'Editar hábito' : 'Nuevo hábito'}
      >
        <HabitForm
          onSubmit={editingHabit ? handleEdit : handleCreate}
          onCancel={() => {
            setIsCreating(false)
            setEditingHabit(null)
          }}
          isPending={createHabit.isPending || updateHabit.isPending}
          editingHabit={editingHabit}
        />
      </ModalWrapper>
    </div>
  )
}
