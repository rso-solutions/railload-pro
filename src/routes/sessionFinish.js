// Ingest router for /api/session/finish
// Accepts a finish payload with optional embedded lifts array.
// Inserts the session row and all lift rows in a single Postgres transaction.
//
// Timezone handling:
//   The iRite indicator sends finished_at and lift timestamps as wall-clock
//   strings in the format "MM/DD/YYYY HH:MI AM" with no timezone tag.
//   We convert them to UTC using the site's timezone (env var SITE_TIMEZONE,
//   default America/Edmonton) so Postgres stores the right moment in time
//   and the dashboard renders correctly regardless of the viewer's locale.
const express = require('express');
const router = express.Router();
const pool = require('../db');

const SITE_TZ = process.env.SITE_TIMEZONE || 'America/Edmonton';
const TS_FORMAT = 'MM/DD/YYYY HH12:MI AM';

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

    // 1. Insert the session row, parsing finished_at as site-local time
    //    and converting to UTC for storage.
    const sessionResult = await client.query(
      `INSERT INTO sessions
        (transaction_id, car_id, operator, total_kg, target_kg, lift_count,
         status, finished_at)
       VALUES (
         $1, $2, $3, $4, $5, $6, 'completed',
         to_timestamp($7, $8) AT TIME ZONE $9
       )
       RETURNING *`,
      [
        transaction_id, car_id, operator, total_kg, target_kg, lift_count,
        finished_at, TS_FORMAT, SITE_TZ
      ]
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
           VALUES (
             $1, $2, $3, $4, $5,
             to_timestamp($6, $7) AT TIME ZONE $8
           )
           ON CONFLICT (transaction_id) DO NOTHING`,
          [
            liftTxnId, car_id, operator, lift.lift_number, lift.weight_kg,
            lift.timestamp, TS_FORMAT, SITE_TZ
          ]
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
