-- Create tire_request_notes table
CREATE TABLE IF NOT EXISTS tire_request_notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tire_request_id TEXT NOT NULL REFERENCES tire_requests(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  note TEXT NOT NULL,
  is_important BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tire_request_notes_tire_request_id ON tire_request_notes(tire_request_id);
CREATE INDEX IF NOT EXISTS idx_tire_request_notes_user_id ON tire_request_notes(user_id);

-- Output success
\echo 'Table tire_request_notes created successfully'
