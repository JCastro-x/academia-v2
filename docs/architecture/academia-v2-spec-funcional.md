# Academia v2 — Especificación Funcional Detallada

> Complementa a `academia-v2-arquitectura.md`. Ese documento define el CÓMO (stack, capas,
> fases). Este define el QUÉ exacto de cada pantalla — campo por campo — para que el ticket
> de cada fase no deje ambigüedad al agente que lo ejecute.

## Comportamientos globales (aplican a TODA la app, no a una página en particular)

- **Eliminar siempre pide confirmación** (modal) y después de confirmar muestra un **toast con
  "Deshacer"** por unos segundos antes de borrar de verdad (soft-delete con ventana de gracia).
- **Back button en la PWA navega dentro de la app**, no la cierra — se resuelve con el router
  manejando el historial (no dejar que el evento `popstate` se escape del shell de la app).
- **Refresh mantiene la página actual** — ya viene resuelto por la decisión de rutas reales
  (sección de arquitectura): cada vista tiene su URL, no hay estado que se pierda al recargar.
- **Animaciones/transiciones en cada acción** (abrir modal, completar tarea, cambiar de página,
  difuminados) — se resuelve con Framer Motion (agregar a package.json en Fase 0).
- **Decisión: Agenda Semanal se mantiene**, pero es un componente de solo lectura derivado de
  `tasks`/`events` ya cargados — no tiene tabla ni store propio.

## 0.5 Landing pública, autenticación y modo invitado

**Landing (`/`)**: página pública de marketing — hero, propuesta de valor, botón "Entrar con Google".
Enlaces a Términos y Privacidad (páginas estáticas propias, no modales).

**Auth (`/auth`)**: "Ingresar con Google" o **"Probar sin cuenta" (modo invitado)** — para que alguien
que no confía todavía en el sitio lo pruebe sin comprometerse. El modo invitado usa datos locales
(no Supabase) y debe dejar claro en la UI que no hay sync ni persistencia entre dispositivos; ofrecer
un camino de "conviértete en cuenta real" que suba esos datos locales al crear cuenta.

**Problema conocido de v1: la landing nunca indexó en Google.** Causa típica cuando la app entera es
una SPA client-side: el HTML que le llega al crawler está casi vacío (solo el `<div id="root">`) hasta
que React monta y pide datos — muchos crawlers no esperan ese JS, o lo descartan por bajo valor.
**Enfoque en v2:** la landing pública, Términos y Privacidad **no viven dentro del bundle autenticado
de React Router** — se sirven como HTML estático (o pre-renderizado, ej. `vite-plugin-ssg`/páginas
`.html` simples) sin depender de que se monte la app entera ni de sesión. Solo `/auth` en adelante
carga el bundle de React con Supabase. Esto separa "lo que Google necesita ver" de "lo que necesita
sesión", y resuelve el problema de raíz en vez de intentar SEO tricks sobre una SPA.



**Agregar rápido** (modal con 4 opciones):
- **Nueva Tarea**: título, descripción, subtareas, archivos adjuntos, comentarios, prioridad,
  materia, fecha de entrega, hora de entrega, recordatorio.
- **Nuevo Evento**: materia, tipo (parcial/tarea/otro), fecha+hora de inicio, fecha+hora de fin,
  descripción.
- **Nuevo Tema**: materia, apartado (parcial), fecha de la clase (default: hoy), nombre del tema,
  subtemas, dificultad (alimenta el repaso espaciado), tiempo a dedicar, fecha de examen (opcional).
- **Nueva Clase**: nombre, código, créditos, ícono, color, ¿tiene lab?, sección, días de clase, hora
  de clase, configuración de zonas (tareas/parciales/final/proyectos/lab) — deben sumar 100, la UI
  autocalcula y avisa si faltan o sobran puntos.

**Barra superior** (visible en casi toda la app): fecha/hora, estado en línea, botón silenciar
sonidos, ajustes (exportar/importar JSON, cerrar sesión), toggle claro/oscuro, acceso rápido a
"+Clase", "Agregar" y "Examen".

**Modo examen**: panel de focus con temporizador personalizado (input de minutos), iniciar, reset,
salir. Es una vista separada, no un modal.

**Agenda semanal**: tira de 7 días, resalta hoy, avanza con el calendario (solo lectura, ver arriba).

**Panel de tareas pendientes**: ordenado por fecha de vencimiento ascendente; toggle para
mostrar/ocultar eventos mezclados con tareas.

## 2. Materias

