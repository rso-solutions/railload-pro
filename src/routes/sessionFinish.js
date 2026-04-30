// Ingest router for /api/session/finish
// Accepts a finish payload with optional embedded lifts array.
// Inserts the session row and all lift rows in a single transaction.
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const {
    transaction_id,
    car_id,
    operator,
    total_kg,
    target_kg,
    lift_count,
    finished_at,
    lifts          // optional array: [{lift_number, weight_kg, timestamp}, ...]
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert the session row
    const sessionResult = await client.query(
      `INSERT INTO sessions
        (car_id, operator, total_kg, target_kg, lift_count, status, finished_at)
       VALUES ($1, $2, $3, $4, $5, 'completed', $6)
       RETURNING *`,
      [car_id, operator, total_kg, target_kg, lift_count, finished_at]
    );

    // 2. Insert lift rows if provided
    let liftsInserted = 0;
    if (Array.isArray(lifts) && lifts.length > 0) {
      for (const lift of lifts) {
        // Build a unique transaction_id for each lift so the existing UNIQUE
        // constraint on lifts.transaction_id is honored. Format: "<txn>-<n>".
        const liftTxnId = `${transaction_id}-${lift.lift_number}`;

        await client.query(
          `INSERT INTO lifts
            (transaction_id, car_id, operator, lift_number, weight_kg, captured_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (transaction_id) DO NOTHING`,
          [liftTxnId, car_id, operator, lift.lift_number, lift.weight_kg, lift.timestamp]
        );
        liftsInserted++;
      }
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      session: sessionResult.rows[0],
      lifts_inserted: liftsInserted
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[session/finish]', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
