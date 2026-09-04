import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTimerStore } from '../features/pomodoro/timerStore';
import { useCreatePomodoroSession, usePomodoroSessionsByDate } from '../features/pomodoro/hooks';
import { calculatePomodoroStats } from '../features/pomodoro/api';
import { cancelPomodoroNotification, schedulePomodoroNotification } from '../features/pomodoro/api';
import { initAudio, playSound, startAudioKeepAlive, stopAudioKeepAlive } from '../lib/sound';
import { createAmbientSound, getAmbientSoundNames } from '../lib/ambientSounds';

export default function PomodoroTimer() {
  const {
    pomodoroConfig,
    pomodoroState,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    resetPomodoro,
    updatePomodoroRemaining,
    completePomodoroSession,
    setPomodoroConfig,
  } = useTimerStore();

  const createSession = useCreatePomodoroSession();
  const [showConfig, setShowConfig] = useState(false);
  const [configValues, setConfigValues] = useState(pomodoroConfig);
  const [showAmbientSounds, setShowAmbientSounds] = useState(false);
  const [activeAmbientSound, setActiveAmbientSound] = useState(null);
  const [ambientVolume, setAmbientVolume] = useState(0.35);
  const intervalRef = useRef(null);
  const lastCountdownSecondRef = useRef(null);
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

  useEffect(() => {
    if (pomodoroState.isRunning) startAudioKeepAlive();
    else stopAudioKeepAlive();
  }, [pomodoroState.isRunning]);

  const triggerCountdownSound = (remainingSeconds) => {
    if (remainingSeconds > 10 || remainingSeconds <= 0) {
      if (remainingSeconds > 10) {
        lastCountdownSecondRef.current = null;
      }
      return;
    }

    const thisSecond = Math.ceil(remainingSeconds);
    if (thisSecond !== lastCountdownSecondRef.current) {
      lastCountdownSecondRef.current = thisSecond;
      playSound('countdown');
    }
  };

  // Obtener sesiones de los últimos 7 días para stats
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: sessions } = usePomodoroSessionsByDate(weekAgo.toISOString(), today.toISOString());
  const stats = sessions ? calculatePomodoroStats(sessions) : { todaySessions: 0, todayMinutes: 0 };

  const finishPomodoro = () => {
    const currentState = useTimerStore.getState();
    const current = currentState.pomodoroState;
    if (!current.isRunning || !current.endsAt || Date.now() < current.endsAt) return false;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    lastCountdownSecondRef.current = null;
    initAudio();
    playSound('pomodoro-complete');
    if (current.currentPhase === 'trabajo') {
      const durationMin = Math.round(currentState.pomodoroConfig.workDuration);
      createSession.mutate({
        id: current.sessionId,
        started_at: new Date(current.startedAt).toISOString(),
        ended_at: new Date().toISOString(),
        duration_min: durationMin,
        tipo: 'trabajo',
        task_id: current.linkedTaskId,
        subject_id: current.linkedSubjectId,
      });
    }
    completePomodoroSession();
    return true;
  };

  // The interval only refreshes the display. The absolute deadline controls completion.
  useEffect(() => {
    if (pomodoroState.isRunning && pomodoroState.endsAt) {
      const updateTimer = () => {
        const current = useTimerStore.getState().pomodoroState;
        const remaining = Math.max(0, Math.ceil((current.endsAt - Date.now()) / 1000));
        if (remaining <= 0) {
          finishPomodoro();
          return;
        }
        triggerCountdownSound(remaining);
        updatePomodoroRemaining(remaining);
      };

      updateTimer();
      intervalRef.current = setInterval(() => {
        updateTimer();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pomodoroState.isRunning, pomodoroState.endsAt, completePomodoroSession, updatePomodoroRemaining]);

  // Recalcular tiempo restante cuando la pestaña vuelve a estar visible (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && pomodoroState.isRunning && pomodoroState.endsAt) {
        if (finishPomodoro()) return;
        const remaining = Math.max(0, Math.ceil((pomodoroState.endsAt - Date.now()) / 1000));
        triggerCountdownSound(remaining);
        updatePomodoroRemaining(remaining);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pomodoroState.isRunning, pomodoroState.endsAt, updatePomodoroRemaining]);

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
    lastCountdownSecondRef.current = null;
    handleReset();
  };

  const handleStart = async () => {
    initAudio();
    startAudioKeepAlive();
    startPomodoro();
    const { pomodoroState: nextState } = useTimerStore.getState();
    const scheduledAt = new Date(nextState.endsAt).toISOString();
    try {
      await schedulePomodoroNotification(nextState.sessionId, nextState.currentPhase, scheduledAt);
    } catch (error) {
      console.warn('[pomodoro] Failed to schedule notification', error);
    }
  };

  const handleResume = async () => {
    initAudio();
    startAudioKeepAlive();
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none">
      {/* Stats panel */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3 dark:bg-[var(--dm-bg)]">
          <div className="text-2xl font-bold text-green-600">{stats.todaySessions}</div>
          <div className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">Sesiones hoy</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 dark:bg-[var(--dm-bg)]">
          <div className="text-2xl font-bold text-purple-600">{stats.todayMinutes}</div>
          <div className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">Minutos hoy</div>
        </div>
      </div>

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
          className="border-t pt-4 pb-20 md:pb-0 space-y-3"
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
