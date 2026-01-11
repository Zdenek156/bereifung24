const { PrismaClient } = require('@prisma/client');
const gocardless = require('gocardless-nodejs');
const constants = require('gocardless-nodejs/constants');

const prisma = new PrismaClient();

async function checkMandateStatus() {
  try {
    console.log('🔍 Checking GoCardless Mandate Status...\n');
    
    // Get ALL workshops with mandates
    const workshops = await prisma.workshop.findMany({
      where: { 
        gocardlessMandateId: { not: null }
      },
      select: {
        id: true,
        companyName: true,
        gocardlessMandateId: true,
        gocardlessMandateStatus: true,
        gocardlessCustomerId: true,
        gocardlessMandateRef: true,
        gocardlessMandateCreatedAt: true,
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        gocardlessMandateCreatedAt: 'desc'
      }
    });

    if (workshops.length === 0) {
      console.log('❌ No workshops with GoCardless mandates found');
      return;
    }

    console.log(`Found ${workshops.length} workshop(s) with mandates:\n`);
    
    workshops.forEach((w, i) => {
      console.log(`${i + 1}. ${w.companyName}`);
      console.log(`   Email: ${w.user.email}`);
      console.log(`   Mandate ID: ${w.gocardlessMandateId}`);
      console.log(`   Status: ${w.gocardlessMandateStatus}`);
      console.log(`   Reference: ${w.gocardlessMandateRef}`);
      console.log(`   Created: ${w.gocardlessMandateCreatedAt}`);
      console.log('');
    });

    const workshop = workshops[0]; // Check first one

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
