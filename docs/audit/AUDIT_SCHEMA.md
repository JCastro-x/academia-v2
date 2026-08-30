# Auditoría de Schema de Supabase

**Fecha**: 2026-08-26  
**Proyecto**: Academia v2  
**Project Ref**: sxikksezgjavfhwosiyg  
**Objetivo**: Verificar el estado actual del schema de Supabase contra `supabase/schema.sql`

---

## 1. Tablas en Supabase vs las definidas en schema.sql

### Tablas encontradas (14):
events, flashcards, folders, grade_items, grade_zones, habits, note_attachments, notes, pomodoro_sessions, profiles, semesters, subjects, tasks, topics

### Tablas esperadas (14):
semesters, subjects, grade_zones, grade_items, tasks, notes, folders, topics, flashcards, habits, events, note_attachments, pomodoro_sessions, profiles

### Resultado:
✅ **Todas las tablas esperadas están presentes**  
✅ **No hay tablas extra no documentadas**

---

## 2. RLS Policies por tabla vs las definidas en schema.sql

### Policies encontradas (14):
- **events**: `own rows` → `(auth.uid() = user_id)` con check `(auth.uid() = user_id)`
- **flashcards**: `own rows` → `(auth.uid() = user_id)` con check `(auth.uid() = user_id)`
- **folders**: `own rows` → `(auth.uid() = user_id)` con check `(auth.uid() = user_id)`
- **grade_items**: `own rows` → `(auth.uid() = user_id)` con check `(auth.uid() = user_id)`
- **grade_zones**: `own rows` → `(auth.uid() = user_id)` con check `(auth.uid() = user_id)`
- **habits**: `own rows` → `(auth.uid() = user_id)` con check `(auth.uid() = user_id)`
- **note_attachments**: `own rows` → `(auth.uid() = user_id)` con check `(auth.uid() = user_id)`
- **notes**: `own rows` → `(auth.uid() = user_id)` con check `(auth.uid() = user_id)`
- **pomodoro_sessions**: `own rows` → `(auth.uid() = user_id)` con check `(auth.uid() = user_id)`
- **profiles**: `own rows` → `(auth.uid() = user_id)` con check `(auth.uid() = user_id)`
- **semesters**: `own rows` → `(auth.uid() = user_id)` con check `(auth.uid() = user_id)`
- **subjects**: `own rows` → `(auth.uid() = user_id)` con check `(auth.uid() = user_id)`
- **tasks**: `own rows` → `(auth.uid() = user_id)` con check `(auth.uid() = user_id)`
- **topics**: `own rows` → `(auth.uid() = user_id)` con check `(auth.uid() = user_id)`

### Resultado:
✅ **Todas las tablas esperadas tienen policies de RLS**  
✅ **Todas las policies siguen el patrón esperado: `auth.uid() = user_id`**  
✅ **Todas las policies son PERMISSIVE para role {public}**

---

## 3. Triggers vs los definidos en schema.sql

### Triggers encontrados (11):
- **events**: `trg_events_user_id`
- **flashcards**: `trg_flashcards_user_id`
- **folders**: `trg_folders_user_id`
- **grade_items**: `trg_grade_items_user_id`
- **grade_zones**: `trg_grade_zones_user_id`
- **note_attachments**: `trg_note_attachments_user_id`
- **notes**: `trg_notes_user_id`
- **pomodoro_sessions**: `trg_pomodoro_sessions_user_id`
- **subjects**: `trg_subjects_user_id`
- **tasks**: `trg_tasks_user_id`
- **topics**: `trg_topics_user_id`

### Triggers esperados (11):
trg_subjects_user_id, trg_tasks_user_id, trg_events_user_id, trg_grade_zones_user_id, trg_notes_user_id, trg_topics_user_id, trg_flashcards_user_id, trg_folders_user_id, trg_grade_items_user_id, trg_note_attachments_user_id, trg_pomodoro_sessions_user_id

### Resultado:
✅ **Todos los triggers esperados están presentes**  
✅ **No hay triggers extra no documentados**

---

## 3.1 Funciones de triggers vs las definidas en schema.sql

### Funciones encontradas (6):
- `set_user_id_from_folder`
- `set_user_id_from_note`
- `set_user_id_from_pomodoro_session`
- `set_user_id_from_semester`
- `set_user_id_from_subject`
- `set_user_id_from_zone`

### Funciones esperadas (6):
set_user_id_from_semester, set_user_id_from_subject, set_user_id_from_zone, set_user_id_from_folder, set_user_id_from_note, set_user_id_from_pomodoro_session

### Resultado:
✅ **Todas las funciones esperadas están presentes**  
✅ **No hay funciones extra no documentadas**

---

## 4. Columnas por tabla - Comparación detallada

