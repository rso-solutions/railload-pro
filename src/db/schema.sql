CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  car_id VARCHAR(50) NOT NULL,
  operator VARCHAR(100),
  total_kg NUMERIC(10,2),
  target_kg NUMERIC(10,2),
  max_kg NUMERIC(10,2),
  lift_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'completed',
  finished_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lifts (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  car_id VARCHAR(50) NOT NULL,
  operator VARCHAR(100),
  lift_number INTEGER,
  weight_kg NUMERIC(10,2),
  captured_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lifts_car_id ON lifts(car_id);
CREATE INDEX IF NOT EXISTS idx_sessions_car_id ON sessions(car_id);
CREATE INDEX IF NOT EXISTS idx_sessions_finished_at ON sessions(finished_at);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions_auth (
  sid VARCHAR(255) PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_auth_expire ON sessions_auth(expire);
