import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTimerStore } from '../features/pomodoro/timerStore';
import { useCreatePomodoroSession, usePomodoroSessionsByDate } from '../features/pomodoro/hooks';
import { calculatePomodoroStats } from '../features/pomodoro/api';

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
  const intervalRef = useRef(null);

  // Obtener sesiones de los últimos 7 días para stats
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: sessions } = usePomodoroSessionsByDate(weekAgo.toISOString(), today.toISOString());
  const stats = sessions ? calculatePomodoroStats(sessions) : { streakDays: 0, todaySessions: 0, weekMinutes: 0, todayMinutes: 0 };

  // Timer logic usando timestamp-based approach (no setInterval tick a tick)
  useEffect(() => {
    if (pomodoroState.isRunning && pomodoroState.startedAt) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - pomodoroState.startedAt) / 1000);
        const totalDuration = pomodoroState.totalDuration;
        const remaining = totalDuration - elapsed;

        if (remaining <= 0) {
          // Timer completado
          clearInterval(intervalRef.current);
          if (pomodoroState.currentPhase === 'trabajo') {
            // Guardar sesión en DB
            const durationMin = Math.round(pomodoroConfig.workDuration);
            createSession.mutate({
              started_at: new Date(pomodoroState.startedAt).toISOString(),
              ended_at: new Date().toISOString(),
              duration_min: durationMin,
              tipo: 'trabajo',
              task_id: pomodoroState.linkedTaskId,
              subject_id: pomodoroState.linkedSubjectId,
            });
          }
          completePomodoroSession();
        } else {
          updatePomodoroRemaining(remaining);
        }
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
  }, [pomodoroState.isRunning, pomodoroState.startedAt, pomodoroState.currentPhase, pomodoroState.totalDuration, completePomodoroSession, updatePomodoroRemaining]);

  // Recalcular tiempo restante cuando la pestaña vuelve a estar visible (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && pomodoroState.isRunning && pomodoroState.startedAt) {
        const elapsed = Math.floor((Date.now() - pomodoroState.startedAt) / 1000);
        const totalDuration = pomodoroState.totalDuration;
        const remaining = totalDuration - elapsed;
        updatePomodoroRemaining(Math.max(0, remaining));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pomodoroState.isRunning, pomodoroState.startedAt, pomodoroState.totalDuration, updatePomodoroRemaining]);

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

  const getPhaseColor = () => {
    switch (pomodoroState.currentPhase) {
      case 'trabajo':
        return 'bg-blue-600';
      case 'descanso_corto':
        return 'bg-green-600';
      case 'descanso_largo':
        return 'bg-purple-600';
      default:
        return 'bg-blue-600';
    }
  };

  const handleSaveConfig = () => {
    setPomodoroConfig(configValues);
    setShowConfig(false);
    resetPomodoro();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none">
      {/* Stats panel */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3 dark:bg-[var(--dm-bg)]">
          <div className="text-2xl font-bold text-blue-600">{stats.streakDays}</div>
          <div className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">Días racha</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 dark:bg-[var(--dm-bg)]">
          <div className="text-2xl font-bold text-green-600">{stats.todaySessions}</div>
          <div className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">Sesiones hoy</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 dark:bg-[var(--dm-bg)]">
          <div className="text-2xl font-bold text-purple-600">{stats.weekMinutes}</div>
          <div className="text-xs text-gray-600 dark:text-[var(--dm-text-muted)]">Minutos semana</div>
        </div>
      </div>

      {/* Timer display */}
      <div className="text-center">
        <div className="text-sm text-gray-600 mb-2 dark:text-[var(--dm-text-muted)]">{getPhaseLabel()}</div>
        <motion.div
          key={pomodoroState.currentPhase}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-7xl font-bold text-white ${getPhaseColor()} rounded-2xl py-8 px-12 inline-block`}
        >
          {formatTime(pomodoroState.remainingSeconds)}
        </motion.div>
        <div className="mt-4 text-sm text-gray-500 dark:text-[var(--dm-text-muted)]">
          Sesión {pomodoroState.currentSessionCount + 1} de {pomodoroConfig.sessionsBeforeLongBreak}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {!pomodoroState.isRunning && !pomodoroState.isPaused && (
          <button
            onClick={() => startPomodoro()}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Iniciar
          </button>
        )}
        {pomodoroState.isRunning && (
          <button
            onClick={pausePomodoro}
            className="bg-yellow-500 text-white px-8 py-3 rounded-lg hover:bg-yellow-600 font-medium"
          >
            Pausar
          </button>
        )}
        {pomodoroState.isPaused && (
          <button
            onClick={resumePomodoro}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-medium"
          >
            Reanudar
          </button>
        )}
        <button
          onClick={resetPomodoro}
          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 font-medium dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
        >
          Reset
        </button>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]"
        >
          ⚙️
        </button>
      </div>

      {/* Config panel */}
      {showConfig && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t pt-4 space-y-3"
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
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Guardar configuración
          </button>
        </motion.div>
      )}
    </div>
  );
}
