require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sql = fs.readFileSync('src/db/schema.sql', 'utf8');

pool.query(sql)
  .then(() => {
    console.log('Tables created successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error creating tables:', err.message);
    process.exit(1);
  });