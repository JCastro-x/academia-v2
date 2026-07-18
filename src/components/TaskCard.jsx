import { motion } from 'framer-motion'

export default function TaskCard({ task, subject, onToggleDone, onEdit, onDelete }) {
  const priorityColors = {
    baja: 'bg-green-100 text-green-800',
    media: 'bg-yellow-100 text-yellow-800',
    alta: 'bg-red-100 text-red-800',
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = task.due && new Date(task.due) < new Date() && !task.done

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${task.done ? 'border-gray-300 opacity-60' : isOverdue ? 'border-red-500' : 'border-blue-500'}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleDone(task.id, !task.done)}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${task.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-blue-500'}`}
        >
          {task.done && '✓'}
        </button>

        <div className="flex-1">
          <h4 className={`font-medium ${task.done ? 'line-through text-gray-500' : ''}`}>
            {task.titulo}
          </h4>

          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            {subject && (
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                {subject.nombre}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded ${priorityColors[task.prioridad]}`}>
              {task.prioridad}
            </span>
            <span className={`text-gray-600 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
              {formatDate(task.due)}
            </span>
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
          >
            🗑️
          </button>
        </div>
      </div>
    </motion.div>
  )
}
