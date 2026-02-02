-- Create CustomerDocument table
CREATE TABLE IF NOT EXISTS customer_documents (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  name TEXT NOT NULL,
  filename TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for CustomerDocument
CREATE INDEX IF NOT EXISTS idx_customer_documents_customer_id ON customer_documents(customer_id);

-- Create CustomerReminder table
CREATE TABLE IF NOT EXISTS customer_reminders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  workshop_id TEXT NOT NULL,
  title TEXT NOT NULL,
  due_date TIMESTAMP NOT NULL,
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  CONSTRAINT fk_reminder_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create indexes for CustomerReminder
CREATE INDEX IF NOT EXISTS idx_customer_reminders_customer_id ON customer_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_reminders_workshop_id ON customer_reminders(workshop_id);
CREATE INDEX IF NOT EXISTS idx_customer_reminders_due_date ON customer_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_customer_reminders_completed ON customer_reminders(completed);
