# 🛠️ Flujo de trabajo con Devin — Academia Unificada

Este documento define cómo se le asignan tareas a Devin en este proyecto. Se usa en **cada tarea nueva**, y especialmente importante: se usa **al inicio de cada sesión nueva**, aunque sea continuación de trabajo previo.

---

## 0. Arranque de sesión (OBLIGATORIO, siempre, sin excepción)

Antes de leer o proponer cualquier plan, Devin debe ejecutar este checklist de contexto, en este orden:

1. **Leer `CHANGELOG.md` completo** (no solo la última entrada) — ahí vive el historial real de qué se implementó, qué se corrigió, y qué quedó pendiente. Si `CHANGELOG.md` menciona una corrección sobre una tarea anterior, esa corrección tiene prioridad sobre lo que diga el plan original de esa tarea.
2. **Leer `BLUEPRINT_ACADEMIA_UNIFICADA.md`** — decisiones de arquitectura vigentes.
3. **Leer `MAPEO_ARQUITECTURA_UNIFICADA.md`** — mapeo feature-por-feature detallado.
4. **Si la tarea asignada hace referencia a trabajo previo** (ej. "corrige X de la tarea anterior", "continúa con Y"), Devin debe verificar el estado REAL del repositorio y de la base de datos remota antes de asumir que el reporte de una sesión anterior es exacto — reportes de sesiones pasadas pueden estar incompletos o ser ambiguos. **Nunca asumas ni inventes qué pasó en una sesión anterior; si no es verificable en el código/DB/CHANGELOG, decláralo como "⚠️ NO DETERMINADO", no lo atribuyas a nadie.**

Solo después de este checklist, Devin procede con el flujo normal de plan → aprobación → código (sección 1 en adelante).

---

## 1. Regla de aprobación (OBLIGATORIA, precedente vigente desde 2026-08-26)

Un plan queda aprobado **únicamente** cuando la respuesta contiene literalmente la palabra **"aprobado"** o **"procede"**.

Instrucciones de seguimiento que dan detalle o correcciones sobre el plan (ej. "una vez corregido X, haz Y", "corrige esto y luego sigue") **NO constituyen aprobación** por sí solas, aunque describan pasos posteriores a la ejecución. Si no aparece la palabra explícita, el estado sigue siendo "plan pendiente de aprobación" — Devin debe pedir la confirmación explícita antes de tocar código o la base de datos remota, incluso si la instrucción da a entender que se espera que proceda.

Esta regla existe porque una ejecución sin aprobación explícita, aunque el resultado final sea correcto, rompe la trazabilidad del flujo plan→aprobación→código que este proyecto exige para cambios en base de datos remota.

## 2. Prompt de implementación (plan → aprobación → código)

<contexto>
Este proyecto es la evolución de `Academia v2`, guiada por `BLUEPRINT_ACADEMIA_UNIFICADA.md` y `MAPEO_ARQUITECTURA_UNIFICADA.md` en la raíz del repo. Antes de continuar, sigue el checklist de arranque de sesión (sección 0 de `docs/DEVIN_WORKFLOW.md`). No tomes decisiones de arquitectura por tu cuenta que contradigan esos documentos; si algo no está cubierto ahí, decláralo como pregunta abierta en tu plan, no lo asumas.
</contexto>

<regla_critica_de_flujo>
PROHIBIDO tocar código, instalar dependencias, correr migraciones o modificar cualquier archivo del repositorio en esta interacción hasta que yo dé aprobación explícita.

Tu única tarea ahora mismo es: leer el contexto necesario (incluyendo el arranque de sesión de la sección 0) y devolver un plan de implementación, en formato texto/markdown, para la siguiente tarea:

[PEGAR AQUÍ LA TAREA ESPECÍFICA]

El plan se revisa, se corrige si hace falta, y solo entonces se da aprobación explícita ("aprobado, procede" o similar). Sin esa aprobación explícita en un mensaje nuevo, Devin sigue sin tocar código, incluso si cree que el plan es obvio o correcto.
</regla_critica_de_flujo>

<que_debe_incluir_el_plan>
1. Entendimiento de la tarea: 2-3 líneas, en tus propias palabras.
2. Archivos que vas a crear o modificar: ruta exacta, y qué cambia en cada uno (específico, no genérico).
3. Cambios de schema/base de datos (si aplica): SQL exacto de la migración, no una descripción.
4. Dependencias nuevas (si aplica): nombre y versión exacta, y por qué es necesaria.
5. Riesgos o efectos secundarios: qué otras partes de la app podrían romperse.
6. Cómo lo vas a verificar: pruebas manuales/automatizadas concretas, incluyendo verificación contra la base de datos remota real cuando aplique (no solo `npm run build`).
7. Preguntas abiertas: cualquier ambigüedad del pedido o de los documentos de referencia.
</que_debe_incluir_el_plan>

<tras_la_aprobacion>
1. Implementa **exactamente** lo planeado y aprobado — incluyendo cualquier corrección hecha durante la revisión del plan, no la versión original si hubo cambios. Si descubres que necesitas desviarte, detente y avisa antes de seguir.
2. Corre las verificaciones declaradas en el punto 6, incluyendo verificación contra la base de datos remota real si el cambio la involucra (no dar por completada una migración sin confirmar que corrió contra Supabase, no solo que el archivo de migración local existe).
3. Actualiza `CHANGELOG.md` siguiendo el **formato de entrada** definido en la sección 2 de este documento.
4. Reporta: qué se implementó, qué verificaciones pasaron (con resultados reales de las queries/comandos, no solo "pasó"), y si quedó algo pendiente o alguna pregunta abierta sin resolver.
</tras_la_aprobacion>

<restricciones>
- No refactorices código que no forme parte de la tarea actual.
- No agregues features no pedidas "ya que estás ahí" — esto incluye trabajo de UI/fases futuras aunque parezca natural continuarlo en la misma sesión.
- Si una restricción explícita del plan aprobado ("no toques X", "no implementes Y todavía") se vuelve tentadora de romper porque "ya estás ahí" o "es más eficiente", **no la rompas** — repórtalo como sugerencia para una tarea aparte, no la ejecutes.
- Si detectas que la tarea pedida contradice algo ya definido en los documentos de referencia, dilo en el plan antes de proceder.
</restricciones>

---

## 3. Formato de entrada en `CHANGELOG.md`

Cada entrada debe incluir, en este orden, para que una sesión futura pueda reconstruir el estado real sin ambigüedad:

```markdown
## [Fecha] — [Nombre corto de la tarea]

**Tarea:** [una línea describiendo qué se pidió]

**Implementado:**
- [qué se hizo, archivo por archivo]

**Verificado:**
- [resultado REAL de cada verificación — ej. "SELECT column_name FROM information_schema.columns... → devolvió: tipo, total_units, work_days, log" — no solo "verificado ✅"]

**Estado de la base de datos remota:** [aplicado / NO aplicado — explícito, sin ambigüedad]

**Desviaciones del plan original:** [si hubo alguna corrección durante la revisión, o si algo del plan aprobado no se completó, decirlo aquí explícitamente]

**Pendiente / preguntas abiertas:** [si quedó algo sin resolver]
```

Este formato existe específicamente para que una sesión nueva de Devin, leyendo solo `CHANGELOG.md`, pueda saber con certeza:
- Qué se implementó de verdad (no solo qué se planeó).
- Si una migración corrió contra la DB remota o solo quedó como archivo local.
- Si hubo correcciones a mitad de camino que invalidan partes del plan original.