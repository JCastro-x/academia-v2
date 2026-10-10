import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyMigration() {
  try {
    // Obtener usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('No authenticated user found')
      process.exit(1)
    }

    console.log(`\n=== VERIFICACIÓN DE MIGRACIÓN ===`)
    console.log(`Usuario: ${user.email}\n`)

    // 1. Conteo de filas
    console.log('1. CONTEO DE FILAS')
    console.log('---')

    const { count: backupCount, error: backupError } = await supabase
      .from('habits_backup_20251009')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: habitsCount, error: habitsError } = await supabase
      .from('habits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: progCount, error: progError } = await supabase
      .from('programaciones_habito')
      .select('*', { count: 'exact', head: true })

    const { count: logsCount, error: logsError } = await supabase
      .from('habit_logs')
      .select('*', { count: 'exact', head: true })

    console.log(`habits_backup_20251009: ${backupCount || 0}`)
    console.log(`habits (nuevos): ${habitsCount || 0}`)
    console.log(`programaciones_habito: ${progCount || 0}`)
    console.log(`habit_logs: ${logsCount || 0}`)

    // 2. Verificar duplicados
    console.log('\n2. VERIFICACIÓN DE DUPLICADOS')
    console.log('---')

    const { data: oldHabits } = await supabase
      .from('habits_backup_20251009')
      .select('id, nombre')
      .eq('user_id', user.id)

    const { data: newHabits } = await supabase
      .from('habits')
      .select('id, nombre')
      .eq('user_id', user.id)

    const oldNames = new Set(oldHabits?.map(h => h.nombre) || [])
    const newNames = new Set(newHabits?.map(h => h.nombre) || [])

    const duplicates = [...oldNames].filter(name => newNames.has(name))
    console.log(`Hábitos con mismo nombre en viejo y nuevo: ${duplicates.length}`)
    if (duplicates.length > 0) {
      console.log('Nombres duplicados:', duplicates)
    }

    // 3. Ejemplos de conversión
    console.log('\n3. EJEMPLOS DE CONVERSIÓN DE HISTORIAL A LOGS')
    console.log('---')

    const { data: sampleOldHabits } = await supabase
      .from('habits_backup_20251009')
      .select('id, nombre, historial')
      .eq('user_id', user.id)
      .limit(3)

    if (sampleOldHabits && sampleOldHabits.length > 0) {
      for (const oldHabit of sampleOldHabits) {
        console.log(`\nHábito viejo: ${oldHabit.nombre}`)
        console.log(`  ID viejo: ${oldHabit.id}`)
        console.log(`  Historial (JSON): ${JSON.stringify(oldHabit.historial)}`)

        // Buscar logs correspondientes
        const { data: logs } = await supabase
          .from('habit_logs')
          .select('fecha, estado')
          .eq('habit_id', oldHabit.id)

        console.log(`  Logs convertidos: ${logs?.length || 0}`)
        if (logs && logs.length > 0) {
          console.log(`  Primeros 3 logs:`, logs.slice(0, 3).map(l => `${l.fecha}: ${l.estado}`))
        }
      }
    } else {
      console.log('No hay hábitos viejos para mostrar')
    }

    console.log('\n=== VERIFICACIÓN COMPLETADA ===\n')

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

verifyMigration()
