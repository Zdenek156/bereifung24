/**
 * CO2 Calculator for Bereifung24
 * Berechnet CO2-Einsparungen durch vermiedene Fahrten zu Werkstätten
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Berechnet die Distanz zwischen zwei Koordinaten mit der Haversine-Formel
 * @param lat1 Breitengrad Punkt 1
 * @param lon1 Längengrad Punkt 1
 * @param lat2 Breitengrad Punkt 2
 * @param lon2 Längengrad Punkt 2
 * @returns Distanz in Kilometern
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Erdradius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Findet die N nächsten Werkstätten zum Kundenstandort
 */
export async function findNearestWorkshops(
  customerLat: number,
  customerLon: number,
  count: number
): Promise<Array<{ id: string; distance: number }>> {
  // Hole alle aktiven und verifizierten Werkstätten mit Koordinaten
  const workshops = await prisma.workshop.findMany({
    where: {
      user: {
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      isVerified: true,
    },
    select: {
      id: true,
      user: {
        select: {
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  // Berechne Distanz zu jeder Werkstatt
  const workshopsWithDistance = workshops
    .map((workshop) => ({
      id: workshop.id,
      distance: calculateDistance(
        customerLat,
        customerLon,
        workshop.user.latitude!,
        workshop.user.longitude!
      ),
    }))
    .sort((a, b) => a.distance - b.distance) // Sortiere nach Distanz
    .slice(0, count); // Nimm die N nächsten

  return workshopsWithDistance;
}

/**
 * Berechnet die gesamte vermiedene Fahrtstrecke (Hin und Zurück zu N Werkstätten)
 */
export async function calculateAvoidedDistance(
  customerLat: number,
  customerLon: number,
  workshopsToCompare: number
): Promise<number> {
  const nearestWorkshops = await findNearestWorkshops(
    customerLat,
    customerLon,
    workshopsToCompare
  );

  // Summe aller Distanzen × 2 (Hin und Zurück)
  const totalDistance = nearestWorkshops.reduce(
    (sum, workshop) => sum + workshop.distance * 2,
    0
  );

  return totalDistance;
}

interface CO2CalculationResult {
  savedCO2Grams: number;
  calculationMethod: 'STANDARD' | 'PERSONAL';
  distanceAvoided: number;
  fuelSaved?: number; // Liter oder kWh
  moneySaved?: number; // Euro
}

/**
 * Hauptfunktion: Berechnet CO2-Einsparung für eine Anfrage
 */
export async function calculateCO2Savings(
  customerLat: number,
  customerLon: number,
  vehicleId?: string
): Promise<CO2CalculationResult> {
  // Hole CO2-Einstellungen
  const settings = await prisma.cO2Settings.findFirst();
  if (!settings) {
    throw new Error('CO2 Settings nicht gefunden. Bitte Admin-Einstellungen konfigurieren.');
  }

  const { workshopsToCompare } = settings;

  // Berechne vermiedene Distanz
  const distanceAvoided = await calculateAvoidedDistance(
    customerLat,
    customerLon,
    workshopsToCompare
  );

  // Hole Fahrzeug-Daten wenn vorhanden
  let vehicle = null;
  if (vehicleId) {
    vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        fuelType: true,
        fuelConsumption: true,
        electricConsumption: true,
      },
    });
  }

  // Entscheide: Persönliche oder Standard-Berechnung
  const hasPersonalData =
    vehicle &&
    vehicle.fuelType !== 'UNKNOWN' &&
    ((vehicle.fuelType === 'ELECTRIC' && vehicle.electricConsumption) ||
      (vehicle.fuelType !== 'ELECTRIC' && vehicle.fuelConsumption));

  if (hasPersonalData && vehicle) {
    // PERSONAL: Präzise Berechnung mit Fahrzeugdaten
    return calculatePersonalCO2(vehicle, distanceAvoided, settings);
  } else {
    // STANDARD: Durchschnittswerte
    return calculateStandardCO2(distanceAvoided, settings);
  }
}

/**
 * Standard-Berechnung mit Durchschnittswerten
 */
function calculateStandardCO2(
  distanceKm: number,
  settings: any
): CO2CalculationResult {
  // Annahme: Durchschnitt aus Verbrenner und E-Autos
  const avgCO2PerKm = (settings.co2PerKmCombustion + settings.co2PerKmElectric) / 2;
  const savedCO2Grams = Math.round(distanceKm * avgCO2PerKm);

  return {
    savedCO2Grams,
    calculationMethod: 'STANDARD',
    distanceAvoided: distanceKm,
  };
}

/**
 * Persönliche Berechnung basierend auf Fahrzeugdaten
 */
function calculatePersonalCO2(
  vehicle: any,
  distanceKm: number,
  settings: any
): CO2CalculationResult {
  const { fuelType, fuelConsumption, electricConsumption } = vehicle;

  if (fuelType === 'ELECTRIC' && electricConsumption) {
    // E-Auto: kWh/100km → CO2
    const kWhUsed = (distanceKm / 100) * electricConsumption;
    const savedCO2Grams = Math.round(kWhUsed * settings.co2PerKWhElectric);
    const moneySaved = kWhUsed * settings.electricPricePerKWh;

    return {
      savedCO2Grams,
      calculationMethod: 'PERSONAL',
      distanceAvoided: distanceKm,
      fuelSaved: kWhUsed,
      moneySaved: Math.round(moneySaved * 100) / 100,
    };
  } else if (fuelConsumption) {
    // Verbrenner: L/100km → CO2
    const litersUsed = (distanceKm / 100) * fuelConsumption;
    
    // Kraftstoffspezifischer CO2-Faktor
    let co2PerLiter: number;
    let pricePerLiter: number;
    
    switch (fuelType) {
      case 'PETROL':
        co2PerLiter = settings.co2PerLiterPetrol || settings.co2PerLiterFuel;
        pricePerLiter = settings.petrolPricePerLiter || settings.fuelPricePerLiter;
        break;
      case 'DIESEL':
        co2PerLiter = settings.co2PerLiterDiesel || settings.co2PerLiterFuel;
        pricePerLiter = settings.dieselPricePerLiter || settings.fuelPricePerLiter;
        break;
      case 'LPG':
        co2PerLiter = settings.co2PerLiterLPG || settings.co2PerLiterFuel;
        pricePerLiter = settings.lpgPricePerLiter || settings.fuelPricePerLiter;
        break;
      case 'CNG':
        // CNG wird in kg gemessen
        co2PerLiter = settings.co2PerKgCNG || settings.co2PerLiterFuel;
        pricePerLiter = settings.cngPricePerKg || settings.fuelPricePerLiter;
        break;
      case 'HYBRID':
      case 'PLUGIN_HYBRID':
        // Hybrid: Verwende Benzin als Basis (konservativ)
        co2PerLiter = settings.co2PerLiterPetrol || settings.co2PerLiterFuel;
        pricePerLiter = settings.petrolPricePerLiter || settings.fuelPricePerLiter;
        break;
      default:
        // Fallback auf Legacy-Wert
        co2PerLiter = settings.co2PerLiterFuel;
        pricePerLiter = settings.fuelPricePerLiter;
    }
    
    const savedCO2Grams = Math.round(litersUsed * co2PerLiter);
    const moneySaved = litersUsed * pricePerLiter;

    return {
      savedCO2Grams,
      calculationMethod: 'PERSONAL',
      distanceAvoided: distanceKm,
      fuelSaved: litersUsed,
      moneySaved: Math.round(moneySaved * 100) / 100,
    };
  }

  // Fallback zu Standard
  return calculateStandardCO2(distanceKm, settings);
}

/**
 * Aggregiert CO2-Statistiken für einen Kunden
 */
export async function getCustomerCO2Stats(customerId: string) {
  const requests = await prisma.tireRequest.findMany({
    where: {
      customerId,
      savedCO2Grams: { not: null },
    },
    select: {
      savedCO2Grams: true,
      calculationMethod: true,
    },
  });

  const totalCO2SavedGrams = requests.reduce(
    (sum, req) => sum + (req.savedCO2Grams || 0),
    0
  );

  const totalCO2SavedKg = totalCO2SavedGrams / 1000;

  return {
    totalCO2SavedGrams,
    totalCO2SavedKg: Math.round(totalCO2SavedKg * 100) / 100,
    numberOfRequests: requests.length,
    comparisons: {
      equivalentCarKm: Math.round(totalCO2SavedGrams / 140), // 140g CO2/km Durchschnitt
      equivalentTrees: Math.round(totalCO2SavedKg / 20), // ~20kg CO2/Jahr pro Baum
      equivalentPhoneCharges: Math.round(totalCO2SavedGrams / 8), // ~8g CO2 pro Smartphone-Ladung
    },
  };
}
