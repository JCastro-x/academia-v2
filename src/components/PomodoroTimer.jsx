import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTimerStore } from '../features/pomodoro/timerStore';
import { cancelPomodoroNotification, schedulePomodoroNotification } from '../features/pomodoro/api';
import { requestNotificationPermission } from '../lib/sound';
import { createAmbientSound, getAmbientSoundNames } from '../lib/ambientSounds';
import {
  isPomodoroPictureInPictureSupported,
  togglePomodoroPictureInPicture,
} from '../features/pomodoro/PomodoroPictureInPicture';

export default function PomodoroTimer() {
  const {
    pomodoroConfig,
    pomodoroState,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    resetPomodoro,
    setPomodoroConfig,
    skipToNextPhase,
    skipToPreviousPhase,
  } = useTimerStore();

  const [showConfig, setShowConfig] = useState(false);
  const [configValues, setConfigValues] = useState(pomodoroConfig);
  const [showAmbientSounds, setShowAmbientSounds] = useState(false);
  const [activeAmbientSound, setActiveAmbientSound] = useState(null);
  const [ambientVolume, setAmbientVolume] = useState(0.35);
  const ambientSoundRef = useRef(null);

  useEffect(() => () => {
    ambientSoundRef.current?.stop();
  }, []);

  const handleAmbientSound = (type) => {
    if (activeAmbientSound === type) {
      ambientSoundRef.current?.stop();
      ambientSoundRef.current = null;
      setActiveAmbientSound(null);
      return;
    }

    ambientSoundRef.current?.stop();
    const nextSound = createAmbientSound(type, ambientVolume);
    if (!nextSound) return;
    ambientSoundRef.current = nextSound;
    setActiveAmbientSound(type);
  };

  const handleAmbientVolume = (event) => {
    const nextVolume = Number(event.target.value);
    setAmbientVolume(nextVolume);
    ambientSoundRef.current?.setVolume(nextVolume);
  };

  const getTotalDuration = () => {
    switch (pomodoroState.currentPhase) {
      case 'trabajo':
        return pomodoroConfig.workDuration * 60;
      case 'descanso_corto':
        return pomodoroConfig.shortBreakDuration * 60;
      case 'descanso_largo':
        return pomodoroConfig.longBreakDuration * 60;
      default:
        return pomodoroConfig.workDuration * 60;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseLabel = () => {
    switch (pomodoroState.currentPhase) {
      case 'trabajo':
        return 'Tiempo de trabajo';
      case 'descanso_corto':
        return 'Descanso corto';
      case 'descanso_largo':
        return 'Descanso largo';
      default:
        return 'Tiempo de trabajo';
    }
  };

  const handleSaveConfig = () => {
    setPomodoroConfig(configValues);
    setShowConfig(false);
    handleReset();
  };

  const handleStart = async () => {
    const permissionRequest = requestNotificationPermission();
    startPomodoro();
    await permissionRequest;
    const { pomodoroState: nextState } = useTimerStore.getState();
    const scheduledAt = new Date(nextState.endsAt).toISOString();
    try {
      await schedulePomodoroNotification(nextState.sessionId, nextState.currentPhase, scheduledAt);
    } catch (error) {
      console.warn('[pomodoro] Failed to schedule notification', error);
    }
  };

  const handleResume = async () => {
    resumePomodoro();
    const { pomodoroState: nextState } = useTimerStore.getState();
    const scheduledAt = new Date(nextState.endsAt).toISOString();
    try {
      await schedulePomodoroNotification(nextState.sessionId, nextState.currentPhase, scheduledAt);
    } catch (error) {
      console.warn('[pomodoro] Failed to reschedule notification', error);
    }
  };

  const handlePause = async () => {
    const sessionId = useTimerStore.getState().pomodoroState.sessionId;
    pausePomodoro();
    if (sessionId) {
      try {
        await cancelPomodoroNotification(sessionId);
      } catch (error) {
        console.warn('[pomodoro] Failed to cancel notification', error);
      }
    }
  };

  const handleReset = async () => {
    const sessionId = useTimerStore.getState().pomodoroState.sessionId;
    resetPomodoro();
    if (sessionId) {
      try {
        await cancelPomodoroNotification(sessionId);
      } catch (error) {
        console.warn('[pomodoro] Failed to cancel notification', error);
      }
    }
  };

  const handleSkipNext = () => {
    skipToNextPhase();
  };

  const handleSkipPrevious = () => {
    skipToPreviousPhase();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none">
      {/* Timer display */}
      <div className="text-center">
        <div className="text-sm text-gray-600 mb-2 dark:text-[var(--dm-text-muted)]">{getPhaseLabel()}</div>
        <motion.div
          key={pomodoroState.currentPhase}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="block w-fit max-w-full mx-auto text-6xl sm:text-7xl lg:text-8xl font-bold rounded-2xl py-7 px-8 sm:py-8 sm:px-12 lg:py-10 lg:px-16"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
        >
          {formatTime(pomodoroState.remainingSeconds)}
        </motion.div>
        <div className="mt-4 text-sm text-gray-500 dark:text-[var(--dm-text-muted)]">
          Sesión {pomodoroState.currentSessionCount + 1} de {pomodoroConfig.sessionsBeforeLongBreak}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 justify-center">
        {!pomodoroState.isRunning && !pomodoroState.isPaused && (
          <button
            onClick={handleSkipPrevious}
            className="bg-gray-200 text-gray-700 px-3 py-3 rounded-lg hover:bg-gray-300 font-medium dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
            title="Fase anterior"
          >
            ⏮️
          </button>
        )}
        {!pomodoroState.isRunning && !pomodoroState.isPaused && (
          <button
            onClick={handleStart}
            className="bg-[var(--color-primary)] text-[var(--color-primary-fg)] px-4 sm:px-8 py-3 rounded-lg hover:opacity-90 font-medium"
          >
            Iniciar
          </button>
        )}
        {pomodoroState.isRunning && (
          <button
            onClick={handlePause}
            className="bg-yellow-500 text-black px-4 sm:px-8 py-3 rounded-lg hover:bg-yellow-600 font-medium"
          >
            Pausar
          </button>
        )}
        {pomodoroState.isPaused && (
          <button
            onClick={handleResume}
            className="bg-green-600 text-white px-4 sm:px-8 py-3 rounded-lg hover:bg-green-700 font-medium"
          >
            Reanudar
          </button>
        )}
        <button
          onClick={handleSkipNext}
          className="bg-gray-200 text-gray-700 px-3 py-3 rounded-lg hover:bg-gray-300 font-medium dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
          title="Siguiente fase"
        >
          ⏭️
        </button>
        <button
          onClick={handleReset}
          className="bg-gray-200 text-gray-700 px-4 sm:px-8 py-3 rounded-lg hover:bg-gray-300 font-medium dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
        >
          Reset
        </button>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="bg-gray-200 text-gray-700 px-3 py-3 rounded-lg hover:bg-gray-300 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
        >
          ⚙️
        </button>
        <button
          onClick={() => setShowAmbientSounds(!showAmbientSounds)}
          className={`px-3 py-3 rounded-lg font-medium transition-colors ${showAmbientSounds || activeAmbientSound ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]' : 'bg-gray-200 text-gray-700 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]'}`}
          aria-expanded={showAmbientSounds}
          aria-controls="ambient-sounds-panel"
        >
          🎧 Música
        </button>
        <span className="relative group">
          <button
            type="button"
            onClick={togglePomodoroPictureInPicture}
            disabled={!isPomodoroPictureInPictureSupported()}
            title={isPomodoroPictureInPictureSupported() ? 'Abrir temporizador flotante' : undefined}
            aria-label="Abrir temporizador flotante"
            aria-describedby={!isPomodoroPictureInPictureSupported() ? 'pomodoro-pip-unavailable' : undefined}
            className="px-3 py-3 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
          >
            Flotante
          </button>
          {!isPomodoroPictureInPictureSupported() && (
            <span
              id="pomodoro-pip-unavailable"
              role="tooltip"
              className="pointer-events-none invisible absolute bottom-full left-1/2 z-10 mb-2 w-52 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-center text-xs text-white opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              Tu navegador no admite Picture-in-Picture.
            </span>
          )}
        </span>
      </div>

      {showAmbientSounds && (
        <div id="ambient-sounds-panel" className="rounded-xl border border-gray-200 p-4 space-y-3 dark:border-[var(--dm-border)] dark:bg-[var(--dm-bg)]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold dark:text-[var(--dm-text)]">Sonidos ambientales</h3>
            {activeAmbientSound && (
              <button
                type="button"
                onClick={() => handleAmbientSound(activeAmbientSound)}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Detener
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(getAmbientSoundNames()).map(([type, name]) => (
              <button
                key={type}
                type="button"
                onClick={() => handleAmbientSound(type)}
                aria-pressed={activeAmbientSound === type}
                className={`min-h-11 rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${activeAmbientSound === type ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-fg)]' : 'border-gray-300 bg-white text-gray-700 hover:border-[var(--color-primary)] dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)] dark:text-[var(--dm-text)]'}`}
              >
                {name}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3 text-sm dark:text-[var(--dm-text)]">
            <span>Volumen</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ambientVolume}
              onChange={handleAmbientVolume}
              className="min-w-0 flex-1 accent-[var(--color-primary)]"
              aria-label="Volumen de sonido ambiental"
            />
            <span className="w-10 text-right tabular-nums">{Math.round(ambientVolume * 100)}%</span>
          </label>
        </div>
      )}

      {/* Config panel */}
      {showConfig && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t pt-4 pb-[calc(var(--mobile-bottom-bar-height)+env(safe-area-inset-bottom)+1.5rem)] min-[640px]:pb-20 md:pb-0 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-[var(--dm-text)]">Trabajo (minutos)</label>
            <input
              type="number"
              value={configValues.workDuration}
              onChange={(e) => setConfigValues({ ...configValues, workDuration: parseInt(e.target.value) || 25 })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
              min="1"
              max="60"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-[var(--dm-text)]">Descanso corto (minutos)</label>
            <input
              type="number"
              value={configValues.shortBreakDuration}
              onChange={(e) => setConfigValues({ ...configValues, shortBreakDuration: parseInt(e.target.value) || 5 })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
              min="1"
              max="30"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-[var(--dm-text)]">Descanso largo (minutos)</label>
            <input
              type="number"
              value={configValues.longBreakDuration}
              onChange={(e) => setConfigValues({ ...configValues, longBreakDuration: parseInt(e.target.value) || 15 })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
              min="1"
              max="60"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-[var(--dm-text)]">Sesiones antes de descanso largo</label>
            <input
              type="number"
              value={configValues.sessionsBeforeLongBreak}
              onChange={(e) => setConfigValues({ ...configValues, sessionsBeforeLongBreak: parseInt(e.target.value) || 4 })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]"
              min="1"
              max="10"
              autoComplete="off"
            />
          </div>
          <button
            onClick={handleSaveConfig}
            className="w-full bg-[var(--color-primary)] text-[var(--color-primary-fg)] py-2 rounded-lg hover:opacity-90"
          >
            Guardar configuración
          </button>
        </motion.div>
      )}
    </div>
  );
}
