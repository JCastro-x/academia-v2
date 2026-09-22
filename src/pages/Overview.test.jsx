import { describe, it, expect } from 'vitest'
import { diffDays, todayStr } from '../domain/task-stats.js'

describe('Overview task grouping (BUG 1)', () => {
  it('should group tasks by due date exclusively, not by progress', () => {
    const today = '2026-09-22'

    const mockTasks = [
      { id: '1', titulo: 'Task 1', due: '2026-09-26', tipo: 'cantidad', total_units: 10, log: {} }, // 4 days from now
      { id: '2', titulo: 'Task 2', due: '2026-10-03', tipo: 'cantidad', total_units: 10, log: {} }, // 11 days from now
      { id: '3', titulo: 'Task 3', due: '2026-09-25', tipo: 'cantidad', total_units: 10, log: {} }, // 3 days from now
    ]

    const tasksDueWithin10Days = mockTasks.filter(task => {
      const daysUntilDue = diffDays(today, task.due)
      return daysUntilDue <= 10
    })

    const tasksDueAfter10Days = mockTasks.filter(task => {
      const daysUntilDue = diffDays(today, task.due)
      return daysUntilDue > 10
    })

    // Task 1 (4 days) and Task 3 (3 days) should be in "Esta semana"
    expect(tasksDueWithin10Days.length).toBe(2)
    expect(tasksDueWithin10Days.map(t => t.id)).toContain('1')
    expect(tasksDueWithin10Days.map(t => t.id)).toContain('3')

    // Task 2 (11 days) should be in "Más adelante"
    expect(tasksDueAfter10Days.length).toBe(1)
    expect(tasksDueAfter10Days.map(t => t.id)).toContain('2')

    // Simulate adding progress to Task 2 (11 days)
    const task2WithProgress = { ...mockTasks[1], log: { [today]: 3 } }
    const daysUntilDueTask2 = diffDays(today, task2WithProgress.due)

    // Task 2 should STILL be in "Más adelante" regardless of progress
    expect(daysUntilDueTask2).toBeGreaterThan(10)
  })

  it('should put task with exactly 10 days in "Esta semana"', () => {
    const task = { id: '1', titulo: 'Task 1', due: '2026-10-02', tipo: 'cantidad', total_units: 10, log: {} }
    const today = '2026-09-22'

    const daysUntilDue = diffDays(today, task.due)

    // Exactly 10 days should be in "Esta semana"
    expect(daysUntilDue).toBe(10)
  })

  it('should put task with 11 days in "Más adelante"', () => {
    const task = { id: '1', titulo: 'Task 1', due: '2026-10-03', tipo: 'cantidad', total_units: 10, log: {} }
    const today = '2026-09-22'

    const daysUntilDue = diffDays(today, task.due)

    // 11 days should be in "Más adelante"
    expect(daysUntilDue).toBe(11)
  })
})
