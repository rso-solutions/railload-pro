// Import the pg library which handles PostgreSQL connections
const { Pool } = require('pg');

// Load environment variables from .env file
require('dotenv').config();

// Create a connection pool — this keeps multiple database connections
// open and ready rather than opening a new one for every query
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render's PostgreSQL SSL connection
  }
});

// Export the pool so other files can use it with require('../db')
module.exports = pool;