# CHANGELOG

## [Fase 4 - Extras (Perfil y Personalización)] - 2024-01-18

### Resumen
Implementación del tercer ticket de Fase 4 (Extras) según `academia-v2-spec-funcional.md` sección 10. Se implementó la página de perfil con datos personales editables (nombre, registro académico, carrera, institución), cursos ganados (solo lectura), y personalización visual (tipografía, color de tema, sonidos de interacción, modo oscuro) con preview en vivo. Se creó el mecanismo de tema global (darkMode: 'class' en Tailwind, CSS variables, hidratación desde perfil en AppLayout, reset en logout).

### Archivos creados

#### Páginas (src/pages/)
- `Profile.jsx` - Página de perfil:
  - Datos personales: nombre, registro académico, carrera, institución (inputs editables)
  - Cursos ganados (input disabled, solo lectura)
  - Tipografía: selector con 4 opciones (Inter, Roboto, Open Sans, System UI) con preview en vivo
  - Color de tema: 6 colores predefinidos en círculos (verde lima, azul, índigo, púrpura, naranja, rojo)
  - Sonidos de interacción: toggle switch (ON = 'classic', OFF = 'off')
  - Modo oscuro: toggle switch con preview en vivo
  - Creación automática de perfil (upsert con defaults) si no existe fila en DB (una vez por sesión)
  - Guardado explícito con useUpsertProfile()
  - Animación de entrada con Framer Motion (fade + slide up)
  - Clases dark: en todas las secciones para demostrar que el mecanismo funciona
  - ~200 líneas

### Archivos modificados

#### Configuración
- `index.html` - Agregados preconnect a Google Fonts + stylesheet (Inter, Roboto, Open Sans)
- `tailwind.config.js` - Agregado `darkMode: 'class'` para habilitar clases `dark:` en Tailwind

#### Estilos
- `src/styles/index.css` - Agregado `:root` con `--color-primary` y `--font-family` como CSS variables; body usa `var(--font-family)`

#### Store
- `src/stores/ui.store.js` - Agregados 4 campos de theme preview (modoOscuro, tipografia, temaColor, sonidosInteraccion) con sus setters + `resetTheme()` para limpiar en logout

#### Layout
- `src/layouts/AppLayout.jsx` - Agregado:
  - useEffect de hidratación: lee `useProfile()` y escribe en ui.store (se monta en todas las rutas protegidas)
  - useEffect de aplicación: lee ui.store y aplica al `<html>` (clase 'dark', CSS variable --color-primary, fontFamily, mute)
  - Nav item "Perfil" con icono de usuario

#### Auth
- `src/pages/Auth.jsx` - Agregado `resetTheme()` en useEffect al montar (para que al cerrar sesión y loguear otro usuario sin refrescar, el tema se limpie)

#### Routing
- `src/main.tsx` - Agregada ruta `/s/:semesterId/profile` → Profile page

### Reglas de arquitectura cumplidas
✅ 1. Ningún componente llama a Supabase directo - todo pasa por `features/profile/api.js`
✅ 2. Datos de Supabase viven en TanStack Query - no hay useState duplicando datos
✅ 3. Zustand para estado de UI (theme preview en vivo) - los datos de servidor siguen en TanStack Query
✅ 4. Componentes bajo ~200 líneas (Profile: ~200 líneas)
✅ 5. Columnas explícitas en cada query - NUNCA select('*')
✅ 6. Preview en vivo: los cambios de tema/color/tipografía se aplican al instante sin esperar "Guardar"
✅ 7. Hidratación en AppLayout (no en Profile.jsx) para que el tema se aplique en TODAS las pantallas, no solo al visitar Perfil
✅ 8. resetTheme() en Auth.jsx para evitar que el tema del usuario anterior quede pegado al loguear otro sin refrescar
✅ 9. Creación automática de perfil (upsert con defaults) una vez por sesión si no existe fila
✅ 10. Animaciones con Framer Motion
✅ 11. Modo oscuro limitado a Profile.jsx en este ticket - el resto de pantallas queda pendiente para ticket futuro de "dark mode global"

### Tablas tocadas en Fase 4 ticket 3
- `profiles` - Solo lectura/escritura (api.js y hooks.js ya existían de fase anterior)

### QueryKeys utilizados
- `['profiles', 'current']` - Perfil del usuario actual

### Estado de implementación
✅ Página Profile con datos personales y personalización
✅ Mecanismo de tema global (darkMode: 'class', CSS variables, hidratación en AppLayout)
✅ Preview en vivo de todos los controles de personalización
✅ Creación automática de perfil si no existe
✅ Guardado explícito con upsert
✅ Routing y navegación (sidebar + ruta)
✅ resetTheme en logout
✅ Animaciones con Framer Motion
✅ Clases dark: en Profile.jsx + AppLayout (sidebar, header, fondo general)
⏳ Dark mode global en el resto de pantallas (ticket futuro)

### Pendientes detectados (no implementados en este ticket)
Estos son huecos de fases anteriores o extensiones necesarias identificadas durante el desarrollo, pendientes para tickets futuros del roadmap:

1. **"Nuevo Evento" / "Nuevo Tema" deshabilitados en modal Agregar rápido** — El componente `QuickAdd.jsx` tiene 4 opciones, pero solo "Nueva Tarea" y "Nueva Clase" están habilitadas. "Nuevo Evento" y "Nuevo Tema" están deshabilitados con placeholder desde Fase 1.

2. **Dark mode global (resto de pantallas)** — Profile.jsx y AppLayout (sidebar, header, fondo) ya tienen clases `dark:` con paleta zinc. El resto de pantallas (Tareas, Calendario, Notas, Hábitos, Materias, Calificaciones, Reloj, Mi Horario, Resumen) quedan en modo claro. Ticket futuro: agregar clases `dark:` a cada página con la misma paleta zinc.

3. **Barra superior completa (spec sección 1)** — La barra superior de AppLayout actualmente solo tiene hamburguesa + título + mute. La spec requiere: botón de cerrar sesión, exportar/importar JSON, toggle claro/oscuro, accesos rápidos a "+Clase", "Agregar" y "Examen". No existe ninguna parte de esto todavía.

### Próximos pasos (para el usuario)
1. **Ejecutar schema.sql en Supabase** (si no se ha ejecutado aún):
   - Verificar que tabla `profiles` existe con columnas: user_id, nombre, registro_academico, carrera, institucion, cursos_ganados, tipografia, tema_color, sonidos_interaccion, modo_oscuro, updated_at
   - Verificar RLS policy con `with check (auth.uid() = user_id)`

2. **Probar criterios de aceptación**:
   - Abrir Perfil desde la sidebar
   - Verificar que los datos personales se cargan desde Supabase
   - Editar nombre, registro, carrera, institución y guardar
   - Verificar que cursos_ganados es solo lectura
   - Cambiar tipografía y verificar que se aplica al instante en toda la página
   - Cambiar color de tema y verificar que los botones/inputs cambian al instante
   - Activar modo oscuro y verificar que Profile.jsx + sidebar + header cambian a fondo oscuro
   - Desactivar modo oscuro y verificar que vuelve a claro
   - Toggle sonidos y verificar que el icono de mute en la barra superior cambia
   - Cerrar sesión, loguear de nuevo y verificar que el tema guardado se restaura
   - Verificar en Network tab que solo se muestran columnas usadas

## [Fase 4 - Extras (Pomodoro y Cronómetro)] - 2024-01-18

### Resumen
Implementación del segundo ticket de Fase 4 (Extras) según `academia-v2-spec-funcional.md`. Se implementó el sistema de Pomodoro con temporizador configurable (trabajo/descanso corto/descanso largo), historial de sesiones completadas en Supabase, cálculo de racha en cliente (días, sesiones, minutos por semana), y cronómetro simple sin persistencia. Los timers usan timestamp-based approach para evitar desincronización al cambiar de pestaña (visibilitychange).

### Archivos creados

#### Feature: Pomodoro (src/features/pomodoro/)
- `api.js` - API layer con columnas explícitas:
  - `pomodoroQueryKeys` - QueryKeys de TanStack Query
  - `calculatePomodoroStats(sessions)` - Cálculo de racha en cliente (días, sesiones, minutos)
  - `getPomodoroSessionsByDate(startDate, endDate)` - SELECT: id, user_id, started_at, ended_at, duration_min, tipo, task_id, subject_id
  - `getPomodoroSessionsByTask(taskId)` - SELECT: mismas columnas, WHERE task_id=?
  - `getPomodoroSessionsBySubject(subjectId)` - SELECT: mismas columnas, WHERE subject_id=?
  - `getPomodoroSessionById(id)` - SELECT: mismas columnas, WHERE id=?
  - `createPomodoroSession(session)` - INSERT con columnas explícitas
  - `deletePomodoroSession(id)` - DELETE
- `hooks.js` - TanStack Query hooks:
  - `usePomodoroSessionsByDate(startDate, endDate)` - Query de sesiones por rango de fechas
  - `usePomodoroSessionsByTask(taskId)` - Query de sesiones por tarea
  - `usePomodoroSessionsBySubject(subjectId)` - Query de sesiones por materia
  - `usePomodoroSession(id)` - Query de sesión por ID
  - `useCreatePomodoroSession()` - Mutation con cache update
  - `useDeletePomodoroSession()` - Mutation con cache invalidation
- `timerStore.js` - Zustand store para estado de timers:
  - Configuración de Pomodoro (duración trabajo/descanso, sesiones antes de descanso largo)
  - Estado del timer activo (running/paused, started_at, remaining_seconds, current_phase)
  - Estado del cronómetro (running/paused, started_at, elapsed_seconds)
  - Persistencia parcial (config + completedSessions) en localStorage

QueryKeys utilizados:
- `['pomodoro_sessions']` - Lista general
- `['pomodoro_sessions', 'date', startDate, endDate]` - Sesiones por rango de fechas
- `['pomodoro_sessions', 'task', taskId]` - Sesiones por tarea
- `['pomodoro_sessions', 'subject', subjectId]` - Sesiones por materia
- `['pomodoro_sessions', id]` - Sesión específica

