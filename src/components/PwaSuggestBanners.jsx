import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { enablePushNotifications, isPushSupported } from '../lib/pushNotifications.js'

const INSTALL_DISMISSED_KEY = 'academia-pwa-install-dismissed'
const NOTIF_DISMISSED_KEY = 'academia-push-banner-dismissed'

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export default function PwaSuggestBanners() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [notifPending, setNotifPending] = useState(false)
  const [notifError, setNotifError] = useState('')

  useEffect(() => {
    // PWA install: guardamos el evento, nunca lo disparamos automáticamente
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      const alreadyInstalled = isStandalone()
      const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY) === '1'
      if (!alreadyInstalled && !dismissed) setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Notificaciones: solo si están soportadas, nunca preguntadas y el banner no fue cerrado
    if (isPushSupported() && Notification.permission === 'default') {
      if (localStorage.getItem(NOTIF_DISMISSED_KEY) !== '1') {
        setShowNotif(true)
      }
    }
    // Si el usuario ya concedió/denegó el permiso en otra pestaña, no mostrar
    if (isPushSupported() && Notification.permission === 'granted') {
      setShowNotif(false)
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem(INSTALL_DISMISSED_KEY, '1')
    }
    setInstallPrompt(null)
    setShowInstall(false)
  }

  const handleEnableNotif = async () => {
    try {
      setNotifPending(true)
      setNotifError('')
      await enablePushNotifications()
      setShowNotif(false)
    } catch (error) {
      // denied u otro error: no insistir, guardar cierre
      localStorage.setItem(NOTIF_DISMISSED_KEY, '1')
      setNotifError(error.message || 'No se pudieron activar las notificaciones.')
    } finally {
      setNotifPending(false)
    }
  }

  const dismissInstall = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, '1')
    setShowInstall(false)
  }

  const dismissNotif = () => {
    localStorage.setItem(NOTIF_DISMISSED_KEY, '1')
    setShowNotif(false)
  }

  return (
    <div className="fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-3 px-4 pointer-events-none">
      <AnimatePresence>
        {showInstall && (
          <motion.div
            key="install-banner"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="pointer-events-auto w-full max-w-full sm:max-w-lg rounded-2xl backdrop-blur-md px-4 py-3.5 sm:p-4 flex items-center gap-3.5 shadow-lg"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', boxShadow: '0 0 30px rgba(139, 92, 246, 0.25)' }}
          >
            <span className="text-2xl sm:text-3xl shrink-0" aria-hidden>📲</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-semibold dark:text-[var(--dm-text)]">Instala la app para acceso rápido</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">Úsala como aplicación, incluso sin conexión.</p>
            </div>
            {installPrompt && (
              <button
                onClick={handleInstall}
                className="shrink-0 bg-[var(--color-primary)] text-[var(--color-primary-fg)] px-3.5 py-2 rounded-lg text-sm sm:text-base font-semibold active:scale-95 transition"
              >
                Instalar
              </button>
            )}
            <button
              onClick={dismissInstall}
              aria-label="Cerrar"
              className="shrink-0 text-xl p-1.5 text-gray-500 hover:text-gray-800 dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)]"
            >
              ✕
            </button>
          </motion.div>
        )}

        {showNotif && (
          <motion.div
            key="notif-banner"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="pointer-events-auto w-full max-w-full sm:max-w-lg rounded-2xl backdrop-blur-md px-4 py-3.5 sm:p-4 shadow-lg"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', boxShadow: '0 0 30px rgba(59, 130, 246, 0.25)' }}
          >
            <div className="flex items-start gap-3.5">
              <span className="text-2xl sm:text-3xl shrink-0" aria-hidden>🔔</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-semibold dark:text-[var(--dm-text)]">Activa las notificaciones</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">Recibe recordatorios de tus tareas y eventos.</p>
                {notifError && <p className="text-xs text-red-600 mt-1 dark:text-red-400">{notifError}</p>}
              </div>
              <button
                onClick={handleEnableNotif}
                disabled={notifPending}
                className="shrink-0 bg-[var(--color-primary)] text-[var(--color-primary-fg)] px-3.5 py-2 rounded-lg text-sm sm:text-base font-semibold disabled:opacity-60 active:scale-95 transition"
              >
                {notifPending ? 'Activando…' : 'Activar'}
              </button>
              <button
                onClick={dismissNotif}
                aria-label="Cerrar"
                className="shrink-0 text-xl p-1.5 text-gray-500 hover:text-gray-800 dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)]"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
