// Recalculate CO2 for all accepted offers with correct workshop distances
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Haversine distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => deg * (Math.PI / 180);
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findNearest(lat, lon, workshops, count) {
  const withDistances = workshops.map(ws => ({
    ...ws,
    distance: calculateDistance(lat, lon, ws.user.latitude, ws.user.longitude)
  }));
  
  return withDistances
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}

async function recalculateAllCO2() {
  console.log('🔄 Recalculating CO2 for all accepted offers...\n');
  
  const settings = await prisma.cO2Settings.findFirst();
  if (!settings) {
    console.error('❌ CO2 Settings not found');
    return;
  }
  
  console.log(`📋 Using workshopsToCompare = ${settings.workshopsToCompare}`);
  console.log(`📋 avgCO2PerKm = ${(settings.co2PerKmCombustion + settings.co2PerKmElectric) / 2}g\n`);
  
  // Get all workshops
  const allWorkshops = await prisma.workshop.findMany({
    where: {
      user: {
        isActive: true,
        latitude: { not: null },
        longitude: { not: null }
      },
      isVerified: true
    },
    select: {
      id: true,
      user: {
        select: {
          latitude: true,
          longitude: true
        }
      }
    }
  });
  
  console.log(`Found ${allWorkshops.length} active workshops\n`);
  
  // Get all requests with accepted offers
  const requests = await prisma.tireRequest.findMany({
    where: {
      offers: {
        some: {
          status: 'ACCEPTED'
        }
      }
    },
    include: {
      offers: {
        where: { status: 'ACCEPTED' },
        include: {
          workshop: {
            include: {
              user: true
            }
          }
        }
      },
      customer: {
        include: {
          vehicles: true
        }
      }
    }
  });
  
  console.log(`Found ${requests.length} requests with accepted offers\n`);
  
  let updated = 0;
  let failed = 0;
  
  for (const request of requests) {
    if (!request.latitude || !request.longitude) {
      console.log(`❌ Request ${request.id}: Missing customer location`);
      failed++;
      continue;
    }
    
    const acceptedOffer = request.offers[0];
    
    // FALL 2: Find (N-1) nearest + chosen workshop
    const nearestCount = Math.max(1, settings.workshopsToCompare - 1);
    const nearestWorkshops = findNearest(
      request.latitude,
      request.longitude,
      allWorkshops,
      nearestCount
    );
    
    const chosenWorkshop = allWorkshops.find(ws => ws.id === acceptedOffer.workshopId);
    if (!chosenWorkshop) {
      console.log(`❌ Request ${request.id}: Chosen workshop not found`);
      failed++;
      continue;
    }
    
    // Calculate distance to chosen workshop
    const chosenDistance = calculateDistance(
      request.latitude,
      request.longitude,
      chosenWorkshop.user.latitude,
      chosenWorkshop.user.longitude
    );
    
    // Combine workshops
    let workshops = [...nearestWorkshops];
    if (!nearestWorkshops.find(w => w.id === chosenWorkshop.id)) {
      workshops.push({
        id: chosenWorkshop.id,
        distance: chosenDistance,
        latitude: chosenWorkshop.user.latitude,
        longitude: chosenWorkshop.user.longitude
      });
    }
    
    workshops = workshops.slice(0, settings.workshopsToCompare);
    const workshopsUsed = workshops.length;
    
    // Calculate total distance (ALL workshops including chosen)
    const totalDistance = workshops.reduce((sum, w) => sum + w.distance, 0);
    const distanceAvoided = totalDistance * 2; // Round trip
    
    // Calculate CO2
    const vehicle = request.customer?.vehicles?.[0];
    let savedCO2Grams;
    let calculationMethod = 'STANDARD';
    let moneySaved = null;
    
    const hasPersonalData = vehicle && 
      vehicle.fuelType !== 'UNKNOWN' && 
      ((vehicle.fuelType === 'ELECTRIC' && vehicle.electricConsumption) ||
       (vehicle.fuelType !== 'ELECTRIC' && vehicle.fuelConsumption));
    
    if (hasPersonalData && vehicle) {
      // Personal calculation
      calculationMethod = 'PERSONAL';
      if (vehicle.fuelType === 'ELECTRIC') {
        const fuelSaved = (vehicle.electricConsumption / 100) * distanceAvoided;
        savedCO2Grams = Math.round(distanceAvoided * settings.co2PerKmElectric);
        moneySaved = Math.round(fuelSaved * settings.electricityPricePerKwh * 100) / 100;
      } else {
        const fuelSaved = (vehicle.fuelConsumption / 100) * distanceAvoided;
        let co2PerLiter;
        switch (vehicle.fuelType) {
          case 'BENZIN': co2PerLiter = settings.co2PerLiterBenzin; break;
          case 'DIESEL': co2PerLiter = settings.co2PerLiterDiesel; break;
          case 'LPG': co2PerLiter = settings.co2PerLiterLPG; break;
          case 'CNG': co2PerLiter = settings.co2PerLiterCNG; break;
          default: co2PerLiter = settings.co2PerLiterBenzin;
        }
        savedCO2Grams = Math.round(fuelSaved * co2PerLiter);
        
        let fuelPrice;
        switch (vehicle.fuelType) {
          case 'BENZIN': fuelPrice = settings.fuelPriceBenzin; break;
          case 'DIESEL': fuelPrice = settings.fuelPriceDiesel; break;
          case 'LPG': fuelPrice = settings.fuelPriceLPG; break;
          case 'CNG': fuelPrice = settings.fuelPriceCNG; break;
          default: fuelPrice = settings.fuelPriceBenzin;
        }
        moneySaved = Math.round(fuelSaved * fuelPrice * 100) / 100;
      }
    } else {
      // Standard calculation
      const avgCO2PerKm = (settings.co2PerKmCombustion + settings.co2PerKmElectric) / 2;
      savedCO2Grams = Math.round(distanceAvoided * avgCO2PerKm);
    }
    
    // Update database
    try {
      await prisma.tireRequest.update({
        where: { id: request.id },
        data: {
          savedCO2Grams,
          calculationMethod,
          workshopsNotified: workshopsUsed
        }
      });
      
      console.log(`✅ Request ${request.id}:`);
      console.log(`   Workshops: ${workshopsUsed} (distances: ${workshops.map(w => w.distance.toFixed(1)).join(', ')} km)`);
      console.log(`   Distance: ${distanceAvoided.toFixed(1)} km (round trip)`);
      console.log(`   CO2: ${savedCO2Grams}g (${calculationMethod})`);
      if (moneySaved) console.log(`   Money: €${moneySaved}`);
      console.log();
      
      updated++;
    } catch (error) {
      console.error(`❌ Failed to update ${request.id}:`, error.message);
      failed++;
    }
  }
  
  console.log(`\n✨ Done! Updated ${updated}, Failed ${failed}`);
  
  // Show summary
  const summary = await prisma.tireRequest.groupBy({
    by: ['workshopsNotified'],
    where: {
      savedCO2Grams: { not: null }
    },
    _count: true,
    _sum: {
      savedCO2Grams: true
    }
  });
  
  console.log('\n📊 Summary:');
  let totalTrips = 0;
  let totalCO2 = 0;
  summary.forEach(s => {
    console.log(`  ${s.workshopsNotified} Werkstätten: ${s._count} Anfragen, ${s._sum.savedCO2Grams}g CO2`);
    totalTrips += s.workshopsNotified * s._count;
    totalCO2 += s._sum.savedCO2Grams;
  });
  
  console.log(`\n🚗 Total vermiedene Fahrten: ${totalTrips}`);
  console.log(`🌱 Total CO2 gespart: ${(totalCO2 / 1000).toFixed(2)} kg`);
  
  await prisma.$disconnect();
}

recalculateAllCO2().catch(console.error);