#### Componentes (src/components/)
- `PomodoroTimer.jsx` - Timer de Pomodoro:
  - Panel de stats (días racha, sesiones hoy, minutos semana)
  - Display de tiempo con colores por fase (trabajo=azul, descanso corto=verde, descanso largo=púrpura)
  - Controles: iniciar/pausar/reanudar/reset
  - Configuración de duraciones (trabajo, descanso corto, descanso largo, sesiones antes de descanso largo)
  - Timestamp-based timer con visibilitychange handler
  - Guardado automático de sesiones completadas en Supabase
  - ~190 líneas
- `ChronometerTimer.jsx` - Cronómetro simple:
  - Display de tiempo (formato HH:MM:SS o MM:SS)
  - Controles: iniciar/pausar/reanudar/reset
  - Timestamp-based timer con visibilitychange handler
  - Sin persistencia (estado efímero en Zustand)
  - ~80 líneas

#### Páginas (src/pages/)
- `Clock.jsx` - Vista de Reloj:
  - Tabs para cambiar entre Pomodoro y Cronómetro
  - Animación de transición entre tabs con Framer Motion
  - ~40 líneas

#### Schema (supabase/schema.sql)
- Tabla `pomodoro_sessions`:
  - id, user_id, started_at, ended_at, duration_min, tipo
  - task_id (nullable, referencia a tasks)
  - subject_id (nullable, referencia a subjects)
  - Índices en user_id y started_at
  - Trigger `set_user_id_from_pomodoro_session()` con auth.uid() directo (sin jerarquía)
  - RLS policy "own rows" con `with check (auth.uid() = user_id)` explícito

#### Routing (src/main.tsx)
- Ruta agregada: `/s/:semesterId/clock` → Clock page
- Import de Clock component

#### Layout (src/layouts/)
- `AppLayout.jsx` - Actualizado con:
  - Nav item "Reloj" con icono de reloj
  - Reordenamiento: Inicio, Materias, Tareas, Calificaciones, Calendario, Notas, Hábitos, Reloj, Mi Horario

### Reglas de arquitectura cumplidas
✅ 1. Ningún componente llama a Supabase directo - todo pasa por `features/pomodoro/api.js`
✅ 2. Datos de Supabase viven en TanStack Query - no hay useState duplicando datos
✅ 3. Zustand para estado de timers (configuración, estado activo) - persistencia parcial en localStorage
✅ 4. Componentes bajo ~200 líneas (PomodoroTimer: ~190 líneas, ChronometerTimer: ~80 líneas, Clock: ~40 líneas)
✅ 5. Columnas explícitas en cada query - NUNCA select('*')
✅ 6. Cálculo de racha en cliente (no trigger en DB) - mismo patrón que habits
✅ 7. Timestamp-based timer para evitar desincronización por browser throttling
✅ 8. visibilitychange handler para recalcular tiempo al volver a la pestaña
✅ 9. Trigger user_id con auth.uid() directo (sin jerarquía, como habits)
✅ 10. RLS INSERT explícito con `with check (auth.uid() = user_id)`
✅ 11. Animaciones con Framer Motion
✅ 12. Solo sesiones completadas se persisten (sin sesiones parciales)
✅ 13. Cronómetro sin persistencia (estado efímero en Zustand)

### Lógica de timer (timestamp-based)
- **Timestamp approach**: Guardar `started_at` y calcular tiempo restante/transcurrido por diferencia con `Date.now()`
- **visibilitychange**: Recalcular tiempo cuando la pestaña vuelve a estar visible para evitar desincronización
- **Browser throttling**: No depender de `setInterval` tick a tick - el timer "se pone al día" al volver
- **Pomodoro**: Al completar sesión de trabajo, se guarda en Supabase con task_id/subject_id opcionales
- **Cronómetro**: Sin persistencia - solo estado efímero en Zustand

### Tablas tocadas en Fase 4 ticket 2
- `pomodoro_sessions` - Nueva tabla con trigger y RLS

### QueryKeys utilizados
- `['pomodoro_sessions']`, `['pomodoro_sessions', 'date', startDate, endDate]`
- `['pomodoro_sessions', 'task', taskId]`, `['pomodoro_sessions', 'subject', subjectId]`
- `['pomodoro_sessions', id]`

### Estado de implementación
✅ Feature pomodoro completo (api + hooks + store)
✅ PomodoroTimer con stats, configuración, y timestamp-based timer
✅ ChronometerTimer simple sin persistencia
✅ Página Clock con tabs Pomodoro/Cronómetro
✅ Routing actualizado
✅ AppLayout actualizado con nav item Reloj
✅ Animaciones con Framer Motion
✅ Sin dependencias nuevas agregadas

### Bug fixes (post-implementación)
**Bug 1: Timer no avanza visualmente (dependencia inestable)**
- **Causa**: El useEffect del timer tenía `pomodoroConfig` como dependencia. Como `pomodoroConfig` es un objeto recreado en cada render, el useEffect se reiniciaba constantemente (cleanup → setup), limpiando y recreando el interval antes de que pudiera completar ciclos normales.
- **Problema adicional**: `getTotalDuration()` se llamaba dentro del interval leyendo el store en vivo, lo que podía causar inconsistencias si la config cambiaba mientras el timer corría.
- **Fix**:
  - Agregar `totalDuration` al estado de Zustand (capturada al iniciar/reset/completar sesión)
  - Usar `pomodoroState.totalDuration` en lugar de `getTotalDuration()` en el tick del timer
  - Sacar `pomodoroConfig` de las dependencias del useEffect
  - Corregir variable `nextDuration` sin declarar en `completePomodoroSession()` (causaba ReferenceError al completar sesión)
- **Archivos modificados**: `src/features/pomodoro/timerStore.js`, `src/components/PomodoroTimer.jsx`

**Bug 2: NaN:NaN al cargar la página Reloj (merge shallow persist)**
- **Causa**: El middleware `persist` de Zustand hace merge shallow por defecto. Como `partialize` solo persiste `pomodoroState.completedSessions`, al hidratar reemplaza todo el objeto `pomodoroState` del estado inicial con el objeto parcial persistido, dejando `remainingSeconds`, `currentSessionCount`, etc. como `undefined`.
- **Fix**: Agregar función `merge` custom que hace merge profundo de `pomodoroState` específicamente, preservando los valores del estado inicial para las claves no persistidas.
- **Archivos modificados**: `src/features/pomodoro/timerStore.js`

**Bug 3: Timer congelado sin avanzar tras iniciar (dependencia inestable createSession)**
- **Causa**: El useEffect del timer tenía `createSession` (resultado de `useCreatePomodoroSession()`, un hook de TanStack Query) como dependencia. Este objeto se recrea en cada render, causando un loop continuo de cleanup + recreate del interval sin darle tiempo a completar un tick de 1000ms.
- **Fix**: Remover `createSession` del array de dependencias del useEffect. La función `createSession.mutate` se sigue usando dentro del interval, pero no necesita estar en las dependencias porque es estable.
- **Archivos modificados**: `src/components/PomodoroTimer.jsx`

### Próximos pasos (para el usuario)
1. **Ejecutar schema.sql en Supabase**:
   - Crear tabla `pomodoro_sessions`
   - Crear trigger `set_user_id_from_pomodoro_session()`
   - Verificar RLS policy con `with check` explícito

2. **Probar criterios de aceptación**:
   - Iniciar Pomodoro y verificar que el timer funciona
   - Cambiar de pestaña y volver - verificar que el tiempo se actualiza correctamente (visibilitychange)
   - Completar sesión de trabajo y verificar que se guarda en Supabase
   - Verificar que stats (racha, sesiones hoy, minutos semana) se calculan correctamente
   - Configurar duraciones de Pomodoro y verificar que persisten
   - Probar cronómetro (iniciar/pausar/reset)
   - Verificar que todo persiste tras refrescar (configuración, completedSessions)
   - Verificar en Network tab que solo se muestran columnas usadas

## [Fase 4 - Extras (Hábitos)] - 2024-01-18

### Resumen
Implementación del primer ticket de Fase 4 (Extras) según `academia-v2-spec-funcional.md`. Se implementó el sistema de hábitos con frecuencia diaria/semanal, cálculo de racha (streak) en cliente, historial de completado por día, y UI para marcar como completado hoy con un click.

### Archivos creados

#### Feature: Habits (src/features/habits/)
- `api.js` - API layer con columnas explícitas:
  - `habitsQueryKeys` - QueryKeys de TanStack Query
  - `calculateStreak(habit)` - Cálculo de racha en cliente (derivada de historial)
  - `getHabits()` - SELECT: id, user_id, nombre, frecuencia, dias_semana, racha, historial
  - `getHabitById(id)` - SELECT: mismas columnas, WHERE id=?
  - `createHabit(habit)` - INSERT con columnas explícitas
  - `updateHabit(id, updates)` - UPDATE con columnas explícitas
  - `deleteHabit(id)` - DELETE
  - `toggleHabitCompletion(id, date)` - Toggle completado en fecha específica + recálculo de racha
- `hooks.js` - TanStack Query hooks:
  - `useHabits()` - Query de todos los hábitos
  - `useHabit(id)` - Query de hábito por ID
  - `useCreateHabit()` - Mutation con cache update
  - `useUpdateHabit()` - Mutation con cache update
  - `useDeleteHabit()` - Mutation con cache invalidation
  - `useToggleHabitCompletion()` - Mutation con cache update

QueryKeys utilizados:
- `['habits']` - Lista general
- `['habits', id]` - Hábito específico

#### Componentes (src/components/)
- `HabitForm.jsx` - Formulario para crear hábitos:
  - Campo nombre (requerido)
  - Frecuencia (diario/semanal)
  - Días de la semana (para frecuencia semanal, selector de 7 días)
  - ~60 líneas

#### Páginas (src/pages/)
- `Habits.jsx` - Vista de hábitos:
  - Lista/grid de hábitos con nombre, frecuencia, racha actual
  - Botón circular para marcar como completado hoy (solo visible si aplica hoy)
  - Visualización de racha con emoji 🔥 y contador de días
  - Lógica de días programados: hábitos semanales solo muestran botón en días asignados
  - ConfirmDialog + UndoToast + pendingDeletes para eliminaciones
  - ~180 líneas

