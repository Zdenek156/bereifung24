import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * CO₂-Einsparungen durch Online-Buchungen
 * 
 * Logik: Pro Online-Buchung spart der Kunde 1 Fahrt zur Werkstatt
 * (die Informations-/Angebotsfahrt entfällt – Preise vergleichen & Termin buchen online).
 * 
 * Priorität: Echte Fahrzeugdaten des Kunden → Fallback auf Durchschnittswerte
 * 
 * Quellen (Fallback-Werte):
 * - Durchschnittliche Entfernung zur nächsten Kfz-Werkstatt in DE: ~8 km (ADAC, DAT-Report)
 * - Durchschnittlicher PKW-Verbrauch: 7,4 L/100km (KBA 2024)
 * - CO₂/km Durchschnitt PKW: ~150 g/km (KBA Neuzulassungen-Mix)
 * - Kraftstoffpreise: ADAC Tankreport 03/2026
 */

// ── Fallback-Durchschnittswerte (DE) ──
const AVG_WORKSHOP_DISTANCE_KM = 8;
const FALLBACK_FUEL_PER_100KM = 7.4;
const FALLBACK_CO2_PER_KM = 150; // g/km

// ── CO₂-Emissionen nach Kraftstofftyp (g CO₂ pro Liter, Quelle: UBA) ──
const CO2_PER_LITER: Record<string, number> = {
  PETROL: 2320,
  DIESEL: 2640,
  LPG: 1640,
  CNG: 2000,     // g CO₂ pro kg CNG
  HYBRID: 2320,  // Benzin-Basis, aber weniger Verbrauch
  PLUGIN_HYBRID: 2320,
};

// ── Typische Verbrauchswerte pro Kraftstoff wenn nicht hinterlegt (L/100km) ──
const DEFAULT_CONSUMPTION: Record<string, number> = {
  PETROL: 7.4,
  DIESEL: 6.1,
  ELECTRIC: 0,    // kein Kraftstoff
  HYBRID: 5.5,
  PLUGIN_HYBRID: 3.5,
  LPG: 9.8,
  CNG: 4.2,       // kg/100km
  UNKNOWN: 7.4,
};

// ── Elektroverbrauch → CO₂ (Quelle: UBA Strommix DE 2025: ~380 g/kWh) ──
const CO2_PER_KWH = 380; // g CO₂/kWh
const DEFAULT_ELECTRIC_PER_100KM = 18; // kWh/100km

// ── Kraftstoffpreise Stand 03/2026 (ADAC Tankreport) ──
const FUEL_PRICES: Record<string, number> = {
  PETROL: 1.72,
  DIESEL: 1.58,
  ELECTRIC: 0.36,  // €/kWh öff. Ladesäule Ø
  HYBRID: 1.72,
  PLUGIN_HYBRID: 1.72,
  LPG: 0.75,
  CNG: 1.15,       // €/kg
  UNKNOWN: 1.72,
};

/**
 * Berechnet CO₂/km und Verbrauch für ein Fahrzeug
 */
