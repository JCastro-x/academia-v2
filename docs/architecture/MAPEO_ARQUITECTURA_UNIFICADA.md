# 🗺️ Mapeo Feature-por-Feature — App Académica Unificada

**Stack base:** React 18 + Vite + Supabase + PWA
**La Campaña:** queda como app independiente, pero **conectada por eventos** (ver sección 14) — no se le duplica captura de tareas/hábitos.
**Fuentes:** Ritmo (R), Academia v2 (V2), Academia Dev (AD)

---

## 1. Autenticación

| Decisión | Fuente | Detalle |
|---|---|---|
| Google OAuth + modo invitado | **V2** (base) + **AD** (fix) | V2 tiene el flujo correcto (`AuthCallback`, `ProtectedRoute`), pero su modo invitado está roto (solo setea localStorage, no persiste nada real). AD también lo deja incompleto. **Hay que diseñarlo de cero**: invitado = todo en IndexedDB local, con opción de "reclamar cuenta" después que migre esos datos a Supabase al hacer login. |
| Sesión persistente + auto-refresh | **AD** | `persistSession`, `autoRefreshToken`, `detectSessionInUrl` ya configurados correctamente en `js/auth.js`. Portar la config, no la implementación vanilla. |

## 2. Modelo de datos base

| Decisión | Fuente | Detalle |
|---|---|---|
| Schema SQL relacional (semesters, subjects, grade_zones, grade_items, tasks, notes, folders, topics, habits, events, pomodoro_sessions, profiles) | **V2** | Es el único con schema.sql real, RLS por tabla, triggers de `user_id`. Se usa tal cual como punto de partida. |
| Enriquecer `tasks` con tipo "cantidad" vs "checklist" | **R** | El schema de V2 solo tiene `done: boolean` + `subtasks: jsonb`. Agregar columnas `tipo`, `total_units`, `work_days`, `log` (jsonb) para soportar tareas de "avanzar N de Y" con el motor de ritmo de Ritmo (ver sección 4). |
| Zonas de calificación estilo USAC | **V2 y AD** (coinciden) | Ambas ya modelan lo mismo (`grade_zones` + `grade_items` en V2 = `zones` + `subs` en AD). Se usa el schema relacional de V2, es más normalizado que el JSON anidado de AD. |
| ~~Flashcards~~ | **Descartado** | No las usas. Se elimina la tabla `flashcards` del schema y el componente de AD no se porta. |

## 3. Gestión académica (semestres, materias)

| Decisión | Fuente | Detalle |
|---|---|---|
| CRUD semestres/materias | **V2** | Hooks de React Query ya feature-based (`features/semesters`, `features/subjects`), listos para reutilizar tal cual. |
| Vista semanal por día (Lun–Dom) | **R** (base técnica) + **rediseño** | Se descarta el layout original de Ritmo (cursos en filas × semanas en columnas). Nuevo layout: cada semana del semestre es una pestaña/sección, y dentro de ella los **días Lun–Dom son las filas/columnas visibles**, mostrando qué materias/tareas/eventos caen ese día (cruzando `subjects.horario`, `tasks.due` y `events.start_at`). Se reutiliza la lógica de navegación entre semanas (`getSelectedWeek`, `activeWeek`) de `semesterUtils.js`, pero la generación de celdas se reescribe desde cero. |
| Vinculación materia ↔ laboratorio (`parentId`/`linkedLabId`) | **AD** | Feature que V2 no tiene. Útil si tus materias de la USAC tienen labs asociados — portar el concepto al schema de V2 como FK `linked_lab_id` en `subjects`. |

## 4. Tareas + motor de ritmo ⭐

| Decisión | Fuente | Detalle |
|---|---|---|
| CRUD de tareas | **V2** | Base (`features/tasks`). |
| Motor de "ritmo" (¿voy adelantado/atrasado?) | **R** | Portar `computeCantidadStats`, `computeChecklistStats`, `statusFromProgress`, `baseTimeStats` de `taskStats.js` **tal cual, como funciones puras** (no dependen de framework) a `src/domain/task-stats.js`, junto al dominio de cálculo de notas que ya tiene tests en V2. Este es el diferenciador que ninguna Academia tiene. |
| Heatmap de constancia | **R** | Portar `heatmap.js` (SVG) como componente React, alimentado por el campo `log` de la tarea tipo "cantidad". |
| Subtareas, adjuntos, recordatorios | **V2** | Ya en el schema (`subtasks jsonb`, `attachments jsonb`, `reminder_at`). |

## 5. Notas

| Decisión | Fuente | Detalle |
|---|---|---|
| Notas de texto enriquecido + carpetas | **V2** | Schema y CRUD ya listos (`notes`, `folders` recursivas). |
| OCR de imágenes/PDFs | **AD** | Único que lo tiene (Tesseract.js). Portar como hook que sube a `note_attachments` de V2. |
| Visor de PDF integrado | **AD** | Portar componente sobre PDF.js. |
| Canvas de dibujo | **V2** | Ya tiene `DrawingCanvas.jsx` (react-painter). AD también lo tiene vía IndexedDB — quedarse con el de V2 por estar en React nativo. |
| Sanitización XSS del contenido HTML | **AD** | DOMPurify — V2 no sanitiza nada antes de guardar `contenido`. Esto hay que agregarlo sí o sí, es un hueco de seguridad real en V2. |

## 6. Imágenes / Storage ⭐

| Decisión | Fuente | Detalle |
|---|---|---|
| Pipeline completo: compresión → thumbnail → IndexedDB (cache local) → Supabase Storage → manifest en tabla | **AD** | Esto es lo más maduro de las 4 apps, ya resuelto en producción (`idbSetImage`, `uploadImageToSupabase`, `downloadImageFromSupabase`). Se porta casi 1:1, solo cambiando la capa de persistencia local a algo compatible con React (mismo IndexedDB, wrapper distinto). |

## 7. Hábitos

| Decisión | Fuente | Detalle |
|---|---|---|
| CRUD + cálculo de racha (`streak`) | **V2** | `calculateStreak` en `features/habits/api.js` ya maneja frecuencia diaria/semanal correctamente. |
| Conexión a gamificación (opcional, futuro) | *(fuera de alcance)* | Si más adelante se conecta con La Campaña, el hook sería "hábito completado → evento → API de La Campaña", sin tocar el core. |

## 8. Calendario / Eventos

| Decisión | Fuente | Detalle |
|---|---|---|
| CRUD eventos + vista mensual | **V2** | Ya tiene `features/events` y `pages/Calendar.jsx`. |
| Vista de calendario con estilo/UX | **AD** | Si el look de AD te gusta más, portar solo el componente visual sobre los datos de V2. |

## 9. Pomodoro ⭐

| Decisión | Fuente | Detalle |
|---|---|---|
| Timer anti-throttle con Web Worker | **AD** | Crítico: en una pestaña de fondo, `setInterval` normal se ralentiza. AD ya resolvió esto. Portar el Web Worker tal cual (es JS puro, no depende de framework). |
| Picture-in-Picture flotante | **AD** | Único con esto. Muy útil para uso diario real (dejar el timer visible mientras trabajas en otra pestaña). Portar usando `documentPictureInPicture` API. |
| Modelo de sesiones (`pomodoro_sessions`) + estadísticas | **V2** | Schema y cálculo de stats (`calculatePomodoroStats`) ya en React Query. |

## 10. Sincronización / Offline

| Decisión | Fuente | Detalle |
|---|---|---|
| Estrategia de cache/estado servidor | **V2** | React Query con `staleTime`/`gcTime` — reemplaza la sync manual debounced de AD, que es la fuente de sus bugs de "pérdida de datos si cierras antes de flush". |
| Concepto de "offline-first con merge" | **AD** (idea) | La idea es buena (funcionar sin conexión), pero la implementación (merge manual remoto+local) es frágil. En React se resuelve mejor con React Query + `persistQueryClient` (cache en IndexedDB) en vez de reinventar el merge. |

## 11. PWA / Mobile

| Decisión | Fuente | Detalle |
|---|---|---|
| Manifest + Service Worker + instalable | **R** o **AD** (equivalentes) | Ambos tienen esto resuelto de forma simple. Se reconstruye para Vite con `vite-plugin-pwa`, no se porta el código a mano. |

## 12. Seguridad / Config

| Decisión | Fuente | Detalle |
|---|---|---|
| Variables de entorno (no hardcoded) | **V2** | Es la única que usa `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` vía `.env`. Ritmo y AD tienen credenciales hardcoded en el código — corregir esto en la migración, no heredarlo. |
| RLS por tabla | **V2** | Política `auth.uid() = user_id` en todas las tablas — se mantiene y se refuerza para el modo invitado (ver sección 1). |

## 13. Testing

| Decisión | Fuente | Detalle |
|---|---|---|
| Tests unitarios de dominio puro | **V2** | `grades-calc.test.js` ya existe — extender el mismo patrón al nuevo `task-stats.js` portado de Ritmo (sección 4), porque es la lógica más "delicada" (fechas, cálculos, umbrales) y la más fácil de romper sin darte cuenta. |

## 14. Integración con La Campaña (eventos, sin duplicar captura) ⭐

**Principio:** el core académico sigue siendo la **única fuente de verdad** para tareas/hábitos/pomodoros. La Campaña no vuelve a pedirte que captures nada — solo **reacciona** a lo que ya completaste ahí.

| Decisión | Detalle |
|---|---|
| Qué dispara un evento | Completar una tarea (`tasks.done = true`), terminar una sesión de Pomodoro (`pomodoro_sessions` insertada), y marcar un hábito del día (`habits` toggle). |
| Cómo viaja el evento | La Campaña hoy es 100% local (`localStorage`, sin backend). Para recibir eventos remotos necesita **algún punto de entrada en la nube** — dos caminos posibles: <br>**(a)** La Campaña migra su persistencia a Supabase (mismo proyecto que el core) y el core simplemente inserta filas en una tabla compartida `campaign_events` que La Campaña lee al abrir. Más simple, reutiliza infraestructura ya definida. <br>**(b)** La Campaña sigue 100% local, y el core expone un export/webhook manual que ella importa. Menos elegante, pero cero cambios en La Campaña. |
| Mapeo de datos | La Campaña espera `difficulty` + `volume` por tarea (para calcular oro y reclutar tropas — ver `recruitTroops()`). El core no tiene "dificultad" como concepto. Hay que decidir: ¿se infiere de la prioridad de la tarea (`prioridad: alta/media/baja` → dificultad), o se agrega un campo nuevo? Sugiero **mapear `prioridad` → `difficulty`** para no pedirte un campo extra al crear tareas. |
| Bono de sueño/fitness | En La Campaña el oro extra depende de dos toggles (`habits.wake`, `habits.sleep`, `gym`, `nutrition`). En el core esos ya no existen como campos fijos — son hábitos personalizados cualquiera. Sugiero mapear por **nombre/categoría de hábito** (ej. categoría `wellness` o `fitness` → cuenta como bono), en vez de hardcodear 4 hábitos fijos. |
| Recomendación de fase | Esto se diseña **después** de tener el core funcionando (sección "Próximos pasos"), porque depende de decisiones que aún no existen (¿prioridad de tarea? ¿categorías de hábito?). Se deja marcado como fase 2, no bloquea el arranque del proyecto. |