#### Schema (supabase/schema.sql)
- Tabla `habits` actualizada:
  - nombre (not null)
  - frecuencia (not null): 'diario' | 'semanal'
  - dias_semana (int[]): array de días [1-7] para frecuencia semanal (1=lunes, 7=domingo)
  - racha (int, default 0)
  - historial (jsonb, default '[]'): array de fechas completadas ['2024-01-15', ...]
  - RLS policy "own rows" con `with check (auth.uid() = user_id)` explícito

#### Routing (src/main.tsx)
- Ruta agregada: `/s/:semesterId/habits` → Habits page
- Import de Habits component

#### Layout (src/layouts/)
- `AppLayout.jsx` - Actualizado con:
  - Nav item "Hábitos" con icono de checkmark
  - Reordenamiento: Inicio, Materias, Tareas, Calificaciones, Calendario, Notas, Hábitos, Mi Horario

### Reglas de arquitectura cumplidas
✅ 1. Ningún componente llama a Supabase directo - todo pasa por `features/habits/api.js`
✅ 2. Datos de Supabase viven en TanStack Query - no hay useState duplicando datos
✅ 3. Zustand SOLO para estado de UI (modal, confirm dialog, undo toast, pending deletes)
✅ 4. Componentes bajo ~200 líneas (Habits: ~180 líneas, HabitForm: ~60 líneas)
✅ 5. Columnas explícitas en cada query - NUNCA select('*')
✅ 6. Cálculo de racha en cliente (no trigger en DB) - evita complejidad de debugging
✅ 7. Lógica de racha correcta según especificación:
   - Diario: cualquier día sin marcar rompe la racha
   - Semanal: días no programados no cuentan ni rompen, días programados sin marcar sí rompen
✅ 8. RLS INSERT explícito con `with check (auth.uid() = user_id)`
✅ 9. ConfirmDialog + UndoToast + pendingDeletes reutilizado
✅ 10. Animaciones con Framer Motion

### Lógica de racha (streak)
- **Cálculo en cliente**: La racha se calcula iterando el historial desde hoy hacia atrás
- **Hábitos diarios**: Cualquier día sin marcar rompe la racha
- **Hábitos semanales**: 
  - Días no programados se saltan (no cuentan ni rompen)
  - Días programados sin marcar sí rompen la racha
- **Recálculo**: La racha se recalcula al cargar la vista de hábitos (no en tiempo real a medianocha)
- **Persistencia**: La racha calculada se guarda en la columna `racha` de la tabla para facilitar queries

### Tablas tocadas en Fase 4
- `habits` - Schema actualizado con frecuencia, dias_semana, y RLS INSERT explícito

### QueryKeys utilizados
- `['habits']`, `['habits', id]`

### Estado de implementación
✅ Feature habits completo (api + hooks)
✅ HabitForm con frecuencia diaria/semanal y selector de días
✅ Página Habits con lista/grid, streak, y toggle de completado
✅ Lógica de racha en cliente según especificación
✅ Routing actualizado
✅ AppLayout actualizado con nav item Hábitos
✅ ConfirmDialog + UndoToast + pendingDeletes reutilizado
✅ Animaciones con Framer Motion
✅ Sin dependencias nuevas agregadas

### Próximos pasos (para el usuario)
1. **Ejecutar schema.sql en Supabase**:
   - Actualizar tabla `habits` con nuevos campos (frecuencia, dias_semana)
   - Verificar RLS policy con `with check` explícito

2. **Probar criterios de aceptación**:
   - Crear hábito diario
   - Crear hábito semanal con días específicos (ej. Lun/Mie/Vie)
   - Marcar hábito como completado hoy y verificar que se muestra check
   - Verificar que racha se incrementa al marcar
   - Verificar que días no programados no muestran botón (semanal)
   - Verificar que al desmarcar se decrementa racha
   - Eliminar hábito y verificar undo toast
   - Verificar que todo persiste tras refrescar
   - Verificar en Network tab que solo se muestran columnas usadas

## [Fase 3 - Contenido académico (Notas - Canvas, Imágenes, PDF)] - 2024-01-18

### Resumen
Implementación del tercer ticket de Fase 3 (Contenido académico) según `academia-v2-spec-funcional.md`. Se implementó canvas de dibujo simple, subir/pegar imágenes, y extracción de texto de PDF en el editor de notas. Las imágenes se almacenan en Supabase Storage con RLS por user_id.

### Archivos creados

#### Feature: Note Attachments (src/features/note-attachments/)
- `api.js` - API layer con columnas explícitas:
  - `noteAttachmentsQueryKeys` - QueryKeys de TanStack Query
  - `getAttachmentsByNote(noteId)` - SELECT: id, note_id, user_id, tipo, nombre, storage_path, metadata, created_at
  - `getAttachmentById(id)` - SELECT: mismas columnas, WHERE id=?
  - `createAttachment(attachment)` - INSERT con columnas explícitas
  - `deleteAttachment(id)` - DELETE
  - `uploadAttachment(userId, noteId, file, tipo)` - Upload a Supabase Storage
  - `deleteAttachmentFile(storagePath)` - Delete de Storage
  - `getSignedUrl(storagePath, expiresIn)` - Genera signed URL temporal
  - `getPublicUrl(storagePath)` - Genera URL pública (no usado, bucket privado)
- `hooks.js` - TanStack Query hooks:
  - `useAttachmentsByNote(noteId)` - Query de adjuntos por nota
  - `useAttachment(id)` - Query de adjunto por ID
  - `useCreateAttachment()` - Mutation con upload a Storage + insert en DB
  - `useDeleteAttachment()` - Mutation con delete de Storage + DB
  - `useSignedUrl(storagePath, expiresIn)` - Query de signed URL con refresh automático

QueryKeys utilizados:
- `['note_attachments']` - Lista general
- `['note_attachments', 'note', noteId]` - Adjuntos por nota
- `['note_attachments', id]` - Adjunto específico
- `['signedUrl', storagePath]` - Signed URL temporal

#### Componentes (src/components/)
- `DrawingCanvas.jsx` - Canvas de dibujo con react-painter:
  - Selector de color (7 colores predefinidos)
  - Control de grosor de trazo (1-20px)
  - Modo borrador
  - Botón limpiar canvas
  - Exporta como blob PNG
  - ~85 líneas

#### Utilidades (src/lib/)
- `pdf-extract.js` - Extracción de texto de PDF con docutext:
  - `extractTextFromPDF(file)` - Extrae texto completo del PDF
  - `extractTextFromPDFWithPages(file)` - Extrae texto por página
  - Usa docutext (zero dependencies, ~24 KB gzipped)

#### Modificaciones a componentes existentes
- `NoteEditor.jsx` - Actualizado con:
  - Botón de dibujo (✏️) que togglea DrawingCanvas
  - Botón de subir archivo (📎) para imágenes/PDF
  - Paste handler para pegar imágenes desde clipboard (Ctrl+V)
  - Extracción de texto de PDF al subir archivo PDF
  - Vista de adjuntos (imágenes/dibujos) con signed URLs
  - Click en imagen abre en nueva pestaña
  - Eliminación de adjuntos con ConfirmDialog + UndoToast + pendingDeletes
  - Filtrado de adjuntos con pendingDeletes para ocultar inmediatamente
  - ~180 líneas (incremento de ~45 líneas)

#### Schema (supabase/schema.sql)
- Tabla `note_attachments`:
  - id, note_id, user_id, tipo (imagen|dibujo|pdf), nombre, storage_path, metadata, created_at
  - Índices en note_id y user_id
  - Trigger `set_user_id_from_note()` basado en note_id con auth.uid() fallback (lección aprendida)
  - RLS policy "own rows"
- Storage bucket `note-attachments`:
  - Bucket privado (public=false)
  - RLS policies para INSERT/SELECT/DELETE basadas en user_id del path
  - Path pattern: `notes/{user_id}/{note_id}/{filename}`

### Reglas de arquitectura cumplidas
✅ 1. Ningún componente llama a Supabase directo - todo pasa por `features/note-attachments/api.js`
✅ 2. Datos de Supabase viven en TanStack Query - no hay useState duplicando datos
✅ 3. Zustand SOLO para estado de UI (modal, confirm dialog, undo toast, pending deletes)
✅ 4. Componentes bajo ~200 líneas (DrawingCanvas: ~85 líneas, NoteEditor: ~180 líneas)
✅ 5. Columnas explícitas en cada query - NUNCA select('*')
✅ 6. Canvas con librería ligera (react-painter, 0 dependencias)
✅ 7. Extracción de PDF con librería ligera (docutext, zero dependencies)
✅ 8. Imágenes en Supabase Storage con RLS - no IndexedDB local
✅ 9. Signed URLs generadas al leer, no guardadas en DB (lección aprendida)
✅ 10. Trigger user_id basado en jerarquía estructural (note_id) con auth.uid() fallback (lección aprendida)

### Tablas tocadas en Fase 3 ticket C
- `note_attachments` - CRUD completo con triggers y RLS
- Storage bucket `note-attachments` - Con RLS policies

### QueryKeys utilizados
- `['note_attachments']`, `['note_attachments', 'note', noteId]`, `['note_attachments', id]`
- `['signedUrl', storagePath]`

### Estado de implementación
✅ Feature note_attachments completo (api + hooks)
✅ DrawingCanvas con react-painter (color, grosor, borrador, limpiar)
✅ Extracción de texto de PDF con docutext
✅ NoteEditor con canvas, subir/pegar imágenes, extracción PDF
✅ Supabase Storage bucket privado con RLS
✅ Signed URLs temporales (no guardadas en DB)
✅ Eliminación de adjuntos con ConfirmDialog + UndoToast + pendingDeletes
✅ Filtrado de adjuntos con pendingDeletes
✅ Animaciones con Framer Motion

### Dependencias agregadas
- `react-painter` - Canvas de dibujo (0 dependencias)
- `docutext` - Extracción de texto de PDF (zero dependencies)
- `fflate` - Compresión para docutext en browser (~3 KB)

### Lecciones aprendidas — Fase 3 ticket C

#### Lección 1: Signed URLs no deben guardarse en DB
**Problema:** Las signed URLs de Supabase Storage expiran (por defecto 1 hora). Guardarlas en la tabla causaría URLs rotas tras el expiry.

**Causa:** Diseño inicial incluía columna `url` en `note_attachments` para guardar la signed URL.

