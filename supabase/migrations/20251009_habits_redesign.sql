-- RESET: Borrar todo de hábitos y empezar de cero
-- Fecha: 2025-10-09

-- Borrar en orden correcto (por dependencias)
DROP TABLE IF EXISTS habit_logs CASCADE;
DROP TABLE IF EXISTS programaciones_habito CASCADE;
DROP TABLE IF EXISTS dias_pausa CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS habits_backup_20251009 CASCADE;

-- Recrear tablas vacías (mismo esquema que antes)

-- Tabla habits (solo identidad)
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  nombre TEXT NOT NULL,
  momento_dia TEXT CHECK (momento_dia IN ('manana', 'tarde', 'noche')),
  version_minima TEXT,
  archivado BOOLEAN DEFAULT false,
  fecha_archivado DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla programaciones_habito
CREATE TABLE programaciones_habito (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,

  tipo TEXT NOT NULL CHECK (tipo IN ('dias_fijos', 'meta_semanal', 'periodico', 'evitar')),
  dias_semana INTEGER[],
  meta_semanal INTEGER,
  periodo_semanas INTEGER,
  dias_sugeridos INTEGER[],
  permitir_finde_plus BOOLEAN DEFAULT false,
  tolerar_rojo_aislado BOOLEAN DEFAULT false,

  vigente_desde DATE NOT NULL DEFAULT CURRENT_DATE,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_programaciones_habito_fecha ON programaciones_habito(habit_id, vigente_desde DESC);

-- Tabla habit_logs
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,

  estado TEXT NOT NULL CHECK (estado IN ('cumplido', 'fallado', 'parcial')),

  UNIQUE(habit_id, fecha),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_habit_logs_habit_fecha ON habit_logs(habit_id, fecha);
CREATE INDEX idx_habit_logs_fecha ON habit_logs(fecha);

-- Tabla dias_pausa
CREATE TABLE dias_pausa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  fecha DATE NOT NULL,
  motivo TEXT,
  UNIQUE(user_id, fecha)
);

-- Tabla app_config
CREATE TABLE IF NOT EXISTS app_config (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  ventana_edicion_dias INTEGER DEFAULT 7,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS policies
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own habits" ON habits FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON habits FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON habits FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE programaciones_habito ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own programaciones" ON programaciones_habito FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = programaciones_habito.habit_id AND habits.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own programaciones" ON programaciones_habito FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = programaciones_habito.habit_id AND habits.user_id = auth.uid()
  ));
CREATE POLICY "Users can update own programaciones" ON programaciones_habito FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = programaciones_habito.habit_id AND habits.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own programaciones" ON programaciones_habito FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = programaciones_habito.habit_id AND habits.user_id = auth.uid()
  ));

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON habit_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own logs" ON habit_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()
  ));
CREATE POLICY "Users can update own logs" ON habit_logs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own logs" ON habit_logs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()
  ));

ALTER TABLE dias_pausa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own pause days" ON dias_pausa FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pause days" ON dias_pausa FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own pause days" ON dias_pausa FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own config" ON app_config;
DROP POLICY IF EXISTS "Users can upsert own config" ON app_config;
CREATE POLICY "Users can view own config" ON app_config FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own config" ON app_config FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
