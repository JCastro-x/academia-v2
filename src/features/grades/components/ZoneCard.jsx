import { motion } from 'framer-motion'
import { calculateZoneStats } from '../../../domain/grades-calc.js'

export default function ZoneCard({ zone, onEdit, onDelete, onAddItem, onEditItem, onDeleteItem, pendingDeletes }) {
  const stats = calculateZoneStats(zone.items || [], zone)
  const isPending = pendingDeletes?.some(pd => pd.type === 'zone' && pd.itemId === zone.id)

  const totalItemWeight = (zone.items || []).reduce((sum, item) => sum + (item.peso_pts || 0), 0)
  const weightDifference = totalItemWeight - zone.peso_pts

  if (isPending) return null

  const statusColors = {
    red: 'bg-red-100 border-red-300',
    yellow: 'bg-yellow-100 border-yellow-300',
    green: 'bg-green-100 border-green-300',
  }

  const statusTextColors = {
    red: 'text-red-700',
    yellow: 'text-yellow-700',
    green: 'text-green-700',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-2 rounded-lg p-4 dark:bg-[var(--dm-surface)] dark:border-[var(--dm-border)] ${statusColors[stats.statusColor]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-[var(--dm-text)]">{zone.nombre}</h3>
          <p className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">
            {stats.netPoints.toFixed(2)} / {stats.maxPoints} pts ({stats.percentageObtained.toFixed(1)}%)
          </p>
          <p className={`text-xs mt-1 ${weightDifference > 0 ? 'text-red-600' : weightDifference < 0 ? 'text-yellow-600' : 'text-green-600'} dark:text-[var(--dm-text-muted)]`}>
            Ítems: {totalItemWeight.toFixed(2)} / {zone.peso_pts} pts
            {weightDifference !== 0 && ` (${weightDifference > 0 ? '+' : ''}${weightDifference.toFixed(2)})`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(zone)}
            className="text-gray-600 hover:text-[var(--color-primary)] dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)] text-sm"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(zone)}
            className="text-gray-600 hover:text-red-600 dark:text-[var(--dm-text-muted)] dark:hover:text-red-300 text-sm"
          >
            Eliminar
          </button>
        </div>
      </div>

      {stats.neededToPass > 0 && (
        <p className={`text-sm mb-3 ${statusTextColors[stats.statusColor]}`}>
          Faltan {stats.neededToPass.toFixed(1)} pts para ganar ({zone.ganada_pct}%)
        </p>
      )}

      <div className="space-y-2">
        {zone.items?.map(item => {
          const itemPending = pendingDeletes?.some(pd => pd.type === 'item' && pd.itemId === item.id)
          if (itemPending) return null

          return (
            <div
              key={item.id}
              className="flex items-center justify-between bg-white/50 rounded px-3 py-2 dark:bg-[var(--dm-bg)] dark:border dark:border-[var(--dm-border)]"
            >
              <div>
                <span className="font-medium text-gray-900 dark:text-[var(--dm-text)]">{item.nombre}</span>
                {item.porcentaje_ingresado != null && (
                  <span className="ml-2 text-gray-600 dark:text-[var(--dm-text-muted)]">
                    {item.porcentaje_ingresado}%
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEditItem(item)}
                  className="text-gray-600 hover:text-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)] dark:hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] rounded px-1 text-xs"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDeleteItem(item)}
                  className="text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-[var(--dm-text-muted)] dark:hover:text-red-300 dark:hover:bg-[color-mix(in_srgb,red_12%,transparent)] rounded px-1 text-xs"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => onAddItem(zone)}
        className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[var(--color-primary)] hover:text-gray-700 dark:border-[var(--dm-border)] dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)] text-sm"
      >
        + Agregar ítem
      </button>
    </motion.div>
  )
}
