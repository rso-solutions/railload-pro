// Ingest router for /api/transaction (single lift POST)
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const {
    transaction_id, car_id, operator, lift_number, weight_kg, timestamp
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

module.exports = router;