import TaskCard from './TaskCard.jsx'

export default function TaskList({ tasks, subjects, onToggleDone, onEdit, onDelete }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-[var(--dm-text-muted)]">
        <p>No hay tareas</p>
      </div>
    )
  }

  const getSubject = (subjectId) => subjects?.find(s => s.id === subjectId)

  return (
    <div className="space-y-3">
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          subject={getSubject(task.subject_id)}
          onToggleDone={onToggleDone}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
