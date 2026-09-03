import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '../stores/ui.store.js'

export default function ToastContainer() {
  const toasts = useUIStore((state) => state.toasts)
  const removeToast = useUIStore((state) => state.removeToast)

  useEffect(() => {
    const timers = toasts.map((toast) => window.setTimeout(() => removeToast(toast.id), 5000))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [toasts, removeToast])

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            role="status"
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm shadow-lg ${
              toast.type === 'error'
                ? 'bg-red-600 text-white'
                : toast.type === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-white dark:bg-[var(--dm-surface)] dark:text-[var(--dm-text)] dark:border dark:border-[var(--dm-border)]'
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Cerrar notificación"
              className="shrink-0 text-lg leading-none opacity-80 hover:opacity-100"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
