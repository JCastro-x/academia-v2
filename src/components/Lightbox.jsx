import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../stores/ui.store.js'

export default function Lightbox() {
  const { lightbox, closeLightbox } = useUIStore()

  if (!lightbox) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
        onClick={closeLightbox}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative max-w-[90vw] max-h-[90vh] mx-4"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute -top-12 right-0 text-white text-4xl hover:text-gray-300 transition-colors"
          >
            ✕
          </button>

          {/* Image */}
          <img
            src={lightbox.src}
            alt={lightbox.alt || 'Adjunto'}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
          />

          {/* Caption */}
          {lightbox.caption && (
            <p className="text-white text-center mt-4 text-sm">
              {lightbox.caption}
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
