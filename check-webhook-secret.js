const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWebhookSecret() {
  try {
    console.log('🔍 Checking for GOCARDLESS_WEBHOOK_SECRET in database...\n');
    
    // Find all GoCardless related settings
    const settings = await prisma.adminApiSetting.findMany({
      where: {
        key: {
          startsWith: 'GOCARDLESS'
        }
      },
      select: {
        key: true,
        value: true
      }
    });

    console.log('📊 GoCardless Settings in Database:');
    settings.forEach(setting => {
      console.log(`   ${setting.key}: ${setting.value ? '✅ SET' : '❌ EMPTY'}`);
    });

    // Check specifically for webhook secret
    const webhookSecret = settings.find(s => s.key === 'GOCARDLESS_WEBHOOK_SECRET');
    
    console.log('\n🔐 GOCARDLESS_WEBHOOK_SECRET:');
    if (webhookSecret) {
      console.log('   Status: ✅ EXISTS in database');
      console.log('   Value:', webhookSecret.value);
    } else {
      console.log('   Status: ❌ MISSING from database');
      console.log('   This is likely why webhooks are not working!');
    }

    // Check .env file value
    console.log('\n📄 Checking .env file...');
    console.log('   GOCARDLESS_WEBHOOK_SECRET from process.env:', process.env.GOCARDLESS_WEBHOOK_SECRET || '❌ NOT SET');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWebhookSecret();
