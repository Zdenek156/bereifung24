const { PrismaClient } = require('@prisma/client');
// Import from the built file in .next
const { w0: calculateCO2ForRequest } = require('./.next/server/chunks/7418.js');

const prisma = new PrismaClient();

async function backfillCO2() {
  console.log('🔄 Starting CO2 backfill for accepted offers...\n');
  
  // Find all accepted offers without CO2 data
  const acceptedOffers = await prisma.offer.findMany({
    where: { 
      status: 'ACCEPTED',
      tireRequest: {
        savedCO2Grams: null
      }
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
      console.log(`  ✅ Saved ${result.savedCO2Grams}g CO2 (${result.calculationMethod})`);
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