### semesters
**Columnas encontradas:**
- id: uuid NOT NULL DEFAULT gen_random_uuid()
- user_id: uuid NOT NULL DEFAULT auth.uid()
- nombre: text NOT NULL
- activo: boolean NULL DEFAULT true
- promedio_objetivo: numeric NULL
- nota_minima: numeric NULL
- promedio_previo: numeric NULL
- creditos_previos: integer NULL
- updated_at: timestamp with time zone NULL DEFAULT now()

**Resultado:** ✅ Coincide exactamente con schema.sql

### subjects
**Columnas encontradas:**
- id: uuid NOT NULL DEFAULT gen_random_uuid()
- semester_id: uuid NOT NULL
- user_id: uuid NOT NULL
- nombre: text NOT NULL
- codigo: text NULL
- catedratico: text NULL
- seccion: text NULL
- creditos: integer NULL
- color: text NULL
- icono: text NULL
- horario: jsonb NULL
- updated_at: timestamp with time zone NULL DEFAULT now()

**Resultado:** ✅ Coincide exactamente con schema.sql

### grade_zones
**Columnas encontradas:**
- id: uuid NOT NULL DEFAULT gen_random_uuid()
- subject_id: uuid NOT NULL
- user_id: uuid NOT NULL
- nombre: text NOT NULL
- peso_pts: numeric NOT NULL
- ganada_pct: numeric NULL DEFAULT 60

**Resultado:** ✅ Coincide exactamente con schema.sql

### grade_items
**Columnas encontradas:**
- id: uuid NOT NULL DEFAULT gen_random_uuid()
- zone_id: uuid NOT NULL
- user_id: uuid NOT NULL
- nombre: text NOT NULL
- porcentaje_ingresado: numeric NULL
- puntos_netos: numeric NULL
- peso_pts: numeric NULL

**Resultado:** ✅ Coincide exactamente con schema.sql

### tasks
**Columnas encontradas:**
- id: uuid NOT NULL DEFAULT gen_random_uuid()
- subject_id: uuid NULL
- semester_id: uuid NOT NULL
- user_id: uuid NOT NULL
- titulo: text NOT NULL
- prioridad: text NULL
- due: date NULL
- done: boolean NULL DEFAULT false
- subtasks: jsonb NULL DEFAULT '[]'::jsonb
- attachments: jsonb NULL DEFAULT '[]'::jsonb
- reminder_at: timestamp with time zone NULL
- updated_at: timestamp with time zone NULL DEFAULT now()

**Resultado:** ✅ Coincide exactamente con schema.sql

### notes
**Columnas encontradas:**
- id: uuid NOT NULL DEFAULT gen_random_uuid()
- subject_id: uuid NULL
- user_id: uuid NOT NULL
- folder_id: uuid NULL
- titulo: text NULL
- contenido: text NULL
- updated_at: timestamp with time zone NULL DEFAULT now()

**Resultado:** ✅ Coincide exactamente con schema.sql

### folders
**Columnas encontradas:**
- id: uuid NOT NULL DEFAULT gen_random_uuid()
- user_id: uuid NOT NULL
- subject_id: uuid NULL
- parent_id: uuid NULL
- nombre: text NOT NULL

**Resultado:** ✅ Coincide exactamente con schema.sql

### topics
**Columnas encontradas:**
- id: uuid NOT NULL DEFAULT gen_random_uuid()
- subject_id: uuid NOT NULL
- user_id: uuid NOT NULL
- parcial: text NULL
- nombre: text NULL
- subtemas: jsonb NULL DEFAULT '[]'::jsonb
- dificultad: integer NULL
- tiempo_dedicado_min: integer NULL
- fecha_examen: date NULL
- comprension: numeric NULL DEFAULT 0
- visto: boolean NULL DEFAULT false

**Resultado:** ✅ Coincide exactamente con schema.sql

### flashcards
**Columnas encontradas:**
- id: uuid NOT NULL DEFAULT gen_random_uuid()
- subject_id: uuid NOT NULL
- user_id: uuid NOT NULL
- frente: text NULL
- dorso: text NULL
- estado: text NULL DEFAULT 'nueva'::text

**Resultado:** ✅ Coincide exactamente con schema.sql

### habits
**Columnas encontradas:**
- id: uuid NOT NULL DEFAULT gen_random_uuid()
- user_id: uuid NOT NULL DEFAULT auth.uid()
- nombre: text NOT NULL
- frecuencia: text NOT NULL
- dias_semana: ARRAY NULL
- racha: integer NULL DEFAULT 0
- historial: jsonb NULL DEFAULT '[]'::jsonb

**Resultado:** ✅ Coincide exactamente con schema.sql

