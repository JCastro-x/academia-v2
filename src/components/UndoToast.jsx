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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-4 z-50"
      >
        <span>{undoToast.message}</span>
        <button
          onClick={handleUndo}
          className="bg-white text-gray-800 px-4 py-1 rounded font-medium hover:bg-gray-100"
        >
          Deshacer ({timeLeft}s)
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
