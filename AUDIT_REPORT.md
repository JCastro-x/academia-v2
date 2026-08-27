# AUDIT REPORT — Academia v2

## 0. Resumen Ejecutivo
Aplicación web de gestión académica personal (SPA) construida con React 18, Vite 5, Supabase (backend-as-a-service con PostgreSQL), React Query (TanStack Query) para data fetching, Zustand para estado global, Tailwind CSS para estilos y Framer Motion para animaciones. Permite gestión de semestres, materias, tareas, calificaciones, notas con adjuntos, hábitos, eventos calendario, timer Pomodoro y cronómetro. Autenticación vía Google OAuth. Soporta modo invitado (local-only) y modo autenticado con sincronización en Supabase. Incluye backup/export de datos, cálculo de notas y estadísticas. Estado: funcional, con tests unitarios en dominio de cálculo de notas.

## 1. Mapeo Estructural y Dependencias

### 1.1 Árbol de Directorios

**Exclusiones declaradas:**
- `node_modules/` - Dependencias de npm (excluido por tamaño y naturaleza autogenerada)
- `.vite/` - Cache de Vite (excluido por ser autogenerado)
- `dist/` - Build output (excluido por ser autogenerado)
- `.git/` - Control de versiones (excluido por ser autogenerado)

| Ruta | Propósito | Archivos clave dentro |
|---|---|---|
| `/` | Raíz del proyecto | package.json, vite.config.js, tailwind.config.js, vitest.config.js, postcss.config.js, index.html, .env.example, README.md |
| `/public` | Assets estáticos servidos directamente | favicon.svg, favicon.png, icon-*.png, manifest.json, landing.html, privacy.html, terms.html |
| `/src` | Código fuente de la aplicación | main.tsx (entry point) |
| `/src/assets/logos` | Logos e imágenes estáticas | logo.png, logo.svg |
| `/src/components` | Componentes UI reutilizables | TaskForm.jsx, SubjectForm.jsx, NoteEditor.jsx, DrawingCanvas.jsx, PomodoroTimer.jsx, ChronometerTimer.jsx, TopBar.jsx, ModalWrapper.jsx, ConfirmDialog.jsx, UndoToast.jsx, Lightbox.jsx, QuickAdd.jsx, FolderForm.jsx, HabitForm.jsx, NoteForm.jsx, TaskCard.jsx, TaskList.jsx, SubjectCard.jsx |
| `/src/domain` | Lógica de negocio pura (sin React/Supabase) | grades-calc.js (cálculos de notas), grades-calc.test.js (tests unitarios) |
| `/src/features` | Feature-based architecture (API + hooks) | semesters/, subjects/, tasks/, grades/, notes/, folders/, habits/, events/, topics/, note-attachments/, pomodoro/, profile/ |
| `/src/features/[nombre]/api.js` | Funciones de API para cada feature (Supabase client) | Todas las features tienen api.js con funciones CRUD y query keys |
| `/src/features/[nombre]/hooks.js` | React Query hooks para cada feature | Todas las features tienen hooks.js con useQuery/useMutation |
| `/src/features/grades/components` | Componentes específicos de calificaciones | ZoneForm.jsx, ItemForm.jsx, ZoneCard.jsx |
| `/src/features/pomodoro/timerStore.js` | Zustand store para timer (pomodoro + cronómetro) | Configuración y estado de timer persistido en localStorage |
| `/src/layouts` | Layouts de la aplicación | AppLayout.jsx (sidebar + header + main content) |
| `/src/lib` | Utilidades y configuración | supabase.js (cliente Supabase), queryClient.js (React Query config), exportData.js, importData.js, pdf-extract.js, sound.js |
| `/src/pages` | Páginas de la aplicación (rutas) | Auth.jsx, AuthCallback.jsx, Overview.jsx, Subjects.jsx, Tasks.jsx, Schedule.jsx, Grades.jsx, Calendar.jsx, Notes.jsx, Habits.jsx, Clock.jsx, Profile.jsx, Exam.jsx, CreateFirstSemester.jsx |
| `/src/stores` | Zustand stores globales | ui.store.js (UI state: modals, toasts, sidebar, tema, etc.) |
| `/src/styles` | Estilos globales | index.css |
| `/supabase` | Configuración de base de datos Supabase | schema.sql (DDL completo de todas las tablas, triggers, RLS policies) |

### 1.2 Dependencias

| Paquete | Versión exacta | Tipo (prod/dev) | Uso concreto en el proyecto (dónde y para qué se usa) |
|---|---|---|---|
| @supabase/supabase-js | ^2.39.0 | prod | Cliente oficial de Supabase usado en src/lib/supabase.js para autenticación, CRUD de base de datos y Storage |
| @tanstack/react-query | ^5.17.0 | prod | Data fetching y caching usado en todos los hooks de features (useQuery, useMutation) configurado en src/lib/queryClient.js |
| docutext | ^1.2.1 | prod | Extracción de texto de PDFs usado en src/lib/pdf-extract.js para procesar archivos PDF en notas |
| fflate | ^0.8.3 | prod | ⚠️ POSIBLEMENTE NO UTILIZADO - No se encontraron referencias en el código analizado |
| framer-motion | ^10.16.16 | prod | Animaciones de componentes usado en múltiples páginas (Calendar.jsx, Habits.jsx, Profile.jsx, Clock.jsx, etc.) |
| react | ^18.2.0 | prod | Framework UI principal usado en toda la aplicación |
| react-dom | ^18.2.0 | prod | DOM renderer de React usado en src/main.tsx |
| react-painter | ^1.0.1 | prod | Componente de dibujo (canvas) usado en src/components/DrawingCanvas.jsx para dibujos en notas |
| react-router-dom | ^6.21.0 | prod | Enrutamiento de la SPA usado en src/main.tsx para todas las rutas |
| zustand | ^4.4.7 | prod | State management global usado en src/stores/ui.store.js y src/features/pomodoro/timerStore.js |
| @types/react | ^18.2.43 | dev | TypeScript types para React (aunque el proyecto usa JS, se usan para desarrollo) |
| @types/react-dom | ^18.2.17 | dev | TypeScript types para React DOM |
| @vitejs/plugin-react | ^4.2.1 | dev | Plugin de Vite para React usado en vite.config.js |
| autoprefixer | ^10.4.16 | dev | PostCSS plugin para prefijos de CSS usado en postcss.config.js |
| jsdom | ^23.0.1 | dev | DOM environment para tests usado en vitest.config.js |
| postcss | ^8.4.32 | dev | PostCSS processor usado en postcss.config.js |
| tailwindcss | ^3.4.0 | dev | Framework de CSS utility-first usado en tailwind.config.js y src/styles/index.css |
| vite | ^5.0.8 | dev | Build tool y dev server usado en vite.config.js y scripts de package.json |
| vitest | ^1.1.0 | dev | Testing framework usado en vitest.config.js y src/domain/grades-calc.test.js |

