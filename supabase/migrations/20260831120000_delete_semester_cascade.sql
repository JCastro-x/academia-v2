-- Migration: atomic semester cascade delete (RPC)
-- Deletes a semester and ALL its dependent rows inside one transaction.
-- Returns the storage_path of the note_attachments that belonged to the semester,
-- so the CLIENT can delete those files from Storage (Postgres cannot touch Storage).
-- SECURITY DEFINER is required to bypass RLS for the cascade, but ownership is
-- validated first: only the owner of the semester (auth.uid() = semesters.user_id)
-- may execute the delete. Pattern matches the "own rows" RLS policies.

create or replace function public.delete_semester_cascade(p_semester_id uuid)
returns setof text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_path  text;
begin
  -- Ownership validation (same rule as the "own rows" RLS policies)
  select user_id into v_owner from semesters where id = p_semester_id;

  if v_owner is null then
    raise exception 'Semestre no encontrado: %', p_semester_id;
  end if;
  if v_owner <> auth.uid() then
    raise exception 'No autorizado: el semestre no pertenece al usuario actual';
  end if;

  -- 1) Collect attachment storage paths BEFORE deleting rows
  for v_path in
    select na.storage_path
    from note_attachments na
    join notes n on n.id = na.note_id
    join subjects s on s.id = n.subject_id
    where s.semester_id = p_semester_id
      and na.storage_path is not null
  loop
    return next v_path;
  end loop;

  -- 2) Cascade delete, children first (leaf -> root)
  delete from grade_items gi
    using grade_zones gz, subjects s
    where gi.zone_id = gz.id
      and gz.subject_id = s.id
      and s.semester_id = p_semester_id;

  delete from grade_zones gz
    using subjects s
    where gz.subject_id = s.id
      and s.semester_id = p_semester_id;

  delete from note_attachments na
    using notes n, subjects s
    where na.note_id = n.id
      and n.subject_id = s.id
      and s.semester_id = p_semester_id;

  delete from notes n
    using subjects s
    where n.subject_id = s.id
      and s.semester_id = p_semester_id;

  delete from folders f
    using subjects s
    where f.subject_id = s.id
      and s.semester_id = p_semester_id;

  delete from topics t
    using subjects s
    where t.subject_id = s.id
      and s.semester_id = p_semester_id;

  delete from pomodoro_sessions ps
    where ps.subject_id in (select id from subjects where semester_id = p_semester_id)
       or ps.task_id in (select id from tasks where semester_id = p_semester_id);

  delete from tasks tk
    where tk.semester_id = p_semester_id
       or tk.subject_id in (select id from subjects where semester_id = p_semester_id);

  delete from events e
    where e.semester_id = p_semester_id
       or e.subject_id in (select id from subjects where semester_id = p_semester_id);

  delete from schedule_notes sn
    where sn.semester_id = p_semester_id;

  delete from schedule_flags sf
    where sf.semester_id = p_semester_id;

  delete from subjects s
    where s.semester_id = p_semester_id;

  -- 3) Root last
  delete from semesters where id = p_semester_id;
end;
$$;

-- Only authenticated owners may call it; deny anon
revoke all on function public.delete_semester_cascade(uuid) from anon;
grant execute on function public.delete_semester_cascade(uuid) to authenticated;
