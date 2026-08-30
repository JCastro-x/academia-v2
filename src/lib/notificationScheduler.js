import { supabase } from './supabase.js'
import { buildDailySummaryContent, getTaskRemindersForNow } from './notifications.js'

const NOTIFICATION_PREFIX = 'academia-task-notify:'

function getStorageKey(prefix, suffix) {
  return `${NOTIFICATION_PREFIX}${prefix}:${suffix}`
}

function hasRecentlyNotified(key, now) {
  const raw = window.localStorage.getItem(key)
  if (!raw) return false

  try {
    const value = Number(raw)
    if (!Number.isFinite(value)) return false
    const elapsedMinutes = (now - value) / (1000 * 60)
    return elapsedMinutes < 60
  } catch (error) {
    return false
  }
}

function markNotified(key, now) {
  window.localStorage.setItem(key, String(now))
}

function canSendBrowserNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
}

function sendNotification({ title, body, url }) {
  if (!canSendBrowserNotifications()) return

  const payload = { title, body, url }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: url || 'academia-task-reminder',
        data: { url },
        vibrate: [200, 100, 200],
      }).catch(() => {
        new Notification(title, {
          body,
          icon: '/icon-192.png',
          tag: url || 'academia-task-reminder',
          data: { url },
        })
      })
    }).catch(() => {
      new Notification(title, { body, icon: '/icon-192.png', data: { url } })
    })
    return
  }

  new Notification(title, {
    body,
    icon: '/icon-192.png',
    data: { url },
  })
}

async function getPendingTasksForLoggedUser() {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData?.session?.user?.id
  if (!userId) return []

  const { data, error } = await supabase
    .from('tasks')
    .select('id, titulo, due, done, user_id')
    .eq('user_id', userId)
    .eq('done', false)

  if (error) {
    console.warn('[notifications] failed to fetch tasks', error)
    return []
  }

  return data || []
}

export function startTaskNotificationScheduler() {
  if (typeof window === 'undefined') return () => {}

  let timer = null

  const runCheck = async () => {
    if (!canSendBrowserNotifications()) return

    try {
      const tasks = await getPendingTasksForLoggedUser()
      const now = new Date()

      const morningKey = getStorageKey('daily-summary', 'morning')
      const eveningKey = getStorageKey('daily-summary', 'evening')
      const localDate = now.toISOString().slice(0, 10)

      const currentHour = now.getHours()
      const morningWindow = currentHour === 7 && now.getMinutes() >= 0 && now.getMinutes() < 5
      const eveningWindow = currentHour === 19 && now.getMinutes() >= 0 && now.getMinutes() < 5

      if (morningWindow && !hasRecentlyNotified(`${morningKey}:${localDate}`, now.getTime())) {
        const content = buildDailySummaryContent(tasks, 'morning', now.toISOString())
        sendNotification({ title: content.title, body: content.body, url: content.url })
        markNotified(`${morningKey}:${localDate}`, now.getTime())
      }

      if (eveningWindow && !hasRecentlyNotified(`${eveningKey}:${localDate}`, now.getTime())) {
        const content = buildDailySummaryContent(tasks, 'evening', now.toISOString())
        sendNotification({ title: content.title, body: content.body, url: content.url })
        markNotified(`${eveningKey}:${localDate}`, now.getTime())
      }

      const reminders = getTaskRemindersForNow(tasks, now.toISOString())
      for (const reminder of reminders) {
        const reminderKey = getStorageKey('task-reminder', `${reminder.taskId}:${reminder.type}:${localDate}`)
        if (hasRecentlyNotified(reminderKey, now.getTime())) continue
        sendNotification({ title: reminder.title, body: reminder.body, url: reminder.url })
        markNotified(reminderKey, now.getTime())
      }
    } catch (error) {
      console.warn('[notifications] scheduler failed', error)
    }
  }

  const start = () => {
    if (timer) return
    runCheck()
    timer = window.setInterval(runCheck, 60 * 1000)
  }

  const stop = () => {
    if (timer) {
      window.clearInterval(timer)
      timer = null
    }
  }

  start()
  return stop
}