### 1.3 Variables de Entorno

| Variable | ¿Dónde se consume (archivo/línea)? | ¿Tiene valor por defecto? | ¿Es secreta/sensible? | Descripción funcional |
|---|---|---|---|---|
| VITE_SUPABASE_URL | src/lib/supabase.js:3 | No | Sí | URL del proyecto Supabase (ej. https://xyz.supabase.co) |
| VITE_SUPABASE_ANON_KEY | src/lib/supabase.js:4 | No | Sí | Clave anónima pública de Supabase para acceso desde cliente |

### 1.4 Build y Deploy

**Entorno de ejecución objetivo:**
- Runtime: Navegador web (moderno)
- Build: Vite 5.0.8 (bundler dev/prod)
- Framework: React 18.2.0
- Hosting: Cualquier hosting estático (Vercel, Netlify, etc.) + Supabase como backend

**Scripts de build/deploy (package.json:6-10):**
```json
{
  "dev": "vite",              // Dev server con HMR
  "build": "vite build",      // Build de producción a /dist
  "preview": "vite preview",  // Preview del build de producción
  "test": "vitest"            // Ejecutar tests con Vitest
}
```

**Configuración de Vite (vite.config.js:1-6):**
- Plugin: @vitejs/plugin-react para JSX
- Configuración por defecto de Vite

**Configuración de Tailwind (tailwind.config.js:1-12):**
- Dark mode: class-based
- Content paths: index.html, src/**/*.{js,ts,jsx,tsx}
- Sin plugins adicionales

**Configuración de tests (vitest.config.js:1-10):**
- Environment: jsdom
- Globals: true (describe/it/expect sin import)
- Plugin: @vitejs/plugin-react

**Configuración de PostCSS (postcss.config.js:1-6):**
- Plugins: tailwindcss, autoprefixer

## 2. Auditoría Técnica

### 2.1 Modelos de Datos

**Entidades principales (supabase/schema.sql):**

| Entidad | Tabla | Descripción |
|---|---|---|
| Semesters | semesters | Periodos académicos del usuario |
| Subjects | subjects | Materias/cursos dentro de un semestre |
| Grade Zones | grade_zones | Zonas de ponderación de notas (ej. "Parciales 40%") |
| Grade Items | grade_items | Ítems individuales de calificación dentro de una zona |
| Tasks | tasks | Tareas/assignments con fechas de entrega |
| Notes | notes | Notas de texto enriquecido |
| Folders | folders | Carpetas para organizar notas (estructura jerárquica) |
| Topics | topics | Temas/sílabas de un curso con seguimiento de progreso |
| Flashcards | flashcards | Tarjetas de memoria (tabla existe pero no implementada en UI) |
| Habits | habits | Hábitos diarios/semanales con tracking de rachas |
| Events | events | Eventos calendario (exámenes, clases, etc.) |
| Note Attachments | note_attachments | Adjuntos de notas (imágenes, dibujos, PDFs) en Supabase Storage |
| Pomodoro Sessions | pomodoro_sessions | Historial de sesiones de Pomodoro completadas |
| Profiles | profiles | Perfil de usuario con preferencias y datos personales |

**Esquemas detallados:**

**semesters:**
| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | Identificador único |
| user_id | uuid | FK → auth.users, NOT NULL, default auth.uid() | ID del usuario dueño |
| nombre | text | NOT NULL | Nombre del semestre |
| activo | boolean | default true | Semestre activo actual |
| promedio_objetivo | numeric | NULLABLE | Promedio objetivo del semestre |
| nota_minima | numeric | NULLABLE | Nota mínima para aprobar |
| promedio_previo | numeric | NULLABLE | Promedio acumulado anterior |
| creditos_previos | int | NULLABLE | Créditos acumulados anteriores |
| updated_at | timestamptz | default now() | Timestamp de última actualización |

**subjects:**
| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | Identificador único |
| semester_id | uuid | FK → semesters, NOT NULL | ID del semestre padre |
| user_id | uuid | NOT NULL (trigger desde semester) | ID del usuario dueño |
| nombre | text | NOT NULL | Nombre de la materia |
| codigo | text | NULLABLE | Código de la materia |
| catedratico | text | NULLABLE | Nombre del catedrático |
| seccion | text | NULLABLE | Sección |
| creditos | int | NULLABLE | Créditos de la materia |
| color | text | NULLABLE | Color hex para UI |
| icono | text | NULLABLE | Emoji/icono para UI |
| horario | jsonb | NULLABLE | Horario en formato JSON |
| updated_at | timestamptz | default now() | Timestamp de última actualización |

**grade_zones:**
| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | Identificador único |
| subject_id | uuid | FK → subjects, NOT NULL | ID de la materia padre |
| user_id | uuid | NOT NULL (trigger desde subject) | ID del usuario dueño |
| nombre | text | NOT NULL | Nombre de la zona (ej. "Parciales") |
| peso_pts | numeric | NOT NULL | Peso en puntos de la zona |
| ganada_pct | numeric | default 60 | Porcentaje para considerar zona ganada |

**grade_items:**
| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | Identificador único |
| zone_id | uuid | FK → grade_zones, NOT NULL | ID de la zona padre |
| user_id | uuid | NOT NULL (trigger desde zone) | ID del usuario dueño |
| nombre | text | NOT NULL | Nombre del ítem (ej. "Parcial 1") |
| porcentaje_ingresado | numeric | NULLABLE | Porcentaje obtenido (0-100) |
| puntos_netos | numeric | NULLABLE | Puntos netos calculados |
| peso_pts | numeric | NULLABLE | Peso en puntos del ítem |

**tasks:**
| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | Identificador único |
| subject_id | uuid | FK → subjects, NULLABLE | ID de la materia opcional |
| semester_id | uuid | FK → semesters, NOT NULL | ID del semestre padre |
| user_id | uuid | NOT NULL (trigger desde semester) | ID del usuario dueño |
| titulo | text | NOT NULL | Título de la tarea |
| prioridad | text | NULLABLE | Prioridad (baja/media/alta) |
| due | date | NULLABLE | Fecha de entrega |
| done | boolean | default false | Estado de completado |
| subtasks | jsonb | default '[]' | Array de subtareas |
| attachments | jsonb | default '[]' | Array de adjuntos |
| reminder_at | timestamptz | NULLABLE | Timestamp de recordatorio |
| updated_at | timestamptz | default now() | Timestamp de última actualización |

**notes:**
| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | Identificador único |
| subject_id | uuid | FK → subjects, NULLABLE | ID de la materia opcional |
| user_id | uuid | NOT NULL (trigger desde subject) | ID del usuario dueño |
| folder_id | uuid | FK → folders, NULLABLE | ID de la carpeta padre |
| titulo | text | NULLABLE | Título de la nota |
| contenido | text | NULLABLE | Contenido HTML enriquecido |
| updated_at | timestamptz | default now() | Timestamp de última actualización |

**folders:**
| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | Identificador único |
| user_id | uuid | NOT NULL (trigger desde parent o auth.uid()) | ID del usuario dueño |
| subject_id | uuid | FK → subjects, NULLABLE | ID de la materia opcional |
| parent_id | uuid | FK → folders, NULLABLE | ID de la carpeta padre (recursivo) |
| nombre | text | NOT NULL | Nombre de la carpeta |

**topics:**
| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | Identificador único |
| subject_id | uuid | FK → subjects, NOT NULL | ID de la materia padre |
| user_id | uuid | NOT NULL (trigger desde subject) | ID del usuario dueño |
| parcial | text | NULLABLE | Parcial (ej. "Parcial 1") |
| nombre | text | NULLABLE | Nombre del tema |
| subtemas | jsonb | default '[]' | Array de subtemas |
| dificultad | int | NULLABLE | Dificultad (1-5) |
| tiempo_dedicado_min | int | NULLABLE | Tiempo dedicado en minutos |
| fecha_examen | date | NULLABLE | Fecha del examen |
| comprension | numeric | default 0 | Nivel de comprensión (0-100) |
| visto | boolean | default false | Estado de visto |

**flashcards:**
| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | Identificador único |
| subject_id | uuid | FK → subjects, NOT NULL | ID de la materia padre |
| user_id | uuid | NOT NULL (trigger desde subject) | ID del usuario dueño |
| frente | text | NULLABLE | Texto del frente |
| dorso | text | NULLABLE | Texto del dorso |
| estado | text | default 'nueva' | Estado de la tarjeta |

**habits:**
| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | Identificador único |
| user_id | uuid | FK → auth.users, NOT NULL, default auth.uid() | ID del usuario dueño |
| nombre | text | NOT NULL | Nombre del hábito |
| frecuencia | text | NOT NULL | 'diario' o 'semanal' |
| dias_semana | int[] | NULLABLE | Array de días [1-7] para frecuencia semanal |
| racha | int | default 0 | Días consecutivos completados |
| historial | jsonb | default '[]' | Array de fechas completadas ['YYYY-MM-DD', ...] |

**events:**
| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | Identificador único |
| subject_id | uuid | FK → subjects, NULLABLE | ID de la materia opcional |
| semester_id | uuid | FK → semesters, NOT NULL | ID del semestre padre |
| user_id | uuid | NOT NULL (trigger desde semester) | ID del usuario dueño |
| nombre | text | NOT NULL | Nombre del evento |
| tipo | text | NULLABLE | Tipo de evento |
| start_at | timestamptz | NOT NULL | Timestamp de inicio |
| end_at | timestamptz | NULLABLE | Timestamp de fin |
| descripcion | text | NULLABLE | Descripción del evento |

**note_attachments:**
| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | Identificador único |
| note_id | uuid | FK → notes, NOT NULL | ID de la nota padre |
| user_id | uuid | NOT NULL (trigger desde note) | ID del usuario dueño |
| tipo | text | NOT NULL | 'imagen', 'dibujo', o 'pdf' |
| nombre | text | NOT NULL | Nombre del archivo |
| storage_path | text | NOT NULL | Path en Supabase Storage |
| metadata | jsonb | default '{}' | Metadatos adicionales |
| created_at | timestamptz | default now() | Timestamp de creación |

**pomodoro_sessions:**
| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | Identificador único |
| user_id | uuid | NOT NULL (trigger desde auth.uid()) | ID del usuario dueño |
| started_at | timestamptz | NOT NULL | Timestamp de inicio |
| ended_at | timestamptz | NOT NULL | Timestamp de fin |
| duration_min | int | NOT NULL | Duración en minutos |
| tipo | text | NOT NULL | 'trabajo', 'descanso_corto', o 'descanso_largo' |
| task_id | uuid | FK → tasks, NULLABLE | ID de la tarea opcional |
| subject_id | uuid | FK → subjects, NULLABLE | ID de la materia opcional |

**profiles:**
| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| user_id | uuid | PK, FK → auth.users, NOT NULL, default auth.uid() | ID del usuario |
| nombre | text | NULLABLE | Nombre personal |
| registro_academico | text | NULLABLE | Registro académico |
| carrera | text | NULLABLE | Carrera |
| institucion | text | NULLABLE | Institución |
| cursos_ganados | int | default 0 | Cursos ganados |
| tipografia | text | default 'Inter' | Tipografía preferida |
| tema_color | text | default '#84cc16' | Color de tema hex |
| sonidos_interaccion | text | default 'classic' | Sonidos de interacción |
| modo_oscuro | boolean | default false | Modo oscuro |
| updated_at | timestamptz | default now() | Timestamp de última actualización |

**Relaciones entre entidades:**
- **semesters (1) → (N) subjects**: Un semestre tiene muchas materias
- **subjects (1) → (N) grade_zones**: Una materia tiene muchas zonas de calificación
- **grade_zones (1) → (N) grade_items**: Una zona tiene muchos ítems de calificación
- **semesters (1) → (N) tasks**: Un semestre tiene muchas tareas
- **subjects (1) → (N) tasks**: Una materia puede tener tareas (opcional)
- **folders (1) → (N) folders**: Carpetas recursivas (parent_id)
- **folders (1) → (N) notes**: Una carpeta tiene muchas notas
- **subjects (1) → (N) notes**: Una materia puede tener notas (opcional)
- **subjects (1) → (N) topics**: Una materia tiene muchos temas
- **subjects (1) → (N) flashcards**: Una materia tiene muchas flashcards
- **notes (1) → (N) note_attachments**: Una nota tiene muchos adjuntos
- **auth.users (1) → (1) profiles**: Un usuario tiene un perfil
- **auth.users (1) → (N) semesters**: Un usuario tiene muchos semestres
- **auth.users (1) → (N) habits**: Un usuario tiene muchos hábitos
- **auth.users (1) → (N) pomodoro_sessions**: Un usuario tiene muchas sesiones

**Triggers de denormalización (user_id):**
- `set_user_id_from_semester()`: subjects, tasks, events heredan user_id de semester
- `set_user_id_from_subject()`: grade_zones, notes, topics, flashcards heredan user_id de subject
- `set_user_id_from_zone()`: grade_items heredan user_id de zone
- `set_user_id_from_folder()`: folders heredan user_id de parent o auth.uid()
- `set_user_id_from_note()`: note_attachments heredan user_id de note
- `set_user_id_from_pomodoro_session()`: pomodoro_sessions usan auth.uid() directo

**Row Level Security (RLS):**
- Todas las tablas tienen RLS habilitado
- Política uniforme: `auth.uid() = user_id` para SELECT, INSERT, UPDATE, DELETE
- Storage bucket `note-attachments` con RLS por path: `notes/{user_id}/*`

### 2.2 Endpoints de API

**Nota:** Esta aplicación usa Supabase como backend-as-a-service, no hay endpoints REST tradicionales. Todas las operaciones de API se realizan directamente desde el cliente usando el SDK de Supabase. A continuación se documentan las operaciones de Supabase utilizadas:

| Método | Operación Supabase | Request (parámetros/filtros) | Response (shape) | Servicios externos que consume | Archivo:línea |
|---|---|---|---|---|---|
| SELECT | semesters (todas) | select('id, nombre, activo, promedio_objetivo, nota_minima, promedio_previo, creditos_previos, updated_at').order('updated_at', { ascending: false }) | Array de semesters | Supabase PostgreSQL | src/features/semesters/api.js:9-17 |
| SELECT | semesters (activa) | select(...).eq('activo', true).single() | Objeto semester activo | Supabase PostgreSQL | src/features/semesters/api.js:19-28 |
| SELECT | semesters (por ID) | select(...).eq('id', id).single() | Objeto semester | Supabase PostgreSQL | src/features/semesters/api.js:30-39 |
| INSERT | semesters | insert({ nombre, promedio_objetivo, nota_minima, promedio_previo, creditos_previos }).select(...).single() | Objeto semester creado | Supabase PostgreSQL | src/features/semesters/api.js:41-56 |
| UPDATE | semesters | update(updates).eq('id', id).select(...).single() | Objeto semester actualizado | Supabase PostgreSQL | src/features/semesters/api.js:58-68 |
| DELETE | semesters | delete().eq('id', id) | Void | Supabase PostgreSQL | src/features/semesters/api.js:70-77 |
| UPDATE | semesters (set activo) | update({ activo: false }).neq('id', id) luego update({ activo: true }).eq('id', id) | Objeto semester activo | Supabase PostgreSQL | src/features/semesters/api.js:79-98 |
| SELECT | subjects (por semester) | select(...).eq('semester_id', semesterId).order('nombre') | Array de subjects | Supabase PostgreSQL | src/features/subjects/api.js:9-18 |
| SELECT | subjects (por ID) | select(...).eq('id', id).single() | Objeto subject | Supabase PostgreSQL | src/features/subjects/api.js:20-29 |
| INSERT | subjects | insert({ semester_id, nombre, codigo, catedratico, seccion, creditos, color, icono, horario }).select(...).single() | Objeto subject creado | Supabase PostgreSQL | src/features/subjects/api.js:31-50 |
| UPDATE | subjects | update({ nombre, codigo, catedratico, seccion, creditos, color, icono, horario }).eq('id', id).select(...).single() | Objeto subject actualizado | Supabase PostgreSQL | src/features/subjects/api.js:52-71 |
| DELETE | subjects | delete().eq('id', id) | Void | Supabase PostgreSQL | src/features/subjects/api.js:73-80 |
| SELECT | tasks (por semester) | select(...).eq('semester_id', semesterId).order('due', { ascending: true, nullsFirst: false }) | Array de tasks | Supabase PostgreSQL | src/features/tasks/api.js:11-20 |
| SELECT | tasks (pendientes) | select(...).eq('semester_id', semesterId).eq('done', false).order('due', ...) | Array de tasks pendientes | Supabase PostgreSQL | src/features/tasks/api.js:22-32 |
| SELECT | tasks (por subject) | select(...).eq('subject_id', subjectId).order('due', ...) | Array de tasks | Supabase PostgreSQL | src/features/tasks/api.js:34-43 |
| SELECT | tasks (por ID) | select(...).eq('id', id).single() | Objeto task | Supabase PostgreSQL | src/features/tasks/api.js:45-54 |
| INSERT | tasks | insert({ subject_id, semester_id, titulo, prioridad, due, done: false, subtasks, attachments, reminder_at }).select(...).single() | Objeto task creado | Supabase PostgreSQL | src/features/tasks/api.js:56-75 |
| UPDATE | tasks | update({ titulo, prioridad, due, done, subtasks, attachments, reminder_at }).eq('id', id).select(...).single() | Objeto task actualizado | Supabase PostgreSQL | src/features/tasks/api.js:77-95 |
| UPDATE | tasks (toggle done) | update({ done }).eq('id', id).select(...).single() | Objeto task actualizado | Supabase PostgreSQL | src/features/tasks/api.js:97-107 |
| DELETE | tasks | delete().eq('id', id) | Void | Supabase PostgreSQL | src/features/tasks/api.js:109-116 |
| DELETE | tasks (completadas) | delete().eq('semester_id', semesterId).eq('done', true) | Void | Supabase PostgreSQL | src/features/tasks/api.js:118-126 |
| SELECT | tasks (count por subject) | select('*', { count: 'exact', head: true }).eq('subject_id', subjectId) | Count (número) | Supabase PostgreSQL | src/features/tasks/api.js:128-136 |
| SELECT | grade_zones (por subject con items) | select(...).eq('subject_id', subjectId).order('nombre') + fetch items por cada zona | Array de zones con items nested | Supabase PostgreSQL | src/features/grades/api.js:14-42 |
| SELECT | grade_zones (por ID) | select(...).eq('id', id).single() | Objeto zone | Supabase PostgreSQL | src/features/grades/api.js:47-56 |
| SELECT | grade_items (por zone) | select(...).eq('zone_id', zoneId).order('nombre') | Array de items | Supabase PostgreSQL | src/features/grades/api.js:61-70 |
| SELECT | grade_items (por ID) | select(...).eq('id', id).single() | Objeto item | Supabase PostgreSQL | src/features/grades/api.js:75-84 |
| INSERT | grade_zones | insert({ subject_id, nombre, peso_pts, ganada_pct }).select(...).single() | Objeto zone creado | Supabase PostgreSQL | src/features/grades/api.js:89-103 |
| UPDATE | grade_zones | update({ nombre, peso_pts, ganada_pct }).eq('id', id).select(...).single() | Objeto zone actualizado | Supabase PostgreSQL | src/features/grades/api.js:108-122 |
| DELETE | grade_zones | delete().eq('id', id) | Void | Supabase PostgreSQL | src/features/grades/api.js:127-134 |
| INSERT | grade_items | insert({ zone_id, nombre, porcentaje_ingresado, puntos_netos }).select(...).single() | Objeto item creado | Supabase PostgreSQL | src/features/grades/api.js:139-153 |
| UPDATE | grade_items | update({ nombre, porcentaje_ingresado, puntos_netos }).eq('id', id).select(...).single() | Objeto item actualizado | Supabase PostgreSQL | src/features/grades/api.js:158-172 |
| DELETE | grade_items | delete().eq('id', id) | Void | Supabase PostgreSQL | src/features/grades/api.js:177-184 |
| SELECT | grade_items (count por zone) | select('*', { count: 'exact', head: true }).eq('zone_id', zoneId) | Count (número) | Supabase PostgreSQL | src/features/grades/api.js:189-197 |
| SELECT | notes (por folder) | select(...).is('folder_id', null) o .eq('folder_id', folderId).order('updated_at', { ascending: false }) | Array de notes | Supabase PostgreSQL | src/features/notes/api.js:11-26 |
| SELECT | notes (por ID) | select(...).eq('id', id).single() | Objeto note | Supabase PostgreSQL | src/features/notes/api.js:28-37 |
| SELECT | notes (search) | select(...).or(`titulo.ilike.%${query}%,contenido.ilike.%${query}%`).order('updated_at', ...) | Array de notes matching | Supabase PostgreSQL | src/features/notes/api.js:39-48 |
| INSERT | notes | insert({ subject_id, folder_id, titulo, contenido }).select(...).single() | Objeto note creado | Supabase PostgreSQL | src/features/notes/api.js:50-64 |
| UPDATE | notes | update({ titulo, contenido, subject_id, folder_id }).eq('id', id).select(...).single() | Objeto note actualizado | Supabase PostgreSQL | src/features/notes/api.js:66-81 |
| DELETE | notes | delete().eq('id', id) | Void | Supabase PostgreSQL | src/features/notes/api.js:83-90 |
| SELECT | folders (por parent) | select(...).is('parent_id', null) o .eq('parent_id', parentId).order('nombre') | Array de folders | Supabase PostgreSQL | src/features/folders/api.js:10-25 |
| SELECT | folders (por ID) | select(...).eq('id', id).single() | Objeto folder | Supabase PostgreSQL | src/features/folders/api.js:27-36 |
| INSERT | folders | insert({ subject_id, parent_id, nombre }).select(...).single() | Objeto folder creado | Supabase PostgreSQL | src/features/folders/api.js:38-51 |
| UPDATE | folders | update({ nombre, subject_id }).eq('id', id).select(...).single() | Objeto folder actualizado | Supabase PostgreSQL | src/features/folders/api.js:53-66 |
| DELETE | folders | delete().eq('id', id) | Void | Supabase PostgreSQL | src/features/folders/api.js:68-75 |
| SELECT | habits (todas) | select(...).order('nombre', { ascending: true }) | Array de habits | Supabase PostgreSQL | src/features/habits/api.js:72-80 |
| SELECT | habits (por ID) | select(...).eq('id', id).single() | Objeto habit | Supabase PostgreSQL | src/features/habits/api.js:82-91 |
| INSERT | habits | insert({ nombre, frecuencia, dias_semana, racha: 0, historial: [] }).select(...).single() | Objeto habit creado | Supabase PostgreSQL | src/features/habits/api.js:93-108 |
| UPDATE | habits | update({ nombre, frecuencia, dias_semana }).eq('id', id).select(...).single() | Objeto habit actualizado | Supabase PostgreSQL | src/features/habits/api.js:110-124 |
| DELETE | habits | delete().eq('id', id) | Void | Supabase PostgreSQL | src/features/habits/api.js:126-133 |
| UPDATE | habits (toggle completion) | update({ historial: newHistory, racha: newStreak }).eq('id', id).select(...).single() | Objeto habit actualizado | Supabase PostgreSQL | src/features/habits/api.js:135-166 |
| SELECT | events (por semester) | select(...).eq('semester_id', semesterId).order('start_at', { ascending: true }) | Array de events | Supabase PostgreSQL | src/features/events/api.js:11-20 |
| SELECT | events (por mes) | select(...).eq('semester_id', semesterId).gte('start_at', start).lte('start_at', end).order('start_at', ...) | Array de events del mes | Supabase PostgreSQL | src/features/events/api.js:22-36 |
| SELECT | events (por subject) | select(...).eq('subject_id', subjectId).order('start_at', ...) | Array de events | Supabase PostgreSQL | src/features/events/api.js:38-47 |
| SELECT | events (por ID) | select(...).eq('id', id).single() | Objeto event | Supabase PostgreSQL | src/features/events/api.js:49-58 |
| INSERT | events | insert({ subject_id, semester_id, nombre, tipo, start_at, end_at, descripcion }).select(...).single() | Objeto event creado | Supabase PostgreSQL | src/features/events/api.js:60-77 |
| UPDATE | events | update({ subject_id, nombre, tipo, start_at, end_at, descripcion }).eq('id', id).select(...).single() | Objeto event actualizado | Supabase PostgreSQL | src/features/events/api.js:79-96 |
| DELETE | events | delete().eq('id', id) | Void | Supabase PostgreSQL | src/features/events/api.js:98-105 |
| SELECT | topics (por subject) | select(...).eq('subject_id', subjectId).order('parcial', { ascending: true }) | Array de topics | Supabase PostgreSQL | src/features/topics/api.js:10-19 |
| SELECT | topics (por parcial) | select(...).eq('subject_id', subjectId).eq('parcial', parcial).order('nombre') | Array de topics del parcial | Supabase PostgreSQL | src/features/topics/api.js:21-31 |
| SELECT | topics (por ID) | select(...).eq('id', id).single() | Objeto topic | Supabase PostgreSQL | src/features/topics/api.js:33-42 |
| INSERT | topics | insert({ subject_id, parcial, nombre, subtemas, dificultad, tiempo_dedicado_min, fecha_examen }).select(...).single() | Objeto topic creado | Supabase PostgreSQL | src/features/topics/api.js:44-61 |
| UPDATE | topics | update({ parcial, nombre, subtemas, dificultad, tiempo_dedicado_min, fecha_examen, comprension, visto }).eq('id', id).select(...).single() | Objeto topic actualizado | Supabase PostgreSQL | src/features/topics/api.js:63-82 |
| DELETE | topics | delete().eq('id', id) | Void | Supabase PostgreSQL | src/features/topics/api.js:84-91 |
| SELECT | note_attachments (por note) | select(...).eq('note_id', noteId).order('created_at', { ascending: false }) | Array de attachments | Supabase PostgreSQL | src/features/note-attachments/api.js:9-18 |
| SELECT | note_attachments (por ID) | select(...).eq('id', id).single() | Objeto attachment | Supabase PostgreSQL | src/features/note-attachments/api.js:20-29 |
| INSERT | note_attachments | insert({ note_id, tipo, nombre, storage_path, metadata }).select(...).single() | Objeto attachment creado | Supabase PostgreSQL | src/features/note-attachments/api.js:31-46 |
| DELETE | note_attachments | delete().eq('id', id) | Void | Supabase PostgreSQL | src/features/note-attachments/api.js:48-55 |
| UPLOAD | Storage (note-attachments) | supabase.storage.from('note-attachments').upload(storagePath, file) | { path, storagePath } | Supabase Storage | src/features/note-attachments/api.js:58-68 |
| DELETE | Storage (note-attachments) | supabase.storage.from('note-attachments').remove([storagePath]) | Void | Supabase Storage | src/features/note-attachments/api.js:70-76 |
| GET | Storage (signed URL) | supabase.storage.from('note-attachments').createSignedUrl(storagePath, expiresIn) | { signedUrl } | Supabase Storage | src/features/note-attachments/api.js:78-85 |
| GET | Storage (public URL) | supabase.storage.from('note-attachments').getPublicUrl(storagePath) | { publicUrl } | Supabase Storage | src/features/note-attachments/api.js:87-93 |
| SELECT | pomodoro_sessions (por rango fechas) | select(...).gte('started_at', startDate).lte('started_at', endDate).order('started_at', { ascending: false }) | Array de sessions | Supabase PostgreSQL | src/features/pomodoro/api.js:63-73 |
| SELECT | pomodoro_sessions (por task) | select(...).eq('task_id', taskId).order('started_at', ...) | Array de sessions | Supabase PostgreSQL | src/features/pomodoro/api.js:78-87 |
| SELECT | pomodoro_sessions (por subject) | select(...).eq('subject_id', subjectId).order('started_at', ...) | Array de sessions | Supabase PostgreSQL | src/features/pomodoro/api.js:92-101 |
| SELECT | pomodoro_sessions (por ID) | select(...).eq('id', id).single() | Objeto session | Supabase PostgreSQL | src/features/pomodoro/api.js:106-115 |
| INSERT | pomodoro_sessions | insert({ started_at, ended_at, duration_min, tipo, task_id, subject_id }).select(...).single() | Objeto session creada | Supabase PostgreSQL | src/features/pomodoro/api.js:120-136 |
| DELETE | pomodoro_sessions | delete().eq('id', id) | Void | Supabase PostgreSQL | src/features/pomodoro/api.js:141-148 |
| SELECT | profiles (actual) | select(...).eq('user_id', user.id).single() | Objeto profile o null | Supabase PostgreSQL | src/features/profile/api.js:8-25 |
| UPSERT | profiles | upsert(profile, { onConflict: 'user_id' }).select(...).maybeSingle() | Objeto profile upserted | Supabase PostgreSQL | src/features/profile/api.js:27-42 |
| AUTH | signInWithGoogle | supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callbackUrl } }) | { data, error } | Supabase Auth (Google OAuth) | src/lib/supabase.js:12-21 |
| AUTH | signOut | supabase.auth.signOut() | { error } | Supabase Auth | src/lib/supabase.js:23-26 |
| AUTH | getCurrentUser | supabase.auth.getUser() | { data: { user }, error } | Supabase Auth | src/lib/supabase.js:28-32 |
| AUTH | onAuthStateChange | supabase.auth.onAuthStateChange(callback) | { data: { subscription } } | Supabase Auth | src/lib/supabase.js:34-36 |

