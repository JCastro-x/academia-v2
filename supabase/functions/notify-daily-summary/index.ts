import { createClient } from 'npm:@supabase/supabase-js'
import webPush from 'npm:web-push'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
}

if (!vapidPublicKey || !vapidPrivateKey) {
  throw new Error('Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY environment variables.')
}

webPush.setVapidDetails(
  'mailto:admin@academia.local',
  vapidPublicKey,
  vapidPrivateKey,
)

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

const DEFAULT_TIMEZONE = 'America/Guatemala'
const SUMMARY_WINDOW_MINUTES = 15 // cron corre cada 15 min; ventana de disparo del resumen

interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

// Partes de "hora de pared" de un instante, en un timezone IANA dado.
// Usa Intl.DateTimeFormat (built-in, ICU completo en Deno) en lugar de
// date-fns-tz/Temporal para no agregar dependencias al bundle de la Edge Function.
function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  const parts: Record<string, number> = {}
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') {
      parts[part.type] = Number(part.value)
    }
  }

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  }
}

// Offset (ms) del timezone en el instante dado: hora de pared local - UTC.
function getZonedOffsetMs(date: Date, timeZone: string) {
  const p = getZonedParts(date, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - date.getTime()
}

// Convierte una fecha 'YYYY-MM-DD' + hora 'HH:MM:SS' de pared en un instante
// UTC real. Doble pasada del offset: correcta incluso con DST (Guatemala no
// tiene, pero el helper es genérico para cualquier profiles.timezone).
function wallTimeToInstant(dateKey: string, timeKey: string, timeZone: string): Date {
  const [y, mo, d] = dateKey.split('-').map(Number)
  const [h, mi, s] = timeKey.split(':').map(Number)
  const naive = Date.UTC(y, mo - 1, d, h || 0, mi || 0, s || 0)
  const offset1 = getZonedOffsetMs(new Date(naive), timeZone)
  const offset2 = getZonedOffsetMs(new Date(naive - offset1), timeZone)
  return new Date(naive - offset2)
}

// Clave de día local 'YYYY-MM-DD' de un instante en el timezone dado.
function zonedDayKey(date: Date, timeZone: string) {
  const p = getZonedParts(date, timeZone)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

// Diferencia de días calendario entre dos claves 'YYYY-MM-DD'.
function dayKeyDiff(a: string, b: string) {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / (1000 * 60 * 60 * 24))
}

// true si la hora local del usuario está en la ventana [hour:00, hour:15).
function isInLocalWindow(date: Date, timeZone: string, hour: number) {
  const p = getZonedParts(date, timeZone)
  return p.hour === hour && p.minute < SUMMARY_WINDOW_MINUTES
}

function getProfileTimezone(timezone: string | null | undefined) {
  return timezone && timezone.trim() ? timezone : DEFAULT_TIMEZONE
}

// Elige una variante de texto de forma determinista según el id, para dar
// variedad sin repetir siempre el mismo mensaje.
function pickVariant(seed: string, variants: string[]) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return variants[hash % variants.length]
}

