const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/transaction', async (req, res) => {
  const {
    transaction_id,
    car_id,
    operator,
    lift_number,
    weight_kg,
    timestamp
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO lifts 
        (transaction_id, car_id, operator, lift_number, weight_kg, captured_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (transaction_id) DO NOTHING
       RETURNING *`,
      [transaction_id, car_id, operator, lift_number, weight_kg, timestamp]
    );
    res.json({ success: true, lift: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

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

router.get('/sessions', async (req, res) => {
  const { car_id, date_from, date_to } = req.query;
  let query = 'SELECT * FROM sessions WHERE 1=1';
  const params = [];

  if (car_id) {
    params.push('%' + car_id.toUpperCase() + '%');
    query += ` AND UPPER(car_id) LIKE $${params.length}`;
  }
  if (date_from) {
    params.push(date_from);
    query += ` AND finished_at >= $${params.length}`;
  }
  if (date_to) {
    params.push(date_to + ' 23:59:59');
    query += ` AND finished_at <= $${params.length}`;
  }

  query += ' ORDER BY finished_at DESC LIMIT 200';

  try {
    const result = await pool.query(query, params);
    res.json({ success: true, sessions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

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