-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('UNKNOWN', 'PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUGIN_HYBRID', 'LPG', 'CNG');

-- CreateTable
CREATE TABLE "co2_settings" (
    "id" TEXT NOT NULL,
    "workshopsToCompare" INTEGER NOT NULL DEFAULT 3,
    "co2PerKmCombustion" INTEGER NOT NULL DEFAULT 140,
    "co2PerKmElectric" INTEGER NOT NULL DEFAULT 50,
    "co2PerLiterFuel" INTEGER NOT NULL DEFAULT 2330,
    "co2PerKWhElectric" INTEGER NOT NULL DEFAULT 420,
    "fuelPricePerLiter" DOUBLE PRECISION NOT NULL DEFAULT 1.65,
    "dieselPricePerLiter" DOUBLE PRECISION NOT NULL DEFAULT 1.55,
    "electricPricePerKWh" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "co2_settings_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "tire_requests" ADD COLUMN "savedCO2Grams" INTEGER,
ADD COLUMN "calculationMethod" TEXT;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN "fuelType" "FuelType" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "fuelConsumption" DOUBLE PRECISION,
ADD COLUMN "electricConsumption" DOUBLE PRECISION;
