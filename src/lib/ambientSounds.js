const ambientSoundNames = {
  white: 'Ruido blanco',
  cafe: 'Ruido café',
  rain: 'Lluvia',
  fire: 'Fogata',
  forest: 'Bosque',
  waves: 'Mar',
}

const createNoiseBuffer = (context) => {
  const bufferSize = context.sampleRate * 2
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
  const data = buffer.getChannelData(0)

  for (let index = 0; index < bufferSize; index += 1) {
    data[index] = Math.random() * 2 - 1
  }

  return buffer
}

const createNoiseSource = (context, buffer) => {
  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = true
  source.start()
  return source
}

const connectNoiseLayer = (context, buffer, output, settings) => {
  const source = createNoiseSource(context, buffer)
  const filter = context.createBiquadFilter()
  const gain = context.createGain()

  filter.type = settings.filterType
  filter.frequency.value = settings.frequency
  filter.Q.value = settings.q || 0.5
  gain.gain.value = settings.gain
  source.connect(filter)
  filter.connect(gain)
  gain.connect(output)

  return { source, gain }
}

const playNoiseBurst = (context, buffer, output, settings) => {
  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  const now = context.currentTime

  source.buffer = buffer
  filter.type = settings.filterType
  filter.frequency.value = settings.frequency
  filter.Q.value = settings.q || 0.5
  gain.gain.setValueAtTime(0.001, now)
  gain.gain.linearRampToValueAtTime(settings.gain, now + settings.attack)
  gain.gain.exponentialRampToValueAtTime(0.001, now + settings.attack + settings.duration)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(output)
  source.start(now)
  source.stop(now + settings.attack + settings.duration + 0.03)
}

export const getAmbientSoundNames = () => ambientSoundNames

export const createAmbientSound = (type, initialVolume = 0.18) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null

  const context = new AudioContext()
  const output = context.createGain()
  const buffer = createNoiseBuffer(context)
  const layers = []
  const timers = []
  let rainTimer = null
  const ambientGain = 0.28

  output.gain.value = initialVolume * ambientGain
  output.connect(context.destination)

  if (type === 'white') {
    layers.push(connectNoiseLayer(context, buffer, output, {
      filterType: 'lowpass',
      frequency: 7200,
      gain: 0.8,
    }))
  } else if (type === 'cafe') {
    layers.push(connectNoiseLayer(context, buffer, output, {
      filterType: 'bandpass',
      frequency: 480,
      q: 0.35,
      gain: 0.7,
    }))
    layers.push(connectNoiseLayer(context, buffer, output, {
      filterType: 'bandpass',
      frequency: 1800,
      q: 0.8,
      gain: 0.25,
    }))
    const cafePulse = () => {
      playNoiseBurst(context, buffer, output, {
        filterType: 'bandpass',
        frequency: 2400 + Math.random() * 1000,
        q: 2,
        gain: 0.06,
        attack: 0.01,
        duration: 0.08,
      })
    }
    timers.push(window.setInterval(cafePulse, 900 + Math.random() * 1800))
  } else if (type === 'rain') {
    layers.push(connectNoiseLayer(context, buffer, output, {
      filterType: 'bandpass',
      frequency: 650,
      q: 0.8,
      gain: 0.04,
    }))
    const raindrop = () => {
      playNoiseBurst(context, buffer, output, {
        filterType: 'lowpass',
        frequency: 4200 + Math.random() * 2200,
        q: 0.35,
        gain: 0.09,
        attack: 0.002,
        duration: 0.025 + Math.random() * 0.06,
      })
      rainTimer = window.setTimeout(raindrop, 180 + Math.random() * 500)
    }
    rainTimer = window.setTimeout(raindrop, 100)
  } else if (type === 'fire') {
    const fireLayer = connectNoiseLayer(context, buffer, output, {
      filterType: 'lowpass',
      frequency: 650,
      q: 0.7,
      gain: 0.75,
    })
    const pulse = context.createOscillator()
    const pulseGain = context.createGain()
    pulse.type = 'sine'
    pulse.frequency.value = 0.18
    pulseGain.gain.value = 0.18
    pulse.connect(pulseGain)
    pulseGain.connect(fireLayer.gain.gain)
    pulse.start()
    layers.push({ ...fireLayer, extraNodes: [pulse, pulseGain] })
  } else if (type === 'forest') {
    layers.push(connectNoiseLayer(context, buffer, output, {
      filterType: 'lowpass',
      frequency: 360,
      q: 0.35,
      gain: 0.7,
    }))
    layers.push(connectNoiseLayer(context, buffer, output, {
      filterType: 'bandpass',
      frequency: 950,
      q: 0.8,
      gain: 0.16,
    }))
    const chirp = () => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const now = context.currentTime
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(1100 + Math.random() * 500, now)
      oscillator.frequency.exponentialRampToValueAtTime(1800 + Math.random() * 700, now + 0.16)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.08, now + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
      oscillator.connect(gain)
      gain.connect(output)
      oscillator.start(now)
      oscillator.stop(now + 0.22)
    }
    timers.push(window.setInterval(chirp, 4500 + Math.random() * 3500))
  } else if (type === 'waves') {
    const waveLayer = connectNoiseLayer(context, buffer, output, {
      filterType: 'lowpass',
      frequency: 520,
      q: 0.5,
      gain: 0.8,
    })
    const swell = context.createOscillator()
    const swellGain = context.createGain()
    swell.type = 'sine'
    swell.frequency.value = 0.08
    swellGain.gain.value = 0.22
    swell.connect(swellGain)
    swellGain.connect(waveLayer.gain.gain)
    swell.start()
    layers.push({ ...waveLayer, extraNodes: [swell, swellGain] })
  }

  const resume = context.state === 'suspended' ? context.resume() : Promise.resolve()

  return {
    name: ambientSoundNames[type] || type,
    ready: resume,
    setVolume: (volume) => {
      output.gain.setTargetAtTime(volume * ambientGain, context.currentTime, 0.03)
    },
    stop: () => {
      timers.forEach((timer) => window.clearInterval(timer))
      if (rainTimer) window.clearTimeout(rainTimer)
      layers.forEach(({ source, extraNodes = [] }) => {
        source.stop()
        extraNodes.forEach((node) => node.stop?.())
      })
      output.disconnect()
      context.close()
    },
  }
}