// Recorta el título de la tarea para que el body no se corte en Android (~60 chars).
function clip(text: string, max = 45) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`
}

function buildReminderNotification(
  task: { id: string; titulo: string },
  type: 'day_before' | 'three_hours_before' | 'custom_reminder',
) {
  const t = clip(task.titulo)

  if (type === 'day_before') {
    return {
      taskId: task.id,
      type,
      title: 'Vence mañana 🗓️',
      body: pickVariant(task.id, [
        `Mañana vence: ${t}`,
        `Te queda 1 día: ${t}`,
        `Se acerca el plazo: ${t}`,
      ]),
      url: '/tasks',
    }
  }

  if (type === 'custom_reminder') {
    return {
      taskId: task.id,
      type,
      title: 'Recordatorio 👋',
      body: pickVariant(task.id, [
        `No te olvides: ${t}`,
        `Tienes pendiente: ${t}`,
        `Hey, esta tarea te espera: ${t}`,
      ]),
      url: '/tasks',
    }
  }

  return {
    taskId: task.id,
    type,
    title: '⏰ Vence en 3 horas',
    body: pickVariant(task.id, [
      `Últimas 3h para: ${t}`,
      `¡Corrí! Vence hoy: ${t}`,
      `Por vencer: ${t}`,
    ]),
    url: '/tasks',
  }
}

function buildMorningSummary(tasks: Array<{ id: string; titulo: string; due: string | null }>) {
  const count = tasks.length

  if (count === 0) {
    return null
  }

  const plural = count === 1 ? 'tarea' : 'tareas'
  return {
    title: `Tienes ${count} ${plural} para hoy`,
    body: `Vencen hoy: ${count} ${plural} ✅`,
    url: '/tasks',
    count,
  }
}

function buildEveningSummary(tasks: Array<{ id: string; titulo: string; due: string | null }>) {
  const count = tasks.length

  if (count === 0) {
    return {
      title: 'Felicidades, día libre 🎉',
      body: 'No tienes tareas pendientes para hoy 🎉',
      url: '/tasks',
      count: 0,
    }
  }

  const plural = count === 1 ? 'tarea' : 'tareas'
  return {
    title: `Quedan ${count} ${plural} de hoy`,
    body: `Día de cierre: ${count} ${plural} sin terminar 📝`,
    url: '/tasks',
    count,
  }
}

async function sendToUserSubscriptions(
  userId: string,
  payload: { title: string; body: string; url: string; taskId?: string; tag?: string },
) {
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) {
    console.error(`[notify] failed to fetch subscriptions for ${userId}`, error)
    return 0
  }

  const rows = subscriptions ?? []
  if (rows.length === 0) return 0

  let sentCount = 0

  for (const subscription of rows) {
    try {
      const endpoint = subscription.endpoint
      const p256dh = subscription.p256dh
      const auth = subscription.auth

      const pushSubscription = {
        endpoint,
        keys: {
          p256dh,
          auth,
        },
      }

      await webPush.sendNotification(pushSubscription as any, JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.taskId ? `/tasks?task=${payload.taskId}` : payload.url,
        task_id: payload.taskId ?? undefined,
        tag: payload.taskId
          ? `academia-task-${payload.taskId}`
          : (payload.tag || 'academia-task-reminder'),
      }))

      sentCount += 1
    } catch (error: any) {
      const statusCode = error?.statusCode
      // 404/410: la suscripción expiró o fue revocada en el navegador → borrarla
      // (si solo se desactivara, la fila seguiría acumulándose en la tabla).
      if (statusCode === 404 || statusCode === 410) {
        const { error: deleteError } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('endpoint', subscription.endpoint)
        if (deleteError) {
          console.error(`[notify] failed to delete dead subscription for ${userId}`, deleteError)
        } else {
          console.warn(`[notify] deleted dead subscription (HTTP ${statusCode}) for ${userId}`)
        }
      } else {
        console.warn(`[notify] failed to send to subscription for ${userId}`, error)
      }
    }
  }

  return sentCount
}

async function markReminderSent(taskId: string, now: Date) {
  const { error } = await supabase
    .from('tasks')
    .update({ last_push_notified_at: now.toISOString() })
    .eq('id', taskId)

  if (error) {
    console.error(`[notify] failed to mark task reminder sent: ${taskId}`, error)
  }
}

async function markMorningSummarySent(userId: string, now: Date) {
  const { error } = await supabase
    .from('profiles')
    .update({ last_morning_summary_at: now.toISOString() })
    .eq('user_id', userId)

  if (error) {
    console.error(`[notify] failed to mark morning summary sent for ${userId}`, error)
  }
}

async function markEveningSummarySent(userId: string, now: Date) {
  const { error } = await supabase
    .from('profiles')
    .update({ last_evening_summary_at: now.toISOString() })
    .eq('user_id', userId)

  if (error) {
    console.error(`[notify] failed to mark evening summary sent for ${userId}`, error)
  }
}

const REMINDER_DEDUP_WINDOW_MS = 1000 * 60 * 60 * 24 // 24h between pushes for the same task

function isReminderDue(
  task: { due: string | null; due_time: string | null; reminder_at: string | null; last_push_notified_at: string | null },
  now: Date,
  timeZone: string,
) {
  // Dedup: skip if we already pushed for this task in the last 24h
  const lastSentAt = task.last_push_notified_at ? new Date(task.last_push_notified_at).getTime() : null
  if (lastSentAt && now.getTime() - lastSentAt < REMINDER_DEDUP_WINDOW_MS) {
    return false
  }

  // Fixed windows based on the due date (-1 day / -3 hours).
  // due es date (sin hora); se combina con due_time (o 23:59:59 si es null)
  // y se interpreta en el timezone del usuario, no en UTC.
  if (task.due) {
    const dueDate = wallTimeToInstant(task.due, task.due_time ?? '23:59:59', timeZone)
    const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    const calendarDayDiff = dayKeyDiff(zonedDayKey(dueDate, timeZone), zonedDayKey(now, timeZone))

    const isThreeHoursBefore = diffHours > 0 && diffHours <= 3
    const isOneDayBefore = calendarDayDiff === 1 && diffHours > 3 && diffHours <= 48

    if (isThreeHoursBefore || isOneDayBefore) return true
  }

  // User-configured reminder (reminder_at): fire when it is due within the
  // cron tick (next 15 min) or just passed (up to 60 min late, cron tolerance).
  if (task.reminder_at) {
    const reminderAt = new Date(task.reminder_at)
    if (!Number.isNaN(reminderAt.getTime())) {
      const diffMinutes = (reminderAt.getTime() - now.getTime()) / (1000 * 60)
      if (diffMinutes <= 15 && diffMinutes >= -60) return true
    }
  }

  return false
}

function resolveReminderType(
  task: { due: string | null; due_time: string | null; reminder_at: string | null },
  now: Date,
  timeZone: string,
): 'day_before' | 'three_hours_before' | 'custom_reminder' | null {
  // Custom reminder takes priority if it is due now
  if (task.reminder_at) {
    const reminderAt = new Date(task.reminder_at)
    if (!Number.isNaN(reminderAt.getTime())) {
      const diffMinutes = (reminderAt.getTime() - now.getTime()) / (1000 * 60)
      if (diffMinutes <= 15 && diffMinutes >= -60) return 'custom_reminder'
    }
  }

  if (task.due) {
    const dueDate = wallTimeToInstant(task.due, task.due_time ?? '23:59:59', timeZone)
    const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    const calendarDayDiff = dayKeyDiff(zonedDayKey(dueDate, timeZone), zonedDayKey(now, timeZone))

    if (calendarDayDiff === 1 && diffHours > 3 && diffHours <= 48) return 'day_before'
    if (diffHours > 0 && diffHours <= 3) return 'three_hours_before'
  }

  return null
}

async function runReminderNotifications(now: Date) {
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, timezone')

  if (profilesError) {
    throw profilesError
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, user_id, titulo, due, due_time, reminder_at, done, last_push_notified_at')
    .eq('done', false)

  if (error) {
    throw error
  }

  const timezoneByUser = new Map<string, string>(
    (profiles ?? []).map((p: { user_id: string; timezone: string | null }) => [p.user_id, getProfileTimezone(p.timezone)]),
  )

  const tasksByUser = new Map<string, Array<any>>()
  for (const task of tasks ?? []) {
    if (!task.user_id) continue
    const bucket = tasksByUser.get(task.user_id) ?? []
    bucket.push(task)
    tasksByUser.set(task.user_id, bucket)
  }

  const sentNotifications: Array<{ userId: string; title: string; body: string; url: string; taskId?: string }> = []

  for (const [userId, userTasks] of tasksByUser.entries()) {
    const timeZone = timezoneByUser.get(userId) ?? DEFAULT_TIMEZONE

    for (const task of userTasks) {
      if (!isReminderDue(task, now, timeZone)) continue

      const reminderType = resolveReminderType(task, now, timeZone)
      if (!reminderType) continue

      const notification = buildReminderNotification(task, reminderType)
      const sentCount = await sendToUserSubscriptions(userId, {
        title: notification.title,
        body: notification.body,
        url: notification.url,
        taskId: notification.taskId,
      })

      if (sentCount > 0) {
        sentNotifications.push({ userId, ...notification })
        await markReminderSent(task.id, now)
      }
    }
  }

  return sentNotifications
}

async function runMorningSummary(now: Date) {
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, timezone, last_morning_summary_at')

  if (profilesError) {
    throw profilesError
  }

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, user_id, titulo, due, done')
    .eq('done', false)

  if (tasksError) {
    throw tasksError
  }

  const users = profiles ?? []
  const tasksByUser = new Map<string, Array<{ id: string; titulo: string; due: string | null }>>()

  for (const task of tasks ?? []) {
    if (!task.user_id) continue
    // Sin prefiltrado de fecha: cada usuario tiene su propio día local,
    // se filtra más abajo contra zonedDayKey(now, tz) del usuario.
    const bucket = tasksByUser.get(task.user_id) ?? []
    bucket.push(task)
    tasksByUser.set(task.user_id, bucket)
  }

  const sentSummaryNotifications: Array<{ userId: string; title: string; body: string; url: string }> = []

  for (const profile of users) {
    const timeZone = getProfileTimezone(profile.timezone)

    // Disparar solo dentro de la ventana local 7:00–7:15am del usuario.
    if (!isInLocalWindow(now, timeZone, 7)) {
      continue
    }

    const lastSent = profile.last_morning_summary_at ? new Date(profile.last_morning_summary_at).getTime() : null
    const todayKey = zonedDayKey(now, timeZone)

    // Dedup por día LOCAL del usuario (antes era día UTC del servidor).
    if (lastSent && zonedDayKey(new Date(lastSent), timeZone) === todayKey) {
      continue
    }

    const pendingToday = (tasksByUser.get(profile.user_id) ?? []).filter((t) => t.due === todayKey)
    const summary = buildMorningSummary(pendingToday)
    if (!summary) continue

    const sentCount = await sendToUserSubscriptions(profile.user_id, {
      title: summary.title,
      body: summary.body,
      url: summary.url,
      tag: 'academia-summary-morning',
    })

    if (sentCount > 0) {
      sentSummaryNotifications.push({ userId: profile.user_id, title: summary.title, body: summary.body, url: summary.url })
      await markMorningSummarySent(profile.user_id, now)
    }
  }

  return sentSummaryNotifications
}

async function runEveningSummary(now: Date) {
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, timezone, last_evening_summary_at')

  if (profilesError) {
    throw profilesError
  }

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, user_id, titulo, due, done')
    .eq('done', false)

  if (tasksError) {
    throw tasksError
  }

  const users = profiles ?? []
  const tasksByUser = new Map<string, Array<{ id: string; titulo: string; due: string | null }>>()

  for (const task of tasks ?? []) {
    if (!task.user_id) continue
    // Sin prefiltrado de fecha: cada usuario tiene su propio día local,
    // se filtra más abajo contra zonedDayKey(now, tz) del usuario.
    const bucket = tasksByUser.get(task.user_id) ?? []
    bucket.push(task)
    tasksByUser.set(task.user_id, bucket)
  }

  const sentSummaryNotifications: Array<{ userId: string; title: string; body: string; url: string }> = []

  for (const profile of users) {
    const timeZone = getProfileTimezone(profile.timezone)

    // Disparar solo dentro de la ventana local 7:00–7:15pm del usuario.
    if (!isInLocalWindow(now, timeZone, 19)) {
      continue
    }

    const lastSent = profile.last_evening_summary_at ? new Date(profile.last_evening_summary_at).getTime() : null
    const todayKey = zonedDayKey(now, timeZone)

    // Dedup por día LOCAL del usuario (antes era día UTC del servidor).
    if (lastSent && zonedDayKey(new Date(lastSent), timeZone) === todayKey) {
      continue
    }

    const pendingToday = (tasksByUser.get(profile.user_id) ?? []).filter((t) => t.due === todayKey)
    const summary = buildEveningSummary(pendingToday)
    const sentCount = await sendToUserSubscriptions(profile.user_id, {
      title: summary.title,
      body: summary.body,
      url: summary.url,
      tag: 'academia-summary-evening',
    })

    if (sentCount > 0) {
      sentSummaryNotifications.push({ userId: profile.user_id, title: summary.title, body: summary.body, url: summary.url })
      await markEveningSummarySent(profile.user_id, now)
    }
  }

  return sentSummaryNotifications
}

Deno.serve(async (request: Request) => {
  try {
    const body = await request.json().catch(() => ({})) as { type?: 'reminders' | 'morning_summary' | 'evening_summary' | 'all' }
    const now = new Date()
    const type = body.type ?? 'all'

    const results: Record<string, unknown> = {
      now: now.toISOString(),
      type,
      sent: 0,
    }

    if (type === 'reminders' || type === 'all') {
      const reminderResult = await runReminderNotifications(now)
      results.reminders = reminderResult.length
      results.sent += reminderResult.length
    }

    if (type === 'morning_summary' || type === 'all') {
      const morningResult = await runMorningSummary(now)
      results.morningSummary = morningResult.length
      results.sent += morningResult.length
    }

    if (type === 'evening_summary' || type === 'all') {
      const eveningResult = await runEveningSummary(now)
      results.eveningSummary = eveningResult.length
      results.sent += eveningResult.length
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[notify] Edge Function failed', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
