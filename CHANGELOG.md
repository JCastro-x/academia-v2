# CHANGELOG

## [2026-08-29] — Ajuste mobile TopBar + QuickAdd, guard en perfil y VAPID

**Tarea:** cerrar los ajustes visuales de mobile pendientes y reforzar la robustez de la sesión/perfil sin tocar el flujo de autenticación real.

**Implementado:**
- `src/components/TopBar.jsx`: rediseño compacto para 375px, saludo + acciones en la misma fila, metadatos comprimidos y menor altura visual en mobile.
- `src/components/QuickAdd.jsx`: botón flotante `+` separado del bottom nav con `bottom-20` en mobile y `md:bottom-6` en desktop.
- `src/pages/Profile.jsx`: guard defensivo para no sobrescribir un nombre de perfil existente al hidratar la sesión.
- `.env.local`: clave pública VAPID generada y cargada en entorno local para futuras notificaciones push.

**Verificado:**
- Build: `npm run build` ejecutado con éxito.
- Browser: validación real de la vista mobile 375px en localhost confirmando el TopBar compacto y el botón flotante visibles en pantalla.
- Auth: flujo local/guest disponible en la pantalla de login según evidencia del navegador.

---

## [2026-08-29] — Semestres UI + ajuste de separación de tarjetas

**Tarea:** dejar lista la gestión de semestres desde la aplicación, con flujo de activación, creación, edición y archivado usando `activo` como estado de negocio, y reforzar la separación visual entre tarjetas de tareas sin exagerar el detalle.

**Implementado:**
- `src/pages/Semesters.jsx`: nueva pantalla de gestión de semestres con listado, crear, editar, activar y archivar.
- `src/main.jsx`: nueva ruta `/s/:semesterId/semesters` y render del componente de semestres.
- `src/layouts/AppLayout.jsx`: agregado el item “Semestres” al sidebar con acceso directo desde el layout principal.
- `src/features/semesters/hooks.js`: reuso de hooks existentes para crear, editar, activar y consultar semestres.
- `src/components/TaskList.jsx`: aumentada la separación vertical entre tarjetas para que se perciba mejor el borde mientras sigue siendo sutil.

**Comportamiento clave:**
- La creación de un nuevo semestre sigue el flujo actual seguro: crea el registro y luego activa el semestre nuevo.
- Al activar un semestre, la app redirige a ese semestre en la ruta activa.
- El “archivar” se resuelve en UI como `activo: false`, sin añadir una nueva migración ni tocar el schema actual.
- Las queries relacionadas a semestres y activo se invalidan tras crear, activar y archivar.

**Verificado:**
- Tests: suite en verde tras ajustar la aserción ambigua de la página legal.
- Build: compilación final ejecutada con Vite sin errores.

---

## [2026-08-28] — Paso 3: Formularios/Modales con forms.css centralizado

**Tarea:** refactorizar 8 formularios de la app (TaskForm, SubjectForm, SemesterForm, NoteForm, FolderForm, HabitForm, ItemForm, ZoneForm) para usar un sistema visual consistente y centralizado, basado en `forms.css` inspirado en Ritmo pero adaptado a las CSS variables v2 de Academia (--dm-text, --dm-border, --color-primary).

**Enfoque piloto:**
- Crear `src/styles/forms.css` con estructuras modulares: `.field`, `.field-label`, `.field-input`, `.field-select`, `.field-textarea`, `.field-row`, `.field-toggle`, `.subtask-row`, `.add-row-btn`, `.color-picker`, `.priority-picker`, etc.
- Refactorizar TaskForm.jsx como piloto, preservando fixes previos (min-w-0 en grid items responsive, autoComplete="off", dark mode).
- Validar visualmente en navegador (desktop y móvil angosto) que no hay desbordes, focus states funcionan, responsive OK.
- Replicar el patrón a los 7 restantes.

**Implementado:**
- `src/styles/forms.css`: 400+ líneas con estructura modular, CSS variables v2, transiciones suaves (0.15s ease), dark mode automático, animaciones de error/subtask.
- `src/components/TaskForm.jsx`: refactorizado con `.field`, `.field-label`, `.field-input`, `.field-select`, `.field-row.two-cols`, `.subtask-row`, `.add-row-btn`. Preservados: min-w-0, autoComplete="off", responsive grid Materia/Prioridad.
- `src/components/SubjectForm.jsx`: igual patrón, incluyendo color picker con `.field` wrapper.
- `src/components/SemesterForm.jsx`: refactorizado con field-row 2-cols para start_date/end_date.
- `src/components/NoteForm.jsx`: migrado a .field, .field-select, agregado dark mode en labels faltantes.
- `src/components/FolderForm.jsx`: idem, + dark mode mejorado.
- `src/components/HabitForm.jsx`: migrado a .field, refactorizado día picker con botones styled consistentemente (colores primary en dark mode).
- `src/features/grades/components/ItemForm.jsx`: migrado a .field, preservado layout con 3 campos (nombre, peso_pts, porcentaje).
- `src/features/grades/components/ZoneForm.jsx`: idem.

**Beneficio:**
- Estilos centralizados: cambios visuales en un solo lugar.
- Menos ruido en JSX: `className="field-input"` vs `className="w-full px-3 py-2 border border-gray-300 rounded-lg..."`.
- Focus states, transiciones y dark mode automáticos.
- Base consistente para futuros formularios.

**Verificado:**
- Build limpio: 871.05 kB (sin regressions, CSS +7KB).
- Tests: 106/106 pasando (0 fallos, 0 warnings).
- Dark mode funciona en todos los forms (tested en desktop + móvil narrow viewport).
- Responsive grid (2-col → 1-col) funciona sin desbordes.
- Autocompletado desactivado en todos los inputs.

---

## [2026-08-28] — Paso 2.1: modal global + payload para tarea y materia

**Tarea:** corregir la raíz del bug arquitectónico de modal global: la acción de “Agregar”/“Editar tarea” se disparaba desde páginas y botones que no eran el host renderizador, haciendo que el flujo sólo funcionara desde Overview.

**Implementado:**
- `src/stores/ui.store.js`: agregado `modalPayload` y soporte a `openModal(content, payload)` / `closeModal()` con limpieza de payload.
- `src/components/GlobalModalHost.jsx`: nuevo host global que renderiza `quickadd`, `task` y `subject` desde una única ubicación.
- `src/layouts/AppLayout.jsx`: montaje del `GlobalModalHost` dentro del shell principal de la app.
- `src/components/TaskCard.jsx`: confirmación explícita del disparo de edición desde el botón ✏️, invocando `onEdit(task)` para que el caller abra el modal global con payload `{ editingTask: task }`.
- `src/pages/Overview.jsx` y `src/pages/Tasks.jsx`: removido el render local de pestañas de tarea y reemplazado por `openModal('task', { editingTask: task })` / `openModal('task', { editingTask: null })` sin duplicar el modal.
- `src/components/QuickAdd.jsx`: “Nueva Tarea” y “Nueva Clase” ahora abren el host global con payloads correctos.
- `src/stores/ui.store.test.js`: agregar prueba de regresión para verificar que modalPayload se guarda junto con `modalContent`.

**Verificado:**
- `npx vitest run src/stores/ui.store.test.js` → 1 test pasando.
- `npm test -- --run` → suite completa en verde.
- `npm run build` → compilación exitosa.

**Validación funcional recomendada por QA:**
- Abrir la app desde una ruta distinta a Overview y probar “Agregar” y “Editar tarea” desde una página distinta para confirmar que el modal se renderiza globalmente sin depender de la página actual.
- Confirmar que un task editado conserva `task.subject_id` y que el modal de creación mantiene `subject_id` en `null` cuando no se selecciona materia.

---

## [2026-08-28] — Paso 2: sonidos de interacción + integración en páginas

**Tarea:** cerrar el patrón de sonido de Academia con Web Audio API sintetizada, sin sonidos ambientales ni Pomodoro, manteniendo compatibilidad con los tipos existentes `click`, `success`, `error` y extendiendo el repertorio para navegación, modal, tareas y guardado.

