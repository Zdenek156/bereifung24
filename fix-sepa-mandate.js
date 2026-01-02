const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSepaMandate() {
  try {
    console.log('🔧 Fixing SEPA mandate status...\n');
    
    // Update the workshop mandate status to active
    const result = await prisma.workshop.updateMany({
      where: {
        companyName: 'Test Reifen Werkstatt',
        gocardlessMandateId: 'MD01KCD3T4ACS0'
      },
      data: {
        gocardlessMandateStatus: 'active',
        gocardlessMandateRef: 'MD01KCD3T4ACS0' // Set mandate ref if not set
      }
    });

    if (result.count > 0) {
      console.log('✅ Mandate status updated to "active"');
      console.log(`   Updated ${result.count} workshop(s)`);
      
      // Verify the update
      const workshop = await prisma.workshop.findFirst({
        where: { companyName: 'Test Reifen Werkstatt' },
        select: {
          companyName: true,
          gocardlessMandateStatus: true,
          gocardlessMandateRef: true
        }
      });
      
      console.log('\n📊 Updated Workshop Status:');
      console.log('   Company:', workshop.companyName);
      console.log('   Mandate Status:', workshop.gocardlessMandateStatus);
      console.log('   Mandate Ref:', workshop.gocardlessMandateRef);
    } else {
      console.log('❌ No workshop found to update');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSepaMandate();
