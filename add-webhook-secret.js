const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addWebhookSecret() {
  try {
    console.log('🔧 Adding GOCARDLESS_WEBHOOK_SECRET to database...\n');
    
    // Get the webhook secret from .env
    const webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('❌ GOCARDLESS_WEBHOOK_SECRET not found in .env file');
      return;
    }

    console.log('✅ Found webhook secret in .env file');
    console.log('   Value:', webhookSecret);

    // Insert or update the webhook secret in database
    const result = await prisma.adminApiSetting.upsert({
      where: {
        key: 'GOCARDLESS_WEBHOOK_SECRET'
      },
      update: {
        value: webhookSecret
      },
      create: {
        key: 'GOCARDLESS_WEBHOOK_SECRET',
        value: webhookSecret,
        description: 'GoCardless Webhook Secret für Webhook-Signatur-Verifizierung'
      }
    });

    console.log('\n✅ Webhook secret added to database:');
    console.log('   Key:', result.key);
    console.log('   Description:', result.description);
    
    // Verify it was added
    const allSettings = await prisma.adminApiSetting.findMany({
      where: {
        key: {
          startsWith: 'GOCARDLESS'
        }
      },
      select: {
        key: true,
        description: true
      }
    });

    console.log('\n📊 All GoCardless Settings in Database:');
    allSettings.forEach(setting => {
      console.log(`   ✅ ${setting.key}`);
      console.log(`      ${setting.description || 'No description'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addWebhookSecret();