### 2.3 Lógica de Negocio Central

**Funciones principales del dominio de cálculo de notas (src/domain/grades-calc.js):**

| Nombre de función | Archivo:línea | Input | Output | Efectos secundarios | Descripción del algoritmo/lógica paso a paso |
|---|---|---|---|---|---|
| percentageToNetPoints | src/domain/grades-calc.js:13-17 | percentage (number), zoneWeight (number) | number (net points) | Ninguno | 1. Valida que ambos inputs no sean null, retorna 0 si son null. 2. Calcula (percentage / 100) * zoneWeight. 3. Redondea a 2 decimales usando Math.round(result * 100) / 100. |
| calculateZoneNetPoints | src/domain/grades-calc.js:26-35 | items (Array<{porcentaje_ingresado, peso_pts}>), zoneWeight (number) | number (total net points) | Ninguno | 1. Valida que items exista y no esté vacío, retorna 0 si no. 2. Reduce sobre items sumando: percentageToNetPoints(item.porcentaje_ingresado || 0, item.peso_pts || 0). 3. Retorna suma total. |
| calculateSubjectTotalPoints | src/domain/grades-calc.js:42-49 | zones (Array<{peso_pts, items}>) | number (total net points) | Ninguno | 1. Valida que zones exista y no esté vacío, retorna 0 si no. 2. Reduce sobre zones sumando: calculateZoneNetPoints(zone.items || [], zone.peso_pts). 3. Retorna suma total. |
| calculateSubjectMaxPoints | src/domain/grades-calc.js:56-60 | zones (Array<{peso_pts}>) | number (max possible points) | Ninguno | 1. Valida que zones exista y no esté vacío, retorna 0 si no. 2. Reduce sobre zones sumando: zone.peso_pts || 0. 3. Retorna suma total. |
| projectFinalGrade | src/domain/grades-calc.js:68-71 | obtainedPoints (number), maxPoints (number) | number (percentage 0-100) | Ninguno | 1. Valida que maxPoints no sea 0, retorna 0 si es 0. 2. Calcula (obtainedPoints / maxPoints) * 100. 3. Retorna resultado. |
| calculateNeededToPass | src/domain/grades-calc.js:80-87 | obtainedPoints (number), zoneWeight (number), ganadaPct (number) | number (points needed) | Ninguno | 1. Calcula passingPoints = (zoneWeight * ganadaPct) / 100. 2. Calcula neededPoints = passingPoints - obtainedPoints. 3. Si neededPoints <= 0 retorna 0. 4. Redondea a 2 decimales y retorna. |
| getStatusColor | src/domain/grades-calc.js:96-106 | obtainedPoints (number), zoneWeight (number), ganadaPct (number) | string ('red' \| 'yellow' \| 'green') | Ninguno | 1. Calcula passingPoints = percentageToNetPoints(ganadaPct, zoneWeight). 2. Si obtainedPoints < passingPoints retorna 'red'. 3. Si obtainedPoints < zoneWeight retorna 'yellow'. 4. Si no, retorna 'green'. |
| calculateZoneStats | src/domain/grades-calc.js:114-128 | items (Array), zone (Object) | Object {netPoints, neededToPass, statusColor, maxPoints, percentageObtained} | Ninguno | 1. Calcula netPoints = calculateZoneNetPoints(items, zone.peso_pts). 2. Calcula neededToPass = calculateNeededToPass(netPoints, zone.peso_pts, zone.ganada_pct || 60). 3. Calcula statusColor = getStatusColor(netPoints, zone.peso_pts, zone.ganada_pct || 60). 4. maxPoints = zone.peso_pts. 5. percentageObtained = maxPoints > 0 ? Math.round((netPoints / maxPoints) * 100 * 100) / 100 : 0. 6. Retorna objeto con todos los valores. |
| calculateSubjectStats | src/domain/grades-calc.js:135-145 | zones (Array<{peso_pts, items}>) | Object {totalPoints, maxPoints, projectedGrade} | Ninguno | 1. Calcula totalPoints = calculateSubjectTotalPoints(zones). 2. Calcula maxPoints = calculateSubjectMaxPoints(zones). 3. Calcula projectedGrade = projectFinalGrade(totalPoints, maxPoints). 4. Retorna objeto con los tres valores. |

