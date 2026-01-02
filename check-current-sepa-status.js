const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSepaStatus() {
  try {
    const workshop = await prisma.workshop.findFirst({
      where: { companyName: 'Test Reifen Werkstatt' },
      select: {
        companyName: true,
        gocardlessMandateStatus: true,
        gocardlessMandateRef: true,
        gocardlessMandateId: true
      }
    });

    console.log('\n📊 Current SEPA Status:\n');
    console.log('   Company:', workshop.companyName);
    console.log('   Mandate ID:', workshop.gocardlessMandateId);
    console.log('   Mandate Ref:', workshop.gocardlessMandateRef);
    console.log('   Mandate Status:', workshop.gocardlessMandateStatus);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSepaStatus();
