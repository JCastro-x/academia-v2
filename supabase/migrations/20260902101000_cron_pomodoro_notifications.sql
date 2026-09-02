-- Independent one-minute dispatcher for Pomodoro completion notifications.
-- The existing task/event reminder cron remains at 10-minute frequency.
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  v_job_name text := 'notify-pomodoro-completions-every-minute';
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = v_job_name;

  perform cron.schedule(
    v_job_name,
    '* * * * *',
    $cron$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets
              where name = 'functions_base_url') || '/pomodoro-schedule',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets
                                        where name = 'service_role_key')
      ),
      body := jsonb_build_object('action', 'dispatch', 'invoked_by', 'pg_cron'),
      timeout_milliseconds := 60000
    );
    $cron$
  );
end;
$$;

-- Verify afterwards:
--   select jobname, schedule, command from cron.job
--   where jobname = 'notify-pomodoro-completions-every-minute';
