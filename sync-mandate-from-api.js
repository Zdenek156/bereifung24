// Sync mandate status from GoCardless API
const { PrismaClient } = require('@prisma/client');
const gocardless = require('gocardless-nodejs');
const constants = require('gocardless-nodejs/constants');

const prisma = new PrismaClient();

async function syncMandateFromAPI() {
  try {
    console.log('\n🔄 SYNCING MANDATE FROM GOCARDLESS API\n');

    // Get workshop with mandate
    const workshop = await prisma.workshop.findFirst({
      where: { gocardlessMandateId: { not: null } },
      select: {
        id: true,
        companyName: true,
        gocardlessMandateId: true,
        gocardlessMandateStatus: true,
        user: { select: { email: true } }
      }
    });

    if (!workshop) {
      console.log('❌ No workshop with mandate found');
      return;
    }

    console.log('📍 Workshop:', workshop.companyName);
    console.log('   Email:', workshop.user.email);
    console.log('   Mandate ID:', workshop.gocardlessMandateId);
    console.log('   Current DB Status:', workshop.gocardlessMandateStatus);
    console.log('');

    // Get API settings
    const settings = await prisma.adminApiSetting.findMany({
      where: { key: { in: ['GOCARDLESS_ACCESS_TOKEN', 'GOCARDLESS_ENVIRONMENT'] } }
    });

    const accessToken = settings.find(s => s.key === 'GOCARDLESS_ACCESS_TOKEN')?.value;
    const environment = settings.find(s => s.key === 'GOCARDLESS_ENVIRONMENT')?.value;

    if (!accessToken) {
      console.log('❌ No GoCardless access token found');
      return;
    }

    console.log('🔗 Connecting to GoCardless API...');
    console.log('   Environment:', environment);
    console.log('');

    // Initialize client
    const env = environment === 'live' ? constants.Environments.Live : constants.Environments.Sandbox;
    const client = gocardless(accessToken, env);

    // Get mandate from API
    console.log('📡 Fetching mandate from GoCardless...');
    const mandate = await client.mandates.find(workshop.gocardlessMandateId);

    console.log('\n✅ GoCardless API Response:');
    console.log('   Status:', mandate.status);
    console.log('   Reference:', mandate.reference);
    console.log('   Created:', mandate.created_at);
    console.log('');

    // Compare and update status if needed
    if (mandate.status !== workshop.gocardlessMandateStatus) {
      console.log('⚠️  STATUS MISMATCH DETECTED:');
      console.log('   Database status:', workshop.gocardlessMandateStatus);
      console.log('   GoCardless status:', mandate.status);
      console.log('\n🔄 Updating database to match GoCardless...');

      await prisma.workshop.update({
        where: { id: workshop.id },
        data: {
          gocardlessMandateStatus: mandate.status,
          gocardlessMandateRef: mandate.reference || workshop.gocardlessMandateRef
        }
      });

      console.log('✅ DATABASE UPDATED!');
      console.log('   New status:', mandate.status);
      
      if (mandate.status === 'active') {
        console.log('\n🎉 Mandate is now ACTIVE!');
        console.log('   The workshop can now use SEPA direct debit.');
        console.log('   Automatic commission payments are enabled.');
      }
    } else {
      console.log('✅ Status matches:');
      console.log('   Both database and GoCardless show:', mandate.status);
    }

    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.body) {
      console.error('   API Response:', JSON.stringify(error.response.body, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

syncMandateFromAPI();