**Funciones de cálculo de hábitos (src/features/habits/api.js):**

| Nombre de función | Archivo:línea | Input | Output | Efectos secundarios | Descripción del algoritmo/lógica paso a paso |
|---|---|---|---|---|---|
| calculateStreak | src/features/habits/api.js:22-70 | habit (Object con frecuencia, dias_semana, historial) | number (streak days) | Ninguno | 1. Obtiene fecha actual en formato YYYY-MM-DD. 2. Convierte historial a Set para búsqueda O(1). 3. Verifica si hoy está completado. 4. Si no, empieza check desde ayer. 5. Loop hacia atrás: para frecuencia 'diario', cualquier día sin marca rompe streak; para 'semanal', solo días programados cuentan. 6. Incrementa streak por cada día consecutivo válido. 7. Safety: break si streak > 365. 8. Retorna streak. |

**Funciones de cálculo de Pomodoro (src/features/pomodoro/api.js):**

| Nombre de función | Archivo:línea | Input | Output | Efectos secundarios | Descripción del algoritmo/lógica paso a paso |
|---|---|---|---|---|---|
| calculatePomodoroStats | src/features/pomodoro/api.js:16-58 | sessions (Array<{started_at, duration_min, tipo}>) | Object {streakDays, todaySessions, weekMinutes, todayMinutes} | Ninguno | 1. Filtra sesiones de últimos 7 días. 2. Calcula weekMinutes sumando duration_min de sesiones recientes. 3. Filtra sesiones de hoy para todaySessions y todayMinutes. 4. Filtra solo sesiones de trabajo para calcular streak. 5. Extrae días únicos de sesiones de trabajo. 6. Calcula streakDays contando días consecutivos hacia atrás desde hoy. 7. Retorna objeto con todas las métricas. |

