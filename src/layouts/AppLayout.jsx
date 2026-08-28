import { useEffect, useRef } from 'react'
import { Outlet, useParams, Link, useLocation } from 'react-router-dom'
import { useUIStore } from '../stores/ui.store.js'
import { useProfile } from '../features/profile/hooks.js'
import { playSound } from '../lib/sound.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import ImportModal from '../components/ImportModal.jsx'
import UndoToast from '../components/UndoToast.jsx'
import Lightbox from '../components/Lightbox.jsx'
import TopBar from '../components/TopBar.jsx'

export default function AppLayout() {
  const { semesterId } = useParams()
  const location = useLocation()
  const prevPathRef = useRef(location.pathname)
  const {
    isSidebarCollapsed, toggleSidebar,
    isMuted, toggleMute,
    modoOscuro, tipografia, temaColor, sonidosInteraccion,
    setModoOscuro, setTipografia, setTemaColor, setSonidosInteraccion, setMuted,
    setOnline, setOffline,
  } = useUIStore()

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      playSound('nav')
    }
    prevPathRef.current = location.pathname
  }, [location.pathname])

  // Inicializar estado online y listeners
  useEffect(() => {
    const handleOnline = () => setOnline()
    const handleOffline = () => setOffline()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    if (!navigator.onLine) setOffline()
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline, setOffline])

  // Hidratación: perfil guardado → ui.store (al montar AppLayout)
  const { data: profile } = useProfile()

  useEffect(() => {
    if (!profile) return // null o undefined → no hay perfil, mantener defaults del store
    setModoOscuro(profile.modo_oscuro ?? false)
    setTipografia(profile.tipografia ?? 'Inter')
    setTemaColor(profile.tema_color ?? '#84cc16')
    setSonidosInteraccion(profile.sonidos_interaccion ?? 'classic')
  }, [profile, setModoOscuro, setTipografia, setTemaColor, setSonidosInteraccion])

  // Mapeo de nombre corto de tipografía a CSS font-family
  const FONT_MAP = {
    'Inter': 'Inter, system-ui, sans-serif',
    'Roboto': 'Roboto, system-ui, sans-serif',
    'Open Sans': '"Open Sans", system-ui, sans-serif',
    'System UI': 'system-ui, -apple-system, sans-serif',
  }

  // Aplicación de tema desde ui.store (preview en vivo)
  useEffect(() => {
    console.log('[AppLayout] aplicando tema', { modoOscuro, tipografia, temaColor, sonidosInteraccion })
    document.documentElement.classList.toggle('dark', modoOscuro)
    document.documentElement.style.setProperty('--color-primary', temaColor)
    document.documentElement.style.fontFamily = FONT_MAP[tipografia] || 'Inter, system-ui, sans-serif'
    setMuted(sonidosInteraccion === 'off')
  }, [modoOscuro, tipografia, temaColor, sonidosInteraccion, setMuted])

  const navItems = [
    { path: '', label: 'Inicio', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: 'subjects', label: 'Materias', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { path: 'tasks', label: 'Tareas', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { path: 'grades', label: 'Calificaciones', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { path: 'calendar', label: 'Calendario', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { path: 'notes', label: 'Notas', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { path: 'habits', label: 'Hábitos', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { path: 'clock', label: 'Reloj', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { path: 'schedule', label: 'Plan Semestral', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { path: 'profile', label: 'Perfil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ]

  const isActive = (path) => {
    if (path === '') return location.pathname === `/s/${semesterId}`
    return location.pathname === `/s/${semesterId}/${path}`
  }

  // Handlers para los botones del TopBar
  const { openModal } = useUIStore()
  const handleOpenClassModal = () => openModal('subject')
  const handleOpenQuickAdd = () => openModal('quickadd')

  return (
    <div className="h-screen bg-gray-50 dark:bg-[var(--dm-bg)] overflow-hidden">
      <TopBar onOpenClassModal={handleOpenClassModal} onOpenQuickAdd={handleOpenQuickAdd} />

      <div className="flex relative h-full min-h-0 overflow-visible">
        {/* Mobile Overlay */}
        {!isSidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`bg-white dark:bg-[var(--dm-surface)] border-r border-gray-200 dark:border-[var(--dm-border)] transition-all duration-300 fixed md:sticky md:top-0 z-50 h-full ${
            isSidebarCollapsed ? '-translate-x-full md:w-16 md:translate-x-0' : 'w-64 translate-x-0'
          }`}
        >
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={`/s/${semesterId}/${item.path}`}
                    onClick={() => {
                      if (window.innerWidth < 768) toggleSidebar()
                    }}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'text-[var(--color-primary)]'
                        : 'text-gray-700 dark:text-[var(--dm-text)] hover:bg-gray-100 dark:hover:bg-[var(--dm-border)]'
                    }`}
                    style={isActive(item.path) ? { backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' } : undefined}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={isActive(item.path) ? { color: 'var(--color-primary)' } : undefined}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 w-full h-full overflow-y-auto overscroll-contain p-4 md:p-6 pb-20">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog />
      <ImportModal />
      <UndoToast />
      <Lightbox />
    </div>
  )
}