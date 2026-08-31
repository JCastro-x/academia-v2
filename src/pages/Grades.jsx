import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useSubjects } from '../features/subjects/hooks.js'
import { useZonesBySubject, useCreateZone, useUpdateZone, useDeleteZone, useCreateItem, useUpdateItem, useDeleteItem, useSubjectsTotalPoints } from '../features/grades/hooks.js'
import { useTopicsBySubject, useCreateTopic, useUpdateTopic, useDeleteTopic } from '../features/topics/hooks.js'
import { countItemsByZone } from '../features/grades/api.js'
import { calculateSubjectStats } from '../domain/grades-calc.js'
import { useUIStore } from '../stores/ui.store.js'
import { playSound } from '../lib/sound.js'
import ZoneCard from '../features/grades/components/ZoneCard.jsx'
import ItemForm from '../features/grades/components/ItemForm.jsx'
import ZoneForm from '../features/grades/components/ZoneForm.jsx'
import ModalWrapper from '../components/ModalWrapper.jsx'

export default function Grades() {
  const { semesterId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects(semesterId)
  const [selectedSubjectId, setSelectedSubjectId] = useState(null)
  const [viewMode, setViewMode] = useState('grades') // 'grades' | 'topics'
  const { data: zones, isLoading: zonesLoading } = useZonesBySubject(selectedSubjectId)
  const { data: subjectTotals } = useSubjectsTotalPoints(semesterId)
  const { data: topics, isLoading: topicsLoading } = useTopicsBySubject(selectedSubjectId)
  
  const createZone = useCreateZone()
  const updateZone = useUpdateZone()
  const deleteZone = useDeleteZone()
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()
  const deleteItem = useDeleteItem()
  const createTopic = useCreateTopic()
  const updateTopic = useUpdateTopic()
  const deleteTopic = useDeleteTopic()
  
  const { isModalOpen, modalContent, openModal, closeModal, openConfirmDialog, showUndoToast, addPendingDelete, removePendingDelete, pendingDeletes } = useUIStore()
  
  const [editingZone, setEditingZone] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [addingItemToZone, setAddingItemToZone] = useState(null)
  const [editingTopic, setEditingTopic] = useState(null)

  useEffect(() => {
    if (location.state?.quickAdd === 'topic') {
      openModal('topic')
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, location.state, navigate, openModal])

  const subjectStats = zones ? calculateSubjectStats(zones) : null

  const handleCreateZone = async (zoneData) => {
    try {
      await createZone.mutateAsync({ ...zoneData, subject_id: selectedSubjectId })
      playSound('save')
      closeModal()
    } catch (error) {
      console.error('Error creating zone:', error)
    }
  }

  const handleUpdateZone = async (id, updates) => {
    try {
      await updateZone.mutateAsync({ id, updates })
      playSound('save')
      closeModal()
      setEditingZone(null)
    } catch (error) {
      console.error('Error updating zone:', error)
    }
  }

  const handleDeleteZone = async (zone) => {
    try {
      const itemCount = await useCountItemsByZone(zone.id)

      if (itemCount > 0) {
        openConfirmDialog({
          title: 'No se puede eliminar',
          message: `Esta zona tiene ${itemCount} ítem(es) asociado(s). Elimínalos primero.`,
          confirmText: 'Entendido',
          infoOnly: true,
        })
        return
      }

      openConfirmDialog({
        title: 'Eliminar zona',
        message: `¿Estás seguro de eliminar "${zone.nombre}"?`,
        confirmText: 'Eliminar',
        onConfirm: () => {
          const pendingDeleteId = Date.now()
          addPendingDelete({ type: 'zone', itemId: zone.id, pendingId: pendingDeleteId })
          showUndoToast({
            message: `Zona "${zone.nombre}" eliminada`,
            onTimeout: async () => {
              try {
                playSound('delete')
                await deleteZone.mutateAsync(zone.id)
                removePendingDelete(pendingDeleteId)
              } catch (error) {
                console.error('Error deleting zone:', error)
                removePendingDelete(pendingDeleteId)
              }
            },
            onUndo: () => {
              removePendingDelete(pendingDeleteId)
            }
          })
        }
      })
    } catch (error) {
      console.error('Error checking item count:', error)
    }
  }

  const handleCreateItem = async (itemData) => {
    try {
      await createItem.mutateAsync({ ...itemData, zone_id: addingItemToZone.id })
      playSound('save')
      closeModal()
      setAddingItemToZone(null)
    } catch (error) {
      console.error('Error creating item:', error)
    }
  }

  const handleUpdateItem = async (id, updates) => {
    try {
      await updateItem.mutateAsync({ id, updates })
      playSound('save')
      closeModal()
      setEditingItem(null)
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const handleDeleteItem = async (item) => {
    openConfirmDialog({
      title: 'Eliminar ítem',
      message: `¿Estás seguro de eliminar "${item.nombre}"?`,
      confirmText: 'Eliminar',
      onConfirm: () => {
        const pendingDeleteId = Date.now()
        addPendingDelete({ type: 'item', itemId: item.id, pendingId: pendingDeleteId })
        showUndoToast({
          message: `Ítem "${item.nombre}" eliminado`,
          onTimeout: async () => {
            try {
              playSound('delete')
              await deleteItem.mutateAsync(item.id)
              removePendingDelete(pendingDeleteId)
            } catch (error) {
              console.error('Error deleting item:', error)
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

  const handleCreateTopic = async (topicData) => {
    try {
      await createTopic.mutateAsync(topicData)
      if (topicData.subject_id) {
        setSelectedSubjectId(topicData.subject_id)
        setViewMode('topics')
      }
      playSound('save')
      closeModal()
    } catch (error) {
      console.error('Error creating topic:', error)
    }
  }

  const handleUpdateTopic = async (id, updates) => {
    try {
      await updateTopic.mutateAsync({ id, updates })
      playSound('save')
      closeModal()
      setEditingTopic(null)
    } catch (error) {
      console.error('Error updating topic:', error)
    }
  }

  const handleDeleteTopic = (topic) => {
    openConfirmDialog({
      title: 'Eliminar tema',
      message: `¿Estás seguro de eliminar "${topic.nombre}"?`,
      confirmText: 'Eliminar',
      onConfirm: () => {
        const pendingDeleteId = Date.now()
        addPendingDelete({ type: 'topic', itemId: topic.id, pendingId: pendingDeleteId })
        showUndoToast({
          message: `Tema "${topic.nombre}" eliminado`,
          onTimeout: async () => {
            try {
              playSound('delete')
              await deleteTopic.mutateAsync(topic.id)
              removePendingDelete(pendingDeleteId)
            } catch (error) {
              console.error('Error deleting topic:', error)
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

  const getTopicsByPartial = (parcial) => {
    if (!topics) return []
    return topics.filter(t => t.parcial === parcial)
  }

  const partials = ['Parcial 1', 'Parcial 2', 'Parcial 3', 'Final']

  if (subjectsLoading) return <div>Cargando materias...</div>

  return (
    <div className="space-y-6">
      {!selectedSubjectId ? (
        <>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--dm-text)]">Calificaciones</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects?.map(subject => {
              const cardColor = subject.color || '#e5e7eb'
              const stats = subjectTotals?.[subject.id]
              return (
                <div
                  key={subject.id}
                  onClick={() => setSelectedSubjectId(subject.id)}
                  className="relative rounded-2xl p-5 backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    boxShadow: `0 0 30px ${cardColor}30, 0 0 60px ${cardColor}1a, inset 0 0 25px ${cardColor}15`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg dark:text-[var(--dm-text)] truncate">{subject.nombre}</h3>
                      {subject.codigo && <p className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)]">{subject.codigo}</p>}
                    </div>
                    {stats ? (
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-bold text-gray-900 dark:text-[var(--dm-text)]">
                          {stats.totalPoints.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">
                          / {stats.maxPoints} pts
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)] shrink-0 pt-1">
                        Sin zonas
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {!subjects || subjects.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No hay materias. Crea materias primero para gestionar calificaciones.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <button
              onClick={() => { setSelectedSubjectId(null); setViewMode('grades') }}
              className="text-gray-600 hover:text-gray-800 dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)]"
            >
              ← Volver a materias
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--dm-text)]">
              {subjects?.find(s => s.id === selectedSubjectId)?.nombre}
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grades')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'grades' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]'
              }`}
            >
              Calificaciones
            </button>
            <button
              onClick={() => setViewMode('topics')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'topics' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]'
              }`}
            >
              Temas
            </button>
          </div>

          {viewMode === 'grades' ? (
            <>
              {subjectStats && (
                <div className="bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] border border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] rounded-lg p-4 dark:bg-[var(--dm-surface)] dark:border-[var(--dm-border)]">
                  <h2 className="font-semibold text-[var(--color-primary)] dark:text-[var(--dm-text)] mb-2">Proyección del semestre</h2>
                  <p className="text-3xl font-bold text-[var(--color-primary)] dark:text-[var(--dm-text)]">
                    {subjectStats.projectedGrade.toFixed(1)}%
                  </p>
                  <p className="text-sm text-[var(--color-primary)] dark:text-[var(--dm-text-muted)] mt-1">
                    {subjectStats.totalPoints.toFixed(2)} / {subjectStats.maxPoints} puntos obtenidos
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-[var(--dm-text)]">Zonas de calificación</h2>
                <button
                  onClick={() => { setEditingZone(null); openModal('zone') }}
                  className="bg-[var(--color-primary)] text-[var(--color-primary-fg)] px-4 py-2 rounded-lg hover:bg-[color-mix(in_srgb,var(--color-primary)_85%,black)] w-full sm:w-auto"
                >
                  + Nueva zona
                </button>
              </div>

              {zonesLoading ? (
                <div className="flex min-h-[24vh] items-center justify-center text-gray-500 dark:text-[var(--dm-text-muted)]">Cargando zonas...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {zones?.map(zone => {
                    const selectedSubject = subjects?.find(s => s.id === selectedSubjectId)
                    return (
                      <ZoneCard
                        key={zone.id}
                        zone={zone}
                        subjectColor={selectedSubject?.color}
                        onEdit={(zone) => { setEditingZone(zone); openModal('zone') }}
                        onDelete={handleDeleteZone}
                        onAddItem={(zone) => { setAddingItemToZone(zone); openModal('item') }}
                        onEditItem={(item) => { setEditingItem(item); openModal('item') }}
                        onDeleteItem={handleDeleteItem}
                        pendingDeletes={pendingDeletes}
                      />
                    )
                  })}
                </div>
              )}

              {!zones || zones.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-[var(--dm-text-muted)]">
                  <p>No hay zonas configuradas. Crea tu primera zona.</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-[var(--dm-text)]">Temas del curso</h2>
                <button
                  onClick={() => { setEditingTopic(null); openModal('topic') }}
                  className="bg-[var(--color-primary)] text-[var(--color-primary-fg)] px-4 py-2 rounded-lg hover:bg-[color-mix(in_srgb,var(--color-primary)_85%,black)] w-full sm:w-auto dark:shadow-[0_0_0_1px_var(--dm-border)]"
                >
                  + Nuevo tema
                </button>
              </div>

              {topicsLoading ? (
                <div className="text-gray-600 dark:text-[var(--dm-text-muted)]">Cargando temas...</div>
              ) : (
                <div className="space-y-6">
                  {partials.map(parcial => {
                    const partialTopics = getTopicsByPartial(parcial)
                    if (partialTopics.length === 0) return null

                    return (
                      <div key={parcial} className="bg-white border rounded-lg p-4 dark:bg-[var(--dm-surface)] dark:border-[var(--dm-border)]">
                        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-[var(--dm-text)]">{parcial}</h3>
                        <div className="space-y-3">
                          {partialTopics.map(topic => {
                            const isPendingDelete = pendingDeletes.some(
                              pd => pd.type === 'topic' && pd.itemId === topic.id
                            )
                            if (isPendingDelete) return null

                            return (
                              <motion.div
                                key={topic.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border rounded-lg p-3 bg-white hover:bg-gray-50 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:hover:bg-[var(--dm-surface)]"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 dark:text-[var(--dm-text)]">{topic.nombre}</h4>
                                    {topic.subtemas && topic.subtemas.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-sm text-gray-600 mb-1 dark:text-[var(--dm-text-muted)]">Subtemas:</p>
                                        <ul className="text-sm text-gray-500 list-disc list-inside dark:text-[var(--dm-text-muted)]">
                                          {topic.subtemas.map((subtema, idx) => (
                                            <li key={idx}>{subtema}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    <div className="mt-2 flex flex-wrap gap-2 text-sm">
                                      {topic.dificultad && (
                                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded dark:bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] dark:text-[var(--dm-text)]">
                                          Dificultad: {topic.dificultad}/5
                                        </span>
                                      )}
                                      {topic.tiempo_dedicado_min && (
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded dark:bg-[color-mix(in_srgb,green_12%,transparent)] dark:text-[var(--dm-text)]">
                                          Tiempo: {topic.tiempo_dedicado_min} min
                                        </span>
                                      )}
                                      {topic.fecha_examen && (
                                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded dark:bg-[color-mix(in_srgb,orange_14%,transparent)] dark:text-[var(--dm-text)]">
                                          Examen: {new Date(topic.fecha_examen).toLocaleDateString('es-ES')}
                                        </span>
                                      )}
                                      {topic.visto && (
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded dark:bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] dark:text-[var(--dm-text)]">
                                          ✓ Visto
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                    <button
                                      onClick={() => { setEditingTopic(topic); openModal('topic') }}
                                      className="text-blue-600 hover:text-blue-800 dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)] text-sm"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTopic(topic)}
                                      className="text-red-600 hover:text-red-800 dark:text-[var(--dm-text-muted)] dark:hover:text-red-300 text-sm"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {!topics || topics.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-[var(--dm-text-muted)]">
                  <p>No hay temas. Crea tu primer tema.</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      <ModalWrapper
        isOpen={isModalOpen && modalContent === 'zone'}
        onClose={() => { setEditingZone(null); closeModal() }}
        className="p-6 w-full max-w-md max-h-[90vh] overflow-y-auto mx-4"
      >
        <h3 className="text-lg font-semibold mb-4">
          {editingZone ? 'Editar zona' : 'Nueva zona'}
        </h3>
        <ZoneForm
          initialData={editingZone}
          onSubmit={editingZone
            ? (data) => handleUpdateZone(editingZone.id, data)
            : handleCreateZone
          }
          onCancel={() => { setEditingZone(null); closeModal() }}
          isPending={editingZone ? updateZone.isPending : createZone.isPending}
        />
      </ModalWrapper>

      <ModalWrapper
        isOpen={isModalOpen && modalContent === 'item'}
        onClose={() => { setEditingItem(null); setAddingItemToZone(null); closeModal() }}
        className="p-6 w-full max-w-md max-h-[90vh] overflow-y-auto mx-4"
      >
        <h3 className="text-lg font-semibold mb-4">
          {editingItem ? 'Editar ítem' : 'Nuevo ítem'}
        </h3>
        <ItemForm
          initialData={editingItem}
          onSubmit={editingItem
            ? (data) => handleUpdateItem(editingItem.id, data)
            : handleCreateItem
          }
          onCancel={() => { setEditingItem(null); setAddingItemToZone(null); closeModal() }}
          isPending={editingItem ? updateItem.isPending : createItem.isPending}
        />
      </ModalWrapper>

      <ModalWrapper
        isOpen={isModalOpen && modalContent === 'topic'}
        onClose={() => { setEditingTopic(null); closeModal() }}
        className="p-6 w-full max-w-md max-h-[90vh] overflow-y-auto mx-4"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-[var(--dm-text)]">
          {editingTopic ? 'Editar tema' : 'Nuevo tema'}
        </h3>

        <form onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.target)
          const subtemasText = formData.get('subtemas')
          const subtemas = subtemasText ? subtemasText.split('\n').filter(s => s.trim()) : []
          const subjectId = formData.get('subject_id') || selectedSubjectId

          const topicData = {
            subject_id: subjectId,
            parcial: formData.get('parcial'),
            nombre: formData.get('nombre'),
            subtemas,
            dificultad: formData.get('dificultad') ? parseInt(formData.get('dificultad')) : null,
            tiempo_dedicado_min: formData.get('tiempo_dedicado_min') ? parseInt(formData.get('tiempo_dedicado_min')) : null,
            fecha_examen: formData.get('fecha_examen') || null,
          }

          if (editingTopic) {
            handleUpdateTopic(editingTopic.id, topicData)
          } else {
            handleCreateTopic(topicData)
          }
        }} autoComplete="off" className="space-y-4 text-gray-900 dark:text-[var(--dm-text)]">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">
              Materia *
            </label>
            <select
              name="subject_id"
              required
              defaultValue={editingTopic?.subject_id || selectedSubjectId || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:focus:ring-[var(--color-primary)]"
            >
              <option value="" disabled>Seleccionar materia</option>
              {subjects?.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">
              Parcial *
            </label>
            <select
              name="parcial"
              required
              defaultValue={editingTopic?.parcial || 'Parcial 1'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:focus:ring-[var(--color-primary)]"
            >
              <option value="Parcial 1">Parcial 1</option>
              <option value="Parcial 2">Parcial 2</option>
              <option value="Parcial 3">Parcial 3</option>
              <option value="Final">Final</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">
              Nombre del tema *
            </label>
            <input
              name="nombre"
              type="text"
              required
              defaultValue={editingTopic?.nombre}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:placeholder:text-[var(--dm-text-muted)] dark:focus:ring-[var(--color-primary)]"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">
              Subtemas (uno por línea)
            </label>
            <textarea
              name="subtemas"
              rows={3}
              defaultValue={editingTopic?.subtemas?.join('\n') || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:placeholder:text-[var(--dm-text-muted)] dark:focus:ring-[var(--color-primary)]"
              placeholder="Subtema 1&#10;Subtema 2&#10;Subtema 3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">
              Dificultad (1-5)
            </label>
            <input
              name="dificultad"
              type="number"
              min="1"
              max="5"
              defaultValue={editingTopic?.dificultad || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:focus:ring-[var(--color-primary)]"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">
              Tiempo a dedicar (minutos)
            </label>
            <input
              name="tiempo_dedicado_min"
              type="number"
              min="0"
              defaultValue={editingTopic?.tiempo_dedicado_min || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:focus:ring-[var(--color-primary)]"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-[var(--dm-text-muted)]">
              Fecha de examen
            </label>
            <input
              name="fecha_examen"
              type="date"
              defaultValue={editingTopic?.fecha_examen || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => { setEditingTopic(null); closeModal() }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-bg)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={editingTopic ? updateTopic.isPending : createTopic.isPending}
              className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-fg)] rounded-lg hover:bg-[color-mix(in_srgb,var(--color-primary)_85%,black)] disabled:opacity-50 dark:disabled:bg-[var(--dm-border)]"
            >
              {editingTopic ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </ModalWrapper>
    </div>
  )
}
