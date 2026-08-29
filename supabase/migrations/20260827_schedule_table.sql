-- Migration for schedule table view (hoja de cálculo semanal)
-- Replaces Schedule.jsx with weekly planning table
-- Tables: schedule_notes (manual notes per cell), schedule_flags (flags per week)

-- Tabla de notas manuales por celda (semana × materia)
create table schedule_notes (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid references semesters not null,
  subject_id uuid references subjects not null,
  user_id uuid not null,
  week_number int not null, -- 1 a totalWeeks
  note_text text,
  note_color text, -- paleta predefinida: red/orange/yellow/green/blue/purple/pink
  updated_at timestamptz default now(),
  unique (semester_id, subject_id, week_number) -- una nota por celda
);
create index on schedule_notes (semester_id);
create index on schedule_notes (subject_id);
create index on schedule_notes (user_id);

-- Trigger para user_id desde semester_id
create or replace function set_user_id_from_semester_schedule_notes() returns trigger as $$
begin
  new.user_id := (select user_id from semesters where id = new.semester_id);
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_schedule_notes_user_id before insert on schedule_notes
  for each row execute function set_user_id_from_semester_schedule_notes();

-- RLS policy (own rows)
alter table schedule_notes enable row level security;
create policy "own rows" on schedule_notes
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tabla de banderas por semana (independiente de materia)
create table schedule_flags (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid references semesters not null,
  user_id uuid not null,
  week_number int not null, -- 1 a totalWeeks
  flag_type text not null, -- 'red' | 'yellow' | 'green' | 'blue'
  updated_at timestamptz default now(),
  unique (semester_id, week_number) -- una bandera por semana
);
create index on schedule_flags (semester_id);
create index on schedule_flags (user_id);

-- Trigger para user_id desde semester_id
create or replace function set_user_id_from_semester_schedule_flags() returns trigger as $$
begin
  new.user_id := (select user_id from semesters where id = new.semester_id);
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_schedule_flags_user_id before insert on schedule_flags
  for each row execute function set_user_id_from_semester_schedule_flags();

-- RLS policy (own rows)
alter table schedule_flags enable row level security;
create policy "own rows" on schedule_flags
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
