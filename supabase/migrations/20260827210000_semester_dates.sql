-- Add start_date and end_date columns to semesters table
-- Migration for remote Supabase database

DO $$
BEGIN
  -- Add start_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'semesters' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE semesters ADD COLUMN start_date date;
  END IF;

  -- Add end_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'semesters' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE semesters ADD COLUMN end_date date;
  END IF;
END $$;
