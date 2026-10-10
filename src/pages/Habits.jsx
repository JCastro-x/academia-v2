import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useHabits, useProgramaciones, useHabitLogs, usePauseDays, useAppConfig, useCreateHabit, useUpdateHabit, useArchiveHabit, useTogglePauseDay } from '../features/habits/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import { playSound } from '../lib/sound.js'
import { getMondayOfCurrentWeek, addDays, getDayOfWeek } from '../lib/date-utils.js'
import HabitModal from '../components/HabitModal.jsx'
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
  {
    nombre: 'Demo: Leer 3 libros por mes',
    momento_dia: 'tarde',
    programacion: {
      tipo: 'meta_semanal',
      meta_semanal: 3,
      dias_sugeridos: [1, 3, 5],
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
  {
    nombre: 'Demo: Revisar finanzas',
    momento_dia: 'tarde',
    programacion: {
      tipo: 'periodico',
      periodo_semanas: 2,
      dias_sugeridos: [6],
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
  {
    nombre: 'Demo: No comer dulces',
    momento_dia: 'tarde',
    programacion: {
      tipo: 'evitar',
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
  const [showArchived, setShowArchived] = useState(false)

  const createHabitMutation = useCreateHabit()
  const updateHabitMutation = useUpdateHabit()
  const archiveHabitMutation = useArchiveHabit()
  const togglePauseDayMutation = useTogglePauseDay()

  const { data: habits, isLoading: habitsLoading } = useHabits()
  const { data: programaciones } = useProgramaciones()
  const { data: logs } = useHabitLogs()
  const { data: pauseDays } = usePauseDays()
  const { data: config } = useAppConfig()

  // Auto-seed: crear hábitos iniciales si no existen (solo una vez por usuario)
  useEffect(() => {
    const seeded = localStorage.getItem('habitos_sembrados')
    const hasActiveHabits = habits && habits.some(h => !h.archivado)
    if (!habitsLoading && !hasActiveHabits && !seeded) {
      seedInitialHabits()
    }
  }, [habits, habitsLoading])

  // Config por defecto en guest mode
  useEffect(() => {
    if (!config) {
      localStorage.setItem('guest-app-config', JSON.stringify({ ventana_edicion_dias: 7 }))
    }
  }, [config])

  // Verificar si la semana está completa (solo hábitos de días fijos)
  const isWeekComplete = () => {
    if (!habits || !logs || !programaciones) return false
    const today = getTodayDate()
    const dayOfWeek = getDayOfWeek(today)
    const monday = addDays(today, -(dayOfWeek - 1))
    
    const diasFijosHabits = habits.filter(h => {
      if (h.archivado) return false
      const prog = programaciones.find(p => p.habit_id === h.id)
      return prog?.tipo === 'dias_fijos'
    })
    
    for (const habit of diasFijosHabits) {
      const prog = programaciones.find(p => p.habit_id === habit.id)
      if (!prog) continue
      
      for (let i = 0; i < 7; i++) {
        const fecha = addDays(monday, i)
        const dayIndex = getDayOfWeek(fecha)
        
        // Solo verificar días programados
        if (!prog.dias_semana.includes(dayIndex)) continue
        
        const log = logs.find(l => l.habit_id === habit.id && l.fecha === fecha)
        if (log?.estado !== 'cumplido') return false
      }
    }
    
    return true
  }

  const seedInitialHabits = async () => {
    setIsSeeding(true)
    
    // Marcar como sembrado al empezar para evitar reintento en bucle
    localStorage.setItem('habitos_sembrados', 'true')
    
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
        existingNames.add(habit.nombre) // Agregar a set para evitar duplicados en la misma ejecución
      }
    } catch (error) {
      console.error('Error seeding habits:', error)
      // Si falla, limpiar la bandera para permitir reintento manual
      localStorage.removeItem('habitos_sembrados')
    } finally {
      setIsSeeding(false)
    }
  }

  const createHabit = useCreateHabit()
  const updateHabit = useUpdateHabit()

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

  const handleArchive = async (habit, archivado) => {
    try {
      await archiveHabitMutation.mutateAsync({ id: habit.id, archivado })
      playSound('save')
    } catch (error) {
      console.error('Error archiving habit:', error)
    }
  }

  const handleTogglePause = async (fecha) => {
    try {
      await togglePauseDayMutation.mutateAsync({ fecha, userId: 'guest' })
    } catch (error) {
      console.error('Error toggling pause day:', error)
    }
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
    <div className="flex flex-col min-h-dvh pb-28 md:pb-12">
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
        <div className="space-y-4">
          <TodayCard
            habits={habits || []}
            logs={logs || []}
            programaciones={programaciones || []}
            pauseDays={pauseDays || []}
            config={config || {}}
            isWeekComplete={isWeekComplete()}
          />
          <WeeklyTracker
            habits={habits || []}
            programaciones={programaciones || []}
            logs={logs || []}
            pauseDays={pauseDays || []}
            config={config || {}}
            onEditHabit={(habit) => setEditingHabit(habit)}
            onArchiveHabit={handleArchive}
            onTogglePause={handleTogglePause}
            userId="guest"
            showArchived={showArchived}
            onToggleShowArchived={() => setShowArchived(!showArchived)}
          />
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">
            Cada día es una oportunidad. ¡Sigue así!
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <ProgressView
            habits={habits || []}
            logs={logs || []}
            programaciones={programaciones || []}
            pauseDays={pauseDays || []}
            config={config || {}}
          />
        </div>
      )}

      {/* Modal para crear/editar */}
      <HabitModal
        isOpen={isCreating || editingHabit}
        onClose={() => {
          setIsCreating(false)
          setEditingHabit(null)
        }}
        isPending={createHabit.isPending || updateHabit.isPending}
        editingHabit={editingHabit}
        programaciones={programaciones}
        onSubmit={editingHabit ? handleEdit : handleCreate}
      />
    </div>
  )
}
