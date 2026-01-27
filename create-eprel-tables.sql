-- CreateTable
CREATE TABLE IF NOT EXISTS "eprel_tires" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eprelId" TEXT UNIQUE,
    "supplierName" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "tyreDimension" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "aspectRatio" INTEGER NOT NULL,
    "diameter" INTEGER NOT NULL,
    "loadIndex" TEXT,
    "speedRating" TEXT,
    "tyreClass" TEXT,
    "has3PMSF" BOOLEAN NOT NULL DEFAULT false,
    "hasIceGrip" BOOLEAN NOT NULL DEFAULT false,
    "fuelEfficiencyClass" TEXT,
    "wetGripClass" TEXT,
    "externalRollingNoiseLevel" INTEGER,
    "externalRollingNoiseClass" TEXT,
    "additionalData" JSONB,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataVersion" TEXT
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "eprel_tires_width_aspectRatio_diameter_idx" ON "eprel_tires"("width", "aspectRatio", "diameter");
CREATE INDEX IF NOT EXISTS "eprel_tires_tyreDimension_idx" ON "eprel_tires"("tyreDimension");
CREATE INDEX IF NOT EXISTS "eprel_tires_supplierName_idx" ON "eprel_tires"("supplierName");
CREATE INDEX IF NOT EXISTS "eprel_tires_tyreClass_idx" ON "eprel_tires"("tyreClass");

-- CreateTable
CREATE TABLE IF NOT EXISTS "eprel_imports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "tiresImported" INTEGER NOT NULL DEFAULT 0,
    "tiresUpdated" INTEGER NOT NULL DEFAULT 0,
    "tiresDeleted" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "dataVersion" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3)
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "eprel_imports_startedAt_idx" ON "eprel_imports"("startedAt");
