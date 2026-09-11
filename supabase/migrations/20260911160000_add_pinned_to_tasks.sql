-- Add pinned field to tasks table
alter table tasks add column pinned boolean default false;
