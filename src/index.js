// Main entry point for the RailLoad Pro API server

// Import required packages
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./db');
require('dotenv').config();

// Import route handlers
const transactionRoutes = require('./routes/transactions');
const queryRoutes = require('./routes/queries');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow cross-origin requests and parse JSON request bodies
app.use(cors());
app.use(express.json());

// Set up session management using PostgreSQL as the session store
// Sessions are stored in the sessions_auth table we created
app.use(session({
  store: new pgSession({ pool, tableName: 'sessions_auth' }),
  secret: process.env.SESSION_SECRET || 'railload-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // Sessions expire after 24 hours
}));

function requireApiKey(req, res, next) {
  const provided = req.get('X-API-Key');
  if (!process.env.RAILLOAD_API_KEY || provided !== process.env.RAILLOAD_API_KEY) {
    return res.status(401).json({ success: false, error: 'Invalid API key' });
  }
  next();
}

// Ingest endpoints from the 1280 indicator — protected by API key, not session
app.use('/api', requireApiKey, transactionRoutes);

// Auth routes handle login, logout, and session checking
app.use('/auth', authRoutes);

// Admin routes handle user management — protected inside the router
app.use('/admin', adminRoutes);

// Middleware that checks if the user is logged in before serving any page
// Login page is exempt so users can actually reach it
function requireAuth(req, res, next) {
  if (req.path === '/login.html' || req.path === '/login') return next();
  if (!req.session || !req.session.user) {
    if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
      return res.redirect('/login.html');
    }
    return res.status(401).json({ authenticated: false });
  }
  next();
}

// Apply auth check then serve the public folder (dashboard and login page)
app.use(requireAuth);

// Read endpoints for the dashboard — protected by session auth
app.use('/api', queryRoutes);

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`RailLoad Pro API running on port ${PORT}`);
});