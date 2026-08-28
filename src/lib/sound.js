let audioContext = null
let isMuted = false

export const initAudio = () => {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null
    audioContext = new AudioContextClass()
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {})
  }

  return audioContext
}

function playTone(ctx, frequency, duration, options = {}) {
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  const now = ctx.currentTime + (options.delay || 0)
  const volume = options.volume ?? 0.06

  oscillator.type = options.type || 'sine'
  oscillator.frequency.setValueAtTime(frequency, now)
  if (options.endFrequency) {
    oscillator.frequency.linearRampToValueAtTime(options.endFrequency, now + duration)
  }

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)
  gainNode.gain.setValueAtTime(0.001, now)
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration)
  oscillator.start(now)
  oscillator.stop(now + duration + 0.02)
}

function playSequence(ctx, notes, options = {}) {
  notes.forEach((note) => {
    playTone(ctx, note.frequency, note.duration || 0.12, {
      ...options,
      delay: note.delay || 0,
      endFrequency: note.endFrequency,
    })
  })
}

export const playSound = (type = 'click') => {
  if (isMuted) return

  const ctx = initAudio()
  if (!ctx) return

  switch (type) {
    case 'nav':
      playTone(ctx, 440, 0.12, { endFrequency: 520, volume: 0.045 })
      break
    case 'click':
      playTone(ctx, 800, 0.1, { volume: 0.1 })
      break
    case 'modal-open':
      playSequence(ctx, [
        { frequency: 440, delay: 0 },
        { frequency: 554, delay: 0.05 },
        { frequency: 659, delay: 0.1 },
      ], { duration: 0.16, volume: 0.05 })
      break
    case 'modal-close':
      playSequence(ctx, [
        { frequency: 659, delay: 0 },
        { frequency: 554, delay: 0.05 },
        { frequency: 440, delay: 0.1 },
      ], { duration: 0.14, volume: 0.04 })
      break
    case 'task-done':
    case 'success':
      playSequence(ctx, [
        { frequency: 523, delay: 0 },
        { frequency: 659, delay: 0.09 },
        { frequency: 784, delay: 0.18 },
      ], { duration: 0.22, volume: 0.08 })
      break
    case 'task-undone':
      playSequence(ctx, [
        { frequency: 523, delay: 0 },
        { frequency: 415, delay: 0.1 },
      ], { duration: 0.16, volume: 0.06 })
      break
    case 'save':
      playSequence(ctx, [
        { frequency: 660, delay: 0 },
        { frequency: 880, delay: 0.1 },
      ], { duration: 0.14, volume: 0.07 })
      break
    case 'delete':
      playTone(ctx, 220, 0.2, { endFrequency: 110, type: 'triangle', volume: 0.08 })
      break
    case 'error':
      playTone(ctx, 200, 0.2, { type: 'sawtooth', volume: 0.1 })
      break
    default:
      playTone(ctx, 800, 0.1, { volume: 0.1 })
  }
}

export const setMuted = (muted) => {
  isMuted = muted
}

export const getMuted = () => isMuted
