/**
 * Pure functions for grade calculations.
 * No React, no Supabase, just math.
 * Testable with Vitest without mounting anything.
 */

/**
 * Convert percentage to net points based on zone weight.
 * @param {number} percentage - The percentage obtained (e.g., 50 for 50%)
 * @param {number} zoneWeight - The weight of the zone in points (e.g., 25)
 * @returns {number} Net points obtained (e.g., 12.50)
 */
export function percentageToNetPoints(percentage, zoneWeight) {
  if (percentage == null || zoneWeight == null) return 0
  const result = (percentage / 100) * zoneWeight
  return Math.round(result * 100) / 100
}

/**
 * Calculate total net points obtained across all items in a zone.
 * @param {Array} items - Array of grade items with porcentaje_ingresado
 * @param {number} zoneWeight - The weight of the zone in points
 * @returns {number} Total net points obtained
 */
export function calculateZoneNetPoints(items, zoneWeight) {
  if (!items || items.length === 0) return 0
  
  const totalPercentage = items.reduce((sum, item) => {
    return sum + (item.porcentaje_ingresado || 0)
  }, 0)
  
  return percentageToNetPoints(totalPercentage, zoneWeight)
}

/**
 * Calculate total net points obtained across all zones of a subject.
 * @param {Array} zones - Array of zones with items and peso_pts
 * @returns {number} Total net points obtained
 */
export function calculateSubjectTotalPoints(zones) {
  if (!zones || zones.length === 0) return 0
  
  return zones.reduce((sum, zone) => {
    const zonePoints = calculateZoneNetPoints(zone.items || [], zone.peso_pts)
    return sum + zonePoints
  }, 0)
}

/**
 * Calculate the maximum possible points for a subject (sum of all zone weights).
 * @param {Array} zones - Array of zones with peso_pts
 * @returns {number} Maximum possible points
 */
export function calculateSubjectMaxPoints(zones) {
  if (!zones || zones.length === 0) return 0
  
  return zones.reduce((sum, zone) => sum + (zone.peso_pts || 0), 0)
}

/**
 * Project the final estimated grade based on current progress.
 * @param {number} obtainedPoints - Points obtained so far
 * @param {number} maxPoints - Maximum possible points
 * @returns {number} Estimated final grade (0-100)
 */
export function projectFinalGrade(obtainedPoints, maxPoints) {
  if (maxPoints === 0) return 0
  return (obtainedPoints / maxPoints) * 100
}

/**
 * Calculate how much more is needed to reach the passing threshold.
 * @param {number} obtainedPoints - Points obtained so far
 * @param {number} zoneWeight - Weight of the zone in points
 * @param {number} ganadaPct - Passing threshold percentage (e.g., 60)
 * @returns {number} Points needed to pass
 */
export function calculateNeededToPass(obtainedPoints, zoneWeight, ganadaPct) {
  const passingPoints = (zoneWeight * ganadaPct) / 100
  const neededPoints = passingPoints - obtainedPoints
  
  if (neededPoints <= 0) return 0
  
  return Math.round(neededPoints * 100) / 100
}

/**
 * Determine the status color based on performance.
 * @param {number} obtainedPoints - Points obtained
 * @param {number} zoneWeight - Weight of the zone in points
 * @param {number} ganadaPct - Passing threshold percentage
 * @returns {string} Color: 'red', 'yellow', or 'green'
 */
export function getStatusColor(obtainedPoints, zoneWeight, ganadaPct) {
  const passingPoints = percentageToNetPoints(ganadaPct, zoneWeight)
  
  if (obtainedPoints < passingPoints) {
    return 'red'
  } else if (obtainedPoints < zoneWeight) {
    return 'yellow'
  } else {
    return 'green'
  }
}

/**
 * Calculate comprehensive zone statistics.
 * @param {Array} items - Array of grade items
 * @param {Object} zone - Zone object with peso_pts and ganada_pct
 * @returns {Object} Statistics including netPoints, neededToPass, statusColor, etc.
 */
export function calculateZoneStats(items, zone) {
  const netPoints = calculateZoneNetPoints(items, zone.peso_pts)
  const neededToPass = calculateNeededToPass(netPoints, zone.peso_pts, zone.ganada_pct || 60)
  const statusColor = getStatusColor(netPoints, zone.peso_pts, zone.ganada_pct || 60)
  const maxPoints = zone.peso_pts
  const percentageObtained = maxPoints > 0 ? Math.round((netPoints / maxPoints) * 100 * 100) / 100 : 0
  
  return {
    netPoints,
    neededToPass,
    statusColor,
    maxPoints,
    percentageObtained,
  }
}

/**
 * Calculate comprehensive subject statistics.
 * @param {Array} zones - Array of zones with their items
 * @returns {Object} Statistics including totalPoints, maxPoints, projectedGrade, etc.
 */
export function calculateSubjectStats(zones) {
  const totalPoints = calculateSubjectTotalPoints(zones)
  const maxPoints = calculateSubjectMaxPoints(zones)
  const projectedGrade = projectFinalGrade(totalPoints, maxPoints)
  
  return {
    totalPoints,
    maxPoints,
    projectedGrade,
  }
}
