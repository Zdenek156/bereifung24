CREATE TABLE IF NOT EXISTS legal_texts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  target TEXT NOT NULL DEFAULT 'app',
  last_updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(key, target)
);
CREATE INDEX IF NOT EXISTS idx_legal_texts_key ON legal_texts(key);
