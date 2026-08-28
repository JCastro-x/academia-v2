import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useEventsByMonth, useCreateEvent, useUpdateEvent, useDeleteEvent } from '../features/events/hooks.js'
import { useTasks } from '../features/tasks/hooks.js'
import { useSubjects } from '../features/subjects/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import { playSound } from '../lib/sound.js'
import ModalWrapper from '../components/ModalWrapper.jsx'

export default function Calendar() {
  const { semesterId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const { data: events } = useEventsByMonth(semesterId, year, month + 1)
  const { data: tasks } = useTasks(semesterId)
  const { data: subjects } = useSubjects(semesterId)
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const deleteEvent = useDeleteEvent()
  
  const { isModalOpen, modalContent, openModal, closeModal, openConfirmDialog, showUndoToast, addPendingDelete, removePendingDelete, pendingDeletes } = useUIStore()

  useEffect(() => {
    if (location.state?.quickAdd === 'event') {
      openModal('event')
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, location.state, navigate, openModal])

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay()
  }

  const isToday = (day) => {
    const today = new Date()
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  const getEventsForDay = (day) => {
    if (!events) return []
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(event => {
      const eventDate = new Date(event.start_at)
      return eventDate.getDate() === day && 
             eventDate.getMonth() === month && 
             eventDate.getFullYear() === year
    })
  }

  const getTasksForDay = (day) => {
    if (!tasks) return []
    return tasks.filter(task => {
      if (!task.due) return false
      const taskDate = new Date(task.due)
      return taskDate.getDate() === day && 
             taskDate.getMonth() === month && 
             taskDate.getFullYear() === year
    })
  }

  const getEventsAndTasksForMonth = () => {
    const items = []
    
    if (events) {
      events.forEach(event => {
        const eventDate = new Date(event.start_at)
        if (eventDate.getMonth() === month && eventDate.getFullYear() === year) {
          items.push({ ...event, type: 'event' })
        }
      })
    }
    
    if (tasks) {
      tasks.forEach(task => {
        if (task.due) {
          const taskDate = new Date(task.due)
          if (taskDate.getMonth() === month && taskDate.getFullYear() === year) {
            items.push({ ...task, type: 'task' })
          }
        }
      })
    }
    
    return items.sort((a, b) => {
      const dateA = new Date(a.type === 'event' ? a.start_at : a.due)
      const dateB = new Date(b.type === 'event' ? b.start_at : b.due)
      return dateA - dateB
    })
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleDayClick = (day) => {
    setSelectedDate(new Date(year, month, day))
    setEditingEvent(null)
    openModal('event')
  }

  const handleCreateEvent = async (eventData) => {
    try {
      await createEvent.mutateAsync({
        ...eventData,
        semester_id: semesterId,
      })
      playSound('save')
      closeModal()
      setSelectedDate(null)
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  const handleUpdateEvent = async (id, updates) => {
    try {
      await updateEvent.mutateAsync({ id, updates })
      playSound('save')
      closeModal()
      setEditingEvent(null)
      setSelectedDate(null)
    } catch (error) {
      console.error('Error updating event:', error)
    }
  }

  const handleDeleteEvent = (event) => {
    openConfirmDialog({
      title: 'Eliminar evento',
      message: `¿Estás seguro de eliminar "${event.nombre}"?`,
      confirmText: 'Eliminar',
      onConfirm: () => {
        const pendingDeleteId = Date.now()
        addPendingDelete({ type: 'event', itemId: event.id, pendingId: pendingDeleteId })
        showUndoToast({
          message: `Evento "${event.nombre}" eliminado`,
          onTimeout: async () => {
            try {
              playSound('delete')
              await deleteEvent.mutateAsync(event.id)
              removePendingDelete(pendingDeleteId)
            } catch (error) {
              console.error('Error deleting event:', error)
              removePendingDelete(pendingDeleteId)
            }
          },
          onUndo: () => {
            removePendingDelete(pendingDeleteId)
          }
        })
      }
    })
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const monthEventsAndTasks = getEventsAndTasksForMonth()

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-[var(--dm-text)]">Calendario</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
          >
            ←
          </button>
          <span className="text-lg font-semibold min-w-[150px] text-center dark:text-[var(--dm-text)]">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
          >
            →
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 text-sm dark:text-[var(--dm-text-muted)]">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDay }).map((_, index) => (
            <div key={`empty-${index}`} className="h-24" />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1
            const dayEvents = getEventsForDay(day)
            const dayTasks = getTasksForDay(day)
            
            return (
              <motion.button
                key={day}
                onClick={() => handleDayClick(day)}
                whileHover={{ scale: 1.02 }}
                className={`h-24 min-w-0 p-2 rounded-lg border text-left relative overflow-hidden transition-colors ${
                  isToday(day) 
                    ? 'border-blue-500 bg-blue-50 dark:border-[var(--color-primary)] dark:bg-[color-mix(in_srgb,var(--color-primary)_20%,var(--dm-surface))]' 
                    : 'border-gray-200 hover:bg-gray-50 dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)] dark:hover:bg-[var(--dm-border)]'
                }`}
              >
                <span className={`font-semibold ${isToday(day) ? 'text-blue-600 dark:text-[var(--color-primary)]' : 'dark:text-[var(--dm-text)]'}`}>
                  {day}
                </span>
                
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 px-1 rounded min-w-0 break-words overflow-hidden truncate"
                    >
                      {event.nombre}
                    </div>
                  ))}
                  {dayTasks.slice(0, 1).map(task => (
                    <div
                      key={task.id}
                      className={`text-xs px-1 rounded min-w-0 break-words overflow-hidden truncate ${
                        task.done 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200'
                      }`}
                    >
                      {task.titulo}
                    </div>
                  ))}
                  {(dayEvents.length + dayTasks.length) > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length + dayTasks.length - 3} más
                    </div>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 min-w-0 overflow-visible pb-16 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none">
        <h2 className="text-lg font-semibold mb-4 dark:text-[var(--dm-text)]">Eventos y tareas del mes</h2>
        
        {monthEventsAndTasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8 dark:text-[var(--dm-text-muted)]">
            No hay eventos ni tareas este mes
          </p>
        ) : (
          <div className="space-y-2 min-w-0">
            {monthEventsAndTasks.map(item => {
              const isPendingDelete = pendingDeletes.some(
                pd => pd.type === 'event' && pd.itemId === item.id
              )
              if (isPendingDelete) return null
              
              const itemDate = new Date(item.type === 'event' ? item.start_at : item.due)
              const formattedDate = itemDate.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.995 }}
                  className={`p-3 rounded-lg border min-w-0 ${
                    item.type === 'event'
                      ? 'border-purple-200 bg-purple-50'
                      : item.done
                      ? 'border-green-200 bg-green-50'
                      : 'border-orange-200 bg-orange-50'
                  } dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)]`}
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          item.type === 'event'
                            ? 'bg-purple-200 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200'
                            : item.done
                            ? 'bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                            : 'bg-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200'
                        }`}>
                          {item.type === 'event' ? 'Evento' : 'Tarea'}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-[var(--dm-text-muted)] truncate">{formattedDate}</span>
                      </div>
                      <h3 className="font-semibold mt-1 dark:text-[var(--dm-text)]">{item.nombre || item.titulo}</h3>
                      {item.descripcion && (
                        <p className="text-sm text-gray-600 mt-1 dark:text-[var(--dm-text-muted)]">{item.descripcion}</p>
                      )}
                      {item.tipo && (
                        <span className="text-xs text-gray-500 mt-1 block dark:text-[var(--dm-text-muted)]">
                          Tipo: {item.tipo}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setEditingEvent(item); setSelectedDate(itemDate); openModal('event') }}
                        className="text-blue-600 hover:text-blue-800 text-sm dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)]"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(item)}
                        className="text-red-600 hover:text-red-800 text-sm dark:text-red-400 dark:hover:text-red-300"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <ModalWrapper
        isOpen={isModalOpen && modalContent === 'event'}
        onClose={() => { setEditingEvent(null); setSelectedDate(null); closeModal() }}
        className="p-6 w-full max-w-md max-h-[90vh] overflow-y-auto mx-4"
      >
        <h3 className="text-lg font-semibold mb-4">
          {editingEvent ? 'Editar evento' : 'Nuevo evento'}
        </h3>
        
        <form onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.target)
          const eventData = {
            subject_id: formData.get('subject_id') || null,
            nombre: formData.get('nombre'),
            tipo: formData.get('tipo'),
            start_at: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
            end_at: formData.get('end_at') ? new Date(formData.get('end_at')).toISOString() : null,
            descripcion: formData.get('descripcion'),
          }
          
          if (editingEvent) {
            handleUpdateEvent(editingEvent.id, eventData)
          } else {
            handleCreateEvent(eventData)
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text)]">
              Nombre *
            </label>
            <input
              name="nombre"
              type="text"
              required
              defaultValue={editingEvent?.nombre}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text)]">
              Materia
            </label>
            <select
              name="subject_id"
              defaultValue={editingEvent?.subject_id || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
            >
              <option value="">Sin materia</option>
              {subjects?.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text)]">
              Tipo
            </label>
            <select
              name="tipo"
              defaultValue={editingEvent?.tipo || 'otro'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
            >
              <option value="parcial">Parcial</option>
              <option value="tarea">Tarea</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text)]">
              Fecha y hora inicio
            </label>
            <input
              name="start_at"
              type="datetime-local"
              defaultValue={editingEvent?.start_at ? new Date(editingEvent.start_at).toISOString().slice(0, 16) : (selectedDate ? selectedDate.toISOString().slice(0, 16) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text)]">
              Fecha y hora fin
            </label>
            <input
              name="end_at"
              type="datetime-local"
              defaultValue={editingEvent?.end_at ? new Date(editingEvent.end_at).toISOString().slice(0, 16) : ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text)]">
              Descripción
            </label>
            <textarea
              name="descripcion"
              rows={3}
              defaultValue={editingEvent?.descripcion}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => { setEditingEvent(null); setSelectedDate(null); closeModal() }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={editingEvent ? updateEvent.isPending : createEvent.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {editingEvent ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </ModalWrapper>
    </div>
  )
}
