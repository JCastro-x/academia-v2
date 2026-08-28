import { useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useSubjects } from '../features/subjects/hooks.js'
import { useCreateSubject, useUpdateSubject } from '../features/subjects/hooks.js'
import { useCreateTask, useUpdateTask } from '../features/tasks/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import { playSound } from '../lib/sound.js'
import TaskForm from './TaskForm.jsx'
import SubjectForm from './SubjectForm.jsx'

export default function GlobalModalHost() {
  const navigate = useNavigate()
  const { semesterId } = useParams()
  const { data: subjects } = useSubjects(semesterId)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const createSubject = useCreateSubject()
  const updateSubject = useUpdateSubject()
  const {
    isModalOpen,
    modalContent,
    modalPayload,
    closeModal,
  } = useUIStore()

  const editingTask = modalPayload?.editingTask ?? null
  const editingSubject = modalPayload?.editingSubject ?? null

  const handleCreateTask = async (taskData) => {
    try {
      await createTask.mutateAsync(taskData)
      playSound('save')
      closeModal()
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleUpdateTask = async (id, updates) => {
    try {
      await updateTask.mutateAsync({ id, updates })
      playSound('save')
      closeModal()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleCreateSubject = async (subjectData) => {
    try {
      await createSubject.mutateAsync(subjectData)
      playSound('save')
      closeModal()
    } catch (error) {
      console.error('Error creating subject:', error)
    }
  }

  const handleUpdateSubject = async (id, updates) => {
    try {
      await updateSubject.mutateAsync({ id, updates })
      playSound('save')
      closeModal()
    } catch (error) {
      console.error('Error updating subject:', error)
    }
  }

  const quickAddOptions = [
    {
      id: 'task',
      label: 'Nueva Tarea',
      icon: '📝',
      enabled: true,
      action: () => {
        closeModal()
        useUIStore.getState().openModal('task')
      },
    },
    {
      id: 'event',
      label: 'Nuevo Evento',
      icon: '📅',
      enabled: true,
      action: () => {
        closeModal()
        navigate(`/s/${semesterId}/calendar`, { state: { quickAdd: 'event' } })
      },
    },
    {
      id: 'topic',
      label: 'Nuevo Tema',
      icon: '📖',
      enabled: (subjects?.length || 0) > 0,
      action: () => {
        closeModal()
        navigate(`/s/${semesterId}/grades`, { state: { quickAdd: 'topic' } })
      },
    },
    {
      id: 'class',
      label: 'Nueva Clase',
      icon: '🎓',
      enabled: true,
      action: () => {
        closeModal()
        useUIStore.getState().openModal('subject')
      },
    },
  ]

  return (
    <>
      <AnimatePresence>
        {isModalOpen && modalContent === 'quickadd' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white rounded-t-2xl p-6 w-full max-w-md dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-[var(--dm-text)]">Agregar rápido</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickAddOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => option.action()}
                    disabled={!option.enabled}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors ${
                      option.enabled
                        ? 'border-gray-200 hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] dark:border-[var(--dm-border)] dark:hover:border-[var(--color-primary)] dark:hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]'
                        : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed dark:border-[var(--dm-border)] dark:bg-[var(--dm-bg)]'
                    }`}
                  >
                    <span className="text-3xl">{option.icon}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-[var(--dm-text)]">{option.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={closeModal}
                className="w-full mt-4 py-3 text-gray-600 hover:text-gray-800 dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)]"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && modalContent === 'task' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.96, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 12, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="bg-white rounded-2xl shadow-[var(--shadow-md)] dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] w-full max-w-full max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain p-6 w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-[var(--dm-text)]">{editingTask ? 'Editar tarea' : 'Nueva tarea'}</h3>
              <TaskForm
                semesterId={semesterId}
                subjects={subjects}
                initialData={editingTask}
                onSubmit={editingTask ? (data) => handleUpdateTask(editingTask.id, data) : handleCreateTask}
                onCancel={closeModal}
                isPending={editingTask ? updateTask.isPending : createTask.isPending}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && modalContent === 'subject' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.96, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 12, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="bg-white rounded-2xl shadow-[var(--shadow-md)] dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:text-[var(--dm-text)] w-full max-w-full max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain p-6 w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-[var(--dm-text)]">{editingSubject ? 'Editar materia' : 'Nueva materia'}</h3>
              <SubjectForm
                semesterId={semesterId}
                initialData={editingSubject}
                onSubmit={editingSubject ? (data) => handleUpdateSubject(editingSubject.id, data) : handleCreateSubject}
                onCancel={closeModal}
                isPending={editingSubject ? updateSubject.isPending : createSubject.isPending}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
