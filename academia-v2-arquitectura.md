# Academia v2 — Plan de Arquitectura y Ejecución

> Contexto: esta versión se construye completa (no un MVP recortado), pero por fases,
> y la implementación la van a llevar principalmente **agentes de código** (Claude Code u
> otro), no tú picando línea por línea. Por eso este documento está escrito para que
> sirva de *brief* que le puedes dar a un agente fase por fase.

## 0. Diagnóstico (por qué se rompió la v1)

- Empezó como 1 HTML, creció sin plan, se partió después → se perdió lógica en la separación.
- Doble backend (Supabase + Turso) con guardas de `updated_at` para no pisarse → fuente de bugs de sync.
- **Sincronización sin control de alcance**: se sincronizaba el estado completo en cada guardado/carga →
  superaste el egress mensual de Supabase y te bloquearon el proyecto un mes. Esto es un problema de
  *diseño de sync*, no mala suerte, y hay que resolverlo de raíz en v2 (ver sección 4).
- `window.State` global: cualquier módulo toca cualquier cosa, sin fronteras.
- Sin offline confiable, sin manejo de errores consistente, sin tests.
- Archivos gigantes (`notes.js` 168 KB, `academia-bundle.css` 111 KB) = imposible de mantener,
  y muy difícil de dar en pedazos manejables a un agente de código.
- Navegación hecha a mano (`goPage()`, lazy-load de partials) → otra pieza custom que mantener
  y que un agente puede reinterpretar distinto cada sesión.

**Objetivo de v2:** app completa y robusta, construida en fases pequeñas y bien delimitadas,
sobre un stack que un agente de código conoce a fondo (menos improvisación = menos deriva
arquitectónica entre sesiones).

## 1. Decisiones tomadas

| Decisión | Elegido | Por qué |
|---|---|---|
| Backend | **Supabase solamente** | Postgres relacional + Auth + RLS + Realtime + Storage en un solo lugar. Se acaba el doble sync. |
| Frontend | **React + Vite** | Componentes con fronteras reales (no partials copiados a mano), y es el stack que los agentes de código manejan con más consistencia. |
| Estado remoto/servidor | **TanStack Query** | Cachea por clave, no repite un fetch si los datos no "envejecieron", deduplica llamadas — resuelve tu bug de egress con configuración, no con código de sync escrito a mano. |
| Estado de UI (local) | **Zustand** | Solo para lo que de verdad no debe vivir en la URL ni en el servidor: modal abierto, sidebar colapsado, toasts. Nada que el usuario espere recuperar con refresh o back-button. |
| Semestre activo | **Route param, no Zustand** | `/s/:semesterId/tareas` en vez de un store global. Así un refresh o el botón "atrás" no pierden el semestre que estabas viendo, y la URL es compartible/bookmarkeable. |
| Ruteo | **React Router** | Reemplaza el `goPage()`/navigation stack hecho a mano de la v1. |
| Alcance | **Completa, no MVP recortado** | Se construye por fases, pero cada fase se hace bien (errores, loading, vacíos), no "a medias". |
| Offline | **Fase 5**, no día 1 | Offline bien hecho depende de un modelo de datos ya estable. |
| Multi-usuario | **Desde el modelo de datos** | Cada tabla con `user_id` + RLS desde el día 1, aunque hoy la uses solo tú. |
| Ejecución | **Agentes de código, por ticket** | Ver sección 6 — cómo delegar sin perder el control de la arquitectura. |

## 2. Arquitectura en capas

```
Páginas/Componentes (React — solo renderizan, usan hooks de features/)
        ↕
Feature Hooks (useTasks, useSubjects, useGrades — TanStack Query + Zustand donde aplique)
        ↕
API layer (features/*/api.js — funciones tipadas por tabla, columnas explícitas, sin lógica de UI)
        ↕
lib/supabase.js (único cliente Supabase)
```