## 15. Diseño Visual / UX — sistema unificado ⭐

**Punto de partida confirmado:** v2 hoy no tiene identidad visual (sidebar genérico, iconos outline sin personalidad, solo tema claro, sin theming). Es lienzo en blanco — se construye el sistema visual desde cero sobre su código, tomando lo mejor de Ritmo y Dev.

| Elemento | Fuente | Detalle |
|---|---|---|
| **Tema por defecto** | R + AD | Dark mode (`#0a0a0f`-ish) como default, con toggle claro/oscuro (AD ya lo tiene en Perfil, se porta el patrón). v2 arranca en claro — invertir el default. |
| **Color de acento único** | **R** | Violeta/índigo (`~#5b4fe5`) como color de marca. Se usa para acciones primarias, no para "identidad de materia". |
| **Color por materia** | AD (idea) + **R (disciplina)** | AD pinta fondos/badges completos por materia — se ve saturado con 6+ materias en pantalla a la vez (imágenes de Mi Horario/Calendario). Se adopta la idea (ayuda a escanear la semana) pero con la moderación de Ritmo: color solo en **borde izquierdo de card + punto pequeño**, nunca relleno de fondo. |
| **Badges de estado semántico** | **R** | Rojo=Crítico, Naranja=Atención, Verde=OK, Gris=Por iniciar. Es la UI directa del motor de ritmo (sección 4) — se conserva tal cual, es de lo más fuerte que tiene Ritmo. |
| **Cards de info densa (2×2 grid)** | **R** | Patrón "Meta diaria / Necesitás hoy / Completado / Días restantes" para detalle de tarea, y "Tareas / Parciales / Final / Labs" para calificaciones (AD ya usa una versión de esto en su desglose de notas). Se estandariza como componente reutilizable `StatGrid`. |
| **Heatmap de constancia** | **R** | Se porta como componente React, alimentado ahora también por hábitos y pomodoros completados, no solo por tareas tipo "cantidad". |
| **Vista "Mi Horario" (grid hora × día)** | **AD** | Ya resuelta visualmente en Dev (imagen: horas en filas, Lun–Sáb en columnas, bloques de color por materia). Se porta el layout casi 1:1, ampliándolo para mostrar también tareas/eventos de esa semana (no solo horario fijo de clases) — esto *es* la vista semanal rediseñada que definimos en la sección 3. |
| **Modo Examen (pantalla completa, timer gigante)** | **AD** | Se conserva tal cual, buen contraste con el resto de la UI (más denso) para un momento donde necesitas cero distracción. |
| **Hub de Reloj (Pomodoro/Cronómetro/Temporizador) + sonidos ambientales** | **AD** | Se porta completo, incluyendo el Web Worker anti-throttle (ya definido en sección 9) y los sonidos de fondo, que no estaban documentados en el audit técnico pero sí visibles en las capturas. |
| **Formularios: preview en vivo antes de guardar** | **AD** | "Configuración Académica" muestra el promedio recalculado en tiempo real antes de confirmar — patrón bueno, se extiende a otros formularios con cálculo (ej. crear tarea tipo "cantidad" con meta diaria). |
| **Prioridad en lenguaje natural** | **AD** | `"Baja — cuando pueda"` en vez de solo `"Baja"`. Detalle chico, se conserva — además esta es la misma prioridad que se mapea a "dificultad" para la integración con La Campaña (sección 14). |
| **Quick Add unificado** | **AD** | Un botón "+Agregar" → modal con 4 opciones (Tarea/Evento/Tema/Clase), en vez de 4 botones sueltos en la barra superior. |
| **Navegación mobile: bottom nav, no sidebar colapsado** | **AD** | Confirmado por captura responsive: Inicio/Tareas/Agregar/Horario/Más como tab bar inferior. Esto es un requisito de diseño, no cosmético — es la parte de la app que vas a usar más seguido desde el teléfono. Se descarta la idea de "mismo sidebar pero angosto". |
| **Formularios: un campo por fila, subtítulo gris de contexto** | **R** | Layout limpio ya validado en Ritmo, se mantiene como estándar de formularios. |

---

## Fuera de alcance / descartado

- Tabla y UI de flashcards — nunca las usaste, se elimina del schema.
- Sistema de gamificación completo de La Campaña como parte del core (ejército, batallas, regiones) — sigue siendo su propia app, solo conectada por eventos (sección 14).
- Panel de admin con analytics de AD (`page_views`, `get_admin_stats`) — tiene sentido para un producto multi-usuario en producción, no para uso personal.
- Migración a Turso mencionada en docs de AD — ya está marcada como obsoleta ahí mismo.
- Código legacy de AD (`js/legacy/`) — se reescribe sin esa capa de compatibilidad, no aplica en un proyecto nuevo.

---

## Próximos pasos sugeridos

1. Definir el schema SQL final (partiendo del de V2 + los agregados de la sección 2 y 4, **sin** la tabla `flashcards`).
2. Armar el esqueleto del proyecto (Vite + React + Supabase + `vite-plugin-pwa`).
3. Portar primero el dominio puro sin UI: `grades-calc.js` (ya existe) + `task-stats.js` (nuevo, desde Ritmo) — es lo más fácil de testear antes de tocar componentes.
4. Ir feature por feature según esta tabla, empezando por lo que más vayas a usar en el día a día del semestre (probablemente: tareas + motor de ritmo + vista semanal por día + notas).
5. **Fase 2** (después de que el core funcione): diseñar la integración con La Campaña (sección 14) — requiere primero tener definido cómo se categorizan hábitos y prioridades en el core.
6. Antes de escribir código: reactivar el proyecto Supabase de v2 (pausado por inactividad — dashboard de Supabase → Restore project) para confirmar que la base sí sirve tal cual o si hay que ajustarla.
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
# AUDIT REPORT — Ritmo

## 0. Resumen Ejecutivo
Ritmo es una aplicación web de gestión académica (PWA) para estudiantes que permite seguimiento de tareas, planificación semestral, vista de tabla semanal, y constancia de trabajo. Stack: JavaScript vanilla (ES6 modules), CSS personalizado, Supabase para persistencia en la nube, localStorage como fallback, Service Worker para offline. No usa frameworks frontend ni backend propios - es una SPA estática que funciona directamente en el navegador.

## 1. Mapeo Estructural y Dependencias

### 1.1 Árbol de Directorios

**Exclusiones explícitas:** `.git/` (control de versiones), `.git/` metadata objects (binarios internos), hooks de git sample files (no son código funcional del proyecto).

```
ritmo-app/
├── index.html              # HTML principal - entry point de la aplicación
├── manifest.json           # Manifest PWA - configuración de la app instalable
├── service-worker.js       # Service Worker - caché offline y estrategia de actualización
├── icon-192.svg            # Icono PWA 192x192
├── icon-512.svg            # Icono PWA 512x512
├── CHANGELOG.md            # Documentación de cambios del proyecto
├── css/
│   ├── base.css           # Variables CSS globales, reset, keyframes de animación
│   ├── layout.css          # Layout principal: topbar, container, semester panel
│   ├── components.css      # Componentes UI: progress bar, botones, cards, FAB, toast
│   ├── views.css          # Estilos de vistas: tabla, calendario, today, heatmap
│   ├── forms.css          # Formularios: inputs, checkboxes, selects, pickers
│   ├── modals.css         # Modales: overlay, panel, detail view, history, subtasks
│   └── responsive.css     # Media queries para desktop/mobile y safe areas
├── js/
│   ├── main.js            # Entry point - inicialización y event listeners globales
│   ├── state.js           # Gestión de estado y persistencia (localStorage + Supabase)
│   ├── ui.js              # Interacciones UI generales, tabs, tema, notificaciones
│   ├── modals.js          # Sistema de modales (16 modales distintos documentados)
│   ├── dateUtils.js       # Utilidades de fecha (parseDate, formatDate, diffDays, etc.)
│   ├── taskStats.js       # Cálculos de estadísticas de tareas (progress, status, ritmo)
│   ├── semesterUtils.js   # Utilidades de semestre (stats, week calculations)
│   ├── components/
│   │   ├── progressBar.js # Barra de progreso con animación
│   │   ├── heatmap.js     # Heatmap de constancia (streak, daily totals, summary)
│   │   ├── semesterPanel.js # Panel de progreso del semestre con fases
│   │   └── taskCard.js    # Tarjeta de tarea con sorting y renderizado
│   └── views/
│       ├── tableView.js   # Vista de tabla semanal (cursos x semanas)
│       ├── taskGridView.js # Vista de grid de todas las tareas
│       └── todayView.js   # Vista de tareas pendientes para hoy
└── AUDIT_REPORT.md        # Este archivo
```

**Rutas y propósitos:**

| Ruta | Propósito | Archivos clave dentro |
|---|---|---|
| `/` | Raíz del proyecto | `index.html`, `manifest.json`, `service-worker.js`, iconos SVG |
| `/css/` | Estilos CSS modularizados | `base.css` (variables globales), `components.css` (UI components), `views.css` (vistas específicas) |
| `/js/` | Lógica JavaScript modular | `main.js` (entry), `state.js` (estado/persistencia), `modals.js` (sistema de modales) |
| `/js/components/` | Componentes UI reutilizables | `progressBar.js`, `heatmap.js`, `semesterPanel.js`, `taskCard.js` |
| `/js/views/` | Vistas principales de la app | `tableView.js`, `taskGridView.js`, `todayView.js` |

**Archivos relevantes (no boilerplate):**

| Archivo | Función específica |
|---|---|
| `index.html` | Estructura HTML principal, carga de módulos ES6, registro de service worker, carga de Supabase CDN |
| `manifest.json` | Configuración PWA (nombre, iconos, theme color, orientation, display mode) |
| `service-worker.js` | Estrategia de caché stale-while-revalidate, versión de caché `2025-01-27-v2`, precaching de assets |
| `js/state.js` | Store global con 7 propiedades, API de 12 funciones exportadas, integración Supabase con canal real-time |
| `js/modals.js` | 16 funciones de modales, sistema genérico de overlay, validación de formularios, wireado de eventos |
| `js/taskStats.js` | Motor de cálculo de estadísticas: 4 funciones principales (baseTimeStats, statusFromProgress, computeCantidadStats, computeChecklistStats) |
| `js/semesterUtils.js` | Cálculos de semestre: week calculations, date-to-week mapping, task filtering por semana/curso |
| `js/components/heatmap.js` | 5 funciones: renderProgressChart (SVG), calculateStreak, getDailyTotals, renderHeatmap, getWeeklySummary |
| `js/views/tableView.js` | Renderizado incremental de tabla semanal, week navigation, cell editing, fullscreen mode |
| `js/views/todayView.js` | Renderizado incremental de vista hoy, ordenamiento por urgencia, integración con heatmap/summary |
| `js/views/taskGridView.js` | Renderizado incremental de grid de tareas, sorting por status, toggle active/inactive |