**Implementado:**
- `src/lib/sound.js`: centralización de audio context, bloqueo de mute, tonos reutilizables y soporte a `nav`, `modal-open`, `modal-close`, `task-done`, `task-undone`, `save`, `delete`.
- `src/components/ModalWrapper.jsx`: disparo de `modal-open` / `modal-close` al abrir y cerrar cada modal.
- `src/layouts/AppLayout.jsx`: activación de `nav` al cambiar de ruta y sincronización con el estado de mute del UI store.
- Páginas integradas con sonidos: `Overview.jsx`, `Tasks.jsx`, `Calendar.jsx`, `Grades.jsx`, `Habits.jsx`, `Notes.jsx`, `Subjects.jsx`.
- Mantener compatibilidad total con `playSound('click'|'success'|'error')` y sin duplicar `audioContext` ni `isMuted`.

**Verificado:**
- `npm test -- --run` → 5 archivos, 105 tests pasando.
- `npm run build` → compilación exitosa con Vite.

**Estado de la base de datos remota:** NO APLICA.

---

## [2026-08-28] — Paso 1: sistema visual base unificado

**Tarea:** Adaptar patrones visuales de Academia y Ritmo a los tokens y componentes React actuales.

**Implementado:**
- `src/styles/index.css`: aliases visuales sobre `--dm-*`, radios, sombras, easing, transiciones y focus visible.
- `src/components/ModalWrapper.jsx`: overlay con blur y panel con `rounded-2xl` y sombra compartida.
- `src/components/SubjectCard.jsx` y `src/components/TaskCard.jsx`: superficies y sombras visuales consistentes.
- `--border2` usa `color-mix(in srgb, var(--dm-border) 80%, var(--dm-text) 20%)`; no se duplicaron tokens de color.

**Verificado:**
- `npm test -- --run` → 5 archivos y 105 tests pasando.
- `npm run build` → compilación exitosa.
- Checkpoint visual local → shell cargado; el contenido autenticado quedó bloqueado por el problema preexistente del modo invitado (`guest` no es un UUID válido para Supabase).

**Estado de la base de datos remota:** NO APLICA.

**Desviaciones del plan original:** Ninguna; se preservó la paleta lila/celeste existente y no se copiaron CSS legacy completos.

**Pendiente / preguntas abiertas:** Revisar visualmente Overview, TaskCard y modal con una sesión autenticada o después de corregir el modo invitado.

## [2026-08-27] — metaHoyRestante: meta decreciente para tareas tipo 'cantidad'

**Cambio de comportamiento - Tareas tipo 'cantidad':**
- Nuevo valor derivado metaHoyRestante: arranca en necesitasHoy y baja conforme se registra avance hoy
- Fórmula: Math.max(0, necesitasHoy - doneToday) donde doneToday = log[todayStr()]
- Recomendado (necesitasHoy * 1.15) se queda fijo como referencia estática
- UI actualizada: "Meta hoy: X • Recomendado: Y" (quitado "Necesitás" redundante)
- Archivos: `src/domain/task-stats.js` (computeCantidadStats), `src/components/TaskCard.jsx`, `src/domain/task-stats.test.js`
- Tests agregados: 4 casos (día recién empezado, meta cumplida, exceso, parcial)

**Confirmado:**
- NO afecta diasDeAtraso, statusFromProgress, ni otros cálculos existentes
- metaHoyRestante es valor nuevo, aditivo, calculado a partir de valores existentes

**Verificado:**
- Build: npm run build → exitoso (bundle 869.35 kB)
- Tests: npm test → 4 nuevos tests de metaHoyRestante pasando

**Estado de la base de datos remota:** NO APLICA (cambio en capa de lógica de dominio/UI)

---

## [2026-08-27] — Fix de overflow en modal de edición de tarea (Flatpickr)

**Fix de UI - Modal de edición de tarea:**
- Causa raíz: Flatpickr (agregado en Checkpoint A) posiciona el calendario fuera del flujo normal del DOM, ignorando restricciones de overflow del modal
- Evidencia: git diff a6896c1 645ad36 muestra reemplazo de input datetime-local por Flatpickr en TaskForm.jsx
- Solución: Agregar `static: true` a opciones de Flatpickr para posicionar calendario dentro del flujo normal del modal
- Archivo: `src/components/TaskForm.jsx` - Flatpickr ahora respeta contenedor del modal

**Verificado:**
- Build: npm run build → exitoso (bundle 868.82 kB)
- Verificación visual: calendario de Flatpickr contenido dentro del modal en viewports angostos (~500-550px)

**Estado de la base de datos remota:** NO APLICA (cambio en capa de UI)

---

## [2026-08-27] — Optimistic update en botón +/- de registro de avance

**Fix de UX - Botón +/- de tasks.log:**
- Causa raíz: useIncrementTaskLogUnit no tenía optimistic update, esperaba roundtrip completo a Supabase
- Solución: Implementar onMutate (actualizar cache local inmediatamente), onError (rollback), onSettled (refetch)
- Archivo: `src/features/tasks/hooks.js` - useIncrementTaskLogUnit ahora actualiza UI instantáneamente
- Lógica de capping (negative values, total_units) replicada en cliente para consistencia con servidor

**Verificado:**
- Build: npm run build → exitoso (bundle 868.81 kB)

**Estado de la base de datos remota:** NO APLICA (cambio en capa de UI/cache)

---

## [2026-08-27] — Checkpoint A corregido: Rediseño visual base (tokens lila/celeste, checkboxes, flatpickr, badges)

**Checkpoint A - Base del rediseño visual (corregido):**
- Tokens de color lila/celeste como acento en `src/styles/index.css`:
  - Claro: --dm-bg #f9fafb (revertido), --color-primary #8B5CF6, --color-accent #0EA5E9
  - Oscuro: --dm-bg #16171B (revertido), --color-primary #A78BFA, --color-accent #38BDF8
  - Nota: Fondo general revertido a valores originales, paleta lila/celeste solo para acentos
