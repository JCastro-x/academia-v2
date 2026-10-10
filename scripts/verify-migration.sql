-- Script de verificación de migración
-- Ejecutar con: supabase db remote changes

-- 1. Conteo de filas
SELECT 'habits_backup_20251009' as tabla, COUNT(*) as count FROM habits_backup_20251009
UNION ALL
SELECT 'habits' as tabla, COUNT(*) as count FROM habits
UNION ALL
SELECT 'programaciones_habito' as tabla, COUNT(*) as count FROM programaciones_habito
UNION ALL
SELECT 'habit_logs' as tabla, COUNT(*) as count FROM habit_logs;

-- 2. Ejemplos de hábitos viejos con historial
SELECT 
  hb.id as old_id,
  hb.nombre,
  hb.historial as old_historial,
  (SELECT COUNT(*) FROM habit_logs WHERE habit_id = hb.id) as logs_count
FROM habits_backup_20251009 hb
LIMIT 3;

-- 3. Ejemplo de logs convertidos
SELECT 
  hl.habit_id,
  hl.fecha,
  hl.estado,
  h.nombre as habit_nombre
FROM habit_logs hl
JOIN habits h ON hl.habit_id = h.id
ORDER BY hl.fecha DESC
LIMIT 10;
