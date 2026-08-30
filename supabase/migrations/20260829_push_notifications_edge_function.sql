-- Edge Function + Web Push support for task reminders and daily summaries
-- Idempotent migration: ensures the schema matches the MVP contract.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user_id
  on public.push_subscriptions (user_id);

create index if not exists idx_push_subscriptions_active
  on public.push_subscriptions (user_id, is_active);

alter table public.push_subscriptions enable row level security;

create policy if not exists "Users can read own push subscriptions"
  on public.push_subscriptions
  for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert own push subscriptions"
  on public.push_subscriptions
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update own push subscriptions"
  on public.push_subscriptions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Users can delete own push subscriptions"
  on public.push_subscriptions
  for delete
  using (auth.uid() = user_id);

alter table public.tasks
  add column if not exists last_push_notified_at timestamptz;

create index if not exists idx_tasks_last_push_notified_at
  on public.tasks (user_id, last_push_notified_at);

alter table public.profiles
  add column if not exists last_morning_summary_at timestamptz,
  add column if not exists last_evening_summary_at timestamptz;

create index if not exists idx_profiles_last_morning_summary_at
  on public.profiles (user_id, last_morning_summary_at);

create index if not exists idx_profiles_last_evening_summary_at
  on public.profiles (user_id, last_evening_summary_at);
