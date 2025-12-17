-- Add mount_on_motorcycle column to tire_requests table
-- This field indicates if customer wants full motorcycle service (true) or just wheels/rims (false, default)

ALTER TABLE tire_requests 
ADD COLUMN IF NOT EXISTS mount_on_motorcycle BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN tire_requests.mount_on_motorcycle IS 'For motorcycle tire requests: true = mount on whole motorcycle, false = wheels only (default)';
