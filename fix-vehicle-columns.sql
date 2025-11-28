-- Füge fehlende Spalten zur vehicles-Tabelle hinzu
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS "vehicleType" TEXT NOT NULL DEFAULT 'CAR';

ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS "vin" TEXT;

ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS "nextInspectionDate" TIMESTAMP(3);

ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS "inspectionReminder" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS "inspectionReminderDays" INTEGER DEFAULT 30;

-- Erstelle UNIQUE constraint für vin (falls noch nicht vorhanden)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_vin_key'
    ) THEN
        ALTER TABLE vehicles ADD CONSTRAINT "vehicles_vin_key" UNIQUE ("vin");
    END IF;
END $$;

-- Zeige die Struktur der Tabelle
\d vehicles;
