const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setSepaActive() {
  try {
    console.log('\n🔧 Setting SEPA mandate to active...\n');
    
    const result = await prisma.workshop.updateMany({
      where: { companyName: 'Test Reifen Werkstatt' },
      data: { gocardlessMandateStatus: 'active' }
    });

    console.log('✅ Updated:', result.count, 'workshop(s)');

    const workshop = await prisma.workshop.findFirst({
      where: { companyName: 'Test Reifen Werkstatt' },
      select: {
        companyName: true,
        gocardlessMandateStatus: true
      }
    });

    console.log('\n📊 New Status:');
    console.log('   Company:', workshop.companyName);
    console.log('   Mandate Status:', workshop.gocardlessMandateStatus);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setSepaActive();
