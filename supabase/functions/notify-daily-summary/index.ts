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

function asLocalDate(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function getCalendarDayDiff(dateA: Date, dateB: Date) {
  const a = startOfDay(dateA)
  const b = startOfDay(dateB)
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
}

function buildReminderNotification(task: { id: string; titulo: string }, type: 'day_before' | 'three_hours_before') {
  if (type === 'day_before') {
    return {
      taskId: task.id,
      type,
      title: `Mañana vence: ${task.titulo}`,
      body: 'Falta 1 día para que venza esta tarea. Organizate para completarla.',
      url: '/tasks',
    }
  }

  return {
    taskId: task.id,
    type,
    title: `Recordatorio: ${task.titulo}`,
    body: 'Vence en menos de 3 horas. Revisá la tarea antes de que se te pase.',
    url: '/tasks',
  }
}

function buildMorningSummary(tasks: Array<{ id: string; titulo: string; due: string | null }>) {
  const count = tasks.length

  if (count === 0) {
    return null
  }

  return {
    title: `Tienes ${count} tarea${count === 1 ? '' : 's'} pendiente${count === 1 ? '' : 's'} para hoy`,
    body: `Tenés ${count} tarea${count === 1 ? '' : 's'} que vencen hoy. Revisá tus pendientes.`,
    url: '/tasks',
    count,
  }
}

function buildEveningSummary(tasks: Array<{ id: string; titulo: string; due: string | null }>) {
  const count = tasks.length

  if (count === 0) {
    return {
      title: 'Felicidades, no tenés tareas para esta noche 🎉',
      body: 'No tenés tareas pendientes para hoy. ¡Felicidades! 🎉',
      url: '/tasks',
      count: 0,
    }
  }

  return {
    title: `Quedan ${count} tarea${count === 1 ? '' : 's'} por hoy`,
    body: `Todavía tenés ${count} tarea${count === 1 ? '' : 's'} pendiente${count === 1 ? '' : 's'} para hoy. Volvé a revisarlas.`,
    url: '/tasks',
    count,
  }
}

async function sendToUserSubscriptions(userId: string, payload: { title: string; body: string; url: string }) {
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
        url: payload.url,
        tag: payload.url || 'academia-task-reminder',
      }))

      sentCount += 1
    } catch (error) {
      console.warn(`[notify] failed to send to subscription for ${userId}`, error)
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

function isReminderDue(task: { due: string | null; last_push_notified_at: string | null }, now: Date) {
  if (!task.due) return false
  const lastSentAt = task.last_push_notified_at ? new Date(task.last_push_notified_at).getTime() : null
  if (lastSentAt && now.getTime() - lastSentAt < 1000 * 60 * 60 * 24) {
    return false
  }

  const dueDate = new Date(`${task.due}T23:59:59`)
  const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)

  const startOfToday = startOfDay(now)
  const startOfDueDate = startOfDay(dueDate)
  const calendarDayDiff = Math.round((startOfDueDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))

  const isThreeHoursBefore = diffHours > 0 && diffHours <= 3
  const isOneDayBefore = calendarDayDiff === 1 && diffHours > 3 && diffHours <= 48

  return isThreeHoursBefore || isOneDayBefore
}

async function runReminderNotifications(now: Date) {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, user_id, titulo, due, done, last_push_notified_at')
    .eq('done', false)

  if (error) {
    throw error
  }

  const tasksByUser = new Map<string, Array<any>>()
  for (const task of tasks ?? []) {
    if (!task.user_id) continue
    const bucket = tasksByUser.get(task.user_id) ?? []
    bucket.push(task)
    tasksByUser.set(task.user_id, bucket)
  }

  const sentNotifications: Array<{ userId: string; title: string; body: string; url: string; taskId?: string }> = []

  for (const [userId, userTasks] of tasksByUser.entries()) {
    for (const task of userTasks) {
      if (!isReminderDue(task, now)) continue

      const reminderType = (() => {
        const dueDate = new Date(`${task.due}T23:59:59`)
        const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
        const startOfToday = startOfDay(now)
        const startOfDueDate = startOfDay(dueDate)
        const calendarDayDiff = Math.round((startOfDueDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))

        if (calendarDayDiff === 1 && diffHours > 3 && diffHours <= 48) return 'day_before'
        if (diffHours > 0 && diffHours <= 3) return 'three_hours_before'
        return null
      })()

      if (!reminderType) continue

      const notification = buildReminderNotification(task, reminderType)
      const sentCount = await sendToUserSubscriptions(userId, {
        title: notification.title,
        body: notification.body,
        url: notification.url,
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
    .select('user_id, last_morning_summary_at')

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
    const dueDate = task.due ? new Date(`${task.due}T23:59:59`) : null
    if (!dueDate) continue
    const sameDay = startOfDay(dueDate).getTime() === startOfDay(now).getTime()
    if (!sameDay) continue

    const bucket = tasksByUser.get(task.user_id) ?? []
    bucket.push(task)
    tasksByUser.set(task.user_id, bucket)
  }

  const sentSummaryNotifications: Array<{ userId: string; title: string; body: string; url: string }> = []

  for (const profile of users) {
    const lastSent = profile.last_morning_summary_at ? new Date(profile.last_morning_summary_at).getTime() : null
    const todayStamp = startOfDay(now).getTime()

    if (lastSent && startOfDay(new Date(lastSent)).getTime() === todayStamp) {
      continue
    }

    const pendingToday = tasksByUser.get(profile.user_id) ?? []
    const summary = buildMorningSummary(pendingToday)
    if (!summary) continue

    const sentCount = await sendToUserSubscriptions(profile.user_id, {
      title: summary.title,
      body: summary.body,
      url: summary.url,
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
    .select('user_id, last_evening_summary_at')

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
    const dueDate = task.due ? new Date(`${task.due}T23:59:59`) : null
    if (!dueDate) continue
    const sameDay = startOfDay(dueDate).getTime() === startOfDay(now).getTime()
    if (!sameDay) continue

    const bucket = tasksByUser.get(task.user_id) ?? []
    bucket.push(task)
    tasksByUser.set(task.user_id, bucket)
  }

  const sentSummaryNotifications: Array<{ userId: string; title: string; body: string; url: string }> = []

  for (const profile of users) {
    const lastSent = profile.last_evening_summary_at ? new Date(profile.last_evening_summary_at).getTime() : null
    const todayStamp = startOfDay(now).getTime()

    if (lastSent && startOfDay(new Date(lastSent)).getTime() === todayStamp) {
      continue
    }

    const pendingToday = tasksByUser.get(profile.user_id) ?? []
    const summary = buildEveningSummary(pendingToday)
    const sentCount = await sendToUserSubscriptions(profile.user_id, {
      title: summary.title,
      body: summary.body,
      url: summary.url,
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