### 1.2 Dependencias

**Manifiestos presentes:** Ningún `package.json`, `requirements.txt`, `Pipfile`, `go.mod`, `Gemfile`, `composer.json` detectado.

**Dependencia externa (CDN):**

| Paquete | Versión exacta | Tipo (prod/dev) | Uso concreto en el proyecto |
|---|---|---|---|
| @supabase/supabase-js | 2 (via CDN jsdelivr) | prod | Cliente Supabase para persistencia en la nube y suscripción a cambios real-time en `state.js:12-16` |

**Dependencias de desarrollo:** No detectadas (no hay build step, npm, webpack, etc.)

**Observación:** ⚠️ NO DETERMINADO / REQUIERE VERIFICACIÓN MANUAL - No hay archivo de dependencias (`package.json` o similar). La única dependencia externa es Supabase cargado vía CDN en `index.html:77`. No hay otras librerías externas declaradas.

### 1.3 Variables de Entorno

| Variable | ¿Dónde se consume (archivo/línea)? | ¿Tiene valor por defecto? | ¿Es secreta/sensible? | Descripción funcional |
|---|---|---|---|---|
| `SUPABASE_URL` | `js/state.js:8` | No (hardcoded) | ⚠️ SÍ - URL de proyecto Supabase expuesta en código | URL del proyecto Supabase para persistencia |
| `SUPABASE_KEY` | `js/state.js:9` | No (hardcoded) | ⚠️ SÍ - API key pública expuesta en código | API key anónima/publishable de Supabase |
| `APP_SECRET` | `js/state.js:10` | No (hardcoded) | ⚠️ SÍ - secreto de aplicación expuesto en código | Header personalizado `x-app-secret` para autenticación con Supabase |
| `ritmo_theme` | `js/ui.js:102` (localStorage), `js/ui.js:112` (lectura) | SÍ (prefers-color-scheme) | No | Preferencia de tema (light/dark) persistida en localStorage |
| `ritmo_academic_v2` | `js/state.js:6` (clave localStorage) | No | No | Clave de localStorage para persistencia de estado |

**Observaciones de seguridad:**
- ⚠️ Las credenciales de Supabase (URL, key, APP_SECRET) están hardcodeadas en `js/state.js:8-10`. Esto es un riesgo de seguridad ya que el código es accesible desde el navegador.
- ⚠️ NO DETERMINADO / REQUIERE VERIFICACIÓN MANUAL - No hay archivo `.env.example` ni documentación sobre variables de entorno esperadas. No se detectó uso de variables de entorno del sistema.

### 1.4 Build y Deploy

**Proceso de construcción:**
- **No hay build step** - La aplicación no requiere compilación, bundling, o transpilación. Los archivos JS son módulos ES6 nativos cargados directamente por el navegador.
- **Archivos servidos directamente:** HTML, CSS, JS modules, SVGs son servidos estáticos sin procesamiento.

**Scripts de build/deploy:**
- No detectados (no `package.json` con scripts, no Makefile, no Dockerfile, no CI/CD en `.github/workflows/`).

**Entorno de ejecución objetivo:**
- **Runtime:** Navegador moderno con soporte para ES6 modules, Service Workers, y Fetch API
- **Plataforma de hosting:** ⚠️ NO DETERMINADO / REQUIERE VERIFICACIÓN MANUAL - No hay configuración de hosting detectada (no Netlify, Vercel, GitHub Pages config). Probablemente cualquier hosting estático (GitHub Pages, Netlify, Vercel, o servidor local).
- **Node version:** No aplicable (no usa Node.js en runtime)
- **Python version:** No aplicable

**Service Worker y Caching:**
- **Estrategia:** Stale-while-revalidate (service-worker.js:50-54)
- **Versión de caché:** `2025-01-27-v2` (service-worker.js:1)
- **Assets precacheados:** 27 archivos listados en `service-worker.js:4-28` (todos los CSS, JS modules, HTML, manifest)
- **Actualización:** El service worker se registra automáticamente en `index.html:80-84`. Para forzar actualización se requiere hard refresh o unregister manual.

**Instalación como PWA:**
- Configurado en `manifest.json` con `display: standalone`, `orientation: portrait`
- Iconos SVG 192x192 y 512x512
- Theme color `#1a1a1a`

## 2. Auditoría Técnica

### 2.1 Modelos de Datos y Esquemas

**Estado global (state.js:18-27):**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `semester` | Object \| null | null default | Configuración del semestre (start, end, phases) |
| `courses` | Array | Array default | Lista de cursos (cada curso: `{id, name}`) |
| `cells` | Object | {} default | Mapa de celdas de tabla (key: `courseId_week`, value: string) |
| `weekFlags` | Object | {} default | Mapa de banderas por semana (key: week number, value: flag string) |
| `calendarChecks` | Object | {} default | Mapa de checks de calendario (no usado activamente en código actual) |
| `tasks` | Array | Array default | Lista de tareas (ver esquema detallado abajo) |
| `cellDetails` | Object | {} default | Mapa de detalles de celdas (key: `courseId_week`, value: `{color, priority, description, subtasks, eventDate}`) |
| `activeWeek` | Number \| null | null default | Semana seleccionada actualmente en vista tabla |

**Esquema de Semester (objeto):**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `start` | String (YYYY-MM-DD) | Requerido | Fecha de inicio del semestre |
| `end` | String (YYYY-MM-DD) | Requerido | Fecha de fin del semestre |
| `phases` | Array | Array default (2-8 fases) | Lista de fases del semestre |

**Esquema de Phase (dentro de semester.phases):**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `name` | String | Requerido | Nombre de la fase (ej. "Adaptación", "Ajuste") |
| `start` | String (YYYY-MM-DD) | Requerido | Fecha de inicio de la fase |
| `end` | String (YYYY-MM-DD) | Requerido | Fecha de fin de la fase |

**Esquema de Course (dentro de courses array):**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | String | Generado por `uid()` | ID único del curso |
| `name` | String | Requerido | Nombre del curso |

**Esquema de Task (dentro de tasks array):**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | String | Generado por `uid()` | ID único de la tarea |
| `name` | String | Requerido | Nombre de la tarea |
| `type` | String | "cantidad" \| "checklist" | Tipo de tarea (cantidad de unidades o checklist de subtareas) |
| `startDate` | String (YYYY-MM-DD) | Requerido | Fecha de inicio |
| `endDate` | String (YYYY-MM-DD) | Requerido | Fecha límite |
| `courseId` | String | Opcional (default "") | ID del curso asociado |
| `icon` | String | Opcional (default "📋") | Emoji icono de la tarea |
| `categoryColor` | String | Opcional (default "") | Color de categoría ("blue", "purple", "cyan", "pink", "gray", "teal") |
| `active` | Boolean | Default true | Indica si la tarea está activa o pausada |
| `createdAt` | Number | Timestamp | Fecha de creación (timestamp) |
| **Campos específicos de tipo "cantidad":** | | | |
| `totalUnits` | Number | Requerido, > 0 | Total de unidades a completar |
| `workDays` | Array of Number | Requerido, no vacío | Días de trabajo (0=Dom, 1=Lun, ..., 6=Sáb) |
| `log` | Object | {} default | Mapa de progreso diario (key: fecha YYYY-MM-DD, value: número de unidades) |
| **Campos específicos de tipo "checklist":** | | | |
| `subtasks` | Array | Requerido, no vacío | Lista de subtareas (cada una: `{id, name, done}`) |

**Esquema de Subtask (dentro de task.subtasks):**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | String | Generado por `uid()` | ID único de la subtarea |
| `name` | String | Requerido | Nombre de la subtarea |
| `done` | Boolean | Default false | Indica si está completada |

**Esquema de CellDetails (dentro de cellDetails):**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `color` | String | Default "default" | Color de la celda ("default", "red", "orange", "yellow", "green", "blue", "purple", "pink") |
| `priority` | String | Default "medium" | Prioridad ("low", "medium", "high") |
| `description` | String | Default "" | Descripción del evento |
| `subtasks` | Array | Default [] | Subtareas de la celda (cada una: `{id, text, done}`) |
| `eventDate` | String (YYYY-MM-DD) | Default "" | Fecha del evento |

**Relaciones entre entidades:**
- **Course (1) → (N) Task:** Un curso puede tener múltiples tareas (`task.courseId` referencia `course.id`)
- **Course (1) → (N) Cell:** Un curso tiene una celda por semana (`cellKey = courseId_week`)
- **Task (1) → (N) Subtask:** Una tarea tipo checklist tiene múltiples subtareas
- **Task (1) → (N) Log Entry:** Una tarea tipo cantidad tiene múltiples registros de progreso diario
- **Semester (1) → (N) Phase:** Un semestre se divide en múltiples fases
- **WeekFlag (1) → (1) Week:** Cada semana puede tener una bandera (red, yellow, green, blue, none)

**Tipos/interfaces de TypeScript:** No aplicable - el proyecto usa JavaScript vanilla sin TypeScript.

### 2.2 Endpoints de API

**Endpoints de Supabase (consumidos vía cliente Supabase):**

| Método | Ruta | Middlewares aplicados | Request (body/params/query) | Response (shape) | Servicios externos que consume | Archivo:línea |
|---|---|---|---|---|---|---|
| SELECT | `app_state` (tabla) | Auth header `x-app-secret` | `.select('data').eq('id', 'ritmo').single()` | `{ data: { data: stateObject }, error }` | Supabase PostgreSQL | state.js:31-35 |
| UPDATE | `app_state` (tabla) | Auth header `x-app-secret` | `.update({ data: state }).eq('id', 'ritmo')` | `{ error }` | Supabase PostgreSQL | state.js:85-88 |
| SUBSCRIBE | `app_state` (tabla) | Canal real-time PostgreSQL | `.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_state', filter: 'id=eq.ritmo' })` | Payload con `new.data` | Supabase Realtime | state.js:200-211 |

**Servicios externos consumidos:**

| Servicio | Propósito | Credenciales requeridas | Endpoint/SDK usado |
|---|---|---|---|
| Supabase (PostgreSQL) | Persistencia de estado en la nube, sincronización real-time | SUPABASE_URL, SUPABASE_KEY, APP_SECRET (header `x-app-secret`) | SDK: `@supabase/supabase-js@2` (CDN) |
| Supabase Realtime | Sincronización de cambios en tiempo real entre dispositivos | Mismas credenciales que PostgreSQL | SDK: `@supabase/supabase-js@2` (channel subscription) |
| Google Fonts | Tipografías web (Sora, Inter, IBM Plex Mono) | Ninguna | CDN: `fonts.googleapis.com`, `fonts.gstatic.com` |