**Reglas duras (no negociables, y que le tienes que exigir a cualquier agente):**
1. Ningún componente llama a Supabase directo ni importa `lib/supabase.js`. Siempre pasa por un hook de `features/<dominio>/`.
2. Los datos que vienen de Supabase viven en TanStack Query (`useQuery`/`useMutation`), nunca duplicados a mano en un `useState`.
3. Zustand es solo para estado que **no** viene del servidor y **no** debe vivir en la URL: modal abierto, sidebar colapsado, toasts. Si el dato vive en una tabla → TanStack Query. Si el usuario esperaría recuperarlo con refresh/back-button/compartir link (como el semestre activo) → route param, no Zustand.
4. Un componente = una responsabilidad visual. Si un archivo de componente pasa de ~200 líneas, se parte en subcomponentes.
5. La lógica de cálculo (ej. conversión %→puntos netos en calificaciones) vive en `domain/`, funciones puras sin React ni Supabase — testeable con Vitest sin montar nada.
6. **Ninguna query trae más columnas de las que la vista actual necesita.** (ver sección 4)

## 3. Estructura de carpetas

```
academia-v2/
├── index.html
├── vite.config.js
├── src/
│   ├── main.tsx                     # bootstrap: QueryClientProvider + Router + Auth check
│   ├── lib/
│   │   ├── supabase.js              # único cliente Supabase (init + auth helpers)
│   │   ├── queryClient.js           # configuración de TanStack Query (staleTime, retry, etc.)
│   │   └── sound.js                 # utilidad transversal de sonidos (interacción, pomodoro,
│   │                                 # silenciar global) — un solo lugar, no repetido por feature
│   ├── domain/                      # lógica pura, sin React ni Supabase
│   │   ├── grades-calc.js           # tu lógica de %, puntos netos, faltante
│   │   └── schedule-calc.js
│   ├── features/                    # 1 carpeta por dominio
│   │   ├── semesters/
│   │   │   ├── api.js                # queries/mutations a Supabase (columnas explícitas)
│   │   │   ├── hooks.js              # useSemesters(), useActiveSemester(), etc.
│   │   │   └── components/
│   │   ├── subjects/
│   │   ├── tasks/
│   │   ├── notes/
│   │   ├── grades/
│   │   └── habits/
│   ├── layouts/
│   │   └── AppLayout.jsx            # barra superior + sidebar/nav — envuelve el <Outlet/> del
│   │                                 # router; NINGUNA página reimplementa su propia barra
│   ├── pages/                       # 1 archivo por ruta, compone features
│   │   ├── Overview.jsx             # /s/:semesterId
│   │   ├── Subjects.jsx             # /s/:semesterId/materias
│   │   ├── Tasks.jsx                # /s/:semesterId/tareas
│   │   └── Grades.jsx               # /s/:semesterId/calificaciones
│   ├── components/                  # UI genérica reutilizable (Modal, Card, Badge)
│   ├── stores/
│   │   └── ui.store.js              # Zustand: SOLO modal abierto, sidebar, toasts, mute global —
│   │                                 # nada que deba sobrevivir un refresh vía URL
│   └── styles/
└── supabase/
    └── schema.sql                    # tablas + RLS + índices
```

## 4. Sync egress-safe (para que NUNCA te vuelvan a bloquear el proyecto)

Con TanStack Query varias de estas reglas se logran **configurando**, no escribiendo sync a mano:

1. **Alcance por defecto = semestre activo, no todo el historial.**
   Las queries se hacen con `queryKey: ['tasks', semesterId]`; los semestres archivados solo se
   piden cuando el usuario entra a verlos (otra query, otro key, carga bajo demanda).

2. **`staleTime`/`gcTime` generosos por defecto.**
   En `queryClient.js` se configura un `staleTime` de varios minutos para datos que no cambian a cada
   rato (materias, zonas de calificación). TanStack Query no vuelve a pedir nada si no "envejeció" —
   esto solo, ya evita gran parte del problema de re-fetch constante que tenías.

3. **Columnas explícitas en cada `api.js`.**
   `supabase.from('tasks').select('id, titulo, due, done')` — nunca `select('*')`. Si una vista nueva
   necesita un campo, se agrega ahí explícitamente, no se "trae todo por si acaso".

