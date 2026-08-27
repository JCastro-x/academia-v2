-- Agregar columnas para el motor de ritmo a la tabla tasks
-- tipo: distingue entre checklist (con subitems) y cantidad (basadas en cantidad/completadas)
-- total_units: cantidad total de unidades para tareas tipo cantidad (numeric para permitir progreso fraccionario)
-- work_days: array de días programados para trabajar
-- log: historial de progreso para el motor de ritmo (objeto/mapa {fecha: unidades})
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'checklist',
  ADD COLUMN IF NOT EXISTS total_units numeric,
  ADD COLUMN IF NOT EXISTS work_days int[],
  ADD COLUMN IF NOT EXISTS log jsonb default '{}',
  ADD CONSTRAINT IF NOT EXISTS check_tasks_tipo CHECK (tipo IN ('checklist', 'cantidad'));