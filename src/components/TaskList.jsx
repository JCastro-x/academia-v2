import TaskCard from './TaskCard.jsx'

export default function TaskList({ tasks, subjects, highlightTaskId, onToggleDone, onEdit, onDelete }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-[var(--dm-text-muted)]">
        <p>No hay tareas</p>
      </div>
    )
  }

  const getSubject = (subjectId) => subjects?.find(s => s.id === subjectId)

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <div
          key={task.id}
          id={`task-${task.id}`}
          className={highlightTaskId === task.id ? 'rounded-xl ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--dm-bg)] transition' : ''}
        >
          <TaskCard
            task={task}
            subject={getSubject(task.subject_id)}
            onToggleDone={onToggleDone}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  )
}