function getVehicleEmissions(vehicle: {
  fuelType: string;
  fuelConsumption: number | null;
  electricConsumption: number | null;
}): { co2PerKm: number; fuelPer100km: number; fuelPrice: number; fuelUnit: string; isElectric: boolean } {
  const type = vehicle.fuelType || 'UNKNOWN';

  // Rein elektrisch
  if (type === 'ELECTRIC') {
    const kwh100 = vehicle.electricConsumption || DEFAULT_ELECTRIC_PER_100KM;
    return {
      co2PerKm: (kwh100 / 100) * CO2_PER_KWH,
      fuelPer100km: kwh100,
      fuelPrice: FUEL_PRICES.ELECTRIC,
      fuelUnit: 'kWh',
      isElectric: true,
    };
  }

  // Plugin-Hybrid: ~50% elektrisch, 50% Verbrenner (vereinfacht)
  if (type === 'PLUGIN_HYBRID') {
    const fuel100 = vehicle.fuelConsumption || DEFAULT_CONSUMPTION.PLUGIN_HYBRID;
    const elec100 = vehicle.electricConsumption || 12; // kWh/100km PHEV-Anteil
    const co2Fuel = (fuel100 / 100) * (CO2_PER_LITER.PLUGIN_HYBRID || 2320);
    const co2Elec = (elec100 / 100) * CO2_PER_KWH;
    return {
      co2PerKm: (co2Fuel + co2Elec) / 2, // Mischberechnung
      fuelPer100km: fuel100,
      fuelPrice: FUEL_PRICES.PLUGIN_HYBRID,
      fuelUnit: 'L',
      isElectric: false,
    };
  }

  // Verbrenner / Hybrid / Gas
  const fuel100 = vehicle.fuelConsumption || DEFAULT_CONSUMPTION[type] || FALLBACK_FUEL_PER_100KM;
  const co2PerLiter = CO2_PER_LITER[type] || CO2_PER_LITER.PETROL;
  const co2PerKm = (fuel100 / 100) * co2PerLiter;

  return {
    co2PerKm,
    fuelPer100km: fuel100,
    fuelPrice: FUEL_PRICES[type] || FUEL_PRICES.PETROL,
    fuelUnit: type === 'CNG' ? 'kg' : 'L',
    isElectric: false,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const customerId = session.user.customerId;
    if (!customerId) {
      return NextResponse.json({ error: 'Kunden-ID nicht gefunden' }, { status: 400 });
    }

    // Fetch bookings count + customer vehicles in parallel
    const [directBookingCount, legacyBookingCount, vehicles] = await Promise.all([
      prisma.directBooking.count({
        where: {
          customerId,
          status: { in: ['COMPLETED', 'CONFIRMED', 'RESERVED'] }
        }
      }),
      prisma.tireRequest.count({
        where: {
          customerId,
          offers: { some: { status: 'ACCEPTED' } }
        }
      }),
      prisma.vehicle.findMany({
        where: { customerId, vehicleType: 'CAR' },
        select: {
          fuelType: true,
          fuelConsumption: true,
          electricConsumption: true,
        }
      })
    ]);

    const totalBookings = directBookingCount + legacyBookingCount;

    if (totalBookings === 0) {
      return NextResponse.json({
        totalCO2SavedKg: 0,
        numberOfRequests: 0,
        dataSource: 'none',
        breakdown: {
          totalKmSaved: 0,
          totalTripsAvoided: 0,
          avgDistanceKm: AVG_WORKSHOP_DISTANCE_KM,
          fuelSavedLiters: 0,
          moneySaved: 0,
          fuelUnit: 'L',
        },
        comparisons: {
          equivalentCarKm: 0,
          equivalentTrees: 0,
          equivalentPhoneCharges: 0,
        }
      });
    }

    // ── Calculate CO₂/km from vehicle data or use fallback ──
    let co2PerKm: number;
    let fuelPer100km: number;
    let fuelPrice: number;
    let fuelUnit = 'L';
    let dataSource: 'vehicle' | 'fallback';

    const carsWithFuel = vehicles.filter(v => v.fuelType && v.fuelType !== 'UNKNOWN');

    if (carsWithFuel.length > 0) {
      // Use weighted average of all customer vehicles
      const emissions = carsWithFuel.map(v => getVehicleEmissions(v));
      co2PerKm = emissions.reduce((sum, e) => sum + e.co2PerKm, 0) / emissions.length;
      fuelPer100km = emissions.reduce((sum, e) => sum + e.fuelPer100km, 0) / emissions.length;
      fuelPrice = emissions.reduce((sum, e) => sum + e.fuelPrice, 0) / emissions.length;
      // Use fuel unit of first car (most will be the same)
      fuelUnit = emissions[0].fuelUnit;
      // If all electric, adjust unit
      if (emissions.every(e => e.isElectric)) fuelUnit = 'kWh';
      dataSource = 'vehicle';
    } else {
      // Fallback: Deutschlandweite Durchschnittswerte
      co2PerKm = FALLBACK_CO2_PER_KM;
      fuelPer100km = FALLBACK_FUEL_PER_100KM;
      fuelPrice = FUEL_PRICES.PETROL;
      dataSource = 'fallback';
    }

    // ── Calculate savings ──
    const tripsAvoided = totalBookings;
    const kmPerTrip = AVG_WORKSHOP_DISTANCE_KM * 2; // Hin + Zurück
    const totalKmSaved = tripsAvoided * kmPerTrip;
    const totalCO2SavedGrams = totalKmSaved * co2PerKm;
    const totalCO2SavedKg = totalCO2SavedGrams / 1000;
    const fuelSaved = (totalKmSaved / 100) * fuelPer100km;
    const moneySaved = fuelSaved * fuelPrice;

    return NextResponse.json({
      totalCO2SavedKg: Math.round(totalCO2SavedKg * 100) / 100,
      numberOfRequests: totalBookings,
      dataSource,
      breakdown: {
        totalKmSaved: Math.round(totalKmSaved * 10) / 10,
        totalTripsAvoided: tripsAvoided,
        avgDistanceKm: AVG_WORKSHOP_DISTANCE_KM,
        fuelSavedLiters: Math.round(fuelSaved * 100) / 100,
        fuelPer100km: Math.round(fuelPer100km * 10) / 10,
        moneySaved: Math.round(moneySaved * 100) / 100,
        fuelUnit,
      },
      comparisons: {
        equivalentCarKm: Math.round(totalCO2SavedGrams / 140),
        equivalentTrees: Math.max(1, Math.round(totalCO2SavedKg / 22)),
        equivalentPhoneCharges: Math.round(totalCO2SavedGrams / 8),
      }
    });
  } catch (error) {
    console.error('Error fetching customer CO2 stats:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Statistiken' },
      { status: 500 }
    );
  }
}
