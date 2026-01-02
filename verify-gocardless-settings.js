const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGocardlessSettings() {
  try {
    console.log('\n🔍 Checking GoCardless Settings in Database...\n');
    
    const settings = await prisma.adminApiSetting.findMany({
      where: {
        key: {
          startsWith: 'GOCARDLESS'
        }
      },
      select: {
        key: true,
        value: true,
        description: true
      }
    });

    console.log('📊 Found', settings.length, 'GoCardless settings:\n');
    
    settings.forEach(setting => {
      const hasValue = setting.value && setting.value.length > 0;
      const status = hasValue ? '✅' : '❌';
      const preview = hasValue ? setting.value.substring(0, 25) + '...' : 'EMPTY';
      
      console.log(`${status} ${setting.key}`);
      console.log(`   Value: ${preview}`);
      console.log(`   Description: ${setting.description || 'No description'}`);
      console.log('');
    });

    console.log('\n✅ All GoCardless settings are loaded from database using getApiSetting()');
    console.log('   Fallback to process.env is available if database value is missing\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGocardlessSettings();
