DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'hora_formato'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN hora_formato text NOT NULL DEFAULT '12h';
  END IF;
END $$;