4. **Mutaciones = updates puntuales, no reescritura del semestre completo.**
   Cada `useMutation` hace un `update ... where id = ...` sobre la fila exacta, y actualiza la caché
   de TanStack Query con `setQueryData` en vez de forzar un refetch completo.

5. **Realtime acotado, no polling.**
   Si se usa Supabase Realtime, el canal se filtra por `semester_id` del semestre activo, y el
   callback llama `queryClient.invalidateQueries` solo de esa clave — no un listener global.

6. **`refetchOnWindowFocus` desactivado por defecto**, activado solo donde de verdad haga falta
   (ej. tareas, que cambian seguido); para datos casi estáticos (materias, config de zonas) se deja
   siempre apagado.

7. **Imágenes/adjuntos**: comprimir antes de subir a Supabase Storage, límite de tamaño, cacheadas
   por el propio navegador vía URL (no se vuelven a pedir si no cambian).

8. **Paginación real** en listas largas (tareas, notas) con `useInfiniteQuery` en vez de traer todo.

9. **Alertas de uso**: activar el aviso de uso de Supabase (dashboard → Usage) para que notifique
   *antes* del límite, no después.

## 5. Esquema de datos (Supabase / Postgres)

**Decisión clave (por feedback de revisión):** `user_id` va denormalizado en **cada** tabla, no
resuelto vía cadena de FKs (`grade_items → grade_zones → subjects → semesters`). Con 3 joins
anidados en un `using()` de RLS, esa policy corre en *cada* select y es exactamente el tipo de bug
de performance/permisos que no ves hasta que ya tienes datos reales. Se puebla con un trigger que
copia el `user_id` del padre inmediato (un solo salto, porque el padre también lo tiene denormalizado),
así el cliente nunca puede falsificarlo.

```sql
create table semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  nombre text not null,
  activo boolean default true,
  promedio_objetivo numeric,
  nota_minima numeric,
  promedio_previo numeric,
  creditos_previos int,
  updated_at timestamptz default now()
);
create index on semesters (user_id, activo);

create table subjects (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid references semesters not null,
  user_id uuid not null,  -- denormalizado, poblado por trigger
  nombre text not null,
  codigo text,
  catedratico text,
  seccion text,
  creditos int,
  color text,
  icono text,
  horario jsonb,
  updated_at timestamptz default now()
);
create index on subjects (semester_id);
create index on subjects (user_id);

create table grade_zones (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects not null,
  user_id uuid not null,
  nombre text not null,
  peso_pts numeric not null
);
create index on grade_zones (subject_id);
create index on grade_zones (user_id);

create table grade_items (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid references grade_zones not null,
  user_id uuid not null,
  nombre text not null,
  porcentaje_ingresado numeric,
  puntos_netos numeric
);
create index on grade_items (zone_id);
create index on grade_items (user_id);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects,
  semester_id uuid references semesters not null,  -- para filtrar por semestre sin join
  user_id uuid not null,
  titulo text not null,
  prioridad text,
  due date,
  done boolean default false,
  subtasks jsonb default '[]',
  attachments jsonb default '[]',
  updated_at timestamptz default now()
);
create index on tasks (semester_id, done);
create index on tasks (user_id);

create table notes (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects not null,
  user_id uuid not null,
  titulo text,
  contenido text,
  updated_at timestamptz default now()
);
create index on notes (subject_id);
create index on notes (user_id);

create table topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects not null,
  user_id uuid not null,
  parcial text,
  nombre text,
  comprension numeric default 0,
  visto boolean default false
);
create index on topics (subject_id);
create index on topics (user_id);

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  nombre text,
  racha int default 0,
  historial jsonb default '[]'
);
create index on habits (user_id);
```