**Observaciones:**
- No hay endpoints REST propios (la app es estática)
- Toda la lógica de negocio corre en el cliente
- Supabase actúa como base de datos remota con sincronización real-time
- ⚠️ NO DETERMINADO / REQUIERE VERIFICACIÓN MANUAL - No hay documentación sobre la estructura exacta de la tabla `app_state` en Supabase (se asume que tiene columnas `id` (primary key) y `data` (JSONB))

### 2.3 Lógica de Negocio Central

**Funciones del core del negocio:**

| Nombre de función | Archivo:línea | Input | Output | Efectos secundarios | Descripción del algoritmo/lógica paso a paso |
|---|---|---|---|---|---|
| `loadState()` | state.js:29-66 | Ninguno | Promise<Object> (estado) | Lee de Supabase, fallback a localStorage, estructura default | 1. Intenta leer de Supabase tabla `app_state` con id='ritmo'. 2. Si error o no data, fallback a localStorage. 3. Parsea JSON de localStorage con validación de tipos (arrays). 4. Retorna estructura default vacía si todo falla. |
| `saveState()` | state.js:110-120 | Ninguno | Promise<boolean> | Guarda en localStorage (síncrono) y Supabase (async con retry) | 1. Llama `saveToLocal()` para guardado síncrono inmediato. 2. Llama `saveToCloudWithRetry(3)` en background (no bloquea). 3. Retorna resultado del guardado local. |
| `saveToLocal()` | state.js:69-78 | Ninguno | boolean | Escribe en localStorage | 1. Stringifica el estado global. 2. Escribe en localStorage con clave `ritmo_academic_v2`. 3. Retorna true/false según éxito. |
| `saveToCloudWithRetry()` | state.js:81-108 | maxRetries (default 3) | Promise<boolean> | Escribe en Supabase con reintentos exponenciales | 1. Loop de hasta maxRetries intentos. 2. En cada intento: UPDATE en Supabase. 3. Si error: backoff exponencial (1s, 2s, 4s). 4. Retorna true si éxito, false si todos fallan. |
| `updateCell()` | state.js:146-165 | cellKey, content, color, priority, description, subtasks, eventDate | Promise<void> | Modifica state.cells y state.cellDetails, persiste | 1. Si content vacío: elimina cell de state.cells y cellDetails. 2. Si content presente: guarda en state.cells, crea/actualiza state.cellDetails con todos los metadatos. 3. Llama saveState(). |
| `addTask()` | state.js:176-179 | task (object) | Promise<void> | Agrega a state.tasks, persiste | 1. Push del task al array state.tasks. 2. Llama saveState(). |
| `updateTask()` | state.js:181-187 | id, changes (object) | Promise<void> | Busca y mergea cambios en task, persiste | 1. Busca task por id en state.tasks. 2. Si encontrado: Object.assign(task, changes). 3. Llama saveState(). |
| `deleteTask()` | state.js:189-192 | id | Promise<void> | Filtra task del array, persiste | 1. Filtra state.tasks para excluir el task con el id dado. 2. Llama saveState(). |
| `getTaskStats()` | taskStats.js:198-199 | task (object) | Object (stats) | Ninguno (cálculo puro) | 1. Si task.type === "cantidad": llama computeCantidadStats. 2. Si no: llama computeChecklistStats. 3. Retorna stats calculados. |
| `computeCantidadStats()` | taskStats.js:59-138 | task (object) | Object (stats) | Ninguno (cálculo puro) | 1. Calcula stats de tiempo base (baseTimeStats). 2. Suma total de unidades del log. 3. Calcula días de trabajo (workDays) con countWorkDays. 4. Calcula metas diarias (metaDiariaOriginal, necesitasHoy, recomendado). 5. Calcula ritmos (actual, necesario, original). 6. Calcula días de atraso (diasDeAtraso). 7. Determina status con statusFromProgress. 8. Retorna objeto stats con 15 campos. |
| `computeChecklistStats()` | taskStats.js:140-196 | task (object) | Object (stats) | Ninguno (cálculo puro) | 1. Calcula stats de tiempo base (baseTimeStats). 2. Cuenta subtareas totales y completadas. 3. Calcula ritmos basados en subtareas. 4. Calcula días de atraso. 5. Determina status con statusFromProgress. 6. Retorna objeto stats con 12 campos. |
| `statusFromProgress()` | taskStats.js:41-57 | stats (object) | String (status) | Ninguno (cálculo puro) | 1. Si isDone: retorna "done". 2. Si notStarted: retorna "notstarted". 3. Si isOverdue: retorna "overdue". 4. Si daysRemaining <= 2 y remaining > 0: retorna "critical". 5. Si remaining > 0 y ritmoActual == 0: retorna "notstarted". 6. Calcula buffer basado en ritmoOriginal. 7. Compara diasDeAtraso contra umbrales (-0.3, -1.0, -2.0) con tolerancia extra. 8. Retorna "ongreen", "onyellow", "onattention", o "critical". |
| `baseTimeStats()` | taskStats.js:21-39 | startStr, endStr | Object (time stats) | Ninguno (cálculo puro) | 1. Parsea fechas start, end, today. 2. Calcula días totales (diffDays + 1). 3. Calcula días transcurridos. 4. Calcula porcentaje de tiempo (clamp 0-100). 5. Determina flags notStarted, isOverdue. 6. Calcula días restantes. 7. Retorna objeto con 6 campos. |
| `getSemesterStats()` | semesterUtils.js:7-17 | Ninguno | Object \| null | Ninguno (lectura de estado) | 1. Obtiene state.semester. 2. Si null: retorna null. 3. Calcula totalWeeks (ceil de días/7). 4. Calcula currentWeek (clamp del diff/7). 5. Calcula porcentaje completado. 6. Retorna objeto con stats de semestre. |
| `getSelectedWeek()` | semesterUtils.js:30-38 | Ninguno | Number | Ninguno (lectura de estado) | 1. Obtiene stats de semestre. 2. Si state.activeWeek es número válido: retorna clamp(activeWeek, 1, totalWeeks). 3. Si no: retorna clamp(currentWeek, 1, totalWeeks). |
| `renderTodayView()` | todayView.js:85-109 | Ninguno | void | Genera DOM en #todayView | 1. Genera contenido con generateTodayContent(). 2. Si contenedor no existe: crea wrapper .today-container. 3. Si existe: actualiza solo contenido interno (render incremental). 4. Conecta event listeners de click/keydown en items. |
| `renderTableView()` | tableView.js:92-207 | Ninguno | void | Genera DOM en #tableView | 1. Genera contenido con generateTableContent(). 2. Si contenedor no existe: crea wrapper .table-container + botón agregar curso. 3. Si existe: actualiza solo contenido interno. 4. Conecta 7 tipos de event listeners (week nav, course remove, week select, flags, cells, fullscreen). |
| `renderTaskGrid()` | taskGridView.js:11-75 | Ninguno | void | Genera DOM en #tasksView | 1. Obtiene entries ordenadas con sortedTaskEntries(). 2. Si vacío: muestra empty state. 3. Si contenedor no existe: crea grid. 4. Si existe: actualiza solo HTML del grid. 5. Conecta listeners de cards y toggle buttons. |
| `openTaskDetail()` | modals.js:868-876 | id (string) | void | Abre modal con detalle de tarea | 1. Busca task por id en state.tasks. 2. Genera HTML con taskDetailHTML(). 3. Abre modal con openModal(). 4. Anima barra de progreso. 5. Conecta listeners con wireTaskDetail(). |
| `wireTaskDetail()` | modals.js:985-1160 | taskId (string) | void | Conecta listeners del modal de detalle | 1. Conecta botones close, edit, delete. 2. Si type="cantidad": wirea botones quickLog +/-, form de log, history edit/delete con debouncing. 3. Si type="checklist": wirea toggle de subtareas, input para agregar subtarea. 4. Todos los listeners actualizan UI inmediatamente y guardan en background. |

**Manejo de estado:**
- **Estado global:** Singleton en `state.js:18-27` (variable `state`)
- **Estado compartido:** No hay store global tipo Redux/Zustand - el estado es un objeto simple mutable
- **Persistencia:** Dual - localStorage (síncrono, inmediato) + Supabase (async, con retry)
- **Sincronización real-time:** Canal PostgreSQL Changes en `state.js:199-213` que actualiza el estado global cuando cambia en la DB
- **Cache:** No hay cache adicional - el estado es la fuente de verdad
- **Sesiones:** No hay sistema de sesiones - la app es stateless respecto a autenticación de usuario (usa API key pública de Supabase)

### 2.4 Autenticación y Manejo de Errores

**Flujo de autenticación:**
- **No hay autenticación de usuario** - La aplicación usa la API key anónima/publishable de Supabase
- **Mecanismo:** Header personalizado `x-app-secret: "ritmo-9xK2mLpQ7vZa4Rt"` en todas las requests a Supabase (state.js:10, 15)
- **Registro de usuarios:** No implementado
- **Login:** No implementado
- **Refresh de tokens:** No aplica (no hay tokens de usuario)
- **Logout:** No implementado
- **Recuperación de contraseña:** No implementado

**Estrategia global de manejo de errores:**
- **Try/catch en operaciones críticas:**
  - `loadState()`: try/catch alrededor de Supabase y localStorage (state.js:30-62)
  - `saveToLocal()`: try/catch alrededor de localStorage.setItem (state.js:70-77)
  - `saveToCloudWithRetry()`: try/catch en cada intento con reintentos (state.js:82-107)
  - `importData()`: try/catch alrededor de JSON.parse (state.js:234-251)
- **Validación de formularios:**
  - Validación inline en modales con mensajes de error en elementos `.error-msg`
  - Ejemplos: modals.js:125-126 (validación de fechas), modals.js:652-654 (validación de campos de tarea)
- **Logging:**
  - `console.error` para errores de persistencia (state.js:41, 61, 97, 106)
  - `console.debug` para debugging de renderizado (heatmap.js:10)
  - `console.log` para confirmación de operaciones exitosas (state.js:72, 94)
- **Feedback visual al usuario:**
  - Sistema de toasts: `showToast()`, `showSavingIndicator()`, `showSavedIndicator()` (ui.js:135-170)
  - Mensajes de error en formularios: elementos `.error-msg` con animación `popIn`
  - Indicadores visuales de estado (banners de color en detalles de tarea)
- **Middlewares de error:** No hay middlewares - es una SPA vanilla sin framework
- **Códigos de estado HTTP:** No manejados directamente - el cliente Supabase maneja esto internamente
- **Formato de respuesta de error estándar:**
  - Errores de Supabase: objeto `{ error }` con propiedades dependientes del error
  - Errores de validación: texto plano en elementos `.error-msg`
  - Errores de localStorage: texto en console.error
