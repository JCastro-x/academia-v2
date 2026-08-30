import { describe, expect, it } from 'vitest'
import {
  buildDailySummaryContent,
  getTaskRemindersForNow,
} from './notifications.js'

describe('daily summary notifications', () => {
  it('should build a morning summary with a task count', () => {
    const tasks = [
      { id: '1', titulo: 'Matemática', due: '2026-08-29', done: false },
      { id: '2', titulo: 'Historia', due: '2026-08-29', done: false },
      { id: '3', titulo: 'Física', due: '2026-08-29', done: true },
    ]

    const result = buildDailySummaryContent(tasks, 'morning', '2026-08-29T07:00:00')

    expect(result.title).toContain('2')
    expect(result.body).toContain('tareas pendientes para hoy')
    expect(result.url).toBe('/tasks')
  })

  it('should build a celebration message when there are no tasks', () => {
    const result = buildDailySummaryContent([], 'evening', '2026-08-29T19:00:00')

    expect(result.title).toContain('Felicidades')
    expect(result.body).toContain('No tienes tareas')
    expect(result.body).toContain('🎉')
  })
})

describe('due reminder windows', () => {
  it('should detect the day-before reminder for a task due tomorrow', () => {
    const tasks = [
      { id: 'a', titulo: 'Entrega de ensayo', due: '2026-08-30', done: false },
      { id: 'b', titulo: 'Examen', due: '2026-08-29', done: false },
      { id: 'c', titulo: 'Tarea ya hecha', due: '2026-08-29', done: true },
    ]

    const reminders = getTaskRemindersForNow(tasks, '2026-08-29T04:00:00')

    expect(reminders).toHaveLength(1)
    expect(reminders[0].taskId).toBe('a')
    expect(reminders[0].type).toBe('day_before')
  })
})
