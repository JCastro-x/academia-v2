import { motion } from 'framer-motion'

export default function SubjectCard({ subject, onEdit, onDelete, onViewGrades }) {
  const schedule = Array.isArray(subject.horario) ? subject.horario : []
  const hasLab = schedule.some(h => h.tipo === 'lab')
  const cardColor = subject.color || '#8B5CF6'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
      className="subject-card interactive box-border relative rounded-2xl p-4 border-l transition-all hover:scale-[1.02] min-w-0 w-full max-w-full overflow-hidden"
      style={{
        borderLeftColor: subject.color || '#8B5CF6',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        boxShadow: `0 0 30px ${cardColor}30, 0 0 60px ${cardColor}1a, inset 0 0 25px ${cardColor}15`,
      }}
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
          onClick={(e) => { e.stopPropagation(); onViewGrades(subject) }}
          className="min-w-0 flex-1 interactive bg-[color-mix(in_srgb,green_12%,transparent)] text-green-600 py-2 px-2 rounded-lg hover:bg-[color-mix(in_srgb,green_20%,transparent)] dark:bg-[color-mix(in_srgb,green_12%,transparent)] dark:text-green-300 dark:hover:bg-[color-mix(in_srgb,green_20%,transparent)]"
          title="Ver calificaciones"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(subject) }}
          className="min-w-0 flex-1 interactive bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)] py-2 px-2 rounded-lg hover:bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] dark:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] dark:text-[var(--dm-primary)] dark:hover:bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]"
          title="Editar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(subject) }}
          className="min-w-0 flex-1 interactive bg-red-50 text-red-600 py-2 px-2 rounded-lg hover:bg-red-100 dark:bg-[color-mix(in_srgb,red_12%,transparent)] dark:text-red-300 dark:hover:bg-[color-mix(in_srgb,red_20%,transparent)]"
          title="Eliminar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}
