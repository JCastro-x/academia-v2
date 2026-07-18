import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSubjects } from '../features/subjects/hooks.js'
import { useZonesBySubject, useCreateZone, useUpdateZone, useDeleteZone, useCreateItem, useUpdateItem, useDeleteItem } from '../features/grades/hooks.js'
import { countItemsByZone } from '../features/grades/api.js'
import { calculateSubjectStats } from '../domain/grades-calc.js'
import { useUIStore } from '../stores/ui.store.js'
import ZoneCard from '../features/grades/components/ZoneCard.jsx'
import ZoneForm from '../features/grades/components/ZoneForm.jsx'
import ItemForm from '../features/grades/components/ItemForm.jsx'

export default function Grades() {
  const { semesterId } = useParams()
  const navigate = useNavigate()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects(semesterId)
  const [selectedSubjectId, setSelectedSubjectId] = useState(null)
  const { data: zones, isLoading: zonesLoading } = useZonesBySubject(selectedSubjectId)
  
  const createZone = useCreateZone()
  const updateZone = useUpdateZone()
  const deleteZone = useDeleteZone()
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()
  const deleteItem = useDeleteItem()
  
  const { isModalOpen, modalContent, openModal, closeModal, openConfirmDialog, showUndoToast, addPendingDelete, removePendingDelete, pendingDeletes } = useUIStore()
  
  const [editingZone, setEditingZone] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [addingItemToZone, setAddingItemToZone] = useState(null)

  const subjectStats = zones ? calculateSubjectStats(zones) : null

  const handleCreateZone = async (zoneData) => {
    try {
      await createZone.mutateAsync({ ...zoneData, subject_id: selectedSubjectId })
      closeModal()
    } catch (error) {
      console.error('Error creating zone:', error)
    }
  }

  const handleUpdateZone = async (id, updates) => {
    try {
      await updateZone.mutateAsync({ id, updates })
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
      closeModal()
      setAddingItemToZone(null)
    } catch (error) {
      console.error('Error creating item:', error)
    }
  }

  const handleUpdateItem = async (id, updates) => {
    try {
      await updateItem.mutateAsync({ id, updates })
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

  if (subjectsLoading) return <div>Cargando materias...</div>

  return (
    <div className="space-y-6">
      {!selectedSubjectId ? (
        <>
          <h1 className="text-2xl font-bold">Calificaciones</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects?.map(subject => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedSubjectId(subject.id)}
                className="bg-white border-2 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors"
                style={{ borderColor: subject.color || '#e5e7eb' }}
              >
                <h3 className="font-semibold text-lg">{subject.nombre}</h3>
                {subject.codigo && <p className="text-sm text-gray-600">{subject.codigo}</p>}
              </motion.div>
            ))}
          </div>
          {!subjects || subjects.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No hay materias. Crea materias primero para gestionar calificaciones.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedSubjectId(null)}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Volver a materias
            </button>
            <h1 className="text-2xl font-bold">
              {subjects?.find(s => s.id === selectedSubjectId)?.nombre}
            </h1>
          </div>

          {subjectStats && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-semibold text-blue-900 mb-2">Proyección del semestre</h2>
              <p className="text-3xl font-bold text-blue-700">
                {subjectStats.projectedGrade.toFixed(1)}%
              </p>
              <p className="text-sm text-blue-600 mt-1">
                {subjectStats.totalPoints.toFixed(2)} / {subjectStats.maxPoints} puntos obtenidos
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Zonas de calificación</h2>
            <button
              onClick={() => { setEditingZone(null); openModal('zone') }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Nueva zona
            </button>
          </div>

          {zonesLoading ? (
            <div>Cargando zonas...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zones?.map(zone => (
                <ZoneCard
                  key={zone.id}
                  zone={zone}
                  onEdit={(zone) => { setEditingZone(zone); openModal('zone') }}
                  onDelete={handleDeleteZone}
                  onAddItem={(zone) => { setAddingItemToZone(zone); openModal('item') }}
                  onEditItem={(item) => { setEditingItem(item); openModal('item') }}
                  onDeleteItem={handleDeleteItem}
                  pendingDeletes={pendingDeletes}
                />
              ))}
            </div>
          )}

          {!zones || zones.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No hay zonas configuradas. Crea tu primera zona.</p>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {isModalOpen && modalContent === 'zone' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
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
            </motion.div>
          </motion.div>
        )}

        {isModalOpen && modalContent === 'item' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
