-- Add isActive column to eprel_tires table
-- This prevents duplicates and removes obsolete tires on import

-- Add column
ALTER TABLE eprel_tires 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS eprel_tires_is_active_idx ON eprel_tires(is_active);

-- Add comment
COMMENT ON COLUMN eprel_tires.is_active IS 'false = marked for deletion (not in latest EPREL import)';
