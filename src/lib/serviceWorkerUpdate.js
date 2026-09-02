import { useUIStore } from '../stores/ui.store.js'
import { useTimerStore } from '../features/pomodoro/timerStore.js'

export const SW_UPDATE_INTERVAL_MS = 5 * 60 * 1000
export const SW_UPDATE_IDLE_MS = 10 * 60 * 1000
export const SW_UPDATE_FALLBACK_MS = 60 * 60 * 1000

const RELOADED_SESSION_KEY = 'academia:sw-reloaded'

let formSnapshots = new WeakMap()

function getFormSnapshot(form) {
  return JSON.stringify(Array.from(form.querySelectorAll('input, select, textarea'), (control) => ({
    name: control.name,
    type: control.type,
    value: control.type === 'file'
      ? Array.from(control.files || [], (file) => `${file.name}:${file.size}:${file.lastModified}`)
      : control.value,
    checked: control.type === 'checkbox' || control.type === 'radio' ? control.checked : undefined,
  })))
}

export function hasDirtyForm() {
  const forms = Array.from(document.querySelectorAll('form'))
  return forms.some((form) => {
    const currentSnapshot = getFormSnapshot(form)
    const initialSnapshot = formSnapshots.get(form)
    if (initialSnapshot === undefined) {
      formSnapshots.set(form, currentSnapshot)
      return false
    }
    return currentSnapshot !== initialSnapshot
  })
}

function trackFormSnapshots() {
  document.querySelectorAll('form').forEach((form) => {
    if (!formSnapshots.has(form)) formSnapshots.set(form, getFormSnapshot(form))
  })
}

export function isReloadBlocked() {
  const uiState = useUIStore.getState()
  const timerState = useTimerStore.getState()

  return Boolean(
    hasDirtyForm()
    || uiState.hasUnsavedChanges
    || uiState.isModalOpen
    || uiState.confirmDialog
    || uiState.lightbox
    || timerState.pomodoroState?.isRunning
  )
}

function hasReloadedThisSession() {
  try {
    return sessionStorage.getItem(RELOADED_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function markReloadedThisSession() {
  try {
    sessionStorage.setItem(RELOADED_SESSION_KEY, '1')
  } catch {
  }
}

export function startServiceWorkerUpdateCoordinator() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return () => {}

  let registration = null
  let updatePending = false
  let pendingSince = null
  let lastInteraction = Date.now()
  let wasBackgrounded = document.visibilityState === 'hidden'
  let reloadStarted = false
  let hadController = Boolean(navigator.serviceWorker.controller)

  const setUpdateState = (state) => useUIStore.getState().setServiceWorkerUpdate(state)

  const reload = () => {
    if (reloadStarted || hasReloadedThisSession()) return
    reloadStarted = true
    markReloadedThisSession()
    window.location.reload()
  }

  const maybeReload = ({ allowAfterBackground = false } = {}) => {
    if (!updatePending || reloadStarted || hasReloadedThisSession()) return

    const now = Date.now()
    if (now - (pendingSince || now) >= SW_UPDATE_FALLBACK_MS) {
      setUpdateState({ pending: true, fallbackVisible: true })
    }

    const idleLongEnough = now - lastInteraction >= SW_UPDATE_IDLE_MS
    if ((idleLongEnough || allowAfterBackground) && !isReloadBlocked()) reload()
  }

  const markPending = () => {
    if (hasReloadedThisSession()) return
    if (!updatePending) {
      updatePending = true
      pendingSince = Date.now()
      setUpdateState({ pending: true, fallbackVisible: false })
    }
    maybeReload()
  }

  const handleControllerChange = () => {
    if (!navigator.serviceWorker.controller) return
    if (!hadController) {
      hadController = true
      return
    }
    markPending()
  }

  const handleActivity = () => {
    lastInteraction = Date.now()
  }

  const handleFormSubmit = (event) => {
    window.setTimeout(() => {
      if (event.target instanceof HTMLFormElement) {
        formSnapshots.set(event.target, getFormSnapshot(event.target))
      }
    }, 0)
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      wasBackgrounded = true
      return
    }

    if (registration) registration.update().catch(() => {})
    const returnedFromBackground = wasBackgrounded
    wasBackgrounded = false
    maybeReload({ allowAfterBackground: returnedFromBackground })
  }

  const activityEvents = ['mousedown', 'keydown', 'touchstart', 'pointerdown']
  activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }))
  document.addEventListener('visibilitychange', handleVisibilityChange)
  document.addEventListener('submit', handleFormSubmit, true)
  navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
  trackFormSnapshots()
  const formObserver = new MutationObserver(trackFormSnapshots)
  formObserver.observe(document.body, { childList: true, subtree: true })

  const intervalId = window.setInterval(() => {
    if (registration) registration.update().catch(() => {})
    maybeReload()
  }, SW_UPDATE_INTERVAL_MS)

  const start = async () => {
    try {
      registration = await navigator.serviceWorker.register('/sw.js')
      console.log('[SW] Service Worker registered successfully:', registration)

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            newWorker.postMessage({ type: 'SKIP_WAITING' })
          }
        })
      })

      if (registration.waiting && navigator.serviceWorker.controller) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
      registration.update().catch(() => {})
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      })
    }
  }

  window.addEventListener('load', start, { once: true })

  return () => {
    window.removeEventListener('load', start)
    activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity))
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    document.removeEventListener('submit', handleFormSubmit, true)
    navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    formObserver.disconnect()
    window.clearInterval(intervalId)
  }
}

export function reloadServiceWorkerUpdate() {
  try {
    sessionStorage.setItem(RELOADED_SESSION_KEY, '1')
  } catch {
    // Manual fallback remains available even if sessionStorage is restricted.
  }
  window.location.reload()
}
