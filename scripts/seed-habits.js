// Script de semilla para hábitos - Fase 1
// 8 hábitos iniciales, idempotente por nombre entre hábitos activos

import { createClient } from '@supabase/supabase-js'
import { getTodayDate } from '../src/lib/date-utils.js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const initialHabits = [
  {
    nombre: 'Despertar a las 7',
    momento_dia: 'manana',
    programacion: {
      tipo: 'dias_fijos',
      dias_semana: [1, 2, 3, 4, 5], // L-V
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
  {
    nombre: 'Celular lejos al levantarme y desayuno',
    momento_dia: 'manana',
    programacion: {
      tipo: 'dias_fijos',
      dias_semana: [1, 2, 3, 4, 5], // L-V
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
  {
    nombre: 'Lectura',
    momento_dia: 'manana',
    programacion: {
      tipo: 'dias_fijos',
      dias_semana: [1, 2, 3, 4, 5], // L-V
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
  {
    nombre: 'Bloque de estudio',
    momento_dia: 'tarde',
    programacion: {
      tipo: 'dias_fijos',
      dias_semana: [1, 2, 3, 4, 5], // L-V
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
  {
    nombre: 'Python',
    momento_dia: 'tarde',
    programacion: {
      tipo: 'dias_fijos',
      dias_semana: [1, 2, 3, 4, 5], // L-V
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
  {
    nombre: 'Ejercicio',
    momento_dia: 'tarde',
    version_minima: '10-15 min',
    programacion: {
      tipo: 'dias_fijos',
      dias_semana: [1, 2, 3, 4, 5], // L-V
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
  {
    nombre: 'Journaling corto',
    momento_dia: 'noche',
    programacion: {
      tipo: 'dias_fijos',
      dias_semana: [1, 2, 3, 4, 5, 6, 7], // Diario
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
  {
    nombre: 'Dormir 10:05 con celular fuera de la cama',
    momento_dia: 'noche',
    programacion: {
      tipo: 'dias_fijos',
      dias_semana: [1, 2, 3, 4, 5, 6, 7], // Diario
      permitir_finde_plus: false,
      tolerar_rojo_aislado: false,
    },
  },
]

async function seedHabits() {
  try {
    // Obtener usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('No authenticated user found')
      console.error('Cannot authenticate via script. Please use the in-app button instead.')
      process.exit(1)
    }

    console.log(`Seeding habits for user: ${user.email}`)

    // Obtener hábitos activos existentes (archivado=false)
    const { data: existingActiveHabits, error: existingError } = await supabase
      .from('habits')
      .select('id, nombre')
      .eq('user_id', user.id)
      .eq('archivado', false)

    if (existingError) {
      console.error('Error checking existing habits:', existingError)
      process.exit(1)
    }

    const existingNames = new Set(existingActiveHabits?.map(h => h.nombre) || [])
    console.log(`Existing active habits: ${existingNames.size}`)

    let createdCount = 0
    let skippedCount = 0

    // Crear hábitos que no existen por nombre
    for (const habit of initialHabits) {
      if (existingNames.has(habit.nombre)) {
        console.log(`⊘ Skipping (already exists): ${habit.nombre}`)
        skippedCount++
        continue
      }

      // Crear hábito
      const { data: habitData, error: habitError } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          nombre: habit.nombre,
          momento_dia: habit.momento_dia,
          version_minima: habit.version_minima || null,
        })
        .select('id')
        .single()

      if (habitError) {
        console.error(`Error creating habit "${habit.nombre}":`, habitError)
        continue
      }

      // Crear programación
      const { error: progError } = await supabase
        .from('programaciones_habito')
        .insert({
          habit_id: habitData.id,
          tipo: habit.programacion.tipo,
          dias_semana: habit.programacion.dias_semana,
          permitir_finde_plus: habit.programacion.permitir_finde_plus,
          tolerar_rojo_aislado: habit.programacion.tolerar_rojo_aislado,
          vigente_desde: getTodayDate(),
        })

      if (progError) {
        console.error(`Error creating programacion for "${habit.nombre}":`, progError)
      } else {
        console.log(`✓ Created: ${habit.nombre}`)
        createdCount++
      }
    }

    // Crear config por defecto
    const { error: configError } = await supabase
      .from('app_config')
      .upsert({
        user_id: user.id,
        ventana_edicion_dias: 7,
      })

    if (configError) {
      console.error('Error creating app config:', configError)
    } else {
      console.log('✓ Created app config')
    }

    console.log(`\nSeed completed: ${createdCount} created, ${skippedCount} skipped`)
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }
}

seedHabits()
