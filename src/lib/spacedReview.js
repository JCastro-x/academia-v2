// Spaced review logic for topics

export function calculateStudyDays(periodDate) {
  if (!periodDate) return 0
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const examDate = new Date(periodDate)
  examDate.setHours(0, 0, 0, 0)
  
  const diffTime = examDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  // Days until exam minus 1 (last day reserved for general review)
  return Math.max(0, diffDays - 1)
}

export function distributeTopics(topics, studyDays) {
  if (!topics || topics.length === 0 || studyDays <= 0) {
    return {}
  }
  
  // Sort ALL topics by creation date (oldest first) - this ensures consistent day assignment
  const sortedTopics = [...topics].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  )
  
  // Distribute ALL topics across days as evenly as possible
  const distribution = {}
  const topicsPerDay = Math.ceil(sortedTopics.length / studyDays)
  
  sortedTopics.forEach((topic, index) => {
    const dayIndex = Math.floor(index / topicsPerDay)
    const dayNumber = dayIndex + 1 // 1-indexed days
    
    if (!distribution[dayNumber]) {
      distribution[dayNumber] = []
    }
    distribution[dayNumber].push(topic)
  })
  
  return distribution
}

export function calculatePeriodProgress(topics) {
  if (!topics || topics.length === 0) return 0
  
  let totalItems = 0
  let reviewedItems = 0
  
  topics.forEach(topic => {
    // Count the main topic
    totalItems++
    if (topic.repasado) reviewedItems++
    
    // Count subtemas if they exist
    if (topic.subtemas_repasados && Array.isArray(topic.subtemas_repasados)) {
      totalItems += topic.subtemas_repasados.length
      reviewedItems += topic.subtemas_repasados.filter(s => s.reviewed).length
    }
  })
  
  return totalItems > 0 ? Math.round((reviewedItems / totalItems) * 100) : 0
}

export function getTodaysTopics(topics, periodDate) {
  const studyDays = calculateStudyDays(periodDate)
  if (studyDays <= 0) return []
  
  const distribution = distributeTopics(topics, studyDays)
  return distribution[1] || [] // Day 1 is today
}

export function shouldShowWeeklyReminder(periodDate) {
  const studyDays = calculateStudyDays(periodDate)
  return studyDays <= 7 && studyDays > 0
}
