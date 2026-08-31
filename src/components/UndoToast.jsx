import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../stores/ui.store.js'

export default function UndoToast() {
  const { undoToast, hideUndoToast, addToast } = useUIStore()
  const [timeLeft, setTimeLeft] = useState(5)

  const handleUndo = useCallback(() => {
    if (undoToast?.onUndo) {
      undoToast.onUndo()
    }
    hideUndoToast()
  }, [undoToast, hideUndoToast])

  useEffect(() => {
    if (!undoToast) return

    setTimeLeft(5)
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          if (undoToast.onTimeout) {
            setTimeout(() => {
              try {
                undoToast.onTimeout()
              } catch (error) {
                console.error('Error in onTimeout:', error)
                addToast({ type: 'error', message: 'Error al eliminar' })
              }
            }, 0)
          }
          setTimeout(() => hideUndoToast(), 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [undoToast, hideUndoToast, addToast])

  if (!undoToast) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-20 left-0 right-0 mx-auto max-w-md px-6 py-4 bg-gray-800 text-white rounded-lg shadow-lg flex items-center justify-center gap-4 z-50 dark:bg-[var(--dm-surface)] dark:text-[var(--dm-text)] dark:border dark:border-[var(--dm-border)] md:bottom-6"
      >
        <span className="text-base">{undoToast.message}</span>
        <button
          onClick={handleUndo}
          className="bg-white text-gray-800 px-4 py-2 rounded font-medium hover:bg-gray-100 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
        >
          Deshacer ({timeLeft}s)
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
