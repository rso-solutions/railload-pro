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
  const { car_id, date_from, date_to, limit = 50, offset = 0 } = req.query;

  // Build the base query with optional filters
  let countQuery = 'SELECT COUNT(*) FROM sessions WHERE 1=1';
  let dataQuery = 'SELECT * FROM sessions WHERE 1=1';
  const params = [];

  if (car_id) {
    params.push('%' + car_id.toUpperCase() + '%');
    const clause = ` AND UPPER(car_id) LIKE $${params.length}`;
    countQuery += clause;
    dataQuery += clause;
  }
  if (date_from) {
    params.push(date_from);
    const clause = ` AND finished_at >= $${params.length}`;
    countQuery += clause;
    dataQuery += clause;
  }
  if (date_to) {
    params.push(date_to + ' 23:59:59');
    const clause = ` AND finished_at <= $${params.length}`;
    countQuery += clause;
    dataQuery += clause;
  }

  // Add ordering and pagination to the data query
  const limitVal = Math.min(parseInt(limit) || 50, 500);
  const offsetVal = parseInt(offset) || 0;
  params.push(limitVal);
  dataQuery += ` ORDER BY finished_at DESC LIMIT $${params.length}`;
  params.push(offsetVal);
  dataQuery += ` OFFSET $${params.length}`;

  try {
    // Run both queries — one for the data, one for the total count
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params.slice(0, params.length - 2)),
      pool.query(dataQuery, params)
    ]);
    res.json({
      success: true,
      sessions: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit: limitVal,
      offset: offsetVal
    });
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