- **Fallback strategy:**
  - Supabase falla → fallback a localStorage (state.js:40-62)
  - localStorage falla → estructura default vacía (state.js:65)
  - Service Worker falla → app funciona sin offline (index.html:80-84 con error handler)

## 3. Observaciones y Riesgos Detectados

**Deuda técnica:**
- **Hardcoded credentials:** Las credenciales de Supabase (URL, key, APP_SECRET) están expuestas en el código fuente (state.js:8-10). Esto es un riesgo de seguridad ya que cualquier usuario puede verlas en el navegador.
- **Falta de validación de tipos:** No hay validación de tipos en runtime - se asume que los datos de localStorage/Supabase tienen la estructura correcta. Si hay corrupción de datos, la app puede fallar silenciosamente.
- **Renderizado manual:** Todo el renderizado es mediante concatenación de strings HTML - no hay sistema de componentes con validación. Esto es propenso a XSS si no se escapa correctamente (aunque se usa `escapeHtml` en la mayoría de lugares).
- **Estado mutable global:** El estado es un objeto mutable global que se modifica directamente. Esto puede llevar a bugs difíciles de rastrear si hay múltiples referencias.

**Inconsistencias:**
- **Uso inconsistente de `calendarChecks`:** El campo existe en el estado pero no se usa en ningún lugar del código actual (solo se inicializa y persiste).
- **Naming inconsistente:** Algunas funciones usan camelCase (`saveState`), otras usan kebab-case en CSS (`today-container`). Esto es normal pero puede confundir.
- **Validación duplicada:** La validación de fechas se repite en múltiples modales (semestre, tarea, celda) con lógica similar pero duplicada.

**Dependencias desactualizadas:**
- **Supabase CDN:** Se usa una versión específica via CDN (`@supabase/supabase-js@2`) pero no hay control de versiones. Si hay breaking changes en futuras versiones, la app podría romperse.
- **No hay dependencias declaradas:** Al no haber package.json, no hay forma de verificar versiones o actualizar dependencias de forma controlada.

**Riesgos de seguridad:**
- **Exposición de credenciales:** Como se mencionó, las credenciales de Supabase están expuestas.
- **Falta de sanitización:** Aunque se usa `escapeHtml` en la mayoría de los lugares, hay algunos lugares donde se inyecta HTML dinámico sin sanitización explícita (ej. modal-wide-body en modals.js:192).
- **XSS potencial:** La concatenación de strings HTML sin sanitización adecuada podría permitir XSS si los datos de usuario no se limpian correctamente.
- **CORS:** No hay configuración de CORS visible - se asume que Supabase está configurado correctamente.

**Riesgos de rendimiento:**
- **Sincronización completa:** Cada cambio sincroniza todo el estado a Supabase, no solo los cambios delta. Esto puede ser ineficiente para estados grandes.
- **Renderizado completo de vistas:** Aunque se implementó renderizado incremental, algunas vistas aún reconstruyen DOM completo en ciertos casos.
- **Animaciones CSS múltiples:** Hay múltiples animaciones simultáneas (phasePulse, gentlePulse, etc.) que pueden competir por el hilo principal y causar jank (notado en CHANGELOG.md).

**Riesgos de usabilidad:**
- **Falta de confirmación:** Algunas acciones destructivas (como eliminar subtareas) no tienen confirmación.
- **Sin undo:** No hay función de deshacer para acciones como eliminar tareas o cursos.
- **Falta de validación en línea:** Algunos campos solo se validan al guardar, no mientras se escribe.

## 4. Preguntas Abiertas / No Determinado

- ⚠️ **Estructura de tabla Supabase:** No se determinó la estructura exacta de la tabla `app_state` en Supabase (se asume que tiene columnas `id` y `data` pero no hay documentación).
- ⚠️ **Configuración de RLS en Supabase:** No se determinó si hay Row Level Security configurado en Supabase o si la tabla es pública.
- ⚠️ **Plataforma de hosting:** No se determinó dónde se despliega la aplicación (no hay config de Netlify, Vercel, GitHub Pages, etc.).
- ⚠️ **Variables de entorno:** No hay archivo `.env.example` ni documentación sobre variables de entorno esperadas. No se sabe si hay configuración adicional requerida.
- ⚠️ **Backup strategy:** No se determinó si hay estrategia de backup automatizada para los datos en Supabase.
- ⚠️ **Multi-tenancy:** No se determinó si la aplicación soporta múltiples usuarios o si es single-user (dado el APP_SECRET hardcoded, parece ser single-user).
- ⚠️ **Rate limiting:** No se determinó si hay rate limiting configurado en Supabase para prevenir abuso.
- ⚠️ **Monitorización:** No hay sistema de monitorización o logging de errores en producción (solo console.log local).
- ⚠️ **Testing:** No se detectaron tests unitarios, de integración o E2E. No hay configuración de testing framework.
- ⚠️ **CI/CD:** No se detectó configuración de CI/CD (no `.github/workflows/`, no GitLab CI, etc.).
# AUDIT REPORT — Academia Dev

## 0. Resumen Ejecutivo
Dashboard académico personal PWA para gestión universitaria. Stack: HTML/CSS/JS vanilla + Supabase (Auth/Database/Storage). Funcionalidades: gestión de semestres/materias, calificaciones por zona (USAC), tareas con subtareas, notas con OCR, Pomodoro anti-throttle con Web Worker, flashcards, calendario, estadísticas. Sincronización multi-dispositivo en tiempo real. Sin build step, dependencias vía CDN. Estado: funcional y en producción (Vercel).

## 1. Mapeo Estructural y Dependencias

### 1.1 Árbol de Directorios

**Exclusiones declaradas:**
- `node_modules/` - No existe (proyecto sin dependencias npm)
- `.git/` - Excluido por ser control de versiones
- `dist/`, `build/` - No existen (sin build step)

**Estructura completa:**

| Ruta | Propósito | Archivos clave dentro |
|---|---|---|
| `/` | Raíz del proyecto | README.md, CHANGELOG.md, .gitignore, Academia_dev/ |
| `/Academia_dev/` | Código fuente principal | app.html, index.html, auth-page.html, admin.html, sw.js, manifest.json |
| `/Academia_dev/assets/` | Recursos estáticos | icons/, screenshots/ |
| `/Academia_dev/assets/icons/` | Íconos y favicons | favicon.ico, favicon.svg, icon-192.png, icon-512.png, new logo.png, new logo.svg |
| `/Academia_dev/assets/screenshots/` | Capturas para PWA | overview.png |
| `/Academia_dev/css/` | Hojas de estilos | base.css, components.css, index.css, mobile.css, notes.css, pomodoro.css, academia-animations.css, academia-bundle.css, flashcards-fix.css, logout-fix.css, mobile-fixes.css |
| `/Academia_dev/js/` | Lógica JavaScript | auth.js, state.js, academia-sync.js, tasks.js, notes.js, pomodoro.js, calendar.js, stats.js, search.js, sounds.js, loader.js, bootstrap.js, init.js, ui.js, calificaciones.js, semestres.js, materias.js, subjects/, chrono/, pomodoro/, legacy/ |
| `/Academia_dev/js/subjects/` | Módulo de materias (refactorizado) | subjects-core.js, subjects-ui.js, subjects-modal.js, topics-core.js |
| `/Academia_dev/js/chrono/` | Módulo de cronómetro/flashcards | chrono-core.js, chrono-ui.js, flashcards-core.js, flashcards-ui.js, focus-core.js |
| `/Academia_dev/js/pomodoro/` | Módulo de timer Pomodoro | timer-core.js, timer-ui.js |
| `/Academia_dev/js/legacy/` | Código legacy para compatibilidad | chrono-flashcards-legacy.js |
| `/Academia_dev/partials/` | Fragmentos HTML dinámicos | overview.html, materias.html, tareas.html, notas.html, calificaciones.html, horario.html, calendario.html, pomodoro.html, flashcards.html, semestres.html, perfil.html, estadisticas.html, general.html, modals.html, overlays.html, p-reloj.html, p-reloj-crono.html, p-reloj-pomodoro.html, p-reloj-timer.html, p-habits.html, temas.html |
| `/Academia_dev/sql/` | Scripts SQL para Supabase | ⚠️ NO DETERMINADO / REQUIERE VERIFICACIÓN MANUAL (directorio no listado en ls) |

**Archivos relevantes en raíz:**

| Archivo | Función específica |
|---|---|
| `README.md` | Documentación del proyecto, features, stack, licencia |
| `CHANGELOG.md` | Historial de versiones y cambios |
| `.gitignore` | Exclusiones de git (node_modules, .env, backups) |
| `vercel.json` | Configuración de deploy en Vercel |
| `robots.txt` | Directivas para crawlers |
| `sitemap.xml` | Mapa del sitio para SEO |

**Archivos relevantes en Academia_dev/:**

| Archivo | Función específica |
|---|---|
| `index.html` | Landing page con marketing y llamadas a acción |
| `app.html` | Aplicación principal (SPA) con sidebar y navegación |
| `auth-page.html` | Página de autenticación (Google OAuth + modo invitado) |
| `admin.html` | Panel de administración con estadísticas de uso |
| `sw.js` | Service Worker para PWA (caching, offline, notificaciones) |
| `manifest.json` | Manifiesto PWA (iconos, shortcuts, configuración) |
| `terminos.html` | ⚠️ NO DETERMINADO / REQUIERE VERIFICACIÓN MANUAL |
| `privacidad.html` | ⚠️ NO DETERMINADO / REQUIERE VERIFICACIÓN MANUAL |

**Archivos de diagnóstico/herramientas:**

| Archivo | Función específica |
|---|---|
| `backup-indexeddb.html` | Herramienta de backup de IndexedDB |
| `backup-snippet.js` | Snippet para backup manual |
| `check-data-loss.js` | Script de verificación de pérdida de datos |
| `check-models.html` | Verificación de modelos de datos |
| `cleanup-supabase.html` | Limpieza de datos en Supabase |
| `diagnostic-script.html` | Script de diagnóstico |
| `diagnostic-tool.html` | Herramienta de diagnóstico |
| `image-sync-test.js` | Pruebas de sincronización de imágenes |
| `migrate-to-turso.html` | ⚠️ OBSOLETO (Turso eliminado en v1.2.0) |
| `recover-data.js` | Recuperación de datos |

**Archivos de documentación técnica:**

| Archivo | Función específica |
|---|---|
| `AUDITORIA_BASE_DATOS.md` | Auditoría de base de datos |
| `AUDITORIA_COMPLETA.md` | Auditoría completa del sistema |
| `BANDWIDTH_OPTIMIZATIONS.md` | Documentación de optimizaciones de ancho de banda |
| `BUG_FALLBACK_TURSO.md` | Documentación de bug con Turso (obsoleto) |
| `SUPABASE_MIGRATION_REQUIREMENTS.md` | Requisitos de migración a Supabase |
| `TURSO_SETUP.md` | ⚠️ OBSOLETO (Turso eliminado) |

