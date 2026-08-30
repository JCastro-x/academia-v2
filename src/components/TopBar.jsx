import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUIStore } from '../stores/ui.store.js'
import { useProfile, useUpsertProfile } from '../features/profile/hooks.js'
import { signOut } from '../lib/supabase.js'
import { exportAllUserData, downloadJSON } from '../lib/exportData.js'

function useCurrentDateTime() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  return now
}

function formatDate(date) {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function formatTime(date, hourFormat = '12h') {
  return date.toLocaleTimeString('es-ES', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: hourFormat === '12h',
  })
}

function getGreeting(date) {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'Buenos días'
  if (hour >= 12 && hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function GreetingIcon({ hour }) {
  const isDay = hour >= 5 && hour < 19

  if (isDay) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5 shrink-0 text-amber-500 animate-[pulse_1.8s_ease-in-out_infinite]"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.9" />
        <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
        </g>
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 shrink-0 text-indigo-400 animate-[spin_8s_linear_infinite]"
      aria-hidden="true"
    >
      <path
        d="M18.5 14.5A6.2 6.2 0 0 1 9.8 9.2a6.2 6.2 0 1 0 8.7 5.3Z"
        fill="currentColor"
      />
      <circle cx="16.6" cy="7.2" r="1.2" fill="rgba(255,255,255,0.7)" />
      <circle cx="7.2" cy="7.8" r="0.9" fill="rgba(255,255,255,0.7)" />
      <circle cx="9.4" cy="5.1" r="0.7" fill="rgba(255,255,255,0.7)" />
    </svg>
  )
}

export default function TopBar({ onOpenClassModal, onOpenQuickAdd }) {
  const navigate = useNavigate()
  const { semesterId } = useParams()
  const now = useCurrentDateTime()
  const { data: profile } = useProfile()
  const upsertProfile = useUpsertProfile()

  const {
    isSidebarCollapsed, toggleSidebar,
    isMuted, toggleMute,
    isOnline,
    modoOscuro, setModoOscuro,
    horaFormato,
    openModal,
    addToast,
  } = useUIStore()

  // Dropdown de ajustes
  const [isDropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const [isExporting, setIsExporting] = useState(false)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!isDropdownOpen) return
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isDropdownOpen])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const data = await exportAllUserData()
      downloadJSON(data)
    } catch (error) {
      console.error('[TopBar] Error exporting data:', error)
    } finally {
      setIsExporting(false)
      setDropdownOpen(false)
    }
  }

  const handleImport = () => {
    setDropdownOpen(false)
    openModal('import')
  }

  const handleLogout = async () => {
    try {
      // resetTheme está en el store, pero se llama desde Auth.jsx al montar
      // Así que al redirigir a /auth, se resetea automáticamente
      await signOut()
      localStorage.removeItem('academia-guest-mode')
      navigate('/auth')
    } catch (error) {
      console.error('[TopBar] Error logging out:', error)
    }
    setDropdownOpen(false)
  }

  const handleToggleDarkMode = async () => {
    const newValue = !modoOscuro
    // Optimistic update: cambiar estado local inmediatamente
    setModoOscuro(newValue)
    
    // Guardar en Supabase en paralelo
    try {
      await upsertProfile.mutateAsync({ modo_oscuro: newValue })
    } catch (error) {
      console.error('[TopBar] Error saving dark mode preference:', error)
      // Mostrar toast de error, pero NO hacer rollback del estado visual
      addToast({
        type: 'error',
        message: 'Error al guardar preferencia de tema. El cambio visual se mantiene pero no persistirá al refrescar.'
      })
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-[var(--dm-border)]"
            aria-label="Toggle sidebar"
          >
            <svg className="h-6 w-6 dark:text-[var(--dm-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="truncate text-lg font-bold text-gray-900 dark:text-[var(--dm-text)] md:text-xl">Academia v2</h1>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center px-0.5 sm:px-2">
          <div className="flex min-w-0 items-center justify-center gap-2 text-sm text-gray-700 dark:text-[var(--dm-text)]">
            <GreetingIcon hour={now.getHours()} />
            <div className="flex min-w-0 flex-col items-center justify-center gap-1 text-center sm:flex-row sm:items-center sm:gap-2">
              <span className="block truncate text-base font-semibold leading-tight text-gray-900 dark:text-[var(--dm-text)] sm:text-lg">
                {getGreeting(now)}, {profile?.nombre || 'Estudiante'}
              </span>
              <div className="flex flex-col items-center gap-0.5 text-[10px] leading-snug text-gray-500 dark:text-[var(--dm-text-muted)] sm:flex-row sm:items-center sm:gap-1.5 sm:text-[11px]">
                <span className="whitespace-nowrap">{formatDate(now)}</span>
                <span className="whitespace-nowrap">· {formatTime(now, horaFormato)}</span>
                <span className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>{isOnline ? 'En línea' : 'Desconectado'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1 md:flex">
            <button
              onClick={onOpenQuickAdd}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-black transition-colors"
              style={{ backgroundColor: 'var(--color-primary)', color: '#111827' }}
            >
              Agregar
            </button>
            <button
              onClick={() => navigate(`/s/${semesterId}/exam`)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 transition-colors"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.28)' }}
            >
              Examen
            </button>
          </div>

          <button
            onClick={handleToggleDarkMode}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-[var(--dm-border)]"
            aria-label={modoOscuro ? 'Modo claro' : 'Modo oscuro'}
            title={modoOscuro ? 'Modo claro' : 'Modo oscuro'}
          >
            {modoOscuro ? (
              <svg className="h-5 w-5 dark:text-[var(--dm-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 dark:text-[var(--dm-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <button
            onClick={toggleMute}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-[var(--dm-border)]"
            aria-label={isMuted ? 'Activar sonidos' : 'Silenciar sonidos'}
          >
            {isMuted ? (
              <svg className="h-5 w-5 dark:text-[var(--dm-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="h-5 w-5 dark:text-[var(--dm-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!isDropdownOpen)}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-[var(--dm-border)]"
              aria-label="Ajustes"
            >
              <svg className="h-5 w-5 dark:text-[var(--dm-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)]">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-[var(--dm-text-muted)] dark:hover:bg-[var(--dm-border)]"
                >
                  {isExporting ? 'Exportando...' : 'Exportar JSON'}
                </button>
                <button
                  onClick={handleImport}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-[var(--dm-text-muted)] dark:hover:bg-[var(--dm-border)]"
                >
                  Importar JSON
                </button>
                <hr className="my-1 border-gray-200 dark:border-[var(--dm-border)]" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-[var(--dm-border)]"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}