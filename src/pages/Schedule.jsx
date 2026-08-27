import { useParams } from 'react-router-dom'
import { useSubjects } from '../features/subjects/hooks.js'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 7:00 to 19:00

export default function Schedule() {
  const { semesterId } = useParams()
  const { data: subjects, isLoading } = useSubjects(semesterId)

  if (isLoading) return <div>Cargando...</div>

  const getScheduleForDayAndHour = (day, hour) => {
    if (!subjects) return null
    
    for (const subject of subjects) {
      if (!subject.horario) continue
      
      const daySchedule = subject.horario.find(h => h.dia === day)
      if (!daySchedule) continue
      
      const startHour = parseInt(daySchedule.hora_inicio.split(':')[0])
      const endHour = parseInt(daySchedule.hora_fin.split(':')[0])
      
      if (hour >= startHour && hour < endHour) {
        return { subject, schedule: daySchedule }
      }
    }
    return null
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold dark:text-[var(--dm-text)]">Mi Horario</h1>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-[var(--dm-bg)]">
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-20 dark:text-[var(--dm-text)]">Hora</th>
              {DAYS.map(day => (
                <th key={day} className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-[var(--dm-text)]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(hour => (
              <tr key={hour} className="border-t">
                <td className="px-4 py-2 text-sm text-gray-600 font-medium dark:text-[var(--dm-text-muted)]">
                  {hour}:00
                </td>
                {DAYS.map(day => {
                  const classInfo = getScheduleForDayAndHour(day, hour)
                  if (classInfo) {
                    return (
                      <td key={`${day}-${hour}`} className="px-2 py-1">
                        <div
                          className="rounded p-2 text-xs text-white"
                          style={{ backgroundColor: classInfo.subject.color }}
                        >
                          <div className="font-semibold truncate">{classInfo.subject.nombre}</div>
                          <div className="opacity-90 truncate">{classInfo.subject.codigo}</div>
                        </div>
                      </td>
                    )
                  }
                  return <td key={`${day}-${hour}`} className="px-2 py-1" />
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none">
        <h2 className="text-lg font-semibold mb-4 dark:text-[var(--dm-text)]">Detalle de Materias</h2>
        <div className="space-y-4">
          {subjects?.map(subject => (
            <div key={subject.id} className="border-l-4 pl-4" style={{ borderLeftColor: subject.color }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{subject.icono}</span>
                <div>
                  <h3 className="font-semibold dark:text-[var(--dm-text)]">{subject.nombre}</h3>
                  {subject.codigo && <p className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">{subject.codigo}</p>}
                </div>
              </div>
              {subject.horario && subject.horario.length > 0 && (
                <div className="text-sm text-gray-600 space-y-1 dark:text-[var(--dm-text-muted)]">
                  {subject.horario.map((h, idx) => (
                    <div key={idx}>
                      {h.dia} {h.hora_inicio} - {h.hora_fin}
                      {h.tipo && ` (${h.tipo})`}
                    </div>
                  ))}
                </div>
              )}
              {subject.catedratico && <p className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">Catedrático: {subject.catedratico}</p>}
              {subject.seccion && <p className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">Sección: {subject.seccion}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
