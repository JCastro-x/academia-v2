import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
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
  const [isMobileMenu, setIsMobileMenu] = useState(() => window.innerWidth < 640)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
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

  const toggleMenu = (event) => {
    if (showMenu) {
      setShowMenu(false)
      return
    }
    triggerRef.current = event.currentTarget
    setShowMenu(true)
  }

  useEffect(() => {
    const updateLayout = () => setIsMobileMenu(window.innerWidth < 640)
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [])

  useEffect(() => {
    if (!showMenu) return

    const closeOnOutsideClick = (event) => {
      if (menuRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) return
      setShowMenu(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowMenu(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [showMenu])

  useLayoutEffect(() => {
    if (!showMenu || isMobileMenu) return

    const updateMenuPosition = () => {
      const trigger = triggerRef.current
      const menu = menuRef.current
      if (!trigger || !menu) return
      const triggerRect = trigger.getBoundingClientRect()
      const menuRect = menu.getBoundingClientRect()
      const gap = 8
      const left = Math.max(gap, Math.min(triggerRect.right - menuRect.width, window.innerWidth - menuRect.width - gap))
      const fitsBelow = triggerRect.bottom + menuRect.height + gap <= window.innerHeight
      const top = fitsBelow
        ? triggerRect.bottom + gap
        : Math.max(gap, triggerRect.top - menuRect.height - gap)
      setMenuPosition({ top, left })
    }

    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [showMenu, isMobileMenu])

  const closeMenu = () => setShowMenu(false)
  const menuActions = [
    { label: 'Editar', action: () => onEdit(habit) },
    { label: isTodayPaused ? 'Quitar pausa hoy' : 'Pausar hoy', action: () => onTogglePause(today) },
    { label: habit.archivado ? 'Restaurar' : 'Archivar', action: () => onArchive(habit, !habit.archivado) },
    { label: 'Eliminar', danger: true, action: () => onDelete(habit) },
  ]

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
            onClick={toggleMenu}
            className="flex h-11 w-11 items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-[var(--dm-text)] text-sm shrink-0 sm:h-auto sm:w-auto"
            title="Más opciones"
            aria-label={`Más opciones para ${habit.nombre}`}
            aria-expanded={showMenu}
          >
            ⋯
          </button>
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
              onClick={toggleMenu}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-[var(--dm-text)] text-xs shrink-0"
              title="Más opciones"
              aria-label={`Más opciones para ${habit.nombre}`}
              aria-expanded={showMenu}
            >
              ⋯
            </button>
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
      {showMenu && createPortal(
        isMobileMenu ? (
          <div className="fixed inset-0 z-[90] flex items-end bg-black/45" onClick={closeMenu}>
            <div
              ref={menuRef}
              role="menu"
              aria-label={`Opciones para ${habit.nombre}`}
              className="w-full rounded-t-2xl border border-gray-200 bg-white pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-xl dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)]"
              onClick={event => event.stopPropagation()}
            >
              <div className="px-5 pb-2 text-base font-semibold dark:text-[var(--dm-text)]">{habit.nombre}</div>
              {menuActions.map(({ label, action, danger }) => (
                <button
                  key={label}
                  role="menuitem"
                  onClick={() => { closeMenu(); action() }}
                  className={`h-12 w-full px-5 text-left text-base dark:text-[var(--dm-text)] ${danger ? 'text-red-600 dark:text-red-400' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Opciones para ${habit.nombre}`}
            className="fixed z-[90] min-w-[140px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)]"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {menuActions.map(({ label, action, danger }) => (
              <button
                key={label}
                role="menuitem"
                onClick={() => { closeMenu(); action() }}
                className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] ${danger ? 'text-red-600 dark:text-red-400' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        ),
        document.body
      )}
    </>
  )
}
