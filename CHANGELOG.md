# CHANGELOG

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
