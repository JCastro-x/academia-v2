// Web Worker para manejar el timer de Pomodoro sin throttling de background
// Los Workers no sufren el mismo throttling que el hilo principal en pestañas ocultas

let timerInterval = null
let endsAt = null
let lastCountdownSecond = null

self.onmessage = (e) => {
  const { type, payload } = e.data

  switch (type) {
    case 'START_TIMER':
      startTimer(payload.endsAt)
      break
    case 'STOP_TIMER':
      stopTimer()
      break
    case 'UPDATE_ENDS_AT':
      updateEndsAt(payload.endsAt)
      break
    default:
      console.warn('[timerWorker] Unknown message type:', type)
  }
}

function startTimer(newEndsAt) {
  endsAt = newEndsAt
  lastCountdownSecond = null
  
  if (timerInterval) {
    clearInterval(timerInterval)
  }

  // Usar un intervalo más frecuente (100ms) para mayor precisión
  // Los Workers no sufren throttling en background
  timerInterval = setInterval(() => {
    const now = Date.now()
    const remainingMs = endsAt - now
    const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))

    // Verificar si terminó
    if (remainingSeconds <= 0) {
      postMessage({ type: 'TIMER_COMPLETE' })
      stopTimer()
      return
    }

    // Verificar si toca sonido de cuenta regresiva (últimos 10 segundos)
    if (remainingSeconds <= 10 && remainingSeconds > 0) {
      if (remainingSeconds !== lastCountdownSecond) {
        lastCountdownSecond = remainingSeconds
        postMessage({ 
          type: 'COUNTDOWN_SOUND', 
          payload: { second: remainingSeconds } 
        })
      }
    }

    // Enviar actualización de tiempo restante (solo para display)
    postMessage({ 
      type: 'TIMER_UPDATE', 
      payload: { remainingSeconds } 
    })
  }, 100) // 100ms para mayor precisión, sin throttling en Workers
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  endsAt = null
  lastCountdownSecond = null
}

function updateEndsAt(newEndsAt) {
  endsAt = newEndsAt
  lastCountdownSecond = null
}