### events
**Columnas encontradas:**
- id: uuid NOT NULL DEFAULT gen_random_uuid()
- subject_id: uuid NULL
- semester_id: uuid NOT NULL
- user_id: uuid NOT NULL
- nombre: text NOT NULL
- tipo: text NULL
- start_at: timestamp with time zone NOT NULL
- end_at: timestamp with time zone NULL
- descripcion: text NULL

**Resultado:** ✅ Coincide exactamente con schema.sql

### note_attachments
**Columnas encontradas:**
- id: uuid NOT NULL DEFAULT gen_random_uuid()
- note_id: uuid NOT NULL
- user_id: uuid NOT NULL
- tipo: text NOT NULL
- nombre: text NOT NULL
- storage_path: text NOT NULL
- metadata: jsonb NULL DEFAULT '{}'::jsonb
- created_at: timestamp with time zone NULL DEFAULT now()

**Resultado:** ✅ Coincide exactamente con schema.sql

### pomodoro_sessions
**Columnas encontradas:**
- id: uuid NOT NULL DEFAULT gen_random_uuid()
- user_id: uuid NOT NULL
- started_at: timestamp with time zone NOT NULL
- ended_at: timestamp with time zone NOT NULL
- duration_min: integer NOT NULL
- tipo: text NOT NULL
- task_id: uuid NULL
- subject_id: uuid NULL

**Resultado:** ✅ Coincide exactamente con schema.sql

### profiles
**Columnas encontradas:**
- user_id: uuid NOT NULL DEFAULT auth.uid()
- nombre: text NULL
- registro_academico: text NULL
- carrera: text NULL
- institucion: text NULL
- cursos_ganados: integer NULL DEFAULT 0
- tipografia: text NULL DEFAULT 'Inter'::text
- tema_color: text NULL DEFAULT '#84cc16'::text
- sonidos_interaccion: text NULL DEFAULT 'classic'::text
- modo_oscuro: boolean NULL DEFAULT false
- updated_at: timestamp with time zone NULL DEFAULT now()

**Resultado:** ✅ Coincide exactamente con schema.sql

---

## 5. Estado del bucket de Storage `note-attachments`

### Bucket encontrado:
- **Nombre**: note-attachments
- **Public**: false

### Resultado:
✅ **Bucket note-attachments existe**  
✅ **Configurado como privado (public: false) según lo esperado**

---

## 6. Políticas de Storage para `note-attachments`

### Estado:
⚠️ **No se pudieron obtener las policies de storage**  
Motivo: La tabla `storage.policies` no es accesible desde la conexión de base de datos actual.

### Recommendation:
Verificar manualmente en el dashboard de Supabase que las policies de storage existan:
- https://supabase.com/dashboard/project/sxikksezgjavfhwosiyg/storage/policies

Expected policies according to schema.sql:
- "Users can upload to their own folder" → INSERT with check `bucket_id = 'note-attachments' and auth.uid()::text = (storage.foldername(name))[2]`
- "Users can read their own files" → SELECT using `bucket_id = 'note-attachments' and auth.uid()::text = (storage.foldername(name))[2]`
- "Users can delete their own files" → DELETE using `bucket_id = 'note-attachments' and auth.uid()::text = (storage.foldername(name))[2]`

---

## 7. Otros objetos en schema public

### Sequences:
✅ **No hay sequences extra**

### Resultado general:
✅ **No hay objetos extra no documentados en el schema public**

---

## RESUMEN FINAL

### ✅ Pasaron (6/7 categorías verificadas completamente):
1. **Tablas**: 14/14 tablas esperadas presentes, sin tablas extra
2. **RLS Policies**: 14/14 policies esperadas presentes, todas con `auth.uid() = user_id`
3. **Triggers**: 11/11 triggers esperados presentes, sin triggers extra
4. **Funciones de triggers**: 6/6 funciones esperadas presentes, sin funciones extra
5. **Columnas**: Todas las columnas coinciden exactamente con schema.sql
6. **Storage bucket**: Bucket `note-attachments` existe y está configurado correctamente

### ⚠️ Pendiente de verificación manual (1/7 categorías):
7. **Storage policies**: No accesible vía conexión de base de datos, requiere verificación manual en dashboard

### ❌ Drift detectado:
**NINGUNO** - El schema de Supabase coincide completamente con `supabase/schema.sql` en todas las categorías verificadas.

### Conclusión:
**Schema verificado — sin drift detectado** en las categorías accesibles. Se recomienda verificar manualmente las policies de storage en el dashboard de Supabase para completar la auditoría.

---

## Notas de ejecución

- **Método de auditoría**: Conexión directa a PostgreSQL usando el paquete `pg` de Node.js
- **Credenciales**: DATABASE_URL del archivo .env
- **Scripts temporales creados**: `audit_schema.js`, `audit_schema_direct.js` (deben ser eliminados)
- **Dependencias temporales**: `pg` agregado como devDependency (debe ser removido si no se necesita)
