import { motion } from 'framer-motion'

export default function SubjectCard({ subject, onEdit, onDelete }) {
  const hasLab = subject.horario?.some(h => h.tipo === 'lab')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-4 border-l-4"
      style={{ borderLeftColor: subject.color }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{subject.icono}</span>
          <div>
            <h3 className="font-semibold text-lg">{subject.nombre}</h3>
            {subject.codigo && <p className="text-sm text-gray-600">{subject.codigo}</p>}
          </div>
        </div>
        {hasLab && (
          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
            Lab
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1 text-sm text-gray-600">
        {subject.catedratico && <p>Catedrático: {subject.catedratico}</p>}
        {subject.seccion && <p>Sección: {subject.seccion}</p>}
        {subject.creditos && <p>Créditos: {subject.creditos}</p>}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onEdit(subject)}
          className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 text-sm"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(subject)}
          className="flex-1 bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 text-sm"
        >
          Eliminar
        </button>
      </div>
    </motion.div>
  )
}
