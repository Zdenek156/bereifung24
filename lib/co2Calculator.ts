/**
 * CO2 Calculator for Bereifung24
 * Berechnet CO2-Einsparungen durch vermiedene Fahrten zu Werkstätten
 * 
 * NEUE LOGIK (Stand: 30.12.2025):
 * - Fall 1 (Anfrage abgelaufen): Kunde hätte alle N nächsten Werkstätten besucht
 *   → kmSaved = (distance1 + distance2 + ... + distanceN) × 2
 * - Fall 2 (Angebot angenommen): (N-1) nächste + gewählte Werkstatt
 *   → kmSaved = (distance1 + distance2 + ... + gewählte) × 2
 *   → WICHTIG: Gewählte Werkstatt wird NICHT abgezogen!
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
  let workshopsUsed: number; // Anzahl der tatsächlich verwendeten Werkstätten

  if (acceptedOffer && acceptedOffer.distanceKm) {
    // FALL 2: Angebot angenommen
    // Finde die (N-1) nächsten Werkstätten (z.B. bei workshopsToCompare=3 → 2 nächste)
    const nearestCount = Math.max(1, workshopsToCompare - 1);
    const nearestWorkshops = findNearest(
      tireRequest.latitude,
      tireRequest.longitude,
      allWorkshops,
      nearestCount
    );

    // Finde die gewählte Werkstatt
    const chosenWorkshop = allWorkshops.find(ws => ws.id === acceptedOffer.workshopId);
    
    if (!chosenWorkshop) {
      throw new Error('Gewählte Werkstatt nicht gefunden');
    }

    // Kombiniere: (N-1) nächste + gewählte
    let workshops = [...nearestWorkshops];
    
    // Füge die gewählte Werkstatt hinzu (auch wenn sie bereits in nearestWorkshops ist)
    if (!nearestWorkshops.find(w => w.id === chosenWorkshop.id)) {
      workshops.push({
        id: chosenWorkshop.id,
        distance: acceptedOffer.distanceKm,
        latitude: chosenWorkshop.user.latitude,
        longitude: chosenWorkshop.user.longitude
      });
    }

    // Begrenze auf workshopsToCompare (falls gewählte weit weg ist)
    workshops = workshops.slice(0, workshopsToCompare);

    // Speichere die tatsächliche Anzahl
    workshopsUsed = workshops.length;

    // Berechne Ersparnis: Summe ALLER Werkstätten (inkl. gewählte!)
    const totalDistance = workshops.reduce((sum, w) => sum + w.distance, 0);
    distanceAvoided = totalDistance * 2;

  } else {
    // FALL 1: Anfrage abgelaufen (kein Angebot angenommen)
    // Finde die N nächsten Werkstätten
    const nearestN = findNearest(
      tireRequest.latitude,
      tireRequest.longitude,
      allWorkshops,
      workshopsToCompare
    );

    // Speichere die tatsächliche Anzahl
    workshopsUsed = nearestN.length;

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

  let result: CO2CalculationResult;
  if (hasPersonalData && vehicle) {
    result = calculatePersonalCO2(vehicle, distanceAvoided, settings);
  } else {
    result = calculateStandardCO2(distanceAvoided, settings);
  }

  // Save CO2 result to database
  await prisma.tireRequest.update({
    where: { id: tireRequestId },
    data: {
      savedCO2Grams: result.savedCO2Grams,
      workshopsNotified: workshopsUsed
    }
  });

  return result;
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
      workshopsNotified: true,
      latitude: true,
      longitude: true,
      offers: {
        select: {
          status: true,
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
  let totalTripsAvoided = 0; // Count actual workshops that made offers (max workshopsToCompare per request)

  for (const request of requests) {
    // Only count requests where CO2 has been calculated and saved
    // CO2 is saved when:
    // 1. Offer is accepted
    // 2. Request expires (neededByDate passed) - via CRON
    if (!request.savedCO2Grams) {
      // Skip requests without saved CO2 (not yet accepted or expired)
      continue;
    }

    totalCO2SavedGrams += request.savedCO2Grams;
    
    // Count workshops that received this request (and were used in CO2 calculation)
    // Use the saved workshopsNotified value if available, otherwise fall back to workshopsToCompare setting
    const workshopsForThisRequest = request.workshopsNotified ?? settings.workshopsToCompare;
    totalTripsAvoided += workshopsForThisRequest;
    
    // Calculate km saved from CO2 value (reverse calculation)
    // We stored CO2 grams based on: distanceKm × avgCO2PerKm
    // So: distanceKm = CO2grams / avgCO2PerKm
    let kmForThisRequest = 0;
    if (request.calculationMethod === 'PERSONAL' && request.vehicle?.fuelConsumption) {
      // Personal calculation: reverse engineer from CO2 and fuel consumption
      let co2PerLiter;
      switch (request.vehicle.fuelType) {
        case 'BENZIN': co2PerLiter = settings.co2PerLiterBenzin; break;
        case 'DIESEL': co2PerLiter = settings.co2PerLiterDiesel; break;
        case 'LPG': co2PerLiter = settings.co2PerLiterLPG; break;
        case 'CNG': co2PerLiter = settings.co2PerLiterCNG; break;
        default: co2PerLiter = settings.co2PerLiterBenzin;
      }
      // CO2 = (fuelConsumption/100) × km × co2PerLiter
      // km = CO2 / ((fuelConsumption/100) × co2PerLiter)
      kmForThisRequest = request.savedCO2Grams / ((request.vehicle.fuelConsumption / 100) * co2PerLiter);
    } else {
      // Standard calculation: CO2 = km × avgCO2PerKm
      const avgCO2PerKm = (settings.co2PerKmCombustion + settings.co2PerKmElectric) / 2;
      kmForThisRequest = request.savedCO2Grams / avgCO2PerKm;
    }
      
    totalKmSaved += kmForThisRequest;
      
      // Estimate fuel and money saved if we have vehicle data
      if (request.vehicle?.fuelConsumption && kmForThisRequest > 0) {
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
  }

  const totalCO2SavedKg = totalCO2SavedGrams / 1000;

  // Calculate fuel consumption stats - only for requests with saved CO2
  const requestsWithSavedCO2 = requests.filter(req => req.savedCO2Grams !== null);
  const requestsWithFuel = requestsWithSavedCO2.filter(req => req.vehicle?.fuelConsumption);
  const avgFuelConsumption = requestsWithFuel.length > 0
    ? requestsWithFuel.reduce((sum, req) => sum + (req.vehicle?.fuelConsumption || 0), 0) / requestsWithFuel.length
    : undefined;

  // Determine most common fuel type
  const fuelTypeCounts: Record<string, number> = {};
  requestsWithSavedCO2.forEach(req => {
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

  const avgDistance = totalKmSaved > 0 && requestsWithSavedCO2.length > 0
    ? (totalKmSaved / (requestsWithSavedCO2.length * 2 * settings.workshopsToCompare))
    : 0;

  return {
    totalCO2SavedGrams,
    totalCO2SavedKg: Math.round(totalCO2SavedKg * 100) / 100,
    numberOfRequests: requestsWithSavedCO2.length, // Only count requests with saved CO2
    totalMoneySaved: totalMoneySaved > 0 ? Math.round(totalMoneySaved * 100) / 100 : undefined,
    breakdown: {
      averageDistancePerWorkshop: Math.round(avgDistance * 10) / 10,
      workshopsCompared: settings.workshopsToCompare,
      totalTripsAvoided: totalTripsAvoided, // Actual number of workshops that made offers (max workshopsToCompare per request)
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
