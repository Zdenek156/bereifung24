import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCO2ForRequest } from '@/lib/co2Calculator';

/**
 * CRON Endpoint: Berechnet CO2 für abgelaufene Anfragen
 * 
 * Wird täglich aufgerufen und berechnet CO2 für Anfragen, bei denen:
 * - neededByDate < heute
 * - status = 'OPEN' (keine Angebote angenommen)
 * - savedCO2Grams = null (noch nicht berechnet)
 */
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`🔄 Starting expired CO2 calculation job at ${new Date().toISOString()}`);

    // Finde alle abgelaufenen Anfragen ohne CO2-Berechnung
    const expiredRequests = await prisma.tireRequest.findMany({
      where: {
        neededByDate: {
          lt: today
        },
        status: 'OPEN',
        savedCO2Grams: null,
        latitude: { not: null },
        longitude: { not: null }
      },
      select: {
        id: true,
        neededByDate: true,
        customerId: true
      }
    });

    console.log(`📊 Found ${expiredRequests.length} expired requests without CO2 calculation`);

    let successCount = 0;
    let errorCount = 0;

    for (const request of expiredRequests) {
      try {
        console.log(`🌱 Calculating CO2 for expired request ${request.id} (needed by: ${request.neededByDate})`);
        await calculateCO2ForRequest(request.id);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to calculate CO2 for request ${request.id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ CO2 calculation completed: ${successCount} success, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      processed: expiredRequests.length,
      successful: successCount,
      errors: errorCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('CRON job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate expired CO2',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
