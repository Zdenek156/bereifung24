// Correct workshopsNotified based on actual offers received
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function correctWorkshopsNotified() {
  console.log('🔄 Correcting workshopsNotified based on actual workshop count...');
  
  // Get CO2 settings for fallback
  const settings = await prisma.cO2Settings.findFirst();
  if (!settings) {
    console.error('❌ CO2 Settings not found');
    return;
  }
  
  // Find all TireRequests with CO2 data
  const requests = await prisma.tireRequest.findMany({
    where: {
      savedCO2Grams: { not: null }
    },
    select: {
      id: true,
      workshopsNotified: true,
      offers: {
        select: {
          workshopId: true
        }
      }
    }
  });
  
  console.log(`Found ${requests.length} requests with CO2 data`);
  
  let updated = 0;
  for (const request of requests) {
    // Count unique workshops that made offers
    const uniqueWorkshops = new Set(request.offers.map(o => o.workshopId));
    const actualCount = uniqueWorkshops.size;
    
    // Use actual count if > 0, otherwise fall back to workshopsToCompare
    const correctCount = actualCount > 0 ? actualCount : settings.workshopsToCompare;
    
    if (request.workshopsNotified !== correctCount) {
      try {
        await prisma.tireRequest.update({
          where: { id: request.id },
          data: { workshopsNotified: correctCount }
        });
        console.log(`✅ Updated request ${request.id}: ${request.workshopsNotified || 'null'} → ${correctCount} (${actualCount} offers)`);
        updated++;
      } catch (error) {
        console.error(`❌ Failed to update ${request.id}:`, error.message);
      }
    } else {
      console.log(`✓ Request ${request.id}: Already correct (${correctCount})`);
    }
  }
  
  console.log(`\n✨ Done! Updated ${updated} of ${requests.length} requests`);
  
  // Show summary
  const summary = await prisma.tireRequest.groupBy({
    by: ['workshopsNotified'],
    where: {
      savedCO2Grams: { not: null }
    },
    _count: true
  });
  
  console.log('\n📊 Summary:');
  summary.forEach(s => {
    console.log(`  ${s.workshopsNotified} Werkstätten: ${s._count} Anfragen`);
  });
  
  const totalTrips = summary.reduce((sum, s) => sum + (s.workshopsNotified * s._count), 0);
  console.log(`\n🚗 Total vermiedene Fahrten: ${totalTrips}`);
  
  await prisma.$disconnect();
}

correctWorkshopsNotified().catch(console.error);
