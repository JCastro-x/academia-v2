-- SEMILLA DE HÁBITOS - Fase 1
-- Reemplaza TU_USER_ID con tu user_id real (obtenible de auth.users)

-- Obtener tu user_id:
-- SELECT id, email FROM auth.users;

-- Reemplaza este valor con tu user_id real
DO $$
DECLARE
  v_user_id UUID := 'TU_USER_ID'; -- <-- REEMPLAZAR ESTO
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Insertar hábitos iniciales
  INSERT INTO habits (user_id, nombre, momento_dia, version_minima) VALUES
    (v_user_id, 'Despertar a las 7', 'manana', NULL),
    (v_user_id, 'Celular lejos al levantarme y desayuno', 'manana', NULL),
    (v_user_id, 'Lectura', 'manana', NULL),
    (v_user_id, 'Bloque de estudio', 'tarde', NULL),
    (v_user_id, 'Python', 'tarde', NULL),
    (v_user_id, 'Ejercicio', 'tarde', '10-15 min'),
    (v_user_id, 'Journaling corto', 'noche', NULL),
    (v_user_id, 'Dormir 10:05 con celular fuera de la cama', 'noche', NULL)
  ON CONFLICT DO NOTHING;

  -- Insertar programaciones
  INSERT INTO programaciones_habito (habit_id, tipo, dias_semana, permitir_finde_plus, tolerar_rojo_aislado, vigente_desde)
  SELECT 
    h.id,
    'dias_fijos',
    CASE 
      WHEN h.nombre IN ('Journaling corto', 'Dormir 10:05 con celular fuera de la cama') THEN ARRAY[1,2,3,4,5,6,7]
      ELSE ARRAY[1,2,3,4,5]
    END,
    false,
    false,
    v_today
  FROM habits h
  WHERE h.user_id = v_user_id
  AND h.nombre IN (
    'Despertar a las 7',
    'Celular lejos al levantarme y desayuno',
    'Lectura',
    'Bloque de estudio',
    'Python',
    'Ejercicio',
    'Journaling corto',
    'Dormir 10:05 con celular fuera de la cama'
  )
  ON CONFLICT DO NOTHING;

  -- Crear config por defecto
  INSERT INTO app_config (user_id, ventana_edicion_dias)
  VALUES (v_user_id, 7)
  ON CONFLICT (user_id) DO UPDATE SET ventana_edicion_dias = 7;
END $$;

-- Verificar conteos
SELECT 'habits' as tabla, COUNT(*) as count FROM habits;
SELECT 'programaciones_habitos' as tabla, COUNT(*) as count FROM programaciones_habito;
