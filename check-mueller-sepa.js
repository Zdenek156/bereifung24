const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const workshop = await prisma.workshop.findFirst({
      where: { 
        OR: [
          { companyName: { contains: 'Müller', mode: 'insensitive' } },
          { companyName: { contains: 'Mueller', mode: 'insensitive' } }
        ]
      },
      include: { user: true }
    });
    
    if (!workshop) {
      console.log('❌ Müller Werkstatt nicht gefunden');
      console.log('\nAlle Werkstätten mit SEPA-Mandat:');
      const allWorkshops = await prisma.workshop.findMany({
        where: {
          gocardlessMandateId: { not: null }
        },
        include: { user: true },
        orderBy: { companyName: 'asc' }
      });
      
      allWorkshops.forEach(w => {
        console.log(`- ${w.companyName} (${w.user.email}) - Status: ${w.gocardlessMandateStatus}`);
      });
      return;
    }
    
    console.log('✅ === Müller Werkstatt gefunden ===');
    console.log('ID:', workshop.id);
    console.log('Firmenname:', workshop.companyName);
    console.log('Email:', workshop.user?.email);
    console.log('SEPA Mandat ID:', workshop.gocardlessMandateId);
    console.log('SEPA Status:', workshop.gocardlessMandateStatus);
    console.log('SEPA Mandat erstellt:', workshop.gocardlessMandateCreatedAt);
    console.log('Letztes Update:', workshop.updatedAt);
    
    // Prüfe Provisionen
    const commissions = await prisma.commission.findMany({
      where: { workshopId: workshop.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('\n=== Letzte 10 Provisionen ===');
    if (commissions.length === 0) {
      console.log('Keine Provisionen gefunden');
    } else {
      commissions.forEach(c => {
        console.log(`[${c.id}] ${c.status} - €${c.amount} - Erstellt: ${c.createdAt} - GoCardless: ${c.gocardlessPaymentId || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