Lista de materias con nombre, código, créditos, catedrático, color/ícono, badge de lab si aplica.
Acciones por card: editar (incluye corregir zonas de calificación), eliminar, ir a "Ingresar nota".

## 3. Mi Horario

Grilla Lunes–Sábado por bloques de hora. Debajo, "Detalle de Materias": catedrático, sección,
días, horario, color/ícono/código — uno por materia.

## 4. Tareas

Vista de **todas** las tareas (incluidas completadas, a diferencia de Resumen que no las muestra).
Filtros: por materia, por prioridad, por fecha de vencimiento. Buscador. Botón "borrar completadas".
Botón agregar.

## 5. Notas

**Modelo de carpetas anidado**, tipo explorador de archivos de Windows: carpetas dentro de carpetas,
cada nota vive en la carpeta donde se creó y solo se ve ahí (no aparece en otras carpetas ni fuera).

Al crear una nota: título, carpeta (opcional), materia (opcional).

**Editor**: texto simple con negrita/cursiva/subrayado; canvas de dibujo tipo Paint; subir
PDF/imagen; pegar imagen con Ctrl+V directo en la nota; extracción de texto desde PDF o .txt hacia
la nota (librería de parsing); click en una imagen la agranda en pantalla; ver nota en pantalla
completa; eliminar.

**Nota de la v1:** esta sección tenía bugs conocidos (creación de notas fallaba a veces) — en v2 no
se "hereda" el bug, se reconstruye desde el modelo de carpetas hacia arriba, no parcheando lo viejo.

## 6. Reloj (Pomodoro / Temporizador / Cronómetro)

Temporizador y Cronómetro: simples, con plantillas/presets para iniciar con un click.

**Pomodoro**: ciclos configurables, minutos de estudio/descanso, panel de racha (días, sesiones,
minutos semana), panel de sonidos ambientales (se pausan si el pomodoro se pausa o está en
descanso), modo **Focus** (pantalla completa dentro de la app, no del navegador), modo **Picture-in-
Picture** (para ver el timer en otra pestaña/app del SO).

**Problema técnico conocido (v1):** sin el PiP activo o sonido de fondo, si cambiabas de pestaña el
navegador throttleaba el tab y el pomodoro se desincronizaba/pausaba.
**Enfoque en v2:** no contar con `setInterval` tick a tick — guardar el timestamp de inicio y la
duración objetivo, y calcular el tiempo restante por diferencia de reloj (`Date.now() - startedAt`)
cada vez que la pestaña vuelve a estar visible (`visibilitychange`). Así el timer "se pone al día"
al volver, en vez de perder cuenta. El PiP sigue siendo el mecanismo para verlo sin cambiar de tab,
pero ya no es la única forma de que el conteo no se rompa.

## 7. Calendario

Grilla de mes, cada celda es clickeable para agregar evento ahí directo. Navegación entre meses,
día actual resaltado. Debajo: lista de eventos/tareas del mes. Modal de evento: nombre, materia,
tipo, fecha+hora inicio, fecha+hora fin, descripción (mismo modelo que "Nuevo Evento" del punto 1).

## 8. General (sub-panel)

- **Calificaciones**: entras a una materia y ves las zonas ya configuradas al crear la clase (ej.
  "Final" vale 25 pts). Por cada ítem dentro de la zona ingresas el % que muestra la plataforma del
  curso (ej. 50 → 50%), la app lo convierte a puntos netos según el peso real (12.50), suma todas
  las zonas, proyecta la nota final estimada y dice cuánto falta para "ganar". Color de estado:
  rojo (por debajo de zona mínima), amarillo (en zona mínima pero no ganada), verde (ganada). El
  umbral de "ganada" es configurable por clase (ya existe en `grade_zones`/config de materia).
- **Estadísticas**: *pendiente de definir* — hoy solo muestra un promedio general. Antes de meterlo
  en un ticket de fase, definir qué métricas exactas debe mostrar (¿tendencia por semestre?,
  ¿comparación entre materias?, ¿horas de estudio vs. Pomodoro?).
- **Temas del Curso**: temas agrupados por parcial (Parcial 1, Parcial 2, Parcial 3, Final) para no
  ver de golpe temas que no tocan todavía. Cada tema tiene subtemas, dificultad (alimenta repasos),
  tiempo a dedicar, fecha de examen opcional.
- **Hábitos**: quedó sin terminar en v1 — *pendiente de especificar* antes de su ticket de fase.

## 9. Semestres

