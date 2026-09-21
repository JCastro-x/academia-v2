-- Update topics table to use evaluation_period_id instead of parcial text
-- Add evaluation_period_id column
alter table topics add column evaluation_period_id uuid references evaluation_periods(id) on delete set null;

-- Add new columns for the enhanced topics functionality
alter table topics add column subtema text;
alter table topics add column descripcion text;
alter table topics add column created_at timestamptz default now();

-- Create index for performance
create index on topics (evaluation_period_id);

-- Migrate existing data: try to match by name (optional, since existing data might not match)
-- This is a best-effort migration - existing "parcial" text will be kept as backup
-- New topics should use evaluation_period_id

-- Note: We keep the old "parcial" column for now for backward compatibility
-- It can be removed later after data migration is complete
