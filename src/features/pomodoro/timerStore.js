import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTimerStore = create(
  persist(
    (set, get) => ({
      // Pomodoro configuration
      pomodoroConfig: {
        workDuration: 25, // minutos
        shortBreakDuration: 5,
        longBreakDuration: 15,
        sessionsBeforeLongBreak: 4,
      },
      
      // Pomodoro state
      pomodoroState: {
        sessionId: null,
        isRunning: false,
        isPaused: false,
        currentPhase: 'trabajo', // 'trabajo' | 'descanso_corto' | 'descanso_largo'
        startedAt: null, // timestamp
        endsAt: null, // timestamp absoluto de finalización
        remainingSeconds: 25 * 60, // segundos
        totalDuration: 25 * 60, // duración total en segundos (capturada al iniciar)
        completedSessions: 0, // sesiones de trabajo completadas hoy
        currentSessionCount: 0, // sesiones en el ciclo actual
        linkedTaskId: null, // opcional
        linkedSubjectId: null, // opcional
      },
      
      // Chronometer state
      chronometerState: {
        isRunning: false,
        isPaused: false,
        startedAt: null, // timestamp
        elapsedSeconds: 0, // segundos
      },
      
      // Pomodoro actions
      setPomodoroConfig: (config) => set({ pomodoroConfig: { ...get().pomodoroConfig, ...config } }),
      
      startPomodoro: (taskId = null, subjectId = null) => set((state) => {
        const duration = state.pomodoroConfig.workDuration * 60;
        return {
          pomodoroState: {
            ...state.pomodoroState,
            sessionId: crypto.randomUUID(),
            isRunning: true,
            isPaused: false,
            startedAt: Date.now(),
            endsAt: Date.now() + duration * 1000,
            currentPhase: 'trabajo',
            remainingSeconds: duration,
            totalDuration: duration,
            linkedTaskId: taskId,
            linkedSubjectId: subjectId,
          },
        };
      }),
      
      pausePomodoro: () => set((state) => {
        const remainingSeconds = state.pomodoroState.endsAt
          ? Math.max(0, Math.ceil((state.pomodoroState.endsAt - Date.now()) / 1000))
          : state.pomodoroState.remainingSeconds;
        return {
          pomodoroState: {
            ...state.pomodoroState,
            isRunning: false,
            isPaused: true,
            endsAt: null,
            remainingSeconds,
          },
        };
      }),
      
      resumePomodoro: () => set((state) => {
        return {
          pomodoroState: {
            ...state.pomodoroState,
            isRunning: true,
            isPaused: false,
            endsAt: Date.now() + state.pomodoroState.remainingSeconds * 1000,
          },
        };
      }),
      
      resetPomodoro: () => set((state) => {
        const duration = state.pomodoroConfig.workDuration * 60;
        return {
          pomodoroState: {
            ...state.pomodoroState,
            isRunning: false,
            isPaused: false,
            startedAt: null,
            endsAt: null,
            sessionId: null,
            remainingSeconds: duration,
            totalDuration: duration,
            currentPhase: 'trabajo',
            currentSessionCount: 0,
            linkedTaskId: null,
            linkedSubjectId: null,
          },
        };
      }),
      
      updatePomodoroRemaining: (remaining) => set((state) => ({
        pomodoroState: {
          ...state.pomodoroState,
          remainingSeconds: remaining,
        },
      })),
      
      completePomodoroSession: () => set((state) => {
        const newSessionCount = state.pomodoroState.currentSessionCount + 1;
        const completedSessions = state.pomodoroState.completedSessions + 1;
        
        // Determinar siguiente fase
        let nextPhase = 'trabajo';
        let nextDuration;
        
        if (state.pomodoroState.currentPhase === 'trabajo') {
          if (newSessionCount >= state.pomodoroConfig.sessionsBeforeLongBreak) {
            nextPhase = 'descanso_largo';
            nextDuration = state.pomodoroConfig.longBreakDuration * 60;
          } else {
            nextPhase = 'descanso_corto';
            nextDuration = state.pomodoroConfig.shortBreakDuration * 60;
          }
        } else {
          // Después de descanso, vuelta a trabajo
          nextPhase = 'trabajo';
          nextDuration = state.pomodoroConfig.workDuration * 60;
        }
        
        return {
          pomodoroState: {
            ...state.pomodoroState,
            isRunning: false,
            isPaused: false,
            startedAt: null,
            endsAt: null,
            sessionId: null,
            currentPhase: nextPhase,
            remainingSeconds: nextDuration,
            totalDuration: nextDuration,
            completedSessions,
            currentSessionCount: state.pomodoroState.currentPhase === 'trabajo' ? newSessionCount : state.pomodoroState.currentSessionCount,
          },
        };
      }),
      
      resetDailyPomodoroCount: () => set((state) => ({
        pomodoroState: {
          ...state.pomodoroState,
          completedSessions: 0,
        },
      })),
      
      // Chronometer actions
      startChronometer: () => set({
        chronometerState: {
          isRunning: true,
          isPaused: false,
          startedAt: Date.now(),
          elapsedSeconds: 0,
        },
      }),
      
      pauseChronometer: () => set((state) => ({
        chronometerState: {
          ...state.chronometerState,
          isRunning: false,
          isPaused: true,
        },
      })),
      
      resumeChronometer: () => set((state) => {
        const elapsed = Math.floor((Date.now() - state.chronometerState.startedAt) / 1000);
        return {
          chronometerState: {
            ...state.chronometerState,
            isRunning: true,
            isPaused: false,
            startedAt: Date.now() - (elapsed * 1000),
          },
        };
      }),
      
      resetChronometer: () => set({
        chronometerState: {
          isRunning: false,
          isPaused: false,
          startedAt: null,
          elapsedSeconds: 0,
        },
      }),
      
      updateChronometerElapsed: (elapsed) => set((state) => ({
        chronometerState: {
          ...state.chronometerState,
          elapsedSeconds: elapsed,
        },
      })),
    }),
    {
      name: 'timer-storage',
      partialize: (state) => ({
        pomodoroConfig: state.pomodoroConfig,
        pomodoroState: state.pomodoroState,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        pomodoroState: {
          ...currentState.pomodoroState,
          ...persistedState.pomodoroState,
        },
      }),
    }
  )
);
