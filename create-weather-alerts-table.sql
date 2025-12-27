-- CreateTable
CREATE TABLE "weather_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL UNIQUE,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "temperatureThreshold" INTEGER NOT NULL DEFAULT 7,
    "daysInAdvance" INTEGER NOT NULL DEFAULT 3,
    "showOnDashboard" BOOLEAN NOT NULL DEFAULT true,
    "lastAlertSeason" TEXT,
    "lastAlertDate" TIMESTAMP(3),
    "useCustomLocation" BOOLEAN NOT NULL DEFAULT false,
    "customZipCode" TEXT,
    "customCity" TEXT,
    "customLatitude" DOUBLE PRECISION,
    "customLongitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "weather_alerts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