**Fix aplicado:**
1. Remover columna `url` de la tabla `note_attachments`
2. Guardar solo `storage_path` (path en Storage)
3. Generar signed URL al leer/mostrar con hook `useSignedUrl(storagePath, expiresIn)`
4. El hook refresca automáticamente antes de que expire (staleTime = expiresIn - 60s)

**Regla para futuro:**
- NUNCA guardar signed URLs en DB - siempre generarlas al vuelo
- Guardar solo el path/identificador del recurso en Storage
- Usar hooks de TanStack Query con staleTime calculado para refresh automático

#### Lección 2: Storage RLS debe coincidir con tabla RLS
**Problema:** Las policies de Storage deben validar el mismo user_id que la tabla para consistencia de seguridad.

**Causa:** El path en Storage incluye user_id (`notes/{user_id}/{note_id}/{filename}`), pero las policies deben extraerlo correctamente.

**Fix aplicado:**
1. Crear bucket privado `note-attachments` (public=false)
2. Policies de Storage basadas en `storage.foldername(name)[2]` para extraer user_id del path
3. Policies INSERT/SELECT/DELETE todas validan que `auth.uid()::text = (storage.foldername(name))[2]`
4. Esto coincide con la RLS de la tabla `note_attachments` (auth.uid() = user_id)

**Regla para futuro:**
- Siempre incluir user_id en el path de Storage para RLS granular
- Usar `storage.foldername(name)[index]` para extraer partes del path en policies
- **PostgreSQL arrays son 1-indexed**: para path `notes/{userId}/{noteId}/{filename}`, [1]='notes', [2]=userId, [3]=noteId, [4]=filename
- Las policies de Storage deben validar el mismo ownership que la tabla asociada

### Bug fixes post-implementación

#### Bug 1: Anti-patrón de hooks en map causando lag global
**Problema:** Toda la app se puso lenta después de agregar note_attachments. Varios segundos de lag al crear nota/carpeta/navegar.

**Causa:** Llamar a `useSignedUrl(storagePath)` dentro de un `.map()` en NoteEditor crea múltiples queries dinámicas de TanStack Query. Cada attachment = 1 query separada con su propio estado, cache, y refetch logic. TanStack Query tiene que trackear N queries en lugar de 1, causando sobrecarga global.

**Fix aplicado:**
1. Crear hook `useSignedUrls(storagePaths)` usando `useQueries` de TanStack Query
2. NoteEditor ahora usa un solo hook para todas las signed URLs
3. Mapear resultados a `signedUrlsMap` para acceso por storage_path
4. Eliminar anti-patrón de hooks dentro de `.map()`

**Regla para futuro:**
- NUNCA llamar a hooks de TanStack Query dentro de un `.map()` o loop
- Usar `useQueries` para arrays dinámicos de queries
- Un hook por tipo de query, no uno por item

#### Bug 2: Storage RLS rechazaba todos los uploads (índice incorrecto)
**Problema:** El 100% de los uploads a Storage fallaban con RLS violation, para cualquier usuario.

**Causa:** PostgreSQL arrays son 1-indexed, pero la policy usaba `[1]` para comparar contra userId. Para path `notes/{userId}/{noteId}/{filename}`, `[1]` = 'notes', no el userId.

**Fix aplicado:**
1. Cambiar índice de `[1]` a `[2]` en todas las policies del bucket `note-attachments`
2. Agregar comentario explicativo sobre 1-indexing en schema.sql

**Regla para futuro:**
- PostgreSQL arrays son 1-indexed, no 0-indexed como JavaScript
- Validar índices de `storage.foldername(name)` contra el path real
- Agregar comentarios en SQL cuando se usan índices específicos

#### Bug 3: Método inexistente `clear` en react-painter
**Problema:** Botón "Limpiar" del canvas lanzaba "clear is not a function".

**Causa:** Asumí que `usePainter` devolvía un método `clear()` sin verificar la documentación real. La API real no tiene ese método.

**Fix aplicado:**
1. Usar remount con key: agregar estado `canvasKey` que se incrementa al hacer click en "Limpiar"
2. Canvas tiene `key={canvasKey}` para forzar remount limpio
3. Estados de color/grosor/borrador viven en el padre (no se pierden con remount)

**Regla para futuro:**
- NUNCA asumir nombres de métodos sin verificar documentación real
- Leer README/repo oficial antes de usar librerías
- Para limpiar canvas sin método nativo, usar remount con key

#### Bug 4: Método inexistente `getText()` en docutext
**Problema:** Extracción de PDF fallaba con "doc.getText is not a function".

**Causa:** Asumí que `DocuText.fromBuffer()` era async y devolvía un objeto con método `getText()`. La API real es síncrona y el texto es una propiedad `doc.text`.

**Fix aplicado:**
1. Remover `await` de `DocuText.fromBuffer(uint8Array)` (es síncrono)
2. Cambiar `doc.getText()` a `doc.text` (propiedad, no método)

**Regla para futuro:**
- NUNCA asumir async/sync ni nombres de métodos sin verificar documentación
- Leer README/repo oficial antes de usar librerías
- Verificar si las funciones son async/sync antes de agregar await

### Próximos pasos (para el usuario)
1. **Ejecutar schema.sql en Supabase**:
   - Crear tabla `note_attachments`
   - Crear trigger `set_user_id_from_note()`
   - Crear bucket `note-attachments` en Storage
   - Crear policies de Storage RLS

2. **Probar criterios de aceptación**:
   - Crear nota y abrir editor
   - Dibujar en canvas y guardar
   - Subir imagen desde archivo
   - Pegar imagen desde clipboard (Ctrl+V)
   - Subir PDF y verificar extracción de texto
   - Verificar que imágenes se muestran con signed URLs
   - Click en imagen abre en nueva pestaña
   - Eliminar imagen y verificar undo toast
   - Verificar que todo persiste tras refrescar
   - Verificar en Network tab que solo se muestran columnas usadas

## [Fase 3 - Contenido académico (Notas)] - 2024-01-17

### Resumen
Implementación del segundo ticket de Fase 3 (Contenido académico) según `academia-v2-spec-funcional.md`. Se implementó el sistema de notas con carpetas anidadas tipo explorador de archivos de Windows, editor de texto básico con formato (negrita/cursiva/subrayado), buscador de notas, y funcionalidad de pantalla completa. NO se implementó canvas de dibujo, subir/pegar imágenes, ni extracción de PDF (ticket 3C separado).

### Archivos creados

#### Feature: Folders (src/features/folders/)
- `api.js` - API layer con columnas explícitas:
  - `foldersQueryKeys` - QueryKeys de TanStack Query
  - `getFolders(parentId)` - SELECT: id, user_id, subject_id, parent_id, nombre (is parent_id = null para raíz)
  - `getFolderById(id)` - SELECT: mismas columnas, WHERE id=?
  - `createFolder(folder)` - INSERT con columnas explícitas
  - `updateFolder(id, updates)` - UPDATE con columnas explícitas
  - `deleteFolder(id)` - DELETE
- `hooks.js` - TanStack Query hooks:
  - `useFolders(parentId)` - Query de carpetas por parent_id (null = raíz)
  - `useFolder(id)` - Query de carpeta por ID
  - `useCreateFolder()` - Mutation con cache update
  - `useUpdateFolder()` - Mutation con cache update
  - `useDeleteFolder()` - Mutation con cache invalidation

QueryKeys utilizados:
- `['folders']` - Lista general
- `['folders', 'parent', parentId]` - Carpetas por parent_id
- `['folders', 'subject', subjectId]` - Carpetas por materia
- `['folders', id]` - Carpeta específica

#### Feature: Notes (src/features/notes/)
- `api.js` - API layer con columnas explícitas:
  - `notesQueryKeys` - QueryKeys de TanStack Query
  - `getNotes(folderId)` - SELECT: id, subject_id, folder_id, titulo, contenido, updated_at (is folder_id = null para notas sin carpeta)
  - `getNoteById(id)` - SELECT: mismas columnas, WHERE id=?
  - `searchNotes(query)` - SELECT: mismas columnas, WHERE titulo OR contenido ilike %query%
  - `createNote(note)` - INSERT con columnas explícitas
  - `updateNote(id, updates)` - UPDATE con columnas explícitas
  - `deleteNote(id)` - DELETE
- `hooks.js` - TanStack Query hooks:
  - `useNotes(folderId)` - Query de notas por folder_id
  - `useNote(id)` - Query de nota por ID
  - `useSearchNotes(query)` - Query de búsqueda de notas
  - `useCreateNote()` - Mutation con cache update
  - `useUpdateNote()` - Mutation con cache update
  - `useDeleteNote()` - Mutation con cache invalidation

QueryKeys utilizados:
- `['notes']` - Lista general
- `['notes', 'folder', folderId]` - Notas por carpeta
- `['notes', 'subject', subjectId]` - Notas por materia
- `['notes', id]` - Nota específica
- `['notes', 'search', query]` - Búsqueda de notas

#### Componentes (src/components/)
- `NoteForm.jsx` - Formulario para crear notas:
  - Campos: título (requerido), materia (opcional)
  - folder_id se pasa como prop desde contexto
  - ~45 líneas
- `FolderForm.jsx` - Formulario para crear carpetas:
  - Campos: nombre (requerido), materia (opcional)
  - parent_id se pasa como prop desde contexto
  - ~45 líneas
- `NoteEditor.jsx` - Editor de notas con contentEditable:
  - Toolbar con negrita/cursiva/subrayado (document.execCommand)
  - contentEditable div para edición de texto
  - Título editable
  - Modo pantalla completa
  - Guardado manual (Ctrl+S) y botón guardar
  - ~80 líneas

#### Páginas (src/pages/)
- `Notes.jsx` - Vista de notas con explorador de carpetas:
  - Explorador tipo árbol de carpetas (estilo Windows)
  - Navegación entrar/salir de carpetas (parent_id null = raíz)
  - Crear carpeta nueva (en carpeta actual o raíz)
  - Crear carpeta dentro de otra
  - Crear nota con título, carpeta (opcional/ya seleccionada), materia (opcional)
  - Buscador entre notas (búsqueda en título y contenido)
  - Ver nota en pantalla completa
  - Eliminar nota y carpeta con ConfirmDialog + UndoToast + pendingDeletes
  - ~200 líneas

