import { motion } from 'framer-motion'
import { calculateZoneStats } from '../../../domain/grades-calc.js'

export default function ZoneCard({ zone, onEdit, onDelete, onAddItem, onEditItem, onDeleteItem, pendingDeletes, subjectColor }) {
  const stats = calculateZoneStats(zone.items || [], zone)
  const isPending = pendingDeletes?.some(pd => pd.type === 'zone' && pd.itemId === zone.id)

  const totalItemWeight = (zone.items || []).reduce((sum, item) => sum + (item.peso_pts || 0), 0)
  const weightDifference = totalItemWeight - zone.peso_pts

  if (isPending) return null

  const zoneColor = subjectColor || zone.color || '#8B5CF6'
  const progressPercentage = stats.maxPoints > 0 ? (stats.netPoints / stats.maxPoints) * 100 : 0
  const isGained = stats.netPoints >= zone.ganada_pts

  const statusBadge = isGained 
    ? `GANADA — ${stats.netPoints.toFixed(1)} pts ≥ ${zone.ganada_pts}`
    : 'En curso'

  const statusBadgeColor = isGained ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl p-5 backdrop-blur-md transition-all hover:scale-[1.02]"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        boxShadow: `0 0 20px ${zoneColor}15, inset 0 0 20px ${zoneColor}05`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: zoneColor }}
          >
            {zone.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-[var(--dm-text)]">{zone.nombre}</h3>
            <p className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">
              {zone.codigo || 'Zona'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-[var(--dm-text)]">
            {stats.netPoints.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">
            / {stats.maxPoints} pts
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 rounded-full bg-gray-200 dark:bg-[var(--dm-border)] overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${Math.min(progressPercentage, 100)}%`,
              backgroundColor: zoneColor 
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">
          <span>{progressPercentage.toFixed(1)}%</span>
          <span>{stats.percentageObtained.toFixed(1)}% obtenido</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${statusBadgeColor}`}>
        {statusBadge}
      </div>

      {/* Items List */}
      <div className="space-y-2 mb-4">
        {zone.items?.map(item => {
          const itemPending = pendingDeletes?.some(pd => pd.type === 'item' && pd.itemId === item.id)
          if (itemPending) return null

          return (
            <div
              key={item.id}
              className="flex items-center justify-between bg-white/50 dark:bg-[var(--dm-bg)]/50 rounded-lg px-3 py-2 border border-gray-200 dark:border-[var(--dm-border)]"
            >
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-900 dark:text-[var(--dm-text)] text-sm">{item.nombre}</span>
                {item.porcentaje_ingresado != null && (
                  <span className="ml-2 text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">
                    {item.porcentaje_ingresado}%
                  </span>
                )}
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => onEditItem(item)}
                  className="text-gray-600 hover:text-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)] dark:hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] rounded px-2 py-1 text-xs"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDeleteItem(item)}
                  className="text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-[var(--dm-text-muted)] dark:hover:text-red-300 dark:hover:bg-[color-mix(in_srgb,red_12%,transparent)] rounded px-2 py-1 text-xs"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Buttons - Bottom Bar Style */}
      <div className="flex gap-2 pt-4 border-t border-gray-200/50 dark:border-[var(--dm-border)]/50">
        <button
          onClick={() => onAddItem(zone)}
          className="flex-1 py-2.5 rounded-lg text-gray-600 hover:bg-white/50 dark:text-[var(--dm-text-muted)] dark:hover:bg-[var(--dm-surface)]/50 text-sm font-medium transition-all"
        >
          + Ítem
        </button>
        <button
          onClick={() => onEdit(zone)}
          className="px-4 py-2.5 rounded-lg text-gray-600 hover:bg-white/50 dark:text-[var(--dm-text-muted)] dark:hover:bg-[var(--dm-surface)]/50 text-sm font-medium transition-all"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(zone)}
          className="px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-900/20 text-sm font-medium transition-all"
        >
          Eliminar
        </button>
      </div>

      {/* Weight Warning */}
      {weightDifference !== 0 && (
        <div className={`mt-3 text-xs ${weightDifference > 0 ? 'text-red-600' : 'text-yellow-600'} dark:text-[var(--dm-text-muted)]`}>
          ⚠️ Ítems: {totalItemWeight.toFixed(2)} / {zone.peso_pts} pts ({weightDifference > 0 ? '+' : ''}{weightDifference.toFixed(2)})
        </div>
      )}
    </motion.div>
  )
}