**Funciones de export/import de datos (src/lib/exportData.js, src/lib/importData.js):**

| Nombre de función | Archivo:línea | Input | Output | Efectos secundarios | Descripción del algoritmo/lógica paso a paso |
|---|---|---|---|---|---|
| exportAllUserData | src/lib/exportData.js:88-106 | Ninguno | Object {version, exportedAt, userId, data} | Ninguno | 1. Obtiene usuario actual con getCurrentUser(). 2. Para cada tabla en BACKUP_TABLES, fetchAllFromTable() con columnas específicas. 3. Filtra rows por user_id actual. 4. Convierte array de [table, rows] a Object.entries. 5. Retorna objeto con metadata y data por tabla. |
| validateBackupPayload | src/lib/importData.js:43-94 | backup (Object), currentUserId (string) | Object {valid, error?, tables?, totalRows?} | Ninguno | 1. Valida estructura de backup (version, userId, data). 2. Valida version === 1. 3. Valida que userId del backup coincida con currentUserId (opcional). 4. Valida que data sea objeto. 5. Para cada tabla, valida que sea array y que cada row sea objeto con user_id correcto. 6. Retorna validación con lista de tablas y total de rows. |
| importUserBackup | src/lib/importData.js:128-154 | backup (Object), options {replaceAll: boolean} | Promise<void> | Efecto secundario: modifica base de datos | 1. Valida usuario autenticado. 2. Si replaceAll, llama deleteAllUserData(userId) en orden DELETE_ORDER. 3. Normaliza datos del backup. 4. Para cada grupo en IMPORT_GROUPS (respetando dependencias), hace upsert en paralelo de todas las tablas del grupo. 5. Usa rewriteUserId() para reescribir user_id al usuario actual. 6. Usa upsert con conflict target apropiado (id o user_id). |
| deleteAllUserData | src/lib/importData.js:115-126 | userId (string) | Promise<void> | Efecto secundario: elimina datos de DB | 1. Para cada tabla en DELETE_ORDER (de hojas a raíz), hace delete().eq('user_id', userId). 2. Retorna error si falla alguna eliminación. |

