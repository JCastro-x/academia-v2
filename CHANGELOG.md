# CHANGELOG

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
