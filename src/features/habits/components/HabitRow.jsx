import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DayCell from './DayCell.jsx'
import { isToday, getDayOfWeek, getTodayDate } from '../../../lib/date-utils.js'
import { calculateStreak, calculateWeeklyPercent } from '../stats.js'
import { getProgramacionVigente } from '../api.js'
import { GRID_TEMPLATE } from './DaysHeader.jsx'

const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const dayInitials = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const monthLabels = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const formatAriaLabel = (date) => {
  const day = date.slice(8)
  const month = parseInt(date.slice(5, 7)) - 1
  return `${dayLabels[getDayOfWeek(date) - 1]} ${day} ${monthLabels[month]}`
}

export default function HabitRow({ habit, days, programaciones, logs, pauseDays, config, onEdit, onArchive, onTogglePause, onDelete, userId }) {
  const [showMenu, setShowMenu] = useState(false)
  const streak = calculateStreak(habit, logs, programaciones, pauseDays, config)
  const weeklyPercent = calculateWeeklyPercent(habit, logs, programaciones, pauseDays, config)
  
  const prog = getProgramacionVigente(habit, getTodayDate(), programaciones)
  const isMetaSemanal = prog?.tipo === 'meta_semanal'
  const meta = prog?.meta_semanal || 1
  
  // Calcular contador para meta semanal
  let weekCounter = null
  if (isMetaSemanal) {
    const today = getTodayDate()
    const dayOfWeek = getDayOfWeek(today)
    const monday = getTodayDate().slice(0, 10)
    const weekStart = new Date(monday)
    weekStart.setDate(weekStart.getDate() - (dayOfWeek - 1))
    const weekStartDate = weekStart.toISOString().slice(0, 10)
    
    let cumplidos = 0
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(weekStartDate)
      fecha.setDate(fecha.getDate() + i)
      const fechaStr = fecha.toISOString().slice(0, 10)
      const log = logs.find(l => l.habit_id === habit.id && l.fecha === fechaStr)
      if (log?.estado === 'cumplido') cumplidos++
    }
    weekCounter = `${cumplidos}/${meta} esta semana`
  }

  const today = getTodayDate()
  const isTodayPaused = pauseDays.some(p => p.fecha === today)

  // Versión móvil: tarjeta con 3 líneas
  const mobileView = (
    <div className="bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg p-3 mb-2">
      {/* Línea 1: nombre + menú */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium dark:text-[var(--dm-text)] break-words flex-1 pr-2" title={habit.nombre}>
          {habit.nombre}
        </span>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-[var(--dm-text)] text-sm shrink-0"
            title="Más opciones"
          >
            ⋯
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-6 bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg shadow-lg py-1 z-10 min-w-[140px]"
              >
                <button
                  onClick={() => { onEdit(habit); setShowMenu(false) }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-[var(--dm-bg)] dark:text-[var(--dm-text)]"
                >
                  Editar
                </button>
                <button
                  onClick={() => { onTogglePause(today); setShowMenu(false) }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-[var(--dm-bg)] dark:text-[var(--dm-text)]"
                >
                  {isTodayPaused ? 'Quitar pausa hoy' : 'Pausar hoy'}
                </button>
                <button
                  onClick={() => { onArchive(habit, !habit.archivado); setShowMenu(false) }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-[var(--dm-bg)] dark:text-[var(--dm-text)]"
                >
                  {habit.archivado ? 'Restaurar' : 'Archivar'}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar "${habit.nombre}" y todo su historial? No se puede deshacer.`)) {
                      onDelete(habit.id)
                      setShowMenu(false)
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400"
                >
                  Eliminar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Línea 2: 7 celdas con iniciales */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day, i) => (
          <div key={day} className="flex flex-col items-center">
            <span className="text-[10px] text-gray-500 dark:text-[var(--dm-text-muted)] mb-1">
              {dayInitials[i]}
            </span>
            <DayCell
              habit={habit}
              fecha={day}
              programaciones={programaciones}
              logs={logs}
              pauseDays={pauseDays}
              config={config}
              isToday={isToday(day)}
              ariaLabel={formatAriaLabel(day)}
            />
          </div>
        ))}
      </div>

      {/* Línea 3: stats */}
      <div className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)] flex items-center gap-2">
        <span>🔥 {streak}</span>
        <span>{weeklyPercent}%</span>
        {weekCounter && <span className="text-[10px]">{weekCounter}</span>}
      </div>
    </div>
  )

  // Versión escritorio: grid tradicional
  const desktopView = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-2 items-center min-h-[44px] relative"
      style={{ gridTemplateColumns: GRID_TEMPLATE }}
    >
      <div className="text-xs font-medium dark:text-[var(--dm-text)] break-words leading-tight pr-2 flex flex-col md:flex-row md:items-center gap-1 md:gap-2" title={habit.nombre}>
        <div className="flex items-center gap-2 flex-1">
          <span className="flex-1">{habit.nombre}</span>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-[var(--dm-text)] text-xs shrink-0"
              title="Más opciones"
            >
              ⋯
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-6 bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg shadow-lg py-1 z-10 min-w-[140px]"
                >
                  <button
                    onClick={() => { onEdit(habit); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-[var(--dm-bg)] dark:text-[var(--dm-text)]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => { onTogglePause(today); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-[var(--dm-bg)] dark:text-[var(--dm-text)]"
                  >
                    {isTodayPaused ? 'Quitar pausa hoy' : 'Pausar hoy'}
                  </button>
                  <button
                    onClick={() => { onArchive(habit, !habit.archivado); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-[var(--dm-bg)] dark:text-[var(--dm-text)]"
                  >
                    {habit.archivado ? 'Restaurar' : 'Archivar'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar "${habit.nombre}" y todo su historial? No se puede deshacer.`)) {
                        onDelete(habit.id)
                        setShowMenu(false)
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400"
                  >
                    Eliminar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)] flex items-center gap-1 md:hidden">
          <span title="Racha actual">🔥 {streak}</span>
          <span title="Esta semana">{weeklyPercent}%</span>
          {weekCounter && <span className="text-[10px]">{weekCounter}</span>}
        </div>
      </div>
      {days.map(day => (
        <DayCell
          key={day}
          habit={habit}
          fecha={day}
          programaciones={programaciones}
          logs={logs}
          pauseDays={pauseDays}
          config={config}
          isToday={isToday(day)}
          ariaLabel={formatAriaLabel(day)}
        />
      ))}
      <div className="hidden md:flex text-xs text-gray-600 dark:text-[var(--dm-text-muted)] items-center gap-1">
        <span title="Racha actual">🔥 {streak}</span>
        <span title="Esta semana">{weeklyPercent}%</span>
        {weekCounter && <span className="text-[10px]">{weekCounter}</span>}
      </div>
    </motion.div>
  )

  return (
    <>
      {/* Móvil */}
      <div className="md:hidden">
        {mobileView}
      </div>
      {/* Escritorio */}
      <div className="hidden md:block">
        {desktopView}
      </div>
    </>
  )
}
