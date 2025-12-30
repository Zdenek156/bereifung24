// Update workshopsNotified for existing TireRequests with CO2 data
// Sets workshopsNotified to 3 (the workshopsToCompare setting) for all existing records

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateWorkshopsNotified() {
  console.log('🔄 Updating workshopsNotified for existing TireRequests...');
  
  // Get CO2 settings
  const settings = await prisma.cO2Settings.findFirst();
  if (!settings) {
    console.error('❌ CO2 Settings not found');
    return;
  }
  
  console.log(`📋 Using workshopsToCompare = ${settings.workshopsToCompare}`);
  
  // Find all TireRequests with CO2 data but no workshopsNotified value
  const requests = await prisma.tireRequest.findMany({
    where: {
      savedCO2Grams: { not: null },
      workshopsNotified: null
    },
    select: {
      id: true
    }
  });
  
  console.log(`Found ${requests.length} requests to update`);
  
  let updated = 0;
  for (const request of requests) {
    try {
      await prisma.tireRequest.update({
        where: { id: request.id },
        data: { workshopsNotified: settings.workshopsToCompare }
      });
      updated++;
      console.log(`✅ Updated request ${request.id}`);
    } catch (error) {
      console.error(`❌ Failed to update ${request.id}:`, error.message);
    }
  }
  
  console.log(`\n✨ Done! Updated ${updated} of ${requests.length} requests`);
  
  await prisma.$disconnect();
}

updateWorkshopsNotified().catch(console.error);
