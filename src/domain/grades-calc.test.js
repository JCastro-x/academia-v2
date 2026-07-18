import { describe, it, expect } from 'vitest'
import {
  percentageToNetPoints,
  calculateZoneNetPoints,
  calculateSubjectTotalPoints,
  calculateSubjectMaxPoints,
  projectFinalGrade,
  calculateNeededToPass,
  getStatusColor,
  calculateZoneStats,
  calculateSubjectStats,
} from './grades-calc.js'

describe('grades-calc', () => {
  describe('percentageToNetPoints', () => {
    it('should convert percentage to net points correctly', () => {
      expect(percentageToNetPoints(50, 25)).toBe(12.5)
      expect(percentageToNetPoints(100, 25)).toBe(25)
      expect(percentageToNetPoints(0, 25)).toBe(0)
      expect(percentageToNetPoints(55, 25)).toBe(13.75)
    })

    it('should handle null values', () => {
      expect(percentageToNetPoints(null, 25)).toBe(0)
      expect(percentageToNetPoints(50, null)).toBe(0)
      expect(percentageToNetPoints(null, null)).toBe(0)
    })
  })

  describe('calculateZoneNetPoints', () => {
    it('should calculate total net points from items', () => {
      const items = [
        { porcentaje_ingresado: 50 },
        { porcentaje_ingresado: 30 },
        { porcentaje_ingresado: 20 },
      ]
      expect(calculateZoneNetPoints(items, 25)).toBe(25)
    })

    it('should handle empty items array', () => {
      expect(calculateZoneNetPoints([], 25)).toBe(0)
    })

    it('should handle null items', () => {
      expect(calculateZoneNetPoints(null, 25)).toBe(0)
    })

    it('should handle items with null percentages', () => {
      const items = [
        { porcentaje_ingresado: 50 },
        { porcentaje_ingresado: null },
        { porcentaje_ingresado: 30 },
      ]
      expect(calculateZoneNetPoints(items, 25)).toBe(20)
    })
  })

  describe('calculateSubjectTotalPoints', () => {
    it('should sum net points across all zones', () => {
      const zones = [
        { peso_pts: 25, items: [{ porcentaje_ingresado: 80 }] },
        { peso_pts: 25, items: [{ porcentaje_ingresado: 60 }] },
        { peso_pts: 50, items: [{ porcentaje_ingresado: 70 }] },
      ]
      expect(calculateSubjectTotalPoints(zones)).toBe(20 + 15 + 35)
    })

    it('should handle empty zones array', () => {
      expect(calculateSubjectTotalPoints([])).toBe(0)
    })

    it('should handle null zones', () => {
      expect(calculateSubjectTotalPoints(null)).toBe(0)
    })
  })

  describe('calculateSubjectMaxPoints', () => {
    it('should sum zone weights', () => {
      const zones = [
        { peso_pts: 25 },
        { peso_pts: 25 },
        { peso_pts: 50 },
      ]
      expect(calculateSubjectMaxPoints(zones)).toBe(100)
    })

    it('should handle empty zones array', () => {
      expect(calculateSubjectMaxPoints([])).toBe(0)
    })
  })

  describe('projectFinalGrade', () => {
    it('should project final grade as percentage', () => {
      expect(projectFinalGrade(50, 100)).toBe(50)
      expect(projectFinalGrade(75, 100)).toBe(75)
      expect(projectFinalGrade(85.5, 100)).toBe(85.5)
    })

    it('should handle zero max points', () => {
      expect(projectFinalGrade(50, 0)).toBe(0)
    })
  })

  describe('calculateNeededToPass', () => {
    it('should calculate points needed to pass', () => {
      expect(calculateNeededToPass(10, 25, 60)).toBe(5)
      expect(calculateNeededToPass(12.5, 25, 60)).toBe(2.5)
    })

    it('should return 0 if already passed', () => {
      expect(calculateNeededToPass(20, 25, 60)).toBe(0)
      expect(calculateNeededToPass(25, 25, 60)).toBe(0)
    })
  })

  describe('getStatusColor', () => {
    it('should return red when below passing threshold', () => {
      expect(getStatusColor(10, 25, 60)).toBe('red')
      expect(getStatusColor(14.9, 25, 60)).toBe('red')
    })

    it('should return yellow when at passing but not full points', () => {
      expect(getStatusColor(15, 25, 60)).toBe('yellow')
      expect(getStatusColor(20, 25, 60)).toBe('yellow')
    })

    it('should return green when at full points', () => {
      expect(getStatusColor(25, 25, 60)).toBe('green')
    })
  })

  describe('calculateZoneStats', () => {
    it('should calculate comprehensive zone statistics', () => {
      const items = [{ porcentaje_ingresado: 55 }]
      const zone = { peso_pts: 25, ganada_pct: 60 }
      
      const stats = calculateZoneStats(items, zone)
      
      expect(stats.netPoints).toBe(13.75)
      expect(stats.maxPoints).toBe(25)
      expect(stats.percentageObtained).toBe(55)
      expect(stats.neededToPass).toBe(1.25)
      expect(stats.statusColor).toBe('red')
    })

    it('should handle empty items', () => {
      const zone = { peso_pts: 25, ganada_pct: 60 }
      const stats = calculateZoneStats([], zone)
      
      expect(stats.netPoints).toBe(0)
      expect(stats.neededToPass).toBe(15)
      expect(stats.statusColor).toBe('red')
    })
  })

  describe('calculateSubjectStats', () => {
    it('should calculate comprehensive subject statistics', () => {
      const zones = [
        { peso_pts: 25, items: [{ porcentaje_ingresado: 80 }] },
        { peso_pts: 25, items: [{ porcentaje_ingresado: 60 }] },
        { peso_pts: 50, items: [{ porcentaje_ingresado: 70 }] },
      ]
      
      const stats = calculateSubjectStats(zones)
      
      expect(stats.totalPoints).toBe(70)
      expect(stats.maxPoints).toBe(100)
      expect(stats.projectedGrade).toBe(70)
    })

    it('should handle empty zones', () => {
      const stats = calculateSubjectStats([])
      
      expect(stats.totalPoints).toBe(0)
      expect(stats.maxPoints).toBe(0)
      expect(stats.projectedGrade).toBe(0)
    })
  })
})