### 1.2 Dependencias

**No hay manifiestos de paquetes (package.json, requirements.txt, etc.)** - El proyecto usa dependencias vía CDN exclusivamente.

| Paquete | Versión exacta | Tipo (prod/dev) | Uso concreto en el proyecto (dónde y para qué se usa) |
|---|---|---|---|
| Supabase JS | v2 | prod | `app.html:19`, `auth-page.html:135`, `admin.html:380` - Auth + Database + Storage client |
| Tesseract.js | 4 (dist/tesseract.min.js) | prod | `app.html:21` - OCR para extracción de texto de imágenes/PDFs en notas |
| PDF.js | 3.11.174 (pdf.min.js) | prod | `app.html:22` - Visor de PDFs integrado en notas |
| DOMPurify | 3.1.6 (purify.min.js) | prod | `app.html:24` - Sanitización XSS para contenido de notas y tareas |
| Google Fonts | — | prod | `index.html:71-73`, `app.html:25-28` - Tipografías (Syne, Inter, Space Mono, JetBrains Mono, Playfair Display) |

### 1.3 Variables de Entorno

| Variable | ¿Dónde se consume (archivo/línea)? | ¿Tiene valor por defecto? | ¿Es secreta/sensible? | Descripción funcional |
|---|---|---|---|---|
| SUPABASE_URL | `js/auth.js:4`, `app.html:283`, `auth-page.html:225`, `admin.html:437` | No (hardcoded) | ⚠️ PARCIALMENTE SENSIBLE (URL pública) | URL del proyecto Supabase: `https://mwzezekdxrutpzqbduvh.supabase.co` |
| SUPABASE_ANON_KEY | `js/auth.js:5`, `app.html:284`, `auth-page.html:226`, `admin.html:438` | No (hardcoded) | ⚠️ SENSIBLE (aunque es anon key) | Clave anónima de Supabase: `sb_publishable_O1RMAV7hbpvDwJj0ESgaCg_dd8lZur5` |
| academia_guest_mode | `auth-page.html:190`,多处 localStorage checks | No (runtime) | No | Flag para modo invitado (sin auth) |
| academia_auth_session | `js/auth.js:20` | No (runtime) | Sí | Storage key para sesión de Supabase Auth |
| _academia_last_user | `auth-page.html:191` | No (runtime) | No | Último usuario autenticado |
| academia_v4_semestres | `js/state.js:129` | No (runtime) | No | localStorage key para semestres |
| academia_v3_pom_* | `js/state.js:130-134` | No (runtime) | No | localStorage keys para datos de Pomodoro |
| academia_v3_settings | `js/state.js:135` | No (runtime) | No | localStorage key para configuración |

**⚠️ NO DETERMINADO / REQUIERE VERIFICACIÓN MANUAL:**
- No existe archivo `.env.example` o similar documentando variables de entorno adicionales
- Posibles variables de Supabase no documentadas (service_role key, etc.)

### 1.4 Build y Deploy

**Build:**
- **Sin build step** - El proyecto no requiere compilación/bundling
- Dependencias cargadas vía CDN en tiempo de ejecución
- Archivos HTML/CSS/JS servidos directamente

**Deploy:**
- **Plataforma:** Vercel (detectado por `vercel.json` y README.md)
- **Configuración Vercel:** ⚠️ NO DETERMINADO / REQUIERE VERIFICACIÓN MANUAL (archivo `vercel.json` no leído)
- **Servidor HTTP requerido:** No funciona con `file://` (requiere servidor para partials)

**Scripts de build/deploy:**
- No hay scripts en `package.json` (no existe package.json)
- Servidor local recomendado: `npx serve .` o `python -m http.server 3000`

**Entorno de ejecución objetivo:**
- **Runtime:** Navegador moderno (Chrome/Edge/Firefox/Safari)
- **PWA:** Service Worker (`sw.js`) para funcionalidad offline
- **Storage:** 
  - Supabase (PostgreSQL + Storage) para datos en la nube
  - IndexedDB para imágenes grandes (`academia_images` DB, versión 2)
  - localStorage para configuración y datos ligeros
- **APIs de navegador utilizadas:**
  - Web Workers (Pomodoro timer)
  - Picture-in-Picture API (modo flotante)
  - Web Audio API (sonidos)
  - BroadcastChannel API (sync entre ventanas)
  - IndexedDB (imágenes)
  - Service Worker (PWA)
  - Notifications API (recordatorios)

## 2. Auditoría Técnica

### 2.1 Modelos de Datos

**Estructura de datos principal (State):**

El estado centralizado se mantiene en `State` object (definido en `js/state.js` y `js/init.js`):

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `semestres` | Array | Required | Lista de semestres académicos |
| `materias` | Array | Required | Lista de materias/cursos |
| `tasks` | Array | Optional | Lista de tareas (desplegada en semestre activo) |
| `settings` | Object | Optional | Configuración global del usuario |
| `calendar` | Array | Optional | Eventos de calendario |
| `grades` | Object | Optional | Calificaciones por materia (anidado en semestre) |

**Modelo Semestre:**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | String | Required, unique | ID único del semestre |
| `nombre` | String | Required | Nombre del semestre (ej: "Primer Semestre 2025") |
| `activo` | Boolean | Required | Flag de semestre activo actual |
| `materias` | Array | Optional | Materias asociadas al semestre |
| `tasks` | Array | Optional | Tareas del semestre |
| `notesArray` | Array | Optional | Notas del semestre |
| `grades` | Object | Optional | Calificaciones del semestre (matId -> zone -> sub -> value) |
| `archivado` | Boolean | Optional | Flag de semestre archivado |

**Modelo Materia (Subject):**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | String | Required, unique | ID único de la materia |
| `name` | String | Required | Nombre de la materia |
| `code` | String | Optional | Código de materia (ej: "MAT-201") |
| `icon` | String | Optional | Emoji/icono de la materia |
| `color` | String | Optional | Color hexadecimal (ej: "#7c6aff") |
| `seccion` | String | Optional | Sección de la materia |
| `catedratico` | String | Optional | Nombre del catedrático |
| `creditos` | Number | Optional | Créditos de la materia |
| `dias` | String | Optional | Días de clase (ej: "Lun, Mie, Vie") |
| `horario` | String | Optional | Horario (ej: "14:00–16:00") |
| `parentId` | String | Optional | ID de materia padre (para labs vinculados) |
| `linkedLabId` | String | Optional | ID de laboratorio vinculado |
| `labScale` | Number | Optional | Escala de calificación del lab (default: 100) |
| `labMaxPts` | Number | Optional | Puntos máximos del lab (default: 10) |
| `zones` | Array | Optional | Zonas de calificación (USAC) |
| `topics` | Array | Optional | Temas/unidades de la materia |

**Modelo Zona de Calificación (USAC):**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `key` | String | Required | Identificador único de zona (ej: "parciales") |
| `label` | String | Required | Etiqueta visible (ej: "Exámenes Parciales") |
| `color` | String | Optional | Color de la zona |
| `maxPts` | Number | Required | Puntos máximos de la zona |
| `isLabZone` | Boolean | Optional | Flag para zona auto de laboratorio |
| `subs` | Array | Required | Subdivisiones de la zona |

**Modelo Sub-zona:**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `key` | String | Required | Identificador único (ej: "parcial1") |
| `label` | String | Required | Etiqueta visible (ej: "1er Parcial") |
| `maxPts` | Number | Required | Puntos máximos de la sub-zona |

**Modelo Tarea:**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | String | Required, unique | ID único (timestamp) |
| `title` | String | Required | Título de la tarea |
| `matId` | String | Optional | ID de materia asociada |
| `priority` | String | Optional | "high", "med", "low" |
| `due` | String | Optional | Fecha límite (ISO date: YYYY-MM-DD) |
| `datePlanned` | String | Optional | Fecha planificada |
| `type` | String | Optional | Tipo (Tarea, Parcial, Lab, Proyecto, Quiz, etc.) |
| `notes` | String | Optional | Notas adicionales |
| `timeEst` | Number | Optional | Tiempo estimado (minutos) |
| `tags` | Array | Optional | Etiquetas |
| `kanbanCol` | String | Optional | Columna de kanban (todo, doing, done) |
| `done` | Boolean | Required | Flag de completado |
| `createdAt` | Number | Required | Timestamp de creación |
| `subtasks` | Array | Optional | Subtareas |
| `attachments` | Array | Optional | Archivos adjuntos |
| `comments` | Array | Optional | Comentarios |
| `repeat` | String | Optional | "none", "daily", "weekly", "monthly" |
| `repeatUntil` | String | Optional | Fecha límite de repetición |
| `repeatCount` | Number | Optional | Contador de repeticiones |
| `repeatDone` | Number | Optional | Repeticiones completadas |
| `estDays` | Number | Optional | Días estimados |
| `estHoursPerDay` | Number | Optional | Horas por día estimadas |

**Modelo Subtarea:**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `text` | String | Required | Texto de la subtarea |
| `done` | Boolean | Required | Flag de completado |

**Modelo Nota:**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | String | Required, unique | ID único |
| `matId` | String | Required | ID de materia asociada |
| `title` | String | Required | Título de la nota |
| `content` | String | Required | Contenido HTML (sanitizado) |
| `canvasData` | String | Optional | Referencias a imágenes en IndexedDB (prefijo "IDB:") |
| `createdAt` | Number | Required | Timestamp de creación |
| `updatedAt` | Number | Optional | Timestamp de última modificación |

**Modelo Configuración (Settings):**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `theme` | String | Optional | "dark" o "light" |
| `accent` | String | Optional | Color de acento |
| `font` | String | Optional | Tipografía |
| `minGrade` | Number | Optional | Nota mínima para aprobar (default: 61) |
| `uiSounds` | Boolean | Optional | Sonidos de interfaz |
| `pomData` | Object | Optional | Datos de Pomodoro (today, date, goal, history, snapshots) |

**Modelo Evento de Calendario:**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | String | Required, unique | ID único |
| `title` | String | Required | Título del evento |
| `date` | String | Required | Fecha (ISO date) |
| `matId` | String | Optional | ID de materia asociada |
| `type` | String | Optional | Tipo de evento |
| `color` | String | Optional | Color del evento |

**Modelo Flashcard:**

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | String | Required, unique | ID único |
| `matId` | String | Required | ID de materia asociada |
| `question` | String | Required | Pregunta |
| `answer` | String | Required | Respuesta |
| `status` | String | Optional | "known", "unknown", "repeat" |

**Relaciones entre entidades:**
- **Semestre 1:N Materias** - Un semestre tiene múltiples materias
- **Semestre 1:N Tareas** - Un semestre tiene múltiples tareas
- **Semestre 1:N Notas** - Un semestre tiene múltiples notas
- **Materia 1:N Calificaciones** - Una materia tiene múltiples zonas de calificación
- **Materia 1:N Tareas** - Una materia tiene múltiples tareas asociadas
- **Materia 1:N Notas** - Una materia tiene múltiples notas
- **Materia 1:N Flashcards** - Una materia tiene múltiples flashcards
- **Materia 1:1 Lab** - Una materia puede tener un laboratorio vinculado (linkedLabId)
- **Materia 1:1 Parent** - Un laboratorio puede tener una materia padre (parentId)
- **Zona 1:N Sub-zonas** - Una zona tiene múltiples subdivisiones

