-- Scheduled completion notifications for Pomodoro work and break phases.
create table if not exists public.pomodoro_pending_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  phase text not null check (phase in ('trabajo', 'descanso_corto', 'descanso_largo')),
  notification_type text not null default 'completion' check (notification_type = 'completion'),
  scheduled_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  sent_at timestamptz,
  unique (user_id, session_id, notification_type)
);

create index if not exists idx_pomodoro_pending_notifications_due
  on public.pomodoro_pending_notifications (status, scheduled_at);

create index if not exists idx_pomodoro_pending_notifications_user
  on public.pomodoro_pending_notifications (user_id, status);

alter table public.pomodoro_pending_notifications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pomodoro_pending_notifications'
      and policyname = 'Users can read own Pomodoro notifications'
  ) then
    create policy "Users can read own Pomodoro notifications"
      on public.pomodoro_pending_notifications
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pomodoro_pending_notifications'
      and policyname = 'Users can insert own Pomodoro notifications'
  ) then
    create policy "Users can insert own Pomodoro notifications"
      on public.pomodoro_pending_notifications
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pomodoro_pending_notifications'
      and policyname = 'Users can update own Pomodoro notifications'
  ) then
    create policy "Users can update own Pomodoro notifications"
      on public.pomodoro_pending_notifications
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pomodoro_pending_notifications'
      and policyname = 'Users can delete own Pomodoro notifications'
  ) then
    create policy "Users can delete own Pomodoro notifications"
      on public.pomodoro_pending_notifications
      for delete
      using (auth.uid() = user_id);
  end if;
end;
$$;
