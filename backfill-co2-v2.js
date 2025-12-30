const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Inline CO2 calculation (simplified version)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

function findNearestWorkshops(lat, lon, workshops, count) {
  return workshops
    .filter(w => w.latitude && w.longitude)
    .map(w => ({
      id: w.id,
      latitude: w.latitude,
      longitude: w.longitude,
      distance: calculateDistance(lat, lon, w.latitude, w.longitude)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}

async function calculateCO2ForRequest(tireRequestId) {
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

  if (!tireRequest) throw new Error('Anfrage nicht gefunden');
  if (!tireRequest.latitude || !tireRequest.longitude) throw new Error('Kundenstandort fehlt');

  const settings = await prisma.cO2Settings.findFirst();
  if (!settings) throw new Error('CO2 Settings nicht gefunden');

  const { workshopsToCompare, co2PerKmCombustion, co2PerKmElectric } = settings;

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

  const workshopsWithCoords = allWorkshops.map(w => ({
    id: w.id,
    latitude: w.user.latitude,
    longitude: w.user.longitude
  }));

  const acceptedOffer = tireRequest.offers[0];
  let distanceAvoided;

  if (acceptedOffer && acceptedOffer.distanceKm) {
    // FALL 2: Angebot angenommen
    const nearestCount = Math.max(1, workshopsToCompare - 1);
    const nearestWorkshops = findNearestWorkshops(
      tireRequest.latitude,
      tireRequest.longitude,
      workshopsWithCoords,
      nearestCount
    );

    const chosenWorkshop = workshopsWithCoords.find(ws => ws.id === acceptedOffer.workshopId);
    if (!chosenWorkshop) throw new Error('Gewählte Werkstatt nicht gefunden');

    let workshops = [...nearestWorkshops];
    
    // Füge die gewählte Werkstatt hinzu
    if (!nearestWorkshops.find(w => w.id === chosenWorkshop.id)) {
      workshops.push({
        id: chosenWorkshop.id,
        distance: acceptedOffer.distanceKm,
        latitude: chosenWorkshop.latitude,
        longitude: chosenWorkshop.longitude
      });
    }

    workshops = workshops.slice(0, workshopsToCompare);
    const totalDistance = workshops.reduce((sum, w) => sum + w.distance, 0);
    distanceAvoided = totalDistance * 2; // NEUE LOGIK: Gewählte wird NICHT abgezogen!
  } else {
    // FALL 1: Anfrage abgelaufen
    const nearestN = findNearestWorkshops(
      tireRequest.latitude,
      tireRequest.longitude,
      workshopsWithCoords,
      workshopsToCompare
    );

    const totalDistance = nearestN.reduce((sum, w) => sum + w.distance, 0);
    distanceAvoided = totalDistance * 2;
  }

  // Standard-Berechnung (average)
  const savedCO2Grams = Math.round(((co2PerKmCombustion + co2PerKmElectric) / 2) * distanceAvoided);

  // Save to database
  await prisma.tireRequest.update({
    where: { id: tireRequestId },
    data: {
      savedCO2Grams
    }
  });

  return { savedCO2Grams, distanceAvoided };
}

async function backfillCO2() {
  console.log('🔄 Recalculating CO2 for ALL accepted offers with NEW logic...\n');
  
  const acceptedOffers = await prisma.offer.findMany({
    where: { 
      status: 'ACCEPTED'
    },
    include: {
      tireRequest: {
        select: {
          id: true,
          status: true
        }
      }
    },
    orderBy: { acceptedAt: 'desc' }
  });
  
  console.log(`Found ${acceptedOffers.length} accepted offers without CO2 data\n`);
  
  let successful = 0;
  let failed = 0;
  
  for (const offer of acceptedOffers) {
    try {
      console.log(`Processing request ${offer.tireRequestId.substring(0, 8)}...`);
      const result = await calculateCO2ForRequest(offer.tireRequestId);
      console.log(`  ✅ Saved ${result.savedCO2Grams}g CO2, avoided ${result.distanceAvoided}km`);
      successful++;
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results:`);
  console.log(`  - Successful: ${successful}`);
  console.log(`  - Failed: ${failed}`);
  console.log(`  - Total: ${acceptedOffers.length}`);
  
  await prisma.$disconnect();
}

backfillCO2().catch(console.error);