**Esquema IndexedDB (academia_images, versión 2):**

| Object Store | Key | Indexes | Descripción |
|---|---|---|---|
| `images` | String (imageKey) | — | Almacena imágenes comprimidas y thumbnails |
| `deleted_images` | String (imageKey) | `expiresAt` | Soft delete de imágenes con expiración |

**Esquema IndexedDB (AcademiaNotifications, versión 2):**

| Object Store | Key | Indexes | Descripción |
|---|---|---|---|
| `scheduled_notifications` | String (id) | — | Notificaciones programadas con timestamp |

### 2.2 Endpoints de API

**⚠️ NO HAY ENDPOINTS PROPIOS** - La aplicación no tiene backend propio. Todas las operaciones de API son a través de Supabase.

**Endpoints de Supabase utilizados:**

| Método | Ruta | Middlewares aplicados | Request (body/params/query) | Response (shape) | Servicios externos que consume | Archivo:línea |
|---|---|---|---|---|---|---|
| POST | `/auth/v1/oauth` | Supabase Auth SDK | `{ provider: 'google', options: { redirectTo, queryParams: { prompt: 'select_account' } } }` | OAuth redirect URL | Google OAuth | `js/auth.js:49-58` |
| GET | `/auth/v1/user` | Supabase Auth SDK | — | `{ user: { id, email, user_metadata } }` | Supabase Auth | `js/auth.js:96` |
| POST | `/auth/v1/logout` | Supabase Auth SDK | — | `{ }` | Supabase Auth | `js/auth.js:76` |
| SELECT | `/rest/v1/user_data` | Supabase Client (RLS) | `?user_id=eq.{userId}&select=semestres,settings,updated_at` | `{ semestres: [], settings: {}, updated_at: ISOString }` | Supabase PostgreSQL | `js/academia-sync.js:72-76` |
| UPSERT | `/rest/v1/user_data` | Supabase Client (RLS) | `{ user_id, semestres, settings, updated_at }` | `{ }` | Supabase PostgreSQL | `js/academia-sync.js:199-208` |
| SELECT | `/rest/v1/image_manifests` | Supabase Client (RLS) | `?user_id=eq.{userId}&image_key=eq.{imageKey}` | `{ user_id, image_key, hash, file_path, thumbnail_path, file_size, thumbnail_size, updated_at }` | Supabase PostgreSQL | `js/state.js:257-262` |
| UPSERT | `/rest/v1/image_manifests` | Supabase Client (RLS) | `{ user_id, image_key, hash, file_path, thumbnail_path, file_size, thumbnail_size, updated_at }` | `{ }` | Supabase PostgreSQL | `js/state.js:430-434` |
| UPLOAD | `/storage/v1/object/academia_images/{filePath}` | Supabase Storage | Blob (JPEG) | `{ }` | Supabase Storage | `js/state.js:384-389` |
| DOWNLOAD | `/storage/v1/object/academia_images/{filePath}` | Supabase Storage | — | Blob | Supabase Storage | `js/state.js:279-281` |
| POST | `/rest/v1/page_views` | Supabase Client (anon) | `{ page, device, referrer }` | `{ }` | Supabase PostgreSQL | `index.html:439-448`, `auth-page.html:248-257` |
| RPC | `/rpc/get_admin_stats` | Supabase Client (RLS) | — | `{ total_users, active_7d, active_30d, last_access, views_total, views_today, views_7d, views_daily, views_by_device, views_by_page, recent_users }` | Supabase PostgreSQL | `admin.html:439` |

**Servicios externos consumidos:**

| Servicio | Propósito | Credenciales requeridas | Endpoint/SDK usado |
|---|---|---|---|
| **Supabase Auth** | Autenticación Google OAuth | SUPABASE_URL + SUPABASE_ANON_KEY (hardcoded) | `@supabase/supabase-js@2` CDN |
| **Supabase Database** | Persistencia de datos (user_data, image_manifests, page_views) | SUPABASE_URL + SUPABASE_ANON_KEY (hardcoded) | Supabase REST API |
| **Supabase Storage** | Almacenamiento de imágenes (academia_images bucket) | SUPABASE_URL + SUPABASE_ANON_KEY (hardcoded) | Supabase Storage API |
| **Google OAuth** | Autenticación de usuarios | Configurado en proyecto Supabase | OAuth 2.0 flow |
| **Google Fonts** | Tipografías | No requiere credenciales | Google Fonts API |
| **PDF.js** | Visor de PDFs | No requiere credenciales | `pdfjs-dist` CDN |
| **Tesseract.js** | OCR de imágenes/PDFs | No requiere credenciales | `tesseract.js` CDN |
| **DOMPurify** | Sanitización XSS | No requiere credenciales | `dompurify` CDN |

### 2.3 Lógica de Negocio Central

**Funciones core del sistema:**

| Nombre de función | Archivo:línea | Input | Output | Efectos secundarios | Descripción del algoritmo/lógica paso a paso |
|---|---|---|---|---|---|
| `signInGoogle()` | `js/auth.js:45-70` | — | `{ success: boolean, error?: string }` | Redirección OAuth a Google | 1. Llama `supabaseClient.auth.signInWithOAuth()` con provider Google<br>2. Configura redirectTo a app.html<br>3. Usa prompt 'select_account' para forzar selección de cuenta<br>4. Maneja errores y retorna resultado |
| `logoutUser()` | `js/auth.js:73-83` | — | `{ success: boolean, error?: string }` | Limpia localStorage academia_* | 1. Llama `supabaseClient.auth.signOut()`<br>2. Llama `clearAcademiaStorage()` para limpiar localStorage<br>3. Retorna resultado |
| `checkAuth()` | `js/auth.js:86-113` | `timeoutMs: number` | `{ user, email, id, name } | null` | — | 1. Inicializa Supabase si no existe<br>2. Crea Promise de timeout (5s default)<br>3. Race entre getSession() y timeout<br>4. Si timeout o error, retorna null (fallback offline)<br>5. Si session existe, retorna objeto user |
| `init(userId)` | `js/academia-sync.js:26-42` | `userId: string` | — | Inicia sync de imágenes en background | 1. Guarda userId y client Supabase<br>2. Setea flag _ready = true<br>3. Llama `window.syncImages()` en background (no bloqueante) |
| `load(localUpdatedAt, options)` | `js/academia-sync.js:47-131` | `localUpdatedAt?: number, options?: { exclude?: string[], semesterId?: string }` | `{ semestres, settings, updatedAt } | null` | — | 1. Si localUpdatedAt existe, hace preflight con `getRemoteUpdatedAt()`<br>2. Si remoto no es más reciente, retorna null<br>3. Select desde user_data con columnas optimizadas<br>4. Optimiza semestres (trunca notas largas >10KB)<br>5. Optimiza settings (elimina pomData history y snapshots)<br>6. Aplica filters de options.exclude<br>7. Retorna datos optimizados |
| `save(semestres, settings, changedFields, semesterId)` | `js/academia-sync.js:266-273` | `semestres, settings, changedFields[], semesterId?` | — | Debounced save a Supabase (3-20s según red) | 1. Clear timeout existente<br>2. Calcula delay dinámico con `getDynamicDebounceDelay()`<br>3. Programa `_doSave()` con delay |
| `_doSave(semestres, settings, changedFields, semesterId)` | `js/academia-sync.js:155-217` | `semestres, settings, changedFields[], semesterId?` | — | Upsert a Supabase user_data | 1. Lee datos remotos actuales para merge<br>2. Construye payload con datos remotos + cambios locales<br>3. Optimiza datos con `_optimizeData()`<br>4. Upsert a user_data con onConflict='user_id'<br>5. Log error si falla |
| `toggleTask(id)` | `js/tasks.js:316-357` | `id: string` | — | Guarda estado, renderiza UI, actualiza badge | 1. Busca tarea en State.tasks<br>2. Toggle flag done<br>3. Si marca done: animación visual, efecto celebración, cancela notificaciones<br>4. Llama saveStateNow(['tasks'])<br>5. Renderiza tasks, overview, calendar, badge |
| `saveTask()` | `js/tasks.js:243-314` | — | — | Guarda tarea, renderiza UI | 1. Valida título requerido<br>2. Construye objeto task con todos los campos<br>3. Si es nueva tarea con repeat, genera instancias con `_generateRepeatTasks()`<br>4. Si es edición, actualiza en array<br>5. Si es nueva, unshift al array<br>6. Llama saveState(['tasks'])<br>7. Renderiza UI |
| `setG(matId, key, val)` | `js/calificaciones.js:13-29` | `matId, key, val` | — | Guarda calificación, renderiza UI | 1. Obtiene semestre activo<br>2. Crea estructura grades[matId][key] si no existe<br>3. Valida rango 0-100<br>4. Guarda valor<br>5. Llama saveState(['grades'])<br>6. Llama _updateGradeSummary(matId)<br>7. Renderiza materias, overview |
| `calcTotal(matId)` | `js/calificaciones.js:105-127` | `matId: string` | `{ total, maxTotal, pct } | null` | — | 1. Obtiene materia y zonas<br>2. Suma puntos de cada sub-zona llenas<br>3. Si tiene linkedLabId, suma puntos del lab<br>4. Calcula total, maxTotal y porcentaje<br>5. Retorna null si no hay datos |
| `calcProjected(matId)` | `js/calificaciones.js:129-157` | `matId: string` | `{ projected, maxTotal } | null` | — | 1. Suma puntos obtenidos y máximos de zonas llenas<br>2. Suma potencial total de todas las zonas<br>3. Calcula tasa de rendimiento (earned/earnedMax)<br>4. Proyecta: earned + rate * remaining<br>5. Retorna proyección |
| `calcMinNeeded(matId, targetPts)` | `js/calificaciones.js:159-198` | `matId, targetPts` | `{ needed, remainingMax, pct } | null` | — | 1. Suma puntos obtenidos y máximos restantes<br>2. Si tiene linkedLabId, incluye lab en cálculo<br>3. Calcula needed = target - earned<br>4. Calcula porcentaje needed/remainingMax<br>5. Retorna resultado |
| `idbSetImage(key, dataUrl)` | `js/state.js:451-551` | `key: string, dataUrl: string` | `boolean` | Guarda en IndexedDB, upload a Supabase en background | 1. Valida key y dataUrl<br>2. Verifica espacio disponible en Storage API<br>3. Comprime imagen con `compressImage()` (max 800px, quality 0.4)<br>4. Genera thumbnail con `generateThumbnail()` (300px, quality 0.6)<br>5. Guarda en IndexedDB (imágenes + thumbnails)<br>6. Calcula hash SHA-256<br>7. Llama `uploadImageToSupabase()` en background |
| `uploadImageToSupabase(imageKey, dataUrl, thumbnailDataUrl, hash)` | `js/state.js:343-449` | `imageKey, dataUrl, thumbnailDataUrl, hash` | `{ filePath, thumbPath, manifestData } | null` | Sube a Supabase Storage, guarda manifest | 1. Convierte dataUrls a Blobs<br>2. Genera nombres de archivo con hash<br>3. Sube imagen completa a Storage (upsert: true)<br>4. Sube thumbnail a Storage (upsert: true)<br>5. Upsert manifest en image_manifests table<br>6. Retorna paths o null si error |
| `downloadImageFromSupabase(imageKey, isThumbnail)` | `js/state.js:242-317` | `imageKey, isThumbnail` | `dataUrl | null` | Cachea en IndexedDB local | 1. Busca manifest en image_manifests<br>2. Determina filePath (thumbnail o completa)<br>3. Descarga desde Storage<br>4. Convierte Blob a dataUrl<br>5. Guarda en IndexedDB local (cache)<br>6. Retorna dataUrl |
| `pomToggle()` | Definido en `js/pomodoro/timer-core.js` | — | — | Inicia/pausa timer, actualiza UI | 1. Toggle flag pomR (running)<br>2. Si inicia: inicia Web Worker, programa keepalive SW<br>3. Si pausa: detiene Web Worker, detiene keepalive<br>4. Actualiza UI y sync PiP |
| `enterFloatingMode()` | `js/pomodoro.js:126-184` | — | — | Abre ventana Picture-in-Picture | 1. Verifica soporte de documentPictureInPicture API<br>2. Si no soportado, abre popup fallback<br>3. Si soportado, llama requestWindow({ width: 320, height: 480 })<br>4. Escribe HTML/CSS/JS en ventana PiP<br>5. Configura listeners para comandos desde PiP |
| `renderNotesPage()` | `js/notes.js:262-265` | — | — | Renderiza página de notas | 1. Setea _notesInHub = true<br>2. Llama renderNotesProPage() |
| `handleImportFile(input)` | `js/notes.js:26-39` | `input: HTMLInputElement` | `{ ok: boolean, msg: string }` | Importa datos, renderiza UI | 1. Lee archivo como texto<br>2. Llama importData(result)<br>3. Muestra notificación<br>4. Si ok, llena selects y renderiza UI |

