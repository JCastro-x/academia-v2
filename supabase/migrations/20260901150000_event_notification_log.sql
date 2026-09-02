-- Track each automatic event reminder independently.
-- The unique event/type pair prevents duplicate sends without suppressing
-- reminders that occur within the same 24-hour period.

alter table public.events
  drop column if exists last_push_notified_at;

drop index if exists public.idx_events_last_push_notified_at;

create table if not exists public.event_notification_log (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  reminder_type text not null,
  sent_at timestamptz not null default now(),
  constraint event_notification_log_type_check
    check (reminder_type in (
      'three_days_before',
      'day_before',
      'three_hours_before'
    )),
  constraint event_notification_log_event_type_unique
    unique (event_id, reminder_type)
);

create index if not exists idx_event_notification_log_event_id
  on public.event_notification_log (event_id);
