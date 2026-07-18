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
      <h1 className="text-2xl font-bold">Mi Horario</h1>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-20">Hora</th>
              {DAYS.map(day => (
                <th key={day} className="px-4 py-3 text-center font-semibold text-gray-700">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(hour => (
              <tr key={hour} className="border-t">
                <td className="px-4 py-2 text-sm text-gray-600 font-medium">
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

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Detalle de Materias</h2>
        <div className="space-y-4">
          {subjects?.map(subject => (
            <div key={subject.id} className="border-l-4 pl-4" style={{ borderLeftColor: subject.color }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{subject.icono}</span>
                <div>
                  <h3 className="font-semibold">{subject.nombre}</h3>
                  {subject.codigo && <p className="text-sm text-gray-600">{subject.codigo}</p>}
                </div>
              </div>
              {subject.horario && subject.horario.length > 0 && (
                <div className="text-sm text-gray-600 space-y-1">
                  {subject.horario.map((h, idx) => (
                    <div key={idx}>
                      {h.dia} {h.hora_inicio} - {h.hora_fin}
                      {h.tipo && ` (${h.tipo})`}
                    </div>
                  ))}
                </div>
              )}
              {subject.catedratico && <p className="text-sm text-gray-600">Catedrático: {subject.catedratico}</p>}
              {subject.seccion && <p className="text-sm text-gray-600">Sección: {subject.seccion}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
