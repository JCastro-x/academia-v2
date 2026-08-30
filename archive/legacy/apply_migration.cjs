const { Client } = require('pg');
require('dotenv').config();

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const migrationSQL = `
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
    `;

    await client.query(migrationSQL);
    console.log('Migration applied successfully');

    // Verify the columns were added
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'semesters' AND column_name IN ('start_date', 'end_date')
      ORDER BY column_name
    `);

    console.log('Columns verified:');
    console.table(result.rows);

  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
