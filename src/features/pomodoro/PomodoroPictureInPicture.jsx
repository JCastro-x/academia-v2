import { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { useTimerStore } from './timerStore'

const TOGGLE_EVENT = 'academia:pomodoro-pip-toggle'
const ACTION_EVENT = 'academia:pomodoro-action'

export function isPomodoroPictureInPictureSupported() {
  if (typeof window === 'undefined') return false

  const documentPip = window.documentPictureInPicture
  const documentPipSupported = typeof documentPip?.requestWindow === 'function'
  const videoPipSupported = typeof HTMLVideoElement !== 'undefined'
    && typeof HTMLCanvasElement !== 'undefined'
    && typeof HTMLVideoElement.prototype.requestPictureInPicture === 'function'
    && typeof HTMLCanvasElement.prototype.captureStream === 'function'
    && document.pictureInPictureEnabled !== false

  return documentPipSupported || videoPipSupported
}

export function togglePomodoroPictureInPicture() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(TOGGLE_EVENT))
  }
}

function requestTimerAction(action) {
  window.dispatchEvent(new CustomEvent(ACTION_EVENT, { detail: { action } }))
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function getPhaseLabel(phase) {
  if (phase === 'descanso_corto') return 'Descanso corto'
  if (phase === 'descanso_largo') return 'Descanso largo'
  return 'Foco'
}

function PipControls() {
  const remainingSeconds = useTimerStore((state) => state.pomodoroState.remainingSeconds)
  const currentPhase = useTimerStore((state) => state.pomodoroState.currentPhase)
  const isRunning = useTimerStore((state) => state.pomodoroState.isRunning)
  const isPaused = useTimerStore((state) => state.pomodoroState.isPaused)
  const primaryAction = isRunning ? 'pause' : isPaused ? 'resume' : 'start'
  const primaryLabel = isRunning ? 'Pausa' : isPaused ? 'Reanudar' : 'Iniciar'

  return (
    <main className="pip-shell">
      <div className="pip-phase">{getPhaseLabel(currentPhase)}</div>
      <div className="pip-time">{formatTime(remainingSeconds)}</div>
      <div className="pip-controls">
        <button
          className="pip-button pip-primary"
          type="button"
          onClick={() => requestTimerAction(primaryAction)}
        >
          {primaryLabel}
        </button>
        <button
          className="pip-button pip-secondary"
          type="button"
          onClick={() => requestTimerAction('skip-next')}
        >
          Saltar
        </button>
        <button
          className="pip-button pip-secondary"
          type="button"
          onClick={() => requestTimerAction('reset')}
        >
          Reset
        </button>
      </div>
    </main>
  )
}

function drawCanvas(canvas, pipWindow, timerState) {
  if (!canvas) return

  const width = Math.max(160, pipWindow?.width || 640)
  const height = Math.max(120, pipWindow?.height || 440)
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) return

  const styles = getComputedStyle(document.documentElement)
  const background = styles.getPropertyValue('--dm-surface').trim() || '#ffffff'
  const textColor = styles.getPropertyValue('--dm-text').trim() || '#111827'
  const primary = styles.getPropertyValue('--color-primary').trim() || '#8b5cf6'
  const primaryText = styles.getPropertyValue('--color-primary-fg').trim() || '#ffffff'
  const compact = width < 250 || height < 160

  context.fillStyle = background
  context.fillRect(0, 0, width, height)
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  if (!compact) {
    context.fillStyle = textColor
    context.font = `600 ${Math.max(14, Math.min(width, height) * 0.075)}px sans-serif`
    context.fillText(getPhaseLabel(timerState.currentPhase), width / 2, height * 0.19)
  }

  context.fillStyle = primary
  context.beginPath()
  context.roundRect(width * 0.06, height * (compact ? 0.12 : 0.29), width * 0.88, height * (compact ? 0.5 : 0.42), height * 0.08)
  context.fill()
  context.fillStyle = primaryText
  context.font = `700 ${Math.max(24, Math.min(width, height) * (compact ? 0.27 : 0.22))}px sans-serif`
  context.fillText(formatTime(timerState.remainingSeconds), width / 2, height * (compact ? 0.37 : 0.5))

  const actionLabel = timerState.isRunning ? 'Pausa' : timerState.isPaused ? 'Reanudar' : 'Iniciar'
  if (compact) {
    context.fillStyle = textColor
    context.font = `600 ${Math.max(12, height * 0.13)}px sans-serif`
    context.fillText(actionLabel, width / 2, height * 0.82)
  } else {
    context.fillStyle = textColor
    context.font = `500 ${Math.max(12, Math.min(width, height) * 0.055)}px sans-serif`
    context.fillText(actionLabel, width / 2, height * 0.84)
  }
}

