const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/transaction
// Called by the 1280 on every weight capture
router.post('/transaction', async (req, res) => {
  const {
    transaction_id,
    car_id,
    operator,
    lift_number,
    gross_kg,
    net_kg,
    timestamp
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO lifts 
        (transaction_id, car_id, operator, lift_number, gross_kg, net_kg, captured_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (transaction_id) DO NOTHING
       RETURNING *`,
      [transaction_id, car_id, operator, lift_number, gross_kg, net_kg, timestamp]
    );
    res.json({ success: true, lift: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/session/finish
// Called by the 1280 when operator presses Finish Car
router.post('/session/finish', async (req, res) => {
  const { car_id, operator, total_kg, target_kg, max_kg, lift_count, finished_at } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO sessions
        (car_id, operator, total_kg, target_kg, max_kg, lift_count, status, finished_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7)
       RETURNING *`,
      [car_id, operator, total_kg, target_kg, max_kg, lift_count, finished_at]
    );
    res.json({ success: true, session: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sessions
// Web console — load all sessions
router.get('/sessions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM sessions ORDER BY finished_at DESC LIMIT 100`
    );
    res.json({ success: true, sessions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sessions/today
// Web console — today's sessions only
router.get('/sessions/today', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM sessions 
       WHERE finished_at >= CURRENT_DATE 
       ORDER BY finished_at DESC`
    );
    res.json({ success: true, sessions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/lifts/:car_id
// Web console — all lifts for a specific car
router.get('/lifts/:car_id', async (req, res) => {
  const { car_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM lifts WHERE car_id = $1 ORDER BY lift_number ASC`,
      [car_id]
    );
    res.json({ success: true, lifts: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;