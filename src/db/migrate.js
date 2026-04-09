require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sql = `
  ALTER TABLE lifts RENAME COLUMN gross_kg TO weight_kg;
  ALTER TABLE lifts DROP COLUMN IF EXISTS net_kg;
`;

pool.query(sql)
  .then(() => {
    console.log('Migration complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration error:', err.message);
    process.exit(1);
  });