export default function PomodoroPictureInPicture() {
  const pipWindowRef = useRef(null)
  const pipRootRef = useRef(null)
  const pipPageHideRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)
  const videoPipWindowRef = useRef(null)
  const canvasIntervalRef = useRef(null)
  const remainingSeconds = useTimerStore((state) => state.pomodoroState.remainingSeconds)
  const currentPhase = useTimerStore((state) => state.pomodoroState.currentPhase)
  const isRunning = useTimerStore((state) => state.pomodoroState.isRunning)
  const isPaused = useTimerStore((state) => state.pomodoroState.isPaused)

  useEffect(() => {
    const syncMediaSession = () => {
      if (!videoPipWindowRef.current || !navigator.mediaSession) return
      const state = useTimerStore.getState().pomodoroState

      try {
        if (typeof MediaMetadata !== 'undefined') {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: formatTime(state.remainingSeconds),
            artist: getPhaseLabel(state.currentPhase),
          })
        }
        navigator.mediaSession.playbackState = state.isRunning ? 'playing' : 'paused'
      } catch (error) {
        console.warn('[PomodoroPictureInPicture] Could not update media session', error)
      }
    }

    const clearMediaSession = () => {
      if (!navigator.mediaSession) return
      for (const action of ['play', 'pause', 'stop', 'nexttrack']) {
        try {
          navigator.mediaSession.setActionHandler(action, null)
        } catch (error) {
          console.warn(`[PomodoroPictureInPicture] Could not clear media action "${action}"`, error)
        }
      }
      navigator.mediaSession.playbackState = 'none'
    }

    const configureMediaSession = () => {
      if (!navigator.mediaSession) return
      const handlers = {
        play: () => {
          const state = useTimerStore.getState().pomodoroState
          if (!state.isRunning) requestTimerAction(state.isPaused ? 'resume' : 'start')
        },
        pause: () => {
          if (useTimerStore.getState().pomodoroState.isRunning) requestTimerAction('pause')
        },
        stop: () => requestTimerAction('reset'),
        nexttrack: () => requestTimerAction('skip-next'),
      }

      for (const [action, handler] of Object.entries(handlers)) {
        try {
          navigator.mediaSession.setActionHandler(action, handler)
        } catch (error) {
          console.warn(`[PomodoroPictureInPicture] Could not register media action "${action}"`, error)
        }
      }
      syncMediaSession()
    }

    const closeDocumentPip = () => {
      if (pipPageHideRef.current && pipWindowRef.current) {
        pipWindowRef.current.removeEventListener('pagehide', pipPageHideRef.current)
      }
      pipPageHideRef.current = null
      pipRootRef.current?.unmount()
      pipRootRef.current = null
      pipWindowRef.current = null
    }

    const closeVideoPip = async () => {
      const video = videoRef.current
      const stream = streamRef.current
      videoRef.current = null
      streamRef.current = null
      canvasRef.current = null
      videoPipWindowRef.current = null
      if (canvasIntervalRef.current) {
        clearInterval(canvasIntervalRef.current)
        canvasIntervalRef.current = null
      }

      try {
        if (video && document.pictureInPictureElement === video) {
          await document.exitPictureInPicture()
        }
      } catch (error) {
        console.warn('[PomodoroPictureInPicture] Could not close video PiP cleanly', error)
      } finally {
        stream?.getTracks().forEach((track) => track.stop())
        video?.remove()
        clearMediaSession()
      }
    }

    const openDocumentPip = async () => {
      const pipWindow = await window.documentPictureInPicture.requestWindow({ width: 320, height: 220 })
      pipWindowRef.current = pipWindow

      document.head.querySelectorAll('link[rel="stylesheet"], style').forEach((stylesheet) => {
        pipWindow.document.head.appendChild(stylesheet.cloneNode(true))
      })
      pipWindow.document.documentElement.className = document.documentElement.className
      pipWindow.document.documentElement.style.cssText = document.documentElement.style.cssText
      pipWindow.document.body.style.cssText = 'margin:0;width:100vw;height:100vh;overflow:hidden;background:var(--dm-bg);color:var(--dm-text);font-family:var(--font-family,sans-serif)'

      const pipStyles = pipWindow.document.createElement('style')
      pipStyles.textContent = `
        *,*::before,*::after{box-sizing:border-box}
        .pip-root{width:100%;height:100%;container-type:size}
        .pip-shell{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2cqh;padding:3cqh 4cqw;background:var(--dm-surface);color:var(--dm-text);overflow:hidden}
        .pip-phase{font-size:clamp(.75rem,4cqh,1rem);font-weight:600}
        .pip-time{font-size:clamp(2rem,20vmin,4rem);line-height:1;font-weight:700;font-variant-numeric:tabular-nums;color:var(--color-primary)}
        .pip-controls{display:flex;justify-content:center;gap:2cqw;width:100%}
        .pip-button{border:0;border-radius:var(--radius-sm,8px);padding:1.2cqh 3cqw;background:var(--dm-bg);color:var(--dm-text);font:600 clamp(.65rem,3.4cqh,.9rem) var(--font-family,sans-serif);white-space:nowrap}
        .pip-primary{background:var(--color-primary);color:var(--color-primary-fg)}
        @container (max-width:250px),(max-height:160px){.pip-phase,.pip-secondary{display:none}.pip-shell{gap:5cqh}.pip-time{font-size:clamp(2rem,20vmin,4rem)}.pip-controls{width:auto}}
      `
      pipWindow.document.head.appendChild(pipStyles)

      const mountPoint = pipWindow.document.createElement('div')
      mountPoint.className = 'pip-root'
      pipWindow.document.body.appendChild(mountPoint)
      pipRootRef.current = createRoot(mountPoint)
      pipRootRef.current.render(<PipControls />)

      const handlePageHide = () => closeDocumentPip()
      pipPageHideRef.current = handlePageHide
      pipWindow.addEventListener('pagehide', handlePageHide, { once: true })
    }

    const openVideoPip = () => {
      const canvas = document.createElement('canvas')
      canvasRef.current = canvas
      drawCanvas(canvas, null, useTimerStore.getState().pomodoroState)
      const stream = canvas.captureStream(1)
      streamRef.current = stream

      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none'
      video.srcObject = stream
      document.body.appendChild(video)
      videoRef.current = video

      video.addEventListener('leavepictureinpicture', () => {
        void closeVideoPip()
      }, { once: true })

      void video.play().then(() => video.requestPictureInPicture()).then((pipWindow) => {
        videoPipWindowRef.current = pipWindow
        configureMediaSession()
        canvasIntervalRef.current = window.setInterval(() => {
          drawCanvas(canvasRef.current, videoPipWindowRef.current, useTimerStore.getState().pomodoroState)
        }, 1000)
        pipWindow.addEventListener('resize', () => {
          drawCanvas(canvasRef.current, pipWindow, useTimerStore.getState().pomodoroState)
        })
      }).catch((error) => {
        console.warn('[PomodoroPictureInPicture] Could not start PiP video', error)
        window.dispatchEvent(new CustomEvent('academia:toast', {
          detail: { type: 'error', message: 'No se pudo abrir la ventana flotante de Pomodoro.' },
        }))
        void closeVideoPip()
      })
    }

    const togglePip = async () => {
      if (pipWindowRef.current) {
        pipWindowRef.current.close()
        closeDocumentPip()
        return
      }
      if (videoRef.current) {
        await closeVideoPip()
        return
      }

      if (typeof window.documentPictureInPicture?.requestWindow === 'function') {
        try {
          await openDocumentPip()
        } catch (error) {
          console.warn('[PomodoroPictureInPicture] Could not open document PiP', error)
          pipWindowRef.current?.close()
          closeDocumentPip()
          window.dispatchEvent(new CustomEvent('academia:toast', {
            detail: { type: 'error', message: 'No se pudo abrir la ventana flotante de Pomodoro.' },
          }))
        }
      } else {
        openVideoPip()
      }
    }

    window.addEventListener(TOGGLE_EVENT, togglePip)
    return () => {
      window.removeEventListener(TOGGLE_EVENT, togglePip)
      if (pipWindowRef.current) pipWindowRef.current.close()
      closeDocumentPip()
      void closeVideoPip()
    }
  }, [])

  useEffect(() => {
    drawCanvas(canvasRef.current, videoPipWindowRef.current, {
      remainingSeconds,
      currentPhase,
      isRunning,
      isPaused,
    })
    if (videoPipWindowRef.current && navigator.mediaSession) {
      try {
        if (typeof MediaMetadata !== 'undefined') {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: formatTime(remainingSeconds),
            artist: getPhaseLabel(currentPhase),
          })
        }
        navigator.mediaSession.playbackState = isRunning ? 'playing' : 'paused'
      } catch (error) {
        console.warn('[PomodoroPictureInPicture] Could not sync media session', error)
      }
    }
  }, [remainingSeconds, currentPhase, isRunning, isPaused])

  return null
}
