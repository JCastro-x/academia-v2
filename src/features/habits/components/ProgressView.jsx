import { useState } from 'react'
import { motion } from 'framer-motion'
import { getTodayDate, addDays, getDayOfWeek } from '../../../lib/date-utils.js'
import { calculateOverallPercent } from '../stats.js'

export default function ProgressView({ habits, logs, programaciones, pauseDays, config }) {
  const [selectedMonth, setSelectedMonth] = useState(() => getTodayDate().slice(0, 7)) // YYYY-MM

  const dataLogs = logs || []
  const dataHabits = habits || []
  const hasAnyLog = (logs || []).length > 0
  const hasMultipleWeeks = hasAnyLog && new Set(dataLogs.map(l => l.fecha.slice(0, 7))).size > 1

  // Calcular datos reales por día
  const calculateDailyData = () => {
    const today = getTodayDate()
    const dayOfWeek = getDayOfWeek(today)
    const monday = addDays(today, -(dayOfWeek - 1))

    const dailyData = []
    for (let i = 0; i < 7; i++) {
      const fecha = addDays(monday, i)
      const dayIndex = getDayOfWeek(fecha)
      const dayLabel = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][dayIndex - 1]
      const isToday = fecha === today

      let total = 0
      let cumplidos = 0
      dataHabits.forEach(habit => {
        if (habit.archivado) return
        const log = dataLogs.find(l => l.habit_id === habit.id && l.fecha === fecha)
        if (log?.estado === 'cumplido') {
          cumplidos++
        }
        total++
      })

      const percent = total > 0 ? Math.round((cumplidos / total) * 100) : 0
      dailyData.push({ day: dayLabel, percent, isToday })
    }
    return dailyData
  }

  // Calcular tendencia de 8 semanas
  const calculateWeeklyTrend = () => {
    const today = getTodayDate()
    const dayOfWeek = getDayOfWeek(today)
    const weekData = []

    for (let week = 0; week < 8; week++) {
      const weekStart = addDays(today, -week * 7 - (dayOfWeek - 1))
      const weekEnd = addDays(weekStart, 6)
      const isCurrentWeek = week === 0

      let total = 0
      let cumplidos = 0
      let hasRecords = false
      for (let i = 0; i < 7; i++) {
        const fecha = addDays(weekStart, i)
        dataHabits.forEach(habit => {
          if (habit.archivado) return
          const log = dataLogs.find(l => l.habit_id === habit.id && l.fecha === fecha)
          if (log) {
            hasRecords = true
            if (log.estado === 'cumplido') {
              cumplidos++
            }
          }
          total++
        })
      }

      const percent = total > 0 ? Math.round((cumplidos / total) * 100) : 0
      weekData.push({ week: week + 1, percent, isCurrentWeek, hasRecords })
    }

    return weekData.reverse() // Más reciente primero
  }

  // Calcular distribución
  const calculateDistribution = () => {
    const counts = { cumplido: 0, parcial: 0, fallado: 0, pendiente: 0 }
    const total = dataLogs.length
    
    dataLogs.forEach(log => {
      if (log.estado === 'cumplido') counts.cumplido++
      else if (log.estado === 'parcial') counts.parcial++
      else if (log.estado === 'fallado') counts.fallado++
      else counts.pendiente++
    })
    
    return [
      { label: 'Cumplido', value: total > 0 ? Math.round((counts.cumplido / total) * 100) : 0, color: 'bg-green-500' },
      { label: 'Parcial', value: total > 0 ? Math.round((counts.parcial / total) * 100) : 0, color: 'bg-orange-500' },
      { label: 'Fallado', value: total > 0 ? Math.round((counts.fallado / total) * 100) : 0, color: 'bg-red-500' },
      { label: 'Pendiente', value: total > 0 ? Math.round((counts.pendiente / total) * 100) : 0, color: 'bg-gray-300' },
    ]
  }

  // Calcular mapa de calor mensual
  const calculateHeatmapData = () => {
    const year = parseInt(selectedMonth.slice(0, 4))
    const month = parseInt(selectedMonth.slice(5, 7))
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDayOffset = (new Date(year, month - 1, 1).getDay() + 6) % 7
    const heatmapData = Array(42).fill(null)
    const today = getTodayDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const fecha = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      let total = 0
      let cumplidos = 0
      dataHabits.forEach(habit => {
        if (habit.archivado) return
        const log = dataLogs.find(l => l.habit_id === habit.id && l.fecha === fecha)
        if (log?.estado === 'cumplido') {
          cumplidos++
        }
        total++
      })
      
      const percent = total > 0 ? Math.round((cumplidos / total) * 100) : 0
      const weekday = (new Date(year, month - 1, day).getDay() + 6) % 7
      const week = Math.floor((firstDayOffset + day - 1) / 7)
      heatmapData[weekday * 6 + week] = { day, percent, isToday: fecha === today }
    }
    return heatmapData
  }

  const dailyData = hasAnyLog ? calculateDailyData() : []

  const weeklyData = hasMultipleWeeks ? calculateWeeklyTrend() : []

  const heatmapData = calculateHeatmapData()

  const distribution = hasAnyLog ? calculateDistribution() : []

  // Calcular insights reales
  const calculateInsights = () => {
    if (!hasAnyLog) return null

    // Mejor día de la semana
    const dayStats = { 1: { total: 0, cumplidos: 0 }, 2: { total: 0, cumplidos: 0 }, 3: { total: 0, cumplidos: 0 }, 4: { total: 0, cumplidos: 0 }, 5: { total: 0, cumplidos: 0 }, 6: { total: 0, cumplidos: 0 }, 7: { total: 0, cumplidos: 0 } }
    dataLogs.forEach(log => {
      if (log.estado === 'cumplido') {
        const dayIndex = getDayOfWeek(log.fecha)
        dayStats[dayIndex].cumplidos++
      }
      dayStats[getDayOfWeek(log.fecha)].total++
    })

    let bestDay = { day: 'Miércoles', percent: 0 }
    Object.entries(dayStats).forEach(([dayIndex, stats]) => {
      if (stats.total > 0) {
        const percent = (stats.cumplidos / stats.total) * 100
        if (percent > bestDay.percent) {
          bestDay = { day: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][dayIndex - 1], percent }
        }
      }
    })

    // Hábito más constante
    const habitStats = {}
    dataHabits.forEach(habit => {
      if (habit.archivado) return
      const habitLogs = dataLogs.filter(l => l.habit_id === habit.id)
      const cumplidos = habitLogs.filter(l => l.estado === 'cumplido').length
      const total = habitLogs.length
      habitStats[habit.nombre] = total > 0 ? cumplidos / total : 0
    })

    let bestHabit = { nombre: 'N/A', percent: 0 }
    Object.entries(habitStats).forEach(([nombre, percent]) => {
      if (percent > bestHabit.percent) {
        bestHabit = { nombre, percent }
      }
    })

    // Tendencia vs mes anterior (calculada real)
    const today = getTodayDate()
    const [year, month] = today.split('-').map(Number)
    const lastMonth = month === 1
      ? `${year - 1}-12`
      : `${year}-${String(month - 1).padStart(2, '0')}`
    const currentMonth = today.slice(0, 7)

    let currentMonthTotal = 0
    let currentMonthCumplidos = 0
    let lastMonthTotal = 0
    let lastMonthCumplidos = 0

    dataLogs.forEach(log => {
      if (log.estado === 'cumplido') {
        if (log.fecha.startsWith(currentMonth)) {
          currentMonthCumplidos++
        } else if (log.fecha.startsWith(lastMonth)) {
          lastMonthCumplidos++
        }
      }
      if (log.fecha.startsWith(currentMonth)) {
        currentMonthTotal++
      } else if (log.fecha.startsWith(lastMonth)) {
        lastMonthTotal++
      }
    })

    const currentPercent = currentMonthTotal > 0 ? (currentMonthCumplidos / currentMonthTotal) * 100 : 0
    const lastPercent = lastMonthTotal > 0 ? (lastMonthCumplidos / lastMonthTotal) * 100 : 0
    const diff = Math.round(currentPercent - lastPercent)
    const trend = diff > 0 ? '↗ Mejorando' : diff < 0 ? '↘ Bajando' : '→ Estable'

    return {
      bestDay: `${bestDay.day} (${Math.round(bestDay.percent)}% cumplimiento)`,
      bestHabit: bestHabit.nombre,
      trend: lastMonthTotal > 0 ? `${trend} (${diff > 0 ? '+' : ''}${diff} pts vs mes anterior)` : 'Sin datos de mes anterior',
    }
  }

  const insights = calculateInsights()
  const currentMonth = getTodayDate().slice(0, 7)
  const selectedYear = Number(selectedMonth.slice(0, 4))
  const selectedMonthNumber = Number(selectedMonth.slice(5, 7))
  const isCurrentOrFutureMonth = selectedMonth >= currentMonth

  const changeMonth = (offset) => {
    const monthIndex = selectedMonthNumber - 1 + offset
    const year = selectedYear + Math.floor(monthIndex / 12)
    const month = ((monthIndex % 12) + 12) % 12 + 1
    setSelectedMonth(`${year}-${String(month).padStart(2, '0')}`)
  }

  return (
    <div className="space-y-6 pb-0 min-[640px]:pb-32 md:pb-12">
      {!hasAnyLog && (
        <div className="bg-gray-50 dark:bg-[var(--dm-bg)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">
            Aún no hay suficientes datos para mostrar estadísticas reales.
          </p>
        </div>
      )}

      {hasAnyLog && (
        <>
          {/* Gráfico de barras por día */}
          <div className="bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold dark:text-[var(--dm-text)] mb-4">% de cumplimiento por día</h3>
            <div className="flex items-end justify-between gap-2 mb-1">
              {dailyData.map((item) => (
                <div key={item.day} className="flex-1 flex flex-col items-center">
                  <div className="text-xs font-medium dark:text-[var(--dm-text)] mb-1">{item.percent}%</div>
                  <div className="w-full flex items-end" style={{ height: 128 }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: Math.max(item.percent > 0 ? 4 : 0, Math.round(128 * item.percent / 100)) }}
                      transition={{ duration: 0.5 }}
                      className={`w-full rounded-t ${item.isToday ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-primary)]'}`}
                    />
                  </div>
                  <span className={`text-xs mt-1 ${item.isToday ? 'font-bold text-[var(--color-accent)]' : 'text-gray-600 dark:text-[var(--dm-text-muted)]'}`}>{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mapa de calor mensual */}
          <div className="bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold dark:text-[var(--dm-text)] mb-4">Mapa de calor mensual</h3>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => changeMonth(-1)}
                className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]"
              >
                ← Mes anterior
              </button>
              <span className="text-sm font-medium dark:text-[var(--dm-text)]">
                {new Date(selectedYear, selectedMonthNumber - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => changeMonth(1)}
                disabled={isCurrentOrFutureMonth}
                className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Mes siguiente →
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, i) => (
                <div key={day} className="text-center">
                  <div className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)] mb-1">{day}</div>
                  <div className="grid grid-rows-6 gap-1">
                    {Array.from({ length: 6 }).map((_, j) => {
                      const idx = i * 6 + j
                      const data = heatmapData[idx]
                      if (!data) return <div key={j} className="w-7 h-7 bg-gray-100 dark:bg-[var(--dm-bg)] rounded" />
                      const bg = data.percent >= 75 ? 'bg-green-500' : data.percent >= 50 ? 'bg-green-300' : data.percent >= 25 ? 'bg-yellow-300' : 'bg-gray-300'
                      return (
                        <div
                          key={j}
                          className={`w-7 h-7 ${bg} rounded flex items-center justify-center text-xs font-medium text-white ${data.isToday ? 'ring-2 ring-[var(--color-accent)] font-bold' : ''}`}
                          title={`${data.day}: ${data.percent}%`}
                        >
                          {data.day}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-300 rounded" />
                <span>0-25%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-300 rounded" />
                <span>25-50%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-300 rounded" />
                <span>50-75%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>75-100%</span>
              </div>
            </div>
          </div>

          {/* Tendencia semanal */}
          {!hasMultipleWeeks ? (
            <div className="bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg p-4">
              <h3 className="text-sm font-semibold dark:text-[var(--dm-text)] mb-4">Tendencia semanal (últimas 8 semanas)</h3>
              <div className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">
                Se mostrará con más semanas de datos.
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg p-4">
              <h3 className="text-sm font-semibold dark:text-[var(--dm-text)] mb-4">Tendencia semanal (últimas 8 semanas)</h3>
              <div className="flex items-end justify-between gap-2 mb-1">
                {weeklyData.map((item) => (
                  <div key={item.week} className="flex-1 flex flex-col items-center">
                    <div className="text-xs font-medium dark:text-[var(--dm-text)] mb-1">{item.hasRecords ? item.percent + '%' : '-'}</div>
                    <div className="w-full flex items-end" style={{ height: 128 }}>
                      {item.hasRecords ? (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: Math.max(item.percent > 0 ? 4 : 0, Math.round(128 * item.percent / 100)) }}
                          transition={{ duration: 0.5 }}
                          className={`w-full rounded-t ${item.isCurrentWeek ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-primary)]'}`}
                        />
                      ) : (
                        <div className="w-full bg-gray-200 dark:bg-[var(--dm-border)] rounded-t" style={{ height: 4 }} />
                      )}
                    </div>
                    <span className={`text-xs mt-1 ${item.isCurrentWeek ? 'font-bold text-[var(--color-accent)]' : 'text-gray-600 dark:text-[var(--dm-text-muted)]'}`}>S{item.week}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dona de distribución */}
          <div className="bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold dark:text-[var(--dm-text)] mb-4">Distribución de la semana</h3>
            <div className="space-y-2">
              {distribution.map((item) => (
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
          {!insights ? (
            <div className="bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg p-4">
              <h3 className="text-sm font-semibold dark:text-[var(--dm-text)] mb-4">Insights</h3>
              <div className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">
                Aún no hay suficientes datos para mostrar insights.
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[var(--dm-surface)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg p-4">
              <h3 className="text-sm font-semibold dark:text-[var(--dm-text)] mb-4">Insights</h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-[var(--dm-text)]">
                <p>• Mejor día de la semana: <span className="font-semibold">{insights.bestDay}</span></p>
                <p>• Hábito más constante: <span className="font-semibold">{insights.bestHabit}</span></p>
                <p>• Tendencia: <span className="text-green-600 dark:text-green-400">{insights.trend}</span></p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
