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
  gross_kg NUMERIC(10,2),
  net_kg NUMERIC(10,2),
  captured_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lifts_car_id ON lifts(car_id);
CREATE INDEX IF NOT EXISTS idx_sessions_car_id ON sessions(car_id);
CREATE INDEX IF NOT EXISTS idx_sessions_finished_at ON sessions(finished_at);