**Triggers para poblar `user_id` (un solo salto al padre inmediato):**
```sql
create or replace function set_user_id_from_semester() returns trigger as $$
begin
  new.user_id := (select user_id from semesters where id = new.semester_id);
  return new;
end;
$$ language plpgsql security definer;

create or replace function set_user_id_from_subject() returns trigger as $$
begin
  new.user_id := (select user_id from subjects where id = new.subject_id);
  return new;
end;
$$ language plpgsql security definer;

create or replace function set_user_id_from_zone() returns trigger as $$
begin
  new.user_id := (select user_id from grade_zones where id = new.zone_id);
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_subjects_user_id before insert on subjects
  for each row execute function set_user_id_from_semester();

create trigger trg_tasks_user_id before insert on tasks
  for each row execute function set_user_id_from_semester();

create trigger trg_grade_zones_user_id before insert on grade_zones
  for each row execute function set_user_id_from_subject();

create trigger trg_notes_user_id before insert on notes
  for each row execute function set_user_id_from_subject();

create trigger trg_topics_user_id before insert on topics
  for each row execute function set_user_id_from_subject();

create trigger trg_grade_items_user_id before insert on grade_items
  for each row execute function set_user_id_from_zone();
```

**RLS — ahora una sola igualdad, sin joins, la misma forma en las 8 tablas:**
```sql
alter table tasks enable row level security;
create policy "own rows" on tasks
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```
(Repetir exactamente esta forma — `using (auth.uid() = user_id) with check (auth.uid() = user_id)` —
en `semesters`, `subjects`, `grade_zones`, `grade_items`, `tasks`, `notes`, `topics`, `habits`.
Ninguna policy necesita un subquery.)

## 6. Cómo delegar esto a agentes de código sin perder la arquitectura

1. **Un ticket = un `feature/<dominio>` = una sesión del agente.** No le pidas "agrega notas y
   flashcards a la vez". Dale una fase completa de la sección 7 y nada más.
2. **Dale este documento completo como contexto** al inicio de cada sesión (o un `CLAUDE.md`/`AGENTS.md`
   en el repo que apunte aquí), para que no reinvente el patrón de capas cada vez.
3. **Exígele explícitamente las reglas duras de la sección 2**: "toda llamada a Supabase va en
   `features/<dominio>/api.js`, nunca en un componente", "usa TanStack Query para datos de servidor,
   Zustand solo para estado de UI", "columnas explícitas, nunca `select *`".
4. **Pide que actualice un `CHANGELOG.md`** al final de cada ticket: qué feature tocó, qué tablas,
   qué queryKeys usó. Así el siguiente ticket parte con contexto real, no adivinando.
5. **Revisa el diff enfocándote en 3 cosas**: que no haya `supabase.from()` fuera de un `api.js`, que
   no haya `select *`, y que ningún componente pase de ~200 líneas.
6. **Un ticket no se cierra sin probar el criterio de aceptación** (sección 7) en el navegador, con
   DevTools → Network abierto para confirmar que las queries traen solo lo esperado.

### 6.1 Guardrails automatizados (no dependas de revisarlo a mano cada vez)

Con múltiples sesiones de agente sin memoria entre sí, las reglas mecánicas las tiene que hacer
cumplir una máquina, no tu revisión manual. Estos 3 checks van en un script de pre-commit / CI:

```bash
#!/bin/bash
# scripts/check-architecture.sh
fail=0

# 1) Nada de supabase.from() fuera de un api.js
if grep -rn "supabase\.\(from\|rpc\)(" src --include="*.jsx" --include="*.js" \
    | grep -v "/api\.js:" ; then
  echo "❌ Llamada directa a Supabase fuera de un api.js"
  fail=1
fi

# 2) Nada de select('*')
if grep -rn "\.select(['\"]\*['\"])" src ; then
  echo "❌ select('*') encontrado — usa columnas explícitas"
  fail=1
fi

# 3) Ningún componente .jsx pasa de 200 líneas
for f in $(find src/features src/pages src/components -name "*.jsx" 2>/dev/null); do
  lines=$(wc -l < "$f")
  if [ "$lines" -gt 200 ]; then
    echo "❌ $f tiene $lines líneas (límite 200)"
    fail=1
  fi
done

exit $fail
```

Se engancha como pre-commit (`husky` + `lint-staged`, o un hook simple de git) y como paso de CI
(GitHub Actions) para que un PR no se pueda mergear si lo rompe — sin importar si lo escribió un
agente o tú.

## 7. Roadmap por fases (tickets ejecutables)

