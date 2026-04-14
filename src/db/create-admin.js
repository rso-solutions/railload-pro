// Load environment variables from .env file
require('dotenv').config();

// Import bcrypt for password hashing and the database pool
const bcrypt = require('bcrypt');
const pool = require('../db');

async function createAdmin() {
  // Define the initial admin credentials
  // Change these before running in production
  const username = 'admin';
  const password = 'RailLoad2026!';
  const role = 'admin';

  // Hash the password with a salt rounds value of 10
  // Higher number = more secure but slower — 10 is the industry standard
  const hash = await bcrypt.hash(password, 10);

  try {
    // Insert the admin user — ON CONFLICT means it won't error if admin already exists
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO UPDATE SET password_hash = $2, role = $3
       RETURNING id, username, role`,
      [username, hash, role]
    );
    console.log('Admin user ready:', result.rows[0].username, '| Role:', result.rows[0].role);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();