/**
 * CO2 Calculator for Bereifung24
 * Berechnet CO2-Einsparungen durch vermiedene Fahrten zu Werkstätten
 * 
 * NEUE LOGIK (Stand: 29.12.2025):
 * - Fall 1 (Anfrage abgelaufen): Kunde hätte alle 3 nächsten Werkstätten besucht
 *   → kmSaved = (distance1 + distance2 + distance3) × 2
 * - Fall 2 (Angebot angenommen): 2 nächste + gewählte Werkstatt
 *   → kmSaved = (Summe aller 3 - distanceGewählte) × 2
 */

import { PrismaClient } from '@prisma/client';
import { findNearestWorkshops as findNearest } from './distanceCalculator';

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
 * Berechnet die CO2-Einsparung für eine TireRequest
 * @param tireRequestId ID der Anfrage
 * @returns CO2-Berechnungsergebnis
 */
export async function calculateCO2ForRequest(
  tireRequestId: string
): Promise<CO2CalculationResult> {
  const tireRequest = await prisma.tireRequest.findUnique({
    where: { id: tireRequestId },
    include: {
      customer: {
        include: {
          vehicles: true
        }
      },
      offers: {
        where: {
          status: 'ACCEPTED'
        },
        include: {
          workshop: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });

  if (!tireRequest) {
    throw new Error('Anfrage nicht gefunden');
  }

  if (!tireRequest.latitude || !tireRequest.longitude) {
    throw new Error('Kundenstandort fehlt');
  }

  // Hole CO2-Einstellungen
  const settings = await prisma.cO2Settings.findFirst();
  if (!settings) {
    throw new Error('CO2 Settings nicht gefunden');
  }

  const { workshopsToCompare } = settings;

  // Hole alle verifizierten Werkstätten mit Koordinaten
  const allWorkshops = await prisma.workshop.findMany({
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

  const acceptedOffer = tireRequest.offers[0];
  let distanceAvoided: number;

  if (acceptedOffer && acceptedOffer.distanceKm) {
    // FALL 2: Angebot angenommen
    // Finde die 2 nächsten Werkstätten
    const nearest2 = findNearest(
      tireRequest.latitude,
      tireRequest.longitude,
      allWorkshops,
      2
    );

    // Finde die gewählte Werkstatt
    const chosenWorkshop = allWorkshops.find(ws => ws.id === acceptedOffer.workshopId);
    
    if (!chosenWorkshop) {
      throw new Error('Gewählte Werkstatt nicht gefunden');
    }

    // Kombiniere: 2 nächste + gewählte (unique)
    const workshopIds = new Set([
      ...nearest2.map(w => w.id),
      chosenWorkshop.id
    ]);

    // Wenn gewählte bereits in nearest2, nur 3 unique Werkstätten
    let workshops = [...nearest2];
    if (!nearest2.find(w => w.id === chosenWorkshop.id)) {
      workshops.push({
        id: chosenWorkshop.id,
        distance: acceptedOffer.distanceKm,
        latitude: chosenWorkshop.user.latitude,
        longitude: chosenWorkshop.user.longitude
      });
    }

    // Begrenze auf workshopsToCompare (normalerweise 3)
    workshops = workshops.slice(0, workshopsToCompare);

    // Berechne Ersparnis: Summe aller 3 - gewählte
    const totalDistance = workshops.reduce((sum, w) => sum + w.distance, 0);
    distanceAvoided = (totalDistance - acceptedOffer.distanceKm) * 2;

  } else {
    // FALL 1: Anfrage abgelaufen (kein Angebot angenommen)
    // Finde die N nächsten Werkstätten
    const nearestN = findNearest(
      tireRequest.latitude,
      tireRequest.longitude,
      allWorkshops,
      workshopsToCompare
    );

    // Summe aller Distanzen × 2 (Hin und Zurück)
    const totalDistance = nearestN.reduce((sum, w) => sum + w.distance, 0);
    distanceAvoided = totalDistance * 2;
  }

  // Hole Fahrzeug-Daten wenn vorhanden
  const vehicle = tireRequest.customer?.vehicles?.[0];

  // Entscheide: Persönliche oder Standard-Berechnung
  const hasPersonalData =
    vehicle &&
    vehicle.fuelType !== 'UNKNOWN' &&
    ((vehicle.fuelType === 'ELECTRIC' && vehicle.electricConsumption) ||
      (vehicle.fuelType !== 'ELECTRIC' && vehicle.fuelConsumption));

  if (hasPersonalData && vehicle) {
    return calculatePersonalCO2(vehicle, distanceAvoided, settings);
  } else {
    return calculateStandardCO2(distanceAvoided, settings);
  }
}

interface CO2CalculationResult {
  savedCO2Grams: number;
  calculationMethod: 'STANDARD' | 'PERSONAL';
  distanceAvoided: number;
  fuelSaved?: number; // Liter oder kWh
  moneySaved?: number; // Euro
}

/**
 * DEPRECATED: Alte Funktion - Wird nicht mehr verwendet
 * Nutze stattdessen: calculateCO2ForRequest()
 */
export async function calculateCO2Savings(
  customerLat: number,
  customerLon: number,
  vehicleId?: string
): Promise<CO2CalculationResult> {
  throw new Error('DEPRECATED: Use calculateCO2ForRequest() instead');
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
    },
    select: {
      id: true,
      savedCO2Grams: true,
      calculationMethod: true,
      latitude: true,
      longitude: true,
      offers: {
        where: {
          status: 'ACCEPTED'
        },
        select: {
          distanceKm: true,
          workshopId: true
        }
      },
      vehicle: {
        select: {
          fuelType: true,
          fuelConsumption: true,
        },
      },
    },
  });

  const settings = await prisma.cO2Settings.findFirst();
  if (!settings) {
    throw new Error('CO2 Settings nicht gefunden');
  }

  // Use saved CO2 values if available, otherwise calculate simple estimate
  let totalCO2SavedGrams = 0;
  let totalKmSaved = 0;
  let totalFuelSaved = 0;
  let totalMoneySaved = 0;

  for (const request of requests) {
    let kmForThisRequest = 0;
    
    // Estimate km saved based on offers
    if (request.latitude && request.longitude) {
      if (request.offers.length > 0 && request.offers[0].distanceKm) {
        // Has accepted offer with distance
        const acceptedDistance = request.offers[0].distanceKm;
        // Assume 2 other workshops at similar distance
        kmForThisRequest = acceptedDistance * 2 * (settings.workshopsToCompare - 1);
      } else {
        // No offer or no distance, use default estimate
        kmForThisRequest = 25 * 2 * settings.workshopsToCompare;
      }
      
      totalKmSaved += kmForThisRequest;
    }

    // Use already calculated CO2 if available, otherwise calculate now
    if (request.savedCO2Grams) {
      totalCO2SavedGrams += request.savedCO2Grams;
    } else if (kmForThisRequest > 0) {
      // Calculate CO2 on-the-fly if not saved
      if (request.vehicle?.fuelConsumption && request.vehicle?.fuelType) {
        // Personal calculation with vehicle data
        const result = calculatePersonalCO2(request.vehicle, kmForThisRequest, settings);
        totalCO2SavedGrams += result.savedCO2Grams;
        if (result.fuelSaved) totalFuelSaved += result.fuelSaved;
        if (result.moneySaved) totalMoneySaved += result.moneySaved;
      } else {
        // Standard calculation
        const result = calculateStandardCO2(kmForThisRequest, settings);
        totalCO2SavedGrams += result.savedCO2Grams;
      }
    }
    
    // Estimate fuel and money saved if we have vehicle data (only if not already calculated above)
    if (!request.savedCO2Grams && request.vehicle?.fuelConsumption && kmForThisRequest > 0) {
      // Already calculated above, skip
    } else if (request.savedCO2Grams && request.vehicle?.fuelConsumption && kmForThisRequest > 0) {
      // We have saved CO2 but need to estimate fuel/money
      const fuelUsed = (request.vehicle.fuelConsumption / 100) * kmForThisRequest;
      totalFuelSaved += fuelUsed;
      
      // Estimate money based on fuel type
      let pricePerUnit = settings.fuelPricePerLiter || 1.65;
      if (request.vehicle.fuelType === 'DIESEL') {
        pricePerUnit = settings.dieselPricePerLiter || settings.fuelPricePerLiter || 1.65;
      } else if (request.vehicle.fuelType === 'ELECTRIC') {
        pricePerUnit = settings.electricPricePerKWh || 0.35;
      }
      totalMoneySaved += fuelUsed * pricePerUnit;
    }
  }

  const totalCO2SavedKg = totalCO2SavedGrams / 1000;

  // Calculate fuel consumption stats
  const requestsWithFuel = requests.filter(req => req.vehicle?.fuelConsumption);
  const avgFuelConsumption = requestsWithFuel.length > 0
    ? requestsWithFuel.reduce((sum, req) => sum + (req.vehicle?.fuelConsumption || 0), 0) / requestsWithFuel.length
    : undefined;

  // Determine most common fuel type
  const fuelTypeCounts: Record<string, number> = {};
  requests.forEach(req => {
    if (req.vehicle?.fuelType && req.vehicle.fuelType !== 'UNKNOWN') {
      fuelTypeCounts[req.vehicle.fuelType] = (fuelTypeCounts[req.vehicle.fuelType] || 0) + 1;
    }
  });
  const mostCommonFuelType = Object.keys(fuelTypeCounts).length > 0
    ? Object.entries(fuelTypeCounts).sort((a, b) => b[1] - a[1])[0][0]
    : undefined;

  // Map fuel type to German
  const fuelTypeMap: Record<string, string> = {
    'PETROL': 'Benzin',
    'DIESEL': 'Diesel',
    'LPG': 'Autogas',
    'CNG': 'Erdgas',
    'ELECTRIC': 'Elektrisch',
    'HYBRID': 'Hybrid',
    'PLUGIN_HYBRID': 'Plug-in Hybrid',
  };

  const avgDistance = totalKmSaved > 0 && requests.length > 0
    ? (totalKmSaved / (requests.length * 2 * settings.workshopsToCompare))
    : 0;

  return {
    totalCO2SavedGrams,
    totalCO2SavedKg: Math.round(totalCO2SavedKg * 100) / 100,
    numberOfRequests: requests.length,
    totalMoneySaved: totalMoneySaved > 0 ? Math.round(totalMoneySaved * 100) / 100 : undefined,
    breakdown: {
      averageDistancePerWorkshop: Math.round(avgDistance * 10) / 10,
      workshopsCompared: settings.workshopsToCompare,
      totalKmSaved: Math.round(totalKmSaved * 10) / 10,
      averageFuelConsumption: avgFuelConsumption ? Math.round(avgFuelConsumption * 10) / 10 : undefined,
      fuelType: mostCommonFuelType ? fuelTypeMap[mostCommonFuelType] : undefined,
    },
    comparisons: {
      equivalentCarKm: Math.round(totalCO2SavedGrams / 140), // 140g CO2/km Durchschnitt
      equivalentTrees: Math.round(totalCO2SavedKg / 20), // ~20kg CO2/Jahr pro Baum
      equivalentPhoneCharges: Math.round(totalCO2SavedGrams / 8), // ~8g CO2 pro Smartphone-Ladung
    },
  };
}
