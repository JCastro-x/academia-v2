let audioContext = null
let isMuted = false

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
  const now = ctx.currentTime + startTime

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

  gainNode.gain.setValueAtTime(0.0001, now)
  gainNode.gain.exponentialRampToValueAtTime(volume, now + 0.02)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.start(now)
  oscillator.stop(now + duration)
}

export const initAudio = () => getAudioContext()

export const playSound = (type = 'click') => {
  if (isMuted) return

  switch (type) {
    case 'click':
      playTone({ frequency: 760, duration: 0.1, type: 'sine', volume: 0.08 })
      break
    case 'success':
      playTone({ frequency: 523.25, duration: 0.24, type: 'sine', volume: 0.09 })
      break
    case 'error':
      playTone({ frequency: 220, duration: 0.18, type: 'sawtooth', volume: 0.07, endFrequency: 120 })
      break
    case 'nav':
      playTone({ frequency: 440, duration: 0.08, type: 'triangle', volume: 0.05, endFrequency: 620 })
      break
    case 'modal-open':
      playTone({ frequency: 420, duration: 0.12, type: 'triangle', volume: 0.06, endFrequency: 720 })
      break
    case 'modal-close':
      playTone({ frequency: 720, duration: 0.12, type: 'triangle', volume: 0.06, endFrequency: 360 })
      break
    case 'task-done':
      playTone({ frequency: 392, duration: 0.12, type: 'sine', volume: 0.08, endFrequency: 660 })
      playTone({ frequency: 660, duration: 0.18, type: 'triangle', volume: 0.06, startTime: 0.08, endFrequency: 880 })
      break
    case 'task-undone':
      playTone({ frequency: 420, duration: 0.1, type: 'sawtooth', volume: 0.05, endFrequency: 260 })
      break
    case 'save':
      playTone({ frequency: 540, duration: 0.09, type: 'triangle', volume: 0.06, endFrequency: 760 })
      playTone({ frequency: 760, duration: 0.11, type: 'sine', volume: 0.05, startTime: 0.08, endFrequency: 980 })
      break
    case 'delete':
      playTone({ frequency: 260, duration: 0.12, type: 'sawtooth', volume: 0.07, endFrequency: 140 })
      playTone({ frequency: 180, duration: 0.14, type: 'square', volume: 0.04, startTime: 0.08, endFrequency: 90 })
      break
    default:
      playTone({ frequency: 760, duration: 0.1, type: 'sine', volume: 0.08 })
      break
  }
}

export const setMuted = (muted) => {
  isMuted = muted
}

export const getMuted = () => isMuted
