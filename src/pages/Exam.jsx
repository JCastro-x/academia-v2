import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUIStore } from '../stores/ui.store.js';
import { playSound } from '../lib/sound.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import UndoToast from '../components/UndoToast.jsx';

export default function Exam() {
  const navigate = useNavigate();
  const { semesterId } = useParams();
  const { openConfirmDialog } = useUIStore();

  const [durationMinutes, setDurationMinutes] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);

  const intervalRef = useRef(null);

  // Timer logic usando timestamp-based approach (igual que Pomodoro)
  useEffect(() => {
    if (isRunning && startedAt) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = (durationMinutes * 60) - elapsed;

        if (remaining <= 0) {
          // Timer completado
          clearInterval(intervalRef.current);
          setIsRunning(false);
          setIsPaused(false);
          setRemainingSeconds(0);
          playSound('success');
        } else {
          setRemainingSeconds(remaining);
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
  }, [isRunning, startedAt, durationMinutes]);

  // Recalcular tiempo restante cuando la pestaña vuelve a estar visible (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isRunning && startedAt) {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = (durationMinutes * 60) - elapsed;
        setRemainingSeconds(Math.max(0, remaining));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, startedAt, durationMinutes]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setStartedAt(Date.now());
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  const handleResume = () => {
    // Recalcular startedAt para continuar desde donde quedó
    const elapsed = (durationMinutes * 60) - remainingSeconds;
    setStartedAt(Date.now() - (elapsed * 1000));
    setIsRunning(true);
    setIsPaused(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setStartedAt(null);
    setRemainingSeconds(durationMinutes * 60);
  };

  const handleExit = () => {
    if (isRunning) {
      openConfirmDialog({
        title: 'Salir del modo examen',
        message: 'El temporizador está corriendo. ¿Seguro que quieres salir? Perderás el progreso actual.',
        confirmText: 'Salir',
        onConfirm: () => navigate(`/s/${semesterId}`),
      });
    } else {
      navigate(`/s/${semesterId}`);
    }
  };

  const handleDurationChange = (value) => {
    const newDuration = parseInt(value) || 60;
    setDurationMinutes(newDuration);
    if (!isRunning && !isPaused) {
      setRemainingSeconds(newDuration * 60);
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-[var(--dm-bg)] flex flex-col items-center justify-center p-8">
      {/* Header con botón salir */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleExit}
          className="px-4 py-2 bg-gray-200 dark:bg-[var(--dm-surface)] text-gray-700 dark:text-[var(--dm-text)] rounded-lg hover:bg-gray-300 dark:hover:bg-[var(--dm-border)] transition-colors"
        >
          Salir
        </button>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-8 max-w-2xl w-full"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[var(--dm-text)]">Modo Examen</h1>

        {/* Timer display */}
        <div className="rounded-2xl py-12 px-16 inline-block text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
          <div className="text-8xl font-bold">
            {formatTime(remainingSeconds)}
          </div>
        </div>

        {/* Configuración de duración (solo cuando no está corriendo) */}
        {!isRunning && !isPaused && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--dm-text-muted)]">
              Duración (minutos)
            </label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => handleDurationChange(e.target.value)}
              className="w-32 px-4 py-2 text-center text-lg border border-gray-300 dark:border-[var(--dm-border)] rounded-lg dark:bg-[var(--dm-surface)] dark:text-[var(--dm-text)]"
              min="1"
              max="300"
              autoComplete="off"
            />
          </div>
        )}

        {/* Controles */}
        <div className="flex gap-4 justify-center">
          {!isRunning && !isPaused && (
            <button
              onClick={handleStart}
              className="text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Iniciar
            </button>
          )}
          {isRunning && (
            <button
              onClick={handlePause}
              className="bg-yellow-500 text-white px-8 py-3 rounded-lg hover:bg-yellow-600 font-medium text-lg"
            >
              Pausar
            </button>
          )}
          {isPaused && (
            <button
              onClick={handleResume}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-medium text-lg"
            >
              Reanudar
            </button>
          )}
          <button
            onClick={handleReset}
            className="bg-gray-200 text-gray-700 dark:bg-[var(--dm-surface)] dark:text-[var(--dm-text)] px-8 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-[var(--dm-border)] font-medium text-lg"
          >
            Reset
          </button>
        </div>

        {/* Estado */}
        <div className="text-sm text-gray-500 dark:text-[var(--dm-text-muted)]">
          {isRunning && 'Temporizador corriendo...'}
          {isPaused && 'Temporizador pausado'}
          {!isRunning && !isPaused && 'Listo para iniciar'}
        </div>
      </motion.div>

      {/* Componentes globales */}
      <ConfirmDialog />
      <UndoToast />
    </div>
  );
}
