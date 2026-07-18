import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTimerStore } from '../features/pomodoro/timerStore';

export default function ChronometerTimer() {
  const {
    chronometerState,
    startChronometer,
    pauseChronometer,
    resumeChronometer,
    resetChronometer,
    updateChronometerElapsed,
  } = useTimerStore();

  const intervalRef = useRef(null);

  // Timer logic usando timestamp-based approach
  useEffect(() => {
    if (chronometerState.isRunning && chronometerState.startedAt) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - chronometerState.startedAt) / 1000);
        updateChronometerElapsed(elapsed);
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
  }, [chronometerState.isRunning, chronometerState.startedAt, updateChronometerElapsed]);

  // Recalcular tiempo transcurrido cuando la pestaña vuelve a estar visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && chronometerState.isRunning && chronometerState.startedAt) {
        const elapsed = Math.floor((Date.now() - chronometerState.startedAt) / 1000);
        updateChronometerElapsed(elapsed);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [chronometerState.isRunning, chronometerState.startedAt, updateChronometerElapsed]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Timer display */}
      <div className="text-center">
        <div className="text-sm text-gray-600 mb-2">Cronómetro</div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-7xl font-bold text-gray-800 bg-gray-100 rounded-2xl py-8 px-12 inline-block"
        >
          {formatTime(chronometerState.elapsedSeconds)}
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {!chronometerState.isRunning && !chronometerState.isPaused && (
          <button
            onClick={startChronometer}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-medium"
          >
            Iniciar
          </button>
        )}
        {chronometerState.isRunning && (
          <button
            onClick={pauseChronometer}
            className="bg-yellow-500 text-white px-8 py-3 rounded-lg hover:bg-yellow-600 font-medium"
          >
            Pausar
          </button>
        )}
        {chronometerState.isPaused && (
          <button
            onClick={resumeChronometer}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-medium"
          >
            Reanudar
          </button>
        )}
        <button
          onClick={resetChronometer}
          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 font-medium"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
