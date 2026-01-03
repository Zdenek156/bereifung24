const { PrismaClient } = require('@prisma/client');
const gocardless = require('gocardless-nodejs');
const constants = require('gocardless-nodejs/constants');

const prisma = new PrismaClient();

async function checkNewMandate() {
  try {
    console.log('🔍 Prüfe neues Mandate...\n');
    
    const settings = await prisma.adminApiSetting.findMany({
      where: {
        key: { in: ['GOCARDLESS_ACCESS_TOKEN', 'GOCARDLESS_ENVIRONMENT'] }
      }
    });

    const accessToken = settings.find(s => s.key === 'GOCARDLESS_ACCESS_TOKEN')?.value;
    const environment = settings.find(s => s.key === 'GOCARDLESS_ENVIRONMENT')?.value;

    const workshop = await prisma.workshop.findFirst({
      where: { user: { email: 'bikeanzeigen@gmail.com' } },
      include: { user: true }
    });

    console.log('📊 Lokale Datenbank:');
    console.log('   Workshop:', workshop.companyName);
    console.log('   Mandate ID:', workshop.gocardlessMandateId || '❌ Noch nicht gesetzt');
    console.log('   Status:', workshop.gocardlessMandateStatus || '❌ Noch nicht gesetzt');
    console.log('   Customer ID:', workshop.gocardlessCustomerId || '❌ Noch nicht gesetzt');

    if (workshop.gocardlessMandateId) {
      console.log('\n🔗 GoCardless API:');
      const env = environment === 'live' ? constants.Environments.Live : constants.Environments.Sandbox;
      const client = gocardless(accessToken, env);
      
      const mandate = await client.mandates.find(workshop.gocardlessMandateId);
      console.log('   ID:', mandate.id);
      console.log('   Status:', mandate.status);
      console.log('   Reference:', mandate.reference);
      console.log('   Erstellt:', mandate.created_at);
      
      if (mandate.status === 'pending_submission') {
        console.log('\n⏳ Status: Wartet auf Einreichung bei der Bank');
        console.log('   Normal: 1-2 Stunden bis "submitted"');
        console.log('   Dann: 3-5 Werktage bis "active"');
      } else if (mandate.status === 'submitted') {
        console.log('\n✅ Status: Bei Bank eingereicht!');
        console.log('   Wartet auf Bestätigung (3-5 Werktage)');
      } else if (mandate.status === 'active') {
        console.log('\n🎉 Status: AKTIV! Mandate ist einsatzbereit!');
      }
    } else {
      console.log('\n💡 Mandate wurde noch nicht in der Datenbank gespeichert.');
      console.log('   Das ist normal direkt nach der Erstellung.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkNewMandate();
