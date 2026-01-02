const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSepaStatus() {
  try {
    console.log('🔍 Checking SEPA mandate status...\n');
    
    // Find Test Reifen Werkstatt
    const workshop = await prisma.workshop.findFirst({
      where: { companyName: 'Test Reifen Werkstatt' },
      select: {
        id: true,
        companyName: true,
        gocardlessMandateId: true,
        gocardlessMandateRef: true,
        gocardlessMandateStatus: true,
        gocardlessCustomerId: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    if (!workshop) {
      console.log('❌ Workshop not found');
      return;
    }

    console.log('📊 Workshop SEPA Status:');
    console.log('   Company:', workshop.companyName);
    console.log('   Email:', workshop.user?.email);
    console.log('   Customer ID:', workshop.gocardlessCustomerId || 'NOT SET');
    console.log('   Mandate ID:', workshop.gocardlessMandateId || 'NOT SET');
    console.log('   Mandate Ref:', workshop.gocardlessMandateRef || 'NOT SET');
    console.log('   Mandate Status:', workshop.gocardlessMandateStatus || 'NOT SET');
    console.log('');

    // Check if there are any recent webhook logs
    const recentLogs = await prisma.$queryRaw`
      SELECT * FROM "Workshop" 
      WHERE "companyName" = 'Test Reifen Werkstatt'
      LIMIT 1
    `;
    
    console.log('📝 Raw workshop data:', JSON.stringify(recentLogs, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSepaStatus();
