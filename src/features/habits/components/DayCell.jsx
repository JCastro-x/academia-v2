import { useState } from 'react'
import { motion } from 'framer-motion'
import { useUpdateHabitLog } from '../hooks.js'
import {
  getEstado,
  isDayApplicable,
  isWeekendPlus,
  isDaySugerido,
} from '../../../features/habits/api.js'
import { isFuture, daysBetween, getTodayDate } from '../../../lib/date-utils.js'
import { playSound } from '../../../lib/sound.js'

const statuses = ['pendiente', 'cumplido', 'fallado']

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

export default function DayCell({ habit, fecha, programaciones, logs, pauseDays, config, isToday: isTodayDate, ariaLabel }) {
  const updateLog = useUpdateHabitLog()
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [showTooltip, setShowTooltip] = useState(false)

  const estado = getEstado(habit, fecha, logs, programaciones, pauseDays, config)
  const applicable = isDayApplicable(habit, fecha, programaciones, pauseDays)
  const weekendPlus = isWeekendPlus(habit, fecha, programaciones)
  const sugerido = isDaySugerido(habit, fecha, programaciones)
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
        console.log('Mañana seguís')
      }
    }
  }

  const handleRightClick = (e) => {
    e.preventDefault()
    if (!canEdit) return
    if (!applicable && !weekendPlus) return

    // Clic derecho: toggle parcial
    const newStatus = estado === 'parcial' ? null : 'parcial'
    updateLog.mutate({
      habitId: habit.id,
      fecha,
      estado: newStatus,
    })
    if (newStatus === 'parcial') {
      playSound('task-done')
    }
  }

  const handleMouseDown = () => {
    if (!canEdit) return
    if (!applicable && !weekendPlus) return

    const timer = setTimeout(() => {
      // Pulsación larga: toggle parcial
      const newStatus = estado === 'parcial' ? null : 'parcial'
      updateLog.mutate({
        habitId: habit.id,
        fecha,
        estado: newStatus,
      })
      if (newStatus === 'parcial') {
        playSound('task-done')
      }
      setShowTooltip(false)
    }, 500)
    setLongPressTimer(timer)
    setShowTooltip(true)
  }

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const handleMouseLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setShowTooltip(false)
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

  // Resaltar días sugeridos (meta semanal / periódico) con fondo tenue
  const sugeridoClass = sugerido && applicable && !isTodayDate
    ? 'bg-[var(--color-primary)] bg-opacity-10'
    : ''

  // Tooltip para fuera de ventana
  const tooltip = diasDesdeHoy > ventanaEdicion ? 'Fuera de la ventana de edición' : null

  return (
    <div className="relative">
      <motion.button
        layout
        whileHover={canEdit && applicable ? { scale: 1.1 } : {}}
        whileTap={canEdit && applicable ? { scale: 0.95 } : {}}
        onClick={handleClick}
        onContextMenu={handleRightClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        disabled={!canEdit || (!applicable && !weekendPlus)}
        aria-label={ariaLabel || fecha}
        className={`
          w-8 h-8 md:w-8 md:h-8 min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0
          ${style.bg} ${style.border} ${style.text} ${borderClass} ${sugeridoClass}
          ${!canEdit || (!applicable && !weekendPlus) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          transition-colors
          ${isTodayDate ? 'ring-2 ring-[var(--color-primary)]' : ''}
        `}
        title={tooltip || (habit.version_minima && estado === 'parcial' ? habit.version_minima : ariaLabel || fecha)}
      >
        {style.icon}
      </motion.button>
      {showTooltip && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          Mantén pulsado para parcial
        </div>
      )}
    </div>
  )
}
