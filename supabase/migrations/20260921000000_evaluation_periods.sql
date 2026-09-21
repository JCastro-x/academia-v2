-- Evaluation periods table (periodos de evaluación por materia)
create table evaluation_periods (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects not null,
  user_id uuid not null,
  nombre text not null, -- ej: "1er Parcial", "Segundo Parcial", "Final"
  fecha date, -- fecha opcional del periodo
  created_at timestamptz default now()
);
create index on evaluation_periods (subject_id);
create index on evaluation_periods (user_id);

-- Trigger for evaluation_periods user_id
create or replace function set_user_id_from_subject_for_periods() returns trigger as $$
begin
  new.user_id := (select user_id from subjects where id = new.subject_id);
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_evaluation_periods_user_id before insert on evaluation_periods
  for each row execute function set_user_id_from_subject_for_periods();

-- RLS for evaluation_periods
alter table evaluation_periods enable row level security;
create policy "own rows" on evaluation_periods
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
