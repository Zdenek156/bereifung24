import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * CO₂-Analyse API für Admin/Mitarbeiter
 * Aggregierte Plattformstatistiken für das CO₂-Tracking Dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'B24_EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 1. TireRequests mit CO2-Daten
    const tireRequestStats: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(*) FILTER (WHERE "savedCO2Grams" IS NOT NULL) as calculated_count,
        COUNT(*) as total_count,
        COALESCE(SUM("savedCO2Grams"), 0) as total_co2_grams,
        COALESCE(AVG("savedCO2Grams") FILTER (WHERE "savedCO2Grams" IS NOT NULL), 0) as avg_co2_grams,
        COALESCE(AVG("workshopsNotified") FILTER (WHERE "workshopsNotified" IS NOT NULL), 0) as avg_workshops
      FROM tire_requests
    `);

    // 2. DirectBookings (COMPLETED/CONFIRMED/RESERVED)
    const bookingStats: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status IN ('COMPLETED', 'CONFIRMED', 'RESERVED')) as active_bookings
      FROM direct_bookings
    `);

    // 3. CO2 pro Monat (letzte 12 Monate) aus TireRequests
    const monthlyTrend: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        COUNT(*) FILTER (WHERE "savedCO2Grams" IS NOT NULL) as requests_with_co2,
        COALESCE(SUM("savedCO2Grams"), 0) as co2_grams
      FROM tire_requests
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `);

    // 4. DirectBookings pro Monat (letzte 12 Monate)
    const monthlyBookings: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        COUNT(*) as bookings
      FROM direct_bookings
      WHERE status IN ('COMPLETED', 'CONFIRMED', 'RESERVED')
        AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `);

    // 5. Fahrzeugverteilung nach Kraftstofftyp
    const fuelTypeDistribution: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        "fuelType",
        COUNT(*) as count
      FROM vehicles
      WHERE "fuelType" != 'UNKNOWN'
      GROUP BY "fuelType"
      ORDER BY count DESC
    `);

    // 6. CO₂ Settings
    const settings = await prisma.cO2Settings.findFirst();

    // 7. Berechnung plattformweiter CO₂-Einsparungen durch DirectBookings
    const AVG_WORKSHOP_DISTANCE_KM = 8;
    const FALLBACK_CO2_PER_KM = 150;
    const workshopsToCompare = settings?.workshopsToCompare ?? 3;
    
    const activeBookings = Number(bookingStats[0]?.active_bookings ?? 0);
    // Pro Buchung spart der Kunde (workshopsToCompare - 1) Fahrten (er muss nur 1x hin statt N Werkstätten besuchen)
    const tripsAvoided = activeBookings * (workshopsToCompare - 1);
    const kmSavedBookings = tripsAvoided * AVG_WORKSHOP_DISTANCE_KM * 2; // Hin + Rück
    const co2SavedBookingsGrams = kmSavedBookings * FALLBACK_CO2_PER_KM;

    // Gesamt CO₂ = TireRequest-CO₂ (exakt berechnet) + DirectBooking-CO₂ (Durchschnitt)
    const totalCO2FromRequests = Number(tireRequestStats[0]?.total_co2_grams ?? 0);
    const totalCO2Grams = totalCO2FromRequests + co2SavedBookingsGrams;
    const totalCO2Kg = totalCO2Grams / 1000;

    // Monetäre Einsparungen (basierend auf Durchschnittswerten)
    const avgFuelPer100km = 7.4;
    const totalKmSaved = kmSavedBookings + (Number(tireRequestStats[0]?.calculated_count ?? 0) * AVG_WORKSHOP_DISTANCE_KM * workshopsToCompare * 2);
    const fuelSavedLiters = (totalKmSaved * avgFuelPer100km) / 100;
    const avgFuelPrice = settings?.dieselPricePerLiter ?? 1.65;
    const moneySaved = fuelSavedLiters * avgFuelPrice;

    return NextResponse.json({
      overview: {
        totalCO2Kg: Math.round(totalCO2Kg * 100) / 100,
        totalCO2FromRequestsKg: Math.round(totalCO2FromRequests / 1000 * 100) / 100,
        totalCO2FromBookingsKg: Math.round(co2SavedBookingsGrams / 1000 * 100) / 100,
        totalKmSaved: Math.round(totalKmSaved),
        totalTripsAvoided: tripsAvoided + Number(tireRequestStats[0]?.calculated_count ?? 0),
        fuelSavedLiters: Math.round(fuelSavedLiters * 10) / 10,
        moneySaved: Math.round(moneySaved * 100) / 100,
      },
      comparisons: {
        equivalentTrees: Math.round(totalCO2Kg / 22 * 10) / 10, // 1 Baum = ~22 kg CO₂/Jahr
        equivalentCarKm: Math.round(totalCO2Grams / FALLBACK_CO2_PER_KM),
        equivalentFlights: Math.round(totalCO2Kg / 230 * 10) / 10, // Frankfurt-Mallorca ~230 kg
        equivalentPhoneCharges: Math.round(totalCO2Grams / 8),
      },
      counts: {
        tireRequestsTotal: Number(tireRequestStats[0]?.total_count ?? 0),
        tireRequestsWithCO2: Number(tireRequestStats[0]?.calculated_count ?? 0),
        avgCO2PerRequest: Math.round(Number(tireRequestStats[0]?.avg_co2_grams ?? 0)),
        directBookingsActive: activeBookings,
        directBookingsTotal: Number(bookingStats[0]?.total_bookings ?? 0),
      },
      monthlyTrend: monthlyTrend.map(m => ({
        month: m.month,
        co2Kg: Math.round(Number(m.co2_grams) / 1000 * 100) / 100,
        requests: Number(m.requests_with_co2),
      })),
      monthlyBookings: monthlyBookings.map(m => ({
        month: m.month,
        bookings: Number(m.bookings),
      })),
      fuelTypeDistribution: fuelTypeDistribution.map(f => ({
        fuelType: f.fuelType,
        count: Number(f.count),
      })),
    });
  } catch (error) {
    console.error('Error fetching CO2 analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
