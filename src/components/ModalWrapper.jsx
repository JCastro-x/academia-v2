import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playSound } from '../lib/sound.js'

export default function ModalWrapper({ isOpen, onClose, children, className = '' }) {
  const hasMounted = useRef(false)

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    playSound(isOpen ? 'modal-open' : 'modal-close')
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 12, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`bg-white rounded-2xl shadow-[var(--shadow-md)] dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] w-full max-w-full max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain ${className}`}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
