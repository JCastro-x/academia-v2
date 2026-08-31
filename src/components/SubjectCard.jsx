import { motion } from 'framer-motion'

export default function SubjectCard({ subject, onEdit, onDelete }) {
  const schedule = Array.isArray(subject.horario) ? subject.horario : []
  const hasLab = schedule.some(h => h.tipo === 'lab')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)' }}
      whileTap={{ scale: 0.99 }}
      className="subject-card box-border bg-white rounded-xl shadow-[var(--shadow-sm)] p-4 border-l-4 transition-shadow min-w-0 w-full max-w-full overflow-hidden dark:bg-[var(--dm-surface)] dark:border-[var(--dm-border)]"
      style={{ borderLeftColor: subject.color }}
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl">{subject.icono}</span>
          <div className="min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-[var(--dm-text)] break-words">{subject.nombre}</h3>
            {subject.codigo && <p className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">{subject.codigo}</p>}
          </div>
        </div>
        {hasLab && (
          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full dark:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] dark:text-[var(--dm-text)]">
            Lab
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">
        {subject.catedratico && <p>Catedrático: {subject.catedratico}</p>}
        {subject.seccion && <p>Sección: {subject.seccion}</p>}
        {subject.creditos && <p>Créditos: {subject.creditos}</p>}
      </div>

      <div className="mt-4 flex min-w-0 gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(subject) }}
          className="min-w-0 flex-1 bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)] py-2 px-2 rounded-lg hover:bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] text-sm truncate"
        >
          Editar
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(subject) }}
          className="min-w-0 flex-1 bg-red-50 text-red-600 py-2 px-2 rounded-lg hover:bg-red-100 text-sm truncate dark:bg-[color-mix(in_srgb,red_12%,transparent)] dark:text-red-300 dark:hover:bg-[color-mix(in_srgb,red_20%,transparent)]"
        >
          Eliminar
        </button>
      </div>
    </motion.div>
  )
}
