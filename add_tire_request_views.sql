-- Add TireRequestView table to track which workshops have viewed which requests
CREATE TABLE IF NOT EXISTS "tire_request_views" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tire_request_id" TEXT NOT NULL,
  "workshop_id" TEXT NOT NULL,
  "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "tire_request_views_tire_request_id_fkey" FOREIGN KEY ("tire_request_id") 
    REFERENCES "tire_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "tire_request_views_workshop_id_fkey" FOREIGN KEY ("workshop_id") 
    REFERENCES "workshops" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "tire_request_views_tire_request_id_workshop_id_key" UNIQUE ("tire_request_id", "workshop_id")
);

-- Create index for faster queries
CREATE INDEX "tire_request_views_workshop_id_idx" ON "tire_request_views"("workshop_id");
CREATE INDEX "tire_request_views_tire_request_id_idx" ON "tire_request_views"("tire_request_id");