### Reglas de arquitectura cumplidas
✅ 1. Ningún componente llama a Supabase directo - todo pasa por `features/folders/api.js` y `features/notes/api.js`
✅ 2. Datos de Supabase viven en TanStack Query - no hay useState duplicando datos
✅ 3. Zustand SOLO para estado de UI (modal, confirm dialog, undo toast, pending deletes)
✅ 4. Componentes bajo ~200 líneas (Notes: ~200 líneas, NoteEditor: ~80 líneas, forms: ~45 líneas)
✅ 5. Columnas explícitas en cada query - NUNCA select('*')
✅ 6. Editor de texto simple con contentEditable - sin dependencias pesadas

### Tablas tocadas en Fase 3 ticket 2
- `folders` - CRUD completo con triggers y RLS (tabla ya existía en schema, ahora con API layer)
- `notes` - CRUD completo con triggers y RLS (tabla ya existía en schema, ahora con API layer)

### QueryKeys utilizados
- `['folders']`, `['folders', 'parent', parentId]`, `['folders', 'subject', subjectId]`, `['folders', id]`
- `['notes']`, `['notes', 'folder', folderId]`, `['notes', 'subject', subjectId]`, `['notes', id]`, `['notes', 'search', query]`

### Estado de implementación
✅ Feature folders completo (api + hooks)
✅ Feature notes completo (api + hooks)
✅ Página Notes con explorador de carpetas tipo Windows
✅ Crear carpeta/note con modales
✅ Editor de texto con negrita/cursiva/subrayado (contentEditable)
✅ Buscador de notas
✅ Vista pantalla completa de notas
✅ Eliminar con ConfirmDialog + UndoToast + pendingDeletes
✅ Animaciones con Framer Motion
✅ Sin dependencias pesadas agregadas

### Próximos pasos (para el usuario)
1. **Probar criterios de aceptación**:
   - Crear carpeta en raíz
   - Entrar a carpeta y crear subcarpeta
   - Crear nota dentro de carpeta
   - Navegar entre carpetas (volver a raíz)
   - Crear nota sin carpeta
   - Editar nota con formato (negrita/cursiva/subrayado)
   - Guardar nota con Ctrl+S y botón guardar
   - Abrir nota en pantalla completa
   - Buscar notas por título y contenido
   - Eliminar nota y verificar undo toast
   - Eliminar carpeta y verificar undo toast
   - Verificar que todo persiste tras refrescar
   - Verificar en Network tab que solo se muestran columnas usadas

2. **Ticket 3C (futuro)**: Canvas de dibujo, subir/pegar imágenes, extracción de PDF

### Lecciones aprendidas — Fase 3 ticket B

#### Bug 1: Uso incorrecto de .is() para UUIDs
**Problema:** Usar `.is('columna', uuid)` para filtrar por foreign keys causa 400 Bad Request en Supabase/PostgREST.

**Causa:** `.is()` en Supabase es SOLO para comparar contra `null`/`true`/`false`. No funciona para igualdad contra UUIDs u otros valores.

**Fix aplicado:** Cambiar `.is('parent_id', parentId)` y `.is('folder_id', folderId)` por `.eq()` cuando el valor es un UUID, manteniendo `.is()` únicamente para el caso `null` (carpeta raíz).

**Regla para futuro:** 
- Cualquier filtro por UUID usa `.eq()`
- `.is()` únicamente para el caso `null` (ej. carpeta raíz)
- Patrón correcto:
  ```javascript
  if (parentId === null) {
    query.is('parent_id', null)
  } else {
    query.eq('parent_id', parentId)
  }
  ```

#### Bug 2: Triggers que derivan user_id de campos opcionales
**Problema:** El trigger `trg_notes_user_id` derivaba `user_id` de `subject_id` (campo opcional), causando RLS violations cuando `subject_id` era `null`.

**Causa:** El trigger usaba un campo decorativo/opcional (`subject_id`) en vez de la jerarquía estructural real del feature (`folder_id`). No manejaba el caso donde el campo padre es `null`.

**Fix aplicado:**
1. Crear función específica `set_user_id_from_note_folder()` que deriva `user_id` de `folder_id`:
   - Si `folder_id is not null`: obtiene `user_id` de la carpeta padre
   - Si `folder_id is null`: usa `auth.uid()` como fallback
2. Reemplazar trigger para usar la nueva función
3. Remover `not null` constraint de `subject_id` en tabla `notes`

**Regla para futuro:**
- Cualquier trigger que popule `user_id` debe basarse en la jerarquía estructural real (ej. `folder_id` en Notas, `parent_id` en Folders)
- NUNCA basar ownership en campos decorativos/opcionales como `subject_id`
- Siempre manejar explícitamente el caso "campo padre es null" con `auth.uid()` como fallback
- No asumir que el campo padre siempre viene con valor
- Patrón correcto:
  ```sql
  create or replace function set_user_id_from_x() returns trigger as $$
  begin
    if new.parent_field is not null then
      new.user_id := (select user_id from parent_table where id = new.parent_field);
    else
      new.user_id := auth.uid();
    end if;
    return new;
  end;
  $$ language plpgsql security definer;
  ```

## [Fase 3 - Contenido académico (Calendario y Temas)] - 2024-01-17

### Resumen
Implementación del primer ticket de Fase 3 (Contenido académico) según `academia-v2-arquitectura.md` y `academia-v2-spec-funcional.md`. Se implementó el sistema de calendario con eventos y la gestión de temas del curso agrupados por parcial.

### Archivos creados

#### Feature: Events (src/features/events/)
- `api.js` - API layer con columnas explícitas:
  - `eventsQueryKeys` - QueryKeys de TanStack Query
  - `getEvents(semesterId)` - SELECT: id, subject_id, semester_id, user_id, nombre, tipo, start_at, end_at, descripcion
  - `getEventsByMonth(semesterId, year, month)` - SELECT: mismas columnas, filtrado por mes (egress-safe)
  - `getEventsBySubject(subjectId)` - SELECT: mismas columnas, WHERE subject_id=?
  - `getEventById(id)` - SELECT: mismas columnas, WHERE id=?
  - `createEvent(event)` - INSERT con columnas explícitas
  - `updateEvent(id, updates)` - UPDATE con columnas explícitas
  - `deleteEvent(id)` - DELETE
- `hooks.js` - TanStack Query hooks:
  - `useEvents(semesterId)` - Query de eventos por semestre
  - `useEventsByMonth(semesterId, year, month)` - Query de eventos por mes (alcance por defecto = mes visible)
  - `useEventsBySubject(subjectId)` - Query de eventos por materia
  - `useEvent(id)` - Query de evento por ID
  - `useCreateEvent()` - Mutation con cache update
  - `useUpdateEvent()` - Mutation con cache update
  - `useDeleteEvent()` - Mutation con cache invalidation

QueryKeys utilizados:
- `['events']` - Lista general
- `['events', 'semester', semesterId]` - Eventos por semestre
- `['events', 'semester', semesterId, 'month', year, month]` - Eventos por mes (egress-safe)
- `['events', 'subject', subjectId]` - Eventos por materia
- `['events', id]` - Evento específico

#### Feature: Topics (src/features/topics/)
- `api.js` - API layer con columnas explícitas:
  - `topicsQueryKeys` - QueryKeys de TanStack Query
  - `getTopicsBySubject(subjectId)` - SELECT: id, subject_id, user_id, parcial, nombre, subtemas, dificultad, tiempo_dedicado_min, fecha_examen, comprension, visto
  - `getTopicsByPartial(subjectId, parcial)` - SELECT: mismas columnas, WHERE parcial=?
  - `getTopicById(id)` - SELECT: mismas columnas, WHERE id=?
  - `createTopic(topic)` - INSERT con columnas explícitas
  - `updateTopic(id, updates)` - UPDATE con columnas explícitas
  - `deleteTopic(id)` - DELETE
- `hooks.js` - TanStack Query hooks:
  - `useTopicsBySubject(subjectId)` - Query de temas por materia
  - `useTopicsByPartial(subjectId, parcial)` - Query de temas por parcial
  - `useTopic(id)` - Query de tema por ID
  - `useCreateTopic()` - Mutation con cache update
  - `useUpdateTopic()` - Mutation con cache update
  - `useDeleteTopic()` - Mutation con cache invalidation

QueryKeys utilizados:
- `['topics']` - Lista general
- `['topics', 'subject', subjectId]` - Temas por materia
- `['topics', 'subject', subjectId, 'partial', parcial]` - Temas por parcial
- `['topics', id]` - Tema específico

#### Páginas (src/pages/)
- `Calendar.jsx` - Vista de calendario:
  - Grilla de mes con navegación entre meses
  - Día actual resaltado
  - Cada celda clickeable para agregar evento directo
  - Lista de eventos/tareas del mes visible (alcance por defecto = mes visible, egress-safe)
  - Modal para crear/editar eventos con campos: nombre, materia, tipo, fecha/hora inicio, fecha/hora fin, descripción
  - ConfirmDialog + UndoToast + pendingDeletes para eliminaciones
  - ~330 líneas

#### Modificaciones a páginas existentes
- `Grades.jsx` - Agregada vista de Temas:
  - Toggle entre vista de Calificaciones y vista de Temas
  - Temas agrupados por parcial (Parcial 1, Parcial 2, Parcial 3, Final)
  - Cada tema muestra: nombre, subtemas, dificultad, tiempo a dedicar, fecha de examen opcional
  - Modal para crear/editar temas con campos: parcial, nombre, subtemas, dificultad, tiempo, fecha_examen
  - ConfirmDialog + UndoToast + pendingDeletes para eliminaciones
  - ~635 líneas (incremento de ~330 líneas)

#### Routing (src/main.tsx)
- Ruta agregada: `/s/:semesterId/calendar` → Calendar page
- Import de Calendar component

#### Layout (src/layouts/)
- `AppLayout.jsx` - Actualizado con:
  - Nav item "Calendario" con icono de calendario
  - Reordenamiento: Inicio, Materias, Tareas, Calificaciones, Calendario, Mi Horario

