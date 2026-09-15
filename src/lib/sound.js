let audioContext = null
let isMuted = false
let effectsVolume = Number(localStorage.getItem('academia_effects_volume'))
if (!Number.isFinite(effectsVolume) || effectsVolume <= 0) effectsVolume = 1
let keepAliveSource = null
let keepAliveGain = null

const getAudioContext = () => {
  if (typeof window === 'undefined') return null
  const AudioCtor = window.AudioContext || window.webkitAudioContext
  if (!AudioCtor) return null

  if (!audioContext) {
    audioContext = new AudioCtor()
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume().catch((error) => {
      console.warn('[sound] Failed to resume AudioContext', error)
    })
  }

  return audioContext
}

const playTone = ({
  frequency,
  duration = 0.12,
  type = 'sine',
  volume = 0.08,
  startTime = 0,
  endFrequency,
  sweepDuration = 0,
}) => {
  const ctx = getAudioContext()
  if (!ctx || isMuted) return

  // Verificar y resumir AudioContext si está suspendido
  if (ctx.state === 'suspended') {
    ctx.resume().catch((error) => {
      console.warn('[sound] Failed to resume AudioContext for tone playback', error)
    })
  }

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  const safeStartTime = typeof startTime === 'number' && !isNaN(startTime) ? startTime : 0
  const now = ctx.currentTime + safeStartTime

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, now)

  if (endFrequency !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      now + Math.max(duration, sweepDuration || duration)
    )
  }

  if (sweepDuration > 0 && endFrequency !== undefined) {
    oscillator.frequency.linearRampToValueAtTime(endFrequency, now + sweepDuration)
  }

  const peakVolume = Math.max(0.0001, volume * effectsVolume)
  gainNode.gain.setValueAtTime(0.0001, now)
  gainNode.gain.exponentialRampToValueAtTime(peakVolume, now + 0.02)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  gainNode.gain.setValueAtTime(0, now + duration)

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.start(now)
  oscillator.stop(now + duration)
}

export const initAudio = () => getAudioContext()

export const startAudioKeepAlive = () => {
  const ctx = getAudioContext()
  if (!ctx || keepAliveSource) return

  const start = () => {
    if (keepAliveSource) return

    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const samples = buffer.getChannelData(0)
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = Math.sin((index / ctx.sampleRate) * Math.PI * 2 * 220) * 0.001
    }
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    source.buffer = buffer
    source.loop = true
    gain.gain.value = 0.00001
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
    keepAliveSource = source
    keepAliveGain = gain
  }

  if (ctx.state === 'suspended') {
    ctx.resume().then(start).catch((error) => {
      console.warn('[sound] Failed to resume AudioContext keep-alive', error)
    })
  }
  else start()
}

export const stopAudioKeepAlive = () => {
  if (!keepAliveSource) return

  try {
    keepAliveSource.stop()
    keepAliveSource.disconnect()
    keepAliveGain?.disconnect()
  } catch {}

  keepAliveSource = null
  keepAliveGain = null
}

export const setEffectsVolume = (volume) => {
  const nextVolume = Number(volume)
  if (!Number.isFinite(nextVolume)) return
  effectsVolume = Math.min(1, Math.max(0, nextVolume))
  localStorage.setItem('academia_effects_volume', String(effectsVolume))
}

export const getEffectsVolume = () => effectsVolume

export const playSound = (type = 'click', fallbackNotification = null) => {
  if (isMuted) return

  const ctx = getAudioContext()
  let audioContextSuspended = false

  // Verificar estado del AudioContext antes de reproducir
  if (ctx && ctx.state === 'suspended') {
    audioContextSuspended = true
    console.warn('[sound] AudioContext is suspended, attempting resume')
    ctx.resume().catch((error) => {
      console.warn('[sound] Failed to resume AudioContext', error)
    })
  }

  // Verificar si sigue suspendido después del intento de resume
  if (ctx && ctx.state === 'suspended') {
    console.warn('[sound] AudioContext still suspended after resume attempt, using notification fallback')
    if (fallbackNotification) {
      showNotification(fallbackNotification.title, fallbackNotification.options)
    }
    return
  }

  switch (type) {
    case 'click':
      playTone({ frequency: 760, duration: 0.1, type: 'sine', volume: 0.24 })
      break
    case 'success':
      playTone({ frequency: 523.25, duration: 0.24, type: 'sine', volume: 0.28 })
      break
    case 'error':
      playTone({ frequency: 220, duration: 0.18, type: 'sawtooth', volume: 0.22, endFrequency: 120 })
      break
    case 'nav':
      playTone({ frequency: 440, duration: 0.08, type: 'triangle', volume: 0.18, endFrequency: 620 })
      break
    case 'modal-open':
      playTone({ frequency: 420, duration: 0.12, type: 'triangle', volume: 0.2, endFrequency: 720 })
      break
    case 'modal-close':
      playTone({ frequency: 720, duration: 0.12, type: 'triangle', volume: 0.2, endFrequency: 360 })
      break
    case 'task-done':
      playTone({ frequency: 392, duration: 0.12, type: 'sine', volume: 0.24, endFrequency: 660 })
      playTone({ frequency: 660, duration: 0.18, type: 'triangle', volume: 0.18, startTime: 0.08, endFrequency: 880 })
      break
    case 'task-undone':
      playTone({ frequency: 420, duration: 0.1, type: 'sawtooth', volume: 0.18, endFrequency: 260 })
      break
    case 'save':
      playTone({ frequency: 540, duration: 0.09, type: 'triangle', volume: 0.2, endFrequency: 760 })
      playTone({ frequency: 760, duration: 0.11, type: 'sine', volume: 0.18, startTime: 0.08, endFrequency: 980 })
      break
    case 'delete':
      playTone({ frequency: 260, duration: 0.12, type: 'sawtooth', volume: 0.22, endFrequency: 140 })
      playTone({ frequency: 180, duration: 0.14, type: 'square', volume: 0.14, startTime: 0.08, endFrequency: 90 })
      break
    case 'countdown':
      playTone({ frequency: 760, duration: 0.08, type: 'triangle', volume: 0.65, endFrequency: 620 })
      break
    case 'pomodoro-complete':
      // Primer ding-ding-ding (más fuerte y largo)
      playTone({ frequency: 523.25, duration: 0.3, type: 'sine', volume: 0.9, endFrequency: 523.25 })
      playTone({ frequency: 659.25, duration: 0.35, type: 'triangle', volume: 0.85, startTime: 0.35, endFrequency: 659.25 })
      playTone({ frequency: 783.99, duration: 0.4, type: 'sine', volume: 0.8, startTime: 0.75, endFrequency: 783.99 })
      // Segundo ding-ding-ding (repetición para mayor impacto)
      playTone({ frequency: 523.25, duration: 0.35, type: 'sine', volume: 0.95, startTime: 1.2, endFrequency: 523.25 })
      playTone({ frequency: 659.25, duration: 0.4, type: 'triangle', volume: 0.9, startTime: 1.55, endFrequency: 659.25 })
      playTone({ frequency: 783.99, duration: 0.5, type: 'sine', volume: 0.85, startTime: 1.95, endFrequency: 783.99 })
      break
    default:
      playTone({ frequency: 760, duration: 0.1, type: 'sine', volume: 0.24 })
      break
  }
}

export const setMuted = (muted) => {
  isMuted = muted
}

export const getMuted = () => isMuted

/**
 * Solicita permiso para notificaciones del navegador
 */
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

/**
 * Muestra una notificación del navegador
 */
export const showNotification = (title, options = {}) => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null
  }

  if (Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: true,
      ...options,
    })
  }

  return null
}
