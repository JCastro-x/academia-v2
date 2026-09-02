let audioContext = null
let isMuted = false
let effectsVolume = Number(localStorage.getItem('academia_effects_volume'))
if (!Number.isFinite(effectsVolume)) effectsVolume = 1
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
    audioContext.resume().catch(() => {})
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

  if (ctx.state === 'suspended') ctx.resume().then(start).catch(() => {})
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

export const playSound = (type = 'click') => {
  if (isMuted) return

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
      playTone({ frequency: 760, duration: 0.08, type: 'triangle', volume: 0.24, endFrequency: 620 })
      break
    case 'pomodoro-complete':
      playTone({ frequency: 440, duration: 0.18, type: 'triangle', volume: 0.28, endFrequency: 520 })
      playTone({ frequency: 554.37, duration: 0.2, type: 'sine', volume: 0.28, startTime: 0.2, endFrequency: 660 })
      playTone({ frequency: 698.46, duration: 0.28, type: 'triangle', volume: 0.24, startTime: 0.42, endFrequency: 820 })
      playTone({ frequency: 880, duration: 0.24, type: 'sine', volume: 0.2, startTime: 0.72, endFrequency: 980 })
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