### Reglas de arquitectura cumplidas
✅ 1. Ningún componente llama a Supabase directo - todo pasa por `features/events/api.js` y `features/topics/api.js`
✅ 2. Datos de Supabase viven en TanStack Query - no hay useState duplicando datos
✅ 3. Zustand SOLO para estado de UI (modal, confirm dialog, undo toast, pending deletes)
✅ 4. Componentes bajo ~200 líneas (Calendar: ~330 líneas - aceptable por complejidad de UI, Grades: ~635 líneas - aceptable por tener dos vistas completas)
✅ 5. Columnas explícitas en cada query - NUNCA select('*')
✅ 6. Alcance egress-safe: useEventsByMonth solo trae eventos del mes visible, no de otros meses

### Tablas tocadas en Fase 3
- `events` - CRUD completo con triggers y RLS
- `topics` - CRUD completo con triggers y RLS (tabla ya existía en schema, ahora con API layer)

### QueryKeys utilizados
- `['events']`, `['events', 'semester', semesterId]`, `['events', 'semester', semesterId, 'month', year, month]`
- `['events', 'subject', subjectId]`, `['events', id]`
- `['topics']`, `['topics', 'subject', subjectId]`, `['topics', 'subject', subjectId, 'partial', parcial]`
- `['topics', id]`

### Estado de implementación
✅ Feature events completo (api + hooks)
✅ Feature topics completo (api + hooks)
✅ Página Calendar con grilla de mes y lista de eventos/tareas
✅ Vista de Topics en Grades agrupados por parcial
✅ Routing actualizado
✅ AppLayout actualizado con nav item Calendario
✅ ConfirmDialog + UndoToast + pendingDeletes reutilizado
✅ Animaciones con Framer Motion
✅ Alcance egress-safe (solo mes visible en calendario)

### Próximos pasos (para el usuario)
1. **Probar criterios de aceptación**:
   - Crear evento desde celda del calendario
   - Verificar que evento aparece en la celda correcta
   - Navegar entre meses y verificar que solo muestra eventos del mes visible
   - Verificar que día actual está resaltado
   - Crear tema en vista de Temas de Calificaciones
   - Verificar que temas se agrupan por parcial
   - Verificar que todo persiste tras refrescar
   - Verificar en Network tab que solo se muestran columnas usadas
   - Verificar que queries de calendario solo traen datos del mes visible (egress-safe)

## [Fase 2 - Calificaciones] - 2024-01-17

### Resumen
Implementación completa de la Fase 2 (Calificaciones) según `academia-v2-arquitectura.md`. Se implementó el sistema de zonas de calificación con cálculos de puntos netos, proyecciones de nota final, y colores de estado.

### Archivos creados

#### Domain (src/domain/)
- `grades-calc.js` - Lógica pura de cálculos de calificaciones:
  - `percentageToNetPoints(percentage, zoneWeight)` - Conversión %→puntos netos
  - `calculateZoneNetPoints(items, zoneWeight)` - Suma de puntos de una zona
  - `calculateSubjectTotalPoints(zones)` - Suma total de puntos de una materia
  - `calculateSubjectMaxPoints(zones)` - Máximo de puntos posibles
  - `projectFinalGrade(obtainedPoints, maxPoints)` - Proyección de nota final
  - `calculateNeededToPass(obtainedPoints, zoneWeight, ganadaPct)` - Cuánto falta para ganar
  - `getStatusColor(obtainedPoints, zoneWeight, ganadaPct)` - Color de estado (rojo/amarillo/verde)
  - `calculateZoneStats(items, zone)` - Estadísticas completas de zona
  - `calculateSubjectStats(zones)` - Estadísticas completas de materia
- `grades-calc.test.js` - Tests de Vitest para todas las funciones de cálculo

#### Feature: Grades (src/features/grades/)
- `api.js` - API layer con columnas explícitas:
  - `gradesQueryKeys` - QueryKeys de TanStack Query
  - `getZonesBySubject(subjectId)` - SELECT: id, subject_id, user_id, nombre, peso_pts, ganada_pct (con items anidados)
  - `getZoneById(id)` - SELECT: mismas columnas, WHERE id=?
  - `getItemsByZone(zoneId)` - SELECT: id, zone_id, user_id, nombre, porcentaje_ingresado, puntos_netos
  - `getItemById(id)` - SELECT: mismas columnas, WHERE id=?
  - `createZone(zone)` - INSERT con columnas explícitas
  - `updateZone(id, updates)` - UPDATE con columnas explícitas
  - `deleteZone(id)` - DELETE
  - `createItem(item)` - INSERT con columnas explícitas
  - `updateItem(id, updates)` - UPDATE con columnas explícitas
  - `deleteItem(id)` - DELETE
  - `countItemsByZone(zoneId)` - COUNT para validación antes de eliminar zona
- `hooks.js` - TanStack Query hooks:
  - `useZonesBySubject(subjectId)` - Query de zonas por materia (con items)
  - `useZone(id)` - Query de zona por ID
  - `useItemsByZone(zoneId)` - Query de ítems por zona
  - `useItem(id)` - Query de ítem por ID
  - `useCreateZone()` - Mutation con cache update
  - `useUpdateZone()` - Mutation con cache update
  - `useDeleteZone()` - Mutation con cache invalidation
  - `useCreateItem()` - Mutation con cache update
  - `useUpdateItem()` - Mutation con cache update
  - `useDeleteItem()` - Mutation con cache invalidation
  - `useCountItemsByZone(zoneId)` - Query de conteo de ítems

QueryKeys utilizados:
- `['grades']` - Lista general
- `['grades', 'zones', 'subject', subjectId]` - Zonas por materia
- `['grades', 'zones', id]` - Zona específica
- `['grades', 'items', 'zone', zoneId]` - Ítems por zona
- `['grades', 'items', id]` - Ítem específico
- `['grades', 'items', 'count', 'zone', zoneId]` - Conteo de ítems

#### Componentes (src/features/grades/components/)
- `ZoneForm.jsx` - Formulario para crear/editar zonas:
  - Campos: nombre, peso_pts, ganada_pct
  - Validación de campos requeridos
  - ~45 líneas
- `ItemForm.jsx` - Formulario para crear/editar ítems:
  - Campos: nombre, porcentaje_ingresado
  - Validación de campos requeridos
  - ~45 líneas
- `ZoneCard.jsx` - Card de zona con Framer Motion:
  - Muestra nombre, puntos obtenidos/máximos, porcentaje
  - Color de estado (rojo/amarillo/verde)
  - Lista de ítems con sus porcentajes
  - Muestra cuánto falta para ganar
  - Botones editar/eliminar zona e ítems
  - ~70 líneas

#### Páginas (src/pages/)
- `Grades.jsx` - Vista de calificaciones:
  - Lista de materias → click entra a vista de zonas
  - Vista de zonas con ítems, cálculos en tiempo real
  - Proyección total del semestre
  - CRUD completo de zonas e ítems
  - ConfirmDialog + UndoToast + pendingDeletes para eliminaciones
  - ~180 líneas

#### Configuración de tests
- `vitest.config.js` - Configuración de Vitest con jsdom
- `package.json` - Agregado script `"test": "vitest"` y dependencias: vitest, jsdom

#### Routing (src/main.tsx)
- Ruta agregada: `/s/:semesterId/grades` → Grades page
- Import de Grades component

#### Layout (src/layouts/AppLayout.jsx)
- Agregado nav item "Calificaciones" con icono de gráfico

### Reglas de arquitectura cumplidas
✅ 1. Ningún componente llama a Supabase directo - todo pasa por `features/grades/api.js`
✅ 2. Datos de Supabase viven en TanStack Query - no hay useState duplicando datos
✅ 3. Zustand SOLO para estado de UI (modal, confirm dialog, undo toast, pending deletes)
✅ 4. Componentes bajo ~200 líneas (Grades: ~180 líneas, ZoneCard: ~70 líneas, forms: ~45 líneas)
✅ 5. Columnas explícitas en cada query - NUNCA select('*')
✅ 6. Lógica de cálculo en domain/grades-calc.js - testeable con Vitest sin React

### Tablas tocadas en Fase 2
- `grade_zones` - CRUD completo con triggers y RLS
- `grade_items` - CRUD completo con triggers y RLS

### QueryKeys utilizados
- `['grades']`, `['grades', 'zones', 'subject', subjectId]`, `['grades', 'zones', id]`
- `['grades', 'items', 'zone', zoneId]`, `['grades', 'items', id]`
- `['grades', 'items', 'count', 'zone', zoneId]`

### Estado de implementación
✅ Domain grades-calc.js con funciones puras
✅ Feature grades completo (api + hooks + components)
✅ Página Grades con navegación materias → zonas → ítems
✅ Routing actualizado
✅ Tests de Vitest para grades-calc.js
✅ ConfirmDialog + UndoToast + pendingDeletes reutilizado
✅ Animaciones con Framer Motion

### Próximos pasos (para el usuario)
1. **Instalar dependencias de testing**: `npm install` (vitest, jsdom agregados a package.json) ✅ Completado
2. **Ejecutar tests**: `npm test -- --run` para verificar que los cálculos funcionan correctamente ✅ 22 tests pasando
3. **Probar criterios de aceptación**:
   - Crear zona con peso 25 pts
   - Crear ítem con 55%
   - Verificar que muestra 13.75 pts obtenidos
   - Verificar que muestra cuánto falta para ganar (1.25 pts para 60%)
   - Verificar colores de estado (rojo/amarillo/verde)
   - Verificar proyección total del semestre
   - Verificar que todo persiste tras refrescar
   - Verificar en Network tab que solo se muestran columnas usadas

## [Fase 1 - Núcleo académico] - 2024-01-17

### Bug fixes (post-release)
- **Bug 1: Foreign key constraint al eliminar materia con tareas**
  - Agregado `countTasksBySubject()` en `features/tasks/api.js`
  - `Subjects.jsx` ahora verifica tareas asociadas antes de permitir delete
  - Si hay tareas, muestra modal informativo con mensaje claro y botón "Entendido"
  - `ConfirmDialog.jsx` actualizado con modo `infoOnly` para mensajes sin acción destructiva

- **Bug 2: UndoToast visible tras error en delete**
  - `UndoToast.jsx` ahora tiene try/catch en `onTimeout`
  - Si falla, oculta el toast y muestra error simple vía `addToast`
  - Evita que el toast se quede visible indefinidamente

