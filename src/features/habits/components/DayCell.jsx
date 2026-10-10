import { useState } from 'react'
import { motion } from 'framer-motion'
import { useUpdateHabitLog } from '../hooks.js'
import {
  getEstado,
  isDayApplicable,
  isWeekendPlus,
} from '../../../features/habits/api.js'
import { isFuture, daysBetween, getTodayDate } from '../../../lib/date-utils.js'
import { playSound } from '../../../lib/sound.js'

const statuses = ['pendiente', 'cumplido', 'fallado', 'parcial']

const statusStyles = {
  pendiente: {
    bg: 'bg-transparent',
    border: 'border-2 border-gray-300 dark:border-[var(--dm-border)]',
    text: '',
    icon: '',
  },
  cumplido: {
    bg: 'bg-green-500',
    border: 'border-2 border-green-500',
    text: 'text-white',
    icon: '✓',
  },
  fallado: {
    bg: 'bg-red-500',
    border: 'border-2 border-red-500',
    text: 'text-white',
    icon: '✗',
  },
  parcial: {
    bg: 'bg-orange-500',
    border: 'border-2 border-orange-500',
    text: 'text-white',
    icon: '~',
  },
  sin_registro: {
    bg: 'bg-gray-100 dark:bg-[var(--dm-surface)]',
    border: 'border-2 border-transparent',
    text: '',
    icon: '',
  },
  futuro: {
    bg: 'bg-gray-50 dark:bg-[var(--dm-bg)]',
    border: 'border-2 border-gray-200 dark:border-[var(--dm-border)]',
    text: '',
    icon: '',
  },
  no_aplica: {
    bg: 'bg-gray-200 dark:bg-[var(--dm-surface)]',
    border: 'border-transparent',
    text: '',
    icon: '',
  },
}

export default function DayCell({ habit, fecha, programaciones, logs, pauseDays, config, isToday: isTodayDate }) {
  const updateLog = useUpdateHabitLog()

  const estado = getEstado(habit, fecha, logs, programaciones, pauseDays, config)
  const applicable = isDayApplicable(habit, fecha, programaciones, pauseDays)
  const weekendPlus = isWeekendPlus(habit, fecha, programaciones)
  const future = isFuture(fecha)

  // Verificar si está dentro de ventana de edición
  const diasDesdeHoy = daysBetween(fecha, getTodayDate())
  const ventanaEdicion = config?.ventana_edicion_dias || 7
  const canEdit = !future && diasDesdeHoy >= 0 && diasDesdeHoy <= ventanaEdicion

  const handleClick = () => {
    if (!canEdit) return
    if (!applicable && !weekendPlus) return

    const currentIndex = statuses.indexOf(estado)
    const nextIndex = (currentIndex + 1) % statuses.length
    const nextStatus = statuses[nextIndex]

    // Si volvemos a pendiente, borramos el log
    if (nextStatus === 'pendiente') {
      updateLog.mutate({
        habitId: habit.id,
        fecha,
        estado: null, // null = borrar
      })
      playSound('task-undone')
    } else {
      updateLog.mutate({
        habitId: habit.id,
        fecha,
        estado: nextStatus,
      })
      if (nextStatus === 'cumplido') {
        playSound('task-done')
      } else if (nextStatus === 'fallado') {
        // Mensaje neutro al marcar rojo
        // (se puede mostrar en un toast en el futuro)
      }
    }
  }

  // Determinar estilo
  let style
  if (future) {
    style = statusStyles.futuro
  } else if (!applicable && !weekendPlus) {
    style = statusStyles.no_aplica
  } else {
    style = statusStyles[estado] || statusStyles.pendiente
  }

  // Borde punteado para weekend plus
  const borderClass = weekendPlus
    ? 'border-2 border-dashed'
    : applicable
    ? 'border-2'
    : 'border-2 border-transparent'

  // Tooltip para fuera de ventana
  const tooltip = diasDesdeHoy > ventanaEdicion ? 'Fuera de la ventana de edición' : null

  return (
    <motion.button
      layout
      whileHover={canEdit && applicable ? { scale: 1.1 } : {}}
      whileTap={canEdit && applicable ? { scale: 0.95 } : {}}
      onClick={handleClick}
      disabled={!canEdit || (!applicable && !weekendPlus)}
      className={`
        w-10 h-10 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0
        ${style.bg} ${style.border} ${style.text} ${borderClass}
        ${!canEdit || (!applicable && !weekendPlus) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        transition-colors
        ${isTodayDate ? 'ring-2 ring-[var(--color-primary)]' : ''}
      `}
      title={tooltip || (habit.version_minima && estado === 'parcial' ? habit.version_minima : '')}
    >
      {style.icon}
    </motion.button>
  )
}
