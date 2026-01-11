// Manually update mandate status to active (for testing)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateMandate() {
  try {
    const workshop = await prisma.workshop.findFirst({
      where: { gocardlessMandateId: { not: null } },
      select: {
        id: true,
        companyName: true,
        gocardlessMandateId: true,
        gocardlessMandateStatus: true
      }
    });

    if (!workshop) {
      console.log('❌ No workshop with mandate found');
      return;
    }

    console.log(`\n🔄 Updating mandate status for: ${workshop.companyName}`);
    console.log(`   Current status: ${workshop.gocardlessMandateStatus}`);
    console.log(`   New status: active`);

    const updated = await prisma.workshop.update({
      where: { id: workshop.id },
      data: {
        gocardlessMandateStatus: 'active'
      }
    });

    console.log(`\n✅ Mandate status updated successfully!`);
    console.log(`   Mandate ID: ${updated.gocardlessMandateId}`);
    console.log(`   Status: ${updated.gocardlessMandateStatus}`);
    console.log(`\n💡 The workshop should now see "✓ Aktiv" in their SEPA mandate page.`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateMandate();