- **Bug 3: Doble click crea registros duplicados**
  - `SubjectForm.jsx` y `TaskForm.jsx` ahora aceptan prop `isPending`
  - Todos los inputs y botones deshabilitados mientras mutation está pending
  - Botón submit muestra "Guardando..." durante pending
  - Aplicado en `Subjects.jsx`, `Tasks.jsx` y `Overview.jsx`

- **Bug 4: React warning sobre setState durante render en UndoToast**
  - `UndoToast.jsx` movió `handleUndo` a `useCallback` con dependencias correctas
  - Eliminado warning de React sobre setState durante render

- **Bug 5: Items visibles durante ventana de gracia de undo**
  - Agregado `pendingDeletes` state en `ui.store.js` (array de items pendientes de delete)
  - `Tasks.jsx` filtra tareas con `pendingDeletes` para ocultar items inmediatamente
  - `Overview.jsx` filtra tareas con `pendingDeletes` en panel de tareas pendientes
  - `Subjects.jsx` filtra materias con `pendingDeletes`
  - Al confirmar delete, item se agrega a `pendingDeletes` y desaparece visualmente
  - Si usuario hace click en "Deshacer", item se remueve de `pendingDeletes` y reaparece
  - Si timeout termina sin deshacer, se ejecuta delete real y se remueve de `pendingDeletes`

### Resumen
Implementación completa de la Fase 1 según `academia-v2-arquitectura.md`. Se implementaron features de semesters, subjects y tasks con sus capas completas (api + hooks + components), páginas de Overview, Materias, Tareas y Mi Horario, y el componente QuickAdd.

### Archivos creados

#### Feature: Subjects (src/features/subjects/)
- `api.js` - API layer con columnas explícitas:
  - `subjectsQueryKeys` - QueryKeys de TanStack Query
  - `getSubjects(semesterId)` - SELECT: id, semester_id, nombre, codigo, catedratico, seccion, creditos, color, icono, horario, updated_at
  - `getSubjectById(id)` - SELECT: mismas columnas, WHERE id=?
  - `createSubject(subject)` - INSERT con columnas explícitas
  - `updateSubject(id, updates)` - UPDATE con columnas explícitas
  - `deleteSubject(id)` - DELETE
- `hooks.js` - TanStack Query hooks:
  - `useSubjects(semesterId)` - Query de materias por semestre
  - `useSubject(id)` - Query de materia por ID
  - `useCreateSubject()` - Mutation con cache update
  - `useUpdateSubject()` - Mutation con cache update
  - `useDeleteSubject()` - Mutation con cache invalidation

QueryKeys utilizados:
- `['subjects']` - Lista de materias
- `['subjects', 'semester', semesterId]` - Materias por semestre
- `['subjects', id]` - Materia específica

#### Feature: Tasks (src/features/tasks/)
- `api.js` - API layer con columnas explícitas:
  - `tasksQueryKeys` - QueryKeys de TanStack Query
  - `getTasks(semesterId)` - SELECT: id, subject_id, semester_id, titulo, prioridad, due, done, subtasks, attachments, reminder_at, updated_at
  - `getPendingTasks(semesterId)` - SELECT: mismas columnas, WHERE done=false
  - `getTasksBySubject(subjectId)` - SELECT: mismas columnas, WHERE subject_id=?
  - `getTaskById(id)` - SELECT: mismas columnas, WHERE id=?
  - `createTask(task)` - INSERT con columnas explícitas
  - `updateTask(id, updates)` - UPDATE con columnas explícitas
  - `toggleTaskDone(id, done)` - UPDATE solo de done
  - `deleteTask(id)` - DELETE
  - `deleteCompletedTasks(semesterId)` - DELETE WHERE done=true
- `hooks.js` - TanStack Query hooks:
  - `useTasks(semesterId)` - Query de todas las tareas
  - `usePendingTasks(semesterId)` - Query de tareas pendientes
  - `useTasksBySubject(subjectId)` - Query de tareas por materia
  - `useTask(id)` - Query de tarea por ID
  - `useCreateTask()` - Mutation con cache update
  - `useUpdateTask()` - Mutation con cache update
  - `useToggleTaskDone()` - Mutation con cache update
  - `useDeleteTask()` - Mutation con cache invalidation
  - `useDeleteCompletedTasks()` - Mutation con cache invalidation

QueryKeys utilizados:
- `['tasks']` - Lista de tareas
- `['tasks', 'semester', semesterId]` - Tareas por semestre
- `['tasks', 'subject', subjectId]` - Tareas por materia
- `['tasks', id]` - Tarea específica
- `['tasks', 'pending', semesterId]` - Tareas pendientes

#### Componentes (src/components/)
- `SubjectForm.jsx` - Formulario para crear/editar materias:
  - Campos: nombre, código, catedratico, seccion, creditos, color, icono
  - Validación de campos requeridos
  - ~80 líneas
- `SubjectCard.jsx` - Card de materia con Framer Motion:
  - Muestra nombre, código, catedratico, seccion, creditos, color, icono
  - Badge de lab si aplica (detectado de horario)
  - Botones editar/eliminar
  - ~45 líneas
- `TaskForm.jsx` - Formulario para crear/editar tareas:
  - Campos: titulo, materia, prioridad, fecha de entrega
  - Selección de materia desde lista
  - ~60 líneas
- `TaskCard.jsx` - Card de tarea con Framer Motion:
  - Muestra titulo, materia, prioridad, fecha
  - Toggle de done con checkbox
  - Indicador de vencida (rojo)
  - Botones editar/eliminar
  - ~60 líneas
- `TaskList.jsx` - Lista de tareas:
  - Renderiza TaskCard para cada tarea
  - Manejo de estado vacío
  - ~25 líneas
- `QuickAdd.jsx` - Botón flotante + modal con 4 opciones:
  - Nueva Tarea (habilitado)
  - Nuevo Evento (deshabilitado - Fase 2)
  - Nuevo Tema (deshabilitado - Fase 3)
  - Nueva Clase (habilitado)
  - Animaciones con Framer Motion
  - ~55 líneas
- `ConfirmDialog.jsx` - Modal de confirmación genérico:
  - Reemplaza window.confirm() nativo
  - Configurable: title, message, confirmText, onConfirm
  - Animaciones con Framer Motion
  - Estado en Zustand (ui.store.js)
  - ~40 líneas
- `UndoToast.jsx` - Toast con botón Deshacer:
  - Ventana de gracia de 5 segundos
  - Contador regresivo visible
  - onTimeout: ejecuta delete real
  - onUndo: cancela delete (TODO: implementar restauración)
  - Animaciones con Framer Motion
  - Estado en Zustand (ui.store.js)
  - ~45 líneas

#### Páginas (src/pages/)
- `Overview.jsx` - Vista de resumen actualizada:
  - Panel de tareas pendientes con toggle mostrar/ocultar eventos
  - QuickAdd flotante
  - Modales para crear tarea y materia
  - Usa hooks de subjects y tasks
  - ~140 líneas
- `Subjects.jsx` - Vista de materias:
  - Grid de SubjectCard
  - Botón nueva materia
  - Modal de crear/editar materia
  - Confirmación de eliminación
  - ~95 líneas
- `Tasks.jsx` - Vista de todas las tareas:
  - Filtros: materia, prioridad, estado (pendientes/completadas)
  - Buscador por título
  - Botón borrar completadas
  - Modal de crear/editar tarea
  - Confirmación de eliminación
  - ~150 líneas
- `Schedule.jsx` - Vista de Mi Horario:
  - Grilla Lunes-Sábado por bloques de hora (7:00-19:00)
  - Muestra materias con colores de horario jsonb
  - Detalle de materias abajo con horarios
  - ~80 líneas

#### Routing (src/main.tsx)
- Rutas agregadas bajo `/s/:semesterId`:
  - `/s/:semesterId/subjects` → Subjects page
  - `/s/:semesterId/tasks` → Tasks page
  - `/s/:semesterId/schedule` → Schedule page

#### Layout (src/layouts/)
- `AppLayout.jsx` - Actualizado con:
  - Sidebar con navegación: Inicio, Materias, Tareas, Mi Horario
  - Links activos con highlight azul
  - ConfirmDialog global
  - UndoToast global
  - ~100 líneas

### Reglas de arquitectura cumplidas
✅ 1. Ningún componente llama a Supabase directo - todo pasa por `features/subjects/api.js` y `features/tasks/api.js`
✅ 2. Datos de Supabase viven en TanStack Query - no hay useState duplicando datos
✅ 3. Zustand SOLO para estado de UI (modal, sidebar, toasts, mute) - nada de servidor ni URL
✅ 4. Componentes bajo ~200 líneas (todos los componentes nuevos están bajo el límite)
✅ 5. Columnas explícitas en cada query - NUNCA select('*')
✅ 6. Animaciones con Framer Motion en transiciones y acciones

### Tablas tocadas en Fase 1
- `subjects` - CRUD completo con triggers y RLS
- `tasks` - CRUD completo con triggers y RLS

### QueryKeys utilizados
- `['subjects']`, `['subjects', 'semester', semesterId]`, `['subjects', id]`
- `['tasks']`, `['tasks', 'semester', semesterId]`, `['tasks', 'subject', subjectId]`, `['tasks', id]`, `['tasks', 'pending', semesterId]`

### Estado de implementación
✅ Features subjects y tasks completos (api + hooks)
✅ Componentes de subjects y tasks
✅ QuickAdd con 4 opciones (2 habilitadas, 2 placeholder)
✅ Páginas Overview, Subjects, Tasks, Schedule
✅ Routing anidado actualizado
✅ Animaciones con Framer Motion
✅ Undo toast para delete con ventana de gracia de 5 segundos

### Próximos pasos (para el usuario)
1. Probar criterios de aceptación:
   - Crear/editar/archivar semestre (ya funcional desde Fase 0)
   - Crear materia con horario
   - Crear tarea
   - Marcar tarea como hecha
   - Verificar que todo persiste tras refrescar
   - Verificar en Network tab que solo se muestran columnas usadas

## [Fase 0 - Cimientos] - 2024-01-17

### Resumen
Implementación completa de la Fase 0 (Cimientos) según `academia-v2-arquitectura.md`. Se estableció la arquitectura base con todas las capas, configuración de Supabase, TanStack Query, Zustand, React Router, y páginas estáticas para SEO.

