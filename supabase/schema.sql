

-- Semesters table
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

-- Subjects table
create table subjects (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid references semesters not null,
  user_id uuid not null,
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

-- Grade zones table
create table grade_zones (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects not null,
  user_id uuid not null,
  nombre text not null,
  peso_pts numeric not null,
  ganada_pct numeric default 60
);
create index on grade_zones (subject_id);
create index on grade_zones (user_id);

-- Grade items table
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

-- Tasks table
create table tasks (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects,
  semester_id uuid references semesters not null,
  user_id uuid not null,
  titulo text not null,
  prioridad text,
  due date,
  done boolean default false,
  subtasks jsonb default '[]',
  attachments jsonb default '[]',
  reminder_at timestamptz,
  updated_at timestamptz default now()
);
create index on tasks (semester_id, done);
create index on tasks (user_id);

-- Notes table
create table notes (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects,
  user_id uuid not null,
  folder_id uuid,
  titulo text,
  contenido text,
  updated_at timestamptz default now()
);
create index on notes (subject_id);
create index on notes (user_id);

-- Folders table
create table folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  subject_id uuid references subjects,
  parent_id uuid references folders,
  nombre text not null
);
create index on folders (parent_id);
create index on folders (user_id);

-- Topics table
create table topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects not null,
  user_id uuid not null,
  parcial text,
  nombre text,
  subtemas jsonb default '[]',
  dificultad int,
  tiempo_dedicado_min int,
  fecha_examen date,
  comprension numeric default 0,
  visto boolean default false
);
create index on topics (subject_id);
create index on topics (user_id);

-- Flashcards table
create table flashcards (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects not null,
  user_id uuid not null,
  frente text,
  dorso text,
  estado text default 'nueva'
);
create index on flashcards (subject_id);
create index on flashcards (user_id);

-- Habits table
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  nombre text not null,
  frecuencia text not null, -- 'diario' | 'semanal'
  dias_semana int[], -- array de días [1-7] para frecuencia semanal (1=lunes, 7=domingo)
  racha int default 0,
  historial jsonb default '[]' -- array de fechas completadas ['2024-01-15', '2024-01-16', ...]
);
create index on habits (user_id);

-- Events table
create table events (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects,
  semester_id uuid references semesters not null,
  user_id uuid not null,
  nombre text not null,
  tipo text,
  start_at timestamptz not null,
  end_at timestamptz,
  descripcion text
);
create index on events (semester_id);
create index on events (user_id);

-- Triggers to populate user_id from parent (one-hop denormalization)
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

create or replace function set_user_id_from_folder() returns trigger as $$
begin
  if new.parent_id is not null then
    new.user_id := (select user_id from folders where id = new.parent_id);
  else
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Apply triggers
create trigger trg_subjects_user_id before insert on subjects
  for each row execute function set_user_id_from_semester();

create trigger trg_tasks_user_id before insert on tasks
  for each row execute function set_user_id_from_semester();

create trigger trg_events_user_id before insert on events
  for each row execute function set_user_id_from_semester();

create trigger trg_grade_zones_user_id before insert on grade_zones
  for each row execute function set_user_id_from_subject();

create trigger trg_notes_user_id before insert on notes
  for each row execute function set_user_id_from_subject();

create trigger trg_topics_user_id before insert on topics
  for each row execute function set_user_id_from_subject();

create trigger trg_flashcards_user_id before insert on flashcards
  for each row execute function set_user_id_from_subject();

create trigger trg_folders_user_id before insert on folders
  for each row execute function set_user_id_from_folder();

create trigger trg_grade_items_user_id before insert on grade_items
  for each row execute function set_user_id_from_zone();

-- RLS policies (simple equality, no joins)
alter table semesters enable row level security;
create policy "own rows" on semesters
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table subjects enable row level security;
create policy "own rows" on subjects
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table grade_zones enable row level security;
create policy "own rows" on grade_zones
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table grade_items enable row level security;
create policy "own rows" on grade_items
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table tasks enable row level security;
create policy "own rows" on tasks
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table notes enable row level security;
create policy "own rows" on notes
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table folders enable row level security;
create policy "own rows" on folders
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table topics enable row level security;
create policy "own rows" on topics
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table flashcards enable row level security;
create policy "own rows" on flashcards
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table habits enable row level security;
create policy "own rows" on habits
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table events enable row level security;
create policy "own rows" on events
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Note attachments table (images, drawings, PDFs)
create table note_attachments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid references notes not null,
  user_id uuid not null,
  tipo text not null, -- 'imagen' | 'dibujo' | 'pdf'
  nombre text not null,
  storage_path text not null, -- path en Supabase Storage: notes/{user_id}/{note_id}/{filename}
  metadata jsonb default '{}', -- info adicional (dimensiones, tamaño, etc)
  created_at timestamptz default now()
);
create index on note_attachments (note_id);
create index on note_attachments (user_id);

-- Trigger for note_attachments user_id (based on note_id hierarchy with auth.uid() fallback)
create or replace function set_user_id_from_note() returns trigger as $$
begin
  if new.note_id is not null then
    new.user_id := (select user_id from notes where id = new.note_id);
  else
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_note_attachments_user_id before insert on note_attachments
  for each row execute function set_user_id_from_note();

-- RLS for note_attachments
alter table note_attachments enable row level security;
create policy "own rows" on note_attachments
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage bucket for note attachments (private bucket with RLS)
-- Run this in Supabase dashboard or via SQL:
insert into storage.buckets (id, name, public)
values ('note-attachments', 'note-attachments', false)
on conflict (id) do nothing;

-- Storage RLS policies for note-attachments bucket
-- Allow users to upload to their own folder (notes/{user_id}/*)
-- Note: PostgreSQL arrays are 1-indexed, so [2] = userId for path "notes/{userId}/{noteId}/{filename}"
create policy "Users can upload to their own folder"
on storage.objects for insert
with check (
  bucket_id = 'note-attachments' and
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow users to read their own files
create policy "Users can read their own files"
on storage.objects for select
using (
  bucket_id = 'note-attachments' and
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow users to delete their own files
create policy "Users can delete their own files"
on storage.objects for delete
using (
  bucket_id = 'note-attachments' and
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Pomodoro sessions table (historial de sesiones completadas)
create table pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_min int not null, -- duración real en minutos
  tipo text not null, -- 'trabajo' | 'descanso_corto' | 'descanso_largo'
  task_id uuid references tasks, -- nullable, opcional
  subject_id uuid references subjects -- nullable, opcional
);
create index on pomodoro_sessions (user_id);
create index on pomodoro_sessions (started_at);

-- Trigger for pomodoro_sessions user_id (direct auth.uid(), no hierarchy dependency)
create or replace function set_user_id_from_pomodoro_session() returns trigger as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_pomodoro_sessions_user_id before insert on pomodoro_sessions
  for each row execute function set_user_id_from_pomodoro_session();

-- RLS for pomodoro_sessions
alter table pomodoro_sessions enable row level security;
create policy "own rows" on pomodoro_sessions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
