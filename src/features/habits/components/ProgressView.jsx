import { useState } from 'react'
import { getTodayDate, addDays, getDayOfWeek } from '../../../lib/date-utils.js'
import { calculateOverallPercent } from '../stats.js'

export default function ProgressView({ habits, logs, programaciones, pauseDays, config, showExampleData, onToggleExampleData }) {
  const [selectedMonth, setSelectedMonth] = useState(() => getTodayDate().slice(0, 7)) // YYYY-MM

  // Datos de ejemplo para las últimas 4 semanas (temporal)
  const mockWeeklyData = [
    { week: '1', percent: 60 },
    { week: '2', percent: 75 },
    { week: '3', percent: 82 },
    { week: '4', percent: 78 },
  ]

  const mockDailyData = [
    { day: 'Lun', percent: 85 },
    { day: 'Mar', percent: 70 },
    { day: 'Mié', percent: 90 },
    { day: 'Jue', percent: 65 },
    { day: 'Vie', percent: 80 },
    { day: 'Sáb', percent: 100 },
    { day: 'Dom', percent: 75 },
  ]

  const mockHeatmapData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    percent: Math.floor(Math.random() * 100),
  }))

  const mockDistribution = [
    { label: 'Cumplido', value: 45, color: 'bg-green-500' },
    { label: 'Parcial', value: 20, color: 'bg-orange-500' },
    { label: 'Fallado', value: 15, color: 'bg-red-500' },
    { label: 'Pendiente', value: 20, color: 'bg-gray-300' },
  ]

  return (
    <div className="space-y-6">
      {/* Botón de datos de ejemplo */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <button
          onClick={onToggleExampleData}
          className="text-sm text-yellow-800 dark:text-yellow-200 font-medium"
        >
          {showExampleData ? '✓ Datos de ejemplo activados' : '⚠️ Cargar datos de ejemplo (demo)'}
        </button>
      </div>

      {/* Gráfico de barras por día */}
      <div className="bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg p-4">
        <h3 className="text-sm font-semibold dark:text-[var(--dm-text)] mb-4">% de cumplimiento por día</h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {mockDailyData.map((item) => (
            <div key={item.day} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-[var(--color-primary)] rounded-t"
                style={{ height: `${item.percent}%` }}
              />
              <span className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)] mt-1">{item.day}</span>
              <span className="text-xs font-medium dark:text-[var(--dm-text)]">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mapa de calor mensual */}
      <div className="bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg p-4">
        <h3 className="text-sm font-semibold dark:text-[var(--dm-text)] mb-4">Mapa de calor mensual</h3>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              const date = new Date(selectedMonth + '-01')
              date.setMonth(date.getMonth() - 1)
              setSelectedMonth(date.toISOString().slice(0, 7))
            }}
            className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]"
          >
            ← Mes anterior
          </button>
          <span className="text-sm font-medium dark:text-[var(--dm-text)]">
            {new Date(selectedMonth + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => {
              const date = new Date(selectedMonth + '-01')
              date.setMonth(date.getMonth() + 1)
              setSelectedMonth(date.toISOString().slice(0, 7))
            }}
            className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]"
          >
            Mes siguiente →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, i) => (
            <div key={day} className="text-center">
              <div className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)] mb-1">{day}</div>
              <div className="grid grid-rows-5 gap-1">
                {Array.from({ length: 5 }).map((_, j) => {
                  const idx = i * 5 + j
                  const data = mockHeatmapData[idx]
                  if (!data) return <div key={j} className="w-6 h-6 bg-gray-100 dark:bg-[var(--dm-bg)] rounded" />
                  const bg = data.percent >= 75 ? 'bg-green-500' : data.percent >= 50 ? 'bg-green-300' : data.percent >= 25 ? 'bg-yellow-300' : 'bg-gray-300'
                  return (
                    <div
                      key={j}
                      className={`w-6 h-6 ${bg} rounded`}
                      title={`${data.percent}%`}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tendencia semanal */}
      <div className="bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg p-4">
        <h3 className="text-sm font-semibold dark:text-[var(--dm-text)] mb-4">Tendencia semanal (últimas 8 semanas)</h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {mockWeeklyData.map((item) => (
            <div key={item.week} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-[var(--color-primary)] rounded-t"
                style={{ height: `${item.percent}%` }}
              />
              <span className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)] mt-1">S{item.week}</span>
              <span className="text-xs font-medium dark:text-[var(--dm-text)]">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dona de distribución */}
      <div className="bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg p-4">
        <h3 className="text-sm font-semibold dark:text-[var(--dm-text)] mb-4">Distribución de la semana</h3>
        <div className="space-y-2">
          {mockDistribution.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-32 text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">{item.label}</div>
              <div className="flex-1 bg-gray-200 dark:bg-[var(--dm-border)] rounded-full h-4">
                <div
                  className={`${item.color} h-4 rounded-full`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
              <div className="w-12 text-xs font-medium dark:text-[var(--dm-text)]">{item.value}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg p-4">
        <h3 className="text-sm font-semibold dark:text-[var(--dm-text)] mb-4">Insights</h3>
        <div className="space-y-2 text-sm text-gray-700 dark:text-[var(--dm-text)]">
          <p>• Mejor día de la semana: <span className="font-semibold">Miércoles</span> (90% cumplimiento)</p>
          <p>• Hábito más constante: <span className="font-semibold">Journaling corto</span> (100% esta semana)</p>
          <p>• Tendencia: <span className="text-green-600 dark:text-green-400">↗ Mejorando</span> (+18 pts vs mes anterior)</p>
        </div>
      </div>
    </div>
  )
}