**Manejo de estado:**
- **Stateless**: La aplicación es mayormente stateless, toda la persistencia está en Supabase
- **State global**: Zustand stores (ui.store.js, timerStore.js) para estado transitorio de UI
- **State local**: React useState en componentes para estado efímero
- **Cache**: React Query (TanStack Query) con staleTime 5 min, gcTime 10 min, refetchOnWindowFocus false
- **Persistencia**: timerStore usa middleware persist de Zustand para localStorage
- **Sesiones**: Supabase Auth maneja sesiones con JWT

### 2.4 Autenticación y Manejo de Errores

**Flujo de autenticación completo:**

1. **Registro/Login (src/pages/Auth.jsx):**
   - Usuario hace click en "Ingresar con Google"
   - Llama `signInWithGoogle()` (src/lib/supabase.js:12-21)
   - Supabase Auth redirige a Google OAuth
   - Google redirige a `/auth/callback` con token

2. **Callback de autenticación (src/pages/AuthCallback.jsx):**
   - Verifica sesión con `supabase.auth.getSession()`
   - Si hay sesión, llama `getSemesters()` para verificar si usuario tiene semestres
   - Si tiene semestres, redirige a `/s/{activeSemesterId}`
   - Si no tiene semestres, redirige a `/create-first-semester`
   - Si no hay sesión, redirige a `/auth`

