-- Fix trigger set_user_id_from_subject to handle null subject_id
-- Problem: When creating a note in a folder without a subject (subject_id = null),
-- the trigger failed because the subquery couldn't handle null values,
-- violating the not null constraint on user_id.
-- Solution: Use auth.uid() as fallback when subject_id is null.

create or replace function set_user_id_from_subject() returns trigger as $$
begin
  if new.subject_id is not null then
    new.user_id := (select user_id from subjects where id = new.subject_id);
  else
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql security definer;
