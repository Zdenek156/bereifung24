const { PrismaClient } = require('@prisma/client');
const gocardless = require('gocardless-nodejs');
const constants = require('gocardless-nodejs/constants');

const prisma = new PrismaClient();

async function submitMandate() {
  try {
    console.log('🔧 Attempting to submit mandate to GoCardless...\n');
    
    // Get workshop
    const workshop = await prisma.workshop.findFirst({
      where: { companyName: 'Test Reifen Werkstatt' }
    });

    if (!workshop || !workshop.gocardlessMandateId) {
      console.log('❌ Workshop or mandate not found');
      return;
    }

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

    console.log('🔗 Connecting to GoCardless...');
    const env = environment === 'live' ? constants.Environments.Live : constants.Environments.Sandbox;
    const client = gocardless(accessToken, env);

    // Get current mandate
    console.log('📡 Fetching mandate:', workshop.gocardlessMandateId);
    const mandate = await client.mandates.find(workshop.gocardlessMandateId);
    
    console.log('\n📊 Current Mandate Status:');
    console.log('   ID:', mandate.id);
    console.log('   Status:', mandate.status);
    console.log('   Reference:', mandate.reference);
    console.log('');

    if (mandate.status === 'pending_submission') {
      console.log('💡 Mandate is "pending_submission".');
      console.log('   In LIVE mode, GoCardless needs 3-5 business days to verify the mandate.');
      console.log('   The webhook will automatically update the status to "active" once verified.');
      console.log('');
      console.log('📌 To speed up testing, you can:');
      console.log('   1. Use SANDBOX mode instead of LIVE mode');
      console.log('   2. Wait for GoCardless to verify (3-5 business days)');
      console.log('   3. Manually trigger a webhook test from GoCardless dashboard');
      console.log('');
      console.log('🔗 GoCardless Dashboard: https://manage.gocardless.com/mandates/' + mandate.id);
    } else {
      console.log('ℹ️  Mandate status is:', mandate.status);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.body) {
      console.error('   API Response:', JSON.stringify(error.response.body, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

submitMandate();
