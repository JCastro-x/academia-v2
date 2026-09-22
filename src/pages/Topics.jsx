import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { useSubjects } from '../features/subjects/hooks.js'
import { useTopicsBySubject, useToggleTopicReviewed, useToggleSubtemaReviewed } from '../features/topics/hooks.js'
import { useEvaluationPeriodsBySubject } from '../features/evaluation-periods/hooks.js'
import { useUIStore } from '../stores/ui.store.js'
import { playSound } from '../lib/sound.js'
import { 
  calculateStudyDays, 
  distributeTopics, 
  calculatePeriodProgress, 
  getTodaysTopics,
  shouldShowWeeklyReminder 
} from '../lib/spacedReview.js'

// Format date from ISO to DD/MM/YYYY
function formatDate(dateString) {
  if (!dateString) return null
  try {
    const date = new Date(dateString + 'T00:00:00')
    if (isNaN(date.getTime())) return dateString
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}/${month}/${year}`
  } catch {
    return dateString
  }
}

export default function Topics() {
  const { semesterId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: subjects } = useSubjects(semesterId)
  const { openModal } = useUIStore()
  const [reviewMode, setReviewMode] = useState(false)
  const [expandedTopicId, setExpandedTopicId] = useState(null)
  
  const selectedSubjectId = searchParams.get('subject')
  const { data: topics } = useTopicsBySubject(selectedSubjectId)
  const { data: periods } = useEvaluationPeriodsBySubject(selectedSubjectId)
  
  const toggleTopicReviewed = useToggleTopicReviewed()
  const toggleSubtemaReviewed = useToggleSubtemaReviewed()

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value
    if (subjectId) {
      setSearchParams({ subject: subjectId })
    } else {
      setSearchParams({})
    }
  }

  const handleNewTopic = () => {
    openModal('topic')
  }

  const handleEditTopic = (topic) => {
    openModal('topic', { editingTopic: topic })
  }

  const handleViewTopics = (subjectId) => {
    setSearchParams({ subject: subjectId })
  }

  const toggleReviewMode = () => {
    setReviewMode(!reviewMode)
    setExpandedTopicId(null)
  }

  const toggleTopicExpansion = (topicId) => {
    setExpandedTopicId(expandedTopicId === topicId ? null : topicId)
  }

  const handleToggleTopicReviewed = (topic) => {
    toggleTopicReviewed.mutate({
      id: topic.id,
      repasado: !topic.repasado
    })
  }

  const handleToggleSubtemaReviewed = (topic, subtema) => {
    const isReviewed = topic.subtemas_repasados?.some(s => s.subtema === subtema && s.reviewed)
    toggleSubtemaReviewed.mutate({
      id: topic.id,
      subtema,
      reviewed: !isReviewed
    })
  }

  const getPeriodsWithStudyPlan = () => {
    if (!periods || !topics) return []
    
    return periods.map(period => {
      // Only include topics with evaluation_period_id (exclude general topics)
      const periodTopics = topics.filter(t => t.evaluation_period_id === period.id)
      const studyDays = calculateStudyDays(period.fecha)
      const distribution = distributeTopics(periodTopics, studyDays)
      const progress = calculatePeriodProgress(periodTopics)
      const showReminder = shouldShowWeeklyReminder(period.fecha)
      const todaysTopics = getTodaysTopics(periodTopics, period.fecha)
      
      return {
        ...period,
        topics: periodTopics,
        studyDays,
        distribution,
        progress,
        showReminder,
        todaysTopics
      }
    })
  }

  // Group topics by evaluation period
  const topicsByPeriod = periods ? periods.reduce((acc, period) => {
    acc[period.id] = {
      period,
      topics: topics?.filter(t => t.evaluation_period_id === period.id) || []
    }
    return acc
  }, {}) : {}

  // Get topics without period (General)
  const generalTopics = topics?.filter(t => !t.evaluation_period_id) || []

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId)
  const periodsWithStudyPlan = getPeriodsWithStudyPlan()
  
  const sortedPeriods = [...periodsWithStudyPlan].sort((a, b) => {
    // Sort by date (earliest first), periods without date go last
    if (!a.fecha && !b.fecha) return 0
    if (!a.fecha) return 1
    if (!b.fecha) return -1
    
    // Parse dates and compare
    const dateA = new Date(a.fecha + 'T00:00:00')
    const dateB = new Date(b.fecha + 'T00:00:00')
    
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0
    if (isNaN(dateA.getTime())) return 1
    if (isNaN(dateB.getTime())) return -1
    
    return dateA - dateB
  })

  if (!subjects || subjects.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-[var(--dm-text-muted)]">
        <p>No hay materias. Crea tu primera materia para poder gestionar temas.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--dm-text)]">Temas</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          {selectedSubjectId && topics && topics.length > 0 && (
            <button
              onClick={toggleReviewMode}
              className="flex-1 sm:flex-none bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              {reviewMode ? 'Vista normal' : 'Repaso'}
            </button>
          )}
          <button
            onClick={handleNewTopic}
            disabled={!selectedSubjectId}
            className="flex-1 sm:flex-none bg-[var(--color-primary)] text-[var(--color-primary-fg)] px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: '#000000' }}
          >
            + Nuevo tema
          </button>
        </div>
      </div>

      <div className="field">
        <select
          value={selectedSubjectId || ''}
          onChange={handleSubjectChange}
          className="field-input form-field"
        >
          <option value="">Selecciona una materia</option>
          {subjects.map(subject => (
            <option key={subject.id} value={subject.id}>{subject.nombre}</option>
          ))}
        </select>
      </div>

      {!selectedSubjectId ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map(subject => (
            <div
              key={subject.id}
              onClick={() => handleViewTopics(subject.id)}
              className="p-4 bg-white dark:bg-[var(--dm-surface)] rounded-xl border border-gray-200 dark:border-[var(--dm-border)] hover:border-[var(--color-primary)] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{subject.icono}</span>
                <h3 className="font-semibold text-gray-900 dark:text-[var(--dm-text)]">{subject.nombre}</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-[var(--dm-text-muted)]">
                Click para ver temas
              </p>
            </div>
          ))}
        </div>
      ) : selectedSubject && (!periods || periods.length === 0) ? (
        <div className="text-center py-12">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-yellow-800 dark:text-yellow-200 mb-4">
              Esta materia no tiene periodos de evaluación configurados.
            </p>
            <button
              onClick={() => openModal('subject', { editingSubject: selectedSubject })}
              className="bg-[var(--color-primary)] text-[var(--color-primary-fg)] px-4 py-2 rounded-lg hover:opacity-90"
              style={{ color: '#000000' }}
            >
              Configurar periodos
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Weekly reminder for periods within 7 days */}
          {sortedPeriods.some(p => p.showReminder && p.todaysTopics.length > 0) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Esta semana podrías repasar:</h3>
              <ul className="space-y-1">
                {sortedPeriods
                  .filter(p => p.showReminder && p.todaysTopics.length > 0)
                  .map(period => (
                    <li key={period.id} className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>{period.nombre}:</strong> {period.todaysTopics.map(t => t.nombre).join(', ')}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {reviewMode ? (
            <div className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">Modo Repaso</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Plan de estudio espaciado. Los temas pendientes se distribuyen automáticamente entre los días disponibles antes del parcial.
                </p>
              </div>
              
              {sortedPeriods.map(period => {
                if (period.topics.length === 0) return null
                
                const hasStudyPlan = period.studyDays > 0 && Object.keys(period.distribution).length > 0
                
                return (
                  <div key={period.id} className="bg-white dark:bg-[var(--dm-surface)] rounded-xl border border-gray-200 dark:border-[var(--dm-border)] overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-[var(--dm-border)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-[var(--dm-text)]">
                            {period.nombre}
                          </h3>
                          {period.fecha && (
                            <p className="text-sm text-gray-500 dark:text-[var(--dm-text-muted)]">
                              {formatDate(period.fecha)} • {period.studyDays} días de estudio
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-[var(--dm-text)]">
                            {period.progress}%
                          </p>
                          <p className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)]">Completado</p>
                        </div>
                      </div>
                    </div>
                    
                    {!hasStudyPlan ? (
                      <div className="p-6 text-center text-gray-500 dark:text-[var(--dm-text-muted)]">
                        <p>
                          {period.studyDays <= 0 
                            ? 'El parcial ya pasó o es muy pronto' 
                            : 'No hay temas pendientes para repasar'}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200 dark:divide-[var(--dm-border)]">
                        {Object.entries(period.distribution).map(([dayNumber, dayTopics]) => (
                          <div key={dayNumber} className="p-4">
                            <h4 className="font-medium text-gray-900 dark:text-[var(--dm-text)] mb-3">
                              Día {dayNumber} {dayNumber === '1' ? '(Hoy)' : ''}
                            </h4>
                            <div className="space-y-2">
                              {dayTopics.map(topic => (
                                <div key={topic.id} className={`flex items-start gap-3 p-2 rounded-lg ${topic.repasado ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-[var(--dm-bg)]'}`}>
                                  <input
                                    type="checkbox"
                                    checked={topic.repasado}
                                    onChange={() => handleToggleTopicReviewed(topic)}
                                    className="mt-1 h-4 w-4 text-green-600 rounded border-gray-300"
                                  />
                                  <div className="flex-1">
                                    <p className={`font-medium ${topic.repasado ? 'line-through text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-[var(--dm-text)]'}`}>
                                      {topic.nombre}
                                    </p>
                                    {topic.subtema && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <input
                                          type="checkbox"
                                          checked={topic.subtemas_repasados?.some(s => s.subtema === topic.subtema && s.reviewed)}
                                          onChange={() => handleToggleSubtemaReviewed(topic, topic.subtema)}
                                          className="h-3 w-3 text-green-600 rounded border-gray-300"
                                        />
                                        <p className={`text-sm ${topic.subtemas_repasados?.some(s => s.subtema === topic.subtema && s.reviewed) ? 'line-through text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-[var(--dm-text-muted)]'}`}>
                                          {topic.subtema}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-6">
              {/* General section for topics without period */}
              {generalTopics.length > 0 && (
                <div className="bg-white dark:bg-[var(--dm-surface)] rounded-xl border border-gray-200 dark:border-[var(--dm-border)] overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-[var(--dm-border)]">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-[var(--dm-text)]">
                      General
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-[var(--dm-text-muted)]">Temas sin periodo asignado</p>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-[var(--dm-border)]">
                    {generalTopics.map(topic => (
                      <div key={topic.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[var(--dm-bg)] transition-colors flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-[var(--dm-text)]">{topic.nombre}</h4>
                          {topic.subtema && (
                            <p className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)] mt-1">{topic.subtema}</p>
                          )}
                          {topic.descripcion && (
                            <p className="text-sm text-gray-500 dark:text-[var(--dm-text-muted)] mt-2 line-clamp-2">{topic.descripcion}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleEditTopic(topic)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)] dark:hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]"
                          aria-label={`Editar tema ${topic.nombre}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sortedPeriods.map(period => {
                const periodData = topicsByPeriod[period.id]
                const periodTopics = periodData?.topics || []
                const periodWithPlan = sortedPeriods.find(p => p.id === period.id)
                
                return (
                  <div key={period.id} className="bg-white dark:bg-[var(--dm-surface)] rounded-xl border border-gray-200 dark:border-[var(--dm-border)] overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-[var(--dm-border)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-[var(--dm-text)]">
                            {period.nombre}
                          </h3>
                          {period.fecha && (
                            <p className="text-sm text-gray-500 dark:text-[var(--dm-text-muted)]">{formatDate(period.fecha)}</p>
                          )}
                        </div>
                        {periodWithPlan && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-[var(--dm-text)]">
                              {periodWithPlan.progress}%
                            </p>
                            <p className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)]">Completado</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {periodTopics.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 dark:text-[var(--dm-text-muted)]">
                        <p>No hay temas en este periodo</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200 dark:divide-[var(--dm-border)]">
                        {periodTopics.map(topic => (
                          <div key={topic.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[var(--dm-bg)] transition-colors flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-[var(--dm-text)]">{topic.nombre}</h4>
                              {topic.subtema && (
                                <p className="text-sm text-gray-600 dark:text-[var(--dm-text-muted)] mt-1">{topic.subtema}</p>
                              )}
                              {topic.descripcion && (
                                <p className="text-sm text-gray-500 dark:text-[var(--dm-text-muted)] mt-2 line-clamp-2">{topic.descripcion}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleEditTopic(topic)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded dark:text-[var(--dm-text-muted)] dark:hover:text-[var(--dm-text)] dark:hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]"
                              aria-label={`Editar tema ${topic.nombre}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
