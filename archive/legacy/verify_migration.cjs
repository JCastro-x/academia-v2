const { Client } = require('pg');
require('dotenv').config();

async function verifyMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'semesters' AND column_name IN ('start_date', 'end_date')
      ORDER BY column_name
    `);

    console.log('Columns verified:');
    console.table(result.rows);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyMigration();