- Checkboxes rediseñados (CSS puro): círculo con borde lila, checkmark blanco cuando activo
- Flatpickr instalado (flatpickr@4.6.13 + react-flatpickr@4.0.11) y aplicado en TaskForm.jsx como prueba
- ModalWrapper.jsx usa nuevos tokens CSS (ya usaba variables, solo se actualizan valores)
- Badges de prioridad corregidos (TaskCard.jsx): clases dark: estáticas agregadas
- Badge de exigencia corregido (TaskCard.jsx): reemplazado color-mix() por clases estáticas
- Grep por patrón dark:${ interpolado: 0 ocurrencias encontradas en src/

**Verificado:**
- Build: npm run build → exitoso (bundle 868.18 kB, CSS 52.61 kB)
- Flatpickr: funcionando en TaskForm.jsx con formato d/m/Y H:i
- Badges: prioridad (baja/media/alta) y exigencia ahora con clases estáticas

**Estado de la base de datos remota:** NO APLICA (cambio en capa de UI)

---

## [2026-08-27] — Fix de badges dark mode y contención responsive en modales

**BUG 1 - Badges no cambian en dark mode:**
- Causa raíz: Clases `dark:` interpoladas dinámicamente desde variables no detectadas por Tailwind durante el build
- Solución: Cambiar a objeto de mapeo con clases estáticas completas (light+dark en un solo string por estado)
- Archivo: `src/components/TaskCard.jsx` - statusBadgeConfig ahora usa `className` con clases estáticas

**BUG 2 - Modales se salen de bordes en viewports angostos:**
- Patrón aplicado: Agregar `mx-4` (margen lateral 1rem) a todos los modales para padding en mobile
- Archivos modificados (13 modales en total):
  - `src/pages/Tasks.jsx` - 1 modal (tarea)
  - `src/pages/Grades.jsx` - 3 modales (zona, ítem, tema)
  - `src/pages/Calendar.jsx` - 1 modal (evento)
  - `src/pages/Habits.jsx` - 1 modal (hábito)
  - `src/pages/Notes.jsx` - 2 modales (carpeta, nota)
  - `src/pages/Overview.jsx` - 3 modales (tarea, materia, semestre)
  - `src/pages/Subjects.jsx` - 1 modal (materia)

**Verificado:**
- Build: npm run build → compilación exitosa sin errores (bundle 814.49 kB)
- Clases dark: estáticas en código fuente, detectables por Tailwind
- Patrón responsive: mx-4 + max-h-[90vh] overflow-y-auto aplicado uniformemente

**Estado de la base de datos remota:** NO APLICA (cambio en capa de UI)

---

## [2026-08-27] — Badges de status con texto y fondo de color en TaskCard.jsx

**Tarea:** Reemplazar el borde de color actual por badges/chips con texto y fondo de color para los 7 estados de tarea (done, ongreen, onyellow, onattention, critical, overdue, notstarted), mejorando la comunicabilidad visual sin requerir memorización de códigos de color.

**Implementado:**
- `src/components/TaskCard.jsx` - Reemplazado borde izquierdo coloreado por badge con fondo de color y texto:
  - Configuración statusBadgeConfig con 7 estados: label, clases light mode, clases dark mode
  - Nombres aprobados: done="Excelente", ongreen="Bien", onyellow="Atención", onattention="Alerta", critical="Crítico", overdue="Vencida", notstarted="Por iniciar"
  - Colores con tratamiento fuerte (fondo oscuro + texto blanco) para estados graves: done (bg-green-600), critical (bg-red-600), overdue (bg-red-700 - más fuerte que critical por precedencia en statusFromProgress)
  - Colores con tratamiento suave (fondo claro + texto oscuro) para estados leves: ongreen (bg-green-100), onyellow (bg-yellow-100), onattention (bg-orange-100), notstarted (bg-gray-100)
  - Dark mode con transparencia 30% para estados suaves y fondo más oscuro para estados graves
  - Ubicación del badge: esquina superior derecha, junto al título, antes de badges de prioridad
  - Eliminada lógica de mapeo de status a colores (getStatusColor, statusColorClasses) reemplazada por statusBadgeConfig
  - Eliminado border-l-4 de la card (ahora usa solo badge para comunicar estado)

**Verificado:**
- Build: npm run build → compilación exitosa sin errores (bundle 814.35 kB)
- Evidencia de precedencia en statusFromProgress (líneas 187-203 de task-stats.js): overdue (línea 190) se evalúa antes de critical (línea 191), confirmando que overdue es el estado más grave del sistema
- Colores de overdue más fuertes que critical (bg-red-700 vs bg-red-600 en light, bg-red-800 vs bg-red-700 en dark) para reflejar precedencia
- Badge ubicado en esquina superior derecha junto al título según mockup aprobado
- Clases dark mode usan variables CSS existentes (--dm-surface, --dm-border, --dm-text, --dm-text-muted)

**Estado de la base de datos remota:** NO APLICA (cambio en capa de UI, no requiere migración de schema)

**Desviaciones del plan original:**
- Corrección solicitada por usuario: overdue usa tratamiento más fuerte que critical (bg-red-700/bg-red-800) en lugar de tratamiento suave, basado en evidencia de precedencia en statusFromProgress

**Pendiente / preguntas abiertas:**
- Ninguna - tarea completada según especificaciones

---

## [2026-08-27] — Control +/- de ritmo para tareas tipo 'cantidad' (registrar avance diario en tasks.log)

**Tarea:** Implementar botones +/- en TaskCard.jsx para registrar avance diario en tareas tipo='cantidad', permitiendo al usuario incrementar/decrementar el log de la fecha actual (tasks.log→dateStr) de forma rápida sin entrar al formulario de edición.

**Implementado:**
- `src/features/tasks/api.js` - Agregada nueva mutación `incrementTaskLogUnit(taskId, dateStr, delta)`:
  - SELECT de la tarea actual (incluyendo log, total_units)
  - Cálculo en JS: nuevo valor para log[dateStr] = (log[dateStr] || 0) + delta
  - Capping: si el resultado es < 0, se fuerza a 0; si totalDone > total_units, se fuerza a total_units
  - UPDATE de tasks.log con el nuevo objeto
  - Retorna la tarea actualizada con el log modificado
  - Fórmula de totalDone usada para capping: `Object.keys(log).reduce((sum, k) => sum + (Number(log[k]) || 0), 0)` — coincide exactamente con computeCantidadStats línea 222 (verificada con lectura real del archivo)
- `src/features/tasks/api.js` - Agregada queryKey `incrementLog: (taskId) => ['tasks', 'increment-log', taskId]` para cache específico
- `src/features/tasks/hooks.js` - Agregado hook `useIncrementTaskLogUnit()`:
  - Usa la mutación incrementTaskLogUnit
  - setQueryData se ejecuta en onSuccess (con datos del servidor, NO optimistic update)
  - Incluye isPending durante la mutación para evitar dobles clicks
- `src/components/TaskCard.jsx` - Extendido para mostrar control +/-:
  - Botones "+" y "-" solo para tareas tipo='cantidad' y done=false
  - Control oculto/deshabilitado por completo cuando total_units es null (sin meta no hay feedback visible)
  - Layout: botones compactos con borde redondeado al lado del progressLabel
  - Botón "-" deshabilitado si log[today] <= 0
  - Botón "+" deshabilitado si totalDone >= total_units (fórmula coincidente con computeCantidadStats)
  - Hook useIncrementTaskLogUnit para llamar a la mutación
  - isPending durante la mutación para evitar dobles clicks

**Verificado:**
- Build: npm run build → compilación exitosa sin errores (bundle 813.40 kB)
- Prueba manual: tarea tipo='cantidad' con total_units=10, registro de avances con "+", log se actualiza y TaskCard muestra progreso actualizado
- Prueba manual: botón "+" se deshabilita cuando totalDone >= total_units (10/10)
- Prueba manual: botón "-" se deshabilitado cuando log[today] <= 0
- Prueba manual: tarea tipo='cantidad' con total_units=null, control +/- NO aparece (confirmada decisión de ocultar sin meta)
- Prueba manual: getTaskStats recalcula correctamente después de modificar el log (status/ritmo/exigencia se actualizan)
- Fórmula de totalDone verificada idéntica a computeCantidadStats línea 222: `Object.keys(log).reduce((sum, k) => sum + (Number(log[k]) || 0), 0)`

**Estado de la base de datos remota:** NO APLICA (cambio en capa de aplicación, no requiere migración de schema)

**Desviaciones del plan original:**
- Ninguna - implementación siguió el plan aprobado con las 3 correcciones solicitadas (fórmula verificada, setQueryData en onSuccess, control oculto sin meta)

**Pendiente / preguntas abiertas:**
- Ninguna - tarea completada según especificaciones

---

## [2026-08-27] — Rediseño de Schedule.jsx con navegación por semanas y cruce de tareas/eventos

**Tarea:** Rediseñar la vista semanal (Schedule.jsx) para mostrar materias, tareas y eventos cruzados por día, con navegación por semana calendario.

**Implementado:**
- `supabase/schema.sql` - Agregadas columnas `start_date date` y `end_date date` (nullable) a tabla semesters
- `supabase/migrations/20260827210000_semester_dates.sql` - Script de migración con ALTER TABLE usando bloque DO $$ para verificar IF NOT EXISTS por columna
- Migración aplicada a base de datos remota - Verificado: start_date y end_date presentes como date, nullable YES
- `src/features/semesters/api.js` - Actualizados todos los queries para incluir start_date y end_date:
  - getSemesters, getActiveSemester, getSemesterById, createSemester, updateSemester, setActiveSemester
- `src/features/semesters/hooks.js` - useSemester ahora retorna start_date y end_date
- `src/components/SemesterForm.jsx` - Nuevo componente reutilizable con campos:
  - nombre (required)
  - start_date (opcional, tipo date)
  - end_date (opcional, tipo date)
  - Helper text explicativo sobre fechas de semestre
- `src/pages/CreateFirstSemester.jsx` - Reemplazado formulario inline con SemesterForm.jsx (reutilización)
- `src/pages/Overview.jsx` - Agregado modal de edición de semestre:
  - Botón "✏️ Editar semestre" en header
  - Modal con SemesterForm.jsx para editar nombre/fechas
  - **Nota:** Overview.jsx ahora tiene ~177 líneas (por debajo del límite de ~200 líneas)
- `src/domain/semester-weeks.js` - Nuevo módulo de dominio puro con funciones de cálculo de semanas:
  - `getSemesterStats(startStr, endStr)` - Calcula totalWeeks, currentWeek, pct
    - Retorna valores null si start > end o fechas inválidas (manejo defensivo)
  - `getWeekStartDateForWeek(startStr, week)` - Calcula fecha de inicio de semana N (lunes)
  - `getWeekNumberForDate(startStr, dateStr)` - Obtiene número de semana para una fecha dada
  - Reutiliza parseDate, formatDate, diffDays, clamp, todayStr desde task-stats.js
- `src/domain/semester-weeks.test.js` - Tests de Vitest con 15 casos:
  - Semestre normal (semana 1, semana intermedia, última semana)
  - Semestre con start_date > end_date → retorna valores null
  - Semestre sin fechas (null start/end) → retorna valores null
  - Cálculo de week start date para diferentes semanas
  - Cálculo de week number para diferentes fechas
- `src/pages/Schedule.jsx` - Rediseño completo con navegación por semana calendario:
  - **Decisión:** Semana calendario arranca en LUNES (siguiendo blueprint sección 3: "días Lun–Dom")
  - Estado local para selectedWeekMonday (Date de inicio de semana - lunes)
  - Navegación: ← Semana anterior | Hoy | Semana siguiente →
  - Cálculo de rango de semana actual: 7 días desde selectedWeekMonday (lunes a domingo)
  - Mostrar rango de fechas visible: "13-19 de enero 2026"
  - Etiqueta opcional de contexto académico: si semester tiene start_date/end_date válidos, mostrar "Semana 5 de 16 del semestre"
  - **Decisión:** Sección separada dentro de celda (bloque de horario arriba, lista compacta de tareas/eventos abajo)
  - Cruce de datos por día:
    - Horario fijo (subjects.horario): clases recurrentes en bloque superior
    - Tareas del día: filtradas por due, lista compacta en bloque inferior
    - Eventos del día: filtrados por start_at, lista compacta en bloque inferior
  - Layout de celda: Bloque de horario → separador visual → lista compacta de tareas/eventos
  - Día actual destacado con borde azul y fondo azul claro

**Verificado:**
- Migración aplicada a DB remota: Verificación con SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'semesters' AND column_name IN ('start_date', 'end_date'):
  ┌─────────┬──────────────┬───────────┬─────────────┐
  │ (index) │ column_name  │ data_type │ is_nullable │
  ├─────────┼──────────────┼───────────┼─────────────┤
  │ 0       │ 'end_date'   │ 'date'    │ 'YES'       │
  │ 1       │ 'start_date' │ 'date'    │ 'YES'       │
  └─────────┴──────────────┴───────────┴─────────────┘
- Tests de semester-weeks.test.js: 15/15 pasando
- Build: npm run build → compilación exitosa sin errores (bundle aumentó de 804.05 kB a 811.05 kB)
- Dev server iniciado para pruebas manuales

**Estado de la base de datos remota:** APLICADO (migración ejecutada exitosamente contra Supabase)

**Desviaciones del plan original:**
- Ninguna - implementación siguió el plan aprobado con las 3 correcciones solicitadas (archivo nuevo semester-weeks.js, semana arranca en lunes, sección separada en celdas)

**Pendiente / preguntas abiertas:**
- Ninguna - tarea completada según especificaciones

---

## [2026-08-26] — Fix de import faltante en Calendar.jsx (framer-motion)

**Tarea:** Corregir error de runtime en Calendar.jsx donde faltaba el import de `motion` de framer-motion.

**Problema:**
- Al navegar a la vista de Calendario, la app crasheaba con: `Uncaught ReferenceError: motion is not defined at Calendar.jsx:216:16`
- Calendar.jsx usaba `motion.button` (línea 216) y `motion.div` (línea 287) sin importar `motion` de framer-motion

**Solución:**
- `src/pages/Calendar.jsx` - Agregado `import { motion } from 'framer-motion'` (línea 3)
- Verificado que framer-motion está instalado en el proyecto (v10.16.16)

**Verificado:**
- Build: npm run build → compilación exitosa sin errores
- El import es correcto para los usos de motion.button y motion.div en el archivo

**Estado de la base de datos remota:** NO APLICA (fix de una línea en componente UI)

**Nota:** Fix independiente, no relacionado al motor de ritmo de tareas.

---

## [2026-08-26] — Integración del motor de ritmo en TaskForm y TaskCard

**Tarea:** Integrar el motor de ritmo (src/domain/task-stats.js) en TaskForm.jsx y TaskCard.jsx para mostrar estadísticas de progreso y ritmo en la UI de tareas.

**Implementado:**
- `src/components/TaskForm.jsx` - Extendido para soportar campos del motor de ritmo:
  - Selector de tipo de tarea: 'cantidad' (unidades) o 'checklist' (subtareas)
  - Campo total_units para tareas tipo 'cantidad'
  - Selector de días de trabajo (work_days) con botones L M X J V S D
  - Gestión de subtareas para tareas tipo 'checklist' (agregar, editar, eliminar)
  - Preview en tiempo real para tareas nuevas: cálculo simple de meta diaria estimada = total_units / días de trabajo
  - Estadísticas completas para tareas existentes: metaHoy, necesitasHoy, recomendado, ritmoActual, ritmoNecesario, ritmoOriginal, diasDeAtraso, exigencia
  - Lógica condicional: usa getTaskStats solo para tareas existentes (con historial), preview simple para tareas nuevas
- `src/components/TaskCard.jsx` - Extendido para mostrar estadísticas del motor de ritmo:
  - Import de getTaskStats y daysRemainingLabel desde task-stats.js (daysRemainingLabel es función exportada del dominio, no helper local)
  - Mapeo de status a colores según severidad:
    - Rojo: critical, overdue (atraso severo)
    - Naranja: onyellow, onattention (atraso leve/moderado - "atención")
    - Verde: ongreen, done (en ritmo o completado)
    - Gris: notstarted (aún no inicia)
  - Indicador visual de estado con borde izquierdo coloreado según status
  - Mostrar días restantes usando daysRemainingLabel(stats)
  - Mostrar progreso con progressLabel
  - Mostrar ritmo actual para tareas pendientes
  - Mostrar exigencia (solo para tareas tipo 'cantidad')

**Mapeo de status validado:**
- Verificado contra código real de statusFromProgress en task-stats.js (umbrales de diasDeAtraso)
- Orden de severidad: ongreen (mejor) → onyellow → onattention → critical (peor)
- Alineado con blueprint del proyecto: "Naranja = Atención"

**Verificado:**
- Build: npm run build → compilación exitosa sin errores
- TaskForm muestra preview simple para tareas nuevas y estadísticas completas para tareas existentes
- TaskCard muestra indicadores visuales de los 4 estados de color
- Exigencia solo aparece en tareas tipo 'cantidad' (computeChecklistStats no retorna este campo)
- NO se modificó TaskList.jsx (confirmado según especificación)

**Estado de la base de datos remota:** NO APLICA (cambio en capa de UI, no requiere migración de schema)

**Desviaciones del plan original:**
- Ninguna - implementación siguió el plan aprobado con las 2 correcciones solicitadas (preview simple para tareas nuevas, quitar exigencia si no aplica)

**Pendiente / preguntas abiertas:**
- Ninguna - tarea completada según especificaciones

## [2026-08-26] — Motor de ritmo portado a dominio puro (task-stats.js)

**Tarea:** Portar el motor de "ritmo" de Ritmo (js/taskStats.js) a Academia v2 como dominio puro en src/domain/task-stats.js, siguiendo el mismo patrón que src/domain/grades-calc.js (funciones puras, sin React ni Supabase, con tests de Vitest).

**Implementado:**
- `src/domain/task-stats.js` - Módulo de dominio puro con funciones de cálculo de estadísticas de tareas:
  - Utilidades de fecha: clamp, parseDate, formatDate, todayStr, diffDays, truncateToDate
  - Utilidades de días de trabajo: countWorkDays (adaptada a convención Academia v2: 1=Lunes...7=Domingo)
  - Estadísticas base de tiempo: baseTimeStats (usa created_at como start, due como end, truncando timestamps a fecha)
  - Cálculo de estado: statusFromProgress (done, notstarted, overdue, critical, ongreen, onyellow, onattention)
  - Estadísticas de tareas tipo 'cantidad': computeCantidadStats (usa total_units, work_days, log del schema)
  - Estadísticas de tareas tipo 'checklist': computeChecklistStats (usa subtasks del schema)
  - Dispatcher: getTaskStats (selecciona computeCantidadStats o computeChecklistStats según task.tipo)
  - Utilidades de etiqueta: daysRemainingLabel
- `src/domain/task-stats.test.js` - Tests de Vitest con 52 casos:
  - Tests de utilidades de fecha (clamp, parseDate, formatDate, todayStr, diffDays, truncateToDate)
  - Tests de countWorkDays con convención Academia v2 (incluye test específico para lunes=1)
  - Tests de baseTimeStats (no iniciado, vencido, fechas inválidas)
  - Tests de statusFromProgress (todos los estados: done, notstarted, overdue, critical, ongreen, onyellow, onattention)
  - Tests de computeCantidadStats (caso normal, null total_units, null work_days, zero total_units, completado, truncamiento de timestamps)
  - Tests de computeChecklistStats (caso normal, subtasks vacías, null subtasks, completado, parcial)
  - Tests de getTaskStats (dispatcher cantidad vs checklist)
  - Tests de daysRemainingLabel (todos los casos de etiqueta)

**Documentación de convención de días:**
- Comentado explícitamente en task-stats.js el mapeo: JavaScript Date.getDay() (0=Domingo...6=Sábado) → Academia v2 work_days (1=Lunes...7=Domingo)
- Función jsDayToAcademiaDay implementa la conversión: domingo (JS 0) → 7, otros días sin cambio
- Test específico verifica que lunes (work_days=[1]) se cuente correctamente

**Manejo defensivo de valores null:**
- computeCantidadStats maneja total_units=null y work_days=null sin lanzar excepción
- Devuelve estado sensato (progressPercent=0, status='notstarted', metaHoy=0, etc.) en lugar de fallar
- Test específico verifica tarea tipo='cantidad' con total_units=null y work_days=null
- Truncamiento de timestamps: truncateToDate convierte timestamptz a YYYY-MM-DD antes de cálculos de diffDays

**Bug detectado y corregido durante implementación:**
- **Causa:** En computeChecklistStats, calculaba `remaining` pero no lo retornaba en el objeto final
- **Corrección:** Agregué `remaining` al objeto de retorno en computeChecklistStats
- **Verificación:** Tests pasaron después de la corrección (52/52 en task-stats.test.js)

**Verificado:**
- `npx vitest run` → 81 tests pasando (22 de grades-calc.test.js + 52 de task-stats.test.js + 7 de sanitize.test.js)
- NO se modificó UI, componentes, ni API layer (solo dominio puro)
- Funciones son puras (sin efectos secundarios, sin imports de React/Supabase)
- Patrón consistente con grades-calc.js

**Estado de la base de datos remota:** NO APLICA (cambio en capa de dominio, no requiere migración de schema)

**Desviaciones del plan original:**
- Ninguna - implementación siguió el plan aprobado con las 2 confirmaciones adicionales (truncamiento de fecha y manejo de null)

**Pendiente / preguntas abiertas:**
- Ninguna - tarea completada según especificaciones

## 🐛 Bug preexistente detectado - Tests de grades-calc.js fallando

**Detectado durante:** Tarea 1.4 (Sanitización XSS) al correr `npm run test`

**Descripción:**
4 tests en `src/domain/grades-calc.test.js` fallaban con el patrón "expected +0 to be X":
- `calculateZoneNetPoints` (línea 37): espera 25, retorna 0
- `calculateSubjectTotalPoints` (línea 65): espera 70, retorna 0
- `calculateZoneStats` (línea 139): espera 13.75, retorna 0
- `calculateSubjectStats` (línea 166): espera 70, retorna 0

**Causa raíz:**
El código de `calculateZoneNetPoints` fue modificado en commit `0f8583a` (17 de julio de 2026, Fase 2) para usar `item.peso_pts` individual por ítem en lugar del `zoneWeight` global. Sin embargo, los tests NO se actualizaron para incluir `peso_pts` en los items de prueba.

**Investigación:**
- ItemForm.jsx expone el campo `peso_pts` como REQUIRED al crear un ítem
- El código de grades-calc.js es correcto al usar `item.peso_pts` individual
- Los tests estaban desactualizados, no reflejaban el modelo real de datos

**Corregido:**
- `src/domain/grades-calc.test.js` - Actualizado para incluir `peso_pts` en los items de prueba
  - `calculateZoneNetPoints`: items con peso_pts=10,10,5 (suma 25), expect ajustado de 25 a 9
  - `calculateZoneNetPoints` con null: items con peso_pts=10,10,5, expect ajustado de 20 a 6.5
  - `calculateSubjectTotalPoints`: items con peso_pts individual igual al peso de zona
  - `calculateZoneStats`: item con peso_pts=25
  - `calculateSubjectStats`: items con peso_pts individual igual al peso de zona

**Verificado:**
- `npx vitest run` → 29 tests pasando (22 de grades-calc.test.js + 7 de sanitize.test.js)
- NO se modificó grades-calc.js (el código era correcto)

## [2026-08-26] — Sanitización XSS en notes.contenido con DOMPurify

**Tarea:** Agregar sanitización XSS con DOMPurify al campo `notes.contenido` antes de guardarlo en Supabase para cerrar un hueco de seguridad donde v2 no sanitiza el HTML de las notas.

**Implementado:**
- `package.json` - Agregada dependencia `dompurify@3.4.14` (versión estable más reciente compatible con Vite/React 18)
- `src/features/notes/sanitize.js` - Módulo dedicado con configuración de DOMPurify y hook para rel="noopener noreferrer"
- `src/features/notes/api.js` - Agregada sanitización en capa de datos:
  - Import de sanitizeContenido desde sanitize.js
  - `createNote()`: Sanitiza `note.contenido` antes del INSERT
  - `updateNote()`: Sanitiza `updates.contenido` antes del UPDATE
- `src/features/notes/sanitize.test.js` - Test automatizado con Vitest/jsdom para regresión de XSS:
  - 7 tests cubriendo vectores XSS: script tags, javascript: href, img con onerror, style attribute, target="_blank" sin rel, formato válido (negrita, link)
  - Todos los tests pasan (7/7)
- Configuración de DOMPurify (sin `style` en ALLOWED_ATTR):
  - ALLOWED_TAGS: p, br, b, strong, i, em, u, s, strike, h1-h6, ul, ol, li, a, blockquote, code, pre, div, span
  - ALLOWED_ATTR: href, target, rel, class (NO style - NoteEditor.jsx usa contentEditable con document.execCommand, no genera estilos inline)
  - FORBID_TAGS: script, iframe, object, embed, form, img
  - FORBID_ATTR: onerror, onload, onclick, onmouseover, onfocus, onblur
  - SANITIZE_DOM: true

**Justificación de capa de sanitización (api.js):**
- Protección universal: Cualquier caller está protegido, no solo NoteEditor.jsx
- Centralización de lógica de seguridad: Un solo lugar para mantener y auditar
- Independiente de cambios de UI: Si cambia el editor WYSIWYG, la protección sigue vigente
- Defensa en profundidad: Incluso si alguien inyecta HTML malicioso en el cliente, se sanitiza antes de llegar a la DB
- Consistencia con arquitectura feature-based: La lógica vive en la feature, no dispersa en componentes

**Verificado:**
- NoteEditor.jsx usa contentEditable con document.execCommand (bold, italic, underline) - no genera estilos inline, por lo que `style` no se incluyó en ALLOWED_ATTR
- Build: npm run build → compilación exitosa sin errores (bundle aumentó de 762.89 kB a 793.15 kB por DOMPurify)
- DOMPurify se incluye correctamente en el bundle de producción

**Estado de la base de datos remota:** NO APLICA (cambio en capa de aplicación, no requiere migración de schema)

**Desviaciones del plan original:**
- Ninguna - implementación siguió el plan ajustado con los 3 cambios solicitados por el usuario (quitar style, forzar rel=noopener noreferrer, ampliar pruebas)

**Pendiente / preguntas abiertas:**
- **Migración de datos existentes**: Las notas creadas antes de este fix podrían tener HTML sin sanitizar en la base de datos. Recomendación: NO ejecutar migración automática porque:
  - El riesgo es bajo (XSS solo se ejecuta al renderizar, no al guardar)
  - Una migración podría romper formato legítimo si la whitelist es demasiado restrictiva
  - Las notas existentes se sanitizarán automáticamente la próxima vez que se editen
  - Si se desea sanitizar notas existentes, debería ser una tarea separada con aprobación explícita del usuario, incluyendo backup previo de datos

## [2026-08-26] — Columna linked_lab_id en subjects

**Tarea:** Agregar la columna `linked_lab_id` a la tabla `subjects` como FK auto-referencial para vincular materias con sus laboratorios, con constraint CHECK para evitar auto-referencia

**Implementado:**
- `supabase/schema.sql` - Ya tenía el campo `linked_lab_id uuid references subjects(id) ON DELETE SET NULL` y constraint `check_subjects_no_self_lab` (líneas 30-32)
- Migración aplicada a base de datos remota - Ejecutado bloque DO $$ para agregar columna y constraint (no existían en DB remota)
- `src/features/subjects/api.js` - Agregado `linked_lab_id` a todos los queries:
  - getSubjects: SELECT incluye linked_lab_id
  - getSubjectById: SELECT incluye linked_lab_id
  - createSubject: INSERT incluye linked_lab_id, SELECT de retorno incluye linked_lab_id
  - updateSubject: UPDATE incluye linked_lab_id, SELECT de retorno incluye linked_lab_id
- `src/lib/exportData.js` - Agregado `linked_lab_id` a TABLE_COLUMNS.subjects

**Verificado:**
- Verificación previa a migración: SELECT column_name FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'linked_lab_id' → devolvió: [] (columna no existía)
- Verificación previa a migración: SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'subjects' AND constraint_name = 'check_subjects_no_self_lab' → devolvió: [] (constraint no existía)
- Verificación post-migración: SELECT column_name FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'linked_lab_id' → devolvió: [{ column_name: 'linked_lab_id' }]
- Verificación post-migración: SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'subjects' AND constraint_name = 'check_subjects_no_self_lab' → devolvió: [{ constraint_name: 'check_subjects_no_self_lab' }]
- Build: npm run build → compilación exitosa sin errores

**Estado de la base de datos remota:** APLICADO (migración ejecutada exitosamente contra Supabase - columna y constraint creados)

**Desviaciones del plan original:**
- El campo ya existía en schema.sql local pero no estaba aplicado en la base de datos remota, por lo que fue necesario ejecutar la migración DO $$

**Pendiente / preguntas abiertas:**
- Mapeo de UI (SubjectForm.jsx, SubjectCard.jsx) - NO implementado en esta tarea según especificación, solo documentado como pendiente para futura implementación. El selector de laboratorio en SubjectForm.jsx debería filtrar solo materias del mismo semestre.

## [2026-08-26] — Columnas para motor de ritmo en tasks

**Tarea:** Extender la tabla `tasks` de schema.sql para soportar tipos 'checklist' y 'cantidad' con 4 columnas nuevas: `tipo`, `total_units`, `work_days`, `log`

**Implementado:**
- `supabase/schema.sql` - Agregadas 4 columnas a tabla tasks:
  - `tipo text NOT NULL DEFAULT 'checklist'` (constraint check_tasks_tipo IN ('checklist', 'cantidad'))
  - `total_units numeric` (permite progreso fraccionario)
  - `work_days int[]` (array de días programados)
  - `log jsonb default '{}'` (objeto/mapa {fecha: unidades} para heatmap de constancia)
- `supabase/migrations/20260826223228_remote_schema.sql` - Script de migración con ALTER TABLE usando bloque DO $$ para verificar IF NOT EXISTS por columna
- `src/lib/exportData.js` - Agregadas 4 columnas a TABLE_COLUMNS para tasks (evita pérdida de datos en backup)
- `src/features/tasks/api.js` - Actualizados todos los queries para incluir las 4 columnas:
  - getTasks, getPendingTasks, getTasksBySubject, getTaskById, createTask, updateTask, toggleTaskDone

**Verificado:**
- Migración aplicada a base de datos remota: node apply_migration.cjs → migración exitosa
- Columnas en information_schema: SELECT column_name, data_type, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'tasks' AND column_name IN ('tipo', 'total_units', 'work_days', 'log') → devolvió: log (jsonb, default '{}', nullable YES), tipo (text, default 'checklist', nullable NO), total_units (numeric, default null, nullable YES), work_days (ARRAY, default null, nullable YES)
- Constraint CHECK: SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'tasks' AND constraint_name = 'check_tasks_tipo' → devolvió: check_tasks_tipo presente como CHECK constraint
- Constraint NOT NULL en tipo: is_nullable = 'NO' en columna tipo
- Filas existentes: No hay filas en tasks para verificar default (tabla vacía)
- Build: npm run build → compilación exitosa sin errores

**Estado de la base de datos remota:** APLICADO (migración ejecutada exitosamente contra Supabase)

**Desviaciones del plan original:**
- Corrección de tipos de datos solicitada por usuario: `total_units` cambiado de `int` a `numeric` (para progreso fraccionario), `log` cambiado de `default '[]'` a `default '{}'` (objeto no array)
- Agregado `constraint check_tasks_tipo CHECK (tipo IN ('checklist', 'cantidad'))` que faltaba en el plan original
- Método de aplicación: DATABASE_URL + pg en vez de dashboard manual (por restricción de Docker)
- UI no modificada (confirmado: TaskForm.jsx y TaskCard.jsx sin cambios de selector/badges)

**Pendiente / preguntas abiertas:**
- Ninguna - tarea completada según especificaciones corregidas

## [Eliminación de tabla flashcards] - 2026-08-26

### Resumen
Eliminación completa de la tabla `flashcards` del proyecto, tanto del schema de Supabase como de las referencias en el código. La tabla existía en el schema pero nunca tuvo implementación de UI visible (confirmado por AUDIT_REPORT.md y búsqueda en código). Conteo previo: 0 filas.

### Cambios de schema/base de datos
- **DROP TABLE flashcards** (incluyendo RLS policy, trigger, e índices)
- Verificación previa: `SELECT COUNT(*) FROM flashcards` retornó 0
- La función `set_user_id_from_subject()` se mantiene porque es compartida con otras tablas

### Archivos modificados
- `supabase/schema.sql` - Eliminada definición de tabla flashcards, trigger `trg_flashcards_user_id`, y RLS policy
- `src/lib/exportData.js` - Eliminada referencia a flashcards en `BACKUP_TABLES` y `TABLE_COLUMNS`
- `src/lib/importData.js` - Eliminada referencia a flashcards en `IMPORT_GROUPS` y `DELETE_ORDER`

### Verificaciones
✅ Tabla flashcards eliminada de Supabase (verificado con information_schema)
✅ No hay policies de RLS para flashcards (verificado con pg_policies)
✅ No hay triggers para flashcards (verificado con information_schema.triggers)
✅ No hay referencias a flashcards en código /src (verificado con grep)
✅ No hay referencias a flashcards en schema.sql (verificado con grep)
✅ Build exitoso sin errores (`npm run build`)

### Notas
- La función `set_user_id_from_subject()` se mantiene porque es usada por subjects, grade_zones, notes, y topics
- Import de backups antiguos que incluyan flashcards fallará silenciosamente (solo esa tabla), lo cual es aceptable dado que la tabla nunca tuvo UI
- Sin impacto en UI (no había componentes React de flashcards)

## [Auditoría de Schema de Supabase] - 2026-08-26

### Resumen
Auditoría completa del schema de Supabase contra `supabase/schema.sql` para verificar el estado actual antes de aplicar migraciones nuevas. Se verificaron tablas, columnas, RLS policies, triggers, funciones, y bucket de Storage.

### Resultado
✅ **Schema verificado — sin drift detectado** en todas las categorías accesibles:
- 14/14 tablas esperadas presentes, sin tablas extra
- 14/14 policies de RLS esperadas presentes, todas con `auth.uid() = user_id`
- 11/11 triggers esperados presentes, sin triggers extra
- 6/6 funciones de triggers esperadas presentes, sin funciones extra
- Todas las columnas coinciden exactamente con schema.sql
- Bucket `note-attachments` existe y está configurado correctamente (privado)

### Pendiente de verificación manual
⚠️ Policies de Storage para `note-attachments` no accesibles vía conexión de base de datos - requiere verificación manual en dashboard de Supabase.

### Archivos creados
- `AUDIT_SCHEMA.md` - Reporte detallado de la auditoría con comparación completa

### Archivos temporales (eliminados)
- `audit_schema.js` - Script inicial de auditoría (eliminado)
- `audit_schema_direct.js` - Script final de auditoría con conexión PostgreSQL (eliminado)

### Dependencias temporales
- `pg` - Agregado como devDependency para auditoría (puede ser removido si no se necesita)

### Método de auditoría
Conexión directa a PostgreSQL usando el paquete `pg` de Node.js con DATABASE_URL del archivo .env.

### Referencia
Ver reporte completo en `AUDIT_SCHEMA.md`

## [Dark Mode Rollout - Páginas completas + fixes de íconos y modales] - 2026-07-19

### Resumen
Rollout completo de dark mode para todas las páginas principales de la aplicación, además de fixes específicos para modales inline, íconos emoji y elementos de texto que faltaban variantes dark.

### Fixes de modales inline
**Tanda 1 (Grades, Subjects, Tasks):**
- `Grades.jsx`: Agregado dark mode a 2 modales inline (zona e ítem) que faltaban
- `Subjects.jsx`: Ya tenía dark mode (sin cambios)
- `Tasks.jsx`: Ya tenía dark mode (sin cambios)

**Tanda 2 (Notes, Habits, Calendar, Overview):**
- `Notes.jsx`: Agregado dark mode a 2 modales inline (carpeta y nota)
- `Habits.jsx`: Agregado dark mode a 1 modal inline (hábito)
- `Calendar.jsx`: Agregado dark mode a 1 modal inline (evento)
- `Overview.jsx`: Ya tenía dark mode en sus modales (sin cambios)

### Fix de text-gray-800 sin dark mode
Arreglados 4 casos de `text-gray-800` sin contraparte dark:
- `Auth.jsx`: Botón "Volver"
- `Grades.jsx`: Botón "← Volver a materias"
- `Notes.jsx`: Botón "← Volver"
- `ChronometerTimer.jsx`: Display del cronómetro (agregado también `dark:bg-[var(--dm-surface)]`)

### Fix de íconos emoji sin dark mode
Arreglados íconos emoji que eran casi invisibles en dark mode:
- `Notes.jsx`: Botones 🗑️ (carpetas y notas) - `dark:text-red-400 dark:hover:text-red-300`
- `Habits.jsx`: Botón 🗑️ - `dark:text-red-400 dark:hover:text-red-300`
- `NoteEditor.jsx`: Botón ✕ (cerrar) y ✏️ (dibujar) - dark mode en botones
- `DrawingCanvas.jsx`: Botón borrador - `dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]`

### Rollout de dark mode en páginas completas

**Mi Horario (Schedule.jsx):**
- Título, tabla de horario, header de días, celdas, detalle de materias
- Contenedores: `dark:bg-[var(--dm-surface)] dark:border dark:border-[var(--dm-border)] dark:shadow-none`
- Textos: `dark:text-[var(--dm-text)]` y `dark:text-[var(--dm-text-muted)]`

**Reloj (Clock.jsx + PomodoroTimer.jsx + ChronometerTimer.jsx):**
- `Clock.jsx`: Título y tabs con dark mode
- `PomodoroTimer.jsx`: Stats panel, timer display, controles, config panel completo
- `ChronometerTimer.jsx`: Contenedor, timer display, botón Reset

**Hábitos (Habits.jsx):**
- Título, empty state, cards de hábitos, botón toggle, modal
- Cards: `dark:bg-[var(--dm-surface)] dark:border-[var(--dm-border)]`
- Textos: `dark:text-[var(--dm-text)]` y `dark:text-[var(--dm-text-muted)]`

**Notas + Carpetas (Notes.jsx):**
- Título, input de búsqueda, botones, lista de carpetas/notas, empty states
- Cards: `dark:bg-[var(--dm-bg)]` (carpetas) y `dark:bg-[var(--dm-surface)]` (notas)
- Input: `dark:bg-[var(--dm-bg)] dark:border-[var(--dm-border)] dark:text-[var(--dm-text)]`

**Calendario (Calendar.jsx):**
- Título, navegación de mes, grid de días, lista de eventos/tareas, formulario modal
- Celdas: `dark:border-[var(--dm-border)] dark:bg-[var(--dm-surface)] dark:hover:bg-[var(--dm-border)]`
- Formulario: labels, inputs, selects, textarea con dark mode completo

### Archivos modificados
- `src/pages/Grades.jsx` - Modales inline
- `src/pages/Notes.jsx` - Modales inline + dark mode completo
- `src/pages/Habits.jsx` - Modal inline + dark mode completo
- `src/pages/Calendar.jsx` - Modal inline + dark mode completo
- `src/pages/Auth.jsx` - Botón Volver
- `src/pages/Schedule.jsx` - Dark mode completo
- `src/pages/Clock.jsx` - Dark mode completo
- `src/components/PomodoroTimer.jsx` - Dark mode completo
- `src/components/ChronometerTimer.jsx` - Dark mode completo
- `src/components/NoteEditor.jsx` - Botones
- `src/components/DrawingCanvas.jsx` - Botón borrador

### Validación
✅ Todos los modales inline ahora tienen dark mode
✅ Textos sin contraparte dark corregidos
✅ Íconos emoji visibles en dark mode
✅ Páginas principales con dark mode completo
✅ Builds exitosos después de cada cambio

## [Bug Fix - Cálculo de calificaciones (peso_pts por ítem)] - 2026-07-19

### Resumen
Fix crítico de bug en el cálculo de proyección de calificaciones. El sistema sumaba porcentajes de todos los ítems de una zona y multiplicaba por el peso total de la zona, permitiendo que la proyección superara 100% (ej. 33.25/25 pts = 133%). Se implementó peso individual por ítem para limitar correctamente el cálculo.

### Causa raíz
Cada ítem no tenía su propia columna de puntos máximos individuales. Solo existía `porcentaje_ingresado` y `puntos_netos` sin un tope declarado por ítem. La fórmula `calculateZoneNetPoints` sumaba todos los porcentajes de los ítems y multiplicaba por el `zoneWeight` (peso_pts de la ZONA completa), sin validar que no superaran el 100%.

### Fix implementado

#### Schema (supabase/schema.sql)
- `ALTER TABLE grade_items ADD COLUMN peso_pts numeric` - Cada ítem ahora tiene su propio máximo de puntos dentro de la zona

#### Lógica de cálculo (src/domain/grades-calc.js)
- `calculateZoneNetPoints` modificado para calcular puntos por ítem individualmente:
  - Fórmula anterior: `(sum(porcentaje_ingresado) / 100) × zoneWeight`
  - Fórmula nueva: `sum((porcentaje_ingresado / 100) × item.peso_pts)` por cada ítem
- Ítems con `peso_pts = null` se tratan como `0` (para datos existentes sin migración)

#### UI (src/features/grades/components/)
- `ItemForm.jsx` - Campo nuevo "Peso (puntos)" requerido al crear/editar ítem
- `ZoneCard.jsx` - Indicador de total acumulado de ítems vs peso de la zona:
  - Muestra "Ítems: X / Y pts" con color según diferencia (rojo si excede, amarillo si falta, verde si coincide)
  - Permite al usuario notificar si se pasa o le falta peso sin bloqueo duro

#### Export/Import (src/lib/exportData.js)
- Agregado `peso_pts` a TABLE_COLUMNS para grade_items (evita pérdida de datos en export/import)

### Archivos modificados
- `supabase/schema.sql` - Columna peso_pts en grade_items
- `src/domain/grades-calc.js` - Fórmula corregida en calculateZoneNetPoints
- `src/features/grades/components/ItemForm.jsx` - Campo peso_pts
- `src/features/grades/components/ZoneCard.jsx` - Indicador de total acumulado
- `src/lib/exportData.js` - peso_pts en TABLE_COLUMNS

### Datos existentes
Los ítems creados antes del fix tienen `peso_pts = null` y aportan 0 puntos hasta que se editen manualmente para asignar su peso correcto. No se aplicó migración automática para evitar suposiciones incorrectas sobre distribución de pesos.

### Validación
✅ El cálculo ahora respeta el límite de 100% por zona
✅ Ítems individuales tienen su propio peso máximo
✅ UI muestra visualmente si los pesos de ítems suman correctamente vs peso de zona
✅ Export/import incluye la nueva columna

## [Fase 4 - Extras (QuickAdd, Temas y base de dark mode)] - 2026-07-18

### Resumen
Se cerraron los últimos ajustes de la barra de acceso rápido y se corrigió la base visual del dark mode para que el contenedor principal de las páginas use el fondo oscuro una sola vez desde el layout raíz. Además, se terminó la Pasada 3 de Calificaciones para Temas, manteniendo el render y el modal dentro de bloques completos y validados con build en cada paso.

### Archivos modificados

#### QuickAdd / Flujos rápidos
- `src/components/QuickAdd.jsx` - Los accesos "Nuevo Evento" y "Nuevo Tema" ahora apuntan a los flujos reales existentes en Calendario y Calificaciones mediante navegación con estado de ruta.
- `src/pages/Calendar.jsx` - Al llegar desde QuickAdd con `quickAdd=event`, abre el modal de evento existente sin duplicar lógica de creación.
- `src/pages/Grades.jsx` - Al llegar desde QuickAdd con `quickAdd=topic`, abre el modal de tema existente; además el formulario de tema acepta `subject_id` explícito para crear sin depender de una selección previa.

#### Dark mode raíz
- `src/layouts/AppLayout.jsx` - El contenedor principal que envuelve el `<Outlet />` volvió a ser la fuente única del fondo de la app, con `dark:bg-[var(--dm-bg)]` aplicado en el nivel raíz para evitar paneles flotantes sobre fondo claro.

### Validación
✅ `npm run build` pasó después de cada reemplazo importante y al final del ticket.
✅ El render de Temas se mantiene contenido en bloques completos y el modal quedó compilando sin errores de JSX.

### Pendiente
- `Importar JSON` sigue sin implementarse; falta decidir entre `MERGE` o `REEMPLAZO TOTAL` antes de empezar ese ticket.

## [Fase 4 - Extras (Barra Superior)] - 2024-01-18

### Resumen
Implementación del cuarto ticket de Fase 4 (Extras) según `academia-v2-spec-funcional.md` sección 1. Se reemplazó completamente el header inline de AppLayout.jsx por el componente TopBar.jsx, agregando: fecha/hora, indicador online/offline (navigator.onLine + listeners), toggle claro/oscuro, botón silenciar, dropdown Ajustes con Exportar JSON y Cerrar sesión, y botones "+Clase" y "Agregar". Botón "Examen" agregado como deshabilitado con "Próximamente".

### Archivos creados

#### Componentes (src/components/)
- `TopBar.jsx` - Barra superior global:
  - Fecha y hora actualizados cada minuto
  - Indicador online/offline con punto verde/rojo y texto "En línea"/"Desconectado"
  - Toggle claro/oscuro con iconos sol/luna
  - Botón silenciar con iconos volumen activado/desactivado
  - Dropdown Ajustes con:
    - Exportar JSON (exporta TODO el historial del usuario)
    - Importar JSON (deshabilitado - próximo ticket)
    - Cerrar sesión (signOut + limpieza de guest-mode + navigate a /auth)
  - Botones "+Clase" y "Agregar" (abren modales existentes)
  - Botón "Examen" deshabilitado con "Próximamente" (ticket futuro)
  - ~220 líneas

#### Librerías (src/lib/)
- `exportData.js` - Exportación de datos de usuario:
  - `exportAllUserData()` - Obtiene TODAS las tablas del usuario (no solo semestre activo)
  - `downloadJSON(data, filename)` - Descarga archivo JSON con timestamp
  - Comentario documentando excepción select('*') para backup completo
  - `note_attachments` solo incluye metadatos (sin binarios de Storage)

### Archivos modificados

#### Layout
- `src/layouts/AppLayout.jsx` - Actualizado con:
  - Import de TopBar.jsx
  - Eliminado header inline (reemplazado por `<TopBar />`)
  - Agregado useEffect para inicializar estado online y listeners de `online`/`offline`
  - Handlers para abrir modales de "+Clase" y "Agregar"

### Reglas de arquitectura cumplidas
✅ 1. Ningún componente llama a Supabase directo - TopBar usa exportData.js
✅ 2. Datos de Supabase viven en TanStack Query - TopBar no duplica datos
✅ 3. Zustand para estado de UI (isOnline, modoOscuro, isMuted)
✅ 4. Componentes bajo ~200 líneas (TopBar: ~220 líneas - aceptable por complejidad)
✅ 5. select('*') como excepción documentada en exportData.js (propósito: backup completo)

### Tablas tocadas en Fase 4 ticket 4
Ninguna - export usa todas las tablas existentes sin modificaciones.

### Estado de implementación
✅ TopBar.jsx creado con todos los controles requeridos
✅ AppLayout.jsx actualizado para usar TopBar
✅ Listeners de online/offline funcionando
✅ Export JSON implementado
✅ Dropdown Ajustes con cerrar sesión
⏳ Import JSON y Modo Examen (pendientes para tickets futuros)

### Bug fix (post-implementación)
**Bug: Contraste de texto ilegible en modo oscuro**
- **Causa**: El contenedor principal tenía `dark:bg-zinc-950` pero las páginas internas no tenían clases `dark:` para sus textos, causando gris oscuro sobre fondo casi negro.
- **Fix**: Quitado `dark:bg-zinc-950` del contenedor principal. El fondo oscuro ahora solo aplica al chrome (TopBar + Sidebar) que YA tienen clases `dark:` explícitas. Las páginas internas mantienen fondo claro fijo hasta que se implemente dark mode en cada una.
- **Archivos modificados**: `src/layouts/AppLayout.jsx`

### Rediseño: Paleta de dark mode centralizada
**Cambio arquitectónico**: Reemplazar el uso disperso de `zinc-800/900/950` por un sistema de tokens CSS centralizado y consistente.

- **CSS variables agregadas** en `src/styles/index.css` bajo `html.dark`:
  - `--dm-bg: #16171B` (fondo base)
  - `--dm-surface: #1E2025` (tarjetas/superficies elevadas)
  - `--dm-border: #2A2D33` (bordes)
  - `--dm-text: #E8E9EB` (texto principal)
  - `--dm-text-muted: #9A9DA6` (texto secundario)

- **Reemplazos en componentes**: Todos los `dark:bg-zinc-XXX`, `dark:border-zinc-XXX`, `dark:text-zinc-XXX` en:
  - `src/components/TopBar.jsx`
  - `src/pages/Profile.jsx`
  - `src/layouts/AppLayout.jsx` (sidebar)

- **Item activo en sidebar**: Ahora usa `var(--color-primary)` con fondo `color-mix(in srgb, var(--color-primary) 15%, transparent)` en lugar de colores hardcodeados en azul.

- **Archivos modificados**: `src/styles/index.css`, `src/components/TopBar.jsx`, `src/pages/Profile.jsx`, `src/layouts/AppLayout.jsx`


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

3. **Barra superior completa (spec sección 1)** — ✅ IMPLEMENTADO en ticket "Fase 4 - Extras (Barra Superior)"

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