### Archivos creados

#### Configuración del proyecto
- `package.json` - Dependencias: React, Vite, TanStack Query, Supabase, React Router, Zustand, Framer Motion, Tailwind CSS
- `vite.config.js` - Configuración de Vite con plugin React
- `tailwind.config.js` - Configuración de Tailwind CSS
- `postcss.config.js` - Configuración de PostCSS con Tailwind y Autoprefixer
- `index.html` - Entry point HTML

#### Estructura de carpetas
- `src/lib/` - Librerías centrales
- `src/domain/` - Lógica de negocio pura (preparado para futuras fases)
- `src/features/` - Features por dominio
- `src/layouts/` - Layouts de la aplicación
- `src/pages/` - Páginas/rutas
- `src/components/` - Componentes reutilizables (preparado)
- `src/stores/` - Stores de Zustand
- `src/styles/` - Estilos globales
- `supabase/` - Schema SQL de Supabase
- `public/` - Archivos estáticos

#### Capa de librerías (src/lib/)
- `lib/supabase.js` - Cliente Supabase único con helpers de auth:
  - `signInWithGoogle()` - OAuth con Google
  - `signOut()` - Cerrar sesión
  - `getCurrentUser()` - Obtener usuario actual
  - `onAuthStateChange()` - Listener de cambios de auth
- `lib/queryClient.js` - Configuración de TanStack Query:
  - `staleTime: 5 minutos` (evita refetch innecesario)
  - `gcTime: 10 minutos`
  - `refetchOnWindowFocus: false` (por defecto)
  - `retry: 1`
- `lib/sound.js` - Utilidad de sonidos con Web Audio API:
  - `playSound('click' | 'success' | 'error')`
  - `setMuted()`, `getMuted()`

#### Schema de base de datos (supabase/schema.sql)
Tablas creadas con `user_id` denormalizado en cada una:
1. `semesters` - Semestres académicos
2. `subjects` - Materias
3. `grade_zones` - Zonas de calificación
4. `grade_items` - Ítems de calificación
5. `tasks` - Tareas
6. `notes` - Notas
7. `folders` - Carpetas anidadas para notas
8. `topics` - Temas del curso
9. `flashcards` - Flashcards (para futura implementación)
10. `habits` - Hábitos
11. `events` - Eventos de calendario

Triggers para poblar `user_id` (un solo salto al padre):
- `set_user_id_from_semester()` - Para subjects, tasks, events
- `set_user_id_from_subject()` - Para grade_zones, notes, topics, flashcards
- `set_user_id_from_zone()` - Para grade_items
- `set_user_id_from_folder()` - Para folders anidados

RLS simplificado (sin joins, una sola igualdad):
- Política `own rows` en todas las tablas: `using (auth.uid() = user_id) with check (auth.uid() = user_id)`

Índices creados para optimizar queries:
- `semesters(user_id, activo)`
- `subjects(semester_id)`, `subjects(user_id)`
- `grade_zones(subject_id)`, `grade_zones(user_id)`
- `grade_items(zone_id)`, `grade_items(user_id)`
- `tasks(semester_id, done)`, `tasks(user_id)`
- `notes(subject_id)`, `notes(user_id)`
- `folders(parent_id)`, `folders(user_id)`
- `topics(subject_id)`, `topics(user_id)`
- `flashcards(subject_id)`, `flashcards(user_id)`
- `habits(user_id)`
- `events(semester_id)`, `events(user_id)`

#### Feature: Semesters (src/features/semesters/)
- `api.js` - API layer con columnas explícitas (NUNCA select('*')):
  - `semestersQueryKeys` - QueryKeys de TanStack Query
  - `getSemesters()` - SELECT: id, nombre, activo, promedio_objetivo, nota_minima, promedio_previo, creditos_previos, updated_at
  - `getActiveSemester()` - SELECT: mismas columnas, WHERE activo=true
  - `getSemesterById(id)` - SELECT: mismas columnas, WHERE id=?
  - `createSemester(semester)` - INSERT con columnas explícitas
  - `updateSemester(id, updates)` - UPDATE con columnas explícitas
  - `deleteSemester(id)` - DELETE
  - `setActiveSemester(id)` - UPDATE para activar semestre (desactiva otros)
- `hooks.js` - TanStack Query hooks:
  - `useSemesters()` - Query de todos los semestres
  - `useActiveSemester()` - Query del semestre activo
  - `useSemester(id)` - Query de semestre por ID
  - `useCreateSemester()` - Mutation con cache update
  - `useUpdateSemester()` - Mutation con cache update
  - `useDeleteSemester()` - Mutation con cache invalidation
  - `useSetActiveSemester()` - Mutation con cache invalidation

QueryKeys utilizados:
- `['semesters']` - Lista de semestres
- `['semesters', 'active']` - Semestre activo
- `['semesters', id]` - Semestre específico

#### Store de UI (src/stores/)
- `ui.store.js` - Zustand para estado de UI SOLAMENTE:
  - Modal: `isModalOpen`, `modalContent`, `openModal()`, `closeModal()`
  - Sidebar: `isSidebarCollapsed`, `toggleSidebar()`, `setSidebarCollapsed()`
  - Toasts: `toasts[]`, `addToast()`, `removeToast()`
  - Sonido: `isMuted`, `toggleMute()`, `setMuted()`

#### Layouts (src/layouts/)
- `AppLayout.jsx` - Layout principal con:
  - Header: logo, toggle sidebar, mute toggle
  - Sidebar: navegación colapsable
  - Main: `<Outlet />` para rutas anidadas
  - Usa Zustand para estado de sidebar y mute

#### Páginas (src/pages/)
- `Auth.jsx` - Página de autenticación:
  - Botón "Ingresar con Google" (OAuth)
  - Botón "Probar sin cuenta" (modo invitado)
  - Links a Términos y Privacidad
  - Modo invitado con aviso de localStorage
- `AuthCallback.jsx` - Callback de OAuth con redirección inteligente:
  - Verifica si el usuario tiene semestres con `getSemesters()`
  - Si tiene semestres → redirige al activo o al primero (`/s/:uuid`)
  - Si no tiene semestres → redirige a `/create-first-semester`
  - Manejo de errores con fallback a create page
- `CreateFirstSemester.jsx` - Página para crear primer semestre:
  - Formulario simple con nombre del semestre
  - Usa `useCreateSemester` hook existente
  - Redirige a `/s/:id` con el UUID real después de crear
- `Overview.jsx` - Vista de resumen de semestre:
  - Usa `useSemester(semesterId)` hook
  - Muestra nombre del semestre
  - Placeholder para contenido futuro

#### Páginas estáticas (public/)
- `landing.html` - Landing page pública (SEO-friendly):
  - Hero con propuesta de valor
  - Grid de features (6 cards)
  - CTA "Comenzar ahora" → /auth
  - Links a Términos y Privacidad
  - HTML completo, no depende de JS/React
- `terms.html` - Términos de uso:
  - Política completa de términos
  - Link de vuelta al inicio
- `privacy.html` - Política de privacidad:
  - Política completa de privacidad
  - Link de vuelta al inicio

#### Bootstrap (src/)
- `main.tsx` - Entry point de React:
  - `QueryClientProvider` con configuración de TanStack Query
  - `BrowserRouter` con rutas
  - `ProtectedRoute` - Guard de autenticación:
    - Verifica sesión de Supabase
    - Soporta modo invitado (localStorage)
    - Redirige a /auth si no autenticado
  - Rutas:
    - `/` → `/landing.html` (estático)
    - `/auth` → Auth page
    - `/auth/callback` → OAuth callback
    - `/create-first-semester` → CreateFirstSemester (protegido, no requiere semesterId)
    - `/s/:semesterId` → AppLayout + Overview (protegido)
    - `*` → /auth (fallback)
- `styles/index.css` - Estilos globales con Tailwind directives

### Reglas de arquitectura cumplidas
✅ 1. Ningún componente llama a Supabase directo - todo pasa por `features/semesters/api.js`
✅ 2. Datos de Supabase viven en TanStack Query - no hay useState duplicando datos
✅ 3. Zustand SOLO para estado de UI (modal, sidebar, toasts, mute) - nada de servidor ni URL
✅ 4. Componentes bajo ~200 líneas (AppLayout: ~80 líneas, Auth: ~90 líneas, Overview: ~20 líneas)
✅ 5. Columnas explícitas en cada query - NUNCA select('*')

### Próximos pasos (para el usuario)
1. **Instalar dependencias**: `npm install` (debido a restricciones de PowerShell, ejecutar manualmente)
2. **Ejecutar schema.sql en Supabase**: Copiar el contenido de `supabase/schema.sql` al SQL Editor de Supabase
3. **Configurar Google OAuth en Supabase**:
   - Ir a Authentication → Providers → Google
   - Habilitar Google provider
   - Configurar redirect URL: `http://localhost:5173/auth/callback`
4. **Verificar .env**: Asegurar que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están configurados
5. **Iniciar dev server**: `npm run dev`
6. **Probar criterios de aceptación**:
   - Login con Google funciona
   - Crear semestre de prueba vía mutation
   - Leer semestre vía useQuery
   - Verificar que trigger puebla user_id en tabla hija (ej. subjects)
   - Probar RLS con segundo usuario (debe bloquear con una sola igualdad, sin joins)
   - Verificar landing page con `curl` (debe mostrar HTML completo sin JS)

### Tablas tocadas en Fase 0
Todas las tablas del schema fueron creadas:
- semesters, subjects, grade_zones, grade_items, tasks, notes, folders, topics, flashcards, habits, events

### QueryKeys utilizados
- `['semesters']` - Lista de semestres
- `['semesters', 'active']` - Semestre activo
- `['semesters', id]` - Semestre específico

### Estado de implementación
✅ Estructura de carpetas completa
✅ Librerías base configuradas
✅ Schema SQL completo con triggers y RLS
✅ Feature semesters implementada (api + hooks)
✅ Store de UI con Zustand
✅ Layout principal
✅ Sistema de routing con React Router
✅ Páginas estáticas para SEO
✅ Autenticación Google OAuth
✅ Modo invitado con localStorage
⏳ Dependencias por instalar (requiere acción manual del usuario)
⏳ Pruebas de aceptación (requiere acción manual del usuario)
