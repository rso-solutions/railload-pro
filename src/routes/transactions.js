// Ingest routes — POSTs from the 1280 indicator via Teltonika
// Mounted under /api with API-key auth
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

module.exports = router;