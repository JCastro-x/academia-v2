

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
  subject_id uuid references subjects not null,
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
  nombre text,
  racha int default 0,
  historial jsonb default '[]'
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
  new.user_id := (select user_id from folders where id = new.parent_id);
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
  for each row when (new.parent_id is not null) execute function set_user_id_from_folder();

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