3. **Rutas protegidas (src/main.tsx:24-50):**
   - `ProtectedRoute` component verifica usuario con `getCurrentUser()`
   - Verifica `localStorage.getItem('academia-guest-mode')` para modo invitado
   - Si no hay usuario y no es modo invitado, redirige a `/auth`
   - Muestra "Cargando..." mientras verifica

4. **Logout:**
   - Llama `signOut()` (src/lib/supabase.js:23-26)
   - Supabase Auth invalida sesión
   - React Router redirige a `/auth`

5. **Modo invitado:**
   - Usuario puede entrar sin cuenta con "Probar sin cuenta"
   - Establece `localStorage.setItem('academia-guest-mode', 'true')`
   - Navega a `/s/guest` (semesterId fake)
   - ⚠️ NO DETERMINADO: Cómo funciona el modo invitado con Supabase (probablemente no funciona sin implementación específica)

**Estrategia de autenticación:**
- **Tipo**: OAuth (Google) vía Supabase Auth
- **Storage**: Supabase Auth maneja tokens JWT en localStorage/cookies
- **Lógica**: src/lib/supabase.js contiene funciones auth (signInWithGoogle, signOut, getCurrentUser, onAuthStateChange)
- **RLS**: Todas las tablas tienen RLS con `auth.uid() = user_id`

