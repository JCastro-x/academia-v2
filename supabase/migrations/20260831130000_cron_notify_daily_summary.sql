-- Migration: schedule notify-daily-summary Edge Function with pg_cron + pg_net
-- (config.toml [functions.*] schedule is NOT a real Supabase feature — the
-- supported way is pg_cron calling the function over HTTPS via pg_net.)
--
-- Requires: pg_cron and pg_net extensions. On Supabase they are usually
-- available; the CREATE EXTENSION IF NOT EXISTS below is idempotent.
-- If your project cannot create them (they must be created via Dashboard in
-- some projects), run: Dashboard > Database > Extensions > enable pg_cron, pg_net.
--
-- Secrets are stored in Supabase Vault (project URL + service_role key),
-- NEVER hardcoded in this file. Fill them right after applying this migration:
--
--   select vault.create_secret(
--     'https://sxikksezgjavfhwosiyg.functions.supabase.co',
--     'functions_base_url'
--   );
--   select vault.create_secret(
--     '<TU_SERVICE_ROLE_KEY>',   -- Dashboard > Settings > API > service_role
--     'service_role_key'
--   );
--
-- The cron job reads them at runtime with vault.get_secret(...).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Re-create the job idempotently (cron.schedule replaces an existing job
-- only if we unschedule first; use the named variant to be safe).
do $$
declare
  v_job_name text := 'notify-daily-summary-every-10min';
begin
  -- Unschedule any previous version of the job
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = v_job_name;

  perform cron.schedule(
    v_job_name,
    '*/10 * * * *',
    $cron$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets
              where name = 'functions_base_url') || '/notify-daily-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets
                                        where name = 'service_role_key')
      ),
      body := jsonb_build_object('invoked_by', 'pg_cron'),
      timeout_milliseconds := 60000
    );
    $cron$
  );
end;
$$;

-- Verify afterwards:
--   select jobname, schedule, command from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 5;
