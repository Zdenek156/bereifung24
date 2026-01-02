const { PrismaClient } = require('@prisma/client');
const gocardless = require('gocardless-nodejs');
const constants = require('gocardless-nodejs/constants');

const prisma = new PrismaClient();

async function checkMandateStatus() {
  try {
    console.log('🔍 Checking GoCardless Mandate Status...\n');
    
    // Get workshop
    const workshop = await prisma.workshop.findFirst({
      where: { companyName: 'Test Reifen Werkstatt' },
      select: {
        id: true,
        companyName: true,
        gocardlessMandateId: true,
        gocardlessMandateStatus: true,
        gocardlessCustomerId: true
      }
    });

    if (!workshop) {
      console.log('❌ Workshop not found');
      return;
    }

    console.log('📊 Local Workshop Status:');
    console.log('   Mandate ID:', workshop.gocardlessMandateId);
    console.log('   Local Status:', workshop.gocardlessMandateStatus);
    console.log('');

    // Get API settings
    const settings = await prisma.adminApiSetting.findMany({
      where: {
        key: {
          in: ['GOCARDLESS_ACCESS_TOKEN', 'GOCARDLESS_ENVIRONMENT']
        }
      }
    });

    const accessToken = settings.find(s => s.key === 'GOCARDLESS_ACCESS_TOKEN')?.value;
    const environment = settings.find(s => s.key === 'GOCARDLESS_ENVIRONMENT')?.value;

    if (!accessToken) {
      console.log('❌ No access token found');
      return;
    }

    console.log('🔗 Connecting to GoCardless...');
    console.log('   Environment:', environment);
    console.log('');

    // Initialize GoCardless client
    const env = environment === 'live' ? constants.Environments.Live : constants.Environments.Sandbox;
    const client = gocardless(accessToken, env);

    // Get mandate status from GoCardless
    console.log('📡 Fetching mandate from GoCardless API...');
    const mandate = await client.mandates.find(workshop.gocardlessMandateId);

    console.log('\n✅ GoCardless Mandate Status:');
    console.log('   ID:', mandate.id);
    console.log('   Status:', mandate.status);
    console.log('   Reference:', mandate.reference);
    console.log('   Created:', mandate.created_at);
    console.log('');

    // Compare
    if (mandate.status === workshop.gocardlessMandateStatus) {
      console.log('✅ Status matches! Local and GoCardless are in sync.');
    } else {
      console.log('⚠️  STATUS MISMATCH!');
      console.log('   Local status:', workshop.gocardlessMandateStatus);
      console.log('   GoCardless status:', mandate.status);
      console.log('');
      console.log('💡 This means the webhook did not update the local status.');
      console.log('   Either the webhook was not received, or the signature verification failed.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.body) {
      console.error('   API Response:', error.response.body);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkMandateStatus();