**Estrategia global de manejo de errores:**

1. **En API calls (features/*/api.js):**
   - Patrón uniforme: `const { data, error } = await supabase...; if (error) throw error; return data`
   - Errors son propagados como excepciones

2. **En React Query hooks (features/*/hooks.js):**
   - useQuery: errors se manejan automáticamente por React Query (default: mostrar en UI)
   - useMutation: errors se catch en try/catch en componentes, se muestra toast/error
   - Ejemplo típico (src/pages/Overview.jsx:26-33):
     ```javascript
     try {
       await createTask.mutateAsync(taskData)
       closeModal()
     } catch (error) {
       console.error('Error creating task:', error)
     }
     ```

3. **En componentes:**
   - try/catch para mutations
   - console.error para logging
   - UI muestra loading states (isPending de mutations)
   - Algunos componentes muestran error explícito (src/pages/Overview.jsx:80)

4. **Formato de respuesta de error:**
   - No hay formato estándar uniforme
   - Errors de Supabase: objeto con { message, code, details, hint }
   - Errors de validación: normalmente se muestran como texto simple en UI
   - ⚠️ NO DETERMINADO: No hay error boundary global ni middleware de error centralizado

5. **Logging:**
   - console.error en catch blocks
   - console.warn en exportData.js para errores no críticos
   - ⚠️ NO DETERMINADO: No hay servicio de logging externo (Sentry, LogRocket, etc.)

6. **Códigos de estado HTTP:**
   - Usados por Supabase automáticamente (200, 201, 400, 401, 403, 404, 500)
   - No hay manejo explícito de códigos en el código cliente

## 3. Observaciones y Riesgos Detectados

**Deuda técnica detectada:**
1. **Paquete no utilizado**: `fflate` (^0.8.3) está en package.json pero no se encontraron referencias en el código analizado
2. **Feature no implementada**: Tabla `flashcards` existe en schema.sql pero no hay implementación de UI visible en el código
3. **Modo invitado incompleto**: El modo invitado se configura en localStorage pero no hay evidencia de cómo funciona sin Supabase (probablemente no funcional)
4. **Error handling inconsistente**: No hay error boundary global ni formato estándar de respuestas de error
5. **Tests limitados**: Solo hay tests unitarios para cálculo de notas (grades-calc.test.js), no hay tests de integración ni E2E

**Inconsistencias:**
1. **Denormalización user_id**: Se usan triggers para denormalizar user_id en tablas hijas, lo cual es propenso a errores si se modifican relaciones manualmente
2. **Soft deletes no implementados**: Las operaciones de delete son permanentes, aunque hay un sistema de "undo toast" con timeout, no hay persistencia de deletes
3. **Validation de data**: La validación de datos es principalmente en frontend, no hay constraints complejas en DB más allá de NOT NULL y FKs

**Dependencias desactualizadas:**
- ⚠️ NO DETERMINADO: No se verificó fecha de publicación de paquetes vs. fecha actual (agosto 2026)

**Riesgos de seguridad:**
1. **RLS simple**: Las políticas de RLS son muy simples (solo `auth.uid() = user_id`), no hay validación de roles o permisos granulares
2. **Client-side validation**: Mucha validación está en frontend, un usuario malintencionado podría bypass usando el API directamente
3. **No rate limiting**: No hay evidencia de rate limiting en el API de Supabase (depende de configuración del proyecto Supabase)

**Riesgos de arquitectura:**
1. **Monolito frontend**: Toda la lógica está en el cliente, no hay backend custom
2. **Dependencia de Supabase**: Si Supabase tiene downtime, la aplicación no funciona (no hay offline mode real)
3. **State management fragmentado**: Estado en Zustand, React Query, localStorage, y Supabase Auth, lo cual puede causar inconsistencias

## 4. Preguntas Abiertas / No Determinado

1. ⚠️ Cómo funciona exactamente el modo invitado con Supabase (localStorage set pero no hay implementación evidente de data storage local)
2. ⚠️ Versión actual de Node.js requerida (no especificada en package.json ni en docs)
3. ⚠️ Plataforma de hosting objetivo (no especificado en docs)
4. ⚠️ Fecha de publicación de dependencias para verificar si están desactualizadas
5. ⚠️ Configuración de CI/CD (no hay archivos .github/workflows detectados)
6. ⚠️ Configuración de Supabase (URL, project ID) - valores requeridos pero no documentados
7. ⚠️ Implementación de flashcards (tabla existe pero no UI visible)
8. ⚠️ Strategy de backup/disaster recovery (solo hay export manual, no automatizado)
9. ⚠️ Strategy de monitoring y alertas (no hay implementación detectada)
10. ⚠️ Performance budgets o métricas de performance objetivo (no especificadas)
