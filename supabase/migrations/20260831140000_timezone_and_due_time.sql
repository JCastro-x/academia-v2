-- Migration: timezone por usuario + hora exacta de vencimiento por tarea
--
-- 1) profiles.timezone: IANA tz usada por notify-daily-summary para calcular
--    horas locales (resúmenes 7am/7pm, ventanas de recordatorio).
--    Default 'America/Guatemala' (UTC-6 fijo, sin DST) para usuarios existentes.
-- 2) tasks.due_time: hora exacta opcional de vencimiento. NULL = fin del día
--    (23:59:59 en el timezone del usuario), que es el comportamiento previo.

alter table profiles
  add column if not exists timezone text default 'America/Guatemala';

alter table tasks
  add column if not exists due_time time;
