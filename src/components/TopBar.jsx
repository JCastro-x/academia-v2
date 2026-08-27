import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUIStore } from '../stores/ui.store.js'
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

function formatTime(date) {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TopBar({ onOpenClassModal, onOpenQuickAdd }) {
  const navigate = useNavigate()
  const { semesterId } = useParams()
  const now = useCurrentDateTime()

  const {
    isSidebarCollapsed, toggleSidebar,
    isMuted, toggleMute,
    isOnline,
    modoOscuro, setModoOscuro,
    openModal,
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

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[var(--dm-surface)] border-b border-gray-200 dark:border-[var(--dm-border)] px-4 py-3 flex items-center justify-between">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-[var(--dm-border)] rounded-lg"
          aria-label="Toggle sidebar"
        >
          <svg className="w-6 h-6 dark:text-[var(--dm-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-[var(--dm-text)]">Academia v2</h1>
      </div>

      {/* Center: date/time + online status */}
      <div className="hidden md:flex items-center gap-4 text-sm text-gray-500 dark:text-[var(--dm-text-muted)]">
        <span className="capitalize">{formatDate(now)}</span>
        <span>{formatTime(now)}</span>
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span>{isOnline ? 'En línea' : 'Desconectado'}</span>
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Botones rápidos (visible en desktop) */}
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={onOpenClassModal}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            +Clase
          </button>
          <button
            onClick={onOpenQuickAdd}
            className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-[var(--dm-border)] text-gray-700 dark:text-[var(--dm-text-muted)] rounded-lg hover:bg-gray-300 dark:hover:bg-[var(--dm-border)] transition-colors"
          >
            Agregar
          </button>
          <button
            onClick={() => navigate(`/s/${semesterId}/exam`)}
            className="px-3 py-1.5 text-sm text-white rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Examen
          </button>
        </div>

        <span className="hidden md:block w-px h-6 bg-gray-200 dark:bg-[var(--dm-border)]" />

        {/* Toggle claro/oscuro */}
        <button
          onClick={() => setModoOscuro(!modoOscuro)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-[var(--dm-border)] rounded-lg"
          aria-label={modoOscuro ? 'Modo claro' : 'Modo oscuro'}
          title={modoOscuro ? 'Modo claro' : 'Modo oscuro'}
        >
          {modoOscuro ? (
            <svg className="w-5 h-5 dark:text-[var(--dm-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 dark:text-[var(--dm-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Silenciar */}
        <button
          onClick={toggleMute}
          className="p-2 hover:bg-gray-100 dark:hover:bg-[var(--dm-border)] rounded-lg"
          aria-label={isMuted ? 'Activar sonidos' : 'Silenciar sonidos'}
        >
          {isMuted ? (
            <svg className="w-5 h-5 dark:text-[var(--dm-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-5 h-5 dark:text-[var(--dm-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>

        {/* Ajustes (dropdown) */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!isDropdownOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[var(--dm-border)] rounded-lg"
            aria-label="Ajustes"
          >
            <svg className="w-5 h-5 dark:text-[var(--dm-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg shadow-lg z-50 py-1">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-[var(--dm-text-muted)] hover:bg-gray-100 dark:hover:bg-[var(--dm-border)] disabled:opacity-50"
              >
                {isExporting ? 'Exportando...' : 'Exportar JSON'}
              </button>
              <button
                onClick={handleImport}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-[var(--dm-text-muted)] hover:bg-gray-100 dark:hover:bg-[var(--dm-border)]"
              >
                Importar JSON
              </button>
              <hr className="my-1 border-gray-200 dark:border-[var(--dm-border)]" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[var(--dm-border)]"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}