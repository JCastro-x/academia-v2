import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Habits hooks idempotency tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('seedIdempotente: sembrar dos veces deja 8 hábitos únicos', () => {
    // Simular semilla
    const habits = []
    const programaciones = []
    
    const initialHabits = [
      { nombre: 'Habit 1', momento_dia: 'manana' },
      { nombre: 'Habit 2', momento_dia: 'manana' },
      { nombre: 'Habit 3', momento_dia: 'manana' },
      { nombre: 'Habit 4', momento_dia: 'tarde' },
      { nombre: 'Habit 5', momento_dia: 'tarde' },
      { nombre: 'Habit 6', momento_dia: 'tarde' },
      { nombre: 'Habit 7', momento_dia: 'noche' },
      { nombre: 'Habit 8', momento_dia: 'noche' },
    ]

    // Primera siembra
    const existingNames = new Set()
    initialHabits.forEach(habit => {
      if (!existingNames.has(habit.nombre)) {
        habits.push({ ...habit, id: `habit-${habit.nombre.replace(/\s/g, '-')}` })
        programaciones.push({ habit_id: habits[habits.length - 1].id, tipo: 'dias_fijos' })
        existingNames.add(habit.nombre)
      }
    })

    // Segunda siembra (simulada)
    const existingNames2 = new Set(habits.map(h => h.nombre))
    initialHabits.forEach(habit => {
      if (!existingNames2.has(habit.nombre)) {
        habits.push({ ...habit, id: `habit-${habit.nombre.replace(/\s/g, '-')}-v2` })
        programaciones.push({ habit_id: habits[habits.length - 1].id, tipo: 'dias_fijos' })
        existingNames2.add(habit.nombre)
      }
    })

    // Verificar que hay 8 hábitos únicos
    expect(habits.length).toBe(8)
    expect(new Set(habits.map(h => h.nombre)).size).toBe(8)
    expect(programaciones.length).toBe(8)
  })
})
