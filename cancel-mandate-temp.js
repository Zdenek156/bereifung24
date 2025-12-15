const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cancelMandate() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'bikeanzeigen@gmail.com' },
      include: { workshop: true }
    });

    if (!user || !user.workshop) {
      console.log('Workshop nicht gefunden');
      return;
    }
    
    const workshop = user.workshop;

    console.log('Workshop:', workshop.companyName);
    console.log('Mandat ID:', workshop.gocardlessMandateId);

    // Clear database first
    await prisma.workshop.update({
      where: { id: workshop.id },
      data: {
        gocardlessCustomerId: null,
        gocardlessMandateId: null,
        gocardlessMandateRef: null,
        gocardlessMandateStatus: null,
        gocardlessMandateCreatedAt: null,
        gocardlessBankAccountId: null,
        gocardlessSessionToken: null,
        gocardlessRedirectFlowId: null
      }
    });

    console.log('✅ SEPA mandate data cleared from database!');
    console.log('Note: Bitte gehe zu GoCardless Dashboard um das Mandat dort auch zu löschen.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cancelMandate();
