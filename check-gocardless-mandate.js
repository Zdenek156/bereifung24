const { PrismaClient } = require('@prisma/client');
const gocardless = require('gocardless-nodejs');
const constants = require('gocardless-nodejs/constants');
const prisma = new PrismaClient();

async function checkGoCardlessStatus() {
  try {
    const workshop = await prisma.workshop.findFirst({
      where: { 
        companyName: { contains: 'Müller', mode: 'insensitive' }
      }
    });
    
    if (!workshop || !workshop.gocardlessMandateId) {
      console.log('❌ Keine Müller Werkstatt mit Mandat gefunden');
      return;
    }
    
    console.log('=== Müller Reifenservice ===');
    console.log('Datenbank Status:', workshop.gocardlessMandateStatus);
    console.log('Mandate ID:', workshop.gocardlessMandateId);
    
    // GoCardless API Client
    const client = gocardless(
      process.env.GOCARDLESS_ACCESS_TOKEN,
      constants.Environments.Live
    );
    
    console.log('\n=== GoCardless API Status ===');
    const mandate = await client.mandates.find(workshop.gocardlessMandateId);
    console.log('GoCardless Status:', mandate.status);
    console.log('Erstellt am:', mandate.created_at);
    console.log('Nächste mögliche Abbuchung:', mandate.next_possible_charge_date);
    
    // Status-Vergleich
    if (mandate.status === 'active' && workshop.gocardlessMandateStatus !== 'active') {
      console.log('\n⚠️ INKONSISTENZ: GoCardless ist "active", aber DB zeigt:', workshop.gocardlessMandateStatus);
      console.log('Korrigiere Status...');
      
      await prisma.workshop.update({
        where: { id: workshop.id },
        data: { gocardlessMandateStatus: 'active' }
      });
      
      console.log('✅ Status wurde auf "active" aktualisiert');
    } else if (mandate.status === workshop.gocardlessMandateStatus) {
      console.log('\n✅ Status ist synchron: ' + mandate.status);
    } else {
      console.log('\n⚠️ Status-Unterschied:');
      console.log('  GoCardless:', mandate.status);
      console.log('  Datenbank:', workshop.gocardlessMandateStatus);
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.body || error.response);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkGoCardlessStatus();
