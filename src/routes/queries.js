// Read routes — GETs for the dashboard
// Mounted under /api with session auth
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Timezone for "today" calculations. Override per deployment with env var.
const SITE_TZ = process.env.SITE_TIMEZONE || 'America/Edmonton';

router.get('/sessions', async (req, res) => {
  const { car_id, date_from, date_to, limit = 50, offset = 0 } = req.query;

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

  const limitVal = Math.min(parseInt(limit) || 50, 500);
  const offsetVal = parseInt(offset) || 0;
  params.push(limitVal);
  dataQuery += ` ORDER BY finished_at DESC LIMIT $${params.length}`;
  params.push(offsetVal);
  dataQuery += ` OFFSET $${params.length}`;

  try {
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

// "Today" means today in the site's local timezone — see SITE_TZ above.
// finished_at is a TIMESTAMP (no timezone). We convert it to the site's
// local time then compare to the current date in that timezone.
router.get('/sessions/today', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM sessions
       WHERE (finished_at AT TIME ZONE 'UTC' AT TIME ZONE $1)::date
             = (NOW() AT TIME ZONE $1)::date
       ORDER BY finished_at DESC`,
      [SITE_TZ]
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