**Manejo de estado:**
- **State management:** Centralizado en objeto `State` (js/state.js, js/init.js)
- **Persistencia local:** localStorage para datos ligeros, IndexedDB para imágenes
- **Persistencia remota:** Supabase (user_data table) con sync debounced
- **Reactividad:** Sistema Pub/Sub personalizado (subscribe/notify) para actualizaciones
- **Cache:** DOM cache (_DOM object), image cache (_imageCache Map)
- **Offline-first:** Funciona sin conexión con datos locales, sync cuando reconecta
- **Conflict resolution:** Merge strategy en _doSave (datos remotos + cambios locales)

### 2.4 Autenticación y Manejo de Errores

**Flujo de autenticación completo:**

1. **Registro/Login:**
   - Usuario accede a `auth-page.html`
   - Clic en "Ingresar con Google" → llama `handleGoogleLogin()` (auth-page.html:148)
   - Llama `window.Auth.signInGoogle()` (js/auth.js:45)
   - Supabase Auth inicia OAuth flow con Google
   - Google redirige a `app.html` con token en URL
   - Supabase Auth detecta token en URL, crea sesión
   - `checkAuth()` (js/auth.js:86) verifica sesión activa
   - Si sesión válida, usuario ingresa a app

2. **Modo invitado:**
   - Usuario clic "Probar sin cuenta" → `handleGuestMode()` (auth-page.html:183)
   - Primer clic: muestra advertencia de datos locales only
   - Segundo clic: setea `localStorage.setItem('academia_guest_mode', '1')`
   - Redirige a `app.html` sin autenticación
   - Datos guardados solo en localStorage/IndexedDB

3. **Sesión persistente:**
   - Supabase Auth configura `persistSession: true` (js/auth.js:17)
   - Sesión guardada en localStorage con key `academia_auth_session` (js/auth.js:20)
   - `autoRefreshToken: true` (js/auth.js:18) renueva tokens automáticamente
   - `detectSessionInUrl: true` (js/auth.js:19) detecta tokens en URL

4. **Logout:**
   - Usuario clic "Cerrar sesión" → `handleLogout()` (app.html:108)
   - Llama `window.Auth.logoutUser()` (js/auth.js:73)
   - Supabase Auth cierra sesión
   - `clearAcademiaStorage()` limpia localStorage academia_* (js/auth.js:32)
   - Redirige a `auth-page.html`

5. **Recuperación de contraseña:**
   - ⚠️ NO IMPLEMENTADO - Usa flujo estándar de Google OAuth

**Estrategia de autenticación:**
- **Proveedor:** Google OAuth vía Supabase Auth
- **Tokens:** JWT manejados por Supabase Auth SDK
- **Almacenamiento:** localStorage (academia_auth_session)
- **RLS:** Row Level Security en Supabase para隔离用户数据
- **Admin panel:** Requiere verificación manual de user_id en SQL (admin.html:443-456)

**Estrategia global de manejo de errores:**

**Patrones de error handling:**

1. **Try-catch en funciones asíncronas:**
   - Todas las funciones async usan try-catch
   - Ejemplo: `signInGoogle()` (js/auth.js:46-69)
   - Ejemplo: `uploadImageToSupabase()` (js/state.js:343-449)

2. **Silent failures con logging:**
   - Operaciones no críticas fallan silenciosamente con console.warn
   - Ejemplo: tracking de page views (index.html:448)
   - Ejemplo: sync de imágenes (js/academia-sync.js:38)

3. **Fallbacks y degradación graceful:**
   - Si DOMPurify no cargado, retorna contenido sin sanitizar (js/tasks.js:3-5)
   - Si Supabase no disponible, usa datos locales (js/academia-sync.js:48-66)
   - Si IndexedDB falla, usa localStorage (多处 fallbacks)

4. **Notificaciones al usuario:**
   - `_appNotify(msg, type)` para errores visibles (js/state.js:476, 538)
   - Tipos: 'ok', 'error', 'warning'
   - Ejemplo: espacio insuficiente en IndexedDB (js/state.js:478)

5. **Validación de input:**
   - Validación de campos requeridos (ej: título de tarea)
   - Validación de rangos (ej: calificaciones 0-100)
   - Sanitización XSS con DOMPurify (js/tasks.js:2-25, js/notes.js:2-24)

6. **Códigos de estado HTTP:**
   - Manejados por Supabase SDK automáticamente
   - Errores de red retornan null en checkAuth (js/auth.js:108-111)

7. **Formato de respuesta de error estándar:**
   - **Auth:** `{ success: false, error: string }` (js/auth.js:62, 68)
   - **Sync:** console.warn con mensaje descriptivo (js/academia-sync.js:79, 128)
   - **UI:** Mensaje en DOM + notificación toast

8. **Logging:**
   - console.error para errores críticos
   - console.warn para advertencias no críticas
   - console.log para debugging (desarrollo)

**Estrategia de retry:**
- **Debounce dinámico** para sync según calidad de red (js/state.js:103-111)
- **Preflight check** antes de descargar datos remotos (js/academia-sync.js:56-66)
- **Retry automático** en Service Worker para assets (sw.js:136-151)

## 3. Observaciones y Riesgos Detectados

**Deuda técnica:**
- Código legacy en `js/legacy/` para compatibilidad backward
- Variables globales múltiples (pomR, pomB, pomSL, etc.) sin namespacing
- Múltiples archivos con funciones duplicadas (sanitizeHtml en tasks.js y notes.js)
- Archivos de diagnóstico no integrados en flujo de desarrollo

**Inconsistencias:**
- Modo AI Assistant deshabilitado (comentado en app.html:250) pero código presente
- Archivos de Turso obsoletos presentes después de eliminación en v1.2.0
- Dos sistemas de gestión de materias (materias.js vacío vs subjects/ modular)

**Dependencias desactualizadas:**
- ⚠️ NO DETERMINADO / REQUIERE VERIFICACIÓN MANUAL - No hay package.json para verificar versiones

**Riesgos de seguridad:**
- Claves de Supabase hardcoded en múltiples archivos (auth.js, app.html, auth-page.html, admin.html)
- Aunque es anon key, está expuesta en código fuente
- Sanitización XSS depende de DOMPurify; si falla o no carga, contenido vulnerable
- No hay CSP estricto (meta tag CSP permite 'unsafe-inline' y 'unsafe-eval')

**Riesgos de datos:**
- Sync debounced puede causar pérdida de datos si usuario cierra antes de flush
- No hay confirmación de sync antes de cerrar pestaña
- Merge strategy simple puede causar conflictos no resueltos
- Imágenes en IndexedDB no tienen backup automático

**Riesgos de arquitectura:**
- Sin TypeScript, propenso a errores de tipo
- Estado global monolítico puede volverse difícil de mantener
- Sin tests automatizados
- Dependencia total de Supabase (vendor lock-in)

## 4. Preguntas Abiertas / No Determinado

- **Estructura del directorio `/sql/`:** No se pudo determinar el contenido (no listado en ls)
- **Archivos terminos.html y privacidad.html:** No leídos, contenido desconocido
- **Configuración de Vercel:** Archivo vercel.json no leído, configuración de deploy desconocida
- **Variables de entorno adicionales:** No hay .env.example, posibles variables no documentadas
- **Versión exacta de dependencias CDN:** Solo se conocen las versiones mayor, no parches específicos
- **Configuración de RLS en Supabase:** No se tiene acceso a las policies de Row Level Security
- **Estructura exacta de tablas en Supabase:** Solo se infiere del código, no hay schema SQL visible
- **Procedimiento RPC get_admin_stats:** Implementación no visible, solo se conoce la firma
- **Migraciones de base de datos:** No hay archivos de migración visibles en el código
- **Configuración de buckets de Supabase Storage:** Estructura de buckets no documentada
- **Webhooks de Supabase:** No se detecta uso de webhooks, pero no se puede confirmar
- **Límites de cuota en Supabase:** No documentado, posible riesgo de escalabilidad
- **Backup strategy oficial:** No hay documentación de backup/restore de producción
- **Monitoreo y logging:** No se detecta integración con servicios de monitoreo
- **Estrategia de rollback:** No documentada para deploy en Vercel
- **Tests end-to-end:** No se detecta framework de testing
- **CI/CD pipeline:** No hay archivos de configuración (.github/workflows/, etc.)
- **Performance monitoring:** No se detecta integración con herramientas de monitoreo
- **Analytics detallado:** Solo tracking básico de page views, no analytics de usuario