### Fase 0 — Cimientos
- Proyecto Vite + React, `lib/supabase.js`, `lib/queryClient.js`, `lib/sound.js`, `layouts/AppLayout.jsx`,
  Auth Google OAuth, React Router con la estructura de rutas anidadas `/s/:semesterId/*` desde el
  inicio (no se agrega después), `schema.sql` con las 8 tablas + triggers de `user_id` + RLS
  simplificada + índices de la sección 5.
- **Landing (`/`), Términos y Privacidad se sirven como HTML estático/pre-renderizado, fuera del
  bundle de React autenticado** — no dependen de que se monte la SPA ni de sesión (ver spec
  funcional, sección 0.5). Esto es la corrección de raíz al problema de indexación de la v1, así
  que se resuelve aquí, no se parcha después.
- **Modo invitado**: datos en almacenamiento local del navegador (no Supabase), con aviso visible de
  que no hay sync entre dispositivos, y camino de "crear cuenta" que sube esos datos a Supabase al
  autenticarse.
- **Aceptación:** login con Google funciona, se crea una fila de prueba en `semesters` vía una
  mutation y se lee de vuelta vía `useQuery`, el trigger puebla `user_id` correctamente en una tabla
  hija de prueba, RLS bloquea a un segundo usuario de prueba con una sola igualdad (sin joins), la
  landing responde con contenido real en el HTML inicial (verificable con `curl` sin JS), y el modo
  invitado permite usar la app sin login y sin llamadas a Supabase.

### Fase 1 — Núcleo académico
- `features/semesters`, `features/subjects`, `features/tasks` completos (api + hooks + components).
- Páginas: Resumen, Materias, Tareas, Mi Horario (usando `subjects.horario` jsonb).
- **Aceptación:** crear/editar/archivar semestre, crear materia con horario, crear tarea, marcarla
  hecha — todo persiste tras refrescar, y Network solo muestra las columnas usadas por cada query.

### Fase 2 — Calificaciones (la lógica que más te gusta, y la de mayor valor)
- Depende solo de `subjects` (Fase 1), así que va antes que Notes/Calendario para tener la feature
  de mayor valor funcionando pronto — importa si el proyecto pierde momentum a mitad de camino,
  que es un riesgo real con ejecución en sesiones de agente separadas.
- `features/grades` + `domain/grades-calc.js`: zonas configurables, conversión %→puntos netos,
  "cuánto falta para aprobar", suma total.
- **Aceptación:** replicar exactamente el comportamiento de la v1 (ingresas 55%, la zona vale 25 pts
  netos → muestra 13.75 pts obtenidos y cuánto falta), con tests de Vitest sobre `grades-calc.js`
  (función pura, sin React ni Supabase).

### Fase 3 — Contenido académico
- `features/notes` (editor + DOMPurify), calendario, `features/topics` (temas por parcial).
- **Aceptación:** notas por materia persisten y sanitizan HTML; calendario muestra tareas/eventos
  del mes visible sin pedir otros meses.

### Fase 4 — Extras
- `features/flashcards`, `features/habits`, pomodoro/cronómetro/temporizador (puede vivir 100% en
  Zustand/estado local, solo persistiendo el resumen de racha), perfil y personalización.
- **Aceptación:** cada feature funciona aislado; ninguno importa el `api.js` de otro dominio.

### Fase 5 — Offline + PWA
- Persister de TanStack Query para caché offline, cola de mutaciones pendientes, manifest + service
  worker (Vite PWA plugin).
- **Aceptación:** apagar la red, seguir viendo datos cacheados y encolar cambios; reconectar y ver
  que la cola se vacía sin duplicar ni perder datos.

## 8. Cómo evitar que se repita la historia

- Ningún archivo crece "porque ya estaba abierto" — si algo no es del dominio de ese `feature/`, va a su propia carpeta.
- Antes de una feature nueva: ¿qué `feature/` la maneja? ¿qué tabla la guarda? ¿qué columnas necesita
  realmente la UI? Si no hay respuesta clara, no se empieza a picar código (ni se le pide al agente que empiece).
- El `CHANGELOG.md` de la sección 6 es la memoria del proyecto entre sesiones de agente.
