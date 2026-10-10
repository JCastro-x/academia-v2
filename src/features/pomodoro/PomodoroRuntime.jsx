import { useEffect, useRef } from 'react'
import { useCreatePomodoroSession } from './hooks'
import { cancelPomodoroNotification, schedulePomodoroNotification } from './api'
import { useTimerStore } from './timerStore'
import {
  playSoundAfterAudioResume,
  requestNotificationPermission,
  showNotification,
  startAudioKeepAlive,
  stopAudioKeepAlive,
} from '../../lib/sound'

const ACTION_EVENT = 'academia:pomodoro-action'

async function scheduleCurrentPomodoro() {
  const { pomodoroState } = useTimerStore.getState()
  if (!pomodoroState.sessionId || !pomodoroState.endsAt) return

  try {
    await schedulePomodoroNotification(
      pomodoroState.sessionId,
      pomodoroState.currentPhase,
      new Date(pomodoroState.endsAt).toISOString()
    )
  } catch (error) {
    console.warn('[pomodoro] Failed to schedule notification', error)
  }
}

export default function PomodoroRuntime() {
  const isRunning = useTimerStore((state) => state.pomodoroState.isRunning)
  const endsAt = useTimerStore((state) => state.pomodoroState.endsAt)
  const createSession = useCreatePomodoroSession()
  const createSessionRef = useRef(createSession)
  createSessionRef.current = createSession
  const workerRef = useRef(null)
  const finishPomodoroRef = useRef(null)

  useEffect(() => {
    const worker = new Worker(new URL('../../workers/timerWorker.js', import.meta.url))
    workerRef.current = worker

    const finishPomodoro = () => {
      const state = useTimerStore.getState()
      const current = state.pomodoroState
      if (!current.isRunning || !current.endsAt || Date.now() < current.endsAt) return

      const phaseName = current.currentPhase === 'trabajo'
        ? 'Trabajo'
        : current.currentPhase === 'descanso_corto'
          ? 'Descanso corto'
          : 'Descanso largo'
      const nextPhase = current.currentPhase === 'trabajo'
        ? '¡Hora de descansar!'
        : '¡Hora de trabajar!'

      void playSoundAfterAudioResume('pomodoro-complete')
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        showNotification('Pomodoro completado', {
          body: `${phaseName} finalizado. ${nextPhase}`,
          tag: 'pomodoro-complete',
        })
      }

      if (current.currentPhase === 'trabajo') {
        createSessionRef.current.mutate({
          id: current.sessionId,
          started_at: new Date(current.startedAt).toISOString(),
          ended_at: new Date().toISOString(),
          duration_min: Math.round(state.pomodoroConfig.workDuration),
          tipo: 'trabajo',
          task_id: current.linkedTaskId,
          subject_id: current.linkedSubjectId,
        })
      }

      state.completePomodoroSession()
    }
    finishPomodoroRef.current = finishPomodoro

    worker.onmessage = ({ data }) => {
      const { type, payload } = data
      const state = useTimerStore.getState()

      switch (type) {
        case 'TIMER_UPDATE':
          state.updatePomodoroRemaining(payload.remainingSeconds)
          break
        case 'COUNTDOWN_SOUND':
          void playSoundAfterAudioResume('countdown')
          break
        case 'TIMER_COMPLETE':
          finishPomodoro()
          break
        default:
          console.warn('[PomodoroRuntime] Unknown worker message:', type)
      }
    }
    worker.onerror = (error) => {
      console.error('[PomodoroRuntime] Timer worker failed', error)
    }

    const handleTimerAction = async (event) => {
      const state = useTimerStore.getState()
      const current = state.pomodoroState

      switch (event.detail?.action) {
        case 'start':
          const permissionRequest = requestNotificationPermission()
          state.startPomodoro()
          startAudioKeepAlive()
          await permissionRequest
          await scheduleCurrentPomodoro()
          break
        case 'pause':
          state.pausePomodoro()
          if (current.sessionId) {
            try {
              await cancelPomodoroNotification(current.sessionId)
            } catch (error) {
              console.warn('[pomodoro] Failed to cancel notification', error)
            }
          }
          break
        case 'resume':
          state.resumePomodoro()
          startAudioKeepAlive()
          await scheduleCurrentPomodoro()
          break
        case 'reset':
          state.resetPomodoro()
          if (current.sessionId) {
            try {
              await cancelPomodoroNotification(current.sessionId)
            } catch (error) {
              console.warn('[pomodoro] Failed to cancel notification', error)
            }
          }
          break
        case 'skip-next':
          state.skipToNextPhase()
          break
        default:
          console.warn('[PomodoroRuntime] Unknown timer action:', event.detail?.action)
      }
    }

    window.addEventListener(ACTION_EVENT, handleTimerAction)

    return () => {
      window.removeEventListener(ACTION_EVENT, handleTimerAction)
      worker.postMessage({ type: 'STOP_TIMER' })
      worker.terminate()
      workerRef.current = null
      finishPomodoroRef.current = null
      stopAudioKeepAlive()
    }
  }, [])

  useEffect(() => {
    if (isRunning) startAudioKeepAlive()
    else stopAudioKeepAlive()
  }, [isRunning])

  useEffect(() => {
    const worker = workerRef.current
    if (!worker) return

    if (isRunning && endsAt) {
      worker.postMessage({ type: 'START_TIMER', payload: { endsAt } })
    } else {
      worker.postMessage({ type: 'STOP_TIMER' })
    }
  }, [isRunning, endsAt])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) return

      const state = useTimerStore.getState()
      const current = state.pomodoroState
      if (!current.isRunning || !current.endsAt) return

      if (Date.now() >= current.endsAt) {
        finishPomodoroRef.current?.()
        return
      }

      state.updatePomodoroRemaining(Math.max(0, Math.ceil((current.endsAt - Date.now()) / 1000)))
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return null
}
