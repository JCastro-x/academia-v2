import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  pomodoroQueryKeys,
  getPomodoroSessionsByDate,
  getPomodoroSessionsByTask,
  getPomodoroSessionsBySubject,
  getPomodoroSessionById,
  createPomodoroSession,
  deletePomodoroSession,
} from './api';

/**
 * Hook para obtener sesiones de pomodoro por rango de fechas
 */
export function usePomodoroSessionsByDate(startDate, endDate) {
  return useQuery({
    queryKey: pomodoroQueryKeys.byDate(startDate, endDate),
    queryFn: () => getPomodoroSessionsByDate(startDate, endDate),
  });
}

/**
 * Hook para obtener sesiones de pomodoro por tarea
 */
export function usePomodoroSessionsByTask(taskId) {
  return useQuery({
    queryKey: pomodoroQueryKeys.byTask(taskId),
    queryFn: () => getPomodoroSessionsByTask(taskId),
    enabled: !!taskId,
  });
}

/**
 * Hook para obtener sesiones de pomodoro por materia
 */
export function usePomodoroSessionsBySubject(subjectId) {
  return useQuery({
    queryKey: pomodoroQueryKeys.bySubject(subjectId),
    queryFn: () => getPomodoroSessionsBySubject(subjectId),
    enabled: !!subjectId,
  });
}

/**
 * Hook para obtener una sesión de pomodoro por ID
 */
export function usePomodoroSession(id) {
  return useQuery({
    queryKey: pomodoroQueryKeys.byId(id),
    queryFn: () => getPomodoroSessionById(id),
    enabled: !!id,
  });
}

/**
 * Hook para crear una sesión de pomodoro
 */
export function useCreatePomodoroSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPomodoroSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pomodoroQueryKeys.all });
    },
  });
}

/**
 * Hook para eliminar una sesión de pomodoro
 */
export function useDeletePomodoroSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deletePomodoroSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pomodoroQueryKeys.all });
    },
  });
}