Editar, activar o eliminar cada semestre. **Al cambiar el semestre activo, toda la app cambia de
alcance** (notas, tareas, calificaciones) para no mezclar datos entre semestres — esto ya está
resuelto por la decisión de arquitectura de `semester_id` como route param.

## 10. Mi Perfil

Personalización: tipografía, color/tema de la app, sonidos de interacción, claro/oscuro. Datos:
nombre, registro académico, carrera, institución. **"Cursos ganados" (progreso de carrera) NO
cambia al cambiar de semestre** — es acumulado a nivel de usuario, no de semestre.

## 11. Ajustes al esquema de datos (respecto a `academia-v2-arquitectura.md`)

Estas tablas/columnas se agregan o ajustan sobre el `schema.sql` ya definido:

```sql
-- Carpetas anidadas para Notas (tipo explorador de archivos)
create table folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  subject_id uuid references subjects,       -- opcional: carpeta puede no pertenecer a una materia
  parent_id uuid references folders,         -- null = carpeta raíz
  nombre text not null
);
create index on folders (parent_id);
create index on folders (user_id);

-- notes.folder_id: la nota vive en UNA carpeta, visible solo ahí
alter table notes add column folder_id uuid references folders;

-- Eventos de calendario (distinto de tasks: rango de inicio/fin, no due-date único)
create table events (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects,
  semester_id uuid references semesters not null,
  user_id uuid not null,
  nombre text not null,
  tipo text,               -- 'parcial' | 'tarea' | 'otro'
  start_at timestamptz not null,
  end_at timestamptz,
  descripcion text
);
create index on events (semester_id);
create index on events (user_id);

-- tasks: agregar recordatorio
alter table tasks add column reminder_at timestamptz;

-- topics: agregar los campos que faltaban en el esquema original
alter table topics add column subtemas jsonb default '[]';
alter table topics add column dificultad int;              -- alimenta el repaso espaciado
alter table topics add column tiempo_dedicado_min int;
alter table topics add column fecha_examen date;

-- grade_zones: el umbral de "ganada" es configurable por materia, no fijo
alter table grade_zones add column ganada_pct numeric default 60;
```

`folders` y `events` heredan el mismo patrón de trigger + RLS de un solo salto que el resto del
esquema (poblar `user_id` desde `subjects`/`semesters` según corresponda, política
`using (auth.uid() = user_id)`).

## 12. Pendientes que necesitan una decisión tuya antes de convertirse en ticket

- **Estadísticas**: qué métricas exactas mostrar.
- **Hábitos**: cómo se ve y qué trackea exactamente (solo quedó "sin terminar" en la v1).
- Si "Nuevo Evento" y "Nuevo Tema" deben poder crearse también sin pasar por el modal de "Agregar
  rápido" (ej. directo desde la celda del calendario, que ya mencionaste que es clickeable).
- **Exportar/Importar JSON**: qué pasa en el import si ya hay datos existentes — ¿reemplaza todo?
  ¿hace merge? ¿cómo se resuelven IDs duplicados? Sin definir esto, un agente va a asumir "reemplaza
  todo", que es la opción más destructiva.

## 13. Notas de ejecución (riesgo y orden interno de subtareas)

- **Notas es la sección de mayor riesgo de la Fase 3**, y no debe tratarse como un ticket monolítico
  aunque quede agrupada en una sola fase del roadmap. Editor de texto + carpetas anidadas + subir/
  pegar imágenes y PDF + canvas de dibujo son 4 piezas de complejidad muy distinta, y es justo la
  parte que ya dio bugs en la v1. Orden interno recomendado dentro del ticket de Notas:
  1. Editor + carpetas anidadas (bajo riesgo, es lo que tiene que funcionar sí o sí).
  2. Subir/pegar imágenes y extracción de texto de PDF.
  3. Canvas de dibujo — al final: es lo más complejo y lo que menos urge (se puede vivir sin
     dibujar por unas semanas; no se puede vivir sin que las notas persistan bien).

- **Picture-in-Picture del Pomodoro necesita un research-spike de medio día antes de ticketearse.**
  La Document Picture-in-Picture API real (ventana flotante con HTML/botones, no solo video) tiene
  soporte parejo solo en navegadores basados en Chromium y requiere gesto de usuario para abrirse.
  Sin este spike, un agente puede terminar implementando el hack viejo de PiP-de-`<video>`, que no
  sirve para mostrar un timer con controles interactivos. Definir de antemano: soporte mínimo de
  navegador aceptable, y fallback (¿ocultar el botón de PiP si el navegador no lo soporta?).

