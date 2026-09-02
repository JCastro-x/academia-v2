import { createClient } from 'npm:@supabase/supabase-js'
import webPush from 'npm:web-push'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
  throw new Error('Missing Supabase or VAPID environment variables.')
}

webPush.setVapidDetails('mailto:admin@academia.local', vapidPublicKey, vapidPrivateKey)

const supabase = createClient(supabaseUrl, serviceRoleKey)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const phases = new Set(['trabajo', 'descanso_corto', 'descanso_largo'])
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type Action = 'schedule' | 'cancel' | 'reschedule' | 'dispatch'
type Phase = 'trabajo' | 'descanso_corto' | 'descanso_largo'

type RequestBody = {
  action?: Action
  session_id?: string
  phase?: Phase
  scheduled_at?: string
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function bearerToken(request: Request) {
  const header = request.headers.get('Authorization') || ''
  return header.startsWith('Bearer ') ? header.slice(7) : null
}

async function authenticateUser(request: Request) {
  const token = bearerToken(request)
  if (!token || token === serviceRoleKey) return null

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

function validateSessionInput(body: RequestBody) {
  if (!body.session_id || !uuidPattern.test(body.session_id)) {
    throw new Error('session_id must be a UUID')
  }
  if (!body.phase || !phases.has(body.phase)) {
    throw new Error('phase must be trabajo, descanso_corto or descanso_largo')
  }
}

function validateScheduledAt(value: string | undefined) {
  const timestamp = value ? new Date(value) : null
  if (!timestamp || Number.isNaN(timestamp.getTime())) {
    throw new Error('scheduled_at must be a valid ISO timestamp')
  }
  return timestamp.toISOString()
}

async function scheduleNotification(userId: string, body: RequestBody) {
  validateSessionInput(body)
  const scheduledAt = validateScheduledAt(body.scheduled_at)

  const { data, error } = await supabase
    .from('pomodoro_pending_notifications')
    .upsert({
      user_id: userId,
      session_id: body.session_id,
      phase: body.phase,
      notification_type: 'completion',
      scheduled_at: scheduledAt,
      status: 'pending',
      cancelled_at: null,
      sent_at: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,session_id,notification_type' })
    .select('id, session_id, phase, scheduled_at, status')
    .single()

  if (error) throw error
  return data
}

async function cancelNotification(userId: string, body: RequestBody) {
  if (!body.session_id || !uuidPattern.test(body.session_id)) {
    throw new Error('session_id must be a UUID')
  }

  const { data, error } = await supabase
    .from('pomodoro_pending_notifications')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('session_id', body.session_id)
    .eq('status', 'pending')
    .select('id, session_id, phase, scheduled_at, status')

  if (error) throw error
  return data ?? []
}

async function sendToUserSubscriptions(userId: string, payload: { phase: Phase; sessionId: string }) {
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) throw error

  let sentCount = 0
  for (const subscription of subscriptions ?? []) {
    try {
      await webPush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      } as any, JSON.stringify({
        type: 'pomodoro-complete',
        title: payload.phase === 'trabajo' ? 'Pomodoro completado' : 'Descanso completado',
        body: payload.phase === 'trabajo' ? 'Es hora de descansar.' : 'Es hora de volver al trabajo.',
        phase: payload.phase,
        session_id: payload.sessionId,
        url: '/clock',
        tag: `academia-pomodoro-${payload.sessionId}`,
      }))
      sentCount += 1
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint)
      } else {
        console.warn('[pomodoro] failed to send notification', error)
      }
    }
  }

  return sentCount
}

async function dispatchNotifications() {
  const now = new Date().toISOString()
  const { data: due, error } = await supabase
    .from('pomodoro_pending_notifications')
    .select('id, user_id, session_id, phase')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(100)

  if (error) throw error

  let processed = 0
  let sent = 0
  for (const notification of due ?? []) {
    const { data: claimed, error: claimError } = await supabase
      .from('pomodoro_pending_notifications')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', notification.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()

    if (claimError || !claimed) continue

    processed += 1
    let sentCount = 0
    try {
      sentCount = await sendToUserSubscriptions(notification.user_id, {
        phase: notification.phase,
        sessionId: notification.session_id,
      })
    } catch (error) {
      console.warn('[pomodoro] dispatch failed; returning notification to pending', error)
      await supabase
        .from('pomodoro_pending_notifications')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', notification.id)
      continue
    }

    if (sentCount > 0) {
      sent += 1
      await supabase
        .from('pomodoro_pending_notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', notification.id)
    } else {
      await supabase
        .from('pomodoro_pending_notifications')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', notification.id)
    }
  }

  return { due: due?.length ?? 0, processed, sent }
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = await request.json().catch(() => ({})) as RequestBody
    if (body.action === 'dispatch') {
      if (bearerToken(request) !== serviceRoleKey) return json({ error: 'Unauthorized' }, 401)
      return json({ action: 'dispatch', ...(await dispatchNotifications()) })
    }

    const user = await authenticateUser(request)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    if (body.action === 'schedule' || body.action === 'reschedule') {
      return json({ action: body.action, notification: await scheduleNotification(user.id, body) })
    }

    if (body.action === 'cancel') {
      return json({ action: body.action, notifications: await cancelNotification(user.id, body) })
    }

    return json({ error: 'Unsupported action' }, 400)
  } catch (error) {
    console.error('[pomodoro] function failed', error)
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 400)
  }
})
